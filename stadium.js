import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PITCH, TIERS, FACADE_OFFSET, ROOF, PLATFORM, QUALITY, ringAt } from './config.js';
import { ringGeometry, sampleRoundedRect } from './geometry.js';
import { pitchTexture, ledBoardTexture, entranceSignTexture } from './textures.js';

// Baut das stilisierte Nacht-Stadion. Alle Masse sind fiktiv (siehe config.js).
export function buildStadium(renderer) {
  const group = new THREE.Group();
  group.name = 'stadium';

  const mats = {
    concrete: new THREE.MeshStandardMaterial({ color: 0x3b3f48, roughness: 0.95, metalness: 0.0 }),
    concreteDark: new THREE.MeshStandardMaterial({ color: 0x24272e, roughness: 0.95 }),
    facade: new THREE.MeshStandardMaterial({ color: 0x5d636f, roughness: 0.9 }),
    exterior: new THREE.MeshStandardMaterial({ color: 0x7d838f, roughness: 0.88 }),
    roof: new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.7, metalness: 0.3, side: THREE.DoubleSide }),
    truss: new THREE.MeshStandardMaterial({ color: 0x9e1f26, roughness: 0.55, metalness: 0.35, emissive: 0x4a080c }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xb8bec9, roughness: 0.35, metalness: 0.8 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0xa9c4e8,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
    floodlight: new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 7, 6.4) }),
    warmLight: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 0.95, 0.62) }),
    concourseLight: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.7, 2.0) }),
  };

  addPitch(group, renderer);
  addLedBoards(group, renderer);
  addTiers(group, mats);
  addSeats(group);
  addPlatform(group, mats);
  addFacade(group, mats, renderer);
  addRoof(group, mats);
  addTowersAndTrusses(group, mats);
  addRamps(group, mats);
  addLights(group);

  return group;
}

/* ---------- Spielfeld ---------- */
function addPitch(group, renderer) {
  const inner = ringAt(0);
  // Boden innerhalb der Tribünen (Laufbereich um den Rasen)
  const floorShape = new THREE.Shape();
  const { hx, hz, r } = inner;
  floorShape.moveTo(-hx + r, -hz);
  floorShape.lineTo(hx - r, -hz);
  floorShape.absarc(hx - r, -hz + r, r, -Math.PI / 2, 0);
  floorShape.lineTo(hx, hz - r);
  floorShape.absarc(hx - r, hz - r, r, 0, Math.PI / 2);
  floorShape.lineTo(-hx + r, hz);
  floorShape.absarc(-hx + r, hz - r, r, Math.PI / 2, Math.PI);
  floorShape.lineTo(-hx, -hz + r);
  floorShape.absarc(-hx + r, -hz + r, r, Math.PI, Math.PI * 1.5);
  const floor = new THREE.Mesh(
    new THREE.ShapeGeometry(floorShape, 12).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x15301d, roughness: 1, side: THREE.DoubleSide }),
  );
  floor.position.y = 0.01;
  group.add(floor);

  const L = PITCH.length + PITCH.grassMargin * 2;
  const W = PITCH.width + PITCH.grassMargin * 2;
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(L, W).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: pitchTexture(renderer), roughness: 0.92 }),
  );
  grass.position.y = 0.03;
  group.add(grass);

  // Tore
  const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const netMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
  for (const side of [-1, 1]) {
    const goal = new THREE.Group();
    const post = new THREE.CylinderGeometry(0.06, 0.06, 2.44, 10);
    const bar = new THREE.CylinderGeometry(0.06, 0.06, 7.32, 10).rotateX(Math.PI / 2);
    const p1 = new THREE.Mesh(post, postMat);
    p1.position.set(0, 1.22, -3.66);
    const p2 = p1.clone();
    p2.position.z = 3.66;
    const cross = new THREE.Mesh(bar, postMat);
    cross.position.y = 2.44;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(7.32, 2.44).rotateY(Math.PI / 2), netMat);
    back.position.set(side * 2, 1.22, 0);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(2, 7.32).rotateX(-Math.PI / 2), netMat);
    top.position.set(side * 1, 2.44, 0);
    goal.add(p1, p2, cross, back, top);
    goal.position.set(side * (PITCH.length / 2), 0, 0);
    group.add(goal);
  }
}

/* ---------- Bandenwerbung ---------- */
function ribbon(points, y0, y1, uPerMeter, inward = true) {
  const pts = [...points, points[0]];
  const pos = [];
  const uv = [];
  const idx = [];
  let dist = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) dist += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    pos.push(pts[i].x, y0, pts[i].z, pts[i].x, y1, pts[i].z);
    uv.push(dist * uPerMeter, 0, dist * uPerMeter, 1);
    if (i > 0) {
      const a = (i - 1) * 2;
      if (inward) idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      else idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function addLedBoards(group, renderer) {
  const tex = ledBoardTexture(renderer);
  const pts = sampleRoundedRect(PITCH.length / 2 + 4, PITCH.width / 2 + 4, 2, 0.8);
  // Vorderseite leuchtet Richtung Spielfeld, Rückseite bleibt dunkel
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, color: new THREE.Color(1.5, 1.5, 1.5) });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x15171d, roughness: 0.8, side: THREE.BackSide });
  const boardGeo = ribbon(pts, 0.05, 0.95, 1 / 32);
  group.add(new THREE.Mesh(boardGeo, mat), new THREE.Mesh(boardGeo, backMat));

  // LED-Bänder an den Brüstungen von Mittel- und Oberring
  for (const tier of TIERS.slice(1)) {
    const ring = ringAt(tier.offset - 0.3);
    const p = sampleRoundedRect(ring.hx, ring.hz, ring.r, 1.2);
    const stripGeo = ribbon(p, tier.y - 1.6, tier.y - 0.9, 1 / 40);
    group.add(new THREE.Mesh(stripGeo, mat), new THREE.Mesh(stripGeo, backMat));
  }
}

/* ---------- Ränge ---------- */
function addTiers(group, mats) {
  const stepGeos = [];
  const fasciaGeos = [];
  const concourseGeos = [];

  TIERS.forEach((tier, t) => {
    const base = t === 0 ? 0 : tier.y - 2.2;
    for (let i = 0; i < tier.rows; i++) {
      const inner = ringAt(tier.offset + i * tier.run);
      const outer = ringAt(tier.offset + (i + 1) * tier.run);
      const top = tier.y + (i + 1) * tier.rise;
      const g = ringGeometry(inner, outer, top - base, 10);
      g.translate(0, base, 0);
      stepGeos.push(g);
    }
    // Brüstung vorne
    const frontInner = ringAt(tier.offset - 0.25);
    const frontOuter = ringAt(tier.offset);
    const fg = ringGeometry(frontInner, frontOuter, tier.y + 1.0 - base, 10);
    fg.translate(0, base, 0);
    fasciaGeos.push(fg);

    // Rückwand (Umgang) zwischen diesem und dem nächsten Rang
    const next = TIERS[t + 1];
    const backOffset = tier.offset + tier.rows * tier.run;
    const topY = tier.y + tier.rows * tier.rise;
    const wallTop = next ? next.y : topY + 6;
    const wg = ringGeometry(ringAt(backOffset), ringAt(backOffset + 0.6), wallTop - topY, 10);
    wg.translate(0, topY, 0);
    concourseGeos.push(wg);
  });

  group.add(new THREE.Mesh(mergeGeometries(stepGeos), mats.concrete));
  group.add(new THREE.Mesh(mergeGeometries(fasciaGeos), mats.concreteDark));
  group.add(new THREE.Mesh(mergeGeometries(concourseGeos), mats.concreteDark));

  // Lichter in den Umgängen
  const lamp = new THREE.BoxGeometry(1.4, 0.18, 0.1);
  const lampGeos = [];
  TIERS.slice(0, 2).forEach((tier) => {
    const backOffset = tier.offset + tier.rows * tier.run - 0.02;
    const ring = ringAt(backOffset);
    const y = tier.y + tier.rows * tier.rise + 2.4;
    for (const p of sampleRoundedRect(ring.hx, ring.hz, ring.r, 7)) {
      const g = lamp.clone();
      g.rotateY(Math.atan2(p.nx, p.nz));
      g.translate(p.x, y, p.z);
      lampGeos.push(g);
    }
  });
  group.add(new THREE.Mesh(mergeGeometries(lampGeos), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.9, 2.2) })));
}

/* ---------- Sitze ---------- */
function isPlatformArea(tierIndex, row, p) {
  return tierIndex === 1 && row <= 3 && p.nz === -1 && p.nx === 0 && Math.abs(p.x) < PLATFORM.halfWidth + 0.6;
}

function isAisle(p) {
  if (p.nx === 0) return ((p.x + 1200) % 24) < 1.1; // Längsseiten
  if (p.nz === 0) return ((p.z + 1200) % 20) < 1.1; // Stirnseiten
  return false;
}

function addSeats(group) {
  const high = QUALITY === 'high';
  const spacing = high ? 0.52 : 0.62;
  const back = new THREE.BoxGeometry(0.44, 0.4, 0.05).translate(0, 0.48, 0.16);
  const seatGeo = high ? mergeGeometries([back, new THREE.BoxGeometry(0.44, 0.05, 0.36).translate(0, 0.28, 0)]) : back;
  const tierColors = [0x203574, 0x1a2c63, 0x23397c];

  const transforms = [];
  TIERS.forEach((tier, t) => {
    for (let i = 0; i < tier.rows; i++) {
      const ring = ringAt(tier.offset + i * tier.run + tier.run * 0.45);
      const y = tier.y + (i + 1) * tier.rise;
      for (const p of sampleRoundedRect(ring.hx, ring.hz, ring.r, spacing)) {
        if (isAisle(p) || isPlatformArea(t, i, p)) continue;
        transforms.push({ x: p.x, y, z: p.z, rot: Math.atan2(p.nx, p.nz), tier: t });
      }
    }
  });

  const mesh = new THREE.InstancedMesh(seatGeo, new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 }), transforms.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  transforms.forEach((tr, i) => {
    q.setFromAxisAngle(up, tr.rot);
    m.compose(new THREE.Vector3(tr.x, tr.y, tr.z), q, s);
    mesh.setMatrixAt(i, m);
    color.setHex(tierColors[tr.tier]).offsetHSL(0, 0, (Math.random() - 0.5) * 0.03);
    mesh.setColorAt(i, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);
}

/* ---------- Rollstuhlplattform (Mittelring Nord) ---------- */
function addPlatform(group, mats) {
  const tier = TIERS[1];
  const frontZ = -(ringAt(tier.offset).hz);
  // Die Plattform liegt auf Höhe der 4. Reihe und kragt über die vorderen Reihen aus.
  const topY = tier.y + 4 * tier.rise + 0.02;
  const w = PLATFORM.halfWidth * 2;
  const deckH = topY - (tier.y - 0.2);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(w, deckH, PLATFORM.depth), mats.concreteDark);
  deck.position.set(0, topY - deckH / 2, frontZ - PLATFORM.depth / 2);
  group.add(deck);

  // Glasbrüstung mit Handlauf
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.95), mats.glass);
  glass.position.set(0, topY + 0.5, frontZ + 0.02);
  group.add(glass);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, w, 12).rotateZ(Math.PI / 2), mats.metal);
  rail.position.set(0, topY + 1.0, frontZ + 0.02);
  group.add(rail);
  // Pfosten zwischen den Plätzen, damit sie die Sicht nicht verdecken
  for (const x of [-9, -8.4, -6, -3.6, -1.2, 1.2, 3.6, 6, 8.4, 9]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.0, 0.05), mats.metal);
    post.position.set(x, topY + 0.5, frontZ + 0.02);
    group.add(post);
  }

  // Markierte Rollstuhlplätze und Sitze für Begleitpersonen
  const markMat = new THREE.MeshStandardMaterial({ color: 0x1f4fb0, roughness: 0.8 });
  const companionMat = new THREE.MeshStandardMaterial({ color: 0x2a3d7a, roughness: 0.6 });
  for (let k = -3; k <= 3; k++) {
    const cx = k * 2.4;
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.35).rotateX(-Math.PI / 2), markMat);
    mark.position.set(cx - 0.45, topY + 0.005, frontZ - 1.6);
    group.add(mark);
    const seat = new THREE.Group();
    const pan = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.44), companionMat);
    pan.position.y = 0.45;
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.06), companionMat);
    backrest.position.set(0, 0.72, -0.22);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.3), mats.metal);
    leg.position.y = 0.22;
    seat.add(pan, backrest, leg);
    seat.position.set(cx + 0.55, topY, frontZ - 1.6);
    group.add(seat);
  }
}

/* ---------- Fassade und Eingang ---------- */
function addFacade(group, mats, renderer) {
  const height = 44;
  const facade = ringGeometry(ringAt(FACADE_OFFSET), ringAt(FACADE_OFFSET + 1), height, 14);
  group.add(new THREE.Mesh(facade, mats.facade));

  // Senkrechte Rippen
  const ribGeos = [];
  const ring = ringAt(FACADE_OFFSET + 1);
  for (const p of sampleRoundedRect(ring.hx, ring.hz, ring.r, 6)) {
    if (p.nz === -1 && Math.abs(p.x) < 7) continue; // Platz für den Eingang
    const g = new THREE.BoxGeometry(0.9, height, 0.9);
    g.rotateY(Math.atan2(p.nx, p.nz));
    g.translate(p.x + p.nx * 0.45, height / 2, p.z + p.nz * 0.45);
    ribGeos.push(g);
  }
  group.add(new THREE.Mesh(mergeGeometries(ribGeos), mats.exterior));

  // Leuchtschlitze auf drei Ebenen (Umgänge)
  const slotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.42, 0.48, 0.66) });
  const slotRing = ringAt(FACADE_OFFSET + 1.02);
  const slotPts = sampleRoundedRect(slotRing.hx, slotRing.hz, slotRing.r, 1.5);
  for (const y of [9.5, 22.5, 38]) {
    group.add(new THREE.Mesh(ribbon(slotPts, y, y + 0.35, 0.1, false), slotMat));
  }

  // Eingang Nord
  const z = -(ringAt(FACADE_OFFSET + 1).hz);
  const gate = new THREE.Group();
  const opening = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), mats.warmLight);
  opening.position.set(0, 2.5, z - 0.02);
  opening.rotation.y = Math.PI;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.6, metalness: 0.4 });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(11, 1.0, 1.2), frameMat);
  lintel.position.set(0, 5.5, z - 0.6);
  const left = new THREE.Mesh(new THREE.BoxGeometry(1.0, 6, 1.2), frameMat);
  left.position.set(-5, 3, z - 0.6);
  const right = left.clone();
  right.position.x = 5;
  // Pfosten im Durchgang (Durchgänge breit genug für Rollstühle)
  for (const x of [-1.5, 1.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5, 0.25), frameMat);
    post.position.set(x, 2.5, z - 0.3);
    gate.add(post);
  }
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 2),
    new THREE.MeshBasicMaterial({ map: entranceSignTexture(renderer), color: new THREE.Color(1.15, 1.15, 1.15) }),
  );
  sign.position.set(0, 7.4, z - 1.25);
  sign.rotation.y = Math.PI;
  gate.add(opening, lintel, left, right, sign);
  group.add(gate);

  const glow = new THREE.PointLight(0xffc98a, 14, 26, 2);
  glow.position.set(0, 3.5, z - 3);
  group.add(glow);
}

/* ---------- Dach ---------- */
function addRoof(group, mats) {
  const roof = ringGeometry(ringAt(ROOF.inner), ringAt(ROOF.outer), ROOF.thickness, 14);
  roof.translate(0, ROOF.y, 0);
  group.add(new THREE.Mesh(roof, mats.roof));

  // Flutlicht-Batterien an der Dachinnenkante
  const ring = ringAt(ROOF.inner + 0.8);
  const panel = new THREE.BoxGeometry(2.2, 0.7, 0.4);
  const geos = [];
  for (const p of sampleRoundedRect(ring.hx, ring.hz, ring.r, 3.2)) {
    const g = panel.clone();
    g.rotateX(-0.6);
    g.rotateY(Math.atan2(p.nx, p.nz) + Math.PI);
    g.translate(p.x, ROOF.y - 0.4, p.z);
    geos.push(g);
  }
  group.add(new THREE.Mesh(mergeGeometries(geos), new THREE.MeshBasicMaterial({ color: new THREE.Color(7, 7, 6.4) })));
}

/* ---------- Ecktürme und rote Dachträger ---------- */
function addTowersAndTrusses(group, mats) {
  const outer = ringAt(FACADE_OFFSET);
  const d = outer.r + 9;
  const cx = outer.hx - outer.r + d * Math.SQRT1_2;
  const cz = outer.hz - outer.r + d * Math.SQRT1_2;
  const towerH = 54;
  const towers = [
    [cx, cz],
    [-cx, cz],
    [cx, -cz],
    [-cx, -cz],
  ];
  for (const [x, z] of towers) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7, towerH, 40), mats.exterior);
    tower.position.set(x, towerH / 2, z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(7, 6.5, 2.5, 40), mats.truss);
    cap.position.set(x, towerH + 1.25, z);
    group.add(tower, cap);
  }

  // Fachwerkträger zwischen den Türmen
  const trussY = ROOF.y + 4;
  const depth = 4.5;
  const segs = [
    [[-cx, cz], [cx, cz]],
    [[-cx, -cz], [cx, -cz]],
    [[cx, -cz], [cx, cz]],
    [[-cx, -cz], [-cx, cz]],
  ];
  const geos = [];
  for (const [[x1, z1], [x2, z2]] of segs) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const ang = Math.atan2(x2 - x1, z2 - z1);
    const local = [];
    local.push(new THREE.BoxGeometry(0.9, 0.9, len).translate(0, depth / 2, 0));
    local.push(new THREE.BoxGeometry(0.9, 0.9, len).translate(0, -depth / 2, 0));
    const n = Math.round(len / 6);
    for (let i = 0; i <= n; i++) {
      const zz = -len / 2 + (i * len) / n;
      local.push(new THREE.BoxGeometry(0.5, depth, 0.5).translate(0, 0, zz));
      if (i < n) {
        const diag = Math.hypot(len / n, depth);
        const g = new THREE.BoxGeometry(0.4, diag, 0.4);
        g.rotateX((i % 2 ? 1 : -1) * Math.atan2(len / n, depth));
        g.translate(0, 0, zz + len / n / 2);
        local.push(g);
      }
    }
    const merged = mergeGeometries(local);
    merged.rotateY(ang);
    merged.translate((x1 + x2) / 2, trussY, (z1 + z2) / 2);
    geos.push(merged);
  }
  group.add(new THREE.Mesh(mergeGeometries(geos), mats.truss));
}

/* ---------- Spiralrampen ---------- */
class Helix extends THREE.Curve {
  constructor(radius, height, turns) {
    super();
    this.radius = radius;
    this.height = height;
    this.turns = turns;
  }
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2 * this.turns;
    return target.set(Math.cos(a) * this.radius, t * this.height, Math.sin(a) * this.radius);
  }
}

function addRamps(group, mats) {
  const outer = ringAt(FACADE_OFFSET + 1);
  const r = 5;
  const positions = [];
  for (const x of [-56, -21, 21, 56]) {
    positions.push([x, outer.hz + r + 0.5], [x, -(outer.hz + r + 0.5)]);
  }
  const helix = new THREE.TubeGeometry(new Helix(r, 40, 5.5), QUALITY === 'high' ? 360 : 200, 0.75, 6, false);
  const core = new THREE.CylinderGeometry(1.2, 1.2, 41, 16).translate(0, 20.5, 0);
  const geos = [];
  for (const [x, z] of positions) {
    geos.push(helix.clone().translate(x, 0, z));
    geos.push(core.clone().translate(x, 0, z));
  }
  group.add(new THREE.Mesh(mergeGeometries(geos), mats.exterior));
}

/* ---------- Licht ---------- */
function addLights(group) {
  const hemi = new THREE.HemisphereLight(0x2a3d78, 0x0a0b10, 0.55);
  group.add(hemi);

  // Flutlicht aufs Spielfeld
  const target = new THREE.Object3D();
  group.add(target);
  const corners = [
    [60, 42],
    [-60, 42],
    [60, -42],
    [-60, -42],
  ];
  for (const [x, z] of corners) {
    // Reichweite begrenzt, damit das Licht nicht durch die Tribünen nach aussen fällt
    const spot = new THREE.SpotLight(0xf3f6ff, 3, 165, Math.PI / 3.4, 0.6, 0);
    spot.position.set(x * 1.05, ROOF.y - 1, z * 1.1);
    spot.target = target;
    group.add(spot);
  }
  const top = new THREE.DirectionalLight(0xdfe6ff, 0.4);
  top.position.set(20, 80, 30);
  group.add(top);

  // kühles Umgebungslicht der Stadt von Norden (beleuchtet die Fassade beim Eingang)
  const city = new THREE.DirectionalLight(0x7d8fc4, 0.9);
  city.position.set(-60, 45, -200);
  group.add(city);
}
