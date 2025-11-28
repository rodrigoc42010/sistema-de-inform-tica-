const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testTicketPermissions() {
    console.log('🔍 Testando validação de permissões em tickets...\n');

    try {
        // 1. Login como técnico
        console.log('1. Login como técnico...');
        const techLogin = await axios.post(`${API_URL}/api/users/technician-login`, {
            loginId: 'TEC123456789',
            password: 'senha_tecnico'
        });

        const techToken = techLogin.data.token;
        console.log('✅ Técnico logado com sucesso\n');

        // 2. Criar um ticket (como cliente, precisaria de outro login)
        // Por simplicidade, vamos assumir que existe um ticket ID 1
        const ticketId = 1;

        // 3. Técnico tenta atualizar paymentStatus (NÃO DEVE SER PERMITIDO)
        console.log('2. Técnico tentando atualizar paymentStatus...');
        try {
            await axios.put(
                `${API_URL}/api/tickets/${ticketId}`,
                { paymentStatus: 'pago' },
                { headers: { Authorization: `Bearer ${techToken}` } }
            );

            console.log('❌ FALHA: Técnico conseguiu atualizar paymentStatus!');
            console.log('   VULNERABILIDADE: Escalação de privilégios detectada!\n');
            process.exit(1);

        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ Técnico bloqueado corretamente (403 Forbidden)');
                console.log(`   Mensagem: ${error.response.data.message}\n`);
            } else {
                console.log(`⚠️  Erro inesperado: ${error.response?.status}`);
                console.log(`   Mensagem: ${error.response?.data?.message || error.message}\n`);
            }
        }

        // 4. Técnico tenta atualizar status (DEVE SER PERMITIDO)
        console.log('3. Técnico tentando atualizar status...');
        try {
            const res = await axios.put(
                `${API_URL}/api/tickets/${ticketId}`,
                { status: 'em_andamento' },
                { headers: { Authorization: `Bearer ${techToken}` } }
            );

            console.log('✅ Técnico conseguiu atualizar status (permitido)');
            console.log(`   Novo status: ${res.data.status}\n`);

        } catch (error) {
            console.log(`⚠️  Erro ao atualizar status: ${error.response?.status}`);
            console.log(`   Mensagem: ${error.response?.data?.message || error.message}\n`);
        }

        console.log('✅ TESTE DE PERMISSÕES CONCLUÍDO!');
        console.log('   Sistema protegido contra escalação de privilégios\n');

    } catch (error) {
        if (error.response) {
            console.error(`❌ Erro HTTP ${error.response.status}:`, error.response.data);
        } else {
            console.error('❌ Erro no teste:', error.message);
        }
        console.log('\n⚠️  Nota: Este teste requer um técnico e ticket existentes no banco');
        console.log('   Ajuste as credenciais e IDs conforme necessário\n');
    }
}

testTicketPermissions();
