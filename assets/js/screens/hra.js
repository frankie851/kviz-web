// 6. Otázka – kolo až 10 otázek. Překlad podle nastavení (vždy / na ťuknutí / vypnuto).
// Na PC: klávesy 1–4 nebo A–D = odpověď, Enter = Další.
import { t, jazyk } from "../i18n.js";
import { h, potvrd } from "../ui.js";
import { najdiTema, nactiTema, idx, txt } from "../data.js";
import { sestavKolo } from "../game.js";
import { jeOdemceno, zapisKolo } from "../progress.js";
import { nast, jazykPrekladu, PREKLAD } from "../settings.js";
import { uloz } from "../storage.js";
import { odezva } from "../feedback.js";

export const ID = "hra";
const PISMENA = ["A", "B", "C", "D", "E", "F"];

export async function vykresli([temaId, obt], app) {
  const info = najdiTema(temaId);
  if (!info) return { presmeruj: "#/kategorie" };
  if (!jeOdemceno(info.tema, obt)) return { presmeruj: `#/tema/${temaId}` };

  const data = await nactiTema(temaId);
  const otazky = sestavKolo(data, obt);
  if (!otazky.length) return { presmeruj: `#/tema/${temaId}` };

  const s = nast();
  const jo = s.otazky; // jazyk otázek
  const jp = jazykPrekladu(s, idx().jazyky || undefined); // jazyk překladu
  const rezim = s.preklad;

  const stav = { i: 0, spravne: 0, rada: 0, nejdelsiRada: 0, odpovezeno: false, prekladOtevren: false, hotovo: false };

  // --- kostra obrazovky ---
  const pocitadlo = h("span", { class: "qcount", "data-test": "pocitadlo" });
  const ukazatel = h("i");
  const postup = h("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(otazky.length) }, ukazatel);
  const serie = h("span", { class: "streak", "data-test": "serie", "aria-live": "polite" });
  const telo = h("div", { class: "qbody" });

  const zpet = h("button", { type: "button", class: "iconbtn", "aria-label": t("hra.ukoncit"), onclick: () => opustit() },
    h("span", { "aria-hidden": "true", text: "←" }));

  const el = h(
    "main",
    { class: "screen screen-hra", "data-tema": temaId, "data-obtiznost": obt },
    h("header", { class: "qtop" },
      zpet,
      h("div", { class: "qtitle-wrap" },
        h("h1", { class: "qtitle", text: txt(info.tema.nazev, jazyk()) }),
        h("span", { class: "qdiff", text: t(`obtiznost.${obt}`) })),
      pocitadlo),
    h("div", { class: "qprogress" }, postup, serie),
    telo
  );

  async function opustit() {
    if (stav.i > 0 || stav.odpovezeno) {
      const ano = await potvrd({ nadpis: t("hra.opustitNadpis"), text: t("hra.opustitText"), ano: t("hra.opustitAno"), ne: t("hra.opustitNe") });
      if (!ano) return;
    }
    app.jdi(`#/tema/${temaId}`);
  }

  /** Text v jazyce otázek + případný překlad pod ním. */
  function dvojice(obj, trida, ukazPreklad) {
    const wrap = h("span", { class: trida });
    wrap.append(h("span", { class: "orig", lang: jo, text: txt(obj, jo) }));
    if (jp !== jo && obj && obj[jp] && obj[jp] !== obj[jo]) {
      wrap.append(h("span", { class: "tr", lang: jp, text: obj[jp], hidden: !ukazPreklad }));
    }
    return wrap;
  }

  function tlacitkoPrekladu(cil, onOpen) {
    const btn = h("button", {
      type: "button",
      class: "trbtn",
      "aria-pressed": "false",
      "data-test": "prelozit",
      onclick: () => {
        if (btn.getAttribute("aria-pressed") === "true") return; // zůstane zobrazený do konce otázky
        btn.setAttribute("aria-pressed", "true");
        cil().forEach((e) => (e.hidden = false));
        stav.prekladOtevren = true;
        onOpen?.();
      },
    }, h("span", { "aria-hidden": "true", text: "🌐" }), t("hra.prelozit", { jazyk: t(`jazyky.${jp}.kod`) }));
    return btn;
  }

  function otazka() {
    const q = otazky[stav.i];
    stav.odpovezeno = false;
    pocitadlo.textContent = t("hra.pocitadlo", { i: stav.i + 1, n: otazky.length });
    postup.setAttribute("aria-valuenow", String(stav.i));
    postup.setAttribute("aria-label", t("hra.pocitadlo", { i: stav.i + 1, n: otazky.length }));
    ukazatel.style.width = `${(stav.i / otazky.length) * 100}%`;
    obnovSerii();

    const vzdy = rezim === PREKLAD.VZDY;
    const karta = h("div", { class: "qcard", "data-qid": q.id }, dvojice(q.otazka, "qtext", vzdy));
    const moznostiJo = q.moznosti?.[jo] || [];
    const tlacitka = moznostiJo.map((_, k) => {
      const obsah = dvojice({ [jo]: q.moznosti[jo]?.[k], [jp]: q.moznosti[jp]?.[k] }, "ans-t", vzdy);
      return h("button", {
        type: "button",
        class: "ans",
        "data-index": String(k),
        "aria-keyshortcuts": `${k + 1} ${PISMENA[k]}`,
        onclick: () => odpovez(k),
      }, h("span", { class: "ans-l", "aria-hidden": "true", text: PISMENA[k] }), obsah, h("span", { class: "ans-s", "aria-hidden": "true" }));
    });
    const seznam = h("ol", { class: "answers", "aria-label": t("hra.moznosti") }, tlacitka.map((b) => h("li", {}, b)));

    if (rezim === PREKLAD.TUKNUTI && karta.querySelector(".tr")) {
      karta.append(tlacitkoPrekladu(() => [...karta.querySelectorAll(".tr"), ...seznam.querySelectorAll(".tr")]));
    }
    telo.replaceChildren(karta, seznam);
    stav.tlacitka = tlacitka;
    stav.q = q;
  }

  function odpovez(k) {
    if (stav.odpovezeno || stav.hotovo) return; // druhé ťuknutí už nic nemění
    stav.odpovezeno = true;
    const q = stav.q;
    const ok = k === q.spravne;
    if (ok) {
      stav.spravne += 1;
      stav.rada += 1;
      stav.nejdelsiRada = Math.max(stav.nejdelsiRada, stav.rada);
    } else {
      stav.rada = 0;
    }
    stav.tlacitka.forEach((b, j) => {
      b.setAttribute("aria-disabled", "true");
      b.classList.add("done");
      const znak = b.querySelector(".ans-s");
      if (j === q.spravne) {
        b.classList.add("ok");
        znak.textContent = "✓";
        b.append(h("span", { class: "sr-only", text: t("hra.spravnaOdpoved") }));
      } else if (j === k) {
        b.classList.add("bad");
        znak.textContent = "✗";
        b.append(h("span", { class: "sr-only", text: t("hra.tvojeOdpoved") }));
      }
    });
    if (ok) stav.tlacitka[k].classList.add("pop");
    else stav.tlacitka[k].classList.add("shake");
    odezva(ok ? "spravne" : "spatne");
    ukazatel.style.width = `${((stav.i + 1) / otazky.length) * 100}%`;
    obnovSerii();

    const posledni = stav.i === otazky.length - 1;
    const vysv = dvojice(q.vysvetleni, "explain-t", rezim === PREKLAD.VZDY);
    const panel = h(
      "section",
      { class: `explain ${ok ? "is-ok" : "is-bad"}`, "aria-live": "polite", "data-test": "vysvetleni" },
      h("h2", { class: "explain-h" },
        h("span", { class: "verdict", text: ok ? t("hra.spravne") : t("hra.spatne") }),
        h("span", { class: "dyk", text: t("hra.vedeliJste") })),
      h("p", {}, vysv)
    );
    if (rezim === PREKLAD.TUKNUTI && vysv.querySelector(".tr")) {
      panel.append(tlacitkoPrekladu(() => [...vysv.querySelectorAll(".tr")]));
    }
    const dalsi = h("button", {
      type: "button",
      class: "btn btn-primary btn-big next",
      "data-test": "dalsi",
      onclick: () => pokracuj(),
    }, posledni ? t("hra.vysledek") : t("hra.dalsi"), h("span", { "aria-hidden": "true", text: " →" }));
    telo.append(panel, dalsi);
    dalsi.focus({ preventScroll: true });
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => dalsi.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }));
  }

  function obnovSerii() {
    const zobraz = stav.rada >= 2;
    serie.classList.toggle("on", zobraz);
    serie.textContent = zobraz ? `🔥 ${t("hra.serie", { n: stav.rada })}` : "";
  }

  function pokracuj() {
    if (!stav.odpovezeno || stav.hotovo) return;
    if (stav.i < otazky.length - 1) {
      stav.i += 1;
      otazka();
      window.scrollTo(0, 0);
      el.querySelector(".qtext .orig")?.setAttribute("tabindex", "-1");
      el.querySelector(".qtext .orig")?.focus({ preventScroll: true });
      return;
    }
    stav.hotovo = true;
    const souhrn = zapisKolo({
      temaId,
      obt,
      spravne: stav.spravne,
      celkem: otazky.length,
      nejdelsiRada: stav.nejdelsiRada,
      jazykOtazek: jo,
      jazykUi: s.ui,
      preklad: rezim,
      prekladOtevren: stav.prekladOtevren,
    });
    uloz("posledni", { temaId, obt, spravne: stav.spravne, celkem: otazky.length, ...souhrn });
    odezva("konec");
    app.jdi("#/vysledek", { nahradit: true });
  }

  function klavesy(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    let i = ["1", "2", "3", "4", "5", "6"].indexOf(k);
    if (i < 0) i = ["a", "b", "c", "d", "e", "f"].indexOf(k);
    if (i >= 0 && i < (stav.tlacitka?.length || 0) && !stav.odpovezeno) {
      e.preventDefault();
      odpovez(i);
    } else if (k === "enter" && stav.odpovezeno && !document.activeElement?.classList.contains("trbtn")) {
      e.preventDefault();
      pokracuj();
    }
  }

  otazka();
  document.addEventListener("keydown", klavesy);
  return { el, titulek: txt(info.tema.nazev, jazyk()), uklid: () => document.removeEventListener("keydown", klavesy) };
}
