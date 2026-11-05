// 4. Témata v kategorii – karty témat, u každé tři malé ukazatele hvězd (Lehká / Střední / Těžká).
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdicky } from "../ui.js";
import { kategorie, viditelnaTemata, viditelneObtiznosti, txt } from "../data.js";
import { hvezdyV, jeOdemceno, hvezdyTematu } from "../progress.js";

export const ID = "temata";

export function vykresli([katId]) {
  const kat = kategorie(katId);
  if (!kat) return { presmeruj: "#/kategorie" };

  const karty = viditelnaTemata(kat).map((tema) => {
    const hv = hvezdyTematu(tema);
    const ukazatele = viditelneObtiznosti(tema).map((o) =>
      h(
        "span",
        { class: "mini", "data-obtiznost": o },
        h("span", { class: "mini-label", text: t(`obtiznost.${o}`) }),
        jeOdemceno(tema, o)
          ? hvezdicky(hvezdyV(tema.id, o), 3, "stars stars-mini")
          : h("span", { class: "mini-lock", role: "img", "aria-label": t("obtiznost.zamceno"), text: "🔒" })
      )
    );
    return h(
      "a",
      { class: "card topic", href: `#/tema/${tema.id}`, "data-tema": tema.id },
      h("span", { class: "topic-head" },
        h("span", { class: "topic-name", text: txt(tema.nazev, jazyk()) }),
        h("span", { class: "topic-sum", text: `${hv.ziskano}/${hv.max} ★` })),
      h("span", { class: "minis" }, ukazatele)
    );
  });

  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/kategorie", nadpis: txt(kat.nazev, jazyk()) }),
    h("p", { class: "lead lead-center" }, h("span", { "aria-hidden": "true", text: `${kat.ikona} ` }), t("temata.vyberTema")),
    h("div", { class: "cards" }, karty)
  );
  return { el, titulek: txt(kat.nazev, jazyk()) };
}
