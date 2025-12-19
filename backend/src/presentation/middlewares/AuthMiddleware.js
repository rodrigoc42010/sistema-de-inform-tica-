const tokenService = require('../../infrastructure/external/TokenService');
const userRepository = require('../../infrastructure/database/PostgresUserRepository');
const { UnauthorizedError } = require('../utils/httpErrors');
const asyncHandler = require('express-async-handler');

const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    throw new UnauthorizedError('Não autorizado, token ausente');
  }

  try {
    const decoded = tokenService.verifyAccessToken(token);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw new UnauthorizedError('Não autorizado, usuário não encontrado');
    }

    req.user = user;
    next();
  } catch (err) {
    throw new UnauthorizedError('Não autorizado, token inválido');
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Acesso negado: permissão insuficiente');
    }
    next();
  };
};

module.exports = { protect, authorize };
