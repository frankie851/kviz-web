// Historie – všechna dohraná kola (nejnovější nahoře); každé vede na přehled odpovědí (D-013).
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdicky, ikonaKategorie } from "../ui.js";
import { najdiTema, txt } from "../data.js";
import { pokrok } from "../progress.js";

export const ID = "historie";

export function vykresli() {
  const polozky = [];
  for (const [temaId, obtiznosti] of Object.entries(pokrok().vysledky)) {
    const info = najdiTema(temaId);
    if (!info) continue; // téma už na webu není
    for (const [obt, v] of Object.entries(obtiznosti)) polozky.push({ info, obt, v });
  }
  polozky.sort((a, b) => String(b.v.datum).localeCompare(String(a.v.datum)) || a.info.tema.id.localeCompare(b.info.tema.id) || b.obt - a.obt);

  const obsah = polozky.length
    ? h("div", { class: "cards" }, polozky.map(({ info, obt, v }) =>
        h("a", { class: "card hist", href: `#/prehled/${info.tema.id}/${obt}`, "data-tema": info.tema.id, "data-obtiznost": obt },
          ikonaKategorie(info.kategorie, "hist-ico"),
          h("span", { class: "hist-body" },
            h("span", { class: "hist-name", text: txt(info.tema.nazev, jazyk()) }),
            h("span", { class: "hist-meta", text: `${t(`obtiznost.${obt}`)} · ${t("prehled.skore", { s: v.s, c: v.c })}` }),
            hvezdicky(v.pul, 5, "stars stars-mini")),
          h("span", { class: "hist-go", "aria-hidden": "true", text: "→" }))))
    : h("div", { class: "empty" },
        h("p", { text: t("historie.prazdna") }),
        h("a", { class: "btn btn-primary btn-big", href: "#/kategorie", text: t("domu.hrat") }));

  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/", nadpis: t("historie.nadpis") }),
    polozky.length ? h("p", { class: "lead lead-center", text: t("historie.popis") }) : null,
    obsah
  );
  return { el, titulek: t("historie.nadpis") };
}
