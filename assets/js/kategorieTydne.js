// Kategorie týdne (D-040): každý týden (od pondělí) jedna kategorie, pro všechny hráče stejná – určí ji datum
// pondělí a seznam kategorií na webu. Stejná kategorie nebývá dva týdny po sobě. Splněno = 3 dohraná kola
// v ní během týdne; splněné týdny se ukládají v pokroku (progress.js) a dávají stupňový odznak.
import { viditelneKategorie } from "./data.js";
import { nahoda } from "./vyzva.js";
import { pondeli, pondeliPred } from "./game.js";

export const KOL_KATEGORIE_TYDNE = 3;

const poradi = (tyden, n) => Math.floor(nahoda(`oho-kategorie-${tyden}`)() * n);

/** Kategorie týdne, do kterého patří datum (null, když na webu žádná kategorie není). */
export function kategorieTydne(d = new Date()) {
  const kats = viditelneKategorie().slice().sort((a, b) => a.id.localeCompare(b.id));
  if (!kats.length) return null;
  let i = poradi(pondeli(d), kats.length);
  if (kats.length > 1 && i === poradi(pondeliPred(1, d), kats.length)) i = (i + 1) % kats.length;
  return kats[i];
}
