-- Add premium ad fields to ads table
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending', -- pending, paid, failed
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_payment'; -- pending_payment, active, expired, paused

-- Update existing ads to be active basic 30 days
UPDATE ads SET 
  tier = 'basic', 
  duration_days = 30, 
  price = 0.00, 
  payment_status = 'paid', 
  status = 'active' 
WHERE status IS NULL OR status = 'pending_payment';
