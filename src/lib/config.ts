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

/** The hint shown in a new node until it is given a name. */
export const NEW_NODE_HINT = 'Type here…';

/** Text size and box size per depth; the last entry covers deeper levels. */
export const NODE_LOOKS = [
  { fontSize: 20, height: 60, paddingX: 30 }, // Central topic
  { fontSize: 15, height: 40, paddingX: 22 }, // Main branches
  { fontSize: 13, height: 28, paddingX: 14 }, // Their children
  { fontSize: 12, height: 24, paddingX: 12 }, // Everything deeper
];

/** How much bigger node text and boxes get at each text size setting. */
export const TEXT_SIZES = {
  normal: 1,
  large: 1.2,
  larger: 1.4,
};

/**
 * Colours for the central topic and the main branches, per theme. Light
 * themes need darker shades to stand out on white.
 */
export const PALETTES = {
  vivid: {
    dark: {
      root: '#a78bfa',
      branches: [
        '#a78bfa',
        '#60a5fa',
        '#f472b6',
        '#34d399',
        '#fbbf24',
        '#22d3ee',
        '#fb923c',
        '#e879f9',
      ],
    },
    light: {
      root: '#7c3aed',
      branches: [
        '#7c3aed',
        '#2563eb',
        '#db2777',
        '#059669',
        '#d97706',
        '#0891b2',
        '#ea580c',
        '#c026d3',
      ],
    },
  },
  // Based on the Okabe–Ito palette, which stays distinguishable with the
  // common kinds of colour blindness.
  colourBlindSafe: {
    dark: {
      root: '#56b4e9',
      branches: [
        '#e69f00',
        '#56b4e9',
        '#f0e442',
        '#cc79a7',
        '#009e73',
        '#d55e00',
        '#bbbbbb',
      ],
    },
    light: {
      root: '#0072b2',
      branches: [
        '#0072b2',
        '#d55e00',
        '#009e73',
        '#cc79a7',
        '#b07a00',
        '#56b4e9',
        '#555555',
      ],
    },
  },
};
