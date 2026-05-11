import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS_ARTIO } from '@/constants/colors-artio';

interface EnviarEmailModalProps {
  visible: boolean;
  onClose: () => void;
  onEnviar: (email: string, nomeCliente: string) => void;
  codigo: string;
  emailInicial?: string | null;
  nomeClienteInicial?: string | null;
  isLoading?: boolean;
  titulo?: string;
  botaoTexto?: string;
}

export function EnviarEmailModal({
  visible,
  onClose,
  onEnviar,
  codigo,
  emailInicial,
  nomeClienteInicial,
  isLoading = false,
  titulo = 'Enviar código por email',
  botaoTexto = 'Enviar Código',
}: EnviarEmailModalProps) {
  const [email, setEmail] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [erroEmail, setErroEmail] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setEmail(emailInicial || '');
      setNomeCliente(nomeClienteInicial || '');
      setErroEmail(null);
    }
  }, [visible, emailInicial, nomeClienteInicial]);

  const handleEnviar = () => {
    if (!email.trim()) {
      setErroEmail('Digite um email');
      return;
    }
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailValido) {
      setErroEmail('Digite um email válido');
      return;
    }
    setErroEmail(null);
    onEnviar(email.trim(), nomeCliente.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />

          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.titulo}>{titulo}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS_ARTIO.cream} />
              </TouchableOpacity>
            </View>

            <View style={styles.codigoBox}>
              <Text style={styles.codigoLabel}>Código</Text>
              <Text style={styles.codigoValue}>{codigo}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email do cliente *</Text>
              <TextInput
                style={[styles.input, erroEmail ? styles.inputError : null]}
                placeholder="cliente@email.com"
                placeholderTextColor={COLORS_ARTIO.cream}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (erroEmail) setErroEmail(null);
                }}
                editable={!isLoading}
              />
              {erroEmail ? <Text style={styles.errorText}>{erroEmail}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nome do cliente (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome completo"
                placeholderTextColor={COLORS_ARTIO.cream}
                value={nomeCliente}
                onChangeText={setNomeCliente}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.enviarButton, isLoading && styles.enviarButtonDisabled]}
              onPress={handleEnviar}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS_ARTIO.creamLight} />
              ) : (
                <>
                  <Ionicons name="mail" size={18} color={COLORS_ARTIO.creamLight} />
                  <Text style={styles.enviarButtonText}>{botaoTexto}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45, 21, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS_ARTIO.vinhoDark,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS_ARTIO.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS_ARTIO.creamLight,
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  codigoBox: {
    backgroundColor: 'rgba(196, 90, 61, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS_ARTIO.border,
  },
  codigoLabel: {
    fontSize: 12,
    color: COLORS_ARTIO.cream,
    opacity: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codigoValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS_ARTIO.creamLight,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS_ARTIO.cream,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(245, 240, 230, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS_ARTIO.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS_ARTIO.creamLight,
    fontSize: 16,
  },
  inputError: {
    borderColor: COLORS_ARTIO.error,
  },
  errorText: {
    color: COLORS_ARTIO.errorLight,
    fontSize: 13,
    marginTop: 6,
  },
  enviarButton: {
    backgroundColor: COLORS_ARTIO.terracota,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  enviarButtonDisabled: {
    opacity: 0.7,
  },
  enviarButtonText: {
    color: COLORS_ARTIO.creamLight,
    fontSize: 16,
    fontWeight: '600',
  },
});
