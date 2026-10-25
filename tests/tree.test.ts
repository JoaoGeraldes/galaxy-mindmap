import { describe, expect, it } from 'vitest';
import {
  addChild,
  addSibling,
  createNode,
  findNode,
  findParent,
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

  it('adds a sibling right after the selected node', () => {
    const { root, first } = sampleTree();
    const sibling = addSibling(root, first.id, 'Between')!;
    expect(root.children.map((child) => child.text)).toEqual([
      'First',
      'Between',
      'Second',
    ]);
    expect(sibling.text).toBe('Between');
  });

  it('gives the central topic no siblings', () => {
    const { root } = sampleTree();
    expect(addSibling(root, root.id)).toBeUndefined();
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
});
