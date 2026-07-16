import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { WorldMap } from '../WorldMap';
import { projectionAt } from '../utils/projection';
import { CAMERA, lerpCamera } from '../utils/camera';
import { easeOut } from '../utils/easing';
import { SCENE1, VIDEO } from '../config';

/**
 * CENA 1 — Abertura do mapa-múndi + zoom no país alvo.
 * 240 frames (8s). Termina centralizada no país alvo (= início da Cena 2).
 */
export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height } = VIDEO;

  // Câmera: 0-60 mundo estático; 60-180 zoom easeOut até o país alvo.
  const zoomT = interpolate(frame, [60, 180], [0, 1], {
    easing: easeOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cam = lerpCamera(CAMERA.scene1Start, CAMERA.scene1End, zoomT);
  const projection = projectionAt(width, height, cam.scale, cam.center);

  // Glow pulsante do país alvo (surge a partir do frame 150).
  const glowBase = interpolate(frame, [150, 190], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulse = 0.6 + 0.4 * Math.sin(frame / 6);
  const glow = glowBase * pulse;

  // Marcador central com spring (aparece no frame 180).
  const markerSpring = spring({
    frame: frame - 180,
    fps,
    config: { damping: 12, stiffness: 120 },
  });
  const markerR = markerSpring * 14;

  // Posição do centróide do país alvo na tela.
  const centerPx = projection(CAMERA.targetCentroid);
  const [cx, cy] = centerPx ?? [width / 2, height / 2];

  // Label do país (fade in junto com o glow).
  const labelOpacity = interpolate(frame, [180, 210], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Personagem opcional (frame 210-240) em P&B.
  const charOpacity = interpolate(frame, [210, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const charScale = spring({
    frame: frame - 210,
    fps,
    config: { damping: 14 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a1628' }}>
      <WorldMap
        width={width}
        height={height}
        projection={projection}
        highlights={[
          { name: SCENE1.target.countryName, color: SCENE1.target.color, glow },
        ]}
      />

      {/* Marcador + label sobre o país alvo. */}
      <AbsoluteFill>
        <svg width={width} height={height}>
          {markerSpring > 0.01 && (
            <>
              <circle
                cx={cx}
                cy={cy}
                r={markerR}
                fill={SCENE1.target.color}
                opacity={0.9}
              />
              <circle
                cx={cx}
                cy={cy}
                r={markerR + 8 + pulse * 6}
                fill="none"
                stroke={SCENE1.target.color}
                strokeWidth={2}
                opacity={0.5 * markerSpring}
              />
            </>
          )}
          <text
            x={cx}
            y={cy - 28}
            textAnchor="middle"
            fill="#ffffff"
            opacity={labelOpacity}
            style={{
              fontFamily: 'Arial, sans-serif',
              fontWeight: 800,
              fontSize: 34,
              letterSpacing: 2,
              paintOrder: 'stroke',
              stroke: 'rgba(0,0,0,0.6)',
              strokeWidth: 4,
            }}
          >
            {SCENE1.target.label}
          </text>
        </svg>
      </AbsoluteFill>

      {/* Personagem opcional (P&B). */}
      {SCENE1.characterAsset && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: charOpacity,
          }}
        >
          <Img
            src={staticFile(`assets/${SCENE1.characterAsset}`)}
            style={{
              filter: 'grayscale(1) contrast(1.1)',
              transform: `scale(${charScale})`,
              maxHeight: '55%',
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
