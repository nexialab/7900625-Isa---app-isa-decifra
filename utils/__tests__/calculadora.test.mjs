// Run: npx tsx --test utils/__tests__/calculadora.test.mjs
//
// Nota: importamos via default porque tsx (esbuild) não resolve o alias `@/constants/ipip`
// usado em calculadora.ts e cai num bundling CJS — todos os exports nomeados acabam
// dentro de `default`. Pra um runner com tsconfig-paths real, trocar pra
// `import { classificarFator, classificarFaceta } from '../calculadora.ts'` direto.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import calculadora from '../calculadora.ts';

const { classificarFator, classificarFaceta } = calculadora;

describe('classificarFator (escala 24-120 — fonte: curso da Isa)', () => {
  const casos = [
    [24, 'Muito Baixo'],
    [47, 'Muito Baixo'],
    [48, 'Baixo'],
    [71, 'Baixo'],          // ← caso reportado pela cliente: era 'Alto' (bug), tem que ser 'Baixo'
    [72, 'Médio'],
    [83, 'Médio'],
    [84, 'Alto'],           // ← limite inferior do 'Alto'
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
