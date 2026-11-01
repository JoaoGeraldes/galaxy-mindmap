<script lang="ts">
  // Macs use the Command key where other systems use Ctrl.
  const mod = /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

  const groups = [
    {
      title: 'Nodes',
      rows: [
        ['Show actions', ['Hover', 'Tap']],
        ['Add a child', ['Tab']],
        ['Rename', ['F2', 'Double-click']],
        ['Delete', ['Del']],
        ['Deselect', ['Esc']],
        ['Reconnect', ['Drag onto a node']],
      ],
    },
    {
      title: 'History',
      rows: [
        ['Undo', [`${mod} Z`]],
        ['Redo', [`${mod} Shift Z`, `${mod} Y`]],
      ],
    },
    {
      title: 'View',
      rows: [
        ['Move around', ['Drag the background']],
        ['Zoom', ['Scroll']],
        ['Fit map to screen', ['Double-click the background']],
      ],
    },
  ] as const;
</script>

<details class="shortcuts" name="map-panel">
  <summary class="round" title="Shortcuts" aria-label="Shortcuts">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8" />
    </svg>
  </summary>
  <div class="panel">
    {#each groups as group (group.title)}
      <h3>{group.title}</h3>
      <dl>
        {#each group.rows as [action, keys] (action)}
          <dt>{action}</dt>
          <dd>
            {#each keys as key, i (key)}
              {#if i > 0}<span class="or">or</span>{/if}
              <kbd>{key}</kbd>
            {/each}
          </dd>
        {/each}
      </dl>
    {/each}
  </div>
</details>

<style>
  .shortcuts {
    position: relative;
    color: var(--text);
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
    max-height: 60vh;
    overflow-y: auto;
    padding: 4px 16px 12px;
    border-radius: 14px;
    background: var(--panel);
    box-shadow:
      0 0 0 1px var(--border-strong),
      0 8px 32px rgb(0 0 0 / 0.25);
  }

  h3 {
    margin: 12px 0 6px;
    color: var(--accent);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 12px;
    margin: 0;
  }

  dt {
    color: var(--text-muted);
  }

  dd {
    margin: 0;
    text-align: right;
  }

  kbd {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 5px;
    background: var(--key);
    box-shadow: inset 0 -1px 0 var(--border-strong);
    font-family: inherit;
    font-size: 12px;
    color: var(--text);
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

  .or {
    margin: 0 4px;
    color: var(--text-muted);
    font-size: 11px;
  }
</style>
