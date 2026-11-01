<script lang="ts">
  import { onMount } from 'svelte';
  import NodeMenu from './NodeMenu.svelte';
  import { cloudPath } from '../lib/cloud';
  import { BEAMS, CLOUD, GLOW, PHYSICS } from '../lib/config';
  import {
    layoutTree,
    linkPath,
    nodeLook,
    type PlacedNode,
    type Point,
  } from '../lib/layout';
  import { advance, restingWorld, type Held } from '../lib/physics';
  import {
    addChild,
    addSibling,
    findNode,
    findParent,
    removeNode,
    type MindNode,
  } from '../lib/tree';

  interface Props {
    root: MindNode;
    /** Called after every edit, so the map can be saved right away. */
    onchange: () => void;
    editRootOnStart?: boolean;
  }

  let {
    root = $bindable(),
    onchange,
    editRootOnStart = false,
  }: Props = $props();

  const MIN_SCALE = 0.25;
  const MAX_SCALE = 3;
  const MENU_HIDE_DELAY = 200;

  let layout = $derived(layoutTree(root));
  let selectedId = $state<string | null>(null);
  let editingId = $state<string | null>(null);
  let hoveredId = $state<string | null>(null);
  let pressedId = $state<string | null>(null);
  let view = $state({ x: 0, y: 0, scale: 1 });
  let width = $state(0);
  let height = $state(0);
  let panStart: { x: number; y: number } | null = null;
  let hideMenuTimer: ReturnType<typeof setTimeout> | undefined;
  let svg: SVGSVGElement;

  // Moves smaller than this count as a click rather than a drag.
  const DRAG_THRESHOLD = 4;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let world = $state.raw(restingWorld(layoutTree(root)));
  let held = $state<Held | null>(null);
  let grab: { id: string; from: Point } | null = null;
  let seconds = $state(0);
  let settled = false;

  let originX = $derived(width / 2 + view.x);
  let originY = $derived(height / 2 + view.y);
  // Mouse users get the menu on hover; touch and pen users on press.
  let menuNode = $derived(
    editingId
      ? undefined
      : layout.nodes.find((p) => p.node.id === (hoveredId ?? pressedId)),
  );
  let menuPlace = $derived(menuNode && placeOf(menuNode));
  let strings = $derived(
    layout.links.map(({ from, to }) => {
      const start = { ...placeOf(from), width: from.width };
      const end = { ...placeOf(to), width: to.width };
      const middle = world.strings.get(to.node.id) ?? start;
      const bend = {
        x: middle.x - (start.x + end.x) / 2,
        y: middle.y - (start.y + end.y) / 2,
      };
      return {
        id: to.node.id,
        d: linkPath(start, end, to.side, bend),
        color: to.color,
        isMain: to.depth === 1,
      };
    }),
  );

  // Any edit or drag wakes the springs up again.
  $effect(() => {
    void layout;
    void held;
    settled = false;
  });

  onMount(() => {
    if (editRootOnStart) startEditing(root.id);
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const elapsed = (now - last) / 1000;
      last = now;
      if (calm) {
        if (!settled) world = restingWorld(layout, held);
        settled = true;
      } else {
        seconds = now / 1000;
        if (!settled) {
          const next = advance(world, layout, PHYSICS, elapsed, held);
          world = next.world;
          settled = next.settled;
        }
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  });

  // A node the springs haven't picked up yet is drawn at its resting place.
  function placeOf(placed: PlacedNode): Point {
    return world.nodes.get(placed.node.id) ?? placed;
  }

  function toMap(event: PointerEvent): Point {
    const bounds = svg.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left - originX) / view.scale,
      y: (event.clientY - bounds.top - originY) / view.scale,
    };
  }

  function startEditing(id: string) {
    selectedId = id;
    editingId = id;
  }

  function finishEditing(text: string) {
    const node = editingId ? findNode(root, editingId) : undefined;
    const newText = text.trim();
    editingId = null;
    if (!node || !newText || newText === node.text) return;
    node.text = newText;
    onchange();
  }

  function addNode(id: string, kind: 'child' | 'sibling') {
    const node =
      kind === 'sibling' && id !== root.id
        ? addSibling(root, id)
        : addChild(root, id);
    if (!node) return;
    onchange();
    startEditing(node.id);
  }

  function remove(id: string) {
    const parent = findParent(root, id);
    if (!removeNode(root, id)) return;
    selectedId = parent?.id ?? null;
    onchange();
  }

  function press(id: string, event: PointerEvent) {
    selectedId = id;
    pressedId = event.pointerType === 'mouse' ? null : id;
    grab = { id, from: toMap(event) };
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent) {
    if (!grab) return;
    const point = toMap(event);
    const distance = Math.hypot(point.x - grab.from.x, point.y - grab.from.y);
    if (!held && distance * view.scale < DRAG_THRESHOLD) return;
    hoveredId = null;
    pressedId = null;
    held = { id: grab.id, ...point };
  }

  function release() {
    grab = null;
    held = null;
  }

  function hover(id: string, event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(hideMenuTimer);
    hoveredId = id;
  }

  function hideMenuSoon() {
    clearTimeout(hideMenuTimer);
    // The grace period lets the pointer cross the gap from node to menu.
    hideMenuTimer = setTimeout(() => (hoveredId = null), MENU_HIDE_DELAY);
  }

  function fromMenu(action: (id: string) => void) {
    return () => {
      const id = menuNode!.node.id;
      hoveredId = null;
      pressedId = null;
      action(id);
    };
  }

  function handleKey(event: KeyboardEvent) {
    // Keys typed into inputs or on buttons belong to them, not the map.
    if ((event.target as Element).closest('input, button')) return;
    if (!selectedId || editingId) return;
    const id = selectedId;
    const actions: Record<string, () => void> = {
      Tab: () => addNode(id, 'child'),
      Enter: () => addNode(id, 'sibling'),
      Delete: () => remove(id),
      Backspace: () => remove(id),
      F2: () => startEditing(id),
      Escape: () => (selectedId = null),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  function handleEditorKey(event: KeyboardEvent) {
    const input = event.currentTarget as HTMLInputElement;
    if (event.key === 'Enter') finishEditing(input.value);
    if (event.key === 'Escape') editingId = null;
  }

  function focusAndSelect(input: HTMLInputElement) {
    input.focus();
    input.select();
  }

  function startPan(event: PointerEvent) {
    if (event.target !== event.currentTarget) return;
    selectedId = null;
    pressedId = null;
    panStart = { x: event.clientX - view.x, y: event.clientY - view.y };
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  }

  function pan(event: PointerEvent) {
    if (!panStart) return;
    view.x = event.clientX - panStart.x;
    view.y = event.clientY - panStart.y;
  }

  function resetView(event: MouseEvent) {
    if (event.target === event.currentTarget) view = { x: 0, y: 0, scale: 1 };
  }

  function zoom(event: WheelEvent) {
    event.preventDefault();
    const scale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, view.scale * Math.exp(-event.deltaY * 0.0015)),
    );
    // Keep the point under the cursor fixed while the scale changes.
    const bounds = (event.currentTarget as Element).getBoundingClientRect();
    const cursorX = event.clientX - bounds.left - width / 2;
    const cursorY = event.clientY - bounds.top - height / 2;
    const ratio = scale / view.scale;
    view = {
      x: cursorX - (cursorX - view.x) * ratio,
      y: cursorY - (cursorY - view.y) * ratio,
      scale,
    };
  }

  // Svelte's onwheel is passive, which would ignore preventDefault().
  function zoomOnWheel(svg: SVGSVGElement) {
    svg.addEventListener('wheel', zoom, { passive: false });
    return { destroy: () => svg.removeEventListener('wheel', zoom) };
  }
</script>

<svelte:window onkeydown={handleKey} />

<main
  bind:clientWidth={width}
  bind:clientHeight={height}
  style:background-size="{24 * view.scale}px {24 * view.scale}px"
  style:background-position="{originX}px {originY}px"
>
  <div class="aura"></div>
  <svg
    role="application"
    bind:this={svg}
    use:zoomOnWheel
    onpointerdown={startPan}
    onpointermove={pan}
    onpointerup={() => (panStart = null)}
    ondblclick={resetView}
    style:--beam-length={BEAMS.lengthPercent}
    style:--trip="{BEAMS.secondsPerTrip}s"
  >
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation={GLOW.blur} result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g transform="translate({originX} {originY}) scale({view.scale})">
      <g filter={GLOW.blur ? 'url(#glow)' : undefined}>
        {#each strings as { id, d, color, isMain } (id)}
          <path
            class="link"
            {d}
            stroke={color}
            stroke-width={isMain ? 2.5 : 1.5}
          />
        {/each}
      </g>

      {#if !calm}
        <!-- Outside the glow filter, which would otherwise redraw every frame. -->
        <g>
          {#each strings as { id, d, color }, index (id)}
            {@const delay = `-${(index * 0.77) % BEAMS.secondsPerTrip}s`}
            <path
              class="beam halo"
              {d}
              pathLength="100"
              stroke={color}
              style:animation-delay={delay}
            />
            <path
              class="beam"
              {d}
              pathLength="100"
              stroke={color}
              style:animation-delay={delay}
            />
          {/each}
        </g>
      {/if}

      {#each layout.nodes as placed (placed.node.id)}
        {@const look = nodeLook(placed.depth)}
        {@const place = placeOf(placed)}
        <g
          class="node depth-{Math.min(placed.depth, 2)}"
          class:selected={placed.node.id === selectedId}
          class:held={placed.node.id === held?.id}
          style:--color={placed.color}
          style:font-size="{look.fontSize}px"
          transform="translate({place.x} {place.y})"
          role="button"
          tabindex="-1"
          onpointerdown={(event) => press(placed.node.id, event)}
          onpointermove={drag}
          onpointerup={release}
          onpointercancel={release}
          onpointerenter={(event) => hover(placed.node.id, event)}
          onpointerleave={hideMenuSoon}
          ondblclick={() => startEditing(placed.node.id)}
        >
          {#if placed.depth === 0}
            <path
              class="cloud"
              filter={GLOW.blur ? 'url(#glow)' : undefined}
              d={cloudPath(
                placed.width + 2 * CLOUD.padding,
                placed.height + 2 * CLOUD.padding,
                seconds,
                CLOUD,
              )}
            />
          {:else}
            <rect
              filter={placed.depth === 1 && GLOW.blur
                ? 'url(#glow)'
                : undefined}
              x={-placed.width / 2}
              y={-placed.height / 2}
              width={placed.width}
              height={placed.height}
              rx={placed.depth === 1 ? 12 : placed.height / 2}
            />
          {/if}
          {#if placed.node.id === editingId}
            <foreignObject
              x={-placed.width / 2}
              y={-placed.height / 2}
              width={placed.width}
              height={placed.height}
            >
              <input
                value={placed.node.text}
                use:focusAndSelect
                onkeydown={handleEditorKey}
                onblur={(event) => finishEditing(event.currentTarget.value)}
              />
            </foreignObject>
          {:else}
            <text text-anchor="middle" dominant-baseline="central">
              {placed.node.text}
            </text>
          {/if}
        </g>
      {/each}
    </g>
  </svg>

  {#if menuNode && menuPlace}
    <NodeMenu
      x={originX + menuPlace.x * view.scale}
      y={originY + (menuPlace.y - menuNode.height / 2) * view.scale}
      isRoot={menuNode.depth === 0}
      onaddchild={fromMenu((id) => addNode(id, 'child'))}
      onaddsibling={fromMenu((id) => addNode(id, 'sibling'))}
      onrename={fromMenu(startEditing)}
      ondelete={fromMenu(remove)}
      onpointerenter={() => clearTimeout(hideMenuTimer)}
      onpointerleave={hideMenuSoon}
    />
  {/if}

  <p class="hint">
    <span class="mouse-hint">
      Hover a node for actions · Tab child · Enter sibling · Del remove · Scroll
      to zoom
    </span>
    <span class="touch-hint">Tap a node for actions</span>
    · Drag a node to stretch it · Drag the background to pan · Double-click background
    to recenter
  </p>
</main>

<style>
  main {
    position: relative;
    flex: 1;
    overflow: hidden;
    background-color: #07071a;
    background-image: radial-gradient(
      rgb(255 255 255 / 0.07) 1px,
      transparent 1px
    );
  }

  /* A soft light behind the centre, then darkening edges, like a lens. */
  .aura {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(
        circle at center,
        rgb(124 58 237 / 0.18),
        transparent 45%
      ),
      radial-gradient(circle at center, transparent 55%, rgb(0 0 0 / 0.55));
  }

  svg {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
    user-select: none;
    /* Lets touch drags pan the map instead of scrolling the page. */
    touch-action: none;
  }

  svg:active {
    cursor: grabbing;
  }

  .link,
  .beam {
    fill: none;
    pointer-events: none;
  }

  .link {
    opacity: 0.75;
  }

  .beam {
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: var(--beam-length) 100;
    animation: travel var(--trip) linear infinite;
  }

  .beam:not(.halo) {
    stroke: white;
  }

  .halo {
    stroke-width: 7;
    opacity: 0.35;
  }

  @keyframes travel {
    from {
      stroke-dashoffset: var(--beam-length);
    }
    to {
      stroke-dashoffset: -100;
    }
  }

  .node {
    cursor: pointer;
    outline: none;
  }

  .node.held {
    cursor: grabbing;
  }

  .node rect {
    fill: rgb(12 12 32 / 0.85);
    stroke: var(--color);
    stroke-width: 1;
  }

  .node text {
    fill: #cbd5e1;
  }

  .depth-1 rect {
    fill: rgb(20 18 48 / 0.9);
    stroke-width: 2;
  }

  .depth-1 text {
    fill: #f8fafc;
    font-weight: 600;
  }

  .cloud {
    fill: color-mix(in srgb, var(--color) 30%, #0b0b24);
    stroke: var(--color);
    stroke-width: 2.5;
  }

  .depth-0 text {
    fill: white;
    font-weight: 700;
  }

  .node.selected rect,
  .node.selected .cloud {
    stroke: white;
    stroke-width: 2.5;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 0 12px;
    border: 2px solid white;
    border-radius: 999px;
    background: #0b0b24;
    color: white;
    font: inherit;
    text-align: center;
    outline: none;
  }

  .hint {
    position: absolute;
    bottom: 12px;
    left: 0;
    right: 0;
    margin: 0;
    text-align: center;
    font-size: 12px;
    color: rgb(255 255 255 / 0.4);
    pointer-events: none;
  }

  .touch-hint {
    display: none;
  }

  @media (hover: none) {
    .mouse-hint {
      display: none;
    }

    .touch-hint {
      display: inline;
    }
  }
</style>
