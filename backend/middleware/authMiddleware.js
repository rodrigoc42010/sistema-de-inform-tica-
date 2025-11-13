const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const BlacklistedToken = require('../models/blacklistedTokenModel');
const isDemo = process.env.DEMO_MODE === 'true';

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
        const blacklisted = await BlacklistedToken.findOne({ jti: decoded.jti });
        if (blacklisted) {
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
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          res.status(401);
          throw new Error('Não autorizado, usuário não encontrado');
        }
      }

      // Invalidar tokens emitidos antes de alteração de senha
      if (!isDemo) {
        if (
          req.user.passwordChangedAt &&
          decoded.iat * 1000 < new Date(req.user.passwordChangedAt).getTime()
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