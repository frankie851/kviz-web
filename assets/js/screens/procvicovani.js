// Procvičování chyb (D-031) – otázky, na které hráč dřív odpověděl špatně, náhodně nejvýš 10 za sebou.
// Hvězdy, výsledky, série ani odznaky se tím nemění; správně zodpovězená otázka ze seznamu chyb zmizí.
// Ovládání jako u hry: překlad podle nastavení, klávesy 1–4 / A–D a Enter, zvuk a vibrace.
import { t, jazyk } from "../i18n.js";
import { h, lista, ikonaKategorie } from "../ui.js";
import { idx, txt } from "../data.js";
import { zamichej } from "../game.js";
import { chybneOtazky, oznacProcviceno } from "../progress.js";
import { nast, jazykPrekladu, PREKLAD } from "../settings.js";
import { odezva } from "../feedback.js";

export const ID = "procvicovani";
const PISMENA = ["A", "B", "C", "D", "E", "F"];
const V_KOLE = 10;

export async function vykresli(_param, app) {
  const vse = await chybneOtazky();
  if (!vse.length) {
    const el = h("main", { class: "screen" },
      lista({ zpet: "#/historie", nadpis: t("procvic.nadpis") }),
      h("div", { class: "empty", "data-test": "procvic-prazdne" },
        h("p", { text: t("procvic.zadne") }),
        h("a", { class: "btn btn-primary btn-big", href: "#/historie", text: t("procvic.zpet") })));
    return { el, titulek: t("procvic.nadpis") };
  }

  const kolo = zamichej(vse).slice(0, V_KOLE);
  const s = nast();
  const jo = s.otazky;
  const jp = jazykPrekladu(s, idx().jazyky || undefined);
  const rezim = s.preklad;
  const stav = { i: 0, spravne: 0, odpovezeno: false, hotovo: false, tlacitka: [] };

  const pocitadlo = h("span", { class: "qcount", "data-test": "pocitadlo" });
  const pruhOk = h("i", { class: "p-ok" });
  const pruhBad = h("i", { class: "p-bad" });
  const postup = h("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(kolo.length) }, pruhOk, pruhBad);
  const tema = h("p", { class: "procvic-tema", "data-test": "procvic-tema" });
  const telo = h("div", { class: "qbody" });
  const el = h("main", { class: "screen screen-hra screen-procvic" },
    lista({ zpet: "#/historie", nadpis: t("procvic.nadpis") }),
    h("div", { class: "qprogress" }, postup, pocitadlo),
    tema,
    telo);

  const obnovPostup = (zodpovezeno) => {
    pruhOk.style.width = `${(stav.spravne / kolo.length) * 100}%`;
    pruhBad.style.width = `${((zodpovezeno - stav.spravne) / kolo.length) * 100}%`;
  };

  /** Text v jazyce otázek + případný překlad pod ním (jako ve hře). */
  function dvojice(obj, trida, ukaz) {
    const wrap = h("span", { class: trida }, h("span", { class: "orig", lang: jo, text: txt(obj, jo) }));
    if (jp !== jo && obj && obj[jp] && obj[jp] !== obj[jo]) wrap.append(h("span", { class: "tr", lang: jp, text: obj[jp], hidden: !ukaz }));
    return wrap;
  }
  function tlacitkoPrekladu(cil) {
    const btn = h("button", {
      type: "button", class: "trbtn", "aria-pressed": "false", "data-test": "prelozit",
      onclick: () => {
        if (btn.getAttribute("aria-pressed") === "true") return;
        btn.setAttribute("aria-pressed", "true");
        cil().forEach((e) => (e.hidden = false));
      },
    }, h("span", { "aria-hidden": "true", text: "🌐" }), t("hra.prelozit", { jazyk: t(`jazyky.${jp}.kod`) }));
    return btn;
  }

  function otazka() {
    const { q, info } = kolo[stav.i];
    stav.odpovezeno = false;
    pocitadlo.textContent = t("hra.pocitadlo", { i: stav.i + 1, n: kolo.length });
    postup.setAttribute("aria-valuenow", String(stav.i));
    obnovPostup(stav.i);
    tema.replaceChildren(ikonaKategorie(info.kategorie, "procvic-ico"), h("span", { text: `${txt(info.tema.nazev, jazyk())} · ${t(`obtiznost.${q.obtiznost}`)}` }));
    const vzdy = rezim === PREKLAD.VZDY;
    const karta = h("div", { class: "qcard", "data-qid": q.id }, dvojice(q.otazka, "qtext", vzdy));
    stav.tlacitka = (q.moznosti?.[jo] || []).map((_, k) => h("button", {
      type: "button", class: "ans", "data-index": String(k), "aria-keyshortcuts": `${k + 1} ${PISMENA[k]}`, onclick: () => odpovez(k),
    }, h("span", { class: "ans-l", "aria-hidden": "true", text: PISMENA[k] }),
    dvojice({ [jo]: q.moznosti[jo]?.[k], [jp]: q.moznosti[jp]?.[k] }, "ans-t", vzdy),
    h("span", { class: "ans-s", "aria-hidden": "true" })));
    const seznam = h("ol", { class: "answers", "aria-label": t("hra.moznosti") }, stav.tlacitka.map((b) => h("li", {}, b)));
    if (rezim === PREKLAD.TUKNUTI && karta.querySelector(".tr")) {
      karta.append(tlacitkoPrekladu(() => [...karta.querySelectorAll(".tr"), ...seznam.querySelectorAll(".tr")]));
    }
    telo.replaceChildren(karta, seznam);
    stav.q = q;
  }

  function odpovez(k) {
    if (stav.odpovezeno || stav.hotovo) return;
    stav.odpovezeno = true;
    const q = stav.q;
    const ok = k === q.spravne;
    if (ok) {
      stav.spravne += 1;
      oznacProcviceno(q.id);
    }
    stav.tlacitka.forEach((b, j) => {
      b.setAttribute("aria-disabled", "true");
      b.classList.add("done");
      if (j === q.spravne) {
        b.classList.add("ok");
        b.querySelector(".ans-s").textContent = "✓";
        b.append(h("span", { class: "sr-only", text: t("hra.spravnaOdpoved") }));
      } else if (j === k) {
        b.classList.add("bad");
        b.querySelector(".ans-s").textContent = "✗";
        b.append(h("span", { class: "sr-only", text: t("hra.tvojeOdpoved") }));
      }
    });
    stav.tlacitka[k].classList.add(ok ? "pop" : "shake");
    odezva(ok ? "spravne" : "spatne", { rada: 0 });
    obnovPostup(stav.i + 1);
    const vysv = dvojice(q.vysvetleni, "explain-t", rezim === PREKLAD.VZDY);
    const panel = h("section", { class: `explain ${ok ? "is-ok" : "is-bad"}`, "aria-live": "polite", "data-test": "vysvetleni" },
      h("h2", { class: "explain-h" },
        h("span", { class: "verdict", text: ok ? t("hra.spravne") : t("hra.spatne") }),
        h("span", { class: "dyk", text: t("hra.vedeliJste") })),
      h("p", {}, vysv));
    if (rezim === PREKLAD.TUKNUTI && vysv.querySelector(".tr")) panel.append(tlacitkoPrekladu(() => [...vysv.querySelectorAll(".tr")]));
    const posledni = stav.i === kolo.length - 1;
    const dalsi = h("button", { type: "button", class: "btn btn-primary btn-big next", "data-test": "dalsi", onclick: () => pokracuj() },
      posledni ? t("procvic.konec") : t("hra.dalsi"), h("span", { "aria-hidden": "true", text: " →" }));
    telo.append(panel, dalsi);
    dalsi.focus({ preventScroll: true });
    ukazDalsi(dalsi);
  }

  /** Posune k tlačítku Další s malou rezervou nad spodní lištou prohlížeče (jako ve hře, D-022/D-023). */
  function ukazDalsi(btn) {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const posun = () => {
      if (!btn.isConnected) return;
      const vyska = window.visualViewport?.height || window.innerHeight;
      const navic = btn.getBoundingClientRect().bottom + Math.min(40, vyska * 0.06) - vyska;
      if (navic > 1) window.scrollTo({ top: window.scrollY + navic, behavior: reduce ? "auto" : "smooth" });
    };
    requestAnimationFrame(() => requestAnimationFrame(posun));
    setTimeout(posun, 450);
  }

  function pokracuj() {
    if (!stav.odpovezeno || stav.hotovo) return;
    if (stav.i < kolo.length - 1) {
      stav.i += 1;
      otazka();
      window.scrollTo(0, 0);
      return;
    }
    stav.hotovo = true;
    konec();
  }

  function konec() {
    const zbyva = vse.length - stav.spravne;
    tema.replaceChildren();
    telo.replaceChildren(h("section", { class: "card procvic-konec", "data-test": "procvic-konec" },
      h("p", { class: "res-title", text: t("procvic.hotovo") }),
      h("p", { class: "res-score" }, h("b", { text: `${stav.spravne} / ${kolo.length}` }), h("span", { text: t("procvic.spravne") })),
      h("p", { class: "procvic-zbyva", "data-test": "procvic-zbyva", text: zbyva > 0 ? t("procvic.zbyva", { n: zbyva }) : t("procvic.vseHotovo") }),
      zbyva > 0
        ? h("button", { type: "button", class: "btn btn-primary btn-big", "data-test": "procvic-znovu", onclick: () => app.prekresli(), text: t("procvic.dalsiKolo") })
        : null,
      h("a", { class: "btn btn-sec btn-big", href: "#/historie", text: t("procvic.zpet") })));
    window.scrollTo(0, 0);
  }

  function klavesy(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || stav.hotovo) return;
    const k = e.key.toLowerCase();
    let i = ["1", "2", "3", "4", "5", "6"].indexOf(k);
    if (i < 0) i = ["a", "b", "c", "d", "e", "f"].indexOf(k);
    if (i >= 0 && i < stav.tlacitka.length && !stav.odpovezeno) {
      e.preventDefault();
      odpovez(i);
    } else if (k === "enter" && stav.odpovezeno && !document.activeElement?.classList.contains("trbtn")) {
      e.preventDefault();
      pokracuj();
    }
  }

  otazka();
  document.addEventListener("keydown", klavesy);
  // klic: „Procvičit další“ volá prekresli → nové kolo; jiný klíč = nová obrazovka (posun nahoru, bez zachování fokusu)
  return { el, titulek: t("procvic.nadpis"), klic: String(Math.random()), uklid: () => document.removeEventListener("keydown", klavesy) };
}
