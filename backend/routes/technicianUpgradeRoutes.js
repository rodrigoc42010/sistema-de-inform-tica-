const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createUpgradeRequest,
  listUpgradeRequests,
  getUpgradeRequest,
  cancelUpgradeRequest,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  listPendingRequests,
} = require('../controllers/technicianUpgradeController');

router.post('/request', protect, createUpgradeRequest);
router.get('/requests', protect, listUpgradeRequests);
router.get('/requests/:id', protect, getUpgradeRequest);
router.get('/pending', protect, listPendingRequests);
router.post('/requests/:id/cancel', protect, cancelUpgradeRequest);
router.post('/requests/:id/approve', protect, approveUpgradeRequest);
router.post('/requests/:id/reject', protect, rejectUpgradeRequest);
router.post('/:id/approve', protect, approveUpgradeRequest);
router.post('/:id/reject', protect, rejectUpgradeRequest);

module.exports = router;
