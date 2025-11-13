const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

// Criar diretório ssl se não existir
const sslDir = path.join(__dirname, 'ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir);
}

// Configurações do certificado
const attrs = [
  { name: 'commonName', value: '45.188.152.240' },
  { name: 'countryName', value: 'BR' },
  { name: 'stateOrProvinceName', value: 'State' },
  { name: 'localityName', value: 'City' },
  { name: 'organizationName', value: 'Sistema Informatica' }
];

const opts = {
  keySize: 2048,
  days: 365,
  algorithm: 'sha256',
  extensions: [
    {
      name: 'subjectAltName',
      altNames: [
        { type: 7, ip: '45.188.152.240' },
        { type: 2, value: 'localhost' },
        { type: 7, ip: '127.0.0.1' }
      ]
    }
  ]
};

// Gerar certificado
const pems = selfsigned.generate(attrs, opts);

// Salvar arquivos
fs.writeFileSync(path.join(sslDir, 'cert.pem'), pems.cert);
fs.writeFileSync(path.join(sslDir, 'key.pem'), pems.private);

console.log('Certificados SSL gerados com sucesso!');
console.log('- Certificado: ssl/cert.pem');
console.log('- Chave privada: ssl/key.pem');