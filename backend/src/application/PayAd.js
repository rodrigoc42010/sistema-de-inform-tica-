const adRepository = require('../infrastructure/database/PostgresAdRepository');
const paymentRepository = require('../infrastructure/database/PostgresPaymentRepository');
const {
  NotFoundError,
  ForbiddenError,
} = require('../presentation/utils/httpErrors');
const { getPool } = require('../../db/pgClient');

class PayAd {
  async execute({ adId, userId }) {
    const ad = await adRepository.findById(adId);

    if (!ad) {
      throw new NotFoundError('Anúncio não encontrado');
    }

    if (String(ad.createdBy) !== String(userId)) {
      throw new ForbiddenError('Permissão negada');
    }

    if (ad.status === 'active') {
      return ad;
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + ad.durationDays);

      // 1. Update Ad
      const updatedAd = await adRepository.update(
        adId,
        {
          paymentStatus: 'paid',
          status: 'active',
          startDate,
          endDate,
        },
        client
      );

      // 2. Create Payment Record
      await paymentRepository.create(
        {
          userId,
          amount: ad.price,
          currency: 'BRL',
          paymentMethod: 'simulation',
          status: 'paid',
          notes: `Pagamento Anúncio ${ad.tier} (${ad.durationDays} dias)`,
        },
        client
      );

      await client.query('COMMIT');
      return updatedAd;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new PayAd();
