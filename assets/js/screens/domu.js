// 2. Domů – logo, Hrát, hvězdy celkem, série dní (nahoře), úspěšnost v %, Odznaky a Nastavení.
import { t } from "../i18n.js";
import { h, logo, wordmark, cislo } from "../ui.js";
import { hvezdyCelkem, serieDni, pokrok, uspesnost } from "../progress.js";
import { ODZNAKY } from "../badges.js";
import { ukladaniFunguje } from "../storage.js";

export const ID = "domu";

export function vykresli() {
  const hv = hvezdyCelkem();
  const dny = serieDni();
  const usp = uspesnost(); // série dní je jen v pilulce nahoře, dlaždice ukazuje úspěšnost (D-018)
  const odz = Object.keys(pokrok().odznaky).filter((id) => ODZNAKY.some((o) => o.id === id)).length;

  const stat = (hodnota, popis, test) =>
    h("div", { class: "stat", "data-test": test }, h("b", { text: hodnota }), h("span", { text: popis }));

  const el = h(
    "main",
    { class: "screen screen-domu" },
    h(
      "div",
      { class: "toprow" },
      h("span", { class: "pill", "data-test": "serie-dni", title: t("domu.serieDniTitulek") },
        h("span", { "aria-hidden": "true", text: "🔥" }), t("domu.dni", { n: dny })),
      h("a", { class: "iconbtn", href: "#/nastaveni", "aria-label": t("nastaveni.nadpis") }, h("span", { "aria-hidden": "true", text: "⚙️" }))
    ),
    h(
      "div",
      { class: "hero" },
      logo("logo logo-hero"),
      h("h1", { class: "hero-title" }, wordmark("word word-hero")),
      h("p", { class: "tagline", text: t("app.podtitul") })
    ),
    h(
      "div",
      { class: "stats" },
      stat(`${cislo(hv.pul / 2)} / ${cislo(hv.max / 2)}`, t("domu.hvezd"), "hvezdy-celkem"),
      stat(usp == null ? "–" : t("domu.procent", { n: usp }), t("domu.uspesnost"), "uspesnost"),
      stat(`${odz} / ${ODZNAKY.length}`, t("domu.odznaku"), "odznaky")
    ),
    h("a", { class: "btn btn-primary btn-cta", href: "#/kategorie", "data-test": "hrat" },
      h("span", { text: t("domu.hrat") }), h("span", { class: "cta-ico", "aria-hidden": "true", text: "▶" })),
    h(
      "div",
      { class: "row2" },
      h("a", { class: "btn btn-sec", href: "#/odznaky" }, h("span", { "aria-hidden": "true", text: "🏅" }), t("odznaky.nadpis")),
      h("a", { class: "btn btn-sec", href: "#/historie", "data-test": "historie" }, h("span", { "aria-hidden": "true", text: "📖" }), t("historie.nadpis"))
    ),
    ukladaniFunguje() ? null : h("p", { class: "notice", role: "status", text: t("domu.bezUkladani") })
  );
  return { el, bezFokusu: true };
}
