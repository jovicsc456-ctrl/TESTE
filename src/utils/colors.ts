/** Utilitários de cor para o choropleth (interpolação em RGB). */

type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

const rgbToCss = ([r, g, b]: RGB): string =>
  `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpRgb = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/**
 * Escala sequencial multi-stop (navy -> azul -> dourado).
 * t ∈ [0,1]. Usa power 0.6 para espalhar melhor os tons.
 */
const STOPS: RGB[] = [
  hexToRgb('#16233a'), // baixo (navy)
  hexToRgb('#2f6fb0'), // médio (azul)
  hexToRgb('#f5d90a'), // alto (dourado)
];

export const gdpColor = (t: number): string => {
  const tt = Math.pow(Math.max(0, Math.min(1, t)), 0.6);
  const seg = tt * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(seg));
  return rgbToCss(lerpRgb(STOPS[i], STOPS[i + 1], seg - i));
};
