const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');

// Configuração do armazenamento para uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Filtro para tipos de arquivos permitidos
const fileFilter = (req, file, cb) => {
  // Aceitar imagens e documentos comuns
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Apenas imagens e documentos são permitidos'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter
});

// Rota para upload de arquivos
router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado' });
  }
  
  res.status(200).json({
    message: 'Arquivo enviado com sucesso',
    filePath: `/uploads/${req.file.filename}`
  });
});

module.exports = router;