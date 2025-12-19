const adRepository = require('../infrastructure/database/PostgresAdRepository');
const { BadRequestError } = require('../presentation/utils/httpErrors');

const AD_PRICING = {
  basic: { 7: 19.9, 15: 34.9, 30: 59.9 },
  intermediate: { 7: 29.9, 15: 54.9, 30: 99.9 },
  premium: { 7: 49.9, 15: 89.9, 30: 159.9 },
};

class CreateAd {
  async execute({
    title,
    text,
    linkUrl,
    mediaUrl,
    audience,
    tier,
    duration,
    userId,
  }) {
    if (!title || !text) {
      throw new BadRequestError('Título e texto são obrigatórios');
    }

    const validTiers = ['basic', 'intermediate', 'premium'];
    const validDurations = [7, 15, 30];

    const selectedTier = validTiers.includes(tier) ? tier : 'basic';
    const selectedDuration = validDurations.includes(Number(duration))
      ? Number(duration)
      : 30;

    const price = AD_PRICING[selectedTier][selectedDuration];

    const ad = await adRepository.create({
      title,
      text,
      linkUrl: linkUrl || null,
      mediaUrl: mediaUrl || null,
      audience: audience || 'client',
      tier: selectedTier,
      durationDays: selectedDuration,
      price,
      paymentStatus: 'pending',
      status: 'pending_payment',
      createdBy: userId,
    });

    return ad;
  }
}

module.exports = new CreateAd();
