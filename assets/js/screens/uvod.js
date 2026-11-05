// 1. První spuštění – (a) můj jazyk, (b) jak chceš hrát.
import { t, nastavJazyk, jazykProhlizece, JAZYKY_ROZHRANI } from "../i18n.js";
import { nast, zmen, ZPUSOBY, druhyJazyk } from "../settings.js";
import { h, logo, wordmark } from "../ui.js";

export const ID = "uvod";

let krok = 1;
let zvoleny = null;

export function vykresli(_param, app) {
  if (!zvoleny) {
    zvoleny = jazykProhlizece();
    krok = 1;
  }
  nastavJazyk(zvoleny);
  const el = krok === 1 ? krok1(app) : krok2(app);
  return { el, titulek: t("uvod.titulek"), klic: `krok${krok}` };
}

function krok1(app) {
  const volby = JAZYKY_ROZHRANI.map((j) =>
    h(
      "button",
      {
        type: "button",
        class: "choice choice-lang",
        "aria-pressed": String(j === zvoleny),
        "data-jazyk": j,
        lang: j,
        onclick: () => {
          zvoleny = j;
          app.prekresli();
        },
      },
      h("span", { class: "choice-code", "aria-hidden": "true", text: t(`jazyky.${j}.kod`) }),
      h("span", { class: "choice-title", text: t(`jazyky.${j}.vlastni`) })
    )
  );
  return h(
    "main",
    { class: "screen screen-uvod" },
    h("div", { class: "uvod-hero" }, logo("logo logo-uvod"), wordmark("word word-uvod")),
    h("p", { class: "step", text: t("uvod.krok", { n: 1, z: 2 }) }),
    h("h1", { class: "h-title", text: t("uvod.mujJazyk") }),
    h("p", { class: "lead", text: t("uvod.mujJazykText") }),
    h("div", { class: "choices choices-2" }, volby),
    h("button", {
      type: "button",
      class: "btn btn-primary btn-big",
      "data-test": "pokracovat",
      text: t("uvod.pokracovat"),
      onclick: () => {
        krok = 2;
        app.prekresli();
      },
    })
  );
}

function krok2(app) {
  const druhy = druhyJazyk(zvoleny);
  const zpusob = (klic, emo, popis) =>
    h(
      "button",
      {
        type: "button",
        class: "choice choice-mode",
        "data-zpusob": klic,
        onclick: () => {
          zmen({ ui: zvoleny, zvuky: nast().zvuky ?? true, vibrace: nast().vibrace ?? true, ...ZPUSOBY[klic](zvoleny) });
          zvoleny = null;
          krok = 1;
          app.poUvodu(); // Domů, nebo na odkaz, se kterým hráč přišel
        },
      },
      h("span", { class: "choice-emo", "aria-hidden": "true", text: emo }),
      h("span", { class: "choice-body" },
        h("span", { class: "choice-title", text: t(`uvod.zpusob.${klic}`, { jazyk: t(`jazyky.${druhy}.akuzativ`) }) }),
        h("span", { class: "choice-desc", text: popis }))
    );
  return h(
    "main",
    { class: "screen screen-uvod" },
    h("div", { class: "uvod-top" },
      h("button", { type: "button", class: "iconbtn", "aria-label": t("nav.zpet"), onclick: () => { krok = 1; app.prekresli(); } },
        h("span", { "aria-hidden": "true", text: "←" })),
      h("p", { class: "step", text: t("uvod.krok", { n: 2, z: 2 }) })),
    h("h1", { class: "h-title", text: t("uvod.jakHrat") }),
    h("p", { class: "lead", text: t("uvod.jakHratText") }),
    h(
      "div",
      { class: "choices" },
      zpusob("muj", "🎯", t("uvod.zpusobPopis.muj", { jazyk: t(`jazyky.${zvoleny}.prislovce`) })),
      zpusob("ucim", "📚", t("uvod.zpusobPopis.ucim", { jazyk: t(`jazyky.${druhy}.prislovce`) })),
      zpusob("obe", "🤝", t("uvod.zpusobPopis.obe", { jazyk: t(`jazyky.${zvoleny}.prislovce`), druhy: t(`jazyky.${druhy}.prislovce`) }))
    ),
    h("p", { class: "note", text: t("uvod.lzeZmenit") })
  );
}
