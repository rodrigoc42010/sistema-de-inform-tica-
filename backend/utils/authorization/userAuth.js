const { ForbiddenError } = require('../httpErrors');

/**
 * Verifica se o usuário possui uma das roles permitidas.
 * @param {object} user - Objeto do usuário
 * @param {string[]} allowedRoles - Lista de roles permitidas
 * @returns {boolean}
 */
const hasRole = (user, allowedRoles) => {
  return allowedRoles.includes(user.role);
};

/**
 * Verifica se o usuário é dono do recurso (baseado em ID).
 * @param {string} resourceUserId - ID do usuário dono do recurso
 * @param {string} currentUserId - ID do usuário atual
 * @returns {boolean}
 */
const isOwner = (resourceUserId, currentUserId) => {
  return String(resourceUserId) === String(currentUserId);
};

/**
 * Middleware/Helper para garantir que o usuário tenha permissão.
 * @param {object} user - Objeto do usuário
 * @param {string[]} allowedRoles - Roles permitidas
 * @throws {ForbiddenError} Se não tiver permissão
 */
const requireRole = (user, allowedRoles) => {
  if (!hasRole(user, allowedRoles)) {
    throw new ForbiddenError('Acesso negado: permissão insuficiente');
  }
};

module.exports = {
  hasRole,
  isOwner,
  requireRole,
};
