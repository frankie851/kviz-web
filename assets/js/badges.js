// Odznaky (seznam a důvod výběru v docs/DECISIONS.md). Názvy a popisy jsou v i18n pod "odznak.<id>".
// splneno(ctx) se volá po každém dohraném kole; ctx.pokrok je už aktualizovaný.
import { kategorie } from "./data.js";

export const ODZNAKY = [
  { id: "prvni-kolo", ikona: "🎉", splneno: () => true },
  { id: "bez-chyby", ikona: "💎", splneno: ({ kolo }) => kolo.hvezdy === 3 },
  { id: "rada-5", ikona: "🔥", splneno: ({ kolo }) => kolo.nejdelsiRada >= 5 },
  { id: "rada-10", ikona: "⚡", splneno: ({ kolo }) => kolo.nejdelsiRada >= 10 },
  { id: "tezka", ikona: "🏔️", splneno: ({ kolo }) => String(kolo.obt) === "3" && kolo.hvezdy >= 2 },
  { id: "temata-3", ikona: "🧭", splneno: ({ api }) => api.pocetDohranych() >= 3 },
  {
    id: "tema-hvezdy",
    ikona: "🌟",
    splneno: ({ info, api }) => {
      const h = api.hvezdyTematu(info.tema);
      return h.max > 0 && h.ziskano === h.max;
    },
  },
  {
    id: "kategorie-hvezdy",
    ikona: "👑",
    splneno: ({ info, api }) => {
      const h = api.hvezdyKategorie(kategorie(info.kategorie.id));
      return h.max > 0 && h.ziskano === h.max;
    },
  },
  { id: "dny-3", ikona: "📅", splneno: ({ pokrok }) => pokrok.dny.serie >= 3 },
  { id: "dny-7", ikona: "🗓️", splneno: ({ pokrok }) => pokrok.dny.serie >= 7 },
  { id: "polyglot", ikona: "🌍", splneno: ({ kolo }) => kolo.jazykOtazek !== kolo.jazykUi },
  {
    id: "bez-napovedy",
    ikona: "🦉",
    splneno: ({ kolo }) =>
      kolo.jazykOtazek !== kolo.jazykUi && kolo.preklad === "tuknuti" && !kolo.prekladOtevren && kolo.hvezdy >= 2,
  },
];

export function odznak(id) {
  return ODZNAKY.find((o) => o.id === id);
}
