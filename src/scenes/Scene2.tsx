import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { geoInterpolate } from 'd3-geo';
import { WorldMap } from '../WorldMap';
import { projectionAt } from '../utils/projection';
import { CAMERA, lerpCamera } from '../utils/camera';
import { easeInOut, easeOut } from '../utils/easing';
import { SCENE2, VIDEO } from '../config';

/**
 * CENA 2 — Dois territórios iluminam + assets viajam de A para B por um
 * arco geodésico, com a câmera acompanhando. Impactos ao chegar.
 * 240 frames (8s). Começa onde a Cena 1 terminou.
 */
export const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height } = VIDEO;

  // Câmera: 40-120 abre para região; 120-200 assenta no alvo B.
  const openT = interpolate(frame, [40, 120], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const settleT = interpolate(frame, [120, 200], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const camMid = lerpCamera(CAMERA.scene2Start, CAMERA.scene2Mid, openT);
  const cam = lerpCamera(camMid, CAMERA.scene2End, settleT);
  const projection = projectionAt(width, height, cam.scale, cam.center);

  // Iluminação dos países (A no frame 0-40, B no 40-80).
  const glowA = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const glowB = interpolate(frame, [40, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Arco geodésico origem -> destino do movimento.
  const arc = geoInterpolate(CAMERA.movementFrom, CAMERA.movementTo);

  // Posição na tela de um ponto do arco em t ∈ [0,1].
  const arcScreen = (t: number): [number, number] => {
    const p = projection(arc(Math.max(0, Math.min(1, t))) as [number, number]);
    return (p ?? [width / 2, height / 2]) as [number, number];
  };

  // Assets em movimento (frames 80-160), escalonados.
  const jets = Array.from({ length: SCENE2.movingCount }, (_, i) => {
    const stagger = i * 8;
    const t = interpolate(frame, [80 + stagger, 160 + stagger], [0, 1], {
      easing: easeOut,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const [x, y] = arcScreen(t);
    const [x2, y2] = arcScreen(Math.min(1, t + 0.01));
    const angle = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
    const visible = frame >= 80 + stagger && t < 1;
    // pequena dispersão lateral entre os jets.
    const offset = (i - (SCENE2.movingCount - 1) / 2) * 22;
    return { x, y, angle, visible, t, offset };
  });

  // Impacto/explosão a partir do frame 160.
  const impactSpring = spring({
    frame: frame - 160,
    fps,
    config: { damping: 10, stiffness: 140 },
  });
  const [bx, by] = arcScreen(1);
  const impactPulse = 0.5 + 0.5 * Math.sin(frame / 5);

  // Labels posicionados perto dos pontos de movimento (visíveis no zoom).
  const labelA = projection(CAMERA.movementFrom);
  const labelB = projection(CAMERA.movementTo);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a1628' }}>
      <WorldMap
        width={width}
        height={height}
        projection={projection}
        highlights={[
          {
            name: SCENE2.countryA.countryName,
            color: SCENE2.countryA.color,
            glow: glowA * 0.9,
          },
          {
            name: SCENE2.countryB.countryName,
            color: SCENE2.countryB.color,
            glow: glowB * 0.9,
          },
        ]}
      />

      <AbsoluteFill>
        <svg width={width} height={height}>
          {/* Rastro do arco (linha tracejada guia). */}
          <path
            d={`M ${arcScreen(0)[0]} ${arcScreen(0)[1]} ${Array.from(
              { length: 40 },
              (_, k) => {
                const [lx, ly] = arcScreen(k / 39);
                return `L ${lx} ${ly}`;
              },
            ).join(' ')}`}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1.5}
            strokeDasharray="6 8"
          />

          {/* Assets procedurais (jets em forma de seta). */}
          {jets.map((j, i) =>
            j.visible ? (
              <g
                key={i}
                transform={`translate(${j.x + j.offset * Math.cos(((j.angle + 90) * Math.PI) / 180)}, ${
                  j.y + j.offset * Math.sin(((j.angle + 90) * Math.PI) / 180)
                }) rotate(${j.angle})`}
              >
                <polygon
                  points="14,0 -8,-7 -3,0 -8,7"
                  fill="#e8eef7"
                  stroke="#9fb3d1"
                  strokeWidth={1}
                />
              </g>
            ) : null,
          )}

          {/* Marcadores de impacto pulsantes. */}
          {impactSpring > 0.01 && (
            <>
              <circle
                cx={bx}
                cy={by}
                r={impactSpring * 16}
                fill="#dc2626"
                opacity={0.85}
              />
              <circle
                cx={bx}
                cy={by}
                r={impactSpring * (24 + impactPulse * 18)}
                fill="none"
                stroke="#dc2626"
                strokeWidth={2}
                opacity={0.6 * impactSpring}
              />
            </>
          )}

          {/* Labels dos países. */}
          {labelA && glowA > 0.1 && (
            <text
              x={labelA[0]}
              y={labelA[1] - 18}
              textAnchor="middle"
              fill="#fff"
              opacity={glowA}
              style={sceneLabelStyle}
            >
              {SCENE2.countryA.label}
            </text>
          )}
          {labelB && glowB > 0.1 && (
            <text
              x={labelB[0]}
              y={labelB[1] - 18}
              textAnchor="middle"
              fill="#fff"
              opacity={glowB}
              style={sceneLabelStyle}
            >
              {SCENE2.countryB.label}
            </text>
          )}
        </svg>
      </AbsoluteFill>

      {/* Vídeo de explosão opcional (screen blend p/ remover fundo preto). */}
      {SCENE2.explosionAsset && frame >= 160 && frame <= 200 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <OffthreadVideo
            src={staticFile(`assets/${SCENE2.explosionAsset}`)}
            style={{
              mixBlendMode: 'screen',
              opacity: 0.9,
              width: 400,
              transform: `translate(${bx - width / 2}px, ${by - height / 2}px)`,
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const sceneLabelStyle: React.CSSProperties = {
  fontFamily: 'Arial, sans-serif',
  fontWeight: 800,
  fontSize: 26,
  letterSpacing: 2,
  paintOrder: 'stroke',
  stroke: 'rgba(0,0,0,0.6)',
  strokeWidth: 4,
};
