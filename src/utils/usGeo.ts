import { geoAlbersUsa, geoPath, type GeoProjection } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import statesTopo from 'us-atlas/states-10m.json';

const topology = statesTopo as unknown as Parameters<typeof feature>[0];

/** Estados dos EUA (GeoJSON em lon/lat). */
export const usStates = feature(
  topology,
  (topology as any).objects.states,
) as unknown as FeatureCollection<Geometry, { name: string }>;

/** Contorno da nação (para ajustar o enquadramento). */
export const usNation = feature(
  topology,
  (topology as any).objects.nation,
) as unknown as FeatureCollection<Geometry, Record<string, unknown>>;

/**
 * Projeção AlbersUSA (reposiciona Alasca/Havaí como insets) ajustada a
 * uma caixa [x0,y0]-[x1,y1] do frame.
 */
export const albersFit = (
  box: [[number, number], [number, number]],
): GeoProjection => {
  const p = geoAlbersUsa();
  p.fitExtent(box, usNation as any);
  return p;
};

export { geoPath };
