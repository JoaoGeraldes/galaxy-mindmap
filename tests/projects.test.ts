import { describe, expect, it } from 'vitest';
import {
  createProject,
  exportProject,
  importProject,
  loadProjects,
  saveProjects,
} from '../src/lib/projects';
import { addChild } from '../src/lib/tree';

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

describe('projects', () => {
  it('starts a new project with its name as the central topic', () => {
    const project = createProject('Holiday plans');
    expect(project.root.text).toBe('Holiday plans');
    expect(project.root.children).toEqual([]);
  });

  it('loads no projects from empty storage', () => {
    expect(loadProjects(memoryStorage())).toEqual([]);
  });

  it('loads saved projects back unchanged', () => {
    const storage = memoryStorage();
    const project = createProject('Ideas');
    addChild(project.root, project.root.id, 'First idea');
    saveProjects([project], storage);
    expect(loadProjects(storage)).toEqual([project]);
  });

  it('imports an exported project as a new project with the same map', () => {
    const project = createProject('Ideas');
    addChild(project.root, project.root.id, 'First idea');
    const imported = importProject(exportProject(project));
    expect(imported.root).toEqual(project.root);
    expect(imported.id).not.toBe(project.id);
  });

  it('rejects a file that is not valid JSON', () => {
    expect(() => importProject('{ nope')).toThrow(
      'This file is not valid JSON.',
    );
  });

  it('rejects JSON that does not contain a mind map', () => {
    expect(() => importProject('{"root": {"text": 1}}')).toThrow(
      'This file does not contain a mind map.',
    );
    expect(() => importProject('null')).toThrow(
      'This file does not contain a mind map.',
    );
  });
});
