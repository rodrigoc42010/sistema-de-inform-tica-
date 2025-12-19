const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { protect } = require('../middlewares/AuthMiddleware');

router.get('/technicians', protect, userController.getTechnicians);
router.get('/technicians/nearby', protect, userController.getNearbyTechnicians);
router.get('/technicians/top', protect, userController.getTopTechnicians);
router.get('/profile', protect, userController.getProfile);

module.exports = router;
