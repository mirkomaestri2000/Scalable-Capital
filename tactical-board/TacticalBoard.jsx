// Lavagna Tattica — il portafoglio come una squadra di calcio.
// Componente React a file singolo: Tailwind CSS + Framer Motion.
// Dati: snapshot dal MCP Scalable Capital, 19/11/2026 09:35 UTC, portafoglio "La mia pensione".
// Tutti i totali, pesi, rendimenti e il modulo sono calcolati qui sotto a partire dalle posizioni grezze
// (controvalore, prezzo di carico FIFO, quantità): niente numeri scritti a mano.

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ------------------------------------------------------------------ */
/* 1. DATI GREZZI (MCP Scalable Capital)                               */
/* ------------------------------------------------------------------ */

const SNAPSHOT = {
  portfolio: "La mia pensione",
  asOf: "19/11/2026 · 09:35 UTC",
  cash: 0,
  intraday: 243.13, // performance di giornata riportata da Scalable
  maxReturnScalable: 5235.41, // rendimento "MAX" di Scalable (include eventuali realizzi/dividendi)
};

// value = controvalore €, fifo = prezzo medio di carico €, qty = quantità, price = prezzo mid attuale €
const HOLDINGS = [
  { id: "acwi", name: "Scalable MSCI AC World Xtrackers (Acc)", short: "MSCI ACWI", isin: "LU2903252349", value: 30783.12, fifo: 10.270577, qty: 2582.259899, price: 11.921, unit: "mid", type: "ETF azionario globale" },
  { id: "vgsp", name: "Vanguard S&P 500 (Acc)", short: "S&P 500 VG", isin: "IE00BFMXXD54", value: 1823.32, fifo: 94.776429, qty: 14, price: 130.2375, type: "ETF azionario USA" },
  { id: "mom", name: "iShares Edge MSCI World Momentum Factor (Acc)", short: "Momentum", isin: "IE00BP3QZ825", value: 1198.02, fifo: 100.832308, qty: 13, price: 92.155, type: "ETF fattoriale mercati sviluppati" },
  { id: "cssp", name: "iShares Core S&P 500 (Acc)", short: "S&P 500 iSh", isin: "IE00B5BMR087", value: 468.73, fifo: 579.791437, qty: 0.64537, price: 726.29, type: "ETF azionario USA" },
  { id: "wrld", name: "iShares Core MSCI World (Acc)", short: "MSCI World", isin: "IE00B4L5Y983", value: 69.0, fifo: 101.87384, qty: 0.539, price: 128.01, type: "ETF azionario mercati sviluppati" },
  { id: "sphd", name: "iShares S&P 500 EUR Hedged (Acc)", short: "S&P 500 €H", isin: "IE00B3ZW0K18", value: 46.63, fifo: 113.116883, qty: 0.308, price: 151.3875, type: "ETF azionario USA, coperto dal cambio" },

  { id: "gold", name: "iShares Physical Gold ETC", short: "Oro", isin: "IE00B4ND3602", value: 263.34, fifo: 68.81, qty: 4, price: 65.835, type: "ETC oro fisico" },

  { id: "xem", name: "Xtrackers MSCI Emerging Markets (Acc)", short: "EM Xtr", isin: "IE00BTJRMP35", value: 1796.17, fifo: 66.642912, qty: 24.438308, price: 73.498, type: "ETF mercati emergenti", group: "em" },
  { id: "aem", name: "Amundi MSCI Emerging Markets Swap EUR (Acc)", short: "EM Amundi", isin: "LU1681045370", value: 652.06, fifo: 5.341828, qty: 93, price: 7.0114, type: "ETF mercati emergenti", group: "em" },
  { id: "emimi", name: "iShares Core MSCI Emerging Markets IMI (Acc)", short: "EM IMI", isin: "IE00BKM4GZ66", value: 359.33, fifo: 39.536368, qty: 8.304, price: 43.272, type: "ETF mercati emergenti", group: "em" },
  { id: "ind", name: "iShares MSCI India (Acc)", short: "India", isin: "IE00BZCQB185", value: 126.62, fifo: 8.676036, qty: 14.981496, price: 8.4515, type: "ETF singolo paese emergente", group: "em" },
  { id: "front", name: "Xtrackers S&P Select Frontier Swap (Acc)", short: "Frontier", isin: "LU0328476410", value: 24.52, fifo: 20.202224, qty: 0.989, price: 24.79, type: "ETF mercati di frontiera", group: "em" },
  { id: "mys", name: "Xtrackers MSCI Malaysia (Acc)", short: "Malesia", isin: "LU0514694370", value: 22.28, fifo: 10.899673, qty: 1.834, price: 12.149, type: "ETF singolo paese emergente", group: "em" },

  { id: "race", name: "Ferrari", short: "Ferrari", isin: "NL0011585146", value: 379.2, fifo: 387.283681, qty: 1.016206, price: 373.15, type: "Azione singola · lusso" },
  { id: "ai", name: "Xtrackers Artificial Intelligence & Big Data (Acc)", short: "AI & Data", isin: "IE00BGV5VN51", value: 285.16, fifo: 120.934409, qty: 1.443179, price: 197.59, type: "ETF tematico tech" },
  { id: "mu", name: "Micron Technology", short: "Micron", isin: "US5951121038", value: 233.5, fifo: 997.691584, qty: 0.35089, price: 665.45, type: "Azione singola · semiconduttori" },
  { id: "pypl", name: "PayPal Holdings", short: "PayPal", isin: "US70450Y1038", value: 159.71, fifo: 49.125451, qty: 3.022873, price: 52.835, type: "Azione singola · fintech" },
  { id: "robo", name: "iShares Automation & Robotics (Acc)", short: "Robotica", isin: "IE00BYZK4552", value: 142.97, fifo: 12.007146, qty: 8.325875, price: 17.172, type: "ETF tematico tech" },
  { id: "spcx", name: "SpaceX", short: "SpaceX", isin: "US84615Q1031", value: 133.41, fifo: 130.66, qty: 1, price: 133.41, type: "Azione singola · aerospazio" },
  { id: "bio", name: "iShares Nasdaq US Biotechnology (Acc)", short: "Biotech", isin: "IE00BYXG2H39", value: 111.83, fifo: 6.211028, qty: 12.075295, price: 9.261, type: "ETF settoriale biotech" },
  { id: "age", name: "iShares Ageing Population (Acc)", short: "Ageing", isin: "IE00BYZK4669", value: 110.64, fifo: 7.220051, qty: 11.77, price: 9.4, type: "ETF tematico" },
  { id: "bc", name: "Brunello Cucinelli", short: "Cucinelli", isin: "IT0004764699", value: 92.29, fifo: 82.51157, qty: 1.009313, price: 91.44, type: "Azione singola · lusso" },
];

/* ------------------------------------------------------------------ */
/* 2. SCELTE TATTICHE: reparto, posizione sul campo, nota didattica     */
/*    x/y in % del campo: y=0 porta avversaria (in alto), y=100 la tua */
/* ------------------------------------------------------------------ */

const ROLES = {
  // Centrocampo
  acwi: { zone: "mid", x: 50, y: 50, note: "Il regista: da solo vale circa tre quarti della squadra. È diversificato su migliaia di aziende di paesi sviluppati ed emergenti, ma resta 100% azionario: in un crollo dei mercati scende con tutto il resto." },
  vgsp: { zone: "mid", x: 15, y: 41, note: "Si sovrappone al regista: circa due terzi dell'ACWI sono già azioni USA. Aumenta il peso degli Stati Uniti, non la diversificazione." },
  sphd: { zone: "mid", x: 13, y: 50.5, note: "Stesso indice degli altri S&P 500, ma con copertura dal cambio EUR/USD. Elimina il rischio valuta, non il rischio azionario." },
  cssp: { zone: "mid", x: 15, y: 60, note: "Terzo ETF sull'S&P 500 in rosa: stessi titoli del Vanguard, ruolo doppione." },
  mom: { zone: "mid", x: 85, y: 43, note: "Fattore Momentum sui mercati sviluppati: concentra sui titoli più forti dell'ultimo anno e ruota spesso. Può oscillare più dell'indice di riferimento." },
  wrld: { zone: "mid", x: 86, y: 58, note: "Mercati sviluppati: contenuto quasi interamente già presente nel regista ACWI." },

  // Difesa
  gold: { zone: "def", x: 50, y: 78, note: "Unico difensore in campo. Protegge perché è poco correlato alle azioni, non perché oscilla poco: la sua volatilità è simile a quella dell'azionario." },

  // Attacco
  em: { zone: "att", x: 50, y: 23, note: "Sei posizioni sui mercati emergenti raggruppate in un unico giocatore. Si sovrappongono: i tre ETF EM generalisti contengono già India e Malesia, e il regista ACWI ha a sua volta una quota di emergenti." },
  race: { zone: "att", x: 24, y: 26, note: "Titolo singolo: il rischio è legato a un'unica azienda." },
  ai: { zone: "att", x: 76, y: 26, note: "ETF tematico tech: concentrato su un solo tema, molto sensibile al sentiment sul settore." },
  mu: { zone: "att", x: 17, y: 12.5, note: "Titolo singolo ciclico (memorie e semiconduttori): oscillazioni ampie in entrambe le direzioni." },
  pypl: { zone: "att", x: 83, y: 12.5, note: "Titolo singolo: il rischio è legato a un'unica azienda." },
  robo: { zone: "att", x: 37, y: 9.5, note: "ETF tematico tech: concentrato su un solo tema." },
  spcx: { zone: "att", x: 63, y: 9.5, note: "Titolo singolo: il rischio è legato a un'unica azienda." },
  bio: { zone: "att", x: 87, y: 32, note: "ETF settoriale: biotecnologie, settore con forti oscillazioni legate a risultati clinici e regolatori." },
  age: { zone: "att", x: 13, y: 32, note: "ETF tematico (invecchiamento della popolazione): più difensivo di AI o Biotech, ma pur sempre concentrato su un tema." },
  bc: { zone: "att", x: 50, y: 6.5, note: "Titolo singolo: il rischio è legato a un'unica azienda." },
};

// Posti vuoti in difesa: servono a far vedere la porta sguarnita
const EMPTY_SLOTS = [
  { x: 20, y: 76 },
  { x: 80, y: 76 },
  { x: 33, y: 84 },
  { x: 67, y: 84 },
];

const ZONES = {
  def: { label: "Difesa", sub: "Bassa volatilità · Protezione", color: "#5ec8ff" },
  mid: { label: "Centrocampo", sub: "Media volatilità · Equilibrio", color: "#c8b6ff" },
  att: { label: "Attacco", sub: "Alta volatilità · Crescita", color: "#ffcf5c" },
};

const THRESHOLD_ATTACK = 60; // % oltre cui la squadra è sbilanciata in avanti
const THRESHOLD_DEFENSE = 10; // % sotto cui la porta è sguarnita

/* ------------------------------------------------------------------ */
/* 3. CALCOLI                                                          */
/* ------------------------------------------------------------------ */

const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
const eur0 = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
const num2 = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signed = (v, f) => (v > 0 ? "+" : v < 0 ? "−" : "") + f(Math.abs(v));
const pct = (v) => signed(v, (a) => num2.format(a) + "%");
const money = (v) => signed(v, (a) => eur.format(a));

function formOf(retPct) {
  if (retPct >= 0) return { key: "fit", label: "In forma", color: "#2ef59a", glow: "rgba(46,245,154,.55)" };
  if (retPct > -5) return { key: "off", label: "Fuori forma", color: "#ff9d3c", glow: "rgba(255,157,60,.55)" };
  return { key: "inj", label: "Infortunato", color: "#ff4d5e", glow: "rgba(255,77,94,.6)" };
}

// Ripartisce 10 giocatori di movimento in proporzione ai pesi (metodo dei resti più alti)
function formation(weights) {
  const raw = weights.map((w) => (w / 100) * 10);
  const base = raw.map(Math.floor);
  let left = 10 - base.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < left; k++) base[order[k][1]] += 1;
  return { players: base, raw };
}

function buildTeam() {
  const total = HOLDINGS.reduce((s, h) => s + h.value, 0);
  const enrich = (h) => {
    const cost = h.fifo * h.qty;
    return { ...h, cost, pnl: h.value - cost, ret: (h.value / cost - 1) * 100, weight: (h.value / total) * 100 };
  };
  const rows = HOLDINGS.map(enrich);

  const emMembers = rows.filter((r) => r.group === "em").sort((a, b) => b.value - a.value);
  const emValue = emMembers.reduce((s, r) => s + r.value, 0);
  const emCost = emMembers.reduce((s, r) => s + r.cost, 0);
  const emPlayer = {
    id: "em",
    name: "Mercati emergenti e di frontiera",
    short: "Reparto EM",
    isin: `${emMembers.length} posizioni raggruppate`,
    type: "Gruppo · mercati emergenti e di frontiera",
    value: emValue,
    cost: emCost,
    pnl: emValue - emCost,
    ret: (emValue / emCost - 1) * 100,
    weight: (emValue / total) * 100,
    members: emMembers,
  };

  const players = [...rows.filter((r) => !r.group), emPlayer]
    .map((p) => ({ ...p, ...ROLES[p.id], form: formOf(p.ret) }))
    .sort((a, b) => b.weight - a.weight)
    .map((p, i) => ({ ...p, number: i + 1 }));

  const cost = rows.reduce((s, r) => s + r.cost, 0);
  const zoneTotals = { def: 0, mid: 0, att: 0 };
  players.forEach((p) => (zoneTotals[p.zone] += p.weight));
  const { players: f, raw } = formation([zoneTotals.def, zoneTotals.mid, zoneTotals.att]);

  return {
    players,
    total,
    cost,
    pnl: total - cost,
    ret: (total / cost - 1) * 100,
    zoneTotals,
    formation: f,
    formationRaw: raw,
    maxWeight: Math.max(...players.map((p) => p.weight)),
  };
}

// Area del pallino proporzionale al peso, con un minimo di leggibilità.
const PITCH_BASE = 560; // larghezza di riferimento del campo in px
const MAX_D = 172;
const MIN_D = 24;
function diameterPx(weight, maxWeight) {
  return Math.max(MIN_D, MAX_D * Math.sqrt(weight / maxWeight));
}

/* ------------------------------------------------------------------ */
/* 4. COMPONENTI                                                        */
/* ------------------------------------------------------------------ */

function PitchLines() {
  // Campo 68 x 105 (metri), visto dall'alto, attacco in alto
  const s = "rgba(235,245,255,.55)";
  return (
    <svg viewBox="0 0 68 105" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="zoneAtt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffcf5c" stopOpacity=".10" />
          <stop offset="1" stopColor="#ffcf5c" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="zoneDef" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#5ec8ff" stopOpacity=".10" />
          <stop offset="1" stopColor="#5ec8ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="68" height="36" fill="url(#zoneAtt)" />
      <rect x="0" y="69" width="68" height="36" fill="url(#zoneDef)" />
      {/* divisori dei reparti */}
      <line x1="2" y1="36" x2="66" y2="36" stroke="#ffcf5c" strokeOpacity=".35" strokeWidth=".25" strokeDasharray="1 1" />
      <line x1="2" y1="69" x2="66" y2="69" stroke="#5ec8ff" strokeOpacity=".35" strokeWidth=".25" strokeDasharray="1 1" />

      <g fill="none" stroke={s} strokeWidth=".35" strokeLinecap="round">
        <rect x="2" y="2" width="64" height="101" rx=".4" />
        <line x1="2" y1="52.5" x2="66" y2="52.5" />
        <circle cx="34" cy="52.5" r="9.15" />
        {/* area superiore */}
        <rect x="13.84" y="2" width="40.32" height="16.5" />
        <rect x="24.84" y="2" width="18.32" height="5.5" />
        <path d="M 26.7 18.5 A 9.15 9.15 0 0 0 41.3 18.5" />
        {/* area inferiore */}
        <rect x="13.84" y="86.5" width="40.32" height="16.5" />
        <rect x="24.84" y="97.5" width="18.32" height="5.5" />
        <path d="M 26.7 86.5 A 9.15 9.15 0 0 1 41.3 86.5" />
        {/* porte */}
        <rect x="30.34" y="0.4" width="7.32" height="1.6" strokeOpacity=".8" />
        <rect x="30.34" y="103" width="7.32" height="1.6" strokeOpacity=".8" />
      </g>
      <g fill={s}>
        <circle cx="34" cy="52.5" r=".45" />
        <circle cx="34" cy="13" r=".35" />
        <circle cx="34" cy="92" r=".35" />
      </g>
      {/* frecce tattiche stile lavagna */}
      <g fill="none" stroke="rgba(235,245,255,.22)" strokeWidth=".3" strokeDasharray=".8 .8">
        <path d="M 58 62 C 62 52, 61 44, 56 36" />
        <path d="M 10 62 C 6 52, 7 44, 12 36" />
      </g>
    </svg>
  );
}

function ZoneLabels({ zoneTotals }) {
  const items = [
    { key: "att", top: "18%" },
    { key: "mid", top: "50%" },
    { key: "def", top: "82%" },
  ];
  return items.map(({ key, top }) => (
    <div
      key={key}
      className="pointer-events-none absolute select-none"
      style={{ top, left: "-2px", writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
    >
      <span className="font-display text-[10px] font-semibold uppercase tracking-[.28em]" style={{ color: ZONES[key].color, opacity: 0.85 }}>
        {ZONES[key].label} · {num2.format(zoneTotals[key])}%
      </span>
    </div>
  ));
}

function Player({ p, maxWeight, active, onHover, onLeave, onSelect, index }) {
  const d = diameterPx(p.weight, maxWeight);
  const sizePct = (d / PITCH_BASE) * 100;
  const big = d >= 60;
  const showNumber = d >= 34;
  return (
    <motion.button
      type="button"
      aria-label={`${p.short}: ${eur.format(p.value)}, ${num2.format(p.weight)}% del portafoglio, rendimento ${pct(p.ret)}`}
      aria-pressed={active}
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover(p.id)}
      onPointerLeave={onLeave}
      onFocus={(e) => e.target.matches(":focus-visible") && onHover(p.id)}
      onBlur={onLeave}
      onClick={() => onSelect(p.id)}
      className="absolute z-10 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${sizePct}%`, aspectRatio: "1 / 1", x: "-50%", y: "-50%" }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.25 + index * 0.05 }}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.94 }}
    >
      {/* alone di selezione */}
      <AnimatePresence>
        {active && (
          <motion.span
            className="absolute inset-[-7px] rounded-full border-2"
            style={{ borderColor: p.form.color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.9, 0.35, 0.9], scale: [1, 1.08, 1] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* corpo del giocatore */}
      <span
        className="absolute inset-0 grid place-items-center rounded-full border-2"
        style={{
          borderColor: p.form.color,
          background: `radial-gradient(circle at 35% 30%, ${p.form.color}55, ${p.form.color}22 55%, #0b1626 100%), #0b1626`,
          boxShadow: `0 0 ${big ? 34 : 14}px ${p.form.glow}, inset 0 0 ${big ? 26 : 8}px ${p.form.color}33`,
        }}
      >
        {big ? (
          <span className="flex flex-col items-center leading-none">
            <span className="font-mono text-[11px] text-white/60">#{p.number}</span>
            <span className="font-display mt-1 text-[clamp(11px,2.4vw,17px)] font-bold uppercase tracking-wide text-white">{p.short}</span>
            <span className="font-mono mt-1 text-[clamp(14px,3.2vw,24px)] font-semibold" style={{ color: p.form.color }}>
              {num2.format(p.weight)}%
            </span>
          </span>
        ) : showNumber ? (
          <span className="font-mono text-[11px] font-semibold text-white">{p.number}</span>
        ) : null}
      </span>

      {/* etichetta sotto il pallino */}
      {!big && (
        <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-[#07111d]/70 px-1 py-px font-display text-[9.5px] font-semibold uppercase tracking-wide text-white/85">
          {p.short}
        </span>
      )}
    </motion.button>
  );
}

function EmptySlot({ x, y, label, i }) {
  const sizePct = (MIN_D / PITCH_BASE) * 100;
  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${y}%`, width: `${sizePct}%`, aspectRatio: "1 / 1", x: "-50%", y: "-50%" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.25, 0.6, 0.25] }}
      transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3 }}
    >
      <span className="absolute inset-0 rounded-full border border-dashed border-sky-300/70" />
      {label && (
        <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-display text-[9.5px] font-semibold uppercase tracking-wide text-sky-200/80">
          {label}
        </span>
      )}
    </motion.div>
  );
}

function Scoreboard({ team }) {
  const up = team.pnl >= 0;
  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
      className="mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-gradient-to-b from-[#0e1c2e] to-[#07101b] p-1 shadow-[0_20px_60px_-20px_rgba(0,0,0,.9)]"
    >
      <div className="rounded-xl border border-white/5 bg-[#050b14] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between font-display text-[10px] font-semibold uppercase tracking-[.25em] text-white/45">
          <span>{SNAPSHOT.portfolio}</span>
          <span className="flex items-center gap-1.5">
            <motion.span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            {SNAPSHOT.asOf}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="text-center sm:text-left">
            <div className="font-display text-[10px] uppercase tracking-[.22em] text-white/50">Valore totale</div>
            <div className="font-mono text-2xl font-semibold text-white sm:text-[28px]">{eur.format(team.total)}</div>
          </div>
          <div className="text-center">
            <div className="font-display text-[10px] uppercase tracking-[.22em] text-white/50">Punteggio</div>
            <div className={`font-mono text-4xl font-bold sm:text-5xl ${up ? "text-[#2ef59a]" : "text-[#ff4d5e]"}`} style={{ textShadow: up ? "0 0 22px rgba(46,245,154,.45)" : "0 0 22px rgba(255,77,94,.45)" }}>
              {pct(team.ret)}
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="font-display text-[10px] uppercase tracking-[.22em] text-white/50">Plus/minus non realizzata</div>
            <div className={`font-mono text-2xl font-semibold sm:text-[28px] ${up ? "text-[#2ef59a]" : "text-[#ff4d5e]"}`}>{money(team.pnl)}</div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-white/5 pt-2 font-mono text-[11px] text-white/55">
          <span>Investito {eur.format(team.cost)}</span>
          <span>
            Oggi <span className={SNAPSHOT.intraday >= 0 ? "text-[#2ef59a]" : "text-[#ff4d5e]"}>{money(SNAPSHOT.intraday)}</span>
          </span>
          <span>Liquidità {eur.format(SNAPSHOT.cash)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function BalanceMeter({ team }) {
  const { zoneTotals: z, formation: f } = team;
  const attackAlert = z.att > THRESHOLD_ATTACK;
  const defenseAlert = z.def < THRESHOLD_DEFENSE;
  const segs = [
    { key: "att", v: z.att },
    { key: "mid", v: z.mid },
    { key: "def", v: z.def },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1524]/80 p-4 backdrop-blur">
      <div className="font-display text-[11px] font-semibold uppercase tracking-[.25em] text-white/50">Equilibrio squadra</div>

      <div className="mt-3 text-center">
        <div className="font-display text-[10px] uppercase tracking-[.22em] text-white/45">Modulo</div>
        <div className="font-mono text-5xl font-bold tracking-tight text-white">
          {f[0]}
          <span className="text-white/30">-</span>
          {f[1]}
          <span className="text-white/30">-</span>
          {f[2]}
        </div>
        <div className="mt-1 text-[11px] leading-snug text-white/50">
          Difesa · Centrocampo · Attacco, su 10 giocatori di movimento in proporzione al peso
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        {/* barra verticale */}
        <div className="relative h-56 w-9 overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <div className="absolute inset-0 flex flex-col">
            {segs.map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ height: 0 }}
                animate={{ height: `${s.v}%` }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ background: ZONES[s.key].color, minHeight: s.v > 0 ? 3 : 0 }}
              />
            ))}
          </div>
          {/* soglie */}
          <div className="absolute inset-x-0 border-t border-dashed border-white" style={{ top: `${THRESHOLD_ATTACK}%` }} title="Soglia attacco 60%" />
          <div className="absolute inset-x-0 border-t border-dashed border-white" style={{ top: `${100 - THRESHOLD_DEFENSE}%` }} title="Soglia difesa 10%" />
        </div>
        <ul className="flex flex-1 flex-col justify-between py-0.5">
          {segs.map((s) => (
            <li key={s.key}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-xs font-semibold uppercase tracking-wider" style={{ color: ZONES[s.key].color }}>
                  {ZONES[s.key].label}
                </span>
                <span className="font-mono text-sm font-semibold text-white">{num2.format(s.v)}%</span>
              </div>
              <div className="text-[10.5px] text-white/45">{ZONES[s.key].sub}</div>
            </li>
          ))}
          <li className="text-[10px] leading-snug text-white/40">
            Linee tratteggiate: attacco oltre 60% · difesa sotto 10%
          </li>
        </ul>
      </div>

      <div className="mt-4 space-y-2">
        <AnimatePresence>
          {attackAlert && (
            <motion.div
              key="att"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: [0, -4, 4, -2, 0] }}
              transition={{ duration: 0.5, delay: 1 }}
              className="rounded-lg border border-[#ff4d5e]/50 bg-[#ff4d5e]/10 p-3 text-[12.5px] leading-snug text-[#ffd1d6]"
              role="alert"
            >
              <strong className="block font-display text-[11px] uppercase tracking-wider text-[#ff8a95]">⚠ Allarme contropiede</strong>
              Formazione troppo sbilanciata in avanti. Sei esposto al rischio contropiede (alta volatilità). Valuta di rafforzare la difesa.
            </motion.div>
          )}
          {defenseAlert && (
            <motion.div
              key="def"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: [0, -4, 4, -2, 0] }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="rounded-lg border border-[#ff9d3c]/50 bg-[#ff9d3c]/10 p-3 text-[12.5px] leading-snug text-[#ffe2c4]"
              role="alert"
            >
              <strong className="block font-display text-[11px] uppercase tracking-wider text-[#ffb870]">⚠ Porta sguarnita</strong>
              La difesa vale {num2.format(z.def)}% e la liquidità è a zero: nessun asset protegge la squadra in un crollo dei mercati. Con un orizzonte molto lungo può essere una scelta sensata, ma deve essere consapevole.
            </motion.div>
          )}
          {!attackAlert && !defenseAlert && (
            <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-[#2ef59a]/40 bg-[#2ef59a]/10 p-3 text-[12.5px] text-[#c9ffe6]">
              Squadra equilibrata tra i reparti.
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-[11px] leading-snug text-white/45">
          Nota: il centrocampo qui è a media volatilità <em>rispetto</em> all'attacco, ma è comunque 100% azionario. In tutto la squadra è azionaria per il {num2.format(100 - z.def)}%.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, sub, value, color }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[.03] p-2.5">
      <div className="font-display text-[10px] font-semibold uppercase tracking-[.18em] text-white/50">{label}</div>
      <div className="font-mono text-lg font-semibold leading-tight" style={{ color: color || "#fff" }}>
        {value}
      </div>
      {sub && <div className="font-mono text-[11px] text-white/45">{sub}</div>}
    </div>
  );
}

function AthleteCard({ p, team, onClose, pinned }) {
  const minutes = Math.round((p.weight / 100) * 90);
  return (
    <motion.div
      key={p.id}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1524]/90 p-4 backdrop-blur"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl" style={{ background: p.form.glow }} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-[10px] font-semibold uppercase tracking-[.25em]" style={{ color: ZONES[p.zone].color }}>
            Scheda atleta · {ZONES[p.zone].label}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-white/25">#{p.number}</span>
            <h2 className="font-display text-xl font-bold leading-tight text-white">{p.short}</h2>
          </div>
          <div className="mt-0.5 text-[12px] leading-snug text-white/60">{p.name}</div>
          <div className="font-mono text-[11px] text-white/40">{p.isin}</div>
        </div>
        {pinned && (
          <button onClick={onClose} className="rounded-md border border-white/15 px-2 py-1 font-display text-[10px] uppercase tracking-wider text-white/60 hover:bg-white/10" aria-label="Chiudi scheda">
            ✕
          </button>
        )}
      </div>

      <div className="relative mt-3 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ borderColor: p.form.color + "88", color: p.form.color }}>
        <span className="h-2 w-2 rounded-full" style={{ background: p.form.color, boxShadow: `0 0 8px ${p.form.color}` }} />
        {p.form.label}
        <span className="font-normal text-white/50">· {p.type}</span>
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-2">
        <Stat label="Valore di mercato" value={eur.format(p.value)} sub={`Carico ${eur.format(p.cost)}`} />
        <Stat label="Statistiche stagionali" value={pct(p.ret)} sub={`${money(p.pnl)} dall'acquisto`} color={p.form.color} />
        <div className="col-span-2 rounded-lg border border-white/10 bg-white/[.03] p-2.5">
          <div className="flex items-baseline justify-between">
            <div className="font-display text-[10px] font-semibold uppercase tracking-[.18em] text-white/50">Minuti giocati</div>
            <div className="font-mono text-[11px] text-white/45">{minutes}′ su 90′</div>
          </div>
          <div className="font-mono text-lg font-semibold text-white">{num2.format(p.weight)}% del portafoglio</div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full" style={{ background: ZONES[p.zone].color }} initial={{ width: 0 }} animate={{ width: `${Math.max(p.weight, 0.6)}%` }} transition={{ duration: 0.7 }} />
          </div>
        </div>
      </div>

      {p.price && (
        <div className="relative mt-2 font-mono text-[11px] text-white/45">
          Prezzo {eur.format(p.price)} · carico medio {eur.format(p.fifo)} · qtà {num2.format(p.qty)}
        </div>
      )}

      <p className="relative mt-3 text-[12.5px] leading-relaxed text-white/75">{p.note}</p>

      {p.members && (
        <div className="relative mt-3">
          <div className="font-display text-[10px] font-semibold uppercase tracking-[.2em] text-white/50">Composizione del reparto</div>
          <ul className="mt-1.5 divide-y divide-white/5 rounded-lg border border-white/10">
            {p.members.map((m) => {
              const f = formOf(m.ret);
              return (
                <li key={m.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[12px]">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: f.color }} />
                    <span className="truncate text-white/85" title={m.name}>{m.short}</span>
                  </span>
                  <span className="flex shrink-0 gap-3 font-mono text-white/60">
                    <span>{eur0.format(m.value)}</span>
                    <span className="w-12 text-right">{num2.format(m.weight)}%</span>
                    <span className="w-14 text-right" style={{ color: f.color }}>{pct(m.ret)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

function Roster({ team, onHover, onLeave, onSelect }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1524]/80 p-4">
      <div className="font-display text-[11px] font-semibold uppercase tracking-[.25em] text-white/50">Scheda atleta</div>
      <p className="mt-1 text-[12.5px] text-white/60">Passa sopra o tocca un giocatore sul campo, oppure scegli dalla rosa.</p>
      <ul className="mt-3 max-h-[620px] space-y-1 overflow-auto pr-1">
        {team.players.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onPointerEnter={(e) => e.pointerType === "mouse" && onHover(p.id)}
              onPointerLeave={onLeave}
              onClick={() => onSelect(p.id)}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-5 font-mono text-[11px] text-white/35">{p.number}</span>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.form.color }} />
                <span className="truncate text-white/85">{p.short}</span>
              </span>
              <span className="flex shrink-0 gap-3 font-mono text-[11.5px]">
                <span className="w-12 text-right text-white/55">{num2.format(p.weight)}%</span>
                <span className="w-14 text-right" style={{ color: p.form.color }}>{pct(p.ret)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend() {
  const forms = [formOf(1), formOf(-1), formOf(-10)];
  const hints = ["rendimento ≥ 0", "tra 0% e −5%", "oltre −5%"];
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-white/55">
      {forms.map((f, i) => (
        <span key={f.key} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color, boxShadow: `0 0 6px ${f.color}` }} />
          {f.label} <span className="text-white/35">({hints[i]})</span>
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border border-dashed border-sky-300/80" />
        Posto vuoto
      </span>
      <span className="basis-full text-center text-white/40">
        Area del pallino proporzionale al peso; sotto lo 0,6% circa i pallini hanno una dimensione minima per restare leggibili.
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. APP                                                               */
/* ------------------------------------------------------------------ */

export default function TacticalBoard() {
  const team = useMemo(buildTeam, []);
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const activeId = hovered ?? selected;
  const active = team.players.find((p) => p.id === activeId);

  const onSelect = (id) => {
    setHovered(null);
    setSelected((cur) => (cur === id ? null : id));
  };
  const onLeave = () => setHovered(null);

  return (
    <div
      className="min-h-screen w-full px-3 pb-10 pt-4 text-white sm:px-6"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, #1b3657 0%, transparent 60%), radial-gradient(800px 500px at 100% 100%, #10243c 0%, transparent 60%), #08121f",
      }}
    >
      <header className="mx-auto mb-4 max-w-[1280px] text-center">
        <h1 className="font-display text-xl font-bold uppercase tracking-[.3em] text-white/90 sm:text-2xl">Lavagna Tattica</h1>
        <p className="mt-1 text-[12.5px] text-white/50">Il portafoglio schierato in campo: ogni asset ha un ruolo, ogni reparto un livello di rischio.</p>
      </header>

      <Scoreboard team={team} />

      <main className="mx-auto mt-5 grid max-w-[1280px] grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,560px)_minmax(300px,1fr)] lg:items-start">
        {/* sinistra: misuratore */}
        <aside className="order-3 lg:order-1">
          <BalanceMeter team={team} />
        </aside>

        {/* centro: campo */}
        <section className="order-1 lg:order-2" aria-label="Campo da calcio con gli asset del portafoglio">
          <div
            className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-[22px] border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)]"
            style={{
              aspectRatio: "68 / 105",
              background:
                "repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 7.5%, transparent 7.5% 15%), radial-gradient(ellipse at 50% 50%, #15314f 0%, #0d2036 70%, #0a1a2c 100%)",
            }}
            onMouseLeave={onLeave}
          >
            <PitchLines />
            <ZoneLabels zoneTotals={team.zoneTotals} />
            {EMPTY_SLOTS.map((s, i) => (
              <EmptySlot key={i} {...s} i={i} label={i === 0 ? "vuoto" : null} />
            ))}
            <EmptySlot x={50} y={94.5} i={5} label={`Liquidità ${eur0.format(SNAPSHOT.cash)}`} />
            {team.players.map((p, i) => (
              <Player
                key={p.id}
                p={p}
                index={i}
                maxWeight={team.maxWeight}
                active={activeId === p.id}
                onHover={setHovered}
                onLeave={onLeave}
                onSelect={onSelect}
              />
            ))}
          </div>
          <Legend />
        </section>

        {/* destra: scheda atleta */}
        <aside className="order-2 lg:order-3">
          <AnimatePresence mode="wait">
            {active ? (
              <AthleteCard key={active.id} p={active} team={team} pinned={selected === active.id} onClose={() => { setSelected(null); setHovered(null); }} />
            ) : (
              <motion.div key="roster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Roster team={team} onHover={setHovered} onLeave={onLeave} onSelect={onSelect} />
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </main>

      <footer className="mx-auto mt-8 max-w-[1280px] text-center text-[11px] leading-relaxed text-white/35">
        Dati: Scalable Capital, {SNAPSHOT.asOf}. Rendimenti calcolati sul prezzo medio di carico FIFO (plus/minus non realizzata, non annualizzata).
        Il rendimento "MAX" riportato da Scalable è {money(SNAPSHOT.maxReturnScalable)} perché include anche eventuali vendite e dividendi.
        La classificazione per reparti è una semplificazione didattica, non una consulenza.
      </footer>
    </div>
  );
}
