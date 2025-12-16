/**
 * ITEM 14 - BACKEND ADMIN
 * Criação automática de middleware, controller e rotas admin
 */

const fs = require("fs");
const path = require("path");

console.log("🚀 Iniciando Item 14 - Backend Admin");

const base = process.cwd();

const paths = {
  middleware: path.join(base, "src/middlewares"),
  controllers: path.join(base, "src/controllers"),
  routes: path.join(base, "src/routes")
};

// Garante pastas
Object.values(paths).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/* =========================
   Middleware requireAdmin
========================= */
fs.writeFileSync(
  path.join(paths.middleware, "requireAdmin.js"),
  `
module.exports = (req, res, next) => {
  const user = req.user;

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso restrito a administradores' });
  }

  next();
};
`.trim()
);

/* =========================
   Admin Controller
========================= */
fs.writeFileSync(
  path.join(paths.controllers, "adminController.js"),
  `
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
`.trim()
);

/* =========================
   Admin Routes
========================= */
fs.writeFileSync(
  path.join(paths.routes, "admin.routes.js"),
  `
const router = require('express').Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');

router.use(auth, requireAdmin);

router.get('/users', adminController.getUsers);
router.get('/technicians', adminController.getTechnicians);
router.get('/tickets', adminController.getTickets);
router.patch('/technicians/:id/approve', adminController.approveUpgrade);

module.exports = router;
`.trim()
);

console.log("✅ Item 14 finalizado com sucesso!");
