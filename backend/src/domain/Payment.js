class Payment {
  constructor({
    id,
    ticketId,
    userId,
    amount,
    currency = 'BRL',
    paymentMethod,
    status = 'pending',
    externalId,
    receiptUrl,
    notes,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.ticketId = ticketId;
    this.userId = userId;
    this.amount = amount;
    this.currency = currency;
    this.paymentMethod = paymentMethod;
    this.status = status;
    this.externalId = externalId;
    this.receiptUrl = receiptUrl;
    this.notes = notes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isPaid() {
    return this.status === 'paid';
  }
}

module.exports = Payment;
