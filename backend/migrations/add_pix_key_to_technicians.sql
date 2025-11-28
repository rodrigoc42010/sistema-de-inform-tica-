-- Add PIX key column to technicians table
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255);

-- Add comment to the column
COMMENT ON COLUMN technicians.pix_key IS 'Chave PIX do técnico (CPF, email, telefone ou chave aleatória)';
