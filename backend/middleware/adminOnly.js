const { ForbiddenError } = require('../utils/httpErrors');

module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ForbiddenError('Acesso restrito a administradores'));
  }
  next();
};
