// 3. Kategorie – mřížka barevných dlaždic s ikonou, názvem, dohranými tématy (x / t) a hvězdami.
// Dlaždice se ukazují i přímo na Domů (D-021); tahle obrazovka je „Všechny kategorie“ a nahoře má
// hledání témat (D-027, dřív na Domů – D-026): od 2 znaků se místo dlaždic ukážou nalezená témata.
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdyText, ikonaKategorie } from "../ui.js";
import { viditelneKategorie, viditelnaTemata, txt } from "../data.js";
import { hvezdyKategorie, hvezdyTematu, uzavrenaVKategorii } from "../progress.js";

export const ID = "kategorie";
const BARVY = 5; // počet barevných stylů dlaždic v CSS (.tile-0 … .tile-4)
const MAX_VYSLEDKU = 30;
const MIN_ZNAKU = 2;

let hledani = ""; // pamatuje se po dobu otevřené stránky – po návratu z tématu je hledání pořád vyplněné

/** Text bez diakritiky a velkých písmen (hledání „pohadky“ najde „Pohádky“). */
const norm = (s) => String(s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Dlaždice kategorie: x / t = témata, ve kterých už nejde pokračovat / všechna témata kategorie. */
export function dlazdiceKategorie(k, i) {
  const hv = hvezdyKategorie(k);
  const u = uzavrenaVKategorii(k);
  return h(
    "a",
    { class: `tile tile-${i % BARVY}`, href: `#/kategorie/${k.id}`, "data-kategorie": k.id },
    ikonaKategorie(k),
    h("span", { class: "tile-name", text: txt(k.nazev, jazyk()) }),
    h("span", { class: "tile-meta" },
      h("span", { class: "tile-done", "data-test": "dohrano", text: t("kategorie.dohrano", { x: u.x, n: u.t }) }),
      h("span", { class: "tile-stars", text: hvezdyText(hv.pul, hv.max) }))
  );
}

/** Výsledky hledání: karty témat (ikona kategorie, název, kategorie · hvězdy). */
function vysledkyHledani(dotaz) {
  const q = norm(dotaz.trim());
  const nalez = [];
  for (const kat of viditelneKategorie()) {
    for (const tema of viditelnaTemata(kat)) {
      if (Object.values(tema.nazev || {}).some((n) => norm(n).includes(q))) nalez.push({ kat, tema });
    }
  }
  if (!nalez.length) return [h("p", { class: "empty-hledani", "data-test": "nic-nenalezeno", text: t("domu.nicNenalezeno") })];
  const karty = nalez.slice(0, MAX_VYSLEDKU).map(({ kat, tema }) => {
    const hv = hvezdyTematu(tema);
    return h("a", { class: "card hit", href: `#/tema/${tema.id}`, "data-tema": tema.id },
      ikonaKategorie(kat, "hit-ico"),
      h("span", { class: "hit-body" },
        h("span", { class: "hit-name", text: txt(tema.nazev, jazyk()) }),
        h("span", { class: "hit-meta", text: `${txt(kat.nazev, jazyk())} · ${hvezdyText(hv.pul, hv.max)}` })),
      h("span", { class: "hist-go", "aria-hidden": "true", text: "→" }));
  });
  if (nalez.length > MAX_VYSLEDKU) karty.push(h("p", { class: "note", text: t("domu.dalsiVysledky", { n: nalez.length - MAX_VYSLEDKU }) }));
  return [h("p", { class: "hit-count", "data-test": "pocet-nalezu", text: t("domu.nalezeno", { n: nalez.length }) }), h("div", { class: "cards" }, karty)];
}

export function vykresli() {
  const dlazdice = h("div", { class: "tiles", "data-test": "kategorie-vse" }, viditelneKategorie().map(dlazdiceKategorie));
  const vysledky = h("div", { class: "hledani-vysledky", "data-test": "vysledky-hledani", "aria-live": "polite" });
  // při psaní se místo dlaždic ukážou nalezená témata (bez překreslení obrazovky – fokus zůstane v poli)
  const pole = h("input", {
    type: "search", class: "hledani-pole", id: "hledani", "data-test": "hledani", autocomplete: "off", enterkeyhint: "search",
    placeholder: t("domu.hledatPlaceholder"), "aria-label": t("domu.hledat"), value: hledani,
  });
  const ukaz = () => {
    hledani = pole.value;
    const aktivni = norm(hledani.trim()).length >= MIN_ZNAKU;
    dlazdice.hidden = aktivni;
    vysledky.hidden = !aktivni;
    vysledky.replaceChildren(...(aktivni ? vysledkyHledani(hledani) : []));
  };
  pole.addEventListener("input", ukaz);
  pole.addEventListener("keydown", (e) => { if (e.key === "Escape") { pole.value = ""; ukaz(); } });
  ukaz();

  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/", nadpis: t("kategorie.nadpis") }),
    h("div", { class: "hledani", role: "search" },
      h("span", { class: "hledani-ico", "aria-hidden": "true", text: "🔎" }),
      pole),
    vysledky,
    dlazdice
  );
  return { el, titulek: t("kategorie.nadpis") };
}
