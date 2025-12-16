const asyncHandler = require('express-async-handler');
const upgradeService = require('../services/technicianUpgradeService');
const { ForbiddenError } = require('../utils/httpErrors');

const createUpgradeRequest = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'client')
    throw new ForbiddenError('Acesso negado');
  const result = await upgradeService.createRequest(
    req.user.id,
    req.body || {}
  );
  res.status(201).json(result);
});

const listUpgradeRequests = asyncHandler(async (req, res) => {
  if (!req.user || !['technician', 'admin'].includes(req.user.role))
    throw new ForbiddenError('Acesso negado');
  const { status, limit, offset } = req.query;
  const result = await upgradeService.listRequests({
    status,
    limit: Number(limit || 20),
    offset: Number(offset || 0),
  });
  res.json(result);
});

const getUpgradeRequest = asyncHandler(async (req, res) => {
  if (!req.user) throw new ForbiddenError('Acesso negado');
  const result = await upgradeService.getById(req.params.id);
  if (
    req.user.role === 'client' &&
    String(result.user_id) !== String(req.user.id)
  )
    throw new ForbiddenError('Acesso negado');
  res.json(result);
});

const cancelUpgradeRequest = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'client')
    throw new ForbiddenError('Acesso negado');
  const result = await upgradeService.cancelRequest(req.params.id, req.user.id);
  res.json(result);
});

const approveUpgradeRequest = asyncHandler(async (req, res) => {
  if (!req.user || !['technician', 'admin'].includes(req.user.role))
    throw new ForbiddenError('Acesso negado');
  const { notes } = req.body || {};
  const result = await upgradeService.approveRequest(
    req.params.id,
    req.user.id,
    notes || null
  );
  res.json(result);
});

const rejectUpgradeRequest = asyncHandler(async (req, res) => {
  if (!req.user || !['technician', 'admin'].includes(req.user.role))
    throw new ForbiddenError('Acesso negado');
  const { reason } = req.body || {};
  const result = await upgradeService.rejectRequest(
    req.params.id,
    req.user.id,
    reason || null
  );
  res.json(result);
});

const listPendingRequests = asyncHandler(async (req, res) => {
  if (!req.user || !['technician', 'admin'].includes(req.user.role))
    throw new ForbiddenError('Acesso negado');
  const { limit, offset } = req.query;
  const result = await upgradeService.listRequests({
    status: 'pending',
    limit: Number(limit || 20),
    offset: Number(offset || 0),
  });
  res.json(result);
});

module.exports = {
  createUpgradeRequest,
  listUpgradeRequests,
  getUpgradeRequest,
  cancelUpgradeRequest,
  approveUpgradeRequest,
  rejectUpgradeRequest,
  listPendingRequests,
};
