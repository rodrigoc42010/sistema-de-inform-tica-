/**
 * HTTP ERROR CLASSES
 *
 * Classes padronizadas para erros HTTP.
 * Elimina duplicação do padrão: res.status(4xx); throw new Error()
 *
 * Uso:
 *   throw new NotFoundError('Usuário não encontrado');
 *   throw new ForbiddenError('Acesso negado');
 */

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpError';
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends HttpError {
  constructor(message = 'Requisição inválida') {
    super(400, message);
    this.name = 'BadRequestError';
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = 'Não autorizado') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends HttpError {
  constructor(message = 'Acesso negado') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'Recurso não encontrado') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends HttpError {
  constructor(message = 'Conflito de dados') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

class LockedError extends HttpError {
  constructor(message = 'Recurso bloqueado temporariamente') {
    super(423, message);
    this.name = 'LockedError';
  }
}

class InternalServerError extends HttpError {
  constructor(message = 'Erro interno do servidor') {
    super(500, message);
    this.name = 'InternalServerError';
  }
}

module.exports = {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  LockedError,
  InternalServerError,
};
