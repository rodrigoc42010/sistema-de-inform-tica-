const { getPool } = require('../../../db/pgClient');
const Technician = require('../../domain/Technician');

class PostgresTechnicianRepository {
  constructor() {
    this.pool = getPool();
  }

  async findAllActive() {
    const rs = await this.pool.query(`
      SELECT t.*, u.name, u.email, u.phone 
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE u.role = 'technician'
    `);
    return rs.rows.map((row) => ({
      ...this._mapToEntity(row),
      name: row.name,
      email: row.email,
      phone: row.phone,
    }));
  }

  async findNearby(lat, lng, radiusKm) {
    const rs = await this.pool.query(`
      SELECT t.*, u.name, u.email, u.phone 
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE t.latitude IS NOT NULL AND t.longitude IS NOT NULL
    `);

    return rs.rows
      .map((row) => {
        const entity = this._mapToEntity(row);
        return {
          ...entity,
          name: row.name,
          distance: this._calculateDistance(
            lat,
            lng,
            row.latitude,
            row.longitude
          ),
        };
      })
      .filter((t) => t.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  async findTop(city, state, limit = 5) {
    let query = `
      SELECT t.*, u.name, u.email, u.phone 
      FROM technicians t
      JOIN users u ON t.user_id = u.id
      WHERE u.role = 'technician'
    `;
    const params = [];
    let i = 1;

    if (city) {
      query += ` AND u.address->>'city' = $${i}`;
      params.push(city);
      i++;
    }
    if (state) {
      query += ` AND u.address->>'state' = $${i}`;
      params.push(state);
      i++;
    }

    query += ` ORDER BY t.rating_average DESC, t.total_reviews DESC LIMIT $${i}`;
    params.push(limit);

    const rs = await this.pool.query(query, params);
    return rs.rows.map((row) => ({
      ...this._mapToEntity(row),
      name: row.name,
    }));
  }

  async addReview(
    technicianId,
    { rating, comment, ticketId, clientId },
    client = null
  ) {
    const db = client || this.pool;
    await db.query(
      `INSERT INTO technician_reviews (technician_id, client_id, ticket_id, rating, comment) 
       VALUES ($1, $2, $3, $4, $5)`,
      [technicianId, clientId, ticketId, rating, comment]
    );

    await db.query(
      `UPDATE technicians 
       SET 
         total_reviews = total_reviews + 1,
         rating_average = (rating_average * total_reviews + $1) / (total_reviews + 1)
       WHERE id = $2`,
      [rating, technicianId]
    );
  }

  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  _mapToEntity(row) {
    return new Technician({
      id: row.id,
      userId: row.user_id,
      loginId: row.login_id,
      bio: row.bio,
      latitude: row.latitude,
      longitude: row.longitude,
      pickupService: row.pickup_service,
      pickupFee: row.pickup_fee,
      pixKey: row.pix_key,
      ratingAverage: row.rating_average,
      totalReviews: row.total_reviews,
      subscriptionActive: row.subscription_active,
      subscriptionExpiresAt: row.subscription_expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = new PostgresTechnicianRepository();
