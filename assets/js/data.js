// Načítání otázek. Nejdřív jen malý index, otázky tématu až po jeho výběru.
export const MIN_OTAZEK = 3; // obtížnost s méně otázkami se nezobrazí (SPEC)
export const OBTIZNOSTI = ["1", "2", "3"];

let index = null;
const temata = new Map();

export async function nactiIndex() {
  if (index) return index;
  // no-cache = prohlížeč se zeptá serveru, jestli je index nový (po aktualizaci otázek)
  const r = await fetch("data/index.json", { cache: "no-cache" });
  if (!r.ok) throw new Error(`index: HTTP ${r.status}`);
  index = await r.json();
  return index;
}

export function idx() {
  return index;
}

/** Otázky tématu. Pamatuje si i rozběhnuté stahování, takže předběžné stažení (obrazovka Obtížnost)
 *  a začátek kola sdílejí jeden požadavek. Nepovedené stažení se zapomene a příště se zkusí znovu. */
export function nactiTema(id) {
  if (temata.has(id)) return temata.get(id);
  const info = najdiTema(id);
  if (!info) return Promise.reject(new Error(`Neznámé téma ${id}`));
  // verze exportu v adrese = po aktualizaci dat se nevezme stará kopie z mezipaměti
  const slib = fetch(`data/${info.tema.soubor}?v=${encodeURIComponent(index.exportovano || "")}`).then((r) => {
    if (!r.ok) throw new Error(`téma ${id}: HTTP ${r.status}`);
    return r.json();
  });
  temata.set(id, slib);
  slib.catch(() => temata.delete(id));
  return slib;
}

/** Stáhne otázky tématu na pozadí (bez chyb v konzoli, když to nevyjde). */
export function predNactiTema(id) {
  nactiTema(id).catch(() => {});
}

export function kategorie(id) {
  return index.kategorie.find((k) => k.id === id) || null;
}

export function najdiTema(id) {
  for (const k of index.kategorie) {
    const tema = k.temata.find((t) => t.id === id);
    if (tema) return { kategorie: k, tema };
  }
  return null;
}

/** Obtížnosti tématu, které se hráči ukážou (aspoň 3 otázky), seřazené od nejlehčí. */
export function viditelneObtiznosti(tema) {
  return OBTIZNOSTI.filter((o) => (tema.otazek?.[o] || 0) >= MIN_OTAZEK);
}

/** Témata, která mají aspoň jednu zobrazitelnou obtížnost. */
export function viditelnaTemata(kat) {
  return kat.temata.filter((t) => viditelneObtiznosti(t).length > 0);
}

export function viditelneKategorie() {
  return index.kategorie.filter((k) => viditelnaTemata(k).length > 0);
}

export function vsechnaTemata() {
  return viditelneKategorie().flatMap((k) => viditelnaTemata(k));
}

/** Text v daném jazyce; když chybí, vezme první dostupný. */
export function txt(obj, jazyk) {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[jazyk] ?? Object.values(obj)[0] ?? "";
}
