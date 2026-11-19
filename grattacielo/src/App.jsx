/**
 * Grattacielo in costruzione: il portafoglio Core-Satellite come edificio.
 * Componente React a file singolo (Tailwind CSS + Framer Motion).
 *
 * Dati: estratti da Scalable Capital (vedi src/data/).
 * Rendimento = non realizzato, su prezzo medio di carico FIFO (esclude dividendi
 * e plusvalenze già realizzate).
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
// I dati reali stanno in ./data/portfolio.js (escluso da git). Senza, il build usa portfolio.example.js.
import { SNAPSHOT, HOLDINGS, TIER_NOTES } from "./data/portfolio.js";

/* ------------------------------------------------------------------ */
/* Dati                                                                */
/* ------------------------------------------------------------------ */

const TIER_META = {
  core: {
    name: "Fondamenta",
    tag: "Core diversificato",
    color: "#8d96a1",
    blurb: "ETF globali ampi e oro. È la base che regge l'edificio.",
  },
  sat: {
    name: "Piani intermedi",
    tag: "Satellite",
    color: "#3d8bfd",
    blurb: "Emergenti, fattore momentum, ETF tematici e azioni blue-chip.",
  },
  att: {
    name: "Attico e antenne",
    tag: "Speculazione",
    color: "#f0a7ff",
    blurb: "Singoli paesi, mercati di frontiera e titoli molto volatili.",
  },
};

const TIER_ORDER = ["core", "sat", "att"];

const PRESETS = [
  { id: "real", label: "Il mio portafoglio" },
  { id: "bal", label: "Bilanciato", w: { core: 60, sat: 30, att: 10 } },
  { id: "agg", label: "Aggressivo", w: { core: 40, sat: 40, att: 20 } },
  { id: "spec", label: "Speculatore", w: { core: 15, sat: 30, att: 55 } },
];

// Soglie del check strutturale (in % del portafoglio a rischio = satellite + attico)
const STRESS_AT = 35; // scelta didattica arbitraria
const COLLAPSE_AT = 50; // rischio > fondamenta

/* ------------------------------------------------------------------ */
/* Utility                                                             */
/* ------------------------------------------------------------------ */

const eur = (v, d = 2) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: "always" }).format(v);
const eurSigned = (v, d = 2) => (v > 0 ? "+" : v < 0 ? "−" : "") + eur(Math.abs(v), d);
const pct = (v, d = 1) =>
  (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";
const pctPlain = (v, d = 1) => v.toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";

const rand = (seed) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const GREEN = "#34d399";
const CYAN = "#22d3ee";
const RED = "#fb7185";

const glowFor = (ret) => (ret < 0 ? RED : ret >= 10 ? GREEN : CYAN);
const litRatioFor = (ret) => (ret < 0 ? 0.06 : Math.min(0.95, 0.45 + (Math.min(ret, 40) / 40) * 0.5));

function computeTiers() {
  const out = {};
  for (const t of TIER_ORDER) {
    const items = HOLDINGS.filter((h) => h.tier === t).sort((a, b) => b.value - a.value);
    const value = items.reduce((s, h) => s + h.value, 0);
    const cost = items.reduce((s, h) => s + h.cost, 0);
    out[t] = { id: t, items, value, cost, pnl: value - cost, ret: ((value - cost) / cost) * 100, weight: (value / SNAPSHOT.total) * 100 };
  }
  return out;
}

function structuralStatus(w) {
  const risk = w.sat + w.att;
  const upperWider = w.sat > w.core || w.att > w.core;
  if (risk > COLLAPSE_AT || upperWider) return { level: "collapse", risk };
  if (risk > STRESS_AT) return { level: "stress", risk };
  return { level: "stable", risk };
}

function useWidth(ref) {
  const [w, setW] = useState(800);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* ------------------------------------------------------------------ */
/* Icone                                                               */
/* ------------------------------------------------------------------ */

const Arrow = ({ up, className = "" }) => (
  <svg viewBox="0 0 10 10" className={`inline-block h-2.5 w-2.5 ${className}`} aria-hidden="true">
    <path d={up ? "M5 1 L9 8 L1 8 Z" : "M5 9 L9 2 L1 2 Z"} fill="currentColor" />
  </svg>
);

const StatusIcon = ({ level }) => {
  if (level === "stable")
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M6 10.5 L9 13 L14 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M10 2 L19 18 L1 18 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 8 V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="15" r="1.1" fill="currentColor" />
    </svg>
  );
};

const STATUS_COPY = {
  stable: { label: "Struttura stabile", cls: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10" },
  stress: { label: "Struttura sotto sforzo", cls: "text-amber-300 border-amber-400/30 bg-amber-400/10" },
  collapse: { label: "Rischio di crollo", cls: "text-rose-300 border-rose-400/40 bg-rose-500/10" },
};

const Ret = ({ v, children, className = "" }) => (
  <span className={`inline-flex items-center gap-1 tabular-nums ${v >= 0 ? "text-emerald-300" : "text-rose-300"} ${className}`}>
    <Arrow up={v >= 0} />
    {children}
  </span>
);

/* ------------------------------------------------------------------ */
/* Pezzi del palazzo                                                   */
/* ------------------------------------------------------------------ */

function Windows({ cols, rows, ret, seed, w, h, gapX, gapY, radius = 1, dimColor }) {
  const glow = glowFor(ret);
  const lit = litRatioFor(ret);
  const cells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const on = rand(seed + i * 7.31) < lit;
      cells.push(
        <div
          key={i}
          style={{
            width: w,
            height: h,
            borderRadius: radius,
            background: on ? glow : dimColor,
            opacity: on ? 0.55 + rand(seed + i) * 0.45 : 1,
            boxShadow: on ? `0 0 6px ${glow}, 0 0 14px ${glow}55` : "none",
          }}
        />
      );
    }
  return (
    <div className="grid justify-center" style={{ gridTemplateColumns: `repeat(${cols}, ${w}px)`, columnGap: gapX, rowGap: gapY }}>
      {cells}
    </div>
  );
}

function Cracks({ intensity = 1 }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke={RED} strokeWidth="0.9" vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity={0.85}>
        <path d="M18 0 L22 14 L17 26 L25 40 L21 55" vectorEffect="non-scaling-stroke" />
        <path d="M22 14 L31 19" vectorEffect="non-scaling-stroke" />
        {intensity > 1 && <path d="M78 100 L74 82 L81 70 L73 58 L77 44" vectorEffect="non-scaling-stroke" />}
        {intensity > 1 && <path d="M74 82 L64 78" vectorEffect="non-scaling-stroke" />}
        <path d="M58 0 L55 9 L61 18" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

function Foundation({ width, height, tier, cracked }) {
  const cols = Math.max(2, Math.floor((width - 24) / 30));
  const neg = tier.ret < 0;
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        background:
          "repeating-linear-gradient(0deg, rgba(0,0,0,.10) 0 1px, transparent 1px 34px), repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 3px, transparent 3px 62px), linear-gradient(180deg,#70757d 0%,#575b62 55%,#3d4045 100%)",
        boxShadow: `inset 0 3px 0 rgba(255,255,255,.12), inset 0 -10px 0 rgba(0,0,0,.35), 0 18px 40px -10px rgba(0,0,0,.8)${neg ? `, inset 0 0 0 2px ${RED}` : ""}`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-2 bg-[#81868e]" />
      <div className="absolute inset-0 flex flex-col justify-center pb-3 pt-4">
        <Windows cols={cols} rows={3} ret={tier.ret} seed={11} w={16} h={11} gapX={14} gapY={18} radius={0} dimColor="#24272c" />
      </div>
      {(neg || cracked) && <Cracks intensity={cracked ? 2 : 1} />}
    </div>
  );
}

function GlassFloors({ width, height, tier, cracked, reduce }) {
  const cols = Math.max(2, Math.floor((width - 14) / 18));
  const rows = 8;
  const neg = tier.ret < 0;
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        background: "linear-gradient(135deg, rgba(96,165,250,.38) 0%, rgba(30,64,175,.62) 55%, rgba(15,23,42,.9) 100%)",
        border: `1px solid ${neg ? RED : "rgba(147,197,253,.55)"}`,
        borderBottom: "none",
        boxShadow: neg ? `0 0 18px ${RED}66` : "0 0 30px rgba(59,130,246,.25)",
      }}
    >
      <div className="absolute inset-0 flex flex-col justify-center px-[7px]">
        <Windows cols={cols} rows={rows} ret={tier.ret} seed={47} w={14} h={18} gapX={4} gapY={6} radius={1} dimColor="rgba(8,15,35,.65)" />
      </div>
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-1/3"
          style={{ background: "linear-gradient(100deg, transparent, rgba(255,255,255,.16), transparent)", skewX: -18 }}
          initial={{ left: "-40%" }}
          animate={{ left: "140%" }}
          transition={{ duration: 3.8, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        />
      )}
      {(neg || cracked) && <Cracks intensity={cracked ? 2 : 1} />}
    </div>
  );
}

function Penthouse({ width, height, tier, cracked }) {
  const neg = tier.ret < 0;
  const neon = neg ? RED : "#e879f9";
  const cols = Math.max(1, Math.floor((width - 12) / 16));
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width,
        height,
        background: "#110d1a",
        border: `1.5px solid ${neon}`,
        boxShadow: `0 0 10px ${neon}, 0 0 26px ${neon}66, inset 0 0 12px ${neon}44`,
      }}
    >
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 40 100" aria-hidden="true">
        <g stroke={neon} strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none">
          {[0, 25, 50, 75].map((y) => (
            <g key={y}>
              <path d={`M0 ${y} L40 ${y + 25}`} vectorEffect="non-scaling-stroke" />
              <path d={`M40 ${y} L0 ${y + 25}`} vectorEffect="non-scaling-stroke" />
              <path d={`M0 ${y} L40 ${y}`} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col justify-center">
        <Windows cols={cols} rows={3} ret={tier.ret} seed={91} w={10} h={12} gapX={6} gapY={10} radius={1} dimColor="rgba(40,20,50,.9)" />
      </div>
      {(neg || cracked) && <Cracks intensity={cracked ? 2 : 1} />}
    </div>
  );
}

function Antenna({ height, neg, reduce }) {
  const neon = neg ? RED : "#e879f9";
  return (
    <div className="relative flex flex-col items-center" style={{ height }}>
      <motion.div
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: "#ff4d4d", boxShadow: "0 0 10px #ff4d4d, 0 0 20px #ff4d4d" }}
        animate={reduce ? {} : { opacity: [1, 0.15, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      <svg width="34" height={height - 10} viewBox={`0 0 34 ${height - 10}`} aria-hidden="true">
        <g stroke={neon} strokeWidth="1.5" fill="none" style={{ filter: `drop-shadow(0 0 3px ${neon})` }}>
          <path d={`M17 0 V${height - 10}`} />
          <path d={`M11 ${height - 10} L17 ${(height - 10) * 0.3} L23 ${height - 10}`} />
          <path d={`M9 ${(height - 10) * 0.55} H25`} />
          <path d={`M12 ${(height - 10) * 0.78} H22`} />
        </g>
      </svg>
    </div>
  );
}

function Crane({ height, reduce }) {
  return (
    <svg width="150" height={height} viewBox={`0 0 150 ${height}`} className="opacity-60" aria-hidden="true">
      <g stroke="#f5b942" strokeOpacity="0.55" strokeWidth="1.5" fill="none">
        <path d={`M30 ${height} V40 M42 ${height} V40`} />
        {Array.from({ length: Math.floor((height - 40) / 24) }).map((_, i) => (
          <path key={i} d={`M30 ${40 + i * 24} L42 ${64 + i * 24} M42 ${40 + i * 24} L30 ${64 + i * 24}`} />
        ))}
        <path d="M0 40 H150 M0 30 H150 M36 12 V40" />
        {Array.from({ length: 12 }).map((_, i) => (
          <path key={i} d={`M${i * 12.5} 30 L${i * 12.5 + 6} 40 L${i * 12.5 + 12.5} 30`} />
        ))}
        <path d="M36 12 L0 30 M36 12 L150 30" />
      </g>
      <motion.g animate={reduce ? {} : { y: [0, 14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M120 40 V96" stroke="#f5b942" strokeOpacity="0.5" strokeWidth="1" />
        <rect x="111" y="96" width="18" height="10" fill="#f5b942" fillOpacity="0.45" />
      </motion.g>
      <motion.circle cx="36" cy="10" r="2.5" fill="#ff4d4d" animate={reduce ? {} : { opacity: [1, 0.1, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Scena                                                               */
/* ------------------------------------------------------------------ */

const H = { core: 130, sat: 236, att: 96, antenna: 62 };
const GROUND = 30;

function Sky() {
  const stars = useMemo(
    () => Array.from({ length: 70 }).map((_, i) => ({ x: rand(i * 3.1) * 100, y: rand(i * 5.7) * 62, s: rand(i * 1.3) > 0.85 ? 2 : 1, o: 0.25 + rand(i * 9.1) * 0.6 })),
    []
  );
  const skyline = useMemo(
    () => Array.from({ length: 22 }).map((_, i) => ({ w: 4 + rand(i * 2.2) * 5, h: 30 + rand(i * 4.4) * 110 })),
    []
  );
  return (
    <>
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 70% 0%, #1b2547 0%, #0b1022 45%, #060912 100%)" }} />
      {stars.map((s, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }} />
      ))}
      <div className="absolute right-[8%] top-[7%] h-14 w-14 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #f8f4e3, #cfc8ad)", boxShadow: "0 0 50px 8px rgba(248,244,227,.18)" }} />
      <div className="absolute inset-x-0 flex items-end gap-[1%] px-2 opacity-40" style={{ bottom: GROUND }}>
        {skyline.map((b, i) => (
          <div key={i} className="bg-[#0f1630]" style={{ width: `${b.w}%`, height: b.h }} />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0" style={{ height: GROUND, background: "linear-gradient(180deg,#141a2b,#0a0d17)", borderTop: "1px solid #2a3350" }} />
    </>
  );
}

function Callout({ tier, meta, bottom, onOpen, weight, simulated }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group absolute right-3 w-[min(44%,230px)] rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-left backdrop-blur transition hover:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      style={{ bottom, transform: "translateY(50%)" }}
    >
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: meta.color }} />
        <span className="text-[13px] font-semibold text-slate-100">{meta.name}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2 font-mono text-[12px]">
        <span className="text-slate-300">
          {pctPlain(weight)}
          {simulated && <span className="ml-1 text-amber-300/80">sim</span>}
        </span>
        <Ret v={tier.ret}>{pct(tier.ret)}</Ret>
      </div>
      <div className="mt-0.5 text-[11px] text-slate-400 group-hover:text-slate-200">Apri dettagli →</div>
    </button>
  );
}

function Building({ weights, tiers, status, onOpen, simulated }) {
  const ref = useRef(null);
  const sceneW = useWidth(ref);
  const reduce = useReducedMotion();
  const compact = sceneW < 420;
  const buildingArea = compact ? sceneW * 0.8 : Math.min(540, sceneW * 0.54);
  const widthOf = (t, min) => Math.max(min, buildingArea * Math.sqrt(Math.max(weights[t], 0) / 100));
  const wCore = widthOf("core", 56);
  const wSat = widthOf("sat", 44);
  const wAtt = widthOf("att", 34);
  const collapse = status.level === "collapse";
  const stress = status.level === "stress";

  // Baricentro (altezza del centro di massa, pesi = % del portafoglio)
  const centers = { core: H.core / 2, sat: H.core + H.sat / 2, att: H.core + H.sat + H.att / 2 };
  const totalW = weights.core + weights.sat + weights.att || 1;
  const cog = TIER_ORDER.reduce((s, t) => s + weights[t] * centers[t], 0) / totalW;
  const structureH = H.core + H.sat + H.att;

  const shake = reduce
    ? {}
    : collapse
    ? { rotate: [0, -1.6, 1.3, -1.1, 1.6, -0.6, 0], x: [0, -4, 3, -3, 4, -1, 0] }
    : stress
    ? { rotate: [0, -0.5, 0.5, 0] }
    : { rotate: 0, x: 0 };
  const shakeT = collapse ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : stress ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 };

  const spring = { type: "spring", stiffness: 120, damping: 20 };
  const buildCenterPx = compact ? sceneW / 2 : buildingArea / 2 + sceneW * 0.03;
  const buildCenter = `${buildCenterPx}px`;
  // gru: appoggiata sul tetto delle fondamenta se c'è spazio, altrimenti a terra
  const upperHalf = Math.max(wSat, wAtt) / 2;
  const craneOnPodium = wCore / 2 > upperHalf + 34;
  const craneBottom = GROUND + (craneOnPodium ? H.core : 0);
  const craneH = H.sat + 70 + (craneOnPodium ? 0 : H.core);

  const tierBtn = (t, children, delay) => (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`${TIER_META[t].name}: ${pctPlain(weights[t])} del portafoglio, rendimento ${pct(tiers[t].ret)}. Apri dettagli`}
      onClick={() => onOpen(t)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(t))}
      className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      style={{ transformOrigin: "50% 100%" }}
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ filter: "brightness(1.18)" }}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* banner crollo */}
      <AnimatePresence>
        {collapse && (
          <motion.div
            role="alert"
            className="overflow-hidden rounded-xl border-2 border-rose-400/70 bg-rose-950/85"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="h-2 w-full" style={{ background: "repeating-linear-gradient(-45deg,#facc15 0 10px,#111 10px 20px)" }} />
            <div className="flex gap-3 px-4 py-3">
              <span className="mt-0.5 text-rose-300">
                <StatusIcon level="collapse" />
              </span>
              <div>
                <div className="text-sm font-bold uppercase tracking-wide text-rose-200">Attenzione: rischio di crollo strutturale</div>
                <p className="mt-1 text-[13px] leading-snug text-rose-100/90">
                  La base del tuo portafoglio non è sufficiente a sostenere i tuoi investimenti ad alto rischio.
                </p>
                <p className="mt-1 font-mono text-[11px] text-rose-200/70">
                  Rischio (satellite + attico) {pctPlain(status.risk)} &gt; fondamenta {pctPlain(weights.core)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    <div ref={ref} className="relative h-[620px] w-full overflow-hidden rounded-2xl border border-white/10">
      <Sky />

      {/* gru */}
      {!compact && (
        <motion.div
          className="absolute"
          style={{ scaleX: -1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, left: buildCenterPx + upperHalf - 106, bottom: craneBottom }}
          transition={{ type: "spring", stiffness: 120, damping: 20, opacity: { delay: 1.6 } }}
        >
          <Crane height={craneH} reduce={reduce} />
        </motion.div>
      )}

      {/* palazzo */}
      <div className="absolute flex flex-col items-center" style={{ bottom: GROUND, left: buildCenter, transform: "translateX(-50%)" }}>
        <motion.div className="flex flex-col items-center" style={{ transformOrigin: "50% 100%" }} animate={shake} transition={shakeT}>
          {tierBtn(
            "att",
            <div className="flex flex-col items-center">
              <Antenna height={H.antenna} neg={tiers.att.ret < 0} reduce={reduce} />
              <motion.div animate={{ width: wAtt }} transition={spring}>
                <Penthouse width={wAtt} height={H.att} tier={tiers.att} cracked={collapse} />
              </motion.div>
            </div>,
            1.1
          )}
          {tierBtn(
            "sat",
            <motion.div animate={{ width: wSat }} transition={spring}>
              <GlassFloors width={wSat} height={H.sat} tier={tiers.sat} cracked={collapse} reduce={reduce} />
            </motion.div>,
            0.55
          )}
        </motion.div>
        {tierBtn(
          "core",
          <motion.div animate={{ width: wCore }} transition={spring}>
            <Foundation width={wCore} height={H.core} tier={tiers.core} cracked={collapse} />
          </motion.div>,
          0
        )}
      </div>

      {/* baricentro */}
      <motion.div
        className="pointer-events-none absolute flex items-center"
        style={{ left: `calc(${buildCenter} - ${buildingArea / 2 + 8}px)`, width: buildingArea + 16 }}
        animate={{ bottom: GROUND + cog }}
        transition={spring}
      >
        <div className="h-0 flex-1 border-t border-dashed border-amber-200/70" />
        <div className="ml-1 h-3 w-3 rotate-45 border border-amber-200 bg-amber-300/30" />
      </motion.div>
      <motion.div
        className="pointer-events-none absolute whitespace-nowrap rounded bg-slate-950/75 px-1.5 py-0.5 font-mono text-[10px] text-amber-100/90"
        style={{ left: `calc(${buildCenter} - ${buildingArea / 2 + 8}px)` }}
        animate={{ bottom: GROUND + cog + 6 }}
        transition={spring}
      >
        baricentro · {pctPlain((cog / structureH) * 100, 0)} dell'altezza
      </motion.div>

      {/* etichette */}
      {!compact &&
        TIER_ORDER.map((t) => (
          <Callout
            key={t}
            tier={tiers[t]}
            meta={TIER_META[t]}
            weight={weights[t]}
            simulated={simulated}
            onOpen={() => onOpen(t)}
            bottom={GROUND + centers[t]}
          />
        ))}

      {simulated && (
        <div className="absolute left-3 top-3 rounded-md border border-amber-300/40 bg-amber-400/10 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-amber-200">
          Simulazione · pesi ipotetici
        </div>
      )}

    </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pannelli                                                            */
/* ------------------------------------------------------------------ */

function Kpi({ label, children, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-50 sm:text-2xl">{children}</div>
      {sub && <div className="mt-1 text-[12px] text-slate-400">{sub}</div>}
    </div>
  );
}

function LoadBar({ weights }) {
  return (
    <div>
      <div className="relative flex h-7 w-full gap-[2px] overflow-hidden rounded-md">
        {TIER_ORDER.map((t) => (
          <motion.div
            key={t}
            className="relative flex items-center justify-center overflow-hidden"
            style={{ background: TIER_META[t].color }}
            animate={{ width: `${weights[t]}%` }}
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
            title={`${TIER_META[t].name}: ${pctPlain(weights[t])}`}
          >
            {weights[t] >= 9 && <span className="font-mono text-[11px] font-semibold text-slate-950">{pctPlain(weights[t], 0)}</span>}
          </motion.div>
        ))}
        <div className="pointer-events-none absolute inset-y-[-4px] left-1/2 w-[2px] bg-rose-400" />
      </div>
      <div className="relative mt-1 h-4 text-[10px] text-slate-400">
        <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-rose-300">linea di crollo 50%</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-slate-300">
        {TIER_ORDER.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TIER_META[t].color }} />
            {TIER_META[t].name} <span className="font-mono text-slate-400">{pctPlain(weights[t])}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function CheckPanel({ weights, status, mode, setMode, sim, setSim, preset, setPreset }) {
  const s = STATUS_COPY[status.level];
  const applyPreset = (p) => {
    setPreset(p.id);
    if (p.id === "real") setMode("real");
    else {
      setMode("sim");
      setSim({ sat: p.w.sat, att: p.w.att });
    }
  };
  const setSlider = (k, v) => {
    const other = k === "sat" ? "att" : "sat";
    const val = Number(v);
    setPreset(null);
    setMode("sim");
    setSim((prev) => ({ ...prev, [k]: val, [other]: Math.min(prev[other], 100 - val) }));
  };
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Check strutturale</div>
        <div className={`mt-2 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold ${s.cls}`}>
          <StatusIcon level={status.level} />
          {s.label}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
          Asset a rischio (satellite + attico): <span className="font-mono text-slate-100">{pctPlain(status.risk)}</span> contro fondamenta{" "}
          <span className="font-mono text-slate-100">{pctPlain(weights.core)}</span>.
          {status.level === "stable" && " La base regge con ampio margine."}
          {status.level === "stress" && ` Sopra il ${STRESS_AT}% la struttura comincia a oscillare.`}
          {status.level === "collapse" && " I piani a rischio pesano più della base."}
        </p>
      </div>

      <LoadBar weights={weights} />

      <div className="border-t border-white/10 pt-4">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">Simula un'altra struttura</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-md border px-2.5 py-1 text-[12px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                (p.id === "real" && mode === "real") || preset === p.id
                  ? "border-sky-400/60 bg-sky-400/15 text-sky-100"
                  : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/30"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-3">
          {[
            ["sat", "Piani intermedi"],
            ["att", "Attico"],
          ].map(([k, label]) => (
            <label key={k} className="block">
              <div className="flex justify-between text-[12px] text-slate-300">
                <span>{label}</span>
                <span className="font-mono">{pctPlain(mode === "sim" ? sim[k] : weights[k])}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={mode === "sim" ? sim[k] : Math.round(weights[k])}
                onChange={(e) => setSlider(k, e.target.value)}
                className="mt-1 w-full accent-sky-400"
              />
            </label>
          ))}
          <div className="flex justify-between text-[12px] text-slate-400">
            <span>Fondamenta (il resto)</span>
            <span className="font-mono">{pctPlain(weights.core)}</span>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-snug text-slate-500">
          La simulazione cambia solo i pesi dei livelli. I rendimenti e l'elenco dei titoli restano quelli reali.
        </p>
      </div>
    </div>
  );
}

function Drawer({ tierId, tiers, weights, simulated, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!tierId) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [tierId, onClose]);

  return (
    <AnimatePresence>
      {tierId && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Dettagli ${TIER_META[tierId].name}`}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-white/10 bg-[#0b1020] shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            {(() => {
              const t = tiers[tierId];
              const m = TIER_META[tierId];
              return (
                <>
                  <div className="border-b border-white/10 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-sm" style={{ background: m.color }} />
                          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">{m.tag}</span>
                        </div>
                        <h2 className="mt-1 text-xl font-semibold text-slate-50">{m.name}</h2>
                        <p className="mt-1 text-[13px] text-slate-400">{m.blurb}</p>
                      </div>
                      <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-white/10 px-2 py-1 text-slate-300 hover:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        aria-label="Chiudi"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Valore</div>
                        <div className="font-mono text-sm text-slate-100">{eur(t.value, 0)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Peso reale</div>
                        <div className="font-mono text-sm text-slate-100">{pctPlain(t.weight)}</div>
                        {simulated && <div className="font-mono text-[10px] text-amber-300/80">sim {pctPlain(weights[tierId])}</div>}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Rendimento</div>
                        <Ret v={t.ret} className="font-mono text-sm">
                          {pct(t.ret)}
                        </Ret>
                        <div className="font-mono text-[11px] text-slate-400">{eurSigned(t.pnl, 0)}</div>
                      </div>
                    </div>
                    {TIER_NOTES?.[tierId] && (
                      <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-[12px] leading-relaxed text-amber-100/90">{TIER_NOTES[tierId]}</p>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-[13px]">
                      <caption className="sr-only">Posizioni del livello {m.name}</caption>
                      <thead className="sticky top-0 bg-[#0b1020] text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-5 py-2 font-medium">Asset</th>
                          <th className="px-2 py-2 text-right font-medium">Peso</th>
                          <th className="px-5 py-2 text-right font-medium">Rendimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.items.map((h, i) => {
                          const r = ((h.value - h.cost) / h.cost) * 100;
                          const inTier = (h.value / t.value) * 100;
                          return (
                            <motion.tr
                              key={h.isin}
                              className="border-t border-white/5 align-top"
                              initial={{ opacity: 0, x: 16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 + i * 0.03 }}
                            >
                              <td className="px-5 py-2.5">
                                <div className="font-medium text-slate-100">{h.name}</div>
                                <div className="font-mono text-[11px] text-slate-500">
                                  {h.isin} · {h.kind}
                                </div>
                                <div className="mt-1.5 h-1 w-full max-w-[180px] rounded-full bg-white/5">
                                  <div className="h-1 rounded-full" style={{ width: `${inTier}%`, background: m.color }} />
                                </div>
                                <div className="mt-0.5 text-[10px] text-slate-500">{pctPlain(inTier)} del livello</div>
                              </td>
                              <td className="px-2 py-2.5 text-right font-mono">
                                <div className="text-slate-100">{pctPlain((h.value / SNAPSHOT.total) * 100, 2)}</div>
                                <div className="text-[11px] text-slate-500">{eur(h.value, 0)}</div>
                              </td>
                              <td className="px-5 py-2.5 text-right font-mono">
                                <Ret v={r}>{pct(r)}</Ret>
                                <div className="text-[11px] text-slate-500">{eurSigned(h.value - h.cost, 0)}</div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const tiers = useMemo(computeTiers, []);
  const realWeights = useMemo(() => ({ core: tiers.core.weight, sat: tiers.sat.weight, att: tiers.att.weight }), [tiers]);
  const [mode, setMode] = useState("real");
  const [preset, setPreset] = useState("real");
  const [sim, setSim] = useState({ sat: Math.round(realWeights.sat), att: Math.round(realWeights.att) });
  const [open, setOpen] = useState(null);

  const weights = mode === "real" ? realWeights : { sat: sim.sat, att: sim.att, core: Math.max(0, 100 - sim.sat - sim.att) };
  const status = structuralStatus(weights);

  const totalCost = HOLDINGS.reduce((s, h) => s + h.cost, 0);
  const pnl = SNAPSHOT.total - totalCost;
  const ret = (pnl / totalCost) * 100;
  const realStatus = structuralStatus(realWeights);

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-200" style={{ fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif" }}>
      <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-300/80">Cantiere Core-Satellite</div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">Il tuo portafoglio come un grattacielo</h1>
            <p className="mt-1 max-w-2xl text-[13px] text-slate-400">
              La larghezza di ogni livello è proporzionale al suo peso (scala a radice quadrata: le percentuali reali sono sulle etichette). Le luci
              indicano il rendimento. Clicca su un livello per vederne il contenuto.
            </p>
          </div>
          <div className="text-right font-mono text-[11px] text-slate-500">
            <div>Scalable Capital · {SNAPSHOT.portfolio}</div>
            <div>{SNAPSHOT.asOf}</div>
          </div>
        </header>

        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Riepilogo">
          <Kpi label="Valore totale" sub={`${HOLDINGS.length} posizioni · liquidità ${eur(SNAPSHOT.cash, 0)}`}>
            <span className="font-mono tabular-nums">{eur(SNAPSHOT.total)}</span>
          </Kpi>
          <Kpi label="Rendimento non realizzato" sub={`su costo FIFO ${eur(totalCost, 0)}`}>
            <Ret v={pnl} className="font-mono">
              {eurSigned(pnl)} <span className="text-base">({pct(ret)})</span>
            </Ret>
          </Kpi>
          <Kpi
            label="Variazione recente"
            sub={
              <span className="font-mono">
                3 mesi <Ret v={SNAPSHOT.performance.m3}>{eurSigned(SNAPSHOT.performance.m3, 0)}</Ret> · 1 anno{" "}
                <Ret v={SNAPSHOT.performance.y1}>{eurSigned(SNAPSHOT.performance.y1, 0)}</Ret>
              </span>
            }
          >
            <span className="text-[12px] font-normal text-slate-400">1 mese </span>
            <Ret v={SNAPSHOT.performance.m1} className="font-mono">
              {eurSigned(SNAPSHOT.performance.m1)}
            </Ret>
          </Kpi>
          <Kpi label="Stabilità (dati reali)" sub={`Core ${pctPlain(realWeights.core)} · Rischio ${pctPlain(realStatus.risk)}`}>
            <span className={`inline-flex items-center gap-2 text-lg ${STATUS_COPY[realStatus.level].cls.split(" ")[0]}`}>
              <StatusIcon level={realStatus.level} />
              {STATUS_COPY[realStatus.level].label}
            </span>
          </Kpi>
        </section>

        <main className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_330px]">
          <Building weights={weights} tiers={tiers} status={status} onOpen={setOpen} simulated={mode === "sim"} />
          <CheckPanel weights={weights} status={status} mode={mode} setMode={setMode} sim={sim} setSim={setSim} preset={preset} setPreset={setPreset} />
        </main>

        <section className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]" aria-label="Tabella livelli">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Livello</th>
                <th className="px-4 py-2.5 text-right font-medium">Valore</th>
                <th className="px-4 py-2.5 text-right font-medium">Peso reale</th>
                <th className="px-4 py-2.5 text-right font-medium">Rendimento €</th>
                <th className="px-4 py-2.5 text-right font-medium">Rendimento %</th>
                <th className="px-4 py-2.5 text-right font-medium">Posizioni</th>
              </tr>
            </thead>
            <tbody>
              {[...TIER_ORDER].map((t) => (
                <tr key={t} className="cursor-pointer border-t border-white/5 hover:bg-white/[0.03]" onClick={() => setOpen(t)}>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2 text-slate-100">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TIER_META[t].color }} />
                      {TIER_META[t].name}
                      <span className="text-[11px] text-slate-500">{TIER_META[t].tag}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-200">{eur(tiers[t].value)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-200">{pctPlain(tiers[t].weight, 2)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    <Ret v={tiers[t].pnl}>{eurSigned(tiers[t].pnl)}</Ret>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    <Ret v={tiers[t].ret}>{pct(tiers[t].ret, 2)}</Ret>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-400">{tiers[t].items.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="mt-4 space-y-1 text-[11px] leading-relaxed text-slate-500">
          <p>
            Fonte: Scalable Capital, {SNAPSHOT.asOf}. Il rendimento è quello non realizzato, calcolato sul prezzo medio di carico FIFO: esclude
            dividendi e plusvalenze già incassate. La classificazione nei tre livelli è una scelta manuale, non un'indicazione dell'emittente.
          </p>
          <p>
            Regola del check: se il peso di satellite + attico supera quello delle fondamenta (oltre il 50%), o se un livello superiore è più largo della base,
            scatta l'allarme crollo. La soglia di "sotto sforzo" ({STRESS_AT}%) è una scelta didattica, non uno standard.
          </p>
        </footer>
      </div>

      <Drawer tierId={open} tiers={tiers} weights={weights} simulated={mode === "sim"} onClose={() => setOpen(null)} />
    </div>
  );
}
