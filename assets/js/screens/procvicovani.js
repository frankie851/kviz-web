// Procvičování chyb (D-031) – otázky, na které hráč dřív odpověděl špatně, náhodně nejvýš 10 za sebou.
// Hvězdy, výsledky, série ani odznaky se tím nemění; správně zodpovězená otázka ze seznamu chyb zmizí.
// Samotné otázky obstarává společná sada (sada.js, stejná jako u denní výzvy).
import { t } from "../i18n.js";
import { h, lista } from "../ui.js";
import { zamichej } from "../game.js";
import { chybneOtazky, oznacProcviceno } from "../progress.js";
import { sadaOtazek } from "../sada.js";

export const ID = "procvicovani";
const V_KOLE = 10;

export async function vykresli(_param, app) {
  const vse = await chybneOtazky();
  if (!vse.length) {
    const el = h("main", { class: "screen" },
      lista({ zpet: "#/historie", nadpis: t("procvic.nadpis") }),
      h("div", { class: "empty", "data-test": "procvic-prazdne" },
        h("p", { text: t("procvic.zadne") }),
        h("a", { class: "btn btn-primary btn-big", href: "#/historie", text: t("procvic.zpet") })));
    return { el, titulek: t("procvic.nadpis") };
  }

  const sada = sadaOtazek({
    polozky: zamichej(vse).slice(0, V_KOLE),
    naOdpoved: (q, _k, ok) => { if (ok) oznacProcviceno(q.id); },
    naKonec: ({ spravne, celkem, telo }) => {
      const zbyva = vse.length - spravne;
      telo.replaceChildren(h("section", { class: "card procvic-konec", "data-test": "procvic-konec" },
        h("p", { class: "res-title", text: t("procvic.hotovo") }),
        h("p", { class: "res-score" }, h("b", { text: `${spravne} / ${celkem}` }), h("span", { text: t("procvic.spravne") })),
        h("p", { class: "procvic-zbyva", "data-test": "procvic-zbyva", text: zbyva > 0 ? t("procvic.zbyva", { n: zbyva }) : t("procvic.vseHotovo") }),
        zbyva > 0
          ? h("button", { type: "button", class: "btn btn-primary btn-big", "data-test": "procvic-znovu", onclick: () => app.prekresli(), text: t("procvic.dalsiKolo") })
          : null,
        h("a", { class: "btn btn-sec btn-big", href: "#/historie", text: t("procvic.zpet") })));
    },
  });
  const el = h("main", { class: "screen screen-hra screen-procvic" },
    lista({ zpet: "#/historie", nadpis: t("procvic.nadpis") }),
    ...sada.casti);
  // klic: „Procvičit další“ volá prekresli → nové kolo; jiný klíč = nová obrazovka (posun nahoru, bez zachování fokusu)
  return { el, titulek: t("procvic.nadpis"), klic: String(Math.random()), uklid: sada.uklid };
}
