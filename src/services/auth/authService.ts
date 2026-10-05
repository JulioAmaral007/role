// Contrato da identidade do app (docs/ARCHITECTURE.md, seções 8.3 e 8.9). Quem usa recebe esta
// interface e nunca o client do Supabase, o que permite testar sem rede.
export interface AuthService {
  /**
   * Devolve o id do usuário da sessão atual e, se não houver sessão, cria uma anônima.
   * Lança `AppError` (`network`, `rateLimited`, `unauthorized` ou `unknown`).
   */
  ensureSession(): Promise<string>;
}
