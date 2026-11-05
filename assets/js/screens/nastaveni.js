// 9. Nastavení – jazyky, překlad, zvuky, vibrace, O hře, Smazat pokrok.
import { t, nastavJazyk, JAZYKY_ROZHRANI } from "../i18n.js";
import { h, lista, prepinac, vypinac, potvrd } from "../ui.js";
import { nast, zmen, jazykPrekladu, PREKLAD } from "../settings.js";
import { smazatPokrok } from "../progress.js";
import { idx } from "../data.js";
import { ukladaniFunguje } from "../storage.js";

export const ID = "nastaveni";

export function vykresli(_param, app) {
  const s = nast();
  const jazykyOtazek = idx().jazyky?.length ? idx().jazyky : JAZYKY_ROZHRANI;
  const volbyJazyka = (seznam) => seznam.map((j) => ({ hodnota: j, text: t(`jazyky.${j}.vlastni`) }));
  const prekreslit = () => app.prekresli();

  const exportovano = idx().exportovano ? new Date(idx().exportovano) : null;
  const datum = exportovano && !isNaN(exportovano)
    ? exportovano.toLocaleDateString(s.ui === "cs" ? "cs-CZ" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const el = h(
    "main",
    { class: "screen screen-nastaveni" },
    lista({ zpet: "#/", nadpis: t("nastaveni.nadpis") }),
    h("section", { class: "card settings" },
      h("h2", { class: "settings-h", text: t("nastaveni.jazyky") }),
      prepinac({
        id: "nast-ui",
        popis: t("nastaveni.mujJazyk"),
        volby: volbyJazyka(JAZYKY_ROZHRANI),
        hodnota: s.ui,
        zmena: (j) => {
          zmen({ ui: j });
          nastavJazyk(j);
          prekreslit();
        },
      }),
      prepinac({
        id: "nast-otazky",
        popis: t("nastaveni.jazykOtazek"),
        volby: volbyJazyka(jazykyOtazek),
        hodnota: s.otazky,
        zmena: (j) => {
          zmen({ otazky: j });
          prekreslit();
        },
      }),
      prepinac({
        id: "nast-preklad",
        popis: t("nastaveni.preklad", { jazyk: t(`jazyky.${jazykPrekladu(s, jazykyOtazek)}.vlastni`) }),
        volby: [
          { hodnota: PREKLAD.VZDY, text: t("nastaveni.prekladVzdy") },
          { hodnota: PREKLAD.TUKNUTI, text: t("nastaveni.prekladTuknuti") },
          { hodnota: PREKLAD.VYPNUTO, text: t("nastaveni.prekladVypnuto") },
        ],
        hodnota: s.preklad,
        zmena: (r) => zmen({ preklad: r }),
      }),
      h("p", { class: "field-hint", text: t("nastaveni.prekladNapoveda") })),
    h("section", { class: "card settings" },
      h("h2", { class: "settings-h", text: t("nastaveni.zvukyVibrace") }),
      vypinac({ id: "nast-zvuky", popis: t("nastaveni.zvuky"), zapnuto: s.zvuky, zmena: (v) => zmen({ zvuky: v }) }),
      vypinac({ id: "nast-vibrace", popis: t("nastaveni.vibrace"), zapnuto: s.vibrace, zmena: (v) => zmen({ vibrace: v }) })),
    h("section", { class: "card settings about" },
      h("h2", { class: "settings-h", text: t("nastaveni.oHre") }),
      h("p", { text: t("nastaveni.oHreOtazky") }),
      h("p", { text: t("nastaveni.oHreSoukromi") }),
      ukladaniFunguje() ? null : h("p", { class: "notice", text: t("domu.bezUkladani") }),
      h("p", { class: "muted", text: t("nastaveni.oHreData", { n: idx().pocet_otazek || 0, datum }) })),
    h("section", { class: "card settings danger-zone" },
      h("button", {
        type: "button",
        class: "btn btn-danger-outline",
        "data-test": "smazat",
        text: t("nastaveni.smazat"),
        onclick: async () => {
          const ano = await potvrd({
            nadpis: t("nastaveni.smazatNadpis"),
            text: t("nastaveni.smazatText"),
            ano: t("nastaveni.smazatAno"),
            ne: t("nastaveni.smazatNe"),
            nebezpecne: true,
          });
          if (ano) {
            smazatPokrok();
            app.jdi("#/", { nahradit: true });
          }
        },
      }))
  );
  return { el, titulek: t("nastaveni.nadpis"), bezFokusu: false };
}
