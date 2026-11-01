import { describe, expect, it } from 'vitest';
import {
  addChild,
  createNode,
  findNode,
  findParent,
  moveNode,
  removeNode,
} from '../src/lib/tree';

function sampleTree() {
  const root = createNode('Root');
  const first = addChild(root, root.id, 'First')!;
  const second = addChild(root, root.id, 'Second')!;
  const nested = addChild(root, first.id, 'Nested')!;
  return { root, first, second, nested };
}

describe('tree', () => {
  it('finds a node anywhere in the tree by its id', () => {
    const { root, nested } = sampleTree();
    expect(findNode(root, nested.id)?.text).toBe('Nested');
  });

  it('finds the parent of a nested node', () => {
    const { root, first, nested } = sampleTree();
    expect(findParent(root, nested.id)).toBe(first);
  });

  it('adds a child at the end of the parent children', () => {
    const { root } = sampleTree();
    const third = addChild(root, root.id)!;
    expect(root.children).toHaveLength(3);
    expect(root.children[2]).toBe(third);
    expect(third.text).toBe('New idea');
  });

  it('removes a node together with its whole branch', () => {
    const { root, first, nested } = sampleTree();
    expect(removeNode(root, first.id)).toBe(true);
    expect(findNode(root, first.id)).toBeUndefined();
    expect(findNode(root, nested.id)).toBeUndefined();
  });

  it('never removes the central topic', () => {
    const { root } = sampleTree();
    expect(removeNode(root, root.id)).toBe(false);
    expect(root.children).toHaveLength(2);
  });

  it('moves a node with its whole branch under another node', () => {
    const { root, first, second, nested } = sampleTree();
    expect(moveNode(root, first.id, second.id)).toBe(true);
    expect(root.children).toEqual([second]);
    expect(second.children.at(-1)).toBe(first);
    expect(first.children).toContain(nested);
  });

  it('refuses to move a node into its own branch', () => {
    const { root, first, nested } = sampleTree();
    expect(moveNode(root, first.id, nested.id)).toBe(false);
    expect(root.children).toContain(first);
  });

  it('never moves the central topic', () => {
    const { root, first } = sampleTree();
    expect(moveNode(root, root.id, first.id)).toBe(false);
  });

  it('treats a move to the same parent as no move', () => {
    const { root, first } = sampleTree();
    expect(moveNode(root, first.id, root.id)).toBe(false);
  });
});
