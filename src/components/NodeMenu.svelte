<script lang="ts">
  interface Props {
    x: number;
    y: number;
    isRoot: boolean;
    onaddchild: () => void;
    onrename: () => void;
    ondelete: () => void;
    onpointerenter: () => void;
    onpointerleave: () => void;
  }

  let {
    x,
    y,
    isRoot,
    onaddchild,
    onrename,
    ondelete,
    onpointerenter,
    onpointerleave,
  }: Props = $props();
</script>

<div
  class="menu"
  role="toolbar"
  tabindex="-1"
  aria-label="Node actions"
  style:left="{x}px"
  style:top="{y}px"
  {onpointerenter}
  {onpointerleave}
>
  <button onclick={onaddchild}>+ Child</button>
  <button class="icon" title="Rename" aria-label="Rename" onclick={onrename}>
    <svg viewBox="0 0 24 24">
      <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />
    </svg>
  </button>
  {#if !isRoot}
    <button
      class="icon danger"
      title="Delete"
      aria-label="Delete"
      onclick={ondelete}
    >
      <svg viewBox="0 0 24 24">
        <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />
      </svg>
    </button>
  {/if}
</div>

<style>
  .menu {
    position: absolute;
    display: flex;
    gap: 2px;
    padding: 4px;
    border-radius: 10px;
    background: var(--surface-raised);
    box-shadow:
      0 4px 16px rgb(0 0 0 / 0.4),
      0 0 0 1px var(--border-strong);
    /* Sits centred just above the node it belongs to. */
    transform: translate(-50%, calc(-100% - 8px));
    animation: appear 120ms ease-out;
  }

  button {
    display: flex;
    align-items: center;
    min-height: 32px;
    padding: 0 10px;
    border: none;
    border-radius: 6px;
    background: none;
    white-space: nowrap;
  }

  .icon {
    padding: 0 8px;
  }

  .icon svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .danger:hover {
    color: var(--danger);
    background: var(--danger-bg);
  }

  /* Fingers need bigger targets than a mouse pointer. */
  @media (pointer: coarse) {
    button {
      min-height: 44px;
      padding: 0 14px;
    }
  }

  @keyframes appear {
    from {
      opacity: 0;
      margin-top: 4px;
    }
  }
</style>
