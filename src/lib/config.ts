/**
 * Every number that sets how the map looks and moves, in one place so the
 * feel can be tuned without touching the code that uses it.
 */

export const PHYSICS = {
  /** How hard each node is pulled back into place; higher is snappier. */
  stiffness: 220,
  /** How fast the wobble dies down. Below 2√stiffness (≈30) nodes overshoot. */
  damping: 14,
  /** How hard each string is pulled straight; higher twangs faster. */
  stringStiffness: 300,
  /** Simulation step in seconds; smaller is steadier but costs more. */
  step: 1 / 240,
  /** Below these distances (px) and speeds (px/s) things count as still. */
  restDistance: 0.1,
  restSpeed: 1,
};

/** Small lights that travel along the strings, away from the centre. */
export const BEAMS = {
  /** Seconds a beam takes to travel one string. */
  secondsPerTrip: 2.6,
  /** Beam length as a percentage of the string. */
  lengthPercent: 7,
};

/** The soft glow around strings and main nodes. */
export const GLOW = {
  /** Blur radius of the glow; 0 turns it off. */
  blur: 4,
};

/** The double beat of the selected node. */
export const HEARTBEAT = {
  /** Seconds per beat, rest included; about 75 beats a minute. */
  seconds: 1.6,
  /** How far the ring ripples out, as a multiple of the node's size. */
  ringScale: 1.35,
  /** How much the node itself swells on the beat. */
  swell: 1.06,
};

/** How many changes to a map can be undone. */
export const HISTORY = {
  limit: 100,
};

/** The liquid neon cloud behind the central topic. */
export const CLOUD = {
  /** How far the edge ripples, as a fraction of the cloud's size. */
  wobble: 0.06,
  /** How fast the ripples move. */
  speed: 0.9,
  /** Points around the edge; more is smoother. */
  points: 48,
  /** How much bigger than the text box the cloud is drawn. */
  padding: 14,
};

/** Text size and box size per depth; the last entry covers deeper levels. */
export const NODE_LOOKS = [
  { fontSize: 20, height: 60, paddingX: 30 }, // Central topic
  { fontSize: 15, height: 40, paddingX: 22 }, // Main branches
  { fontSize: 13, height: 28, paddingX: 14 }, // Their children
  { fontSize: 12, height: 24, paddingX: 12 }, // Everything deeper
];

/** Main branch colours, bright enough to read on the dark canvas. */
export const ROOT_COLOR = '#a78bfa';
export const BRANCH_COLORS = [
  '#a78bfa',
  '#60a5fa',
  '#f472b6',
  '#34d399',
  '#fbbf24',
  '#22d3ee',
  '#fb923c',
  '#e879f9',
];
