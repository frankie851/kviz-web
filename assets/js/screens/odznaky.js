// 8. Odznaky – získané i zamčené; u zamčených, jak je získat.
import { t, jazyk } from "../i18n.js";
import { h, lista } from "../ui.js";
import { ODZNAKY } from "../badges.js";
import { pokrok } from "../progress.js";

export const ID = "odznaky";

function datum(iso) {
  const [r, m, d] = String(iso).split("-").map(Number);
  if (!r) return "";
  try {
    return new Date(r, m - 1, d).toLocaleDateString(jazyk() === "cs" ? "cs-CZ" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function vykresli() {
  const ziskane = pokrok().odznaky;
  const pocet = ODZNAKY.filter((o) => ziskane[o.id]).length;
  const karty = ODZNAKY.map((o) => {
    const ma = !!ziskane[o.id];
    return h(
      "li",
      { class: `bcard ${ma ? "earned" : "locked"}`, "data-odznak": o.id },
      h("span", { class: "bcard-ico", "aria-hidden": "true", text: ma ? o.ikona : "🔒" }),
      h("span", { class: "bcard-name", text: t(`odznak.${o.id}.nazev`) }),
      h("span", { class: "bcard-desc", text: t(`odznak.${o.id}.popis`) }),
      h("span", { class: "bcard-state", text: ma ? t("odznaky.ziskano", { datum: datum(ziskane[o.id]) }) : t("odznaky.zamceno") })
    );
  });
  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/", nadpis: t("odznaky.nadpis") }),
    h("p", { class: "lead lead-center", text: t("odznaky.pocet", { n: pocet, z: ODZNAKY.length }) }),
    h("ul", { class: "badges" }, karty)
  );
  return { el, titulek: t("odznaky.nadpis") };
}
