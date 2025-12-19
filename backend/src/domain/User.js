class User {
  constructor({
    id,
    name,
    email,
    passwordHash,
    role,
    phone,
    cpfCnpj,
    address = {},
    profileImageUrl,
    emailVerified = false,
    twofaEnabled = false,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
    this.role = role;
    this.phone = phone;
    this.cpfCnpj = cpfCnpj;
    this.address = address;
    this.profileImageUrl = profileImageUrl;
    this.emailVerified = emailVerified;
    this.twofaEnabled = twofaEnabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isAdmin() {
    return this.role === 'admin';
  }

  isTechnician() {
    return this.role === 'technician';
  }

  isClient() {
    return this.role === 'client';
  }
}

module.exports = User;
