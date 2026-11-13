// Přehled odpovědí dohraného kola (D-013): každá otázka s tvou odpovědí, správnou odpovědí a vysvětlením.
// Překlad podle nastavení (vždy / na ťuknutí / vypnuto). Jen ke čtení – kolo se znovu hrát nedá.
import { t, jazyk } from "../i18n.js";
import { h, lista, hvezdicky } from "../ui.js";
import { najdiTema, nactiTema, idx, txt } from "../data.js";
import { vysledek } from "../progress.js";
import { nast, jazykPrekladu, PREKLAD } from "../settings.js";
import { tlacitkoSbirky } from "../sbirka.js";

export const ID = "prehled";
const PISMENA = ["A", "B", "C", "D", "E", "F"];

export async function vykresli([temaId, obt]) {
  const info = najdiTema(temaId);
  if (!info) return { presmeruj: "#/kategorie" };
  const v = vysledek(temaId, obt);
  if (!v) return { presmeruj: `#/tema/${temaId}` };

  const data = await nactiTema(temaId);
  const podleId = new Map(data.otazky.map((q) => [q.id, q]));
  const s = nast();
  const jo = s.otazky;
  const jp = jazykPrekladu(s, idx().jazyky || undefined);
  const vzdy = s.preklad === PREKLAD.VZDY;

  function dvojice(obj, trida) {
    const wrap = h("span", { class: trida }, h("span", { class: "orig", lang: jo, text: txt(obj, jo) }));
    if (jp !== jo && obj && obj[jp] && obj[jp] !== obj[jo]) {
      wrap.append(h("span", { class: "tr", lang: jp, text: obj[jp], hidden: !vzdy }));
    }
    return wrap;
  }

  const karty = v.odpovedi.map(([id, volba], i) => {
    const q = podleId.get(id);
    if (!q) return null; // otázka mezitím zmizela z dat
    const ok = volba === q.spravne;
    const moznosti = (q.moznosti[jo] || []).map((_, k) => {
      const tr = k === q.spravne ? "ans done ok" : k === volba ? "ans done bad" : "ans done";
      return h("li", {},
        h("div", { class: tr, "data-index": String(k) },
          h("span", { class: "ans-l", "aria-hidden": "true", text: PISMENA[k] }),
          dvojice({ [jo]: q.moznosti[jo]?.[k], [jp]: q.moznosti[jp]?.[k] }, "ans-t"),
          h("span", { class: "ans-s", "aria-hidden": "true", text: k === q.spravne ? "✓" : k === volba ? "✗" : "" }),
          k === q.spravne ? h("span", { class: "sr-only", text: t("hra.spravnaOdpoved") }) : null,
          k === volba && !ok ? h("span", { class: "sr-only", text: t("hra.tvojeOdpoved") }) : null));
    });
    const karta = h(
      "article",
      { class: `card review ${ok ? "is-ok" : "is-bad"}`, "data-qid": id },
      h("p", { class: "review-head" },
        h("span", { class: "review-n", text: t("prehled.otazka", { i: i + 1, n: v.odpovedi.length }) }),
        h("span", { class: `review-verdict ${ok ? "ok" : "bad"}`, text: ok ? `✓ ${t("hra.spravne")}` : `✗ ${t("hra.spatne")}` })),
      h("h2", { class: "review-q" }, dvojice(q.otazka, "qtext")),
      h("ol", { class: "answers answers-review" }, moznosti),
      h("div", { class: "explain explain-review" },
        h("p", { class: "dyk", text: t("hra.vedeliJste") }),
        h("p", {}, dvojice(q.vysvetleni, "explain-t")),
        tlacitkoSbirky(q, temaId))
    );
    if (s.preklad === PREKLAD.TUKNUTI && karta.querySelector(".tr")) {
      const btn = h("button", {
        type: "button",
        class: "trbtn",
        "aria-pressed": "false",
        "data-test": "prelozit",
        onclick: () => {
          btn.setAttribute("aria-pressed", "true");
          karta.querySelectorAll(".tr").forEach((e) => (e.hidden = false));
          btn.remove();
        },
      }, h("span", { "aria-hidden": "true", text: "🌐" }), t("hra.prelozit", { jazyk: t(`jazyky.${jp}.kod`) }));
      karta.querySelector(".review-q").after(btn);
    }
    return karta;
  });

  const el = h(
    "main",
    { class: "screen screen-prehled", "data-tema": temaId, "data-obtiznost": obt },
    lista({ zpet: `#/tema/${temaId}`, nadpis: t("prehled.nadpis") }),
    h("div", { class: "review-sum" },
      h("p", { class: "res-topic", text: `${txt(info.tema.nazev, jazyk())} · ${t(`obtiznost.${obt}`)}` }),
      hvezdicky(v.pul, 5, "stars stars-diff"),
      h("p", { class: "review-score", "data-test": "skore", text: t("prehled.skore", { s: v.s, c: v.c }) })),
    h("div", { class: "cards" }, karty),
    h("a", { class: "btn btn-sec btn-big review-back", href: `#/kategorie/${info.kategorie.id}` }, t("vysledek.zpetTemata"))
  );
  return { el, titulek: t("prehled.nadpis") };
}
