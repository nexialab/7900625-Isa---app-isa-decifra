import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase-admin";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "Token de autorização não fornecido." });
    return;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Formato de autorização inválido. Use Bearer <token>." });
    return;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Token inválido ou expirado." });
      return;
    }

    const authUserId = data.user.id;

    // Buscar treinadora associada ao usuário autenticado
    const { data: treinadora, error: treinadoraError } = await supabaseAdmin
      .from("treinadoras")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (treinadoraError || !treinadora) {
      res.status(403).json({ error: "Usuário não está autorizado como treinadora." });
      return;
    }

    req.authUserId = authUserId;
    req.treinadoraId = treinadora.id;
    next();
  } catch (err) {
    console.error("Erro ao validar token:", err);
    res.status(500).json({ error: "Erro interno ao validar autenticação." });
  }
}
