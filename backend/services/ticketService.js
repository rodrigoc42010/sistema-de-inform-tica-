const { getPool } = require('../db/pgClient');
const ticketRepository = require('../repositories/ticketRepository');

class TicketService {
  /**
   * Cria um novo ticket, atribuindo técnico automaticamente se necessário.
   */
  async createTicket(data, userId) {
    const pool = getPool();
    const {
      title,
      description,
      priority,
      deviceType,
      deviceBrand,
      deviceModel,
      attachments,
      serviceItems,
      initialDiagnosis,
      pickupRequested,
      pickupAddress,
      technician,
    } = data;

    // Se não foi fornecido um técnico, atribuir automaticamente
    let assignedTechnician = technician;

    if (!assignedTechnician) {
      // Buscar técnicos disponíveis
      const techQuery = await pool.query(
        `SELECT u.id FROM users u 
         JOIN technicians t ON u.id = t.user_id 
         WHERE u.role = 'technician' 
         ORDER BY RANDOM() 
         LIMIT 1`
      );

      if (techQuery.rowCount > 0) {
        assignedTechnician = techQuery.rows[0].id;
        console.log('Auto-assigned technician:', assignedTechnician);
      }
    } else {
      // CORREÇÃO DE SEGURANÇA: Validar se o usuário pode atribuir técnico
      // Se não for admin (assumindo que apenas admin ou o próprio sistema pode forçar),
      // ignorar a atribuição arbitrária se for um cliente comum.
      // Como não temos o role do usuário aqui facilmente sem query, vamos buscar.
      const userCheck = await pool.query('SELECT role FROM users WHERE id=$1', [
        userId,
      ]);
      if (userCheck.rowCount > 0 && userCheck.rows[0].role === 'client') {
        // Clientes não podem escolher técnico manualmente
        assignedTechnician = null; // Forçar auto-atribuição ou null

        // Re-executar auto-atribuição
        const techQuery = await pool.query(
          `SELECT u.id FROM users u 
           JOIN technicians t ON u.id = t.user_id 
           WHERE u.role = 'technician' 
           ORDER BY RANDOM() 
           LIMIT 1`
        );
        if (techQuery.rowCount > 0) {
          assignedTechnician = techQuery.rows[0].id;
        }
      }
    }

    const inserted = await pool.query(
      'INSERT INTO tickets (title,description,priority,device_type,device_brand,device_model,attachments,service_items,initial_diagnosis,pickup_requested,pickup_address,client,technician,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
      [
        title,
        description,
        priority || null,
        deviceType || null,
        deviceBrand || null,
        deviceModel || null,
        JSON.stringify(Array.isArray(attachments) ? attachments : []),
        JSON.stringify(Array.isArray(serviceItems) ? serviceItems : []),
        initialDiagnosis || null,
        !!pickupRequested,
        pickupAddress ? JSON.stringify(pickupAddress) : null,
        userId,
        assignedTechnician || null,
        'aberto',
      ]
    );
    return inserted.rows[0];
  }

  /**
   * Atualiza um ticket existente.
   */
  async updateTicket(id, updates, currentTicket, userId) {
    const pool = getPool();

    // CORREÇÃO DE SEGURANÇA: Verificação defensiva de propriedade
    // Garantir que o usuário solicitante é o dono ou o técnico responsável
    if (userId) {
      const isOwner = String(currentTicket.client) === String(userId);
      const isTech = String(currentTicket.technician) === String(userId);
      if (!isOwner && !isTech) {
        // Se não for dono nem técnico, verificar se é admin (opcional, mas seguro bloquear por padrão)
        // Como não temos role aqui, bloqueamos. O controller já deve ter verificado, mas isso é defesa em profundidade.
        throw new Error(
          'Acesso negado: Usuário não possui permissão para alterar este ticket'
        );
      }
    }

    let status = currentTicket.status;
    let completionDate = currentTicket.completion_date;
    let serviceItems = currentTicket.service_items || [];
    let attachments = currentTicket.attachments || [];
    let finalReport = currentTicket.final_report || null;
    let paymentStatus = currentTicket.payment_status || null;

    // Aplicar atualizações
    if (updates.status) {
      let next = updates.status;
      if (next === 'closed') next = 'concluido';
      status = next;
      if (next === 'concluido') completionDate = new Date();
    }
    if (updates.serviceItems) {
      serviceItems = Array.isArray(updates.serviceItems)
        ? updates.serviceItems
        : serviceItems;
    }
    if (updates.attachments) {
      attachments = Array.isArray(updates.attachments)
        ? updates.attachments
        : attachments;
    }
    if (updates.finalReport !== undefined) {
      finalReport = updates.finalReport;
    }
    if (updates.paymentStatus !== undefined) {
      paymentStatus = updates.paymentStatus;
    }

    const totalPrice = (serviceItems || []).reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );

    await pool.query(
      'UPDATE tickets SET status=$1, final_report=$2, service_items=$3, attachments=$4, payment_status=$5, completion_date=$6, total_price=$7 WHERE id=$8',
      [
        status,
        finalReport,
        JSON.stringify(serviceItems),
        JSON.stringify(attachments),
        paymentStatus,
        completionDate,
        totalPrice,
        id,
      ]
    );

    return ticketRepository.findById(id);
  }
}

module.exports = new TicketService();
