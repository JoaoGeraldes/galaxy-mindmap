import type { Layout, Point } from './layout';

/** Something that moves: where it is and how fast it's going. */
export interface Body extends Point {
  vx: number;
  vy: number;
}

/**
 * Where everything currently is. Strings are keyed by the id of the node
 * they lead to, and their body is the string's middle.
 */
export interface World {
  nodes: Map<string, Body>;
  strings: Map<string, Body>;
}

/** A node the user is dragging, pinned to the pointer. */
export interface Held extends Point {
  id: string;
}

export interface Springs {
  stiffness: number;
  damping: number;
  stringStiffness: number;
  step: number;
  restDistance: number;
  restSpeed: number;
}

type Move = (body: Body, target: Point, kind: 'node' | 'string') => Body;

// Long pauses (a background tab) are cut short so nothing flies off.
const LONGEST_FRAME = 1 / 20;

export const EMPTY_WORLD: World = { nodes: new Map(), strings: new Map() };

/** One spring step: pulls a body toward its target and slows it down. */
export function pull(
  body: Body,
  target: Point,
  stiffness: number,
  damping: number,
  seconds: number,
): Body {
  const ax = stiffness * (target.x - body.x) - damping * body.vx;
  const ay = stiffness * (target.y - body.y) - damping * body.vy;
  const vx = body.vx + ax * seconds;
  const vy = body.vy + ay * seconds;
  return { x: body.x + vx * seconds, y: body.y + vy * seconds, vx, vy };
}

/** Everything already at rest in its place, so a map opens without flying in. */
export function restingWorld(layout: Layout, held: Held | null = null): World {
  return nextWorld(EMPTY_WORLD, layout, held, (_, target) => still(target));
}

/** Moves the world on by `elapsed` seconds of springs. */
export function advance(
  world: World,
  layout: Layout,
  springs: Springs,
  elapsed: number,
  held: Held | null = null,
): { world: World; settled: boolean } {
  const steps = Math.max(
    1,
    Math.round(Math.min(elapsed, LONGEST_FRAME) / springs.step),
  );
  let moving = false;
  const move: Move = (body, target, kind) => {
    const stiffness =
      kind === 'node' ? springs.stiffness : springs.stringStiffness;
    const next = pull(body, target, stiffness, springs.damping, springs.step);
    if (!isAtRest(next, target, springs)) moving = true;
    return next;
  };
  for (let i = 0; i < steps; i++) {
    moving = false;
    world = nextWorld(world, layout, held, move);
  }
  return { world, settled: !moving && !held };
}

function nextWorld(
  world: World,
  layout: Layout,
  held: Held | null,
  move: Move,
): World {
  const parentOf = new Map(layout.links.map(({ from, to }) => [to.node, from]));
  const nodes = new Map<string, Body>();
  // The layout lists every parent before its children, so each child can
  // aim for where its parent is now and trail behind it.
  for (const placed of layout.nodes) {
    const { id } = placed.node;
    const parent = parentOf.get(placed.node);
    const parentBody = parent && nodes.get(parent.node.id)!;
    const target = parentBody
      ? {
          x: parentBody.x + placed.x - parent.x,
          y: parentBody.y + placed.y - parent.y,
        }
      : { x: placed.x, y: placed.y };
    if (held?.id === id) {
      nodes.set(id, still(held));
      continue;
    }
    // New nodes grow out of their parent.
    const body = world.nodes.get(id) ?? still(parentBody ?? target);
    nodes.set(id, move(body, target, 'node'));
  }

  const strings = new Map<string, Body>();
  for (const { from, to } of layout.links) {
    const start = nodes.get(from.node.id)!;
    const end = nodes.get(to.node.id)!;
    const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const body = world.strings.get(to.node.id) ?? still(middle);
    strings.set(to.node.id, move(body, middle, 'string'));
  }
  return { nodes, strings };
}

function still({ x, y }: Point): Body {
  return { x, y, vx: 0, vy: 0 };
}

function isAtRest(body: Body, target: Point, springs: Springs): boolean {
  return (
    Math.hypot(target.x - body.x, target.y - body.y) < springs.restDistance &&
    Math.hypot(body.vx, body.vy) < springs.restSpeed
  );
}
