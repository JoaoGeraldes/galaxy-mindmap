export interface MindNode {
  id: string;
  text: string;
  children: MindNode[];
}

export function createNode(text: string): MindNode {
  return { id: crypto.randomUUID(), text, children: [] };
}

export function findNode(root: MindNode, id: string): MindNode | undefined {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
}

export function findParent(root: MindNode, id: string): MindNode | undefined {
  for (const child of root.children) {
    if (child.id === id) return root;
    const found = findParent(child, id);
    if (found) return found;
  }
}

export function addChild(
  root: MindNode,
  parentId: string,
  text = 'New idea',
): MindNode | undefined {
  const parent = findNode(root, parentId);
  if (!parent) return;
  const child = createNode(text);
  parent.children.push(child);
  return child;
}

export function removeNode(root: MindNode, id: string): boolean {
  const parent = findParent(root, id);
  if (!parent) return false;
  parent.children = parent.children.filter((child) => child.id !== id);
  return true;
}

/**
 * Moves a node, with its whole branch, to the end of another node's
 * children. Refuses moves that change nothing or would make a loop.
 */
export function moveNode(
  root: MindNode,
  id: string,
  newParentId: string,
): boolean {
  const node = findNode(root, id);
  const parent = findParent(root, id);
  const newParent = findNode(root, newParentId);
  if (!node || !parent || !newParent || parent === newParent) return false;
  if (findNode(node, newParentId)) return false;
  parent.children = parent.children.filter((child) => child.id !== id);
  newParent.children.push(node);
  return true;
}
