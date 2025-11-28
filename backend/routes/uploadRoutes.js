const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const fs = require('fs').promises;

// Configuração do armazenamento para uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro inicial para tipos de arquivos permitidos
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

// Rota para upload de arquivos com validação de magic bytes
router.post('/', protect, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    // Validar tipo real do arquivo por magic bytes (se file-type estiver instalado)
    try {
      const FileType = require('file-type');
      const fileBuffer = await fs.readFile(req.file.path);
      const fileTypeResult = await FileType.fromBuffer(fileBuffer);

      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!fileTypeResult || !allowedMimes.includes(fileTypeResult.mime)) {
        // Deletar arquivo inválido
        await fs.unlink(req.file.path);

        // Log de segurança
        console.warn(`[SECURITY] Upload rejeitado: tipo inválido ${fileTypeResult?.mime || 'unknown'}`, {
          userId: req.user.id,
          filename: req.file.originalname
        });

        return res.status(400).json({
          message: 'Tipo de arquivo não permitido. Apenas imagens e documentos são aceitos.'
        });
      }

      console.log(`[UPLOAD] Arquivo validado com sucesso: ${fileTypeResult.mime}`, {
        userId: req.user.id,
        filename: req.file.filename
      });

      res.status(200).json({
        message: 'Arquivo enviado com sucesso',
        filePath: `/uploads/${req.file.filename}`,
        fileType: fileTypeResult.mime
      });
    } catch (fileTypeError) {
      // Se file-type não estiver instalado, usar validação básica
      console.warn('[UPLOAD] file-type não disponível, usando validação básica');
      res.status(200).json({
        message: 'Arquivo enviado com sucesso',
        filePath: `/uploads/${req.file.filename}`
      });
    }
  } catch (error) {
    console.error('[UPLOAD] Erro no upload de arquivo:', error.message);
    next(error);
  }
});

module.exports = router;