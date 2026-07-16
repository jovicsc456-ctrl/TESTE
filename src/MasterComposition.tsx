import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { FilmGrain, Vignette } from './utils/filmGrain';
import { SCENE1, SCENE2, SCENE3 } from './config';

/**
 * COMPOSIÇÃO MASTER
 * -----------------
 * Encadeia as cenas com <Series> (plano-sequência contínuo, sem fade/cut).
 * Cada cena herda o estado de câmera exato onde a anterior terminou
 * (garantido pelos keyframes em utils/camera.ts).
 *
 * Overlays globais aplicados por cima de tudo:
 *  1. Film grain animado (mix-blend overlay, opacity 0.045)
 *  2. Vignette permanente
 *  3. Color grade de documentário (contrast/saturate/brightness)
 */
export const MasterComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0a1628' }}>
      {/* Color grade aplicado ao conteúdo (não aos overlays de grain). */}
      <AbsoluteFill
        style={{ filter: 'contrast(1.08) saturate(0.92) brightness(0.96)' }}
      >
        <Series>
          <Series.Sequence durationInFrames={SCENE1.durationInFrames}>
            <Scene1 />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENE2.durationInFrames}>
            <Scene2 />
          </Series.Sequence>
          <Series.Sequence durationInFrames={SCENE3.durationInFrames}>
            <Scene3 />
          </Series.Sequence>
        </Series>
      </AbsoluteFill>

      {/* Overlays globais. */}
      <Vignette strength={0.65} />
      <FilmGrain opacity={0.045} />
    </AbsoluteFill>
  );
};
