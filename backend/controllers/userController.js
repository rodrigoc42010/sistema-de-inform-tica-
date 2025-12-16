const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const GeocodingService = require('../services/geocodingService');
const { sendVerificationEmail } = require('../utils/emailService');
const {
  logLogin,
  logFailedLogin,
  logLogout,
} = require('../middleware/auditLogger');
const { getPool } = require('../db/pgClient');
const {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokenUtils');
// CORREÇÃO CRÍTICA: Validadores centralizados (fonte única de verdade)
const { isValidPhoneBR, isValidCpfOrCnpj } = require('../utils/validators');
// CORREÇÃO CRÍTICA: Token service centralizado (elimina 3 funções duplicadas)
const { generateToken } = require('../utils/tokenService');
// CORREÇÃO ALTA: User Repository (centraliza queries SQL de usuário)
const userRepository = require('../repositories/userRepository');
const {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  LockedError,
} = require('../utils/httpErrors');
const userService = require('../services/userService');

// Modo de demonstração (sem banco de dados)
let demoUsers = [];
let demoCounter = 1;
const isDemo =
  process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

// @desc    Registrar um novo usuário
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    cpfCnpj,
    address,
    technician,
    termsAccepted,
  } = req.body;
  const normalizeRole = (r, techObj) => {
    if (techObj) return 'technician';
    const s = String(r || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (
      [
        'technician',
        'tecnico',
        'tecnico(a)',
        'tecnic',
        'tech',
        'tecnicx',
        'tecnico profissional',
      ].includes(s)
    )
      return 'technician';
    if (['client', 'cliente', 'user', 'usuario'].includes(s)) return 'client';
    return 'client';
  };
  const roleNormalized = normalizeRole(role, technician);

  // CORREÇÃO CRÍTICA: Validações agora importadas de utils/validators.js (fonte única de verdade)
  // Removidas 48 linhas de código duplicado

  if (!name || !email || !password || !phone || !cpfCnpj) {
    throw new BadRequestError(
      'Por favor, preencha todos os campos obrigatórios'
    );
  }

  if (termsAccepted !== true) {
    throw new BadRequestError(
      'É necessário aceitar os Termos de Uso e a Política de Privacidade'
    );
  }

  if (!isValidPhoneBR(phone)) {
    throw new BadRequestError('Telefone inválido');
  }
  if (!isValidCpfOrCnpj(cpfCnpj)) {
    throw new BadRequestError('CPF/CNPJ inválido');
  }

  // Fallback de modo demonstração
  if (isDemo) {
    // Verificar se o usuário já existe (modo demo)
    const userExistsDemo = demoUsers.find((u) => u.email === email);

    if (userExistsDemo) {
      throw new BadRequestError('Usuário já cadastrado');
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
      role: roleNormalized,
      phone,
      cpfCnpj,
      address,
      emailVerified: false,
      adFreeUntil: null,
    };

    // Se for técnico, criar loginId e anexar ao usuário demo
    if (roleNormalized === 'technician') {
      const loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')}`;
      user.loginId = loginId;
      user.services = technician?.services || [];
    }

    demoUsers.push(user);

    // Log de pseudo-registro (não envia e-mail em modo demo)
    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60 * 1000,
    });
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
      token,
      message: 'Usuário registrado com sucesso! (modo demonstração)',
    });
    return;
  }

  try {
    const hasDb = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
    const hasJwt = !!process.env.JWT_SECRET;

    console.log(
      `[Register] Starting registration for ${email}. DB: ${hasDb}, Demo: ${isDemo}`
        .cyan
    );

    if (!hasDb) {
      throw new InternalServerError(
        'Configuração ausente: DATABASE_URL/POSTGRES_URL'
      );
    }
    if (!hasJwt) {
      throw new InternalServerError('Configuração ausente: JWT_SECRET');
    }

    const result = await userService.registerUser(req.body, {
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      ua: req.headers['user-agent'] || '',
    });

    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 min
    });

    return res.status(201).json({
      _id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      phone: result.user.phone,
      cpfCnpj: result.user.cpf_cnpj,
      address: result.user.address || {},
      bankInfo: result.user.bank_info || {},
      emailVerified: result.user.email_verified,
      adFreeUntil: result.user.ad_free_until || null,
      isAdFree: result.user.ad_free_until
        ? new Date(result.user.ad_free_until) > new Date()
        : false,
      ...(result.loginId ? { loginId: result.loginId } : {}),
      token: result.accessToken,
      refreshToken: result.refreshToken,
      message:
        'Usuário registrado com sucesso! Verifique seu e-mail para confirmar sua conta.',
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error?.message || error);
    if (!res.statusCode || res.statusCode === 200) {
      throw new InternalServerError(
        'Serviço temporariamente indisponível. Tente novamente mais tarde.'
      );
    } else {
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
    throw new BadRequestError('Por favor, forneça email e senha');
  }

  // Fallback de modo demonstração
  if (isDemo) {
    const user = demoUsers.find((u) => u.email === email);

    if (!user) {
      logFailedLogin(email, req, 'Usuário não encontrado (modo demo)');
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      logFailedLogin(email, req, 'Credenciais inválidas (modo demo)');
      throw new UnauthorizedError('Credenciais inválidas');
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
    const result = await userService.authenticateUser(email, password, {
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
      ua: req.headers['user-agent'] || '',
    });

    logLogin(
      { id: result.user.id, email: result.user.email, name: result.user.name },
      req
    );

    return res.json({
      _id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      phone: result.user.phone,
      cpfCnpj: result.user.cpf_cnpj,
      address: result.user.address || {},
      emailVerified: result.user.email_verified,
      adFreeUntil: result.user.ad_free_until || null,
      isAdFree: result.user.ad_free_until
        ? new Date(result.user.ad_free_until) > new Date()
        : false,
      token: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error?.message || error);
    if (
      !error.message.includes('Credenciais inválidas') &&
      !error.message.includes('bloqueada')
    ) {
      logFailedLogin(email, req, 'Erro interno do servidor');
    }
    // Preservar status previamente definido (ex.: 401/423) e propagar o erro
    if (!res.statusCode || res.statusCode === 200) {
      throw new InternalServerError(
        'Serviço temporariamente indisponível. Tente novamente mais tarde.'
      );
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
    throw new BadRequestError(
      'Por favor, forneça CPF/CNPJ ou ID de login e a senha'
    );
  }

  // Fallback de modo demonstração
  if (isDemo) {
    let user = null;
    if (loginId) {
      user = demoUsers.find(
        (u) => u.loginId === loginId && u.role === 'technician'
      );
    } else if (cpfCnpj) {
      user = demoUsers.find(
        (u) => u.cpfCnpj === cpfCnpj && u.role === 'technician'
      );
    }

    if (!user) {
      const who = loginId ? `LoginID: ${loginId}` : `CPF/CNPJ: ${cpfCnpj}`;
      logFailedLogin(who, req, 'Identificador não encontrado (modo demo)');
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      const who = loginId
        ? `${user.email} (LoginID: ${loginId})`
        : `${user.email} (CPF/CNPJ: ${cpfCnpj})`;
      logFailedLogin(who, req, 'Senha incorreta (modo demo)');
      throw new UnauthorizedError('Senha incorreta');
    }

    // Log de login bem-sucedido (modo demo)
    logLogin(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        loginId: user.loginId,
      },
      req
    );

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cpfCnpj: user.cpfCnpj,
      address: user.address,
      emailVerified: user.emailVerified,
      loginId: user.loginId || null,
      adFreeUntil: user.adFreeUntil || null,
      isAdFree: false,
      token: generateToken(user._id),
    });
  }

  // Modo produção (PostgreSQL)
  try {
    const result = await userService.authenticateTechnician(
      loginId,
      cpfCnpj,
      password,
      {
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
        ua: req.headers['user-agent'] || '',
      }
    );

    logLogin(
      {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        loginId: result.technician?.loginId,
        cpfCnpj: result.user.cpf_cnpj,
      },
      req
    );

    return res.json({
      _id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      phone: result.user.phone,
      cpfCnpj: result.user.cpf_cnpj,
      address: result.user.address || {},
      emailVerified: result.user.email_verified,
      loginId: result.technician?.loginId || null,
      adFreeUntil: result.user.ad_free_until || null,
      isAdFree: result.user.ad_free_until
        ? new Date(result.user.ad_free_until) > new Date()
        : false,
      token: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error('Erro ao fazer login do técnico:', error?.message || error);
    if (
      !error.message.includes('Credenciais inválidas') &&
      !error.message.includes('bloqueada')
    ) {
      const who = loginId ? `LoginID: ${loginId}` : `CPF/CNPJ: ${cpfCnpj}`;
      logFailedLogin(who, req, 'Erro interno do servidor');
    }
    // Preservar status previamente definido (ex.: 401/423) e propagar o erro
    if (!res.statusCode || res.statusCode === 200) {
      throw new InternalServerError(
        'Serviço temporariamente indisponível. Tente novamente mais tarde.'
      );
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
    throw new BadRequestError('Operação indisponível em modo demonstração');
  }

  // CORREÇÃO DE SEGURANÇA: Bloquear upgrade automático sem aprovação
  throw new ForbiddenError('Auto-upgrade para técnico está desabilitado.');

  const pool = getPool();
  // Usar userRepository para buscar usuário
  const user = await userRepository.findById(req.userId);

  if (!user) {
    throw new NotFoundError('Usuário não encontrado');
  }
  if (user.role === 'technician') {
    const rsTechExisting = await pool.query(
      'SELECT login_id FROM technicians WHERE user_id=$1 LIMIT 1',
      [user.id]
    );
    return res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cpfCnpj: user.cpf_cnpj,
      address: user.address || {},
      bankInfo: user.bank_info || {},
      loginId: rsTechExisting.rowCount ? rsTechExisting.rows[0].login_id : null,
      adFreeUntil: user.ad_free_until || null,
      isAdFree: user.ad_free_until
        ? new Date(user.ad_free_until) > new Date()
        : false,
      token: generateToken(user.id),
    });
  }

  const { services, specialties, pickupService, pickupFee, paymentMethods } =
    req.body;

  if (!services || !Array.isArray(services) || services.length === 0) {
    throw new BadRequestError('Pelo menos um serviço deve ser oferecido');
  }

  const loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE users SET role=$1 WHERE id=$2', [
      'technician',
      user.id,
    ]);

    const mappedServices = services.map((s) => ({
      name: s.name || s.title || 'Serviço',
      price: Number(s.initialPrice ?? s.price ?? 0) || 0,
      estimatedTime: s.estimatedTime,
      category: s.category,
      isActive: s.isActive !== undefined ? s.isActive : true,
    }));

    // Geocoding
    let lat = null;
    let lng = null;
    if (user.address) {
      try {
        const coords = await GeocodingService.getCoordinates(user.address);
        if (coords) {
          lat = coords.latitude;
          lng = coords.longitude;
        }
      } catch (e) {
        console.error('Geocoding failed during upgrade:', e.message);
      }
    }

    await client.query(
      'INSERT INTO technicians (user_id,login_id,services,specialties,pickup_service,pickup_fee,payment_methods,latitude,longitude) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [
        user.id,
        loginId,
        JSON.stringify(mappedServices),
        JSON.stringify(specialties || []),
        !!pickupService,
        Number(pickupFee || 0),
        JSON.stringify(paymentMethods || []),
        lat,
        lng,
      ]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: 'technician',
      phone: user.phone,
      cpfCnpj: user.cpf_cnpj,
      address: user.address || {},
      bankInfo: user.bank_info || {},
      loginId,
      adFreeUntil: user.ad_free_until || null,
      isAdFree: user.ad_free_until
        ? new Date(user.ad_free_until) > new Date()
        : false,
      token: generateToken(user.id),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao promover usuário a técnico:', error);
    throw new InternalServerError('Erro ao promover usuário');
  } finally {
    client.release();
  }
});

// @desc    Obter perfil do usuário atual
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // Modo de demonstração (sem banco de dados)
  if (isDemo) {
    const user = demoUsers.find((u) => u._id === req.user._id);
    if (user) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        cpfCnpj: user.cpfCnpj,
        address: user.address,
        bankInfo: user.bankInfo || {},
        profileImage: user.profileImage,
        emailVerified: user.emailVerified,
        adFreeUntil: user.adFreeUntil,
        isAdFree: false,
        ...(user.loginId ? { loginId: user.loginId } : {}),
      });
    }
  }

  const pool = getPool();
  // Usar userRepository para buscar usuário
  const user = await userRepository.findById(req.userId);

  if (user) {
    let loginId = null;
    if (user.role === 'technician') {
      const rsTech = await pool.query(
        'SELECT login_id FROM technicians WHERE user_id=$1 LIMIT 1',
        [user.id]
      );
      if (rsTech.rowCount) {
        loginId = rsTech.rows[0].login_id;
      }
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cpfCnpj: user.cpf_cnpj,
      address: user.address || {},
      bankInfo: user.bank_info || {},
      profileImage: user.profile_image,
      emailVerified: user.email_verified,
      adFreeUntil: user.ad_free_until || null,
      isAdFree: user.ad_free_until
        ? new Date(user.ad_free_until) > new Date()
        : false,
      ...(loginId ? { loginId } : {}),
    });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

// @desc    Atualizar perfil do usuário
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const pool = getPool();
    // Usar userRepository para buscar usuário
    const user = await userRepository.findById(req.userId);

    if (user) {
      // Atualizar campos básicos
      const updatedFields = {
        name: req.body.name || user.name,
        email: req.body.email || user.email,
        phone: req.body.phone || user.phone,
        cpf_cnpj: req.body.cpfCnpj || user.cpf_cnpj,
        address: req.body.address
          ? JSON.stringify(req.body.address)
          : JSON.stringify(user.address),
        bank_info: req.body.bankInfo
          ? JSON.stringify(req.body.bankInfo)
          : JSON.stringify(user.bank_info),
        profile_image: req.body.profileImage || user.profile_image,
      };

      // Se a senha foi fornecida, atualizar
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        updatedFields.password = await bcrypt.hash(req.body.password, salt);
      }

      // Construir query de update dinamicamente
      const keys = Object.keys(updatedFields);
      const values = Object.values(updatedFields);
      const setClause = keys
        .map((key, index) => `${key}=$${index + 1}`)
        .join(', ');

      await pool.query(
        `UPDATE users SET ${setClause} WHERE id=$${keys.length + 1}`,
        [...values, user.id]
      );

      // Se for técnico, atualizar dados específicos
      if (user.role === 'technician') {
        // Atualizar coordenadas se mudou o endereço
        if (req.body.address) {
          try {
            const coords = await GeocodingService.getCoordinates(
              req.body.address
            );
            if (coords) {
              await pool.query(
                'UPDATE technicians SET latitude=$1, longitude=$2, address_street=$3, address_number=$4, address_city=$5, address_state=$6, address_zipcode=$7 WHERE user_id=$8',
                [
                  coords.latitude,
                  coords.longitude,
                  req.body.address.street,
                  req.body.address.number,
                  req.body.address.city,
                  req.body.address.state,
                  req.body.address.zipcode,
                  user.id,
                ]
              );
              console.log(
                `Coordenadas atualizadas para técnico ${user.id}: ${coords.latitude}, ${coords.longitude}`
              );
            }
          } catch (geoError) {
            console.error(
              'Erro ao atualizar coordenadas no perfil:',
              geoError.message
            );
          }
        }

        // Atualizar chave PIX se fornecida
        if (req.body.bankInfo?.pixKey !== undefined) {
          try {
            await pool.query(
              'UPDATE technicians SET pix_key=$1 WHERE user_id=$2',
              [req.body.bankInfo.pixKey || null, user.id]
            );
            console.log(`Chave PIX atualizada para técnico ${user.id}`);
          } catch (pixError) {
            console.error('Erro ao atualizar chave PIX:', pixError.message);
          }
        }
      }
      const rsUpdated = await pool.query('SELECT * FROM users WHERE id=$1', [
        user.id,
      ]);
      const updatedUser = rsUpdated.rows[0];
      return res.status(200).json({
        _id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        cpfCnpj: updatedUser.cpf_cnpj,
        address: updatedUser.address || {},
        bankInfo: updatedUser.bank_info || {},
        profileImage: updatedUser.profile_image,
        adFreeUntil: updatedUser.ad_free_until || null,
        isAdFree: updatedUser.ad_free_until
          ? new Date(updatedUser.ad_free_until) > new Date()
          : false,
        token: generateToken(updatedUser.id),
      });
    }
  } catch (error) {
    // Modo de demonstração (sem banco de dados)
    console.log('Usando modo de demonstração para updateUserProfile'.yellow);

    // Encontrar usuário demo pelo ID
    const demoUserIndex = demoUsers.findIndex((u) => u._id === req.user._id);

    if (demoUserIndex !== -1) {
      // Atualizar usuário demo
      demoUsers[demoUserIndex] = {
        ...demoUsers[demoUserIndex],
        name: req.body.name || demoUsers[demoUserIndex].name,
        email: req.body.email || demoUsers[demoUserIndex].email,
        phone: req.body.phone || demoUsers[demoUserIndex].phone,
        cpfCnpj: req.body.cpfCnpj || demoUsers[demoUserIndex].cpfCnpj,
        address: req.body.address || demoUsers[demoUserIndex].address,
        profileImage:
          typeof req.body.profileImage === 'string'
            ? req.body.profileImage
            : demoUsers[demoUserIndex].profileImage,
        bankInfo: req.body.bankInfo
          ? {
              bank:
                req.body.bankInfo.bank ||
                demoUsers[demoUserIndex].bankInfo?.bank,
              agency:
                req.body.bankInfo.agency ||
                demoUsers[demoUserIndex].bankInfo?.agency,
              account:
                req.body.bankInfo.account ||
                demoUsers[demoUserIndex].bankInfo?.account,
              pixKey:
                req.body.bankInfo.pixKey ||
                demoUsers[demoUserIndex].bankInfo?.pixKey,
            }
          : demoUsers[demoUserIndex].bankInfo,
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
      throw new NotFoundError('Usuário não encontrado (modo demo)');
    }
  }
});

// @desc    Verificar e-mail
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const pool = getPool();
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    // Usar userRepository para buscar por token
    const user = await userRepository.findByVerificationToken(hashedToken);

    if (!user) {
      throw new BadRequestError('Token de verificação inválido ou expirado');
    }
    const id = user.id;
    await pool.query(
      'UPDATE users SET email_verified=TRUE, email_verification_token=NULL, email_verification_expires=NULL WHERE id=$1',
      [id]
    );
    return res
      .status(200)
      .json({ message: 'E-mail verificado com sucesso!', emailVerified: true });
  } catch (error) {
    console.error('Erro ao verificar e-mail:', error);
    throw new InternalServerError('Erro interno do servidor');
  }
});

// @desc    Atualizar preferências do usuário (appearance, language, notifications, privacy)
// @route   PUT /api/users/settings
// @access  Private
const updateUserSettings = asyncHandler(async (req, res) => {
  const pool = getPool();
  const userId = req.userId;
  const settings = req.body && typeof req.body === 'object' ? req.body : {};
  await pool.query('UPDATE users SET settings=$1 WHERE id=$2', [
    JSON.stringify(settings),
    userId,
  ]);
  const rs = await pool.query(
    'SELECT id,name,email,role,phone,cpf_cnpj,address,bank_info,settings,ad_free_until FROM users WHERE id=$1 LIMIT 1',
    [userId]
  );
  const user = rs.rows[0];
  return res.status(200).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    cpfCnpj: user.cpf_cnpj,
    address: user.address || {},
    bankInfo: user.bank_info || {},
    settings: user.settings || {},
    adFreeUntil: user.ad_free_until || null,
    isAdFree: user.ad_free_until
      ? new Date(user.ad_free_until) > new Date()
      : false,
  });
});

// @desc    Reenviar e-mail de verificação
// @route   POST /api/users/resend-verification
// @access  Private
const resendVerificationEmail = asyncHandler(async (req, res) => {
  try {
    const pool = getPool();
    const rsUser = await pool.query(
      'SELECT id,name,email FROM users WHERE id=$1 LIMIT 1',
      [req.userId]
    );
    if (!rsUser.rowCount) {
      throw new NotFoundError('Usuário não encontrado');
    }
    const user = rsUser.rows[0];
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyHash = crypto
      .createHash('sha256')
      .update(verifyToken)
      .digest('hex');
    const verifyExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'UPDATE users SET email_verification_token=$1, email_verification_expires=$2 WHERE id=$3',
      [verifyHash, verifyExp, user.id]
    );
    const emailResult = await sendVerificationEmail(
      user.email,
      user.name,
      verifyToken
    );
    if (!emailResult.success) {
      res.status(500);
      throw new Error('Erro ao enviar e-mail de verificação');
    }
    return res
      .status(200)
      .json({ message: 'E-mail de verificação reenviado com sucesso!' });
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
    const usePg =
      (process.env.DB_TYPE || '').toLowerCase() === 'postgres' ||
      !!process.env.DATABASE_URL;
    if (usePg) {
      // Usar userRepository para verificar existência
      const exists = await userRepository.existsByEmail(email);

      if (!exists) {
        throw new NotFoundError('Usuário não encontrado');
      }
      return res.status(200).json({
        message:
          'Instruções para redefinir a senha foram enviadas para o seu email',
      });
    }
  } catch (error) {
    // Modo de demonstração (sem banco de dados)
    console.log('Usando modo de demonstração para forgotPassword'.yellow);

    // Verificar se o usuário existe no modo demo
    const demoUser = demoUsers.find((u) => u.email === email);

    if (demoUser) {
      res.status(200).json({
        message:
          'Instruções para redefinir a senha foram enviadas para o seu email (modo demo)',
      });
    } else {
      throw new NotFoundError('Usuário não encontrado (modo demo)');
    }
  }
});

// @desc    Listar todos os técnicos
// @route   GET /api/users/technicians
// @access  Private
const getTechnicians = asyncHandler(async (req, res) => {
  if (isDemo) {
    const techs = demoUsers
      .filter((u) => u.role === 'technician')
      .map((u) => ({
        _id: u._id,
        name: u.name,
        specialties: u.services ? u.services.map((s) => s.name) : [],
        rating: 5.0, // Mock rating
        distance: (Math.random() * 10).toFixed(1), // Mock distance
      }));
    return res.json(techs);
  }

  try {
    const pool = getPool();
    // Join users and technicians to get details
    const query = `
      SELECT u.id, u.name, t.specialties, t.services 
      FROM users u 
      JOIN technicians t ON u.id = t.user_id 
      WHERE u.role = 'technician'
    `;
    const result = await pool.query(query);

    const technicians = result.rows.map((row) => {
      let specialties = [];
      try {
        specialties =
          typeof row.specialties === 'string'
            ? JSON.parse(row.specialties)
            : row.specialties;
      } catch (e) {
        specialties = [];
      }

      // If no specialties, try to get from services
      if (!specialties || specialties.length === 0) {
        try {
          const services =
            typeof row.services === 'string'
              ? JSON.parse(row.services)
              : row.services;
          if (Array.isArray(services)) {
            specialties = services.map((s) => s.name);
          }
        } catch (e) {}
      }

      return {
        _id: row.id,
        name: row.name,
        specialties: specialties || [],
        rating: 5.0, // Placeholder until rating system is implemented
        distance: (Math.random() * 10).toFixed(1), // Placeholder until geolocation is implemented
      };
    });

    res.json(technicians);
  } catch (error) {
    console.error('Erro ao buscar técnicos:', error);
    throw new InternalServerError('Erro ao buscar lista de técnicos');
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
    const jti =
      decoded.jti || crypto.createHash('sha256').update(token).digest('hex');
    const usePg =
      (process.env.DB_TYPE || '').toLowerCase() === 'postgres' ||
      !!process.env.DATABASE_URL;
    if (usePg) {
      const pool = getPool();
      await pool.query(
        'INSERT INTO blacklisted_tokens (jti, user_id, expires_at, reason) VALUES ($1,$2,$3,$4) ON CONFLICT (jti) DO NOTHING',
        [jti, decoded.id, expiresAt, 'logout']
      );

      // Revogar refresh token se fornecido no corpo ou header (opcional, mas recomendado limpar todos do usuário ou específico)
      // Como não recebemos o refresh token no logout padrão, vamos revogar pelo user_id se possível, ou apenas confiar na expiração curta do access token
      // Mas se tivermos o refresh token no body, revogamos
      if (req.body.refreshToken) {
        await revokeRefreshToken(req.body.refreshToken);
      }
    }
    if (req.user) {
      logLogout({ id: req.userId, email: req.user.email }, req);
    }
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });
    } catch {}
    return res.status(200).json({ message: 'Logout efetuado com sucesso' });
  } catch (e) {
    return res.status(200).json({ message: 'Logout efetuado' });
  }
});

// Debug: contagens e existência de tabelas (apenas para desenvolvimento)
const getDebug = asyncHandler(async (req, res) => {
  try {
    const pool = getPool();
    const existsRs = await pool.query(
      "SELECT to_regclass('public.users') AS users, to_regclass('public.technicians') AS technicians"
    );
    const usersExists = !!existsRs.rows[0].users;
    const techsExists = !!existsRs.rows[0].technicians;
    let countUsers = 0,
      countTechs = 0,
      recent = [];
    if (usersExists) {
      const cu = await pool.query('SELECT COUNT(*)::int AS c FROM users');
      countUsers = cu.rows[0].c;
      const ru = await pool.query(
        'SELECT id,email,role,created_at FROM users ORDER BY created_at DESC NULLS LAST LIMIT 5'
      );
      recent = ru.rows;
    }
    if (techsExists) {
      const ct = await pool.query('SELECT COUNT(*)::int AS c FROM technicians');
      countTechs = ct.rows[0].c;
    }
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
    const safeUrl = url.replace(/:[^:@/]+@/, '://****@');
    return res.status(200).json({
      env: process.env.NODE_ENV,
      ssl:
        process.env.POSTGRES_SSL ||
        (process.env.NODE_ENV === 'production' ? 'true' : 'false'),
      dbUrl: safeUrl,
      tables: { users: usersExists, technicians: techsExists },
      counts: { users: countUsers, technicians: countTechs },
      recentUsers: recent,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// Listar sessões ativas do usuário
const listSessions = asyncHandler(async (req, res) => {
  const pool = getPool();
  const rs = await pool.query(
    'SELECT id,jti,user_agent,ip,created_at,last_used_at,revoked_at FROM sessions WHERE user_id=$1 ORDER BY created_at DESC',
    [req.userId]
  );
  return res.json({ items: rs.rows });
});

// Revogar sessão específica (por jti)
const revokeSession = asyncHandler(async (req, res) => {
  const { jti } = req.body;
  if (!jti) {
    throw new BadRequestError('jti é obrigatório');
  }
  const pool = getPool();
  await pool.query(
    'UPDATE sessions SET revoked_at=NOW() WHERE jti=$1 AND user_id=$2',
    [jti, req.userId]
  );
  // Adicionar à blacklist até expirar token (12h padrão)
  const exp = new Date(Date.now() + 12 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO blacklisted_tokens (jti, user_id, expires_at, reason) VALUES ($1,$2,$3,$4) ON CONFLICT (jti) DO NOTHING',
    [jti, req.userId, exp, 'revoked_by_user']
  );
  return res.json({ message: 'Sessão revogada' });
});

// Inicializar 2FA: cria código temporário
const twofaInit = asyncHandler(async (req, res) => {
  const pool = getPool();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const exp = new Date(Date.now() + 5 * 60 * 1000);
  await pool.query(
    'UPDATE users SET twofa_temp_code=$1, twofa_temp_expires=$2 WHERE id=$3',
    [code, exp, req.userId]
  );
  return res.json({ message: 'Código gerado', expiresAt: exp });
});

// Verificar 2FA e ativar
const twofaVerify = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    throw new BadRequestError('Código é obrigatório');
  }
  const pool = getPool();
  const rs = await pool.query(
    'SELECT twofa_temp_code, twofa_temp_expires FROM users WHERE id=$1',
    [req.userId]
  );
  if (!rs.rowCount) {
    throw new NotFoundError('Usuário não encontrado');
  }
  const row = rs.rows[0];
  if (!row.twofa_temp_code || !row.twofa_temp_expires) {
    throw new BadRequestError('2FA não iniciado');
  }
  if (String(row.twofa_temp_code) !== String(code)) {
    throw new BadRequestError('Código inválido');
  }
  if (new Date(row.twofa_temp_expires) < new Date()) {
    throw new BadRequestError('Código expirado');
  }
  await pool.query(
    'UPDATE users SET twofa_enabled=TRUE, twofa_secret=$1, twofa_temp_code=NULL, twofa_temp_expires=NULL WHERE id=$2',
    [row.twofa_temp_code, req.userId]
  );
  return res.json({ message: '2FA ativado' });
});

// Desativar 2FA
const twofaDisable = asyncHandler(async (req, res) => {
  const pool = getPool();
  await pool.query(
    'UPDATE users SET twofa_enabled=FALSE, twofa_secret=NULL, twofa_temp_code=NULL, twofa_temp_expires=NULL WHERE id=$1',
    [req.userId]
  );
  return res.json({ message: '2FA desativado' });
});

// @desc    Atualizar access token usando refresh token
// @route   POST /api/users/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new BadRequestError('Refresh token não fornecido');
  }

  try {
    const { decoded, dbToken } = await verifyRefreshToken(refreshToken);

    // Gerar novo access token
    // Precisamos buscar o usuário para garantir que ele ainda existe e pegar os dados atualizados
    const pool = getPool();
    const rsUser = await pool.query('SELECT * FROM users WHERE id=$1 LIMIT 1', [
      decoded.id,
    ]);

    if (!rsUser.rowCount) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    const user = rsUser.rows[0];
    const accessToken = generateAccessToken(user);

    res.json({
      token: accessToken,
    });
  } catch (error) {
    console.error('Erro no refresh token:', error.message);
    throw new UnauthorizedError('Refresh token inválido ou expirado');
  }
});

module.exports = {
  registerUser,
  loginUser,
  loginTechnician,
  upgradeToTechnician,
  getMe,
  updateUserProfile,
  updateUserSettings,
  forgotPassword,
  verifyEmail,
  resendVerificationEmail,
  logoutUser,
  getDebug,
  getTechnicians,
  listSessions,
  revokeSession,
  twofaInit,
  twofaVerify,
  twofaDisable,
  refreshToken,
};
