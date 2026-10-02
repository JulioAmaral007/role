import { fireEvent, render, screen } from '@testing-library/react-native';

import { colors, height } from '@/theme/tokens';

import { SegmentedGrid } from './SegmentedGrid';

const TIME_OPTIONS = [
  { id: '1h', label: '1h' },
  { id: '2h', label: '2h' },
  { id: 'half_day', label: 'Meio dia' },
  { id: 'full_day', label: 'Dia todo' },
] as const;

describe('SegmentedGrid', () => {
  it('renders one button per option inside a named group', async () => {
    await render(
      <SegmentedGrid options={TIME_OPTIONS} value="2h" onChange={jest.fn()} accessibilityLabel="Tempo" />,
    );
    // o grupo não é `accessible` (senão o leitor de tela esconderia os botões filhos no iOS)
    expect(screen.getByLabelText('Tempo')).toHaveProp('accessibilityRole', 'radiogroup');
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('marks only the chosen option as selected', async () => {
    await render(<SegmentedGrid options={TIME_OPTIONS} value="2h" onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '2h', selected: true })).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { selected: true })).toHaveLength(1);
    expect(screen.getByRole('button', { name: '2h' })).toHaveStyle({ backgroundColor: colors.ink });
  });

  it('starts with nothing selected when there is no value yet', async () => {
    await render(<SegmentedGrid options={TIME_OPTIONS} value={undefined} onChange={jest.fn()} />);
    expect(screen.queryAllByRole('button', { selected: true })).toHaveLength(0);
  });

  it('reports the id of the pressed option', async () => {
    const onChange = jest.fn();
    await render(<SegmentedGrid options={TIME_OPTIONS} value="2h" onChange={onChange} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Meio dia' }));
    expect(onChange).toHaveBeenCalledWith('half_day');
  });

  it('keeps cells aligned when the last row is incomplete', async () => {
    const view = await render(
      <SegmentedGrid options={TIME_OPTIONS.slice(0, 3)} value="1h" onChange={jest.fn()} columns={2} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(3);
    // 2 linhas de 2 células: a última tem uma célula vazia para manter a largura
    const rows = (await view.toJSON()) as unknown as { children: unknown[] };
    expect(rows.children).toHaveLength(2);
  });

  it('makes every cell at least as tall as the segment height and shrinks long labels', async () => {
    await render(
      <SegmentedGrid options={[{ id: 'a', label: 'Um rótulo bem mais comprido' }]} value="a" onChange={jest.fn()} columns={1} />,
    );
    expect(screen.getByRole('button')).toHaveStyle({ height: height.segment });
    expect(screen.getByText('Um rótulo bem mais comprido').props.adjustsFontSizeToFit).toBe(true);
  });
});
