// Zvuky (generované ve Web Audio, žádné soubory) a vibrace. Obojí jde vypnout v Nastavení.
// Kde prohlížeč vibrace nebo zvuk neumí, potichu se nic nestane (např. iPhone vibrace v prohlížeči nemá).
import { nast } from "./settings.js";

let ctx = null;
let vystup = null; // společná cesta: hlasitost → kompresor (aby se souběžné tóny nepřebíjely)

function audio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
    const komp = ctx.createDynamicsCompressor();
    komp.threshold.value = -14;
    komp.ratio.value = 4;
    vystup = ctx.createGain();
    vystup.gain.value = 0.9;
    vystup.connect(komp).connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

const PULTON = 2 ** (1 / 12);

/**
 * Jeden tón: f = frekvence (Hz), od = začátek (s od teď), d = délka (s), typ vlny, hlasitost,
 * klouzat = cílová frekvence (glissando), alikvot = tichý tón o oktávu výš (jasnější barva).
 */
function ton(ac, t0, { f, od = 0, d = 0.15, typ = "sine", vol = 0.16, klouzat = null, alikvot = false }) {
  const start = t0 + od;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = typ;
  osc.frequency.setValueAtTime(f, start);
  if (klouzat) osc.frequency.exponentialRampToValueAtTime(klouzat, start + d);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + d);
  osc.connect(g).connect(vystup);
  osc.start(start);
  osc.stop(start + d + 0.03);
  if (alikvot) ton(ac, t0, { f: f * 2, od, d: d * 0.7, typ: "sine", vol: vol * 0.25, klouzat: klouzat ? klouzat * 2 : null });
}

// Noty (Hz)
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760, C7: 2093 };
// Hvězdy stoupají po pentatonice – každá další o kousek výš
const HVEZDY = [N.C6, N.D6, N.E6, N.G6, N.A6];

/** Melodie: pole tónů (viz ton), param = { rada, i, pul } podle zvuku. */
const MELODIE = {
  // správně: krátké „cink-cink“, s každou další správnou odpovědí v řadě o půltón výš (nejvýš +6)
  spravne: ({ rada = 1 } = {}) => {
    const k = PULTON ** Math.min(Math.max(rada - 1, 0), 6);
    return [
      { f: N.G5 * k, d: 0.11, typ: "triangle", vol: 0.17, alikvot: true },
      { f: N.D6 * k, od: 0.08, d: 0.2, typ: "triangle", vol: 0.17, alikvot: true },
    ];
  },
  // špatně: měkké klesající „bum-bum“, ne tvrdý bzučák
  spatne: () => [
    { f: 311, d: 0.16, typ: "triangle", vol: 0.2, klouzat: 277 },
    { f: 247, od: 0.13, d: 0.28, typ: "triangle", vol: 0.2, klouzat: 196 },
  ],
  // jedna hvězda na výsledku (i = pořadí 0–4); půlhvězda tišeji
  hvezda: ({ i = 0, pul = false } = {}) => [{ f: HVEZDY[Math.min(i, 4)], d: 0.22, typ: "sine", vol: pul ? 0.09 : 0.15, alikvot: true }],
  // konec kola podle výsledku
  fanfara: () => [
    { f: N.C5, d: 0.14, typ: "triangle", vol: 0.15 },
    { f: N.E5, od: 0.11, d: 0.14, typ: "triangle", vol: 0.15 },
    { f: N.G5, od: 0.22, d: 0.14, typ: "triangle", vol: 0.15 },
    { f: N.C6, od: 0.33, d: 0.6, typ: "triangle", vol: 0.17, alikvot: true },
    { f: N.E5, od: 0.33, d: 0.6, typ: "sine", vol: 0.08 },
    { f: N.G5, od: 0.33, d: 0.6, typ: "sine", vol: 0.08 },
  ],
  dobre: () => [
    { f: N.G5, d: 0.14, typ: "triangle", vol: 0.15 },
    { f: N.C6, od: 0.12, d: 0.16, typ: "triangle", vol: 0.15 },
    { f: N.E6, od: 0.24, d: 0.36, typ: "triangle", vol: 0.15, alikvot: true },
  ],
  slabe: () => [
    { f: N.E5, d: 0.2, typ: "sine", vol: 0.14 },
    { f: N.C5, od: 0.18, d: 0.38, typ: "sine", vol: 0.14 },
  ],
  // nový odznak: třpytivé arpeggio
  odznak: () => [
    { f: N.E6, d: 0.1, typ: "sine", vol: 0.12 },
    { f: N.G6, od: 0.07, d: 0.1, typ: "sine", vol: 0.12 },
    { f: N.C7, od: 0.14, d: 0.32, typ: "sine", vol: 0.13, alikvot: true },
  ],
  // ukázka po zapnutí zvuků v Nastavení
  ukazka: () => [{ f: N.C6, d: 0.16, typ: "triangle", vol: 0.15, alikvot: true }],
};

/** Přehraje zvuk; za = zpoždění v sekundách (např. hvězdy jedna po druhé). */
export function zvuk(nazev, param = {}, za = 0) {
  if (!nast().zvuky) return;
  const ac = audio();
  const melodie = MELODIE[nazev];
  if (!ac || !melodie) return;
  try {
    if (ac.state === "suspended") ac.resume();
    const t0 = ac.currentTime + 0.01 + za;
    for (const tn of melodie(param)) ton(ac, t0, tn);
  } catch { /* nic */ }
}

const VZORY = {
  spravne: 25,
  spatne: [70, 40, 70],
  fanfara: [30, 40, 30, 40, 80],
  dobre: [40, 60, 40],
  slabe: 40,
  odznak: [20, 30, 20, 30, 20],
  ukazka: 30,
};

export function vibrace(nazev) {
  if (!nast().vibrace) return;
  try {
    if (typeof navigator.vibrate === "function") navigator.vibrate(VZORY[nazev] ?? 30);
  } catch { /* nic */ }
}

export function odezva(nazev, param) {
  zvuk(nazev, param);
  vibrace(nazev);
}
