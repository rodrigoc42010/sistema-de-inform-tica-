jest.mock('../../db/pgClient', () => ({
  getPool: jest.fn(),
}));

const adminService = require('../../services/adminService');
const pgClient = require('../../db/pgClient');

describe('AdminService Summary', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = { query: jest.fn() };
    pgClient.getPool.mockReturnValue({ query: mockClient.query });
  });

  it('returns totals, status and recent lists', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ c: 10 }] })
      .mockResolvedValueOnce({ rows: [{ c: 4 }] })
      .mockResolvedValueOnce({ rows: [{ c: 6 }] })
      .mockResolvedValueOnce({ rows: [{ c: 20 }] })
      .mockResolvedValueOnce({ rows: [{ status: 'aberto', c: 12 }, { status: 'concluido', c: 8 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'u1', email: 'a@x.com', role: 'client' }] })
      .mockResolvedValueOnce({ rows: [{ id: 't1', title: 'Ticket 1', status: 'aberto' }] });

    const data = await adminService.getSummary();
    expect(data.totals.users).toBe(10);
    expect(data.totals.technicians).toBe(4);
    expect(data.totals.clients).toBe(6);
    expect(data.totals.tickets).toBe(20);
    expect(Array.isArray(data.ticketStatus)).toBe(true);
    expect(Array.isArray(data.recent.users)).toBe(true);
    expect(Array.isArray(data.recent.tickets)).toBe(true);
  });
});
