const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!DATABASE_URL) {
  console.error('[backup] ERRO: DATABASE_URL/POSTGRES_URL não definido no arquivo .env');
  process.exit(1);
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:]/g, '-')
  .replace('T', '_')
  .split('.')[0];

const backupsDir = path.resolve(__dirname, '..', 'backups');
const outputFile = path.join(backupsDir, `pg_backup_${timestamp}.sql`);

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

console.log(`[backup] Iniciando backup para ${outputFile}`);

const args = ['--no-owner', '--no-privileges', '--format=plain', `--file=${outputFile}`, DATABASE_URL];
const pgdump = spawn('pg_dump', args, { shell: true });

pgdump.stdout.on('data', (data) => process.stdout.write(data));
pgdump.stderr.on('data', (data) => process.stderr.write(data));
pgdump.on('close', (code) => {
  if (code === 0) {
    console.log(`\n[backup] Backup concluído com sucesso em: ${outputFile}`);
  } else {
    console.error(`\n[backup] Falha no backup. Código de saída: ${code}`);
    process.exit(code);
  }
});