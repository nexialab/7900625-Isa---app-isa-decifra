import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
  import { useRouter } from 'expo-router';
  import { LinearGradient } from 'expo-linear-gradient';

  export default function IndexScreen() {
    const router = useRouter();

    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.title}>IPIP-NEO-120</Text>
            <Text style={styles.subtitle}>Avaliação de Personalidade Big Five</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={() => router.push('/treinadora/login')}
              >
                <Text style={styles.buttonTextPrimary}>Sou Treinadora</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={() => router.push('/cliente/codigo')}
              >
                <Text style={styles.buttonTextSecondary}>Tenho um Código</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footer}>
              © 2025 IPIP-NEO Assessment
            </Text>
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
      fontSize: 48,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 18,
      color: '#FFFFFF',
      opacity: 0.9,
      marginBottom: 60,
      textAlign: 'center',
    },
    buttonContainer: {
      width: '100%',
      gap: 16,
    },
    buttonPrimary: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 18,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonTextPrimary: {
      fontSize: 18,
      fontWeight: '600',
      color: '#667eea',
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      paddingVertical: 18,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    buttonTextSecondary: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    footer: {
      position: 'absolute',
      bottom: 40,
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.7,
    },
  });
  