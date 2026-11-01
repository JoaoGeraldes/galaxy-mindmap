import { describe, expect, it } from 'vitest';
import { between, fitView } from '../src/lib/view';

const SCREEN = { width: 800, height: 600 };

describe('view', () => {
  it('centres the map on the screen', () => {
    const area = { x: 100, y: 50, width: 200, height: 100 };
    const view = fitView(area, SCREEN, 0.25, 1);
    // The area's centre (200, 100) lands on the screen centre.
    expect(200 * view.scale + view.x).toBe(0);
    expect(100 * view.scale + view.y).toBe(0);
  });

  it('zooms out until a large map fits', () => {
    const area = { x: -800, y: -300, width: 1600, height: 600 };
    expect(fitView(area, SCREEN, 0.25, 1).scale).toBe(0.5);
  });

  it('never blows a small map up past its natural size', () => {
    const area = { x: 0, y: 0, width: 100, height: 50 };
    expect(fitView(area, SCREEN, 0.25, 1).scale).toBe(1);
  });

  it('stops zooming out at the smallest allowed scale', () => {
    const area = { x: 0, y: 0, width: 100000, height: 100 };
    expect(fitView(area, SCREEN, 0.25, 1).scale).toBe(0.25);
  });

  it('moves smoothly from one view to another', () => {
    const from = { x: 0, y: 0, scale: 1 };
    const to = { x: 100, y: -50, scale: 0.5 };
    expect(between(from, to, 0)).toEqual(from);
    expect(between(from, to, 0.5)).toEqual({ x: 50, y: -25, scale: 0.75 });
    expect(between(from, to, 1)).toEqual(to);
  });
});
