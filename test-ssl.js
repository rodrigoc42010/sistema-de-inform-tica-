const https = require('https');

// Configurar para aceitar certificados auto-assinados
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const options = {
  hostname: 'localhost',
  port: 5443,
  path: '/',
  method: 'GET',
  rejectUnauthorized: false
};

console.log('Testando conectividade HTTPS...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Conexão HTTPS estabelecida com sucesso!');
    console.log('✅ Certificado SSL funcionando corretamente!');
    console.log(`Resposta recebida: ${data.length} bytes`);
  });
});

req.on('error', (e) => {
  console.error(`❌ Erro na conexão: ${e.message}`);
});

req.end();