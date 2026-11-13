// 2. Domů (D-021, varianta C; D-026, D-027): malé záhlaví, „Co si dnes zahraješ?“, pruh se sérií dní,
// hvězdami, úspěšností a odznaky, karta „Pokračuj“, dlaždice kategorií (víc než MAX_DLAZDIC → tlačítko
// Všechny kategorie, kde je i hledání témat), pod nimi Odznaky, Historie a Statistiky.
import { t, jazyk } from "../i18n.js";
import { h, logo, wordmark, celeHvezdy, ikonaKategorie } from "../ui.js";
import { hvezdyCelkem, serieDni, pokrok, uspesnost, pokracovani, nahodneTema, vyzva, serieVyzev, urovenHrace, tydenniCil } from "../progress.js";
import { dnes, dniDoKonceTydne } from "../game.js";
import { OTAZEK as OTAZEK_VYZVY } from "../vyzva.js";
import { viditelneKategorie, txt } from "../data.js";
import { vsechnyOdznaky } from "../badges.js";
import { ukladaniFunguje } from "../storage.js";
import { dlazdiceKategorie } from "./kategorie.js";

export const ID = "domu";
const MAX_DLAZDIC = 6; // víc kategorií = prvních 6 (3 plné řady) + široké „Všechny kategorie (n)“ – Domů se neprodlužuje donekonečna

/** Karta „Pokračuj“: rozehrané kolo, nebo další otevřená obtížnost naposledy hraného tématu. */
function kartaPokracuj() {
  const k = pokracovani();
  if (!k) return null;
  const { info, obt } = k;
  const popis = k.rozehrane
    ? t("domu.pokracujRozehrane", { obtiznost: t(`obtiznost.${obt}`), i: k.i + 1, n: k.n })
    : t("domu.pokracujNova", { obtiznost: t(`obtiznost.${obt}`) });
  const pruh = k.rozehrane
    ? h("div", { class: "progress pokracuj-pruh" },
        h("i", { class: "p-ok", style: { width: `${k.spravne != null ? (k.spravne / k.n) * 100 : 0}%` } }),
        h("i", { class: k.spravne != null ? "p-bad" : "p-neutral", style: { width: `${(((k.spravne != null ? k.i - k.spravne : k.i)) / k.n) * 100}%` } }))
    : null;
  return h("a", { class: "card pokracuj", href: `#/hra/${info.tema.id}/${obt}`, "data-test": "pokracuj", "data-tema": info.tema.id, "data-obtiznost": obt },
    h("span", { class: "pokracuj-body" },
      h("span", { class: "label", text: t("domu.pokracuj") }),
      h("span", { class: "pokracuj-name", text: txt(info.tema.nazev, jazyk()) }),
      h("span", { class: "pokracuj-meta" }, ikonaKategorie(info.kategorie, "pokracuj-ico"), h("span", { text: popis })),
      pruh),
    h("span", { class: "pokracuj-go", "aria-hidden": "true", text: "▶" }));
}

/** Karta Úroveň a Týdenní cíl (D-034): vlevo úroveň s pruhem do další, vpravo kroužek kol za tento týden. */
function kartaPostupu() {
  const u = urovenHrace();
  const cil = tydenniCil();
  const podil = Math.round(((u.body - u.od) / (u.do - u.od)) * 100);
  const kruh = Math.round(Math.min(1, cil.hotovo / cil.cil) * 100);
  const pod = cil.splneno
    ? (cil.serie > 1 ? t("tyden.serie", { n: cil.serie }) : t("tyden.splneno"))
    : t("tyden.zbyva", { n: dniDoKonceTydne() });
  return h("section", { class: "card postup-karta", "data-test": "postup-karta" },
    h("div", { class: "uroven", "data-test": "uroven" },
      h("span", { class: "label", text: t("uroven.nadpis", { n: u.uroven }) }),
      h("span", { class: "uroven-titul", text: t(`uroven.titul.${u.titul}`) }),
      h("div", { class: "meter" }, h("i", { class: "m-ok", style: { width: `${podil}%` } })),
      h("span", { class: "uroven-body", text: t("uroven.body", { b: u.body, do: u.do, n: u.uroven + 1 }) })),
    h("div", { class: `tyden${cil.splneno ? " is-splneno" : ""}`, "data-test": "tyden" },
      h("div", { class: "tyden-kruh", style: `--p:${kruh}`, role: "img", "aria-label": t("tyden.aria", { h: cil.hotovo, c: cil.cil }) },
        h("b", { text: cil.splneno ? "✓" : `${cil.hotovo}/${cil.cil}` })),
      h("span", { class: "tyden-popis", text: t("tyden.nadpis") }),
      h("span", { class: "tyden-pod", text: pod })));
}

/** Karta Denní výzva (D-032): neodehraná / rozehraná / dnes hotová (se čtverečky a sérií). */
function kartaVyzvy() {
  const v = vyzva(dnes());
  const { serie } = serieVyzev();
  const hotovo = v?.hotovo;
  const popis = hotovo
    ? t("vyzva.domuHotovo", { s: v.spravne, n: v.ids.length })
    : v?.odpovedi?.length
      ? t("vyzva.domuRozehrano", { i: v.odpovedi.length, n: v.ids.length })
      : t("vyzva.domuNova", { n: OTAZEK_VYZVY });
  return h("a", { class: `card vyzva-karta${hotovo ? " is-hotovo" : ""}`, href: "#/vyzva", "data-test": "vyzva" },
    h("span", { class: "vyzva-ico", "aria-hidden": "true", text: hotovo ? "✅" : "📅" }),
    h("span", { class: "pokracuj-body" },
      h("span", { class: "label", text: t("vyzva.nadpis") }),
      h("span", { class: "vyzva-popis", text: popis }),
      hotovo ? h("span", { class: "vyzva-ctverecky-mini", "aria-hidden": "true", text: v.odpovedi.map(([, , ok]) => (ok ? "🟩" : "🟥")).join("") }) : null,
      serie > 0 ? h("span", { class: "pokracuj-meta", text: t("vyzva.serie", { n: serie }) }) : null),
    h("span", { class: hotovo ? "vyzva-go-hotovo" : "pokracuj-go", "aria-hidden": "true", text: hotovo ? "→" : "▶" }));
}

export function vykresli(_param, app) {
  const hv = hvezdyCelkem();
  const dny = serieDni();
  const usp = uspesnost();
  const vse = vsechnyOdznaky();
  const ziskane = pokrok().odznaky;
  const odz = vse.filter((o) => ziskane[o.id]).length;
  const kats = viditelneKategorie();

  const udaj = (ikona, hodnota, popis, test) =>
    h("span", { class: "strip-item", "data-test": test, title: popis },
      h("span", { "aria-hidden": "true", text: ikona }), h("b", { text: hodnota }), h("span", { class: "sr-only", text: ` ${popis}` }));

  const dlazdice = kats.slice(0, MAX_DLAZDIC).map(dlazdiceKategorie);
  if (kats.length > MAX_DLAZDIC) {
    dlazdice.push(h("a", { class: "tile tile-vse", href: "#/kategorie", "data-test": "vsechny-kategorie" },
      h("span", { class: "tile-emo", "aria-hidden": "true", text: "🗂️" }),
      h("span", { class: "tile-vse-body" },
        h("span", { class: "tile-name", text: t("domu.vsechnyKategorie", { n: kats.length }) }),
        h("span", { class: "tile-vse-hint", text: t("domu.vsechnyHint") })),
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
      udaj("🏅", `${odz} / ${vse.length}`, t("domu.odznaku"), "odznaky")),
    kartaPostupu(),
    kartaPokracuj(),
    kartaVyzvy(),
    h("button", {
      type: "button", class: "btn btn-sec btn-nahoda", "data-test": "nahodne",
      onclick: () => { const tema = nahodneTema(); if (tema) app.jdi(`#/tema/${tema.id}`); },
    }, h("span", { "aria-hidden": "true", text: "🎲" }), t("domu.nahodne")),
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
