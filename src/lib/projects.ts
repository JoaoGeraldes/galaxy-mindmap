import { createNode, type MindNode } from './tree';

/** A project is one mind map; its central topic doubles as its name. */
export interface Project {
  id: string;
  root: MindNode;
}

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'mind-map:projects';
const FILE_VERSION = 1;

export function createProject(name: string): Project {
  return { id: crypto.randomUUID(), root: createNode(name) };
}

export function loadProjects(
  storage: KeyValueStorage = localStorage,
): Project[] {
  const saved = storage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function saveProjects(
  projects: Project[],
  storage: KeyValueStorage = localStorage,
) {
  storage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function exportProject(project: Project): string {
  return JSON.stringify({ version: FILE_VERSION, root: project.root }, null, 2);
}

export function importProject(json: string): Project {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const root = (data as { root?: unknown } | null)?.root;
  if (!isMindNode(root)) {
    throw new Error('This file does not contain a mind map.');
  }
  // A fresh id lets the same file be imported twice as separate projects.
  return { id: crypto.randomUUID(), root };
}

function isMindNode(value: unknown): value is MindNode {
  if (typeof value !== 'object' || value === null) return false;
  const { id, text, children } = value as Record<string, unknown>;
  return (
    typeof id === 'string' &&
    typeof text === 'string' &&
    Array.isArray(children) &&
    children.every(isMindNode)
  );
}
