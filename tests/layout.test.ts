import { describe, expect, it } from 'vitest';
import { BRANCH_COLORS, layoutTree, linkPath } from '../src/lib/layout';
import { addChild, createNode } from '../src/lib/tree';

function treeWithBranches(count: number) {
  const root = createNode('Root');
  for (let i = 0; i < count; i++) addChild(root, root.id, `Branch ${i}`);
  return root;
}

describe('layout', () => {
  it('places the central topic at the origin', () => {
    const [center] = layoutTree(createNode('Root')).nodes;
    expect(center.x).toBe(0);
    expect(center.y).toBe(0);
    expect(center.side).toBe(0);
  });

  it('splits main branches between the right and the left side', () => {
    const { nodes } = layoutTree(treeWithBranches(3));
    const sides = nodes.slice(1).map((placed) => placed.side);
    expect(sides).toEqual([1, 1, -1]);
    expect(nodes[1].x).toBeGreaterThan(0);
    expect(nodes[3].x).toBeLessThan(0);
  });

  it('gives each main branch its own color, inherited by its children', () => {
    const root = treeWithBranches(2);
    const child = addChild(root, root.children[0].id, 'Child')!;
    const { nodes } = layoutTree(root);
    const colorOf = (id: string) =>
      nodes.find((placed) => placed.node.id === id)!.color;

    expect(colorOf(root.children[0].id)).toBe(BRANCH_COLORS[0]);
    expect(colorOf(root.children[1].id)).toBe(BRANCH_COLORS[1]);
    expect(colorOf(child.id)).toBe(BRANCH_COLORS[0]);
  });

  it('stacks siblings without overlapping', () => {
    const root = createNode('Root');
    const branch = addChild(root, root.id, 'Branch')!;
    for (let i = 0; i < 4; i++) addChild(root, branch.id, `Leaf ${i}`);
    const leaves = layoutTree(root).nodes.filter((p) => p.depth === 2);

    for (let i = 1; i < leaves.length; i++) {
      const previousBottom = leaves[i - 1].y + leaves[i - 1].height / 2;
      const currentTop = leaves[i].y - leaves[i].height / 2;
      expect(currentTop).toBeGreaterThan(previousBottom);
    }
  });

  it('links a parent outer edge to the child inner edge', () => {
    const { links } = layoutTree(treeWithBranches(1));
    const [{ from, to }] = links;
    const path = linkPath(links[0]);

    expect(path.startsWith(`M ${from.x + from.width / 2} ${from.y}`)).toBe(
      true,
    );
    expect(path.endsWith(`${to.x - to.width / 2} ${to.y}`)).toBe(true);
  });
});
