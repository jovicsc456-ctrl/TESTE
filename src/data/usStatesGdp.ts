/**
 * PIB por estado dos EUA — valores aproximados (nominal, ~2024, em US$ bilhões).
 * Fonte de referência: BEA (Bureau of Economic Analysis). Números arredondados
 * e ilustrativos para fins de visualização.
 *
 * O `name` deve bater com `properties.name` do us-atlas (em inglês).
 */
export type StateGdp = { name: string; gdp: number };

export const US_STATES_GDP: StateGdp[] = [
  { name: 'California', gdp: 3987 },
  { name: 'Texas', gdp: 2694 },
  { name: 'New York', gdp: 2297 },
  { name: 'Florida', gdp: 1695 },
  { name: 'Illinois', gdp: 1132 },
  { name: 'Pennsylvania', gdp: 1024 },
  { name: 'Ohio', gdp: 916 },
  { name: 'Georgia', gdp: 878 },
  { name: 'New Jersey', gdp: 872 },
  { name: 'Washington', gdp: 838 },
  { name: 'North Carolina', gdp: 831 },
  { name: 'Virginia', gdp: 764 },
  { name: 'Massachusetts', gdp: 761 },
  { name: 'Michigan', gdp: 665 },
  { name: 'Tennessee', gdp: 553 },
  { name: 'Arizona', gdp: 553 },
  { name: 'Maryland', gdp: 517 },
  { name: 'Colorado', gdp: 509 },
  { name: 'Indiana', gdp: 502 },
  { name: 'Minnesota', gdp: 484 },
  { name: 'Missouri', gdp: 428 },
  { name: 'Wisconsin', gdp: 425 },
  { name: 'Connecticut', gdp: 350 },
  { name: 'Oregon', gdp: 331 },
  { name: 'South Carolina', gdp: 331 },
  { name: 'Louisiana', gdp: 315 },
  { name: 'Alabama', gdp: 300 },
  { name: 'Kentucky', gdp: 279 },
  { name: 'Utah', gdp: 273 },
  { name: 'Oklahoma', gdp: 258 },
  { name: 'Iowa', gdp: 253 },
  { name: 'Nevada', gdp: 240 },
  { name: 'Kansas', gdp: 220 },
  { name: 'District of Columbia', gdp: 175 },
  { name: 'Arkansas', gdp: 176 },
  { name: 'Nebraska', gdp: 175 },
  { name: 'Mississippi', gdp: 143 },
  { name: 'New Mexico', gdp: 130 },
  { name: 'New Hampshire', gdp: 122 },
  { name: 'Idaho', gdp: 118 },
  { name: 'Hawaii', gdp: 105 },
  { name: 'West Virginia', gdp: 100 },
  { name: 'Delaware', gdp: 92 },
  { name: 'Maine', gdp: 90 },
  { name: 'North Dakota', gdp: 76 },
  { name: 'Rhode Island', gdp: 74 },
  { name: 'South Dakota', gdp: 74 },
  { name: 'Montana', gdp: 71 },
  { name: 'Alaska', gdp: 69 },
  { name: 'Wyoming', gdp: 51 },
  { name: 'Vermont', gdp: 41 },
];

/** Mapa nome -> PIB para lookup rápido no choropleth. */
export const GDP_BY_NAME: Map<string, number> = new Map(
  US_STATES_GDP.map((s) => [s.name.toLowerCase(), s.gdp]),
);

/** Maior PIB (domínio da escala de cor). */
export const MAX_GDP = Math.max(...US_STATES_GDP.map((s) => s.gdp));

/** Top N estados por PIB (para o ranking). */
export const topStates = (n: number): StateGdp[] =>
  [...US_STATES_GDP].sort((a, b) => b.gdp - a.gdp).slice(0, n);
