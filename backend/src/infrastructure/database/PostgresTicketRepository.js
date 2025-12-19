const { getPool } = require('../../../db/pgClient');
const Ticket = require('../../domain/Ticket');

class PostgresTicketRepository {
  constructor() {
    this.pool = getPool();
  }

  async create(ticket, client = null) {
    const db = client || this.pool;
    const rs = await db.query(
      `INSERT INTO tickets (
        title, description, client_id, technician_id, status, priority, 
        device_type, device_brand, device_model, serial_number, pickup_requested
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        ticket.title,
        ticket.description,
        ticket.clientId,
        ticket.technicianId,
        ticket.status,
        ticket.priority,
        ticket.deviceType,
        ticket.deviceBrand,
        ticket.deviceModel,
        ticket.serialNumber,
        ticket.pickupRequested,
      ]
    );
    return this._mapToEntity(rs.rows[0]);
  }

  async addAttachment(attachment, client = null) {
    const db = client || this.pool;
    await db.query(
      `INSERT INTO ticket_attachments (ticket_id, file_name, file_path, file_type, file_size, uploaded_by) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        attachment.ticketId,
        attachment.fileName,
        attachment.filePath,
        attachment.fileType,
        attachment.fileSize,
        attachment.uploadedBy,
      ]
    );
  }

  async findById(id) {
    const rs = await this.pool.query(
      'SELECT * FROM tickets WHERE id = $1 LIMIT 1',
      [id]
    );
    if (rs.rowCount === 0) return null;
    return this._mapToEntity(rs.rows[0]);
  }

  _mapToEntity(row) {
    return new Ticket({
      id: row.id,
      title: row.title,
      description: row.description,
      clientId: row.client_id,
      technicianId: row.technician_id,
      status: row.status,
      priority: row.priority,
      deviceType: row.device_type,
      deviceBrand: row.device_brand,
      deviceModel: row.device_model,
      serialNumber: row.serial_number,
      pickupRequested: row.pickup_requested,
      totalPrice: row.total_price,
      paymentStatus: row.payment_status,
      completionDate: row.completion_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = new PostgresTicketRepository();
