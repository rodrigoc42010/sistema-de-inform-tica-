const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminOnly');
const {
  listUpgradeRequests,
  listPendingRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  updateUserRole,
  listUsers,
  listTechnicians,
  listTickets,
  getSummary,
  blockUser,
  unblockUser,
  promoteTechnician,
  setTechnicianAvailability,
  getTicketDetail,
  updateTicketStatus,
  exportUsersCsv,
  exportTicketsCsv,
  exportPaymentsCsv,
  systemCheck,
} = require('../controllers/adminController');

router.get('/upgrade-requests', protect, adminOnly, listUpgradeRequests);
router.get('/technician-upgrades', protect, adminOnly, listUpgradeRequests);
router.get(
  '/upgrade-requests/pending',
  protect,
  adminOnly,
  listPendingRequests
);
router.get(
  '/technician-upgrades/pending',
  protect,
  adminOnly,
  listPendingRequests
);
router.post(
  '/upgrade-requests/:id/approve',
  protect,
  adminOnly,
  approveUpgradeRequest
);
router.post(
  '/upgrade-requests/:id/reject',
  protect,
  adminOnly,
  rejectUpgradeRequest
);

router.post('/users/:id/role', protect, adminOnly, updateUserRole);
router.get('/users', protect, adminOnly, listUsers);
router.get('/summary', protect, adminOnly, getSummary);
router.post('/users/:id/block', protect, adminOnly, blockUser);
router.post('/users/:id/unblock', protect, adminOnly, unblockUser);
router.post(
  '/users/:id/promote/technician',
  protect,
  adminOnly,
  promoteTechnician
);
router.get('/technicians', protect, adminOnly, listTechnicians);
router.post(
  '/technicians/:id/availability',
  protect,
  adminOnly,
  setTechnicianAvailability
);
router.get('/tickets', protect, adminOnly, listTickets);
router.get('/tickets/:id', protect, adminOnly, getTicketDetail);
router.put('/tickets/:id/status', protect, adminOnly, updateTicketStatus);
router.get('/health', protect, adminOnly, getHealth);

router.get('/export/users', protect, adminOnly, exportUsersCsv);
router.get('/export/tickets', protect, adminOnly, exportTicketsCsv);
router.get('/export/payments', protect, adminOnly, exportPaymentsCsv);
router.get('/system-check', protect, adminOnly, systemCheck);

module.exports = router;
