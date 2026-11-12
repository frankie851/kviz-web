// Odznaky (D-014, stupňové řady D-026). Názvy a popisy jsou v i18n pod "odznak.<id>" (jednotlivé),
// "odznak.rodina-<rodina>" (stupňové řady) a "odznak.kat" (znalec kategorie).
// splneno(ctx) se volá po každém dohraném kole; ctx.pokrok je už aktualizovaný, ctx.kolo.pul = půlhvězdy (0–10),
// ctx.api = funkce pokroku (progress.js `apiOdznaku`).
import { t, jazyk } from "./i18n.js";
import { kategorie, idx, viditelneKategorie, viditelnaTemata, txt } from "./data.js";

const plne = (h) => h.max > 0 && h.pul === h.max;

/** Jednotlivé odznaky (bez stupňů). */
const JEDNOTLIVE = [
  { id: "prvni-kolo", ikona: "🎉", splneno: () => true },
  { id: "bez-chyby", ikona: "💎", splneno: ({ kolo }) => kolo.spravne === kolo.celkem },
  { id: "rada-5", ikona: "🔥", splneno: ({ kolo }) => kolo.nejdelsiRada >= 5 },
  { id: "rada-10", ikona: "⚡", splneno: ({ kolo }) => kolo.nejdelsiRada >= 10 },
  { id: "tezka", ikona: "🏔️", splneno: ({ kolo }) => String(kolo.obt) === "3" && kolo.odemyka },
  { id: "temata-3", ikona: "🧭", splneno: ({ api }) => api.pocetDohranych() >= 3 },
  { id: "tema-hvezdy", ikona: "🌟", splneno: ({ info, api }) => plne(api.hvezdyTematu(info.tema)) },
  { id: "kategorie-hvezdy", ikona: "👑", splneno: ({ info, api }) => plne(api.hvezdyKategorie(kategorie(info.kategorie.id))) },
  { id: "polyglot", ikona: "🌍", splneno: ({ kolo }) => kolo.jazykOtazek !== kolo.jazykUi },
  {
    id: "bez-napovedy",
    ikona: "🦉",
    splneno: ({ kolo }) => kolo.jazykOtazek !== kolo.jazykUi && kolo.preklad === "tuknuti" && !kolo.prekladOtevren && kolo.odemyka,
  },
];

export const MEDAILE = ["🥉", "🥈", "🥇"]; // bronz, stříbro, zlato

/** Stupňové řady (D-026). ids = id odznaků po stupních (série dní zachovává původní dny-3 a dny-7). */
const RODINY = [
  { rodina: "temata", ikona: "🧳", prahy: [10, 50, 100], hodnota: (api) => api.pocetUzavrenych() },
  { rodina: "spravne", ikona: "🎓", prahy: [100, 500, 2000], hodnota: (api) => api.spravneCelkem() },
  { rodina: "hvezdy", ikona: "✨", prahy: [50, 250, 1000], hodnota: (api) => api.hvezdyCelych() },
  { rodina: "dny", ikona: "📅", prahy: [3, 7, 30], ids: ["dny-3", "dny-7", "dny-30"], hodnota: (api) => api.serieDni() },
];

const PODILY_KATEGORIE = [25, 50, 100]; // % témat kategorie, která už nejde hrát dál (dohráno x / t)

/** Řady pro zobrazení: { klic, rodina?, kat?, ikona, stupne: [odznak…], hodnota(api) }. */
function sestavRady() {
  const rady = RODINY.map((r) => ({
    klic: r.rodina,
    rodina: r.rodina,
    ikona: r.ikona,
    hodnota: r.hodnota,
    stupne: r.prahy.map((prah, i) => ({ id: r.ids?.[i] || `${r.rodina}-${prah}`, rodina: r.rodina, stupen: i + 1, prah, ikona: MEDAILE[i] })),
  }));
  for (const k of viditelneKategorie()) {
    const n = viditelnaTemata(k).length;
    const hodnota = (api) => api.uzavrenaVKategorii(k).x;
    rady.push({
      klic: `kat-${k.id}`,
      kat: k,
      ikona: k.ikona,
      hodnota,
      stupne: PODILY_KATEGORIE.map((pct, i) => ({
        id: `kat-${k.id}-${i + 1}`, kat: k, stupen: i + 1, pct, prah: Math.max(1, Math.ceil((pct / 100) * n)), ikona: MEDAILE[i],
      })),
    });
  }
  for (const r of rady) for (const o of r.stupne) o.splneno = ({ api }) => r.hodnota(api) >= o.prah;
  return rady;
}

let cache = { index: null, rady: [], vse: [] };
function aktualni() {
  if (cache.index !== idx()) {
    const rady = sestavRady();
    cache = { index: idx(), rady, vse: [...JEDNOTLIVE, ...rady.flatMap((r) => r.stupne)] };
  }
  return cache;
}

/** Všechny odznaky (jednotlivé + všechny stupně); mění se s počtem kategorií v datech. */
export function vsechnyOdznaky() {
  return aktualni().vse;
}

export function jednotliveOdznaky() {
  return JEDNOTLIVE;
}

/** Stupňové řady (obecné + po kategoriích) pro obrazovku Odznaky. */
export function radyOdznaku() {
  return aktualni().rady;
}

export function odznak(id) {
  return vsechnyOdznaky().find((o) => o.id === id);
}

const nazevKat = (k) => txt(k.nazev, jazyk());

/** Název řady (Cestovatel, Znalec: Historie…). */
export function nazevRady(r) {
  return r.kat ? t("odznak.kat.nazev", { kategorie: nazevKat(r.kat) }) : t(`odznak.rodina-${r.rodina}.nazev`);
}

/** Název odznaku – u stupňů „Řada – bronz“. */
export function nazevOdznaku(o) {
  if (!o.stupen) return t(`odznak.${o.id}.nazev`);
  const rada = o.kat ? t("odznak.kat.nazev", { kategorie: nazevKat(o.kat) }) : t(`odznak.rodina-${o.rodina}.nazev`);
  return `${rada} – ${t(`odznaky.stupen.${o.stupen}`)}`;
}

/** Popis odznaku (jak ho získat). */
export function popisOdznaku(o) {
  if (!o.stupen) return t(`odznak.${o.id}.popis`);
  if (o.kat) return t("odznak.kat.popis", { p: o.pct, n: o.prah, kategorie: nazevKat(o.kat) });
  return t(`odznak.rodina-${o.rodina}.popis`, { n: o.prah });
}
