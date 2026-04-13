-- ================================================
-- MIGRATION: Tabela de registro de envios de email de códigos
-- ================================================

CREATE TABLE IF NOT EXISTS codigo_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_id UUID NOT NULL REFERENCES codigos(id) ON DELETE CASCADE,
  treinadora_id UUID NOT NULL REFERENCES treinadoras(id) ON DELETE CASCADE,
  email_destinatario TEXT NOT NULL,
  nome_destinatario TEXT,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_codigo_emails_codigo_id ON codigo_emails(codigo_id);
CREATE INDEX IF NOT EXISTS idx_codigo_emails_treinadora_id ON codigo_emails(treinadora_id);
CREATE INDEX IF NOT EXISTS idx_codigo_emails_enviado_em ON codigo_emails(enviado_em);

-- Habilitar RLS
ALTER TABLE codigo_emails ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Treinadoras podem ver emails dos seus codigos"
  ON codigo_emails FOR SELECT
  USING (
    treinadora_id IN (
      SELECT id FROM treinadoras WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Treinadoras podem registrar envio de email"
  ON codigo_emails FOR INSERT
  WITH CHECK (
    treinadora_id IN (
      SELECT id FROM treinadoras WHERE auth_user_id = auth.uid()
    )
  );

-- Admins podem ver tudo
CREATE POLICY "Admins podem ver todos os codigo_emails"
  ON codigo_emails FOR SELECT
  USING (is_admin());

COMMENT ON TABLE codigo_emails IS 'Histórico de envios de e-mails contendo códigos de acesso para alunas';
