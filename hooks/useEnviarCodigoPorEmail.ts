import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { FunctionsHttpError } from '@supabase/supabase-js';

interface EnviarEmailPayload {
  codigoId: string;
  codigo: string;
  emailDestinatario: string;
  nomeDestinatario?: string;
  validoAte?: string;
}

interface EnviarEmailResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

async function enviarCodigoPorEmail(payload: EnviarEmailPayload): Promise<EnviarEmailResponse> {
  console.log('[useEnviarCodigoPorEmail] Payload:', payload);
  const { data, error } = await supabase.functions.invoke<EnviarEmailResponse>('enviar-codigo-decifra', {
    body: payload,
  });

  if (error) {
    // Tenta extrair a mensagem de erro real do corpo da resposta da Edge Function
    const httpError = error as FunctionsHttpError;
    const context = (httpError as any).context;
    
    if (context && typeof context === 'object') {
      // O contexto pode conter o body do erro
      const body = context;
      if (body.error) {
        throw new Error(body.error);
      }
      if (body.message) {
        throw new Error(body.message);
      }
    }
    
    throw new Error(error.message || 'Erro ao enviar código por email');
  }

  if (!data) {
    throw new Error('Resposta vazia do servidor.');
  }

  return data;
}

export function useEnviarCodigoPorEmail() {
  const queryClient = useQueryClient();

  return useMutation<EnviarEmailResponse, Error, EnviarEmailPayload>({
    mutationFn: enviarCodigoPorEmail,
    onSuccess: () => {
      // Invalida o cache de códigos para refletir o email enviado
      queryClient.invalidateQueries({ queryKey: ['meus-codigos'] });
    },
  });
}

export default useEnviarCodigoPorEmail;
