// Výzva kamarádovi (D-033): odkaz #/souboj/<téma>/<obtížnost>/<čísla otázek>/<skóre> – kamarád zahraje stejné
// otázky ve stejném pořadí a na konci se porovná s výsledkem toho, kdo ho vyzval. Bez serveru: vše je v odkazu.
// Pokrok, hvězdy ani odznaky se nemění (každá obtížnost se dál hraje „naostro“ jen jednou).
import { t, jazyk } from "../i18n.js";
import { h, lista } from "../ui.js";
import { najdiTema, nactiTema, txt } from "../data.js";
import { sadaOtazek } from "../sada.js";
import { sdilej, adresaWebu } from "../sdileni.js";
import { konfety, zastavKonfety } from "../oslavy.js";

export const ID = "souboj";

/** Krátký zápis otázek do odkazu: „T146-05“ → „05“, oddělené tečkou. */
export function kodyOtazek(ids) {
  return ids.map((id) => id.slice(id.lastIndexOf("-") + 1)).join(".");
}

/** Odkaz na výzvu kamarádovi. */
export function odkazSouboje(temaId, obt, ids, skore) {
  return adresaWebu(`#/souboj/${temaId}/${obt}/${kodyOtazek(ids)}/${skore}`);
}

export async function vykresli([temaId, obt, kody, skoreText]) {
  const info = najdiTema(temaId);
  if (!info) return { presmeruj: "#/" };
  const data = await nactiTema(temaId);
  const podleId = new Map(data.otazky.map((q) => [q.id, q]));
  const polozky = kody.split(".").map((k) => podleId.get(`${temaId}-${k}`)).filter(Boolean).map((q) => ({ q, info }));
  const nazev = `${txt(info.tema.nazev, jazyk())} · ${t(`obtiznost.${obt}`)}`;
  const nadpis = t("souboj.nadpis");
  if (!polozky.length) {
    const el = h("main", { class: "screen" }, lista({ zpet: "#/", nadpis }),
      h("div", { class: "empty", "data-test": "souboj-chyba" }, h("p", { text: t("souboj.neplatny") }),
        h("a", { class: "btn btn-primary btn-big", href: "#/", text: t("vyzva.domu") })));
    return { el, titulek: nadpis };
  }
  const souper = Math.min(Number(skoreText) || 0, polozky.length);

  const sada = sadaOtazek({
    polozky,
    textPosledni: t("vyzva.vysledek"),
    naKonec: ({ spravne, odpovedi, telo }) => {
      const verdikt = spravne > souper ? "vyhra" : spravne === souper ? "remiza" : "prohra";
      const ids = odpovedi.map(([id]) => id);
      telo.replaceChildren(h("section", { class: "card procvic-konec", "data-test": "souboj-konec", "data-verdikt": verdikt },
        h("p", { class: "res-title", text: t(`souboj.${verdikt}`) }),
        h("div", { class: "souboj-skore" },
          h("span", {}, h("b", { text: `${spravne} / ${polozky.length}` }), h("span", { text: t("souboj.ty") })),
          h("span", { class: "souboj-vs", "aria-hidden": "true", text: "vs" }),
          h("span", {}, h("b", { text: `${souper} / ${polozky.length}` }), h("span", { text: t("souboj.kamarad") }))),
        h("button", { type: "button", class: "btn btn-primary btn-big", "data-test": "sdilet",
          onclick: () => sdilej({ text: t("souboj.odpoved", { tema: nazev, s: spravne, n: polozky.length, k: souper }), url: odkazSouboje(temaId, obt, ids, spravne) }) },
          h("span", { "aria-hidden": "true", text: "📤 " }), t("souboj.poslatZpet")),
        h("a", { class: "btn btn-sec btn-big", href: `#/tema/${temaId}`, text: t("souboj.hratTema") }),
        h("a", { class: "btn btn-sec btn-big", href: "#/", text: t("vyzva.domu") })));
      if (verdikt === "vyhra" && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) konfety();
    },
  });
  const el = h("main", { class: "screen screen-hra screen-souboj" },
    lista({ zpet: "#/", nadpis }),
    h("p", { class: "lead lead-center", "data-test": "souboj-uvod", text: t("souboj.uvod", { tema: nazev, s: souper, n: polozky.length }) }),
    ...sada.casti);
  return { el, titulek: nadpis, uklid: () => { sada.uklid(); zastavKonfety(); } };
}
