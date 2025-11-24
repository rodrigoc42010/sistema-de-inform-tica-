-- Migration: Add geolocation fields to technicians table
-- Created: 2025-01-24

-- Add address and location fields
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_number TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_complement TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_neighborhood TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS address_zipcode TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add business information fields
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS business_hours JSONB;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS business_description TEXT;

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_technicians_location ON technicians(latitude, longitude);

-- Add comments
COMMENT ON COLUMN technicians.latitude IS 'Latitude da localização do técnico/assistência técnica';
COMMENT ON COLUMN technicians.longitude IS 'Longitude da localização do técnico/assistência técnica';
COMMENT ON COLUMN technicians.business_name IS 'Nome da assistência técnica (se diferente do nome do técnico)';
COMMENT ON COLUMN technicians.business_hours IS 'Horário de funcionamento em formato JSON';
