import type { ScoreFaceta } from './calculadora';
  import type { FacetaKey } from '@/constants/ipip';

  export interface Protocolo {
    id: string;
    faceta: FacetaKey;
    tipo: 'baixo' | 'medio' | 'alto';
    titulo: string;
    descricao: string;
    exercicios: string[];
  }

  export interface ProtocoloRecomendado {
    protocolo: Protocolo;
    prioridade: number;
    razao: string;
  }

  // Mock de protocolos (serão migrados para o Supabase)
  const PROTOCOLOS_MOCK: Protocolo[] = [
    // Exemplo: Ansiedade (N1)
    {
      id: 'p001',
      faceta: 'N1',
      tipo: 'alto',
      titulo: 'Gerenciamento de Ansiedade',
      descricao: 'Técnicas para reduzir níveis elevados de ansiedade',
      exercicios: [
        'Prática diária de respiração 4-7-8',
        'Journaling de preocupações',
        'Exercício físico regular'
      ]
    },
    {
      id: 'p002',
      faceta: 'N1',
      tipo: 'baixo',
      titulo: 'Atenção Plena às Emoções',
      descricao: 'Desenvolver maior consciência emocional',
      exercicios: [
        'Check-in emocional 3x ao dia',
        'Identificar gatilhos emocionais',
        'Praticar validação de emoções'
      ]
    },
    // ... (90 protocolos serão adicionados posteriormente)
  ];

  // Determinar tipo baseado na classificação
  function determinarTipo(classificacao: string): 'baixo' | 'medio' | 'alto' {
    if (classificacao === 'Muito Baixo' || classificacao === 'Baixo') return 'baixo';
    if (classificacao === 'Médio') return 'medio';
    return 'alto';
  }

  // Recomendar protocolos baseados nos scores
  export function recomendarProtocolos(
    scoresFacetas: ScoreFaceta[],
    quantidade: number = 6
  ): ProtocoloRecomendado[] {
    const recomendacoes: ProtocoloRecomendado[] = [];
    
    // Priorizar facetas extremas (Muito Baixo/Muito Alto)
    const facetasPrioritarias = scoresFacetas
      .filter(sf => sf.classificacao !== 'Médio')
      .sort((a, b) => {
        // Prioridade: Muito Alto/Baixo > Alto/Baixo
        const prioridades = {
          'Muito Baixo': 3,
          'Baixo': 2,
          'Médio': 0,
          'Alto': 2,
          'Muito Alto': 3,
        };
        return prioridades[b.classificacao] - prioridades[a.classificacao];
      });
    
    // Para cada faceta prioritária, encontrar protocolo apropriado
    for (const scoreFaceta of facetasPrioritarias) {
      if (recomendacoes.length >= quantidade) break;
      
      const tipo = determinarTipo(scoreFaceta.classificacao);
      const protocolo = PROTOCOLOS_MOCK.find(
        p => p.faceta === scoreFaceta.faceta && p.tipo === tipo
      );
      
      if (protocolo) {
        const prioridade = scoreFaceta.percentil <= 15 || scoreFaceta.percentil >= 85 ? 3
          : scoreFaceta.percentil <= 35 || scoreFaceta.percentil >= 65 ? 2
          : 1;
        
        recomendacoes.push({
          protocolo,
          prioridade,
          razao: `${scoreFaceta.faceta}: ${scoreFaceta.classificacao} (Percentil ${scoreFaceta.percentil})`,
        });
      }
    }
    
    return recomendacoes.slice(0, quantidade);
  }

  // Filtrar recomendações para cliente (4 protocolos, simplificados)
  export function recomendacoesParaCliente(
    recomendacoes: ProtocoloRecomendado[]
  ): ProtocoloRecomendado[] {
    return recomendacoes.slice(0, 4);
  }

  // Recomendações completas para treinadora (6 protocolos, detalhados)
  export function recomendacoesParaTreinadora(
    recomendacoes: ProtocoloRecomendado[]
  ): ProtocoloRecomendado[] {
    return recomendacoes.slice(0, 6);
  }
  