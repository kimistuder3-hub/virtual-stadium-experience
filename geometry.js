import * as THREE from 'three';

// Zeichnet ein abgerundetes Rechteck (zentriert) in einen Shape oder Path.
export function roundedRectPath(target, hx, hz, r) {
  target.moveTo(-hx + r, -hz);
  target.lineTo(hx - r, -hz);
  target.absarc(hx - r, -hz + r, r, -Math.PI / 2, 0, false);
  target.lineTo(hx, hz - r);
  target.absarc(hx - r, hz - r, r, 0, Math.PI / 2, false);
  target.lineTo(-hx + r, hz);
  target.absarc(-hx + r, hz - r, r, Math.PI / 2, Math.PI, false);
  target.lineTo(-hx, -hz + r);
  target.absarc(-hx + r, -hz + r, r, Math.PI, Math.PI * 1.5, false);
  return target;
}

// Flacher Ring zwischen zwei abgerundeten Rechtecken, extrudiert nach oben.
// inner/outer: { hx, hz, r }. Liegt auf der Höhe y, Dicke = height.
export function ringGeometry(inner, outer, height, segments = 10) {
  const shape = roundedRectPath(new THREE.Shape(), outer.hx, outer.hz, outer.r);
  const hole = roundedRectPath(new THREE.Path(), inner.hx, inner.hz, inner.r);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: segments,
  });
  // Shape liegt in XY, Extrusion entlang Z -> auf den Boden drehen (Y nach oben).
  // Mit +PI/2 zeigt die Extrusion nach unten, darum danach um "height" anheben.
  geo.rotateX(Math.PI / 2);
  geo.translate(0, height, 0);
  return geo;
}

// Verteilt Punkte gleichmässig entlang eines abgerundeten Rechtecks.
// Gibt Position und nach aussen zeigende Normale zurück.
export function sampleRoundedRect(hx, hz, r, spacing) {
  const sx = 2 * (hx - r);
  const sz = 2 * (hz - r);
  const arc = (Math.PI / 2) * r;
  const segments = [
    // Unterkante (z = -hz), von links nach rechts
    { len: sx, at: (t) => ({ x: -hx + r + t * sx, z: -hz, nx: 0, nz: -1 }) },
    { len: arc, at: (t) => corner(hx - r, -hz + r, -Math.PI / 2 + t * (Math.PI / 2)) },
    { len: sz, at: (t) => ({ x: hx, z: -hz + r + t * sz, nx: 1, nz: 0 }) },
    { len: arc, at: (t) => corner(hx - r, hz - r, t * (Math.PI / 2)) },
    { len: sx, at: (t) => ({ x: hx - r - t * sx, z: hz, nx: 0, nz: 1 }) },
    { len: arc, at: (t) => corner(-hx + r, hz - r, Math.PI / 2 + t * (Math.PI / 2)) },
    { len: sz, at: (t) => ({ x: -hx, z: hz - r - t * sz, nx: -1, nz: 0 }) },
    { len: arc, at: (t) => corner(-hx + r, -hz + r, Math.PI + t * (Math.PI / 2)) },
  ];

  function corner(cx, cz, a) {
    const nx = Math.cos(a);
    const nz = Math.sin(a);
    return { x: cx + nx * r, z: cz + nz * r, nx, nz };
  }

  const total = segments.reduce((s, seg) => s + seg.len, 0);
  const count = Math.floor(total / spacing);
  const step = total / count;
  const points = [];
  let segIndex = 0;
  let segStart = 0;
  for (let i = 0; i < count; i++) {
    const d = i * step;
    while (d > segStart + segments[segIndex].len) {
      segStart += segments[segIndex].len;
      segIndex++;
    }
    const seg = segments[segIndex];
    points.push(seg.at(seg.len === 0 ? 0 : (d - segStart) / seg.len));
  }
  return points;
}
