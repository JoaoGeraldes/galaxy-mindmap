<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Names the button for tooltips and screen readers. */
    label: string;
    icon: Snippet;
    /** The panel's sections, each a `<section>` or `<fieldset>` with a heading. */
    children: Snippet;
  }

  let { label, icon, children }: Props = $props();
  let open = $state(false);
  let details: HTMLDetailsElement;

  // While open, a tap or click anywhere else, or Escape, closes it.
  $effect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!details.contains(event.target as Node)) open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  });
</script>

<!-- Sharing a name means opening one map panel closes any other. -->
<details bind:this={details} bind:open name="map-panel">
  <summary class="round" title={label} aria-label={label}>
    {@render icon()}
  </summary>
  <div class="panel">
    {@render children()}
  </div>
</details>

<style>
  details {
    position: relative;
    color: var(--text);
    font-size: 13px;
    line-height: 1.4;
  }

  summary {
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  [open] summary {
    background: var(--floating-hover);
  }

  .panel {
    position: absolute;
    right: 0;
    /* Opens upward from its button, so it never covers it. */
    bottom: 60px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: min(320px, calc(100vw - 32px));
    max-height: 70vh;
    overflow-y: auto;
    box-sizing: border-box;
    padding: 18px 20px 20px;
    border-radius: 14px;
    background: var(--panel);
    box-shadow:
      0 0 0 1px var(--border-strong),
      0 8px 32px rgb(0 0 0 / 0.25);
  }

  /* Every panel's sections and headings look the same. */
  .panel :global(:is(section, fieldset)) {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: none;
  }

  .panel :global(:is(h3, legend)) {
    margin: 0 0 10px;
    padding: 0;
    color: var(--accent);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /*
   * On phones the buttons sit at the top and a panel tied to its button
   * would run off the screen, so it is centred on the screen instead and
   * scrolls when taller than the space below the buttons.
   */
  @media (max-width: 700px) {
    .panel {
      position: fixed;
      top: 72px;
      left: 50%;
      right: auto;
      bottom: auto;
      transform: translateX(-50%);
      width: min(360px, calc(100vw - 24px));
      max-height: calc(100dvh - 96px);
      z-index: 10;
    }
  }
</style>
