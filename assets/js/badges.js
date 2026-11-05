// Odznaky (seznam a důvod výběru v docs/DECISIONS.md, D-011 a D-013). Názvy a popisy jsou v i18n pod "odznak.<id>".
// splneno(ctx) se volá po každém dohraném kole; ctx.pokrok je už aktualizovaný, ctx.kolo.pul = půlhvězdy (0–10).
import { kategorie } from "./data.js";

const plne = (h) => h.max > 0 && h.pul === h.max;

export const ODZNAKY = [
  { id: "prvni-kolo", ikona: "🎉", splneno: () => true },
  { id: "bez-chyby", ikona: "💎", splneno: ({ kolo }) => kolo.spravne === kolo.celkem },
  { id: "rada-5", ikona: "🔥", splneno: ({ kolo }) => kolo.nejdelsiRada >= 5 },
  { id: "rada-10", ikona: "⚡", splneno: ({ kolo }) => kolo.nejdelsiRada >= 10 },
  { id: "tezka", ikona: "🏔️", splneno: ({ kolo }) => String(kolo.obt) === "3" && kolo.odemyka },
  { id: "temata-3", ikona: "🧭", splneno: ({ api }) => api.pocetDohranych() >= 3 },
  { id: "tema-hvezdy", ikona: "🌟", splneno: ({ info, api }) => plne(api.hvezdyTematu(info.tema)) },
  { id: "kategorie-hvezdy", ikona: "👑", splneno: ({ info, api }) => plne(api.hvezdyKategorie(kategorie(info.kategorie.id))) },
  { id: "dny-3", ikona: "📅", splneno: ({ pokrok }) => pokrok.dny.serie >= 3 },
  { id: "dny-7", ikona: "🗓️", splneno: ({ pokrok }) => pokrok.dny.serie >= 7 },
  { id: "polyglot", ikona: "🌍", splneno: ({ kolo }) => kolo.jazykOtazek !== kolo.jazykUi },
  {
    id: "bez-napovedy",
    ikona: "🦉",
    splneno: ({ kolo }) => kolo.jazykOtazek !== kolo.jazykUi && kolo.preklad === "tuknuti" && !kolo.prekladOtevren && kolo.odemyka,
  },
];

export function odznak(id) {
  return ODZNAKY.find((o) => o.id === id);
}
