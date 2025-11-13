const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const Technician = require('../models/technicianModel');
const { sendVerificationEmail } = require('../utils/emailService');
const { logLogin, logFailedLogin, logLogout } = require('../middleware/auditLogger');
const BlacklistedToken = require('../models/blacklistedTokenModel');

// Modo de demonstração (sem banco de dados)
let demoUsers = [];
let demoCounter = 1;
const isDemo = process.env.DEMO_MODE === 'true';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

// @desc    Registrar um novo usuário
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, cpfCnpj, address, technician } = req.body;

  // Validação
  if (!name || !email || !password || !role || !phone || !cpfCnpj) {
    res.status(400);
    throw new Error('Por favor, preencha todos os campos obrigatórios');
  }

  // Fallback de modo demonstração
  if (isDemo) {
    // Verificar se o usuário já existe (modo demo)
    const userExistsDemo = demoUsers.find((u) => u.email === email);

    if (userExistsDemo) {
      res.status(400);
      throw new Error('Usuário já cadastrado');
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar usuário demo
    const demoId = `demo-${demoCounter++}`;
    const user = {
      _id: demoId,
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      cpfCnpj,
      address,
      emailVerified: false,
      adFreeUntil: null,
    };

    // Se for técnico, criar loginId e anexar ao usuário demo
    if (role === 'technician') {
      const loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')}`;
      user.loginId = loginId;
      user.services = technician?.services || [];
    }

    demoUsers.push(user);

    // Log de pseudo-registro (não envia e-mail em modo demo)
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cpfCnpj: user.cpfCnpj,
      address: user.address,
      emailVerified: user.emailVerified,
      adFreeUntil: user.adFreeUntil,
      isAdFree: false,
      ...(user.loginId ? { loginId: user.loginId } : {}),
      token: generateToken(user._id),
      message: 'Usuário registrado com sucesso! (modo demonstração)'
    });
    return;
  }

  try {
    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('Usuário já cadastrado');
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar usuário
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      cpfCnpj,
      address,
      bankInfo: req.body.bankInfo || undefined,
    });

    // Gerar token de verificação de e-mail
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Enviar e-mail de verificação
    const emailResult = await sendVerificationEmail(email, name, verificationToken);
    
    if (!emailResult.success) {
      console.error('Erro ao enviar e-mail de verificação:', emailResult.error);
      // Não falhar o registro se o e-mail não for enviado
    }

    // Se for um técnico, criar registro na coleção de técnicos
    if (role === 'technician') {
      // Gerar loginId único para o técnico
      const loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      // Mapear serviços recebidos do frontend para o schema do backend
      const mappedServices = Array.isArray(technician?.services)
        ? technician.services.map((s) => ({
            name: s.name,
            price: Number(s.initialPrice ?? s.price ?? 0) || 0,
            estimatedTime: s.estimatedTime,
            category: s.category,
            isActive: s.isActive !== undefined ? s.isActive : true,
          }))
        : [];

      // Preparar dados do técnico
      const technicianData = {
        userId: user._id,
        loginId,
        services: mappedServices,
        specialties: [],
        pickupService: !!technician?.pickupService,
        pickupFee: Number(technician?.pickupFee ?? 0) || 0,
        paymentMethods: Array.isArray(technician?.paymentMethods) ? technician.paymentMethods : [],
      };

      // Adicionar certificações se fornecidas
      if (technician?.certifications) {
        technicianData.specialties = technician.certifications
          .split(',')
          .map((cert) => cert.trim())
          .filter((cert) => cert);
      }

      await Technician.create(technicianData);
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        cpfCnpj: user.cpfCnpj,
        address: user.address,
        bankInfo: user.bankInfo || {},
        emailVerified: user.emailVerified,
        adFreeUntil: user.adFreeUntil || null,
        isAdFree: user.adFreeUntil ? new Date(user.adFreeUntil) > new Date() : false,
        token: generateToken(user._id),
        message: 'Usuário registrado com sucesso! Verifique seu e-mail para confirmar sua conta.',
      });
    } else {
      res.status(400);
      throw new Error('Dados de usuário inválidos');
    }
  } catch (error) {
    console.error('Erro ao registrar usuário:', error?.message || error);
    // Se um status já foi definido anteriormente (ex.: 400 Usuário já cadastrado),
    // preserve-o e apenas propague o erro original.
    if (!res.statusCode || res.statusCode === 200) {
      // Status não definido ou OK: tratar como erro interno
      res.status(500);
      throw new Error('Serviço temporariamente indisponível. Tente novamente mais tarde.');
    } else {
      // Status já definido (ex.: 400/401): apenas rethrow para o errorHandler responder corretamente
      throw error;
    }
  }
});

// @desc    Autenticar um usuário
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validação básica
  if (!email || !password) {
    res.status(400);
    throw new Error('Por favor, forneça email e senha');
  }

  // Fallback de modo demonstração
  if (isDemo) {
    const user = demoUsers.find((u) => u.email === email);

    if (!user) {
      logFailedLogin(email, req, 'Usuário não encontrado (modo demo)');
      res.status(401);
      throw new Error('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      logFailedLogin(email, req, 'Credenciais inválidas (modo demo)');
      res.status(401);
      throw new Error('Credenciais inválidas');
    }

    // Log de login bem-sucedido
    logLogin({ id: user._id, email: user.email, name: user.name }, req);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cpfCnpj: user.cpfCnpj,
      address: user.address,
      emailVerified: user.emailVerified,
      adFreeUntil: user.adFreeUntil || null,
      isAdFree: false,
      token: generateToken(user._id),
    });
  }

  try {
    // Verificar email do usuário
    const user = await User.findOne({ email });

    if (!user) {
      logFailedLogin(email, req, 'Usuário não encontrado');
      res.status(401);
      throw new Error('Credenciais inválidas');
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      logFailedLogin(email, req, 'Conta bloqueada temporariamente');
      res.status(423);
      throw new Error('Conta bloqueada temporariamente. Tente novamente mais tarde.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
      }
      await user.save();

      logFailedLogin(email, req, user.lockUntil ? 'Muitas tentativas, conta bloqueada' : 'Credenciais inválidas');
      res.status(401);
      throw new Error('Credenciais inválidas');
    }

    // Sucesso: resetar contador e atualizar último login
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Log de login bem-sucedido
    logLogin({ id: user._id, email: user.email, name: user.name }, req);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cpfCnpj: user.cpfCnpj,
      address: user.address,
      emailVerified: user.emailVerified,
      adFreeUntil: user.adFreeUntil || null,
      isAdFree: user.adFreeUntil ? new Date(user.adFreeUntil) > new Date() : false,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error?.message || error);
    if (!error.message.includes('Credenciais inválidas') && !error.message.includes('bloqueada')) {
      logFailedLogin(email, req, 'Erro interno do servidor');
    }
    // Preservar status previamente definido (ex.: 401/423) e propagar o erro
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
      throw new Error('Serviço temporariamente indisponível. Tente novamente mais tarde.');
    } else {
      throw error;
    }
  }
});

// @desc    Autenticar um técnico usando loginId
// @route   POST /api/users/technician-login
// @access  Public
const loginTechnician = asyncHandler(async (req, res) => {
  const { loginId, cpfCnpj, password } = req.body;

  // Validação básica
  if ((!loginId && !cpfCnpj) || !password) {
    res.status(400);
    throw new Error('Por favor, forneça CPF/CNPJ ou ID de login e a senha');
  }

  // Fallback de modo demonstração
  if (isDemo) {
    let user = null;
    if (loginId) {
      user = demoUsers.find((u) => u.loginId === loginId && u.role === 'technician');
    } else if (cpfCnpj) {
      user = demoUsers.find((u) => u.cpfCnpj === cpfCnpj && u.role === 'technician');
    }

    if (!user) {
      const who = loginId ? `LoginID: ${loginId}` : `CPF/CNPJ: ${cpfCnpj}`;
      logFailedLogin(who, req, 'Identificador não encontrado (modo demo)');
      res.status(401);
      throw new Error('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      const who = loginId ? `${user.email} (LoginID: ${loginId})` : `${user.email} (CPF/CNPJ: ${cpfCnpj})`;
      logFailedLogin(who, req, 'Senha incorreta (modo demo)');
      res.status(401);
      throw new Error('Credenciais inválidas');
    }

    // Sucesso: log de login
    logLogin({ id: user._id, email: user.email, name: user.name, loginId: user.loginId, cpfCnpj: user.cpfCnpj }, req);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cpfCnpj: user.cpfCnpj,
      address: user.address,
      emailVerified: user.emailVerified,
      loginId: user.loginId,
      adFreeUntil: user.adFreeUntil || null,
      isAdFree: false,
      token: generateToken(user._id),
    });
  }

  try {
    let user = null;
    let technician = null;

    if (loginId) {
      // Buscar técnico pelo loginId
      technician = await Technician.findOne({ loginId }).populate('userId');
      if (!technician || !technician.userId) {
        logFailedLogin(`LoginID: ${loginId}`, req, 'ID de login não encontrado');
        res.status(401);
        throw new Error('Credenciais inválidas');
      }
      user = technician.userId;
    } else if (cpfCnpj) {
      // Buscar usuário por CPF/CNPJ e garantir que seja técnico
      user = await User.findOne({ cpfCnpj });
      if (!user || user.role !== 'technician') {
        logFailedLogin(`CPF/CNPJ: ${cpfCnpj}`, req, !user ? 'Usuário não encontrado' : 'Usuário não é técnico');
        res.status(401);
        throw new Error('Credenciais inválidas');
      }
      technician = await Technician.findOne({ userId: user._id });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const who = loginId ? `${user.email} (LoginID: ${loginId})` : `${user.email} (CPF/CNPJ: ${cpfCnpj})`;
      logFailedLogin(who, req, 'Conta bloqueada temporariamente');
      res.status(423);
      throw new Error('Conta bloqueada temporariamente. Tente novamente mais tarde.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
      }
      await user.save();

      const who = loginId ? `${user.email} (LoginID: ${loginId})` : `${user.email} (CPF/CNPJ: ${cpfCnpj})`;
      logFailedLogin(who, req, user.lockUntil ? 'Muitas tentativas, conta bloqueada' : 'Senha incorreta');
      res.status(401);
      throw new Error('Credenciais inválidas');
    }

    // Sucesso: resetar contador e atualizar último login
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    logLogin({ id: user._id, email: user.email, name: user.name, loginId: technician?.loginId, cpfCnpj: user.cpfCnpj }, req);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cpfCnpj: user.cpfCnpj,
      address: user.address,
      emailVerified: user.emailVerified,
      loginId: technician?.loginId || null,
      adFreeUntil: user.adFreeUntil || null,
      isAdFree: user.adFreeUntil ? new Date(user.adFreeUntil) > new Date() : false,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Erro ao fazer login do técnico:', error?.message || error);
    if (!error.message.includes('Credenciais inválidas') && !error.message.includes('bloqueada')) {
      const who = loginId ? `LoginID: ${loginId}` : `CPF/CNPJ: ${cpfCnpj}`;
      logFailedLogin(who, req, 'Erro interno do servidor');
    }
    // Preservar status previamente definido (ex.: 401/423) e propagar o erro
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
      throw new Error('Serviço temporariamente indisponível. Tente novamente mais tarde.');
    } else {
      throw error;
    }
  }
});

// @desc    Promover usuário autenticado para técnico
// @route   POST /api/users/upgrade-to-technician
// @access  Private
const upgradeToTechnician = asyncHandler(async (req, res) => {
  if (isDemo) {
    res.status(400);
    throw new Error('Operação indisponível em modo demonstração');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }

  if (user.role === 'technician') {
    // Já é técnico: retornar dados atuais incluindo possível loginId
    const existingTech = await Technician.findOne({ userId: user._id });
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cpfCnpj: user.cpfCnpj,
      address: user.address,
      bankInfo: user.bankInfo || {},
      loginId: existingTech?.loginId || null,
      adFreeUntil: user.adFreeUntil || null,
      isAdFree: user.adFreeUntil ? new Date(user.adFreeUntil) > new Date() : false,
      token: generateToken(user._id),
    });
  }

  // Criar registro de técnico se não existir
  let technician = await Technician.findOne({ userId: user._id });
  if (!technician) {
    const loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Mapear serviços vindos do frontend (podem usar initialPrice)
    const incomingServices = Array.isArray(req.body.technician?.services)
      ? req.body.technician.services
      : [];
    const mappedServices = incomingServices.map((s) => ({
      name: s.name || s.title || 'Serviço',
      description: s.description || s.details || '',
      category: s.category || s.type || undefined,
      price: Number(
        s.initialPrice !== undefined && s.initialPrice !== null
          ? s.initialPrice
          : s.price
      ) || 0,
      estimatedTime: s.estimatedTime || s.time || undefined,
      isActive: s.isActive !== undefined ? s.isActive : true,
    }));

    const pickupService = !!req.body.technician?.pickupService;
    const pickupFee = Number(req.body.technician?.pickupFee ?? 0) || 0;
    const paymentMethods = Array.isArray(req.body.technician?.paymentMethods)
      ? req.body.technician.paymentMethods
      : [];

    const tData = {
      userId: user._id,
      loginId,
      services: mappedServices,
      specialties: [],
      pickupService,
      pickupFee,
      paymentMethods,
    };

    if (req.body.technician?.certifications) {
      tData.specialties = req.body.technician.certifications
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    }

    technician = await Technician.create(tData);
  }

  // Atualizar role para technician
  user.role = 'technician';
  await user.save();

  return res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    cpfCnpj: user.cpfCnpj,
    address: user.address,
    bankInfo: user.bankInfo || {},
    loginId: technician.loginId,
    adFreeUntil: user.adFreeUntil || null,
    isAdFree: user.adFreeUntil ? new Date(user.adFreeUntil) > new Date() : false,
    token: generateToken(user._id),
  });
});

// @desc    Obter dados do usuário atual
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  try {
  const user = await User.findById(req.user._id).select('-password');
    
    // Se for um técnico, obter dados adicionais
    if (user.role === 'technician') {
      const technician = await Technician.findOne({ userId: user._id });
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        cpfCnpj: user.cpfCnpj,
        address: user.address,
        bankInfo: user.bankInfo || {},
        services: technician?.services || [],
        specialties: technician?.specialties || [],
        pickupService: technician?.pickupService || false,
        pickupFee: technician?.pickupFee || 0,
        paymentMethods: technician?.paymentMethods || [],
        adFreeUntil: user.adFreeUntil || null,
        isAdFree: user.adFreeUntil ? new Date(user.adFreeUntil) > new Date() : false,
      });
    } else {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        cpfCnpj: user.cpfCnpj,
        address: user.address,
        bankInfo: user.bankInfo || {},
        adFreeUntil: user.adFreeUntil || null,
        isAdFree: user.adFreeUntil ? new Date(user.adFreeUntil) > new Date() : false,
      });
    }
  } catch (error) {
    // Modo de demonstração (sem banco de dados)
    console.log('Usando modo de demonstração para getMe'.yellow);
    
    // Encontrar usuário demo pelo ID
    const demoUser = demoUsers.find(u => u._id === req.user._id);
    
    if (demoUser) {
      if (demoUser.role === 'technician') {
        res.status(200).json({
          _id: demoUser._id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
          phone: demoUser.phone,
          cpfCnpj: demoUser.cpfCnpj,
          address: demoUser.address,
          services: demoUser.services || [],
          specialties: [],
          pickupService: false,
          pickupFee: 0,
          paymentMethods: [],
          adFreeUntil: demoUser.adFreeUntil || null,
          isAdFree: false,
        });
      } else {
        res.status(200).json({
          _id: demoUser._id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
          phone: demoUser.phone,
          cpfCnpj: demoUser.cpfCnpj,
          address: demoUser.address,
          adFreeUntil: demoUser.adFreeUntil || null,
          isAdFree: false,
        });
      }
    } else {
      res.status(404);
      throw new Error('Usuário não encontrado (modo demo)');
    }
  }
});

// Gerar JWT
const generateToken = (id) => {
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign({ id, jti }, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });
};

// @desc    Atualizar perfil do usuário
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.cpfCnpj = req.body.cpfCnpj || user.cpfCnpj;
      user.address = req.body.address || user.address;
      // Atualizar informações bancárias quando fornecidas
      if (req.body.bankInfo && typeof req.body.bankInfo === 'object') {
        user.bankInfo = {
          bank: req.body.bankInfo.bank || user.bankInfo?.bank,
          agency: req.body.bankInfo.agency || user.bankInfo?.agency,
          account: req.body.bankInfo.account || user.bankInfo?.account,
          pixKey: req.body.bankInfo.pixKey || user.bankInfo?.pixKey,
        };
      }
      if (typeof req.body.profileImage === 'string') {
        user.profileImage = req.body.profileImage;
      }

      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.passwordChangedAt = new Date();
      }

      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        cpfCnpj: updatedUser.cpfCnpj,
        address: updatedUser.address,
        bankInfo: updatedUser.bankInfo || {},
        profileImage: updatedUser.profileImage,
        adFreeUntil: updatedUser.adFreeUntil || null,
        isAdFree: updatedUser.adFreeUntil ? new Date(updatedUser.adFreeUntil) > new Date() : false,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('Usuário não encontrado');
    }
  } catch (error) {
    // Modo de demonstração (sem banco de dados)
    console.log('Usando modo de demonstração para updateUserProfile'.yellow);
    
    // Encontrar usuário demo pelo ID
    const demoUserIndex = demoUsers.findIndex(u => u._id === req.user._id);
    
    if (demoUserIndex !== -1) {
      // Atualizar usuário demo
      demoUsers[demoUserIndex] = {
        ...demoUsers[demoUserIndex],
        name: req.body.name || demoUsers[demoUserIndex].name,
        email: req.body.email || demoUsers[demoUserIndex].email,
        phone: req.body.phone || demoUsers[demoUserIndex].phone,
        cpfCnpj: req.body.cpfCnpj || demoUsers[demoUserIndex].cpfCnpj,
        address: req.body.address || demoUsers[demoUserIndex].address,
        profileImage: typeof req.body.profileImage === 'string' ? req.body.profileImage : demoUsers[demoUserIndex].profileImage,
        bankInfo: req.body.bankInfo ? {
          bank: req.body.bankInfo.bank || demoUsers[demoUserIndex].bankInfo?.bank,
          agency: req.body.bankInfo.agency || demoUsers[demoUserIndex].bankInfo?.agency,
          account: req.body.bankInfo.account || demoUsers[demoUserIndex].bankInfo?.account,
          pixKey: req.body.bankInfo.pixKey || demoUsers[demoUserIndex].bankInfo?.pixKey,
        } : demoUsers[demoUserIndex].bankInfo,
      };
      
      const updatedUser = demoUsers[demoUserIndex];
      
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        cpfCnpj: updatedUser.cpfCnpj,
        address: updatedUser.address,
        bankInfo: updatedUser.bankInfo || {},
        profileImage: updatedUser.profileImage,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('Usuário não encontrado (modo demo)');
    }
  }
});

// @desc    Verificar e-mail
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { token } = req.params;
    
    // Hash do token recebido para comparar com o armazenado
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Buscar usuário com o token válido e não expirado
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });
    
    if (!user) {
      res.status(400);
      throw new Error('Token de verificação inválido ou expirado');
    }
    
    // Marcar e-mail como verificado
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    res.status(200).json({
      message: 'E-mail verificado com sucesso!',
      emailVerified: true,
    });
  } catch (error) {
    console.error('Erro ao verificar e-mail:', error);
    res.status(500);
    throw new Error('Erro interno do servidor');
  }
});

// @desc    Reenviar e-mail de verificação
// @route   POST /api/users/resend-verification
// @access  Private
const resendVerificationEmail = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      res.status(404);
      throw new Error('Usuário não encontrado');
    }
    
    if (user.emailVerified) {
      res.status(400);
      throw new Error('E-mail já foi verificado');
    }
    
    // Gerar novo token de verificação
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // Enviar e-mail de verificação
    const emailResult = await sendVerificationEmail(user.email, user.name, verificationToken);
    
    if (!emailResult.success) {
      res.status(500);
      throw new Error('Erro ao enviar e-mail de verificação');
    }
    
    res.status(200).json({
      message: 'E-mail de verificação reenviado com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao reenviar e-mail de verificação:', error);
    res.status(500);
    throw new Error('Erro interno do servidor');
  }
});

// @desc    Recuperar senha
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('Usuário não encontrado');
    }

    // Em um sistema real, enviaríamos um email com um link para redefinir a senha
    // Para este projeto, apenas retornamos uma mensagem de sucesso
    res.status(200).json({ message: 'Instruções para redefinir a senha foram enviadas para o seu email' });
  } catch (error) {
    // Modo de demonstração (sem banco de dados)
    console.log('Usando modo de demonstração para forgotPassword'.yellow);
    
    // Verificar se o usuário existe no modo demo
    const demoUser = demoUsers.find(u => u.email === email);
    
    if (demoUser) {
      res.status(200).json({ message: 'Instruções para redefinir a senha foram enviadas para o seu email (modo demo)' });
    } else {
      res.status(404);
      throw new Error('Usuário não encontrado (modo demo)');
    }
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null;
    if (!token) {
      return res.status(200).json({ message: 'Logout efetuado' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(200).json({ message: 'Logout efetuado' });
    }
    const expiresAt = new Date(decoded.exp * 1000);
    const jti = decoded.jti || crypto.createHash('sha256').update(token).digest('hex');
    await BlacklistedToken.create({ jti, user: decoded.id, expiresAt, reason: 'logout' });
    if (req.user) {
      logLogout({ id: req.user._id, email: req.user.email }, req);
    }
    return res.status(200).json({ message: 'Logout efetuado com sucesso' });
  } catch (e) {
    return res.status(200).json({ message: 'Logout efetuado' });
  }
});

module.exports = {
  registerUser,
  loginUser,
  loginTechnician,
  upgradeToTechnician,
  getMe,
  updateUserProfile,
  forgotPassword,
  verifyEmail,
  resendVerificationEmail,
  logoutUser,
};