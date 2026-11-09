import '@fontsource-variable/inter';
import './main.css';
import * as THREE from 'three';
import { createRenderer, createComposer, isWebGLAvailable } from './renderer.js';
import { buildStadium } from './stadium.js';
import { buildEnvironment } from './environment.js';
import { CameraRig } from './CameraRig.js';
import { LOCATIONS, flightWaypoints } from './locations.js';
import { TourUI } from './tour.js';
import { showToast } from './toast.js';

const $ = (sel) => document.querySelector(sel);

window.addEventListener('error', () => showToast('Etwas ist schiefgelaufen. Bitte lade die Seite neu.'));
window.addEventListener('unhandledrejection', () => showToast('Etwas ist schiefgelaufen. Bitte lade die Seite neu.'));

async function init() {
  if (!isWebGLAvailable()) {
    $('#loader').hidden = true;
    $('#fallback').hidden = false;
    return;
  }

  // Schrift laden, bevor Texturen mit Text gezeichnet werden
  try {
    await Promise.race([
      Promise.all([document.fonts.load('700 40px "Inter Variable"'), document.fonts.load('500 20px "Inter Variable"')]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    /* Ersatzschrift genügt */
  }

  const canvas = $('#scene');
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 4000);

  buildEnvironment(scene, renderer);
  scene.add(buildStadium(renderer));

  const composer = createComposer(renderer, scene, camera);
  const rig = new CameraRig(camera, canvas);

  const tour = new TourUI({
    locations: LOCATIONS,
    onSelect: (loc) => goTo(loc),
    onSkip: () => rig.skipFlight(),
    onLook: (dir) => rig.lookStep(dir),
    onReset: () => current && rig.resetView(current),
    onBack: () => showStart(),
  });

  let current = null;

  function goTo(loc) {
    if (rig.isFlying || loc === current) return;
    const waypoints = flightWaypoints(current, loc, camera.position);
    tour.startFlight(loc);
    rig.flyTo(loc, waypoints, () => {
      current = loc;
      tour.arrive(loc);
    });
  }

  function showStart() {
    current = null;
    rig.showOverview();
    tour.hide();
    $('#start').hidden = false;
    $('#enter').focus();
  }

  $('#enter').addEventListener('click', () => {
    $('#start').hidden = true;
    tour.show();
    goTo(LOCATIONS[0]);
  });

  rig.onChange((e) => {
    if (e.type === 'fade') {
      document.body.classList.add('is-fading');
      setTimeout(() => document.body.classList.remove('is-fading'), e.duration * 1000);
    }
  });

  // Grösse anpassen
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 72 : 58; // Hochformat: etwas weiterer Blickwinkel
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    $('#fallback-text').textContent =
      'Die 3D-Ansicht wurde vom Browser unterbrochen (zu wenig Grafikspeicher). Bitte lade die Seite neu.';
    $('#fallback').hidden = false;
  });

  // Renderloop
  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    rig.update(dt);
    tour.updateMap(camera.position, rig.yaw, rig.mode !== 'overview');
    composer.render();
    requestAnimationFrame(frame);
  }

  // erstes Bild rendern, dann Startseite zeigen
  rig.update(0);
  composer.render();
  $('#loader').classList.add('is-done');
  setTimeout(() => ($('#loader').hidden = true), 600);
  $('#start').hidden = false;
  document.body.classList.add('is-ready');
  requestAnimationFrame(frame);
}

init();
