const { ForbiddenError } = require('../httpErrors');

const ALLOWED_FIELDS = {
  technician: ['status', 'finalReport', 'serviceItems', 'attachments'],
  client: ['paymentStatus'],
};

const getTicketAllowedFields = (role) => {
  return ALLOWED_FIELDS[role] || [];
};

/**
 * Verifica se o usuário tem permissão para acessar o ticket.
 * O usuário deve ser o cliente dono do ticket ou o técnico atribuído.
 * @param {object} ticket - Objeto do ticket
 * @param {string} userId - ID do usuário atual
 * @throws {ForbiddenError} Se o acesso for negado
 */
const checkTicketAccess = (ticket, userId) => {
  const isClientOwner = String(ticket.client) === String(userId);
  const isAssignedTech =
    ticket.technician && String(ticket.technician) === String(userId);

  if (!isClientOwner && !isAssignedTech) {
    throw new ForbiddenError('Acesso negado a este ticket');
  }

  return { isClientOwner, isAssignedTech };
};

/**
 * Verifica permissões específicas de atualização de ticket.
 * @param {object} ticket - Objeto do ticket
 * @param {object} user - Objeto do usuário (req.user)
 * @param {object} updates - Campos sendo atualizados (req.body)
 * @throws {ForbiddenError} Se a atualização não for permitida
 */
const checkTicketUpdatePermission = (ticket, user, updates) => {
  const userId = user.id || user._id;
  const { isClientOwner } = checkTicketAccess(ticket, userId);

  // Apenas o cliente pode atualizar o status de pagamento
  if (updates.paymentStatus && !isClientOwner) {
    throw new ForbiddenError(
      'Apenas o cliente pode atualizar o status de pagamento'
    );
  }
};

module.exports = {
  checkTicketAccess,
  checkTicketUpdatePermission,
  getTicketAllowedFields,
  ALLOWED_FIELDS,
};
