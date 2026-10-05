import { createUserClient, insertStamp, POSTGRES_PERMISSION_DENIED } from './helpers';

// Um usuário nunca lê nem escreve dados de outro (RLS do 002).

describe('isolation between user A and user B', () => {
  const { client: a, userId: aId } = createUserClient('A');
  const { client: b, userId: bId } = createUserClient('B');

  it('shows each user only their own profile', async () => {
    const forA = await a.from('profiles').select('id');
    expect(forA.data?.map((row) => row.id)).toEqual([aId]);
    const forB = await b.from('profiles').select('id');
    expect(forB.data?.map((row) => row.id)).toEqual([bId]);
  });

  it('does not let B read or touch the profile of A', async () => {
    const read = await b.from('profiles').select('id').eq('id', aId);
    expect(read.data).toHaveLength(0);

    const update = await b.from('profiles').update({ locale: 'es' }).eq('id', aId).select('id');
    expect(update.error).toBeNull();
    expect(update.data).toHaveLength(0);

    const mine = await a.from('profiles').select('locale').eq('id', aId).single();
    expect(mine.data?.locale).not.toBe('es');
  });

  it('hides the stamps of A from B', async () => {
    const { id, error } = await insertStamp(a);
    expect(error).toBeNull();

    const own = await a.from('stamps').select('id').eq('id', id);
    expect(own.data).toHaveLength(1);
    const other = await b.from('stamps').select('id').eq('id', id);
    expect(other.data).toHaveLength(0);
  });

  it('does not let B create a stamp owned by A', async () => {
    const { error } = await insertStamp(b, { user_id: aId });
    expect(error?.code).toBe(POSTGRES_PERMISSION_DENIED);
  });

  it('does not let B delete or edit the stamps of A', async () => {
    const { id } = await insertStamp(a);
    const edit = await b.from('stamps').update({ memory: 'hacked' }).eq('id', id);
    expect(edit.error?.code).toBe(POSTGRES_PERMISSION_DENIED); // sem grant de update em stamps
    const remove = await b.from('stamps').delete().eq('id', id);
    expect(remove.error?.code).toBe(POSTGRES_PERMISSION_DENIED); // nem de delete

    const still = await a.from('stamps').select('id').eq('id', id);
    expect(still.data).toHaveLength(1);
  });

  it('does not let B attach feedback to a stamp of A', async () => {
    const { id: stampId } = await insertStamp(a);
    const { error } = await b.from('place_feedback').insert({ stamp_id: stampId, rating: 'ok' });
    expect(error?.code).toBe(POSTGRES_PERMISSION_DENIED);
  });

  it('does not let B read the feedback of A', async () => {
    const { id: stampId } = await insertStamp(a);
    const created = await a.from('place_feedback').insert({ stamp_id: stampId, rating: 'spot_on' });
    expect(created.error).toBeNull();

    const forB = await b.from('place_feedback').select('id').eq('stamp_id', stampId);
    expect(forB.data).toHaveLength(0);
  });
});
