const axios = require('axios');
const { getPool } = require('../db/pgClient');
require('dotenv').config({ path: '../../.env' });

const API_URL = 'http://localhost:5000/api/users';

async function runTest() {
  console.log('Iniciando teste de fluxo de Refresh Token...');

  // 1. Registrar usuário de teste
  const testUser = {
    name: 'Test Refresh',
    email: `testrefresh_${Date.now()}@example.com`,
    password: 'password123',
    phone: '11999999999',
    cpfCnpj: '12345678901',
  };

  try {
    console.log('1. Registrando usuário...');
    const registerRes = await axios.post(API_URL, testUser);
    console.log(
      '   Registro OK. Token:',
      registerRes.data.token ? 'Sim' : 'Não',
      'RefreshToken:',
      registerRes.data.refreshToken ? 'Sim' : 'Não'
    );

    const accessToken = registerRes.data.token;
    const refreshToken = registerRes.data.refreshToken;

    if (!accessToken || !refreshToken) {
      throw new Error('Tokens não recebidos no registro');
    }

    // 2. Testar acesso protegido com access token
    console.log('2. Testando rota protegida (/me)...');
    const meRes = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('   Acesso OK. User:', meRes.data.email);

    // 3. Testar refresh token
    console.log('3. Testando refresh token...');
    const refreshRes = await axios.post(`${API_URL}/refresh`, { refreshToken });
    console.log(
      '   Refresh OK. Novo Token:',
      refreshRes.data.token ? 'Sim' : 'Não'
    );

    const newAccessToken = refreshRes.data.token;

    // 4. Testar acesso com novo token
    console.log('4. Testando rota protegida com novo token...');
    const meRes2 = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${newAccessToken}` },
    });
    console.log('   Acesso com novo token OK.');

    // 5. Logout
    console.log('5. Testando logout...');
    await axios.post(
      `${API_URL}/logout`,
      { refreshToken },
      {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      }
    );
    console.log('   Logout OK.');

    // 6. Tentar refresh após logout (deve falhar se implementamos revogação, mas logout padrão só invalida access token via blacklist se configurado, e refresh token se passamos no body)
    // No nosso código, passamos refreshToken no body do logout para revogar.
    console.log('6. Tentando refresh após logout (deve falhar)...');
    try {
      await axios.post(`${API_URL}/refresh`, { refreshToken });
      console.error('   ERRO: Refresh funcionou após logout!');
    } catch (err) {
      console.log(
        '   Sucesso: Refresh falhou como esperado.',
        err.response?.status,
        err.response?.data?.message
      );
    }

    console.log('\nTESTE CONCLUÍDO COM SUCESSO!');
  } catch (error) {
    console.error('\nERRO NO TESTE:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

runTest();
