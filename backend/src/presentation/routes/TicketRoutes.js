const express = require('express');
const router = express.Router();
const multer = require('multer');
const os = require('os');
const ticketController = require('../controllers/TicketController');
const { protect } = require('../middlewares/AuthMiddleware');

// Configure multer for temporary storage
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post(
  '/',
  protect,
  upload.array('attachments', 5),
  ticketController.create
);

module.exports = router;
