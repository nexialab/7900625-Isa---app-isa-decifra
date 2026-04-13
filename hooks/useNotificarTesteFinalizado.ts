import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

interface NotificarPayload {
  clienteId: string;
}

interface NotificarResponse {
  success: boolean;
  message: string;
  messageId?: string;
  skipped?: boolean;
}

async function notificarTesteFinalizado(payload: NotificarPayload): Promise<NotificarResponse> {
  console.log('[useNotificarTesteFinalizado] Payload:', JSON.stringify(payload));
  const { data, error } = await supabase.functions.invoke<NotificarResponse>('notificar-teste-finalizado', {
    body: payload,
  });

  if (error) {
    let errorMessage = error.message || 'Erro ao notificar treinadora';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error) errorMessage = parsed.error;
    } catch {}
    throw new Error(errorMessage);
  }

  if (!data) {
    throw new Error('Resposta vazia do servidor.');
  }

  return data;
}

export function useNotificarTesteFinalizado() {
  return useMutation<NotificarResponse, Error, NotificarPayload>({
    mutationFn: notificarTesteFinalizado,
  });
}

export default useNotificarTesteFinalizado;
