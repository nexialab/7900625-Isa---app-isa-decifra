/**
 * Lista de Treinadoras - Gerenciamento de treinadoras
 */
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { COLORS_ARTIO } from '@/constants/colors-artio';
import { useTreinadorasAdmin } from '@/hooks/useTreinadorasAdmin';
import { useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { TreinadoraAdmin } from '@/types/admin';
import { showAlert } from '@/utils/alert';
import { WebContent } from '@/components/WebContent';

// Chave secreta para a Edge Function (deve ser a mesma configurada no Supabase)
const ADMIN_SECRET = 'decifra-admin-secret-2024';

// Cores específicas do admin
const ADMIN_COLORS = {
  background: '#2D1518',
  sidebar: '#1A0C0E',
  card: 'rgba(255, 255, 255, 0.05)',
  accent: '#C45A3D',
  text: '#F5F0E6',
  textMuted: 'rgba(245, 240, 230, 0.6)',
  border: 'rgba(245, 240, 230, 0.1)',
  success: '#4CAF50',
  warning: '#FFA726',
};



export default function TreinadorasScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { treinadoras, isLoading, isError, error, refetch, hasSession } = useTreinadorasAdmin();

  // Estados para o modal de criar nova treinadora
  const [modalVisible, setModalVisible] = useState(false);
  const [novaTreinadora, setNovaTreinadora] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    senha: ''
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para o menu de ações
  const [menuVisible, setMenuVisible] = useState(false);
  const [treinadoraSelecionada, setTreinadoraSelecionada] = useState<TreinadoraAdmin | null>(null);

  // Estados para o modal de editar treinadora
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', email: '', whatsapp: '' });

  // Estado para modal de confirmação de exclusão
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  // Filtra treinadoras pela busca
  const filteredTreinadoras = useMemo(() => {
    if (!searchQuery.trim()) return treinadoras;
    const query = searchQuery.toLowerCase();
    return treinadoras.filter(t => 
      t.nome.toLowerCase().includes(query) || 
      t.email.toLowerCase().includes(query) ||
      (t.whatsapp && t.whatsapp.toLowerCase().includes(query))
    );
  }, [treinadoras, searchQuery]);

  // Formata data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para formatar WhatsApp no padrão internacional (+5511999999999)
  const formatarWhatsApp = (valor: string): string => {
    // Remove tudo que não for dígito
    let numeros = valor.replace(/\D/g, '');
    
    // Se começar com 55 e tiver mais de 2 dígitos, mantém
    if (numeros.startsWith('55') && numeros.length > 2) {
      // Limita a 13 dígitos (55 + DDD + 9 dígitos)
      numeros = numeros.slice(0, 13);
    } else if (!numeros.startsWith('55') && numeros.length > 0) {
      // Se não começar com 55, adiciona
      numeros = '55' + numeros;
      numeros = numeros.slice(0, 13);
    }
    
    return numeros;
  };

  // Função para formatar WhatsApp para exibição (+55 11 99999-9999)
  const formatarWhatsAppExibicao = (valor: string): string => {
    if (!valor) return '';
    
    // Remove tudo que não for dígito
    const numeros = valor.replace(/\D/g, '');
    
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 4) {
      return `+${numeros.slice(0, 2)} ${numeros.slice(2)}`;
    } else if (numeros.length <= 9) {
      return `+${numeros.slice(0, 2)} ${numeros.slice(2, 4)} ${numeros.slice(4)}`;
    } else {
      return `+${numeros.slice(0, 2)} ${numeros.slice(2, 4)} ${numeros.slice(4, 9)}-${numeros.slice(9, 13)}`;
    }
  };

  // Valida se o WhatsApp está no formato correto
  const validarWhatsApp = (whatsapp: string): boolean => {
    const numeros = whatsapp.replace(/\D/g, '');
    // Deve ter 55 + DDD (2 dígitos) + número (8 ou 9 dígitos) = 12 ou 13 dígitos
    return numeros.length >= 12 && numeros.length <= 13 && numeros.startsWith('55');
  };

  // Abrir menu de ações
  const handleOpenMenu = (treinadora: TreinadoraAdmin) => {
    setTreinadoraSelecionada(treinadora);
    setMenuVisible(true);
  };

  // Abrir modal de editar
  const handleOpenEditar = () => {
    if (!treinadoraSelecionada) return;
    setEditForm({
      nome: treinadoraSelecionada.nome,
      email: treinadoraSelecionada.email,
      whatsapp: treinadoraSelecionada.whatsapp || ''
    });
    setMenuVisible(false);
    setEditModalVisible(true);
  };

  // Reenviar email de definição de senha
  const handleReenviarSenha = async () => {
    if (!treinadoraSelecionada) return;
    
    setMenuVisible(false);
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        treinadoraSelecionada.email,
        {
          redirectTo: `${window.location.origin}/login`,
        }
      );

      if (error) throw error;

      showAlert(
        'Email enviado',
        `Instruções para definir a senha foram enviadas para ${treinadoraSelecionada.email}`
      );
    } catch (error: any) {
      showAlert('Erro', error.message || 'Erro ao enviar email');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para editar treinadora
  const handleEditarTreinadora = async () => {
    if (!treinadoraSelecionada) return;
    
    const emailLimpo = editForm.email.trim().toLowerCase();
    
    if (!editForm.nome.trim() || !emailLimpo) {
      showAlert('Erro', 'Preencha nome e email');
      return;
    }

    // Validar formato do email
    if (!validarEmail(emailLimpo)) {
      showAlert('Erro', 'Formato de email inválido');
      return;
    }

    if (!editForm.whatsapp.trim()) {
      showAlert('Erro', 'Preencha o WhatsApp');
      return;
    }

    const whatsappFormatado = formatarWhatsApp(editForm.whatsapp);
    
    if (!validarWhatsApp(whatsappFormatado)) {
      showAlert('Erro', 'WhatsApp inválido. Use o formato +55 11 99999-9999');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('treinadoras')
        .update({
          nome: editForm.nome.trim(),
          email: emailLimpo,
          whatsapp: whatsappFormatado,
        })
        .eq('id', treinadoraSelecionada.id);

      if (error) throw error;

      showAlert('Sucesso', 'Treinadora atualizada com sucesso!');
      
      setEditModalVisible(false);
      setTreinadoraSelecionada(null);
      refetch();
    } catch (error: any) {
      console.error('Erro ao editar treinadora:', error);
      showAlert('Erro', error.message || 'Erro ao editar treinadora');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir confirmação de exclusão
  const handleOpenExcluir = () => {
    console.log('[Excluir] Abrindo confirmação...', treinadoraSelecionada?.id);
    if (!treinadoraSelecionada) return;
    setMenuVisible(false);
    setConfirmDeleteVisible(true);
  };

  // Confirmar e executar exclusão
  const handleConfirmarExclusao = () => {
    console.log('[Excluir] Confirmando exclusão...');
    setConfirmDeleteVisible(false);
    handleExcluirTreinadora();
  };

  // Função para excluir treinadora
  const handleExcluirTreinadora = async () => {
    console.log('[Excluir] Iniciando exclusão...', treinadoraSelecionada?.id);
    
    if (!treinadoraSelecionada) {
      console.error('[Excluir] Nenhuma treinadora selecionada');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Buscar clientes da treinadora
      const { data: clientes, error: clientesQueryError } = await supabase
        .from('clientes')
        .select('id')
        .eq('treinadora_id', treinadoraSelecionada.id);

      if (clientesQueryError) {
        console.error('[Excluir] Erro ao buscar clientes:', clientesQueryError);
      }

      console.log('[Excluir] Clientes encontrados:', clientes?.length || 0);

      // Excluir respostas dos clientes primeiro
      if (clientes && clientes.length > 0) {
        const clienteIds = clientes.map(c => c.id);
        
        const { error: respostasError } = await supabase
          .from('respostas')
          .delete()
          .in('cliente_id', clienteIds);

        if (respostasError) {
          console.error('[Excluir] Erro ao excluir respostas:', respostasError);
        } else {
          console.log('[Excluir] Respostas excluídas');
        }

        // Excluir resultados dos clientes
        const { error: resultadosError } = await supabase
          .from('resultados')
          .delete()
          .in('cliente_id', clienteIds);

        if (resultadosError) {
          console.error('[Excluir] Erro ao excluir resultados:', resultadosError);
        } else {
          console.log('[Excluir] Resultados excluídos');
        }
      }

      // Excluir códigos da treinadora
      console.log('[Excluir] Excluindo códigos...');
      const { error: codigosError } = await supabase
        .from('codigos')
        .delete()
        .eq('treinadora_id', treinadoraSelecionada.id);

      if (codigosError) {
        console.error('[Excluir] Erro ao excluir códigos:', codigosError);
        throw new Error(`Erro ao excluir códigos: ${codigosError.message}`);
      }
      console.log('[Excluir] Códigos excluídos');

      // Excluir clientes da treinadora
      console.log('[Excluir] Excluindo clientes...');
      const { error: clientesError } = await supabase
        .from('clientes')
        .delete()
        .eq('treinadora_id', treinadoraSelecionada.id);

      if (clientesError) {
        console.error('[Excluir] Erro ao excluir clientes:', clientesError);
        throw new Error(`Erro ao excluir clientes: ${clientesError.message}`);
      }
      console.log('[Excluir] Clientes excluídos');

      // Finalmente excluir a treinadora
      console.log('[Excluir] Excluindo treinadora...');
      const { error } = await supabase
        .from('treinadoras')
        .delete()
        .eq('id', treinadoraSelecionada.id);

      if (error) {
        console.error('[Excluir] Erro ao excluir treinadora:', error);
        throw error;
      }

      console.log('[Excluir] Treinadora excluída com sucesso!');
      showAlert('Sucesso', 'Treinadora excluída com sucesso!');
      setTreinadoraSelecionada(null);
      refetch();
    } catch (error: any) {
      console.error('[Excluir] Erro completo:', error);
      showAlert('Erro', error.message || 'Erro ao excluir treinadora');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para validar email
  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  };

  // Função para criar nova treinadora
  const handleCriarTreinadora = async () => {
    const emailLimpo = novaTreinadora.email.trim().toLowerCase();
    
    if (!novaTreinadora.nome.trim() || !emailLimpo) {
      showAlert('Erro', 'Preencha nome e email');
      return;
    }

    // Validar formato do email
    if (!validarEmail(emailLimpo)) {
      showAlert('Erro', 'Formato de email inválido');
      return;
    }

    // Bloquear emails de teste comuns que o Supabase rejeita
    const emailProibidos = ['teste@gmail.com', 'teste2@gmail.com', 'test@gmail.com', 'admin@gmail.com'];
    if (emailProibidos.includes(emailLimpo)) {
      showAlert(
        'Email não permitido', 
        'Use um email válido e real. Emails de teste genéricos como "teste@gmail.com" são rejeitados pelo sistema de autenticação.'
      );
      return;
    }

    if (!novaTreinadora.whatsapp.trim()) {
      showAlert('Erro', 'Preencha o WhatsApp');
      return;
    }

    const whatsappFormatado = formatarWhatsApp(novaTreinadora.whatsapp);
    
    if (!validarWhatsApp(whatsappFormatado)) {
      showAlert('Erro', 'WhatsApp inválido. Use o formato +55 11 99999-9999');
      return;
    }

    // Validar senha
    const senha = novaTreinadora.senha.trim();
    if (!senha) {
      showAlert('Erro', 'Defina uma senha para a treinadora');
      return;
    }
    if (senha.length < 6) {
      showAlert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Usar a Edge Function para criar treinadora com email confirmado
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/criar-treinadora-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            nome: novaTreinadora.nome.trim(),
            email: emailLimpo,
            whatsapp: whatsappFormatado,
            senha: senha,
            secret: ADMIN_SECRET,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          showAlert(
            'Email já cadastrado',
            'Este email já está registrado no sistema. Deseja vincular à treinadora existente?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Vincular', 
                onPress: () => criarTreinadoraSemAuth(novaTreinadora)
              }
            ]
          );
          setIsSubmitting(false);
          return;
        }
        throw new Error(result.error || 'Erro ao criar treinadora');
      }

      showAlert(
        'Sucesso', 
        `Treinadora "${novaTreinadora.nome.trim()}" criada com sucesso!\n\n` +
        `📧 Email: ${emailLimpo}\n` +
        `🔑 Senha: ${senha}\n\n` +
        `✅ A treinadora já pode fazer login imediatamente!`
      );
      
      setModalVisible(false);
      setNovaTreinadora({ nome: '', email: '', whatsapp: '', senha: '' });
      refetch();
    } catch (error: any) {
      console.error('Erro completo:', error);
      
      // Mensagem de erro mais amigável
      let mensagemErro = error.message || 'Erro ao criar treinadora';
      if (mensagemErro.includes('is invalid')) {
        mensagemErro = 'O email informado foi rejeitado pelo sistema de autenticação. Use um email válido e real (não use emails de teste como teste@gmail.com).';
      }
      
      showAlert('Erro', mensagemErro);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função auxiliar para vincular treinadora a usuário existente
  const criarTreinadoraSemAuth = async (dados: typeof novaTreinadora) => {
    try {
      // Verificar se já existe treinadora com este email
      const { data: existing, error: checkError } = await supabase
        .from('treinadoras')
        .select('id')
        .eq('email', dados.email.trim().toLowerCase())
        .single();

      if (existing) {
        showAlert('Info', 'Este email já está vinculado a uma treinadora.');
        return;
      }

      // Criar treinadora sem auth_user_id (será vinculado quando confirmar email)
      const whatsappFormatado = formatarWhatsApp(dados.whatsapp);
      const { error: insertError } = await supabase
        .from('treinadoras')
        .insert({
          nome: dados.nome.trim(),
          email: dados.email.trim().toLowerCase(),
          whatsapp: whatsappFormatado,
          is_admin: false,
          auth_user_id: null
        });

      if (insertError) {
        throw insertError;
      }

      showAlert(
        'Sucesso',
        `Treinadora "${dados.nome.trim()}" criada!\n\n` +
        `O usuário já existe no sistema de autenticação. ` +
        `Quando ela confirmar o email e fizer login, a conta será vinculada automaticamente.`
      );
      
      setModalVisible(false);
      setNovaTreinadora({ nome: '', email: '', whatsapp: '', senha: '' });
      refetch();
    } catch (error: any) {
      showAlert('Erro', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <WebContent>
        <ScrollView 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
          refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          tintColor={ADMIN_COLORS.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Treinadoras</Text>
          <Text style={styles.headerSubtitle}>
            Gerencie as treinadoras cadastradas no sistema
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Nova Treinadora</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de busca e filtros */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>◎</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar treinadora..."
            placeholderTextColor={ADMIN_COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Filtrar ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Tabela de treinadoras */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ADMIN_COLORS.accent} />
          <Text style={styles.loadingText}>Carregando treinadoras...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error?.message || 'Erro ao carregar dados'}
          </Text>
          {!hasSession && (
            <Text style={styles.errorSubtext}>
              Sessão não encontrada. Faça login novamente.
            </Text>
          )}
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tableCard}>
          {/* Cabeçalho da tabela */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNome]}>Nome</Text>
            <Text style={[styles.tableHeaderCell, styles.colEmail]}>Email</Text>
            <Text style={[styles.tableHeaderCell, styles.colCodigos]}>Códigos</Text>
            <Text style={[styles.tableHeaderCell, styles.colClientes]}>Clientes</Text>
            <Text style={[styles.tableHeaderCell, styles.colData]}>Cadastro</Text>
            <Text style={[styles.tableHeaderCell, styles.colAcoes]}>Ações</Text>
          </View>

          {/* Linhas da tabela */}
          {filteredTreinadoras.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Nenhuma treinadora encontrada' : 'Nenhuma treinadora cadastrada'}
              </Text>
              {!searchQuery && (
                <Text style={styles.emptySubtext}>
                  Verifique o console para mensagens de debug
                </Text>
              )}
              <Text style={styles.debugInfo}>
                Total carregado: {treinadoras.length} | Sessão: {hasSession ? 'OK' : 'N/A'}
              </Text>
            </View>
          ) : (
            filteredTreinadoras.map((treinadora, index) => (
              <View 
                key={treinadora.id} 
                style={[
                  styles.tableRow, 
                  index === filteredTreinadoras.length - 1 && styles.tableRowLast
                ]}
              >
                <View style={[styles.tableCell, styles.colNome]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {treinadora.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.nomeText}>{treinadora.nome}</Text>
                    {treinadora.whatsapp && (
                      <Text style={styles.whatsappText}>
                        {formatarWhatsAppExibicao(treinadora.whatsapp)}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.tableCell, styles.colEmail, styles.emailText]}>
                  {treinadora.email}
                </Text>
                <Text style={[styles.tableCell, styles.colCodigos]}>
                  {treinadora.totalCodigos}
                </Text>
                <Text style={[styles.tableCell, styles.colClientes]}>
                  {treinadora.totalClientes}
                </Text>
                <Text style={[styles.tableCell, styles.colData, styles.dataText]}>
                  {formatDate(treinadora.created_at)}
                </Text>
                <View style={[styles.tableCell, styles.colAcoes]}>
                  <TouchableOpacity 
                    style={styles.menuBtn}
                    onPress={() => handleOpenMenu(treinadora)}
                  >
                    <Text style={styles.menuBtnText}>⋯</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Paginação placeholder */}
      <View style={styles.pagination}>
        <TouchableOpacity style={styles.pageBtn}>
          <Text style={styles.pageBtnText}>← Anterior</Text>
        </TouchableOpacity>
        <View style={styles.pageNumbers}>
          <Text style={[styles.pageNumber, styles.pageNumberActive]}>1</Text>
          <Text style={styles.pageNumber}>2</Text>
          <Text style={styles.pageNumber}>3</Text>
          <Text style={styles.pageNumber}>...</Text>
        </View>
        <TouchableOpacity style={styles.pageBtn}>
          <Text style={styles.pageBtnText}>Próximo →</Text>
        </TouchableOpacity>
      </View>

          <View style={styles.footer} />
        </ScrollView>
      </WebContent>

      {/* Menu de Ações (3 pontinhos) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleOpenEditar}>
              <Text style={styles.menuItemIcon}>✎</Text>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Editar Treinadora</Text>
                <Text style={styles.menuItemSubtitle}>Alterar nome, email e WhatsApp</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={handleReenviarSenha}>
              <Text style={styles.menuItemIcon}>🔑</Text>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Redefinir Senha</Text>
                <Text style={styles.menuItemSubtitle}>Enviar email para definir nova senha</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={handleOpenExcluir}>
              <Text style={styles.menuItemIcon}>🗑</Text>
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemTitle, styles.menuItemTitleDanger]}>Excluir Treinadora</Text>
                <Text style={styles.menuItemSubtitle}>Remover permanentemente</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal para criar nova treinadora */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Treinadora</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome da treinadora"
                  placeholderTextColor={ADMIN_COLORS.textMuted}
                  value={novaTreinadora.nome}
                  onChangeText={(text) => setNovaTreinadora({...novaTreinadora, nome: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@exemplo.com"
                  placeholderTextColor={ADMIN_COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={novaTreinadora.email}
                  onChangeText={(text) => setNovaTreinadora({...novaTreinadora, email: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>WhatsApp *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+55 11 99999-9999"
                  placeholderTextColor={ADMIN_COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={formatarWhatsAppExibicao(novaTreinadora.whatsapp)}
                  onChangeText={(text) => setNovaTreinadora({...novaTreinadora, whatsapp: formatarWhatsApp(text)})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha *</Text>
                <View style={styles.senhaContainer}>
                  <TextInput
                    style={[styles.input, styles.senhaInput]}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={ADMIN_COLORS.textMuted}
                    secureTextEntry={!mostrarSenha}
                    value={novaTreinadora.senha}
                    onChangeText={(text) => setNovaTreinadora({...novaTreinadora, senha: text})}
                  />
                  <TouchableOpacity 
                    style={styles.verSenhaBtn}
                    onPress={() => setMostrarSenha(!mostrarSenha)}
                  >
                    <Text style={styles.verSenhaText}>
                      {mostrarSenha ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.senhaHint}>
                  A treinadora usará esta senha para fazer login
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalBtnSecondary} 
                onPress={() => setModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnPrimary, isSubmitting && styles.modalBtnDisabled]}
                onPress={handleCriarTreinadora}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={ADMIN_COLORS.text} />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Criar Treinadora</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmDeleteVisible}
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#F44336' }]}>Confirmar Exclusão</Text>
              <TouchableOpacity onPress={() => setConfirmDeleteVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={{ color: ADMIN_COLORS.text, fontSize: 16, marginBottom: 8 }}>
                Deseja realmente excluir a treinadora?
              </Text>
              {treinadoraSelecionada && (
                <Text style={{ color: ADMIN_COLORS.accent, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
                  "{treinadoraSelecionada.nome}"
                </Text>
              )}
              <Text style={{ color: ADMIN_COLORS.textMuted, fontSize: 14 }}>
                Esta ação não pode ser desfeita. Todos os códigos e clientes associados também serão excluídos.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalBtnSecondary} 
                onPress={() => setConfirmDeleteVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnDanger, isSubmitting && styles.modalBtnDisabled]}
                onPress={handleConfirmarExclusao}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={ADMIN_COLORS.text} />
                ) : (
                  <Text style={styles.modalBtnDangerText}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar treinadora */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Treinadora</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome da treinadora"
                  placeholderTextColor={ADMIN_COLORS.textMuted}
                  value={editForm.nome}
                  onChangeText={(text) => setEditForm({...editForm, nome: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@exemplo.com"
                  placeholderTextColor={ADMIN_COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({...editForm, email: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>WhatsApp *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+55 11 99999-9999"
                  placeholderTextColor={ADMIN_COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={formatarWhatsAppExibicao(editForm.whatsapp)}
                  onChangeText={(text) => setEditForm({...editForm, whatsapp: formatarWhatsApp(text)})}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalBtnSecondary} 
                onPress={() => setEditModalVisible(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnPrimary, isSubmitting && styles.modalBtnDisabled]}
                onPress={handleEditarTreinadora}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={ADMIN_COLORS.text} />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: ADMIN_COLORS.textMuted,
  },
  addButton: {
    backgroundColor: ADMIN_COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    marginBottom: 24,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    paddingHorizontal: 16,
  },
  searchIcon: {
    fontSize: 16,
    color: ADMIN_COLORS.textMuted,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: ADMIN_COLORS.text,
  },
  filterButton: {
    backgroundColor: ADMIN_COLORS.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  filterText: {
    fontSize: 14,
    color: ADMIN_COLORS.textMuted,
  },
  tableCard: {
    marginHorizontal: 32,
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_COLORS.border,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    color: ADMIN_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_COLORS.border,
    alignItems: 'center',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 14,
    color: ADMIN_COLORS.text,
  },
  colNome: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colEmail: {
    flex: 2,
  },
  colCodigos: {
    flex: 1,
  },
  colClientes: {
    flex: 1,
  },
  colData: {
    flex: 1,
  },
  colAcoes: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${ADMIN_COLORS.accent}30`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: ADMIN_COLORS.accent,
  },
  nomeText: {
    fontSize: 14,
    fontWeight: '500',
    color: ADMIN_COLORS.text,
  },
  whatsappText: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  emailText: {
    fontSize: 13,
    color: ADMIN_COLORS.textMuted,
  },
  dataText: {
    fontSize: 13,
    color: ADMIN_COLORS.textMuted,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: ADMIN_COLORS.textMuted,
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS_ARTIO.error,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: ADMIN_COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: ADMIN_COLORS.textMuted,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 24,
  },
  pageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  pageBtnText: {
    fontSize: 14,
    color: ADMIN_COLORS.textMuted,
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 8,
  },
  pageNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 14,
    color: ADMIN_COLORS.textMuted,
    ...Platform.select({
      web: {
        lineHeight: undefined,
        textAlignVertical: 'center',
      },
    }),
  },
  pageNumberActive: {
    backgroundColor: ADMIN_COLORS.accent,
    color: ADMIN_COLORS.text,
    fontWeight: '600',
  },
  footer: {
    height: 40,
  },
  errorSubtext: {
    fontSize: 14,
    color: ADMIN_COLORS.warning,
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: ADMIN_COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  debugInfo: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: ADMIN_COLORS.sidebar,
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  modalClose: {
    fontSize: 20,
    color: ADMIN_COLORS.textMuted,
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: ADMIN_COLORS.text,
  },
  input: {
    backgroundColor: ADMIN_COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: ADMIN_COLORS.text,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: ADMIN_COLORS.border,
  },
  modalBtnSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalBtnSecondaryText: {
    fontSize: 14,
    color: ADMIN_COLORS.textMuted,
  },
  modalBtnPrimary: {
    backgroundColor: ADMIN_COLORS.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
  modalBtnDanger: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalBtnDangerText: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBtnText: {
    fontSize: 20,
    color: ADMIN_COLORS.textMuted,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: ADMIN_COLORS.sidebar,
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemDanger: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  menuItemIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  menuItemTitleDanger: {
    color: '#F44336',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: ADMIN_COLORS.border,
    marginHorizontal: 16,
  },
  senhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  senhaInput: {
    flex: 1,
    paddingRight: 50,
  },
  verSenhaBtn: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  verSenhaText: {
    fontSize: 18,
  },
  senhaHint: {
    fontSize: 12,
    color: ADMIN_COLORS.textMuted,
    marginTop: 4,
  },
});
