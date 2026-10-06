import { useQuery, useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { QueryProvider } from './QueryProvider';

describe('QueryProvider', () => {
  it('gives its children a query client', async () => {
    function Probe() {
      const client = useQueryClient();
      return <Text>{client.getDefaultOptions().queries?.retry === 1 ? 'client ok' : 'client wrong'}</Text>;
    }
    await render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );
    expect(screen.getByText('client ok')).toBeOnTheScreen();
  });

  it('runs a query through the provider', async () => {
    function Probe() {
      const { data } = useQuery({ queryKey: ['probe'], queryFn: async () => 'loaded' });
      return <Text>{data ?? 'loading'}</Text>;
    }
    await render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );
    expect(screen.getByText('loading')).toBeOnTheScreen();
    expect(await screen.findByText('loaded', {}, { timeout: 5000 })).toBeOnTheScreen();
  });

  it('keeps the same client while it re-renders, so the cache survives', async () => {
    const seen: unknown[] = [];
    function Probe({ tick }: { tick: number }) {
      seen.push(useQueryClient());
      return <Text>{`tick ${tick}`}</Text>;
    }
    const view = await render(
      <QueryProvider>
        <Probe tick={1} />
      </QueryProvider>,
    );
    await view.rerender(
      <QueryProvider>
        <Probe tick={2} />
      </QueryProvider>,
    );
    expect(new Set(seen).size).toBe(1);
  });
});
