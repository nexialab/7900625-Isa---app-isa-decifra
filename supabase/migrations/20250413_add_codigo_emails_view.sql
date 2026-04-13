-- ================================================
-- MIGRATION: Índice e view para otimizar último email enviado
-- ================================================

-- 1. Índice composto para otimizar a busca do último email por código
CREATE INDEX IF NOT EXISTS idx_codigo_emails_codigo_enviado_em 
  ON codigo_emails(codigo_id, enviado_em DESC);

-- 2. View que retorna códigos com o último email enviado
CREATE OR REPLACE VIEW codigos_com_ultimo_email AS
SELECT 
  c.id,
  c.codigo,
  c.treinadora_id,
  c.valido_ate,
  c.usado,
  c.cliente_id,
  c.distribuido,
  c.created_at,
  e.email_destinatario AS ultimo_email_destinatario,
  e.enviado_em AS ultimo_email_enviado_em
FROM codigos c
LEFT JOIN LATERAL (
  SELECT ce.email_destinatario, ce.enviado_em
  FROM codigo_emails ce
  WHERE ce.codigo_id = c.id
  ORDER BY ce.enviado_em DESC
  LIMIT 1
) e ON true;

-- 3. Garantir que a view respeite RLS do chamador (PostgreSQL 15+)
ALTER VIEW codigos_com_ultimo_email SET (security_invoker = true);

COMMENT ON VIEW codigos_com_ultimo_email IS 'Otimiza consultas que precisam exibir o ultimo email enviado para cada codigo';
