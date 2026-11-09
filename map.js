import { PITCH, TIERS, FACADE_OFFSET, ringAt } from './config.js';

// Stadionkarte (Draufsicht, Norden oben). Wird aus denselben Massen gezeichnet wie die 3D-Szene.
const VIEW = { x: -110, y: -124, w: 220, h: 226 };
const NS = 'http://www.w3.org/2000/svg';

function rrPath({ hx, hz, r }) {
  return [
    `M ${-hx + r} ${-hz}`,
    `H ${hx - r}`,
    `A ${r} ${r} 0 0 1 ${hx} ${-hz + r}`,
    `V ${hz - r}`,
    `A ${r} ${r} 0 0 1 ${hx - r} ${hz}`,
    `H ${-hx + r}`,
    `A ${r} ${r} 0 0 1 ${-hx} ${hz - r}`,
    `V ${-hz + r}`,
    `A ${r} ${r} 0 0 1 ${-hx + r} ${-hz}`,
    'Z',
  ].join(' ');
}

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

export class StadiumMap {
  constructor(container, locations, onSelect) {
    this.container = container;
    this.locations = locations;
    this.onSelect = onSelect;
    this.markers = new Map();
    this.render();
  }

  render() {
    const svg = el('svg', {
      viewBox: `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`,
      class: 'map-svg',
      'aria-hidden': 'true',
      focusable: 'false',
    });

    svg.append(el('path', { d: rrPath(ringAt(FACADE_OFFSET + 1)), class: 'map-facade' }));
    TIERS.forEach((tier, i) => {
      const outer = tier.offset + tier.rows * tier.run;
      svg.append(el('path', { d: rrPath(ringAt(outer)), class: `map-tier map-tier-${i}` }));
    });
    svg.append(el('path', { d: rrPath(ringAt(0)), class: 'map-bowl' }));

    // Spielfeld
    const L = PITCH.length;
    const W = PITCH.width;
    svg.append(el('rect', { x: -L / 2, y: -W / 2, width: L, height: W, class: 'map-pitch' }));
    svg.append(el('line', { x1: 0, y1: -W / 2, x2: 0, y2: W / 2, class: 'map-line' }));
    svg.append(el('circle', { cx: 0, cy: 0, r: 9.15, class: 'map-line' }));

    // Weg zum Eingang
    const gateZ = -ringAt(FACADE_OFFSET + 1).hz;
    svg.append(el('rect', { x: -3.5, y: gateZ - 40, width: 7, height: 40, class: 'map-path' }));

    // Nordpfeil
    const north = el('text', { x: VIEW.x + VIEW.w - 10, y: VIEW.y + 16, class: 'map-north', 'text-anchor': 'middle' });
    north.textContent = 'N';
    svg.append(north);

    // Blickkegel des aktuellen Standorts
    this.cone = el('path', { d: 'M 0 0 L -10 26 A 28 28 0 0 0 10 26 Z', class: 'map-cone' });
    this.coneGroup = el('g', { class: 'map-cone-group' });
    this.coneGroup.append(this.cone);
    svg.append(this.coneGroup);

    this.container.append(svg);

    // Standorte als echte Buttons (Tastatur und Screenreader)
    for (const loc of this.locations) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'map-marker';
      btn.textContent = loc.number;
      btn.setAttribute('aria-label', `Standort ${loc.number}: ${loc.title}`);
      btn.style.left = `${((loc.position.x - VIEW.x) / VIEW.w) * 100}%`;
      btn.style.top = `${((loc.position.z - VIEW.y) / VIEW.h) * 100}%`;
      btn.addEventListener('click', () => this.onSelect(loc));
      this.container.append(btn);
      this.markers.set(loc.id, btn);
    }
  }

  setActive(id) {
    for (const [key, btn] of this.markers) {
      const active = key === id;
      btn.classList.toggle('is-active', active);
      if (active) btn.setAttribute('aria-current', 'location');
      else btn.removeAttribute('aria-current');
    }
  }

  setDisabled(disabled) {
    for (const btn of this.markers.values()) btn.disabled = disabled;
  }

  // Position und Blickrichtung (yaw) der Kamera anzeigen
  updateView(x, z, yaw, visible) {
    this.coneGroup.style.display = visible ? '' : 'none';
    if (!visible) return;
    // yaw = 0 zeigt nach +z (auf der Karte nach unten); SVG-Rotation im Uhrzeigersinn
    const deg = (-yaw * 180) / Math.PI;
    this.coneGroup.setAttribute('transform', `translate(${x} ${z}) rotate(${deg})`);
  }
}
