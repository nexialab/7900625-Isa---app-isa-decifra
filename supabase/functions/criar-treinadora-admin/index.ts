import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

// Chave de autorização para chamar esta função (definir no .env)
const ADMIN_SECRET = Deno.env.get('ADMIN_SECRET') || 'sua-chave-secreta-aqui';

// Service Role Key (nunca expor no frontend!)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface RequestBody {
  nome: string;
  email: string;
  whatsapp: string;
  mostrar_whatsapp?: boolean;
  senha: string;
  secret: string;
}

Deno.serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const body: RequestBody = await req.json();
    const { nome, email, whatsapp, mostrar_whatsapp = true, senha, secret } = body;

    // Validar secret
    if (secret !== ADMIN_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers }
      );
    }

    // Validar campos obrigatórios
    if (!nome || !email || !whatsapp || !senha) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { status: 400, headers }
      );
    }

    // Criar cliente com service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const emailLimpo = email.trim().toLowerCase();

    // 1. Criar usuário no Auth com email confirmado (usando admin API)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: emailLimpo,
      password: senha,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        nome: nome.trim(),
      },
    });

    if (authError) {
      // Se o email já existe, tentar pegar o user existente
      if (authError.message?.includes('already been registered')) {
        // Buscar usuário existente
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === emailLimpo);
        
        if (existingUser) {
          // Verificar se já existe treinadora vinculada
          const { data: existingTreinadora } = await supabase
            .from('treinadoras')
            .select('id')
            .eq('auth_user_id', existingUser.id)
            .single();

          if (existingTreinadora) {
            return new Response(
              JSON.stringify({ error: 'Treinadora já existe com este email' }),
              { status: 409, headers }
            );
          }

          // Criar apenas a treinadora vinculada ao usuário existente
          const { error: dbError } = await supabase
            .from('treinadoras')
            .insert({
              nome: nome.trim(),
              email: emailLimpo,
              whatsapp,
              mostrar_whatsapp,
              is_admin: false,
              auth_user_id: existingUser.id,
            });

          if (dbError) {
            return new Response(
              JSON.stringify({ error: `Erro ao criar treinadora: ${dbError.message}` }),
              { status: 500, headers }
            );
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Treinadora vinculada ao usuário existente',
              auth_user_id: existingUser.id 
            }),
            { status: 200, headers }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${authError.message}` }),
        { status: 500, headers }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário no auth' }),
        { status: 500, headers }
      );
    }

    // 2. Inserir na tabela treinadoras com auth_user_id
    const { error: dbError } = await supabase
      .from('treinadoras')
      .insert({
        nome: nome.trim(),
        email: emailLimpo,
        whatsapp,
        mostrar_whatsapp,
        is_admin: false,
        auth_user_id: authData.user.id,
      });

    if (dbError) {
      // Rollback: deletar usuário do auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: `Erro ao criar treinadora: ${dbError.message}` }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Treinadora criada com sucesso',
        auth_user_id: authData.user.id 
      }),
      { status: 200, headers }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers }
    );
  }
});
