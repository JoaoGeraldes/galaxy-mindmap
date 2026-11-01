<script lang="ts">
  import logo from '../assets/logo.svg';
  import { WEBSITE_URL } from '../lib/config';
  import { byTitle, type Project } from '../lib/projects';

  interface Props {
    folder: string;
    projects: Project[];
    unreadable: string[];
    activeId: string | null;
    onselect: (id: string) => void;
    oncreate: () => void;
    ondelete: (id: string) => void;
    onexport: () => void;
    onimport: (file: File) => void;
    /** Absent where maps live in one fixed place. */
    onchangefolder?: () => void;
    /** Absent where there's no file explorer to show the folder in. */
    onshowfolder?: () => void;
    /** Absent where AI apps can't reach the maps (the web version). */
    onconnectai?: () => void;
  }

  let {
    folder,
    projects,
    unreadable,
    activeId,
    onselect,
    oncreate,
    ondelete,
    onexport,
    onimport,
    onchangefolder,
    onshowfolder,
    onconnectai,
  }: Props = $props();

  // Phones start with the list tucked away, leaving room for the map.
  const isNarrow = () => matchMedia('(max-width: 700px)').matches;
  let collapsed = $state(isNarrow());

  let sorted = $derived([...projects].sort(byTitle));
  let folderName = $derived(folder.split(/[\\/]/).filter(Boolean).pop());
  let unreadableNote = $derived(
    unreadable.length === 1
      ? "1 file in this folder isn't a readable mind map and was skipped."
      : `${unreadable.length} files in this folder aren't readable mind maps and were skipped.`,
  );

  function select(id: string) {
    onselect(id);
    if (isNarrow()) collapsed = true;
  }

  function pickFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) onimport(file);
    // Cleared so picking the same file again still fires a change.
    input.value = '';
  }
</script>

<aside class:collapsed>
  {#if collapsed}
    <img class="logo" src={logo} alt="Galaxy Mind Map" />
    <button
      class="icon"
      onclick={() => (collapsed = false)}
      title="Show maps"
      aria-label="Show maps"
      aria-expanded="false"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg
      >
    </button>
    <button
      class="icon primary"
      onclick={oncreate}
      title="New map"
      aria-label="New map"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"
        ><path d="M12 5v14M5 12h14" /></svg
      >
    </button>
  {:else}
    <header>
      <div class="title-row">
        <h1><img class="logo" src={logo} alt="" />Galaxy Mind Map</h1>
        <button
          class="icon"
          onclick={() => (collapsed = true)}
          title="Hide maps"
          aria-label="Hide maps"
          aria-expanded="true"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"
            ><path d="m15 6-6 6 6 6" /></svg
          >
        </button>
      </div>
      <div class="folder" title={folder}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h6l2 2h10v11H3z" />
        </svg>
        <span class="folder-name">{folderName}</span>
        {#if onshowfolder}
          <button
            class="link"
            onclick={onshowfolder}
            title="Open in file explorer"
          >
            Show
          </button>
        {/if}
        {#if onchangefolder}
          <button
            class="link"
            onclick={onchangefolder}
            title="Use another folder"
          >
            Change
          </button>
        {/if}
      </div>
      <button class="primary new" onclick={oncreate}>+ New map</button>
    </header>

    <ul>
      {#each sorted as project (project.id)}
        <li class:active={project.id === activeId}>
          <button class="name" onclick={() => select(project.id)}>
            <span class="title">{project.root.text}</span>
            <span class="file">{project.file || 'Saving…'}</span>
          </button>
          <button
            class="delete"
            title="Move to trash"
            aria-label="Move {project.root.text} to trash"
            onclick={() => ondelete(project.id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
            </svg>
          </button>
        </li>
      {/each}
    </ul>

    {#if unreadable.length}
      <p class="unreadable" title={unreadable.join('\n')}>{unreadableNote}</p>
    {/if}

    <footer>
      <label class="button" title="Add a mind map from a file">
        Import…
        <input
          type="file"
          accept=".json,application/json"
          hidden
          onchange={pickFile}
        />
      </label>
      <button
        onclick={onexport}
        disabled={!activeId}
        title="Save a copy of this map somewhere else"
      >
        Export…
      </button>
    </footer>
    {#if onconnectai}
      <button class="connect" onclick={onconnectai}>
        <svg viewBox="0 0 24 24" aria-hidden="true"
          ><path
            d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"
          /></svg
        >
        <span class="connect-text">
          Connect to Claude
          <small>MCP server · works with other AI apps too</small>
        </span>
      </button>
    {/if}
    <a class="about" href={WEBSITE_URL} target="_blank" rel="noreferrer">
      About Galaxy Mind Map ↗
    </a>
  {/if}
</aside>

<style>
  aside {
    /* Comfortable for a mouse; touch screens get more below. */
    --tap: 44px;
    display: flex;
    flex: none;
    flex-direction: column;
    width: 280px;
    border-right: 1px solid var(--border);
    background: var(--surface);
    box-shadow: 1px 0 24px rgb(124 58 237 / 0.12);
    transition: width 0.2s ease;
  }

  /* Fingers are bigger and less precise than a pointer. */
  @media (pointer: coarse) {
    aside {
      --tap: 48px;
    }
  }

  aside.collapsed {
    align-items: center;
    gap: 16px;
    width: calc(var(--tap) + 20px);
    padding-top: 14px;
  }

  .icon {
    display: grid;
    place-items: center;
    width: var(--tap);
    height: var(--tap);
    padding: 0;
  }

  .icon svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  header {
    padding: 16px 16px 20px;
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .title-row .icon {
    border: none;
    background: none;
    color: var(--text-muted);
  }

  .title-row .icon:hover {
    background: var(--hover);
    color: var(--text);
  }

  h1 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 18px;
  }

  .logo {
    width: 28px;
    height: 28px;
    filter: drop-shadow(0 0 6px rgb(166 23 255 / 0.6));
  }

  .folder {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 16px;
    font-size: 13px;
    color: var(--text-muted);
  }

  .folder svg {
    flex: none;
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .folder-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  .link {
    min-height: 36px;
    padding: 0 8px;
    border: none;
    background: none;
    color: var(--accent);
    font-size: 13px;
  }

  .link:hover {
    background: none;
    text-decoration: underline;
  }

  .new {
    width: 100%;
    min-height: var(--tap);
    font-size: 15px;
  }

  ul {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0 12px;
    list-style: none;
    overflow-y: auto;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 10px;
  }

  li:hover {
    background: var(--hover);
  }

  li.active {
    background: rgb(124 58 237 / 0.22);
    box-shadow: inset 0 0 0 1px var(--border-strong);
  }

  li button {
    border: none;
    background: none;
  }

  .name {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    min-height: calc(var(--tap) + 12px);
    padding: 8px 12px;
    text-align: left;
  }

  .title,
  .file {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title {
    font-size: 15px;
  }

  .file {
    font-size: 12px;
    color: var(--text-muted);
  }

  .delete {
    flex: none;
    width: var(--tap);
    height: var(--tap);
    margin-right: 4px;
    padding: 0;
    border-radius: 8px;
    color: var(--text-muted);
    visibility: hidden;
  }

  .delete svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  li:hover .delete,
  .delete:focus-visible {
    visibility: visible;
  }

  /* Without hover, the delete button has to stay visible to be usable. */
  @media (hover: none) {
    .delete {
      visibility: visible;
    }
  }

  .delete:hover {
    color: var(--danger);
    background: var(--danger-bg);
  }

  .unreadable {
    margin: 12px 16px 0;
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--warning-bg);
    color: var(--warning);
    font-size: 12px;
    line-height: 1.4;
  }

  footer {
    display: flex;
    gap: 12px;
    padding: 16px 16px 8px;
  }

  footer > * {
    display: grid;
    flex: 1;
    place-items: center;
    min-height: var(--tap);
    box-sizing: border-box;
    padding: 0 8px;
  }

  .connect {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: var(--tap);
    margin: 0 16px 4px;
    padding: 8px 12px;
    border-style: dashed;
    background: none;
    color: var(--accent);
  }

  .connect svg {
    flex: none;
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linejoin: round;
  }

  .connect-text {
    display: flex;
    flex-direction: column;
    text-align: left;
    line-height: 1.3;
  }

  .connect small {
    color: var(--text-muted);
    font-size: 11px;
  }

  .about {
    display: grid;
    place-items: center;
    min-height: 36px;
    margin-bottom: env(safe-area-inset-bottom);
    padding-bottom: 8px;
    color: var(--text-muted);
    font-size: 12px;
    text-decoration: none;
  }

  .about:hover {
    color: var(--accent);
  }
</style>
