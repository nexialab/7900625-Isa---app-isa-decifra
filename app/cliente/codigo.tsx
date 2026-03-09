import { useState } from 'react';
  import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
  } from 'react-native';
  import { useRouter } from 'expo-router';
  import { LinearGradient } from 'expo-linear-gradient';
  import { supabase } from '@/lib/supabase/client';

  export default function ClienteCodigoScreen() {
    const router = useRouter();
    
    const [codigo, setCodigo] = useState('');
    const [loading, setLoading] = useState(false);

    const formatarCodigo = (text: string) => {
      // Remover caracteres não alfanuméricos
      let formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Adicionar o hífen após "ART"
      if (formatted.length > 3) {
        formatted = formatted.slice(0, 3) + '-' + formatted.slice(3, 7);
      }
      
      return formatted;
    };

    const validarCodigo = async () => {
      if (!codigo || codigo.length < 8) {
        Alert.alert('Erro', 'Por favor, insira um código válido (formato: ART-1234)');
        return;
      }

      setLoading(true);

      try {
        // Buscar código no banco
        const { data: codigoData, error: codigoError } = await supabase
          .from('codigos')
          .select('*')
          .eq('codigo', codigo)
          .single();

        if (codigoError || !codigoData) {
          Alert.alert('Código inválido', 'O código informado não existe ou já foi utilizado.');
          setLoading(false);
          return;
        }

        // Verificar se código já foi usado
        if (codigoData.usado) {
          Alert.alert('Código já utilizado', 'Este código já foi usado por outro cliente.');
          setLoading(false);
          return;
        }

        // Verificar se código está vencido
        const validoAte = new Date(codigoData.valido_ate);
        if (validoAte < new Date()) {
          Alert.alert('Código expirado', 'Este código expirou. Solicite um novo código.');
          setLoading(false);
          return;
        }

        // Código válido - redirecionar para cadastro
        router.push({
          pathname: '/cliente/cadastro',
          params: {
            codigoId: codigoData.id,
            codigo: codigoData.codigo,
            treinadoraId: codigoData.treinadora_id,
          },
        });
      } catch (error: any) {
        console.error('Erro ao validar código:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao validar o código');
      } finally {
        setLoading(false);
      }
    };

    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.content}>
              <Text style={styles.title}>Bem-vindo!</Text>
              <Text style={styles.subtitle}>
                Insira o código fornecido pela sua treinadora para iniciar o teste
              </Text>

              <View style={styles.form}>
                <Text style={styles.label}>Código de Acesso</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ART-1234"
                  placeholderTextColor="#999"
                  value={codigo}
                  onChangeText={(text) => setCodigo(formatarCodigo(text))}
                  autoCapitalize="characters"
                  maxLength={8}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={validarCodigo}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#667eea" />
                  ) : (
                    <Text style={styles.buttonText}>Continuar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
                  <Text style={styles.backText}>← Voltar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  {"O codigo tem o formato ART-1234\nValido por 30 dias apos a geracao"}
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
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
    keyboardView: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.9,
      marginBottom: 40,
      textAlign: 'center',
      lineHeight: 24,
    },
    form: {
      width: '100%',
    },
    label: {
      fontSize: 16,
      color: '#FFFFFF',
      marginBottom: 12,
      fontWeight: '600',
    },
    input: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 18,
      paddingHorizontal: 20,
      borderRadius: 12,
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      letterSpacing: 2,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    button: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 18,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#667eea',
    },
    backButton: {
      marginTop: 24,
      alignItems: 'center',
    },
    backText: {
      color: '#FFFFFF',
      fontSize: 16,
      opacity: 0.8,
    },
    infoBox: {
      marginTop: 40,
      padding: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 12,
    },
    infoText: {
      fontSize: 14,
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 20,
    },
  });
  