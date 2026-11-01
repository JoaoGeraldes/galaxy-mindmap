import { describe, expect, it } from 'vitest';
import { dropTarget } from '../src/lib/drop';
import { layoutTree, type PlacedNode } from '../src/lib/layout';
import { addChild, createNode } from '../src/lib/tree';

const atRest = (placed: PlacedNode) => placed;

function sampleMap() {
  const root = createNode('Root');
  const ideas = addChild(root, root.id, 'Ideas')!;
  const plans = addChild(root, root.id, 'Plans')!;
  const leaf = addChild(root, ideas.id, 'Leaf')!;
  const deeper = addChild(root, leaf.id, 'Deeper')!;
  const layout = layoutTree(root);
  const place = (id: string) => layout.nodes.find((p) => p.node.id === id)!;
  return { root, ideas, plans, leaf, deeper, layout, place };
}

describe('drop', () => {
  it('offers the node the dragged one is held over', () => {
    const { leaf, plans, layout, place } = sampleMap();
    const { x, y } = place(plans.id);
    const target = dropTarget(layout, atRest, { id: leaf.id, x, y });
    expect(target?.node).toBe(plans);
  });

  it('offers a node as soon as the two boxes touch', () => {
    const { leaf, plans, layout, place } = sampleMap();
    // Plans sits left of the centre, so its outer side is further left.
    const target = place(plans.id);
    const gap = (target.width + place(leaf.id).width) / 2;
    const touching = { id: leaf.id, x: target.x - gap, y: target.y };
    expect(dropTarget(layout, atRest, touching)?.node).toBe(plans);
  });

  it('offers nothing while the boxes are even slightly apart', () => {
    const { leaf, plans, layout, place } = sampleMap();
    const target = place(plans.id);
    const gap = (target.width + place(leaf.id).width) / 2;
    const apart = { id: leaf.id, x: target.x - gap - 1, y: target.y };
    expect(dropTarget(layout, atRest, apart)).toBeUndefined();
  });

  it('prefers the node it overlaps most', () => {
    const { root, leaf, plans, layout } = sampleMap();
    const placeAt = (placed: PlacedNode) =>
      placed.node === plans
        ? { x: 1000, y: 0 }
        : placed.node === root
          ? { x: 1000, y: 40 }
          : placed;
    const held = { id: leaf.id, x: 1000, y: 4 };
    expect(dropTarget(layout, placeAt, held)?.node).toBe(plans);
  });

  it('never offers the current parent, as that would change nothing', () => {
    const { leaf, ideas, layout, place } = sampleMap();
    const { x, y } = place(ideas.id);
    const target = dropTarget(layout, atRest, { id: leaf.id, x, y });
    expect(target?.node).not.toBe(ideas);
  });

  it('never offers a node inside the dragged branch', () => {
    const { ideas, deeper, layout, place } = sampleMap();
    const { x, y } = place(deeper.id);
    const target = dropTarget(layout, atRest, { id: ideas.id, x, y });
    expect(target?.node).not.toBe(deeper);
  });

  it('lets the central topic be dragged but never reconnected', () => {
    const { root, plans, layout, place } = sampleMap();
    const { x, y } = place(plans.id);
    expect(dropTarget(layout, atRest, { id: root.id, x, y })).toBeUndefined();
  });
});
