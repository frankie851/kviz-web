// Pokrok hráče: výsledky (každá obtížnost se hraje jen jednou), rozehraná kola, série dní,
// statistiky a odznaky. Ukládá se jen v prohlížeči. Hvězdy se počítají v půlhvězdách (0–10).
import { nacti, uloz } from "./storage.js";
import { pulhvezdy, odemyka, stavObtiznosti, dalsiObtiznost, dnes, vcera, MAX_HVEZD } from "./game.js";
import { najdiTema, viditelneObtiznosti, viditelnaTemata, viditelneKategorie, vsechnaTemata } from "./data.js";
import { ODZNAKY } from "./badges.js";

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

/** Aktuální série dní (když hráč včera ani dnes nehrál, je přerušená = 0). */
export function serieDni() {
  const { posledni, serie } = p.dny;
  return posledni === dnes() || posledni === vcera() ? serie : 0;
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
  if (p.odznaky[id] || !ODZNAKY.some((o) => o.id === id)) return false;
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
    [String(obt)]: { s: spravne, c: celkem, pul, odpovedi: kolo.odpovedi.map(([id, v]) => [id, v]), datum: d },
  };
  delete p.rozehrano[klic(temaId, obt)];

  if (p.dny.posledni !== d) {
    p.dny.serie = p.dny.posledni === vcera() ? p.dny.serie + 1 : 1;
    p.dny.posledni = d;
  }
  p.dny.nejdelsi = Math.max(p.dny.nejdelsi, p.dny.serie);
  p.stat.kol += 1;
  p.stat.nejdelsiRada = Math.max(p.stat.nejdelsiRada, kolo.nejdelsiRada || 0);

  const ctx = { kolo: { ...kolo, pul, odemyka: odemyka(spravne, celkem) }, info, pokrok: p, api: { jeDohrane, pocetDohranych, hvezdyTematu, hvezdyKategorie } };
  // odznaky získané už během kola patří taky mezi „nové“ na výsledku
  const nove = ODZNAKY.filter((o) => (kolo.ziskaneBehem || []).includes(o.id) && p.odznaky[o.id]).map((o) => o.id);
  for (const o of ODZNAKY) {
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
