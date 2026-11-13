// Denní výzva (D-032) – 5 otázek dne, pro všechny stejných, jeden pokus za den. Rozehraná výzva přežije obnovení
// stránky (ukládá se po každé odpovědi). Po dokončení výsledek, série dní výzev a tlačítko Sdílet (D-032).
import { t, jazyk } from "../i18n.js";
import { h, lista } from "../ui.js";
import { dnes } from "../game.js";
import { vyzva, ulozVyzvu, dokonciVyzvu, serieVyzev } from "../progress.js";
import { vyberVyzvy, polozkyVyzvy } from "../vyzva.js";
import { sadaOtazek } from "../sada.js";
import { sdilej, adresaWebu } from "../sdileni.js";
import { konfety, zastavKonfety } from "../oslavy.js";

export const ID = "vyzva";

function datumTextem(iso) {
  const [r, m, d] = iso.split("-").map(Number);
  try {
    return new Date(r, m - 1, d).toLocaleDateString(jazyk() === "cs" ? "cs-CZ" : "en-GB", { day: "numeric", month: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

/** Řádek čtverečků 🟩🟥 podle odpovědí (pro výsledek i sdílení). */
export function ctverecky(odpovedi) {
  return odpovedi.map(([, , ok]) => (ok ? "🟩" : "🟥")).join("");
}

function vysledek(datum, v, polozky) {
  const { serie } = serieVyzev();
  const radek = ctverecky(v.odpovedi);
  const text = t("vyzva.sdiletText", { datum: datumTextem(datum), s: v.spravne, n: polozky.length, ctverecky: radek, serie });
  return h("section", { class: "card procvic-konec vyzva-konec", "data-test": "vyzva-konec" },
    h("p", { class: "res-title", text: v.spravne === polozky.length ? t("vyzva.perfektni") : t("vyzva.hotovo") }),
    h("p", { class: "vyzva-ctverecky", "aria-hidden": "true", text: radek }),
    h("p", { class: "res-score" }, h("b", { text: `${v.spravne} / ${polozky.length}` }), h("span", { text: t("procvic.spravne") })),
    h("p", { class: "procvic-zbyva", "data-test": "vyzva-serie", text: t("vyzva.serie", { n: serie }) }),
    h("button", { type: "button", class: "btn btn-primary btn-big", "data-test": "sdilet",
      onclick: () => sdilej({ text, url: adresaWebu("#/vyzva") }) },
      h("span", { "aria-hidden": "true", text: "📤 " }), t("sdileni.tlacitko")),
    h("p", { class: "note", text: t("vyzva.zitra") }),
    h("a", { class: "btn btn-sec btn-big", href: "#/", text: t("vyzva.domu") }));
}

export async function vykresli() {
  const datum = dnes();
  let v = vyzva(datum);
  if (!v) {
    ulozVyzvu(datum, await vyberVyzvy(datum), [], 0);
    v = vyzva(datum);
  }
  const polozky = await polozkyVyzvy(v.ids);
  const nadpis = t("vyzva.nadpis");
  const hlavicka = [lista({ zpet: "#/", nadpis }), h("p", { class: "lead lead-center", "data-test": "vyzva-datum", text: t("vyzva.podnadpis", { datum: datumTextem(datum), n: polozky.length }) })];

  if (v.hotovo || v.odpovedi.length >= polozky.length) {
    if (!v.hotovo) dokonciVyzvu(datum, v.spravne);
    const el = h("main", { class: "screen screen-vyzva" }, ...hlavicka, vysledek(datum, vyzva(datum), polozky));
    return { el, titulek: nadpis };
  }

  const sada = sadaOtazek({
    polozky,
    odpovedi0: v.odpovedi,
    textPosledni: t("vyzva.vysledek"),
    naOdpoved: (_q, _k, _ok, odpovedi) => {
      // ke každé odpovědi i 1/0 = správně/špatně (Domů ukáže čtverečky bez načítání otázek)
      const sOk = odpovedi.map(([id, k]) => [id, k, polozky.find((x) => x.q.id === id)?.q.spravne === k ? 1 : 0]);
      ulozVyzvu(datum, v.ids, sOk, sOk.filter((x) => x[2]).length);
    },
    naKonec: ({ spravne, telo }) => {
      dokonciVyzvu(datum, spravne);
      telo.replaceChildren(vysledek(datum, vyzva(datum), polozky));
      if (spravne === polozky.length && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) konfety();
    },
  });
  const el = h("main", { class: "screen screen-hra screen-vyzva" }, ...hlavicka, ...sada.casti);
  return { el, titulek: nadpis, uklid: () => { sada.uklid(); zastavKonfety(); } };
}
