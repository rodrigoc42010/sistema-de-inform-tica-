const userRepository = require('../infrastructure/database/PostgresUserRepository');
const { NotFoundError } = require('../utils/httpErrors');

class UpdateProfile {
  async execute(userId, userData) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }

    // Update basic info
    if (userData.name) user.name = userData.name;
    if (userData.phone) user.phone = userData.phone;
    if (userData.profileImage) user.profileImageUrl = userData.profileImage;

    // Update address if provided
    if (userData.address) {
      user.address = {
        ...user.address,
        street: userData.address.street || user.address.street,
        number: userData.address.number || user.address.number,
        complement: userData.address.complement || user.address.complement,
        neighborhood:
          userData.address.neighborhood || user.address.neighborhood,
        city: userData.address.city || user.address.city,
        state: userData.address.state || user.address.state,
        zipCode: userData.address.zipCode || user.address.zipCode,
      };
    }

    const updatedUser = await userRepository.update(user);

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      address: updatedUser.address,
      profileImage: updatedUser.profileImageUrl,
    };
  }
}

module.exports = new UpdateProfile();
