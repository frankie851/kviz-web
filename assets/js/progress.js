// Pokrok hráče: výsledky (každá obtížnost se hraje jen jednou), rozehraná kola, série dní,
// statistiky a odznaky. Ukládá se jen v prohlížeči. Hvězdy se počítají v půlhvězdách (0–10).
import { nacti, uloz } from "./storage.js";
import { pulhvezdy, odemyka, stavObtiznosti, dalsiObtiznost, dnes, vcera, MAX_HVEZD } from "./game.js";
import { najdiTema, viditelneObtiznosti, viditelnaTemata, viditelneKategorie, vsechnaTemata } from "./data.js";
import { vsechnyOdznaky, odznak } from "./badges.js";

const VERZE = 2; // verze 1 (3 hvězdy, opakování kol) se zahazuje – DECISIONS D-013
const PRAZDNY = () => ({
  verze: VERZE,
  vysledky: {},
  rozehrano: {},
  dny: { posledni: null, serie: 0, nejdelsi: 0 },
  stat: { kol: 0, nejdelsiRada: 0 },
  odznaky: {},
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
  };
}
