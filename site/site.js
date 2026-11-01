// A small, self-contained version of the app's map for the home page:
// springy strings, travelling lights and a rippling cloud to drag around.
const svg = document.getElementById('demo');
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG_NS = 'http://www.w3.org/2000/svg';
const STIFFNESS = 220;
const DAMPING = 14;
const STRING_STIFFNESS = 300;
const STEP = 1 / 240;
// Phones get a narrower map with one idea per branch, so text stays legible.
const compact = matchMedia('(max-width: 600px)').matches;
const view = compact
  ? { x: -230, y: -170, width: 460, height: 340 }
  : { x: -430, y: -230, width: 860, height: 460 };
svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);

const branches = [
  { text: 'Goals', color: '#a78bfa', leaves: ['Launch MVP', 'Grow users'] },
  { text: 'Plan', color: '#60a5fa', leaves: ['Research', 'Design'] },
  { text: 'Resources', color: '#34d399', leaves: ['Team', 'Budget'] },
  { text: 'Outcomes', color: '#f472b6', leaves: ['Launch day', 'Impact'] },
];

// Each node rests at an offset from its parent, so children follow it.
const root = { text: 'Project Odyssey', depth: 0, dx: 0, dy: 0 };
root.color = '#a78bfa';
const nodes = [root];
branches.forEach((branch, i) => {
  const side = i % 2 ? 1 : -1;
  const up = i < 2 ? -1 : 1;
  const main = {
    ...branch,
    depth: 1,
    parent: root,
    dx: side * (compact ? 115 : 200),
    dy: up * (compact ? 75 : 100),
  };
  nodes.push(main);
  const leaves = compact ? branch.leaves.slice(0, 1) : branch.leaves;
  leaves.forEach((text, j) => {
    nodes.push({
      text,
      depth: 2,
      parent: main,
      color: branch.color,
      dx: side * (compact ? 25 : 150),
      dy: compact ? up * 60 : (j - 0.5) * 60 + up * 18,
    });
  });
});

for (const node of nodes) {
  Object.assign(node, { x: node.dx * 2, y: node.dy * 2, vx: 0, vy: 0 });
  const size = [19, 15, 13][node.depth];
  node.width = node.text.length * size * 0.6 + [56, 36, 24][node.depth];
  node.height = [64, 40, 28][node.depth];
  if (node.parent) node.middle = { x: 0, y: 0, vx: 0, vy: 0 };
}

const element = (name, attributes, parent = svg) => {
  const created = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    created.setAttribute(key, value);
  }
  parent.append(created);
  return created;
};

// The glow covers the whole picture: sized to each string instead, a
// perfectly flat string would have no height and vanish.
const glow = element('filter', {
  id: 'glow',
  filterUnits: 'userSpaceOnUse',
  ...view,
});
element('feGaussianBlur', { stdDeviation: 4, result: 'blur' }, glow);
const merge = element('feMerge', {}, glow);
element('feMergeNode', { in: 'blur' }, merge);
element('feMergeNode', { in: 'SourceGraphic' }, merge);

for (const node of nodes.filter((n) => n.parent)) {
  const width = node.depth === 1 ? 2.5 : 1.5;
  node.string = element('path', {
    class: 'string',
    stroke: node.color,
    'stroke-width': width,
    filter: 'url(#glow)',
  });
  if (!calm) {
    node.beam = element('path', {
      class: 'beam',
      stroke: 'white',
      pathLength: 100,
    });
    node.beam.style.animationDelay = `-${Math.random() * 2.6}s`;
  }
}

for (const node of nodes) {
  const kind = ['root', 'main', 'leaf'][node.depth];
  node.group = element('g', { class: `node ${kind}` });
  if (node.depth === 0) {
    node.shape = element(
      'path',
      {
        class: 'cloud',
        fill: '#2a1d5c',
        stroke: node.color,
        filter: 'url(#glow)',
      },
      node.group,
    );
  } else {
    element(
      'rect',
      {
        x: -node.width / 2,
        y: -node.height / 2,
        width: node.width,
        height: node.height,
        rx: node.depth === 1 ? 12 : node.height / 2,
        stroke: node.color,
        filter: node.depth === 1 ? 'url(#glow)' : 'none',
      },
      node.group,
    );
  }
  element('text', {}, node.group).textContent = node.text;
  node.group.addEventListener('pointerdown', (event) => grab(node, event));
}

const targetOf = (node) =>
  node.parent
    ? { x: node.parent.x + node.dx, y: node.parent.y + node.dy }
    : { x: 0, y: 0 };

function pull(body, target, stiffness, seconds) {
  if (calm) return Object.assign(body, target);
  body.vx += (stiffness * (target.x - body.x) - DAMPING * body.vx) * seconds;
  body.vy += (stiffness * (target.y - body.y) - DAMPING * body.vy) * seconds;
  body.x += body.vx * seconds;
  body.y += body.vy * seconds;
}

let held = null;

function step(seconds) {
  for (const node of nodes)
    if (node !== held) pull(node, targetOf(node), STIFFNESS, seconds);
  for (const node of nodes.filter((n) => n.parent)) {
    const middle = {
      x: (node.parent.x + node.x) / 2,
      y: (node.parent.y + node.y) / 2,
    };
    pull(node.middle, middle, STRING_STIFFNESS, seconds);
  }
}

// A rounded outline whose edge ripples like a drop of liquid.
function cloudPath(width, height, time) {
  const points = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * 2 * Math.PI;
    const ripple =
      0.6 * Math.sin(3 * angle + time * 0.9) +
      0.4 * Math.sin(5 * angle - time * 1.2);
    const pill =
      1 /
      ((Math.abs(Math.cos(angle)) / (width / 2)) ** 4 +
        (Math.abs(Math.sin(angle)) / (height / 2)) ** 4) **
        0.25;
    const radius = pill * (1 + 0.06 * ripple);
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  });
  const middle = (a, b) => `${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2}`;
  const curves = points.map(
    (point, i) =>
      `Q ${point[0]} ${point[1]} ${middle(point, points[(i + 1) % 40])}`,
  );
  return `M ${middle(points[39], points[0])} ${curves.join(' ')} Z`;
}

function draw(time) {
  for (const node of nodes) {
    node.group.setAttribute('transform', `translate(${node.x} ${node.y})`);
    if (node.depth === 0)
      node.shape.setAttribute(
        'd',
        cloudPath(node.width + 28, node.height + 20, calm ? 0 : time),
      );
    if (!node.parent) continue;
    const { x: ax, y: ay } = node.parent;
    // A curve through the string's springy middle, so it wobbles.
    const cx = 2 * node.middle.x - (ax + node.x) / 2;
    const cy = 2 * node.middle.y - (ay + node.y) / 2;
    const d = `M ${ax} ${ay} Q ${cx} ${cy} ${node.x} ${node.y}`;
    node.string.setAttribute('d', d);
    node.beam?.setAttribute('d', d);
  }
}

function toSvg(event) {
  const point = new DOMPoint(event.clientX, event.clientY);
  return point.matrixTransform(svg.getScreenCTM().inverse());
}

function grab(node, event) {
  held = node;
  svg.setPointerCapture(event.pointerId);
}

svg.addEventListener('pointermove', (event) => {
  if (!held) return;
  const { x, y } = toSvg(event);
  Object.assign(held, { x, y, vx: 0, vy: 0 });
});
svg.addEventListener('pointerup', () => (held = null));
svg.addEventListener('pointercancel', () => (held = null));

// Runs only while the demo is on screen, to save the battery.
let visible = true;
new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(
  svg,
);

let last = performance.now();
requestAnimationFrame(function frame(now) {
  const elapsed = Math.min((now - last) / 1000, 1 / 20);
  last = now;
  if (visible) {
    for (let i = 0; i < Math.round(elapsed / STEP); i++) step(STEP);
    if (calm) step(STEP);
    draw(now / 1000);
  }
  requestAnimationFrame(frame);
});

// Sections rise into view once, as they are scrolled to.
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries.filter((e) => e.isIntersecting)) {
      entry.target.classList.add('shown');
      reveal.unobserve(entry.target);
    }
  },
  { threshold: 0.15 },
);
document
  .querySelectorAll('.reveal')
  .forEach((section) => reveal.observe(section));
