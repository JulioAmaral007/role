import { useSyncExternalStore } from 'react';

import { useLastSuggestionStore } from '@/stores/lastSuggestionStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useSyncQueueStore } from '@/stores/syncQueueStore';
import { useTripStore } from '@/stores/tripStore';

// Os stores persistidos em AsyncStorage hidratam de forma assíncrona: no primeiro render eles ainda
// têm o valor inicial (docs/ARCHITECTURE.md, seção 7.5). Todo store persistido novo entra nesta lista.
const PERSISTED_STORES = [
  usePreferencesStore,
  useSyncQueueStore,
  useTripStore,
  useLastSuggestionStore,
];

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
