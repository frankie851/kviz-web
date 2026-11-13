// 4. Témata v kategorii – karty témat, u každé tři malé ukazatele hvězd (Lehká / Střední / Těžká).
// Od 4 témat nahoře filtr Vše / Nehrané / Rozehrané / Hotové s počty (D-026).
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdicky, hvezdyText, ikonaKategorie } from "../ui.js";
import { kategorie, viditelnaTemata, viditelneObtiznosti, txt } from "../data.js";
import { pulV, stav, hvezdyTematu, stavTematu, jeNoveTema } from "../progress.js";
import { jeOblibena, prepniOblibenou } from "../settings.js";
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

  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/", nadpis: txt(kat.nazev, jazyk()), vpravo: tlacitkoOblibene(kat) }),
    filtrEl, // filtr nahoře, „Vyber si téma“ pod ním (D-031)
    h("p", { class: "lead lead-center lead-ikona" }, ikonaKategorie(kat, "lead-ico"), h("span", { text: t("temata.vyberTema") })),
    h("div", { class: "cards" }, karty),
    prazdne
  );
  return { el, titulek: txt(kat.nazev, jazyk()) };
}
