const colors = require('colors');

async function initPostgres() {
  try {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      console.warn('DATABASE_URL não definido; pulando init do Postgres.'.yellow);
      return false;
    }

    const { getPool } = require('../db/pgClient');
    const pool = getPool();

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Extensões para UUID
      await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

      // Tabelas principais
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('client','technician')),
          phone TEXT NOT NULL,
          cpf_cnpj TEXT,
          address JSONB,
          bank_info JSONB,
          profile_image TEXT,
          email_verified BOOLEAN DEFAULT FALSE,
          email_verification_token TEXT,
          email_verification_expires TIMESTAMP,
          terms_accepted BOOLEAN DEFAULT FALSE,
          terms_accepted_at TIMESTAMP NULL,
          failed_login_attempts INTEGER DEFAULT 0,
          lock_until TIMESTAMP,
          last_login_at TIMESTAMP,
          password_changed_at TIMESTAMP,
          ad_free_until TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE');
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP NULL');

      await client.query(`
        CREATE TABLE IF NOT EXISTS technicians (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          login_id TEXT UNIQUE,
          services JSONB,
          specialties JSONB,
          rating NUMERIC DEFAULT 0,
          total_reviews INTEGER DEFAULT 0,
          reviews JSONB,
          availability BOOLEAN DEFAULT TRUE,
          pickup_service BOOLEAN DEFAULT FALSE,
          pickup_fee NUMERIC DEFAULT 0,
          certifications JSONB,
          payment_methods JSONB,
          subscription_active BOOLEAN DEFAULT FALSE,
          subscription_expiry TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          client UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          technician UUID REFERENCES users(id) ON DELETE SET NULL,
          status TEXT,
          priority TEXT,
          device_type TEXT,
          device_brand TEXT,
          device_model TEXT,
          attachments JSONB,
          service_items JSONB,
          initial_diagnosis TEXT,
          final_report TEXT,
          start_date TIMESTAMP,
          estimated_completion_date TIMESTAMP,
          completion_date TIMESTAMP,
          total_price NUMERIC DEFAULT 0,
          payment_status TEXT,
          payment_method TEXT,
          pickup_requested BOOLEAN DEFAULT FALSE,
          pickup_address JSONB,
          notes JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS ads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          text TEXT NOT NULL,
          link_url TEXT,
          media_url TEXT,
          audience TEXT DEFAULT 'client',
          active BOOLEAN DEFAULT TRUE,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          impressions INTEGER DEFAULT 0,
          clicks INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type TEXT DEFAULT 'ticket',
          ad UUID REFERENCES ads(id) ON DELETE SET NULL,
          ticket UUID REFERENCES tickets(id) ON DELETE SET NULL,
          client UUID REFERENCES users(id) ON DELETE SET NULL,
          technician UUID REFERENCES users(id) ON DELETE SET NULL,
          amount NUMERIC NOT NULL,
          currency TEXT DEFAULT 'BRL',
          payment_method TEXT NOT NULL,
          status TEXT DEFAULT 'pendente',
          payment_intent_id TEXT,
          payment_date TIMESTAMP,
          receipt_url TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          limits JSONB,
          price NUMERIC DEFAULT 0,
          currency TEXT DEFAULT 'BRL',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'active',
          start_date TIMESTAMP DEFAULT NOW(),
          end_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS payment_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          provider TEXT,
          intent_id TEXT,
          payload JSONB,
          status TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS blacklisted_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          jti TEXT NOT NULL UNIQUE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP NOT NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query('COMMIT');

      console.log('Postgres inicializado e tabelas garantidas.'.green.bold);
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Falha ao inicializar Postgres:', e.message);
      return false;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao conectar ao Postgres:', err.message);
    return false;
  }
}

module.exports = initPostgres;