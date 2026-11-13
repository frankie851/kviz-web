// Sada otázek mimo běžné kolo (D-031 procvičování chyb, D-032 denní výzva): ukazatel postupu (zeleně správné,
// za nimi červeně špatné), téma otázky, otázka s překladem podle nastavení, odpovědi A–D, vysvětlení, Další.
// Hvězdy, výsledky kol, série ani odznaky neřeší – to dělá volající přes naOdpoved / naKonec.
import { t, jazyk } from "./i18n.js";
import { h, ikonaKategorie } from "./ui.js";
import { idx, txt } from "./data.js";
import { nast, jazykPrekladu, PREKLAD } from "./settings.js";
import { odezva } from "./feedback.js";
import { tlacitkoPredcitani, textOtazky, mluv, zastav, autoPredcitat } from "./predcitani.js";
import { tlacitkoSbirky } from "./sbirka.js";

const PISMENA = ["A", "B", "C", "D", "E", "F"];

/**
 * polozky = [{ q, info }]; odpovedi0 = už zodpovězené [[id, volba]] (pokračování po obnovení stránky);
 * naOdpoved(q, volba, ok) se volá po každé odpovědi, naKonec({ spravne, odpovedi, celkem }) po poslední.
 * Vrací { casti: [prvky do <main>], uklid }.
 */
export function sadaOtazek({ polozky, odpovedi0 = [], naOdpoved, naKonec, textPosledni }) {
  const s = nast();
  const jo = s.otazky;
  const jp = jazykPrekladu(s, idx().jazyky || undefined);
  const rezim = s.preklad;
  const odpovedi = odpovedi0.slice();
  const spravneId = new Map(polozky.map(({ q }) => [q.id, q.spravne]));
  const stav = {
    i: odpovedi.length,
    spravne: odpovedi.filter(([id, k]) => spravneId.get(id) === k).length,
    odpovezeno: false, hotovo: false, tlacitka: [],
  };
  const n = polozky.length;

  const pocitadlo = h("span", { class: "qcount", "data-test": "pocitadlo" });
  const pruhOk = h("i", { class: "p-ok", "data-test": "postup-ok" });
  const pruhBad = h("i", { class: "p-bad", "data-test": "postup-bad" });
  const postup = h("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(n) }, pruhOk, pruhBad);
  const tema = h("p", { class: "procvic-tema", "data-test": "procvic-tema" });
  const telo = h("div", { class: "qbody" });
  const obnovPostup = (zodpovezeno) => {
    pruhOk.style.width = `${(stav.spravne / n) * 100}%`;
    pruhBad.style.width = `${((zodpovezeno - stav.spravne) / n) * 100}%`;
  };

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
    const { q, info } = polozky[stav.i];
    stav.odpovezeno = false;
    pocitadlo.textContent = t("hra.pocitadlo", { i: stav.i + 1, n });
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
    const mluvOtazku = tlacitkoPredcitani(() => textOtazky(q, jo), jo); // 🔊 (D-033)
    if (mluvOtazku) karta.append(mluvOtazku);
    telo.replaceChildren(karta, seznam);
    if (autoPredcitat()) mluv(textOtazky(q, jo), jo);
    stav.q = q;
    stav.info = info;
  }

  function odpovez(k) {
    if (stav.odpovezeno || stav.hotovo) return;
    stav.odpovezeno = true;
    const q = stav.q;
    const ok = k === q.spravne;
    zastav();
    if (ok) stav.spravne += 1;
    odpovedi.push([q.id, k]);
    naOdpoved?.(q, k, ok, odpovedi.slice());
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
    const mluvVysv = tlacitkoPredcitani(() => q.vysvetleni?.[jo] || "", jo);
    if (mluvVysv) panel.append(mluvVysv);
    panel.append(tlacitkoSbirky(q, stav.info.tema.id)); // ☆ (D-035)
    const posledni = stav.i === n - 1;
    const dalsi = h("button", { type: "button", class: "btn btn-primary btn-big next", "data-test": "dalsi", onclick: () => pokracuj() },
      posledni ? textPosledni || t("procvic.konec") : t("hra.dalsi"), h("span", { "aria-hidden": "true", text: " →" }));
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
    if (stav.i < n - 1) {
      stav.i += 1;
      otazka();
      window.scrollTo(0, 0);
      return;
    }
    stav.hotovo = true;
    tema.replaceChildren();
    window.scrollTo(0, 0);
    naKonec?.({ spravne: stav.spravne, odpovedi: odpovedi.slice(), celkem: n, telo });
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
  return {
    casti: [h("div", { class: "qprogress" }, postup, pocitadlo), tema, telo],
    uklid: () => { document.removeEventListener("keydown", klavesy); zastav(); },
  };
}
