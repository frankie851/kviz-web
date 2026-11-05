// 5. Obtížnost – tři velká tlačítka, zámky, nejlepší výsledek.
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdicky } from "../ui.js";
import { najdiTema, viditelneObtiznosti, txt } from "../data.js";
import { nejlepsi, jeOdemceno } from "../progress.js";

export const ID = "obtiznost";

export function vykresli([temaId]) {
  const info = najdiTema(temaId);
  if (!info) return { presmeruj: "#/kategorie" };
  const { tema, kategorie } = info;
  const vid = viditelneObtiznosti(tema);

  const tlacitka = vid.map((o, i) => {
    const otevreno = jeOdemceno(tema, o);
    const nej = nejlepsi(tema.id, o);
    const popis = otevreno
      ? nej
        ? t("obtiznost.nejlepe", { s: nej.s, c: nej.c })
        : t("obtiznost.nehrano")
      : t("obtiznost.odemkne", { predchozi: t(`obtiznost.lokal.${vid[i - 1]}`) });
    const obsah = [
      h("span", { class: "diff-ico", "aria-hidden": "true", text: otevreno ? ["🌱", "🌿", "🌳"][Number(o) - 1] || "⭐" : "🔒" }),
      h("span", { class: "diff-body" },
        h("span", { class: "diff-name", text: t(`obtiznost.${o}`) }),
        h("span", { class: "diff-desc", text: popis })),
      otevreno ? hvezdicky(nej?.h || 0, 3, "stars stars-diff") : null,
    ];
    return otevreno
      ? h("a", { class: `diff diff-${o}`, href: `#/hra/${tema.id}/${o}`, "data-obtiznost": o }, obsah)
      : h("div", { class: `diff diff-${o} locked`, "aria-disabled": "true", "data-obtiznost": o }, obsah);
  });

  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: `#/kategorie/${kategorie.id}`, nadpis: txt(tema.nazev, jazyk()) }),
    h("p", { class: "lead lead-center", text: t("obtiznost.vyber") }),
    h("div", { class: "diffs" }, tlacitka)
  );
  return { el, titulek: txt(tema.nazev, jazyk()) };
}
