import { useEffect, useState } from 'react';
  import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Alert,
  } from 'react-native';
  import { useRouter, useLocalSearchParams } from 'expo-router';
  import { LinearGradient } from 'expo-linear-gradient';
  import { supabase } from '@/lib/supabase/client';
  import { calcularResultado } from '@/utils/calculadora';
  import { recomendarProtocolos, recomendacoesParaCliente } from '@/utils/recomendacao';

  export default function ClienteProcessandoScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const { clienteId } = params;
    const [status, setStatus] = useState('Carregando respostas...');

    useEffect(() => {
      processarResultados();
    }, []);

    const processarResultados = async () => {
      try {
        // 1. Buscar todas as respostas do cliente
        setStatus('Carregando suas respostas...');
        const { data: respostasData, error: respostasError } = await supabase
          .from('respostas')
          .select('*')
          .eq('cliente_id', clienteId)
          .order('questao_id');

        if (respostasError || !respostasData || respostasData.length !== 120) {
          console.error('Erro ao buscar respostas:', respostasError);
          Alert.alert('Erro', 'Não foi possível processar suas respostas');
          return;
        }

        // 2. Calcular scores (30 facetas + 5 fatores)
        setStatus('Analisando sua personalidade...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay visual
        
        const respostas = respostasData.map(r => ({
          questao_id: r.questao_id,
          resposta: r.resposta,
        }));

        const { scoresFacetas, scoresFatores } = calcularResultado(respostas);

        // 3. Recomendar protocolos
        setStatus('Preparando recomendações personalizadas...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const recomendacoes = recomendarProtocolos(scoresFacetas, 6);
        const recomendacoesCliente = recomendacoesParaCliente(recomendacoes);

        // 4. Salvar resultados no banco
        setStatus('Salvando seus resultados...');
        
        const { data: resultadoData, error: resultadoError } = await supabase
          .from('resultados')
          .upsert({
            cliente_id: clienteId,
            scores_facetas: scoresFacetas,
            scores_fatores: scoresFatores,
            percentis: scoresFatores.map(sf => ({
              fator: sf.fator,
              percentil: sf.percentil,
            })),
            classificacoes: scoresFatores.map(sf => ({
              fator: sf.fator,
              classificacao: sf.classificacao,
            })),
          }, { onConflict: 'cliente_id' })
          .select()
          .single();

        if (resultadoError || !resultadoData) {
          console.error('Erro ao salvar resultados:', resultadoError);
          Alert.alert('Erro', 'Não foi possível salvar os resultados');
          return;
        }

        // 5. Salvar protocolos recomendados
        setStatus('Finalizando...');
        
        // Nota: Aqui estamos usando protocolos mock
        // Na versão completa, buscar protocolos reais do banco
        const protocolosRecomendados = recomendacoesCliente.map((rec, index) => ({
          resultado_id: resultadoData.id,
          protocolo_id: rec.protocolo.id,
          prioridade: rec.prioridade,
        }));

        if (protocolosRecomendados.length > 0) {
          await supabase
            .from('protocolos_recomendados')
            .upsert(protocolosRecomendados, { onConflict: 'resultado_id,protocolo_id' });
        }

        // 6. Redirecionar para tela de resultado
        router.replace({
          pathname: '/cliente/resultado',
          params: {
            clienteId,
            resultadoId: resultadoData.id,
          },
        });
      } catch (error: any) {
        console.error('Erro ao processar resultados:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao processar os resultados');
      }
    };

    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.title}>Processando...</Text>
            <Text style={styles.status}>{status}</Text>
            
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {"Estamos analisando suas 120 respostas e calculando:\n\n- 30 facetas de personalidade\n- 5 fatores do Big Five\n- Percentis comparativos\n- Protocolos personalizados"}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 24,
      marginBottom: 12,
    },
    status: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.9,
      textAlign: 'center',
    },
    infoBox: {
      marginTop: 40,
      padding: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 16,
    },
    infoText: {
      fontSize: 15,
      color: '#FFFFFF',
      lineHeight: 24,
    },
  });
  