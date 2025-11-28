const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testRateLimiting() {
    console.log('🔍 Testando rate limiting em /api/users/login...\n');

    let successCount = 0;
    let blockedCount = 0;
    let errorCount = 0;

    for (let i = 1; i <= 15; i++) {
        try {
            const res = await axios.post(`${API_URL}/api/users/login`, {
                email: 'test@test.com',
                password: 'wrongpassword'
            });

            successCount++;
            console.log(`Requisição ${i}: ✅ Aceita (não deveria após 10 tentativas)`);

        } catch (error) {
            if (error.response?.status === 429) {
                blockedCount++;
                console.log(`Requisição ${i}: 🚫 Bloqueada por rate limit`);
            } else if (error.response?.status === 401) {
                errorCount++;
                console.log(`Requisição ${i}: ⚠️  Credenciais inválidas (esperado)`);
            } else {
                console.log(`Requisição ${i}: ❌ Erro inesperado:`, error.response?.status);
            }
        }

        // Pequeno delay entre requisições
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Resultados:');
    console.log(`   Aceitas: ${errorCount}`);
    console.log(`   Bloqueadas: ${blockedCount}`);
    console.log(`   Sucessos inesperados: ${successCount}`);

    if (blockedCount > 0) {
        console.log(`\n✅ Rate limiting funcionando (${blockedCount} requisições bloqueadas)`);
        console.log('   Proteção contra brute force ativa!\n');
    } else {
        console.log('\n❌ Rate limiting NÃO está funcionando');
        console.log('   ATENÇÃO: Sistema vulnerável a brute force!\n');
        process.exit(1);
    }
}

testRateLimiting();
