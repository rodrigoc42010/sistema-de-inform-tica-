const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  loginTechnician,
  upgradeToTechnician,
  getMe,
  updateUserProfile,
  forgotPassword,
  verifyEmail,
  resendVerificationEmail,
  logoutUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { logLogin } = require('../middleware/auditLogger');
// Removido: módulos OAuth (passport/jwt/crypto para callbacks sociais)
// const passport = require('passport');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');

router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/technician-login', loginTechnician);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);
router.post('/upgrade-to-technician', protect, upgradeToTechnician);
router.post('/forgot-password', forgotPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerificationEmail);
router.post('/logout', protect, logoutUser);

// Removido: rotas de autenticação OAuth (Google e Microsoft)

module.exports = router;