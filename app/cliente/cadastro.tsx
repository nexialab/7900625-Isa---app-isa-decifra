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
    ScrollView,
  } from 'react-native';
  import { useRouter, useLocalSearchParams } from 'expo-router';
  import { LinearGradient } from 'expo-linear-gradient';
  import { supabase } from '@/lib/supabase/client';
  import AsyncStorage from '@react-native-async-storage/async-storage';

  export default function ClienteCadastroScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const { codigoId, codigo, treinadoraId } = params;
    
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCadastro = async () => {
      if (!nome.trim()) {
        Alert.alert('Erro', 'Por favor, informe seu nome');
        return;
      }

      // Email é opcional
      const emailValue = email.trim() || null;

      setLoading(true);

      try {
        // Criar cliente no banco
        const { data: clienteData, error: clienteError } = await supabase
          .from('clientes')
          .insert({
            nome: nome.trim(),
            email: emailValue,
            codigo_id: codigoId,
            treinadora_id: treinadoraId,
            status: 'ativo',
          })
          .select()
          .single();

        if (clienteError || !clienteData) {
          console.error('Erro ao criar cliente:', clienteError);
          Alert.alert('Erro', 'Não foi possível criar seu cadastro');
          setLoading(false);
          return;
        }

        // Marcar código como usado
        await supabase
          .from('codigos')
          .update({
            usado: true,
            cliente_id: clienteData.id,
          })
          .eq('id', codigoId);

        // Salvar ID do cliente localmente
        await AsyncStorage.setItem('clienteId', clienteData.id);

        // Redirecionar para instruções do teste
        router.replace({
          pathname: '/cliente/instrucoes',
          params: {
            clienteId: clienteData.id,
          },
        });
      } catch (error: any) {
        console.error('Erro ao cadastrar cliente:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao criar seu cadastro');
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
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Código: {codigo}</Text>
                </View>

                <Text style={styles.title}>Cadastro Rápido</Text>
                <Text style={styles.subtitle}>
                  Precisamos de algumas informações antes de iniciar o teste
                </Text>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome Completo *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Seu nome"
                      placeholderTextColor="#999"
                      value={nome}
                      onChangeText={setNome}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email (opcional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="seuemail@exemplo.com"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleCadastro}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#667eea" />
                    ) : (
                      <Text style={styles.buttonText}>Iniciar Teste</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.privacyBox}>
                  <Text style={styles.privacyText}>
                    🔒 Seus dados são privados e serão compartilhados apenas com sua treinadora
                  </Text>
                </View>
              </View>
            </ScrollView>
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
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    content: {
      width: '100%',
    },
    badge: {
      alignSelf: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 24,
    },
    badgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    title: {
      fontSize: 32,
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
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      color: '#FFFFFF',
      marginBottom: 8,
      fontWeight: '600',
    },
    input: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      fontSize: 16,
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
      marginTop: 8,
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
    privacyBox: {
      marginTop: 32,
      padding: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 12,
    },
    privacyText: {
      fontSize: 13,
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 20,
    },
  });
  