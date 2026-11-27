// 4. Témata v kategorii (seznam, nebo Cesta tématy – D-043) – karty témat, u každé tři malé ukazatele hvězd (Lehká / Střední / Těžká).
// Od 4 témat nahoře filtr Vše / Nehrané / Rozehrané / Hotové s počty (D-026).
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdicky, hvezdyText, ikonaKategorie } from "../ui.js";
import { kategorie, viditelnaTemata, viditelneObtiznosti, txt } from "../data.js";
import { pulV, stav, hvezdyTematu, stavTematu, jeNoveTema, stavKategorieTydne } from "../progress.js";
import { jeOblibena, prepniOblibenou, nast, zmen } from "../settings.js";
import { barvaKategorie } from "./kategorie.js";
import { kratkeOznameni } from "../oslavy.js";

export const ID = "temata";

/** ☆ / ★ v záhlaví kategorie: připne kategorii mezi oblíbené – na Domů a ve Všech kategoriích bude první (D-037). */
function tlacitkoOblibene(kat) {
  const btn = h("button", { type: "button", class: "iconbtn iconbtn-oblibena", "data-test": "oblibena-prepnout" });
  const obnov = () => {
    const ano = jeOblibena(kat.id);
    btn.setAttribute("aria-pressed", String(ano));
    btn.setAttribute("aria-label", t(ano ? "oblibene.odepnout" : "oblibene.pripnout"));
    btn.title = t(ano ? "oblibene.odepnout" : "oblibene.pripnout");
    btn.replaceChildren(h("span", { "aria-hidden": "true", text: ano ? "★" : "☆" }));
  };
  btn.addEventListener("click", () => {
    const ano = prepniOblibenou(kat.id);
    obnov();
    kratkeOznameni(t(ano ? "oblibene.pripnuto" : "oblibene.odepnuto"));
  });
  obnov();
  return btn;
}
const FILTRY = ["vse", "nehrane", "rozehrane", "hotove"];
// ikony místo textu, aby se filtr vešel na telefonu na jeden řádek (D-027); text je v title a pro čtečky
const IKONY_FILTRU = { nehrane: "🚦", rozehrane: "🏃", hotove: "🏁" };
const MIN_TEMAT_PRO_FILTR = 4;
const zvolenyFiltr = new Map(); // kategorie → filtr (pamatuje se po dobu otevřené stránky)

// ---------- Cesta tématy (D-043): témata kategorie jako zastávky na klikaté cestě
const POZICE = [22, 50, 78, 50]; // vodorovná poloha zastávek v % šířky (cik-cak)
const IKONA_ZASTAVKY = { hotove: "✓", rozehrane: "🏃", nehrane: "" };

/** Mapa s cestou: start 🚩, zastávky v pořadí témat, cíl 🏁. Dohraná svítí barvou kategorie, další na řadě má „Hraj“. */
function cestaTematy(kat, temata) {
  const barva = barvaKategorie(kat);
  const stavy = temata.map((tema) => stavTematu(tema));
  const dalsi = stavy.indexOf("rozehrane") >= 0 ? stavy.indexOf("rozehrane") : stavy.indexOf("nehrane");
  const n = temata.length;
  const hotovo = stavy.filter((x) => x === "hotove").length;
  // čára: řádek = 100 jednotek, start nahoře (řádek 0), zastávky řádky 1…n, cíl řádek n+1
  // cíl pokračuje v cik-caku (nikdy přímo pod poslední zastávkou)
  const xCile = POZICE[n % POZICE.length];
  const body = [[50, 50], ...temata.map((_, i) => [POZICE[i % POZICE.length], 150 + i * 100]), [xCile, 150 + n * 100]];
  let d = `M ${body[0][0]} ${body[0][1]}`;
  for (let i = 1; i < body.length; i++) {
    // ze zastávky vodorovně ke straně další, pak dolů do ní shora – čára tak nejde přes popisek pod zastávkou
    const [x0, y0] = body[i - 1];
    const [x1, y1] = body[i];
    d += ` C ${x0 + (x1 - x0) * 0.85} ${y0}, ${x1} ${y0 + 15}, ${x1} ${y1}`;
  }
  const SVG = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "cesta-cara");
  svg.setAttribute("viewBox", `0 0 100 ${(n + 2) * 100}`);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  // hotová část cesty (po poslední dohranou zastávku) plnou barvou, zbytek čárkovaně
  const posledniHotova = stavy.lastIndexOf("hotove");
  for (const [trida, delka] of [["cesta-zbytek", null], ["cesta-hotovo", posledniHotova >= 0 ? posledniHotova + 2 : 0]]) {
    if (delka === 0) continue;
    const cast = delka == null ? d : d.split(" C ").slice(0, delka).join(" C ");
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", cast);
    path.setAttribute("class", trida);
    path.setAttribute("vector-effect", "non-scaling-stroke");
    svg.append(path);
  }
  const radek = (i, obsah, trida = "", x = POZICE[i % POZICE.length]) => h("li", { class: `cesta-radek ${trida}`, style: `--x: ${x}%` }, obsah);
  const zastavky = temata.map((tema, i) => {
    const st = stavy[i];
    const hv = hvezdyTematu(tema);
    const nazev = txt(tema.nazev, jazyk());
    return radek(i, h("a", {
      class: `zastavka zastavka-${st}${i === dalsi ? " is-dalsi" : ""}`, href: `#/tema/${tema.id}`, "data-tema": tema.id, "data-stav-tematu": st,
      "aria-label": `${nazev} – ${t(`temata.filtr.${st}`)}, ${hvezdyText(hv.pul, hv.max)}`,
    },
    h("span", { class: `zastavka-kruh${st === "hotove" ? ` tile-c-${barva}` : ""}`, "aria-hidden": "true" },
      h("span", { class: "zastavka-cislo", text: IKONA_ZASTAVKY[st] || String(i + 1) })),
    i === dalsi ? h("span", { class: "zastavka-hraj", "aria-hidden": "true", text: t("cesta.hraj") }) : null,
    // podklad pod textem, aby čára cesty nešla přes písmena
    h("span", { class: "zastavka-text", "aria-hidden": "true" },
      h("span", { class: "zastavka-nazev", text: nazev }),
      h("span", { class: "zastavka-hvezdy", text: hvezdyText(hv.pul, hv.max) }),
      jeNoveTema(tema.id) ? h("span", { class: "stitek-nove", text: t("nova.stitek") }) : null)));
  });
  return h("section", { class: "cesta", "data-test": "cesta", style: `--radku: ${n + 2}` },
    h("div", { class: "cesta-souhrn", "data-test": "cesta-souhrn" },
      h("span", { text: t("cesta.souhrn", { x: hotovo, n }) }),
      h("div", { class: "meter" }, h("i", { class: "m-ok", style: { width: `${n ? (hotovo / n) * 100 : 0}%` } }))),
    h("div", { class: "cesta-mapa" },
      svg,
      h("ol", { class: "cesta-seznam", "aria-label": t("cesta.aria", { kategorie: txt(kat.nazev, jazyk()) }) },
        radek(-1, h("span", { class: "cesta-znacka", "aria-hidden": "true", text: "🚩" }), "cesta-start", 50),
        zastavky,
        radek(-1, h("span", { class: `cesta-znacka${hotovo === n ? " is-cil" : ""}`, "aria-hidden": "true", text: "🏁" }), "cesta-cil", xCile))));
}

/** Přepínač Seznam / Cesta (pamatuje se v nastavení). */
function prepinacPohledu(zmena) {
  const volby = [["seznam", "☰"], ["cesta", "🗺️"]];
  const tlacitka = volby.map(([v, ikona]) => h("button", {
    type: "button", class: "chip pohled-btn", "data-pohled": v, "aria-pressed": "false", onclick: () => zmena(v),
  }, h("span", { "aria-hidden": "true", text: `${ikona} ` }), t(`cesta.pohled.${v}`)));
  const el = h("div", { class: "pohled", role: "group", "aria-label": t("cesta.pohled.nadpis"), "data-test": "pohled" }, tlacitka);
  el.oznac = (v) => tlacitka.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.pohled === v)));
  return el;
}

export function vykresli([katId]) {
  const kat = kategorie(katId);
  if (!kat) return { presmeruj: "#/kategorie" };

  const karty = viditelnaTemata(kat).map((tema) => {
    const hv = hvezdyTematu(tema);
    const ukazatele = viditelneObtiznosti(tema).map((o) => {
      const s = stav(tema, o);
      const obsah =
        s === "dohrano"
          ? hvezdicky(pulV(tema.id, o), 5, "stars stars-mini")
          : s === "otevreno"
            ? h("span", { class: "mini-new", text: t("temata.hraj") })
            : h("span", { class: "mini-lock", role: "img", "aria-label": t(s === "natrvalo" ? "obtiznost.zamcenoNatrvalo" : "obtiznost.zamceno"), text: s === "natrvalo" ? "⛔" : "🔒" });
      return h("span", { class: `mini mini-${s}`, "data-obtiznost": o, "data-stav": s }, h("span", { class: "mini-label", text: t(`obtiznost.${o}`) }), obsah);
    });
    return h(
      "a",
      { class: "card topic", href: `#/tema/${tema.id}`, "data-tema": tema.id, "data-stav-tematu": stavTematu(tema) },
      h("span", { class: "topic-head" },
        h("span", { class: "topic-name" }, h("span", { text: txt(tema.nazev, jazyk()) }),
          jeNoveTema(tema.id) ? h("span", { class: "stitek-nove", "data-test": "tema-nove", text: t("nova.stitek") }) : null),
        h("span", { class: "topic-sum", text: hvezdyText(hv.pul, hv.max) })),
      h("span", { class: "minis" }, ukazatele)
    );
  });

  // filtr: přepíná jen viditelnost karet (bez překreslení obrazovky)
  let filtrEl = null;
  const prazdne = h("p", { class: "empty-hledani", "data-test": "filtr-prazdny", hidden: true, text: t("temata.filtrPrazdny") });
  if (karty.length >= MIN_TEMAT_PRO_FILTR) {
    const pocty = { vse: karty.length };
    for (const k of karty) pocty[k.dataset.stavTematu] = (pocty[k.dataset.stavTematu] || 0) + 1;
    const tlacitka = FILTRY.map((f) => h("button", {
      type: "button", class: "chip", "data-filtr": f, "aria-pressed": "false",
      title: t(`temata.filtr.${f}`), "aria-label": `${t(`temata.filtr.${f}`)} (${pocty[f] || 0})`,
      onclick: () => nastav(f),
    },
    IKONY_FILTRU[f] ? h("span", { class: "chip-ico", "aria-hidden": "true", text: IKONY_FILTRU[f] }) : h("span", { "aria-hidden": "true", text: t(`temata.filtr.${f}`) }),
    h("span", { class: "chip-n", "aria-hidden": "true", text: String(pocty[f] || 0) })));
    const nastav = (f) => {
      zvolenyFiltr.set(kat.id, f);
      tlacitka.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filtr === f)));
      let vidno = 0;
      for (const k of karty) {
        k.hidden = f !== "vse" && k.dataset.stavTematu !== f;
        if (!k.hidden) vidno += 1;
      }
      prazdne.hidden = vidno > 0;
    };
    filtrEl = h("div", { class: "chips", role: "group", "aria-label": t("temata.filtrNadpis"), "data-test": "filtr" }, tlacitka);
    nastav(zvolenyFiltr.get(kat.id) || "vse");
  }

  // seznam (filtr, „Vyber si téma“, karty) nebo cesta tématy (D-043); cesta se vyrobí až při prvním zobrazení
  const seznam = h("div", { class: "pohled-seznam" },
    filtrEl, // filtr nahoře, „Vyber si téma“ pod ním (D-031)
    h("p", { class: "lead lead-center lead-ikona" }, ikonaKategorie(kat, "lead-ico"), h("span", { text: t("temata.vyberTema") })),
    h("div", { class: "cards" }, karty),
    prazdne);
  const cestaObal = h("div", { class: "pohled-cesta", hidden: true });
  const pohled = karty.length >= 2 ? prepinacPohledu((v) => { zmen({ pohledTemat: v }); prepni(v); }) : null;
  function prepni(v) {
    if (!pohled) v = "seznam";
    pohled?.oznac(v);
    if (v === "cesta" && !cestaObal.firstChild) cestaObal.append(cestaTematy(kat, viditelnaTemata(kat)));
    seznam.hidden = v === "cesta";
    cestaObal.hidden = v !== "cesta";
  }

  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/", nadpis: txt(kat.nazev, jazyk()), vpravo: tlacitkoOblibene(kat) }),
    (() => {
      // kategorie týdne (D-040): připomínka pod lištou
      const st = stavKategorieTydne();
      return st?.kat.id === kat.id
        ? h("p", { class: "kat-tydne-stitek", "data-test": "kat-tydne-stitek", text: st.splneno ? t("katTydne.stitekSplneno") : t("katTydne.stitek", { h: st.kol, c: st.cil }) })
        : null;
    })(),
    pohled,
    seznam,
    cestaObal
  );
  prepni(nast().pohledTemat === "cesta" ? "cesta" : "seznam");
  return { el, titulek: txt(kat.nazev, jazyk()) };
}
