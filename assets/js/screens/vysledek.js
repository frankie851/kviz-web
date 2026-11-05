// 7. Výsledek kola – skóre, 0–5 hvězd (po půlkách), odemčení, nové odznaky.
// Tlačítka: Další obtížnost (když se odemkla) / Prohlédnout odpovědi / Zpět na témata. Kolo se neopakuje (D-013).
import { t, jazyk } from "../i18n.js";
import { h, hvezdicky } from "../ui.js";
import { najdiTema, txt } from "../data.js";
import { nacti } from "../storage.js";
import { odznak } from "../badges.js";

export const ID = "vysledek";

function hodnoceni(pul) {
  if (pul >= 10) return 3;
  if (pul >= 7) return 2;
  if (pul >= 4) return 1;
  return 0;
}

export function vykresli() {
  const v = nacti("posledni", null);
  const info = v && najdiTema(v.temaId);
  if (!info || typeof v.pul !== "number") return { presmeruj: "#/" };
  const { tema, kategorie } = info;

  const nove = (v.noveOdznaky || []).map(odznak).filter(Boolean);
  const procento = Math.floor((v.spravne / v.celkem) * 100);
  const dalsiNazev = v.dalsi ? t(`obtiznost.${v.dalsi}`) : "";
  const odemceno = v.dalsi && v.dalsiStav === "otevreno";

  const el = h(
    "main",
    { class: `screen screen-vysledek pul-${v.pul}` },
    h("p", { class: "res-topic", text: `${txt(tema.nazev, jazyk())} · ${t(`obtiznost.${v.obt}`)}` }),
    h("h1", { class: "res-title", text: t(`vysledek.hodnoceni.${hodnoceni(v.pul)}`) }),
    hvezdicky(v.pul, 5, "stars stars-big"),
    h("p", { class: "res-score", "data-test": "skore" },
      h("b", { text: `${v.spravne} / ${v.celkem}` }),
      h("span", { text: t("vysledek.spravne", { p: procento }) })),
    odemceno
      ? h("p", { class: "badge-line badge-unlock", "data-test": "odemceno" },
          h("span", { "aria-hidden": "true", text: "🔓 " }), t("vysledek.odemceno", { obtiznost: dalsiNazev }))
      : null,
    v.dalsi && v.dalsiStav === "natrvalo"
      ? h("p", { class: "badge-line badge-locked", "data-test": "natrvalo" },
          h("span", { "aria-hidden": "true", text: "⛔ " }), t("vysledek.natrvalo", { obtiznost: dalsiNazev }))
      : null,
    !v.dalsi ? h("p", { class: "hint", text: t("vysledek.temaHotovo") }) : null,
    nove.length
      ? h("section", { class: "new-badges", "data-test": "nove-odznaky" },
          h("h2", { text: t("vysledek.noveOdznaky", { n: nove.length }) }),
          h("ul", {}, nove.map((o) =>
            h("li", { class: "new-badge" },
              h("span", { class: "nb-ico", "aria-hidden": "true", text: o.ikona }),
              h("span", { class: "nb-name", text: t(`odznak.${o.id}.nazev`) })))))
      : null,
    h("div", { class: "res-btns" },
      odemceno
        ? h("a", { class: "btn btn-primary btn-big", href: `#/hra/${tema.id}/${v.dalsi}`, "data-test": "dalsi-obtiznost" },
            t("vysledek.dalsiObtiznost", { obtiznost: dalsiNazev }))
        : null,
      h("a", { class: `btn ${odemceno ? "btn-sec" : "btn-primary"} btn-big`, href: `#/prehled/${tema.id}/${v.obt}`, "data-test": "prehled" },
        h("span", { "aria-hidden": "true", text: "📖 " }), t("vysledek.prehled")),
      h("a", { class: "btn btn-sec btn-big", href: `#/kategorie/${kategorie.id}`, "data-test": "zpet-temata" }, t("vysledek.zpetTemata")))
  );
  return { el, titulek: t("vysledek.titulek") };
}
