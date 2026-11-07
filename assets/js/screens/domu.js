// 2. Domů (D-021, varianta C): malé záhlaví, „Co si dnes zahraješ?“, pruh se sérií dní, hvězdami,
// úspěšností a odznaky, dlaždice kategorií (víc než MAX_DLAZDIC → tlačítko Všechny kategorie),
// pod nimi Odznaky, Historie a Statistiky.
import { t } from "../i18n.js";
import { h, logo, wordmark, celeHvezdy } from "../ui.js";
import { hvezdyCelkem, serieDni, pokrok, uspesnost } from "../progress.js";
import { viditelneKategorie } from "../data.js";
import { ODZNAKY } from "../badges.js";
import { ukladaniFunguje } from "../storage.js";
import { dlazdiceKategorie } from "./kategorie.js";

export const ID = "domu";
const MAX_DLAZDIC = 6; // víc kategorií = prvních 6 (3 plné řady) + široké „Všechny kategorie (n)“ – Domů se neprodlužuje donekonečna

export function vykresli() {
  const hv = hvezdyCelkem();
  const dny = serieDni();
  const usp = uspesnost();
  const odz = Object.keys(pokrok().odznaky).filter((id) => ODZNAKY.some((o) => o.id === id)).length;
  const kats = viditelneKategorie();

  const udaj = (ikona, hodnota, popis, test) =>
    h("span", { class: "strip-item", "data-test": test, title: popis },
      h("span", { "aria-hidden": "true", text: ikona }), h("b", { text: hodnota }), h("span", { class: "sr-only", text: ` ${popis}` }));

  const dlazdice = kats.slice(0, MAX_DLAZDIC).map(dlazdiceKategorie);
  if (kats.length > MAX_DLAZDIC) {
    dlazdice.push(h("a", { class: "tile tile-vse", href: "#/kategorie", "data-test": "vsechny-kategorie" },
      h("span", { class: "tile-emo", "aria-hidden": "true", text: "🗂️" }),
      h("span", { class: "tile-name", text: t("domu.vsechnyKategorie", { n: kats.length }) }),
      h("span", { class: "tile-meta" }, h("span", { text: "→" }))));
  }

  const el = h(
    "main",
    { class: "screen screen-domu", "data-test": "domu" },
    h("header", { class: "home-head" },
      logo("logo logo-head"),
      h("span", { class: "home-word" }, wordmark("word word-head")),
      h("a", { class: "iconbtn", href: "#/nastaveni", "aria-label": t("nastaveni.nadpis") }, h("span", { "aria-hidden": "true", text: "⚙️" }))),
    h("div", { class: "home-hello" },
      h("h1", { class: "home-title", text: t("domu.otazka") }),
      h("p", { class: "tagline", text: t("app.podtitul") })),
    h("div", { class: "strip" },
      udaj("🔥", t("domu.dni", { n: dny }), t("domu.serieDniTitulek"), "serie-dni"),
      udaj("★", `${celeHvezdy(hv.pul)} / ${celeHvezdy(hv.max)}`, t("domu.hvezd"), "hvezdy-celkem"),
      udaj("🎯", usp == null ? "–" : t("domu.procent", { n: usp }), t("domu.uspesnost"), "uspesnost"),
      udaj("🏅", `${odz} / ${ODZNAKY.length}`, t("domu.odznaku"), "odznaky")),
    h("div", { class: "tiles tiles-home", "data-test": "kategorie-domu" }, dlazdice),
    h(
      "nav",
      { class: "row3" },
      h("a", { class: "btn btn-sec btn-tile", href: "#/odznaky" }, h("span", { "aria-hidden": "true", text: "🏅" }), t("odznaky.nadpis")),
      h("a", { class: "btn btn-sec btn-tile", href: "#/historie", "data-test": "historie" }, h("span", { "aria-hidden": "true", text: "📖" }), t("historie.nadpis")),
      h("a", { class: "btn btn-sec btn-tile", href: "#/statistiky", "data-test": "statistiky" }, h("span", { "aria-hidden": "true", text: "📊" }), t("statistiky.nadpis"))
    ),
    ukladaniFunguje() ? null : h("p", { class: "notice", role: "status", text: t("domu.bezUkladani") })
  );
  return { el, bezFokusu: true };
}
