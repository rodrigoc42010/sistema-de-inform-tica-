const { getPool } = require('../db/pgClient');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const pool = getPool();
        const migrationPath = path.join(__dirname, 'enable_rls_security.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🔒 Executando migração de segurança: enable_rls_security.sql');
        await pool.query(sql);
        console.log('✅ RLS habilitado com sucesso em todas as tabelas!');
        console.log('   - As tabelas agora estão protegidas contra acesso público não autorizado.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Erro ao executar migração de segurança:', err.message);
        process.exit(1);
    }
}

runMigration();
