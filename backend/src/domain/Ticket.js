class Ticket {
  constructor({
    id,
    title,
    description,
    clientId,
    technicianId,
    status = 'open',
    priority = 'medium',
    deviceType,
    deviceBrand,
    deviceModel,
    serialNumber,
    pickupRequested = false,
    pickupAddress,
    totalPrice = 0,
    paymentStatus = 'pending',
    completionDate,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.clientId = clientId;
    this.technicianId = technicianId;
    this.status = status;
    this.priority = priority;
    this.deviceType = deviceType;
    this.deviceBrand = deviceBrand;
    this.deviceModel = deviceModel;
    this.serialNumber = serialNumber;
    this.pickupRequested = pickupRequested;
    this.pickupAddress = pickupAddress;
    this.totalPrice = totalPrice;
    this.paymentStatus = paymentStatus;
    this.completionDate = completionDate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  canBeEdited() {
    return !['completed', 'cancelled'].includes(this.status);
  }

  isPaid() {
    return this.paymentStatus === 'paid';
  }
}

module.exports = Ticket;
