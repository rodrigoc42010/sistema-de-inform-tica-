const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { getPool } = require('../db/pgClient');
const isDemo = process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';
const allowMulti = process.env.ALLOW_MULTI_SESSION === 'true';

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obter token do header
      token = req.headers.authorization.split(' ')[1];

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verificar blacklist apenas fora do modo demo
      if (!isDemo) {
        if (!decoded.jti) {
          res.status(401);
          throw new Error('Não autorizado, token inválido');
        }
        const pool = getPool();
        const rs = await pool.query('SELECT jti FROM blacklisted_tokens WHERE jti=$1 LIMIT 1', [decoded.jti]);
        if (rs.rowCount) {
          res.status(401);
          throw new Error('Não autorizado, token revogado');
        }
      }

      // Obter usuário do token
      if (isDemo) {
        // Em modo demo, preencher com id do token;
        // rotas que precisam de dados completos tratam fallback no controller
        req.user = { _id: decoded.id, role: 'client' };
      } else {
        const pool = getPool();
        const rs = await pool.query('SELECT id,name,email,role,phone,cpf_cnpj,address,bank_info,password_changed_at FROM users WHERE id=$1 LIMIT 1', [decoded.id]);
        if (!rs.rowCount) {
          res.status(401);
          throw new Error('Não autorizado, usuário não encontrado');
        }
        let userRow = rs.rows[0];
        try {
          const rtech = await pool.query('SELECT 1 FROM technicians WHERE user_id=$1 LIMIT 1', [userRow.id]);
          if (rtech.rowCount && userRow.role !== 'technician') {
            await pool.query('UPDATE users SET role=$1 WHERE id=$2', ['technician', userRow.id]);
            userRow = { ...userRow, role: 'technician' };
          }
        } catch {}
        if (!allowMulti && userRow.current_jti && userRow.current_jti !== decoded.jti) {
          res.status(401);
          throw new Error('Sessão inválida');
        }
        req.user = userRow;
      }

      // Invalidar tokens emitidos antes de alteração de senha
      if (!isDemo) {
        const changedAt = req.user.passwordChangedAt || req.user.password_changed_at;
        if (
          changedAt &&
          decoded.iat * 1000 < new Date(changedAt).getTime()
        ) {
          res.status(401);
          throw new Error('Não autorizado, credenciais expiradas');
        }
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Não autorizado, token inválido');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Não autorizado, sem token');
  }
});

// Middleware para verificar se o usuário é um técnico
const technicianOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'technician') {
    next();
  } else {
    res.status(403);
    throw new Error('Não autorizado, acesso apenas para técnicos');
  }
});

// Middleware para verificar se o usuário é um cliente
const clientOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'client') {
    next();
  } else {
    res.status(403);
    throw new Error('Não autorizado, acesso apenas para clientes');
  }
});

module.exports = { protect, technicianOnly, clientOnly };
