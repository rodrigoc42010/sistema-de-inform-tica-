class Ad {
  constructor({
    id,
    title,
    text,
    linkUrl,
    mediaUrl,
    audience = 'client',
    tier = 'basic',
    durationDays = 30,
    price,
    paymentStatus = 'pending',
    status = 'pending_payment',
    startDate,
    endDate,
    createdBy,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.title = title;
    this.text = text;
    this.linkUrl = linkUrl;
    this.mediaUrl = mediaUrl;
    this.audience = audience;
    this.tier = tier;
    this.durationDays = durationDays;
    this.price = price;
    this.paymentStatus = paymentStatus;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isActive() {
    const now = new Date();
    return (
      this.status === 'active' &&
      (!this.startDate || new Date(this.startDate) <= now) &&
      (!this.endDate || new Date(this.endDate) >= now)
    );
  }

  isPaid() {
    return this.paymentStatus === 'paid';
  }
}

module.exports = Ad;
