import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';

interface PersistedStore<State> {
  setState: (state: State, replace: true) => void;
  getInitialState: () => State;
  persist: { rehydrate: () => Promise<void> | void };
}

/**
 * Simula fechar o app e abri-lo de novo: a memória volta ao estado inicial e o store hidrata do que
 * a sessão anterior deixou no disco.
 *
 * Não basta zerar o estado e chamar `rehydrate()`: o `persist` regrava o disco a cada `setState`, e
 * isso apagaria justamente o que se quer ler. Por isso o que estava salvo é guardado antes e
 * devolvido ao disco depois de a gravação do estado vazio terminar.
 */
export async function restartApp<State>(
  store: PersistedStore<State>,
  storageKey: string,
): Promise<void> {
  const saved = await AsyncStorage.getItem(storageKey);
  store.setState(store.getInitialState(), true);
  // espera o `persist` gravar o estado vazio por cima, para a nossa devolução ser a última escrita
  await waitFor(async () => expect(await AsyncStorage.getItem(storageKey)).not.toBe(saved));
  if (saved !== null) await AsyncStorage.setItem(storageKey, saved);
  await store.persist.rehydrate();
}
