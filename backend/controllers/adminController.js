const asyncHandler = require('express-async-handler');
const { getPool } = require('../db/pgClient');
const adminService = require('../services/adminService');
const { logAdminAction } = require('../utils/adminAudit');
const upgradeService = require('../services/technicianUpgradeService');
const { getPool } = require('../db/pgClient');
const { backupPath } = require('../config/appConfig');
const fs = require('fs');
const path = require('path');

const listUsers = asyncHandler(async (req, res) => {
  const { role, search, limit, offset } = req.query;
  const rows = await adminService.listUsers({ role, search, limit, offset });
  res.json(rows);
});
const listUpgradeRequests = asyncHandler(async (req, res) => {
  const { status, limit, offset } = req.query;
  const result = await upgradeService.listRequests({
    status,
    limit: Number(limit || 20),
    offset: Number(offset || 0),
  });
  res.json(result);
});

const listPendingRequests = asyncHandler(async (req, res) => {
  const { limit, offset } = req.query;
  const result = await upgradeService.listRequests({
    status: 'pending',
    limit: Number(limit || 20),
    offset: Number(offset || 0),
  });
  res.json(result);
});

const approveUpgradeRequest = asyncHandler(async (req, res) => {
  const { notes } = req.body || {};
  const result = await upgradeService.approveRequest(
    req.params.id,
    req.user.id,
    notes || null
  );
  logAdminAction({
    adminId: req.user.id,
    action: 'APPROVE_TECHNICIAN',
    entity: 'technician_upgrade_request',
    entityId: req.params.id,
  });
  res.json(result);
});

const rejectUpgradeRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body || {};
  const result = await upgradeService.rejectRequest(
    req.params.id,
    req.user.id,
    reason || null
  );
  logAdminAction({
    adminId: req.user.id,
    action: 'REJECT_TECHNICIAN',
    entity: 'technician_upgrade_request',
    entityId: req.params.id,
  });
  res.json(result);
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body || {};
  const allowed = ['client', 'technician', 'admin'];
  if (!allowed.includes(role)) {
    return res.status(400).json({ message: 'Role inválida' });
  }
  const row = await adminService.updateUserRole(req.params.id, role);
  if (!row) return res.status(404).json({ message: 'Usuário não encontrado' });
  logAdminAction({
    adminId: req.user.id,
    action: 'UPDATE_ROLE',
    entity: 'user',
    entityId: req.params.id,
  });
  res.json(row);
});

const listTechnicians = asyncHandler(async (req, res) => {
  const { search, limit, offset } = req.query;
  const rows = await adminService.listTechnicians({ search, limit, offset });
  res.json(rows);
});

const listTickets = asyncHandler(async (req, res) => {
  const { status, from, to, clientId, technicianId, search, limit, offset } =
    req.query;
  const rows = await adminService.listTickets({
    status,
    from,
    to,
    clientId,
    technicianId,
    search,
    limit,
    offset,
  });
  res.json(rows);
});

const getSummary = asyncHandler(async (req, res) => {
  const data = await adminService.getSummary();
  res.json(data);
});

const blockUser = asyncHandler(async (req, res) => {
  const row = await adminService.blockUser(req.params.id);
  if (!row) return res.status(404).json({ message: 'Usuário não encontrado' });
  logAdminAction({
    adminId: req.user.id,
    action: 'BLOCK_USER',
    entity: 'user',
    entityId: req.params.id,
  });
  res.json(row);
});

const unblockUser = asyncHandler(async (req, res) => {
  const row = await adminService.unblockUser(req.params.id);
  if (!row) return res.status(404).json({ message: 'Usuário não encontrado' });
  logAdminAction({
    adminId: req.user.id,
    action: 'UNBLOCK_USER',
    entity: 'user',
    entityId: req.params.id,
  });
  res.json(row);
});

const promoteTechnician = asyncHandler(async (req, res) => {
  const row = await adminService.promoteToTechnician(req.params.id);
  logAdminAction({
    adminId: req.user.id,
    action: 'PROMOTE_TECHNICIAN',
    entity: 'user',
    entityId: req.params.id,
  });
  res.json(row);
});

const setTechnicianAvailability = asyncHandler(async (req, res) => {
  const { available } = req.body || {};
  const row = await adminService.setTechnicianAvailability(
    req.params.id,
    available
  );
  if (!row) return res.status(404).json({ message: 'Técnico não encontrado' });
  logAdminAction({
    adminId: req.user.id,
    action: 'SET_TECHNICIAN_AVAILABILITY',
    entity: 'technician',
    entityId: req.params.id,
  });
  res.json(row);
});

const getTicketDetail = asyncHandler(async (req, res) => {
  const row = await adminService.getTicket(req.params.id);
  if (!row) return res.status(404).json({ message: 'Ticket não encontrado' });
  res.json(row);
});

const updateTicketStatus = asyncHandler(async (req, res) => {
  const allowed = [
    'status',
    'paymentStatus',
    'finalReport',
    'serviceItems',
    'attachments',
  ];
  const updates = Object.keys(req.body || {}).reduce((acc, k) => {
    if (allowed.includes(k)) acc[k] = req.body[k];
    return acc;
  }, {});
  const updated = await adminService.adminUpdateTicket(req.params.id, updates);
  if (!updated)
    return res.status(404).json({ message: 'Ticket não encontrado' });
  logAdminAction({
    adminId: req.user.id,
    action: 'UPDATE_TICKET_STATUS',
    entity: 'ticket',
    entityId: req.params.id,
  });
  res.json(updated);
});

const getHealth = asyncHandler(async (req, res) => {
  const data = await adminService.getHealth();
  res.json(data);
});

const toCsv = (rows) => {
  if (!rows || !rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => escape(r[h])).join(','));
  }
  return lines.join('\n');
};

const exportUsersCsv = asyncHandler(async (req, res) => {
  const rows = await adminService.listUsers({});
  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
  logAdminAction({
    adminId: req.user.id,
    action: 'EXPORT_USERS',
    entity: 'user',
  });
  res.send(csv);
});

const exportTicketsCsv = asyncHandler(async (req, res) => {
  const rows = await adminService.listTickets({});
  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
  logAdminAction({
    adminId: req.user.id,
    action: 'EXPORT_TICKETS',
    entity: 'ticket',
  });
  res.send(csv);
});

const exportPaymentsCsv = asyncHandler(async (req, res) => {
  const pool = getPool();
  const rs = await pool.query(
    'SELECT id, ticket, title AS description, amount, currency, status, payment_method, created_at, payment_date FROM payments ORDER BY created_at DESC NULLS LAST LIMIT 1000'
  );
  const rows = rs.rows.map((r) => ({
    id: r.id,
    ticket: r.ticket,
    description: r.description,
    amount: Number(r.amount || 0),
    currency: r.currency,
    status: r.status,
    payment_method: r.payment_method,
    created_at: r.created_at,
    payment_date: r.payment_date,
  }));
  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
  logAdminAction({
    adminId: req.user.id,
    action: 'EXPORT_PAYMENTS',
    entity: 'payment',
  });
  res.send(csv);
});

const systemCheck = asyncHandler(async (req, res) => {
  const pool = getPool();
  let database = 'ok';
  try {
    await pool.query('SELECT 1');
  } catch {
    database = 'degraded';
  }
  let backups = 'ok';
  let lastBackup = null;
  try {
    const files = fs
      .readdirSync(backupPath)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => ({
        name: f,
        time: fs.statSync(path.join(backupPath, f)).mtime,
      }))
      .sort((a, b) => b.time - a.time);
    if (files.length) {
      const d = files[0].time;
      const pad = (n) => String(n).padStart(2, '0');
      lastBackup = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } else {
      backups = 'missing';
    }
  } catch {
    backups = 'error';
  }
  let diskSpace = 'ok';
  try {
    const testFile = path.join(backupPath, `.writable_${Date.now()}.tmp`);
    fs.writeFileSync(testFile, 'x');
    fs.unlinkSync(testFile);
  } catch {
    diskSpace = 'degraded';
  }
  res.json({ api: 'ok', database, backups, diskSpace, lastBackup });
});

module.exports = {
  listUpgradeRequests,
  listPendingRequests,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  updateUserRole,
  listUsers,
  listTechnicians,
  listTickets,
  getSummary,
  blockUser,
  unblockUser,
  promoteTechnician,
  setTechnicianAvailability,
  getTicketDetail,
  updateTicketStatus,
  getHealth,
  exportUsersCsv,
  exportTicketsCsv,
  exportPaymentsCsv,
  systemCheck,
};
