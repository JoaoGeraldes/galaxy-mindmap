<script lang="ts">
  import { onMount } from 'svelte';
  import MindMap from './components/MindMap.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Welcome from './components/Welcome.svelte';
  import {
    byTitle,
    fileNameFor,
    loadProjects,
    parseMap,
    serializeMap,
    type Project,
    type SavedMap,
  } from './lib/projects';
  import { formatMoment } from './lib/time';
  import { createNode } from './lib/tree';

  interface Status {
    kind: 'busy' | 'done' | 'error';
    text: string;
    /** When a finished action happened, shown so saves are verifiable. */
    at?: Date;
    detail?: string;
    retry?: () => void;
  }

  const LAST_FOLDER_KEY = 'mind-map:last-folder';

  // Undefined while the last folder is being reopened, so the welcome
  // screen doesn't flash up on every launch.
  let folder = $state<string | null | undefined>(undefined);
  let folderProblem = $state('');
  let projects = $state<Project[]>([]);
  let unreadable = $state<string[]>([]);
  let activeId = $state<string | null>(null);
  let newMapId = $state<string | null>(null);
  let status = $state<Status | null>(null);
  // File operations run one at a time, in order, so saves never race.
  let fileQueue = Promise.resolve();

  let activeIndex = $derived(projects.findIndex((p) => p.id === activeId));
  let active = $derived(projects[activeIndex]);

  onMount(async () => {
    const lastFolder = localStorage.getItem(LAST_FOLDER_KEY);
    if (lastFolder && (await window.files.openFolder(lastFolder))) {
      await openMaps(lastFolder);
      return;
    }
    if (lastFolder) {
      folderProblem = `“${lastFolder}” could not be found. It may have been moved, renamed or disconnected.`;
    }
    folder = null;
  });

  function errorMessage(error: unknown): string {
    // Electron wraps errors from the main process in a technical prefix.
    return String((error as Error)?.message ?? error).replace(
      /^Error invoking remote method '\w+': (Error: )?/,
      '',
    );
  }

  function enqueue(task: () => Promise<void>) {
    fileQueue = fileQueue.then(task);
  }

  function firstMapId(): string | null {
    return [...projects].sort(byTitle)[0]?.id ?? null;
  }

  async function chooseFolder() {
    await fileQueue;
    const chosen = await window.files.chooseFolder();
    if (chosen) await openMaps(chosen);
  }

  async function openMaps(path: string) {
    try {
      const loaded = loadProjects(await window.files.readMaps());
      projects = loaded.projects;
      unreadable = loaded.unreadable;
      activeId = firstMapId();
      newMapId = null;
      folder = path;
      folderProblem = '';
      status = null;
      localStorage.setItem(LAST_FOLDER_KEY, path);
    } catch (error) {
      folderProblem = `Couldn't open “${path}”: ${errorMessage(error)}`;
      folder = null;
    }
  }

  async function writeProject(project: Project) {
    // The map may have been deleted while this save was waiting its turn.
    if (!projects.some((p) => p.id === project.id)) return;
    const otherFiles = projects
      .filter((p) => p.id !== project.id)
      .map((p) => p.file);
    const file = fileNameFor(project.root.text, [...unreadable, ...otherFiles]);
    if (project.file && project.file !== file) {
      await window.files.renameMap(project.file, file);
    }
    project.file = file;
    project.updatedAt = new Date().toISOString();
    await window.files.writeMap(file, serializeMap(project));
  }

  function save(
    project: Project,
    describe = (file: string) => `All changes saved to ${file}`,
  ) {
    status = { kind: 'busy', text: 'Saving…' };
    enqueue(async () => {
      try {
        await writeProject(project);
        status = { kind: 'done', text: describe(project.file), at: new Date() };
      } catch (error) {
        status = {
          kind: 'error',
          text: `Couldn't save “${project.root.text}”`,
          detail: errorMessage(error),
          retry: () => save(project, describe),
        };
      }
    });
  }

  function addMap(map: SavedMap, describe: (file: string) => string) {
    projects.push({ id: crypto.randomUUID(), file: '', ...map });
    const project = projects[projects.length - 1];
    activeId = project.id;
    save(project, describe);
    return project;
  }

  function newMap() {
    const now = new Date().toISOString();
    const map = { createdAt: now, updatedAt: now, root: createNode('New map') };
    newMapId = addMap(map, (file) => `Created ${file}`).id;
  }

  function selectMap(id: string | null) {
    newMapId = null;
    activeId = id;
  }

  function deleteMap(id: string) {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const question = `Move “${project.root.text}” to the trash?\n\nYou can restore ${project.file} from there.`;
    if (!confirm(question)) return;
    status = { kind: 'busy', text: `Moving ${project.file} to the trash…` };
    enqueue(async () => {
      try {
        if (project.file) await window.files.trashMap(project.file);
        projects = projects.filter((p) => p.id !== id);
        if (activeId === id) selectMap(firstMapId());
        status = {
          kind: 'done',
          text: `Moved ${project.file} to the trash`,
          at: new Date(),
        };
      } catch (error) {
        status = {
          kind: 'error',
          text: `Couldn't move ${project.file} to the trash`,
          detail: errorMessage(error),
        };
      }
    });
  }

  async function importFile(file: File) {
    try {
      // An imported map keeps its original creation time.
      const map = parseMap(await file.text());
      addMap(map, (saved) => `Imported ${file.name} as ${saved}`);
    } catch (error) {
      status = {
        kind: 'error',
        text: `Couldn't import ${file.name}`,
        detail: errorMessage(error),
      };
    }
  }

  function exportActive() {
    if (!active) return;
    const blob = new Blob([serializeMap(active)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = active.file;
    link.click();
    URL.revokeObjectURL(link.href);
  }
</script>

<svelte:head>
  <title>{active ? `${active.root.text} — Mind Map` : 'Mind Map'}</title>
</svelte:head>

{#if folder === null}
  <Welcome problem={folderProblem} onchoose={chooseFolder} />
{:else if folder}
  <div class="app">
    <Sidebar
      {folder}
      {projects}
      {unreadable}
      {activeId}
      onselect={selectMap}
      oncreate={newMap}
      ondelete={deleteMap}
      onexport={exportActive}
      onimport={importFile}
      onchangefolder={chooseFolder}
      onshowfolder={() => window.files.showFolder()}
    />

    <div class="canvas">
      {#if active}
        {#key activeId}
          <MindMap
            bind:root={projects[activeIndex].root}
            onchange={() => save(projects[activeIndex])}
            editRootOnStart={activeId === newMapId}
          />
        {/key}
      {:else}
        <div class="empty">
          <h2>No mind maps in this folder yet</h2>
          <p>Each map you create is saved here as its own .json file.</p>
          <button class="primary" onclick={newMap}>
            Create your first map
          </button>
        </div>
      {/if}

      {#if status}
        <div class="status {status.kind}" role="status">
          <span>
            {status.text}
            {#if status.at}
              at
              <time
                datetime={status.at.toISOString()}
                title={status.at.toLocaleString()}
              >
                {formatMoment(status.at)}
              </time>
            {/if}
          </span>
          {#if status.detail}
            <span class="detail">{status.detail}</span>
          {/if}
          {#if status.retry}
            <button onclick={status.retry}>Retry</button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .app {
    display: flex;
    height: 100%;
  }

  .canvas {
    position: relative;
    display: flex;
    flex: 1;
  }

  .empty {
    margin: auto;
    text-align: center;
  }

  .empty h2 {
    margin: 0 0 8px;
    font-size: 20px;
  }

  .empty p {
    margin: 0 0 16px;
    color: #78716c;
  }

  .status {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 420px;
    padding: 6px 12px;
    border-radius: 999px;
    background: white;
    box-shadow: 0 1px 4px rgb(0 0 0 / 0.1);
    font-size: 13px;
    color: #57534e;
  }

  .status::before {
    content: '';
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .busy::before {
    background: #a8a29e;
    animation: pulse 1s ease-in-out infinite;
  }

  .done::before {
    background: #2f9e44;
  }

  .error {
    flex-wrap: wrap;
    border-radius: 12px;
    background: #fef2f2;
    color: #b91c1c;
  }

  .error::before {
    background: #dc2626;
  }

  .detail {
    flex-basis: 100%;
    font-size: 12px;
    opacity: 0.8;
  }

  .status button {
    padding: 2px 10px;
    font-size: 13px;
  }

  @keyframes pulse {
    50% {
      opacity: 0.3;
    }
  }
</style>
