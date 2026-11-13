// Moje sbírka (D-035): tlačítko ☆ u vysvětlení – uloží zajímavou otázku do sbírky (Historie → Moje sbírka).
import { t } from "./i18n.js";
import { h } from "./ui.js";
import { jeVeSbirce, prepniSbirku } from "./progress.js";
import { kratkeOznameni } from "./oslavy.js";

export function tlacitkoSbirky(q, temaId) {
  const btn = h("button", { type: "button", class: "trbtn trbtn-sbirka", "data-test": "sbirka-prepnout" });
  const obnov = () => {
    const ma = jeVeSbirce(q.id);
    btn.setAttribute("aria-pressed", String(ma));
    btn.replaceChildren(h("span", { "aria-hidden": "true", text: ma ? "★" : "☆" }), t(ma ? "sbirka.ulozeno" : "sbirka.ulozit"));
  };
  btn.addEventListener("click", () => {
    const ma = prepniSbirku(q.id, temaId);
    obnov();
    kratkeOznameni(t(ma ? "sbirka.pridano" : "sbirka.odebrano"));
  });
  obnov();
  return btn;
}
