import { describe, expect, it } from 'vitest';
import {
  BROWSER_PLACE,
  browserFolder,
  type StoredMap,
} from '../src/lib/browser-folder';
import { memoryStore } from '../src/lib/store';

const SAVED_AT = new Date('2026-01-02T10:00:00.000Z');

function openBrowserFolder(maps: Record<string, StoredMap> = {}) {
  const store = memoryStore(maps);
  return { folder: browserFolder(store, () => SAVED_AT), store };
}

describe('browser folder', () => {
  it('opens straight away, with no folder to choose', async () => {
    const { folder } = openBrowserFolder();
    expect(await folder.reopenFolder()).toBe(BROWSER_PLACE);
    expect(folder.chooseFolder).toBe(undefined);
  });

  it('reads back the maps it has saved', async () => {
    const { folder } = openBrowserFolder();
    await folder.writeMap('Ideas.json', '{}');
    expect(await folder.readMaps()).toEqual([
      { file: 'Ideas.json', text: '{}', modifiedAt: SAVED_AT.toISOString() },
    ]);
  });

  it('keeps a map’s contents when it is renamed', async () => {
    const { folder, store } = openBrowserFolder({
      'Ideas.json': { text: 'kept', modifiedAt: 'earlier' },
    });
    await folder.renameMap('Ideas.json', 'Plans.json');
    expect(await store.entries()).toEqual([
      ['Plans.json', { text: 'kept', modifiedAt: 'earlier' }],
    ]);
  });

  it('explains when a map to rename has gone', async () => {
    const { folder } = openBrowserFolder();
    await expect(folder.renameMap('Gone.json', 'New.json')).rejects.toThrow(
      'Gone.json is no longer in this browser.',
    );
  });

  it('deletes maps for good, as there is no trash', async () => {
    const { folder, store } = openBrowserFolder({
      'Ideas.json': { text: '{}', modifiedAt: 'earlier' },
    });
    await folder.removeMap('Ideas.json');
    expect(await store.entries()).toEqual([]);
    expect(folder.removesToTrash).toBe(false);
  });
});
