class Technician {
  constructor({
    id,
    userId,
    loginId,
    bio,
    latitude,
    longitude,
    pickupService = false,
    pickupFee = 0,
    pixKey,
    ratingAverage = 0,
    totalReviews = 0,
    subscriptionActive = false,
    subscriptionExpiresAt,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.userId = userId;
    this.loginId = loginId;
    this.bio = bio;
    this.latitude = latitude;
    this.longitude = longitude;
    this.pickupService = pickupService;
    this.pickupFee = pickupFee;
    this.pixKey = pixKey;
    this.ratingAverage = ratingAverage;
    this.totalReviews = totalReviews;
    this.subscriptionActive = subscriptionActive;
    this.subscriptionExpiresAt = subscriptionExpiresAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isSubscriptionValid() {
    return (
      this.subscriptionActive &&
      new Date(this.subscriptionExpiresAt) > new Date()
    );
  }
}

module.exports = Technician;
