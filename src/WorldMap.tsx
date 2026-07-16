import React, { useMemo } from 'react';
import { geoPath, type GeoProjection } from 'd3-geo';
import { AbsoluteFill } from 'remotion';
import { countries } from './utils/projection';
import { PALETTE } from './config';

export type CountryHighlight = {
  name: string;
  color: string;
  /** brilho do outline 0..1 (glow pulsante). */
  glow?: number;
};

type Props = {
  width: number;
  height: number;
  projection: GeoProjection;
  highlights?: CountryHighlight[];
};

/**
 * Mapa base reutilizável estilo Vox.
 * Recebe uma projeção D3 já configurada (com o zoom do frame atual) e
 * desenha o oceano, os países e os destaques com glow.
 */
export const WorldMap: React.FC<Props> = ({
  width,
  height,
  projection,
  highlights = [],
}) => {
  const path = useMemo(() => geoPath(projection), [projection]);

  const highlightByName = useMemo(() => {
    const map = new Map<string, CountryHighlight>();
    for (const h of highlights) map.set(h.name.toLowerCase(), h);
    return map;
  }, [highlights]);

  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.oceanDeep }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {/* Oceano com escurecimento radial nas bordas. */}
          <radialGradient id="ocean-grad" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor={PALETTE.oceanDeep} />
            <stop offset="100%" stopColor={PALETTE.oceanEdge} />
          </radialGradient>
          {/* Glow reutilizável para outline dos países destacados. */}
          <filter id="country-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={width} height={height} fill="url(#ocean-grad)" />

        {/* Países base. */}
        {countries.features.map((f, i) => {
          const d = path(f);
          if (!d) return null;
          const hl = highlightByName.get(
            (f.properties?.name ?? '').toLowerCase(),
          );
          return (
            <path
              key={`base-${i}`}
              d={d}
              fill={hl ? hl.color : PALETTE.country}
              stroke={PALETTE.countryBorder}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Outline com glow por cima dos destaques. */}
        {countries.features.map((f, i) => {
          const hl = highlightByName.get(
            (f.properties?.name ?? '').toLowerCase(),
          );
          if (!hl) return null;
          const d = path(f);
          if (!d) return null;
          return (
            <path
              key={`glow-${i}`}
              d={d}
              fill="none"
              stroke={PALETTE.glow}
              strokeWidth={1.5}
              opacity={hl.glow ?? 0.9}
              filter="url(#country-glow)"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
