import type { Layout, PlacedNode, Point } from './layout';
import { findNode } from './tree';

/**
 * The node a dragged node would connect to if dropped where it is now:
 * the nearest one within `reach`, skipping its current parent and its own
 * branch. `placeOf` says where each node currently is on screen.
 */
export function dropTarget(
  layout: Layout,
  placeOf: (placed: PlacedNode) => Point,
  held: Point & { id: string },
  reach: number,
): PlacedNode | undefined {
  const dragged = layout.nodes.find((p) => p.node.id === held.id);
  const parent = layout.links.find((l) => l.to === dragged)?.from;
  if (!dragged || !parent) return;

  let nearest: PlacedNode | undefined;
  let nearestGap = reach;
  for (const placed of layout.nodes) {
    if (placed === parent || findNode(dragged.node, placed.node.id)) continue;
    const gap = gapToBox(held, placeOf(placed), placed);
    if (gap < nearestGap) {
      nearest = placed;
      nearestGap = gap;
    }
  }
  return nearest;
}

/** How far a point is from a node's box; 0 when inside it. */
function gapToBox(
  point: Point,
  centre: Point,
  { width, height }: { width: number; height: number },
): number {
  const dx = Math.max(0, Math.abs(point.x - centre.x) - width / 2);
  const dy = Math.max(0, Math.abs(point.y - centre.y) - height / 2);
  return Math.hypot(dx, dy);
}
