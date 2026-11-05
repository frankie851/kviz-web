// Pravidla hry – čisté funkce bez DOM, aby šly snadno ověřit a později rozšířit.
// Pravidla podle Davida (DECISIONS D-013): 5 hvězd, každých 10 % = půl hvězdy,
// každou obtížnost lze zahrát jen jednou, další obtížnost se odemkne od 70 %.
import { viditelneObtiznosti } from "./data.js";

export const OTAZEK_V_KOLE = 10;
export const MAX_HVEZD = 5;
export const ODEMCENI_PULHVEZD = 7; // 70 % = 3,5 ★

/** Půlhvězdy za kolo (0–10): každých celých 10 % = 1 půlhvězda. Celočíselně, bez zaokrouhlování nahoru. */
export function pulhvezdy(spravne, celkem) {
  if (!celkem) return 0;
  return Math.min(MAX_HVEZD * 2, Math.floor((spravne * 10) / celkem));
}

/** Odemyká výsledek další obtížnost? (aspoň 70 % správně) */
export function odemyka(spravne, celkem) {
  return !!celkem && spravne * 10 >= celkem * 7;
}

export function zamichej(pole) {
  const a = pole.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Otázky do kola: náhodně nejvýš 10 z obtížnosti, v náhodném pořadí. Možnosti A–D se nemíchají. */
export function sestavKolo(tema, obtiznost) {
  const vyber = tema.otazky.filter((q) => String(q.obtiznost) === String(obtiznost));
  return zamichej(vyber).slice(0, OTAZEK_V_KOLE);
}

/**
 * Stav obtížnosti: "otevreno" | "zamceno" (předchozí ještě nehrána) | "natrvalo" (předchozí pod 70 %).
 * vysledek(o) vrací uložený výsledek { s, c } dohrané obtížnosti, nebo null.
 */
export function stavObtiznosti(temaInfo, obtiznost, vysledek) {
  const vid = viditelneObtiznosti(temaInfo);
  const i = vid.indexOf(String(obtiznost));
  if (i < 0) return "zamceno";
  if (i === 0) return "otevreno";
  const pred = vysledek(vid[i - 1]);
  if (!pred) return "zamceno";
  return odemyka(pred.s, pred.c) ? "otevreno" : "natrvalo";
}

/** Další zobrazená obtížnost po dané (nebo null). */
export function dalsiObtiznost(temaInfo, obtiznost) {
  const vid = viditelneObtiznosti(temaInfo);
  const i = vid.indexOf(String(obtiznost));
  return i >= 0 && i < vid.length - 1 ? vid[i + 1] : null;
}

/** Datum v místním čase hráče jako RRRR-MM-DD. */
export function dnes(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function vcera(d = new Date()) {
  const v = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 12);
  return dnes(v);
}
