#!/usr/bin/env python3
"""Vyrobí obrázky značky Oho! pro sdílení a ikony (Playwright + Chromium, vlastní písma z assets/fonts).

  python3 tools/og_obrazek.py

Výstup (do gitu):
  assets/img/og.png               1200×630 – náhled odkazu (Open Graph), když někdo pošle adresu webu
  assets/img/apple-touch-icon.png 180×180  – ikona na iPhonu/iPadu (záložka, plocha)
  assets/img/icon-32.png          32×32    – záložní ikona pro prohlížeče bez SVG favicon
Spustit znovu jen při změně značky. Potřebuje: pip install playwright.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pruchod import spust_prohlizec  # noqa: E402  (stejné hledání Chromia jako průchod)

KOREN = Path(__file__).resolve().parent.parent
IMG = KOREN / "assets" / "img"
LOGO = (IMG / "logo.svg").read_text(encoding="utf-8")

PISMA = """
@font-face { font-family: "Baloo 2"; font-weight: 400 800; src: url(assets/fonts/baloo-2-latin-wght-normal.woff2); unicode-range: U+0000-00FF; }
@font-face { font-family: "Baloo 2"; font-weight: 400 800; src: url(assets/fonts/baloo-2-latin-ext-wght-normal.woff2); unicode-range: U+0100-02FF; }
@font-face { font-family: "Nunito"; font-weight: 200 1000; src: url(assets/fonts/nunito-latin-wght-normal.woff2); unicode-range: U+0000-00FF; }
@font-face { font-family: "Nunito"; font-weight: 200 1000; src: url(assets/fonts/nunito-latin-ext-wght-normal.woff2); unicode-range: U+0100-02FF; }
"""

OG = f"""<!doctype html><html><head><meta charset="utf-8"><base href="{KOREN.as_uri()}/"><style>{PISMA}
* {{ box-sizing: border-box; margin: 0; }}
body {{ width: 1200px; height: 630px; overflow: hidden; background: #FFF6EA; color: #2B1630; font-family: "Nunito"; position: relative; }}
.k1 {{ position: absolute; width: 560px; height: 560px; border-radius: 50%; background: #FFE3A1; top: -260px; right: -170px; }}
.k2 {{ position: absolute; width: 420px; height: 420px; border-radius: 50%; background: #FFD9E5; bottom: -230px; left: -150px; }}
.wrap {{ position: relative; display: flex; align-items: center; gap: 56px; height: 100%; padding: 0 90px; }}
svg {{ width: 300px; height: 300px; flex: none; }}
h1 {{ font-family: "Baloo 2"; font-weight: 800; font-size: 170px; line-height: .9; letter-spacing: -.01em; }}
h1 em {{ font-style: normal; color: #C2255C; }}
p {{ font-size: 40px; font-weight: 800; line-height: 1.2; margin-top: 18px; }}
.en {{ color: #6E5466; font-weight: 700; font-size: 34px; margin-top: 6px; }}
.chips {{ display: flex; gap: 14px; margin-top: 30px; }}
.chip {{ font-family: "Baloo 2"; font-weight: 800; font-size: 30px; padding: 8px 24px; border-radius: 999px; background: #C2255C; color: #fff; }}
.chip.s {{ background: #FFC53D; color: #2B1630; }}
</style></head><body><div class="k1"></div><div class="k2"></div>
<div class="wrap">{LOGO}<div>
<h1>Oho<em>!</em></h1>
<p>Kvíz s ověřenými otázkami</p>
<p class="en">Quiz with verified questions</p>
<div class="chips"><span class="chip">CZ · EN</span><span class="chip s">★★★★★</span></div>
</div></div></body></html>"""

IKONA = f"""<!doctype html><html><head><meta charset="utf-8"><style>
* {{ margin: 0; }} body {{ width: 180px; height: 180px; background: #FFF6EA; display: grid; place-items: center; overflow: hidden; }}
svg {{ width: 136px; height: 136px; }}
</style></head><body>{LOGO}</body></html>"""

MALA = f"""<!doctype html><html><head><meta charset="utf-8"><style>
* {{ margin: 0; }} html, body {{ background: transparent; }} body {{ width: 32px; height: 32px; overflow: hidden; }}
svg {{ width: 32px; height: 32px; display: block; }}
</style></head><body>{LOGO}</body></html>"""


def main():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = spust_prohlizec(p)
        for html, (w, h), soubor, pruhledne in [
            (OG, (1200, 630), "og.png", False),
            (IKONA, (180, 180), "apple-touch-icon.png", False),
            (MALA, (32, 32), "icon-32.png", True),
        ]:
            page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
            # přes soubor (file://), aby se načetla písma z assets/fonts
            docasny = KOREN / "tools" / "vystup" / f"_{soubor}.html"
            docasny.parent.mkdir(parents=True, exist_ok=True)
            docasny.write_text(html, encoding="utf-8")
            page.goto(docasny.as_uri(), wait_until="load")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(200)
            page.screenshot(path=str(IMG / soubor), omit_background=pruhledne)
            page.close()
            print(f"  ✓ assets/img/{soubor} ({w}×{h})")
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
