// Statistiky (D-021) – úspěšnost celkem, podle obtížnosti a podle kategorií, hvězdy, rekordy a jazyk otázek.
// Počítá se jen z dohraných kol témat, která jsou na webu (rozehraná kola se nepočítají).
import { t, jazyk } from "../i18n.js";
import { h, lista, celeHvezdy, ikonaKategorie } from "../ui.js";
import { najdiTema, viditelneKategorie, viditelnaTemata, OBTIZNOSTI, txt } from "../data.js";
import { pokrok, hvezdyCelkem, hvezdyKategorie, uzavrenaVKategorii } from "../progress.js";
import { ODEMCENI_PULHVEZD, MAX_HVEZD } from "../game.js";

export const ID = "statistiky";

const procent = (s, c) => (c ? Math.round((s / c) * 100) : null);
const pct = (n) => (n == null ? "–" : t("domu.procent", { n }));

/** Ukazatel s popiskem: název vlevo, procenta vpravo, pod tím pruh a doplňující řádek. */
function radek({ ikona, nazev, s, c, meta, test }) {
  const p = procent(s, c);
  return h("div", { class: "srow", "data-test": test },
    h("div", { class: "srow-top" },
      ikona || null,
      h("span", { class: "srow-name", text: nazev }),
      h("b", { class: "srow-pct", text: pct(p) })),
    h("div", { class: "meter", role: "img", "aria-label": pct(p) }, h("i", { style: { width: `${p || 0}%` } })),
    h("span", { class: "srow-meta", text: meta }));
}

function dlazdice(hodnota, popis, test) {
  return h("div", { class: "stat", "data-test": test }, h("b", { text: hodnota }), h("span", { text: popis }));
}

export function vykresli() {
  // všechna dohraná kola témat, která jsou na webu
  const kola = [];
  for (const [temaId, obtiznosti] of Object.entries(pokrok().vysledky)) {
    const info = najdiTema(temaId);
    if (!info) continue;
    for (const [obt, v] of Object.entries(obtiznosti || {})) if (v && v.c > 0) kola.push({ info, obt, v });
  }
  const sum = (seznam) => seznam.reduce((a, k) => ({ s: a.s + k.v.s, c: a.c + k.v.c }), { s: 0, c: 0 });

  if (!kola.length) {
    const el = h("main", { class: "screen" },
      lista({ zpet: "#/", nadpis: t("statistiky.nadpis") }),
      h("div", { class: "empty", "data-test": "stat-prazdne" },
        h("p", { text: t("statistiky.prazdne") }),
        h("a", { class: "btn btn-primary btn-big", href: "#/", text: t("statistiky.hrat") })));
    return { el, titulek: t("statistiky.nadpis") };
  }

  const celkem = sum(kola);
  const hv = hvezdyCelkem();
  const kats = viditelneKategorie();
  const uzavrenych = kats.reduce((a, k) => { const u = uzavrenaVKategorii(k); return { x: a.x + u.x, t: a.t + u.t }; }, { x: 0, t: 0 });
  const p = pokrok();

  // 1. celkem
  const souhrn = h("section", { class: "card stat-hero", "data-test": "stat-celkem" },
    h("p", { class: "label", text: t("statistiky.uspesnost") }),
    h("b", { class: "stat-big", text: pct(procent(celkem.s, celkem.c)) }),
    h("div", { class: "meter meter-big" }, h("i", { style: { width: `${procent(celkem.s, celkem.c)}%` } })),
    h("p", { class: "srow-meta", text: t("statistiky.spravneZ", { s: celkem.s, c: celkem.c }) }));
  const tri = h("div", { class: "stats stats-3" },
    dlazdice(String(kola.length), t("statistiky.kol", { n: kola.length }), "stat-kol"),
    dlazdice(`${celeHvezdy(hv.pul)} / ${celeHvezdy(hv.max)}`, t("domu.hvezd"), "stat-hvezdy"),
    dlazdice(`${uzavrenych.x} / ${uzavrenych.t}`, t("statistiky.temat"), "stat-temata"));

  // 2. podle obtížnosti
  const obtiznosti = h("section", { class: "card sgroup" },
    h("h2", { class: "sgroup-h", text: t("statistiky.podleObtiznosti") }),
    OBTIZNOSTI.map((o) => {
      const k = kola.filter((x) => String(x.obt) === o);
      const s = sum(k);
      return radek({ nazev: t(`obtiznost.${o}`), s: s.s, c: s.c, test: `stat-obt-${o}`,
        meta: k.length ? t("statistiky.kolaMeta", { n: k.length, s: s.s, c: s.c }) : t("statistiky.nehrano") });
    }));

  // 3. podle kategorií
  const kategorie = h("section", { class: "card sgroup" },
    h("h2", { class: "sgroup-h", text: t("statistiky.podleKategorii") }),
    kats.map((kat) => {
      const ids = new Set(viditelnaTemata(kat).map((x) => x.id));
      const s = sum(kola.filter((x) => ids.has(x.info.tema.id)));
      const hk = hvezdyKategorie(kat);
      const u = uzavrenaVKategorii(kat);
      return radek({ ikona: ikonaKategorie(kat, "srow-ico"), nazev: txt(kat.nazev, jazyk()), s: s.s, c: s.c, test: `stat-kat-${kat.id}`,
        meta: `${celeHvezdy(hk.pul)} / ${celeHvezdy(hk.max)} ★ · ${t("kategorie.dohrano", { x: u.x, n: u.t })}` });
    }));

  // 4. hvězdy – kolik kol skončilo jak
  const bezChyby = kola.filter((k) => k.v.pul >= MAX_HVEZD * 2).length;
  const odemyka = kola.filter((k) => k.v.pul >= ODEMCENI_PULHVEZD && k.v.pul < MAX_HVEZD * 2).length;
  const hvezdy = h("section", { class: "card sgroup" },
    h("h2", { class: "sgroup-h", text: t("statistiky.hvezdy") }),
    h("div", { class: "stats stats-3 stats-in" },
      dlazdice(String(bezChyby), t("statistiky.kolaPlna"), "stat-plna"),
      dlazdice(String(odemyka), t("statistiky.kolaOdemyka"), "stat-odemyka"),
      dlazdice(String(kola.length - bezChyby - odemyka), t("statistiky.kolaPod"), "stat-pod")));

  // 5. rekordy
  const dniSHrou = new Set(kola.map((k) => k.v.datum).filter(Boolean)).size;
  const nejlepsi = kola
    .reduce((m, k) => {
      const id = k.info.tema.id;
      m.set(id, { info: k.info, s: (m.get(id)?.s || 0) + k.v.s, c: (m.get(id)?.c || 0) + k.v.c });
      return m;
    }, new Map());
  const top = [...nejlepsi.values()].sort((a, b) => b.s / b.c - a.s / a.c || b.c - a.c)[0];
  const zaznam = (popis, hodnota, test, tr = "rec") => h("li", { class: tr, "data-test": test }, h("span", { text: popis }), h("b", { text: hodnota }));
  const rekordy = h("section", { class: "card sgroup" },
    h("h2", { class: "sgroup-h", text: t("statistiky.rekordy") }),
    h("ul", { class: "recs" },
      zaznam(t("statistiky.nejdelsiRada"), `🔥 ${p.stat.nejdelsiRada || 0}`, "stat-rada"),
      zaznam(t("statistiky.nejdelsiSerieDni"), t("domu.dni", { n: p.dny.nejdelsi || 0 }), "stat-dny"),
      zaznam(t("statistiky.dniSHrou"), String(dniSHrou), "stat-dni-hra"),
      top ? zaznam(t("statistiky.nejlepsiTema"), `${txt(top.info.tema.nazev, jazyk())} · ${pct(procent(top.s, top.c))}`, "stat-top", "rec rec-col") : null));

  // 6. jazyk otázek (jen kola, u kterých se jazyk ukládá – od D-021)
  const jazyky = [...new Set(kola.map((k) => k.v.j).filter(Boolean))].sort();
  const jazykSekce = jazyky.length
    ? h("section", { class: "card sgroup" },
        h("h2", { class: "sgroup-h", text: t("statistiky.jazykOtazek") }),
        jazyky.map((j) => {
          const k = kola.filter((x) => x.v.j === j);
          const s = sum(k);
          return radek({ nazev: t(`jazyky.${j}.vlastni`), s: s.s, c: s.c, test: `stat-jazyk-${j}`, meta: t("statistiky.kolaMeta", { n: k.length, s: s.s, c: s.c }) });
        }))
    : null;

  const el = h("main", { class: "screen screen-statistiky" },
    lista({ zpet: "#/", nadpis: t("statistiky.nadpis") }),
    h("div", { class: "cards" }, souhrn, tri, obtiznosti, kategorie, hvezdy, rekordy, jazykSekce));
  return { el, titulek: t("statistiky.nadpis") };
}
