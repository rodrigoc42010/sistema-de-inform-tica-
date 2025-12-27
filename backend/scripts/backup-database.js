const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { backupPath } = require('../src/infrastructure/config/appConfig');

const BACKUP_DIR = backupPath;
const MAX_BACKUPS = 7;

async function backupDatabase() {
  // Criar diretório de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const filename = `backup_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  // Executar pg_dump
  // Nota: Assume que pg_dump está no PATH ou configurado via PG_DUMP_PATH
  const pgDumpPath = process.env.PG_DUMP_PATH || 'pg_dump';
  const command = `"${pgDumpPath}" "${process.env.DATABASE_URL}" > "${filepath}"`;

  return new Promise((resolve, reject) => {
    console.log(`Iniciando backup em: ${filepath}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Erro no backup:', error);
        console.error('Stderr:', stderr);
        reject(error);
      } else {
        console.log(`Backup criado com sucesso: ${filename}`);
        cleanOldBackups();
        resolve(filepath);
      }
    });
  });
}

function cleanOldBackups() {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => ({
        name: f,
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.time - a.time);
    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      for (const f of toDelete) {
        const fp = path.join(BACKUP_DIR, f.name);
        try {
          fs.unlinkSync(fp);
          console.log(`Backup antigo removido: ${f.name}`);
        } catch {}
      }
    }
  } catch (error) {
    console.error('Erro ao limpar backups antigos:', error);
  }
}

module.exports = { backupDatabase };
