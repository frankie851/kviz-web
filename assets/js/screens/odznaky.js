// 8. Odznaky – jednotlivé (získané i zamčené, u zamčených jak je získat) a stupňové řady bronz / stříbro / zlato
// s postupem k dalšímu stupni (obecné řady + Znalec pro každou kategorii, D-026).
import { t, jazyk } from "../i18n.js";
import { h, lista, ikonaKategorie } from "../ui.js";
import { vsechnyOdznaky, jednotliveOdznaky, radyOdznaku, nazevOdznaku, popisOdznaku, nazevRady, MEDAILE } from "../badges.js";
import { pokrok, apiOdznaku } from "../progress.js";
import { txt } from "../data.js";
import { dnes } from "../game.js";

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

/** Karta stupňové řady: ikona, název, tři medaile, pruh k dalšímu stupni. */
function kartaRady(r, ziskane) {
  const hodnota = r.hodnota(apiOdznaku);
  const dalsi = r.stupne.find((o) => !ziskane[o.id]);
  const novy = r.stupne.some((o) => ziskane[o.id] === dnes());
  const predchozi = dalsi ? r.stupne[dalsi.stupen - 2] : null;
  const od = predchozi ? predchozi.prah : 0; // pruh ukazuje postup od minulého stupně k dalšímu
  const podil = dalsi ? Math.max(0, Math.min(1, (hodnota - od) / Math.max(1, dalsi.prah - od))) : 1;
  return h(
    "li",
    { class: `bfam${novy ? " is-new" : ""}`, "data-rada": r.klic },
    novy ? h("span", { class: "bcard-new", text: t("odznaky.novy") }) : null,
    h("div", { class: "bfam-top" },
      r.kat ? ikonaKategorie(r.kat, "bfam-ico") : h("span", { class: "bfam-ico", "aria-hidden": "true", text: r.ikona }),
      h("span", { class: "bfam-name", text: r.kat ? txt(r.kat.nazev, jazyk()) : nazevRady(r) }),
      h("span", { class: "medals", role: "img", "aria-label": r.stupne.filter((o) => ziskane[o.id]).map((o) => t(`odznaky.stupen.${o.stupen}`)).join(", ") || t("odznaky.zamceno") },
        r.stupne.map((o, i) => h("span", {
          class: `medal${ziskane[o.id] ? " on" : ""}`, "data-odznak": o.id, title: `${nazevOdznaku(o)} – ${popisOdznaku(o)}`, "aria-hidden": "true", text: MEDAILE[i],
        })))),
    h("div", { class: "meter meter-fam" }, h("i", { class: "m-ok", style: { width: `${podil * 100}%` } })),
    h("span", { class: "bfam-state", "data-test": "postup" },
      dalsi
        ? t("odznaky.doStupne", { x: Math.min(hodnota, dalsi.prah), prah: dalsi.prah, do: t(`odznaky.stupenDo.${dalsi.stupen}`) })
        : t("odznaky.vse")),
    h("span", { class: "bfam-desc", text: dalsi ? popisOdznaku(dalsi) : popisOdznaku(r.stupne[r.stupne.length - 1]) })
  );
}

export function vykresli() {
  const ziskane = pokrok().odznaky;
  const vse = vsechnyOdznaky();
  const pocet = vse.filter((o) => ziskane[o.id]).length;

  const karty = jednotliveOdznaky().map((o) => {
    const ma = !!ziskane[o.id];
    const novy = ma && ziskane[o.id] === dnes(); // získaný dnes → štítek „Nový“
    return h(
      "li",
      { class: `bcard ${ma ? "earned" : "locked"}${novy ? " is-new" : ""}`, "data-odznak": o.id },
      novy ? h("span", { class: "bcard-new", text: t("odznaky.novy") }) : null,
      h("span", { class: "bcard-ico", "aria-hidden": "true", text: ma ? o.ikona : "🔒" }),
      h("span", { class: "bcard-name", text: nazevOdznaku(o) }),
      h("span", { class: "bcard-desc", text: popisOdznaku(o) }),
      h("span", { class: "bcard-state", text: ma ? t("odznaky.ziskano", { datum: datum(ziskane[o.id]) }) : t("odznaky.zamceno") })
    );
  });
  const rady = radyOdznaku();
  const obecne = rady.filter((r) => !r.kat).map((r) => kartaRady(r, ziskane));
  const kategorie = rady.filter((r) => r.kat).map((r) => kartaRady(r, ziskane));

  const el = h(
    "main",
    { class: "screen" },
    lista({ zpet: "#/", nadpis: t("odznaky.nadpis") }),
    h("p", { class: "lead lead-center", text: t("odznaky.pocet", { n: pocet, z: vse.length }) }),
    h("h2", { class: "sekce-h", text: t("odznaky.stupne") }),
    h("ul", { class: "bfams", "data-test": "rady" }, obecne),
    h("h2", { class: "sekce-h", text: t("odznaky.jednotlive") }),
    h("ul", { class: "badges" }, karty),
    kategorie.length ? h("h2", { class: "sekce-h", text: t("odznaky.znalec") }) : null,
    kategorie.length ? h("p", { class: "lead", text: t("odznaky.znalecPopis") }) : null,
    kategorie.length ? h("ul", { class: "bfams", "data-test": "rady-kategorie" }, kategorie) : null
  );
  return { el, titulek: t("odznaky.nadpis") };
}
