export type TreeNode<T> = T & { children: TreeNode<T>[] };

export function buildTree<T extends { id: number; parentId: number | null }>(
  items: T[],
): TreeNode<T>[] {
  const nodeMap = new Map<number, TreeNode<T>>();
  for (const item of items) {
    nodeMap.set(item.id, { ...item, children: [] });
  }

  const roots: TreeNode<T>[] = [];
  for (const node of nodeMap.values()) {
    const parent =
      node.parentId !== null ? nodeMap.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Returns a human-readable conflict message if assigning `newParentId` as the
 * parent of `nodeId` would create a cycle (or a self-parent), otherwise null.
 */
export function findCycleConflict(
  items: Array<{ id: number; parentId: number | null }>,
  nodeId: number,
  newParentId: number,
): string | null {
  if (newParentId === nodeId) {
    return 'A node cannot be its own parent';
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const visited = new Set<number>();
  let current = byId.get(newParentId);

  while (current && current.parentId !== null) {
    if (current.parentId === nodeId) {
      return 'This would create a cycle in the hierarchy';
    }
    if (visited.has(current.id)) {
      break;
    }
    visited.add(current.id);
    current = byId.get(current.parentId);
  }

  return null;
}

/** Returns `rootId` plus every descendant id in its subtree. */
export function getDescendantIds(
  items: Array<{ id: number; parentId: number | null }>,
  rootId: number,
): number[] {
  const childrenByParent = new Map<number, number[]>();
  for (const item of items) {
    if (item.parentId === null) continue;
    const siblings = childrenByParent.get(item.parentId) ?? [];
    siblings.push(item.id);
    childrenByParent.set(item.parentId, siblings);
  }

  const result: number[] = [rootId];
  const queue: number[] = [rootId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    for (const childId of childrenByParent.get(current) ?? []) {
      result.push(childId);
      queue.push(childId);
    }
  }
  return result;
}

/** Whether `ancestorId` is `nodeId` itself or one of its ancestors. */
export function isAncestorOrSelf(
  items: Array<{ id: number; parentId: number | null }>,
  ancestorId: number,
  nodeId: number,
): boolean {
  if (ancestorId === nodeId) return true;

  const byId = new Map(items.map((item) => [item.id, item]));
  const visited = new Set<number>();
  let current = byId.get(nodeId);

  while (current && current.parentId !== null) {
    if (current.parentId === ancestorId) return true;
    if (visited.has(current.id)) break;
    visited.add(current.id);
    current = byId.get(current.parentId);
  }

  return false;
}
