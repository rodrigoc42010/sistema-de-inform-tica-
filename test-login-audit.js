const https = require('https');
const fs = require('fs');
const path = require('path');

// Configurar para aceitar certificados auto-assinados
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Função para fazer requisição de teste
function testLogin(email, password, isValid = true) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: email,
      password: password
    });

    const options = {
      hostname: 'localhost',
      port: 5443,
      path: '/api/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'TestScript/1.0 (Audit Test)'
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n🧪 Teste de Login - ${isValid ? 'Válido' : 'Inválido'}`);
        console.log(`📧 Email: ${email}`);
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📝 Resposta: ${data.substring(0, 100)}...`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Erro na requisição: ${error.message}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Função para ler logs de auditoria
function readAuditLogs() {
  const logPath = path.join(__dirname, 'logs', 'login-audit.log');
  
  if (fs.existsSync(logPath)) {
    console.log('\n📋 LOGS DE AUDITORIA:');
    console.log('=' .repeat(50));
    
    const logs = fs.readFileSync(logPath, 'utf8');
    const lines = logs.trim().split('\n');
    
    // Mostrar apenas os últimos 5 logs
    const recentLogs = lines.slice(-5);
    
    recentLogs.forEach((line, index) => {
      if (line.trim()) {
        try {
          const logEntry = JSON.parse(line);
          console.log(`\n📅 ${logEntry.timestamp}`);
          console.log(`🎯 Evento: ${logEntry.event}`);
          console.log(`👤 Usuário: ${logEntry.user?.email || 'N/A'}`);
          console.log(`🌐 IP: ${logEntry.connection?.ip || 'N/A'}`);
          console.log(`✅ Sucesso: ${logEntry.success ? 'Sim' : 'Não'}`);
          if (logEntry.reason) {
            console.log(`❌ Motivo: ${logEntry.reason}`);
          }
        } catch (e) {
          console.log(`📝 Log: ${line}`);
        }
      }
    });
  } else {
    console.log('\n⚠️  Arquivo de log não encontrado ainda.');
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 INICIANDO TESTES DE AUDITORIA DE LOGIN');
  console.log('=' .repeat(50));
  
  try {
    // Teste 1: Login inválido (email inexistente)
    await testLogin('teste@inexistente.com', 'senha123', false);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 2: Login inválido (senha errada)
    await testLogin('admin@teste.com', 'senhaerrada', false);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 3: Tentativa com email válido mas senha errada
    await testLogin('user@example.com', 'wrongpassword', false);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n⏳ Aguardando processamento dos logs...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Ler e exibir logs de auditoria
    readAuditLogs();
    
    console.log('\n✅ TESTES CONCLUÍDOS!');
    console.log('📊 Verifique os logs acima para confirmar que a auditoria está funcionando.');
    console.log('🔍 IP mascarado deve aparecer como 192.168.1.100 para o IP 45.188.152.240');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Executar
runTests();