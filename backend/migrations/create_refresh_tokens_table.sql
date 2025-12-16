-- Migration: Create refresh_tokens table
-- Data: 2025-12-04
-- Descrição: Tabela para armazenar refresh tokens JWT

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  jti UUID NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(jti);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON refresh_tokens(revoked);

-- Comentários
COMMENT ON TABLE refresh_tokens IS 'Armazena refresh tokens JWT para autenticação de longa duração';
COMMENT ON COLUMN refresh_tokens.jti IS 'JWT ID único para identificar o token';
COMMENT ON COLUMN refresh_tokens.expires_at IS 'Data de expiração do refresh token (30 dias)';
COMMENT ON COLUMN refresh_tokens.revoked IS 'Indica se o token foi revogado (logout)';
