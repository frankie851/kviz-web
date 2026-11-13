// Nastavení hráče (jazyk rozhraní, jazyk otázek, překlad, zvuky, vibrace).
import { nacti, uloz } from "./storage.js";
import { JAZYKY_ROZHRANI } from "./i18n.js";

export const PREKLAD = { VZDY: "vzdy", TUKNUTI: "tuknuti", VYPNUTO: "vypnuto" };

let nastaveni = nacti("nastaveni", null);

export function jeNastaveno() {
  return !!(nastaveni && nastaveni.ui);
}

export function nast() {
  return { vzhled: VZHLED.AUTO, pismo: PISMO.NORMALNI, predcitani: "tlacitko", ...(nastaveni || { ui: "cs", otazky: "cs", preklad: PREKLAD.VYPNUTO, zvuky: true, vibrace: true }) };
}

// Vzhled (D-028): barevný režim podle telefonu / světlý / tmavý a velikost písma. Na <html> se zapíše
// data-vzhled a data-pismo; barvy a velikosti řeší CSS (proměnné), „podle telefonu“ přes prefers-color-scheme.
export const VZHLED = { AUTO: "auto", SVETLY: "svetly", TMAVY: "tmavy" };
export const PISMO = { NORMALNI: "normalni", VETSI: "vetsi", NEJVETSI: "nejvetsi" };
const BARVA_LISTY = { svetly: "#FFF6EA", tmavy: "#1C1220" }; // barva lišty prohlížeče = pozadí stránky

export function aplikujVzhled(s = nast()) {
  const html = document.documentElement;
  if (s.vzhled === VZHLED.AUTO) delete html.dataset.vzhled;
  else html.dataset.vzhled = s.vzhled;
  if (s.pismo === PISMO.NORMALNI) delete html.dataset.pismo;
  else html.dataset.pismo = s.pismo;
  const tmavy = s.vzhled === VZHLED.TMAVY || (s.vzhled === VZHLED.AUTO && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    if (s.vzhled === VZHLED.AUTO) m.setAttribute("content", m.media?.includes("dark") ? BARVA_LISTY.tmavy : BARVA_LISTY.svetly);
    else m.setAttribute("content", tmavy ? BARVA_LISTY.tmavy : BARVA_LISTY.svetly);
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
