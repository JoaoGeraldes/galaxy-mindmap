import type { Area } from './layout';

/** How the map is shown: shifted by (x, y) from the screen centre, then scaled. */
export interface View {
  x: number;
  y: number;
  scale: number;
}

/**
 * The view that fits `area` on a screen of the given size, centred.
 * Small maps aren't blown up past `maxScale`; huge ones stop at `minScale`.
 */
export function fitView(
  area: Area,
  screen: { width: number; height: number },
  minScale: number,
  maxScale: number,
): View {
  const fit = Math.min(screen.width / area.width, screen.height / area.height);
  const scale = Math.min(maxScale, Math.max(minScale, fit));
  const centreX = area.x + area.width / 2;
  const centreY = area.y + area.height / 2;
  return { x: -centreX * scale, y: -centreY * scale, scale };
}

/** A view part of the way from `from` to `to`, for `progress` 0 to 1. */
export function between(from: View, to: View, progress: number): View {
  const mix = (a: number, b: number) => a + (b - a) * progress;
  return {
    x: mix(from.x, to.x),
    y: mix(from.y, to.y),
    scale: mix(from.scale, to.scale),
  };
}
