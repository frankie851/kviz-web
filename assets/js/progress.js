// Pokrok hráče: nejlepší výsledky, série dní, statistiky a odznaky. Ukládá se jen v prohlížeči.
import { nacti, uloz, smaz } from "./storage.js";
import { hvezdy, odemceno, dalsiObtiznost, dnes, vcera } from "./game.js";
import { najdiTema, viditelneObtiznosti, viditelnaTemata, viditelneKategorie, vsechnaTemata } from "./data.js";
import { ODZNAKY } from "./badges.js";

const PRAZDNY = () => ({ nejlepsi: {}, dny: { posledni: null, serie: 0, nejdelsi: 0 }, stat: { kol: 0, nejdelsiRada: 0 }, odznaky: {} });

let p = normalizuj(nacti("pokrok", null));

function normalizuj(x) {
  const z = PRAZDNY();
  if (!x || typeof x !== "object") return z;
  return {
    nejlepsi: x.nejlepsi && typeof x.nejlepsi === "object" ? x.nejlepsi : z.nejlepsi,
    dny: { ...z.dny, ...(x.dny || {}) },
    stat: { ...z.stat, ...(x.stat || {}) },
    odznaky: x.odznaky && typeof x.odznaky === "object" ? x.odznaky : z.odznaky,
  };
}

function ulozit() {
  uloz("pokrok", p);
}

export function pokrok() {
  return p;
}

export function znovuNacti() {
  p = normalizuj(nacti("pokrok", null));
}

/** Smaže hvězdy, série a odznaky; nastavení (jazyk, překlad, zvuky) zůstane. */
export function smazatPokrok() {
  smaz("pokrok");
  smaz("posledni");
  p = PRAZDNY();
}

/** Nejlepší výsledek {h, s, c} v obtížnosti tématu, nebo null. */
export function nejlepsi(temaId, obt) {
  return p.nejlepsi[temaId]?.[String(obt)] || null;
}

export function hvezdyV(temaId, obt) {
  return nejlepsi(temaId, obt)?.h || 0;
}

export function jeOdemceno(temaInfo, obt) {
  return odemceno(temaInfo, obt, (o) => hvezdyV(temaInfo.id, o));
}

/** Hvězdy tématu: { ziskano, max } přes zobrazené obtížnosti. */
export function hvezdyTematu(temaInfo) {
  const vid = viditelneObtiznosti(temaInfo);
  return { ziskano: vid.reduce((s, o) => s + hvezdyV(temaInfo.id, o), 0), max: vid.length * 3 };
}

export function hvezdyKategorie(kat) {
  return viditelnaTemata(kat).reduce(
    (a, t) => {
      const h = hvezdyTematu(t);
      return { ziskano: a.ziskano + h.ziskano, max: a.max + h.max };
    },
    { ziskano: 0, max: 0 }
  );
}

export function hvezdyCelkem() {
  return viditelneKategorie().reduce(
    (a, k) => {
      const h = hvezdyKategorie(k);
      return { ziskano: a.ziskano + h.ziskano, max: a.max + h.max };
    },
    { ziskano: 0, max: 0 }
  );
}

/** Dohrané téma = všechny zobrazené obtížnosti mají aspoň ★. */
export function jeDohrane(temaInfo) {
  return viditelneObtiznosti(temaInfo).every((o) => hvezdyV(temaInfo.id, o) >= 1);
}

export function pocetDohranych() {
  return vsechnaTemata().filter(jeDohrane).length;
}

/** Aktuální série dní (když hráč včera ani dnes nehrál, je přerušená = 0). */
export function serieDni() {
  const { posledni, serie } = p.dny;
  return posledni === dnes() || posledni === vcera() ? serie : 0;
}

export function maOdznak(id) {
  return !!p.odznaky[id];
}

/**
 * Zapíše dohrané kolo. kolo = { temaId, obt, spravne, celkem, nejdelsiRada,
 * jazykOtazek, jazykUi, preklad, prekladOtevren }.
 * Vrátí shrnutí pro obrazovku Výsledek.
 */
export function zapisKolo(kolo) {
  const { temaId, obt, spravne, celkem } = kolo;
  const info = najdiTema(temaId);
  const temaInfo = info.tema;
  const h = hvezdy(spravne, celkem);
  const pred = nejlepsi(temaId, obt);
  const dalsi = dalsiObtiznost(temaInfo, obt);
  const dalsiPred = dalsi ? jeOdemceno(temaInfo, dalsi) : false;

  // nejlepší výsledek: víc hvězd, při shodě víc správně (podílem)
  const lepsi = !pred || h > pred.h || (h === pred.h && spravne / celkem > pred.s / pred.c);
  if (lepsi) {
    p.nejlepsi[temaId] = { ...(p.nejlepsi[temaId] || {}), [String(obt)]: { h, s: spravne, c: celkem } };
  }

  // série dní
  const d = dnes();
  if (p.dny.posledni !== d) {
    p.dny.serie = p.dny.posledni === vcera() ? p.dny.serie + 1 : 1;
    p.dny.posledni = d;
  }
  p.dny.nejdelsi = Math.max(p.dny.nejdelsi, p.dny.serie);

  p.stat.kol += 1;
  p.stat.nejdelsiRada = Math.max(p.stat.nejdelsiRada, kolo.nejdelsiRada || 0);

  // odznaky
  const ctx = { kolo: { ...kolo, hvezdy: h }, info, pokrok: p, api: { jeDohrane, pocetDohranych, hvezdyTematu, hvezdyKategorie } };
  const nove = [];
  for (const o of ODZNAKY) {
    if (!p.odznaky[o.id] && o.splneno(ctx)) {
      p.odznaky[o.id] = d;
      nove.push(o.id);
    }
  }

  ulozit();

  const odemcenoNove = dalsi && !dalsiPred && jeOdemceno(temaInfo, dalsi) ? dalsi : null;
  return {
    hvezdy: h,
    predtim: pred?.h || 0,
    rekord: !!pred && lepsi && h > pred.h,
    dalsi,
    dalsiOdemcena: dalsi ? jeOdemceno(temaInfo, dalsi) : false,
    odemcenoNove,
    noveOdznaky: nove,
    serieDni: p.dny.serie,
  };
}
