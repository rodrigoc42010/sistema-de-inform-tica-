const createTicket = require('../../application/CreateTicket');
const asyncHandler = require('express-async-handler');

class TicketController {
  create = asyncHandler(async (req, res) => {
    const clientId = req.user.id;
    const ticketData = req.body;
    const files = req.files;

    const ticket = await createTicket.execute({
      ticketData,
      files,
      clientId,
    });

    res.status(201).json({
      success: true,
      ticket,
    });
  });

  // Other methods like list, getById, updateStatus, etc.
}

module.exports = new TicketController();
