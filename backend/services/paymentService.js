const { getPool } = require('../db/pgClient');
const paymentRepository = require('../repositories/paymentRepository');
const { sendEmail } = require('../utils/emailService');

class PaymentService {
  async updateStatus(id, status, userId) {
    const pool = getPool();

    // CORREÇÃO DE SEGURANÇA: Verificação defensiva de propriedade
    if (userId) {
      const payment = await paymentRepository.findById(id);
      if (payment) {
        const isClient = String(payment.client) === String(userId);
        const isTech = String(payment.technician) === String(userId);
        if (!isClient && !isTech) {
          throw new Error(
            'Acesso negado: Usuário não possui permissão para alterar este pagamento'
          );
        }
      }
    }
    const paidDate = ['pago', 'recebido'].includes(status) ? new Date() : null;

    await pool.query(
      'UPDATE payments SET status=$1, payment_date=$2 WHERE id=$3',
      [status, paidDate, id]
    );

    // CORREÇÃO DE SEGURANÇA: Sincronizar status do ticket
    // Se o pagamento for confirmado, atualizar o ticket relacionado
    const payment = await paymentRepository.findById(id);
    if (payment && payment.ticketId) {
      // Mapear status de pagamento para status de ticket (se necessário)
      // Aqui assumimos que o status do pagamento é compatível ou usamos um genérico
      await pool.query('UPDATE tickets SET payment_status=$1 WHERE id=$2', [
        status,
        payment.ticketId,
      ]);
    }

    return paymentRepository.findById(id);
  }

  async sendReminder(payment) {
    const message = `
      Olá ${payment.name},
      
      Este é um lembrete de pagamento referente ao serviço "${payment.title}" (Ticket: ${payment.ticket}).
      Valor: R$ ${Number(payment.amount).toFixed(2)}
      
      Por favor, realize o pagamento o mais breve possível.
      
      Atenciosamente,
      Equipe TechAssist
    `;

    await sendEmail({
      email: payment.email,
      subject: `Lembrete de Pagamento - ${payment.title}`,
      message,
    });
  }

  async sendReceipt(payment, emailToSend) {
    const message = `
      RECIBO DE PAGAMENTO
      
      Serviço: ${payment.title}
      Ticket: ${payment.ticket}
      Valor: R$ ${Number(payment.amount).toFixed(2)}
      Data: ${new Date(payment.payment_date).toLocaleDateString()}
      Método: ${payment.payment_method}
      
      Técnico: ${payment.tech_name}
      Cliente: ${payment.client_name}
      
      Este email serve como comprovante de pagamento.
      
      Obrigado,
      TechAssist
    `;

    await sendEmail({
      email: emailToSend,
      subject: `Recibo de Pagamento - ${payment.title}`,
      message,
    });
  }
}

module.exports = new PaymentService();
