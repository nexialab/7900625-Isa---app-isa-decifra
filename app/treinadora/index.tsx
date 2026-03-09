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
    RefreshControl,
  } from 'react-native';
  import { useRouter } from 'expo-router';
  import { useAuth } from '@/lib/supabase/useAuth';
  import { supabase } from '@/lib/supabase/client';

  interface Treinadora {
    id: string;
    nome: string;
    email: string;
    creditos: number;
  }

  interface Cliente {
    id: string;
    nome: string;
    status: 'ativo' | 'em_andamento' | 'completo';
    created_at: string;
  }

  export default function TreinadoraDashboardScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    
    const [treinadora, setTreinadora] = useState<Treinadora | null>(null);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [gerandoCodigo, setGerandoCodigo] = useState(false);

    useEffect(() => {
      carregarDados();
    }, [user]);

    const carregarDados = async () => {
      if (!user) return;

      try {
        // Buscar dados da treinadora
        const { data: treinadoraData, error: treinadoraError } = await supabase
          .from('treinadoras')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (treinadoraError) {
          console.error('Erro ao buscar treinadora:', treinadoraError);
          Alert.alert('Erro', 'Não foi possível carregar seus dados');
          setLoading(false);
          return;
        }

        setTreinadora(treinadoraData);

        // Buscar clientes da treinadora
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('*')
          .eq('treinadora_id', treinadoraData.id)
          .order('created_at', { ascending: false });

        if (clientesError) {
          console.error('Erro ao buscar clientes:', clientesError);
        } else {
          setClientes(clientesData || []);
        }
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao carregar os dados');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    const onRefresh = () => {
      setRefreshing(true);
      carregarDados();
    };

    const gerarCodigo = async () => {
      if (!treinadora) return;

      // Verificar créditos
      if (treinadora.creditos <= 0) {
        Alert.alert(
          'Sem créditos',
          'Você não tem créditos suficientes para gerar um código. Compre mais créditos para continuar.',
          [{ text: 'OK' }]
        );
        return;
      }

      setGerandoCodigo(true);

      try {
        // Gerar código único
        const { data: codigoData, error: codigoError } = await supabase
          .rpc('gerar_codigo_unico');

        if (codigoError) {
          console.error('Erro ao gerar código:', codigoError);
          Alert.alert('Erro', 'Não foi possível gerar o código');
          setGerandoCodigo(false);
          return;
        }

        const codigoGerado = codigoData as string;
        
        // Data de validade: 30 dias a partir de agora
        const validoAte = new Date();
        validoAte.setDate(validoAte.getDate() + 30);

        // Inserir código no banco
        const { error: insertError } = await supabase
          .from('codigos')
          .insert({
            codigo: codigoGerado,
            treinadora_id: treinadora.id,
            valido_ate: validoAte.toISOString(),
          });

        if (insertError) {
          console.error('Erro ao salvar código:', insertError);
          Alert.alert('Erro', 'Não foi possível salvar o código');
          setGerandoCodigo(false);
          return;
        }

        // Descontar crédito
        const { error: updateError } = await supabase
          .from('treinadoras')
          .update({ creditos: treinadora.creditos - 1 })
          .eq('id', treinadora.id);

        if (updateError) {
          console.error('Erro ao atualizar créditos:', updateError);
        }

        // Atualizar estado local
        setTreinadora({ ...treinadora, creditos: treinadora.creditos - 1 });

        Alert.alert(
          'Código gerado!',
          `Código: ${codigoGerado}\n\nVálido até: ${validoAte.toLocaleDateString('pt-BR')}\n\nCompartilhe este código com seu cliente.`,
          [
            { text: 'Copiar Código', onPress: () => {
              // TODO: Implementar cópia para clipboard
              console.log('Código copiado:', codigoGerado);
            }},
            { text: 'OK' }
          ]
        );
      } catch (error: any) {
        console.error('Erro ao gerar código:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao gerar o código');
      } finally {
        setGerandoCodigo(false);
      }
    };

    const handleLogout = async () => {
      Alert.alert(
        'Sair',
        'Tem certeza que deseja sair?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: async () => {
              await signOut();
              router.replace('/');
            },
          },
        ]
      );
    };

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      );
    }

    if (!treinadora) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro ao carregar dados</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.button}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const statusColors = {
      ativo: '#FFA500',
      em_andamento: '#007AFF',
      completo: '#34C759',
    };

    const statusLabels = {
      ativo: 'Código Ativo',
      em_andamento: 'Em Andamento',
      completo: 'Completo',
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Olá, {treinadora.nome}!</Text>
            <Text style={styles.headerSubtitle}>{treinadora.email}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Card de Créditos */}
          <View style={styles.creditCard}>
            <View style={styles.creditInfo}>
              <Text style={styles.creditLabel}>Créditos Disponíveis</Text>
              <Text style={styles.creditValue}>{treinadora.creditos}</Text>
            </View>
            <TouchableOpacity
              style={[styles.generateButton, gerandoCodigo && styles.buttonDisabled]}
              onPress={gerarCodigo}
              disabled={gerandoCodigo}
            >
              {gerandoCodigo ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.generateButtonText}>Gerar Código</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Lista de Clientes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meus Clientes ({clientes.length})</Text>
            
            {clientes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {"Voce ainda nao tem clientes.\nGere um codigo para comecar!"}
                </Text>
              </View>
            ) : (
              clientes.map((cliente) => (
                <TouchableOpacity
                  key={cliente.id}
                  style={styles.clientCard}
                  onPress={() => {
                    // TODO: Navegar para detalhes do cliente
                    router.push(`/treinadora/cliente/${cliente.id}`);
                  }}
                >
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{cliente.nome}</Text>
                    <Text style={styles.clientDate}>
                      {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColors[cliente.status] },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {statusLabels[cliente.status]}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F7',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    errorText: {
      fontSize: 18,
      color: '#FF3B30',
      marginBottom: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5EA',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#8E8E93',
      marginTop: 4,
    },
    logoutText: {
      fontSize: 16,
      color: '#FF3B30',
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    creditCard: {
      margin: 24,
      padding: 24,
      backgroundColor: '#667eea',
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    creditInfo: {
      marginBottom: 16,
    },
    creditLabel: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    creditValue: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 8,
    },
    generateButton: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    generateButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#667eea',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    section: {
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 16,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
    },
    emptyStateText: {
      fontSize: 16,
      color: '#8E8E93',
      textAlign: 'center',
      lineHeight: 24,
    },
    clientCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    clientInfo: {
      flex: 1,
    },
    clientName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#000000',
    },
    clientDate: {
      fontSize: 14,
      color: '#8E8E93',
      marginTop: 4,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    button: {
      backgroundColor: '#667eea',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });
  