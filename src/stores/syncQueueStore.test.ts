import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';

import { makeStamp } from '@/test/factories';
import { restartApp } from '@/test/persistence';

import { SYNC_QUEUE_STORAGE_KEY, useSyncQueueStore } from './syncQueueStore';

const readSaved = async () => JSON.parse((await AsyncStorage.getItem(SYNC_QUEUE_STORAGE_KEY)) ?? 'null');
const ids = () => useSyncQueueStore.getState().queue.map(({ stamp }) => stamp.id);

describe('syncQueueStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSyncQueueStore.setState(useSyncQueueStore.getInitialState(), true);
  });

  it('starts empty', () => {
    expect(useSyncQueueStore.getState().queue).toEqual([]);
  });

  describe('enqueue', () => {
    it('puts the stamp at the end of the queue, with no failed attempts', () => {
      const first = makeStamp({ id: 'a' });
      const second = makeStamp({ id: 'b' });
      useSyncQueueStore.getState().enqueue(first);
      useSyncQueueStore.getState().enqueue(second);

      expect(useSyncQueueStore.getState().queue).toEqual([
        { stamp: first, attempts: 0, failure: null },
        { stamp: second, attempts: 0, failure: null },
      ]);
    });

    it('never duplicates a stamp, even when it is enqueued twice', () => {
      const stamp = makeStamp({ id: 'a' });
      useSyncQueueStore.getState().enqueue(stamp);
      useSyncQueueStore.getState().recordAttempt('a');
      useSyncQueueStore.getState().enqueue({ ...stamp, memory: 'changed' });

      const { queue } = useSyncQueueStore.getState();
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({ attempts: 1, stamp: { memory: stamp.memory } });
    });
  });

  describe('acknowledge', () => {
    it('removes only the stamp the server confirmed', () => {
      for (const id of ['a', 'b', 'c']) useSyncQueueStore.getState().enqueue(makeStamp({ id }));
      useSyncQueueStore.getState().acknowledge('b');
      expect(ids()).toEqual(['a', 'c']);
    });

    it('ignores an id that is not in the queue', () => {
      useSyncQueueStore.getState().enqueue(makeStamp({ id: 'a' }));
      useSyncQueueStore.getState().acknowledge('nope');
      expect(ids()).toEqual(['a']);
    });
  });

  describe('recordAttempt', () => {
    it('keeps the stamp and counts the failed attempt', () => {
      useSyncQueueStore.getState().enqueue(makeStamp({ id: 'a' }));
      useSyncQueueStore.getState().enqueue(makeStamp({ id: 'b' }));
      useSyncQueueStore.getState().recordAttempt('a');
      useSyncQueueStore.getState().recordAttempt('a');

      const { queue } = useSyncQueueStore.getState();
      expect(queue.map(({ attempts }) => attempts)).toEqual([2, 0]);
      expect(queue.every(({ failure }) => failure === null)).toBe(true);
    });
  });

  describe('markFailed', () => {
    it('keeps the stamp, marked with the reason, so it never disappears from the passport', () => {
      useSyncQueueStore.getState().enqueue(makeStamp({ id: 'a' }));
      useSyncQueueStore.getState().enqueue(makeStamp({ id: 'b' }));
      useSyncQueueStore.getState().markFailed('a', 'foreign key violation');

      const { queue } = useSyncQueueStore.getState();
      expect(queue[0]).toMatchObject({ failure: 'foreign key violation' });
      expect(queue[1]).toMatchObject({ failure: null });
      expect(ids()).toEqual(['a', 'b']);
    });
  });

  describe('persistence', () => {
    it('saves the queue with the store version, and only data', async () => {
      const stamp = makeStamp({ id: 'a' });
      useSyncQueueStore.getState().enqueue(stamp);
      await waitFor(async () => {
        expect(await readSaved()).toEqual({
          state: { queue: [{ stamp, attempts: 0, failure: null }] },
          version: 1,
        });
      });
    });

    it('brings the queue back after the app is closed in airplane mode and opened again', async () => {
      const stamp = makeStamp({ id: 'a', feedback: { rating: 'spot_on', tags: ['calm'] } });
      useSyncQueueStore.getState().enqueue(stamp);
      useSyncQueueStore.getState().recordAttempt('a');
      await waitFor(async () => expect((await readSaved())?.state.queue[0].attempts).toBe(1));

      await restartApp(useSyncQueueStore, SYNC_QUEUE_STORAGE_KEY);

      expect(useSyncQueueStore.getState().queue).toEqual([{ stamp, attempts: 1, failure: null }]);
    });

    it('does not bring back a stamp that was already confirmed', async () => {
      useSyncQueueStore.getState().enqueue(makeStamp({ id: 'a' }));
      useSyncQueueStore.getState().acknowledge('a');
      await waitFor(async () => expect((await readSaved())?.state.queue).toEqual([]));

      await useSyncQueueStore.persist.rehydrate();
      expect(useSyncQueueStore.getState().queue).toEqual([]);
    });

    it('keeps the good stamps when one saved item is corrupted', async () => {
      const good = makeStamp({ id: 'good' });
      await AsyncStorage.setItem(
        SYNC_QUEUE_STORAGE_KEY,
        JSON.stringify({
          state: {
            queue: [
              { stamp: good, attempts: 3, failure: null },
              { stamp: { id: '', placeId: 'x' }, attempts: 1, failure: null },
              'garbage',
            ],
          },
          version: 1,
        }),
      );
      await useSyncQueueStore.persist.rehydrate();

      expect(useSyncQueueStore.getState().queue).toEqual([{ stamp: good, attempts: 3, failure: null }]);
    });

    it.each([['a queue that is not a list', { queue: 'x' }], ['no queue field', {}]])(
      'starts with an empty queue for %s',
      async (_name, state) => {
        await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify({ state, version: 1 }));
        await useSyncQueueStore.persist.rehydrate();
        expect(useSyncQueueStore.getState().queue).toEqual([]);
      },
    );
  });
});
