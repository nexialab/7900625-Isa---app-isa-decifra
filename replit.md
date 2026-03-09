# DECIFRA - IPIP-NEO-120 Assessment App

## Overview
Mobile app (React Native/Expo) for Big Five personality assessment (IPIP-NEO-120).
Two user types: Treinadoras (coaches with auth) and Clientes (test takers with access codes).

## Architecture
- **Frontend**: React Native + Expo SDK 54 + Expo Router (file-based routing)
- **Backend**: Express.js server on port 5000 (landing page + API proxy)
- **Database**: Supabase (PostgreSQL + Auth + RLS) - external service
- **State**: React Query + AsyncStorage for local persistence

## Key Files
- `lib/supabase/client.ts` - Supabase client configuration
- `lib/supabase/useAuth.ts` - Authentication hook
- `constants/ipip.ts` - Big Five factors, facets, mappings
- `constants/questoes.ts` - 120 IPIP-NEO questions in Portuguese
- `utils/calculadora.ts` - Score calculation algorithm (30 facets + 5 factors + percentiles)
- `utils/recomendacao.ts` - Protocol recommendation system
- `components/ui/Mandala.tsx` - Radar chart visualization (SVG)
- `supabase-schema.sql` - Complete database schema (7 tables + RLS)

## App Routes (Expo Router)
```
app/
  index.tsx                    - Home (choose: Coach or Client)
  _layout.tsx                  - Root layout with providers
  (tabs)/                      - Default tab layout (template)
  treinadora/
    login.tsx                  - Coach login
    cadastro.tsx               - Coach registration
    index.tsx                  - Coach dashboard (credits, codes, clients)
  cliente/
    codigo.tsx                 - Enter access code (ART-XXXX)
    cadastro.tsx               - Quick registration
    instrucoes.tsx             - Test instructions
    teste.tsx                  - 4 stations x 30 questions (120 total)
    processando.tsx            - Processing results
    resultado.tsx              - Results with mandala + protocols
```

## Database (Supabase)
7 tables: treinadoras, codigos, clientes, respostas, resultados, protocolos, protocolos_recomendados
Schema in `supabase-schema.sql` - must be executed in Supabase SQL Editor

## Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key

## Workflows
- `Start Backend` - Express server (port 5000)
- `Start Frontend` - Expo dev server (port 8081)

## Dependencies Added
- @supabase/supabase-js - Supabase client
- react-native-url-polyfill - URL polyfill for Supabase
- expo-secure-store - Secure storage
- react-native-svg - SVG for mandala chart
- victory-native - Charts library
