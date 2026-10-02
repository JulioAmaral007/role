import { useSyncExternalStore } from 'react';

import { usePreferencesStore } from '@/stores/preferencesStore';

// Os stores persistidos em AsyncStorage hidratam de forma assíncrona: no primeiro render eles ainda
// têm o valor inicial (docs/ARCHITECTURE.md, seção 7.5). Todo store persistido novo entra nesta lista
// (`syncQueueStore`, `tripStore`, `lastSuggestionStore`...).
const PERSISTED_STORES = [usePreferencesStore];

function subscribe(onChange: () => void) {
  const unsubscribers = PERSISTED_STORES.map((store) => store.persist.onFinishHydration(onChange));
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

function getSnapshot() {
  return PERSISTED_STORES.every((store) => store.persist.hasHydrated());
}

/** `true` quando **todos** os stores persistidos terminaram de hidratar. Nada decide nada antes disso. */
export function useStoresHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
