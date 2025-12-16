/**
 * Testes de Integração - API de Autenticação
 */

const request = require('supertest');
const { getPool } = require('../../db/pgClient');

// Mock do app Express
let app;
let pool;

beforeAll(async () => {
  // Importar app após configurar env
  app = require('../../server');
  pool = getPool();

  // Limpar tabela de usuários de teste
  try {
    await pool.query("DELETE FROM users WHERE email LIKE '%test%'");
  } catch (err) {
    console.error('Erro ao limpar banco de testes:', err.message);
  }
});

afterAll(async () => {
  // Limpar e fechar conexões
  try {
    await pool.query("DELETE FROM users WHERE email LIKE '%test%'");
    await pool.end();
  } catch (err) {
    console.error('Erro ao finalizar testes:', err.message);
  }
});

describe('POST /api/users - Registro de Usuário', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@123',
    role: 'client',
    phone: '(11) 98765-4321',
    cpfCnpj: '123.456.789-09',
    address: {
      street: 'Rua Teste',
      number: '123',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01234-567',
    },
    termsAccepted: true,
  };

  test('deve registrar um novo usuário com sucesso', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('token');
    expect(response.body.email).toBe(testUser.email);
    expect(response.body.name).toBe(testUser.name);
    expect(response.body.role).toBe('client');
  });

  test('deve rejeitar registro com email duplicado', async () => {
    await request(app).post('/api/users').send(testUser).expect(400);
  });

  test('deve rejeitar registro sem termos aceitos', async () => {
    const userWithoutTerms = {
      ...testUser,
      email: 'test2@example.com',
      termsAccepted: false,
    };

    const response = await request(app)
      .post('/api/users')
      .send(userWithoutTerms)
      .expect(400);

    expect(response.body.message).toContain('Termos');
  });

  test('deve rejeitar registro com CPF inválido', async () => {
    const userInvalidCPF = {
      ...testUser,
      email: 'test3@example.com',
      cpfCnpj: '111.111.111-11',
    };

    await request(app).post('/api/users').send(userInvalidCPF).expect(400);
  });

  test('deve rejeitar registro com telefone inválido', async () => {
    const userInvalidPhone = {
      ...testUser,
      email: 'test4@example.com',
      phone: '123',
    };

    await request(app).post('/api/users').send(userInvalidPhone).expect(400);
  });
});

describe('POST /api/users/login - Login de Usuário', () => {
  test('deve fazer login com credenciais válidas', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'Test@123',
      })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body.email).toBe('test@example.com');
  });

  test('deve rejeitar login com senha incorreta', async () => {
    await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword',
      })
      .expect(401);
  });

  test('deve rejeitar login com email inexistente', async () => {
    await request(app)
      .post('/api/users/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Test@123',
      })
      .expect(401);
  });

  test('deve rejeitar login sem email ou senha', async () => {
    await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
      })
      .expect(400);
  });
});

describe('GET /api/users/me - Obter Dados do Usuário', () => {
  let authToken;

  beforeAll(async () => {
    // Fazer login para obter token
    const response = await request(app).post('/api/users/login').send({
      email: 'test@example.com',
      password: 'Test@123',
    });

    authToken = response.body.token;
  });

  test('deve retornar dados do usuário autenticado', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.email).toBe('test@example.com');
    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('name');
  });

  test('deve rejeitar requisição sem token', async () => {
    await request(app).get('/api/users/me').expect(401);
  });

  test('deve rejeitar requisição com token inválido', async () => {
    await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid_token')
      .expect(401);
  });
});
