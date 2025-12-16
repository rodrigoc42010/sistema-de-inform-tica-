// Mocks devem ser declarados antes dos requires para garantir hoisting correto com factory
jest.mock('../../db/pgClient', () => ({
  getPool: jest.fn(),
}));
jest.mock('../../repositories/paymentRepository');
jest.mock('../../utils/emailService');

const paymentService = require('../../services/paymentService');
const pgClient = require('../../db/pgClient');
const paymentRepository = require('../../repositories/paymentRepository');
const { sendEmail } = require('../../utils/emailService');

describe('PaymentService', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pgClient.getPool.mockReturnValue({
      query: mockClient.query,
    });
  });

  describe('updateStatus', () => {
    const paymentId = 50;
    const status = 'pago';
    const userId = 1;
    const paymentData = {
      id: 50,
      client: 1,
      technician: 99,
      ticketId: 10,
      status: 'pendente',
    };

    it('should update payment status and sync ticket status', async () => {
      paymentRepository.findById
        .mockResolvedValueOnce(paymentData) // First call for ownership check
        .mockResolvedValueOnce(paymentData) // Second call for ticket sync logic
        .mockResolvedValueOnce({ ...paymentData, status: 'pago' }); // Final return

      mockClient.query.mockResolvedValue({}); // UPDATEs

      const result = await paymentService.updateStatus(
        paymentId,
        status,
        userId
      );

      expect(result.status).toBe('pago');
      // Verify ticket sync update
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tickets SET payment_status'),
        [status, paymentData.ticketId]
      );
    });

    it('should throw Error when user is not owner or technician', async () => {
      paymentRepository.findById.mockResolvedValue(paymentData);

      await expect(paymentService.updateStatus(paymentId, status, 88)) // userId 88 is stranger
        .rejects.toThrow('Acesso negado');

      // Should not have updated anything
      expect(mockClient.query).not.toHaveBeenCalled();
    });
  });
});
