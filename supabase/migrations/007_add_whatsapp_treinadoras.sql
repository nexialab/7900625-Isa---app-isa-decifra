-- Migration: Adicionar coluna whatsapp na tabela treinadoras
-- Data: 2026-04-13

-- 1. Adicionar coluna whatsapp (nullable inicialmente, será NOT NULL após migração de dados)
ALTER TABLE treinadoras 
ADD COLUMN whatsapp TEXT;

-- 2. Adicionar comentário explicativo na coluna
COMMENT ON COLUMN treinadoras.whatsapp IS 
  'Número de WhatsApp da treinadora no formato internacional para links (ex: +5511999999999)';

-- 3. Criar índice para busca rápida por whatsapp
CREATE INDEX idx_treinadoras_whatsapp ON treinadoras(whatsapp);

-- 4. Criar política RLS para treinadoras atualizarem seu próprio whatsapp
-- Nota: A tabela já possui RLS habilitado, então apenas criamos a nova política

-- Política para permitir que treinadoras atualizem seu próprio registro (incluindo whatsapp)
DROP POLICY IF EXISTS "Treinadoras podem atualizar seu whatsapp" ON treinadoras;

CREATE POLICY "Treinadoras podem atualizar seu whatsapp"
  ON treinadoras
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Nota sobre a política existente:
-- A política "Treinadoras podem atualizar seus dados" provavelmente já cobre
-- a atualização do whatsapp. A política acima é mais específica se necessário,
-- ou pode ser removida se a política geral já é suficiente.

-- 5. (Opcional) Adicionar constraint de formato para garantir formato internacional
-- Descomentar após garantir que todos os registros possuem o formato correto:
-- ALTER TABLE treinadoras 
-- ADD CONSTRAINT chk_whatsapp_format 
-- CHECK (whatsapp ~ '^\+[1-9]\d{1,14}$');

-- 6. Atualizar o trigger de updated_at se existir
-- Garante que updated_at seja atualizado quando whatsapp for modificado
-- (O trigger existente provavelmente já cobre isso, mas mantemos o registro)
