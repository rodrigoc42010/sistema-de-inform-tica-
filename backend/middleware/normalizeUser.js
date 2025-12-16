/**
 * NORMALIZE USER MIDDLEWARE
 *
 * Middleware para normalizar dados do usuário autenticado.
 * Elimina duplicação de: req.user.id || req.user._id
 *
 * Adiciona ao request:
 *   - req.userId: ID do usuário (normalizado)
 *   - req.userRole: Role do usuário
 *
 * Uso: Adicionar após middleware de autenticação (protect)
 */

const normalizeUser = (req, res, next) => {
  if (req.user) {
    // Normalizar ID do usuário
    req.userId = req.user.id || req.user._id;

    // Normalizar role
    req.userRole = req.user.role;

    // Manter req.user original para compatibilidade
  }

  next();
};

module.exports = { normalizeUser };
