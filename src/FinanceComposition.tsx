import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { FilmGrain, Vignette } from './utils/filmGrain';
import { easeInOut } from './utils/easing';
import { PALETTE, VIDEO } from './config';
import {
  PARAMS,
  YEARLY,
  MAX_BALANCE,
  TOTALS,
  sampleAt,
} from './data/compound';

const BLUE = '#3b82f6';
const GOLD = PALETTE.highlight;

// Geometria do gráfico.
const X0 = 150;
const X1 = 1770;
const W = X1 - X0;
const Y_BASE = 880;
const Y_TOP = 300;
const H = Y_BASE - Y_TOP;

const xOf = (year: number) => X0 + (year / PARAMS.years) * W;
const yOf = (v: number) => Y_BASE - (v / MAX_BALANCE) * H;

const brl = (v: number) =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

const areaPath = (key: 'balance' | 'invested') => {
  const pts = YEARLY.map((p) => `L ${xOf(p.year)} ${yOf(p[key])}`).join(' ');
  return `M ${X0} ${Y_BASE} ${pts} L ${xOf(PARAMS.years)} ${Y_BASE} Z`;
};

const linePath = (key: 'balance' | 'invested') =>
  YEARLY.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.year)} ${yOf(p[key])}`).join(' ');

/**
 * JUROS COMPOSTOS — gráfico de área crescendo no tempo, com o patrimônio
 * contando em tempo real e o "efeito bola de neve" (juros > aportes).
 */
export const FinanceComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = VIDEO;

  const titleOpacity = interpolate(frame, [8, 36], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Progresso do desenho do gráfico (0..1) ao longo dos anos.
  const p = interpolate(frame, [60, 540], [0, 1], {
    easing: easeInOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const yearFloat = p * PARAMS.years;
  const now = sampleAt(yearFloat);
  const interestNow = now.balance - now.invested;

  const xNow = xOf(yearFloat);
  const yNow = yOf(now.balance);

  // Ênfase final.
  const finalT = interpolate(frame, [540, 590], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);

  const revealW = Math.max(0, p * W);

  // Ticks de eixo.
  const yearTicks = [0, 5, 10, 15, 20, 25, 30].filter((y) => y <= PARAMS.years);
  const valueTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * MAX_BALANCE);

  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.oceanDeep }}>
      <AbsoluteFill
        style={{ filter: 'contrast(1.06) saturate(0.98) brightness(0.98)' }}
      >
        {/* Título + parâmetros. */}
        <div
          style={{
            position: 'absolute',
            left: 60,
            top: 48,
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
            O PODER DOS JUROS COMPOSTOS
          </div>
          <div
            style={{
              color: GOLD,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 2,
              marginTop: 8,
            }}
          >
            {brl(PARAMS.initialDeposit)} inicial · {brl(PARAMS.monthlyDeposit)}/mês ·{' '}
            {PARAMS.monthlyRatePct.toString().replace('.', ',')}% a.m. ·{' '}
            {PARAMS.years} anos
          </div>
        </div>

        {/* Painel de números (topo direito). */}
        <div
          style={{
            position: 'absolute',
            right: 70,
            top: 150,
            textAlign: 'right',
            fontFamily: 'Arial, sans-serif',
            opacity: titleOpacity,
          }}
        >
          <div style={{ color: '#8ea3c0', fontSize: 22, letterSpacing: 3, fontWeight: 700 }}>
            PATRIMÔNIO · ANO {Math.round(yearFloat)}
          </div>
          <div
            style={{
              color: '#fff',
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: 1,
              textShadow: '0 3px 16px rgba(0,0,0,0.7)',
              lineHeight: 1.05,
            }}
          >
            {brl(now.balance)}
          </div>
          <div style={{ marginTop: 10, fontSize: 26, fontWeight: 700 }}>
            <span style={{ color: BLUE }}>■ </span>
            <span style={{ color: '#c9d6ea' }}>Investido {brl(now.invested)}</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            <span style={{ color: GOLD }}>■ </span>
            <span style={{ color: GOLD }}>Juros {brl(interestNow)}</span>
          </div>
        </div>

        {/* Gráfico. */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <clipPath id="reveal">
              <rect x={X0} y={Y_TOP - 40} width={revealW} height={H + 120} />
            </clipPath>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity={0.55} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0.12} />
            </linearGradient>
            <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity={0.75} />
              <stop offset="100%" stopColor={BLUE} stopOpacity={0.25} />
            </linearGradient>
          </defs>

          {/* Grades + labels de valor. */}
          {valueTicks.map((v, i) => (
            <g key={`vt-${i}`}>
              <line
                x1={X0}
                y1={yOf(v)}
                x2={X1}
                y2={yOf(v)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1}
              />
              <text
                x={X0 - 12}
                y={yOf(v) + 5}
                textAnchor="end"
                fill="#6d7f9c"
                style={{ fontFamily: 'Arial, sans-serif', fontSize: 16 }}
              >
                {v >= 1000 ? `${Math.round(v / 1000)}k` : Math.round(v)}
              </text>
            </g>
          ))}

          {/* Áreas (reveladas por clip). */}
          <g clipPath="url(#reveal)">
            {/* Total (dourado) — a parte acima do azul é o juro. */}
            <path d={areaPath('balance')} fill="url(#goldFill)" />
            {/* Investido (azul) por cima. */}
            <path d={areaPath('invested')} fill="url(#blueFill)" />
            {/* Linhas de contorno. */}
            <path d={linePath('balance')} fill="none" stroke={GOLD} strokeWidth={3} />
            <path
              d={linePath('invested')}
              fill="none"
              stroke={BLUE}
              strokeWidth={2.5}
            />
          </g>

          {/* Eixo base + labels de ano. */}
          <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="#2a3a55" strokeWidth={2} />
          {yearTicks.map((y) => (
            <text
              key={`yt-${y}`}
              x={xOf(y)}
              y={Y_BASE + 30}
              textAnchor="middle"
              fill="#6d7f9c"
              style={{ fontFamily: 'Arial, sans-serif', fontSize: 18, fontWeight: 700 }}
            >
              {y}a
            </text>
          ))}

          {/* Playhead. */}
          {p > 0.001 && (
            <>
              <line
                x1={xNow}
                y1={Y_BASE}
                x2={xNow}
                y2={yNow}
                stroke={GOLD}
                strokeWidth={2}
                strokeDasharray="5 6"
                opacity={0.8}
              />
              <circle cx={xNow} cy={yNow} r={7} fill={GOLD} />
              <circle
                cx={xNow}
                cy={yNow}
                r={7 + pulse * 8}
                fill="none"
                stroke={GOLD}
                strokeWidth={2}
                opacity={0.5}
              />
            </>
          )}
        </svg>

        {/* Card final: bola de neve. */}
        {finalT > 0.001 && (
          <div
            style={{
              position: 'absolute',
              left: 60,
              bottom: 70,
              opacity: finalT,
              transform: `translateY(${(1 - finalT) * 16}px)`,
              fontFamily: 'Arial, sans-serif',
              background: 'rgba(10,22,40,0.72)',
              border: `1px solid ${GOLD}`,
              borderRadius: 12,
              padding: '18px 26px',
            }}
          >
            <div style={{ color: GOLD, fontWeight: 800, fontSize: 20, letterSpacing: 3 }}>
              ❄️ O EFEITO BOLA DE NEVE
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 30, marginTop: 6 }}>
              Você investe {brl(TOTALS.invested)} e acumula {brl(TOTALS.balance)}
            </div>
            <div style={{ color: GOLD, fontWeight: 800, fontSize: 24, marginTop: 4 }}>
              {brl(TOTALS.interest)} vieram só dos juros (
              {Math.round((TOTALS.interest / TOTALS.invested) * 100)}% dos aportes)
            </div>
          </div>
        )}

        {/* Rodapé. */}
        <div
          style={{
            position: 'absolute',
            right: 70,
            bottom: 36,
            opacity: titleOpacity * 0.8,
            color: '#6d7f9c',
            fontFamily: 'Arial, sans-serif',
            fontSize: 16,
          }}
        >
          Simulação ilustrativa · taxa constante · não é recomendação de investimento
        </div>
      </AbsoluteFill>

      <Vignette strength={0.6} />
      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};
