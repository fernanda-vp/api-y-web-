export interface FlatTreeItem {
  id: number;
  name: string;
  depth: number;
}

/** Flattens a tree (Department/JobTitle trees share this shape) into an
 * ordered list with depth, useful for populating a "reparent" <select>. */
export function flattenTree<T extends { id: number; name: string; children: T[] }>(
  nodes: T[],
  depth = 0,
): FlatTreeItem[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}

/** IDs de un nodo y todos sus descendientes — útil para excluir del selector
 * de "reparentar" las opciones que crearían un ciclo (el backend ya lo
 * rechaza, pero no tiene sentido ofrecerlas en el UI). */
export function getDescendantIds<T extends { id: number; children: T[] }>(
  nodes: T[],
  targetId: number,
): Set<number> {
  function collect(node: T, into: Set<number>) {
    into.add(node.id);
    for (const child of node.children) collect(child, into);
  }

  function find(list: T[]): T | undefined {
    for (const node of list) {
      if (node.id === targetId) return node;
      const found = find(node.children);
      if (found) return found;
    }
    return undefined;
  }

  const result = new Set<number>();
  const target = find(nodes);
  if (target) collect(target, result);
  return result;
}
