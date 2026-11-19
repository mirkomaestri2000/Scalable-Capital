// Dati di ESEMPIO (inventati). Per i dati reali crea src/data/portfolio.js con la stessa forma.
export const SNAPSHOT = {
  portfolio: "Portafoglio di esempio",
  asOf: "dati di esempio",
  total: 20000,
  cash: 0,
  performance: { m1: -150, m3: 220, y1: 1400 },
};

// tier: core | sat | att  ·  value e cost in EUR (cost = prezzo medio di carico × quantità)
export const HOLDINGS = [
  { isin: "XX0000000001", name: "ETF azionario globale", kind: "ETF globale", tier: "core", value: 14000, cost: 12000 },
  { isin: "XX0000000002", name: "ETF S&P 500", kind: "ETF S&P 500", tier: "core", value: 1500, cost: 1300 },
  { isin: "XX0000000003", name: "ETC oro", kind: "ETC oro", tier: "core", value: 500, cost: 520 },
  { isin: "XX0000000004", name: "ETF mercati emergenti", kind: "ETF emergenti", tier: "sat", value: 1800, cost: 1650 },
  { isin: "XX0000000005", name: "ETF tematico", kind: "ETF tematico", tier: "sat", value: 900, cost: 700 },
  { isin: "XX0000000006", name: "Azione blue-chip", kind: "Azione", tier: "sat", value: 700, cost: 720 },
  { isin: "XX0000000007", name: "Azione ad alta volatilità", kind: "Azione", tier: "att", value: 400, cost: 520 },
  { isin: "XX0000000008", name: "ETF paese singolo", kind: "ETF paese", tier: "att", value: 200, cost: 190 },
];

// Note mostrate nel pannello dettagli di ogni livello
export const TIER_NOTES = {
  core: "Fondamenta diversificate: verifica quanta parte è azionaria e quanta obbligazionaria o liquida.",
  sat: "Scommesse mirate rispetto al core: regioni, fattori, temi, singole azioni.",
  att: "Posizioni ad alta volatilità: dimensionale in modo da poterle perdere.",
};
