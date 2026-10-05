// Client único do Supabase (docs/ARCHITECTURE.md, seção 8.4). Importado SÓ por `services/` (e pelo
// que precisa iniciar o app, regra 2 da seção 4.2): telas e componentes nunca o tocam.
//
// Conferido na doc atual (guia do Expo e referência do supabase-js):
// - `react-native-url-polyfill` NÃO é necessário: o Expo já instala o `URL` global.
// - A sessão fica no AsyncStorage (decisão do ADR: a sessão é anônima, sem dado pessoal). Troca
//   pelo `LargeSecureStore` na Fase 15, quando a sessão passar a ter e-mail.
// - No celular o refresh de token roda continuamente em segundo plano, então ele é amarrado ao
//   primeiro plano pelo `AppState`, com UM listener só.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from './env';

export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // não há URL de OAuth no MVP
  },
});

// Guardado em `globalThis` para o Fast Refresh (que reavalia o módulo) não empilhar listeners.
const LISTENER_KEY = '__roleSupabaseAppStateListener';
const globals = globalThis as unknown as Record<string, { remove(): void } | undefined>;

globals[LISTENER_KEY]?.remove();
globals[LISTENER_KEY] = AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
