import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Stamp } from '@/types/stamp';
import type { QueuedStamp } from '@/types/syncQueue';

import { parseQueuedStamps } from './parsers';

// A fila de carimbos que ainda não subiram (docs/ARCHITECTURE.md, seções 7.3 e 9.5). O carimbo entra
// aqui no instante em que é criado e aparece já no passaporte; o envio (idempotente) é do hook
// `useSyncQueue`, que une este store ao `services/stamps`: o store nunca chama a rede (seção 7.4).
// Perder um carimbo é o pior defeito possível, por isso nada sai da fila sem `acknowledge`.
interface SyncQueueState {
  queue: QueuedStamp[];
  /** Põe o carimbo na fila. Repetir o mesmo `id` é ignorado (a fila nunca duplica). */
  enqueue: (stamp: Stamp) => void;
  /** O servidor confirmou: o item sai da fila. */
  acknowledge: (stampId: string) => void;
  /** Falha passageira (rede, 5xx): o item fica e `attempts` sobe, para o backoff. */
  recordAttempt: (stampId: string) => void;
  /** O servidor recusou de vez (4xx): o item fica, marcado, e não é reenviado sozinho. */
  markFailed: (stampId: string, reason: string) => void;
}

interface PersistedSyncQueue {
  queue: QueuedStamp[];
}

export const SYNC_QUEUE_STORAGE_KEY = 'role.syncQueue';

/** Troca só o item de `stampId`, deixando os outros como estão. */
function updateItem(
  queue: QueuedStamp[],
  stampId: string,
  update: (item: QueuedStamp) => QueuedStamp,
): QueuedStamp[] {
  return queue.map((item) => (item.stamp.id === stampId ? update(item) : item));
}

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set) => ({
      queue: [],
      enqueue: (stamp) =>
        set((state) =>
          state.queue.some((item) => item.stamp.id === stamp.id)
            ? state
            : { queue: [...state.queue, { stamp, attempts: 0, failure: null }] },
        ),
      acknowledge: (stampId) =>
        set((state) => ({ queue: state.queue.filter((item) => item.stamp.id !== stampId) })),
      recordAttempt: (stampId) =>
        set((state) => ({
          queue: updateItem(state.queue, stampId, (item) => ({ ...item, attempts: item.attempts + 1 })),
        })),
      markFailed: (stampId, reason) =>
        set((state) => ({
          queue: updateItem(state.queue, stampId, (item) => ({ ...item, failure: reason })),
        })),
    }),
    {
      name: SYNC_QUEUE_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedSyncQueue => ({ queue: state.queue }),
      migrate: (persisted) => persisted as PersistedSyncQueue,
      // cada item é validado sozinho: um item estragado não leva a fila inteira junto
      merge: (persisted, current) => ({
        ...current,
        queue: parseQueuedStamps((persisted as { queue?: unknown } | null)?.queue),
      }),
    },
  ),
);
