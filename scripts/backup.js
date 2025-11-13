// Simple MongoDB backup script using mongodump
// Usage: npm run backup

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('[backup] ERRO: MONGO_URI não definido no arquivo .env');
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:]/g, '-')
  .replace('T', '_')
  .split('.')[0];

const backupsDir = path.resolve(__dirname, '..', 'backups');
const outputDir = path.join(backupsDir, timestamp);

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

console.log(`[backup] Iniciando backup para ${outputDir}`);

const mongodump = spawn('mongodump', ['--uri', MONGO_URI, '--out', outputDir], {
  shell: true,
});

mongodump.stdout.on('data', (data) => process.stdout.write(data));

mongodump.stderr.on('data', (data) => process.stderr.write(data));

mongodump.on('close', (code) => {
  if (code === 0) {
    console.log(`\n[backup] Backup concluído com sucesso em: ${outputDir}`);
  } else {
    console.error(`\n[backup] Falha no backup. Código de saída: ${code}`);
    process.exit(code);
  }
});