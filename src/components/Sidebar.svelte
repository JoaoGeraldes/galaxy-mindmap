<script lang="ts">
  import logo from '../assets/logo.svg';
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
    <img class="logo" src={logo} alt="Mind Map" />
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
        <h1><img class="logo" src={logo} alt="" />Mind Map</h1>
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
            ×
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
  {/if}
</aside>

<style>
  aside {
    display: flex;
    flex: none;
    flex-direction: column;
    width: 260px;
    border-right: 1px solid var(--border);
    background: var(--surface);
    box-shadow: 1px 0 24px rgb(124 58 237 / 0.12);
    transition: width 0.2s ease;
  }

  aside.collapsed {
    align-items: center;
    gap: 8px;
    width: 56px;
    padding-top: 12px;
  }

  .icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
  }

  .icon svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  header {
    padding: 16px;
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
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
    margin-bottom: 12px;
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
    padding: 2px 4px;
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
  }

  ul {
    flex: 1;
    margin: 0;
    padding: 0 8px;
    list-style: none;
    overflow-y: auto;
  }

  li {
    display: flex;
    border-radius: 8px;
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
    min-width: 0;
    text-align: left;
  }

  .title,
  .file {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file {
    font-size: 12px;
    color: var(--text-muted);
  }

  .delete {
    color: var(--text-muted);
    visibility: hidden;
  }

  li:hover .delete,
  .delete:focus-visible {
    visibility: visible;
  }

  .delete:hover {
    color: var(--danger);
  }

  .unreadable {
    margin: 8px 16px 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--warning-bg);
    color: var(--warning);
    font-size: 12px;
    line-height: 1.4;
  }

  footer {
    display: flex;
    gap: 8px;
    padding: 16px;
  }

  footer > * {
    flex: 1;
    padding: 6px 4px;
    text-align: center;
  }
</style>
