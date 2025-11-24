/**
 * Script simples para testar se o endpoint existe
 */

const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/services/local?latitude=-23.55052&longitude=-46.633308&radius=10',
    method: 'GET'
};

console.log('🔍 Testando conexão com backend...\n');
console.log(`URL: http://${options.hostname}:${options.port}${options.path}\n`);

const req = http.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n📦 Resposta:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('\n❌ Erro de conexão:');
    console.error(error.message);
    console.error('\n💡 Possíveis causas:');
    console.error('   1. Backend não está rodando');
    console.error('   2. Porta 5001 está bloqueada ou em uso');
    console.error('   3. Firewall bloqueando a conexão');
    console.error('\n🔧 Solução:');
    console.error('   cd backend');
    console.error('   npm start');
});

req.end();
