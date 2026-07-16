/**
 * Funções de easing usadas nos movimentos de câmera e animações.
 * Todas recebem t ∈ [0,1] e retornam um valor "eased".
 */

export const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

export const easeInOut = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

export const easeBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Interpolação linear simples. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
