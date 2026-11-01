import { describe, expect, it } from 'vitest';
import { PHYSICS } from '../src/lib/config';
import { layoutTree } from '../src/lib/layout';
import {
  advance,
  pull,
  restingWorld,
  type Body,
  type World,
} from '../src/lib/physics';
import { addChild, createNode } from '../src/lib/tree';

function smallMap() {
  const root = createNode('Root');
  const branch = addChild(root, root.id, 'Branch')!;
  const leaf = addChild(root, branch.id, 'Leaf')!;
  return { root, branch, leaf, layout: layoutTree(root) };
}

function runFor(seconds: number, world: World, layout = smallMap().layout) {
  let result = { world, settled: false };
  for (let t = 0; t < seconds; t += 1 / 60) {
    result = advance(result.world, layout, PHYSICS, 1 / 60);
  }
  return result;
}

function placeOf(layout: ReturnType<typeof layoutTree>, id: string) {
  const { x, y } = layout.nodes.find((p) => p.node.id === id)!;
  return { x, y };
}

describe('physics', () => {
  it('pulls a body toward its target', () => {
    const body: Body = { x: 0, y: 0, vx: 0, vy: 0 };
    const next = pull(body, { x: 10, y: -10 }, 200, 10, 1 / 60);
    expect(next.x).toBeGreaterThan(0);
    expect(next.y).toBeLessThan(0);
  });

  it('overshoots a little before settling, like a stiff elastic', () => {
    let body: Body = { x: 0, y: 0, vx: 0, vy: 0 };
    let furthest = 0;
    for (let i = 0; i < 600; i++) {
      body = pull(body, { x: 100, y: 0 }, 220, 14, 1 / 240);
      furthest = Math.max(furthest, body.x);
    }
    expect(furthest).toBeGreaterThan(100);
    expect(body.x).toBeCloseTo(100, 1);
  });

  it('opens a map with every node already in its place', () => {
    const { layout, leaf } = smallMap();
    const { x, y } = restingWorld(layout).nodes.get(leaf.id)!;
    expect({ x, y }).toEqual(placeOf(layout, leaf.id));
  });

  it('grows new nodes out of their parent', () => {
    const { root, branch, layout } = smallMap();
    const world = restingWorld(layout);
    const added = addChild(root, branch.id, 'New')!;
    const next = advance(world, layoutTree(root), PHYSICS, 1 / 240);
    const start = next.world.nodes.get(added.id)!;
    const parent = world.nodes.get(branch.id)!;
    expect(Math.hypot(start.x - parent.x, start.y - parent.y)).toBeLessThan(1);
  });

  it('settles every node in its place after a while', () => {
    const { root, branch, layout } = smallMap();
    addChild(root, branch.id, 'New');
    const grown = layoutTree(root);
    const result = runFor(4, restingWorld(layout), grown);

    expect(result.settled).toBe(true);
    for (const placed of grown.nodes) {
      const body = result.world.nodes.get(placed.node.id)!;
      expect(body.x).toBeCloseTo(placed.x, 0);
      expect(body.y).toBeCloseTo(placed.y, 0);
    }
  });

  it('keeps a dragged node under the pointer while its children follow', () => {
    const { branch, leaf, layout } = smallMap();
    const held = { id: branch.id, x: 300, y: 200 };
    let result = { world: restingWorld(layout), settled: false };
    for (let i = 0; i < 240; i++) {
      result = advance(result.world, layout, PHYSICS, 1 / 60, held);
    }
    const branchBody = result.world.nodes.get(branch.id)!;
    const leafBody = result.world.nodes.get(leaf.id)!;
    const offset = {
      x: placeOf(layout, leaf.id).x - placeOf(layout, branch.id).x,
      y: placeOf(layout, leaf.id).y - placeOf(layout, branch.id).y,
    };

    expect(result.settled).toBe(false);
    expect({ x: branchBody.x, y: branchBody.y }).toEqual({ x: 300, y: 200 });
    expect(leafBody.x).toBeCloseTo(300 + offset.x, 0);
    expect(leafBody.y).toBeCloseTo(200 + offset.y, 0);
  });

  it('keeps each string’s middle between its two nodes once still', () => {
    const { branch, leaf, layout } = smallMap();
    const world = restingWorld(layout);
    const middle = world.strings.get(leaf.id)!;
    const a = world.nodes.get(branch.id)!;
    const b = world.nodes.get(leaf.id)!;
    expect(middle.x).toBe((a.x + b.x) / 2);
    expect(middle.y).toBe((a.y + b.y) / 2);
  });

  it('forgets nodes that were removed from the map', () => {
    const { root, leaf, layout } = smallMap();
    root.children[0].children = [];
    const { world } = advance(
      restingWorld(layout),
      layoutTree(root),
      PHYSICS,
      1 / 60,
    );
    expect(world.nodes.has(leaf.id)).toBe(false);
    expect(world.strings.has(leaf.id)).toBe(false);
  });
});
