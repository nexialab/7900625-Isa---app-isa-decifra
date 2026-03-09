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
  import { useAuth } from '@/lib/supabase/useAuth';

  export default function TreinadoraLoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
      if (!email || !password) {
        Alert.alert('Erro', 'Por favor, preencha todos os campos');
        return;
      }

      setLoading(true);
      const { error } = await signIn(email, password);
      setLoading(false);

      if (error) {
        Alert.alert('Erro ao fazer login', error.message);
      } else {
        router.replace('/treinadora');
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
              <Text style={styles.title}>Login Treinadora</Text>
              <Text style={styles.subtitle}>
                Acesse sua conta para gerenciar clientes e códigos
              </Text>

              <View style={styles.form}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#667eea" />
                  ) : (
                    <Text style={styles.buttonText}>Entrar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/treinadora/cadastro')}
                  style={styles.linkContainer}
                >
                  <Text style={styles.linkText}>
                    Não tem conta? <Text style={styles.linkBold}>Cadastre-se</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                >
                  <Text style={styles.backText}>← Voltar</Text>
                </TouchableOpacity>
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
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.9,
      marginBottom: 40,
      textAlign: 'center',
    },
    form: {
      width: '100%',
    },
    input: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      fontSize: 16,
      marginBottom: 16,
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
    linkContainer: {
      marginTop: 24,
      alignItems: 'center',
    },
    linkText: {
      color: '#FFFFFF',
      fontSize: 16,
    },
    linkBold: {
      fontWeight: 'bold',
    },
    backButton: {
      marginTop: 16,
      alignItems: 'center',
    },
    backText: {
      color: '#FFFFFF',
      fontSize: 16,
      opacity: 0.8,
    },
  });
  