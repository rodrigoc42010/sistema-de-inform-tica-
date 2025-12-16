const fs = require('fs');
const path = require('path');
const adminService = require('../services/adminService');
const logger = require('./logger');

function logAdminAction({ adminId, action, entity, entityId, metadata }) {
  const logsDir = path.join(process.cwd(), 'logs');
  try {
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  } catch {}
  const logPath = path.join(logsDir, 'admin-audit.log');
  const entry = {
    timestamp: new Date().toISOString(),
    adminId,
    action,
    entity,
    entityId: entityId != null ? String(entityId) : null,
    metadata: metadata || undefined,
  };
  try {
    fs.appendFile(logPath, JSON.stringify(entry) + '\n', () => {});
  } catch {}
  try {
    adminService.logAudit(
      adminId,
      String(action).toLowerCase(),
      entity,
      entityId
    );
  } catch {}
  try {
    logger.logStructured({
      level: 'info',
      requestId: (metadata && metadata.requestId) || '',
      userId: adminId,
      action,
      message: `${entity}:${entityId}`,
    });
  } catch {}
}

module.exports = { logAdminAction };
