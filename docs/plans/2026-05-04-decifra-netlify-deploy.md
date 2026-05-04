# Decifra — Deploy Web no Netlify (plano de implementação)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Subir a versão web do app Decifra (Expo) no Netlify, com o backend funcionando 100% via Supabase Edge Functions, partindo de um projeto Supabase recém-criado e vazio.

**Architecture:** Frontend Expo Router exportado como SPA estática (`dist/`) hospedada no Netlify. Backend = 6 Supabase Edge Functions (Deno) deployadas no projeto `hxvlsmxmebzuycvvimgz`. Banco PostgreSQL gerenciado pelo Supabase, populado via migrations SQL aplicadas pelo MCP. Auth via Supabase Auth (email+senha), persistido em `localStorage`/`AsyncStorage`. Sem servidor Node.js em produção (o `server/` Express e o `pdf-service/` ficam fora do escopo deste deploy).

**Tech Stack:** Expo 54 + React Native 0.81 + react-native-web (frontend) · Supabase (Auth, Postgres, Edge Functions) · Brevo (email transacional) · Hotmart (webhook de compra) · Netlify (CDN + build estático).

**Projetos Supabase relevantes:**
- ✅ Em uso: `hxvlsmxmebzuycvvimgz` ("7900625-Isa---app-isa-decifra", us-west-2, criado 2026-05-04, vazio)
- ⚠️ Existente mas NÃO é o Decifra: `vzuljqaintdjfonvplji` ("Artioescola + NexIA") — data lake da NexIA com leads e n8n. Tem 3 tabelas com RLS desabilitado (alerta separado).
- ❌ Fantasma: `wqbppfngjolnxbwqngfo` (estava no `.env` original, NXDOMAIN, descartar).

---

## Fase A — Preparar o backend (Supabase)

### Task A1: Aplicar schema base no projeto novo

**Files:**
- Source: `supabase-schema.sql` (root do repo, 537 linhas)
- Target: projeto Supabase `hxvlsmxmebzuycvvimgz`

**Step 1: Conferir tabelas atuais (deve estar vazio)**

Tool: `mcp__supabase__list_tables` com `project_id=hxvlsmxmebzuycvvimgz`
Expected: `{"tables":[]}`

**Step 2: Aplicar o schema base**

Tool: `mcp__supabase__apply_migration` com:
- `project_id`: `hxvlsmxmebzuycvvimgz`
- `name`: `000_base_schema_decifra`
- `query`: conteúdo de `supabase-schema.sql`

Tabelas que serão criadas: `treinadoras`, `clientes`, `codigos`, `respostas`, `resultados`, `protocolos`, `protocolos_recomendados`, `codigo_emails`. Plus função `update_updated_at_column()` e triggers.

**Step 3: Validar**

Tool: `mcp__supabase__list_tables` — esperado: 8 tabelas listadas, todas com `rls_enabled` (verificar; se vier `false` em alguma, anotar pra Fase E).

**Step 4: Não comitar nada ainda** — mudança é só no Supabase.

---

### Task A2: Aplicar migrations 006 → 008 → 20250413_*

**Files:**
- `supabase/migrations/006_fase5_sistema_codigos.sql`
- `supabase/migrations/007_add_whatsapp_treinadoras.sql`
- `supabase/migrations/007_fase5_codigo_format.sql`
- `supabase/migrations/008_fase5_envio_email_codigos.sql`
- `supabase/migrations/20250413_add_codigo_emails.sql`
- `supabase/migrations/20250413_add_codigo_emails_view.sql`
- `supabase/migrations/20250413_add_notificacao_emails.sql`
- ❌ NÃO aplicar `FASE5_EXECUTAR_NO_DASHBOARD.sql` (overlap com 006-008)

**Step 1: Aplicar uma a uma, em ordem cronológica**

Para cada arquivo, em ordem:
1. `006_fase5_sistema_codigos`
2. `007_add_whatsapp_treinadoras`
3. `007_fase5_codigo_format`
4. `008_fase5_envio_email_codigos`
5. `20250413_add_codigo_emails`
6. `20250413_add_codigo_emails_view`
7. `20250413_add_notificacao_emails`

Tool: `mcp__supabase__apply_migration` com `name = <nome do arquivo sem .sql>` e `query = <conteúdo>`.

**Step 2: Verificar tabelas finais**

Tool: `mcp__supabase__list_tables` — esperado: tabelas adicionais (`compras_aprovadas`, `produtos_hotmart`, `notificacao_emails`, etc).

**Step 3: Se alguma migration falhar**

Investigar o erro antes de prosseguir. Conflito comum: `007_*` duplicado pode tentar criar coluna que outra 007 já criou. Aplicar manualmente o trecho que faz sentido se necessário.

---

### Task A3: Configurar secrets das edge functions

**Files:** Painel Supabase > Project Settings > Edge Functions > Secrets (não versionado).

**Secrets obrigatórios:**

| Variável | Origem | Notas |
|---|---|---|
| `ADMIN_SECRET` | gerar string aleatória 32+ chars | usado pra criar treinadora admin |
| `BREVO_API_KEY` | painel Brevo > SMTP & API | necessário pra emails saírem |
| `BREVO_FROM_EMAIL` | ex: `noreply@decifra.app` | precisa ser email verificado no Brevo |
| `BREVO_FROM_NAME` | `Decifra` | display name |
| `APP_WEB_URL` | URL do Netlify (preview ou prod) | usado em links dos emails |
| `APP_STORE_URL` | placeholder OK por enquanto | aparece no email |
| `PLAY_STORE_URL` | placeholder OK por enquanto | aparece no email |
| `DECIFRA_LOGIN_URL` | URL do Netlify + `/login` | link de login no email |

**Secrets opcionais (Hotmart, só se for ligar webhook real agora):**
- `HOTMART_PRODUCT_CREDITS_JSON`: ex `{"PROD_HASH_1":1,"PROD_HASH_2":5}`
- `HOTMART_WEBHOOK_TOKEN`: token do webhook
- `HOTMART_WEBHOOK_HMAC_SECRET`: secret HMAC se Hotmart estiver configurada pra assinar
- `HOTMART_WEBHOOK_URL_SECRET`: secret na URL se aplicável

**Auto-injetados (não precisa setar):** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase injeta automaticamente em edge functions.

**Step 1: Gerar `ADMIN_SECRET` aleatório**

```bash
openssl rand -base64 32
```

Salvar em local seguro (1Password, Vault).

**Step 2: Setar via painel Supabase** (não tem MCP tool dedicada — fazer no browser).

---

### Task A4: Deployar 6 edge functions

**Files:** `supabase/functions/<nome>/index.ts`
- `cadastrar-cliente`
- `criar-treinadora-admin`
- `enviar-codigo-decifra`
- `enviar-codigo-email`
- `hotmart-webhook`
- `notificar-teste-finalizado`

**Step 1: Para cada função, deployar**

Tool: `mcp__supabase__deploy_edge_function` com:
- `project_id`: `hxvlsmxmebzuycvvimgz`
- `name`: nome da função
- `files`: `[{name: "index.ts", content: <conteúdo de supabase/functions/<nome>/index.ts>}]`
- `entrypoint_path`: `index.ts`

**Step 2: Validar deploy**

Tool: `mcp__supabase__list_edge_functions` — esperado: 6 funções listadas com `status=active`.

**Step 3: Smoke test de uma**

```bash
curl -X POST "https://hxvlsmxmebzuycvvimgz.supabase.co/functions/v1/criar-treinadora-admin" \
  -H "Authorization: Bearer <ADMIN_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"email":"renan@nexialab.com.br","senha":"Test123!@#","nome":"Renan Admin"}'
```
Expected: HTTP 200 com `{ user_id, treinadora_id }` ou 4xx descritivo.

---

## Fase B — Frontend (`.env` + build local)

### Task B1: Atualizar `.env` com credenciais reais

**Files:** `/home/renan/Renan/code/7900625-Isa---app-isa-decifra/.env`

**Conteúdo final esperado:**

```env
# === Frontend (Expo web → Netlify) ===
EXPO_PUBLIC_SUPABASE_URL=https://hxvlsmxmebzuycvvimgz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_yWqcOBxgc5mgtkGybpYMxQ_FU-N2Jsx

# === Server-side (só se ainda for usar o server/ Express; opcional) ===
# SUPABASE_URL=https://hxvlsmxmebzuycvvimgz.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=<pegar em Settings > API do Supabase, "service_role" key>
```

**Remover do .env atual** (não são mais usados em lugar nenhum do app):
- `NODE_ENV` (Expo gerencia)
- `AIOX_VERSION` (não referenciado)
- `EXPO_PUBLIC_API_URL` (lib/query-client.ts não é montado)
- `ADMIN_SECRET` (vai pro Supabase Secrets, não no `.env` do app)
- `BREVO_*` (idem)
- `APP_WEB_URL`, `APP_STORE_URL`, `PLAY_STORE_URL` (idem)

**Step 1: Reescrever o arquivo** (com Edit/Write tool).

**Step 2: Não comitar.** `.env` está no `.gitignore`.

---

### Task B2: Build local de web

**Step 1: Instalar deps (se não tiver feito)**

```bash
npm install
```

**Step 2: Buildar**

```bash
npm run build:web
```

Expected: pasta `dist/` criada com `index.html`, `_expo/static/js/web/`, `assets/`. Sem erro.

**Step 3: Servir local**

```bash
npx serve dist -l 4173
```

**Step 4: Abrir browser em `http://localhost:4173`**

- Tela de login do admin deve aparecer
- Devtools > Network: requests pra `hxvlsmxmebzuycvvimgz.supabase.co` (não pra fantasma)
- Tentar logar com qualquer credencial → esperado: erro `Invalid login credentials` (significa que a chamada chegou no Supabase real ✓)

---

## Fase C — Netlify

### Task C1: Corrigir `netlify.toml`

**Files:** `/home/renan/Renan/code/7900625-Isa---app-isa-decifra/netlify.toml`

**Conteúdo final:**

```toml
[build]
  command = "npm run build:web"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/_expo/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Step 1: Edit do arquivo.**

**Step 2: Commit.**

```bash
git add netlify.toml
git commit -m "fix(netlify): adicionar comando de build e cache de assets"
```

---

### Task C2: Configurar env vars no painel Netlify

**Files:** Painel Netlify (browser, não versionado).

**Variáveis (Site settings > Environment variables):**

| Key | Value | Scopes |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://hxvlsmxmebzuycvvimgz.supabase.co` | Builds, Runtime |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_yWqcOBxgc5mgtkGybpYMxQ_FU-N2Jsx` | Builds, Runtime |

⚠️ **Nada além disso.** Service role, Brevo, Hotmart, Admin secret — tudo isso vai no Supabase, NÃO no Netlify.

---

### Task C3: Deployar preview

**Step 1: Criar site no Netlify** (via dashboard ou CLI). Conectar ao repo Git.

**Step 2: Trigger build.** Aguardar log:
- `npm install` ✓
- `npm run build:web` → `npx expo export --platform web` ✓
- Deploy dist/ ✓

**Step 3: Abrir preview URL** (`<site>.netlify.app`).

**Step 4: Atualizar `APP_WEB_URL` e `DECIFRA_LOGIN_URL` no Supabase Secrets** com a URL do preview.

---

## Fase D — Smoke test end-to-end

### Task D1: Criar primeira treinadora admin

```bash
curl -X POST "https://hxvlsmxmebzuycvvimgz.supabase.co/functions/v1/criar-treinadora-admin" \
  -H "Content-Type: application/json" \
  -d '{
    "admin_secret": "<ADMIN_SECRET>",
    "email": "renan@nexialab.com.br",
    "senha": "<senha forte>",
    "nome": "Renan Admin",
    "creditos": 100
  }'
```

Validar via SQL:

Tool: `mcp__supabase__execute_sql` com `select id, email, nome, creditos from treinadoras;`

Expected: 1 row.

### Task D2: Login e fluxo completo

1. No preview Netlify, ir em `/(admin)/login`
2. Logar com email/senha criados em D1
3. Criar cliente novo
4. Gerar código
5. Enviar por email → checar caixa de entrada
6. Logout, abrir link do email/usar código no fluxo cliente
7. Completar teste IPIP-NEO até resultados

Se algum passo falhar: olhar logs com `mcp__supabase__get_logs` por serviço (`edge-function`, `auth`, `postgres`).

---

## Fase E — Pendências (fora do escopo do deploy)

- **`pdf-service/`**: decidir entre deletar / migrar pra Fly.io / virar edge function. Hoje não é chamado pelo frontend.
- **Hotmart real**: configurar webhook URL no painel da Hotmart (`https://hxvlsmxmebzuycvvimgz.supabase.co/functions/v1/hotmart-webhook?token=<HOTMART_WEBHOOK_URL_SECRET>`). Validar com compra sandbox.
- **`server/` Express**: rotas vazias. Decidir entre deletar tudo (`server/`, `serve.js`, `drizzle.config.ts`, `shared/schema.ts`, `nodemailer`, `@types/express`) ou implementar rotas que justifiquem.
- **Lixo no root**: deletar `decifra-sync/`, `decifra-sync-v2/`, zips, `temp_logo_base64.txt`, screenshots `web-*.png`. Mover `.md` de plano pra `docs/plans/legacy/`.
- **RLS no projeto antigo**: `vzuljqaintdjfonvplji` tem 3 tabelas n8n com RLS off — desenhar policies.

---

## Resumo das envs (referência rápida)

### No `.env` local (frontend Expo)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### No painel Netlify (mesmas duas)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### No painel Supabase > Edge Functions > Secrets
- `ADMIN_SECRET`
- `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`
- `APP_WEB_URL`, `APP_STORE_URL`, `PLAY_STORE_URL`, `DECIFRA_LOGIN_URL`
- (opcional Hotmart) `HOTMART_PRODUCT_CREDITS_JSON`, `HOTMART_WEBHOOK_TOKEN`, `HOTMART_WEBHOOK_HMAC_SECRET`, `HOTMART_WEBHOOK_URL_SECRET`
- (auto pelo Supabase) `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
