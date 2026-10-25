import type { MindNode } from './tree';

export const ROOT_COLOR = '#1f2937';
export const BRANCH_COLORS = [
  '#e8590c',
  '#1c7ed6',
  '#2f9e44',
  '#ae3ec9',
  '#f08c00',
  '#0c8599',
  '#e64980',
  '#5c7cfa',
];

const ROOT_HEIGHT = 56;
const NODE_HEIGHT = 38;
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

export interface Link {
  from: PlacedNode;
  to: PlacedNode;
}

export interface Layout {
  nodes: PlacedNode[];
  links: Link[];
}

export function nodeWidth(text: string, depth: number): number {
  const fontSize = depth === 0 ? 20 : 15;
  // Estimated instead of measured so the layout stays a pure, testable function.
  return Math.max(64, Math.round(text.length * fontSize * 0.58) + 36);
}

function subtreeHeight(node: MindNode): number {
  return Math.max(NODE_HEIGHT, stackHeight(node.children));
}

function stackHeight(nodes: MindNode[]): number {
  const gaps = VERTICAL_GAP * Math.max(0, nodes.length - 1);
  return nodes.reduce((sum, node) => sum + subtreeHeight(node), gaps);
}

/** Places the root at (0, 0) with main branches split between both sides. */
export function layoutTree(root: MindNode): Layout {
  const layout: Layout = { nodes: [], links: [] };
  const center: PlacedNode = {
    node: root,
    x: 0,
    y: 0,
    width: nodeWidth(root.text, 0),
    height: ROOT_HEIGHT,
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
  let top = parent.y - stackHeight(children) / 2;
  children.forEach((child, index) => {
    const height = subtreeHeight(child);
    const depth = parent.depth + 1;
    const width = nodeWidth(child.text, depth);
    const placed: PlacedNode = {
      node: child,
      x: parent.x + side * (parent.width / 2 + HORIZONTAL_GAP + width / 2),
      y: top + height / 2,
      width,
      height: NODE_HEIGHT,
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

/** A smooth curve from the parent's outer edge to the child's inner edge. */
export function linkPath({ from, to }: Link): string {
  const startX = from.x + (to.side * from.width) / 2;
  const endX = to.x - (to.side * to.width) / 2;
  const middleX = (startX + endX) / 2;
  return `M ${startX} ${from.y} C ${middleX} ${from.y}, ${middleX} ${to.y}, ${endX} ${to.y}`;
}
