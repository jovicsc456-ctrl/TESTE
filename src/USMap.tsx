import React, { useMemo } from 'react';
import { AbsoluteFill } from 'remotion';
import { albersFit, geoPath, usStates } from './utils/usGeo';
import { GDP_BY_NAME, MAX_GDP } from './data/usStatesGdp';
import { gdpColor } from './utils/colors';
import { PALETTE } from './config';

type Props = {
  width: number;
  height: number;
  /** caixa de enquadramento do mapa dentro do frame. */
  box: [[number, number], [number, number]];
  /** 0..1 — progresso do preenchimento do choropleth. */
  colorProgress: number;
  /** estados com outline dourado + glow (top do ranking já revelado). */
  highlightNames?: string[];
  /** intensidade do glow pulsante 0..1. */
  glow?: number;
};

/**
 * Mapa dos EUA em choropleth: a cor de cada estado representa o PIB.
 * Estados sem dado ficam no cinza-azulado base.
 */
export const USMap: React.FC<Props> = ({
  width,
  height,
  box,
  colorProgress,
  highlightNames = [],
  glow = 0,
}) => {
  const projection = useMemo(() => albersFit(box), [box]);
  const path = useMemo(() => geoPath(projection), [projection]);
  const highlightSet = useMemo(
    () => new Set(highlightNames.map((n) => n.toLowerCase())),
    [highlightNames],
  );

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <filter id="us-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Estados (choropleth). */}
        {usStates.features.map((f, i) => {
          const d = path(f);
          if (!d) return null;
          const name = f.properties?.name ?? '';
          const gdp = GDP_BY_NAME.get(name.toLowerCase());
          const fill =
            gdp === undefined
              ? PALETTE.country
              : gdpColor((gdp / MAX_GDP) * colorProgress);
          return (
            <path
              key={`st-${i}`}
              d={d}
              fill={fill}
              stroke={PALETTE.countryBorder}
              strokeWidth={0.6}
            />
          );
        })}

        {/* Outline dourado com glow nos estados destacados. */}
        {usStates.features.map((f, i) => {
          const name = (f.properties?.name ?? '').toLowerCase();
          if (!highlightSet.has(name)) return null;
          const d = path(f);
          if (!d) return null;
          return (
            <path
              key={`hl-${i}`}
              d={d}
              fill="none"
              stroke={PALETTE.highlight}
              strokeWidth={2}
              opacity={0.6 + 0.4 * glow}
              filter="url(#us-glow)"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export { albersFit, geoPath };
