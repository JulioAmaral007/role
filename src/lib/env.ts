// Único lugar do app que lê variáveis de ambiente (docs/ARCHITECTURE.md, seção 12.2).
// Todo o resto importa `env` daqui e nunca usa `process.env` direto.
//
// O Metro só substitui `process.env.EXPO_PUBLIC_*` quando o acesso é estático e literal, então
// cada variável é lida por extenso abaixo (nada de `process.env[nome]` nem de desestruturar).
// Faltou ou está inválida? Lança `EnvError` já na importação: erro claro e imediato em vez de um
// app meio quebrado. A validação em si fica em `envSchema.ts`.
import { parseEnv, type Env } from './envSchema';

export type { AppEnv, Env } from './envSchema';

export const env: Env = parseEnv({
  appEnv: process.env.EXPO_PUBLIC_APP_ENV,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
