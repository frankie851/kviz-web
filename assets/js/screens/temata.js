// 4. Témata v kategorii – karty témat, u každé tři malé ukazatele hvězd (Lehká / Střední / Těžká).
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdicky, hvezdyText, ikonaKategorie } from "../ui.js";
import { kategorie, viditelnaTemata, viditelneObtiznosti, txt } from "../data.js";
import { pulV, stav, hvezdyTematu } from "../progress.js";

export const ID = "temata";

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
      { class: "card topic", href: `#/tema/${tema.id}`, "data-tema": tema.id },
      h("span", { class: "topic-head" },
        h("span", { class: "topic-name", text: txt(tema.nazev, jazyk()) }),
        h("span", { class: "topic-sum", text: hvezdyText(hv.pul, hv.max) })),
      h("span", { class: "minis" }, ukazatele)
    );
  });

  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/", nadpis: txt(kat.nazev, jazyk()) }),
    h("p", { class: "lead lead-center lead-ikona" }, ikonaKategorie(kat, "lead-ico"), h("span", { text: t("temata.vyberTema") })),
    h("div", { class: "cards" }, karty)
  );
  return { el, titulek: txt(kat.nazev, jazyk()) };
}
