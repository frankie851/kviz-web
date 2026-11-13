// Sdílení výsledku (D-032): systémová nabídka sdílení (telefon), jinak zkopírování textu do schránky.
// Nic se neposílá na žádný server – text i odkaz si hráč pošle sám, kam chce.
import { t } from "./i18n.js";
import { kratkeOznameni } from "./oslavy.js";

/** Absolutní adresa této hry s daným hashem (funguje na GitHub Pages i lokálně). */
export function adresaWebu(hash = "") {
  return `${location.origin}${location.pathname}${hash}`;
}

/** Sdílí text s odkazem. Vrací "sdileno" | "zruseno" | "zkopirovano" | "nelze". */
export async function sdilej({ text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title: t("app.nazev"), text, url });
      return "sdileno";
    } catch (e) {
      if (e?.name === "AbortError") return "zruseno"; // hráč nabídku zavřel
    }
  }
  const cely = `${text}\n${url}`;
  try {
    await navigator.clipboard.writeText(cely);
  } catch {
    // starší prohlížeče: skryté textové pole + kopírování
    const pole = document.createElement("textarea");
    pole.value = cely;
    pole.setAttribute("readonly", "");
    pole.style.position = "fixed";
    pole.style.opacity = "0";
    document.body.append(pole);
    pole.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    pole.remove();
    if (!ok) {
      kratkeOznameni(t("sdileni.nelze"));
      return "nelze";
    }
  }
  kratkeOznameni(t("sdileni.zkopirovano"));
  return "zkopirovano";
}

/** Hvězdy jako text (půlhvězdy 0–10): „★★★½☆“. */
export function hvezdyTextem(pul) {
  const cele = Math.floor(pul / 2);
  const pulka = pul % 2 === 1;
  return "★".repeat(cele) + (pulka ? "½" : "") + "☆".repeat(5 - cele - (pulka ? 1 : 0));
}
