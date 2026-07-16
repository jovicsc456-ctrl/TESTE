import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { USMap } from './USMap';
import { albersFit, geoPath, usStates } from './utils/usGeo';
import { topStates, MAX_GDP } from './data/usStatesGdp';
import { STATE_ABBR } from './data/usStateAbbr';
import { gdpColor } from './utils/colors';
import { FilmGrain, Vignette } from './utils/filmGrain';
import { easeOut } from './utils/easing';
import { PALETTE, VIDEO } from './config';

// Caixa de enquadramento do mapa (deixa a faixa direita p/ o ranking).
const MAP_BOX: [[number, number], [number, number]] = [
  [50, 170],
  [1180, 950],
];

const PANEL_X = 1240;
const PANEL_W = 620;
const ROW_TOP = 250;
const ROW_H = 70;
const BAR_X = PANEL_X + 60;
const BAR_MAX_W = 470;
const TOP_N = 10;

const fmt = (v: number) => Math.round(v).toLocaleString('pt-BR');

/** Frame em que o estado i (0-based) é revelado no ranking. */
const revealStart = (i: number) => 80 + i * 24;

/** Pequenos deslocamentos p/ estados apertados (nordeste) — reduz sobreposição. */
const CHIP_OFFSET: Record<string, [number, number]> = {
  NJ: [34, 20],
  NY: [6, -18],
  PA: [-10, 6],
  DC: [40, 26],
  MD: [30, 22],
  MA: [40, -6],
  CT: [26, 30],
};

type Chip = {
  name: string;
  abbr: string;
  rank: number;
  x: number;
  y: number;
};

/**
 * Bandeira do estado surgindo suavemente sobre ele e permanecendo,
 * com o nome do estado e um badge de posição.
 */
const FlagChip: React.FC<{ chip: Chip; frame: number; fps: number }> = ({
  chip,
  frame,
  fps,
}) => {
  const start = revealStart(chip.rank - 1);
  const appear = spring({
    frame: frame - start,
    fps,
    config: { damping: 18, stiffness: 90 },
  });
  const opacity = interpolate(frame, [start, start + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (frame < start) return null;

  const W = 58;
  const H = Math.round(W / 1.55);
  const rise = (1 - appear) * 14; // sobe suavemente ao surgir

  return (
    <div
      style={{
        position: 'absolute',
        left: chip.x,
        top: chip.y,
        opacity,
        transform: `translate(-50%, -50%) translateY(${rise}px) scale(${
          0.82 + appear * 0.18
        })`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Img
          src={staticFile(`assets/flags/${chip.abbr}.svg`)}
          style={{
            width: W,
            height: H,
            objectFit: 'cover',
            borderRadius: 5,
            border: '1.5px solid rgba(255,255,255,0.85)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.55)',
          }}
        />
        {/* badge de posição */}
        <div
          style={{
            position: 'absolute',
            top: -9,
            left: -9,
            width: 22,
            height: 22,
            borderRadius: 11,
            background:
              chip.rank <= 3 ? PALETTE.highlight : 'rgba(20,30,50,0.95)',
            color: chip.rank <= 3 ? '#0a1628' : '#fff',
            border: '1.5px solid rgba(255,255,255,0.8)',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 800,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {chip.rank}
        </div>
      </div>
      {/* nome do estado */}
      <div
        style={{
          marginTop: 4,
          color: '#fff',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: 0.5,
          whiteSpace: 'nowrap',
          textShadow:
            '0 0 4px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.95)',
        }}
      >
        {chip.name}
      </div>
    </div>
  );
};

/**
 * DOCUMENTÁRIO DE DADOS — PIB por estado dos EUA.
 * Mapa em choropleth (cor = PIB) + ranking animado dos 10 maiores.
 * Reaproveita o look (film grain, vignette, color grade) do projeto.
 */
export const USGDPComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height } = VIDEO;

  const ranking = useMemo(() => topStates(TOP_N), []);

  // Choropleth preenche entre os frames 40-150.
  const colorProgress = interpolate(frame, [40, 150], [0, 1], {
    easing: easeOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Push-in cinematográfico sutil no mapa (via CSS transform).
  const pushScale = interpolate(frame, [0, VIDEO.fps * 24], [1.0, 1.06], {
    extrapolateRight: 'clamp',
  });

  // Título entra no começo.
  const titleOpacity = interpolate(frame, [8, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Estados já revelados no ranking -> destaque no mapa.
  const revealed: string[] = [];
  ranking.forEach((s, i) => {
    const start = 80 + i * 24;
    if (frame >= start + 6) revealed.push(s.name);
  });
  const glowPulse = 0.5 + 0.5 * Math.sin(frame / 6);

  // Centróides projetados dos estados do ranking (p/ posicionar as bandeiras).
  const chips: Chip[] = useMemo(() => {
    const proj = albersFit(MAP_BOX);
    const path = geoPath(proj);
    return ranking
      .map((s, i) => {
        const feat = usStates.features.find(
          (f) => (f.properties?.name ?? '') === s.name,
        );
        if (!feat) return null;
        const c = path.centroid(feat as any);
        if (!c || Number.isNaN(c[0])) return null;
        const abbr = STATE_ABBR[s.name] ?? '';
        const off = CHIP_OFFSET[abbr] ?? [0, 0];
        return {
          name: s.name,
          abbr,
          rank: i + 1,
          x: c[0] + off[0],
          y: c[1] + off[1],
        } as Chip;
      })
      .filter((c): c is Chip => c !== null);
  }, [ranking]);

  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.oceanDeep }}>
      <AbsoluteFill
        style={{ filter: 'contrast(1.08) saturate(0.95) brightness(0.97)' }}
      >
        {/* Mapa com push-in. */}
        <AbsoluteFill
          style={{
            transform: `scale(${pushScale})`,
            transformOrigin: '32% 55%',
          }}
        >
          <USMap
            width={width}
            height={height}
            box={MAP_BOX}
            colorProgress={colorProgress}
            highlightNames={revealed.slice(0, 3)}
            glow={glowPulse}
          />

          {/* Bandeiras sobre cada estado (surgem no ranking e permanecem). */}
          {chips.map((chip) => (
            <FlagChip key={chip.abbr} chip={chip} frame={frame} fps={fps} />
          ))}
        </AbsoluteFill>

        {/* Título. */}
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 54,
            opacity: titleOpacity,
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <div
            style={{
              color: '#fff',
              fontWeight: 800,
              fontSize: 46,
              letterSpacing: 1,
              textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            }}
          >
            OS ESTADOS MAIS RICOS DOS EUA
          </div>
          <div
            style={{
              color: PALETTE.highlight,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 3,
              marginTop: 6,
            }}
          >
            PIB POR ESTADO · APROX. 2024 · US$ BILHÕES
          </div>
        </div>

        {/* Painel de ranking (top 10). */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0 }}
        >
          <text
            x={PANEL_X}
            y={ROW_TOP - 40}
            fill="#fff"
            opacity={titleOpacity}
            style={{
              fontFamily: 'Arial, sans-serif',
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: 2,
            }}
          >
            RANKING — TOP 10
          </text>

          {ranking.map((s, i) => {
            const start = 80 + i * 24;
            const grow = spring({
              frame: frame - start,
              fps,
              config: { damping: 16, stiffness: 90 },
            });
            const rowOpacity = interpolate(
              frame,
              [start, start + 10],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            const y = ROW_TOP + i * ROW_H;
            const barW = (s.gdp / MAX_GDP) * BAR_MAX_W * grow;
            const shownVal = interpolate(
              frame,
              [start, start + 40],
              [0, s.gdp],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            );
            const barColor = gdpColor(s.gdp / MAX_GDP);
            return (
              <g key={s.name} opacity={rowOpacity}>
                {/* posição */}
                <text
                  x={PANEL_X}
                  y={y + 22}
                  fill={i < 3 ? PALETTE.highlight : '#8ea3c0'}
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 800,
                    fontSize: 26,
                  }}
                >
                  {i + 1}
                </text>
                {/* nome do estado */}
                <text
                  x={BAR_X}
                  y={y + 6}
                  fill="#e8eef7"
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                >
                  {s.name}
                </text>
                {/* trilho da barra */}
                <rect
                  x={BAR_X}
                  y={y + 16}
                  width={BAR_MAX_W}
                  height={16}
                  rx={3}
                  fill="rgba(255,255,255,0.06)"
                />
                {/* barra */}
                <rect
                  x={BAR_X}
                  y={y + 16}
                  width={Math.max(0, barW)}
                  height={16}
                  rx={3}
                  fill={barColor}
                />
                {/* valor */}
                <text
                  x={BAR_X + BAR_MAX_W + 12}
                  y={y + 29}
                  fill="#fff"
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {fmt(shownVal)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Rodapé/fonte. */}
        <div
          style={{
            position: 'absolute',
            left: 60,
            bottom: 40,
            opacity: titleOpacity * 0.8,
            color: '#8ea3c0',
            fontFamily: 'Arial, sans-serif',
            fontSize: 18,
          }}
        >
          Valores aproximados (nominal) · referência BEA · ilustrativo
        </div>
      </AbsoluteFill>

      {/* Overlays globais (mesmo look do documentário). */}
      <Vignette strength={0.6} />
      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};
