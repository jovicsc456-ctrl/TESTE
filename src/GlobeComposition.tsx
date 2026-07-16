import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import {
  countrySegments,
  graticuleSegments,
  arcStrip,
  latLngToVec3,
} from './utils/globe';
import { FilmGrain, Vignette } from './utils/filmGrain';
import { PALETTE, VIDEO } from './config';

const R = 2;

// Conexões globais (de -> para em [lon, lat]) + rótulo.
const ARCS: Array<{ from: [number, number]; to: [number, number]; label: string }> = [
  { from: [-74, 40.7], to: [-0.1, 51.5], label: 'NY → Londres' },
  { from: [-0.1, 51.5], to: [55.3, 25.2], label: 'Londres → Dubai' },
  { from: [139.7, 35.7], to: [-46.6, -23.5], label: 'Tóquio → São Paulo' },
  { from: [-118.2, 34], to: [151.2, -33.9], label: 'LA → Sydney' },
  { from: [-46.6, -23.5], to: [3.4, 6.5], label: 'São Paulo → Lagos' },
  { from: [116.4, 39.9], to: [37.6, 55.75], label: 'Pequim → Moscou' },
];

const ARC_ALT = 0.35;
const ARC_STEPS = 72;

// PRNG determinístico (estrelas estáveis entre frames).
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const Globe: React.FC = () => {
  const frame = useCurrentFrame();

  const countryGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(countrySegments(R * 1.002), 3),
    );
    return g;
  }, []);

  const gratGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(graticuleSegments(R * 1.001, 30), 3),
    );
    return g;
  }, []);

  const arcsFull = useMemo(
    () => ARCS.map((a) => arcStrip(a.from, a.to, R, ARC_ALT, ARC_STEPS)),
    [],
  );

  const atmosphere = useMemo(
    () => ({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.30, 0.62, 1.0, 1.0) * intensity;
        }`,
    }),
    [],
  );

  const stars = useMemo(() => {
    const rnd = mulberry32(1234);
    const N = 700;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // ponto aleatório numa casca esférica distante
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const rad = 18 + rnd() * 14;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = rad * s * Math.cos(th);
      pos[i * 3 + 1] = rad * u;
      pos[i * 3 + 2] = rad * s * Math.sin(th);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  // Materiais reutilizados (evita recriar por frame).
  const arcMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(PALETTE.highlight),
        transparent: true,
        opacity: 0.95,
      }),
    [],
  );

  const spin = frame * 0.005;

  return (
    <>
      <ambientLight intensity={1} />
      {/* Estrelas ao fundo (não giram com o globo). */}
      <points geometry={stars}>
        <pointsMaterial color="#8ea3c0" size={0.05} sizeAttenuation transparent opacity={0.7} />
      </points>

      <group rotation={[0.42, spin, 0]}>
        {/* Esfera sólida escura (oculta o outro lado). */}
        <mesh>
          <sphereGeometry args={[R, 64, 64]} />
          <meshBasicMaterial color="#0a1a30" />
        </mesh>

        {/* Grade de coordenadas. */}
        <lineSegments geometry={gratGeo}>
          <lineBasicMaterial color="#1e3a5f" transparent opacity={0.45} />
        </lineSegments>

        {/* Contornos dos países. */}
        <lineSegments geometry={countryGeo}>
          <lineBasicMaterial color="#5fa8d8" transparent opacity={0.9} />
        </lineSegments>

        {/* Arcos de conexão + cometa na ponta. */}
        {ARCS.map((a, i) => {
          const start = 40 + i * 20;
          const prog = interpolate(frame, [start, start + 55], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          if (prog <= 0) return null;
          const count = Math.max(2, Math.floor(prog * (ARC_STEPS + 1)));
          const sliced = arcsFull[i].slice(0, count * 3);
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(sliced, 3));
          const tip: [number, number, number] = [
            sliced[sliced.length - 3],
            sliced[sliced.length - 2],
            sliced[sliced.length - 1],
          ];
          const lineObj = new THREE.Line(g, arcMat);
          return (
            <group key={i}>
              <primitive object={lineObj} />
              <mesh position={tip}>
                <sphereGeometry args={[0.022, 12, 12]} />
                <meshBasicMaterial color={PALETTE.highlight} />
              </mesh>
              {/* marcador de origem */}
              <mesh position={latLngToVec3(a.from[1], a.from[0], R * 1.005)}>
                <sphereGeometry args={[0.016, 10, 10]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Atmosfera (brilho de borda). */}
      <mesh scale={1.2}>
        <sphereGeometry args={[R, 64, 64]} />
        <shaderMaterial
          attach="material"
          args={[atmosphere]}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          transparent
        />
      </mesh>
    </>
  );
};

/** Globo 3D vetorial girando com arcos de conexão — estilo telejornal. */
export const GlobeComposition: React.FC = () => {
  const { width, height } = VIDEO;
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [8, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#04070f' }}>
      {/* Fundo com leve brilho radial. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 45%, #0a1a30 0%, #050a16 55%, #03060d 100%)',
        }}
      />

      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, 5.2], fov: 42, near: 0.1, far: 100 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Globe />
      </ThreeCanvas>

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
            fontSize: 48,
            letterSpacing: 2,
            textShadow: '0 2px 14px rgba(0,0,0,0.7)',
          }}
        >
          O MUNDO CONECTADO
        </div>
        <div
          style={{
            color: PALETTE.highlight,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 4,
            marginTop: 8,
          }}
        >
          ROTAS GLOBAIS · TEMPO REAL
        </div>
      </div>

      <Vignette strength={0.7} />
      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};
