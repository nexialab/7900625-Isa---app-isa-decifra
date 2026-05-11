export const CONTATO_CREDITOS = {
  // TODO(2026-05-10): substituir pelo contato oficial da Isa antes do deploy.
  // Enquanto vazio, o botão "Comprar créditos" não aparece pra evitar
  // mostrar alerta confuso pro usuário (proteção em temContatoConfigurado).
  whatsapp: '',
  email: '',
  mensagemInicial: 'Olá! Quero comprar créditos do Decifra.',
};

export function buildWhatsappUrl(numero: string, mensagem: string) {
  const digits = numero.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * True se há pelo menos um canal de contato (WhatsApp ou email) preenchido.
 * Use pra decidir se mostra o botão "Comprar créditos" no popup —
 * sem isso, o usuário cai num alert "Contato não configurado" (pior que não ter botão).
 */
export function temContatoConfigurado(): boolean {
  return Boolean(CONTATO_CREDITOS.whatsapp || CONTATO_CREDITOS.email);
}
