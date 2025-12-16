const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  loginTechnician,
  upgradeToTechnician,
  getMe,
  updateUserProfile,
  updateUserSettings,
  forgotPassword,
  verifyEmail,
  resendVerificationEmail,
  logoutUser,
  getTechnicians,
  getDebug,
  listSessions,
  revokeSession,
  twofaInit,
  twofaVerify,
  twofaDisable,
  refreshToken,
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
router.get('/technicians', protect, getTechnicians);
router.get('/me', protect, getMe);
router.get('/debug', getDebug);
router.put('/profile', protect, updateUserProfile);
router.put('/settings', protect, updateUserSettings);
router.get('/sessions', protect, listSessions);
router.post('/sessions/revoke', protect, revokeSession);
router.post('/2fa/init', protect, twofaInit);
router.post('/2fa/verify', protect, twofaVerify);
router.post('/2fa/disable', protect, twofaDisable);
router.post('/upgrade-to-technician', protect, upgradeToTechnician);
router.post('/forgot-password', forgotPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerificationEmail);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logoutUser);

const {
  createUpgradeRequest,
  listUpgradeRequests,
  getUpgradeRequest,
  cancelUpgradeRequest,
  approveUpgradeRequest,
  rejectUpgradeRequest,
} = require('../controllers/technicianUpgradeController');

router.post('/upgrade-request', protect, createUpgradeRequest);
router.get('/upgrade-requests', protect, listUpgradeRequests);
router.get('/upgrade-requests/:id', protect, getUpgradeRequest);
router.post('/upgrade-requests/:id/cancel', protect, cancelUpgradeRequest);
router.post('/upgrade-requests/:id/approve', protect, approveUpgradeRequest);
router.post('/upgrade-requests/:id/reject', protect, rejectUpgradeRequest);

// Removido: rotas de autenticação OAuth (Google e Microsoft)

module.exports = router;
