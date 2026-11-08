// 3. Kategorie – mřížka barevných dlaždic s ikonou, názvem, dohranými tématy (x / t) a hvězdami.
// Dlaždice se ukazují i přímo na Domů (D-021); tahle obrazovka je pro „Všechny kategorie“.
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdyText, ikonaKategorie } from "../ui.js";
import { viditelneKategorie, txt } from "../data.js";
import { hvezdyKategorie, uzavrenaVKategorii } from "../progress.js";

export const ID = "kategorie";
// Barvy dlaždic (D-024): vybrané kategorie mají pevnou barvu, ostatní střídají žlutou, malinovou, růžovou a šedou.
// Černá se nepoužívá. Styly jsou v CSS (.tile-0 … .tile-4, .tile-zelena, .tile-modra).
const PEVNE = { sport: "zelena", "priroda-a-zvirata": "zelena", kuriozity: "modra" };
const STRIDANI = [0, 1, 3, 4]; // žlutá, malinová, růžová, šedá
const barvaDlazdice = (k, i) => PEVNE[k.id] ?? STRIDANI[i % STRIDANI.length];

/** Dlaždice kategorie: x / t = témata, ve kterých už nejde pokračovat / všechna témata kategorie. */
export function dlazdiceKategorie(k, i) {
  const hv = hvezdyKategorie(k);
  const u = uzavrenaVKategorii(k);
  return h(
    "a",
    { class: `tile tile-${barvaDlazdice(k, i)}`, href: `#/kategorie/${k.id}`, "data-kategorie": k.id },
    ikonaKategorie(k),
    h("span", { class: "tile-name", text: txt(k.nazev, jazyk()) }),
    h("span", { class: "tile-meta" },
      h("span", { class: "tile-done", "data-test": "dohrano", text: t("kategorie.dohrano", { x: u.x, n: u.t }) }),
      h("span", { class: "tile-stars", text: hvezdyText(hv.pul, hv.max) }))
  );
}

export function vykresli() {
  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/", nadpis: t("kategorie.nadpis") }),
    h("div", { class: "tiles" }, viditelneKategorie().map(dlazdiceKategorie))
  );
  return { el, titulek: t("kategorie.nadpis") };
}
