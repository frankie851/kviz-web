// Kalendář aktivity a měsíční souhrn (D-038). Kalendář: posledních 12 týdnů (sloupec = týden od pondělí,
// řádek = den), barva čtverečku podle počtu dohraných kol a denních výzev toho dne. Souhrn měsíce: kola,
// otázky, úspěšnost, hvězdy, dny s hrou, nejlepší kategorie a nová úroveň, s tlačítkem Sdílet.
import { t, jazyk } from "./i18n.js";
import { h } from "./ui.js";
import { txt } from "./data.js";
import { dnes } from "./game.js";
import { aktivitaDni, souhrnMesice } from "./progress.js";
import { sdilej, adresaWebu } from "./sdileni.js";

export const TYDNU = 12;
const loc = () => (jazyk() === "cs" ? "cs-CZ" : "en-GB");
const datum = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);

/** Úroveň barvy čtverečku 0–4 podle počtu kol a výzev za den. */
export const stupen = (n) => (n <= 0 ? 0 : n >= 4 ? 4 : n);

/** „RRRR-MM“ měsíce, ve kterém je datum (posun o n měsíců). */
export function mesicKlic(d = new Date(), posun = 0) {
  const x = new Date(d.getFullYear(), d.getMonth() + posun, 1, 12);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
}

/** Název měsíce v 1. pádě („listopad“, „November“). */
export function nazevMesice(klic) {
  const [r, m] = klic.split("-").map(Number);
  const d = new Date(r, m - 1, 1, 12);
  try { return d.toLocaleDateString(loc(), { month: "long" }); } catch { return klic; }
}

/** Karta Kalendář aktivity do Statistik. */
export function kalendarAktivity(dnesDen = new Date()) {
  const akt = aktivitaDni();
  const dnesni = datum(dnesDen);
  const posun = (dnesni.getDay() + 6) % 7; // 0 = pondělí
  const start = new Date(dnesni.getFullYear(), dnesni.getMonth(), dnesni.getDate() - posun - (TYDNU - 1) * 7, 12);
  const dnyNazvy = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12);
    return d.toLocaleDateString(loc(), { weekday: "short" });
  });
  const mriz = h("div", { class: "kal-mriz", role: "img", "data-test": "kalendar-mriz" });
  // hlavička s měsíci: zkratka nad týdnem, ve kterém měsíc začíná; nad prvním sloupcem jen tehdy,
  // když další měsíc nezačíná hned v 1.–3. týdnu (zkratky by se překrývaly)
  mriz.append(h("span", { class: "kal-roh", "aria-hidden": "true" }));
  const tydny = Array.from({ length: TYDNU }, (_, w) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + 6, 12));
  const zacatky = tydny.map((ne, w) => w > 0 && ne.getDate() <= 7);
  const kratce = (d) => d.toLocaleDateString(loc(), { month: "short" }).replace(/\.$/, "");
  tydny.forEach((ne, w) => {
    const popis = zacatky[w] ? kratce(ne) : w === 0 && !zacatky.slice(1, 3).some(Boolean) ? kratce(start) : "";
    mriz.append(h("span", { class: "kal-mesic", "aria-hidden": "true", text: popis }));
  });
  let dniSHrou = 0;
  let celkem = 0;
  for (let den = 0; den < 7; den += 1) {
    mriz.append(h("span", { class: "kal-den", "aria-hidden": "true", text: den % 2 === 0 ? dnyNazvy[den] : "" }));
    for (let w = 0; w < TYDNU; w += 1) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + den, 12);
      const klic = dnes(d);
      if (d > dnesni) { mriz.append(h("span", { class: "kal-c kal-budouci" })); continue; }
      const n = akt.get(klic) || 0;
      if (n) { dniSHrou += 1; celkem += n; }
      const popis = `${d.toLocaleDateString(loc(), { day: "numeric", month: "numeric" })}: ${n ? t("kalendar.aktivit", { n }) : t("kalendar.nic")}`;
      mriz.append(h("span", {
        class: `kal-c kal-${stupen(n)}${klic === dnes(dnesni) ? " kal-dnes" : ""}`, title: popis, "data-datum": klic, "data-n": String(n),
      }));
    }
  }
  mriz.setAttribute("aria-label", t("kalendar.aria", { n: dniSHrou, t: TYDNU }));
  return h("section", { class: "card sgroup kalendar", "data-test": "kalendar" },
    h("h2", { class: "sgroup-h", text: t("kalendar.nadpis") }),
    mriz,
    h("div", { class: "kal-pata" },
      h("span", { class: "srow-meta", "data-test": "kalendar-dni", text: t("kalendar.dni", { n: dniSHrou, t: TYDNU }) }),
      h("span", { class: "kal-legenda", "aria-hidden": "true" },
        h("span", { text: t("kalendar.mene") }),
        ...[0, 1, 2, 3, 4].map((i) => h("span", { class: `kal-c kal-${i}` })),
        h("span", { text: t("kalendar.vice") }))),
    celkem ? null : h("p", { class: "srow-meta", text: t("kalendar.prazdny") }));
}

/** Text ke sdílení souhrnu měsíce. */
export function textSouhrnu(klic, s) {
  const casti = [t("mesic.kol", { n: s.kol }), t("mesic.otazek", { n: s.otazek })];
  if (s.procent != null) casti.push(t("mesic.procentSpravne", { n: s.procent }));
  if (s.vyzev) casti.push(t("mesic.vyzev", { n: s.vyzev }));
  let text = t("mesic.sdiletText", { mesic: nazevMesice(klic), casti: casti.join(", ") });
  if (s.nejlepsi) text += ` ${t("mesic.sdiletNejlepsi", { kat: txt(s.nejlepsi.kat.nazev, jazyk()), n: s.nejlepsi.procent })}`;
  if (s.urovenDo > s.urovenOd) text += ` ${t("mesic.sdiletUroven", { n: s.urovenDo })}`;
  return `${text} ${t("mesic.sdiletKonec")}`;
}

/**
 * Karta souhrnu měsíce „RRRR-MM“ (null, když hráč v měsíci nehrál). zavrit = funkce pro ✕ (karta na Domů).
 */
export function kartaMesice(klic, { zavrit, test = "mesic", aktualni = false, kratce = false } = {}) {
  const s = souhrnMesice(klic);
  if (!s) return null;
  const nazev = nazevMesice(klic);
  const udaj = (hodnota, popis, tst) => h("div", { class: "stat", "data-test": tst }, h("b", { text: hodnota }), h("span", { text: popis }));
  const radky = [
    s.nejlepsi ? h("li", { class: "rec rec-col", "data-test": `${test}-nejlepsi` }, h("span", { text: t("mesic.nejlepsi") }),
      h("b", { text: `${txt(s.nejlepsi.kat.nazev, jazyk())} · ${t("domu.procent", { n: s.nejlepsi.procent })}` })) : null,
    s.vyzev ? h("li", { class: "rec", "data-test": `${test}-vyzvy` }, h("span", { text: t("mesic.vyzvy") }), h("b", { text: String(s.vyzev) })) : null,
    s.urovenDo > s.urovenOd ? h("li", { class: "rec", "data-test": `${test}-uroven` }, h("span", { text: t("mesic.uroven") }),
      h("b", { text: `${s.urovenOd} → ${s.urovenDo}` })) : null,
  ].filter(Boolean);
  return h("section", { class: "card sgroup mesic-karta", "data-test": test, "data-mesic": klic },
    h("div", { class: "mesic-hlava" },
      h("h2", { class: "sgroup-h", text: aktualni ? t("mesic.nadpisAktualni", { mesic: nazev }) : t("mesic.nadpis", { mesic: nazev }) }),
      zavrit ? h("button", { type: "button", class: "mesic-zavrit", "aria-label": t("mesic.zavrit"), "data-test": `${test}-zavrit`, onclick: zavrit, text: "✕" }) : null),
    h("div", { class: "stats stats-3 stats-in" },
      udaj(String(s.kol), t("mesic.kolPopis", { n: s.kol }), `${test}-kol`),
      udaj(String(s.otazek), t("mesic.otazekPopis", { n: s.otazek }), `${test}-otazek`),
      udaj(s.procent == null ? "–" : t("domu.procent", { n: s.procent }), t("mesic.spravne"), `${test}-procent`)),
    h("p", { class: "srow-meta mesic-meta", "data-test": `${test}-meta`, text: [
      `★ ${t("mesic.hvezd", { n: s.hvezd })}`, t("mesic.dni", { n: s.dni }),
      // na Domů (kratce) se nejlepší kategorie a úroveň vejdou do jednoho řádku pod čísla
      kratce && s.nejlepsi ? `${t("mesic.nejlepsi")}: ${txt(s.nejlepsi.kat.nazev, jazyk())} ${t("domu.procent", { n: s.nejlepsi.procent })}` : null,
      kratce && s.urovenDo > s.urovenOd ? `${t("mesic.uroven")} ${s.urovenOd} → ${s.urovenDo}` : null,
    ].filter(Boolean).join(" · ") }),
    !kratce && radky.length ? h("ul", { class: "recs" }, radky) : null,
    h("button", { type: "button", class: "btn btn-sec mesic-sdilet", "data-test": `${test}-sdilet`,
      onclick: () => sdilej({ text: textSouhrnu(klic, s), url: adresaWebu("#/") }) },
      h("span", { "aria-hidden": "true", text: "📤 " }), t("mesic.sdilet")));
}
