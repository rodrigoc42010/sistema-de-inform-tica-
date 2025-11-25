const { Pool } = require('pg');

const connectionString = 'postgresql://sistema_informatica_user:DmDgHGGfmvjrdtq80id9G3IeiZLbfSlE@dpg-d4ic2svgi27c73affmrg-a.oregon-postgres.render.com/sistema_informatica?ssl=true';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function verifySchema() {
    console.log('Conectando ao banco do Render...');
    try {
        const client = await pool.connect();
        console.log('Conectado com sucesso!');

        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'technicians'
      ORDER BY column_name;
    `);

        console.log('\nColunas encontradas na tabela technicians:');
        const columns = res.rows.map(r => r.column_name);
        console.table(res.rows);

        const requiredColumns = [
            'latitude', 'longitude', 'address_street', 'address_city',
            'business_name', 'services', 'specialties'
        ];

        const missing = requiredColumns.filter(c => !columns.includes(c));

        if (missing.length > 0) {
            console.error('\n❌ FALTAM COLUNAS CRÍTICAS:', missing.join(', '));
            console.log('A migração NÃO funcionou corretamente.');
        } else {
            console.log('\n✅ TODAS AS COLUNAS ESTÃO PRESENTES!');
            console.log('O banco de dados está correto. O problema pode ser no código.');
        }

        client.release();
    } catch (err) {
        console.error('Erro ao conectar:', err.message);
    } finally {
        await pool.end();
    }
}

verifySchema();
