import type { MindNode } from './tree';

/** What a map file holds. Timestamps are ISO 8601 strings. */
export interface SavedMap {
  createdAt: string;
  updatedAt: string;
  root: MindNode;
}

/** A project is one mind map saved as one file; its central topic names it. */
export interface Project extends SavedMap {
  id: string;
  file: string;
}

export interface MapFile {
  file: string;
  text: string;
  /** When the file was last written, as reported by the file system. */
  modifiedAt: string;
}

const FILE_VERSION = 2;
const FALLBACK_NAME = 'Untitled';
// Characters Windows forbids in file names, plus control characters.
const UNSAFE_CHARACTERS = /[<>:"/\\|?*\u0000-\u001f]/g;

export function serializeMap({ createdAt, updatedAt, root }: SavedMap): string {
  const data = { version: FILE_VERSION, createdAt, updatedAt, root };
  return JSON.stringify(data, null, 2);
}

/**
 * Reads a map file. Files saved before timestamps existed get
 * `fallbackTime` instead, which is the best guess available.
 */
export function parseMap(
  text: string,
  fallbackTime = new Date().toISOString(),
): SavedMap {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const { root, createdAt, updatedAt } = (data ?? {}) as Record<
    string,
    unknown
  >;
  if (!isMindNode(root)) {
    throw new Error('This file does not contain a mind map.');
  }
  return {
    createdAt: isTimestamp(createdAt) ? createdAt : fallbackTime,
    updatedAt: isTimestamp(updatedAt) ? updatedAt : fallbackTime,
    root,
  };
}

/** Turns folder files into projects, keeping the names of unreadable ones. */
export function loadProjects(files: MapFile[]) {
  const projects: Project[] = [];
  const unreadable: string[] = [];
  for (const { file, text, modifiedAt } of files) {
    try {
      const map = parseMap(text, modifiedAt);
      projects.push({ id: crypto.randomUUID(), file, ...map });
    } catch {
      unreadable.push(file);
    }
  }
  return { projects, unreadable };
}

export function byTitle(a: Project, b: Project): number {
  return a.root.text.localeCompare(b.root.text, undefined, {
    sensitivity: 'base',
  });
}

/** A file name matching the map title that doesn't clash with `taken`. */
export function fileNameFor(title: string, taken: string[]): string {
  const base = title.replace(UNSAFE_CHARACTERS, '').trim() || FALLBACK_NAME;
  // Windows and macOS treat names that differ only in case as the same file.
  const isTaken = (name: string) =>
    taken.some((file) => file.toLowerCase() === name.toLowerCase());
  let name = `${base}.json`;
  for (let copy = 2; isTaken(name); copy++) name = `${base} (${copy}).json`;
  return name;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
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
