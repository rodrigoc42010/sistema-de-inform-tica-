import axios from '../api/axios';

const adminService = {
  getUsers: (config) => axios.get('/api/admin/users', config),
  getTechnicians: (config) => axios.get('/api/admin/technicians', config),
  getTickets: (config) => axios.get('/api/admin/tickets', config),
  getUpgrades: (config) => axios.get('/api/admin/technician-upgrades', config),
  getSummary: () => axios.get('/api/admin/summary'),
  blockUser: (id) => axios.post(`/api/admin/users/${id}/block`),
  unblockUser: (id) => axios.post(`/api/admin/users/${id}/unblock`),
  promoteTechnician: (id) =>
    axios.post(`/api/admin/users/${id}/promote/technician`),
  setTechnicianAvailability: (userId, available) =>
    axios.post(`/api/admin/technicians/${userId}/availability`, { available }),
  getTicketById: (id) => axios.get(`/api/admin/tickets/${id}`),
  updateTicketStatus: (id, payload) =>
    axios.put(`/api/admin/tickets/${id}/status`, payload),
  approveUpgrade: (id, notes) =>
    axios.post(`/api/admin/upgrade-requests/${id}/approve`, { notes }),
  rejectUpgrade: (id, reason) =>
    axios.post(`/api/admin/upgrade-requests/${id}/reject`, { reason }),
  setRole: (id, role) => axios.post(`/api/admin/users/${id}/role`, { role }),
};

export default adminService;
