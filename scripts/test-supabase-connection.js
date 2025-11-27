const { Pool } = require('pg');

const connectionString = 'postgresql://app_user:TreaInformatica2025!Supabase@db.pzxrojxhipxkyotafeig.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

async function testConnection() {
    console.log('🔌 Testando conexão com Supabase...');
    try {
        const client = await pool.connect();
        console.log('✅ Conexão bem-sucedida!');

        // Test SELECT
        console.log('🔍 Testando SELECT na tabela users...');
        const res = await client.query('SELECT count(*) FROM users');
        console.log(`✅ SELECT funcionou! Total de usuários: ${res.rows[0].count}`);

        // Test INSERT (Rollback)
        console.log('📝 Testando permissão de INSERT...');
        await client.query('BEGIN');
        const insertRes = await client.query(`
      INSERT INTO users (name, email, password, role, phone) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id
    `, ['Teste Conexão', `teste_${Date.now()}@test.com`, 'senha123', 'client', '11999999999']);
        console.log(`✅ INSERT funcionou! ID gerado: ${insertRes.rows[0].id}`);

        await client.query('ROLLBACK');
        console.log('🔄 Rollback realizado (dados de teste removidos).');

        client.release();
    } catch (err) {
        console.error('❌ ERRO:', err.message);
        if (err.code) console.error('   Código do erro Postgres:', err.code);
    } finally {
        await pool.end();
    }
}

testConnection();
