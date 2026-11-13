// 7. Výsledek kola – skóre, 0–5 hvězd (po půlkách), odemčení, nové odznaky.
// Tlačítka: Další obtížnost (když se odemkla) / Prohlédnout odpovědi / Zpět na témata. Kolo se neopakuje (D-013).
// Oslava jen při prvním zobrazení (cerstvy): hvězdy naskakují se zvukem jedna po druhé, pak zvuk
// podle výsledku, nové odznaky a od 90 % (4,5 ★) konfety (D-027). Obnovení stránky už oslavu neopakuje.
import { t, jazyk } from "../i18n.js";
import { h, hvezdicky, prefersReducedMotion } from "../ui.js";
import { najdiTema, txt } from "../data.js";
import { nacti, uloz } from "../storage.js";
import { odznak, nazevOdznaku } from "../badges.js";
import { sdilej, adresaWebu, hvezdyTextem } from "../sdileni.js";
import { zvuk, vibrace } from "../feedback.js";
import { konfety, zastavKonfety } from "../oslavy.js";

const KONFETY_OD = 9; // půlhvězdy: 90 % = 4,5 ★ – původní „konfety při ★★★“ (★★★ = od 90 %), D-027

// časování musí sedět s CSS (.stars-big .star: začátek --res-d0, rozestup --res-krok)
const ZACATEK = 0.3;
const KROK = 0.16;

export const ID = "vysledek";

function hodnoceni(pul) {
  if (pul >= 10) return 3;
  if (pul >= 7) return 2;
  if (pul >= 4) return 1;
  return 0;
}

export function vykresli() {
  const v = nacti("posledni", null);
  const info = v && najdiTema(v.temaId);
  if (!info || typeof v.pul !== "number") return { presmeruj: "#/" };
  const { tema, kategorie } = info;

  const nove = (v.noveOdznaky || []).map(odznak).filter(Boolean);
  const procento = Math.floor((v.spravne / v.celkem) * 100);
  const dalsiNazev = v.dalsi ? t(`obtiznost.${v.dalsi}`) : "";
  const odemceno = v.dalsi && v.dalsiStav === "otevreno";

  const el = h(
    "main",
    { class: `screen screen-vysledek pul-${v.pul}` },
    h("p", { class: "res-topic", text: `${txt(tema.nazev, jazyk())} · ${t(`obtiznost.${v.obt}`)}` }),
    h("h1", { class: "res-title", text: t(`vysledek.hodnoceni.${hodnoceni(v.pul)}`) }),
    hvezdicky(v.pul, 5, "stars stars-big"),
    h("p", { class: "res-score", "data-test": "skore" },
      h("b", { text: `${v.spravne} / ${v.celkem}` }),
      h("span", { text: t("vysledek.spravne", { p: procento }) })),
    odemceno
      ? h("p", { class: "badge-line badge-unlock", "data-test": "odemceno" },
          h("span", { "aria-hidden": "true", text: "🔓 " }), t("vysledek.odemceno", { obtiznost: dalsiNazev }))
      : null,
    v.dalsi && v.dalsiStav === "natrvalo"
      ? h("p", { class: "badge-line badge-locked", "data-test": "natrvalo" },
          h("span", { "aria-hidden": "true", text: "⛔ " }), t("vysledek.natrvalo", { obtiznost: dalsiNazev }))
      : null,
    !v.dalsi ? h("p", { class: "hint", text: t("vysledek.temaHotovo") }) : null,
    nove.length
      ? h("section", { class: "new-badges", "data-test": "nove-odznaky" },
          h("h2", { text: t("vysledek.noveOdznaky", { n: nove.length }) }),
          h("ul", {}, nove.map((o) =>
            h("li", { class: "new-badge" },
              h("span", { class: "nb-ico", "aria-hidden": "true", text: o.ikona }),
              h("span", { class: "nb-name", text: nazevOdznaku(o) })))))
      : null,
    h("div", { class: "res-btns" },
      odemceno
        ? h("a", { class: "btn btn-primary btn-big", href: `#/hra/${tema.id}/${v.dalsi}`, "data-test": "dalsi-obtiznost" },
            t("vysledek.dalsiObtiznost", { obtiznost: dalsiNazev }))
        : null,
      h("a", { class: `btn ${odemceno ? "btn-sec" : "btn-primary"} btn-big`, href: `#/prehled/${tema.id}/${v.obt}`, "data-test": "prehled" },
        h("span", { "aria-hidden": "true", text: "📖 " }), t("vysledek.prehled")),
      h("button", {
        type: "button", class: "btn btn-sec btn-big", "data-test": "sdilet",
        onclick: () => sdilej({
          text: t("sdileni.kolo", { tema: txt(tema.nazev, jazyk()), obtiznost: t(`obtiznost.${v.obt}`), s: v.spravne, c: v.celkem, hvezdy: hvezdyTextem(v.pul) }),
          url: adresaWebu(`#/tema/${tema.id}`),
        }),
      }, h("span", { "aria-hidden": "true", text: "📤 " }), t("sdileni.tlacitko")),
      h("a", { class: "btn btn-sec btn-big", href: `#/kategorie/${kategorie.id}`, "data-test": "zpet-temata" }, t("vysledek.zpetTemata")))
  );
  const casovace = [];
  if (v.cerstvy) {
    uloz("posledni", { ...v, cerstvy: false });
    casovace.push(...oslava(v, nove.length));
  }
  return {
    el,
    titulek: t("vysledek.titulek"),
    uklid: () => {
      casovace.forEach(clearTimeout);
      zastavKonfety();
    },
  };
}

/** Zvuky, vibrace a konfety k čerstvému výsledku. Vrátí časovače (zruší se při odchodu z obrazovky). */
function oslava(v, noveOdznaky) {
  const plnych = Math.floor(v.pul / 2);
  const pul = v.pul % 2 === 1;
  const hvezd = plnych + (pul ? 1 : 0);
  const rychle = prefersReducedMotion(); // bez animace hvězd zazní jen závěrečný zvuk
  if (!rychle) {
    for (let i = 0; i < hvezd; i++) zvuk("hvezda", { i, pul: i === plnych }, ZACATEK + i * KROK + 0.25);
  }
  const konec = rychle ? 0 : ZACATEK + hvezd * KROK + 0.3;
  const druh = v.pul >= 10 ? "fanfara" : v.pul >= 7 ? "dobre" : "slabe";
  zvuk(druh, {}, konec);
  const casovace = [setTimeout(() => vibrace(druh), konec * 1000)];
  if (noveOdznaky) {
    casovace.push(setTimeout(() => vibrace("odznak"), (konec + 0.8) * 1000));
    zvuk("odznak", {}, konec + 0.8);
  }
  if (v.pul >= KONFETY_OD) casovace.push(setTimeout(() => konfety(), Math.max(0, konec - 0.2) * 1000));
  return casovace;
}
