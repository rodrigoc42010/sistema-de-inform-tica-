module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',

  // Arquivos de setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Padrão de arquivos de teste
  testMatch: ['**/tests/**/*.test.js', '**/__tests__/**/*.js'],

  // Cobertura de código
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
  ],

  // Diretório de cobertura
  coverageDirectory: 'coverage',

  // Reporters de cobertura
  coverageReporters: ['text', 'lcov', 'html'],

  // Limites de cobertura
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },

  // Ignorar node_modules
  testPathIgnorePatterns: ['/node_modules/'],

  // Transformações
  transform: {},

  // Verbose output
  verbose: true,
};
