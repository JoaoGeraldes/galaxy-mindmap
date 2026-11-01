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
const FALLBACK_NAME = 'untitled';
// Keeps names well clear of path length limits on Windows.
const MAX_NAME_LENGTH = 60;
// Letters Unicode can't split into a plain letter plus an accent.
const SPECIAL_LETTERS: Record<string, string> = {
  ß: 'ss',
  æ: 'ae',
  œ: 'oe',
  ø: 'o',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ı: 'i',
};

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

/**
 * Turns a title into plain lowercase English letters, digits and dashes,
 * safe on every system: "Ação à vista!" becomes "acao-a-vista".
 */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[ßæœøłđðþı]/g, (letter) => SPECIAL_LETTERS[letter])
      // Splits "ã" into "a" plus a separate accent mark, then drops the mark.
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, MAX_NAME_LENGTH)
      .replace(/^-+|-+$/g, '')
  );
}

/** A file name matching the map title that doesn't clash with `taken`. */
export function fileNameFor(title: string, taken: string[]): string {
  const base = slugify(title) || FALLBACK_NAME;
  // Windows and macOS treat names that differ only in case as the same file.
  const isTaken = (name: string) =>
    taken.some((file) => file.toLowerCase() === name.toLowerCase());
  let name = `${base}.json`;
  for (let copy = 2; isTaken(name); copy++) name = `${base}-${copy}.json`;
  return name;
}

/**
 * The name for an exported copy: the map's file name plus when it was
 * exported, written in the person's own date order, so copies are easy to
 * tell apart. Leaving out `locale` uses the system's.
 */
export function exportFileName(
  file: string,
  when: Date,
  { locale, timeZone }: { locale?: string; timeZone?: string } = {},
): string {
  const stamp = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    // A 24-hour clock in Latin digits: some languages write AM/PM in their
    // own script, which wouldn't survive in a safe file name.
    hourCycle: 'h23',
    numberingSystem: 'latn',
    timeZone,
  }).format(when);
  const name = file.replace(/\.json$/, '') || FALLBACK_NAME;
  return `${name}-${slugify(stamp)}.json`;
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
