import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { WorldMap } from '../WorldMap';
import { projectionAt } from '../utils/projection';
import { CAMERA, lerpCamera } from '../utils/camera';
import { easeInOut } from '../utils/easing';
import { SCENE2, SCENE3, VIDEO } from '../config';

/**
 * CENA 3 — Zoom acelerado num local específico + evento + consequências,
 * depois recuo para o contexto regional.
 * 450 frames (15s). Começa onde a Cena 2 terminou.
 */
export const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = VIDEO;

  // Câmera: 0-60 mergulha no local; segura; 380-450 recua.
  const diveT = interpolate(frame, [0, 60], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pullT = interpolate(frame, [380, 450], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const dive = lerpCamera(CAMERA.scene3Start, CAMERA.scene3Local, diveT);
  const cam = lerpCamera(dive, CAMERA.scene3End, pullT);
  const projection = projectionAt(width, height, cam.scale, cam.center);

  const focus = projection(CAMERA.focusPoint) ?? [width / 2, height / 2];
  const [fx, fy] = focus;

  // Linhas pontilhadas se desenhando (frames 60-120) — rotas/bloqueios.
  const drawT = interpolate(frame, [60, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pontos de rota ao redor do foco (offsets em graus lon/lat).
  const routeOffsets: Array<[number, number]> = [
    [-3.2, 1.4],
    [2.8, 1.9],
    [-1.5, -2.2],
    [3.1, -1.1],
  ];
  const routes = routeOffsets.map((off) => {
    const p = projection([
      CAMERA.focusPoint[0] + off[0],
      CAMERA.focusPoint[1] + off[1],
    ] as [number, number]);
    return (p ?? [fx, fy]) as [number, number];
  });

  // Evento principal (frames 120-280): marcadores pulsantes ao longo das rotas.
  const eventProgress = interpolate(frame, [120, 280], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eventPulse = 0.5 + 0.5 * Math.sin(frame / 5);

  // Consequências (frames 280-380): destaque vermelho + labels.
  const consequenceT = interpolate(frame, [280, 340], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const DASH = 400;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a1628' }}>
      <WorldMap
        width={width}
        height={height}
        projection={projection}
        highlights={[
          {
            name: SCENE2.countryB.countryName,
            color: '#7f1d1d',
            glow: consequenceT * 0.7,
          },
        ]}
      />

      <AbsoluteFill>
        <svg width={width} height={height}>
          {/* Linhas pontilhadas se desenhando do foco para as rotas. */}
          {routes.map(([rx, ry], i) => (
            <line
              key={`route-${i}`}
              x1={fx}
              y1={fy}
              x2={rx}
              y2={ry}
              stroke="#f5d90a"
              strokeWidth={2}
              strokeDasharray={`${DASH}`}
              strokeDashoffset={DASH * (1 - drawT)}
              opacity={0.85}
            />
          ))}

          {/* Evento: marcadores pulsantes surgindo ao longo das rotas. */}
          {eventProgress > 0 &&
            routes.map(([rx, ry], i) => {
              const appear = i / routes.length <= eventProgress ? 1 : 0;
              return appear ? (
                <circle
                  key={`event-${i}`}
                  cx={rx}
                  cy={ry}
                  r={6 + eventPulse * 6}
                  fill="#dc2626"
                  opacity={0.85}
                />
              ) : null;
            })}

          {/* Foco central marcado. */}
          {drawT > 0.1 && (
            <>
              <circle
                cx={fx}
                cy={fy}
                r={10}
                fill="#f5d90a"
                opacity={0.95}
              />
              <circle
                cx={fx}
                cy={fy}
                r={10 + eventPulse * 14}
                fill="none"
                stroke="#f5d90a"
                strokeWidth={2}
                opacity={0.5}
              />
            </>
          )}

          {/* Label do local (fade in nas consequências). */}
          <text
            x={fx}
            y={fy - 26}
            textAnchor="middle"
            fill="#fff"
            opacity={Math.max(drawT * 0.9, consequenceT)}
            style={{
              fontFamily: 'Arial, sans-serif',
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: 3,
              paintOrder: 'stroke',
              stroke: 'rgba(0,0,0,0.65)',
              strokeWidth: 5,
            }}
          >
            {SCENE3.focus.label}
          </text>
        </svg>
      </AbsoluteFill>

      {/* Overlay de consequência (véu vermelho sutil). */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at center, rgba(220,38,38,0.18) 0%, rgba(220,38,38,0) 55%)',
          opacity: consequenceT,
        }}
      />
    </AbsoluteFill>
  );
};
