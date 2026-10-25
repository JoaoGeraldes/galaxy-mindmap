<script lang="ts">
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
    onchangefolder: () => void;
    onshowfolder: () => void;
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

  let sorted = $derived([...projects].sort(byTitle));
  let folderName = $derived(folder.split(/[\\/]/).filter(Boolean).pop());
  let unreadableNote = $derived(
    unreadable.length === 1
      ? "1 file in this folder isn't a readable mind map and was skipped."
      : `${unreadable.length} files in this folder aren't readable mind maps and were skipped.`,
  );

  function pickFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) onimport(file);
    // Cleared so picking the same file again still fires a change.
    input.value = '';
  }
</script>

<aside>
  <header>
    <h1>Mind Map</h1>
    <div class="folder" title={folder}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 6h6l2 2h10v11H3z" />
      </svg>
      <span class="folder-name">{folderName}</span>
      <button class="link" onclick={onshowfolder} title="Open in file explorer">
        Show
      </button>
      <button class="link" onclick={onchangefolder} title="Use another folder">
        Change
      </button>
    </div>
    <button class="primary new" onclick={oncreate}>+ New map</button>
  </header>

  <ul>
    {#each sorted as project (project.id)}
      <li class:active={project.id === activeId}>
        <button class="name" onclick={() => onselect(project.id)}>
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
    <label class="button" title="Copy a mind map file into this folder">
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
</aside>

<style>
  aside {
    display: flex;
    flex-direction: column;
    width: 260px;
    border-right: 1px solid #e7e5e4;
    background: #f5f5f4;
  }

  header {
    padding: 16px;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 18px;
  }

  .folder {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    font-size: 13px;
    color: #57534e;
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
    color: #1c7ed6;
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

  li.active {
    background: white;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
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
    color: #a8a29e;
  }

  .delete {
    color: #a8a29e;
    visibility: hidden;
  }

  li:hover .delete,
  .delete:focus-visible {
    visibility: visible;
  }

  .delete:hover {
    color: #dc2626;
  }

  .unreadable {
    margin: 8px 16px 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: #fffbeb;
    color: #92400e;
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
