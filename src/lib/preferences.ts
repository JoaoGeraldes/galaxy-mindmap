import { PALETTES, TEXT_SIZES } from './config';

/** How each person likes the app to look and move, kept per device. */
export interface Preferences {
  theme: 'dark' | 'light';
  textSize: keyof typeof TEXT_SIZES;
  colours: keyof typeof PALETTES;
  reduceMotion: boolean;
  /** The lights that travel along the strings. */
  beams: boolean;
}

/** Where preferences are kept; reading is instant so nothing flickers. */
export interface PreferenceStore {
  load(): Preferences;
  save(preferences: Preferences): void;
}

/** What the system already says about the person's needs. */
export interface SystemSettings {
  reducedMotion: boolean;
  prefersLight: boolean;
}

export function defaultPreferences(system: SystemSettings): Preferences {
  return {
    theme: system.prefersLight ? 'light' : 'dark',
    textSize: 'normal',
    colours: 'vivid',
    reduceMotion: system.reducedMotion,
    beams: true,
  };
}

/**
 * Reads saved preferences, keeping the defaults for anything missing or
 * unrecognised, so older or damaged saves never break the app.
 */
export function readPreferences(
  saved: string | null,
  defaults: Preferences,
): Preferences {
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(saved ?? '{}') ?? {};
  } catch {
    // Unreadable saves fall back to the defaults below.
  }
  const pick = <T>(value: unknown, allowed: readonly T[], fallback: T) =>
    allowed.includes(value as T) ? (value as T) : fallback;
  const keys = <T extends object>(object: T) =>
    Object.keys(object) as (keyof T)[];
  return {
    theme: pick(data.theme, ['dark', 'light'] as const, defaults.theme),
    textSize: pick(data.textSize, keys(TEXT_SIZES), defaults.textSize),
    colours: pick(data.colours, keys(PALETTES), defaults.colours),
    reduceMotion: pick(data.reduceMotion, [true, false], defaults.reduceMotion),
    beams: pick(data.beams, [true, false], defaults.beams),
  };
}

/** The colours and text scale the map should draw with. */
export function mapLook({ theme, textSize, colours }: Preferences) {
  return {
    palette: PALETTES[colours][theme],
    textScale: TEXT_SIZES[textSize],
  };
}
