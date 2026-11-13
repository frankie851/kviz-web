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

/** Všechno, co hra uložila (klíče kviz.v1.* bez předpony) – pro přenos pokroku do jiného zařízení (D-033). */
export function vsechnaData() {
  const vysl = {};
  try {
    if (lzeUkladat) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX) && !k.endsWith("__test")) vysl[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k));
      }
    } else {
      for (const [k, raw] of pamet) vysl[k] = JSON.parse(raw);
    }
  } catch { /* poškozený záznam vynecháme */ }
  return vysl;
}

/** Nahradí všechna uložená data hry daty ze souboru (D-033). Vrátí true, když se uložení povedlo. */
export function nahradData(data) {
  try {
    if (lzeUkladat) {
      const stare = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) stare.push(k);
      }
      stare.forEach((k) => localStorage.removeItem(k));
    }
    pamet.clear();
    let ok = true;
    for (const [k, v] of Object.entries(data)) ok = uloz(k, v) && ok;
    return ok || !lzeUkladat;
  } catch {
    return false;
  }
}

export function ukladaniFunguje() {
  return lzeUkladat;
}
