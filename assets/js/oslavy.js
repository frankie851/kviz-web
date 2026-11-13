// Oslavy: konfety (při 100 % = 5 ★) a upozornění na nový odznak během hry.
// Konfety se kreslí do <canvas> v barvách značky, bez knihoven a bez cizích souborů.
// S „omezit pohyb“ (prefers-reduced-motion) se konfety nespustí a upozornění se jen ukáže bez pohybu.
import { h, prefersReducedMotion } from "./ui.js";
import { t } from "./i18n.js";
import { nazevOdznaku } from "./badges.js";

const BARVY = ["#C2255C", "#FFC53D", "#1F6FCB", "#FF8FB1", "#1E9E5A", "#FFE3A1"]; // bez tmavé švestkové – na tmavém pozadí by zmizela (D-028)
let bezi = null;

/** Spustí konfety; vrátí funkci, která je hned ukončí (např. při odchodu z obrazovky). */
export function konfety({ pocet = 140, delka = 3200 } = {}) {
  zastavKonfety();
  if (prefersReducedMotion()) return () => {};
  const platno = h("canvas", { class: "konfety", "aria-hidden": "true", "data-test": "konfety" });
  const c2d = platno.getContext?.("2d");
  if (!c2d) return () => {};
  document.body.append(platno);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0;
  let H = 0;
  const velikost = () => {
    W = document.documentElement.clientWidth;
    H = window.innerHeight;
    platno.width = Math.round(W * dpr);
    platno.height = Math.round(H * dpr);
    platno.style.width = `${W}px`;
    platno.style.height = `${H}px`;
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  velikost();
  window.addEventListener("resize", velikost);

  // dva výstřely z dolních rohů šikmo nahoru + pár kousků shora
  const castice = [];
  for (let i = 0; i < pocet; i++) {
    const zleva = i % 2 === 0;
    const shora = i % 7 === 0;
    // úhel: shora dolů, zleva šikmo doprava nahoru, zprava šikmo doleva nahoru
    const rozptyl = 0.3 + Math.random() * 0.5;
    const uhel = shora ? Math.PI / 2 + (Math.random() - 0.5) * 0.6 : -Math.PI / 2 + (zleva ? rozptyl : -rozptyl);
    const rychlost = shora ? 1 + Math.random() * 2 : 11 + Math.random() * 7 * Math.min(1, H / 700 + 0.3);
    castice.push({
      x: shora ? Math.random() * W : zleva ? -10 : W + 10,
      y: shora ? -20 - Math.random() * 120 : H * 0.92,
      vx: Math.cos(uhel) * rychlost,
      vy: Math.sin(uhel) * rychlost,
      w: 6 + Math.random() * 6,
      v: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.3,
      kmit: Math.random() * Math.PI * 2,
      barva: BARVY[i % BARVY.length],
      kruh: i % 5 === 0,
    });
  }

  const start = performance.now();
  let posledni = start;
  let snimek = 0;
  const krok = (ted) => {
    const dt = Math.min(2.5, (ted - posledni) / 16.67); // přepočet na 60 fps
    posledni = ted;
    const uplynulo = ted - start;
    c2d.clearRect(0, 0, W, H);
    const pruhlednost = uplynulo > delka - 600 ? Math.max(0, (delka - uplynulo) / 600) : 1;
    c2d.globalAlpha = pruhlednost;
    for (const p of castice) {
      p.vx *= 0.985 ** dt;
      p.vy = p.vy * 0.985 ** dt + 0.32 * dt;
      p.kmit += 0.12 * dt;
      p.x += (p.vx + Math.sin(p.kmit) * 0.8) * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      if (p.y > H + 30) continue;
      c2d.save();
      c2d.translate(p.x, p.y);
      c2d.rotate(p.rot);
      c2d.fillStyle = p.barva;
      if (p.kruh) {
        c2d.beginPath();
        c2d.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        c2d.fill();
      } else {
        c2d.scale(1, Math.cos(p.kmit)); // „převracení“ papírku
        c2d.fillRect(-p.w / 2, -p.v / 2, p.w, p.v);
      }
      c2d.restore();
    }
    if (uplynulo < delka) snimek = requestAnimationFrame(krok);
    else zastavKonfety();
  };
  snimek = requestAnimationFrame(krok);

  bezi = () => {
    cancelAnimationFrame(snimek);
    window.removeEventListener("resize", velikost);
    platno.remove();
    bezi = null;
  };
  return zastavKonfety;
}

export function zastavKonfety() {
  bezi?.();
}

let oblast = null;

/** Upozornění „Nový odznak“ nahoře na obrazovce (zmizí samo, nebo po ťuknutí). */
export function oznameniOdznaku(odznak) {
  if (!oblast || !oblast.isConnected) {
    oblast = h("div", { class: "toasts", role: "status", "aria-live": "polite" });
    document.body.append(oblast);
  }
  const zavri = () => {
    toast.classList.add("odchod");
    setTimeout(() => toast.remove(), prefersReducedMotion() ? 0 : 260);
  };
  const toast = h(
    "button",
    { type: "button", class: "toast", "data-test": "toast", "data-odznak": odznak.id, onclick: zavri },
    h("span", { class: "toast-ico", "aria-hidden": "true", text: odznak.ikona }),
    h("span", { class: "toast-body" },
      h("span", { class: "toast-h", text: t("oslavy.novyOdznak") }),
      h("span", { class: "toast-name", text: nazevOdznaku(odznak) }))
  );
  oblast.append(toast);
  setTimeout(zavri, 3200);
}

/** Schová upozornění (např. na konci kola). */
export function schovejOznameni() {
  oblast?.replaceChildren();
}
