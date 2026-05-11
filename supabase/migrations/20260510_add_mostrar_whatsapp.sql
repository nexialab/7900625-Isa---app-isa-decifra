-- Permite que a treinadora escolha se o WhatsApp aparece no resultado da cliente.
--
-- STATUS (2026-05-10): NÃO APLICADA AINDA.
-- - Local: Supabase local rodando aponta pra outro projeto (momoi), não foi possível aplicar aqui sem conflito.
-- - Produção: aguarda janela combinada com a Isa antes do deploy do app.
--
-- ⚠️  ATENÇÃO PRA QUEM FOR DEPLOYAR:
-- O app já LÊ a coluna `mostrar_whatsapp` em:
--   - hooks/useTreinadorasAdmin.ts (TREINADORA_ADMIN_FIELDS)
--   - app/cliente/resultado.tsx (SELECT)
--   - app/treinadora/index.tsx (SELECT)
--   - app/treinadora/cadastro.tsx (INSERT)
--   - app/(admin)/(dashboard)/treinadoras.tsx (UPDATE/INSERT)
--   - supabase/functions/criar-treinadora-admin/index.ts (INSERT)
-- Subir o app antes desta migration QUEBRA login da treinadora e CRUD admin.
-- Sequência segura: APLICAR esta migration → DEPOIS deploy do app.

ALTER TABLE treinadoras
  ADD COLUMN IF NOT EXISTS mostrar_whatsapp BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN treinadoras.mostrar_whatsapp IS
  'Se true, botão WhatsApp aparece no resultado do cliente (default: true)';
