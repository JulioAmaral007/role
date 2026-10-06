import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';

import { createPersistOptions, createQueryClient } from '@/lib/queryClient';

// Estado de servidor com cache persistido em AsyncStorage (docs/ARCHITECTURE.md, seções 7.6 e 9.3):
// só as consultas que pedem (`meta: { persist: true }`) vão para o disco, e o app abre offline com
// o último catálogo. Enquanto o cache é restaurado as consultas esperam (`useIsRestoring`).
export function QueryProvider({ children }: { children: ReactNode }) {
  // um cliente por montagem do provider: nunca um singleton de módulo (testes e Fast Refresh)
  const [client] = useState(createQueryClient);
  const [persistOptions] = useState(createPersistOptions);
  return (
    <PersistQueryClientProvider client={client} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  );
}
