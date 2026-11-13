// Statistiky (D-021; kalendář aktivity a měsíční souhrn D-038) – úspěšnost celkem, podle obtížnosti a podle kategorií, hvězdy, rekordy a jazyk otázek.
// Úspěšnost (celkem, obtížnost, kategorie, jazyk), nejlepší téma a nejdelší série počítají i odpovědi
// z rozehraných kol (D-022); hvězdy, „jak dopadla kola“ a dny hraní jen dohraná kola. Jen témata na webu.
import { t, jazyk } from "../i18n.js";
import { h, lista, celeHvezdy, ikonaKategorie } from "../ui.js";
import { najdiTema, nactiTema, viditelneKategorie, viditelnaTemata, OBTIZNOSTI, txt } from "../data.js";
import { pokrok, hvezdyCelkem, hvezdyKategorie, uzavrenaVKategorii, serieVyzev, urovenHrace, tydenniCil } from "../progress.js";
import { ODEMCENI_PULHVEZD, MAX_HVEZD } from "../game.js";
import { kalendarAktivity, kartaMesice, mesicKlic } from "../aktivita.js";

export const ID = "statistiky";

const procent = (s, c) => (c ? Math.round((s / c) * 100) : null);
const pct = (n) => (n == null ? "–" : t("domu.procent", { n }));

/** Pruh jako u otázky: zeleně správné, za nimi barevně špatné (D-023). */
function pruh(s, c, trida = "meter") {
  const w = (x) => ({ width: `${c ? (x / c) * 100 : 0}%` });
  return h("div", { class: trida, role: "img", "aria-label": pct(procent(s, c)) },
    h("i", { class: "m-ok", style: w(s) }), h("i", { class: "m-bad", style: w(c - s) }));
}

/** Ukazatel s popiskem: název vlevo, procenta vpravo, pod tím pruh a doplňující řádek. */
function radek({ ikona, nazev, s, c, meta, test }) {
  const p = procent(s, c);
  return h("div", { class: "srow", "data-test": test },
    h("div", { class: "srow-top" },
      ikona || null,
      h("span", { class: "srow-name", text: nazev }),
      h("b", { class: "srow-pct", text: pct(p) })),
    pruh(s, c),
    h("span", { class: "srow-meta", text: meta }));
}

function dlazdice(hodnota, popis, test) {
  return h("div", { class: "stat", "data-test": test }, h("b", { text: hodnota }), h("span", { text: popis }));
}

/** Rozehraná kola s aspoň jednou odpovědí: { info, obt, v: { s, c, j, r } }. Správnost se zjistí z otázek tématu. */
async function rozehranaKola() {
  const vysl = [];
  const polozky = Object.entries(pokrok().rozehrano || {})
    .map(([klic, kolo]) => { const [temaId, obt] = klic.split("|"); return { info: najdiTema(temaId), obt, kolo }; })
    .filter((x) => x.info && x.kolo?.odpovedi?.length);
  await Promise.all(polozky.map(async ({ info, obt, kolo }) => {
    try {
      const data = await nactiTema(info.tema.id);
      const spravna = new Map(data.otazky.map((q) => [q.id, q.spravne]));
      const odp = kolo.odpovedi.filter(([id]) => spravna.has(id));
      if (!odp.length) return;
      const s = odp.filter(([id, k]) => spravna.get(id) === k).length;
      vysl.push({ info, obt, rozehrane: true, v: { s, c: odp.length, j: kolo.j, r: kolo.nejdelsiRada || 0 } });
    } catch { /* téma se nenačetlo – rozehrané kolo se jen nezapočítá */ }
  }));
  return vysl;
}

export async function vykresli() {
  // dohraná kola témat, která jsou na webu
  const kola = [];
  for (const [temaId, obtiznosti] of Object.entries(pokrok().vysledky)) {
    const info = najdiTema(temaId);
    if (!info) continue;
    for (const [obt, v] of Object.entries(obtiznosti || {})) if (v && v.c > 0) kola.push({ info, obt, v });
  }
  const roz = await rozehranaKola();
  const vse = [...kola, ...roz]; // pro úspěšnost: dohraná i rozehraná kola
  const sum = (seznam) => seznam.reduce((a, k) => ({ s: a.s + k.v.s, c: a.c + k.v.c }), { s: 0, c: 0 });
  /** „2 dohraná kola · 1 rozehrané kolo · 17 z 25 správně“ */
  const meta = (seznam) => {
    const n = seznam.filter((x) => !x.rozehrane).length;
    const m = seznam.length - n;
    const s = sum(seznam);
    if (!seznam.length) return t("statistiky.nehrano");
    return [n ? t("statistiky.dohranych", { n }) : null, m ? t("statistiky.rozehranych", { n: m }) : null, t("statistiky.spravneKratce", { s: s.s, c: s.c })]
      .filter(Boolean).join(" · ");
  };

  const vyzevHotovo = Object.values(pokrok().vyzvy || {}).filter((x) => x?.hotovo).length; // D-032
  if (!vse.length && !vyzevHotovo) {
    const el = h("main", { class: "screen" },
      lista({ zpet: "#/", nadpis: t("statistiky.nadpis") }),
      h("div", { class: "empty", "data-test": "stat-prazdne" },
        h("p", { text: t("statistiky.prazdne") }),
        h("a", { class: "btn btn-primary btn-big", href: "#/", text: t("statistiky.hrat") })));
    return { el, titulek: t("statistiky.nadpis") };
  }

  const celkem = sum(vse);
  const hv = hvezdyCelkem();
  const kats = viditelneKategorie();
  const uzavrenych = kats.reduce((a, k) => { const u = uzavrenaVKategorii(k); return { x: a.x + u.x, t: a.t + u.t }; }, { x: 0, t: 0 });
  const p = pokrok();

  // 1. celkem
  const souhrn = h("section", { class: "card stat-hero", "data-test": "stat-celkem" },
    h("p", { class: "label", text: t("statistiky.uspesnost") }),
    h("b", { class: "stat-big", text: pct(procent(celkem.s, celkem.c)) }),
    pruh(celkem.s, celkem.c, "meter meter-big"),
    h("p", { class: "srow-meta", text: t("statistiky.spravneZ", { s: celkem.s, c: celkem.c }) }),
    roz.length ? h("p", { class: "srow-meta", "data-test": "stat-vcetne", text: t("statistiky.vcetneRozehranych", { n: roz.length }) }) : null);
  const tri = h("div", { class: "stats stats-3" },
    dlazdice(String(kola.length), t("statistiky.kol", { n: kola.length }), "stat-kol"),
    dlazdice(`${celeHvezdy(hv.pul)} / ${celeHvezdy(hv.max)}`, t("domu.hvezd"), "stat-hvezdy"),
    dlazdice(`${uzavrenych.x} / ${uzavrenych.t}`, t("statistiky.temat"), "stat-temata"));

  // 2. podle obtížnosti
  const obtiznosti = h("section", { class: "card sgroup" },
    h("h2", { class: "sgroup-h", text: t("statistiky.podleObtiznosti") }),
    OBTIZNOSTI.map((o) => {
      const k = vse.filter((x) => String(x.obt) === o);
      const s = sum(k);
      return radek({ nazev: t(`obtiznost.${o}`), s: s.s, c: s.c, test: `stat-obt-${o}`, meta: meta(k) });
    }));

  // 3. podle kategorií
  const kategorie = h("section", { class: "card sgroup" },
    h("h2", { class: "sgroup-h", text: t("statistiky.podleKategorii") }),
    // seřazeno od nejúspěšnější (D-025); při shodě víc odpovědí výš, nehrané kategorie na konci v původním pořadí
    kats
      .map((kat, poradi) => {
        const ids = new Set(viditelnaTemata(kat).map((x) => x.id));
        return { kat, poradi, ...sum(vse.filter((x) => ids.has(x.info.tema.id))) };
      })
      .sort((a, b) => (!a.c || !b.c ? !a.c - !b.c || a.poradi - b.poradi : b.s / b.c - a.s / a.c || b.c - a.c || a.poradi - b.poradi))
      .map(({ kat, s, c }) => {
        const hk = hvezdyKategorie(kat);
        const u = uzavrenaVKategorii(kat);
        return radek({ ikona: ikonaKategorie(kat, "srow-ico"), nazev: txt(kat.nazev, jazyk()), s, c, test: `stat-kat-${kat.id}`,
          meta: `${celeHvezdy(hk.pul)} / ${celeHvezdy(hk.max)} ★ · ${t("kategorie.dohrano", { x: u.x, n: u.t })}` });
      }));

  // 4. hvězdy – kolik kol skončilo jak
  const bezChyby = kola.filter((k) => k.v.pul >= MAX_HVEZD * 2).length;
  const odemyka = kola.filter((k) => k.v.pul >= ODEMCENI_PULHVEZD && k.v.pul < MAX_HVEZD * 2).length;
  const hvezdy = !kola.length ? null : h("section", { class: "card sgroup" },
    h("h2", { class: "sgroup-h", text: t("statistiky.hvezdy") }),
    h("div", { class: "stats stats-3 stats-in" },
      dlazdice(String(bezChyby), t("statistiky.kolaPlna"), "stat-plna"),
      dlazdice(String(odemyka), t("statistiky.kolaOdemyka"), "stat-odemyka"),
      dlazdice(String(kola.length - bezChyby - odemyka), t("statistiky.kolaPod"), "stat-pod")));

  // 5. rekordy
  const dniSHrou = new Set(kola.map((k) => k.v.datum).filter(Boolean)).size;
  const nejlepsi = vse
    .reduce((m, k) => {
      const id = k.info.tema.id;
      m.set(id, { info: k.info, s: (m.get(id)?.s || 0) + k.v.s, c: (m.get(id)?.c || 0) + k.v.c });
      return m;
    }, new Map());
  // nejlepší téma: aspoň 5 odpovědí (aby jedna šťastná odpověď nebyla „100 %“), jinak z čehokoli
  const temata = [...nejlepsi.values()];
  const kandidati = temata.some((x) => x.c >= 5) ? temata.filter((x) => x.c >= 5) : temata;
  const top = kandidati.sort((a, b) => b.s / b.c - a.s / a.c || b.c - a.c)[0];
  const nejdelsiRada = Math.max(p.stat.nejdelsiRada || 0, ...roz.map((x) => x.v.r));
  const zaznam = (popis, hodnota, test, tr = "rec") => h("li", { class: tr, "data-test": test }, h("span", { text: popis }), h("b", { text: hodnota }));
  const rekordy = h("section", { class: "card sgroup" },
    h("h2", { class: "sgroup-h", text: t("statistiky.rekordy") }),
    h("ul", { class: "recs" },
      zaznam(t("statistiky.uroven"), `${urovenHrace().uroven} · ${t(`uroven.titul.${urovenHrace().titul}`)} · ${t("uroven.bodu", { n: urovenHrace().body })}`, "stat-uroven", "rec rec-col"),
      zaznam(t("statistiky.tyden"), `${tydenniCil().hotovo} / ${tydenniCil().cil} · 🔥 ${t("tyden.tydnu", { n: tydenniCil().serie })}`, "stat-tyden"),
      zaznam(t("statistiky.nejdelsiRada"), `🔥 ${nejdelsiRada}`, "stat-rada"),
      zaznam(t("statistiky.nejdelsiSerieDni"), t("domu.dni", { n: p.dny.nejdelsi || 0 }), "stat-dny"),
      zaznam(t("statistiky.dniSHrou"), String(dniSHrou), "stat-dni-hra"),
      zaznam(t("statistiky.vyzvy"), `${vyzevHotovo} · 🔥 ${t("domu.dni", { n: serieVyzev().nejdelsi })}`, "stat-vyzvy"),
      top ? zaznam(t("statistiky.nejlepsiTema"), `${txt(top.info.tema.nazev, jazyk())} · ${pct(procent(top.s, top.c))}`, "stat-top", "rec rec-col") : null));

  // 6. jazyk otázek (jen kola, u kterých se jazyk ukládá – od D-021)
  const jazyky = [...new Set(vse.map((k) => k.v.j).filter(Boolean))].sort();
  const jazykSekce = jazyky.length
    ? h("section", { class: "card sgroup" },
        h("h2", { class: "sgroup-h", text: t("statistiky.jazykOtazek") }),
        jazyky.map((j) => {
          const k = vse.filter((x) => x.v.j === j);
          const s = sum(k);
          return radek({ nazev: t(`jazyky.${j}.vlastni`), s: s.s, c: s.c, test: `stat-jazyk-${j}`, meta: meta(k) });
        }))
    : null;

  const el = h("main", { class: "screen screen-statistiky" },
    lista({ zpet: "#/", nadpis: t("statistiky.nadpis") }),
    h("div", { class: "cards" }, souhrn, tri,
      // kalendář aktivity a souhrn tohoto a minulého měsíce (D-038)
      kalendarAktivity(), kartaMesice(mesicKlic(), { test: "mesic-ted", aktualni: true }), kartaMesice(mesicKlic(new Date(), -1), { test: "mesic-minuly" }),
      obtiznosti, kategorie, hvezdy, rekordy, jazykSekce));
  return { el, titulek: t("statistiky.nadpis") };
}
