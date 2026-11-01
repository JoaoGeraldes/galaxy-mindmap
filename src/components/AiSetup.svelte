<script lang="ts">
  import { onMount } from 'svelte';
  import { claudeConfig, type McpSetup } from '../lib/mcp-setup';

  interface Props {
    /** Asks the desktop app how the server runs on this computer. */
    load: () => Promise<McpSetup>;
    /** The folder open in the app, where new maps will be saved. */
    folder: string;
    onclose: () => void;
  }

  let { load, folder, onclose }: Props = $props();
  let dialog: HTMLDialogElement;
  let setup = $state<McpSetup | null>(null);
  let copied = $state('');
  let config = $derived(setup ? claudeConfig(setup) : '');

  const EXAMPLE =
    'Create a mind map about planning a trip to Japan, with 4 main branches and 2 or 3 ideas under each.';
  const quitKeys = /Mac/.test(navigator.userAgent)
    ? 'press ⌘ Q'
    : 'right-click its icon near the clock and choose Quit';

  onMount(async () => {
    dialog.showModal();
    setup = await load();
  });

  async function copy(text: string, what: string) {
    await navigator.clipboard.writeText(text);
    copied = what;
    setTimeout(() => {
      if (copied === what) copied = '';
    }, 2000);
  }

  // A click on the dimmed area around the dialog closes it.
  function closeOutside(event: MouseEvent) {
    if (event.target === dialog) dialog.close();
  }
</script>

<dialog bind:this={dialog} {onclose} onclick={closeOutside}>
  <header>
    <h2>Connect to Claude (MCP)</h2>
    <button class="close" aria-label="Close" onclick={() => dialog.close()}>
      <svg viewBox="0 0 24 24" aria-hidden="true"
        ><path d="M6 6l12 12M18 6 6 18" /></svg
      >
    </button>
  </header>

  <div class="body">
    <p class="intro">
      Let Claude make mind maps for you. It takes about two minutes, and you
      only do it once.
    </p>
    <p class="intro">
      Galaxy Mind Map includes an <b>MCP server</b>, the standard way AI apps
      use tools. These steps set it up for Claude; other MCP apps (Cursor,
      Claude Code…) use the same settings.
    </p>

    <ol>
      <li>
        <h3>Open Claude's settings file</h3>
        <p>
          In the Claude desktop app, go to <b>Settings</b> → <b>Developer</b> →
          <b>Edit Config</b>. A file called
          <code>claude_desktop_config.json</code> opens.
        </p>
      </li>

      <li>
        <h3>Paste this into it, then save</h3>
        <p>
          If the file is empty or only has <code>{'{}'}</code>, replace
          everything with this. If it already lists other tools under
          <code>"mcpServers"</code>, add only the <code>"galaxy-mind-map"</code>
          part next to them.
        </p>
        {#if setup && !setup.ready}
          <p class="warning">
            The AI helper isn't built yet. In the project folder, run
            <code>npm run mcp:build</code>, then open this guide again.
          </p>
        {/if}
        <div class="code">
          <pre>{config || 'Loading…'}</pre>
          <button
            class="primary"
            onclick={() => copy(config, 'config')}
            disabled={!config}
          >
            {copied === 'config' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </li>

      <li>
        <h3>Restart Claude</h3>
        <p>
          Closing its window isn't enough. Quit Claude completely ({quitKeys}),
          then open it again.
        </p>
      </li>

      <li>
        <h3>Ask for a map</h3>
        <p>In a new chat, try:</p>
        <div class="code">
          <p class="example">{EXAMPLE}</p>
          <button onclick={() => copy(EXAMPLE, 'example')}>
            {copied === 'example' ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p>
          The first time, Claude asks for permission: choose <b>Allow</b>. The
          new map appears here in a moment.
        </p>
      </li>
    </ol>

    <p class="where">
      New maps are saved in <b title={folder}>{folder}</b>, the folder open
      here.
    </p>
  </div>
</dialog>

<style>
  /* Never taller than most of the screen; the steps scroll inside. */
  dialog {
    box-sizing: border-box;
    width: min(600px, calc(100vw - 32px));
    max-height: min(720px, 80dvh);
    margin: auto;
    padding: 0;
    overflow: hidden;
    border: none;
    border-radius: 18px;
    background: var(--surface);
    color: var(--text);
    box-shadow:
      0 0 0 1px var(--border-strong),
      0 24px 64px rgb(0 0 0 / 0.4),
      0 0 48px var(--glow);
    line-height: 1.5;
  }

  dialog[open] {
    display: flex;
    flex-direction: column;
  }

  .body {
    overflow-y: auto;
    padding: 0 28px 28px;
  }

  dialog::backdrop {
    background: rgb(4 4 16 / 0.6);
    backdrop-filter: blur(2px);
  }

  header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 8px 28px;
  }

  h2 {
    margin: 0;
    font-size: 22px;
  }

  .close {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: none;
    background: none;
    color: var(--text-muted);
  }

  .close svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  .intro {
    margin: 4px 0 0;
    color: var(--text-muted);
  }

  .intro + .intro {
    margin: 10px 0 24px;
  }

  .intro b {
    color: var(--text);
  }

  ol {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: step;
  }

  /* Big numbered circles make the order obvious at a glance. */
  li {
    position: relative;
    padding-left: 48px;
    counter-increment: step;
  }

  li::before {
    content: counter(step);
    position: absolute;
    top: -2px;
    left: 0;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--accent-fill);
    color: white;
    font-weight: 700;
  }

  h3 {
    margin: 0 0 6px;
    font-size: 16px;
  }

  li p {
    margin: 0 0 10px;
  }

  code {
    padding: 1px 5px;
    border-radius: 5px;
    background: var(--key);
    font-size: 0.9em;
  }

  .code {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;
    padding: 12px;
    border-radius: 10px;
    background: var(--key);
    box-shadow: inset 0 0 0 1px var(--border);
  }

  pre,
  .example {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow-x: auto;
    font-size: 12px;
  }

  .example {
    font-size: 14px;
    font-style: italic;
  }

  .code button {
    flex: none;
    min-width: 76px;
    min-height: 40px;
  }

  .warning {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--warning-bg);
    color: var(--warning);
  }

  .where {
    margin: 24px 0 0;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .where b {
    color: var(--text);
  }

  @media (max-width: 500px) {
    dialog {
      width: calc(100vw - 24px);
      max-height: 85dvh;
    }

    header {
      padding-left: 18px;
    }

    .body {
      padding: 0 18px 20px;
    }

    li {
      padding-left: 42px;
    }
  }
</style>
