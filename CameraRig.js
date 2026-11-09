import * as THREE from 'three';
import { REDUCED_MOTION } from './config.js';

const PITCH_MIN = -1.0;
const PITCH_MAX = 0.75;
const LOOK_SPEED = 0.0042; // Bogenmass pro Pixel
const KEY_STEP = 0.09;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function dirFromAngles(yaw, pitch, target = new THREE.Vector3()) {
  const c = Math.cos(pitch);
  return target.set(Math.sin(yaw) * c, Math.sin(pitch), Math.cos(yaw) * c);
}

function anglesFromDir(dir) {
  const d = dir.clone().normalize();
  return { yaw: Math.atan2(d.x, d.z), pitch: Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) };
}

// Steuert die Kamera: langsamer Überflug auf der Startseite, Fahrten zwischen
// Standorten und freies Umsehen an einem Standort.
export class CameraRig {
  constructor(camera, domElement) {
    this.camera = camera;
    this.camera.rotation.order = 'YXZ';
    this.dom = domElement;
    this.mode = 'overview';
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.time = 0;
    this.flight = null;
    this.lookEnabled = false;
    this.listeners = new Set();
    this.bindInput();
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(event) {
    for (const fn of this.listeners) fn(event);
  }

  get isFlying() {
    return this.flight !== null;
  }

  /* ---------- Startseite: langsamer Überflug über der Nordseite ---------- */
  overviewPose(t) {
    const a = Math.PI + 0.75 * Math.sin(t * 0.045);
    const R = 235;
    const pos = new THREE.Vector3(Math.sin(a) * R, 88 + 6 * Math.sin(t * 0.07), Math.cos(a) * R);
    const look = new THREE.Vector3(0, 6, 0).sub(pos);
    return { pos, ...anglesFromDir(look) };
  }

  showOverview() {
    this.mode = 'overview';
    this.flight = null;
    this.lookEnabled = false;
  }

  /* ---------- Fahrt zu einem Standort ---------- */
  // waypoints: Zwischenpunkte (ohne Start und Ziel)
  flyTo(location, waypoints, onArrive) {
    const start = this.camera.position.clone();
    const end = new THREE.Vector3(location.position.x, location.position.y, location.position.z);
    this.lookEnabled = false;

    if (REDUCED_MOTION) {
      this.emit({ type: 'fade', duration: 0.5 });
      this.flight = { reduced: true, t: 0, duration: 0.5, location, onArrive, end };
      return;
    }

    const points = [start, ...waypoints.map((p) => new THREE.Vector3(p.x, p.y, p.z)), end];
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const length = curve.getLength();
    const duration = THREE.MathUtils.clamp(length / 38, 2.4, 6);
    this.flight = {
      curve,
      t: 0,
      duration,
      location,
      onArrive,
      startDir: dirFromAngles(this.yaw, this.pitch),
      endDir: dirFromAngles(location.yaw, location.pitch),
    };
    this.mode = 'flying';
    this.emit({ type: 'flight-start', location });
  }

  skipFlight() {
    if (!this.flight) return;
    this.flight.t = this.flight.duration;
  }

  arrive(location, onArrive) {
    this.flight = null;
    this.mode = 'location';
    this.camera.position.set(location.position.x, location.position.y, location.position.z);
    this.yaw = this.targetYaw = location.yaw;
    this.pitch = this.targetPitch = location.pitch;
    this.lookEnabled = true;
    this.emit({ type: 'arrive', location });
    onArrive?.();
  }

  /* ---------- Umsehen ---------- */
  bindInput() {
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    this.dom.addEventListener('pointerdown', (e) => {
      if (!this.lookEnabled) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      this.dom.setPointerCapture(e.pointerId);
      this.dom.classList.add('is-dragging');
    });
    this.dom.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      this.look(dx * LOOK_SPEED, dy * LOOK_SPEED);
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      this.dom.classList.remove('is-dragging');
      if (this.dom.hasPointerCapture(e.pointerId)) this.dom.releasePointerCapture(e.pointerId);
    };
    this.dom.addEventListener('pointerup', end);
    this.dom.addEventListener('pointercancel', end);
  }

  // Positive Werte: nach links bzw. nach oben schauen
  look(dYaw, dPitch) {
    if (!this.lookEnabled) return;
    this.targetYaw += dYaw;
    this.targetPitch = THREE.MathUtils.clamp(this.targetPitch + dPitch, PITCH_MIN, PITCH_MAX);
  }

  lookStep(direction) {
    const map = { left: [KEY_STEP, 0], right: [-KEY_STEP, 0], up: [0, KEY_STEP], down: [0, -KEY_STEP] };
    const [y, p] = map[direction];
    this.look(y, p);
  }

  resetView(location) {
    this.targetYaw = location.yaw;
    this.targetPitch = location.pitch;
  }

  /* ---------- Pro Frame ---------- */
  update(dt) {
    this.time += dt;

    if (this.mode === 'overview') {
      const pose = this.overviewPose(this.time);
      this.camera.position.copy(pose.pos);
      this.yaw = pose.yaw;
      this.pitch = pose.pitch;
    } else if (this.flight) {
      const f = this.flight;
      f.t = Math.min(f.duration, f.t + dt);
      const u = f.t / f.duration;
      if (f.reduced) {
        if (u >= 0.5 && !f.jumped) {
          f.jumped = true;
          this.camera.position.copy(f.end);
          this.yaw = f.location.yaw;
          this.pitch = f.location.pitch;
        }
      } else {
        const s = easeInOutCubic(u);
        f.curve.getPointAt(s, this.camera.position);
        // Blick: zuerst in Fahrtrichtung, am Ende zur Zielrichtung
        const ahead = f.curve.getTangentAt(Math.min(0.999, s + 0.001));
        ahead.y = THREE.MathUtils.clamp(ahead.y, -0.55, 0.35);
        ahead.normalize();
        const dir = f.startDir.clone().lerp(ahead, smoothstep(0, 0.2, u)).lerp(f.endDir, smoothstep(0.62, 1, u)).normalize();
        const a = anglesFromDir(dir);
        this.yaw = a.yaw;
        this.pitch = a.pitch;
      }
      if (u >= 1) this.arrive(f.location, f.onArrive);
    } else {
      // sanft nachziehen
      const k = 1 - Math.exp(-dt * 10);
      this.yaw += (this.targetYaw - this.yaw) * k;
      this.pitch += (this.targetPitch - this.pitch) * k;
    }

    this.camera.rotation.set(this.pitch, this.yaw + Math.PI, 0);
  }
}
