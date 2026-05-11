/**
 * Utilities de formatação/validação de WhatsApp brasileiro.
 *
 * Formato canônico armazenado: dígitos puros começando com 55 (ex: "5511999999999").
 * Formato de exibição: "+55 11 99999-9999".
 *
 * Use estas funções em qualquer formulário que aceite WhatsApp pra evitar
 * que cada tela invente sua própria regra (já aconteceu).
 */

/**
 * Normaliza para formato canônico (dígitos, prefixo 55, max 13 chars).
 * Aceita entrada livre do usuário com máscara, espaços, parênteses.
 */
export function formatarWhatsApp(valor: string): string {
  let numeros = valor.replace(/\D/g, '');
  if (numeros.startsWith('55') && numeros.length > 2) {
    numeros = numeros.slice(0, 13);
  } else if (numeros.length > 0) {
    numeros = `55${numeros}`.slice(0, 13);
  }
  return numeros;
}

/**
 * Renderiza canônico em formato amigável "+55 11 99999-9999".
 * Tolerante a entradas parciais (renderiza o que dá).
 */
export function formatarWhatsAppExibicao(valor: string): string {
  if (!valor) return '';
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `+${numeros.slice(0, 2)} ${numeros.slice(2)}`;
  if (numeros.length <= 9) return `+${numeros.slice(0, 2)} ${numeros.slice(2, 4)} ${numeros.slice(4)}`;
  return `+${numeros.slice(0, 2)} ${numeros.slice(2, 4)} ${numeros.slice(4, 9)}-${numeros.slice(9, 13)}`;
}

/**
 * Valida formato canônico: começa com 55, total 12 ou 13 dígitos
 * (12 = fixo +55 11 9999-9999, 13 = celular +55 11 99999-9999).
 */
export function validarWhatsApp(valor: string): boolean {
  const numeros = valor.replace(/\D/g, '');
  return numeros.startsWith('55') && numeros.length >= 12 && numeros.length <= 13;
}
