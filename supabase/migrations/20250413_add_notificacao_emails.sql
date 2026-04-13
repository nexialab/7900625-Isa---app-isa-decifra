-- Tabela de log para notificações de teste finalizado enviadas às treinadoras
CREATE TABLE IF NOT EXISTS notificacao_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  treinadora_id UUID NOT NULL REFERENCES treinadoras(id) ON DELETE CASCADE,
  resultado_id UUID REFERENCES resultados(id) ON DELETE SET NULL,
  email_destinatario TEXT NOT NULL,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'falha')),
  tipo TEXT NOT NULL DEFAULT 'teste_finalizado' CHECK (tipo IN ('teste_finalizado')),
  detalhes JSONB
);

CREATE INDEX idx_notificacao_emails_cliente_id ON notificacao_emails(cliente_id);
CREATE INDEX idx_notificacao_emails_treinadora_id ON notificacao_emails(treinadora_id);
CREATE INDEX idx_notificacao_emails_enviado_em ON notificacao_emails(enviado_em);
