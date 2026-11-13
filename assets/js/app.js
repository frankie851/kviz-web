// Start aplikace a navigace přes hash (#/kategorie/...) – GitHub Pages neumí přesměrování na jednu stránku.
import { nactiTexty, nastavJazyk, t } from "./i18n.js";
import { nactiIndex } from "./data.js";
import { jeNastaveno, nast, aplikujVzhled } from "./settings.js";
import { h } from "./ui.js";
import * as uvod from "./screens/uvod.js";
import * as domu from "./screens/domu.js";
import * as kategorie from "./screens/kategorie.js";
import * as temata from "./screens/temata.js";
import * as obtiznost from "./screens/obtiznost.js";
import * as hra from "./screens/hra.js";
import * as vysledek from "./screens/vysledek.js";
import * as odznaky from "./screens/odznaky.js";
import * as nastaveni from "./screens/nastaveni.js";
import * as prehled from "./screens/prehled.js";
import * as historie from "./screens/historie.js";
import * as statistiky from "./screens/statistiky.js";
import * as procvicovani from "./screens/procvicovani.js";
import * as vyzva from "./screens/vyzva.js";

const TRASY = [
  [/^\/?$/, domu],
  [/^\/vitej$/, uvod],
  [/^\/kategorie$/, kategorie],
  [/^\/kategorie\/([\w-]+)$/, temata],
  [/^\/tema\/([\w-]+)$/, obtiznost],
  [/^\/hra\/([\w-]+)\/([1-9])$/, hra],
  [/^\/vysledek$/, vysledek],
  [/^\/prehled\/([\w-]+)\/([1-9])$/, prehled],
  [/^\/historie$/, historie],
  [/^\/statistiky$/, statistiky],
  [/^\/procvicovani$/, procvicovani],
  [/^\/vyzva$/, vyzva],
  [/^\/odznaky$/, odznaky],
  [/^\/nastaveni$/, nastaveni],
];

// „hloubka“ obrazovky pro směr přechodu: hlouběji = příjezd zprava, zpět = zleva
const HLOUBKA = new Map([[domu, 0], [uvod, 0], [kategorie, 1], [historie, 1], [statistiky, 1], [procvicovani, 2], [vyzva, 1], [odznaky, 1], [nastaveni, 1],
  [temata, 2], [obtiznost, 3], [hra, 4], [vysledek, 5], [prehled, 5]]);

const koren = document.getElementById("app");
let minulaHloubka = null;
let uklid = null;
let poradi = 0;
let minulaCesta = null;
let cilPoUvodu = null; // adresa, kterou nový hráč otevřel před prvním spuštěním (KONTROLA D-5)
const ZPOZDENI_NACITANI = 300; // ms – kratší čekání hráč nepostřehne, delší dostane „Načítám…“ (KONTROLA D-2)

function cesta() {
  return decodeURIComponent(location.hash.replace(/^#/, "")) || "/";
}

/** Přejde na adresu; nahradit = bez nového záznamu v historii (tlačítko Zpět ho přeskočí). */
export function jdi(hash, { nahradit = false } = {}) {
  if (nahradit) {
    history.replaceState(null, "", hash);
    vykresli();
  } else if (location.hash === hash) {
    vykresli();
  } else {
    location.hash = hash;
  }
}

export async function vykresli() {
  const moje = ++poradi;
  const c = cesta();
  if (!jeNastaveno() && c !== "/vitej") {
    if (c !== "/") cilPoUvodu = location.hash;
    return jdi("#/vitej", { nahradit: true });
  }

  let obrazovka = null;
  let param = [];
  for (const [re, mod] of TRASY) {
    const m = c.match(re);
    if (m) {
      obrazovka = mod;
      param = m.slice(1);
      break;
    }
  }
  if (!obrazovka) return jdi("#/", { nahradit: true });
  if (obrazovka !== uvod && jeNastaveno()) nastavJazyk(nast().ui);

  if (uklid) {
    try { uklid(); } catch { /* nic */ }
    uklid = null;
  }

  let vysl;
  const casovac = setTimeout(() => ukazNacitani(moje), ZPOZDENI_NACITANI);
  try {
    vysl = await obrazovka.vykresli(param, { jdi, prekresli: vykresli, poUvodu });
  } catch (e) {
    console.error(e);
    vysl = { el: chyba(), titulek: t("chyba.nadpis") };
  } finally {
    clearTimeout(casovac);
    if (moje === poradi) schovejNacitani();
  }
  if (moje !== poradi || !vysl) {
    // mezitím se šlo jinam: zahozená obrazovka nesmí nechat viset posluchače (klávesy) – KONTROLA D-6
    try { vysl?.uklid?.(); } catch { /* nic */ }
    return;
  }
  if (vysl.presmeruj) return jdi(vysl.presmeruj, { nahradit: true });

  // překreslení téže obrazovky (např. změna jazyka v Nastavení): zachovat posun i fokus
  const klic = `${c}|${vysl.klic || ""}`;
  const stejna = klic === minulaCesta;
  minulaCesta = klic;
  const posun = window.scrollY;
  const fokusId = stejna ? document.activeElement?.closest?.("[id], [data-hodnota]") : null;
  const fokusKlic = fokusId ? [fokusId.closest("[role=radiogroup]")?.getAttribute("aria-labelledby"), fokusId.dataset?.hodnota, fokusId.id] : null;

  koren.replaceChildren(vysl.el);
  koren.dataset.obrazovka = obrazovka.ID || "";
  uklid = vysl.uklid || null;
  document.title = vysl.titulek ? `${vysl.titulek} · ${t("app.nazev")}` : `${t("app.nazev")} – ${t("app.podtitul")}`;
  if (stejna) {
    window.scrollTo(0, posun);
    if (fokusKlic) {
      const [skupina, hodnota, id] = fokusKlic;
      const cil = skupina && hodnota != null
        ? koren.querySelector(`[aria-labelledby="${skupina}"] [data-hodnota="${hodnota}"]`)
        : id ? document.getElementById(id) : null;
      cil?.focus({ preventScroll: true });
    }
    return;
  }
  window.scrollTo(0, 0);
  // přechod: nová obrazovka přijede ze strany podle směru (CSS .screen-in-*; „omezit pohyb“ ho vypne)
  const hloubka = HLOUBKA.get(obrazovka) ?? 0;
  if (minulaHloubka !== null) {
    vysl.el.classList.add(hloubka < minulaHloubka ? "screen-in-zpet" : hloubka > minulaHloubka ? "screen-in-vpred" : "screen-in");
  }
  minulaHloubka = hloubka;
  // čtečkám obrazovky oznámit novou obrazovku: fokus na nadpis
  const nadpis = koren.querySelector("h1");
  if (nadpis && !vysl.bezFokusu) {
    if (!nadpis.hasAttribute("tabindex")) nadpis.setAttribute("tabindex", "-1");
    nadpis.focus({ preventScroll: true });
  }
}

/** Po prvním spuštění: na adresu, kterou hráč původně otevřel (odkaz na téma), jinak Domů. */
function poUvodu() {
  const cil = cilPoUvodu;
  cilPoUvodu = null;
  jdi(cil || "#/", { nahradit: true });
}

let nacitani = null;
function ukazNacitani(moje) {
  if (moje !== poradi || nacitani) return;
  nacitani = h("div", { class: "nacitam", role: "status" },
    h("span", { class: "nacitam-tecka", "aria-hidden": "true" }), t("app.nacitam"));
  koren.setAttribute("aria-busy", "true");
  document.body.append(nacitani);
}
function schovejNacitani() {
  koren.removeAttribute("aria-busy");
  nacitani?.remove();
  nacitani = null;
}

function chyba() {
  return h(
    "main",
    { class: "screen screen-error" },
    h("h1", { text: t("chyba.nadpis") }),
    h("p", { text: t("chyba.text") }),
    h("button", { type: "button", class: "btn btn-primary", text: t("chyba.znovu"), onclick: () => location.reload() })
  );
}

async function start() {
  try {
    await Promise.all([nactiTexty(), nactiIndex()]);
  } catch (e) {
    console.error(e);
    // texty se nenačetly – nouzová zpráva v obou jazycích přímo z index.html
    document.getElementById("nacitani-chyba")?.removeAttribute("hidden");
    document.getElementById("nacitani")?.setAttribute("hidden", "");
    return;
  }
  nastavJazyk(nast().ui);
  aplikujVzhled(); // tmavý režim a velikost písma (D-028)
  window.addEventListener("hashchange", vykresli);
  await vykresli();
  document.documentElement.classList.add("ready");
}

start();
