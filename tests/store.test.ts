import { describe, expect, it } from 'vitest';
import { memoryStore } from '../src/lib/store';

describe('memory store', () => {
  it('starts with the values it is given', async () => {
    const store = memoryStore({ theme: 'dark' });
    expect(await store.get('theme')).toBe('dark');
  });

  it('remembers, replaces and forgets values', async () => {
    const store = memoryStore<string>();
    await store.set('theme', 'dark');
    await store.set('theme', 'light');
    expect(await store.entries()).toEqual([['theme', 'light']]);
    await store.delete('theme');
    expect(await store.get('theme')).toBe(undefined);
  });
});
