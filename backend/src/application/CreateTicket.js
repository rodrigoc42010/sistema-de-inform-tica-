const { getPool } = require('../../db/pgClient');
const ticketRepository = require('../infrastructure/database/PostgresTicketRepository');
const fileStorage = require('../infrastructure/external/LocalFileStorage');

class CreateTicket {
  async execute({ ticketData, files, clientId }) {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Create Ticket
      const ticket = await ticketRepository.create(
        {
          ...ticketData,
          clientId,
        },
        client
      );

      // 2. Handle Attachments
      if (files && files.length > 0) {
        for (const file of files) {
          const storedFile = await fileStorage.save(file);
          await ticketRepository.addAttachment(
            {
              ticketId: ticket.id,
              fileName: storedFile.fileName,
              filePath: storedFile.filePath,
              fileType: storedFile.fileType,
              fileSize: storedFile.fileSize,
              uploadedBy: clientId,
            },
            client
          );
        }
      }

      await client.query('COMMIT');
      return ticket;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new CreateTicket();
