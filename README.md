# Mapa Cinematográfico — Documentário estilo Vox

Projeto [Remotion](https://www.remotion.dev/) que gera um vídeo de **mapa
documentário animado** (estilo Vox / documentário de guerra): abertura no
mapa-múndi, **zoom cinematográfico** em um país, movimento de assets entre
territórios e **zoom em um local específico** com evento e consequências.

O mapa é **vetorial e offline** — usa `world-atlas` (shapes reais dos países) +
`d3-geo` com projeção **NaturalEarth1**. Não precisa de chave/token de API.

## Stack

- **Remotion** — motor de vídeo em React
- **world-atlas** + **topojson-client** — dados geográficos reais dos países
- **d3-geo** (`geoNaturalEarth1`, `geoPath`, `geoCentroid`, `geoInterpolate`)
- Film grain, vignette e color grade procedurais (look de documentário)

## Instalação

```bash
npm install
```

## Preview (Remotion Studio)

```bash
npm run studio
```

Composições registradas:

- **MasterComposition** — o documentário completo (as 3 cenas encadeadas).
- **Scene1 / Scene2 / Scene3** — cada cena isolada, para ajustar.

## Estrutura

```
src/
├── config.ts              ← ⚙️ ÚNICO arquivo que você edita p/ adaptar o vídeo
├── index.ts               ← registerRoot
├── Root.tsx               ← registra as composições
├── MasterComposition.tsx  ← encadeia cenas (<Series>) + overlays globais
├── WorldMap.tsx           ← mapa base reutilizável (oceano, países, glow)
├── scenes/
│   ├── Scene1.tsx         ← abertura + zoom no país alvo
│   ├── Scene2.tsx         ← 2 territórios + movimento de assets (jets)
│   └── Scene3.tsx         ← zoom num local específico + evento
└── utils/
    ├── projection.ts      ← projeção D3 + busca de países/centróides
    ├── camera.ts          ← keyframes de câmera (transições SEAMLESS)
    ├── easing.ts          ← easeOut / easeInOut / easeBack
    └── filmGrain.tsx      ← film grain (feTurbulence) + vignette
public/assets/             ← seus PNG/MP4 (jets, explosões, personagens)
```

## Como adaptar ao seu conteúdo

Edite **apenas `src/config.ts`**:

- `SCENE1.target.countryName` — país que recebe o zoom da abertura.
- `SCENE2.countryA` / `countryB` — origem e destino do movimento (+ cores/labels).
- `SCENE2.movingCount` — quantos assets viajam (jets procedurais por padrão).
- `SCENE3.focus` — `[lon, lat]` do local do close final + label.

> ⚠️ Os nomes de países devem ser **exatamente** como aparecem no
> `world-atlas` (em inglês): `"Ukraine"`, `"Russia"`, `"Brazil"`,
> `"United States of America"`, `"Iran"`, `"Israel"`, etc.

### Usar seus próprios assets

1. Coloque os arquivos em `public/assets/`.
2. Aponte os nomes em `src/config.ts`:
   - `SCENE1.characterAsset = 'personagem.png'`
   - `SCENE2.jetAsset = 'jet.png'` (PNG transparente)
   - `SCENE2.explosionAsset = 'explosao.mp4'` (MP4 fundo preto → screen blend)

Se deixados como `null`, o vídeo usa **jets procedurais** (SVG) e roda sem
nenhum asset externo.

## Transições seamless

Cada cena começa **exatamente** no estado de câmera onde a anterior terminou.
Isso é garantido por `src/utils/camera.ts`, que define os keyframes de junção
(`scene1End === scene2Start`, `scene2End === scene3Start`, ...). Nada de
fade/cut — é um plano-sequência contínuo.

## Render final

```bash
# padrão (h264, alta qualidade)
npm run render

# ou explicitamente:
npx remotion render MasterComposition out/documentario_final.mp4 \
  --codec=h264 --crf=18 --width=1920 --height=1080

# se der erro de WebGL/GPU:
npm run render:swiftshader
```

## Áudio (opcional)

O guia sugere narração (ElevenLabs), trilha e SFX em `public/audio/`,
sincronizados com `<Audio src=... startFrom=...>` dentro da
`MasterComposition`. Os pontos de sincronização recomendados:

- Narração por cena: início de cada `Series.Sequence`.
- Trilha (`score.mp3`): frame 0, `volume={0.35}`.
- Whoosh de câmera: nos frames de início de cada zoom.
- Explosão: no frame de impacto da Cena 2 (frame 160 local).
