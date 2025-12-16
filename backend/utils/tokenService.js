/**
 * TOKEN SERVICE - GERAÇÃO CENTRALIZADA DE TOKENS JWT
 *
 * FONTE ÚNICA DE VERDADE para geração de tokens.
 * Elimina duplicação de 3 funções (generateToken, generateAccessToken, generateRefreshToken).
 *
 * Factory Pattern: createToken(user, type, options)
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Cria um token JWT com configuração unificada
 *
 * @param {Object} user - Objeto do usuário (deve conter id)
 * @param {String} type - Tipo do token: 'simple', 'access', 'refresh'
 * @param {Object} options - Opções adicionais (expiresIn, jti)
 * @returns {String|Object} Token ou objeto com token e JTI
 */
function createToken(user, type = 'simple', options = {}) {
  const userId = user.id || user._id;

  if (!userId) {
    throw new Error('User ID is required to generate token');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  // Configurações padrão por tipo
  const configs = {
    simple: {
      expiresIn: '12h',
      payload: { id: userId },
    },
    access: {
      expiresIn: '15m',
      payload: { id: userId, type: 'access' },
      includeJti: true,
    },
    refresh: {
      expiresIn: '7d',
      payload: { id: userId, type: 'refresh' },
      includeJti: true,
    },
  };

  const config = configs[type];
  if (!config) {
    throw new Error(
      `Invalid token type: ${type}. Use 'simple', 'access', or 'refresh'`
    );
  }

  // Merge de opções customizadas
  const expiresIn = options.expiresIn || config.expiresIn;
  const payload = { ...config.payload, ...(options.payload || {}) };

  // Adicionar JTI se necessário
  let jti = null;
  if (config.includeJti || options.includeJti) {
    jti = options.jti || crypto.randomBytes(16).toString('hex');
    payload.jti = jti;
  }

  // Gerar token
  const token = jwt.sign(payload, secret, { expiresIn });

  // Retornar token simples ou com JTI
  if (jti) {
    return { token, jti };
  }
  return token;
}

/**
 * Helpers para manter compatibilidade com código existente
 */
function generateToken(userId) {
  return createToken({ id: userId }, 'simple');
}

function generateAccessToken(user) {
  return createToken(user, 'access');
}

function generateRefreshToken(user) {
  return createToken(user, 'refresh');
}

module.exports = {
  createToken,
  generateToken,
  generateAccessToken,
  generateRefreshToken,
};
