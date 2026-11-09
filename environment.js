import * as THREE from 'three';
import { FACADE_OFFSET, QUALITY, ringAt } from './config.js';
import { pavingTexture } from './textures.js';

// Nachthimmel, Vorplatz und Umgebung rund um das Stadion.
export function buildEnvironment(scene, renderer) {
  scene.background = new THREE.Color(0x03050c);
  scene.fog = new THREE.FogExp2(0x0d1226, 0.0019);

  scene.add(sky());
  scene.add(stars());
  scene.add(ground(renderer));
  scene.add(entrancePath());
  scene.add(lampPosts());
}

function sky() {
  const geo = new THREE.SphereGeometry(1800, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(0x02030a) },
      mid: { value: new THREE.Color(0x0a1230) },
      horizon: { value: new THREE.Color(0x0d1226) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 top;
      uniform vec3 mid;
      uniform vec3 horizon;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(horizon, mid, smoothstep(0.0, 0.18, h));
        col = mix(col, top, smoothstep(0.18, 0.75, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  return new THREE.Mesh(geo, mat);
}

function stars() {
  const count = QUALITY === 'high' ? 1600 : 700;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const y = 0.15 + Math.random() * 0.85;
    const r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(theta) * r * 1600, y * 1600, Math.sin(theta) * r * 1600], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xbfcaf0, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.7 });
  return new THREE.Points(geo, mat);
}

function ground(renderer) {
  const tex = pavingTexture(renderer);
  tex.repeat.set(420, 420);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.05, color: 0x6d727c });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3600, 3600).rotateX(-Math.PI / 2), mat);
  mesh.position.y = -0.02;
  return mesh;
}

// Heller Weg mit Leitlinie zum Eingang Nord
function entrancePath() {
  const group = new THREE.Group();
  const startZ = -(ringAt(FACADE_OFFSET + 1).hz);
  const len = 70;
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(7, len).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x4a4e57, roughness: 0.8 }),
  );
  path.position.set(0, 0.0, startZ - len / 2);
  const guide = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, len).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd8d2bf, roughness: 0.6 }),
  );
  guide.position.set(-2.2, 0.01, startZ - len / 2);
  group.add(path, guide);
  return group;
}

function lampPosts() {
  const group = new THREE.Group();
  const startZ = -(ringAt(FACADE_OFFSET + 1).hz);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.5, metalness: 0.6 });
  const headMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 3.0, 2.3) });
  const pole = new THREE.CylinderGeometry(0.08, 0.1, 6, 8);
  const head = new THREE.BoxGeometry(0.9, 0.14, 0.32);
  for (let i = 0; i < 6; i++) {
    for (const side of [-1, 1]) {
      const z = startZ - 10 - i * 11;
      const x = side * 6;
      const p = new THREE.Mesh(pole, poleMat);
      p.position.set(x, 3, z);
      const h = new THREE.Mesh(head, headMat);
      h.position.set(x - side * 0.35, 6, z);
      group.add(p, h);
    }
    if (i < 3) {
      const light = new THREE.PointLight(0xffd7a0, 9, 18, 2);
      light.position.set(0, 5.5, startZ - 10 - i * 11);
      group.add(light);
    }
  }
  return group;
}
