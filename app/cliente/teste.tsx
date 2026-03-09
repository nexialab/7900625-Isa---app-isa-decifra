import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { QUESTOES } from '@/constants/questoes';
import { ESTACOES } from '@/constants/ipip';
import { supabase } from '@/lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ESCALA = [
  { valor: 1, label: 'Discordo\nTotalmente' },
  { valor: 2, label: 'Discordo' },
  { valor: 3, label: 'Neutro' },
  { valor: 4, label: 'Concordo' },
  { valor: 5, label: 'Concordo\nTotalmente' },
];

export default function ClienteTesteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { clienteId, estacao: estacaoParam } = params;
  const estacaoAtual = parseInt(estacaoParam as string) || 1;

  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const estacaoData = ESTACOES[estacaoAtual as keyof typeof ESTACOES];
  const questoesEstacao = estacaoData ? estacaoData.questoes : [];
  const nomeEstacao = estacaoData ? estacaoData.nome : '';

  useEffect(() => {
    carregarRespostasLocais();
  }, []);

  const carregarRespostasLocais = async () => {
    try {
      const respostasString = await AsyncStorage.getItem(`respostas_estacao_${estacaoAtual}`);
      if (respostasString) {
        const respostasLocal = JSON.parse(respostasString);
        setRespostas(respostasLocal);
      }
    } catch (error) {
      console.error('Erro ao carregar respostas locais:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarRespostaLocal = async (questaoId: number, resposta: number) => {
    const novasRespostas = { ...respostas, [questaoId]: resposta };
    setRespostas(novasRespostas);

    try {
      await AsyncStorage.setItem(
        `respostas_estacao_${estacaoAtual}`,
        JSON.stringify(novasRespostas)
      );
    } catch (error) {
      console.error('Erro ao salvar resposta local:', error);
    }
  };

  const progresso = () => {
    const respondidas = Object.keys(respostas).length;
    const total = questoesEstacao.length;
    return { respondidas, total, percentual: total > 0 ? (respondidas / total) * 100 : 0 };
  };

  const todasRespondidas = () => {
    return questoesEstacao.every((q: number) => respostas[q] !== undefined);
  };

  const finalizarEstacao = async () => {
    if (!todasRespondidas()) {
      const pendentes = questoesEstacao.length - Object.keys(respostas).length;
      Alert.alert(
        'Questoes pendentes',
        `Voce ainda tem ${pendentes} questoes para responder nesta estacao.`
      );
      return;
    }

    setSalvando(true);

    try {
      const respostasArray = questoesEstacao.map((questaoId: number) => ({
        cliente_id: clienteId as string,
        questao_id: questaoId,
        resposta: respostas[questaoId],
      }));

      const { error } = await supabase
        .from('respostas')
        .upsert(respostasArray, { onConflict: 'cliente_id,questao_id' });

      if (error) {
        console.error('Erro ao salvar respostas:', error);
        Alert.alert('Erro', 'Nao foi possivel salvar suas respostas. Tente novamente.');
        setSalvando(false);
        return;
      }

      const statusUpdate = estacaoAtual < 4 ? 'em_andamento' : 'completo';
      await supabase
        .from('clientes')
        .update({ status: statusUpdate })
        .eq('id', clienteId as string);

      await AsyncStorage.removeItem(`respostas_estacao_${estacaoAtual}`);

      if (estacaoAtual < 4) {
        router.push({
          pathname: '/cliente/teste',
          params: {
            clienteId: clienteId as string,
            estacao: String(estacaoAtual + 1),
          },
        });
      } else {
        router.push({
          pathname: '/cliente/processando',
          params: { clienteId: clienteId as string },
        });
      }
    } catch (error: any) {
      console.error('Erro ao finalizar estacao:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao finalizar a estacao');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  const { respondidas, total, percentual } = progresso();

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.estacaoLabel}>Estacao {estacaoAtual} de 4</Text>
            <Text style={styles.progressoText}>
              {respondidas}/{total}
            </Text>
          </View>
          <Text style={styles.nomeEstacao}>{nomeEstacao}</Text>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percentual}%` }]} />
          </View>
        </View>

        <ScrollView style={styles.content}>
          {questoesEstacao.map((questaoId: number) => {
            const questao = QUESTOES.find(q => q.id === questaoId);
            if (!questao) return null;

            const respostaSelecionada = respostas[questaoId];

            return (
              <View key={questaoId} style={styles.questaoCard}>
                <Text style={styles.questaoNumero}>Questao {questaoId}</Text>
                <Text style={styles.questaoTexto}>{questao.texto}</Text>

                <View style={styles.escalaContainer}>
                  {ESCALA.map(({ valor, label }) => (
                    <TouchableOpacity
                      key={valor}
                      style={[
                        styles.opcao,
                        respostaSelecionada === valor && styles.opcaoSelecionada,
                      ]}
                      onPress={() => salvarRespostaLocal(questaoId, valor)}
                    >
                      <Text
                        style={[
                          styles.opcaoValor,
                          respostaSelecionada === valor && styles.opcaoValorSelecionada,
                        ]}
                      >
                        {valor}
                      </Text>
                      <Text
                        style={[
                          styles.opcaoLabel,
                          respostaSelecionada === valor && styles.opcaoLabelSelecionada,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}

          <TouchableOpacity
            style={[
              styles.botaoFinalizar,
              (!todasRespondidas() || salvando) && styles.botaoDesabilitado,
            ]}
            onPress={finalizarEstacao}
            disabled={!todasRespondidas() || salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.botaoFinalizarTexto}>
                {estacaoAtual < 4 ? 'Proxima Estacao' : 'Finalizar Teste'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.espacoFinal} />
        </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  estacaoLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    opacity: 0.9,
  },
  progressoText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600' as const,
    opacity: 0.9,
  },
  nomeEstacao: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questaoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  questaoNumero: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  questaoTexto: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 20,
    lineHeight: 24,
  },
  escalaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  opcao: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
  },
  opcaoSelecionada: {
    backgroundColor: '#667eea',
  },
  opcaoValor: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333333',
    marginBottom: 4,
  },
  opcaoValorSelecionada: {
    color: '#FFFFFF',
  },
  opcaoLabel: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center' as const,
    lineHeight: 14,
  },
  opcaoLabelSelecionada: {
    color: '#FFFFFF',
  },
  botaoFinalizar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  botaoFinalizarTexto: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#667eea',
  },
  espacoFinal: {
    height: 40,
  },
});
