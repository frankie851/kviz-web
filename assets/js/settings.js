// Nastavení hráče (jazyk rozhraní, jazyk otázek, překlad, zvuky, vibrace).
import { nacti, uloz } from "./storage.js";
import { JAZYKY_ROZHRANI } from "./i18n.js";

export const PREKLAD = { VZDY: "vzdy", TUKNUTI: "tuknuti", VYPNUTO: "vypnuto" };

let nastaveni = nacti("nastaveni", null);

export function jeNastaveno() {
  return !!(nastaveni && nastaveni.ui);
}

export function nast() {
  return nastaveni || { ui: "cs", otazky: "cs", preklad: PREKLAD.VYPNUTO, zvuky: true, vibrace: true };
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
