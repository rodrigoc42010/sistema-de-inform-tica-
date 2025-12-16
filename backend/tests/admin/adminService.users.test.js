jest.mock('../../db/pgClient', () => ({
  getPool: jest.fn(),
}));

const adminService = require('../../services/adminService');
const pgClient = require('../../db/pgClient');

describe('AdminService Users', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = { query: jest.fn() };
    pgClient.getPool.mockReturnValue({ query: mockClient.query });
  });

  it('blocks user', async () => {
    const now = new Date().toISOString();
    mockClient.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'u1', lock_until: now, failed_login_attempts: 1 }] });
    const r = await adminService.blockUser('u1');
    expect(r.id).toBe('u1');
  });

  it('unblocks user', async () => {
    mockClient.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'u1' }] });
    const r = await adminService.unblockUser('u1');
    expect(r.id).toBe('u1');
  });

  it('promotes existing technician', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'tech1' }] })
      .mockResolvedValueOnce({});
    const r = await adminService.promoteToTechnician('u2');
    expect(r.role).toBe('technician');
    expect(r.technicianId).toBe('tech1');
  });

  it('promotes new technician and creates profile', async () => {
    mockClient.query
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'newTech' }] })
      .mockResolvedValueOnce({});
    const r = await adminService.promoteToTechnician('u3');
    expect(r.role).toBe('technician');
    expect(r.technicianId).toBe('newTech');
  });

  it('sets technician availability', async () => {
    mockClient.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 't1', user_id: 'u4', availability: false }] });
    const r = await adminService.setTechnicianAvailability('u4', false);
    expect(r.user_id).toBe('u4');
    expect(r.availability).toBe(false);
  });
});
