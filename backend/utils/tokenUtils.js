const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getPool } = require('../db/pgClient');

/**
 * Gera um access token JWT de curta duração (15 minutos)
 * @param {Object} user - Objeto do usuário
 * @returns {string} Access token JWT
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      jti: crypto.randomUUID(),
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Gera um refresh token JWT de longa duração (30 dias)
 * @param {Object} user - Objeto do usuário
 * @returns {Object} { token, jti, expiresAt }
 */
function generateRefreshToken(user) {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

  const token = jwt.sign(
    {
      id: user.id,
      type: 'refresh',
      jti,
    },
    process.env.REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { token, jti, expiresAt };
}

/**
 * Armazena refresh token no banco de dados
 * @param {number} userId - ID do usuário
 * @param {string} token - Refresh token
 * @param {string} jti - JWT ID
 * @param {Date} expiresAt - Data de expiração
 * @param {string} ipAddress - IP do cliente
 * @param {string} userAgent - User agent do cliente
 */
async function storeRefreshToken(
  userId,
  token,
  jti,
  expiresAt,
  ipAddress,
  userAgent
) {
  const pool = getPool();

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, jti, expires_at, ip_address, user_agent) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, token, jti, expiresAt, ipAddress, userAgent]
  );
}

/**
 * Revoga um refresh token específico
 * @param {string} token - Refresh token a ser revogado
 */
async function revokeRefreshToken(token) {
  const pool = getPool();

  await pool.query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1',
    [token]
  );
}

/**
 * Revoga todos os refresh tokens de um usuário
 * @param {number} userId - ID do usuário
 */
async function revokeAllUserTokens(userId) {
  const pool = getPool();

  await pool.query(
    'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1 AND revoked = FALSE',
    [userId]
  );
}

/**
 * Verifica e valida um refresh token
 * @param {string} token - Refresh token a ser verificado
 * @returns {Object} { decoded, dbToken }
 * @throws {Error} Se o token for inválido ou expirado
 */
async function verifyRefreshToken(token) {
  const pool = getPool();

  // Verificar JWT
  const decoded = jwt.verify(
    token,
    process.env.REFRESH_SECRET || process.env.JWT_SECRET
  );

  // Verificar tipo de token
  if (decoded.type !== 'refresh') {
    throw new Error('Token inválido: não é um refresh token');
  }

  // Verificar no banco de dados
  const result = await pool.query(
    `SELECT * FROM refresh_tokens 
     WHERE token = $1 AND revoked = FALSE AND expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Refresh token inválido, revogado ou expirado');
  }

  return { decoded, dbToken: result.rows[0] };
}

/**
 * Limpa refresh tokens expirados do banco (manutenção)
 */
async function cleanExpiredTokens() {
  const pool = getPool();

  const result = await pool.query(
    'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
  );

  return result.rowCount;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  verifyRefreshToken,
  cleanExpiredTokens,
};
