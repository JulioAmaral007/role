// Geometria do dock flutuante (docs/ARCHITECTURE.md, seção 6, e a tarefa do `FloatingTabBar` no
// plano). Funções puras: recebem as medidas por parâmetro e devolvem posições em pontos, na
// coordenada da área interna do dock (já descontado o padding da pílula).
//
// O truque que mantém a animação em `transform`/`opacity`: a largura do item ativo é CONSTANTE,
// `activeWidth`, qualquer que seja a aba ativa. Só as posições mudam.

export interface DockGeometry {
  /** Largura medida do dock inteiro (com o padding da pílula). */
  containerWidth: number;
  /** Padding interno da pílula. */
  padding: number;
  /** Espaço entre os itens. */
  gap: number;
  /** Largura de um item inativo (só ícone). */
  inactiveWidth: number;
  iconSize: number;
  /** Espaço entre o ícone e o label do item ativo. */
  labelGap: number;
  /** Folga mínima entre o conteúdo do item ativo e a borda dele. */
  contentPadding: number;
  itemCount: number;
  /** Largura medida de cada label (na ordem dos itens). */
  labelWidths: readonly number[];
}

/** Largura útil do dock, sem o padding da pílula. */
export function innerWidth(geometry: DockGeometry): number {
  return geometry.containerWidth - geometry.padding * 2;
}

/** `largura útil − (n−1) × inativo − (n−1) × gap`: 202 num aparelho de 390 com 3 itens. */
export function activeWidth(geometry: DockGeometry): number {
  const others = geometry.itemCount - 1;
  return innerWidth(geometry) - others * geometry.inactiveWidth - others * geometry.gap;
}

/** Deslocamento da pílula amarela por posição do item ativo. */
export function pillStep(geometry: DockGeometry): number {
  return geometry.inactiveWidth + geometry.gap;
}

/** Início do item `index` quando o item `activeIndex` é o ativo. */
export function slotStart(geometry: DockGeometry, index: number, activeIndex: number): number {
  const step = pillStep(geometry);
  if (index <= activeIndex) return index * step;
  return (index - 1) * step + activeWidth(geometry) + geometry.gap;
}

/** Largura que o label do item ativo pode ocupar sem passar da borda (o resto vira reticências). */
export function maxLabelWidth(geometry: DockGeometry): number {
  const available =
    activeWidth(geometry) - geometry.contentPadding * 2 - geometry.iconSize - geometry.labelGap;
  return Math.max(0, available);
}

/** Largura do label já limitada ao espaço disponível. */
export function labelWidthOf(geometry: DockGeometry, index: number): number {
  return Math.min(geometry.labelWidths[index] ?? 0, maxLabelWidth(geometry));
}

/** Posição esquerda do ícone do item `index` com o item `activeIndex` ativo. */
export function iconLeft(geometry: DockGeometry, index: number, activeIndex: number): number {
  const start = slotStart(geometry, index, activeIndex);
  if (index !== activeIndex) return start + (geometry.inactiveWidth - geometry.iconSize) / 2;
  // ativo: ícone + label centralizados juntos no item
  const group = geometry.iconSize + geometry.labelGap + labelWidthOf(geometry, index);
  return start + (activeWidth(geometry) - group) / 2;
}

/** Posição esquerda do label do item `index`, que só aparece quando ele é o ativo. */
export function labelLeft(geometry: DockGeometry, index: number): number {
  return iconLeft(geometry, index, index) + geometry.iconSize + geometry.labelGap;
}

/** Posição do ícone do item `index` para cada possível item ativo (0 a n−1), para `interpolate`. */
export function iconLeftsByActive(geometry: DockGeometry, index: number): number[] {
  return Array.from({ length: geometry.itemCount }, (_, active) => iconLeft(geometry, index, active));
}
