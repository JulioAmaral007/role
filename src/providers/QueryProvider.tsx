import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

// Cliente de estado de servidor (docs/ARCHITECTURE.md, seção 7.6). Por enquanto simples; o cache
// persistido em AsyncStorage (só `places` e `stamps`) e o `onlineManager` entram na Fase 5.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // o catálogo muda pouco: não refaz o pedido a cada tela que o lê
        staleTime: 60_000,
        retry: 1,
        // no celular não existe "foco de janela"; o app volta ao primeiro plano com o AppState
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // um cliente por montagem do provider: nunca um singleton de módulo (testes e Fast Refresh)
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
