export interface CloudShape {
  /** How far the edge ripples, as a fraction of the cloud's size. */
  wobble: number;
  /** How fast the ripples move. */
  speed: number;
  /** Points around the edge; more is smoother. */
  points: number;
}

/**
 * A closed, rounded outline centred on (0, 0) whose edge ripples over
 * `time` (seconds), like a drop of liquid.
 */
export function cloudPath(
  width: number,
  height: number,
  time: number,
  { wobble, speed, points }: CloudShape,
): string {
  const corners = Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * 2 * Math.PI;
    // Two waves at different speeds never quite repeat, so it looks alive.
    const ripple =
      0.6 * Math.sin(3 * angle + time * speed) +
      0.4 * Math.sin(5 * angle - time * speed * 1.3);
    const radius =
      pillRadius(width / 2, height / 2, angle) * (1 + wobble * ripple);
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });
  // Curving through the midpoints between corners keeps the edge smooth.
  const middle = (i: number) => {
    const a = corners[i % points];
    const b = corners[(i + 1) % points];
    return `${round((a.x + b.x) / 2)} ${round((a.y + b.y) / 2)}`;
  };
  const curves = corners.map(
    (corner, i) => `Q ${round(corner.x)} ${round(corner.y)} ${middle(i)}`,
  );
  return `M ${middle(points - 1)} ${curves.join(' ')} Z`;
}

// A squircle: an ellipse with flatter sides, close to a pill shape.
function pillRadius(rx: number, ry: number, angle: number): number {
  const n = 4;
  const x = Math.abs(Math.cos(angle) / rx) ** n;
  const y = Math.abs(Math.sin(angle) / ry) ** n;
  return 1 / (x + y) ** (1 / n);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
