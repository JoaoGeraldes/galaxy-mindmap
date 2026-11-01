<script lang="ts">
  import FloatingPanel from './FloatingPanel.svelte';

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

<FloatingPanel label="Shortcuts">
  {#snippet icon()}
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7h18v10H3zM7 11h.01M11 11h.01M15 11h.01M8 14h8" />
    </svg>
  {/snippet}

  {#each groups as group (group.title)}
    <section>
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
    </section>
  {/each}
</FloatingPanel>

<style>
  dl {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 10px 16px;
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
    margin: 2px 0;
    padding: 2px 7px;
    border-radius: 5px;
    background: var(--key);
    box-shadow: inset 0 -1px 0 var(--border-strong);
    font-family: inherit;
    font-size: 12px;
    color: var(--text);
  }

  .or {
    margin: 0 4px;
    color: var(--text-muted);
    font-size: 11px;
  }
</style>
