/**
 * Script de Diagnóstico Profundo
 * Verifica:
 * 1. Conexão com Banco de Dados
 * 2. Existência de Técnicos
 * 3. Dados de Geolocalização
 * 4. Resposta da API
 */

const { Pool } = require('pg');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Carregar .env manualmente
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

// Configuração do Banco (Tenta pegar do .env ou usa padrão)
const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sistema_informatica',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
};

async function runDiagnostics() {
    console.log('🔍 INICIANDO DIAGNÓSTICO PROFUNDO...\n');

    // 1. Verificar Banco de Dados
    console.log('📊 1. Verificando Banco de Dados...');
    const pool = new Pool(dbConfig);

    try {
        const client = await pool.connect();
        console.log('   ✅ Conexão com banco estabelecida!');

        // Verificar tabela users
        const usersRes = await client.query("SELECT count(*) FROM users WHERE role = 'technician'");
        console.log(`   ℹ️  Total de usuários técnicos: ${usersRes.rows[0].count}`);

        // Verificar tabela technicians
        const techRes = await client.query(`
            SELECT t.*, u.name, u.email 
            FROM technicians t 
            JOIN users u ON t.user_id = u.id
        `);
        console.log(`   ℹ️  Total de perfis técnicos: ${techRes.rows.length}`);

        if (techRes.rows.length > 0) {
            console.log('\n   📋 Detalhes dos Técnicos:');
            techRes.rows.forEach(tech => {
                console.log(`   - ID: ${tech.id} | Nome: ${tech.name}`);
                console.log(`     Lat/Lng: ${tech.latitude}, ${tech.longitude}`);
                console.log(`     Endereço: ${tech.address_street}, ${tech.address_number} - ${tech.address_city}`);

                if (!tech.latitude || !tech.longitude) {
                    console.log('     ❌ ALERTA: Sem coordenadas!');
                } else {
                    console.log('     ✅ Coordenadas OK');
                }
            });
        } else {
            console.log('   ❌ ERRO: Nenhum técnico encontrado na tabela technicians!');
        }

        client.release();
    } catch (err) {
        console.error('   ❌ ERRO DE CONEXÃO COM BANCO:', err.message);
        console.log('   Dica: Verifique se as credenciais do banco estão corretas no .env');
    } finally {
        await pool.end();
    }

    // 2. Verificar API
    console.log('\n🌐 2. Verificando API Local...');

    const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/services/local?latitude=-23.55052&longitude=-46.633308&radius=50', // Raio grande para garantir
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`   Status da API: ${res.statusCode}`);

        let data = '';
        res.on('data', (chunk) => { data += chunk; });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log(`   Total retornado pela API: ${json.total}`);
                console.log(`   Serviços na lista: ${json.services ? json.services.length : 0}`);

                if (json.services && json.services.length > 0) {
                    console.log('\n   ✅ API retornou serviços!');
                    json.services.forEach(s => {
                        console.log(`   - ${s.name} (${s.distance}km)`);
                    });
                } else {
                    console.log('\n   ⚠️  API retornou 0 serviços.');
                    console.log('   Possíveis causas:');
                    console.log('   1. Distância maior que o raio (testado com 50km)');
                    console.log('   2. Filtros de categoria no backend');
                    console.log('   3. Erro na lógica de cálculo de distância');
                }
            } catch (e) {
                console.log('   ❌ Erro ao processar resposta da API:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`   ❌ Erro ao conectar na API: ${e.message}`);
        console.log('   O backend está rodando? (npm start)');
    });

    req.end();
}

runDiagnostics();
