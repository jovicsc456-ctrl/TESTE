/**
 * CONFIGURAÇÃO CENTRAL DO DOCUMENTÁRIO
 * -----------------------------------
 * Altere APENAS este arquivo para adaptar o vídeo ao seu conteúdo.
 * Os nomes de países devem ser exatamente como aparecem no world-atlas
 * (propriedade `properties.name`, em inglês). Ex.: "Ukraine", "Russia",
 * "Brazil", "United States of America", "Iran", "Israel".
 */

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

/** Paleta estilo Vox/documentário. */
export const PALETTE = {
  oceanDeep: '#0a1628',
  oceanEdge: '#050b16',
  country: '#1a2535',
  countryBorder: '#2a3a55',
  highlight: '#f5d90a', // dourado
  glow: '#ffffff',
} as const;

/**
 * CENA 1 — abertura + zoom no país alvo.
 * countryName: país que recebe o zoom cinematográfico.
 */
export const SCENE1 = {
  durationInFrames: 240, // 8s
  target: {
    countryName: 'Ukraine',
    label: 'UCRÂNIA',
    color: PALETTE.highlight,
  },
  /** asset opcional de personagem em public/assets (ou null). */
  characterAsset: null as string | null,
} as const;

/**
 * CENA 2 — dois territórios + movimento de assets (jets) de A para B.
 */
export const SCENE2 = {
  durationInFrames: 240, // 8s
  countryA: { countryName: 'Russia', label: 'RÚSSIA', color: '#dc2626' },
  countryB: { countryName: 'Ukraine', label: 'UCRÂNIA', color: '#3b82f6' },
  /**
   * Origem e destino do movimento em [longitude, latitude].
   * Se null, usa o centróide do país — mas em países muito grandes
   * (ex.: Rússia, cujo centróide fica na Sibéria) o enquadramento fica
   * ruim, então prefira coordenadas explícitas próximas da ação.
   * Padrão: fronteira oeste da Rússia -> Donbas (leste da Ucrânia),
   * ligando diretamente à Cena 3.
   */
  from: [40, 51] as [number, number] | null,
  to: [37, 48.2] as [number, number] | null,
  /** quantidade de assets em movimento (jets procedurais por padrão). */
  movingCount: 3,
  /** asset PNG opcional (fundo transparente) em public/assets, ou null p/ jet procedural. */
  jetAsset: null as string | null,
  /** vídeo MP4 de explosão (fundo preto → screen blend) em public/assets, ou null. */
  explosionAsset: null as string | null,
} as const;

/**
 * CENA 3 — zoom em um local específico + evento.
 */
export const SCENE3 = {
  durationInFrames: 450, // 15s
  focus: {
    // [longitude, latitude] do ponto de interesse.
    lon: 37.8,
    lat: 48.0,
    label: 'DONBAS',
  },
} as const;

export const TOTAL_DURATION =
  SCENE1.durationInFrames + SCENE2.durationInFrames + SCENE3.durationInFrames;
