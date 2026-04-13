# Edge Function: criar-treinadora-admin

Esta edge function permite criar treinadoras com email já confirmado, evitando o problema de confirmação de email do Supabase Auth.

## Deploy

1. Instale o Supabase CLI:
```bash
npm install -g supabase
```

2. Faça login:
```bash
supabase login
```

3. Deploy da função:
```bash
supabase functions deploy criar-treinadora-admin
```

4. Configure as secrets no painel do Supabase:
   - Vá em Project Settings > Edge Functions > Secrets
   - Adicione:
     - `ADMIN_SECRET`: `decifra-admin-secret-2024` (mesma do arquivo .env)
     - `SUPABASE_SERVICE_ROLE_KEY`: sua service role key

## Uso

A função é chamada automaticamente pelo painel admin ao criar uma nova treinadora.

### Request:
```json
{
  "nome": "Nome da Treinadora",
  "email": "email@exemplo.com",
  "whatsapp": "5511999999999",
  "senha": "senha123",
  "secret": "decifra-admin-secret-2024"
}
```

### Response (sucesso):
```json
{
  "success": true,
  "message": "Treinadora criada com sucesso",
  "auth_user_id": "uuid-do-usuario"
}
```

## Segurança

- A função verifica o `ADMIN_SECRET` para autorização
- A service role key nunca é exposta no frontend
- A função usa `email_confirm: true` para criar usuários com email já confirmado
