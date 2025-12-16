const { getPool } = require('../db/pgClient');

class PaymentRepository {
  /**
   * Busca pagamento por ID
   * @param {string} id - ID do pagamento
   * @returns {Promise<Object|null>} Pagamento ou null se não encontrado
   */
  async findById(id) {
    const pool = getPool();
    const rs = await pool.query('SELECT * FROM payments WHERE id=$1 LIMIT 1', [
      id,
    ]);
    return rs.rowCount > 0 ? rs.rows[0] : null;
  }
}

module.exports = new PaymentRepository();
