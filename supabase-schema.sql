-- ================================================
  -- SCHEMA SUPABASE - IPIP-NEO-120 APP
  -- ================================================

  -- Habilitar extensões necessárias
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- ================================================
  -- TABELAS
  -- ================================================

  -- 1. TREINADORAS
  CREATE TABLE treinadoras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    creditos INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Vincular com Supabase Auth
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
  );

  -- Índices
  CREATE INDEX idx_treinadoras_email ON treinadoras(email);
  CREATE INDEX idx_treinadoras_auth_user_id ON treinadoras(auth_user_id);

  -- Trigger para atualizar updated_at
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  CREATE TRIGGER update_treinadoras_updated_at BEFORE UPDATE ON treinadoras
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

  -- ================================================
  -- 2. CÓDIGOS
  CREATE TABLE codigos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT UNIQUE NOT NULL,
    treinadora_id UUID NOT NULL REFERENCES treinadoras(id) ON DELETE CASCADE,
    valido_ate TIMESTAMPTZ NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: código deve seguir formato ART-XXXX
    CONSTRAINT codigo_formato CHECK (codigo ~ '^ART-[0-9]{4}$')
  );

  -- Índices
  CREATE INDEX idx_codigos_codigo ON codigos(codigo);
  CREATE INDEX idx_codigos_treinadora_id ON codigos(treinadora_id);
  CREATE INDEX idx_codigos_valido_ate ON codigos(valido_ate);

  -- ================================================
  -- 3. CLIENTES
  CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    email TEXT,
    codigo_id UUID NOT NULL REFERENCES codigos(id) ON DELETE CASCADE,
    treinadora_id UUID NOT NULL REFERENCES treinadoras(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'em_andamento', 'completo')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Índices
  CREATE INDEX idx_clientes_treinadora_id ON clientes(treinadora_id);
  CREATE INDEX idx_clientes_status ON clientes(status);
  CREATE INDEX idx_clientes_codigo_id ON clientes(codigo_id);

  -- Trigger para atualizar updated_at
  CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

  -- ================================================
  -- 4. RESPOSTAS
  CREATE TABLE respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    questao_id INTEGER NOT NULL CHECK (questao_id >= 1 AND questao_id <= 120),
    resposta INTEGER NOT NULL CHECK (resposta >= 1 AND resposta <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: uma resposta por questão por cliente
    UNIQUE(cliente_id, questao_id)
  );

  -- Índices
  CREATE INDEX idx_respostas_cliente_id ON respostas(cliente_id);

  -- ================================================
  -- 5. RESULTADOS
  CREATE TABLE resultados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID UNIQUE NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    scores_facetas JSONB NOT NULL,
    scores_fatores JSONB NOT NULL,
    percentis JSONB NOT NULL,
    classificacoes JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Índices
  CREATE INDEX idx_resultados_cliente_id ON resultados(cliente_id);

  -- ================================================
  -- 6. PROTOCOLOS
  CREATE TABLE protocolos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faceta TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('baixo', 'medio', 'alto')),
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    exercicios JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: 3 protocolos por faceta (baixo, medio, alto)
    UNIQUE(faceta, tipo)
  );

  -- Índices
  CREATE INDEX idx_protocolos_faceta ON protocolos(faceta);
  CREATE INDEX idx_protocolos_tipo ON protocolos(tipo);

  -- ================================================
  -- 7. PROTOCOLOS RECOMENDADOS
  CREATE TABLE protocolos_recomendados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resultado_id UUID NOT NULL REFERENCES resultados(id) ON DELETE CASCADE,
    protocolo_id UUID NOT NULL REFERENCES protocolos(id) ON DELETE CASCADE,
    prioridade INTEGER NOT NULL CHECK (prioridade >= 1 AND prioridade <= 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint: um protocolo por resultado
    UNIQUE(resultado_id, protocolo_id)
  );

  -- Índices
  CREATE INDEX idx_protocolos_recomendados_resultado_id ON protocolos_recomendados(resultado_id);
  CREATE INDEX idx_protocolos_recomendados_prioridade ON protocolos_recomendados(prioridade);

  -- ================================================
  -- ROW LEVEL SECURITY (RLS)
  -- ================================================

  -- Habilitar RLS em todas as tabelas
  ALTER TABLE treinadoras ENABLE ROW LEVEL SECURITY;
  ALTER TABLE codigos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;
  ALTER TABLE protocolos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE protocolos_recomendados ENABLE ROW LEVEL SECURITY;

  -- ================================================
  -- POLÍTICAS RLS: TREINADORAS
  -- ================================================

  -- Treinadoras podem ver apenas seus próprios dados
  CREATE POLICY "Treinadoras podem ver seus dados"
    ON treinadoras FOR SELECT
    USING (auth.uid() = auth_user_id);

  -- Treinadoras podem atualizar seus próprios dados
  CREATE POLICY "Treinadoras podem atualizar seus dados"
    ON treinadoras FOR UPDATE
    USING (auth.uid() = auth_user_id);

  -- ================================================
  -- POLÍTICAS RLS: CÓDIGOS
  -- ================================================

  -- Treinadoras podem ver apenas seus códigos
  CREATE POLICY "Treinadoras podem ver seus códigos"
    ON codigos FOR SELECT
    USING (
      treinadora_id IN (
        SELECT id FROM treinadoras WHERE auth_user_id = auth.uid()
      )
    );

  -- Treinadoras podem criar códigos
  CREATE POLICY "Treinadoras podem criar códigos"
    ON codigos FOR INSERT
    WITH CHECK (
      treinadora_id IN (
        SELECT id FROM treinadoras WHERE auth_user_id = auth.uid()
      )
    );

  -- Acesso público para validar código (usado pelo cliente)
  CREATE POLICY "Acesso público para validar código"
    ON codigos FOR SELECT
    USING (NOT usado AND valido_ate > NOW());

  -- ================================================
  -- POLÍTICAS RLS: CLIENTES
  -- ================================================

  -- Treinadoras podem ver seus clientes
  CREATE POLICY "Treinadoras podem ver seus clientes"
    ON clientes FOR SELECT
    USING (
      treinadora_id IN (
        SELECT id FROM treinadoras WHERE auth_user_id = auth.uid()
      )
    );

  -- Clientes podem criar seu próprio registro (via código)
  CREATE POLICY "Clientes podem se registrar"
    ON clientes FOR INSERT
    WITH CHECK (true);

  -- Clientes podem ver seus próprios dados
  CREATE POLICY "Clientes podem ver seus dados"
    ON clientes FOR SELECT
    USING (true);

  -- Clientes podem atualizar status
  CREATE POLICY "Clientes podem atualizar status"
    ON clientes FOR UPDATE
    USING (true);

  -- ================================================
  -- POLÍTICAS RLS: RESPOSTAS
  -- ================================================

  -- Clientes podem criar respostas
  CREATE POLICY "Clientes podem criar respostas"
    ON respostas FOR INSERT
    WITH CHECK (true);

  -- Clientes podem ver suas respostas
  CREATE POLICY "Clientes podem ver suas respostas"
    ON respostas FOR SELECT
    USING (true);

  -- Treinadoras podem ver respostas de seus clientes
  CREATE POLICY "Treinadoras podem ver respostas de clientes"
    ON respostas FOR SELECT
    USING (
      cliente_id IN (
        SELECT id FROM clientes WHERE treinadora_id IN (
          SELECT id FROM treinadoras WHERE auth_user_id = auth.uid()
        )
      )
    );

  -- ================================================
  -- POLÍTICAS RLS: RESULTADOS
  -- ================================================

  -- Clientes podem criar resultados
  CREATE POLICY "Clientes podem criar resultados"
    ON resultados FOR INSERT
    WITH CHECK (true);

  -- Clientes podem ver seus resultados
  CREATE POLICY "Clientes podem ver seus resultados"
    ON resultados FOR SELECT
    USING (true);

  -- Treinadoras podem ver resultados de seus clientes
  CREATE POLICY "Treinadoras podem ver resultados"
    ON resultados FOR SELECT
    USING (
      cliente_id IN (
        SELECT id FROM clientes WHERE treinadora_id IN (
          SELECT id FROM treinadoras WHERE auth_user_id = auth.uid()
        )
      )
    );

  -- ================================================
  -- POLÍTICAS RLS: PROTOCOLOS
  -- ================================================

  -- Protocolos são públicos (leitura)
  CREATE POLICY "Protocolos são públicos"
    ON protocolos FOR SELECT
    USING (true);

  -- ================================================
  -- POLÍTICAS RLS: PROTOCOLOS RECOMENDADOS
  -- ================================================

  -- Clientes podem criar recomendações
  CREATE POLICY "Clientes podem criar recomendações"
    ON protocolos_recomendados FOR INSERT
    WITH CHECK (true);

  -- Clientes podem ver suas recomendações
  CREATE POLICY "Clientes podem ver recomendações"
    ON protocolos_recomendados FOR SELECT
    USING (true);

  -- Treinadoras podem ver recomendações de seus clientes
  CREATE POLICY "Treinadoras podem ver recomendações de clientes"
    ON protocolos_recomendados FOR SELECT
    USING (
      resultado_id IN (
        SELECT id FROM resultados WHERE cliente_id IN (
          SELECT id FROM clientes WHERE treinadora_id IN (
            SELECT id FROM treinadoras WHERE auth_user_id = auth.uid()
          )
        )
      )
    );

  -- ================================================
  -- FUNÇÕES AUXILIARES
  -- ================================================

  -- Função para gerar código único ART-XXXX
  CREATE OR REPLACE FUNCTION gerar_codigo_unico()
  RETURNS TEXT AS $$
  DECLARE
    novo_codigo TEXT;
    codigo_existe BOOLEAN;
  BEGIN
    LOOP
      -- Gerar código aleatório ART-XXXX
      novo_codigo := 'ART-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
      
      -- Verificar se código já existe
      SELECT EXISTS(SELECT 1 FROM codigos WHERE codigo = novo_codigo) INTO codigo_existe;
      
      -- Se não existe, retornar
      IF NOT codigo_existe THEN
        RETURN novo_codigo;
      END IF;
    END LOOP;
  END;
  $$ LANGUAGE plpgsql;

  -- ================================================
  -- SEED INICIAL (Protocolos Mock)
  -- ================================================

  -- Inserir alguns protocolos de exemplo
  INSERT INTO protocolos (faceta, tipo, titulo, descricao, exercicios) VALUES
    ('N1', 'alto', 'Gerenciamento de Ansiedade', 'Técnicas para reduzir níveis elevados de ansiedade', 
     '["Prática diária de respiração 4-7-8", "Journaling de preocupações", "Exercício físico regular"]'),
    ('N1', 'baixo', 'Atenção Plena às Emoções', 'Desenvolver maior consciência emocional',
     '["Check-in emocional 3x ao dia", "Identificar gatilhos emocionais", "Praticar validação de emoções"]'),
    ('E1', 'baixo', 'Desenvolvimento de Cordialidade', 'Fortalecer conexões sociais',
     '["Iniciar 3 conversas por dia", "Praticar escuta ativa", "Expressar gratidão regularmente"]'),
    ('E1', 'alto', 'Equilíbrio Social', 'Manter energia em interações',
     '["Estabelecer limites sociais", "Praticar tempo sozinho", "Qualidade sobre quantidade"]');

  -- ================================================
  -- COMENTÁRIOS FINAIS
  -- ================================================

  COMMENT ON TABLE treinadoras IS 'Profissionais que aplicam o teste';
  COMMENT ON TABLE codigos IS 'Códigos de acesso ART-XXXX gerados pelas treinadoras';
  COMMENT ON TABLE clientes IS 'Pessoas que realizam o teste usando um código';
  COMMENT ON TABLE respostas IS '120 respostas do teste IPIP-NEO-120';
  COMMENT ON TABLE resultados IS 'Scores calculados (30 facetas + 5 fatores)';
  COMMENT ON TABLE protocolos IS '90 protocolos comportamentais (3 por faceta)';
  COMMENT ON TABLE protocolos_recomendados IS 'Protocolos recomendados para cada cliente';
  