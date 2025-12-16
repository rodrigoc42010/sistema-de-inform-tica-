const colors = require('colors');

async function initPostgres() {
  try {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      console.warn(
        'DATABASE_URL não definido; pulando init do Postgres.'.yellow
      );
      return false;
    }

    const { getPool } = require('../db/pgClient');
    const pool = getPool();

    const client = await pool.connect();
    try {
      // Apenas garantir conexão, migrations opcionais para reduzir cold-start
      const runMigrations = process.env.RUN_MIGRATIONS_ON_START === 'true';
      if (!runMigrations) {
        // Verificar se tabelas essenciais existem; se não, rodar migrations automaticamente
        const rs = await client.query(
          "SELECT to_regclass('public.users') AS users, to_regclass('public.technicians') AS technicians"
        );
        const missingUsers = !rs.rows[0].users;
        const missingTechs = !rs.rows[0].technicians;
        if (!missingUsers && !missingTechs) {
          console.log(
            'Postgres conectado (tabelas existentes; sem migrations no start).'
              .green.bold
          );
          client.release();
          return true;
        }
        console.log(
          'Tabelas ausentes detectadas; executando migrations automaticamente.'
            .yellow.bold
        );
      }

      await client.query('BEGIN');

      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
      } catch (e) {}
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      } catch (e) {}

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

      await client.query(
        'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check'
      );
      await client.query(
        "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client','technician','admin'))"
      );

      await client.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE'
      );
      await client.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP NULL'
      );
      await client.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB'
      );
      await client.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS current_jti TEXT'
      );
      await client.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_enabled BOOLEAN DEFAULT FALSE'
      );
      await client.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_temp_code TEXT'
      );
      await client.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_temp_expires TIMESTAMP'
      );
      await client.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS twofa_secret TEXT'
      );

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

      // Alinhar colunas usadas pelo código
      await client.query(
        'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION'
      );
      await client.query(
        'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION'
      );
      await client.query(
        'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_street TEXT'
      );
      await client.query(
        'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_number TEXT'
      );
      await client.query(
        'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_city TEXT'
      );
      await client.query(
        'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_state TEXT'
      );
      await client.query(
        'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_zipcode TEXT'
      );
      await client.query(
        'ALTER TABLE technicians ADD COLUMN IF NOT EXISTS pix_key TEXT'
      );

      await client.query(`
        CREATE TABLE IF NOT EXISTS technician_upgrade_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
          services JSONB,
          specialties JSONB,
          pickup_service BOOLEAN DEFAULT FALSE,
          pickup_fee NUMERIC DEFAULT 0,
          payment_methods JSONB,
          notes TEXT,
          admin_notes TEXT,
          approved_by UUID REFERENCES users(id),
          approved_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_tur_user ON technician_upgrade_requests(user_id)'
      );
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_tur_status ON technician_upgrade_requests(status)'
      );
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_tur_created_at ON technician_upgrade_requests(created_at)'
      );

      await client.query(
        'ALTER TABLE technician_upgrade_requests ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP DEFAULT NOW()'
      );
      await client.query(
        'ALTER TABLE technician_upgrade_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP'
      );
      await client.query(
        'ALTER TABLE technician_upgrade_requests ADD COLUMN IF NOT EXISTS reviewed_by UUID'
      );
      await client.query(
        'ALTER TABLE technician_upgrade_requests ADD COLUMN IF NOT EXISTS reason TEXT'
      );

      // Índices úteis
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_technicians_user_id ON technicians(user_id)'
      );
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(client)'
      );
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets(technician)'
      );
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_ads_created_by ON ads(created_by)'
      );

      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          jti TEXT NOT NULL UNIQUE,
          user_agent TEXT,
          ip TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          last_used_at TIMESTAMP,
          revoked_at TIMESTAMP
        );
      `);
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)'
      );
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_sessions_jti ON sessions(jti)'
      );

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

      // Garantir colunas usadas pelo módulo de anúncios
      await client.query('ALTER TABLE ads ADD COLUMN IF NOT EXISTS tier TEXT');
      await client.query(
        'ALTER TABLE ads ADD COLUMN IF NOT EXISTS duration_days INTEGER'
      );
      await client.query(
        'ALTER TABLE ads ADD COLUMN IF NOT EXISTS price NUMERIC'
      );
      await client.query(
        'ALTER TABLE ads ADD COLUMN IF NOT EXISTS payment_status TEXT'
      );
      await client.query(
        'ALTER TABLE ads ADD COLUMN IF NOT EXISTS status TEXT'
      );

      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          admin_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          entity TEXT NOT NULL,
          entity_id TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_id)'
      );
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_audit_entity ON admin_audit_logs(entity)'
      );
      await client.query(
        'CREATE INDEX IF NOT EXISTS idx_audit_created_at ON admin_audit_logs(created_at)'
      );

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

      await client.query(`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          event TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY');
      await client.query(
        'ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY'
      );
      await client.query(
        'ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY'
      );
      await client.query('ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY');
      await client.query(
        'ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY'
      );
      await client.query('ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY');
      await client.query(
        'ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY'
      );
      await client.query(
        'ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY'
      );
      await client.query(
        'ALTER TABLE public.blacklisted_tokens ENABLE ROW LEVEL SECURITY'
      );
      await client.query(
        'ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY'
      );

      await client.query('COMMIT');

      console.log('Postgres inicializado e tabelas garantidas.'.green.bold);
      return true;
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Falha ao inicializar Postgres:', e.message);
      return false;
    } finally {
      try {
        client.release();
      } catch {}
    }
  } catch (err) {
    console.error('Erro ao conectar ao Postgres:', err.message);
    return false;
  }
}

module.exports = initPostgres;
