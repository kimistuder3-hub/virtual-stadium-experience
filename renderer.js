import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { QUALITY } from './config.js';

export function isWebGLAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch {
    return false;
  }
}

// Renderer mit Bloom-Effekt für das Flutlicht.
export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: QUALITY === 'high',
    powerPreference: 'high-performance',
  });
  const maxRatio = QUALITY === 'high' ? 2 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxRatio));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
  const bloom = new UnrealBloomPass(size.multiplyScalar(0.5), 0.6, 0.45, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  return composer;
}
