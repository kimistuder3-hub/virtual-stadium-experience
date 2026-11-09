import * as THREE from 'three';
import { PITCH } from './config.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function finish(c, renderer, { repeat = false, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(c);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// Rasen mit Mähstreifen und Linien. 1 Pixel = 5 cm.
export function pitchTexture(renderer) {
  const scale = 18; // Pixel pro Meter
  const totalL = PITCH.length + PITCH.grassMargin * 2;
  const totalW = PITCH.width + PITCH.grassMargin * 2;
  const [c, g] = canvas(Math.round(totalL * scale), Math.round(totalW * scale));
  const m = PITCH.grassMargin * scale;
  const L = PITCH.length * scale;
  const W = PITCH.width * scale;

  // Mähstreifen
  const stripes = 18;
  const sw = L / stripes;
  g.fillStyle = '#1f5a2c';
  g.fillRect(0, 0, c.width, c.height);
  for (let i = -2; i < stripes + 2; i++) {
    g.fillStyle = i % 2 === 0 ? '#246633' : '#1c5228';
    g.fillRect(m + i * sw, 0, sw, c.height);
  }
  // leichtes Rauschen für natürlichere Fläche
  const noise = g.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < noise.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    noise.data[i] += n;
    noise.data[i + 1] += n;
    noise.data[i + 2] += n;
  }
  g.putImageData(noise, 0, 0);

  // Linien
  g.strokeStyle = 'rgba(245,248,245,0.92)';
  g.lineWidth = 0.12 * scale;
  g.strokeRect(m, m, L, W);
  g.beginPath();
  g.moveTo(m + L / 2, m);
  g.lineTo(m + L / 2, m + W);
  g.stroke();
  g.beginPath();
  g.arc(m + L / 2, m + W / 2, 9.15 * scale, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = 'rgba(245,248,245,0.92)';
  g.beginPath();
  g.arc(m + L / 2, m + W / 2, 0.3 * scale, 0, Math.PI * 2);
  g.fill();

  for (const side of [0, 1]) {
    const x0 = side === 0 ? m : m + L;
    const dir = side === 0 ? 1 : -1;
    // Strafraum
    g.strokeRect(side === 0 ? x0 : x0 - 16.5 * scale, m + W / 2 - 20.16 * scale, 16.5 * scale, 40.32 * scale);
    // Torraum
    g.strokeRect(side === 0 ? x0 : x0 - 5.5 * scale, m + W / 2 - 9.16 * scale, 5.5 * scale, 18.32 * scale);
    // Elfmeterpunkt
    g.beginPath();
    g.arc(x0 + dir * 11 * scale, m + W / 2, 0.25 * scale, 0, Math.PI * 2);
    g.fill();
    // Strafraumbogen
    g.beginPath();
    const a = Math.acos(5.5 / 9.15);
    if (side === 0) g.arc(x0 + 11 * scale, m + W / 2, 9.15 * scale, -a, a);
    else g.arc(x0 - 11 * scale, m + W / 2, 9.15 * scale, Math.PI - a, Math.PI + a);
    g.stroke();
  }
  return finish(c, renderer);
}

// Leuchtende Bandenwerbung – neutrale, eigene Inhalte (keine Marken).
export function ledBoardTexture(renderer) {
  const [c, g] = canvas(2048, 64);
  const grad = g.createLinearGradient(0, 0, c.width, 0);
  grad.addColorStop(0, '#0a1a4a');
  grad.addColorStop(0.5, '#10287a');
  grad.addColorStop(1, '#0a1a4a');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  g.font = '600 30px "Inter Variable", Inter, sans-serif';
  g.textBaseline = 'middle';
  g.fillStyle = '#f2f4f8';
  const items = ['ALBANIEN – ITALIEN', 'VIRTUAL STADIUM EXPERIENCE', 'SIMULATION', 'FREUNDSCHAFTSSPIEL'];
  let x = 40;
  let i = 0;
  while (x < c.width) {
    const t = items[i % items.length];
    g.fillText(t, x, c.height / 2 + 1);
    x += g.measureText(t).width + 60;
    g.fillStyle = '#c9a96a';
    g.fillRect(x - 36, c.height / 2 - 3, 6, 6);
    g.fillStyle = '#f2f4f8';
    i++;
  }
  return finish(c, renderer, { repeat: true });
}

// Schild beim Eingang mit vereinfachtem Rollstuhlsymbol.
export function entranceSignTexture(renderer) {
  const [c, g] = canvas(1024, 256);
  g.fillStyle = '#0b1430';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#c9a96a';
  g.lineWidth = 4;
  g.strokeRect(10, 10, c.width - 20, c.height - 20);

  // Rollstuhlsymbol (vereinfacht)
  g.fillStyle = '#1f5fd6';
  g.fillRect(40, 38, 180, 180);
  g.strokeStyle = '#ffffff';
  g.fillStyle = '#ffffff';
  g.lineWidth = 12;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(122, 70, 13, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(118, 96);
  g.lineTo(118, 140);
  g.lineTo(162, 140);
  g.lineTo(178, 182);
  g.moveTo(118, 112);
  g.lineTo(152, 112);
  g.stroke();
  g.beginPath();
  g.arc(116, 160, 36, Math.PI * 0.15, Math.PI * 1.55);
  g.stroke();

  g.fillStyle = '#ffffff';
  g.textBaseline = 'alphabetic';
  g.font = '700 74px "Inter Variable", Inter, sans-serif';
  g.fillText('EINGANG NORD', 260, 126);
  g.fillStyle = '#c3cad8';
  g.font = '500 34px "Inter Variable", Inter, sans-serif';
  g.fillText('Stufenloser Zugang · Beispiel', 262, 186);
  return finish(c, renderer);
}

// Strukturierte Bodenplatten für den Vorplatz.
export function pavingTexture(renderer) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#2a2d33';
  g.fillRect(0, 0, 512, 512);
  const img = g.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 3;
  for (let i = 0; i <= 512; i += 128) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(512, i);
    g.stroke();
  }
  return finish(c, renderer, { repeat: true });
}
