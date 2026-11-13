// Drobné stavební kameny rozhraní. Texty se vkládají vždy jako text (textContent), nikdy jako HTML.
import { t } from "./i18n.js";

/** h("div", { class: "x", text: "…", onclick }, ...děti) */
export function h(tag, attrs = {}, ...deti) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "text") el.textContent = v;
    else if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const d of deti.flat()) {
    if (d == null || d === false) continue;
    el.append(d instanceof Node ? d : document.createTextNode(String(d)));
  }
  return el;
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** Logo Oho! (bublina s vykřičníkem a jiskrou) – stejné jako assets/img/logo.svg. */
export function logo(trida = "logo") {
  const s = document.createElementNS(SVG_NS, "svg");
  s.setAttribute("viewBox", "0 0 96 96");
  s.setAttribute("class", trida);
  s.setAttribute("aria-hidden", "true");
  const tvary = [
    ["path", { d: "M48 8a38 38 0 1 1-19.6 70.6L12 86l5.2-15.4A38 38 0 0 1 48 8z", fill: "#C2255C" }],
    ["rect", { x: 42, y: 22, width: 12, height: 34, rx: 6, fill: "#fff" }],
    ["circle", { cx: 48, cy: 68, r: 6.5, fill: "#fff" }],
    ["path", { d: "M80 4l3.4 9.6L93 17l-9.6 3.4L80 30l-3.4-9.6L67 17l9.6-3.4z", fill: "#FFC53D", class: "jiskra" }],
  ];
  for (const [tag, a] of tvary) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(a)) el.setAttribute(k, v);
    s.append(el);
  }
  return s;
}

/** Název značky: „Oho“ + vykřičník v barvě Malina. */
export function wordmark(trida = "word") {
  return h("span", { class: trida, translate: "no" }, t("app.nazevZaklad"), h("em", { text: "!" }));
}

/** Řada hvězd z půlhvězd (0–10): celé, půlky a prázdné. */
export function hvezdicky(pul, max = 5, trida = "stars") {
  const el = h("span", { class: trida, role: "img", "aria-label": t("hvezdy.aria", { pocet: cislo(pul / 2), max }) });
  for (let i = 0; i < max; i++) {
    const stav = pul >= (i + 1) * 2 ? "star on" : pul === i * 2 + 1 ? "star half" : "star";
    el.append(h("span", { class: stav, "aria-hidden": "true", text: "★" }));
  }
  return el;
}

/** Číslo v jazyce rozhraní (3,5 / 3.5). */
export function cislo(n) {
  try {
    return new Intl.NumberFormat(document.documentElement.lang || "cs", { maximumFractionDigits: 1 }).format(n);
  } catch {
    return String(n);
  }
}

/** Celé hvězdy z půlhvězd pro součty (Domů, kategorie, témata): půlky se zaokrouhlí dolů (D-020). */
export function celeHvezdy(pul) {
  return Math.floor(pul / 2);
}

/** Součet hvězd jako text „3 / 15 ★“ z půlhvězd (půlky dolů, D-020). */
export function hvezdyText(pul, maxPul) {
  return `${celeHvezdy(pul)} / ${celeHvezdy(maxPul)} ★`;
}

// Kategorie, které místo emoji z dat ukazují vlastní obrázek (D-020). Emoji vlajky Windows neumí, proto SVG.
const OBRAZKY_KATEGORII = { cesko: "assets/img/vlajka-cz.svg" };

/** Ikona kategorie: vlastní obrázek, nebo emoji z dat. */
export function ikonaKategorie(kat, trida = "tile-emo") {
  const obr = OBRAZKY_KATEGORII[kat.id];
  if (obr) return h("span", { class: `${trida} kat-obr`, "aria-hidden": "true" }, h("img", { src: obr, alt: "", width: "3", height: "2", draggable: "false" }));
  return h("span", { class: trida, "aria-hidden": "true", text: kat.ikona || "❓" });
}

/** Horní lišta obrazovky: tlačítko zpět + nadpis (+ volitelně něco vpravo). */
export function lista({ zpet, nadpis, vpravo }) {
  return h(
    "header",
    { class: "bar" },
    zpet
      ? h("a", { class: "iconbtn", href: zpet, "aria-label": t("nav.zpet") }, h("span", { "aria-hidden": "true", text: "←" }))
      : h("span", { class: "iconbtn-spacer" }),
    h("h1", { class: "bar-title", tabindex: "-1", text: nadpis }),
    vpravo || h("span", { class: "iconbtn-spacer" })
  );
}

/** Přepínač s několika volbami (segmenty). */
export function prepinac({ popis, volby, hodnota, zmena, id }) {
  const skupina = h("div", { class: "seg", role: "radiogroup", "aria-labelledby": id });
  const tlacitka = volby.map((v) =>
    h("button", {
      type: "button",
      class: "seg-btn",
      role: "radio",
      "aria-checked": String(v.hodnota === hodnota),
      "data-hodnota": v.hodnota,
      text: v.text,
      onclick: () => {
        tlacitka.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.hodnota === String(v.hodnota))));
        zmena(v.hodnota);
      },
    })
  );
  skupina.append(...tlacitka);
  return h("div", { class: "field" }, h("div", { class: "field-label", id, text: popis }), skupina);
}

/** Vypínač zapnuto / vypnuto. */
export function vypinac({ popis, zapnuto, zmena, id }) {
  const btn = h("button", {
    type: "button",
    class: "switch",
    role: "switch",
    id,
    "aria-checked": String(!!zapnuto),
    onclick: () => {
      const nove = btn.getAttribute("aria-checked") !== "true";
      btn.setAttribute("aria-checked", String(nove));
      zmena(nove);
    },
  }, h("span", { class: "switch-knob", "aria-hidden": "true" }));
  return h("div", { class: "field field-row" }, h("label", { class: "field-label", for: id, text: popis }), btn);
}

/** Potvrzení uvnitř aplikace (ne systémový dialog prohlížeče). Vrací Promise<boolean>. */
export function potvrdit({ nadpis, text, ano, ne }) {
  return new Promise((hotovo) => {
    const predtim = document.activeElement;
    const zavri = (vysl) => {
      okno.remove();
      document.removeEventListener("keydown", klavesa);
      predtim?.focus?.({ preventScroll: true });
      hotovo(vysl);
    };
    const klavesa = (e) => { if (e.key === "Escape") zavri(false); };
    const tlAno = h("button", { type: "button", class: "btn btn-primary btn-big", "data-test": "potvrdit-ano", onclick: () => zavri(true), text: ano });
    const okno = h("div", { class: "dialog-pozadi", "data-test": "potvrdit" },
      h("div", { class: "dialog card", role: "dialog", "aria-modal": "true", "aria-labelledby": "dialog-nadpis" },
        h("h2", { class: "dialog-h", id: "dialog-nadpis", text: nadpis }),
        h("p", { class: "dialog-text", text }),
        tlAno,
        h("button", { type: "button", class: "btn btn-sec btn-big", "data-test": "potvrdit-ne", onclick: () => zavri(false), text: ne })));
    document.addEventListener("keydown", klavesa);
    document.body.append(okno);
    tlAno.focus();
  });
}

export function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
