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

export function addSibling(
  root: MindNode,
  id: string,
  text = 'New idea',
): MindNode | undefined {
  const parent = findParent(root, id);
  if (!parent) return;
  const sibling = createNode(text);
  const index = parent.children.findIndex((child) => child.id === id);
  parent.children.splice(index + 1, 0, sibling);
  return sibling;
}

export function removeNode(root: MindNode, id: string): boolean {
  const parent = findParent(root, id);
  if (!parent) return false;
  parent.children = parent.children.filter((child) => child.id !== id);
  return true;
}
