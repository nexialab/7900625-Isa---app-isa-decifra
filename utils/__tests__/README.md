# Tests

Run:

```bash
npx tsx --test utils/__tests__/*.test.mjs
```

## What's here

- **`calculadora.test.mjs`** — guarda `classificarFator` e `classificarFaceta` (issue Plane #26).
  Fonte da escala: curso da Isa Moreira (24-120 = Big Five fator, 4-20 = faceta IPIP-NEO-120).
  Caso crítico: score 71 deve ser `Baixo` (era classificado como `Alto` pelo algoritmo antigo
  baseado em percentil populacional).

## Why `node --test` and not jest/vitest?

Zero deps. O projeto não tem runner configurado. `node:test` é built-in (Node ≥ 20),
e usamos `tsx` (já no projeto) pra carregar `.ts` na hora.

Se algum dia adotarmos vitest/jest, esses testes migram em 5 min — a API
(`describe`/`test`/`assert.equal`) é compatível.

## Caveat: default import

Os arquivos sob `utils/` importam usando alias `@/constants/...`. O `tsx` (esbuild) não
resolve esse alias por padrão, e cai num bundling CJS — todos os exports nomeados acabam
dentro de `default`. Por isso o teste faz:

```js
import calculadora from '../calculadora.ts';
const { classificarFator, classificarFaceta } = calculadora;
```

Quando configurarmos `tsconfig-paths` no runner, dá pra voltar pro `import { ... } from`
direto.
