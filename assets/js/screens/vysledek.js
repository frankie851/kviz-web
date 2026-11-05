// 7. Výsledek kola – skóre, hvězdy, odemčení, nové odznaky, Znovu / Další obtížnost / Zpět na témata.
import { t, jazyk } from "../i18n.js";
import { h, hvezdicky } from "../ui.js";
import { najdiTema, txt } from "../data.js";
import { nacti } from "../storage.js";
import { odznak } from "../badges.js";

export const ID = "vysledek";

export function vykresli() {
  const v = nacti("posledni", null);
  const info = v && najdiTema(v.temaId);
  if (!info) return { presmeruj: "#/" };
  const { tema, kategorie } = info;

  const nove = (v.noveOdznaky || []).map(odznak).filter(Boolean);
  const procento = Math.floor((v.spravne / v.celkem) * 100);

  const el = h(
    "main",
    { class: `screen screen-vysledek stars-${v.hvezdy}` },
    h("p", { class: "res-topic", text: `${txt(tema.nazev, jazyk())} · ${t(`obtiznost.${v.obt}`)}` }),
    h("h1", { class: "res-title", text: t(`vysledek.hodnoceni.${v.hvezdy}`) }),
    hvezdicky(v.hvezdy, 3, "stars stars-big"),
    h("p", { class: "res-score", "data-test": "skore" },
      h("b", { text: `${v.spravne} / ${v.celkem}` }),
      h("span", { text: t("vysledek.spravne", { p: procento }) })),
    v.rekord ? h("p", { class: "badge-line badge-record", text: `🏆 ${t("vysledek.rekord")}` }) : null,
    v.odemcenoNove
      ? h("p", { class: "badge-line badge-unlock", "data-test": "odemceno" },
          h("span", { "aria-hidden": "true", text: "🔓 " }), t("vysledek.odemceno", { obtiznost: t(`obtiznost.${v.odemcenoNove}`) }))
      : null,
    !v.dalsiOdemcena && v.dalsi
      ? h("p", { class: "hint", text: t("vysledek.proDalsi", { obtiznost: t(`obtiznost.${v.dalsi}`) }) })
      : null,
    nove.length
      ? h("section", { class: "new-badges", "data-test": "nove-odznaky" },
          h("h2", { text: t("vysledek.noveOdznaky", { n: nove.length }) }),
          h("ul", {}, nove.map((o) =>
            h("li", { class: "new-badge" },
              h("span", { class: "nb-ico", "aria-hidden": "true", text: o.ikona }),
              h("span", { class: "nb-name", text: t(`odznak.${o.id}.nazev`) })))))
      : null,
    h("div", { class: "res-btns" },
      v.dalsi && v.dalsiOdemcena
        ? h("a", { class: "btn btn-primary btn-big", href: `#/hra/${tema.id}/${v.dalsi}`, "data-test": "dalsi-obtiznost" },
            t("vysledek.dalsiObtiznost", { obtiznost: t(`obtiznost.${v.dalsi}`) }))
        : null,
      h("a", { class: `btn ${v.dalsi && v.dalsiOdemcena ? "btn-sec" : "btn-primary"} btn-big`, href: `#/hra/${tema.id}/${v.obt}`, "data-test": "znovu" },
        h("span", { "aria-hidden": "true", text: "↻ " }), t("vysledek.znovu")),
      h("a", { class: "btn btn-sec btn-big", href: `#/kategorie/${kategorie.id}`, "data-test": "zpet-temata" }, t("vysledek.zpetTemata")))
  );
  return { el, titulek: t("vysledek.titulek") };
}
