import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { borderWidth, colors, radius, space } from '@/theme/tokens';
import { typography } from '@/theme/typography';

// `lineHeight` fora: num campo de uma linha ele desalinha o texto e o cursor no Android.
const { lineHeight: _singleLineHeight, ...singleLineText } = typography.bodyLarge;

const FIELD_HEIGHT = 52;
const MULTILINE_HEIGHT = 72;

export interface TextFieldProps
  extends Pick<
    TextInputProps,
    | 'value'
    | 'onChangeText'
    | 'placeholder'
    | 'maxLength'
    | 'autoCapitalize'
    | 'autoCorrect'
    | 'autoComplete'
    | 'keyboardType'
    | 'returnKeyType'
    | 'onSubmitEditing'
    | 'secureTextEntry'
    | 'editable'
  > {
  /** O nome do campo para leitor de tela: o texto de exemplo (placeholder) não conta como nome. */
  accessibilityLabel: string;
  /** Ícone ou outro elemento antes do texto (ex.: a lupa da busca). */
  leading?: ReactNode;
  /** Elemento depois do texto (ex.: "Mostrar" na senha). */
  trailing?: ReactNode;
  /** Área de várias linhas (a lembrança do "Como foi"). */
  multiline?: boolean;
}

/** Campo de texto branco com contorno ink, como nos formulários do protótipo. */
export function TextField({
  accessibilityLabel,
  leading,
  trailing,
  multiline = false,
  ...inputProps
}: TextFieldProps) {
  return (
    <View style={[styles.field, multiline ? styles.multiline : styles.singleLine]}>
      {leading}
      <TextInput
        {...inputProps}
        accessibilityLabel={accessibilityLabel}
        multiline={multiline}
        placeholderTextColor={colors.grayLight}
        selectionColor={colors.ink}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[multiline ? styles.multilineInput : styles.singleLineInput, styles.input]}
      />
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: borderWidth.regular,
    borderColor: colors.ink,
    borderRadius: radius[14],
    borderCurve: 'continuous',
    backgroundColor: colors.white,
  },
  singleLine: {
    height: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[10],
    paddingHorizontal: space[14],
  },
  multiline: {
    height: MULTILINE_HEIGHT,
    paddingVertical: space[12],
    paddingHorizontal: space[14],
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    color: colors.ink,
  },
  singleLineInput: singleLineText,
  multilineInput: typography.body,
});
