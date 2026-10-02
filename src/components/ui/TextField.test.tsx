import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { colors } from '@/theme/tokens';

import { TextField } from './TextField';

describe('TextField', () => {
  it('is named by its accessibility label, not by the placeholder', async () => {
    await render(<TextField accessibilityLabel="Cidade ou bairro" placeholder="Ex.: o nome do seu bairro" />);
    expect(screen.getByLabelText('Cidade ou bairro')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Ex.: o nome do seu bairro')).toBeOnTheScreen();
  });

  it('reports what the user types', async () => {
    const onChangeText = jest.fn();
    await render(<TextField accessibilityLabel="Bairro" value="" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText('Bairro'), 'Laranjeiras');
    expect(onChangeText).toHaveBeenCalledWith('Laranjeiras');
  });

  it('shows the value it is given', async () => {
    await render(<TextField accessibilityLabel="Bairro" value="Santa Teresa" onChangeText={jest.fn()} />);
    expect(screen.getByDisplayValue('Santa Teresa')).toBeOnTheScreen();
  });

  it('draws the white field with a 2px ink border, 52 tall, like the prototype', async () => {
    const view = await render(<TextField accessibilityLabel="Bairro" />);
    const json = JSON.stringify(await view.toJSON());
    expect(json).toContain(`"backgroundColor":"${colors.white}"`);
    expect(json).toContain('"borderWidth":2');
    expect(json).toContain(`"borderColor":"${colors.ink}"`);
    expect(json).toContain('"height":52');
    expect(json).toContain('"borderRadius":14');
  });

  it('shows the leading and trailing elements around the input', async () => {
    await render(
      <TextField accessibilityLabel="Senha" leading={<Text>lupa</Text>} trailing={<Text>Mostrar</Text>} />,
    );
    expect(screen.getByText('lupa')).toBeOnTheScreen();
    expect(screen.getByText('Mostrar')).toBeOnTheScreen();
  });

  it('becomes a 72-tall text area when multiline', async () => {
    const view = await render(<TextField accessibilityLabel="Lembrança" multiline />);
    expect(screen.getByLabelText('Lembrança')).toHaveProp('multiline', true);
    expect(JSON.stringify(await view.toJSON())).toContain('"height":72');
  });

  it('passes the input behaviour through', async () => {
    await render(
      <TextField accessibilityLabel="Senha" secureTextEntry maxLength={20} autoCapitalize="none" returnKeyType="done" />,
    );
    const input = screen.getByLabelText('Senha');
    expect(input).toHaveProp('secureTextEntry', true);
    expect(input).toHaveProp('maxLength', 20);
    expect(input).toHaveProp('autoCapitalize', 'none');
    expect(input).toHaveProp('returnKeyType', 'done');
  });

  it('can be read-only', async () => {
    await render(<TextField accessibilityLabel="Bairro" value="x" editable={false} />);
    expect(screen.getByLabelText('Bairro')).toHaveProp('editable', false);
  });
});
