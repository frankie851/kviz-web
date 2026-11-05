// Jediné místo, které sahá na localStorage. Klíče jsou verzované (kviz.v1.*).
// Když ukládání nejde (anonymní okno, plné úložiště, zakázané cookies), hra běží dál
// a pamatuje si stav jen do zavření stránky.
const PREFIX = "kviz.v1.";
const pamet = new Map(); // záloha v paměti, když localStorage nefunguje
let lzeUkladat = true;

try {
  const k = PREFIX + "__test";
  localStorage.setItem(k, "1");
  localStorage.removeItem(k);
} catch {
  lzeUkladat = false;
}

export function nacti(klic, vychozi = null) {
  try {
    const raw = lzeUkladat ? localStorage.getItem(PREFIX + klic) : pamet.get(klic);
    if (raw == null) return vychozi;
    return JSON.parse(raw);
  } catch {
    return vychozi;
  }
}

export function uloz(klic, hodnota) {
  const raw = JSON.stringify(hodnota);
  pamet.set(klic, raw);
  if (!lzeUkladat) return false;
  try {
    localStorage.setItem(PREFIX + klic, raw);
    return true;
  } catch {
    return false;
  }
}

export function smaz(klic) {
  pamet.delete(klic);
  try {
    if (lzeUkladat) localStorage.removeItem(PREFIX + klic);
  } catch { /* nic */ }
}

/** Smaže všechno, co aplikace uložila (jen klíče kviz.v1.*). */
export function smazVse() {
  pamet.clear();
  if (!lzeUkladat) return;
  try {
    const klice = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) klice.push(k);
    }
    klice.forEach((k) => localStorage.removeItem(k));
  } catch { /* nic */ }
}

export function ukladaniFunguje() {
  return lzeUkladat;
}
