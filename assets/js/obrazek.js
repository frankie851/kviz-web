// Obrázek s výsledkem ke sdílení (D-041): čtvercová kartička 1080 × 1080 px s logem, názvem, hvězdami nebo
// čtverečky, skóre a adresou webu. Kreslí se v prohlížeči (canvas) – nic se neposílá na server. Barvy jsou
// v CSS proměnných --obr-* (vždy světlá značka, tmavý režim ani vysoký kontrast je nemění).
import { t } from "./i18n.js";
import { h } from "./ui.js";
import { adresaWebu, sdilej } from "./sdileni.js";
import { kratkeOznameni } from "./oslavy.js";

export const ROZMER = 1080;
const FONT_H = '"Baloo 2", system-ui, sans-serif';
const FONT_T = '"Nunito", system-ui, sans-serif';
const VZOREK = "Oho! ěščřžýáíéůú ĚŠČŘŽÝÁÍÉŮÚ 0123456789";

function barvy() {
  const st = getComputedStyle(document.documentElement);
  const v = (n) => st.getPropertyValue(`--obr-${n}`).trim();
  return { bg: v("bg"), karta: v("karta"), ink: v("ink"), muted: v("muted"), primary: v("primary"), sun: v("sun"),
    hvezdaOff: v("hvezda-off"), ok: v("ok"), bad: v("bad"), deco1: v("deco1"), deco2: v("deco2"), plocha: v("plocha") };
}

async function nactiPisma() {
  try {
    await Promise.all([
      document.fonts.load(`800 64px ${FONT_H}`, VZOREK),
      document.fonts.load(`800 34px ${FONT_T}`, VZOREK),
      document.fonts.load(`700 34px ${FONT_T}`, VZOREK),
    ]);
  } catch { /* bez písma se kreslí náhradním */ }
}

/** Rozdělí text do řádků podle šířky (dlouhé slovo se zalomí po znacích); nejvýš max řádků (poslední s „…“). */
function radky(ctx, text, sirka, max) {
  const slova = String(text).split(/\s+/).filter(Boolean);
  const out = [];
  let radek = "";
  const pridej = (slovo) => {
    const zkus = radek ? `${radek} ${slovo}` : slovo;
    if (ctx.measureText(zkus).width <= sirka) { radek = zkus; return; }
    if (radek) out.push(radek);
    radek = "";
    if (ctx.measureText(slovo).width <= sirka) { radek = slovo; return; }
    for (const znak of slovo) { // příliš dlouhé slovo
      if (ctx.measureText(radek + znak).width > sirka) { out.push(radek); radek = znak; } else radek += znak;
    }
  };
  slova.forEach(pridej);
  if (radek) out.push(radek);
  if (out.length > max) {
    out.length = max;
    let r = out[max - 1];
    while (r && ctx.measureText(`${r}…`).width > sirka) r = r.slice(0, -1);
    out[max - 1] = `${r.trimEnd()}…`;
  }
  return out;
}

function zaoblenyObdelnik(ctx, x, y, w, hgt, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, hgt, r) : ctx.rect(x, y, w, hgt);
}

function hvezda(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const uhel = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.48;
    ctx.lineTo(cx + rr * Math.cos(uhel), cy + rr * Math.sin(uhel));
  }
  ctx.closePath();
}

/** Řada 5 hvězd z půlhvězd (0–10). */
function kresliHvezdy(ctx, b, pul, stred, y) {
  const r = 58;
  const krok = 136;
  const x0 = stred - 2 * krok;
  for (let i = 0; i < 5; i++) {
    const cx = x0 + i * krok;
    hvezda(ctx, cx, y, r);
    ctx.fillStyle = b.hvezdaOff;
    ctx.fill();
    const plna = pul >= (i + 1) * 2;
    const pulka = !plna && pul === i * 2 + 1;
    if (plna || pulka) {
      ctx.save();
      if (pulka) { ctx.beginPath(); ctx.rect(cx - r, y - r, r, 2 * r); ctx.clip(); hvezda(ctx, cx, y, r); }
      ctx.fillStyle = b.sun;
      ctx.fill();
      ctx.restore();
    }
  }
}

/** Řada čtverečků správně / špatně (denní výzva). */
function kresliCtverecky(ctx, b, vysledky, stred, y) {
  const s = 110;
  const mezera = 26;
  const x0 = stred - (vysledky.length * s + (vysledky.length - 1) * mezera) / 2;
  vysledky.forEach((ok, i) => {
    zaoblenyObdelnik(ctx, x0 + i * (s + mezera), y - s / 2, s, s, 22);
    ctx.fillStyle = ok ? b.ok : b.bad;
    ctx.fill();
  });
}

/** Tři čísla vedle sebe (měsíční souhrn). */
function kresliTrojici(ctx, b, trojice, x, y, sirka) {
  const mezera = 24;
  const w = (sirka - 2 * mezera) / 3;
  trojice.forEach(([hodnota, popis], i) => {
    const bx = x + i * (w + mezera);
    zaoblenyObdelnik(ctx, bx, y, w, 170, 30);
    ctx.fillStyle = b.plocha;
    ctx.fill();
    ctx.fillStyle = b.ink;
    ctx.font = `800 72px ${FONT_H}`;
    ctx.fillText(String(hodnota), bx + w / 2, y + 92);
    ctx.fillStyle = b.muted;
    ctx.font = `700 30px ${FONT_T}`;
    ctx.fillText(radky(ctx, popis, w - 20, 1)[0] || "", bx + w / 2, y + 140);
  });
}

/**
 * Nakreslí kartičku a vrátí PNG (Blob).
 * o = { nadpisMaly, nadpis, hvezdy?: půlhvězdy 0–10, ctverecky?: [true/false], trojice?: [[hodnota, popis]×3],
 *       skore?, popisek?, radky?: [text], vyzva? }
 */
export async function vyrobObrazek(o) {
  await nactiPisma();
  const b = barvy();
  const c = document.createElement("canvas");
  c.width = ROZMER;
  c.height = ROZMER;
  const ctx = c.getContext("2d");
  const S = ROZMER / 2;
  // pozadí s ozdobnými kruhy jako na webu
  ctx.fillStyle = b.bg;
  ctx.fillRect(0, 0, ROZMER, ROZMER);
  ctx.fillStyle = b.deco1;
  ctx.beginPath(); ctx.arc(990, 70, 250, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = b.deco2;
  ctx.beginPath(); ctx.arc(70, 1030, 200, 0, Math.PI * 2); ctx.fill();
  // logo + Oho!
  ctx.save();
  ctx.translate(76, 52);
  ctx.scale(1.25, 1.25);
  ctx.fillStyle = b.primary;
  ctx.fill(new Path2D("M48 8a38 38 0 1 1-19.6 70.6L12 86l5.2-15.4A38 38 0 0 1 48 8z"));
  ctx.fillStyle = b.karta;
  ctx.fill(new Path2D("M48 22a6 6 0 0 1 6 6v22a6 6 0 0 1-12 0V28a6 6 0 0 1 6-6z"));
  ctx.beginPath(); ctx.arc(48, 68, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = b.sun;
  ctx.fill(new Path2D("M80 4l3.4 9.6L93 17l-9.6 3.4L80 30l-3.4-9.6L67 17l9.6-3.4z"));
  ctx.restore();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = `800 104px ${FONT_H}`;
  const zaklad = t("app.nazevZaklad");
  ctx.fillStyle = b.ink;
  ctx.fillText(zaklad, 210, 158);
  ctx.fillStyle = b.primary;
  ctx.fillText("!", 210 + ctx.measureText(zaklad).width, 158);

  // karta
  const kx = 70;
  const ky = 230;
  const kw = ROZMER - 2 * kx;
  const kh = 660;
  ctx.save();
  ctx.shadowColor = "rgba(43, 22, 48, .12)";
  ctx.shadowOffsetY = 8;
  zaoblenyObdelnik(ctx, kx, ky, kw, kh, 48);
  ctx.fillStyle = b.karta;
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  // obsah karty svisle na střed: nejdřív výška všech částí, pak odsazení shora
  ctx.font = `800 62px ${FONT_H}`;
  const pocetNadpisu = radky(ctx, o.nadpis || "", kw - 100, o.trojice ? 1 : 2).length;
  const textu = [o.popisek, ...(o.radky || [])].filter(Boolean).length;
  const vyska = 20 + 68 * pocetNadpisu + (o.hvezdy != null ? 190 : 0) + (o.ctverecky ? 190 : 0) + (o.trojice ? 230 : 0) + (o.skore ? 110 : 0) + 56 * textu;
  const volno = ky + kh - 50 - (ky + 86 + vyska);
  let y = ky + 86 + Math.max(0, Math.floor(volno / 2));
  ctx.fillStyle = b.muted;
  ctx.font = `800 34px ${FONT_T}`;
  ctx.fillText(radky(ctx, String(o.nadpisMaly || "").toUpperCase(), kw - 100, 1)[0] || "", S, y);
  ctx.fillStyle = b.ink;
  ctx.font = `800 62px ${FONT_H}`;
  const nadpis = radky(ctx, o.nadpis || "", kw - 100, o.trojice ? 1 : 2);
  y += 20;
  for (const r of nadpis) { y += 68; ctx.fillText(r, S, y); }

  if (o.hvezdy != null) { kresliHvezdy(ctx, b, o.hvezdy, S, y + 110); y += 190; }
  if (o.ctverecky) { kresliCtverecky(ctx, b, o.ctverecky, S, y + 110); y += 190; }
  if (o.trojice) { kresliTrojici(ctx, b, o.trojice, kx + 50, y + 44, kw - 100); y += 230; }
  if (o.skore) {
    ctx.fillStyle = b.ink;
    ctx.font = `800 120px ${FONT_H}`;
    y += 110;
    ctx.fillText(o.skore, S, y);
  }
  ctx.fillStyle = b.muted;
  ctx.font = `700 38px ${FONT_T}`;
  for (const r of [o.popisek, ...(o.radky || [])].filter(Boolean)) {
    if (y + 56 > ky + kh - 30) break;
    y += 56;
    ctx.fillText(radky(ctx, r, kw - 100, 1)[0], S, y);
  }

  // výzva a adresa webu
  ctx.fillStyle = b.primary;
  ctx.font = `800 52px ${FONT_H}`;
  ctx.fillText(o.vyzva || t("obrazek.vyzva"), S, 975);
  ctx.fillStyle = b.muted;
  ctx.font = `700 32px ${FONT_T}`;
  ctx.fillText(adresaWebu("").replace(/^https?:\/\//, "").replace(/\/$/, ""), S, 1030);

  return new Promise((ok, chyba) => c.toBlob((blob) => (blob ? ok(blob) : chyba(new Error("toBlob"))), "image/png"));
}

let otevreny = null;

/**
 * Tlačítko „🖼️ Obrázek“: vyrobí kartičku a ukáže ji v okně s tlačítky Sdílet obrázek (když to telefon umí)
 * a Stáhnout obrázek. data = parametry pro vyrobObrazek, text + url = text k obrázku při sdílení.
 */
export function tlacitkoObrazku({ data, text, url, soubor, test = "obrazek", trida = "btn btn-sec btn-big" }) {
  return h("button", { type: "button", class: trida, "data-test": test, onclick: () => ukazObrazek({ data: data(), text, url, soubor }) },
    h("span", { "aria-hidden": "true", text: "🖼️ " }), t("obrazek.tlacitko"));
}

export async function ukazObrazek({ data, text, url, soubor = "oho-vysledek.png" }) {
  if (otevreny?.isConnected) return;
  const predtim = document.activeElement;
  const blob = await vyrobObrazek(data);
  const adresa = URL.createObjectURL(blob);
  const file = typeof File === "function" ? new File([blob], soubor, { type: "image/png" }) : null;
  const lzeSdilet = !!(file && navigator.canShare?.({ files: [file] }));

  const zavri = () => {
    okno.remove();
    otevreny = null;
    document.removeEventListener("keydown", klavesa);
    window.removeEventListener("hashchange", zavri);
    setTimeout(() => URL.revokeObjectURL(adresa), 1000);
    predtim?.focus?.({ preventScroll: true });
  };
  const klavesa = (e) => { if (e.key === "Escape") zavri(); };
  const sdilet = lzeSdilet
    ? h("button", { type: "button", class: "btn btn-primary btn-big", "data-test": "obrazek-sdilet",
        onclick: async () => {
          try { await navigator.share({ files: [file], text: `${text}\n${url}` }); } catch (e) {
            if (e?.name !== "AbortError") sdilej({ text, url });
          }
        } }, h("span", { "aria-hidden": "true", text: "📤 " }), t("obrazek.sdilet"))
    : null;
  const stahnout = h("a", { class: `btn ${lzeSdilet ? "btn-sec" : "btn-primary"} btn-big`, href: adresa, download: soubor, "data-test": "obrazek-stahnout",
    onclick: () => kratkeOznameni(t("obrazek.stazeno")) },
  h("span", { "aria-hidden": "true", text: "💾 " }), t("obrazek.stahnout"));
  const okno = h("div", { class: "dialog-pozadi", "data-test": "obrazek-okno", onclick: (e) => { if (e.target === okno) zavri(); } },
    h("div", { class: "dialog card obrazek-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "obrazek-nadpis" },
      h("h2", { class: "dialog-h", id: "obrazek-nadpis", text: t("obrazek.nadpis") }),
      h("img", { class: "obrazek-nahled", src: adresa, alt: t("obrazek.alt"), width: String(ROZMER), height: String(ROZMER), "data-test": "obrazek-nahled" }),
      sdilet,
      stahnout,
      h("p", { class: "field-hint", text: lzeSdilet ? t("obrazek.napovedaSdilet") : t("obrazek.napovedaStahnout") }),
      h("button", { type: "button", class: "btn btn-sec", "data-test": "obrazek-zavrit", onclick: zavri, text: t("obrazek.zavrit") })));
  otevreny = okno;
  document.body.append(okno);
  document.addEventListener("keydown", klavesa);
  window.addEventListener("hashchange", zavri); // odchod z obrazovky okno zavře
  (sdilet || stahnout).focus({ preventScroll: true });
}
