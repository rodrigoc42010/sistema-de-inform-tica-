/**
 * Script para testar o endpoint de serviços locais
 * Testa a API /api/services/local
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testLocalServicesAPI() {
    console.log('🧪 Testando API de Serviços Locais\n');

    try {
        // Teste 1: Buscar serviços próximos a São Paulo
        console.log('📍 Teste 1: Buscar serviços em São Paulo');
        const response = await axios.get(`${BASE_URL}/api/services/local`, {
            params: {
                latitude: -23.55052,
                longitude: -46.633308,
                radius: 10
            }
        });

        console.log('✅ Status:', response.status);
        console.log('📊 Dados recebidos:');
        console.log('   - Total de serviços:', response.data.total);
        console.log('   - Serviços cadastrados:', response.data.registered);
        console.log('   - Serviços externos (Google Places):', response.data.external);
        console.log('   - Localização do usuário:', response.data.userLocation);
        console.log('   - Raio de busca:', response.data.radius, 'km');

        if (response.data.services && response.data.services.length > 0) {
            console.log('\n📋 Primeiros 3 serviços encontrados:');
            response.data.services.slice(0, 3).forEach((service, index) => {
                console.log(`\n   ${index + 1}. ${service.name}`);
                console.log(`      - Distância: ${service.distance} km`);
                console.log(`      - Avaliação: ${service.rating || 'N/A'}`);
                console.log(`      - Cadastrado: ${service.isRegistered ? 'Sim' : 'Não'}`);
                console.log(`      - Fonte: ${service.source}`);
                if (service.address) console.log(`      - Endereço: ${service.address}`);
            });
        } else {
            console.log('\n⚠️  Nenhum serviço encontrado');
        }

        // Teste 2: Buscar com raio maior
        console.log('\n\n📍 Teste 2: Buscar serviços com raio de 20km');
        const response2 = await axios.get(`${BASE_URL}/api/services/local`, {
            params: {
                latitude: -23.55052,
                longitude: -46.633308,
                radius: 20
            }
        });

        console.log('✅ Status:', response2.status);
        console.log('📊 Total de serviços (20km):', response2.data.total);

        console.log('\n\n✅ Todos os testes passaram!');
        console.log('\n💡 Dica: Se não encontrou serviços cadastrados, você precisa:');
        console.log('   1. Executar a migração do banco de dados');
        console.log('   2. Cadastrar técnicos com endereço e coordenadas');
        console.log('   3. Verificar se a API key do Google Maps está configurada');

    } catch (error) {
        console.error('\n❌ Erro ao testar API:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Mensagem:', error.response.data);
        } else if (error.request) {
            console.error('   Servidor não respondeu. Verifique se o backend está rodando em', BASE_URL);
        } else {
            console.error('   ', error.message);
        }
        console.error('\n🔧 Soluções possíveis:');
        console.error('   1. Certifique-se que o backend está rodando: npm start');
        console.error('   2. Verifique se a porta 5001 está correta');
        console.error('   3. Verifique se a rota /api/services está registrada no server.js');
        console.error('   4. Verifique se a variável GOOGLE_MAPS_API_KEY está configurada no .env');
    }
}

// Executar testes
testLocalServicesAPI();
