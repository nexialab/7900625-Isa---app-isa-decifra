# Deploy da Edge Function `enviar-codigo-email`

Este guia explica como fazer o deploy da Edge Function do Supabase que substitui o backend Express para envio de códigos por email.

## O que mudou

- ❌ **Antes**: Backend Express (`server/routes/codigos.ts`) + Nodemailer SMTP
- ✅ **Agora**: Supabase Edge Function (`supabase/functions/enviar-codigo-email/index.ts`) + Brevo REST API

Isso elimina a necessidade de hospedar um servidor separado (Render, Railway, etc.).

---

## Pré-requisitos

1. **Supabase CLI** instalada:
   ```bash
   npm install -g supabase
   # ou via Homebrew
   brew install supabase/tap/supabase
   ```

2. **Projeto vinculado**:
   ```bash
   supabase login
   supabase link --project-ref wqbppfngjolnxbwqngfo
   ```

3. **API Key do Brevo**:
   - Acesse https://app.brevo.com/settings/keys/api
   - Crie uma chave com permissão de `sendTransactionalEmails`
   - Anote a chave (você vai configurá-la como secret da Edge Function)

---

## Variáveis de ambiente da Edge Function

A Edge Function precisa das seguintes secrets/variáveis (configuradas no Supabase):

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key do Supabase |
| `BREVO_API_KEY` | API Key do Brevo |
| `BREVO_FROM_EMAIL` | Email de remetente (ex: `noreply@decifra.app`) |
| `BREVO_FROM_NAME` | Nome de exibição do remetente (ex: `Decifra`) |
| `APP_WEB_URL` | URL do app web |
| `APP_STORE_URL` | Link da App Store |
| `PLAY_STORE_URL` | Link do Google Play |

### Como configurar

```bash
# 1. Definir secrets via CLI
supabase secrets set SUPABASE_URL="https://wqbppfngjolnxbwqngfo.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
supabase secrets set BREVO_API_KEY="sua-api-key-do-brevo"
supabase secrets set BREVO_FROM_EMAIL="noreply@decifra.app"
supabase secrets set BREVO_FROM_NAME="Decifra"
supabase secrets set APP_WEB_URL="https://decifra.app"
supabase secrets set APP_STORE_URL="https://apps.apple.com/br/app/decifra/idSEU_ID"
supabase secrets set PLAY_STORE_URL="https://play.google.com/store/apps/details?id=br.com.decifra"

# 2. Verificar se foram salvas corretamente
supabase secrets list
```

> **Dica**: Você também pode configurar secrets pelo Dashboard do Supabase em: **Project Settings > Edge Functions > Secrets**.

---

## Deploy da Edge Function

```bash
# Deploy da function
supabase functions deploy enviar-codigo-email
```

Após o deploy, a URL será:
```
https://wqbppfngjolnxbwqngfo.supabase.co/functions/v1/enviar-codigo-email
```

---

## Testar localmente (opcional)

```bash
# Serve local (usa as secrets do projeto vinculado)
supabase functions serve enviar-codigo-email
```

Em outro terminal, teste com curl:
```bash
curl -X POST http://localhost:54321/functions/v1/enviar-codigo-email \
  -H "Authorization: Bearer $(supabase status | grep 'anon key' | awk '{print $3}')" \
  -H "Content-Type: application/json" \
  -d '{
    "codigoId": "00000000-0000-0000-0000-000000000000",
    "codigo": "TESTE123",
    "emailDestinatario": "teste@exemplo.com",
    "nomeDestinatario": "Maria"
  }'
```

---

## Build do app (frontend)

O frontend agora chama a Edge Function diretamente via `supabase.functions.invoke('enviar-codigo-email')`. **Não é necessário configurar `EXPO_PUBLIC_API_URL`** para essa funcionalidade, pois o cliente Supabase já sabe onde o projeto está hospedado.

Caso você ainda use outras APIs do backend Express para outras funcionalidades, mantenha `EXPO_PUBLIC_API_URL`. Se não houver mais nenhuma rota customizada no Express, você pode removê-lo completamente do fluxo de deploy.

### EAS Build
```bash
eas build --profile production --platform all
```

---

## Troubleshooting

### `401 Unauthorized` na Edge Function
- Verifique se o usuário está logado no app (token JWT válido)
- A Edge Function valida o `Authorization: Bearer <token>` automaticamente

### `500 Configuração do servidor incompleta`
- Faltou configurar `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` nas secrets

### `502 Falha ao enviar e-mail`
- Verifique se `BREVO_API_KEY` está correta
- Verifique se o email remetente está validado no Brevo

### `403 Código não encontrado`
- O `codigoId` não pertence à treinadora logada

---

## Arquitetura final

```
[App Expo] → Supabase Edge Function → Brevo API → [Email da aluna]
                ↓
         [Supabase DB: codigo_emails]
```
