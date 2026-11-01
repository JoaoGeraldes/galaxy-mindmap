import { describe, expect, it } from 'vitest';
import { PALETTES } from '../src/lib/config';
import {
  defaultPreferences,
  mapLook,
  readPreferences,
} from '../src/lib/preferences';

const SYSTEM = { reducedMotion: false, prefersLight: false };
const DEFAULTS = defaultPreferences(SYSTEM);

describe('preferences', () => {
  it('starts from what the system asks for', () => {
    const calmLight = defaultPreferences({
      reducedMotion: true,
      prefersLight: true,
    });
    expect(calmLight.reduceMotion).toBe(true);
    expect(calmLight.theme).toBe('light');
    expect(DEFAULTS.theme).toBe('dark');
  });

  it('reads back what was saved', () => {
    const saved = { ...DEFAULTS, theme: 'light', textSize: 'larger' };
    expect(readPreferences(JSON.stringify(saved), DEFAULTS)).toEqual(saved);
  });

  it('uses the defaults when nothing was saved', () => {
    expect(readPreferences(null, DEFAULTS)).toEqual(DEFAULTS);
  });

  it('ignores damaged saves and unknown values', () => {
    expect(readPreferences('{ broken', DEFAULTS)).toEqual(DEFAULTS);
    const odd = JSON.stringify({ theme: 'neon', beams: 'yes', textSize: 9 });
    expect(readPreferences(odd, DEFAULTS)).toEqual(DEFAULTS);
  });

  it('picks the palette for the chosen colours and theme', () => {
    const look = mapLook({
      ...DEFAULTS,
      colours: 'colourBlindSafe',
      theme: 'light',
      textSize: 'large',
    });
    expect(look.palette).toBe(PALETTES.colourBlindSafe.light);
    expect(look.textScale).toBe(1.2);
  });
});
