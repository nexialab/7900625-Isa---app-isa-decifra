import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, COLORS_ARTIO, GRADIENTS, SHADOWS } from '@/constants/colors';

const { width } = Dimensions.get('window');

/**
 * Tela Inicial Ritualística - DECIFRA
 * 
 * Experiência de entrada que evoca:
 * - Curiosidade e introspecção
 * - Ritual de autoconhecimento
 * - Conexão emocional
 */
export default function IndexScreen() {
  const router = useRouter();
  
  // Animações
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Sequência de entrada ritualística
    Animated.sequence([
      // Espera breve para criar expectativa
      Animated.delay(200),
      
      // Fade in suave
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Animação de respiração suave na logo
      Animated.loop(
        Animated.sequence([
          // Inspiração (cresce suavemente)
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 3000,
            useNativeDriver: true,
          }),
          // Pequena pausa no topo
          Animated.delay(500),
          // Expiração (diminui suavemente)
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          // Pequena pausa na base
          Animated.delay(500),
        ]),
        { iterations: -1 }
      ),
    ]).start();
  }, []);

  const handleTreinadora = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/treinadora/login');
  };

  const handleCliente = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/cliente/codigo');
  };

  const handleAdmin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(admin)/login');
  };

  return (
    <LinearGradient
      colors={[...GRADIENTS.splash]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            }
          ]}
        >
          {/* Logo Section */}
          <Animated.View 
            style={[
              styles.logoSection,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          {/* Text Section */}
          <View style={styles.textSection}>
            <Text style={styles.brandName}>DECIFRA</Text>
            
            <View style={styles.ritualTextContainer}>
              <Text style={styles.ritualTitle}>
                Descubra sua{'\n'}
                <Text style={styles.ritualTitleHighlight}>arquitetura emocional</Text>
              </Text>
              
              <Text style={styles.ritualDescription}>
                Um mergulho de 10 minutos para revelar os padrões que moldam quem você é
              </Text>
            </View>
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={handleTreinadora}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[...GRADIENTS.button]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonTextPrimary}>Sou Treinadora</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleCliente}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonTextSecondary}>Tenho um Código</Text>
            </TouchableOpacity>
          </View>

          {/* Admin Access (dev mode) */}
          <TouchableOpacity style={styles.adminButton} onPress={handleAdmin}>
            <Text style={styles.adminText}>Acesso Admin</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>Ártio</Text>
            <Text style={styles.footerText}>Assessment de Personalidade</Text>
          </View>
        </Animated.View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoSection: {
    marginBottom: 24,
  },
  logoContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.cream,
    opacity: 0.7,
    letterSpacing: 6,
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  ritualTextContainer: {
    alignItems: 'center',
  },
  ritualTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.creamLight,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 16,
  },
  ritualTitleHighlight: {
    fontWeight: '700',
    color: COLORS.creamLight,
  },
  ritualDescription: {
    fontSize: 16,
    color: COLORS.cream,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
    marginBottom: 8,
  },
  buttonPrimary: {
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.button,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonTextPrimary: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.creamLight,
    letterSpacing: 0.5,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 240, 230, 0.5)',
  },
  buttonTextSecondary: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS_ARTIO.ocre,
    letterSpacing: 2,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.cream,
    opacity: 0.6,
    letterSpacing: 1,
  },
  adminButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 16,
    marginBottom: 8,
  },
  adminText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
});
