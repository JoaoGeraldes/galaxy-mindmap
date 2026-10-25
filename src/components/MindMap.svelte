<script lang="ts">
  import { layoutTree, linkPath } from '../lib/layout';
  import {
    addChild,
    addSibling,
    findNode,
    findParent,
    removeNode,
    type MindNode,
  } from '../lib/tree';

  let { root = $bindable() }: { root: MindNode } = $props();

  const MIN_SCALE = 0.25;
  const MAX_SCALE = 3;

  let layout = $derived(layoutTree(root));
  let selectedId = $state<string | null>(null);
  let editingId = $state<string | null>(null);
  let view = $state({ x: 0, y: 0, scale: 1 });
  let width = $state(0);
  let height = $state(0);
  let panStart: { x: number; y: number } | null = null;

  let originX = $derived(width / 2 + view.x);
  let originY = $derived(height / 2 + view.y);
  let isBranchSelected = $derived(
    selectedId !== null && selectedId !== root.id,
  );

  function startEditing(id: string) {
    selectedId = id;
    editingId = id;
  }

  function finishEditing(text: string) {
    const node = editingId ? findNode(root, editingId) : undefined;
    if (node && text.trim()) node.text = text.trim();
    editingId = null;
  }

  function addNode(kind: 'child' | 'sibling') {
    if (!selectedId) return;
    const node =
      kind === 'sibling' && selectedId !== root.id
        ? addSibling(root, selectedId)
        : addChild(root, selectedId);
    if (node) startEditing(node.id);
  }

  function removeSelected() {
    if (!selectedId) return;
    const parent = findParent(root, selectedId);
    if (removeNode(root, selectedId)) selectedId = parent?.id ?? null;
  }

  function handleKey(event: KeyboardEvent) {
    // Keys typed into inputs or on buttons belong to them, not the map.
    if ((event.target as Element).closest('input, button')) return;
    if (!selectedId || editingId) return;
    const actions: Record<string, () => void> = {
      Tab: () => addNode('child'),
      Enter: () => addNode('sibling'),
      Delete: removeSelected,
      Backspace: removeSelected,
      F2: () => startEditing(selectedId!),
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
  <svg
    role="application"
    use:zoomOnWheel
    onpointerdown={startPan}
    onpointermove={pan}
    onpointerup={() => (panStart = null)}
    ondblclick={resetView}
  >
    <g transform="translate({originX} {originY}) scale({view.scale})">
      {#each layout.links as link (link.to.node.id)}
        <path
          class="link"
          d={linkPath(link)}
          stroke={link.to.color}
          stroke-width={link.to.depth === 1 ? 3 : 2}
        />
      {/each}

      {#each layout.nodes as placed (placed.node.id)}
        <g
          class="node depth-{Math.min(placed.depth, 2)}"
          class:selected={placed.node.id === selectedId}
          style:--color={placed.color}
          transform="translate({placed.x} {placed.y})"
          role="button"
          tabindex="-1"
          onpointerdown={() => (selectedId = placed.node.id)}
          ondblclick={() => startEditing(placed.node.id)}
        >
          <rect
            x={-placed.width / 2}
            y={-placed.height / 2}
            width={placed.width}
            height={placed.height}
            rx={placed.height / 2}
          />
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

  <div class="toolbar">
    <button disabled={!selectedId} onclick={() => addNode('child')}>
      + Child
    </button>
    <button disabled={!isBranchSelected} onclick={() => addNode('sibling')}>
      + Sibling
    </button>
    <button disabled={!isBranchSelected} onclick={removeSelected}>
      Delete
    </button>
  </div>

  <p class="hint">
    Double-click to rename · Tab child · Enter sibling · Del remove · Drag to
    pan · Scroll to zoom · Double-click background to recenter
  </p>
</main>

<style>
  main {
    position: relative;
    flex: 1;
    overflow: hidden;
    background-image: radial-gradient(#d6d3d1 1px, transparent 1px);
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    cursor: grab;
    user-select: none;
  }

  svg:active {
    cursor: grabbing;
  }

  .link {
    fill: none;
    pointer-events: none;
  }

  .node {
    cursor: pointer;
    outline: none;
  }

  .node rect {
    fill: white;
    stroke: var(--color);
    stroke-width: 2;
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.12));
  }

  .node text {
    font-size: 15px;
    fill: #1f2937;
  }

  .depth-0 rect,
  .depth-1 rect {
    fill: var(--color);
    stroke: none;
  }

  .depth-0 text,
  .depth-1 text {
    fill: white;
    font-weight: 600;
  }

  .depth-0 text {
    font-size: 20px;
  }

  .node.selected rect {
    stroke: #fbbf24;
    stroke-width: 4;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 0 12px;
    border: 2px solid #fbbf24;
    border-radius: 999px;
    font: inherit;
    font-size: 15px;
    text-align: center;
    outline: none;
  }

  .toolbar {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    gap: 8px;
  }

  .hint {
    position: absolute;
    bottom: 12px;
    left: 0;
    right: 0;
    margin: 0;
    text-align: center;
    font-size: 12px;
    color: #a8a29e;
    pointer-events: none;
  }
</style>
