# Fix Codex Cleanup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polir as 18 mudanças que o Codex deixou unstaged em `main` — corrigir DRY/SRP/refator-pela-metade, blindar bombas-relógio, adicionar testes do refator crítico — e empacotar tudo (entrega + correções) em **UM ÚNICO COMMIT** revisável.

**Architecture:** Plano leitura-only-first: confirmar cada erro com excerto, fazer mudança mínima, validar, **só commitar no final**. Sem branch nova (combinado: tudo em um commit em `main`). Sem deploy. Sem migration em prod.

**Tech Stack:** TypeScript, Expo Router, React Native, Supabase JS v2, `node --test` (runner built-in, zero deps novas).

**Princípios não-negociáveis:**
- Não tocar em `constants/questoes.ts` (editorial — bloqueado por Isa).
- Não rodar `supabase db push` em prod sem janela combinada.
- Não rebuildar pdf-service nem deployar Edge Functions nesse commit.
- **Um commit no final**, com `git add -A` e mensagem temática.

**Mapeamento erro → task:**

| # | Erro do Codex | Task | Severidade |
|---|---|---|---|
| 1 | Trabalhou em `main` sem branch (irrelevante agora — vamos commitar mesmo) | — | — |
| 2 | DRY: 3 cópias de funções WhatsApp | Task 2 | Alta |
| 3 | DRY: SELECT espalhado em `useTreinadorasAdmin` | Task 3 | Média |
| 4 | Refator `aluna→cliente` pela metade (callsite quebrado) | Task 4 | Média |
| 5 | `constants/contato.ts` placeholder vazio = botão morto | Task 5 | **Alta (bomba)** |
| 6 | Fallback PDF sem investigar SELECT | Task 6 | Baixa (já resolvido) |
| 7 | Refator de `calculadora.ts` sem testes | Task 7 | **Alta** |
| 8 | Migration órfã (não aplicada em lugar nenhum) | Task 8 | Média (local only) |
| 9 | Função `classificar` deprecada não removida | Task 9 | Cosmético |
| 10 | TS noEmit falha — não auditou se introduziu erro novo | Task 10 | Verificação |

---

## Task 1: Verificar estado inicial

**Files:** nenhum (read-only).

**Step 1:** Conferir branch e working tree.
```bash
cd /home/renan/Renan/code/7900625-Isa---app-isa-decifra
git status --short
git branch --show-current
```
**Esperado:** branch `main`, 18 arquivos M + 3 untracked (`constants/contato.ts`, migration, doc do plano anterior).

**Step 2:** Snapshot de segurança (antes de tocar em qualquer coisa, pra poder reverter linha por linha se algo der errado).
```bash
git diff > /tmp/codex-changes-backup.diff
git diff --stat
```
Se algo quebrar no caminho, `git apply /tmp/codex-changes-backup.diff` restaura.

---

## Task 2: Extrair `utils/whatsapp.ts` (resolver DRY catastrófico)

Codex duplicou 3 funções idênticas em 3 arquivos. Extrair pra utility.

**Files:**
- Create: `utils/whatsapp.ts`
- Modify: `app/treinadora/cadastro.tsx:97-119` (remover funções locais, importar)
- Modify: `app/treinadora/index.tsx:76-95` (remover funções locais, importar)
- Verify: `app/(admin)/(dashboard)/treinadoras.tsx` (manter como está OU também migrar — escolher path A)

**Step 1: Criar `utils/whatsapp.ts`**

```typescript
/**
 * Utilities de formatação/validação de WhatsApp brasileiro.
 * Formato canônico armazenado: dígitos puros começando com 55 (ex: "5511999999999").
 * Formato de exibição: "+55 11 99999-9999".
 */

/**
 * Normaliza para formato canônico (dígitos, prefixo 55, max 13 chars).
 * Aceita entrada livre do usuário com máscara, espaços, parênteses.
 */
export function formatarWhatsApp(valor: string): string {
  let numeros = valor.replace(/\D/g, '');
  if (numeros.startsWith('55') && numeros.length > 2) {
    numeros = numeros.slice(0, 13);
  } else if (numeros.length > 0) {
    numeros = `55${numeros}`.slice(0, 13);
  }
  return numeros;
}

/**
 * Renderiza canônico em formato amigável "+55 11 99999-9999".
 */
export function formatarWhatsAppExibicao(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `+${numeros.slice(0, 2)} ${numeros.slice(2)}`;
  if (numeros.length <= 9) return `+${numeros.slice(0, 2)} ${numeros.slice(2, 4)} ${numeros.slice(4)}`;
  return `+${numeros.slice(0, 2)} ${numeros.slice(2, 4)} ${numeros.slice(4, 9)}-${numeros.slice(9, 13)}`;
}

/**
 * Valida formato canônico: começa com 55, total 12 ou 13 dígitos
 * (12 = fixo +55 11 9999-9999, 13 = celular +55 11 99999-9999).
 */
export function validarWhatsApp(valor: string): boolean {
  const numeros = valor.replace(/\D/g, '');
  return numeros.startsWith('55') && numeros.length >= 12 && numeros.length <= 13;
}
```

**Step 2: Atualizar `app/treinadora/cadastro.tsx`**

- **Remover** as 3 funções locais (linhas ~100-119 do arquivo atual — bloco entre `const formatarWhatsApp = ...` até o final de `validarWhatsApp`).
- **Adicionar import** no topo (junto com os outros):
```typescript
import { formatarWhatsApp, formatarWhatsAppExibicao, validarWhatsApp } from '@/utils/whatsapp';
```

**Step 3: Atualizar `app/treinadora/index.tsx`**

- Mesmo procedimento: remover bloco linhas ~76-95, importar do `utils/whatsapp`.

**Step 4: Decisão sobre `app/(admin)/(dashboard)/treinadoras.tsx`**

Esse arquivo já tinha `formatarWhatsApp` antes do Codex (commit anterior). Conferir:
```bash
grep -n "formatarWhatsApp\|validarWhatsApp" app/\(admin\)/\(dashboard\)/treinadoras.tsx
```
Se existir e for idêntico → migrar pra `utils/whatsapp` também (manter coerência total).
Se for diferente → **não mexer agora** (pode ter regra de admin diferente). Anotar como dívida.

**Step 5: Verificar tipos**

```bash
npx tsc --noEmit 2>&1 | grep -E "whatsapp|formatar|validar" | head -20
```
Esperado: zero erros novos relacionados às funções extraídas.

---

## Task 3: Extrair `TREINADORA_FIELDS` constant

Codex duplicou o select string em 2 lugares de `useTreinadorasAdmin.ts`.

**Files:**
- Modify: `hooks/useTreinadorasAdmin.ts:42-58`

**Step 1: Adicionar constante no topo do arquivo (logo após imports):**
```typescript
const TREINADORA_FIELDS = 'id, nome, email, whatsapp, mostrar_whatsapp, creditos, created_at, is_admin';
```

**Step 2: Substituir as 2 ocorrências do select:**

```typescript
// linha ~45 — query principal
let { data: treinadoras, error: treinadorasError } = await supabase
  .from('treinadoras')
  .select(TREINADORA_FIELDS)
  .eq('is_admin', false)
  .order('created_at', { ascending: false });

// linha ~55 — fallback
const fallbackResult = await supabase
  .from('treinadoras')
  .select(TREINADORA_FIELDS)
  .order('created_at', { ascending: false });
```

**Step 3: Verificar tipo**
```bash
npx tsc --noEmit 2>&1 | grep "useTreinadorasAdmin" | head
```

---

## Task 4: Limpar refator `nomeAluna → nomeCliente` (pela metade)

`hooks/useMeusCodigos.ts:13` ainda declara `nomeAluna?: string | null` no tipo `CodigoDisponivel`. O `map` (linhas 90-98) nem popula esse campo — sempre `undefined`. O callsite em `app/treinadora/codigos.tsx:357` faz `nomeClienteInicial={codigoSelecionado?.nomeAluna}` (passando undefined com nome errado).

**Files:**
- Modify: `hooks/useMeusCodigos.ts:13`
- Modify: `app/treinadora/codigos.tsx:357` (e qualquer outro callsite)

**Step 1: Renomear no tipo**

`hooks/useMeusCodigos.ts:13`:
```typescript
// antes
nomeAluna?: string | null;
// depois
nomeCliente?: string | null;
```

**Step 2: Achar TODOS os callsites do campo**
```bash
grep -rn "\.nomeAluna\|\?\.nomeAluna\|codigoSelecionado.*nomeAluna" --include="*.ts" --include="*.tsx" app/ components/ hooks/
```

**Step 3: Substituir cada ocorrência por `nomeCliente`.**
Esperado: `app/treinadora/codigos.tsx:357` e talvez `app/treinadora/index.tsx` (`ultimoCodigoNomeAluna` — se for state local com mesmo nome, **renomear pra `ultimoCodigoNomeCliente`** pra coerência).

**Step 4: NÃO mexer em `types/database.ts`** — campo `nome_aluna` é coluna real do Supabase. Renomear exige migration que está fora de escopo. Adicionar comentário explicativo no `useMeusCodigos.ts`:
```typescript
// Nota: campo `nome_aluna` na DB (legado). UI usa `nomeCliente`.
```

**Step 5: TS check**
```bash
npx tsc --noEmit 2>&1 | grep -E "nomeAluna|nomeCliente" | head
```

---

## Task 5: Proteger `constants/contato.ts` (BOMBA — placeholder vazio em prod)

Hoje: `whatsapp: ''` + `email: ''`. Se o app subir, botão "Comprar créditos" abre alert "Contato não configurado". **Pior que não ter botão.**

Decisão: esconder o botão quando contato não estiver configurado. Quando você tiver o contato real da Isa, basta preencher e o botão aparece sozinho.

**Files:**
- Modify: `constants/contato.ts` (adicionar helper `temContatoConfigurado`)
- Modify: `app/treinadora/index.tsx` (chamada de `gerarCodigo` que abre o alert)

**Step 1: Atualizar `constants/contato.ts`**

```typescript
export const CONTATO_CREDITOS = {
  // TODO(2026-05-10): substituir pelo contato oficial da Isa antes do deploy.
  // Enquanto vazio, o botão "Comprar créditos" não aparece pra evitar
  // mostrar alerta confuso pro usuário.
  whatsapp: '',
  email: '',
  mensagemInicial: 'Olá! Quero comprar créditos do Decifra.',
};

export function buildWhatsappUrl(numero: string, mensagem: string) {
  const digits = numero.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * True se há pelo menos um canal de contato (WhatsApp ou email) preenchido.
 * Use pra decidir se mostra o botão "Comprar créditos" no popup.
 */
export function temContatoConfigurado(): boolean {
  return Boolean(CONTATO_CREDITOS.whatsapp || CONTATO_CREDITOS.email);
}
```

**Step 2: Atualizar `app/treinadora/index.tsx` — bloco `gerarCodigo`**

Achar o trecho (linhas ~305-315 com a edição do Codex):
```typescript
showAlert(
  'Sem códigos disponíveis',
  'Você não tem códigos disponíveis. Entre em contato com o administrador para adquirir mais códigos.',
  [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Comprar créditos', onPress: abrirContatoCreditos },
  ]
);
```

Substituir por:
```typescript
const acoes = temContatoConfigurado()
  ? [
      { text: 'Cancelar', style: 'cancel' as const },
      { text: 'Comprar créditos', onPress: abrirContatoCreditos },
    ]
  : [{ text: 'OK' }];

showAlert(
  'Sem códigos disponíveis',
  'Você não tem códigos disponíveis. Entre em contato com o administrador para adquirir mais códigos.',
  acoes
);
```

**Step 3: Atualizar import**
```typescript
import { CONTATO_CREDITOS, buildWhatsappUrl, temContatoConfigurado } from '@/constants/contato';
```

---

## Task 6: Documentar investigação do PDF (#10) — não muda código

Codex aplicou fallback `nome ?? email ?? 'Cliente'` em `pdf-service/src/services/template-engine.ts:205`. Conferi: `pdf-service/src/services/supabase.ts:55` usa `select('*')` — então `nome` é puxado. Bug original (PDF mostrando "Cliente") era ou (a) coluna NULL no DB ou (b) template renderizando antes do fallback. Codex cobriu o template; cobertura suficiente.

**Files:** nenhum (read-only).

**Step 1: Confirmar SELECT do PDF**
```bash
grep -A3 "from('clientes')" pdf-service/src/services/supabase.ts | head -10
```
Esperado: `select('*')` em ambas ocorrências (linhas 54 e 197).

**Step 2: Adicionar comentário explicativo no template-engine pra próxima pessoa**

`pdf-service/src/services/template-engine.ts:205`:
```typescript
cliente: {
  // Fallback defensivo: alguns clientes legados foram criados com nome NULL.
  // Mostra email como fallback antes de cair no genérico.
  nome: cliente.nome ?? cliente.email ?? 'Cliente',
  email: cliente.email,
  dataAvaliacao: resultado.created_at
},
```

**Step 3: Anotar pra pesquisa futura** — adicionar TODO no arquivo:
```typescript
// TODO: investigar por que clientes em produção têm nome NULL.
// Hipótese: cadastro antigo não tornava nome obrigatório.
```

---

## Task 7: Adicionar testes pra `calculadora.ts` (refator crítico)

Sem testes, qualquer dev mexe e quebra silencioso. Usar `node --test` (built-in, zero deps).

**Files:**
- Create: `utils/__tests__/calculadora.test.mjs`

**Step 1: Conferir versão Node**
```bash
node --version
```
Esperado: ≥ 20 (suporte a `node --test` estável + import de `.ts` via loader).

**Step 2: Criar `utils/__tests__/calculadora.test.mjs`**

Como o projeto não tem build/runner TS configurado, o jeito mais simples é importar via `tsx`:
```bash
npx tsx --version
```
Se já existe (provavelmente sim, Codex usou pra validar) → ok.

Conteúdo do teste:

```javascript
// utils/__tests__/calculadora.test.mjs
// Run: npx tsx --test utils/__tests__/calculadora.test.mjs
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { classificarFator, classificarFaceta } from '../calculadora.ts';

describe('classificarFator (escala 24-120 — fonte: curso da Isa)', () => {
  const casos = [
    [24, 'Muito Baixo'],
    [47, 'Muito Baixo'],
    [48, 'Baixo'],
    [71, 'Baixo'],         // ← caso reportado pela cliente: era 'Alto', deve ser 'Baixo'
    [72, 'Médio'],
    [83, 'Médio'],
    [84, 'Alto'],          // ← limite inferior do 'Alto'
    [107, 'Alto'],
    [108, 'Muito Alto'],
    [120, 'Muito Alto'],
  ];

  for (const [score, esperado] of casos) {
    test(`score ${score} → ${esperado}`, () => {
      assert.equal(classificarFator(score), esperado);
    });
  }
});

describe('classificarFaceta (escala 4-20)', () => {
  const casos = [
    [4, 'Muito Baixo'],
    [8, 'Muito Baixo'],
    [9, 'Baixo'],
    [11, 'Baixo'],
    [12, 'Médio'],
    [13, 'Médio'],
    [14, 'Alto'],
    [17, 'Alto'],
    [18, 'Muito Alto'],
    [20, 'Muito Alto'],
  ];

  for (const [score, esperado] of casos) {
    test(`score ${score} → ${esperado}`, () => {
      assert.equal(classificarFaceta(score), esperado);
    });
  }
});
```

**Step 3: Rodar testes — esperado PASS**
```bash
npx tsx --test utils/__tests__/calculadora.test.mjs
```
**Esperado:** 20 testes passam.

**Step 4: Se tsx não suportar `--test` direto:** usar workaround com tsconfig:
```bash
node --import tsx --test utils/__tests__/calculadora.test.mjs
```
Ou rodar via script no package.json (sem adicionar dep):
```bash
node --experimental-strip-types --test utils/__tests__/calculadora.test.mjs
```
(Node 22+ tem strip-types built-in).

**Step 5: Documentar comando** — adicionar nota em `utils/__tests__/README.md` (criar):
```markdown
# Tests

Run: `npx tsx --test utils/__tests__/*.test.mjs`

Critical tests live here. They guard:
- `calculadora.ts` — classificação por score bruto (issue #26).
  Fonte da escala: curso da Isa Moreira (24-120 = Big Five).
```

---

## Task 8: Aplicar migration LOCAL (não em prod)

Migration `supabase/migrations/20260510_add_mostrar_whatsapp.sql` foi criada mas não foi aplicada em lugar nenhum. Se você der `npm start` agora apontando pro projeto remoto, a tela `treinadora/index.tsx` quebra na primeira leitura (`column "mostrar_whatsapp" does not exist`).

**Files:** nenhum (operação Supabase).

**Step 1: Detectar se há Supabase local rodando**
```bash
docker ps --format '{{.Names}}' | grep -i supabase
```

**Caminho A — Supabase local rodando:**
```bash
npx supabase db push
```
**Esperado:** "Migration 20260510_add_mostrar_whatsapp applied successfully."

**Caminho B — apontando pro projeto remoto (sem janela combinada com Isa):**
**NÃO RODAR.** Em vez disso:
- Anotar como pendência declarada no commit message: "migration `mostrar_whatsapp` aguarda janela combinada com a Isa antes de subir."
- Se for testar local hoje sem `supabase start`, aplicar a migration via SQL direto numa branch de teste OU mockar a coluna no tipo.

**Caminho C — vai testar via Netlify staging:**
- Subir migration na branch de preview do Supabase (se houver projeto de staging separado).

**Step 2:** Documentar caminho escolhido em comentário no topo da migration:
```sql
-- Status (2026-05-10): aplicada apenas em LOCAL/STAGING.
-- Produção: aguarda janela combinada com a Isa antes do deploy do app
-- (app já lê a coluna; subir o app antes da migration QUEBRA o login da treinadora).
```

---

## Task 9: Remover função `classificar` deprecada

Após Task 7 garantir que ninguém depende mais dela.

**Files:**
- Modify: `utils/calculadora.ts:92-99`

**Step 1: Conferir que ninguém usa**
```bash
grep -rn "classificar(" --include="*.ts" --include="*.tsx" --include="*.mjs" | grep -v "classificarFator\|classificarFaceta\|node_modules"
```
Esperado: zero ocorrências.

**Step 2: Remover o bloco**
```typescript
// REMOVER essas 9 linhas (funções `classificar` deprecada + JSDoc):
/**
 * @deprecated Use classificarFator ou classificarFaceta. Mantida apenas para
 * leituras futuras de lógica antiga baseada em percentil.
 */
function classificar(percentil: number): Classificacao {
  if (percentil <= 15) return 'Muito Baixo';
  if (percentil <= 35) return 'Baixo';
  if (percentil <= 65) return 'Médio';
  if (percentil <= 85) return 'Alto';
  return 'Muito Alto';
}
```

**Step 3: Manter `type Classificacao`** (é usado pelas duas funções novas).

**Step 4: Re-rodar testes**
```bash
npx tsx --test utils/__tests__/calculadora.test.mjs
```
Esperado: PASS (20/20).

---

## Task 10: Verificação final TypeScript + lint

**Files:** nenhum.

**Step 1: TS check em isolamento — só comparar antes/depois**

Antes de tocar em qualquer coisa nessa sessão, salvar baseline:
```bash
npx tsc --noEmit 2>&1 | wc -l > /tmp/tsc-baseline.txt
```
**Atenção:** isso já passou. O número correto é o que tava ANTES de começar essa sessão. Se não foi salvo, pular comparação e só checar se há erro **novo** introduzido por nós:

```bash
npx tsc --noEmit 2>&1 | grep -E "whatsapp|contato|calculadora|useMeusCodigos|useTreinadorasAdmin" | head
```
Esperado: zero erros nos arquivos que tocamos.

**Step 2: Lint dos arquivos que tocamos**
```bash
npx eslint utils/whatsapp.ts utils/calculadora.ts constants/contato.ts \
           hooks/useMeusCodigos.ts hooks/useTreinadorasAdmin.ts \
           app/treinadora/cadastro.tsx app/treinadora/index.tsx \
           app/treinadora/codigos.tsx 2>&1 | tail -20
```
Esperado: zero erros novos. (Erros pré-existentes em `compras.tsx` e `KeyboardAwareScrollViewCompat.tsx` continuam — não são nossos.)

**Step 3: Smoke visual (opcional, recomendado)**
```bash
npx expo start --web
```
Em um terminal separado. Conferir:
- `/treinadora/login` carrega
- `/treinadora` (após login) mostra card de WhatsApp
- `/cliente/codigo` aceita código
- Estação 1 começa com "1 de 30"

Se algum desses quebrar → **não commitar**. Voltar e corrigir.

---

## Task 11: Commit único final

**Step 1: Conferir o que vai entrar**
```bash
git status
git diff --stat
```
Esperado:
- 18 arquivos modificados (Codex) + ajustes nossos
- 5 untracked: `constants/contato.ts`, `supabase/migrations/20260510_add_mostrar_whatsapp.sql`, `utils/whatsapp.ts`, `utils/__tests__/calculadora.test.mjs`, `utils/__tests__/README.md`, `docs/plans/2026-05-10-fix-codex-cleanup.md`, `docs/plans/2026-05-10-decifra-backlog-cleanup.md`

**Step 2: Stage tudo**
```bash
git add -A
```

**Step 3: Verificar uma última vez**
```bash
git diff --cached --stat
```

**Step 4: Commit**
```bash
git commit -m "chore(backlog): zera 9 issues técnicas + dívida do batch Codex

Issues Plane fechadas:
- #9  numeração da questão (mostra '1 de 30' ao invés de id global)
- #10 nome do cliente no PDF (fallback nome→email→Cliente)
- #11 'aluna' → 'cliente' em UI/templates de email
- #12 WhatsApp opt-in da treinadora (migration + 3 forms + opt-out no resultado)
- #14 contato pra créditos (com guard pra não exibir botão se config vazia)
- #17 introdução Estação 3 ('com os outros')
- #20 PDF auto-observação com hífen
- #24 mostrar score bruto /120 no resultado
- #26 classificação por score bruto (não percentil) + testes guardando 71=Baixo
- #27 protocolos clicáveis a partir do resultado

Dívidas eliminadas no caminho:
- Extraído utils/whatsapp.ts (eliminou 3 cópias byte-a-byte das funções)
- Extraído TREINADORA_FIELDS em useTreinadorasAdmin (eliminou 2 selects duplicados)
- Renomeado nomeAluna→nomeCliente no tipo CodigoDisponivel (refator que estava pela metade)
- Removido função classificar() deprecada (substituída por classificarFator/classificarFaceta)
- Adicionado testes node:test pra calculadora (20 casos)

Pendências DECLARADAS pra deploy:
- Migration mostrar_whatsapp: aplicar em prod com janela combinada (app já lê a coluna)
- constants/contato.ts: WhatsApp/email da Isa precisam preencher (botão escondido enquanto vazio)
- Edge Functions enviar-codigo-email/decifra: deploy quando combinar com a Isa
- pdf-service: rebuild quando combinar (template fallback já no código)

Issues editoriais (#15, #16, #18, #19, #22, #25): pendentes aprovação Isa.
Issues investigativas (#1 acessos, #21 relatório, #23 'cam'): aguardam dado externo.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

**Step 5: Conferir histórico**
```bash
git log --oneline -3
git show --stat HEAD
```

**Step 6: NÃO push.** Combinado: commit local, decisão de push fica pra depois da conversa com a Isa.

---

## Verificação end-to-end (checklist humano antes de declarar "feito")

- [ ] `git status` limpo
- [ ] `git log -1` mostra o commit único com mensagem completa
- [ ] `npx tsx --test utils/__tests__/calculadora.test.mjs` → 20/20 passing
- [ ] `grep -rn "formatarWhatsApp" app/ components/` retorna apenas imports + 1 declaração em `utils/whatsapp.ts`
- [ ] `grep -rn "classificar(" utils/ app/` retorna apenas `classificarFator`/`classificarFaceta`
- [ ] `grep -rn "\.nomeAluna\b" app/ components/ hooks/` retorna zero (só `nome_aluna` no DB-related)
- [ ] `cat constants/contato.ts | grep "TODO"` mostra o TODO de preencher contato
- [ ] App levanta sem erro: `npx expo start --web` → tela inicial OK

---

## O que NÃO fazer

- ❌ NÃO mexer em `constants/questoes.ts` (editorial bloqueado por Isa)
- ❌ NÃO rodar `supabase db push` em prod
- ❌ NÃO rodar `npx supabase functions deploy ...`
- ❌ NÃO `git push` antes de conversar com a Isa
- ❌ NÃO rebuildar/redeployar pdf-service (Docker)
- ❌ NÃO criar branch nova (combinado: tudo em um commit em main)
- ❌ NÃO fazer commits intermediários (combinado: um único commit no final)
- ❌ NÃO instalar dependência nova (testes usam `node:test` + `tsx` que já está no projeto)

---

## Tempo estimado

- Task 1: 2 min
- Task 2: 15 min
- Task 3: 5 min
- Task 4: 10 min
- Task 5: 10 min
- Task 6: 5 min (read-only + 1 comentário)
- Task 7: 20 min
- Task 8: 5 min (caminho local) ou 0 (declarar pendência)
- Task 9: 5 min
- Task 10: 10 min
- Task 11: 5 min

**Total: ~90 min** (1h30 focado).

Risco de bloqueio: Task 7 se o `tsx --test` não rodar de primeira (Node antigo). Plano B documentado no Step 4 da Task 7.
