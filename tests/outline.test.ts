import { describe, expect, it } from 'vitest';
import { OUTLINE_LIMITS, mapFromOutline } from '../src/lib/outline';
import { parseMap, serializeMap } from '../src/lib/projects';

const NOW = new Date('2026-11-01T16:00:00.000Z');

describe('outline', () => {
  it('turns a title and nested ideas into a map', () => {
    const map = mapFromOutline(
      'Trip',
      [
        { text: 'Packing', children: [{ text: 'Passport' }] },
        { text: 'Budget' },
      ],
      NOW,
    );
    expect(map.root.text).toBe('Trip');
    expect(map.root.children.map((child) => child.text)).toEqual([
      'Packing',
      'Budget',
    ]);
    expect(map.root.children[0].children[0].text).toBe('Passport');
  });

  it('makes maps the app can open, stamped with when they were made', () => {
    const map = mapFromOutline('Trip', [{ text: 'Packing' }], NOW);
    expect(parseMap(serializeMap(map))).toEqual(map);
    expect(map.createdAt).toBe(NOW.toISOString());
  });

  it('trims stray spaces from every idea', () => {
    const map = mapFromOutline('  Trip ', [{ text: ' Packing  ' }], NOW);
    expect([map.root.text, map.root.children[0].text]).toEqual([
      'Trip',
      'Packing',
    ]);
  });

  it('explains what is wrong with a malformed outline', () => {
    expect(() => mapFromOutline('', [], NOW)).toThrow('The title needs');
    expect(() => mapFromOutline('Trip', [{ text: 3 }], NOW)).toThrow(
      'Every idea needs some text.',
    );
    expect(() => mapFromOutline('Trip', 'Packing', NOW)).toThrow(
      'Ideas must be given as lists.',
    );
  });

  it('refuses maps too big or too deep to read', () => {
    const many = Array.from({ length: OUTLINE_LIMITS.ideas + 1 }, () => ({
      text: 'Idea',
    }));
    expect(() => mapFromOutline('Trip', many, NOW)).toThrow('at most');

    let deep: object[] = [{ text: 'Bottom' }];
    for (let i = 0; i < OUTLINE_LIMITS.depth; i++) {
      deep = [{ text: 'Level', children: deep }];
    }
    expect(() => mapFromOutline('Trip', deep, NOW)).toThrow('levels deep');
  });
});
