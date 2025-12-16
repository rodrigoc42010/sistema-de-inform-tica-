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