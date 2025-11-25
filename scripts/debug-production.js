const axios = require('axios');

const API_URL = 'https://sistema-de-inform-tica.onrender.com/api';

async function testProduction() {
    console.log(`🚀 Testando API de Produção: ${API_URL}\n`);

    // 1. Teste de Health Check (ou rota pública)
    try {
        console.log('1. Verificando se a API está online...');
        // Tenta acessar uma rota que deve retornar 401 ou 200, mas não 404
        await axios.get(`${API_URL}/users/me`);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('✅ API está online (retornou 401 Não Autorizado, o que é esperado).');
        } else if (error.response) {
            console.log(`⚠️ API respondeu com status ${error.response.status}:`, error.response.data);
        } else {
            console.error('❌ API não está acessível:', error.message);
            return;
        }
    }

    // 2. Tentar Registrar um Usuário de Teste
    const testUser = {
        name: "Teste Debug",
        email: `debug_${Date.now()}@teste.com`,
        password: "senha123",
        confirmPassword: "senha123",
        role: "technician",
        phone: "11999999999",
        cpfCnpj: "000.000.000-00",
        address: {
            street: "Rua Teste",
            number: "123",
            city: "São Paulo",
            state: "SP",
            zipCode: "01001000",
            country: "Brasil"
        },
        technician: {
            services: [{ id: 1, name: "Formatação", initialPrice: 100 }],
            pickupService: true,
            pickupFee: 20
        },
        termsAccepted: true
    };

    console.log(`\n2. Tentando registrar usuário de teste: ${testUser.email}...`);

    try {
        const res = await axios.post(`${API_URL}/users`, testUser);
        console.log('✅ REGISTRO COM SUCESSO!');
        console.log('ID:', res.data._id);
        console.log('Role:', res.data.role);
        console.log('Token:', res.data.token ? 'Recebido' : 'Não recebido');

        if (res.data.role !== 'technician') {
            console.error('❌ ERRO CRÍTICO: Usuário foi criado mas como CLIENTE, não TÉCNICO.');
        } else {
            console.log('✅ Usuário criado corretamente como TÉCNICO.');
        }

    } catch (error) {
        console.error('❌ FALHA NO REGISTRO:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Erro:', error.message);
        }
    }
}

testProduction();
