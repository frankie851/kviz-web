// Krátký zvuk (generovaný ve Web Audio, žádné soubory) a vibrace. Obojí jde vypnout v Nastavení.
// Kde prohlížeč vibrace nebo zvuk neumí, potichu se nic nestane.
import { nast } from "./settings.js";

let ctx = null;

function audio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

function ton(ac, frekvence, start, delka, typ = "sine", hlasitost = 0.18) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = typ;
  osc.frequency.setValueAtTime(frekvence, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(hlasitost, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + delka);
  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + delka + 0.02);
}

const MELODIE = {
  spravne: [[660, 0, 0.12], [990, 0.09, 0.18]],
  spatne: [[220, 0, 0.22, "triangle"], [185, 0.12, 0.26, "triangle"]],
  konec: [[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.26]],
};

export function zvuk(nazev) {
  if (!nast().zvuky) return;
  const ac = audio();
  if (!ac) return;
  try {
    if (ac.state === "suspended") ac.resume();
    const t0 = ac.currentTime + 0.01;
    for (const [f, od, delka, typ] of MELODIE[nazev] || []) ton(ac, f, t0 + od, delka, typ);
  } catch { /* nic */ }
}

const VZORY = { spravne: 30, spatne: [60, 50, 60], konec: [40, 60, 40] };

export function vibrace(nazev) {
  if (!nast().vibrace) return;
  try {
    if (typeof navigator.vibrate === "function") navigator.vibrate(VZORY[nazev] || 30);
  } catch { /* nic */ }
}

export function odezva(nazev) {
  zvuk(nazev);
  vibrace(nazev);
}
