const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { getPool } = require('../db/pgClient');

async function runMigration() {
  const migrationPath = path.join(
    __dirname,
    '../migrations/create_refresh_tokens_table.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Executando migração:', migrationPath);

  const pool = getPool();
  try {
    await pool.query(sql);
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
