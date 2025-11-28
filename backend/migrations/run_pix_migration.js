const { getPool } = require('../db/pgClient');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const pool = getPool();
        const migrationPath = path.join(__dirname, 'add_pix_key_to_technicians.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🔄 Executando migração: add_pix_key_to_technicians.sql');
        await pool.query(sql);
        console.log('✅ Migração executada com sucesso!');
        console.log('   - Coluna pix_key adicionada à tabela technicians');

        process.exit(0);
    } catch (err) {
        console.error('❌ Erro ao executar migração:', err.message);
        process.exit(1);
    }
}

runMigration();
