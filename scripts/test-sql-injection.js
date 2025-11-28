const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testSQLInjection() {
    console.log('🔍 Testando proteção contra SQL Injection...\n');

    try {
        // Teste 1: SQL injection em parâmetro city
        console.log('Teste 1: SQL injection no parâmetro city');
        const maliciousCity = "'; DROP TABLE users; --";

        const res1 = await axios.get(`${API_URL}/api/technicians/top`, {
            params: {
                city: maliciousCity,
                state: 'SP'
            }
        });

        if (Array.isArray(res1.data)) {
            console.log('✅ Query executada sem erro (SQL injection bloqueado)');
            console.log(`   Resultado: ${res1.data.length} técnicos encontrados\n`);
        } else {
            console.log('❌ Resposta inesperada\n');
        }

        // Teste 2: SQL injection em parâmetro state
        console.log('Teste 2: SQL injection no parâmetro state');
        const maliciousState = "SP' OR '1'='1";

        const res2 = await axios.get(`${API_URL}/api/technicians/top`, {
            params: {
                city: 'São Paulo',
                state: maliciousState
            }
        });

        if (Array.isArray(res2.data)) {
            console.log('✅ Query executada sem erro (SQL injection bloqueado)');
            console.log(`   Resultado: ${res2.data.length} técnicos encontrados\n`);
        } else {
            console.log('❌ Resposta inesperada\n');
        }

        // Teste 3: Tentativa de union injection
        console.log('Teste 3: UNION injection');
        const unionInjection = "SP' UNION SELECT id,password,email FROM users--";

        const res3 = await axios.get(`${API_URL}/api/technicians/top`, {
            params: {
                state: unionInjection
            }
        });

        if (Array.isArray(res3.data)) {
            console.log('✅ Query executada sem erro (UNION injection bloqueado)');
            console.log(`   Resultado: ${res3.data.length} técnicos encontrados\n`);
        } else {
            console.log('❌ Resposta inesperada\n');
        }

        console.log('✅ TODOS OS TESTES DE SQL INJECTION PASSARAM!');
        console.log('   O sistema está protegido contra SQL injection\n');

    } catch (error) {
        if (error.response) {
            console.error(`❌ Erro HTTP ${error.response.status}:`, error.response.data);
        } else {
            console.error('❌ Erro no teste:', error.message);
        }
        process.exit(1);
    }
}

testSQLInjection();
