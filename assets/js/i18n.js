// Texty rozhraní. Všechny jsou v assets/i18n/<jazyk>.json – v kódu žádné natvrdo.
// t(klíč, { n: 3, nazev: "…" }) – {n} a další parametry se dosadí,
// hodnota může být i objekt s tvary množného čísla (one / few / many / other).
export const JAZYKY_ROZHRANI = ["cs", "en"];

const slovniky = {};
let aktivni = "cs";

export async function nactiTexty() {
  await Promise.all(
    JAZYKY_ROZHRANI.map(async (j) => {
      const r = await fetch(`assets/i18n/${j}.json`, { cache: "no-cache" });
      if (!r.ok) throw new Error(`i18n ${j}: HTTP ${r.status}`);
      slovniky[j] = await r.json();
    })
  );
}

export function nastavJazyk(j) {
  aktivni = JAZYKY_ROZHRANI.includes(j) ? j : "cs";
  document.documentElement.lang = aktivni;
}

export function jazyk() {
  return aktivni;
}

function najdi(slovnik, klic) {
  return klic.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), slovnik);
}

export function t(klic, param = {}, j = aktivni) {
  let v = najdi(slovniky[j], klic);
  if (v && typeof v === "object" && "n" in param) {
    const tvar = new Intl.PluralRules(j).select(param.n);
    v = v[tvar] ?? v.other;
  }
  if (typeof v !== "string") {
    console.warn(`Chybí text: ${j}.${klic}`);
    return `⟦${klic}⟧`; // nápadná značka – test průchodu ji hledá
  }
  return v.replace(/\{(\w+)\}/g, (_, k) => (k in param ? String(param[k]) : `{${k}}`));
}

/** Jazyk prohlížeče, pokud ho rozhraní umí; jinak angličtina (čeština jen pro české prohlížeče). */
export function jazykProhlizece() {
  const seznam = navigator.languages?.length ? navigator.languages : [navigator.language || "en"];
  for (const l of seznam) {
    const k = String(l).slice(0, 2).toLowerCase();
    if (k === "sk") return "cs"; // slovenštině je čeština bližší
    if (JAZYKY_ROZHRANI.includes(k)) return k;
  }
  return "en";
}
