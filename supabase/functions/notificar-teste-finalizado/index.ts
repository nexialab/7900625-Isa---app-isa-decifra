import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatarDataBr(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

const FATORES: Record<string, string> = {
  N: "Neuroticismo",
  E: "Extroversão",
  O: "Abertura",
  A: "Amabilidade",
  C: "Conscienciosidade",
};

function buildHtmlTemplate(params: {
  nomeTreinadora: string;
  nomeCliente: string;
  emailCliente: string | null;
  dataFinalizacao: string;
  scoresFatores: Array<{ fator: string; percentil: number; classificacao: string }>;
  protocolos: Array<{ titulo: string; descricao: string; prioridade: number }>;
  appWebUrl: string;
}): string {
  const { nomeTreinadora, nomeCliente, emailCliente, dataFinalizacao, scoresFatores, protocolos, appWebUrl } = params;

  const fatoresRows = scoresFatores
    .map((sf) => {
      const nomeFator = FATORES[sf.fator] || sf.fator;
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;">${escapeHtml(nomeFator)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;text-align:center;">P${sf.percentil}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#374151;text-align:center;">${escapeHtml(sf.classificacao)}</td>
        </tr>
      `;
    })
    .join("");

  const protocolosItems = protocolos
    .map((p, idx) => {
      return `
        <li style="margin-bottom:10px;font-size:14px;color:#374151;line-height:1.5;">
          <strong>${idx + 1}. ${escapeHtml(p.titulo)}</strong><br/>
          <span style="color:#6b7280;">${escapeHtml(p.descricao)}</span>
        </li>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Teste Finalizado - Decifra</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" width="100%" max-width="520" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;line-height:1.3;">Decifra</h1>
              <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;">Notificação de teste finalizado</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;color:#1f2937;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Olá, <strong>${escapeHtml(nomeTreinadora)}</strong>!</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                Seu candidato <strong>${escapeHtml(nomeCliente)}</strong> acabou de finalizar o teste DECIFRA.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;background:#f9fafb;border-radius:8px;padding:16px;">
                <tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Nome do candidato</td><td style="padding:6px 0;font-size:14px;color:#111827;text-align:right;font-weight:600;">${escapeHtml(nomeCliente)}</td></tr>
                ${emailCliente ? `<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Email</td><td style="padding:6px 0;font-size:14px;color:#111827;text-align:right;font-weight:600;">${escapeHtml(emailCliente)}</td></tr>` : ""}
                <tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Finalizado em</td><td style="padding:6px 0;font-size:14px;color:#111827;text-align:right;font-weight:600;">${formatarDataBr(dataFinalizacao)}</td></tr>
              </table>

              <h2 style="margin:24px 0 12px;font-size:16px;color:#111827;">Resumo dos 5 Fatores</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin-bottom:24px;">
                <thead>
                  <tr style="background:#f3f4f6;">
                    <th style="padding:10px 12px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Fator</th>
                    <th style="padding:10px 12px;text-align:center;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Percentil</th>
                    <th style="padding:10px 12px;text-align:center;font-size:13px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Classificação</th>
                  </tr>
                </thead>
                <tbody>
                  ${fatoresRows}
                </tbody>
              </table>

              <h2 style="margin:24px 0 12px;font-size:16px;color:#111827;">Protocolos Recomendados</h2>
              <ul style="padding-left:18px;margin:0 0 24px;">
                ${protocolosItems || `<li style="font-size:14px;color:#6b7280;">Nenhum protocolo recomendado automaticamente.</li>`}
              </ul>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px;">
                <tr>
                  <td>
                    <a href="${escapeHtml(appWebUrl)}" target="_blank" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;font-weight:600;">Acessar painel da treinadora</a>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />
              <p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280;">
                Esta é uma notificação automática do app Decifra.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Decifra. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  console.log(`[notificar-teste-finalizado] ${req.method} request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Parse body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Corpo da requisição inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = body as Record<string, unknown>;
    const clienteId = payload.clienteId;

    if (!clienteId || typeof clienteId !== "string" || !isValidUUID(clienteId)) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos.", issues: ["clienteId: deve ser um UUID válido"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Idempotência: evitar múltiplos envios para o mesmo cliente em curto prazo
    const { data: envioRecente } = await adminClient
      .from("notificacao_emails")
      .select("id")
      .eq("cliente_id", clienteId)
      .eq("tipo", "teste_finalizado")
      .gte("enviado_em", new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()) // últimas 24h
      .maybeSingle();

    if (envioRecente) {
      console.log("[notificar-teste-finalizado] Notificação já enviada recentemente para cliente:", clienteId);
      return new Response(
        JSON.stringify({ success: true, message: "Notificação já enviada recentemente.", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Buscar cliente + treinadora
    const { data: clienteRow, error: clienteError } = await adminClient
      .from("clientes")
      .select("id, nome, email, treinadora_id")
      .eq("id", clienteId)
      .single();

    if (clienteError || !clienteRow) {
      console.error("[notificar-teste-finalizado] Cliente não encontrado:", clienteError);
      return new Response(
        JSON.stringify({ error: "Cliente não encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: treinadoraRow, error: treinadoraError } = await adminClient
      .from("treinadoras")
      .select("id, nome, email")
      .eq("id", clienteRow.treinadora_id)
      .single();

    if (treinadoraError || !treinadoraRow || !treinadoraRow.email) {
      console.error("[notificar-teste-finalizado] Treinadora não encontrada ou sem email:", treinadoraError);
      return new Response(
        JSON.stringify({ error: "Treinadora não encontrada ou sem email cadastrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Buscar resultado
    const { data: resultadoRow, error: resultadoError } = await adminClient
      .from("resultados")
      .select("id, scores_fatores, created_at")
      .eq("cliente_id", clienteId)
      .single();

    if (resultadoError || !resultadoRow) {
      console.error("[notificar-teste-finalizado] Resultado não encontrado:", resultadoError);
      return new Response(
        JSON.stringify({ error: "Resultado não encontrado para este cliente." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Buscar protocolos recomendados (base treinadora: até 6, pegamos os 4 primeiros por prioridade)
    const { data: protocolosRows } = await adminClient
      .from("protocolos_recomendados")
      .select("prioridade, protocolos(id, titulo, descricao)")
      .eq("resultado_id", resultadoRow.id)
      .order("prioridade", { ascending: true })
      .limit(6);

    const protocolosFormatados = (protocolosRows || [])
      .map((p: any) => ({
        titulo: p.protocolos?.titulo || "",
        descricao: p.protocolos?.descricao || "",
        prioridade: p.prioridade,
      }))
      .filter((p) => p.titulo)
      .slice(0, 4);

    const scoresFatores = Array.isArray(resultadoRow.scores_fatores)
      ? resultadoRow.scores_fatores.map((sf: any) => ({
          fator: String(sf.fator || ""),
          percentil: Number(sf.percentil || 0),
          classificacao: String(sf.classificacao || ""),
        }))
      : [];

    const appWebUrl = Deno.env.get("APP_WEB_URL") || "https://decifra.app";

    const htmlContent = buildHtmlTemplate({
      nomeTreinadora: treinadoraRow.nome || "Treinadora",
      nomeCliente: clienteRow.nome || "Candidato",
      emailCliente: clienteRow.email || null,
      dataFinalizacao: resultadoRow.created_at || new Date().toISOString(),
      scoresFatores,
      protocolos: protocolosFormatados,
      appWebUrl,
    });

    // Enviar email via Brevo
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const fromEmail = Deno.env.get("BREVO_FROM_EMAIL") || "noreply@decifra.app";
    const fromName = Deno.env.get("BREVO_FROM_NAME") || "Decifra";

    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[notificar-teste-finalizado] Enviando email para treinadora:", treinadoraRow.email);

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: treinadoraRow.email, name: treinadoraRow.nome || "" }],
        subject: `🎯 ${clienteRow.nome} finalizou o teste DECIFRA`,
        htmlContent,
      }),
    });

    if (!brevoRes.ok) {
      const brevoError = await brevoRes.text();
      console.error("[notificar-teste-finalizado] Brevo error:", brevoError);

      // Logar falha
      await adminClient.from("notificacao_emails").insert({
        cliente_id: clienteId,
        treinadora_id: treinadoraRow.id,
        resultado_id: resultadoRow.id,
        email_destinatario: treinadoraRow.email,
        enviado_em: new Date().toISOString(),
        status: "falha",
        tipo: "teste_finalizado",
        detalhes: { error: brevoError },
      });

      return new Response(
        JSON.stringify({ error: "Falha ao enviar e-mail. Tente novamente mais tarde." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const brevoData = await brevoRes.json() as { messageId?: string };
    const messageId = brevoData.messageId || `brevo-${Date.now()}`;

    console.log("[notificar-teste-finalizado] Email enviado, messageId:", messageId);

    // Logar sucesso
    const { error: insertError } = await adminClient.from("notificacao_emails").insert({
      cliente_id: clienteId,
      treinadora_id: treinadoraRow.id,
      resultado_id: resultadoRow.id,
      email_destinatario: treinadoraRow.email,
      enviado_em: new Date().toISOString(),
      message_id: messageId,
      status: "enviado",
      tipo: "teste_finalizado",
    });

    if (insertError) {
      console.error("[notificar-teste-finalizado] DB insert error:", insertError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "E-mail enviado com sucesso.", messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[notificar-teste-finalizado] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Erro interno do servidor.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
