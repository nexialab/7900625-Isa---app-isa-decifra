# Plano de Adaptação Web — DECIFRA

> **Objetivo:** Fazer o DECIFRA funcionar perfeitamente no navegador (web) **sem alterar a experiência nativa mobile** (iOS/Android).  
> **Estratégia:** *Centered App Container* — em telas grandes, o app permanece num "cartão" central mobile-like, evitando elementos esticados e linhas de texto intermináveis. Em telas pequenas, continua 100 % width como hoje.

---

## 1. Diagnóstico — Por que está "quebrado" no navegador?

| Problema | Impacto visual no web |
|----------|----------------------|
| **Layouts 100 % width sem limite** (`flex: 1`) | Em monitores widescreen, botões, cards e textos se esticam demais. A tipografia mobile (32 px de título) fica perdida numa tela de 1920 px. |
| **Uso de `Dimensions.get('window')`** (`app/index.tsx`, `transicao.tsx`, `splash/index.tsx`) | No web, `Dimensions` retorna o tamanho da janela do navegador, não de um container. Isso pode gerar cálculos de layout incorretos quando centralizamos o app. |
| **`Alert` do React Native** | No `react-native-web`, `Alert.alert` pode não renderar ou ter comportamento inconsistente. Precisamos de um fallback para `window.alert` / modal customizado. |
| **Falta de `cursor: pointer`** em botões | No desktop, o mouse não muda de cursor ao passar sobre `TouchableOpacity`, dando sensação de que os botões não são clicáveis. |
| **ScrollViews aninhados sem `overflow` controlado** | O scroll do mouse/trackpad pode ficar preso em sub-ScrollViews em vez de rolar a página naturalmente. |
| **`SafeAreaView` sem padding lateral no web** | Em mobile, a safe area cuida das bordas. No web, o conteúdo fica colado nas laterais da janela se não houver padding ou um container. |

---

## 2. Estratégia de Design (UI/UX Pro Max)

### 2.1 Princípio: Preservar o Ritual
A experiência DECIFRA é *ritualística* — gradientes, respiros, transições suaves. No web, não vamos "esticar" essa experiência para preencher uma tela 4K. Vamos **emoldurá-la**, como se o navegador fosse a caixa e o app fosse o objeto precioso dentro.

### 2.2 O "Centered App Container"
Em telas maiores que **768 px**, o app será renderizado dentro de um container centralizado:

- **Largura máxima:** `640 px` (ideal para manter a legibilidade e a proporção mobile).
- **Altura:** `100 %` do viewport (`100vh`).
- **Background externo:** cor sólida `#2D1518` (vinho deep) ou o gradiente principal, criando um efeito de "spotlight" no app.
- **Sombra sutil:** no container, para elevar o app e reforçar a sensação de premium.
- **Bordas arredondadas:** `24 px` no topo (opcional, refinado).

> **Mobile continua igual:** em telas `< 768 px`, o container ocupa `100 %` width/height sem bordas nem sombras.

### 2.3 Breakpoints sugeridos
```ts
const BREAKPOINTS = {
  mobile: 0,      // 100 % width / height
  tablet: 768,    // maxWidth: 640px, shadow, centered
  desktop: 1200,  // maxWidth: 720px (opcional, se quisermos um pouco mais de ar em telas grandes)
};
```

---

## 3. Fases de Implementação

### Fase 1 — Infraestrutura Web (base para tudo)
**Arquivos:** `app/_layout.tsx`, `constants/web.ts`, `components/WebContainer.tsx`

1. **Criar `components/WebContainer.tsx`**
   - Usa `Platform.OS === 'web'` para detectar navegador.
   - Usa `useWindowDimensions` para calcular se a tela é grande o suficiente.
   - Renderiza um `<View style={styles.webWrapper}>` com `maxWidth`, `marginHorizontal: 'auto'`, `height: '100vh'` e `overflow: 'hidden'`.
   - Em mobile, retorna apenas os `children`.

2. **Ajustar `app/_layout.tsx`**
   - Envolver `<RootLayoutNav />` com `<WebContainer>`.
   - Garantir que `<View style={styles.container}>` do layout raiz tenha `height: '100%'` (ou `100vh` no web).

3. **Criar `constants/web.ts`**
   - Exportar `MAX_CONTENT_WIDTH = 640`.
   - Exportar `WEB_BACKGROUND = COLORS_ARTIO.vinhoDeep`.

4. **Criar/utilizar `app/+html.tsx` (opcional mas recomendado)**
   - Expo Router permite um `+html.tsx` para injetar meta-tags e CSS global.
   - Adicionar `<meta name="viewport" …>` correto.
   - Adicionar CSS global para `html, body, #root { height: 100%; margin: 0; overflow: hidden; }`.

### Fase 2 — Componentes Transversais
**Arquivos:** `components/RespostaButton.tsx`, `components/ui/Mandala.tsx`, `utils/alert.ts`

1. **`RespostaButton.tsx` — cursor pointer no web**
   ```ts
   ...(Platform.OS === 'web' && { cursor: 'pointer' }),
   ```

2. **`Mandala.tsx` — responsividade suave**
   - Aceitar `size` como número ou string (`'100%'`).
   - No web, quando estiver dentro do container de 640 px, o `size={320}` já fica bom. Não precisa de mudança drástica, apenas garantir que o container pai centralize a mandala.

3. **Alert Polyfill (`utils/alert.ts`)**
   ```ts
   import { Platform, Alert } from 'react-native';
   export function showAlert(title: string, message?: string) {
     if (Platform.OS === 'web') {
       window.alert(message ? `${title}\n${message}` : title);
     } else {
       Alert.alert(title, message);
     }
   }
   ```
   - Substituir **todos** os `Alert.alert` do fluxo do cliente por `showAlert`.
   - Prioridade: `app/cliente/teste.tsx`, `app/cliente/resultado.tsx`, `app/cliente/codigo.tsx`, `app/cliente/cadastro.tsx`.

4. **Haptics silenciosos**
   - `expo-haptics` já é no-op no web (não quebra), mas podemos criar um wrapper `utils/haptics.ts` para evitar warnings futuros.

### Fase 3 — Ajustes por Fluxo

#### 3.1 Fluxo Cliente (prioridade máxima)

| Tela | Problema | Ajuste |
|------|----------|--------|
| `app/index.tsx` | `Dimensions.get('window')` importado mas não usado nos estilos atuais; conteúdo fica esticado. | Remover `Dimensions` e `width` se não usado. Garantir que o `WebContainer` limite a largura. Adicionar `cursor: 'pointer'` no `TouchableOpacity` dos botões principais. |
| `app/cliente/codigo.tsx` | `KeyboardAvoidingView` com `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}`. No web, `KeyboardAvoidingView` pode causar comportamentos estranhos. | Em web, envolver apenas em `<View>` ou usar `behavior="padding"` condicional para web também. |
| `app/cliente/cadastro.tsx` | Mesmo problema de `KeyboardAvoidingView`. | Ajustar behavior condicional: `Platform.OS === 'web' ? undefined : (Platform.OS === 'ios' ? 'padding' : 'height')`. |
| `app/cliente/teste.tsx` | `Alert.alert` para questões pendentes; botões de escala (`RespostaButton`) ficam muito largos se a tela for grande. | Trocar `Alert.alert` por `showAlert`. O `WebContainer` já resolve a largura excessiva. Verificar se `gap: 6` e `flex: 1` ainda funcionam bem em 640 px (sim, 5 botões cabem confortavelmente). |
| `app/cliente/resultado.tsx` | `Alert.alert` em erros de carregamento; `Mandala size={320}` pode ficar pequeno no meio de um card grande. | Trocar `Alert.alert` por `showAlert`. Considerar aumentar `size` da mandala para `360` quando `width > 640`. |
| `app/cliente/transicao.tsx` | Usa `Dimensions.get('window')` para animações de posição. | Substituir por `useWindowDimensions` (hook reativo) e aplicar `%` em vez de pixels absolutos quando possível. |
| `app/cliente/processando.tsx` | Animação centralizada — provavelmente OK com `WebContainer`, mas verificar se usa `Dimensions`. | Verificar e ajustar se necessário. |

#### 3.2 Fluxo Treinadora
| Tela | Problema | Ajuste |
|------|----------|--------|
| `app/treinadora/login.tsx` | `KeyboardAvoidingView`. | Mesmo ajuste do cliente. |
| `app/treinadora/cadastro.tsx` | `KeyboardAvoidingView`. | Mesmo ajuste do cliente. |
| `app/treinadora/index.tsx` | Lista de clientes em `ScrollView`. | O `WebContainer` já limita a largura. Verificar se há tabelas ou cards que precisem de `maxWidth` interno. |
| `app/treinadora/cliente/[id].tsx` | Detalhes do cliente. | Verificar se há scroll aninhado. |

#### 3.3 Fluxo Admin
- O admin já parece ter uma arquitetura mais "dashboard". Ele **pode** se beneficiar de um layout **full-width** no web, diferente do cliente.
- **Decisão de produto:** manter o admin dentro do mesmo `WebContainer` (640 px) ou deixá-lo fluído?
  - **Recomendação:** Criar uma flag no `WebContainer`: se a rota atual começa com `/(admin)`, aplicar `maxWidth: 1200` (ou `100%`) em vez de 640 px. Dashboards precisam de espaço para tabelas e gráficos.
  - Isso pode ser feito via `useSegments()` do Expo Router dentro do `WebContainer`.

### Fase 4 — Polimento e Testes

1. **Cursor em todos os elementos interativos**
   - Criar um `TouchableOpacityWeb` wrapper ou adicionar `cursor: 'pointer'` em todos os `TouchableOpacity` do projeto via busca global.
   - Alternativa mais simples: adicionar CSS global no `+html.tsx`:
     ```css
     button, [role="button"], a { cursor: pointer; }
     ```

2. **Fontes no web**
   - Verificar se as fontes do Google (`Inter`) carregam corretamente no web. O `expo-font` com `@expo-google-fonts/inter` já funciona, mas às vezes há flash de texto não estilizado (FOUT). Não é crítico para o MVP web.

3. **Hover states (bônus UX)**
   - No web, botões podem ter um leve `opacity` ou `scale` no hover. Como usamos `TouchableOpacity`, o hover não é nativo. Podemos adicionar estilos CSS via `className` (se usar `react-native-web` com suporte a classes) ou simplesmente aceitar o estado padrão.
   - **Recomendação:** não investir em hover states complexos agora; o `cursor: pointer` já resolve 80 % da sensação de desktop.

4. **Testes de viewport**
   - Testar em: 375 × 667 (mobile), 768 × 1024 (tablet), 1920 × 1080 (desktop).
   - Verificar se o scroll é fluido em cada tamanho.

---

## 4. Estrutura de Arquivos (mudanças propostas)

```
app/
  _layout.tsx                 # envolve com WebContainer
  +html.tsx                   # CSS global e viewport meta (novo)
  ...
components/
  WebContainer.tsx            # lógica de container centralizado (novo)
utils/
  alert.ts                    # showAlert polyfill (novo)
  haptics.ts                  # impactLight wrapper (novo)
constants/
  web.ts                      # breakpoints e cores de fundo web (novo)
```

---

## 5. Exemplo de implementação do `WebContainer`

```tsx
// components/WebContainer.tsx
import React from 'react';
import { View, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { useSegments } from 'expo-router';
import { COLORS_ARTIO } from '@/constants/colors-artio';

const MOBILE_BREAKPOINT = 768;
const CLIENT_MAX_WIDTH = 640;
const ADMIN_MAX_WIDTH = 1200;

export function WebContainer({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const segments = useSegments();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const isAdmin = segments[0] === '(admin)';
  const isLargeScreen = width >= MOBILE_BREAKPOINT;
  const maxWidth = isAdmin ? ADMIN_MAX_WIDTH : CLIENT_MAX_WIDTH;

  return (
    <View style={styles.webRoot}>
      <View
        style={[
          styles.webContainer,
          isLargeScreen && { maxWidth, width: '100%' },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    backgroundColor: COLORS_ARTIO.vinhoDeep,
    alignItems: 'center',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 60px rgba(0,0,0,0.3)',
    }),
  },
});
```

> Nota: `boxShadow` só funciona no `react-native-web` quando passado como string no estilo. Testar se o `StyleSheet` aceita. Se não, aplicar via `+html.tsx` CSS targetting uma classe.

---

## 6. Checklist de Execução

- [ ] Criar `components/WebContainer.tsx`.
- [ ] Ajustar `app/_layout.tsx` para usar `WebContainer`.
- [ ] Criar `app/+html.tsx` com viewport e CSS base.
- [ ] Criar `utils/alert.ts` e substituir todos os `Alert.alert` do fluxo cliente/treinadora.
- [ ] Criar `utils/haptics.ts` (opcional, prevenção).
- [ ] Ajustar `KeyboardAvoidingView` em telas de formulário para web.
- [ ] Adicionar `cursor: pointer` em botões (CSS global ou estilo inline).
- [ ] Revisar `app/index.tsx` — remover `Dimensions` não utilizado.
- [ ] Revisar `app/cliente/transicao.tsx` — usar `useWindowDimensions`.
- [ ] Testar build web: `npm run build:web`.
- [ ] Testar navegação entre telas no Chrome/Firefox.
- [ ] Testar em mobile (garantir que não quebrou nada).

---

## 7. Considerações futuras (não prioritárias agora)

- **PWA:** transformar o build web em PWA instalável (ícone, splash screen, service worker).
- **Teclado navegável:** garantir que Tab/Shift+Tab naveguem entre botões de resposta do teste (acessibilidade web).
- **Impressão / PDF web:** a geração de PDF atual parece nativa (`expo-print`). No web, pode-se usar `window.print()` ou gerar PDF via biblioteca JS (ex: `jspdf`, `html2pdf`).
- **Deep linking:** verificar se os links diretos (`/cliente/resultado?id=...`) funcionam no deploy web.

---

*Plano gerado com base na análise da codebase DECIFRA e nos princípios da skill UI/UX Pro Max.*
