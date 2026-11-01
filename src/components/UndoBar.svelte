<script lang="ts">
  interface Props {
    canUndo: boolean;
    canRedo: boolean;
    onundo: () => void;
    onredo: () => void;
  }

  let { canUndo, canRedo, onundo, onredo }: Props = $props();
</script>

<div class="undo-bar" role="toolbar" aria-label="Undo and redo">
  <button
    onclick={onundo}
    disabled={!canUndo}
    title="Undo (Ctrl+Z)"
    aria-label="Undo"
  >
    <svg viewBox="0 0 24 24"
      ><path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" /></svg
    >
    <span>Undo</span>
  </button>
  <button
    onclick={onredo}
    disabled={!canRedo}
    title="Redo (Ctrl+Shift+Z)"
    aria-label="Redo"
  >
    <span>Redo</span>
    <svg viewBox="0 0 24 24"
      ><path d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" /></svg
    >
  </button>
</div>

<style>
  .undo-bar {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 999px;
    background: rgb(20 18 48 / 0.85);
    box-shadow:
      0 0 0 1px rgb(167 139 250 / 0.35),
      0 0 18px rgb(124 58 237 / 0.35);
  }

  button {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 16px;
    border: none;
    border-radius: 999px;
    background: none;
    color: #f8fafc;
    font-weight: 600;
  }

  button:hover:not(:disabled) {
    background: rgb(167 139 250 / 0.2);
  }

  /* Overrides the app-wide light hover, which flashed on the dark bar. */
  button:disabled {
    opacity: 0.25;
    background: none;
    cursor: default;
  }

  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Bigger targets for fingers, kept clear of the phone's bottom edge. */
  @media (pointer: coarse) {
    .undo-bar {
      bottom: calc(36px + env(safe-area-inset-bottom));
    }

    button {
      min-height: 48px;
      padding: 0 20px;
    }
  }
</style>
