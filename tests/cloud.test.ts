import { describe, expect, it } from 'vitest';
import { cloudPath } from '../src/lib/cloud';

const CALM = { wobble: 0, speed: 1, points: 32 };
const RIPPLING = { wobble: 0.1, speed: 1, points: 32 };

function points(path: string) {
  const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return Array.from({ length: numbers.length / 2 }, (_, i) => ({
    x: numbers[2 * i],
    y: numbers[2 * i + 1],
  }));
}

describe('cloud', () => {
  it('draws one closed outline', () => {
    const path = cloudPath(200, 60, 0, CALM);
    expect(path.startsWith('M ')).toBe(true);
    expect(path.endsWith(' Z')).toBe(true);
  });

  it('stays within its box when calm', () => {
    for (const { x, y } of points(cloudPath(200, 60, 0, CALM))) {
      expect(Math.abs(x)).toBeLessThanOrEqual(100);
      expect(Math.abs(y)).toBeLessThanOrEqual(30);
    }
  });

  it('ripples as time passes', () => {
    expect(cloudPath(200, 60, 1, RIPPLING)).not.toBe(
      cloudPath(200, 60, 0, RIPPLING),
    );
  });

  it('holds still when there is no wobble', () => {
    expect(cloudPath(200, 60, 1, CALM)).toBe(cloudPath(200, 60, 0, CALM));
  });
});
