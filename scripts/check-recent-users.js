const { Pool } = require('pg');

const connectionString = 'postgresql://sistema_informatica_user:DmDgHGGfmvjrdtq80id9G3IeiZLbfSlE@dpg-d4ic2svgi27c73affmrg-a.oregon-postgres.render.com/sistema_informatica?ssl=true';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
    console.log('🔍 Verificando últimos usuários cadastrados no Render...\n');
    try {
        const client = await pool.connect();

        const res = await client.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.created_at,
        t.id as tech_id,
        t.latitude,
        t.longitude,
        t.business_name
      FROM users u
      LEFT JOIN technicians t ON u.id = t.user_id
      ORDER BY u.created_at DESC
      LIMIT 5;
    `);

        if (res.rows.length === 0) {
            console.log('Nenhum usuário encontrado.');
        } else {
            console.table(res.rows.map(u => ({
                Name: u.name,
                Email: u.email,
                Role: u.role,
                'Tech ID': u.tech_id ? '✅ EXISTE' : '❌ AUSENTE',
                'Location': u.latitude ? '✅ OK' : (u.tech_id ? '❌ SEM DADOS' : 'N/A'),
                Created: new Date(u.created_at).toLocaleString()
            })));
        }

        console.log('\n--- DIAGNÓSTICO ---');
        const lastUser = res.rows[0];
        if (lastUser) {
            if (lastUser.role === 'client') {
                console.log(`⚠️ O último usuário (${lastUser.email}) está como CLIENTE.`);
                console.log('   Isso explica por que ele vê o painel de cliente.');
                console.log('   SOLUÇÃO: Crie uma nova conta AGORA que o banco está corrigido.');
            } else if (lastUser.role === 'technician' && !lastUser.tech_id) {
                console.log(`❌ O usuário é TÉCNICO mas não tem dados na tabela technicians.`);
                console.log('   Isso não deveria acontecer se a migração rodou.');
            } else if (lastUser.role === 'technician' && lastUser.tech_id) {
                console.log(`✅ O usuário parece estar correto no banco!`);
                console.log('   Se ainda vê erro, pode ser cache do navegador ou login antigo.');
            }
        }

        client.release();
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await pool.end();
    }
}

checkUsers();
