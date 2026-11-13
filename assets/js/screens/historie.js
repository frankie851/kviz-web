// Historie – všechna dohraná kola (nejnovější nahoře); každé vede na přehled odpovědí (D-013).
// Nahoře tlačítko Procvičit chyby s počtem chybně zodpovězených otázek (D-031).
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdicky, ikonaKategorie } from "../ui.js";
import { najdiTema, txt } from "../data.js";
import { pokrok, chybneOtazky, sbirka } from "../progress.js";

export const ID = "historie";

export async function vykresli() {
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
        h("a", { class: "btn btn-primary btn-big", href: "#/", text: t("statistiky.hrat") }));

  const chyb = polozky.length || Object.keys(pokrok().rozehrano || {}).length ? (await chybneOtazky()).length : 0;
  const procvic = !polozky.length && !chyb ? null : chyb
    ? h("a", { class: "card procvic-btn", href: "#/procvicovani", "data-test": "procvicit" },
        h("span", { class: "procvic-btn-ico", "aria-hidden": "true", text: "🎯" }),
        h("span", { class: "procvic-btn-body" },
          h("span", { class: "procvic-btn-name", text: t("procvic.tlacitko") }),
          h("span", { class: "procvic-btn-meta", text: t("procvic.pocet", { n: chyb }) })),
        h("span", { class: "pokracuj-go", "aria-hidden": "true", text: "▶" }))
    : h("p", { class: "procvic-nic", "data-test": "procvicit-nic", text: t("procvic.zadne") });

  const vSbirce = sbirka().length; // ⭐ Moje sbírka (D-035)
  const sbirkaKarta = vSbirce
    ? h("a", { class: "card procvic-btn sbirka-btn", href: "#/sbirka", "data-test": "sbirka" },
        h("span", { class: "procvic-btn-ico", "aria-hidden": "true", text: "⭐" }),
        h("span", { class: "procvic-btn-body" },
          h("span", { class: "procvic-btn-name", text: t("sbirka.nadpis") }),
          h("span", { class: "procvic-btn-meta", text: t("sbirka.pocet", { n: vSbirce }) })),
        h("span", { class: "hist-go", "aria-hidden": "true", text: "→" }))
    : polozky.length ? h("p", { class: "procvic-nic", "data-test": "sbirka-tip", text: t("sbirka.tip") }) : null;

  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/", nadpis: t("historie.nadpis") }),
    procvic,
    sbirkaKarta,
    polozky.length ? h("p", { class: "lead lead-center", text: t("historie.popis") }) : null,
    obsah
  );
  return { el, titulek: t("historie.nadpis") };
}
