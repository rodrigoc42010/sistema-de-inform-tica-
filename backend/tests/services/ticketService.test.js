// Mocks devem ser declarados antes dos requires para garantir hoisting correto com factory
jest.mock('../../db/pgClient', () => ({
  getPool: jest.fn(),
}));
jest.mock('../../repositories/ticketRepository');

const ticketService = require('../../services/ticketService');
const pgClient = require('../../db/pgClient');
const ticketRepository = require('../../repositories/ticketRepository');

describe('TicketService', () => {
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

  describe('createTicket', () => {
    const validData = {
      title: 'Test Ticket',
      description: 'Test Description',
      priority: 'high',
      deviceType: 'laptop',
      technician: null,
    };
    const userId = 1;

    it('should create a ticket successfully with auto-assignment', async () => {
      // Mock for auto-assignment query
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 99 }] }) // Find technician
        .mockResolvedValueOnce({
          rows: [{ id: 10, ...validData, technician: 99 }],
        }); // INSERT

      const result = await ticketService.createTicket(validData, userId);

      expect(result).toHaveProperty('technician', 99);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    it('should prevent client from assigning arbitrary technician', async () => {
      const dataWithTech = { ...validData, technician: 50 };

      // Mock user role check (client)
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ role: 'client' }] }) // Check role
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 99 }] }) // Auto-assign fallback
        .mockResolvedValueOnce({
          rows: [{ id: 10, ...validData, technician: 99 }],
        }); // INSERT

      const result = await ticketService.createTicket(dataWithTech, userId);

      // Should have ignored 50 and used 99 (auto-assigned)
      expect(result.technician).toBe(99);
      // First query in the flow (if technician provided) is checking role if we added that logic
      // Based on our implementation:
      // 1. Check if assignedTechnician is present (yes, 50)
      // 2. Check user role (mocked as client)
      // 3. Reset assignedTechnician to null
      // 4. Auto-assign query
      // 5. Insert
    });
  });

  describe('updateTicket', () => {
    const ticketId = 10;
    const updates = { status: 'concluido' };
    const currentTicket = {
      id: 10,
      client: 1,
      technician: 99,
      status: 'aberto',
    };

    it('should update ticket successfully when owner', async () => {
      mockClient.query.mockResolvedValueOnce({}); // UPDATE
      ticketRepository.findById.mockResolvedValue({
        ...currentTicket,
        status: 'concluido',
      });

      const result = await ticketService.updateTicket(
        ticketId,
        updates,
        currentTicket,
        1
      ); // userId 1 is owner

      expect(result.status).toBe('concluido');
    });

    it('should throw Error when user is not owner or technician', async () => {
      await expect(
        ticketService.updateTicket(ticketId, updates, currentTicket, 88)
      ) // userId 88 is stranger
        .rejects.toThrow('Acesso negado');

      expect(mockClient.query).not.toHaveBeenCalled();
    });
  });
});
