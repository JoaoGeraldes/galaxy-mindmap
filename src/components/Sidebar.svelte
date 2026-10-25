<script lang="ts">
  import type { Project } from '../lib/projects';

  interface Props {
    projects: Project[];
    activeId: string;
    onselect: (id: string) => void;
    oncreate: () => void;
    ondelete: (id: string) => void;
    onexport: () => void;
    onimport: (file: File) => void;
  }

  let {
    projects,
    activeId,
    onselect,
    oncreate,
    ondelete,
    onexport,
    onimport,
  }: Props = $props();

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
    <button class="new" onclick={oncreate}>+ New map</button>
  </header>

  <ul>
    {#each projects as project (project.id)}
      <li class:active={project.id === activeId}>
        <button class="name" onclick={() => onselect(project.id)}>
          {project.root.text}
        </button>
        <button
          class="delete"
          title="Delete map"
          onclick={() => ondelete(project.id)}>×</button
        >
      </li>
    {/each}
  </ul>

  <footer>
    <button onclick={onexport}>Export JSON</button>
    <label class="button">
      Import JSON
      <input
        type="file"
        accept=".json,application/json"
        hidden
        onchange={pickFile}
      />
    </label>
  </footer>
</aside>

<style>
  aside {
    display: flex;
    flex-direction: column;
    width: 240px;
    border-right: 1px solid #e7e5e4;
    background: #f5f5f4;
  }

  header {
    padding: 16px;
  }

  h1 {
    margin: 0 0 12px;
    font-size: 18px;
  }

  .new {
    width: 100%;
    background: #1f2937;
    border-color: #1f2937;
    color: white;
  }

  .new:hover {
    background: #374151;
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
    flex: 1;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .delete {
    color: #a8a29e;
    visibility: hidden;
  }

  li:hover .delete {
    visibility: visible;
  }

  .delete:hover {
    color: #dc2626;
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
