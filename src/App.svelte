<script lang="ts">
  import MindMap from './components/MindMap.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import {
    createProject,
    exportProject,
    importProject,
    loadProjects,
    saveProjects,
    type Project,
  } from './lib/projects';

  const saved = loadProjects();
  const initial = saved.length ? saved : [createProject('My first map')];

  let projects = $state(initial);
  let activeId = $state(initial[0].id);
  let activeIndex = $derived(
    Math.max(
      0,
      projects.findIndex((project) => project.id === activeId),
    ),
  );

  $effect(() => saveProjects(projects));

  function addProject(project: Project) {
    projects.push(project);
    activeId = project.id;
  }

  function deleteProject(id: string) {
    const project = projects.find((p) => p.id === id);
    if (!project || !confirm(`Delete "${project.root.text}"?`)) return;
    projects = projects.filter((p) => p.id !== id);
    if (projects.length === 0) projects.push(createProject('My first map'));
    if (activeId === id) activeId = projects[0].id;
  }

  function exportActive() {
    const project = projects[activeIndex];
    const blob = new Blob([exportProject(project)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project.root.text}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importFile(file: File) {
    try {
      addProject(importProject(await file.text()));
    } catch (error) {
      alert((error as Error).message);
    }
  }
</script>

<div class="app">
  <Sidebar
    {projects}
    {activeId}
    onselect={(id) => (activeId = id)}
    oncreate={() => addProject(createProject('New map'))}
    ondelete={deleteProject}
    onexport={exportActive}
    onimport={importFile}
  />
  {#key activeId}
    <MindMap bind:root={projects[activeIndex].root} />
  {/key}
</div>

<style>
  .app {
    display: flex;
    height: 100%;
  }
</style>
