// Předčítání nahlas (D-033): otázka s možnostmi a vysvětlení hlasem zařízení (speechSynthesis) – nic se
// nestahuje ani neposílá. Nastavení: vypnuto / tlačítko 🔊 / automaticky (otázka se přečte sama).
import { t } from "./i18n.js";
import { h } from "./ui.js";
import { nast } from "./settings.js";
import { kratkeOznameni } from "./oslavy.js";

export const PREDCITANI = { VYPNUTO: "vypnuto", TLACITKO: "tlacitko", AUTO: "auto" };
const JAZYK_HLASU = { cs: "cs-CZ", en: "en-GB" };
const upozorneno = new Set();
const PISMENA = ["A", "B", "C", "D", "E", "F"];

export function lzePredcitat() {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
}

/** Text otázky k přečtení: otázka a pak „A: …, B: …“. */
export function textOtazky(q, jazyk) {
  const moznosti = (q.moznosti?.[jazyk] || []).map((m, i) => `${PISMENA[i]}: ${m}`).join(". ");
  return `${q.otazka?.[jazyk] || ""}. ${moznosti}.`;
}

export function mluv(text, jazyk) {
  if (!lzePredcitat() || !text) return;
  const syn = window.speechSynthesis;
  syn.cancel();
  const u = new window.SpeechSynthesisUtterance(text);
  u.lang = JAZYK_HLASU[jazyk] || jazyk;
  u.rate = 0.95;
  const hlasy = syn.getVoices?.() || [];
  const hlas = hlasy.find((v) => (v.lang || "").toLowerCase().startsWith(jazyk));
  if (hlas) u.voice = hlas;
  else if (hlasy.length && !upozorneno.has(jazyk)) {
    // zařízení hlasy má, ale ne pro tento jazyk – upozornit jednou
    upozorneno.add(jazyk);
    kratkeOznameni(t("predcitani.bezHlasu", { jazyk: t(`jazyky.${jazyk}.vlastni`) }));
  }
  syn.speak(u);
}

export function zastav() {
  if (lzePredcitat()) window.speechSynthesis.cancel();
}

/** Má se otázka přečíst sama (nastavení Automaticky)? */
export function autoPredcitat() {
  return lzePredcitat() && nast().predcitani === PREDCITANI.AUTO;
}

/** Tlačítko 🔊 Přečíst (nebo null, když je předčítání vypnuté nebo ho prohlížeč neumí). */
export function tlacitkoPredcitani(text, jazyk) {
  if (!lzePredcitat() || nast().predcitani === PREDCITANI.VYPNUTO) return null;
  return h("button", {
    type: "button", class: "trbtn trbtn-mluv", "data-test": "predcist", "aria-label": t("predcitani.cist"),
    onclick: () => mluv(text(), jazyk),
  }, h("span", { "aria-hidden": "true", text: "🔊" }), t("predcitani.cist"));
}
