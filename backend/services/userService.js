const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db/pgClient');
const userRepository = require('../repositories/userRepository');
const GeocodingService = require('./geocodingService');
const { sendVerificationEmail } = require('../utils/emailService');
const {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
} = require('../utils/tokenUtils');
const {
  BadRequestError,
  InternalServerError,
  UnauthorizedError,
  LockedError,
} = require('../utils/httpErrors');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;

class UserService {
  async registerUser(data, reqInfo) {
    const {
      name,
      email,
      password,
      roleNormalized,
      phone,
      cpfCnpj,
      address,
      technician,
    } = data;
    const { ip, ua } = reqInfo;

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const exists = await client.query(
        'SELECT id FROM users WHERE email=$1 LIMIT 1',
        [email]
      );
      if (exists.rowCount > 0) {
        throw new BadRequestError('Usuário já cadastrado');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const verifyToken = crypto.randomBytes(32).toString('hex');
      const verifyHash = crypto
        .createHash('sha256')
        .update(verifyToken)
        .digest('hex');
      const verifyExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const bankInfo = data.bankInfo ? JSON.stringify(data.bankInfo) : null;
      const addressJson = address ? JSON.stringify(address) : null;

      const inserted = await client.query(
        'INSERT INTO users (name,email,password,role,phone,cpf_cnpj,address,bank_info,email_verification_token,email_verification_expires,email_verified,terms_accepted,terms_accepted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id,name,email,role,phone,cpf_cnpj,address,bank_info,email_verified,ad_free_until,terms_accepted,terms_accepted_at',
        [
          name,
          email,
          hashedPassword,
          roleNormalized,
          phone,
          cpfCnpj,
          addressJson,
          bankInfo,
          verifyHash,
          verifyExp,
          false,
          true,
          new Date(),
        ]
      );
      const userRow = inserted.rows[0];

      const emailResult = await sendVerificationEmail(email, name, verifyToken);
      if (!emailResult.success) {
        console.error(
          'Erro ao enviar e-mail de verificação:',
          emailResult.error
        );
      }

      let loginId = null;
      if (roleNormalized === 'technician') {
        loginId = `TEC${Date.now()}${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, '0')}`;
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
          payment_methods: Array.isArray(technician?.paymentMethods)
            ? technician.paymentMethods
            : [],
        };
        if (technician?.certifications) {
          tData.specialties = technician.certifications
            .split(',')
            .map((cert) => cert.trim())
            .filter(Boolean);
        }

        let lat = null;
        let lng = null;
        if (address) {
          try {
            const coords = await GeocodingService.getCoordinates(address);
            if (coords) {
              lat = coords.latitude;
              lng = coords.longitude;
            }
          } catch (e) {
            console.error('Geocoding failed during registration:', e.message);
          }
        }

        await client.query(
          'INSERT INTO technicians (user_id,login_id,services,specialties,pickup_service,pickup_fee,payment_methods,latitude,longitude) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          [
            tData.user_id,
            tData.login_id,
            JSON.stringify(tData.services),
            JSON.stringify(tData.specialties),
            tData.pickup_service,
            tData.pickup_fee,
            JSON.stringify(tData.payment_methods),
            lat,
            lng,
          ]
        );
      }

      await client.query('COMMIT');

      // Gerar tokens
      const accessToken = generateAccessToken(userRow);
      const {
        token: refreshToken,
        jti: refreshJti,
        expiresAt: refreshExpiresAt,
      } = generateRefreshToken(userRow);

      await storeRefreshToken(
        userRow.id,
        refreshToken,
        refreshJti,
        refreshExpiresAt,
        ip,
        ua
      );

      try {
        const decoded = jwt.decode(accessToken);
        await pool.query('UPDATE users SET current_jti=$1 WHERE id=$2', [
          decoded.jti,
          userRow.id,
        ]);
        await pool.query(
          'INSERT INTO sessions (user_id,jti,user_agent,ip) VALUES ($1,$2,$3,$4) ON CONFLICT (jti) DO NOTHING',
          [userRow.id, decoded.jti, ua, ip]
        );
      } catch {}

      return {
        user: userRow,
        accessToken,
        refreshToken,
        loginId,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async authenticateUser(email, password, reqInfo) {
    const { ip, ua } = reqInfo;
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    if (user.lock_until && new Date(user.lock_until) > Date.now()) {
      throw new LockedError(
        'Conta bloqueada temporariamente. Tente novamente mais tarde.'
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      const failed = (user.failed_login_attempts || 0) + 1;
      const lockUntil =
        failed >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000)
          : null;
      await userRepository.updateFailedAttempts(user.id, failed, lockUntil);
      throw new UnauthorizedError('Credenciais inválidas');
    }

    await userRepository.resetFailedAttemptsAndUpdateLogin(user.id);

    const accessToken = generateAccessToken(user);
    const {
      token: refreshToken,
      jti: refreshJti,
      expiresAt: refreshExpiresAt,
    } = generateRefreshToken(user);

    await storeRefreshToken(
      user.id,
      refreshToken,
      refreshJti,
      refreshExpiresAt,
      ip,
      ua
    );

    try {
      const decoded = jwt.decode(accessToken);
      await userRepository.updateCurrentJti(user.id, decoded.jti);
      const pool = getPool();
      await pool.query(
        'INSERT INTO sessions (user_id,jti,user_agent,ip) VALUES ($1,$2,$3,$4) ON CONFLICT (jti) DO NOTHING',
        [user.id, decoded.jti, ua, ip]
      );
    } catch {}

    return { user, accessToken, refreshToken };
  }

  async authenticateTechnician(loginId, cpfCnpj, password, reqInfo) {
    const { ip, ua } = reqInfo;
    const pool = getPool();
    let user = null;
    let technician = null;

    if (loginId) {
      const rs = await pool.query(
        'SELECT t.login_id,u.* FROM technicians t JOIN users u ON t.user_id=u.id WHERE t.login_id=$1 LIMIT 1',
        [loginId]
      );
      if (rs.rowCount === 0) {
        throw new UnauthorizedError('Credenciais inválidas');
      }
      user = rs.rows[0];
      technician = { loginId: user.login_id };
    } else if (cpfCnpj) {
      user = await userRepository.findByCpfCnpj(cpfCnpj, 'technician');
      if (!user) {
        throw new UnauthorizedError('Credenciais inválidas');
      }
      const rsTech = await pool.query(
        'SELECT login_id FROM technicians WHERE user_id=$1 LIMIT 1',
        [user.id]
      );
      technician = rsTech.rowCount
        ? { loginId: rsTech.rows[0].login_id }
        : null;
    }

    if (user.lock_until && new Date(user.lock_until) > Date.now()) {
      throw new Error(
        'Conta bloqueada temporariamente. Tente novamente mais tarde.'
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      const failed = (user.failed_login_attempts || 0) + 1;
      const lockUntil =
        failed >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000)
          : null;
      await pool.query(
        'UPDATE users SET failed_login_attempts=$1, lock_until=$2 WHERE id=$3',
        [failed, lockUntil, user.id]
      );
      throw new UnauthorizedError('Credenciais inválidas');
    }

    await pool.query(
      'UPDATE users SET failed_login_attempts=0, lock_until=NULL, last_login_at=NOW() WHERE id=$1',
      [user.id]
    );

    const accessToken = generateAccessToken(user);
    const {
      token: refreshToken,
      jti: refreshJti,
      expiresAt: refreshExpiresAt,
    } = generateRefreshToken(user);

    await storeRefreshToken(
      user.id,
      refreshToken,
      refreshJti,
      refreshExpiresAt,
      ip,
      ua
    );

    try {
      const decoded = jwt.decode(accessToken);
      await pool.query('UPDATE users SET current_jti=$1 WHERE id=$2', [
        decoded.jti,
        user.id,
      ]);
      await pool.query(
        'INSERT INTO sessions (user_id,jti,user_agent,ip) VALUES ($1,$2,$3,$4) ON CONFLICT (jti) DO NOTHING',
        [user.id, decoded.jti, ua, ip]
      );
    } catch {}

    return { user, technician, accessToken, refreshToken };
  }
}

module.exports = new UserService();
