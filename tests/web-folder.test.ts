import { describe, expect, it } from 'vitest';
import type { StoredValue } from '../src/lib/folder';
import { webFolder, type Directory } from '../src/lib/web-folder';

/** An in-memory folder; names clash ignoring case, as on Windows and macOS. */
function fakeDirectory(
  files: Record<string, string> = {},
  permission: PermissionState = 'granted',
) {
  const contents = new Map(Object.entries(files));
  const find = (name: string) =>
    [...contents.keys()].find((k) => k.toLowerCase() === name.toLowerCase());

  const directory: Directory = {
    name: 'Maps',
    async *values() {
      for (const name of contents.keys()) yield { kind: 'file', name };
      yield { kind: 'directory', name: 'Archive.json' };
    },
    async getFileHandle(name, options) {
      const existing = find(name);
      if (!existing && !options?.create) throw new Error(`No ${name}`);
      const key = existing ?? name;
      return {
        getFile: async () => ({
          text: async () => contents.get(key) ?? '',
          lastModified: Date.UTC(2026, 0, 2),
        }),
        createWritable: async () => ({
          write: async (text) => void contents.set(key, text),
          close: async () => {},
        }),
      };
    },
    async removeEntry(name) {
      contents.delete(find(name) ?? name);
    },
    queryPermission: async () => permission,
  };
  return { directory, contents };
}

function memory<T>(value?: T): StoredValue<T> & { value?: T } {
  return {
    value,
    async load() {
      return this.value;
    },
    async save(next) {
      this.value = next;
    },
  };
}

async function openFolder(files: Record<string, string> = {}) {
  const fake = fakeDirectory(files);
  const folder = webFolder(async () => fake.directory, memory());
  await folder.chooseFolder();
  return { folder, contents: fake.contents };
}

describe('web folder', () => {
  it('opens the chosen folder by name and remembers it', async () => {
    const { directory } = fakeDirectory();
    const lastDirectory = memory<Directory>();
    const folder = webFolder(async () => directory, lastDirectory);
    expect(await folder.chooseFolder()).toBe('Maps');
    expect(lastDirectory.value).toBe(directory);
  });

  it('treats closing the folder picker as cancelling', async () => {
    const cancel = async (): Promise<Directory> => {
      throw new DOMException('The user aborted a request.', 'AbortError');
    };
    expect(await webFolder(cancel, memory()).chooseFolder()).toBeNull();
  });

  it('reopens the remembered folder while access is still granted', async () => {
    const { directory } = fakeDirectory();
    const folder = webFolder(async () => directory, memory(directory));
    expect(await folder.reopenFolder()).toBe('Maps');
  });

  it('asks for the folder again once access has lapsed', async () => {
    const { directory } = fakeDirectory({}, 'prompt');
    const folder = webFolder(async () => directory, memory(directory));
    expect(await folder.reopenFolder()).toBeNull();
  });

  it('reads only the .json files in the folder', async () => {
    const { folder } = await openFolder({
      'Ideas.json': '{}',
      'notes.txt': '',
    });
    expect(await folder.readMaps()).toEqual([
      {
        file: 'Ideas.json',
        text: '{}',
        modifiedAt: '2026-01-02T00:00:00.000Z',
      },
    ]);
  });

  it('writes, renames and deletes maps', async () => {
    const { folder, contents } = await openFolder();
    await folder.writeMap('Ideas.json', 'first');
    await folder.renameMap('Ideas.json', 'Plans.json');
    expect(Object.fromEntries(contents)).toEqual({ 'Plans.json': 'first' });
    await folder.removeMap('Plans.json');
    expect(contents.size).toBe(0);
    expect(folder.removesToTrash).toBe(false);
  });

  it('keeps a map whose name only changes case', async () => {
    const { folder, contents } = await openFolder({ 'ideas.json': 'kept' });
    await folder.renameMap('ideas.json', 'Ideas.json');
    expect(Object.fromEntries(contents)).toEqual({ 'Ideas.json': 'kept' });
  });

  it('refuses to touch files before a folder is open', async () => {
    const folder = webFolder(async () => fakeDirectory().directory, memory());
    await expect(folder.readMaps()).rejects.toThrow('No folder is open.');
  });
});
