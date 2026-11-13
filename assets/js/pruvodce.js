// Průvodce pravidly (D-036): 3 krátké kroky pro nového hráče – každá obtížnost jen jednou, hvězdy po půlkách,
// od 70 % se odemyká další obtížnost (pod 70 % natrvalo zamčená) a tip na procvičování chyb.
// Ukáže se jednou (po prvním spuštění na Domů nebo u tématu), jen hráči bez dohraného kola; znovu z Nastavení.
import { t } from "./i18n.js";
import { h } from "./ui.js";
import { nast, zmen } from "./settings.js";
import { pokrok } from "./progress.js";

const KROKY = [
  { ikona: "🎯", klic: "jednou" },
  { ikona: "⭐", klic: "hvezdy" },
  { ikona: "🔓", klic: "odemykani" },
];

let otevreny = null;

/** Otevře průvodce (z Nastavení kdykoli). Po zavření se zapamatuje, že ho hráč viděl. */
export function ukazPruvodce() {
  if (otevreny?.isConnected) return;
  let krok = 0;
  const predtim = document.activeElement;
  const obsah = h("div", { class: "pruvodce-obsah", "aria-live": "polite" });
  const tecky = h("div", { class: "pruvodce-tecky", "aria-hidden": "true" }, KROKY.map(() => h("span", { class: "tecka" })));
  const zpet = h("button", { type: "button", class: "btn btn-sec", "data-test": "pruvodce-zpet", onclick: () => jdiNa(krok - 1) });
  const dal = h("button", { type: "button", class: "btn btn-primary", "data-test": "pruvodce-dal", onclick: () => (krok < KROKY.length - 1 ? jdiNa(krok + 1) : zavri()) });
  const preskocit = h("button", { type: "button", class: "pruvodce-preskocit", "data-test": "pruvodce-preskocit", onclick: () => zavri(), text: t("pruvodce.preskocit") });

  function jdiNa(k) {
    krok = Math.max(0, Math.min(KROKY.length - 1, k));
    const { ikona, klic } = KROKY[krok];
    const tip = t(`pruvodce.${klic}.tip`);
    obsah.replaceChildren(...[
      h("span", { class: "pruvodce-ikona", "aria-hidden": "true", text: ikona }),
      h("h2", { class: "dialog-h", id: "pruvodce-nadpis", text: t(`pruvodce.${klic}.nadpis`) }),
      h("p", { class: "pruvodce-text", text: t(`pruvodce.${klic}.text`) }),
      tip ? h("p", { class: "pruvodce-tip", text: tip }) : null,
    ].filter(Boolean));
    [...tecky.children].forEach((x, i) => x.classList.toggle("on", i === krok));
    zpet.hidden = krok === 0;
    dal.textContent = krok < KROKY.length - 1 ? t("pruvodce.dal") : t("pruvodce.rozumim");
    zpet.textContent = t("pruvodce.zpet");
    okno.dataset.krok = String(krok + 1);
    dal.focus({ preventScroll: true });
  }

  function zavri() {
    zmen({ pruvodce: true });
    okno.remove();
    otevreny = null;
    document.removeEventListener("keydown", klavesa);
    predtim?.focus?.({ preventScroll: true });
  }
  const klavesa = (e) => {
    if (e.key === "Escape") zavri();
    else if (e.key === "ArrowRight") jdiNa(krok + 1);
    else if (e.key === "ArrowLeft") jdiNa(krok - 1);
  };

  const okno = h("div", { class: "dialog-pozadi", "data-test": "pruvodce" },
    h("div", { class: "dialog card pruvodce", role: "dialog", "aria-modal": "true", "aria-labelledby": "pruvodce-nadpis" },
      preskocit, obsah, tecky, h("div", { class: "pruvodce-btns" }, zpet, dal)));
  otevreny = okno;
  document.body.append(okno);
  document.addEventListener("keydown", klavesa);
  jdiNa(0);
}

/** Na Domů a u tématu: průvodce jednou pro nového hráče (nic nedohrál a průvodce ještě neviděl). */
export function pruvodceKdyzTreba() {
  if (nast().pruvodce || Object.keys(pokrok().vysledky).length) return;
  setTimeout(() => { if (!nast().pruvodce) ukazPruvodce(); }, 350); // až po příjezdu obrazovky
}
