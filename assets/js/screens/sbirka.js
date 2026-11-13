// Moje sbírka (D-035) – otázky uložené hvězdičkou ☆: otázka, správná odpověď a vysvětlení (překlad podle
// nastavení), nejnovější nahoře; „Odebrat ze sbírky“. Otázky, které už na webu nejsou, se vynechají.
import { t, jazyk } from "../i18n.js";
import { h, lista, ikonaKategorie } from "../ui.js";
import { idx, najdiTema, nactiTema, txt } from "../data.js";
import { sbirka, prepniSbirku } from "../progress.js";
import { nast, jazykPrekladu, PREKLAD } from "../settings.js";
import { tlacitkoPredcitani } from "../predcitani.js";

export const ID = "sbirka";

export async function vykresli() {
  const s = nast();
  const jo = s.otazky;
  const jp = jazykPrekladu(s, idx().jazyky || undefined);
  const dvojice = (obj, trida) => {
    const wrap = h("span", { class: trida }, h("span", { class: "orig", lang: jo, text: txt(obj, jo) }));
    if (s.preklad !== PREKLAD.VYPNUTO && jp !== jo && obj?.[jp] && obj[jp] !== obj[jo]) wrap.append(h("span", { class: "tr", lang: jp, text: obj[jp] }));
    return wrap;
  };
  const polozky = [];
  for (const x of sbirka()) {
    const info = najdiTema(x.tema);
    if (!info) continue;
    try {
      const q = (await nactiTema(x.tema)).otazky.find((o) => o.id === x.id);
      if (q) polozky.push({ q, info });
    } catch { /* téma se nenačetlo */ }
  }
  const seznam = h("div", { class: "cards", "data-test": "sbirka-seznam" });
  const prazdne = h("div", { class: "empty", "data-test": "sbirka-prazdna", hidden: polozky.length > 0 }, h("p", { text: t("sbirka.prazdna") }));
  for (const { q, info } of polozky) {
    const karta = h("article", { class: "card review sbirka-karta", "data-qid": q.id },
      h("p", { class: "procvic-tema" }, ikonaKategorie(info.kategorie, "procvic-ico"),
        h("span", { text: `${txt(info.tema.nazev, jazyk())} · ${t(`obtiznost.${q.obtiznost}`)}` })),
      h("h2", { class: "review-q" }, dvojice(q.otazka, "qtext")),
      h("p", { class: "sbirka-odpoved" }, h("span", { "aria-hidden": "true", text: "✓ " }), dvojice({ [jo]: q.moznosti[jo]?.[q.spravne], [jp]: q.moznosti[jp]?.[q.spravne] }, "ans-t")),
      h("div", { class: "explain explain-review" }, h("p", { class: "dyk", text: t("hra.vedeliJste") }), h("p", {}, dvojice(q.vysvetleni, "explain-t")),
        tlacitkoPredcitani(() => q.vysvetleni?.[jo] || "", jo)),
      h("button", { type: "button", class: "btn btn-sec sbirka-odebrat", "data-test": "sbirka-odebrat",
        onclick: () => { prepniSbirku(q.id, info.tema.id); karta.remove(); prazdne.hidden = seznam.children.length > 0; } },
        h("span", { "aria-hidden": "true", text: "★ " }), t("sbirka.odebrat")));
    seznam.append(karta);
  }
  const el = h("main", { class: "screen screen-sbirka" },
    lista({ zpet: "#/historie", nadpis: t("sbirka.nadpis") }),
    polozky.length ? h("p", { class: "lead lead-center", text: t("sbirka.popis") }) : null,
    seznam, prazdne);
  return { el, titulek: t("sbirka.nadpis") };
}
