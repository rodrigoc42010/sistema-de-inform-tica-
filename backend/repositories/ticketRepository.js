const { getPool } = require('../db/pgClient');

class TicketRepository {
  /**
   * Busca ticket por ID
   * @param {string} id - ID do ticket
   * @returns {Promise<Object|null>} Ticket ou null se não encontrado
   */
  async findById(id) {
    const pool = getPool();
    const rs = await pool.query('SELECT * FROM tickets WHERE id=$1 LIMIT 1', [
      id,
    ]);
    return rs.rowCount > 0 ? rs.rows[0] : null;
  }

  /**
   * Busca tickets de um cliente
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Array>} Lista de tickets
   */
  async findAllByClient(clientId) {
    const pool = getPool();
    const rs = await pool.query(
      'SELECT * FROM tickets WHERE client=$1 ORDER BY created_at DESC',
      [clientId]
    );
    return rs.rows;
  }

  /**
   * Busca tickets de um técnico
   * @param {string} technicianId - ID do técnico
   * @returns {Promise<Array>} Lista de tickets
   */
  async findAllByTechnician(technicianId) {
    const pool = getPool();
    const rs = await pool.query(
      'SELECT * FROM tickets WHERE technician=$1 ORDER BY created_at DESC',
      [technicianId]
    );
    return rs.rows;
  }
}

module.exports = new TicketRepository();
