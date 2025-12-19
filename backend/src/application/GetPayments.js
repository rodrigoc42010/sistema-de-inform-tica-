const paymentRepository = require('../infrastructure/database/PostgresPaymentRepository');

class GetPayments {
  async execute({ userId, role, status, method, from, to, q }) {
    return await paymentRepository.findAll({
      userId,
      role,
      status,
      method,
      from,
      to,
      q,
    });
  }
}

module.exports = new GetPayments();
