import { geoNaturalEarth1, geoCentroid, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
// world-atlas: dados TopoJSON reais dos países (110m).
import worldData from 'world-atlas/countries-110m.json';

// Desempacota os shapes dos países (TopoJSON -> GeoJSON).
const topology = worldData as unknown as Parameters<typeof feature>[0];
export const countries = feature(
  topology,
  (topology as any).objects.countries,
) as unknown as FeatureCollection<Geometry, { name: string }>;

/** Busca um país pelo nome (case-insensitive) como aparece no world-atlas. */
export const findCountry = (
  name: string,
): Feature<Geometry, { name: string }> | undefined =>
  countries.features.find(
    (f) => (f.properties?.name ?? '').toLowerCase() === name.toLowerCase(),
  );

/** Centróide [lon, lat] de um país pelo nome. Fallback [0, 20] se não achar. */
export const centroidOf = (name: string): [number, number] => {
  const c = findCountry(name);
  if (!c) {
    // eslint-disable-next-line no-console
    console.warn(`[projection] país não encontrado no world-atlas: "${name}"`);
    return [0, 20];
  }
  return geoCentroid(c) as [number, number];
};

/**
 * Escala base da projeção NaturalEarth1 que enquadra o mundo inteiro
 * no viewport (calculada uma vez a partir de fitSize sobre a esfera).
 */
export const worldScale = (width: number, height: number): number => {
  const p = geoNaturalEarth1();
  p.fitSize([width, height], { type: 'Sphere' });
  return p.scale();
};

/**
 * Constrói uma projeção NaturalEarth1 com uma dada `scale`, recentralizada
 * de modo que o ponto geográfico `center` [lon, lat] caia no centro da tela.
 * É assim que fazemos o zoom cinematográfico: interpolando scale + center
 * por frame.
 */
export const projectionAt = (
  width: number,
  height: number,
  scale: number,
  center: [number, number],
): GeoProjection => {
  const p = geoNaturalEarth1()
    .scale(scale)
    .translate([0, 0]);
  const pt = p(center);
  const [px, py] = pt ?? [0, 0];
  p.translate([width / 2 - px, height / 2 - py]);
  return p;
};

/** Centro geográfico "de mundo" usado no início da Cena 1. */
export const WORLD_CENTER: [number, number] = [10, 25];

/**
 * Calcula uma câmera { scale, center } que enquadra um conjunto de pontos
 * [lon, lat] dentro do viewport, com padding relativo. Usa fitExtent do D3
 * e depois inverte o centro da tela para obter o centro geográfico —
 * compatível com projectionAt(). Adaptativo a qualquer par de países.
 */
export const fitCamera = (
  width: number,
  height: number,
  points: Array<[number, number]>,
  padFraction = 0.28,
): { scale: number; center: [number, number] } => {
  const px = width * padFraction;
  const py = height * padFraction;
  const p = geoNaturalEarth1();
  p.fitExtent(
    [
      [px, py],
      [width - px, height - py],
    ],
    { type: 'MultiPoint', coordinates: points },
  );
  const center = (p.invert?.([width / 2, height / 2]) ?? [0, 0]) as [
    number,
    number,
  ];
  return { scale: p.scale(), center };
};
