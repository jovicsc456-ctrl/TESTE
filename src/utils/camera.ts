import { VIDEO, SCENE1, SCENE2, SCENE3 } from '../config';
import { centroidOf, fitCamera, worldScale, WORLD_CENTER } from './projection';

/**
 * ESTADO DE CÂMERA COMPARTILHADO
 * ------------------------------
 * A regra crítica do guia: cada cena começa EXATAMENTE onde a anterior
 * terminou. Para garantir isso, definimos aqui os "keyframes" de câmera
 * (scale + centro geográfico) nos pontos de junção. Cada cena importa
 * estes valores, então a continuidade é garantida por construção.
 */

const W = VIDEO.width;
const H = VIDEO.height;

const base = worldScale(W, H);

// Fatores de zoom (multiplicadores da escala base do mundo).
const ZOOM = {
  world: 1,
  country: 5.5, // enquadra um país
  region: 9, // enquadra uma região
  local: 22, // close em um local específico
} as const;

export type CameraState = {
  scale: number;
  center: [number, number];
};

const targetCentroid = centroidOf(SCENE1.target.countryName);
const countryACentroid = centroidOf(SCENE2.countryA.countryName);
const countryBCentroid = centroidOf(SCENE2.countryB.countryName);
const focusPoint: [number, number] = [SCENE3.focus.lon, SCENE3.focus.lat];

// Pontos de origem/destino do movimento da Cena 2 (explícitos ou centróides).
const movementFrom: [number, number] = SCENE2.from ?? countryACentroid;
const movementTo: [number, number] = SCENE2.to ?? countryBCentroid;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

// Enquadramento adaptativo que mostra origem + destino do movimento,
// com o zoom limitado a uma faixa regional agradável.
const fitMovement = fitCamera(W, H, [movementFrom, movementTo], 0.3);
const scene2MidScale = clamp(
  fitMovement.scale,
  base * ZOOM.country,
  base * ZOOM.local * 0.7,
);

export const CAMERA = {
  base,
  zoom: ZOOM,

  // Cena 1: começa no mundo, termina centralizada no país alvo.
  scene1Start: { scale: base * ZOOM.world, center: WORLD_CENTER },
  scene1End: { scale: base * ZOOM.country, center: targetCentroid },

  // Cena 2: começa onde a 1 terminou; abre p/ enquadrar o movimento;
  // termina assentada no destino (que emenda com a Cena 3).
  scene2Start: { scale: base * ZOOM.country, center: targetCentroid },
  scene2Mid: { scale: scene2MidScale, center: fitMovement.center },
  scene2End: { scale: base * ZOOM.region, center: movementTo },

  // Cena 3: começa onde a 2 terminou; mergulha no local; recua no fim.
  scene3Start: { scale: base * ZOOM.region, center: movementTo },
  scene3Local: { scale: base * ZOOM.local, center: focusPoint },
  scene3End: { scale: base * ZOOM.region, center: focusPoint },

  targetCentroid,
  countryACentroid,
  countryBCentroid,
  movementFrom,
  movementTo,
  focusPoint,
} as const;

/** Interpola linearmente entre dois estados de câmera. */
export const lerpCamera = (
  a: CameraState,
  b: CameraState,
  t: number,
): CameraState => ({
  scale: a.scale + (b.scale - a.scale) * t,
  center: [
    a.center[0] + (b.center[0] - a.center[0]) * t,
    a.center[1] + (b.center[1] - a.center[1]) * t,
  ],
});
