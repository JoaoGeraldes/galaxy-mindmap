import { NODE_LOOKS, PALETTES } from './config';
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

/** How the map is drawn: its colours and how big its text is. */
export interface LayoutOptions {
  palette: { root: string; branches: string[] };
  textScale: number;
}

const DEFAULT_OPTIONS: LayoutOptions = {
  palette: PALETTES.vivid.dark,
  textScale: 1,
};

export function nodeLook(depth: number, textScale = 1) {
  const look = NODE_LOOKS[Math.min(depth, NODE_LOOKS.length - 1)];
  return {
    fontSize: look.fontSize * textScale,
    height: look.height * textScale,
    paddingX: look.paddingX * textScale,
  };
}

export function nodeWidth(text: string, depth: number, textScale = 1): number {
  const { fontSize, paddingX } = nodeLook(depth, textScale);
  // Estimated instead of measured so the layout stays a pure, testable function.
  return Math.max(48, Math.round(text.length * fontSize * 0.58) + 2 * paddingX);
}

function subtreeHeight(node: MindNode, depth: number, scale: number): number {
  return Math.max(
    nodeLook(depth, scale).height,
    stackHeight(node.children, depth + 1, scale),
  );
}

function stackHeight(nodes: MindNode[], depth: number, scale: number): number {
  const gaps = VERTICAL_GAP * scale * Math.max(0, nodes.length - 1);
  return nodes.reduce(
    (sum, node) => sum + subtreeHeight(node, depth, scale),
    gaps,
  );
}

/** Places the root at (0, 0) with main branches split between both sides. */
export function layoutTree(
  root: MindNode,
  { palette, textScale }: LayoutOptions = DEFAULT_OPTIONS,
): Layout {
  const layout: Layout = { nodes: [], links: [] };
  const center: PlacedNode = {
    node: root,
    x: 0,
    y: 0,
    width: nodeWidth(root.text, 0, textScale),
    height: nodeLook(0, textScale).height,
    depth: 0,
    side: 0,
    color: palette.root,
  };
  layout.nodes.push(center);

  const half = Math.ceil(root.children.length / 2);
  const { branches } = palette;
  const branchColor = (index: number) => branches[index % branches.length];
  const place = (children: MindNode[], side: Side, firstIndex: number) =>
    placeStack(layout, center, children, side, textScale, (index) =>
      branchColor(firstIndex + index),
    );
  place(root.children.slice(0, half), 1, 0);
  place(root.children.slice(half), -1, half);
  return layout;
}

function placeStack(
  layout: Layout,
  parent: PlacedNode,
  children: MindNode[],
  side: Side,
  scale: number,
  colorFor: (index: number) => string,
) {
  const depth = parent.depth + 1;
  let top = parent.y - stackHeight(children, depth, scale) / 2;
  children.forEach((child, index) => {
    const height = subtreeHeight(child, depth, scale);
    const width = nodeWidth(child.text, depth, scale);
    const placed: PlacedNode = {
      node: child,
      x:
        parent.x +
        side * (parent.width / 2 + HORIZONTAL_GAP * scale + width / 2),
      y: top + height / 2,
      width,
      height: nodeLook(depth, scale).height,
      depth,
      side,
      color: colorFor(index),
    };
    layout.nodes.push(placed);
    layout.links.push({ from: parent, to: placed });
    placeStack(layout, placed, child.children, side, scale, () => placed.color);
    top += height + VERTICAL_GAP * scale;
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
