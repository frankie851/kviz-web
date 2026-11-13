// Pokrok hráče: výsledky (každá obtížnost se hraje jen jednou), rozehraná kola, série dní,
// statistiky a odznaky. Ukládá se jen v prohlížeči. Hvězdy se počítají v půlhvězdách (0–10).
import { nacti, uloz } from "./storage.js";
import { nast } from "./settings.js";
import { pulhvezdy, odemyka, stavObtiznosti, dalsiObtiznost, dnes, vcera, MAX_HVEZD, BODY_ZA_OTAZKU, BODY_VYZVA, uroven, pondeli, pondeliPred } from "./game.js";
import { najdiTema, nactiTema, viditelneObtiznosti, viditelnaTemata, viditelneKategorie, vsechnaTemata } from "./data.js";
import { vsechnyOdznaky, odznak } from "./badges.js";

const VERZE = 2; // verze 1 (3 hvězdy, opakování kol) se zahazuje – DECISIONS D-013
const PRAZDNY = () => ({
  verze: VERZE,
  vysledky: {},
  rozehrano: {},
  dny: { posledni: null, serie: 0, nejdelsi: 0 },
  stat: { kol: 0, nejdelsiRada: 0 },
  odznaky: {},
  procviceno: {}, // id otázky → datum, kdy ji hráč v procvičování zodpověděl správně (D-031)
  vyzvy: {}, // datum → { ids, odpovedi: [[id, volba]], spravne, hotovo } – denní výzva (D-032)
  vyzvaDny: { posledni: null, serie: 0, nejdelsi: 0 },
  sbirka: {}, // id otázky → { tema, datum } – Moje sbírka (D-035)
  znamaTemata: {}, // id tématu → { d: datum, n: 1 = nové a ještě neotevřené } (D-035)
});

let p = normalizuj(nacti("pokrok", null));

function normalizuj(x) {
  const z = PRAZDNY();
  if (!x || typeof x !== "object" || x.verze !== VERZE) return z;
  const obj = (v, d) => (v && typeof v === "object" ? v : d);
  return {
    verze: VERZE,
    vysledky: obj(x.vysledky, z.vysledky),
    rozehrano: obj(x.rozehrano, z.rozehrano),
    dny: { ...z.dny, ...obj(x.dny, {}) },
    stat: { ...z.stat, ...obj(x.stat, {}) },
    odznaky: obj(x.odznaky, z.odznaky),
    procviceno: obj(x.procviceno, z.procviceno),
    vyzvy: obj(x.vyzvy, z.vyzvy),
    vyzvaDny: { ...z.vyzvaDny, ...obj(x.vyzvaDny, {}) },
    sbirka: obj(x.sbirka, z.sbirka),
    znamaTemata: obj(x.znamaTemata, z.znamaTemata),
  };
}

function ulozit() {
  uloz("pokrok", p);
}

export function pokrok() {
  return p;
}

/** Uložený výsledek dohrané obtížnosti { s, c, pul, odpovedi: [[id, volba]], datum }, nebo null. */
export function vysledek(temaId, obt) {
  return p.vysledky[temaId]?.[String(obt)] || null;
}

export function pulV(temaId, obt) {
  return vysledek(temaId, obt)?.pul || 0;
}

/** "otevreno" | "zamceno" | "natrvalo" | "dohrano" */
export function stav(temaInfo, obt) {
  if (vysledek(temaInfo.id, obt)) return "dohrano";
  return stavObtiznosti(temaInfo, obt, (o) => vysledek(temaInfo.id, o));
}

/** Půlhvězdy tématu: { pul, max } přes zobrazené obtížnosti. */
export function hvezdyTematu(temaInfo) {
  const vid = viditelneObtiznosti(temaInfo);
  return { pul: vid.reduce((s, o) => s + pulV(temaInfo.id, o), 0), max: vid.length * MAX_HVEZD * 2 };
}

function secti(seznam, fn) {
  return seznam.reduce((a, x) => {
    const h = fn(x);
    return { pul: a.pul + h.pul, max: a.max + h.max };
  }, { pul: 0, max: 0 });
}

export function hvezdyKategorie(kat) {
  return secti(viditelnaTemata(kat), hvezdyTematu);
}

export function hvezdyCelkem() {
  return secti(viditelneKategorie(), hvezdyKategorie);
}

/** Dohrané téma = všechny zobrazené obtížnosti jsou odehrané. */
export function jeDohrane(temaInfo) {
  return viditelneObtiznosti(temaInfo).every((o) => !!vysledek(temaInfo.id, o));
}

export function pocetDohranych() {
  return vsechnaTemata().filter(jeDohrane).length;
}

/** Uzavřené téma = hráč v něm už nemůže pokračovat: každá zobrazená obtížnost je odehraná,
 *  nebo zamčená natrvalo (předchozí pod 70 %). Pro „dohráno x / t“ u kategorií (D-021). */
export function jeUzavrene(temaInfo) {
  for (const o of viditelneObtiznosti(temaInfo)) {
    const s = stav(temaInfo, o);
    if (s === "natrvalo") return true; // tahle i všechny další obtížnosti jsou nedosažitelné
    if (s !== "dohrano") return false; // ještě jde hrát (otevřená, nebo se teprve odemkne)
  }
  return true;
}

/** { x, t } – uzavřená témata kategorie / všechna zobrazená témata kategorie. */
export function uzavrenaVKategorii(kat) {
  const vsech = viditelnaTemata(kat);
  return { x: vsech.filter(jeUzavrene).length, t: vsech.length };
}

/** Počet témat na webu s aspoň jedním dohraným kolem (odznak Objevitel, D-027). */
export function pocetHranychTemat() {
  return vsechnaTemata().filter((t) => viditelneObtiznosti(t).some((o) => vysledek(t.id, o))).length;
}

/** Počet uzavřených témat ve všech kategoriích (stupňový odznak Cestovatel, D-026). */
export function pocetUzavrenych() {
  return vsechnaTemata().filter(jeUzavrene).length;
}

/** Správné odpovědi ze všech dohraných kol (stupňový odznak Učenec, D-026). */
export function spravneCelkem() {
  let s = 0;
  for (const obt of Object.values(p.vysledky)) for (const v of Object.values(obt || {})) s += v?.s || 0;
  return s;
}

/** Celé hvězdy (půlky dolů) ze všech témat na webu. */
export function hvezdyCelych() {
  return Math.floor(hvezdyCelkem().pul / 2);
}

/** Stav tématu pro filtr v kategorii (D-026): "hotove" | "rozehrane" | "nehrane". */
export function stavTematu(temaInfo) {
  if (jeUzavrene(temaInfo)) return "hotove";
  const vid = viditelneObtiznosti(temaInfo);
  const hrano = vid.some((o) => vysledek(temaInfo.id, o) || rozehrane(temaInfo.id, o)?.odpovedi?.length);
  return hrano ? "rozehrane" : "nehrane";
}

/** Náhodné téma pro „Překvap mě“ (D-028): nejdřív z nehraných, pak z těch, kde jde hrát dál, jinak z jakéhokoli. */
export function nahodneTema() {
  const vse = vsechnaTemata();
  const nehrane = vse.filter((t) => stavTematu(t) === "nehrane");
  const dal = vse.filter((t) => viditelneObtiznosti(t).some((o) => stav(t, o) === "otevreno"));
  const z = nehrane.length ? nehrane : dal.length ? dal : vse;
  return z.length ? z[Math.floor(Math.random() * z.length)] : null;
}

/**
 * Karta „Pokračuj“ na Domů (D-026): naposledy rozehrané kolo s aspoň jednou odpovědí, jinak další
 * otevřená obtížnost naposledy hraného tématu. Vrací { info, obt, rozehrane, i, n, spravne } nebo null.
 */
export function pokracovani() {
  const roz = Object.entries(p.rozehrano || {})
    .map(([k, kolo]) => { const [temaId, obt] = k.split("|"); return { info: najdiTema(temaId), obt, kolo }; })
    .filter((x) => x.info && x.kolo?.odpovedi?.length && x.kolo.odpovedi.length < (x.kolo.poradi?.length || 0) && stav(x.info.tema, x.obt) === "otevreno")
    .sort((a, b) => (b.kolo.cas || 0) - (a.kolo.cas || 0));
  if (roz.length) {
    const { info, obt, kolo } = roz[0];
    return { info, obt, rozehrane: true, i: kolo.odpovedi.length, n: kolo.poradi.length, spravne: typeof kolo.spravne === "number" ? kolo.spravne : null };
  }
  const hrane = [];
  for (const [temaId, obt] of Object.entries(p.vysledky)) {
    const info = najdiTema(temaId);
    if (!info) continue;
    const posledni = Object.values(obt || {}).reduce((m, v) => Math.max(m, v?.cas || 0), 0);
    const datum = Object.values(obt || {}).map((v) => v?.datum || "").sort().pop() || "";
    hrane.push({ info, posledni, datum });
  }
  hrane.sort((a, b) => b.posledni - a.posledni || b.datum.localeCompare(a.datum));
  for (const { info } of hrane) {
    const obt = viditelneObtiznosti(info.tema).find((o) => stav(info.tema, o) === "otevreno");
    if (obt) return { info, obt, rozehrane: false };
  }
  return null;
}

/**
 * Procvičování chyb (D-031): otázky, na které hráč odpověděl špatně v dohraných i rozehraných kolech
 * (témata na webu) a které ještě v procvičování nezodpověděl správně. Vrací [{ q, info }] bez opakování.
 */
export async function chybneOtazky() {
  const odpovedi = []; // [temaId, idOtazky, volba]
  for (const [temaId, obt] of Object.entries(p.vysledky)) {
    for (const v of Object.values(obt || {})) for (const [id, k] of v?.odpovedi || []) odpovedi.push([temaId, id, k]);
  }
  for (const [klicKola, kolo] of Object.entries(p.rozehrano || {})) {
    const temaId = klicKola.split("|")[0];
    for (const [id, k] of kolo?.odpovedi || []) odpovedi.push([temaId, id, k]);
  }
  const temata = [...new Set(odpovedi.map(([t]) => t))].filter((t) => najdiTema(t));
  const data = new Map();
  await Promise.all(temata.map(async (t) => {
    try { data.set(t, await nactiTema(t)); } catch { /* téma se nenačetlo – jeho chyby se tentokrát neukážou */ }
  }));
  const vysl = new Map();
  for (const [temaId, id, k] of odpovedi) {
    if (vysl.has(id) || p.procviceno[id]) continue;
    const q = data.get(temaId)?.otazky.find((x) => x.id === id);
    if (q && k !== q.spravne) vysl.set(id, { q, info: najdiTema(temaId) });
  }
  return [...vysl.values()];
}

/** Otázka zodpovězená v procvičování správně – ze seznamu chyb zmizí. */
export function oznacProcviceno(id) {
  p.procviceno[id] = dnes();
  ulozit();
}

// ---------- denní výzva (D-032): jedna sada 5 otázek na den, jeden pokus, vlastní série dní
const MAX_ULOZENYCH_VYZEV = 400;

/** Uložená výzva pro datum { ids, odpovedi, spravne, hotovo }, nebo null. */
export function vyzva(datum = dnes()) {
  return p.vyzvy[datum] || null;
}

/** Průběžně uloží rozehranou výzvu (po každé odpovědi). */
export function ulozVyzvu(datum, ids, odpovedi, spravne) {
  p.vyzvy[datum] = { ...(p.vyzvy[datum] || {}), ids, odpovedi, spravne, hotovo: false };
  ulozit();
}

/** Dokončí výzvu a posune sérii dní výzev. Vrátí aktuální sérii. */
export function dokonciVyzvu(datum, spravne) {
  const v = p.vyzvy[datum];
  if (!v || v.hotovo) return p.vyzvaDny.serie;
  v.hotovo = true;
  v.spravne = spravne;
  const d = p.vyzvaDny;
  if (d.posledni !== datum) {
    d.serie = d.posledni === vcera() ? d.serie + 1 : 1;
    d.posledni = datum;
    d.nejdelsi = Math.max(d.nejdelsi || 0, d.serie);
  }
  const data = Object.keys(p.vyzvy).sort();
  data.slice(0, Math.max(0, data.length - MAX_ULOZENYCH_VYZEV)).forEach((k) => delete p.vyzvy[k]);
  ulozit();
  return d.serie;
}

/** Aktuální série dní s dokončenou výzvou (přerušená = 0) a nejdelší. */
export function serieVyzev() {
  const { posledni, serie, nejdelsi } = p.vyzvaDny;
  return { serie: posledni === dnes() || posledni === vcera() ? serie : 0, nejdelsi: nejdelsi || 0 };
}

// ---------- úroveň hráče a týdenní cíl (D-034) – počítá se z uložených výsledků, takže platí i zpětně
/** Body: správné odpovědi v dohraných i rozehraných kolech (podle obtížnosti) + dokončené denní výzvy. */
export function bodyHrace() {
  let body = 0;
  for (const obt of Object.values(p.vysledky)) {
    for (const [o, v] of Object.entries(obt || {})) body += (v?.s || 0) * (BODY_ZA_OTAZKU[o] || 10);
  }
  for (const [k, kolo] of Object.entries(p.rozehrano || {})) {
    if (typeof kolo?.spravne === "number") body += kolo.spravne * (BODY_ZA_OTAZKU[k.split("|")[1]] || 10);
  }
  for (const v of Object.values(p.vyzvy || {})) if (v?.hotovo) body += (v.spravne || 0) * BODY_VYZVA;
  return body;
}

export function urovenHrace() {
  return uroven(bodyHrace());
}

/** Počet dohraných kol v týdnu začínajícím daným pondělím. */
function kolVTydnu(pondeliTydne) {
  const [r, m, d] = pondeliTydne.split("-").map(Number);
  const nedele = dnes(new Date(r, m - 1, d + 6, 12));
  let n = 0;
  for (const obt of Object.values(p.vysledky)) {
    for (const v of Object.values(obt || {})) if (v?.datum && v.datum >= pondeliTydne && v.datum <= nedele) n += 1;
  }
  return n;
}

export const TYDENNI_CILE = [3, 5, 10];

/** { hotovo, cil, splneno, serie } – série = týdny v řadě se splněným cílem (aktuální se počítá, jen když je splněný). */
export function tydenniCil() {
  const cil = TYDENNI_CILE.includes(nast().tydenniCil) ? nast().tydenniCil : 5;
  const hotovo = kolVTydnu(pondeli());
  let serie = hotovo >= cil ? 1 : 0;
  for (let i = 1; i < 520 && kolVTydnu(pondeliPred(i)) >= cil; i++) serie += 1;
  return { hotovo, cil, splneno: hotovo >= cil, serie };
}

// ---------- Moje sbírka (D-035): otázky, které si hráč uložil hvězdičkou
export function jeVeSbirce(id) {
  return !!p.sbirka[id];
}

/** Přidá / odebere otázku ze sbírky. Vrátí true, když je otázka po změně ve sbírce. */
export function prepniSbirku(id, temaId) {
  if (p.sbirka[id]) delete p.sbirka[id];
  else p.sbirka[id] = { tema: temaId, datum: dnes(), cas: Date.now() };
  ulozit();
  return !!p.sbirka[id];
}

/** Otázky ve sbírce, nejnovější nahoře: [{ id, tema, datum }]. */
export function sbirka() {
  return Object.entries(p.sbirka).map(([id, x]) => ({ id, ...x })).sort((a, b) => (b.cas || 0) - (a.cas || 0));
}

// ---------- nová témata (D-035): co přibylo od hráčovy poslední návštěvy (data datum přidání nemají)
const NOVE_DNI = 30; // štítek „Nové“ zmizí po otevření tématu, nejpozději po 30 dnech

/** Zaznamená témata v datech: poprvé (prázdný seznam) se všechna jen zapamatují, později jsou nepoznaná „nová“. */
export function zaznamenejTemata() {
  const vse = vsechnaTemata();
  const prvne = !Object.keys(p.znamaTemata).length;
  let zmena = false;
  for (const t of vse) {
    if (!p.znamaTemata[t.id]) {
      p.znamaTemata[t.id] = { d: dnes(), n: prvne ? 0 : 1 };
      zmena = true;
    }
  }
  // úplně nový hráč (nic uloženého): seznam se uloží až s prvním pokrokem – start hry tak nic nezapisuje
  const prazdny = !Object.keys(p.vysledky).length && !Object.keys(p.rozehrano).length && !Object.keys(p.vyzvy).length
    && !Object.keys(p.odznaky).length && !Object.keys(p.sbirka).length;
  if (zmena && !(prvne && prazdny)) ulozit();
}

export function jeNoveTema(id) {
  const z = p.znamaTemata[id];
  if (!z?.n) return false;
  const [r, m, d] = String(z.d).split("-").map(Number);
  return (Date.now() - new Date(r, m - 1, d).getTime()) / 864e5 <= NOVE_DNI;
}

/** Nová témata (pro Domů a obrazovku Nová témata): [{ kat, tema }] */
export function novaTemata() {
  return viditelneKategorie().flatMap((kat) => viditelnaTemata(kat).filter((t) => jeNoveTema(t.id)).map((tema) => ({ kat, tema })));
}

/** Hráč téma otevřel – už není „nové“. */
export function oznacTemaOtevrene(id) {
  if (p.znamaTemata[id]?.n) {
    p.znamaTemata[id].n = 0;
    ulozit();
  }
}

// ---------- kalendář aktivity a měsíční souhrn (D-038)
/** Aktivita po dnech: datum → počet dohraných kol + dokončených denních výzev. */
export function aktivitaDni() {
  const m = new Map();
  for (const obt of Object.values(p.vysledky)) {
    for (const v of Object.values(obt || {})) if (v?.datum) m.set(v.datum, (m.get(v.datum) || 0) + 1);
  }
  for (const [d, v] of Object.entries(p.vyzvy || {})) if (v?.hotovo) m.set(d, (m.get(d) || 0) + 1);
  return m;
}

/**
 * Souhrn měsíce „RRRR-MM“ (jen dohraná kola a výzvy s datem v měsíci), nebo null, když hráč nehrál:
 * { kol, otazek, spravne, procent, hvezd, dni, vyzev, nejlepsi: { kat, procent } | null, urovenOd, urovenDo }
 */
export function souhrnMesice(mesic) {
  const kola = [];
  for (const [temaId, obt] of Object.entries(p.vysledky)) {
    const info = najdiTema(temaId);
    for (const [o, v] of Object.entries(obt || {})) if (v?.datum?.startsWith(mesic)) kola.push({ info, o, v });
  }
  const vyzvy = Object.entries(p.vyzvy || {}).filter(([d, v]) => d.startsWith(mesic) && v?.hotovo);
  if (!kola.length && !vyzvy.length) return null;
  const otazek = kola.reduce((a, k) => a + (k.v.c || 0), 0);
  const spravne = kola.reduce((a, k) => a + (k.v.s || 0), 0);
  const podleKat = new Map();
  for (const k of kola) {
    if (!k.info) continue;
    const x = podleKat.get(k.info.kategorie.id) || { kat: k.info.kategorie, s: 0, c: 0 };
    x.s += k.v.s; x.c += k.v.c;
    podleKat.set(k.info.kategorie.id, x);
  }
  const kandidati = [...podleKat.values()];
  const dost = kandidati.filter((x) => x.c >= 10);
  const nej = (dost.length ? dost : kandidati).sort((a, b) => b.s / b.c - a.s / a.c || b.c - a.c)[0];
  // úroveň na začátku a na konci měsíce (z dohraných kol a výzev s datem)
  const bodyDo = (hranice) => {
    let b = 0;
    for (const obt of Object.values(p.vysledky)) for (const [o, v] of Object.entries(obt || {})) if (v?.datum && v.datum < hranice) b += (v.s || 0) * (BODY_ZA_OTAZKU[o] || 10);
    for (const [d, v] of Object.entries(p.vyzvy || {})) if (v?.hotovo && d < hranice) b += (v.spravne || 0) * BODY_VYZVA;
    return b;
  };
  return {
    kol: kola.length, otazek, spravne, procent: otazek ? Math.round((spravne / otazek) * 100) : null,
    hvezd: Math.floor(kola.reduce((a, k) => a + (k.v.pul || 0), 0) / 2),
    dni: new Set([...kola.map((k) => k.v.datum), ...vyzvy.map(([d]) => d)]).size,
    vyzev: vyzvy.length,
    nejlepsi: nej ? { kat: nej.kat, procent: Math.round((nej.s / nej.c) * 100) } : null,
    urovenOd: uroven(bodyDo(`${mesic}-01`)).uroven,
    urovenDo: uroven(bodyDo(`${mesic}-99`)).uroven,
  };
}

/** Funkce pokroku pro podmínky odznaků (badges.js) a jejich postup na obrazovce Odznaky. */
export const apiOdznaku = {
  jeDohrane, pocetDohranych, hvezdyTematu, hvezdyKategorie,
  pocetHranychTemat, pocetUzavrenych, spravneCelkem, hvezdyCelych, uzavrenaVKategorii, serieDni: () => serieDni(),
};

/** Aktuální série dní (když hráč včera ani dnes nehrál, je přerušená = 0). */
export function serieDni() {
  const { posledni, serie } = p.dny;
  return posledni === dnes() || posledni === vcera() ? serie : 0;
}

/** Úspěšnost ze všech dohraných kol v % (celé číslo); null, dokud hráč nic nedohrál. */
export function uspesnost() {
  let s = 0, c = 0;
  for (const obt of Object.values(p.vysledky)) {
    for (const v of Object.values(obt || {})) {
      if (v && v.c > 0) { s += v.s; c += v.c; }
    }
  }
  return c ? Math.round((s / c) * 100) : null;
}

// ---------- rozehrané kolo (uloží se po každé odpovědi – odchod ani obnovení stránky ho nezahodí)
const klic = (temaId, obt) => `${temaId}|${obt}`;

export function rozehrane(temaId, obt) {
  return p.rozehrano[klic(temaId, obt)] || null;
}

export function ulozRozehrane(temaId, obt, kolo) {
  p.rozehrano[klic(temaId, obt)] = kolo;
  ulozit();
}

/**
 * Udělí odznak hned během kola (série 5 a 10 správně za sebou). Vrátí true, když je nový.
 * Na výsledku kola se pak ukáže mezi novými odznaky (kolo si ho pamatuje v `ziskaneBehem`).
 */
export function udelOdznak(id) {
  if (p.odznaky[id] || !odznak(id)) return false;
  p.odznaky[id] = dnes();
  ulozit();
  return true;
}

/**
 * Zapíše dohrané kolo. kolo = { temaId, obt, odpovedi: [[id, volba, spravne?]], spravne, celkem,
 * nejdelsiRada, jazykOtazek, jazykUi, preklad, prekladOtevren, ziskaneBehem }. Vrátí shrnutí pro obrazovku Výsledek.
 */
export function zapisKolo(kolo) {
  const { temaId, obt, spravne, celkem } = kolo;
  const info = najdiTema(temaId);
  if (vysledek(temaId, obt)) return null; // už dohráno – podruhé se nezapisuje
  const pul = pulhvezdy(spravne, celkem);
  const d = dnes();
  const tydenPred = tydenniCil(); // úroveň „před“ se dopočítá až po zápisu (rozehrané kolo už body průběžně mělo)

  p.vysledky[temaId] = {
    ...(p.vysledky[temaId] || {}),
    // j = jazyk otázek, r = nejdelší série správných odpovědí v kole (pro Statistiky, D-021)
    [String(obt)]: { s: spravne, c: celkem, pul, odpovedi: kolo.odpovedi.map(([id, v]) => [id, v]), datum: d, j: kolo.jazykOtazek, r: kolo.nejdelsiRada || 0, cas: Date.now() },
  };
  delete p.rozehrano[klic(temaId, obt)];

  if (p.dny.posledni !== d) {
    p.dny.serie = p.dny.posledni === vcera() ? p.dny.serie + 1 : 1;
    p.dny.posledni = d;
  }
  p.dny.nejdelsi = Math.max(p.dny.nejdelsi, p.dny.serie);
  p.stat.kol += 1;
  p.stat.nejdelsiRada = Math.max(p.stat.nejdelsiRada, kolo.nejdelsiRada || 0);

  const ctx = { kolo: { ...kolo, pul, odemyka: odemyka(spravne, celkem) }, info, pokrok: p, api: apiOdznaku };
  // odznaky získané už během kola patří taky mezi „nové“ na výsledku
  const vse = vsechnyOdznaky();
  const nove = vse.filter((o) => (kolo.ziskaneBehem || []).includes(o.id) && p.odznaky[o.id]).map((o) => o.id);
  for (const o of vse) {
    if (!p.odznaky[o.id] && o.splneno(ctx)) {
      p.odznaky[o.id] = d;
      nove.push(o.id);
    }
  }
  ulozit();

  const dalsi = dalsiObtiznost(info.tema, obt);
  return {
    pul,
    dalsi,
    dalsiStav: dalsi ? stav(info.tema, dalsi) : null,
    noveOdznaky: nove,
    serieDni: p.dny.serie,
    body: spravne * (BODY_ZA_OTAZKU[obt] || 10),
    novaUroven: urovenHrace().uroven > uroven(bodyHrace() - spravne * (BODY_ZA_OTAZKU[obt] || 10)).uroven ? urovenHrace().uroven : null,
    tydenSplnen: !tydenPred.splneno && tydenniCil().splneno ? tydenniCil().cil : null,
  };
}
