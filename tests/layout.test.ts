import { describe, expect, it } from 'vitest';
import { NEW_NODE_HINT, PALETTES } from '../src/lib/config';
import {
  areaAround,
  layoutTree,
  linkPath,
  nodeLook,
  nodeWidth,
} from '../src/lib/layout';
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

    expect(colorOf(root.children[0].id)).toBe(PALETTES.vivid.dark.branches[0]);
    expect(colorOf(root.children[1].id)).toBe(PALETTES.vivid.dark.branches[1]);
    expect(colorOf(child.id)).toBe(PALETTES.vivid.dark.branches[0]);
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
    const path = linkPath(from, to, to.side);

    expect(path.startsWith(`M ${from.x + from.width / 2} ${from.y}`)).toBe(
      true,
    );
    expect(path.endsWith(`${to.x - to.width / 2} ${to.y}`)).toBe(true);
  });

  it('bends a link sideways without moving its ends', () => {
    const [{ from, to }] = layoutTree(treeWithBranches(1)).links;
    const straight = linkPath(from, to, to.side);
    const bent = linkPath(from, to, to.side, { x: 0, y: 30 });

    expect(bent).not.toBe(straight);
    expect(bent.split(' C ')[0]).toBe(straight.split(' C ')[0]);
    expect(bent.endsWith(`${to.x - to.width / 2} ${to.y}`)).toBe(true);
  });

  it('draws deeper nodes with smaller text', () => {
    const sizes = [0, 1, 2, 3, 9].map((depth) => nodeLook(depth).fontSize);
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    expect(nodeLook(9)).toEqual(nodeLook(3));
  });

  it('holds every box in one area, even when they all sit in a line', () => {
    const area = areaAround(
      [
        { x: 0, y: 0, width: 100, height: 40 },
        { x: 200, y: 0, width: 60, height: 20 },
      ],
      10,
    );
    expect(area).toEqual({ x: -60, y: -30, width: 300, height: 60 });
  });

  it('makes text and boxes bigger with a larger text size', () => {
    const root = treeWithBranches(1);
    const normal = layoutTree(root).nodes[1];
    const larger = layoutTree(root, {
      palette: PALETTES.vivid.dark,
      textScale: 1.4,
    }).nodes[1];
    expect(larger.height).toBeCloseTo(normal.height * 1.4);
    expect(larger.width).toBeGreaterThan(normal.width);
    expect(nodeLook(1, 1.4).fontSize).toBeCloseTo(nodeLook(1).fontSize * 1.4);
  });

  it('colours the branches from the chosen palette', () => {
    const palette = PALETTES.colourBlindSafe.light;
    const { nodes } = layoutTree(treeWithBranches(2), {
      palette,
      textScale: 1,
    });
    expect(nodes.map((placed) => placed.color)).toEqual([
      palette.root,
      palette.branches[0],
      palette.branches[1],
    ]);
  });

  it('makes a new, empty node wide enough for its hint', () => {
    expect(nodeWidth('', 1)).toBe(nodeWidth(NEW_NODE_HINT, 1));
    expect(nodeWidth('', 1)).toBeGreaterThan(nodeWidth('Hi', 1));
  });
});
