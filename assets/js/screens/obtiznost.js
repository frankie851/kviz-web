// 5. Obtížnost – tři velká tlačítka. Každá obtížnost se hraje jen jednou (D-013):
// dohraná vede na přehled odpovědí, další se odemkne od 70 %, pod 70 % zůstane zamčená natrvalo.
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdicky } from "../ui.js";
import { najdiTema, viditelneObtiznosti, txt, predNactiTema } from "../data.js";
import { vysledek, stav, rozehrane, oznacTemaOtevrene } from "../progress.js";
import { pruvodceKdyzTreba } from "../pruvodce.js";

export const ID = "obtiznost";
const IKONY = { 1: "🌱", 2: "🌿", 3: "🌳" };

export function vykresli([temaId]) {
  const info = najdiTema(temaId);
  if (!info) return { presmeruj: "#/kategorie" };
  const { tema, kategorie } = info;
  const vid = viditelneObtiznosti(tema);
  predNactiTema(tema.id);
  oznacTemaOtevrene(tema.id); // štítek „Nové“ po otevření tématu zmizí (D-035) // otázky se stahují, zatímco hráč vybírá – kolo pak začne hned (KONTROLA D-2)

  const tlacitka = vid.map((o, i) => {
    const s = stav(tema, o);
    const v = vysledek(tema.id, o);
    const predchozi = i > 0 ? t(`obtiznost.lokal.${vid[i - 1]}`) : "";
    const roz = rozehrane(tema.id, o);
    const popis = {
      dohrano: v ? t("obtiznost.hotovo", { s: v.s, c: v.c }) : "",
      otevreno: roz?.odpovedi?.length ? t("obtiznost.rozehrano", { i: roz.odpovedi.length, n: roz.poradi.length }) : t("obtiznost.jednou"),
      zamceno: t("obtiznost.odemkne", { predchozi }),
      natrvalo: t("obtiznost.natrvalo", { predchozi }),
    }[s];
    const ikona = s === "dohrano" ? "✅" : s === "otevreno" ? IKONY[o] || "⭐" : s === "natrvalo" ? "⛔" : "🔒";
    const obsah = [
      h("span", { class: "diff-ico", "aria-hidden": "true", text: ikona }),
      h("span", { class: "diff-body" },
        h("span", { class: "diff-name", text: t(`obtiznost.${o}`) }),
        s === "dohrano" ? hvezdicky(v.pul, 5, "stars stars-diff") : null,
        h("span", { class: "diff-desc", text: popis }),
        s === "dohrano" ? h("span", { class: "diff-link", text: t("obtiznost.prohlednout") }) : null),
    ];
    const tr = `diff diff-${o} diff-${s}`;
    if (s === "dohrano") return h("a", { class: tr, href: `#/prehled/${tema.id}/${o}`, "data-obtiznost": o, "data-stav": s }, obsah);
    if (s === "otevreno") return h("a", { class: tr, href: `#/hra/${tema.id}/${o}`, "data-obtiznost": o, "data-stav": s }, obsah);
    return h("div", { class: `${tr} locked`, "aria-disabled": "true", "data-obtiznost": o, "data-stav": s }, obsah);
  });

  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: `#/kategorie/${kategorie.id}`, nadpis: txt(tema.nazev, jazyk()) }),
    h("p", { class: "lead lead-center", text: t("obtiznost.vyber") }),
    h("div", { class: "diffs" }, tlacitka)
  );
  pruvodceKdyzTreba(); // nový hráč přišel odkazem rovnou na téma (D-036)
  return { el, titulek: txt(tema.nazev, jazyk()) };
}
