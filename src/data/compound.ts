/**
 * JUROS COMPOSTOS — parâmetros e séries.
 * Edite PARAMS para adaptar o vídeo (aporte, taxa, prazo).
 */
export const PARAMS = {
  initialDeposit: 1000, // aporte inicial (R$)
  monthlyDeposit: 500, // aporte mensal (R$)
  monthlyRatePct: 1.0, // taxa ao mês (%) — 1% a.m. ≈ 12,68% a.a.
  years: 30, // prazo
} as const;

export type Point = {
  month: number;
  year: number;
  balance: number; // patrimônio acumulado
  invested: number; // total aportado
  interest: number; // juros (balance - invested)
};

const buildMonthly = (): Point[] => {
  const i = PARAMS.monthlyRatePct / 100;
  const months = PARAMS.years * 12;
  const out: Point[] = [];
  let balance = PARAMS.initialDeposit;
  let invested = PARAMS.initialDeposit;
  out.push({ month: 0, year: 0, balance, invested, interest: 0 });
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + i) + PARAMS.monthlyDeposit;
    invested += PARAMS.monthlyDeposit;
    out.push({
      month: m,
      year: m / 12,
      balance,
      invested,
      interest: balance - invested,
    });
  }
  return out;
};

export const MONTHLY: Point[] = buildMonthly();

/** Um ponto por ano (0..years) para desenhar o gráfico. */
export const YEARLY: Point[] = Array.from({ length: PARAMS.years + 1 }, (_, y) => {
  const p = MONTHLY[y * 12];
  return { ...p, year: y };
});

export const MAX_BALANCE = YEARLY[YEARLY.length - 1].balance;
export const TOTALS = {
  balance: MAX_BALANCE,
  invested: YEARLY[YEARLY.length - 1].invested,
  interest: YEARLY[YEARLY.length - 1].interest,
};

/** Amostra (balance/invested) num ano fracionário, interpolando linearmente. */
export const sampleAt = (yearFloat: number): { balance: number; invested: number } => {
  const y0 = Math.max(0, Math.min(PARAMS.years, Math.floor(yearFloat)));
  const y1 = Math.min(PARAMS.years, y0 + 1);
  const t = yearFloat - y0;
  const a = YEARLY[y0];
  const b = YEARLY[y1];
  return {
    balance: a.balance + (b.balance - a.balance) * t,
    invested: a.invested + (b.invested - a.invested) * t,
  };
};
