// Nová témata (D-035) – témata, která přibyla od hráčovy poslední návštěvy a ještě je neotevřel.
import { t } from "../i18n.js";
import { h, lista } from "../ui.js";
import { novaTemata } from "../progress.js";
import { kartaTematu } from "./kategorie.js";

export const ID = "nova";

export function vykresli() {
  const nova = novaTemata();
  const el = h("main", { class: "screen" },
    lista({ zpet: "#/", nadpis: t("nova.nadpis") }),
    nova.length
      ? h("div", { class: "cards", "data-test": "nova-seznam" }, nova.map(({ kat, tema }) => kartaTematu(kat, tema)))
      : h("div", { class: "empty" }, h("p", { text: t("nova.zadna") }), h("a", { class: "btn btn-primary btn-big", href: "#/", text: t("vyzva.domu") })));
  return { el, titulek: t("nova.nadpis") };
}
