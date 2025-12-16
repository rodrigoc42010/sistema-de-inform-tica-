const User = require('../models/User');
const Technician = require('../models/Technician');
const Ticket = require('../models/Ticket');

module.exports = {
  async getUsers(req, res) {
    const users = await User.find();
    res.json(users);
  },

  async getTechnicians(req, res) {
    const technicians = await Technician.find();
    res.json(technicians);
  },

  async getTickets(req, res) {
    const tickets = await Ticket.find();
    res.json(tickets);
  },

  async approveUpgrade(req, res) {
    const { id } = req.params;

    await Technician.findByIdAndUpdate(id, { approved: true });

    res.json({ message: 'Upgrade aprovado com sucesso' });
  }
};