// As três variáveis públicas do app (docs/ARCHITECTURE.md, seção 12.2). Só `src/lib/env.ts` as lê.
// Ficam opcionais no tipo porque o Metro só preenche o que existe no .env; quem valida é o env.ts.
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_APP_ENV?: string;
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  }
}
