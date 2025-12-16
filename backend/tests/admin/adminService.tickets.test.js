jest.mock('../../db/pgClient', () => ({
  getPool: jest.fn(),
}));
jest.mock('../../repositories/ticketRepository', () => ({
  findById: jest.fn(),
}));
jest.mock('../../services/ticketService', () => ({
  updateTicket: jest.fn(),
}));

const adminService = require('../../services/adminService');
const pgClient = require('../../db/pgClient');
const ticketRepository = require('../../repositories/ticketRepository');
const ticketService = require('../../services/ticketService');

describe('AdminService Tickets', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = { query: jest.fn() };
    pgClient.getPool.mockReturnValue({ query: mockClient.query });
  });

  it('gets ticket by id', async () => {
    mockClient.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 't1', title: 'A' }] });
    const r = await adminService.getTicket('t1');
    expect(r.id).toBe('t1');
  });

  it('updates ticket as admin', async () => {
    const current = { id: 't2', status: 'aberto' };
    const updated = { id: 't2', status: 'concluido' };
    ticketRepository.findById.mockResolvedValueOnce(current);
    ticketService.updateTicket.mockResolvedValueOnce(updated);
    const r = await adminService.adminUpdateTicket('t2', { status: 'concluido' });
    expect(r.status).toBe('concluido');
  });
});
