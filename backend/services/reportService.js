const { getPool } = require('../db/pgClient');

class ReportService {
  /**
   * Gera relatório agrupado por período
   * @param {string} table - Nome da tabela (tickets, payments)
   * @param {object} filters - Filtros (userId, role, from, to, status)
   * @param {string} groupBy - Agrupamento (day, month, year)
   * @param {string} sumField - Campo para somar (total_price, amount)
   */
  async generateReport(table, filters, groupBy = 'month', sumField = null) {
    const pool = getPool();
    const { userId, role, from, to, status } = filters;

    const where = [];
    const params = [];

    // Filtro de usuário
    if (role === 'client') {
      where.push(`client=$${params.length + 1}`);
    } else {
      where.push(`technician=$${params.length + 1}`);
    }
    params.push(userId);

    // Filtros de data
    if (from) {
      params.push(new Date(from));
      where.push(`created_at >= $${params.length}`);
    }
    if (to) {
      params.push(new Date(to));
      where.push(`created_at <= $${params.length}`);
    }

    // Filtro de status
    if (status) {
      params.push(status);
      where.push(`status=$${params.length}`);
    }

    // Bucket de agrupamento
    let bucket;
    if (groupBy === 'day') bucket = `TO_CHAR(created_at, 'YYYY-MM-DD')`;
    else if (groupBy === 'year') bucket = `TO_CHAR(created_at, 'YYYY')`;
    else bucket = `TO_CHAR(created_at, 'YYYY-MM')`;

    // Query
    const sumClause = sumField ? `, COALESCE(SUM(${sumField}),0) AS total` : '';
    const sql = `
      SELECT ${bucket} AS period, COUNT(*) AS count${sumClause}
      FROM ${table}
      WHERE ${where.join(' AND ')}
      GROUP BY period
      ORDER BY period ASC
    `;

    const rs = await pool.query(sql, params);
    return rs.rows;
  }
}

module.exports = new ReportService();
