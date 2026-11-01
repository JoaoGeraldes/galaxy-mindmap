import { BRANCH_COLORS, NODE_LOOKS, ROOT_COLOR } from './config';
import type { MindNode } from './tree';

const VERTICAL_GAP = 12;
const HORIZONTAL_GAP = 56;

export type Side = -1 | 0 | 1;

export interface PlacedNode {
  node: MindNode;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  side: Side;
  color: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Area extends Point {
  width: number;
  height: number;
}

/** Anything with a centre and a width, such as a node in motion. */
export interface Box extends Point {
  width: number;
}

export interface Link {
  from: PlacedNode;
  to: PlacedNode;
}

export interface Layout {
  nodes: PlacedNode[];
  links: Link[];
}

export function nodeLook(depth: number) {
  return NODE_LOOKS[Math.min(depth, NODE_LOOKS.length - 1)];
}

export function nodeWidth(text: string, depth: number): number {
  const { fontSize, paddingX } = nodeLook(depth);
  // Estimated instead of measured so the layout stays a pure, testable function.
  return Math.max(48, Math.round(text.length * fontSize * 0.58) + 2 * paddingX);
}

function subtreeHeight(node: MindNode, depth: number): number {
  return Math.max(
    nodeLook(depth).height,
    stackHeight(node.children, depth + 1),
  );
}

function stackHeight(nodes: MindNode[], depth: number): number {
  const gaps = VERTICAL_GAP * Math.max(0, nodes.length - 1);
  return nodes.reduce((sum, node) => sum + subtreeHeight(node, depth), gaps);
}

/** Places the root at (0, 0) with main branches split between both sides. */
export function layoutTree(root: MindNode): Layout {
  const layout: Layout = { nodes: [], links: [] };
  const center: PlacedNode = {
    node: root,
    x: 0,
    y: 0,
    width: nodeWidth(root.text, 0),
    height: nodeLook(0).height,
    depth: 0,
    side: 0,
    color: ROOT_COLOR,
  };
  layout.nodes.push(center);

  const half = Math.ceil(root.children.length / 2);
  const branchColor = (index: number) =>
    BRANCH_COLORS[index % BRANCH_COLORS.length];
  placeStack(layout, center, root.children.slice(0, half), 1, branchColor);
  placeStack(layout, center, root.children.slice(half), -1, (index) =>
    branchColor(half + index),
  );
  return layout;
}

function placeStack(
  layout: Layout,
  parent: PlacedNode,
  children: MindNode[],
  side: Side,
  colorFor: (index: number) => string,
) {
  const depth = parent.depth + 1;
  let top = parent.y - stackHeight(children, depth) / 2;
  children.forEach((child, index) => {
    const height = subtreeHeight(child, depth);
    const width = nodeWidth(child.text, depth);
    const placed: PlacedNode = {
      node: child,
      x: parent.x + side * (parent.width / 2 + HORIZONTAL_GAP + width / 2),
      y: top + height / 2,
      width,
      height: nodeLook(depth).height,
      depth,
      side,
      color: colorFor(index),
    };
    layout.nodes.push(placed);
    layout.links.push({ from: parent, to: placed });
    placeStack(layout, placed, child.children, side, () => placed.color);
    top += height + VERTICAL_GAP;
  });
}

/**
 * A smooth curve from the parent's outer edge to the child's inner edge.
 * `bend` pushes the curve's middle sideways, so a string can wobble.
 */
export function linkPath(
  from: Box,
  to: Box,
  side: Side,
  bend: Point = { x: 0, y: 0 },
): string {
  const startX = from.x + (side * from.width) / 2;
  const endX = to.x - (side * to.width) / 2;
  // A cubic curve's middle moves ¾ as far as its control points.
  const bendX = (bend.x * 4) / 3;
  const bendY = (bend.y * 4) / 3;
  const middleX = (startX + endX) / 2 + bendX;
  return `M ${startX} ${from.y} C ${middleX} ${from.y + bendY}, ${middleX} ${to.y + bendY}, ${endX} ${to.y}`;
}

/** The smallest area holding every box, grown by `padding` on each side. */
export function areaAround(
  boxes: (Point & { width: number; height: number })[],
  padding: number,
): Area {
  const left = Math.min(...boxes.map((b) => b.x - b.width / 2));
  const right = Math.max(...boxes.map((b) => b.x + b.width / 2));
  const top = Math.min(...boxes.map((b) => b.y - b.height / 2));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height / 2));
  return {
    x: left - padding,
    y: top - padding,
    width: right - left + 2 * padding,
    height: bottom - top + 2 * padding,
  };
}
