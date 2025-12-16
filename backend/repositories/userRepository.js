/**
 * USER REPOSITORY
 *
 * Camada de acesso a dados para usuários.
 * Centraliza queries SQL relacionadas a usuários.
 *
 * FONTE ÚNICA DE VERDADE para queries de usuário.
 */

const { getPool } = require('../db/pgClient');

class UserRepository {
  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>} Usuário ou null se não encontrado
   */
  async findByEmail(email) {
    const pool = getPool();
    const rs = await pool.query('SELECT * FROM users WHERE email=$1 LIMIT 1', [
      email,
    ]);
    return rs.rowCount > 0 ? rs.rows[0] : null;
  }

  /**
   * Busca usuário por ID
   * @param {string|number} id - ID do usuário
   * @returns {Promise<Object|null>} Usuário ou null se não encontrado
   */
  async findById(id) {
    const pool = getPool();
    const rs = await pool.query('SELECT * FROM users WHERE id=$1 LIMIT 1', [
      id,
    ]);
    return rs.rowCount > 0 ? rs.rows[0] : null;
  }

  /**
   * Busca usuário por CPF/CNPJ
   * @param {string} cpfCnpj - CPF ou CNPJ do usuário
   * @param {string} role - Role opcional para filtrar (client, technician)
   * @returns {Promise<Object|null>} Usuário ou null se não encontrado
   */
  async findByCpfCnpj(cpfCnpj, role = null) {
    const pool = getPool();

    if (role) {
      const rs = await pool.query(
        'SELECT * FROM users WHERE cpf_cnpj=$1 AND role=$2 LIMIT 1',
        [cpfCnpj, role]
      );
      return rs.rowCount > 0 ? rs.rows[0] : null;
    }

    const rs = await pool.query(
      'SELECT * FROM users WHERE cpf_cnpj=$1 LIMIT 1',
      [cpfCnpj]
    );
    return rs.rowCount > 0 ? rs.rows[0] : null;
  }

  /**
   * Verifica se usuário existe por email
   * @param {string} email - Email do usuário
   * @returns {Promise<boolean>} True se existe
   */
  async existsByEmail(email) {
    const pool = getPool();
    const rs = await pool.query('SELECT id FROM users WHERE email=$1 LIMIT 1', [
      email,
    ]);
    return rs.rowCount > 0;
  }

  /**
   * Atualiza tentativas de login falhadas
   * @param {string|number} id - ID do usuário
   * @param {number} attempts - Número de tentativas
   * @param {Date|null} lockUntil - Data de bloqueio ou null
   */
  async updateFailedAttempts(id, attempts, lockUntil = null) {
    const pool = getPool();
    await pool.query(
      'UPDATE users SET failed_login_attempts=$1, lock_until=$2 WHERE id=$3',
      [attempts, lockUntil, id]
    );
  }

  /**
   * Reseta tentativas de login e atualiza último login
   * @param {string|number} id - ID do usuário
   */
  async resetFailedAttemptsAndUpdateLogin(id) {
    const pool = getPool();
    await pool.query(
      'UPDATE users SET failed_login_attempts=0, lock_until=NULL, last_login_at=NOW() WHERE id=$1',
      [id]
    );
  }

  /**
   * Atualiza JTI atual do usuário
   * @param {string|number} id - ID do usuário
   * @param {string} jti - JTI do token
   */
  async updateCurrentJti(id, jti) {
    const pool = getPool();
    await pool.query('UPDATE users SET current_jti=$1 WHERE id=$2', [jti, id]);
  }
  /**
   * Busca usuário por token de verificação de email válido
   * @param {string} token - Token de verificação
   * @returns {Promise<Object|null>} Usuário ou null se não encontrado/expirado
   */
  async findByVerificationToken(token) {
    const pool = getPool();
    const rs = await pool.query(
      'SELECT id FROM users WHERE email_verification_token=$1 AND email_verification_expires > NOW() LIMIT 1',
      [token]
    );
    return rs.rowCount > 0 ? rs.rows[0] : null;
  }
}

// Exportar instância singleton
module.exports = new UserRepository();
