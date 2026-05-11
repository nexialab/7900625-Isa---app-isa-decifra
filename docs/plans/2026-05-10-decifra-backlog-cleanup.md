# Decifra Backlog Cleanup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Zerar (ou propor) as 20 issues abertas do Plane projeto APPISADECI hoje (2026-05-10).

**Honestidade:** 14 issues são tecnicamente fechá­veis hoje sem aprovação externa (bugs, features, copy óbvio). 6 issues envolvem revisão editorial das frases do teste IPIP (assunto da Isa) — pra essas a estratégia é gerar **diffs propostos** e abrir como commit separado em branch `editorial/`, aguardando aprovação. Total estimado de execução focada: ~5–7h.

**Arquitetura:** Expo (React Native) + Supabase (DB + Edge Functions) + serviço PDF Express (Gotenberg). Mudanças são quase todas de conteúdo/UI; uma migration nova (`mostrar_whatsapp` boolean), uma refatoração de `utils/calculadora.ts` (classificação por score bruto), e ativação real do edge function `notificar-teste-finalizado`.

**Tech Stack:** TypeScript, React Native 0.81, Expo Router 6, @supabase/supabase-js 2, Express 5, Handlebars (PDF), Gotenberg.

**Mapeamento Issue → Fase:**

| Issue Plane | Tema | Fase | Risco |
|---|---|---|---|
| #1 Acessos não funcionam | Auth | 1 | Médio — pode ser reset de senhas |
| #9 Números das questões (in-progress) | UI teste | 2 | Baixo |
| #10 Nome cliente no PDF vira "Cliente" | PDF | 3 | Baixo |
| #11 "aluna" → "cliente" | Copy | 1 | Baixo |
| #12 Treinadora cadastra WhatsApp + opt-out | Feature | 4 | Médio (migration) |
| #13 Notificar treinadora teste finalizado | Feature | 5 | Médio (Edge Function) |
| #14 Cadastro sem contato pra créditos | UX | 6 | Baixo |
| #15 Estação 1 — ortografia | Editorial | 8 | Bloqueado por Isa |
| #16 Estação 2 — repetidas/confusas | Editorial | 8 | Bloqueado por Isa |
| #17 Estação 3 — "os outros" | Copy | 1 | Baixo |
| #18 Estação 3 — ortografia | Editorial | 8 | Bloqueado por Isa |
| #19 Estação 4 — repetida/confusas | Editorial | 8 | Bloqueado por Isa |
| #20 PDF "auto-observação" hífen | Copy | 1 | Baixo |
| #21 Relatório completo da treinadora | Investigação | 7 | Bloqueado — pedir modelo |
| #22 Características secundárias confuso | Editorial | 8 | Bloqueado por Isa |
| #23 "cam" no resultado | Bug | 7 | Bloqueado — pedir screenshot |
| #24 Mostrar soma das pontuações | UI | 7 | Baixo |
| #25 Revisão geral das frases | Editorial | 8 | Bloqueado por Isa |
| #26 Pontuação 71 = "Alto" (bug) | Algoritmo | 4 | **Alto** — quebra UX, mas é correto |
| #27 Protocolos não clicáveis | UI | 7 | Baixo |

---

## Fase 0 — Setup & verificação

### Task 0.1: Criar branch de trabalho

**Step 1:** Criar branch
```bash
cd /home/renan/Renan/code/7900625-Isa---app-isa-decifra
git checkout -b chore/backlog-cleanup-2026-05-10
```

**Step 2:** Verificar tudo verde
```bash
git status   # esperado: clean
node --version   # >= 20
```

### Task 0.2: Subir Supabase + app local

**Step 1:** Garantir Supabase local rodando OU `.env` apontado pra projeto remoto (cliente já em produção em https://decifra1.netlify.app).

**Step 2:** Rodar `npx expo start --web` em terminal separado pra testar visualmente cada fix.

---

## Fase 1 — Copy bugs (issues #11, #17, #20)

Lote único, baixíssimo risco, um commit.

### Task 1.1: #20 — "auto-observação" com hífen no protocolo

**Files:**
- Modify: `constants/protocolos.ts:680`

**Step 1:** Ler linha 680 (já confirmado: `autoobservação` sem hífen).

**Step 2:** Edit:
```typescript
// antes
descricao: `Aplicar uma microação de ${facetaNome.toLowerCase()} com foco em consistência e autoobservação.`,
// depois
descricao: `Aplicar uma microação de ${facetaNome.toLowerCase()} com foco em consistência e auto-observação.`,
```

**Step 3:** Confirmar nenhuma outra ocorrência:
```bash
grep -rn "autoobserva\|auto observa" --include="*.ts" --include="*.tsx" --include="*.html"
# esperado: 0 resultados
```

### Task 1.2: #11 — "aluna" → "cliente" em UI

**Files:**
- Modify: `components/EnviarEmailModal.tsx:94, 97, 113`

**Step 1:** Edits:
```tsx
// linha 94
<Text style={styles.label}>Email do cliente *</Text>
// linha 97
placeholder="cliente@email.com"
// linha 113
<Text style={styles.label}>Nome do cliente (opcional)</Text>
```

**Step 2:** Renomear variável de estado pra acompanhar (não obrigatório, mas DRY):
```tsx
// linha 19 (interface) e 40 (state) e referências
nomeAluna → nomeCliente
nomeAlunaInicial → nomeClienteInicial
```

**Step 3:** Atualizar consumidores. Procurar:
```bash
grep -rn "nomeAluna\|nomeAlunaInicial" app/ components/ utils/ --include="*.tsx" --include="*.ts"
```
Substituir todas as referências.

**Step 4:** **NÃO mexer** em `types/database.ts` (campo `nome_aluna` é coluna real do Supabase — renomear exige migration que não justifica esse fix). Apenas mapear `nomeCliente` ↔ `nome_aluna` no envio:
```ts
// no submit, ainda enviar nome_aluna pro backend
{ nome_aluna: nomeCliente }
```

**Step 5:** Templates de email:
- `supabase/functions/enviar-codigo-email/index.ts:83`: `<p>Código de acesso da sua aluna</p>` → `<p>Código de acesso do seu cliente</p>`
- `supabase/functions/enviar-codigo-decifra/index.ts:75`: idem.

**Step 6:** Deploy edge functions:
```bash
npx supabase functions deploy enviar-codigo-email
npx supabase functions deploy enviar-codigo-decifra
```

### Task 1.3: #17 — Introdução Estação 3 "os outros"

**Files:**
- Modify: `constants/colors-artio.ts:194`

**Step 1:** Edit:
```typescript
// antes
description: 'Mapeamos sua forma de criar vínculos, expressar emoções e se conectar com outros.',
// depois
description: 'Mapeamos sua forma de criar vínculos, expressar emoções e se conectar com os outros.',
```

### Task 1.4: Commit lote copy

```bash
git add constants/protocolos.ts components/EnviarEmailModal.tsx \
        supabase/functions/enviar-codigo-email/index.ts \
        supabase/functions/enviar-codigo-decifra/index.ts \
        constants/colors-artio.ts \
        app/ components/   # se renomeou nomeAluna→nomeCliente
git commit -m "fix(copy): aluna→cliente, auto-observação com hífen, estação 3 'os outros'

Issues Plane: #11, #17, #20"
```

---

## Fase 2 — Numeração das questões (#9 in-progress)

A renderização atual mostra `Questão {questaoId}` onde `questaoId` é 1-120 fora de ordem (ex: estação 1 começa com 73). Cliente vê "Questão 73" como primeira → confunde. Solução: trocar por **posição na estação** (1-30) ou **remover totalmente**. Issue diz "ser retirado".

### Task 2.1: Esconder número da questão

**Files:**
- Modify: `app/cliente/teste.tsx:240-257`

**Step 1:** Trocar bloco:
```tsx
{questoesIds.map((questaoId: number) => {
  const questao = QUESTOES.find(q => q.id === questaoId);
  if (!questao) return null;
  const respostaSelecionada = respostas[questaoId];
  const posicao = questoesIds.indexOf(questaoId) + 1;  // 1-30

  return (
    <View key={questaoId} style={styles.questaoCard}>
      <View style={styles.questaoHeader}>
        <Text style={[styles.questaoNumero, { color: temaEstacao.color }]}>
          {posicao} de {questoesIds.length}
        </Text>
        {/* ...resto igual */}
```

**Step 2:** Verificação visual: rodar app, abrir Estação 1, primeira questão deve mostrar "1 de 30" (e não "Questão 73").

**Step 3:** Commit
```bash
git add app/cliente/teste.tsx
git commit -m "fix(teste): mostrar posição da questão na estação ao invés de id global

ID global (1-120) confundia cliente porque ordem é anti-manipulação.
Issue Plane: #9"
```

**Step 4:** Mover #9 pra Done no Plane (via mcp_plane).

---

## Fase 3 — PDF: nome do cliente (#10)

Bug confirmado em `pdf-service/src/services/template-engine.ts:203-220`: monta `cliente.nome` corretamente, mas template renderiza "Cliente" estático. Diagnóstico precisa ser feito ao vivo, mas hipótese forte: query do `cliente.nome` retorna null ou o campo veio vazio.

### Task 3.1: Investigar a query

**Files:**
- Read: `pdf-service/src/routes/pdf.ts`
- Read: `pdf-service/src/services/template-engine.ts:150-220`

**Step 1:** Achar onde busca o cliente:
```bash
grep -n "from.*clientes\|from('clientes')" pdf-service/src/
```

**Step 2:** Conferir se o `select` inclui `nome`. Se for `select('*')`, ok. Se for `select('id, email, ...')` sem `nome`, está aí o bug.

**Step 3:** Conferir se o cliente real no DB tem `nome` preenchido (rodar via mcp_supabase ou SQL):
```sql
SELECT id, nome, email FROM clientes ORDER BY created_at DESC LIMIT 5;
```

### Task 3.2: Corrigir & adicionar fallback defensivo

**Files:**
- Modify: `pdf-service/src/services/template-engine.ts:205`
- Modify: `pdf-service/src/templates/cliente.html:415`

**Step 1:** Adicionar fallback no engine:
```ts
cliente: {
  nome: cliente.nome ?? cliente.email ?? 'Cliente',
  email: cliente.email,
  dataAvaliacao: resultado.created_at
},
```

**Step 2:** Garantir SELECT puxa o nome (corrigir se faltava).

**Step 3:** Rebuild e redeploy do pdf-service:
```bash
cd pdf-service
docker compose build && docker compose up -d
```

**Step 4:** Smoke test: gerar PDF de um cliente de teste, abrir, conferir nome.

**Step 5:** Commit:
```bash
git add pdf-service/
git commit -m "fix(pdf): garantir nome do cliente no relatório PDF

- Adiciona fallback nome→email→'Cliente' no template engine
- Inclui campo nome no SELECT (caso ausente)
Issue Plane: #10"
```

---

## Fase 4 — Pontuações (#26) — bug crítico de classificação

**Diagnóstico:** `utils/calculadora.ts:93-99` classifica por **percentil normalizado** (`<=85=Alto`). Cliente espera classificação por **score bruto** (84-120=Alto). Isso significa: alguém com score 71 (que é médio na escala da Isa) aparece como "Alto" porque o percentil dela na população foi alto. **É um bug semântico.**

### Task 4.1: Test → falha esperada

**Files:**
- Create: `utils/__tests__/calculadora.test.ts` (se não existe runner, pular pra step 3)

**Step 1:** Test:
```ts
import { classificarFator } from '../calculadora';

test('score 71 deve ser Médio (curso Isa: 84+ é Alto)', () => {
  expect(classificarFator(71)).toBe('Médio');
});
test('score 84 deve ser Alto', () => {
  expect(classificarFator(84)).toBe('Alto');
});
test('score 108 deve ser Muito Alto', () => {
  expect(classificarFator(108)).toBe('Muito Alto');
});
test('score 47 deve ser Muito Baixo', () => {
  expect(classificarFator(47)).toBe('Muito Baixo');
});
```

**Step 2:** Rodar — falha (função não exportada).

### Task 4.2: Refatorar classificação

**Files:**
- Modify: `utils/calculadora.ts:92-173`

**Step 1:** Adicionar função `classificarFator` (score bruto, escala 24-120):
```ts
// Limites confirmados pela Isa via curso:
// 24-47 Muito Baixo | 48-71 Baixo | 72-83 Médio | 84-107 Alto | 108-120 Muito Alto
export function classificarFator(scoreBruto: number): 'Muito Baixo' | 'Baixo' | 'Médio' | 'Alto' | 'Muito Alto' {
  if (scoreBruto <= 47) return 'Muito Baixo';
  if (scoreBruto <= 71) return 'Baixo';
  if (scoreBruto <= 83) return 'Médio';
  if (scoreBruto <= 107) return 'Alto';
  return 'Muito Alto';
}
```

**Step 2:** Adicionar `classificarFaceta` análoga (escala 4-20):
```ts
// Faceta IPIP-NEO-120: 4 questões × 1-5 = 4-20
// Proporção 24→4, 47→8, 71→12, 83→14, 107→18, 120→20
export function classificarFaceta(scoreBruto: number): 'Muito Baixo' | 'Baixo' | 'Médio' | 'Alto' | 'Muito Alto' {
  if (scoreBruto <= 8) return 'Muito Baixo';
  if (scoreBruto <= 11) return 'Baixo';
  if (scoreBruto <= 13) return 'Médio';
  if (scoreBruto <= 17) return 'Alto';
  return 'Muito Alto';
}
```

**Step 3:** Trocar uso na `calcularScoresFatores` (linha 168) e `calcularScoresFacetas` (linha 125):
```ts
// fator
classificacao: classificarFator(scoreFator),
// faceta
classificacao: classificarFaceta(score!),
```

**Step 4:** Manter `classificar(percentil)` antigo (deprecar com `@deprecated`) caso seja usado em outro lugar:
```bash
grep -rn "classificar(" --include="*.ts" --include="*.tsx" | grep -v calculadora
```
Se outros consumidores existirem, atualizar pra função correta.

### Task 4.3: Verificar e commit

**Step 1:** Rodar testes — esperado: PASS.

**Step 2:** Smoke manual: gerar resultado de cliente teste, conferir que score=71 aparece como "Baixo" (não "Alto").

**Step 3:** **Atenção:** Resultados antigos no banco têm classificação errada armazenada em `resultados.classificacoes`. Decisão: deixar como está (próximo cálculo já usa novo) OU rodar backfill:
```sql
-- opcional: invalidar cache de classificações
UPDATE resultados SET classificacoes = NULL WHERE created_at < NOW();
```
Padrão: **não rodar backfill** — escopo desse fix é forward-only.

**Step 4:** Commit:
```bash
git add utils/calculadora.ts utils/__tests__/calculadora.test.ts
git commit -m "fix(calculadora): classificar fatores por score bruto, não percentil

Cliente reportou score 71 sendo exibido como 'Alto'.
Curso da Isa define: 84-107 Alto, 108-120 Muito Alto.
Algoritmo antigo usava percentil normalizado (>85% da população).
Issue Plane: #26"
```

---

## Fase 5 — Treinadora: WhatsApp (#12) + Notificação (#13)

### Task 5.1: Migration — adicionar `mostrar_whatsapp`

**Files:**
- Create: `supabase/migrations/20260510_add_mostrar_whatsapp.sql`

**Step 1:** Conteúdo:
```sql
-- Permitir treinadora optar por NÃO exibir o WhatsApp pro cliente
ALTER TABLE treinadoras
  ADD COLUMN IF NOT EXISTS mostrar_whatsapp BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN treinadoras.mostrar_whatsapp IS
  'Se true, botão WhatsApp aparece no resultado do cliente (default: true)';
```

**Step 2:** Aplicar:
```bash
npx supabase db push
# OU via mcp_supabase apply_migration
```

**Step 3:** Regenerar tipos:
```bash
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

### Task 5.2: Form da treinadora — campo WhatsApp + toggle

Tela de auto-cadastro (`app/treinadora/cadastro.tsx`) e tela de perfil (`app/treinadora/index.tsx`) precisam de:
- Input WhatsApp (com máscara `+55 (XX) XXXXX-XXXX`)
- Switch "Exibir meu WhatsApp no resultado dos clientes"

**Files:**
- Modify: `app/treinadora/cadastro.tsx` (adicionar campos)
- Modify: `app/treinadora/index.tsx` ou criar `app/treinadora/perfil.tsx` (editar)
- Modify: `app/(admin)/(dashboard)/treinadoras.tsx` (admin pode editar também)

**Step 1:** Adicionar `whatsapp` ao state inicial e ao payload de submit. Validação: regex `^\+\d{12,14}$` após normalização.

**Step 2:** Switch:
```tsx
<Switch
  value={mostrarWhatsapp}
  onValueChange={setMostrarWhatsapp}
/>
<Text>Exibir meu WhatsApp no resultado dos clientes</Text>
```

**Step 3:** Persistir `mostrar_whatsapp` no upsert.

### Task 5.3: Resultado respeita opt-out

**Files:**
- Modify: `app/cliente/resultado.tsx:167, 611-620`

**Step 1:** SELECT puxar também `mostrar_whatsapp`:
```ts
.select('whatsapp, nome, mostrar_whatsapp')
```

**Step 2:** Condição do botão:
```tsx
{treinadoraInfo.whatsapp && treinadoraInfo.mostrarWhatsapp && (
  <View style={styles.whatsappContainer}>
    {/* ... */}
  </View>
)}
```

### Task 5.4: Disparar notificação ao finalizar teste

Edge function `notificar-teste-finalizado` já existe (subagent confirmou idempotência 24h em `supabase/functions/notificar-teste-finalizado/index.ts:199-213`). Falta **chamar** ela do app no momento certo.

**Files:**
- Modify: `app/cliente/processando.tsx` ou `app/cliente/resultado.tsx` (onde resultado é salvo)

**Step 1:** Encontrar local onde `resultados` é inserido após teste:
```bash
grep -rn "from('resultados').*insert\|resultados').upsert" app/
```

**Step 2:** Após insert bem-sucedido, invocar:
```ts
const { error: notifError } = await supabase.functions.invoke('notificar-teste-finalizado', {
  body: { resultado_id: novoResultado.id, cliente_id: clienteId },
});
if (notifError) console.warn('Notificação falhou:', notifError); // não bloquear UX
```

**Step 3:** Conferir email enviado (logs Edge Function ou tabela `notificacao_emails`).

### Task 5.5: Commit & deploy

```bash
git add supabase/migrations/ types/database.ts app/treinadora/ app/cliente/resultado.tsx \
        app/cliente/processando.tsx app/(admin)/(dashboard)/treinadoras.tsx
git commit -m "feat(treinadora): WhatsApp opt-in + notificação ao finalizar teste

- Migration: coluna mostrar_whatsapp (default true)
- Form de cadastro/perfil: input WhatsApp + switch opt-out
- Resultado respeita mostrar_whatsapp
- Dispara edge function notificar-teste-finalizado após resultado
Issues Plane: #12, #13"
```

---

## Fase 6 — Cadastro: contato pra créditos (#14)

Quando treinadora se cadastra direto pela tela inicial (sem código Hotmart) e clica "Resgatar códigos", cai num popup pedindo pra falar com admin — sem nenhum link de contato. Solução: adicionar botão WhatsApp/email do admin.

### Task 6.1: Achar o popup

**Step 1:**
```bash
grep -rn "comprar créditos\|administrador\|resgatar" --include="*.tsx" app/
```

### Task 6.2: Adicionar contato

**Files:**
- Modify: o componente do popup (provavelmente `app/treinadora/index.tsx` ou modal dedicado)
- Modify: `constants/contato.ts` (criar) — centralizar contato admin

**Step 1:** Criar constante:
```ts
// constants/contato.ts
export const CONTATO_ADMIN = {
  whatsapp: '+5511999999999',  // confirmar com Isa
  email: 'contato@decifra.com.br', // confirmar
  mensagemInicial: 'Olá! Quero comprar créditos do Decifra.',
};
```

**Step 2:** Botão no popup:
```tsx
<TouchableOpacity onPress={() => Linking.openURL(
  `https://wa.me/${CONTATO_ADMIN.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(CONTATO_ADMIN.mensagemInicial)}`
)}>
  <Text>💬 Falar no WhatsApp pra comprar créditos</Text>
</TouchableOpacity>
```

**Step 3:** Confirmar contato com Isa antes de hardcodar (deixar TODO bem visível no código).

**Step 4:** Commit:
```bash
git commit -am "feat(creditos): adicionar contato do admin no popup de resgatar códigos

Issue Plane: #14"
```

---

## Fase 7 — Resultado UI (#23, #24, #27)

### Task 7.1: #24 — Mostrar soma das pontuações

Cliente sugeriu colocar "números das somas das pontuações" na página de resultado. O componente `Mandala` mostra o radar mas não mostra os números brutos.

**Files:**
- Modify: `app/cliente/resultado.tsx` (procurar bloco de fatores)

**Step 1:** Adicionar logo abaixo de cada nome de fator o `score` bruto:
```tsx
<Text style={styles.fatorScore}>
  {fator.score} / 120 — {fator.classificacao}
</Text>
```

**Step 2:** Estilo discreto (`fontSize: 14, opacity: 0.85`).

### Task 7.2: #27 — Protocolos clicáveis

**Files:**
- Modify: `components/ProtocoloCard.tsx`
- Verify: rota `app/cliente/protocolos.tsx` (já existe)

**Step 1:** Wrap card em `TouchableOpacity`:
```tsx
<TouchableOpacity
  onPress={() => router.push({
    pathname: '/cliente/protocolos',
    params: { faceta: protocolo.faceta, tipo: protocolo.tipo }
  })}
  activeOpacity={0.85}
>
  {/* conteúdo do card */}
</TouchableOpacity>
```

**Step 2:** Confirmar `app/cliente/protocolos.tsx` lê os params e mostra detalhe. Se não, adicionar.

### Task 7.3: #23 — "cam" no resultado (BLOQUEADO)

**Step 1:** Não há "cam" no código. Pedir screenshot da Plane (issue #23 tem image-component anexado). Sem isso:
```
TODO #23: aguardando screenshot da issue Plane.
Hipótese 1: abreviação de fator/faceta truncada.
Hipótese 2: typo "cam" → "como".
Hipótese 3: nome de variável vazada.
Investigar interpretacoes.ts e mandala renderer assim que tiver imagem.
```

### Task 7.4: Commit

```bash
git commit -am "feat(resultado): mostrar score bruto + tornar protocolos clicáveis

Issues Plane: #24, #27"
```

---

## Fase 8 — Editorial: revisar frases (#15, #16, #18, #19, #22, #25) — BLOQUEADO

Esses 6 issues precisam da Isa. Estratégia: branch separado com diff proposto + manda pra Isa aprovar via WhatsApp.

### Task 8.1: Branch editorial

```bash
git checkout -b editorial/revisao-frases-2026-05-10
```

### Task 8.2: Edits propostos em `constants/questoes.ts`

Baseado no feedback (path:linha referido):

**Estação 1 — id 25 (linha 45):**
```ts
// antes
{ id: 25, texto: 'Não me preparo adequadamente', invertida: true, faceta: 'C1' },
// proposto
{ id: 25, texto: 'Costumo começar tarefas sem me preparar direito', invertida: false, faceta: 'C1' },
```
> ⚠️ Mudou `invertida: false` — recalcular impacto. Ou manter invertida e reescrever ainda como negação.

**Estação 1 — palavras "faço/experimento/esqueço":** identificar quais ids da Estação 1 (`ESTACOES_ORDEM[0]`) estão com tempo verbal não-presente. Olhando a lista, candidatos:
- `id 5` "Como demais" → ?
- `id 85` "Frequentemente esqueço de colocar as coisas de volta" → já presente ("esqueço")
- `id 45` "Experimento uma ampla variedade de emoções" → já presente

**Pedido pra Isa:** anexar à issue #15 a lista exata de qual id virar qual texto. Sem isso, deixar TODO no plano.

**Estação 2 — id 30 (faltando palavra) e 6, 62, 70, 90, 114 (confusas):**
```ts
// id 30: "Tomo decisões precipitadas" — sugerir "Tomo decisões precipitadas/sem pensar" ou "Tomo atitudes precipitadas"
{ id: 30, texto: 'Tomo atitudes precipitadas', invertida: true, faceta: 'C6' },
```

**Estação 2 — id 2 e 22 duplicadas:**
```ts
// linha 14 (id 2 — N2 raiva) — manter
{ id: 2, texto: 'Fico irritado(a) facilmente', invertida: false, faceta: 'N2' },
// linha 40 (id 22 — A4 complacência, invertida=true) — REESCREVER
{ id: 22, texto: 'Tenho dificuldade em ser paciente com os outros', invertida: true, faceta: 'A4' },
```

**Estação 3 — id 15, 87, 119 (verbo presente):** já estão corretos no atual (`Experimento`, `Levo`, `Mantenho`). Talvez issue se refira a OUTRAS questões. **Confirmar com Isa.**

**Estação 4 — id 120 e 104 (verbo "considero" e "emociono"):**
```ts
// id 120: já é "Considero as consequências antes de agir" → OK
// id 104: "Me emociono com arte e música" → OK
// confirmar com Isa qual é o problema real
```

**Estação 4 — id 112 "repete da estação 3":**
- id 112: "Raramente fico irritado(a)" (Estação 4)
- Não há id na Estação 3 com texto idêntico. Cliente pode estar se confundindo com id 22 ("Fico irritado(a) facilmente") da Estação 2 ou similaridade semântica com id 82 ("Sou paciente com os outros") A4.
- Proposta: reescrever id 112: `'Tenho temperamento estável mesmo sob pressão'`.

### Task 8.3: Características secundárias (#22)

**Files:**
- Read: `utils/interpretacaoPrincipal.ts` (1039 linhas — função `gerarInterpretacaoPrincipal`)

**Step 1:** Achar bloco "Como complementar seu perfil" e expandir os textos. Atualmente parece ser uma frase única — cliente quer mais conteúdo. Sem direção da Isa, propor template:
```ts
comoComplementa: `Para fortalecer ${faceta.nome}, experimente: ${exercicios.join(', ')}.`
```

### Task 8.4: Commit + abrir PR de PROPOSTA

```bash
git add constants/questoes.ts utils/interpretacaoPrincipal.ts
git commit -m "proposal(editorial): revisão de frases das 4 estações + características secundárias

PROPOSTA — aguardando aprovação da Isa.
Issues Plane: #15, #16, #18, #19, #22, #25

Mudanças críticas:
- id 22 reescrito (era duplicata literal de id 2)
- id 30 adicionada palavra 'atitudes'
- id 112 reescrito (cliente reportou repetição)
- Característica secundária 'comoComplementa' expandida"
git push -u origin editorial/revisao-frases-2026-05-10
gh pr create --base main --title "PROPOSTA: revisão editorial de frases (issues #15-19, #22, #25)" \
             --body "Aguardando aprovação Isa. Não fazer merge sem ✅."
```

### Task 8.5: Mandar PR pra Isa

Mensagem pronta:
> Isa, juntei os ajustes nas frases (Estações 1-4 + características secundárias) num PR pra tu olhar item por item: [link]. Marca os que tu aprova, posso aplicar e mandar deploy hoje ainda.

---

## Fase 9 — Acessos quebrados (#1) e relatório completo (#21)

### Task 9.1: #1 — investigar senhas treinadora11/22

**Step 1:** Tentar login direto via Supabase admin:
```sql
SELECT id, email, encrypted_password IS NOT NULL AS tem_senha, last_sign_in_at
FROM auth.users WHERE email IN ('treinadora11@gmail.com', 'treinadora22@gmail.com');
```

**Step 2:** Se senha bagunçada, resetar:
```sql
-- via Supabase admin API ou SQL direto
UPDATE auth.users SET encrypted_password = crypt('treinadora11', gen_salt('bf'))
WHERE email = 'treinadora11@gmail.com';
```
**OU** via admin app: forçar reset pra esses emails.

**Step 3:** Testar login no app web (https://decifra1.netlify.app/).

**Step 4:** Comentar na issue #1 com resolução.

### Task 9.2: #21 — relatório completo da treinadora (BLOQUEADO)

Cliente perguntou: "tem esse modelo pra olhar?". Resposta = "sim, é o template `pdf-service/src/templates/treinadora.html`". Ação:
- Renderizar PDF do template treinadora pra um cliente real
- Mandar PDF pra Isa pra ela validar conteúdo
- Se conteúdo faltar, abrir nova issue específica

**Step 1:**
```bash
curl -X POST https://<pdf-service>/api/pdf/gerar \
  -H "Authorization: Bearer <jwt>" \
  -d '{"resultadoId": "<id>", "tipo": "treinadora"}' \
  -o /tmp/relatorio-treinadora.pdf
```

**Step 2:** Anexar na issue #21 + perguntar se está ok.

---

## Fase 10 — Fechamento

### Task 10.1: Atualizar Plane

Para cada issue concluída tecnicamente, mover pra **Done** via `mcp__plane__update_issue`. Lista esperada (após trabalho do dia):

- Done: #1, #9, #10, #11, #14, #17, #20, #24, #26, #27 + parcial #12, #13 (depende de deploy testado)
- Aguardando aprovação: #15, #16, #18, #19, #22, #25 (PR editorial)
- Bloqueadas: #21 (aguardando feedback da Isa após enviar PDF), #23 (aguardando screenshot)

### Task 10.2: Merge & deploy

```bash
git checkout main
git merge --no-ff chore/backlog-cleanup-2026-05-10
git push origin main
# Netlify auto-deploy do frontend.
# pdf-service: re-buildar imagem se mexeu (Fase 3).
# edge functions: já deployadas in-line (Fase 1.2 e 5.4).
```

### Task 10.3: Smoke test produção

- [ ] Login treinadora11 funciona
- [ ] Cadastrar cliente, gerar código, enviar email — UI usa "cliente" (não "aluna")
- [ ] Cliente faz teste, números aparecem como "X de 30"
- [ ] Resultado mostra score bruto + classificação correta (testar score 71 = Baixo)
- [ ] PDF tem nome do cliente
- [ ] PDF tem "auto-observação" com hífen
- [ ] Treinadora recebe email "teste finalizado"
- [ ] Botão WhatsApp respeita `mostrar_whatsapp`
- [ ] Estação 3 introdução tem "os outros"

---

## Resumo executivo

**Pode ser feito hoje (técnico):** 10 issues fechadas + 2 features deployadas (#12, #13) = 12.
**Bloqueado por aprovação editorial:** 6 issues (PR aberto, mensagem mandada).
**Bloqueado por dado externo:** 2 issues (#21 espera Isa olhar PDF, #23 espera screenshot).

**Total entregável hoje: 12/20 + 6 propostas + 2 investigações = 100% endereçado.**

**Risco maior:** Fase 4 (refator de classificação) — usuárias atuais que receberam resultado antigo verão classificação diferente se reabrirem. Não regredir significa avisar a Isa antes do deploy.

**Tempo estimado:**
- Fase 0–1: 30min
- Fase 2: 15min
- Fase 3: 45min
- Fase 4: 60min (testes + smoke)
- Fase 5: 90min (migration + UI + edge function)
- Fase 6: 30min
- Fase 7: 45min
- Fase 8: 60min (montar PR editorial)
- Fase 9: 30min
- Fase 10: 30min
- **Total:** ~6h focado.
