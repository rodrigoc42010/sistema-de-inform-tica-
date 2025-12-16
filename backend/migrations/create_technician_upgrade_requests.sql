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

CREATE INDEX IF NOT EXISTS idx_tur_user ON technician_upgrade_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_tur_status ON technician_upgrade_requests(status);
CREATE INDEX IF NOT EXISTS idx_tur_created_at ON technician_upgrade_requests(created_at);
