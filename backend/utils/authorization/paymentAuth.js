const { ForbiddenError } = require('../httpErrors');

/**
 * Verifica se o usuário tem permissão para acessar/modificar o pagamento.
 * @param {object} payment - Objeto do pagamento
 * @param {object} user - Objeto do usuário (req.user)
 * @throws {ForbiddenError} Se o acesso for negado
 */
const checkPaymentAccess = (payment, user) => {
  const userId = user.id || user._id;
  const role = user.role;

  if (role === 'client' && String(payment.client) !== String(userId)) {
    throw new ForbiddenError('Não autorizado');
  }

  if (role === 'technician' && String(payment.technician) !== String(userId)) {
    throw new ForbiddenError('Não autorizado');
  }
};

/**
 * Verifica permissão para enviar lembrete de pagamento.
 * Apenas técnicos podem enviar.
 * @param {object} user - Objeto do usuário
 * @throws {ForbiddenError} Se não for técnico
 */
const checkPaymentReminderPermission = (user) => {
  if (user.role !== 'technician') {
    throw new ForbiddenError(
      'Apenas técnicos podem enviar lembretes de cobrança'
    );
  }
};

/**
 * Verifica permissão para enviar/visualizar recibo.
 * Cliente ou Técnico associado ao pagamento.
 * @param {object} payment - Objeto do pagamento
 * @param {object} user - Objeto do usuário
 * @throws {ForbiddenError} Se não for autorizado
 */
const checkPaymentReceiptPermission = (payment, user) => {
  const userId = user.id || user._id;
  const isClient = String(payment.client) === String(userId);
  const isTechnician = String(payment.technician) === String(userId);

  if (!isClient && !isTechnician) {
    throw new ForbiddenError(
      'Pagamento finalizado não encontrado ou não autorizado'
    );
  }
};

module.exports = {
  checkPaymentAccess,
  checkPaymentReminderPermission,
  checkPaymentReceiptPermission,
};
