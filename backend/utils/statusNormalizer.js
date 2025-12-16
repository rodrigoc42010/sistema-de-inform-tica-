/**
 * STATUS NORMALIZER
 *
 * Normalização centralizada de status para diferentes recursos.
 * Elimina duplicação de mapeamentos de status.
 *
 * Uso:
 *   const status = normalizeStatus('completed', 'payment', 'technician');
 *   const ticketStatus = normalizeStatus('closed', 'ticket');
 */

const STATUS_MAPS = {
  payment: {
    pendente: 'pendente',
    pending: 'pendente',
    pago: 'pago',
    paid: 'pago',
    recebido: 'recebido',
    received: 'recebido',
    cancelado: 'cancelado',
    cancelled: 'cancelado',
    // Função para status dependente de role
    completed: (role) => (role === 'technician' ? 'recebido' : 'pago'),
  },
  ticket: {
    aberto: 'aberto',
    open: 'aberto',
    'em andamento': 'em_andamento',
    'in progress': 'em_andamento',
    em_andamento: 'em_andamento',
    concluido: 'concluido',
    completed: 'concluido',
    closed: 'concluido',
    cancelado: 'cancelado',
    cancelled: 'cancelado',
  },
};

/**
 * Normaliza um status para o formato padrão
 * @param {string} status - Status a normalizar
 * @param {string} type - Tipo do recurso ('payment', 'ticket')
 * @param {string} role - Role do usuário (opcional, necessário para alguns status)
 * @returns {string} Status normalizado
 */
function normalizeStatus(status, type, role = null) {
  const map = STATUS_MAPS[type];
  if (!map) {
    throw new Error(`Tipo de status desconhecido: ${type}`);
  }

  const key = String(status || '')
    .toLowerCase()
    .trim();
  const normalized = map[key];

  // Se o status mapeado é uma função, executar com role
  if (typeof normalized === 'function') {
    return normalized(role);
  }

  // Retornar status normalizado ou padrão
  return normalized || (type === 'payment' ? 'pendente' : 'aberto');
}

/**
 * Verifica se um status é válido para um tipo
 * @param {string} status - Status a validar
 * @param {string} type - Tipo do recurso
 * @returns {boolean}
 */
function isValidStatus(status, type) {
  const map = STATUS_MAPS[type];
  if (!map) return false;

  const key = String(status || '')
    .toLowerCase()
    .trim();
  return key in map;
}

module.exports = {
  normalizeStatus,
  isValidStatus,
  STATUS_MAPS,
};
