// 9. Nastavení – jazyky, překlad, zvuky, vibrace, O hře. (Smazat pokrok zrušeno – D-013: každé kolo se hraje jen jednou.)
import { t, nastavJazyk, JAZYKY_ROZHRANI } from "../i18n.js";
import { h, lista, prepinac, vypinac, potvrdit } from "../ui.js";
import { nast, zmen, jazykPrekladu, PREKLAD, VZHLED, PISMO, aplikujVzhled, CASTI_DOMU, ukazNaDomu } from "../settings.js";
import { idx } from "../data.js";
import { ukladaniFunguje, vsechnaData, nahradData } from "../storage.js";
import { lzePredcitat, mluv, PREDCITANI } from "../predcitani.js";
import { kratkeOznameni } from "../oslavy.js";
import { dnes } from "../game.js";
import { ukazPruvodce } from "../pruvodce.js";
import { zvuk, vibrace } from "../feedback.js";

export const ID = "nastaveni";
const APLIKACE = "oho-kviz"; // podpis souboru s pokrokem (D-033)

/** Uloží všechna data hry do souboru .json (stáhne se do zařízení). */
function ulozDoSouboru() {
  const obsah = { aplikace: APLIKACE, verze: 1, ulozeno: new Date().toISOString(), data: vsechnaData() };
  const blob = new Blob([JSON.stringify(obsah, null, 1)], { type: "application/json" });
  const odkaz = h("a", { href: URL.createObjectURL(blob), download: `oho-pokrok-${dnes()}.json`, hidden: true });
  document.body.append(odkaz);
  odkaz.click();
  setTimeout(() => { URL.revokeObjectURL(odkaz.href); odkaz.remove(); }, 1000);
  kratkeOznameni(t("prenos.ulozeno"));
}

/** Načte soubor s pokrokem, po potvrzení nahradí data v tomto zařízení a stránku načte znovu. */
async function nahrajZeSouboru(soubor) {
  let obsah = null;
  try {
    obsah = JSON.parse(await soubor.text());
  } catch { obsah = null; }
  const data = obsah?.aplikace === APLIKACE && obsah.data && typeof obsah.data === "object" ? obsah.data : null;
  if (!data || (data.pokrok && data.pokrok.verze !== 2)) {
    kratkeOznameni(t("prenos.chyba"));
    return;
  }
  const kol = Object.values(data.pokrok?.vysledky || {}).reduce((n, o) => n + Object.keys(o || {}).length, 0);
  const datum = obsah.ulozeno ? new Date(obsah.ulozeno).toLocaleDateString(nast().ui === "cs" ? "cs-CZ" : "en-GB") : "?";
  const ano = await potvrdit({
    nadpis: t("prenos.potvrditNadpis"),
    text: t("prenos.potvrditText", { datum, n: kol }),
    ano: t("prenos.potvrditAno"),
    ne: t("prenos.potvrditNe"),
  });
  if (!ano) return;
  if (!nahradData(data)) {
    kratkeOznameni(t("prenos.chyba"));
    return;
  }
  location.hash = "#/";
  location.reload(); // moduly si pokrok a nastavení načtou znovu
}

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
      h("p", { class: "field-hint", text: t("nastaveni.prekladNapoveda") }),
      lzePredcitat()
        ? prepinac({
            id: "nast-predcitani",
            popis: t("nastaveni.predcitani"),
            volby: [
              { hodnota: PREDCITANI.VYPNUTO, text: t("nastaveni.predcitaniVypnuto") },
              { hodnota: PREDCITANI.TLACITKO, text: t("nastaveni.predcitaniTlacitko") },
              { hodnota: PREDCITANI.AUTO, text: t("nastaveni.predcitaniAuto") },
            ],
            hodnota: s.predcitani,
            zmena: (v) => { zmen({ predcitani: v }); if (v !== PREDCITANI.VYPNUTO) mluv(t("nastaveni.predcitaniUkazka"), s.ui); },
          })
        : null),
    h("section", { class: "card settings" },
      h("h2", { class: "settings-h", text: t("nastaveni.zvukyVibrace") }),
      vypinac({ id: "nast-zvuky", popis: t("nastaveni.zvuky"), zapnuto: s.zvuky, zmena: (v) => { zmen({ zvuky: v }); if (v) zvuk("ukazka"); } }),
      vypinac({ id: "nast-vibrace", popis: t("nastaveni.vibrace"), zapnuto: s.vibrace, zmena: (v) => { zmen({ vibrace: v }); if (v) vibrace("ukazka"); } })),
    h("section", { class: "card settings" },
      h("h2", { class: "settings-h", text: t("nastaveni.vzhled") }),
      prepinac({
        id: "nast-vzhled",
        popis: t("nastaveni.rezim"),
        volby: [
          { hodnota: VZHLED.AUTO, text: t("nastaveni.rezimAuto") },
          { hodnota: VZHLED.SVETLY, text: t("nastaveni.rezimSvetly") },
          { hodnota: VZHLED.TMAVY, text: t("nastaveni.rezimTmavy") },
        ],
        hodnota: s.vzhled,
        zmena: (v) => aplikujVzhled(zmen({ vzhled: v })),
      }),
      prepinac({
        id: "nast-pismo",
        popis: t("nastaveni.pismo"),
        volby: [
          { hodnota: PISMO.NORMALNI, text: t("nastaveni.pismoNormalni") },
          { hodnota: PISMO.VETSI, text: t("nastaveni.pismoVetsi") },
          { hodnota: PISMO.NEJVETSI, text: t("nastaveni.pismoNejvetsi") },
        ],
        hodnota: s.pismo,
        zmena: (v) => aplikujVzhled(zmen({ pismo: v })),
      })),
    h("section", { class: "card settings" },
      h("h2", { class: "settings-h", text: t("tyden.nastaveniNadpis") }),
      prepinac({
        id: "nast-tyden",
        popis: t("tyden.nastaveniPopis"),
        volby: [3, 5, 10].map((n) => ({ hodnota: n, text: t("tyden.kol", { n }) })),
        hodnota: s.tydenniCil,
        zmena: (n) => zmen({ tydenniCil: Number(n) }),
      })),
    h("section", { class: "card settings", "data-test": "nast-domu" },
      h("h2", { class: "settings-h", text: t("domuNastaveni.nadpis") }),
      h("p", { class: "field-hint", text: t("domuNastaveni.popis") }),
      CASTI_DOMU.map((cast) => vypinac({
        id: `nast-domu-${cast}`,
        popis: t(`domuNastaveni.${cast}`),
        zapnuto: ukazNaDomu(cast),
        zmena: (v) => zmen({ domu: { ...(nast().domu || {}), [cast]: v } }),
      }))),
    h("section", { class: "card settings", "data-test": "prenos" },
      h("h2", { class: "settings-h", text: t("prenos.nadpis") }),
      h("p", { class: "field-hint", text: t("prenos.popis") }),
      h("div", { class: "prenos-btns" },
        h("button", { type: "button", class: "btn btn-sec btn-big", "data-test": "prenos-ulozit", onclick: ulozDoSouboru },
          h("span", { "aria-hidden": "true", text: "💾 " }), t("prenos.ulozit")),
        (() => {
          const vstup = h("input", { type: "file", accept: "application/json,.json", hidden: true, "data-test": "prenos-soubor",
            onchange: () => { if (vstup.files?.[0]) nahrajZeSouboru(vstup.files[0]); vstup.value = ""; } });
          return h("label", { class: "btn btn-sec btn-big", "data-test": "prenos-nahrat", tabindex: "0", role: "button",
            onkeydown: (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); vstup.click(); } } },
            h("span", { "aria-hidden": "true", text: "📂 " }), t("prenos.nahrat"), vstup);
        })())),
    h("section", { class: "card settings about" },
      h("h2", { class: "settings-h", text: t("nastaveni.oHre") }),
      h("p", { text: t("nastaveni.oHrePravidla") }),
      h("button", { type: "button", class: "btn btn-sec btn-big", "data-test": "pruvodce-otevrit", onclick: () => ukazPruvodce() },
        h("span", { "aria-hidden": "true", text: "❓ " }), t("pruvodce.otevrit")),
      h("p", { text: t("nastaveni.oHreSoukromi") }),
      ukladaniFunguje() ? null : h("p", { class: "notice", text: t("domu.bezUkladani") }),
      h("p", { class: "muted", text: t("nastaveni.oHreData", { n: idx().pocet_otazek || 0, datum }) }))
  );
  return { el, titulek: t("nastaveni.nadpis") };
}
