import { geoInterpolate } from 'd3-geo';
import type { Position } from 'geojson';
import { countries } from './projection';

/** Converte lat/lon (graus) para um ponto 3D na esfera de raio r. */
export const latLngToVec3 = (
  lat: number,
  lon: number,
  r: number,
): [number, number, number] => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
};

/** Empurra os segmentos (pares de pontos) de um anel de coordenadas. */
const pushRing = (ring: Position[], r: number, out: number[]) => {
  for (let i = 0; i < ring.length - 1; i++) {
    const a = latLngToVec3(ring[i][1], ring[i][0], r);
    const b = latLngToVec3(ring[i + 1][1], ring[i + 1][0], r);
    out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  }
};

/** Contornos de todos os países como segmentos de linha (LineSegments). */
export const countrySegments = (r: number): Float32Array => {
  const out: number[] = [];
  for (const f of countries.features) {
    const g = f.geometry;
    if (g.type === 'Polygon') {
      for (const ring of g.coordinates) pushRing(ring, r, out);
    } else if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates)
        for (const ring of poly) pushRing(ring, r, out);
    }
  }
  return new Float32Array(out);
};

/** Grade de meridianos e paralelos (graticule) como segmentos. */
export const graticuleSegments = (r: number, step = 30): Float32Array => {
  const out: number[] = [];
  const seg = (
    la1: number,
    lo1: number,
    la2: number,
    lo2: number,
  ) => {
    const a = latLngToVec3(la1, lo1, r);
    const b = latLngToVec3(la2, lo2, r);
    out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  };
  // Meridianos.
  for (let lon = -180; lon < 180; lon += step) {
    for (let lat = -90; lat < 90; lat += 5) seg(lat, lon, lat + 5, lon);
  }
  // Paralelos.
  for (let lat = -60; lat <= 60; lat += step) {
    for (let lon = -180; lon < 180; lon += 5) seg(lat, lon, lat, lon + 5);
  }
  return new Float32Array(out);
};

/**
 * Pontos de um arco geodésico entre dois lon/lat, subindo acima da
 * superfície (altura máxima no meio). Retorna posições planas [x,y,z,...].
 */
export const arcStrip = (
  from: [number, number],
  to: [number, number],
  r: number,
  altitude: number,
  steps = 64,
): Float32Array => {
  const interp = geoInterpolate(from, to);
  const out = new Float32Array((steps + 1) * 3);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [lon, lat] = interp(t);
    const h = r * (1 + altitude * Math.sin(Math.PI * t));
    const p = latLngToVec3(lat, lon, h);
    out[i * 3] = p[0];
    out[i * 3 + 1] = p[1];
    out[i * 3 + 2] = p[2];
  }
  return out;
};
