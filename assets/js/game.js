// Pravidla hry – čisté funkce bez DOM, aby šly snadno ověřit a později rozšířit.
import { viditelneObtiznosti } from "./data.js";

export const OTAZEK_V_KOLE = 10;

/** Hvězdy za kolo: ★ od 50 %, ★★ od 70 %, ★★★ od 90 % (bez zaokrouhlování, celočíselně). */
export function hvezdy(spravne, celkem) {
  if (!celkem) return 0;
  if (spravne * 10 >= celkem * 9) return 3;
  if (spravne * 10 >= celkem * 7) return 2;
  if (spravne * 10 >= celkem * 5) return 1;
  return 0;
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
 * Je obtížnost odemčená? První zobrazená je vždy otevřená, každá další po ★★ v předchozí zobrazené.
 * nejlepsi(o) vrací nejlepší počet hvězd v obtížnosti o.
 */
export function odemceno(temaInfo, obtiznost, nejlepsi) {
  const vid = viditelneObtiznosti(temaInfo);
  const i = vid.indexOf(String(obtiznost));
  if (i < 0) return false;
  if (i === 0) return true;
  return nejlepsi(vid[i - 1]) >= 2;
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
