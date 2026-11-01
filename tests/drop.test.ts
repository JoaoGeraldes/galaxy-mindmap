import { describe, expect, it } from 'vitest';
import { dropTarget } from '../src/lib/drop';
import { layoutTree, type PlacedNode } from '../src/lib/layout';
import { addChild, createNode } from '../src/lib/tree';

const REACH = 40;
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
    const target = dropTarget(layout, atRest, { id: leaf.id, x, y }, REACH);
    expect(target?.node).toBe(plans);
  });

  it('offers nothing when no node is within reach', () => {
    const { leaf, layout } = sampleMap();
    const far = { id: leaf.id, x: 5000, y: 5000 };
    expect(dropTarget(layout, atRest, far, REACH)).toBeUndefined();
  });

  it('never offers the current parent, as that would change nothing', () => {
    const { leaf, ideas, layout, place } = sampleMap();
    const { x, y } = place(ideas.id);
    const target = dropTarget(layout, atRest, { id: leaf.id, x, y }, REACH);
    expect(target?.node).not.toBe(ideas);
  });

  it('never offers a node inside the dragged branch', () => {
    const { ideas, deeper, layout, place } = sampleMap();
    const { x, y } = place(deeper.id);
    const target = dropTarget(layout, atRest, { id: ideas.id, x, y }, REACH);
    expect(target?.node).not.toBe(deeper);
  });

  it('lets the central topic be dragged but never reconnected', () => {
    const { root, plans, layout, place } = sampleMap();
    const { x, y } = place(plans.id);
    expect(
      dropTarget(layout, atRest, { id: root.id, x, y }, REACH),
    ).toBeUndefined();
  });

  it('follows where nodes are now, not where they rest', () => {
    const { leaf, plans, layout } = sampleMap();
    const moved = (placed: PlacedNode) =>
      placed.node === plans ? { x: 900, y: 900 } : placed;
    const target = dropTarget(
      layout,
      moved,
      { id: leaf.id, x: 900, y: 900 },
      REACH,
    );
    expect(target?.node).toBe(plans);
  });
});
