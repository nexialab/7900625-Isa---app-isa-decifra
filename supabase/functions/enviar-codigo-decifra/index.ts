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

function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
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

function buildHtmlTemplate(params: {
  codigo: string;
  nomeDestinatario?: string;
  validoAte?: string;
}): string {
  const { codigo, nomeDestinatario, validoAte } = params;
  const saudacao = nomeDestinatario
    ? `Olá, <strong>${escapeHtml(nomeDestinatario)}</strong>!`
    : "Olá!";

  const validadeTexto = validoAte
    ? `Este código é válido até <strong>${formatarDataBr(validoAte)}</strong>.`
    : "Este código possui validade limitada, utilize-o assim que possível.";

  const appStoreUrl = Deno.env.get("APP_STORE_URL") ||
    "https://apps.apple.com/br/app/decifra/idSEU_ID";
  const playStoreUrl = Deno.env.get("PLAY_STORE_URL") ||
    "https://play.google.com/store/apps/details?id=br.com.decifra";
  const webUrl = Deno.env.get("APP_WEB_URL") || "https://decifra.app";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seu código de acesso Decifra</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" width="100%" max-width="480" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;line-height:1.3;">Decifra</h1>
              <p style="color:#e0e7ff;margin:8px 0 0;font-size:14px;">Código de acesso da sua aluna</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;color:#1f2937;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${saudacao}</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                Sua treinadora gerou um código de acesso exclusivo para você utilizar no app <strong>Decifra</strong>.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
                <tr>
                  <td style="background:#f3f4f6;border-radius:8px;padding:20px;text-align:center;border:1px dashed #d1d5db;">
                    <p style="margin:0 0 8px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Código de acesso</p>
                    <p style="margin:0;font-size:28px;font-weight:700;color:#111827;letter-spacing:1px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">${escapeHtml(codigo)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4b5563;">${validadeTexto}</p>
              <p style="margin:0 0 12px;font-size:16px;line-height:1.6;"><strong>Baixe o app:</strong></p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="${appStoreUrl}" target="_blank" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:500;">App Store</a>
                  </td>
                  <td>
                    <a href="${playStoreUrl}" target="_blank" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-size:13px;font-weight:500;">Google Play</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:16px;line-height:1.6;"><strong>Ou acesse pelo navegador:</strong></p>
              <a href="${webUrl}" target="_blank" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;font-weight:600;">Acessar Decifra Web</a>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />
              <p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280;">
                Caso tenha recebido este email por engano, pode ignorá-lo com segurança.
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
  console.log(`[enviar-codigo-decifra] ${req.method} request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const authHeader = req.headers.get("authorization");
    console.log("[enviar-codigo-decifra] Auth header present:", !!authHeader);

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autorização necessária." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Configuração do servidor incompleta." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError) {
      console.error("[enviar-codigo-decifra] getUser error:", userError);
    }
    console.log("[enviar-codigo-decifra] User found:", !!user);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authUserId = user.id; // Este é o auth_user_id, não o treinadoras.id

    // Cliente admin para acessar o banco
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // RESOLVER auth_user_id -> treinadoras.id
    console.log("[enviar-codigo-decifra] Resolving treinadora id for auth_user_id:", authUserId);
    const { data: treinadoraRow, error: treinadoraError } = await adminClient
      .from("treinadoras")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (treinadoraError) {
      console.error("[enviar-codigo-decifra] treinadoras query error:", treinadoraError);
    }

    if (treinadoraError || !treinadoraRow) {
      return new Response(
        JSON.stringify({ error: "Treinadora não encontrada no sistema." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const treinadoraId = treinadoraRow.id;
    console.log("[enviar-codigo-decifra] Resolved treinadoraId:", treinadoraId);

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
    const codigoId = payload.codigoId;
    const codigo = payload.codigo;
    const emailDestinatario = payload.emailDestinatario;
    const nomeDestinatario = payload.nomeDestinatario;
    const validoAte = payload.validoAte;

    if (!codigoId || typeof codigoId !== "string" || !isValidUUID(codigoId)) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos.", issues: ["codigoId: deve ser um UUID válido"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!codigo || typeof codigo !== "string" || codigo.length < 1) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos.", issues: ["codigo: é obrigatório"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!emailDestinatario || typeof emailDestinatario !== "string" || !isValidEmail(emailDestinatario)) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos.", issues: ["emailDestinatario: deve ser um email válido"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (validoAte !== undefined && (typeof validoAte !== "string" || isNaN(Date.parse(validoAte)))) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos.", issues: ["validoAte: deve ser uma data/hora ISO válida"] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validar propriedade do código
    console.log("[enviar-codigo-decifra] Checking code ownership for:", codigoId, "treinadora:", treinadoraId);
    const { data: codigoRow, error: codigoError } = await adminClient
      .from("codigos")
      .select("id, treinadora_id, usado, valido_ate")
      .eq("id", codigoId)
      .eq("treinadora_id", treinadoraId)
      .single();

    if (codigoError) {
      console.error("[enviar-codigo-decifra] Code query error:", codigoError);
    }
    console.log("[enviar-codigo-decifra] Code found:", !!codigoRow);

    if (codigoError || !codigoRow) {
      return new Response(
        JSON.stringify({ error: "Código não encontrado ou não pertence à treinadora logada." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Enviar email via Brevo API
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const fromEmail = Deno.env.get("BREVO_FROM_EMAIL") || "noreply@decifra.app";
    const fromName = Deno.env.get("BREVO_FROM_NAME") || "Decifra";

    console.log("[enviar-codigo-decifra] BREVO_API_KEY present:", !!brevoApiKey);

    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({ error: "Serviço de email não configurado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const htmlContent = buildHtmlTemplate({
      codigo,
      nomeDestinatario: typeof nomeDestinatario === "string" ? nomeDestinatario : undefined,
      validoAte: typeof validoAte === "string" ? validoAte : undefined,
    });

    console.log("[enviar-codigo-decifra] Sending email via Brevo to:", emailDestinatario);

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: emailDestinatario, name: typeof nomeDestinatario === "string" ? nomeDestinatario : "" }],
        subject: "Seu código de acesso Decifra chegou!",
        htmlContent,
      }),
    });

    console.log("[enviar-codigo-decifra] Brevo response status:", brevoRes.status);

    if (!brevoRes.ok) {
      const brevoError = await brevoRes.text();
      console.error("[enviar-codigo-decifra] Brevo error:", brevoError);
      return new Response(
        JSON.stringify({ error: "Falha ao enviar e-mail. Tente novamente mais tarde." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const brevoData = await brevoRes.json() as { messageId?: string };
    const messageId = brevoData.messageId || `brevo-${Date.now()}`;

    console.log("[enviar-codigo-decifra] Email sent, messageId:", messageId);

    // Registrar envio no banco
    const { error: insertError } = await adminClient.from("codigo_emails").insert({
      codigo_id: codigoId,
      treinadora_id: treinadoraId,
      email_destinatario: emailDestinatario,
      nome_destinatario: typeof nomeDestinatario === "string" ? nomeDestinatario : null,
      enviado_em: new Date().toISOString(),
      message_id: messageId,
    });

    if (insertError) {
      console.error("[enviar-codigo-decifra] DB insert error:", insertError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "E-mail enviado com sucesso.", messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[enviar-codigo-decifra] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Erro interno do servidor.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
