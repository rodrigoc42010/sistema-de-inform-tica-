const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class LocalFileStorage {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../../../uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(file) {
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    // In a real enterprise app, we'd use S3 or similar
    // For now, we use local storage but with a clean interface
    fs.renameSync(file.path, filePath);

    return {
      fileName: file.originalname,
      filePath: `/uploads/${fileName}`,
      fileType: file.mimetype,
      fileSize: file.size,
    };
  }

  async delete(filePath) {
    const fullPath = path.join(__dirname, '../../../../', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

module.exports = new LocalFileStorage();
