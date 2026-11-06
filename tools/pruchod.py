#!/usr/bin/env python3
"""Automatický průchod hrou a screenshoty (Playwright + Chromium).

  python3 tools/pruchod.py                    # spustí vlastní server a projde celou hru
  python3 tools/pruchod.py --vystup DIR       # kam uložit screenshoty (výchozí tools/vystup/, není v gitu)
  python3 tools/pruchod.py --bez-screenshotu  # jen průchod, bez 5 šířek
  python3 tools/pruchod.py --url https://frankie851.github.io/kviz-web/   # projde nasazený web

Ověří: první spuštění, kategorie, téma, Lehká, kolo s částí správných i špatných odpovědí,
výsledek, hvězdy (5, po půlkách), odemčení Střední od 70 %; obnovení stránky → pokrok zůstal;
dohrané kolo nejde hrát znovu, jen prohlédnout; rozehrané kolo přežije odchod i obnovení;
pod 70 % zůstane další obtížnost zamčená natrvalo; historie; ovládání klávesnicí;
všechny tři režimy překladu u otázky, možností, vysvětlení i v přehledu odpovědí; jazyk otázek;
přepnutí rozhraní CZ ↔ EN bez chybějících textů; zvuky a vibrace se ozvou a jdou vypnout;
upozornění na nový odznak během kola; konfety jen při 100 % a jen poprvé (ne po obnovení);
s „omezit pohyb“ žádné animace ani konfety; odkaz na téma u nového hráče vede po prvním spuštění
na téma; při pomalém stažení tématu hned „Načítám…“; klávesy po rychlém odchodu z načítané otázky
nic nezodpoví; dlouhé slovo a adresa v otázce, možnostech a vysvětlení nic neroztáhnou (320 px);
náhled odkazu (Open Graph) a ikony; žádné chyby
v konzoli; žádný síťový požadavek mimo vlastní adresu. Pak screenshoty 7 obrazovek na šířkách 320, 360, 390, 768 a 1280 px
a kontrola, že nic nepřetéká do stran. Potřebuje aspoň 3 témata se všemi obtížnostmi.

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
import time
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
ZPOMALENI = {}  # část cesty → zpoždění v sekundách (napodobení pomalé sítě pro vybraný soubor)


def spust_server():
    class Tichy(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def do_GET(self):
            for cast, s in list(ZPOMALENI.items()):
                if cast in self.path:
                    time.sleep(s)
            super().do_GET()

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
    # témata pro průchod: ta s aspoň 3 viditelnými obtížnostmi (potřeba jsou 3)
    kandidati = [(k, t) for k in index["kategorie"] for t in k["temata"]]
    plna = [(k, t) for k, t in kandidati if all(t["otazek"].get(o, 0) >= 3 for o in ("1", "2", "3"))]
    return index, otazky, (plna or kandidati)


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


# Počítadla pro kontroly, které nejdou vidět ani slyšet: tóny Web Audio, vibrace, upozornění, konfety.
# (Prohlížeč se jen „odposlouchává“ – zvuk se dál vytváří normálně, vibrace se jen započítá.)
SLEDOVANI = """
(() => {
  window.__osc = 0; window.__vib = 0; window.__toasty = []; window.__konfety = 0;
  const AC = window.AudioContext;
  if (AC) {
    const puvodni = AC.prototype.createOscillator;
    AC.prototype.createOscillator = function () { window.__osc++; return puvodni.call(this); };
  }
  navigator.vibrate = () => { window.__vib++; return true; };
  new MutationObserver((zmeny) => {
    for (const z of zmeny) for (const n of z.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.matches('.toast')) window.__toasty.push(n.dataset.odznak);
      if (n.matches('.konfety')) window.__konfety++;
    }
  }).observe(document, { childList: true, subtree: true });
})();
"""


def pocty(page):
    return page.evaluate("() => ({ osc: window.__osc, vib: window.__vib, toasty: window.__toasty.slice(), konfety: window.__konfety })")


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


def zahraj_kolo(page, otazky, spatnych=0, klavesnice=False, kontroly=False, zastav_po=None):
    """Hraje kolo od aktuální otázky; posledních `spatnych` otázek kola odpoví špatně.
    zastav_po = po kolika odpovědích v tomto volání přestat (rozehrané kolo). Vrátí počet otázek kola."""
    i0, n = (int(x) for x in page.inner_text("[data-test=pocitadlo]").split("/"))
    for k, i in enumerate(range(i0 - 1, n)):
        if zastav_po is not None and k >= zastav_po:
            return n
        spravne = i < n - spatnych
        qid, volba, sp = zodpovez(page, otazky, spravne, klavesnice, zkus_druhe=kontroly and i == 0)
        if kontroly and i in (0, n - 1):
            over("ok" in page.get_attribute(f'.ans[data-index="{sp}"]', "class"), f"otázka {i + 1}: správná odpověď je zelená")
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


def hvezdy_vysledku(page):
    """(celé, půlky) na obrazovce Výsledek."""
    return page.locator(".stars-big .star.on").count(), page.locator(".stars-big .star.half").count()


def ocekavane(spravne, n):
    pul = (spravne * 10) // n
    return pul // 2, pul % 2


def stav_obtiznosti(page, o):
    return page.get_attribute(f'.diff[data-obtiznost="{o}"]', "data-stav")


# ---------------------------------------------------------------- scénáře
def scenar_hry(page, zaklad, otazky, temata):
    (kat, tema), (kat2, tema2) = temata[0], temata[1]
    T, T2 = tema["id"], tema2["id"]
    print("První spuštění:")
    jdi(page, zaklad, "")
    over(page.url.endswith("#/vitej"), "bez nastavení se otevře první spuštění")
    over(page.get_attribute('[data-jazyk="cs"]', "aria-pressed") == "true", "čeština předvyplněná podle jazyka prohlížeče")
    page.click("[data-test=pokracovat]")
    over(page.locator("[data-zpusob]").count() == 3, "3 způsoby hraní")
    page.click('[data-zpusob="muj"]')
    page.wait_for_selector("[data-test=hrat]")
    over(page.url.endswith("#/"), "po 2 krocích je hráč Domů")
    over(page.inner_text("[data-test=hvezdy-celkem]").startswith("0"), "na začátku 0 hvězd")
    over(page.inner_text("[data-test=uspesnost]").startswith("–"), "na začátku úspěšnost „–“")
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
    over([stav_obtiznosti(page, o) for o in "123"] == ["otevreno", "zamceno", "zamceno"], "Lehká otevřená, Střední a Těžká zamčené")
    page.click('a.diff[data-obtiznost="1"]')
    page.wait_for_selector(".qcard")
    bez_chybejicich_textu(page, "Otázka")

    print("Lehká: kolo se 2 špatnými odpověďmi (80 %):")
    n = zahraj_kolo(page, otazky, spatnych=2, kontroly=True)
    s = n - 2
    over(page.inner_text("[data-test=skore]").startswith(f"{s} / {n}"), f"výsledek {s} / {n}")
    over(hvezdy_vysledku(page) == ocekavane(s, n), f"hvězdy {hvezdy_vysledku(page)} (celé, půlky) = očekávané {ocekavane(s, n)}")
    over(page.locator("[data-test=odemceno]").count() == 1, "„Odemčeno: Střední“ (od 70 %)")
    over(page.locator("[data-test=nove-odznaky]").count() == 1 and "První kolo" in page.inner_text("[data-test=nove-odznaky]"), "nový odznak První kolo")
    over(page.locator("[data-test=znovu]").count() == 0, "tlačítko Znovu není")
    c = pocty(page)
    over("rada-5" in c["toasty"], "během kola upozornění „Nový odznak: Rozjetý“ (5 správně za sebou)")
    over("Rozjetý" in page.inner_text("[data-test=nove-odznaky]"), "odznak získaný během kola je i mezi novými na výsledku")
    over(c["osc"] > 0 and c["vib"] > 0, f"zvuky ({c['osc']} tónů) a vibrace ({c['vib']}×) se ozvaly")
    page.wait_for_timeout(1800)
    over(pocty(page)["konfety"] == 0, "při 80 % žádné konfety")
    bez_chybejicich_textu(page, "Výsledek")

    print("Obnovení stránky a zákaz opakování:")
    page.reload()
    page.wait_for_selector("[data-test=skore]")
    over(page.inner_text("[data-test=skore]").startswith(f"{s} / {n}"), "výsledek po obnovení zůstal")
    jdi(page, zaklad, "#/")
    over(page.inner_text("[data-test=hvezdy-celkem]").startswith(f"{ocekavane(s, n)[0]} /"), "Domů: hvězdy celkem i po obnovení")
    over("1" in page.inner_text("[data-test=serie-dni]"), "série dní = 1 (pilulka nahoře)")
    usp = round(s / n * 100)
    over(page.inner_text("[data-test=uspesnost]").startswith(f"{usp}\u00a0%") or page.inner_text("[data-test=uspesnost]").startswith(f"{usp} %"),
         f"Domů: úspěšnost {usp} % místo série dní")
    over(page.locator("[data-test=dny]").count() == 0, "série dní není na Domů dvakrát")
    jdi(page, zaklad, "#/kategorie")
    soucty = page.locator(".tile-stars").all_inner_texts()
    over(soucty and all(re.fullmatch(r"\d+ / \d+ ★", x.strip()) for x in soucty), f"součty hvězd u kategorií jen celé (půlky dolů, D-020): {soucty}")
    if page.locator('.tile[data-kategorie="cesko"]').count():
        over(page.locator('.tile[data-kategorie="cesko"] img[src$="vlajka-cz.svg"]').count() == 1
             and page.evaluate("document.querySelector('.tile[data-kategorie=\"cesko\"] img').naturalWidth") > 0,
             "kategorie Česko má českou vlajku (D-020)")
    jdi(page, zaklad, f"#/tema/{T}")
    over([stav_obtiznosti(page, o) for o in "123"] == ["dohrano", "otevreno", "zamceno"], "Lehká dohraná, Střední otevřená")
    jdi(page, zaklad, f"#/hra/{T}/1")
    page.wait_for_timeout(300)
    over(page.url.endswith(f"#/prehled/{T}/1"), "dohraná Lehká nejde hrát znovu – otevře se přehled odpovědí")
    over(page.locator(".review").count() == n and page.locator(".review.is-bad").count() == 2, f"přehled: {n} otázek, 2 špatně")
    over(page.locator(".review .ans.ok").count() == n, "v přehledu je u každé otázky vyznačená správná odpověď")
    bez_chybejicich_textu(page, "Přehled odpovědí")

    print("Střední klávesnicí (1–4 / A–D, Enter), 3 špatně = 70 % → půlhvězda:")
    jdi(page, zaklad, f"#/hra/{T}/2")
    page.wait_for_selector(".qcard")
    n2 = zahraj_kolo(page, otazky, spatnych=3, klavesnice=True)
    over(hvezdy_vysledku(page) == ocekavane(n2 - 3, n2), f"hvězdy {hvezdy_vysledku(page)} = {ocekavane(n2 - 3, n2)} (půlhvězda)")
    over(page.locator("[data-test=odemceno]").count() == 1 and "Těžká" in page.inner_text("[data-test=odemceno]"), "70 % odemklo Těžkou")

    print("Těžká: rozehrané kolo přežije odchod i obnovení:")
    page.click("[data-test=dalsi-obtiznost]")
    page.wait_for_selector(".qcard")
    zahraj_kolo(page, otazky, spatnych=0, zastav_po=3)
    page.reload()
    page.wait_for_selector(".qcard")
    over(page.inner_text("[data-test=pocitadlo]").startswith("4 /"), "po obnovení pokračuje 4. otázkou")
    page.click(".qtop .iconbtn")
    page.wait_for_selector(".diff")
    over(page.locator(".dialog").count() == 0, "zpět bez dotazu (kolo počká)")
    over("3 z" in page.inner_text('.diff[data-obtiznost="3"]'), "Těžká ukazuje „Rozehráno: 3 z …“")
    page.click('a.diff[data-obtiznost="3"]')
    page.wait_for_selector(".qcard")
    over(page.inner_text("[data-test=pocitadlo]").startswith("4 /"), "znovu otevřené kolo pokračuje 4. otázkou")
    n3 = zahraj_kolo(page, otazky, spatnych=0)
    over(hvezdy_vysledku(page) == (5, 0), "bez chyby = 5 hvězd")
    over("rada-10" in pocty(page)["toasty"], "během kola upozornění „Nový odznak: Neomylný“ (10 za sebou)")
    try:
        page.wait_for_function("window.__konfety > 0", timeout=4000)
        ok("při 100 % (5 ★) padají konfety")
    except Exception:
        chyba("při 100 % (5 ★) nejsou konfety")
    page.wait_for_selector(".pul-10 .stars-big")
    page.reload()
    page.wait_for_selector("[data-test=skore]")
    page.wait_for_timeout(2500)
    c = pocty(page)
    over(c["konfety"] == 0 and c["osc"] == 0, "po obnovení stránky se oslava (konfety, zvuky) neopakuje")
    nove = page.inner_text("[data-test=nove-odznaky]")
    over("Bez chyby" in nove and "Na vrcholu" in nove and "Neomylný" in nove, "odznaky Bez chyby, Na vrcholu a Neomylný")
    over(page.locator("[data-test=dalsi-obtiznost]").count() == 0, "po Těžké už není další obtížnost")

    print(f"Pod 70 % = další obtížnost zamčená natrvalo ({T2}):")
    jdi(page, zaklad, f"#/hra/{T2}/1")
    page.wait_for_selector(".qcard")
    n4 = zahraj_kolo(page, otazky, spatnych=6)
    over(hvezdy_vysledku(page) == ocekavane(n4 - 6, n4), f"{n4 - 6}/{n4}: hvězdy {hvezdy_vysledku(page)}")
    over(page.locator("[data-test=natrvalo]").count() == 1 and page.locator("[data-test=dalsi-obtiznost]").count() == 0, "výsledek hlásí, že Střední zůstává zamčená")
    jdi(page, zaklad, f"#/tema/{T2}")
    over(stav_obtiznosti(page, "2") == "natrvalo" and stav_obtiznosti(page, "3") == "zamceno", "Střední zamčená natrvalo")
    jdi(page, zaklad, f"#/hra/{T2}/2")
    page.wait_for_timeout(300)
    over(page.url.endswith(f"#/tema/{T2}"), "zamčenou obtížnost nejde otevřít ani adresou")

    print("Historie:")
    jdi(page, zaklad, "#/")
    page.click("[data-test=historie]")
    page.wait_for_selector(".hist")
    over(page.locator(".hist").count() == 4, f"{page.locator('.hist').count()} dohraná kola v historii")
    bez_chybejicich_textu(page, "Historie")
    page.click(f'.hist[data-tema="{T2}"]')
    page.wait_for_selector(".review")
    over(page.url.endswith(f"#/prehled/{T2}/1"), "z historie se otevře přehled odpovědí")


def nastav(page, zaklad, skupina, hodnota):
    jdi(page, zaklad, "#/nastaveni")
    page.click(f'[aria-labelledby="{skupina}"] [data-hodnota="{hodnota}"]')
    page.wait_for_timeout(100)


def zacni_kolo(page, zaklad, T, obt="1"):
    jdi(page, zaklad, f"#/hra/{T}/{obt}")
    page.wait_for_selector(".qcard")


def ukonci_kolo(page):
    """Zpět z kola – kolo zůstane rozehrané a příště pokračuje."""
    page.click(".qtop .iconbtn")
    page.wait_for_selector(".diff")


def scenar_prekladu(page, zaklad, otazky, T, T_prehled):
    """T = téma s otevřenou Lehkou (hraje se v něm jedno rozehrané kolo), T_prehled = téma s dohranou Lehkou."""
    print("Překlad – vždy:")
    nastav(page, zaklad, "nast-preklad", "vzdy")
    zacni_kolo(page, zaklad, T)
    q = otazky[page.get_attribute(".qcard", "data-qid")]
    over(page.is_visible(".qtext .tr") and page.inner_text(".qtext .tr") == q["otazka"]["en"], "otázka má viditelný anglický překlad")
    lisi = [i for i in range(4) if q["moznosti"]["cs"][i] != q["moznosti"]["en"][i]]
    over(all(page.is_visible(f'.ans[data-index="{i}"] .tr') for i in lisi), f"možnosti mají viditelný překlad ({len(lisi)} ze 4 se liší)")
    zodpovez(page, otazky)
    over(page.is_visible(".explain .tr") and page.inner_text(".explain .tr") == q["vysvetleni"]["en"], "vysvětlení má viditelný překlad")
    ukonci_kolo(page)
    jdi(page, zaklad, f"#/prehled/{T_prehled}/1")
    over(page.is_visible(".review .qtext .tr") and page.is_visible(".review .explain-t .tr"), "přehled odpovědí: překlad vidět")

    print("Překlad – na ťuknutí:")
    nastav(page, zaklad, "nast-preklad", "tuknuti")
    zacni_kolo(page, zaklad, T)
    over(page.inner_text("[data-test=pocitadlo]").startswith("2 /"), "rozehrané kolo pokračuje další otázkou")
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
    jdi(page, zaklad, f"#/prehled/{T_prehled}/1")
    over(not page.is_visible(".review .qtext .tr"), "přehled: překlad schovaný")
    page.click(".review [data-test=prelozit] >> nth=0")
    over(page.is_visible(".review .qtext .tr >> nth=0"), "přehled: po ťuknutí je překlad vidět")

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


def scenar_jazyka(page, zaklad, T_hra, T_hotovo, kat_id):
    print("Rozhraní anglicky (všechny obrazovky):")
    nastav(page, zaklad, "nast-ui", "en")
    over(page.get_attribute("html", "lang") == "en", "html lang = en")
    obrazovky = [("#/", "Play"), ("#/kategorie", "Categories"), (f"#/kategorie/{kat_id}", "Pick a topic"), (f"#/tema/{T_hotovo}", "See your answers"),
                 (f"#/hra/{T_hra}/1", "Did you know?"), ("#/vysledek", "See your answers"), (f"#/prehled/{T_hotovo}/1", "Your answers"),
                 ("#/historie", "History"), ("#/odznaky", "Badges"), ("#/nastaveni", "Settings")]
    for h_, slovo in obrazovky:
        jdi(page, zaklad, h_)
        obsah = h_.startswith("#/hra") or h_.startswith("#/prehled")  # otázky jsou česky (jazyk otázek)
        if h_.startswith("#/hra"):
            page.wait_for_selector(".qcard")
            zodpovez_libovolne(page)
        txt = text_stranky(page)
        bez_chybejicich_textu(page, f"EN {h_}")
        cesky = [] if obsah else [w for w in ("Nastavení", "Hrát", "Kategorie", "Lehká", "Odznaky", "Další", "Historie", "Věděli", "Prohlédnout") if w in txt]
        over(slovo in txt and not cesky, f"EN {h_}: anglické texty" + (f" (česky zůstalo: {cesky})" if cesky else ""))
    jdi(page, zaklad, "#/vitej")
    page.wait_for_timeout(100)
    bez_chybejicich_textu(page, "EN první spuštění")
    nastav(page, zaklad, "nast-ui", "cs")
    over(page.get_attribute("html", "lang") == "cs", "zpět na češtinu")


def zodpovez_libovolne(page):
    page.click('.ans[data-index="0"]')
    page.wait_for_selector("[data-test=vysvetleni]")


def scenar_zvuku(page, zaklad, otazky, T):
    print("Zvuky a vibrace jdou vypnout:")
    zacni_kolo(page, zaklad, T)
    c0 = pocty(page)
    zodpovez(page, otazky)
    c1 = pocty(page)
    over(c1["osc"] > c0["osc"] and c1["vib"] > c0["vib"], "zapnuto: odpověď má zvuk i vibraci")
    ukonci_kolo(page)
    jdi(page, zaklad, "#/nastaveni")
    page.click("#nast-zvuky")
    page.click("#nast-vibrace")
    over(page.get_attribute("#nast-zvuky", "aria-checked") == "false" and page.get_attribute("#nast-vibrace", "aria-checked") == "false", "vypínače Zvuky a Vibrace vypnuté")
    zacni_kolo(page, zaklad, T)
    c0 = pocty(page)
    zodpovez(page, otazky, spravne=False)
    c1 = pocty(page)
    over(c1["osc"] == c0["osc"] and c1["vib"] == c0["vib"], "vypnuto: odpověď bez zvuku i vibrace")
    ukonci_kolo(page)
    jdi(page, zaklad, "#/nastaveni")
    c0 = pocty(page)
    page.click("#nast-zvuky")
    page.click("#nast-vibrace")
    c1 = pocty(page)
    over(c1["osc"] > c0["osc"] and c1["vib"] > c0["vib"], "po zapnutí zazní ukázka zvuku a vibrace")
    page.reload()
    page.wait_for_selector("#nast-zvuky")
    over(page.get_attribute("#nast-zvuky", "aria-checked") == "true", "nastavení zvuků přežije obnovení stránky")


def scenar_omezit_pohyb(browser, zaklad, hlidac, otazky, T):
    print("„Omezit pohyb“ (prefers-reduced-motion):")
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ", reduced_motion="reduce")
    ctx.add_init_script(SLEDOVANI)
    page = ctx.new_page()
    page.set_default_timeout(8000)
    hlidac.pripoj(page)
    page.goto(zaklad)
    page.evaluate("s => localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(s))",
                  {"ui": "cs", "otazky": "cs", "preklad": "vypnuto", "zvuky": True, "vibrace": True})
    page.reload()
    zacni_kolo(page, zaklad, T)
    over(page.evaluate("getComputedStyle(document.querySelector('.qcard')).animationName") == "none", "otázka přijede bez animace")
    zahraj_kolo(page, otazky, spatnych=0)
    over(hvezdy_vysledku(page) == (5, 0), "kolo bez chyby = 5 ★")
    page.wait_for_timeout(2000)
    c = pocty(page)
    over(c["konfety"] == 0, "při 100 % se konfety nespustí")
    over(page.evaluate("getComputedStyle(document.querySelector('.stars-big .star.on')).animationName") == "none"
         and page.evaluate("getComputedStyle(document.querySelector('.stars-big'), '::before').animationName") == "none",
         "hvězdy a paprsky bez animace")
    over(c["osc"] > 0, "zvuk (ne pohyb) zůstává")
    ctx.close()


DLOUHE_SLOVO = "Pneumonoultramicroscopicsilicovolcanoconiosis-Donaudampfschifffahrtsgesellschaft"
DLOUHA_ADRESA = "https://cs.wikipedia.org/wiki/Seznam_nejdel%C5%A1%C3%ADch_slov_v_%C4%8De%C5%A1tin%C4%9B_a_angli%C4%8Dtin%C4%9B"


def pretekani(page):
    """Seznam přetékajících prvků (prázdný = nic nepřetéká do stran)."""
    return page.evaluate("""() => {
        const W = document.documentElement.clientWidth, out = [];
        if (document.documentElement.scrollWidth > W + 1) out.push('stránka ' + document.documentElement.scrollWidth + ' > ' + W);
        for (const el of document.querySelectorAll('#app *:not(.sr-only)')) {
          const r = el.getBoundingClientRect();
          if (r.width && (r.right > W + 1 || r.left < -1)) out.push((el.className || el.tagName) + ' ' + Math.round(r.left) + '–' + Math.round(r.right));
          if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible' && el.clientWidth) out.push('ořez: ' + (el.className || el.tagName));
        }
        return out.slice(0, 5);
    }""")


def scenar_dlouhych_slov(browser, zaklad, hlidac, otazky, T, vystup=None):
    """Nález S-1 z kontroly: velmi dlouhé slovo nebo adresa v otázce, možnostech i vysvětlení nesmí
    roztáhnout stránku do šířky. Data se nemění – prohlížeč dostane upravenou kopii souboru tématu."""
    print("Dlouhá slova a adresy (320 px, překlad vždy):")
    ctx = browser.new_context(viewport={"width": 320, "height": 640}, locale="cs-CZ")
    page = ctx.new_page()
    page.set_default_timeout(8000)
    hlidac.pripoj(page)
    soubor = KOREN / "data" / "topics" / f"{T}.json"
    data = json.loads(soubor.read_text(encoding="utf-8"))
    for q in data["otazky"]:
        for j in q["otazka"]:
            q["otazka"][j] += f" {DLOUHE_SLOVO}"
            q["moznosti"][j] = [m + f" {DLOUHE_SLOVO}" for m in q["moznosti"][j]]
            q["vysvetleni"][j] += f" {DLOUHE_SLOVO} {DLOUHA_ADRESA}"
    telo = json.dumps(data, ensure_ascii=False)
    page.route(f"**/data/topics/{T}.json*", lambda r: r.fulfill(status=200, content_type="application/json", body=telo))
    page.goto(zaklad)
    page.evaluate("s => localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(s))",
                  {"ui": "cs", "otazky": "cs", "preklad": "vzdy", "zvuky": False, "vibrace": False})
    page.reload()
    zacni_kolo(page, zaklad, T)
    zodpovez(page, otazky, spravne=False)
    page.wait_for_timeout(400)
    p = pretekani(page)
    over(not p, "otázka a vysvětlení s dlouhým slovem a adresou nepřetékají" + (f": {p}" if p else ""))
    if vystup:
        vystup.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(vystup / "dlouhe-slovo-otazka-320.png"), full_page=True)
    dalsi(page)
    zahraj_kolo(page, otazky, spatnych=0)
    jdi(page, zaklad, f"#/prehled/{T}/1")
    page.wait_for_timeout(400)
    p = pretekani(page)
    over(not p, "přehled odpovědí s dlouhým slovem a adresou nepřetéká" + (f": {p}" if p else ""))
    if vystup:
        page.screenshot(path=str(vystup / "dlouhe-slovo-prehled-320.png"), full_page=True)
    ctx.close()


def scenar_navigace(browser, zaklad, hlidac, T, lokalni=True):
    """Nálezy D-5, D-2 a D-6 z kontroly: odkaz na téma u nového hráče, odezva při pomalém
    stažení tématu, klávesy po rychlém odchodu z načítané otázky."""
    print("Odkaz na téma u nového hráče, pomalá síť, rychlý odchod:")
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ")
    page = ctx.new_page()
    page.set_default_timeout(8000)
    hlidac.pripoj(page)
    jdi(page, zaklad, f"#/tema/{T}")
    over(page.url.endswith("#/vitej"), "odkaz na téma u nového hráče nejdřív otevře první spuštění")
    page.click("[data-test=pokracovat]")
    page.click('[data-zpusob="muj"]')
    page.wait_for_selector(".diff")
    over(page.url.endswith(f"#/tema/{T}"), "po prvním spuštění je hráč na tématu z odkazu (ne Domů)")

    if not lokalni:  # zpomalit jde jen vlastní server
        ctx.close()
        return
    # pomalé stažení souboru tématu (1,5 s) – po ťuknutí na obtížnost se musí hned něco stát
    ZPOMALENI[f"/data/topics/{T}.json"] = 1.5
    cdp = ctx.new_cdp_session(page)  # bez mezipaměti prohlížeče, jinak by se soubor nestahoval znovu
    cdp.send("Network.enable")
    cdp.send("Network.setCacheDisabled", {"cacheDisabled": True})
    page.goto(zaklad + "#/")  # nové načtení stránky = prázdná paměť otázek
    page.reload()
    page.wait_for_selector("[data-test=hrat]")
    page.evaluate(f"location.hash = '#/tema/{T}'")
    page.wait_for_selector(".diff")
    page.click('a.diff[data-obtiznost="1"]')
    page.wait_for_selector(".nacitam", timeout=1000)
    over(page.is_visible(".nacitam") and page.inner_text(".nacitam").strip() == "Načítám…", "pomalá síť: po ťuknutí na obtížnost hned „Načítám…“")
    page.wait_for_selector(".qcard", timeout=8000)
    over(page.locator(".nacitam").count() == 0 and page.get_attribute("#app", "aria-busy") is None, "po načtení otázky „Načítám…“ zmizí")

    # rychlý odchod: otázka se ještě načítá, hráč jde Domů → klávesa 1 už nesmí nic zodpovědět
    page.goto(zaklad + "#/")
    page.reload()
    page.wait_for_selector("[data-test=hrat]")
    page.evaluate(f"location.hash = '#/hra/{T}/1'")
    page.wait_for_timeout(200)
    page.evaluate("location.hash = '#/'")
    page.wait_for_timeout(2200)  # zahozené kolo se mezitím dočetlo
    pred = page.evaluate("JSON.stringify(localStorage)")
    page.keyboard.press("1")
    page.wait_for_timeout(200)
    over(page.evaluate("JSON.stringify(localStorage)") == pred and page.locator(".qcard").count() == 0,
         "klávesa 1 po odchodu z načítané otázky nic nezodpoví")
    ZPOMALENI.clear()
    ctx.close()


def kontrola_nahledu_odkazu():
    print("Náhled odkazu (Open Graph) a ikony:")
    html = (KOREN / "index.html").read_text(encoding="utf-8")
    meta = dict(re.findall(r'<meta (?:property|name)="([\w:]+)" content="([^"]*)"', html))
    over(all(k in meta for k in ("og:title", "og:type", "og:url", "og:image", "og:image:alt", "og:description")), "index.html má og:title, og:type, og:url, og:image, og:image:alt, og:description")
    over(meta.get("og:image", "").startswith("https://") and meta["og:image"].endswith("/assets/img/og.png"), "og:image je absolutní adresa na assets/img/og.png")
    png = (KOREN / "assets/img/og.png").read_bytes()
    w, h = int.from_bytes(png[16:20], "big"), int.from_bytes(png[20:24], "big")
    over((w, h) == (int(meta.get("og:image:width", 0)), int(meta.get("og:image:height", 0))) == (1200, 630), f"og.png má {w}×{h} px a souhlasí s og:image:width/height")
    for f in re.findall(r'<link rel="(?:icon|apple-touch-icon)" href="([^"]+)"', html):
        over((KOREN / f).exists() and not f.startswith("/"), f"ikona {f} existuje (relativní cesta)")


def scenar_odznaku_a_nastaveni(page, zaklad):
    print("Odznaky a Nastavení:")
    jdi(page, zaklad, "#/odznaky")
    over(page.locator(".bcard").count() >= 10, f"{page.locator('.bcard').count()} odznaků na obrazovce Odznaky")
    over(page.locator(".bcard.earned").count() >= 5, f"{page.locator('.bcard.earned').count()} získaných odznaků je označených")
    over(page.locator(".bcard.is-new .bcard-new").count() == page.locator(".bcard.earned").count(), "dnes získané odznaky mají štítek „Nový!“")
    bez_chybejicich_textu(page, "Odznaky")
    jdi(page, zaklad, "#/nastaveni")
    txt = text_stranky(page)
    over(page.locator("[data-test=smazat]").count() == 0 and "Smazat" not in txt, "Smazat pokrok v Nastavení není")
    over("ověř" not in txt.lower() and "reklam" not in txt.lower(), "O hře: bez textu o ověření faktů a o reklamě")


# ---------------------------------------------------------------- screenshoty
def screenshoty(browser, zaklad, hlidac, otazky, T, vystup):
    print(f"Screenshoty a přetékání ({', '.join(map(str, SIRKY))} px) → {vystup}")
    vystup.mkdir(parents=True, exist_ok=True)
    stav_nast = {"ui": "cs", "otazky": "cs", "preklad": "vzdy", "zvuky": True, "vibrace": True}
    for w in SIRKY:
        ctx = browser.new_context(viewport={"width": w, "height": VYSKY[w]}, locale="cs-CZ", device_scale_factor=1)
        page = ctx.new_page()
        page.set_default_timeout(8000)
        hlidac.pripoj(page)
        page.goto(zaklad)
        page.evaluate("s => localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(s))", stav_nast)
        page.reload()
        # kolo s 3 špatnými (70 % = 3,5 ★), aby byl výsledek s půlhvězdou a otevřená Střední
        zacni_kolo(page, zaklad, T)
        zahraj_kolo(page, otazky, spatnych=3, klavesnice=True)
        snimky = [("1-domu", "#/", None), ("2-kategorie", "#/kategorie", None), ("3-otazka", f"#/hra/{T}/2", "odpoved"),
                  ("4-vysledek", "#/vysledek", None), ("5-nastaveni", "#/nastaveni", None), ("6-prehled", f"#/prehled/{T}/1", None),
                  ("7-obtiznost", f"#/tema/{T}", None)]
        for nazev, h_, akce in snimky:
            jdi(page, zaklad, h_)
            if akce == "odpoved":
                page.wait_for_selector(".qcard")
                zodpovez(page, otazky, spravne=False)
                page.mouse.move(0, 0)
                page.wait_for_timeout(400)
            page.wait_for_timeout(2000 if nazev == "4-vysledek" else 900)  # animace hvězd a výsledku
            pretek = pretekani(page)
            if pretek:
                chyba(f"{w} px {nazev}: přetéká – {pretek}")
            page.screenshot(path=str(vystup / f"{nazev}-{w}.png"), full_page=True)
        ok(f"{w} px: {len(snimky)} screenshotů" + ("" if not any(f"{w} px" in c for c in chyby) else " (s nálezy výše)"))
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
    kontrola_nahledu_odkazu()
    index, otazky, temata = nacti_data()
    if len(temata) < 3:
        print("Průchod potřebuje aspoň 3 témata se všemi třemi obtížnostmi (3+ otázek).")
        return 2
    (kat, tema), (_, tema2), (_, tema3) = temata[:3]
    print(f"Data: režim {index.get('rezim')}, {len(otazky)} otázek; témata pro průchod {tema['id']}, {tema2['id']}, {tema3['id']}")

    httpd = None
    if args.url:
        zaklad = args.url if args.url.endswith("/") else args.url + "/"
    else:
        httpd, zaklad = spust_server()
    hlidac = Hlidac(zaklad)

    with sync_playwright() as p:
        browser = spust_prohlizec(p)
        ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ")
        ctx.add_init_script(SLEDOVANI)
        page = ctx.new_page()
        page.set_default_timeout(8000)
        hlidac.pripoj(page)
        kroky = [
            lambda: scenar_hry(page, zaklad, otazky, temata),
            lambda: scenar_prekladu(page, zaklad, otazky, tema3["id"], tema["id"]),
            lambda: scenar_jazyka(page, zaklad, tema3["id"], tema["id"], kat["id"]),
            lambda: scenar_odznaku_a_nastaveni(page, zaklad),
            lambda: scenar_zvuku(page, zaklad, otazky, tema3["id"]),
            lambda: scenar_omezit_pohyb(browser, zaklad, hlidac, otazky, tema["id"]),
            lambda: scenar_navigace(browser, zaklad, hlidac, tema2["id"], lokalni=httpd is not None),
            lambda: scenar_dlouhych_slov(browser, zaklad, hlidac, otazky, tema2["id"], None if args.bez_screenshotu else Path(args.vystup)),
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
