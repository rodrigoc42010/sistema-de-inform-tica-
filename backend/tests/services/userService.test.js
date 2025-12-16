const bcrypt = require('bcryptjs');
jest.mock('../../db/pgClient', () => ({ getPool: jest.fn() }));
jest.mock('../../repositories/userRepository');
const pgClient = require('../../db/pgClient');
const userRepository = require('../../repositories/userRepository');
const userService = require('../../services/userService');
const { UnauthorizedError } = require('../../utils/httpErrors');

describe('UserService', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = { query: jest.fn() };
    pgClient.getPool.mockReturnValue({ query: mockClient.query });
  });

  describe('authenticateUser', () => {
    it('throws UnauthorizedError on invalid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 1, password: 'hash' });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      await expect(
        userService.authenticateUser('test@example.com', 'wrong', { ip: '1.1.1.1', ua: 'Jest' })
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
