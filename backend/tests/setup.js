/**
 * Configuração global para testes Jest
 */

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  'test_jwt_secret_key_with_at_least_32_characters_for_security';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/trea_ia_test';
process.env.LOG_LEVEL = 'error'; // Silenciar logs durante testes

// Mock de console para evitar poluição de logs
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Timeout global para testes (10 segundos)
jest.setTimeout(10000);

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});
