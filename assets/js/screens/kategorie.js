// 3. Kategorie – mřížka barevných dlaždic s ikonou, názvem, počtem témat a hvězdami.
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdyText, ikonaKategorie } from "../ui.js";
import { viditelneKategorie, viditelnaTemata, txt } from "../data.js";
import { hvezdyKategorie } from "../progress.js";

export const ID = "kategorie";
const BARVY = 5; // počet barevných stylů dlaždic v CSS (.tile-0 … .tile-4)

export function vykresli() {
  const kats = viditelneKategorie();
  const dlazdice = kats.map((k, i) => {
    const hv = hvezdyKategorie(k);
    const n = viditelnaTemata(k).length;
    return h(
      "a",
      { class: `tile tile-${i % BARVY}`, href: `#/kategorie/${k.id}`, "data-kategorie": k.id },
      ikonaKategorie(k),
      h("span", { class: "tile-name", text: txt(k.nazev, jazyk()) }),
      h("span", { class: "tile-meta" },
        h("span", { text: t("kategorie.temat", { n }) }),
        h("span", { class: "tile-stars", text: hvezdyText(hv.pul, hv.max) }))
    );
  });
  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/", nadpis: t("kategorie.nadpis") }),
    h("div", { class: "tiles" }, dlazdice)
  );
  return { el, titulek: t("kategorie.nadpis") };
}
