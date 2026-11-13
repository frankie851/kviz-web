// Nastavení hráče (jazyk rozhraní, jazyk otázek, překlad, zvuky, vibrace).
import { nacti, uloz } from "./storage.js";
import { JAZYKY_ROZHRANI } from "./i18n.js";

export const PREKLAD = { VZDY: "vzdy", TUKNUTI: "tuknuti", VYPNUTO: "vypnuto" };

let nastaveni = nacti("nastaveni", null);

export function jeNastaveno() {
  return !!(nastaveni && nastaveni.ui);
}

export function nast() {
  return { vzhled: VZHLED.AUTO, pismo: PISMO.NORMALNI, kontrast: false, citelne: false, predcitani: "tlacitko", tydenniCil: 5, oblibene: [], domu: {}, ...(nastaveni || { ui: "cs", otazky: "cs", preklad: PREKLAD.VYPNUTO, zvuky: true, vibrace: true }) };
}

// Vzhled (D-028): barevný režim podle telefonu / světlý / tmavý a velikost písma. Na <html> se zapíše
// data-vzhled a data-pismo; barvy a velikosti řeší CSS (proměnné), „podle telefonu“ přes prefers-color-scheme.
export const VZHLED = { AUTO: "auto", SVETLY: "svetly", TMAVY: "tmavy" };
export const PISMO = { NORMALNI: "normalni", VETSI: "vetsi", NEJVETSI: "nejvetsi" };
const BARVA_LISTY = { svetly: "#FFF6EA", tmavy: "#1C1220", svetlyKontrast: "#FFFFFF", tmavyKontrast: "#000000" }; // barva lišty prohlížeče = pozadí stránky

export function aplikujVzhled(s = nast()) {
  const html = document.documentElement;
  if (s.vzhled === VZHLED.AUTO) delete html.dataset.vzhled;
  else html.dataset.vzhled = s.vzhled;
  if (s.pismo === PISMO.NORMALNI) delete html.dataset.pismo;
  else html.dataset.pismo = s.pismo;
  // vysoký kontrast a čitelnější písmo (D-039)
  if (s.kontrast) html.dataset.kontrast = "vysoky";
  else delete html.dataset.kontrast;
  if (s.citelne) html.dataset.citelne = "ano";
  else delete html.dataset.citelne;
  const tmavy = s.vzhled === VZHLED.TMAVY || (s.vzhled === VZHLED.AUTO && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const barva = (t) => BARVA_LISTY[`${t ? "tmavy" : "svetly"}${s.kontrast ? "Kontrast" : ""}`];
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    if (s.vzhled === VZHLED.AUTO) m.setAttribute("content", barva(m.media?.includes("dark")));
    else m.setAttribute("content", barva(tmavy));
  });
}

export function zmen(zmeny) {
  nastaveni = { ...nast(), ...zmeny };
  uloz("nastaveni", nastaveni);
  return nastaveni;
}

/** Druhý jazyk k danému (v 1. verzi CZ ↔ EN). */
export function druhyJazyk(j, dostupne = JAZYKY_ROZHRANI) {
  return dostupne.find((x) => x !== j) || j;
}

/** Jazyk překladu: můj jazyk, když otázky běží v jiném; jinak druhý dostupný jazyk. */
export function jazykPrekladu(s = nast(), dostupne = JAZYKY_ROZHRANI) {
  return s.ui !== s.otazky && dostupne.includes(s.ui) ? s.ui : druhyJazyk(s.otazky, dostupne);
}

/** Tři způsoby hraní z prvního spuštění → jazyk otázek + režim překladu. */
export const ZPUSOBY = {
  muj: (ui) => ({ otazky: ui, preklad: PREKLAD.VYPNUTO }),
  ucim: (ui) => ({ otazky: druhyJazyk(ui), preklad: PREKLAD.TUKNUTI }),
  obe: (ui) => ({ otazky: ui, preklad: PREKLAD.VZDY }),
};

// ---------- oblíbené kategorie a obsah Domů (D-037)
/** Je kategorie připnutá mezi oblíbené? */
export function jeOblibena(katId) {
  return (nast().oblibene || []).includes(katId);
}

/** Připne / odepne kategorii. Vrátí true, když je po změně oblíbená. */
export function prepniOblibenou(katId) {
  const o = (nast().oblibene || []).filter((x) => x !== katId);
  const nyni = o.length === (nast().oblibene || []).length;
  zmen({ oblibene: nyni ? [...o, katId] : o });
  return nyni;
}

/** Části Domů, které jde vypnout (výchozí všechny zapnuté). */
export const CASTI_DOMU = ["pruh", "postup", "souhrn", "pokracuj", "vyzva", "nahoda", "nova"];
export function ukazNaDomu(cast) {
  return (nast().domu || {})[cast] !== false;
}
