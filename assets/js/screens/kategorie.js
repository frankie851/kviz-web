// 3. Kategorie – mřížka barevných dlaždic s ikonou, názvem, dohranými tématy (x / t) a hvězdami.
// Dlaždice se ukazují i přímo na Domů (D-021); tahle obrazovka je „Všechny kategorie“ a nahoře má
// hledání témat (D-027, dřív na Domů – D-026): od 2 znaků se místo dlaždic ukážou nalezená témata.
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdyText, ikonaKategorie } from "../ui.js";
import { idx, viditelneKategorie, viditelnaTemata, txt } from "../data.js";
import { hvezdyKategorie, hvezdyTematu, uzavrenaVKategorii } from "../progress.js";

export const ID = "kategorie";

// Barvy dlaždic (D-029, nahrazuje D-024): každá kategorie má barvy podle tématu (od nejvhodnější), ostatní
// kategorie dostanou první barvu z palety. Bez černé a béžové; všechny barvy mají bílý text (kontrast ≥ 5 : 1)
// a odliší se od světlého (≥ 4,7 : 1) i tmavého pozadí (≈ 3 : 1). Barva se přiděluje postupně podle pořadí
// kategorií tak, aby se neopakovala u 3 předchozích dlaždic (sousedé vedle i nad sebou ve 2 i 3 sloupcích)
// a aby ani podobný odstín (stejná „rodina“) nebyl hned vedle nebo nad. Styly .tile-c-<barva> jsou v CSS.
const PALETA = ["malina", "zelena", "modra", "oranzova", "fialova", "tyrkys", "cervena", "indigo", "hneda"];
const RODINA = { malina: "cervena", cervena: "cervena", oranzova: "oranzova", hneda: "hneda", zelena: "zelena", tyrkys: "zelena", modra: "modra", indigo: "modra", fialova: "fialova" };
const BARVY_TEMAT = {
  historie: ["hneda", "cervena", "indigo"],
  zemepis: ["modra", "tyrkys", "zelena"],
  "priroda-a-zvirata": ["zelena", "tyrkys"],
  "umeni-a-literatura": ["fialova", "malina"],
  sport: ["oranzova", "zelena", "cervena"],
  kuriozity: ["fialova", "malina", "modra"],
  "veda-a-technika": ["tyrkys", "modra", "indigo"],
  "film-a-tv": ["cervena", "malina", "fialova"],
  "jidlo-a-piti": ["oranzova", "cervena", "hneda"],
  hudba: ["malina", "fialova", "indigo"],
  "lidske-telo": ["cervena", "malina", "oranzova", "tyrkys"],
  "mytologie-a-nabozenstvi": ["indigo", "fialova"],
  "jazyk-a-slova": ["tyrkys", "modra", "fialova", "hneda"],
  cesko: ["zelena", "tyrkys", "modra"], // vlajka je červeno-modro-bílá – na červené nebo modré by splývala
  vesmir: ["indigo", "modra", "fialova"],
  "ekonomika-a-penize": ["zelena", "hneda"],
  vynalezy: ["modra", "indigo", "fialova", "tyrkys"],
};

let barvy = { index: null, mapa: new Map() };
/** id kategorie → barva dlaždice (počítá se jednou pro aktuální data). */
function barvaKategorie(k) {
  if (barvy.index !== idx()) {
    const mapa = new Map();
    const pred = [];
    for (const kat of viditelneKategorie()) {
      const vhodne = [...(BARVY_TEMAT[kat.id] || []), ...PALETA];
      const ok = (b) => !pred.slice(-3).includes(b) && !pred.slice(-2).some((x) => RODINA[x] === RODINA[b]);
      const b = vhodne.find(ok) || vhodne.find((x) => !pred.slice(-1).includes(x)) || PALETA[0];
      mapa.set(kat.id, b);
      pred.push(b);
    }
    barvy = { index: idx(), mapa };
  }
  return barvy.mapa.get(k.id) || PALETA[0];
}
const MAX_VYSLEDKU = 30;
const MIN_ZNAKU = 2;

let hledani = ""; // pamatuje se po dobu otevřené stránky – po návratu z tématu je hledání pořád vyplněné

/** Text bez diakritiky a velkých písmen (hledání „pohadky“ najde „Pohádky“). */
const norm = (s) => String(s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Dlaždice kategorie: x / t = témata, ve kterých už nejde pokračovat / všechna témata kategorie. */
export function dlazdiceKategorie(k) {
  const hv = hvezdyKategorie(k);
  const u = uzavrenaVKategorii(k);
  return h(
    "a",
    { class: `tile tile-c-${barvaKategorie(k)}`, href: `#/kategorie/${k.id}`, "data-kategorie": k.id, "data-barva": barvaKategorie(k) },
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
