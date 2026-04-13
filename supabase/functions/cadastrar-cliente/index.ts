import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CadastrarClientePayload {
  nome: string;
  email?: string | null;
  codigoId: string;
  treinadoraId: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Corpo da requisição inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = body as CadastrarClientePayload;
    const nome = payload.nome?.trim();
    const email = payload.email?.trim() || null;
    const codigoId = payload.codigoId;
    const treinadoraId = payload.treinadoraId;

    if (!nome || nome.length < 1) {
      return new Response(
        JSON.stringify({ error: "Nome é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!codigoId) {
      return new Response(
        JSON.stringify({ error: "Código é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!treinadoraId) {
      return new Response(
        JSON.stringify({ error: "Treinadora é obrigatória." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verificar se o código existe, não foi usado e não expirou
    const { data: codigoRow, error: codigoError } = await adminClient
      .from("codigos")
      .select("id, usado, valido_ate")
      .eq("id", codigoId)
      .eq("treinadora_id", treinadoraId)
      .single();

    if (codigoError || !codigoRow) {
      return new Response(
        JSON.stringify({ error: "Código não encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (codigoRow.usado) {
      return new Response(
        JSON.stringify({ error: "Código já foi utilizado." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const validoAte = new Date(codigoRow.valido_ate);
    if (validoAte < new Date()) {
      return new Response(
        JSON.stringify({ error: "Código expirado." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Criar cliente
    const { data: clienteData, error: clienteError } = await adminClient
      .from("clientes")
      .insert({
        nome,
        email,
        codigo_id: codigoId,
        treinadora_id: treinadoraId,
        status: "ativo",
      })
      .select()
      .single();

    if (clienteError || !clienteData) {
      console.error("Erro ao criar cliente:", clienteError);
      return new Response(
        JSON.stringify({ error: "Não foi possível criar seu cadastro." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Atualizar código
    const { error: codigoUpdateError } = await adminClient
      .from("codigos")
      .update({
        usado: true,
        cliente_id: clienteData.id,
      })
      .eq("id", codigoId);

    if (codigoUpdateError) {
      console.error("Erro ao atualizar código:", codigoUpdateError);
      return new Response(
        JSON.stringify({ error: "Não foi possível ativar seu código. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, cliente: clienteData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro na Edge Function cadastrar-cliente:", err);
    const message = err instanceof Error ? err.message : "Erro interno do servidor.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
  }
});
