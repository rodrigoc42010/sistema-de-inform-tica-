ALTER TABLE technician_upgrade_requests ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP DEFAULT NOW();
ALTER TABLE technician_upgrade_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE technician_upgrade_requests ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE technician_upgrade_requests ADD COLUMN IF NOT EXISTS reason TEXT;
