import type { Layout, PlacedNode, Point } from './layout';
import { findNode } from './tree';

/**
 * The node a dragged node would connect to if dropped where it is now:
 * one its box touches, skipping its current parent and its own branch.
 * When several touch, the one it overlaps most wins. `placeOf` says where
 * each node currently is on screen.
 */
export function dropTarget(
  layout: Layout,
  placeOf: (placed: PlacedNode) => Point,
  held: Point & { id: string },
): PlacedNode | undefined {
  const dragged = layout.nodes.find((p) => p.node.id === held.id);
  const parent = layout.links.find((l) => l.to === dragged)?.from;
  if (!dragged || !parent) return;

  let best: PlacedNode | undefined;
  let bestOverlap = -1;
  for (const placed of layout.nodes) {
    if (placed === parent || findNode(dragged.node, placed.node.id)) continue;
    const overlap = overlapArea(
      { ...dragged, ...held },
      { ...placed, ...placeOf(placed) },
    );
    if (overlap > bestOverlap) {
      best = placed;
      bestOverlap = overlap;
    }
  }
  return best;
}

type Box = Point & { width: number; height: number };

/** How much two boxes overlap; 0 when they just touch, -1 when apart. */
function overlapArea(a: Box, b: Box): number {
  const across = (a.width + b.width) / 2 - Math.abs(a.x - b.x);
  const down = (a.height + b.height) / 2 - Math.abs(a.y - b.y);
  return across < 0 || down < 0 ? -1 : across * down;
}
