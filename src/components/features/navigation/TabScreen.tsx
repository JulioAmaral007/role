import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useDockInset } from '@/hooks/useDockInset';
import { layout, space } from '@/theme/tokens';

export interface TabScreenProps {
  title: string;
  /** Texto de apoio abaixo do título (ex.: o "Em breve" da Turma). */
  message?: string;
  children?: ReactNode;
}

/**
 * Corpo das telas de aba: rolagem com o recuo de baixo do dock (`useDockInset`, seção 6.2), para o
 * fim do conteúdo nunca ficar atrás da barra, e o título da tela. As telas reais (Fases 8, 11 e 17)
 * trocam o miolo e mantêm este contêiner.
 */
export function TabScreen({ title, message, children }: TabScreenProps) {
  const dockInset = useDockInset();
  return (
    <ScrollView
      testID="tab-screen-scroll"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: dockInset }]}
    >
      <Text variant="display34" accessibilityRole="header">
        {title}
      </Text>
      {message != null && <Text variant="bodyLarge">{message}</Text>}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: space[16],
    paddingTop: layout.screenPaddingTop,
    paddingHorizontal: layout.screenPaddingX,
  },
});
