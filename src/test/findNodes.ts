// Auxiliar de testes: acha nós de uma árvore renderizada (`toJSON()`) pelo tipo nativo. Serve para
// o que o Testing Library não consulta por papel, como o `Svg` dos ícones (decorativo).

export interface TreeNode {
  type: string;
  props: Record<string, unknown>;
  children?: TreeNode[] | null;
}

export function findNodes(tree: unknown, type: string): TreeNode[] {
  if (tree == null || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap((node) => findNodes(node, type));
  const node = tree as TreeNode;
  const own = node.type === type ? [node] : [];
  return [...own, ...(node.children ?? []).flatMap((child) => findNodes(child, type))];
}
