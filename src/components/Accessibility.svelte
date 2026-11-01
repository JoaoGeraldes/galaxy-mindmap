<script lang="ts">
  import type { Preferences } from '../lib/preferences';

  let { preferences = $bindable() }: { preferences: Preferences } = $props();

  const choices = [
    {
      key: 'theme',
      label: 'Theme',
      options: [
        ['dark', 'Dark'],
        ['light', 'Light'],
      ],
    },
    {
      key: 'textSize',
      label: 'Map text size',
      options: [
        ['normal', 'Normal'],
        ['large', 'Large'],
        ['larger', 'Larger'],
      ],
    },
    {
      key: 'colours',
      label: 'Colours',
      options: [
        ['vivid', 'Vivid'],
        ['colourBlindSafe', 'Colour-blind safe'],
      ],
    },
  ] as const;
</script>

<details class="accessibility" name="map-panel">
  <summary class="round" title="Accessibility" aria-label="Accessibility">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="4.5" r="1.5" />
      <path d="M5 8l7 1.5L19 8M12 9.5V14m0 0-3 6m3-6 3 6" />
    </svg>
  </summary>
  <div class="panel">
    {#each choices as { key, label, options } (key)}
      <fieldset>
        <legend>{label}</legend>
        <div class="segments">
          {#each options as [value, text] (value)}
            <label class:chosen={preferences[key] === value}>
              <input
                type="radio"
                name={key}
                checked={preferences[key] === value}
                onchange={() =>
                  (preferences = { ...preferences, [key]: value })}
              />
              {text}
            </label>
          {/each}
        </div>
      </fieldset>
    {/each}

    <fieldset>
      <legend>Motion</legend>
      <label class="switch">
        <input type="checkbox" bind:checked={preferences.reduceMotion} />
        Reduce motion
        <small>Stops ripples, heartbeat and bouncing</small>
      </label>
      <label class="switch" class:off={preferences.reduceMotion}>
        <input
          type="checkbox"
          bind:checked={preferences.beams}
          disabled={preferences.reduceMotion}
        />
        Light beams
        <small>Lights travelling along the connections</small>
      </label>
    </fieldset>
  </div>
</details>

<style>
  .accessibility {
    position: relative;
    font-size: 13px;
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

  /* Opens upward from the button, so it never covers it. */
  .panel {
    position: absolute;
    right: 0;
    bottom: 60px;
    width: min(300px, calc(100vw - 32px));
    max-height: 70vh;
    overflow-y: auto;
    padding: 4px 16px 14px;
    border-radius: 14px;
    background: var(--panel);
    box-shadow:
      0 0 0 1px var(--border-strong),
      0 8px 32px rgb(0 0 0 / 0.25);
  }

  fieldset {
    margin: 0;
    padding: 0;
    border: none;
  }

  legend {
    margin: 12px 0 6px;
    padding: 0;
    color: var(--accent);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .segments {
    display: flex;
    gap: 2px;
    padding: 2px;
    border-radius: 10px;
    background: var(--key);
  }

  .segments label {
    flex: 1;
    padding: 6px 4px;
    border-radius: 8px;
    text-align: center;
    cursor: pointer;
  }

  .segments label:hover {
    background: var(--hover);
  }

  .segments .chosen,
  .segments .chosen:hover {
    background: var(--accent-fill);
    color: white;
  }

  /* The radio dots are replaced by the highlighted segment. */
  .segments input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .segments label:has(:focus-visible) {
    outline: 2px solid var(--accent);
  }

  .switch {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 10px;
    align-items: center;
    padding: 4px 0;
    cursor: pointer;
  }

  .switch input {
    grid-row: span 2;
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--accent-fill);
  }

  .switch small {
    grid-column: 2;
    color: var(--text-muted);
    font-size: 12px;
  }

  .switch.off {
    opacity: 0.5;
    cursor: default;
  }

  /* On phones the button sits at the top, so the panel opens downward. */
  @media (max-width: 700px) {
    .panel {
      top: 60px;
      bottom: auto;
      left: 0;
      right: auto;
    }
  }
</style>
