import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

/**
 * FILM GRAIN PROCEDURAL
 * ---------------------
 * Usa um filtro SVG feTurbulence com `seed` variando por frame — 100%
 * determinístico (essencial para render reproduzível, ao contrário de
 * Math.random). Sobreposto com mix-blend-mode overlay e opacidade baixa.
 */
export const FilmGrain: React.FC<{ opacity?: number }> = ({
  opacity = 0.045,
}) => {
  const frame = useCurrentFrame();
  // seed determinístico por frame (fórmula do guia).
  const seed = (frame * 9301 + 49297) % 233280;
  const id = 'film-grain-noise';

  return (
    <AbsoluteFill
      style={{
        opacity,
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }}
    >
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves={2}
            stitchTiles="stitch"
            seed={seed}
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

/**
 * VIGNETTE — gradiente radial escurecendo as bordas. Sempre ativo.
 */
export const Vignette: React.FC<{ strength?: number }> = ({
  strength = 0.65,
}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);
