const { HttpError } = require('../utils/httpErrors');

const errorHandler = (err, req, res, next) => {
  // Se é uma instância de HttpError, usar statusCode da classe
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.statusCode,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }

  // Fallback para erros genéricos
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode);

  res.json({
    message: err.message,
    code: statusCode,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
