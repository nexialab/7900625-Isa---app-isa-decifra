-- ================================================
-- MIGRATION 008: FASE 5 - ENVIO DE CÓDIGO POR EMAIL
-- ================================================
-- Data: 13/04/2026
-- Descrição: Adiciona rastreamento de envio de código por email
-- ================================================

-- 1. Adicionar colunas para rastrear envio de email
ALTER TABLE codigos
  ADD COLUMN IF NOT EXISTS email_enviado TEXT,
  ADD COLUMN IF NOT EXISTS nome_aluna TEXT,
  ADD COLUMN IF NOT EXISTS data_envio_email TIMESTAMPTZ;

-- 2. Adicionar índice para buscar códigos enviados por email
CREATE INDEX IF NOT EXISTS idx_codigos_email_enviado ON codigos(email_enviado);

-- 3. Política RLS já existe para UPDATE de treinadoras (adicionada no distribuido)
-- Não é necessário criar nova política, a existente permite UPDATE em todos os campos

-- 4. Comentários explicativos
COMMENT ON COLUMN codigos.email_enviado IS 'Email da aluna para o qual o código foi enviado';
COMMENT ON COLUMN codigos.nome_aluna IS 'Nome da aluna para a qual o código foi enviado';
COMMENT ON COLUMN codigos.data_envio_email IS 'Data e hora do último envio do código por email';
