const express = require('express');
const router = express.Router();
const adController = require('../controllers/AdController');
const { protect, authorize } = require('../middlewares/AuthMiddleware');

router.get('/public', adController.listPublic);
router.get('/', protect, adController.listActive);
router.get('/mine', protect, authorize('technician'), adController.getMyAds);
router.post('/', protect, authorize('technician'), adController.create);
router.post('/:id/pay', protect, authorize('technician'), adController.pay);
router.put('/:id', protect, authorize('technician'), adController.update);

module.exports = router;
