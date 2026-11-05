#!/usr/bin/env python3
"""Automatický průchod hrou a screenshoty (Playwright + Chromium).

  python3 tools/pruchod.py                    # spustí vlastní server a projde celou hru
  python3 tools/pruchod.py --vystup DIR       # kam uložit screenshoty (výchozí tools/vystup/, není v gitu)
  python3 tools/pruchod.py --bez-screenshotu  # jen průchod, bez 5 šířek
  python3 tools/pruchod.py --url https://frankie851.github.io/kviz-web/   # projde nasazený web

Ověří: první spuštění, kategorie, téma, Lehká, kolo s částí správných i špatných odpovědí,
výsledek, hvězdy, odemčení Střední; obnovení stránky → pokrok zůstal; ovládání klávesnicí;
všechny tři režimy překladu u otázky, možností i vysvětlení; jazyk otázek; přepnutí rozhraní
CZ ↔ EN bez chybějících textů; smazání pokroku; žádné chyby v konzoli; žádný síťový požadavek
mimo vlastní adresu. Pak screenshoty 5 obrazovek na šířkách 320, 360, 390, 768 a 1280 px
a kontrola, že nic nepřetéká do stran.

Návratový kód 0 = vše prošlo, 1 = něco selhalo (vypíše co).
Potřebuje: pip install playwright (v prostředí B je předinstalovaný). Chromium se hledá
nejdřív standardně, pak v /opt/pw-browsers.
"""
import argparse
import functools
import glob
import http.server
import json
import re
import socketserver
import sys
import threading
from pathlib import Path

KOREN = Path(__file__).resolve().parent.parent
SIRKY = [320, 360, 390, 768, 1280]
VYSKY = {320: 640, 360: 760, 390: 844, 768: 1024, 1280: 900}

chyby = []
ok_kroky = []


def chyba(msg):
    chyby.append(msg)
    print(f"  ✗ {msg}")


def ok(msg):
    ok_kroky.append(msg)
    print(f"  ✓ {msg}")


def over(podminka, msg):
    if podminka:
        ok(msg)
    else:
        chyba(msg)
    return podminka


# ---------------------------------------------------------------- statické kontroly textů
def klice(d, p=""):
    out = set()
    for k, v in d.items():
        q = f"{p}.{k}" if p else k
        if isinstance(v, dict) and not set(v) <= {"one", "few", "many", "other"}:
            out |= klice(v, q)
        else:
            out.add(q)
    return out


def kontrola_textu():
    print("Texty rozhraní (i18n):")
    slovniky = {j: json.loads((KOREN / f"assets/i18n/{j}.json").read_text(encoding="utf-8")) for j in ("cs", "en")}
    k = {j: klice(d) for j, d in slovniky.items()}
    over(k["cs"] == k["en"], f"cs.json a en.json mají stejné klíče ({len(k['cs'])})")
    for j in ("cs", "en"):
        jinde = k["en" if j == "cs" else "cs"] - k[j]
        if jinde:
            chyba(f"v {j}.json chybí: {sorted(jinde)}")
    pouzite = set()
    for f in (KOREN / "assets/js").rglob("*.js"):
        pouzite |= set(re.findall(r"""\bt\(\s*["']([\w.\-]+)["']""", f.read_text(encoding="utf-8")))
    chybi = sorted(x for x in pouzite if x not in k["cs"] and not any(y.startswith(x + ".") for y in k["cs"]))
    over(not chybi, f"všech {len(pouzite)} pevných klíčů z kódu je v textech" + (f" – chybí {chybi}" if chybi else ""))


# ---------------------------------------------------------------- server
def spust_server():
    class Tichy(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    handler = functools.partial(Tichy, directory=str(KOREN))
    class Server(socketserver.ThreadingTCPServer):
        def handle_error(self, *a):  # prohlížeč občas zavře spojení dřív – není to chyba aplikace
            pass

    httpd = Server(("127.0.0.1", 0), handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, f"http://127.0.0.1:{httpd.server_address[1]}/"


def spust_prohlizec(p):
    try:
        return p.chromium.launch()
    except Exception:
        for cesta in sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome")) + ["/opt/pw-browsers/chromium"]:
            if Path(cesta).exists():
                return p.chromium.launch(executable_path=cesta)
        raise


# ---------------------------------------------------------------- data
def nacti_data():
    index = json.loads((KOREN / "data/index.json").read_text(encoding="utf-8"))
    otazky = {}
    for kat in index["kategorie"]:
        for tema in kat["temata"]:
            d = json.loads((KOREN / "data" / tema["soubor"]).read_text(encoding="utf-8"))
            for q in d["otazky"]:
                otazky[q["id"]] = q
    # téma pro průchod: první s aspoň 3 viditelnými obtížnostmi (jinak první vůbec)
    kandidati = [(k, t) for k in index["kategorie"] for t in k["temata"]]
    plna = [(k, t) for k, t in kandidati if all(t["otazek"].get(o, 0) >= 3 for o in ("1", "2", "3"))]
    kat, tema = (plna or kandidati)[0]
    return index, otazky, kat, tema


# ---------------------------------------------------------------- pomocníci pro stránku
class Hlidac:
    """Sbírá chyby konzole a požadavky mimo vlastní adresu."""

    def __init__(self, zaklad):
        self.zaklad = zaklad
        self.konzole = []
        self.cizi = []

    def pripoj(self, page):
        page.on("console", lambda m: self.konzole.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: self.konzole.append(f"chyba stránky: {e}"))
        page.on("request", lambda r: None if r.url.startswith(self.zaklad) or r.url.startswith("data:") else self.cizi.append(r.url))


def jdi(page, zaklad, hash_):
    page.goto(zaklad + hash_)
    page.wait_for_selector("#app main", timeout=10000)
    page.wait_for_timeout(150)


def text_stranky(page):
    return page.inner_text("body")


def bez_chybejicich_textu(page, kde):
    t = text_stranky(page)
    nalez = re.findall(r"⟦[^⟧]*⟧", t)
    if nalez:
        chyba(f"{kde}: chybějící texty {sorted(set(nalez))}")
        return False
    return True


def zodpovez(page, otazky, spravne=True, klavesnice=False, zkus_druhe=False):
    """Odpoví na aktuální otázku. Vrátí (id otázky, zvolený index, správný index)."""
    qid = page.get_attribute(".qcard", "data-qid")
    q = otazky[qid]
    sp = q["spravne"]
    volba = sp if spravne else (sp + 1) % len(q["moznosti"]["cs"])
    if klavesnice:
        page.keyboard.press(str(volba + 1) if volba % 2 == 0 else "abcd"[volba])
    else:
        page.click(f'.ans[data-index="{volba}"]')
    page.wait_for_selector("[data-test=vysvetleni]")
    if zkus_druhe:
        jina = (volba + 2) % 4
        page.click(f'.ans[data-index="{jina}"]', force=True)  # force: tlačítko je už aria-disabled
        over(page.locator(".ans.ok").count() == 1 and page.locator(".ans.bad").count() == (0 if spravne else 1)
             and page.get_attribute(f'.ans[data-index="{jina}"]', "class").find("bad") < 0,
             "druhé ťuknutí na odpověď už nic nezmění")
    return qid, volba, sp


def dalsi(page, klavesnice=False):
    if klavesnice:
        page.keyboard.press("Enter")
    else:
        page.click("[data-test=dalsi]")
    page.wait_for_timeout(60)


def zahraj_kolo(page, otazky, spatnych=0, klavesnice=False, kontroly=False):
    """Zahraje celé kolo; posledních `spatnych` otázek odpoví špatně. Vrátí počet otázek."""
    n = int(page.inner_text("[data-test=pocitadlo]").split("/")[1])
    for i in range(n):
        spravne = i < n - spatnych
        qid, volba, sp = zodpovez(page, otazky, spravne, klavesnice, zkus_druhe=kontroly and i == 0)
        if kontroly and i in (0, n - 1):
            ok_bunka = page.get_attribute(f'.ans[data-index="{sp}"]', "class")
            over("ok" in ok_bunka, f"otázka {i + 1}: správná odpověď je zelená")
            if not spravne:
                over("bad" in page.get_attribute(f'.ans[data-index="{volba}"]', "class"), f"otázka {i + 1}: špatná volba je červená")
            over(page.is_visible("[data-test=vysvetleni]"), f"otázka {i + 1}: panel Věděli jste? je vidět")
        if kontroly and i == 0:
            over(not page.is_visible("[data-test=serie]"), "po 1 správné odpovědi série 🔥 ještě není vidět")
        if kontroly and i == 1:
            over(page.is_visible("[data-test=serie]") and "2" in page.inner_text("[data-test=serie]"), "série 🔥 se ukazuje od 2 správných")
        dalsi(page, klavesnice)
    page.wait_for_selector("[data-test=skore]", timeout=5000)
    return n


# ---------------------------------------------------------------- scénáře
def scenar_hry(page, zaklad, otazky, kat, tema):
    T = tema["id"]
    max_hvezd = None
    print("První spuštění:")
    jdi(page, zaklad, "")
    over(page.url.endswith("#/vitej"), "bez nastavení se otevře první spuštění")
    over(page.get_attribute('[data-jazyk="cs"]', "aria-pressed") == "true", "čeština předvyplněná podle jazyka prohlížeče")
    page.click("[data-test=pokracovat]")
    over(page.locator("[data-zpusob]").count() == 3, "3 způsoby hraní")
    page.click('[data-zpusob="muj"]')
    page.wait_for_selector("[data-test=hrat]")
    over(page.url.endswith("#/"), "po 2 krocích je hráč Domů")
    max_hvezd = page.inner_text("[data-test=hvezdy-celkem]").split("/")[1].strip()
    over(page.inner_text("[data-test=hvezdy-celkem]").startswith("0"), "na začátku 0 hvězd")
    bez_chybejicich_textu(page, "Domů")

    print("Kategorie → téma → Lehká:")
    page.click("[data-test=hrat]")
    page.wait_for_selector(".tile")
    bez_chybejicich_textu(page, "Kategorie")
    page.click(f'.tile[data-kategorie="{kat["id"]}"]')
    page.wait_for_selector(f'.topic[data-tema="{T}"]')
    bez_chybejicich_textu(page, "Témata")
    page.click(f'.topic[data-tema="{T}"]')
    page.wait_for_selector(".diff")
    bez_chybejicich_textu(page, "Obtížnost")
    over(page.locator('a.diff[data-obtiznost="1"]').count() == 1, "Lehká je otevřená")
    over(page.locator('.diff.locked[data-obtiznost="2"]').count() == 1, "Střední je zamčená")
    over(page.locator('.diff.locked[data-obtiznost="3"]').count() == 1, "Těžká je zamčená")
    page.click('a.diff[data-obtiznost="1"]')
    page.wait_for_selector(".qcard")
    bez_chybejicich_textu(page, "Otázka")

    print("Kolo s 2 špatnými odpověďmi:")
    n = zahraj_kolo(page, otazky, spatnych=2, kontroly=True)
    ocek = n - 2
    over(page.inner_text("[data-test=skore]").startswith(f"{ocek} / {n}"), f"výsledek {ocek} / {n}")
    hv = page.locator(".stars-big .star.on").count()
    ocek_h = 3 if ocek * 10 >= n * 9 else 2 if ocek * 10 >= n * 7 else 1 if ocek * 10 >= n * 5 else 0
    over(hv == ocek_h, f"hvězdy za kolo: {hv} (očekávám {ocek_h})")
    over(page.locator("[data-test=odemceno]").count() == (1 if ocek_h >= 2 else 0), "„Odemčeno: Střední“ se ukáže")
    over(page.locator("[data-test=nove-odznaky]").count() == 1 and "První kolo" in page.inner_text("[data-test=nove-odznaky]"), "nový odznak První kolo")
    bez_chybejicich_textu(page, "Výsledek")

    print("Obnovení stránky:")
    page.reload()
    page.wait_for_selector("[data-test=skore]")
    over(page.inner_text("[data-test=skore]").startswith(f"{ocek} / {n}"), "výsledek po obnovení zůstal")
    jdi(page, zaklad, "#/")
    over(page.inner_text("[data-test=hvezdy-celkem]").startswith(f"{ocek_h} /"), f"Domů: {ocek_h} hvězdy celkem i po obnovení")
    over(page.inner_text("[data-test=dny]").startswith("1"), "série dní = 1")
    jdi(page, zaklad, f"#/tema/{T}")
    over(page.locator('a.diff[data-obtiznost="2"]').count() == 1, "Střední zůstala odemčená")

    print("Střední celá klávesnicí (1–4 / A–D, Enter):")
    page.click('a.diff[data-obtiznost="2"]')
    page.wait_for_selector(".qcard")
    zahraj_kolo(page, otazky, spatnych=0, klavesnice=True)
    over(page.locator(".stars-big .star.on").count() == 3, "bez chyby = ★★★")
    over("Těžká" in page.inner_text("[data-test=odemceno]"), "odemčena Těžká")
    over(page.locator("[data-test=dalsi-obtiznost]").count() == 1, "tlačítko Další obtížnost")
    nove = page.inner_text("[data-test=nove-odznaky]")
    over("Bez chyby" in nove and "Neomylný" in nove, "odznaky Bez chyby a Neomylný")
    return max_hvezd


def nastav(page, zaklad, skupina, hodnota):
    jdi(page, zaklad, "#/nastaveni")
    page.click(f'[aria-labelledby="{skupina}"] [data-hodnota="{hodnota}"]')
    page.wait_for_timeout(100)


def zacni_kolo(page, zaklad, T, obt="1"):
    jdi(page, zaklad, f"#/hra/{T}/{obt}")
    page.wait_for_selector(".qcard")


def ukonci_kolo(page):
    """Zpět z kola; po první odpovědi se aplikace zeptá (dialog uvnitř aplikace)."""
    rozehrano = page.locator("[data-test=vysvetleni]").count() > 0
    page.click(".qtop .iconbtn")
    if rozehrano:
        page.wait_for_selector(".dialog")
        page.click(".dialog .btn-primary")
    page.wait_for_selector(".diff")


def scenar_prekladu(page, zaklad, otazky, T):
    print("Překlad – vždy:")
    nastav(page, zaklad, "nast-preklad", "vzdy")
    zacni_kolo(page, zaklad, T)
    q = otazky[page.get_attribute(".qcard", "data-qid")]
    over(page.is_visible(".qtext .tr") and page.inner_text(".qtext .tr") == q["otazka"]["en"], "otázka má viditelný anglický překlad")
    lisi = [i for i in range(4) if q["moznosti"]["cs"][i] != q["moznosti"]["en"][i]]
    vid = [page.is_visible(f'.ans[data-index="{i}"] .tr') for i in lisi]
    over(all(vid), f"možnosti mají viditelný překlad ({len(lisi)} ze 4 se liší)")
    zodpovez(page, otazky)
    over(page.is_visible(".explain .tr") and page.inner_text(".explain .tr") == q["vysvetleni"]["en"], "vysvětlení má viditelný překlad")
    ukonci_kolo(page)

    print("Překlad – na ťuknutí:")
    nastav(page, zaklad, "nast-preklad", "tuknuti")
    zacni_kolo(page, zaklad, T)
    q = otazky[page.get_attribute(".qcard", "data-qid")]
    over(not page.is_visible(".qtext .tr"), "překlad otázky je schovaný")
    page.click(".qcard [data-test=prelozit]")
    over(page.is_visible(".qtext .tr"), "po ťuknutí je překlad otázky vidět")
    lisi = [i for i in range(4) if q["moznosti"]["cs"][i] != q["moznosti"]["en"][i]]
    over(all(page.is_visible(f'.ans[data-index="{i}"] .tr') for i in lisi), "po ťuknutí jsou přeložené i možnosti")
    zodpovez(page, otazky, spravne=False)
    over(page.is_visible(".qtext .tr"), "překlad otázky zůstal zobrazený i po odpovědi")
    over(not page.is_visible(".explain .tr"), "překlad vysvětlení je schovaný")
    page.click(".explain [data-test=prelozit]")
    over(page.is_visible(".explain .tr"), "po ťuknutí je přeložené i vysvětlení")
    ukonci_kolo(page)

    print("Překlad – vypnuto:")
    nastav(page, zaklad, "nast-preklad", "vypnuto")
    zacni_kolo(page, zaklad, T)
    zodpovez(page, otazky)
    over(not page.locator(".tr:visible").count() and not page.locator("[data-test=prelozit]").count(), "žádný překlad ani tlačítko Přeložit")
    ukonci_kolo(page)

    print("Jazyk otázek = angličtina, rozhraní česky:")
    nastav(page, zaklad, "nast-otazky", "en")
    nastav(page, zaklad, "nast-preklad", "tuknuti")
    zacni_kolo(page, zaklad, T)
    q = otazky[page.get_attribute(".qcard", "data-qid")]
    over(page.get_attribute(".qtext .orig", "lang") == "en" and page.inner_text(".qtext .orig") == q["otazka"]["en"], "otázka je anglicky")
    page.click(".qcard [data-test=prelozit]")
    over(page.inner_text(".qtext .tr") == q["otazka"]["cs"], "překlad je česky")
    ukonci_kolo(page)
    nastav(page, zaklad, "nast-otazky", "cs")


def scenar_jazyka(page, zaklad, T, kat_id):
    print("Rozhraní anglicky (všechny obrazovky):")
    nastav(page, zaklad, "nast-ui", "en")
    over(page.get_attribute("html", "lang") == "en", "html lang = en")
    obrazovky = [("#/", "Play"), ("#/kategorie", "Categories"), (f"#/kategorie/{kat_id}", "Pick a topic"), (f"#/tema/{T}", "Easy"),
                 (f"#/hra/{T}/1", "Quit"), ("#/vysledek", "Play again"), ("#/odznaky", "Badges"), ("#/nastaveni", "Settings")]
    for h_, slovo in obrazovky:
        jdi(page, zaklad, h_)
        if h_.startswith("#/hra"):
            page.wait_for_selector(".qcard")
            zodpovez_libovolne(page)
            txt = text_stranky(page) + (page.get_attribute(".qtop .iconbtn", "aria-label") or "")
        else:
            txt = text_stranky(page)
        bez_chybejicich_textu(page, f"EN {h_}")
        cesky = [w for w in ("Nastavení", "Hrát", "Kategorie", "Lehká", "Odznaky", "Další", "Znovu", "Věděli") if w in txt]
        over(slovo in txt and not cesky, f"EN {h_}: anglické texty" + (f" (česky zůstalo: {cesky})" if cesky else ""))
    jdi(page, zaklad, "#/vitej")
    page.wait_for_timeout(100)
    bez_chybejicich_textu(page, "EN první spuštění")
    nastav(page, zaklad, "nast-ui", "cs")
    over(page.get_attribute("html", "lang") == "cs", "zpět na češtinu")


def zodpovez_libovolne(page):
    page.click('.ans[data-index="0"]')
    page.wait_for_selector("[data-test=vysvetleni]")


def scenar_odznaku_a_smazani(page, zaklad):
    print("Odznaky a smazání pokroku:")
    jdi(page, zaklad, "#/odznaky")
    over(page.locator(".bcard").count() >= 10, f"{page.locator('.bcard').count()} odznaků na obrazovce Odznaky")
    over(page.locator(".bcard.earned").count() >= 3, "získané odznaky jsou označené")
    bez_chybejicich_textu(page, "Odznaky")
    jdi(page, zaklad, "#/nastaveni")
    page.click("[data-test=smazat]")
    page.wait_for_selector(".dialog")
    over(page.locator(".dialog").count() == 1, "potvrzení uvnitř aplikace")
    page.click(".dialog .btn-sec")
    over(page.locator(".dialog").count() == 0, "Zrušit dialog zavře")
    page.click("[data-test=smazat]")
    page.click(".dialog .btn-danger")
    page.wait_for_selector("[data-test=hvezdy-celkem]")
    over(page.inner_text("[data-test=hvezdy-celkem]").startswith("0"), "po smazání 0 hvězd")
    over(not page.url.endswith("#/vitej"), "nastavení po smazání pokroku zůstalo")


# ---------------------------------------------------------------- screenshoty
def screenshoty(browser, zaklad, hlidac, otazky, T, vystup):
    print(f"Screenshoty a přetékání ({', '.join(map(str, SIRKY))} px) → {vystup}")
    vystup.mkdir(parents=True, exist_ok=True)
    stav_nast = {"ui": "cs", "otazky": "cs", "preklad": "vzdy", "zvuky": True, "vibrace": True}
    for w in SIRKY:
        ctx = browser.new_context(viewport={"width": w, "height": VYSKY[w]}, locale="cs-CZ", device_scale_factor=1)
        page = ctx.new_page()
        hlidac.pripoj(page)
        page.goto(zaklad)
        page.evaluate("s => localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(s))", stav_nast)
        page.reload()
        # rychlé kolo, aby byl výsledek a nějaké hvězdy
        zacni_kolo(page, zaklad, T)
        zahraj_kolo(page, otazky, spatnych=2, klavesnice=True)
        snimky = [("1-domu", "#/", None), ("2-kategorie", "#/kategorie", None), ("3-otazka", f"#/hra/{T}/1", "odpoved"),
                  ("4-vysledek", "#/vysledek", None), ("5-nastaveni", "#/nastaveni", None)]
        for nazev, h_, akce in snimky:
            jdi(page, zaklad, h_)
            if akce == "odpoved":
                page.wait_for_selector(".qcard")
                zodpovez(page, otazky, spravne=False)
                page.mouse.move(0, 0)
                page.wait_for_timeout(400)
            page.wait_for_timeout(700)  # animace hvězd
            pretek = page.evaluate("""() => {
                const W = document.documentElement.clientWidth, out = [];
                if (document.documentElement.scrollWidth > W + 1) out.push('stránka ' + document.documentElement.scrollWidth + ' > ' + W);
                for (const el of document.querySelectorAll('#app *:not(.sr-only)')) {
                  const r = el.getBoundingClientRect();
                  if (r.width && (r.right > W + 1 || r.left < -1)) out.push((el.className || el.tagName) + ' ' + Math.round(r.left) + '–' + Math.round(r.right));
                  if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible' && el.clientWidth) out.push('ořez: ' + (el.className || el.tagName));
                }
                return out.slice(0, 5);
            }""")
            if pretek:
                chyba(f"{w} px {nazev}: přetéká – {pretek}")
            page.screenshot(path=str(vystup / f"{nazev}-{w}.png"), full_page=True)
        ok(f"{w} px: 5 screenshotů" + ("" if not any(str(w) in c for c in chyby) else " (s nálezy výše)"))
        ctx.close()


# ---------------------------------------------------------------- hlavní běh
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", help="adresa nasazeného webu (jinak se spustí lokální server)")
    ap.add_argument("--vystup", default=str(KOREN / "tools" / "vystup"), help="složka na screenshoty")
    ap.add_argument("--bez-screenshotu", action="store_true")
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Chybí Playwright: pip install playwright")
        return 2

    kontrola_textu()
    index, otazky, kat, tema = nacti_data()
    print(f"Data: režim {index.get('rezim')}, {len(otazky)} otázek; průchod tématem {tema['id']} ({kat['id']})")

    httpd = None
    if args.url:
        zaklad = args.url if args.url.endswith("/") else args.url + "/"
    else:
        httpd, zaklad = spust_server()
    hlidac = Hlidac(zaklad)

    with sync_playwright() as p:
        browser = spust_prohlizec(p)
        ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ")
        page = ctx.new_page()
        page.set_default_timeout(8000)
        hlidac.pripoj(page)
        kroky = [
            lambda: scenar_hry(page, zaklad, otazky, kat, tema),
            lambda: scenar_prekladu(page, zaklad, otazky, tema["id"]),
            lambda: scenar_jazyka(page, zaklad, tema["id"], kat["id"]),
            lambda: scenar_odznaku_a_smazani(page, zaklad),
        ]
        for krok in kroky:
            try:
                krok()
            except Exception as e:  # jeden rozbitý scénář nesmí zastavit ostatní
                chyba(f"scénář spadl: {type(e).__name__}: {str(e).splitlines()[0]}")
        ctx.close()

        if not args.bez_screenshotu:
            try:
                screenshoty(browser, zaklad, hlidac, otazky, tema["id"], Path(args.vystup))
            except Exception as e:
                chyba(f"screenshoty spadly: {type(e).__name__}: {str(e).splitlines()[0]}")
        browser.close()

    print("Konzole a síť:")
    over(not hlidac.konzole, "žádné chyby ani varování v konzoli" + (f": {hlidac.konzole[:5]}" if hlidac.konzole else ""))
    over(not hlidac.cizi, "žádný požadavek mimo vlastní adresu" + (f": {sorted(set(hlidac.cizi))[:5]}" if hlidac.cizi else ""))
    if httpd:
        httpd.shutdown()

    print()
    if chyby:
        print(f"PRŮCHOD SELHAL – {len(chyby)} chyb, {len(ok_kroky)} kontrol prošlo")
        for c in chyby:
            print(f"  - {c}")
        return 1
    print(f"PRŮCHOD PROŠEL – {len(ok_kroky)} kontrol")
    return 0


if __name__ == "__main__":
    sys.exit(main())
