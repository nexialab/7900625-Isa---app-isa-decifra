import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ClienteInstrucoesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { clienteId } = params;

  const handleIniciar = () => {
    router.push({
      pathname: '/cliente/teste',
      params: {
        clienteId,
        estacao: '1',
      },
    });
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {"Teste de Personalidade\nIPIP-NEO-120"}
            </Text>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Como funciona</Text>
              <Text style={styles.text}>
                Voce respondera 120 questoes divididas em 4 estacoes tematicas. Cada estacao contem 30 questoes.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Duracao</Text>
              <Text style={styles.text}>
                O teste leva cerca de 15-20 minutos para ser concluido. Nao ha tempo limite, responda com calma.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Instrucoes</Text>
              <Text style={styles.text}>
                {"- Responda com honestidade\n- Nao ha respostas certas ou erradas\n- Use a escala de 1 a 5:\n\n1 = Discordo totalmente\n2 = Discordo\n3 = Neutro\n4 = Concordo\n5 = Concordo totalmente"}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>As 4 Estacoes</Text>
              <Text style={styles.text}>
                {"1. Autoconhecimento (30 questoes)\n2. Relacionamentos (30 questoes)\n3. Realizacoes (30 questoes)\n4. Equilibrio (30 questoes)"}
              </Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleIniciar}>
              <Text style={styles.buttonText}>Comecar Teste</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              Suas respostas sao salvas automaticamente apos cada estacao
            </Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center' as const,
    lineHeight: 36,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#667eea',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  button: {
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
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#667eea',
  },
  footer: {
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginTop: 24,
    opacity: 0.9,
    lineHeight: 20,
  },
});
