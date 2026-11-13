// Denní výzva (D-032): každý den stejných 5 otázek pro všechny hráče (stejná data na webu + datum).
// Výběr je náhodný, ale určený datem: 5 různých témat napříč kategoriemi, obtížnosti Lehká, Lehká, Střední,
// Střední, Těžká (když téma danou obtížnost nemá, vezme se jakákoli). Výsledky kol ani hvězdy se nemění.
import { vsechnaTemata, nactiTema, najdiTema } from "./data.js";

export const OTAZEK = 5;
const OBTIZNOSTI = ["1", "1", "2", "2", "3"];

/** Generátor náhodných čísel 0–1 ze slova (mulberry32 nad jednoduchým hashem). */
function nahoda(slovo) {
  let a = 2166136261;
  for (const ch of slovo) a = Math.imul(a ^ ch.codePointAt(0), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** ID otázek výzvy pro datum „RRRR-MM-DD“ (pro všechny hráče stejné). */
export async function vyberVyzvy(datum) {
  const rnd = nahoda(`oho-vyzva-${datum}`);
  const temata = vsechnaTemata().slice().sort((a, b) => a.id.localeCompare(b.id));
  for (let i = temata.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [temata[i], temata[j]] = [temata[j], temata[i]];
  }
  const vybrana = temata.slice(0, OTAZEK);
  const data = await Promise.all(vybrana.map((t) => nactiTema(t.id)));
  return vybrana.map((t, i) => {
    const vse = data[i].otazky.slice().sort((a, b) => a.id.localeCompare(b.id));
    const dle = vse.filter((q) => String(q.obtiznost) === OBTIZNOSTI[i]);
    const z = dle.length ? dle : vse;
    return z[Math.floor(rnd() * z.length)].id;
  });
}

/** Otázky výzvy podle uložených ID: [{ q, info }] (chybějící otázky – např. po aktualizaci dat – vynechá). */
export async function polozkyVyzvy(ids) {
  const vysl = [];
  for (const id of ids) {
    const temaId = id.split("-")[0];
    const info = najdiTema(temaId);
    if (!info) continue;
    try {
      const q = (await nactiTema(temaId)).otazky.find((x) => x.id === id);
      if (q) vysl.push({ q, info });
    } catch { /* téma se nenačetlo */ }
  }
  return vysl;
}
