const Redis = require('ioredis');
const colors = require('colors');

class RedisService {
  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    this.client.on('connect', () => {
      console.log('[Redis] Connected successfully.'.green);
    });

    this.client.on('error', (err) => {
      console.error('[Redis] Connection error:'.red, err.message);
    });
  }

  async set(key, value, ttlSeconds = null) {
    const val = typeof value === 'object' ? JSON.stringify(value) : value;
    if (ttlSeconds) {
      await this.client.set(key, val, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, val);
    }
  }

  async get(key) {
    const val = await this.client.get(key);
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }

  async del(key) {
    await this.client.del(key);
  }

  async exists(key) {
    return (await this.client.exists(key)) === 1;
  }
}

module.exports = new RedisService();
