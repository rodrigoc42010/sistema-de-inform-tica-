const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');
const { logLogin, logFailedLogin, logLogout } = require('../middleware/auditLogger');
const { getPool } = require('../db/pgClient');

// Modo de demonstração (sem banco de dados)
let demoUsers = [];
let demoCounter = 1;
const isDemo = process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

// @desc    Registrar um novo usuário
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, cpfCnpj, address, technician, termsAccepted } = req.body;
  const normalizeRole = (r, techObj) => {
    if (techObj) return 'technician';
    const s = String(r || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (['technician', 'tecnico', 'tecnico(a)', 'tecnic', 'tech', 'tecnicx', 'tecnico profissional'].includes(s)) return 'technician';
    if (['client', 'cliente', 'user', 'usuario'].includes(s)) return 'client';
    return 'client';
  };
  const roleNormalized = normalizeRole(role, technician);

  // Validação
  if (!name || !email || !password || !phone || !cpfCnpj) {
    res.status(400);
    throw new Error('Por favor, preencha todos os campos obrigatórios');
  }

  if (termsAccepted !== true) {
    res.status(400);
    throw new Error('É necessário aceitar os Termos de Uso e a Política de Privacidade');
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
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 12 * 60 * 60 * 1000 });
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
      message: 'Usuário registrado com sucesso! (modo demonstração)'
    });
    return;
  }

  try {
    const hasDb = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
    const hasJwt = !!process.env.JWT_SECRET;

    console.log(`[Register] Starting registration for ${email}. DB: ${hasDb}, Demo: ${isDemo}`.cyan);

    if (!hasDb) {
      res.status(500);
      throw new Error('Configuração ausente: DATABASE_URL/POSTGRES_URL');
    }
    if (!hasJwt) {
      res.status(500);
      throw new Error('Configuração ausente: JWT_SECRET');
    }
    const pool = getPool();

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const exists = await client.query('SELECT id FROM users WHERE email=$1 LIMIT 1', [email]);
      if (exists.rowCount > 0) {
        res.status(400);
        throw new Error('Usuário já cadastrado');
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const verifyToken = crypto.randomBytes(32).toString('hex');
      const verifyHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
      const verifyExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const bankInfo = req.body.bankInfo ? JSON.stringify(req.body.bankInfo) : null;
      const addressJson = address ? JSON.stringify(address) : null;

      console.log(`[Register] Inserting user ${email}...`);
      const inserted = await client.query(
        'INSERT INTO users (name,email,password,role,phone,cpf_cnpj,address,bank_info,email_verification_token,email_verification_expires,email_verified,terms_accepted,terms_accepted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id,name,email,role,phone,cpf_cnpj,address,bank_info,email_verified,ad_free_until,terms_accepted,terms_accepted_at',
        [name, email, hashedPassword, roleNormalized, phone, cpfCnpj, addressJson, bankInfo, verifyHash, verifyExp, false, true, new Date()]
      );
      const userRow = inserted.rows[0];

      const emailResult = await sendVerificationEmail(email, name, verifyToken);
      if (!emailResult.success) {
        console.error('Erro ao enviar e-mail de verificação:', emailResult.error);
      }

      let loginId = null;
      if (roleNormalized === 'technician') {
        console.log(`[Register] Creating technician profile for ${email}...`);
        loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const mappedServices = Array.isArray(technician?.services)
          ? technician.services.map((s) => ({
            name: s.name || s.title || 'Serviço',
            price: Number(s.initialPrice ?? s.price ?? 0) || 0,
            estimatedTime: s.estimatedTime,
            category: s.category,
            isActive: s.isActive !== undefined ? s.isActive : true,
          }))
          : [];
        const tData = {
          user_id: userRow.id,
          login_id: loginId,
          services: mappedServices,
          specialties: [],
          pickup_service: !!technician?.pickupService,
          pickup_fee: Number(technician?.pickupFee ?? 0) || 0,
          payment_methods: Array.isArray(technician?.paymentMethods) ? technician.paymentMethods : [],
        };
        if (technician?.certifications) {
          tData.specialties = technician.certifications
            .split(',')
            .map((cert) => cert.trim())
            .filter(Boolean);
        }
        await client.query(
          'INSERT INTO technicians (user_id,login_id,services,specialties,pickup_service,pickup_fee,payment_methods) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [tData.user_id, tData.login_id, JSON.stringify(tData.services), JSON.stringify(tData.specialties), tData.pickup_service, tData.pickup_fee, JSON.stringify(tData.payment_methods)]
        );
      }

      await client.query('COMMIT');
      console.log(`[Register] Transaction committed for ${email}.`);

      return res.status(201).json({
        _id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        role: userRow.role,
        phone: userRow.phone,
        cpfCnpj: userRow.cpf_cnpj,
        address: userRow.address || {},
        bankInfo: userRow.bank_info || {},
        emailVerified: userRow.email_verified,
        adFreeUntil: userRow.ad_free_until || null,
        isAdFree: userRow.ad_free_until ? new Date(userRow.ad_free_until) > new Date() : false,
        ...(loginId ? { loginId } : {}),
        token: (function () {
          const t = generateToken(userRow.id);
          try {
            const decoded = jwt.decode(t);
            const pool = getPool();
            pool.query('UPDATE users SET current_jti=$1 WHERE id=$2', [decoded.jti, userRow.id]).catch(() => { });
            res.cookie('token', t, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 12 * 60 * 60 * 1000 });
          } catch { }
          return t;
        })(),
        message: 'Usuário registrado com sucesso! Verifique seu e-mail para confirmar sua conta.',
      });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[Register] Transaction failed for ${email}:`, err);
      throw err;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro ao registrar usuário:', error?.message || error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
      throw new Error('Serviço temporariamente indisponível. Tente novamente mais tarde.');
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
    const pool = getPool();
    const rs = await pool.query('SELECT * FROM users WHERE email=$1 LIMIT 1', [email]);
    if (rs.rowCount === 0) {
      logFailedLogin(email, req, 'Usuário não encontrado');
      res.status(401);
      throw new Error('Credenciais inválidas');
    }
    const user = rs.rows[0];
    if (user.lock_until && new Date(user.lock_until) > Date.now()) {
      logFailedLogin(email, req, 'Conta bloqueada temporariamente');
      res.status(423);
      throw new Error('Conta bloqueada temporariamente. Tente novamente mais tarde.');
    }
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      const failed = (user.failed_login_attempts || 0) + 1;
      const lockUntil = failed >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000) : null;
      await pool.query('UPDATE users SET failed_login_attempts=$1, lock_until=$2 WHERE id=$3', [failed, lockUntil, user.id]);
      logFailedLogin(email, req, lockUntil ? 'Muitas tentativas, conta bloqueada' : 'Credenciais inválidas');
      res.status(401);
      throw new Error('Credenciais inválidas');
    }
    await pool.query('UPDATE users SET failed_login_attempts=0, lock_until=NULL, last_login_at=NOW() WHERE id=$1', [user.id]);
    logLogin({ id: user.id, email: user.email, name: user.name }, req);
    return res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cpfCnpj: user.cpf_cnpj,
      address: user.address || {},
      emailVerified: user.email_verified,
      adFreeUntil: user.ad_free_until || null,
      isAdFree: user.ad_free_until ? new Date(user.ad_free_until) > new Date() : false,
      token: generateToken(user.id),
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

    const token = generateToken(user._id);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 12 * 60 * 60 * 1000 });
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
      token,
    });
  }

  try {
    const usePg = (process.env.DB_TYPE || '').toLowerCase() === 'postgres' || !!process.env.DATABASE_URL;
    if (usePg) {
      const pool = getPool();
      let user = null;
      let technician = null;
      if (loginId) {
        const rs = await pool.query('SELECT t.login_id,u.* FROM technicians t JOIN users u ON t.user_id=u.id WHERE t.login_id=$1 LIMIT 1', [loginId]);
        if (rs.rowCount === 0) {
          logFailedLogin(`LoginID: ${loginId}`, req, 'ID de login não encontrado');
          res.status(401);
          throw new Error('Credenciais inválidas');
        }
        const row = rs.rows[0];
        user = row;
        technician = { loginId: row.login_id };
      } else if (cpfCnpj) {
        const rsUser = await pool.query('SELECT * FROM users WHERE cpf_cnpj=$1 AND role=$2 LIMIT 1', [cpfCnpj, 'technician']);
        if (rsUser.rowCount === 0) {
          logFailedLogin(`CPF/CNPJ: ${cpfCnpj}`, req, 'Usuário não encontrado ou não é técnico');
          res.status(401);
          throw new Error('Credenciais inválidas');
        }
        user = rsUser.rows[0];
        const rsTech = await pool.query('SELECT login_id FROM technicians WHERE user_id=$1 LIMIT 1', [user.id]);
        technician = rsTech.rowCount ? { loginId: rsTech.rows[0].login_id } : null;
      }

      if (user.lock_until && new Date(user.lock_until) > Date.now()) {
        const who = loginId ? `${user.email} (LoginID: ${loginId})` : `${user.email} (CPF/CNPJ: ${cpfCnpj})`;
        logFailedLogin(who, req, 'Conta bloqueada temporariamente');
        res.status(423);
        throw new Error('Conta bloqueada temporariamente. Tente novamente mais tarde.');
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      if (!passwordMatches) {
        const failed = (user.failed_login_attempts || 0) + 1;
        const lockUntil = failed >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000) : null;
        await pool.query('UPDATE users SET failed_login_attempts=$1, lock_until=$2 WHERE id=$3', [failed, lockUntil, user.id]);
        const who = loginId ? `${user.email} (LoginID: ${loginId})` : `${user.email} (CPF/CNPJ: ${cpfCnpj})`;
        logFailedLogin(who, req, lockUntil ? 'Muitas tentativas, conta bloqueada' : 'Senha incorreta');
        res.status(401);
        throw new Error('Credenciais inválidas');
      }

      await pool.query('UPDATE users SET failed_login_attempts=0, lock_until=NULL, last_login_at=NOW() WHERE id=$1', [user.id]);
      logLogin({ id: user.id, email: user.email, name: user.name, loginId: technician?.loginId, cpfCnpj: user.cpf_cnpj }, req);

      return res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        cpfCnpj: user.cpf_cnpj,
        address: user.address || {},
        emailVerified: user.email_verified,
        loginId: technician?.loginId || null,
        adFreeUntil: user.ad_free_until || null,
        isAdFree: user.ad_free_until ? new Date(user.ad_free_until) > new Date() : false,
        token: generateToken(user.id),
      });
    }
    res.status(500);
    throw new Error('Banco de dados não configurado (Postgres obrigatório)');
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

  const pool = getPool();
  const rsUser = await pool.query('SELECT * FROM users WHERE id=$1 LIMIT 1', [req.user._id || req.user.id]);
  if (!rsUser.rowCount) {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
  const user = rsUser.rows[0];
  if (user.role === 'technician') {
    const rsTechExisting = await pool.query('SELECT login_id FROM technicians WHERE user_id=$1 LIMIT 1', [user.id]);
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
      isAdFree: user.ad_free_until ? new Date(user.ad_free_until) > new Date() : false,
      token: generateToken(user.id),
    });
  }
  let rsTech = await pool.query('SELECT * FROM technicians WHERE user_id=$1 LIMIT 1', [user.id]);
  if (!rsTech.rowCount) {
    const loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const incoming = Array.isArray(req.body.technician?.services) ? req.body.technician.services : [];
    const services = incoming.map((s) => ({
      name: s.name || s.title || 'Serviço',
      description: s.description || s.details || '',
      category: s.category || s.type || undefined,
      price: Number(s.initialPrice != null ? s.initialPrice : s.price) || 0,
      estimatedTime: s.estimatedTime || s.time || undefined,
      isActive: s.isActive !== undefined ? s.isActive : true,
    }));
    const pickupService = !!req.body.technician?.pickupService;
    const pickupFee = Number(req.body.technician?.pickupFee ?? 0) || 0;
    const paymentMethods = Array.isArray(req.body.technician?.paymentMethods) ? req.body.technician.paymentMethods : [];
    const specialties = req.body.technician?.certifications
      ? req.body.technician.certifications.split(',').map((c) => c.trim()).filter(Boolean)
      : [];
    await pool.query(
      'INSERT INTO technicians (user_id,login_id,services,specialties,pickup_service,pickup_fee,payment_methods) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [user.id, loginId, JSON.stringify(services), JSON.stringify(specialties), pickupService, pickupFee, JSON.stringify(paymentMethods)]
    );
    rsTech = await pool.query('SELECT login_id FROM technicians WHERE user_id=$1 LIMIT 1', [user.id]);
  }
  await pool.query('UPDATE users SET role=$1 WHERE id=$2', ['technician', user.id]);
  const loginId = rsTech.rowCount ? rsTech.rows[0].login_id : null;
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
    isAdFree: user.ad_free_until ? new Date(user.ad_free_until) > new Date() : false,
    token: generateToken(user.id),
  });
});

// @desc    Obter dados do usuário atual
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const isDemo = process.env.DEMO_MODE === 'true';
  if (isDemo) {
    const demoUser = demoUsers.find(u => u._id === req.user._id);
    if (!demoUser) {
      res.status(404);
      throw new Error('Usuário não encontrado (modo demo)');
    }
    if (demoUser.role === 'technician') {
      return res.status(200).json({
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
    }
    return res.status(200).json({
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
  const pool = getPool();
  const userId = req.user.id || req.user._id;
  const rsUser = await pool.query('SELECT * FROM users WHERE id=$1 LIMIT 1', [userId]);
  if (!rsUser.rowCount) {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
  const user = rsUser.rows[0];
  let effectiveRole = user.role;
  const rsTechCheck = await pool.query('SELECT login_id FROM technicians WHERE user_id=$1 LIMIT 1', [user.id]);
  if (rsTechCheck.rowCount && effectiveRole !== 'technician') {
    effectiveRole = 'technician';
    try { await pool.query('UPDATE users SET role=$1 WHERE id=$2', ['technician', user.id]); } catch {}
  }
  if (effectiveRole === 'technician') {
    const rsTech = await pool.query('SELECT * FROM technicians WHERE user_id=$1 LIMIT 1', [user.id]);
    const tech = rsTech.rowCount ? rsTech.rows[0] : null;
    return res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: effectiveRole,
      phone: user.phone,
      cpfCnpj: user.cpf_cnpj,
      address: user.address || {},
      bankInfo: user.bank_info || {},
      services: tech?.services || [],
      specialties: tech?.specialties || [],
      pickupService: tech?.pickup_service || false,
      pickupFee: tech?.pickup_fee || 0,
      paymentMethods: tech?.payment_methods || [],
      adFreeUntil: user.ad_free_until || null,
      isAdFree: user.ad_free_until ? new Date(user.ad_free_until) > new Date() : false,
    });
  }
  return res.status(200).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: effectiveRole,
    phone: user.phone,
    cpfCnpj: user.cpf_cnpj,
    address: user.address || {},
    bankInfo: user.bank_info || {},
    adFreeUntil: user.ad_free_until || null,
    isAdFree: user.ad_free_until ? new Date(user.ad_free_until) > new Date() : false,
  });
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
    const usePg = (process.env.DB_TYPE || '').toLowerCase() === 'postgres' || !!process.env.DATABASE_URL;
    if (usePg) {
      const pool = getPool();
      const rsUser = await pool.query('SELECT * FROM users WHERE id=$1 LIMIT 1', [req.user._id]);
      if (!rsUser.rowCount) {
        res.status(404);
        throw new Error('Usuário não encontrado');
      }
      const user = rsUser.rows[0];
      const name = req.body.name || user.name;
      const email = req.body.email || user.email;
      const phone = req.body.phone || user.phone;
      const cpf_cnpj = req.body.cpfCnpj || user.cpf_cnpj;
      const address = req.body.address ? JSON.stringify(req.body.address) : user.address;
      let bank_info = user.bank_info;
      if (req.body.bankInfo && typeof req.body.bankInfo === 'object') {
        bank_info = JSON.stringify({
          bank: req.body.bankInfo.bank || (bank_info?.bank),
          agency: req.body.bankInfo.agency || (bank_info?.agency),
          account: req.body.bankInfo.account || (bank_info?.account),
          pixKey: req.body.bankInfo.pixKey || (bank_info?.pixKey),
        });
      }
      const profile_image = typeof req.body.profileImage === 'string' ? req.body.profileImage : user.profile_image;
      let passwordSql = null;
      let passwordChangedAt = null;
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(req.body.password, salt);
        passwordSql = hashed;
        passwordChangedAt = new Date();
      }
      await pool.query(
        'UPDATE users SET name=$1,email=$2,phone=$3,cpf_cnpj=$4,address=$5,bank_info=$6,profile_image=$7, password=COALESCE($8,password), password_changed_at=COALESCE($9,password_changed_at) WHERE id=$10',
        [name, email, phone, cpf_cnpj, address, bank_info, profile_image, passwordSql, passwordChangedAt, user.id]
      );
      const rsUpdated = await pool.query('SELECT * FROM users WHERE id=$1', [user.id]);
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
        isAdFree: updatedUser.ad_free_until ? new Date(updatedUser.ad_free_until) > new Date() : false,
        token: generateToken(updatedUser.id),
      });
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
    const pool = getPool();
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const rs = await pool.query('SELECT id FROM users WHERE email_verification_token=$1 AND email_verification_expires > NOW() LIMIT 1', [hashedToken]);
    if (!rs.rowCount) {
      res.status(400);
      throw new Error('Token de verificação inválido ou expirado');
    }
    const id = rs.rows[0].id;
    await pool.query('UPDATE users SET email_verified=TRUE, email_verification_token=NULL, email_verification_expires=NULL WHERE id=$1', [id]);
    return res.status(200).json({ message: 'E-mail verificado com sucesso!', emailVerified: true });
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
    const pool = getPool();
    const rsUser = await pool.query('SELECT id,name,email FROM users WHERE id=$1 LIMIT 1', [req.user.id || req.user._id]);
    if (!rsUser.rowCount) {
      res.status(404);
      throw new Error('Usuário não encontrado');
    }
    const user = rsUser.rows[0];
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
    const verifyExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query('UPDATE users SET email_verification_token=$1, email_verification_expires=$2 WHERE id=$3', [verifyHash, verifyExp, user.id]);
    const emailResult = await sendVerificationEmail(user.email, user.name, verifyToken);
    if (!emailResult.success) {
      res.status(500);
      throw new Error('Erro ao enviar e-mail de verificação');
    }
    return res.status(200).json({ message: 'E-mail de verificação reenviado com sucesso!' });
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
    const usePg = (process.env.DB_TYPE || '').toLowerCase() === 'postgres' || !!process.env.DATABASE_URL;
    if (usePg) {
      const pool = getPool();
      const rs = await pool.query('SELECT id FROM users WHERE email=$1 LIMIT 1', [email]);
      if (!rs.rowCount) {
        res.status(404);
        throw new Error('Usuário não encontrado');
      }
      return res.status(200).json({ message: 'Instruções para redefinir a senha foram enviadas para o seu email' });
    }
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

// @desc    Listar todos os técnicos
// @route   GET /api/users/technicians
// @access  Private
const getTechnicians = asyncHandler(async (req, res) => {
  if (isDemo) {
    const techs = demoUsers.filter(u => u.role === 'technician').map(u => ({
      _id: u._id,
      name: u.name,
      specialties: u.services ? u.services.map(s => s.name) : [],
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

    const technicians = result.rows.map(row => {
      let specialties = [];
      try {
        specialties = typeof row.specialties === 'string' ? JSON.parse(row.specialties) : row.specialties;
      } catch (e) { specialties = []; }

      // If no specialties, try to get from services
      if (!specialties || specialties.length === 0) {
        try {
          const services = typeof row.services === 'string' ? JSON.parse(row.services) : row.services;
          if (Array.isArray(services)) {
            specialties = services.map(s => s.name);
          }
        } catch (e) { }
      }

      return {
        _id: row.id,
        name: row.name,
        specialties: specialties || [],
        rating: 5.0, // Placeholder until rating system is implemented
        distance: (Math.random() * 10).toFixed(1) // Placeholder until geolocation is implemented
      };
    });

    res.json(technicians);
  } catch (error) {
    console.error('Erro ao buscar técnicos:', error);
    res.status(500);
    throw new Error('Erro ao buscar lista de técnicos');
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
    const usePg = (process.env.DB_TYPE || '').toLowerCase() === 'postgres' || !!process.env.DATABASE_URL;
    if (usePg) {
      const pool = getPool();
      await pool.query('INSERT INTO blacklisted_tokens (jti, user_id, expires_at, reason) VALUES ($1,$2,$3,$4) ON CONFLICT (jti) DO NOTHING', [jti, decoded.id, expiresAt, 'logout']);
    }
    if (req.user) {
      logLogout({ id: req.user._id || req.user.id, email: req.user.email }, req);
    }
    try { res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' }); } catch { }
    return res.status(200).json({ message: 'Logout efetuado com sucesso' });
  } catch (e) {
    return res.status(200).json({ message: 'Logout efetuado' });
  }
});

// Debug: contagens e existência de tabelas (apenas para desenvolvimento)
const getDebug = asyncHandler(async (req, res) => {
  try {
    const pool = getPool();
    const existsRs = await pool.query("SELECT to_regclass('public.users') AS users, to_regclass('public.technicians') AS technicians");
    const usersExists = !!existsRs.rows[0].users;
    const techsExists = !!existsRs.rows[0].technicians;
    let countUsers = 0, countTechs = 0, recent = [];
    if (usersExists) {
      const cu = await pool.query('SELECT COUNT(*)::int AS c FROM users');
      countUsers = cu.rows[0].c;
      const ru = await pool.query('SELECT id,email,role,created_at FROM users ORDER BY created_at DESC NULLS LAST LIMIT 5');
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
      ssl: (process.env.POSTGRES_SSL || ((process.env.NODE_ENV === 'production') ? 'true' : 'false')),
      dbUrl: safeUrl,
      tables: { users: usersExists, technicians: techsExists },
      counts: { users: countUsers, technicians: countTechs },
      recentUsers: recent,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
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
  getDebug,
  getTechnicians,
};
