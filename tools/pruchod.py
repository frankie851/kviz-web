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
v konzoli; žádný síťový požadavek mimo vlastní adresu. Pak screenshoty 9 obrazovek na šířkách 320, 360, 390, 768 a 1280 px
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
def scenar_hry(page, zaklad, otazky, temata, index):
    (kat, tema), (kat2, tema2) = temata[0], temata[1]
    T, T2 = tema["id"], tema2["id"]
    print("První spuštění:")
    jdi(page, zaklad, "")
    over(page.url.endswith("#/vitej"), "bez nastavení se otevře první spuštění")
    over(page.get_attribute('[data-jazyk="cs"]', "aria-pressed") == "true", "čeština předvyplněná podle jazyka prohlížeče")
    page.click("[data-test=pokracovat]")
    over(page.locator("[data-zpusob]").count() == 3, "3 způsoby hraní")
    page.click('[data-zpusob="muj"]')
    page.wait_for_selector("[data-test=domu]")
    over(page.url.endswith("#/"), "po 2 krocích je hráč Domů")
    over(page.inner_text("[data-test=hvezdy-celkem] b").startswith("0"), "na začátku 0 hvězd")
    over(page.inner_text("[data-test=uspesnost] b").startswith("–"), "na začátku úspěšnost „–“")
    bez_chybejicich_textu(page, "Domů")

    txt_domu = text_stranky(page)
    over("Vědomostní kvíz" in txt_domu and "Věděli" not in txt_domu, "Domů: podtitul „Vědomostní kvíz“, bez okna Věděli jste? (D-021)")
    over(page.locator("[data-test=kategorie-domu] .tile[data-kategorie]").count() == min(len(index["kategorie"]), 6)
         and page.locator("[data-test=statistiky]").count() == 1, "Domů: dlaždice kategorií a tlačítko Statistiky")
    over(all(x.startswith("Dohráno 0 /") for x in page.locator("[data-test=dohrano]").all_inner_texts()), "kategorie na Domů: Dohráno 0 / t")

    print("Kategorie (na Domů) → téma → Lehká:")
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
    over(page.inner_text("[data-test=hvezdy-celkem] b").startswith(f"{ocekavane(s, n)[0]} /"), "Domů: hvězdy celkem i po obnovení")
    over("1" in page.inner_text("[data-test=serie-dni] b"), "série dní = 1 (pruh na Domů)")
    usp = round(s / n * 100)
    over(page.inner_text("[data-test=uspesnost] b").startswith(f"{usp}\u00a0%") or page.inner_text("[data-test=uspesnost] b").startswith(f"{usp} %"),
         f"Domů: úspěšnost {usp} % místo série dní")
    over(page.locator("[data-test=serie-dni]").count() == 1, "série dní je na Domů jen jednou")
    jdi(page, zaklad, "#/kategorie")
    barvy = page.eval_on_selector_all(".tiles .tile[data-kategorie]", """els => els.map(e => [e.dataset.barva, getComputedStyle(e).backgroundColor, getComputedStyle(e).color])""")
    pozadi_str = page.evaluate("getComputedStyle(document.body).backgroundColor")
    spatne = [b for b in barvy if b[1] in ("rgba(0, 0, 0, 0)", "transparent", pozadi_str, "rgb(0, 0, 0)", "rgb(43, 22, 48)", "rgb(255, 255, 255)", "rgb(255, 246, 234)") or b[2] != "rgb(26, 16, 32)"]
    sousede = [i for i in range(len(barvy)) if barvy[i][0] in [b[0] for b in barvy[max(0, i - 3):i]]]
    over(barvy and not spatne and not sousede,
         f"dlaždice kategorií: {len(barvy)} barevných (bez černé/bílé/béžové/průhledné, tmavý text, D-030), žádná barva u 3 předchozích (D-029)"
         + (f" – špatně: {spatne[:3]}, opakování u {sousede}" if spatne or sousede else ""))
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
    over("Neomylný" in page.inner_text("[data-test=nove-odznaky]"), "bez chyby v Těžké = nový odznak Neomylný (D-027)")
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
    obrazovky = [("#/", "What will you play"), ("#/statistiky", "By difficulty"), ("#/kategorie", "Categories"), (f"#/kategorie/{kat_id}", "Pick a topic"), (f"#/tema/{T_hotovo}", "See your answers"),
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
    page.wait_for_selector("[data-test=domu]")
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
    page.wait_for_selector("[data-test=domu]")
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


def scenar_statistik(browser, zaklad, hlidac, temata):
    """D-021: obrazovka Statistiky a „dohráno x / t“ u kategorií z připraveného pokroku."""
    print("Statistiky a dohraná témata (D-021):")
    (k1, A), (k2, B), (k3, C) = temata[:3]
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ")
    page = ctx.new_page()
    page.set_default_timeout(8000)
    hlidac.pripoj(page)
    nast = {"ui": "cs", "otazky": "cs", "preklad": "vypnuto", "zvuky": False, "vibrace": False}
    page.goto(zaklad)
    page.evaluate("s => localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(s))", nast)
    page.reload()
    jdi(page, zaklad, "#/statistiky")
    over(page.locator("[data-test=stat-prazdne]").count() == 1, "bez dohraného kola: Statistiky ukážou výzvu ke hraní")
    v = lambda s_, pul: {"s": s_, "c": 10, "pul": pul, "odpovedi": [], "datum": "2026-11-01", "j": "cs", "r": s_}
    # A: všechny obtížnosti dohrané (uzavřené), B: Lehká 60 % → dál nejde (uzavřené), C: Lehká 80 % → hraje se dál
    # + rozehrané kolo C/Střední: 1 správně, 1 špatně, série 12 (D-022: počítá se do úspěšnosti a rekordu)
    dataC = json.loads((KOREN / "data" / C["soubor"]).read_text(encoding="utf-8"))
    q1, q2 = [q for q in dataC["otazky"] if str(q["obtiznost"]) == "2"][:2]
    roz = {f'{C["id"]}|2': {"poradi": [q1["id"], q2["id"]], "odpovedi": [[q1["id"], q1["spravne"]], [q2["id"], (q2["spravne"] + 1) % 4]],
                             "rada": 0, "nejdelsiRada": 12, "prekladOtevren": False, "ziskaneBehem": [], "j": "cs"}}
    pokrok = {"verze": 2, "vysledky": {A["id"]: {"1": v(10, 10), "2": v(10, 10), "3": v(9, 9)}, B["id"]: {"1": v(6, 6)}, C["id"]: {"1": v(8, 8)}},
              "rozehrano": roz, "dny": {"posledni": "2026-11-01", "serie": 1, "nejdelsi": 4}, "stat": {"kol": 5, "nejdelsiRada": 10}, "odznaky": {}}
    page.evaluate("p => localStorage.setItem('kviz.v1.pokrok', JSON.stringify(p))", pokrok)
    page.reload()
    jdi(page, zaklad, "#/statistiky")
    over(page.inner_text("[data-test=stat-celkem] .stat-big").strip() == "85\u00a0%" and page.locator("[data-test=stat-vcetne]").count() == 1,
         "celková úspěšnost 44 z 52 = 85 % (i s rozehraným kolem, D-022)")
    w = page.evaluate("""() => { const m = document.querySelector('[data-test=stat-celkem] .meter'); const c = m.getBoundingClientRect().width;
        return ['.m-ok', '.m-bad'].map(x => Math.round(m.querySelector(x).getBoundingClientRect().width / c * 100)); }""")
    over(w == [85, 15], f"pruh celkové úspěšnosti: zeleně 85 %, barevně 15 % ({w}, D-023)")
    over([page.inner_text(f"[data-test=stat-obt-{o}] .srow-pct").strip() for o in "123"] == ["80\u00a0%", "92\u00a0%", "90\u00a0%"], "úspěšnost podle obtížnosti 80 / 92 (11 z 12 s rozehraným) / 90 %")
    over(page.inner_text("[data-test=stat-kol] b") == "5" and page.inner_text("[data-test=stat-hvezdy] b").startswith("21 /"), "5 kol, 21 hvězd (43 půlek dolů)")
    over([page.inner_text(f"[data-test=stat-{x}] b") for x in ("plna", "odemyka", "pod")] == ["2", "2", "1"], "kola: 2 za 5 ★, 2 od 70 %, 1 pod 70 %")
    over(page.inner_text("[data-test=stat-rada] b").endswith("12") and page.inner_text("[data-test=stat-dny] b") == "4 dny", "rekordy: série 12 (z rozehraného kola), nejdelší série dní 4")
    over(page.locator("[data-test^=stat-kat-]").count() >= 1 and page.locator("[data-test=stat-jazyk-cs]").count() == 1, "úspěšnost podle kategorií a podle jazyka otázek")
    proc = [x.strip().replace("\u00a0%", "") for x in page.locator("[data-test^=stat-kat-] .srow-pct").all_inner_texts()]
    hrane = [int(x) for x in proc if x != "–"]
    over(hrane == sorted(hrane, reverse=True) and "–" not in proc[:len(hrane)] and len(hrane) >= 1,
         f"kategorie ve Statistikách seřazené od nejúspěšnější, nehrané na konci (D-025): {proc[:6]}…")
    bez_chybejicich_textu(page, "Statistiky")
    p = pretekani(page)
    over(not p, "Statistiky nepřetékají" + (f": {p}" if p else ""))
    # dohráno x / t: A a B jsou uzavřené, C ne
    ocek = {}
    for k, t_ in temata[:3]:
        ocek[k["id"]] = ocek.get(k["id"], 0) + (1 if t_["id"] in (A["id"], B["id"]) else 0)
    jdi(page, zaklad, "#/")
    for kid, x in ocek.items():
        kat = next(k for k, _ in temata if k["id"] == kid)
        n = sum(1 for t_ in kat["temata"] if any(t_["otazek"].get(o, 0) >= 3 for o in "123"))
        txt_ = page.inner_text(f'.tile[data-kategorie="{kid}"] [data-test=dohrano]').strip()
        over(txt_ == f"Dohráno {x} / {n}", f"kategorie {kid}: {txt_} (očekáváno {x} / {n})")
    ctx.close()


def scenar_mnoho_kategorii(browser, zaklad, hlidac, index, vystup=None):
    """D-021: víc než 6 kategorií → na Domů 5 dlaždic + „Všechny kategorie (n)“. Prohlížeč dostane
    upravenou kopii indexu (kategorie zkopírované pod jinými ID), data v repozitáři se nemění."""
    print("Mnoho kategorií na Domů (D-021):")
    kopie = json.loads(json.dumps(index))
    vzor = kopie["kategorie"]
    nove = []
    for i in range(9):
        k = json.loads(json.dumps(vzor[i % len(vzor)]))
        k["id"] = f"{k['id']}-{i}"
        k["nazev"] = {j: f"{v} {i + 1}" for j, v in k["nazev"].items()}
        nove.append(k)
    kopie["kategorie"] = nove
    telo = json.dumps(kopie, ensure_ascii=False)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ")
    page = ctx.new_page()
    page.set_default_timeout(8000)
    hlidac.pripoj(page)
    page.route("**/data/index.json*", lambda r: r.fulfill(status=200, content_type="application/json", body=telo))
    page.goto(zaklad)
    page.evaluate("s => localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(s))",
                  {"ui": "cs", "otazky": "cs", "preklad": "vypnuto", "zvuky": False, "vibrace": False})
    page.reload()
    jdi(page, zaklad, "#/")
    over(page.locator("[data-test=kategorie-domu] .tile[data-kategorie]").count() == 6
         and "(9)" in page.inner_text("[data-test=vsechny-kategorie]"), "9 kategorií: na Domů 6 dlaždic + „Všechny kategorie (9)“")
    p = pretekani(page)
    over(not p, "Domů s mnoha kategoriemi nepřetéká" + (f": {p}" if p else ""))
    if vystup:
        vystup.mkdir(parents=True, exist_ok=True)
        page.wait_for_timeout(900)  # dlaždice naskakují postupně
        page.screenshot(path=str(vystup / "mnoho-kategorii-domu-390.png"), full_page=True)
    page.click("[data-test=vsechny-kategorie]")
    page.wait_for_selector(".bar-title")
    over(page.locator(".tiles .tile[data-kategorie]").count() == 9, "„Všechny kategorie“ ukáže všech 9")
    if vystup:
        page.wait_for_timeout(600)
        page.screenshot(path=str(vystup / "mnoho-kategorii-vse-390.png"), full_page=True)
    ctx.close()


def scenar_postupu(browser, zaklad, hlidac, otazky, T):
    """D-022: ukazatel postupu (zeleně správné, za nimi barevně špatné) a tlačítko Další vidět
    po odpovědi i s rezervou nad spodní lištou prohlížeče (telefon s nízkým oknem, překlad vždy)."""
    print("Ukazatel postupu a tlačítko Další po odpovědi (D-022):")
    ctx = browser.new_context(viewport={"width": 390, "height": 600}, locale="cs-CZ", has_touch=True, is_mobile=True)
    page = ctx.new_page()
    page.set_default_timeout(8000)
    hlidac.pripoj(page)
    page.goto(zaklad)
    page.evaluate("s => localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(s))",
                  {"ui": "cs", "otazky": "cs", "preklad": "vzdy", "zvuky": False, "vibrace": False})
    page.reload()
    zacni_kolo(page, zaklad, T)
    sirky = lambda: page.evaluate("""() => { const c = document.querySelector('.progress').getBoundingClientRect().width;
        const w = s => document.querySelector(s).getBoundingClientRect().width / c * 100;
        return [Math.round(w('[data-test=postup-ok]')), Math.round(w('[data-test=postup-bad]'))]; }""")
    vidno = []
    for i, spravne in enumerate((True, False, True)):
        zodpovez(page, otazky, spravne=spravne)
        page.wait_for_timeout(900)
        vidno.append(page.evaluate("""() => { const b = document.querySelector('[data-test=dalsi]').getBoundingClientRect();
            return b.top >= 0 && b.bottom + 20 <= innerHeight; }"""))
        if i == 1:
            n = int(page.inner_text("[data-test=pocitadlo]").split("/")[1])
            ocek = [round(100 / n), round(100 / n)]
            over(sirky() == ocek, f"po 1 správné a 1 špatné: zelená {sirky()[0]} %, barevná {sirky()[1]} % (očekáváno {ocek})")
        dalsi(page)
    over(all(vidno), f"po každé odpovědi je tlačítko Další vidět (rezerva aspoň 20 px): {vidno}")
    n = int(page.inner_text("[data-test=pocitadlo]").split("/")[1])
    over(sirky() == [round(200 / n), round(100 / n)], f"po 3 odpovědích (2 správně): {sirky()}")
    ctx.close()


def scenar_razeni_kategorii(browser, zaklad, hlidac, index, vystup=None):
    """D-025: kategorie ve Statistikách od nejúspěšnější; nehrané na konci v původním pořadí."""
    print("Řazení kategorií ve Statistikách (D-025):")
    viditelne = [k for k in index["kategorie"] if any(any(t_["otazek"].get(o, 0) >= 3 for o in "123") for t_ in k["temata"])]
    if len(viditelne) < 4:
        ok("méně než 4 kategorie – řazení se nekontroluje")
        return
    vyber = viditelne[-3:]  # poslední tři: bez řazení by byly až na konci
    skore = [5, 9, 7]       # 50 %, 90 %, 70 % → očekávané pořadí 2., 3., 1.
    v = lambda s_: {"s": s_, "c": 10, "pul": s_, "odpovedi": [], "datum": "2026-11-01", "j": "cs", "r": 0}
    vysl = {}
    for k, s_ in zip(vyber, skore):
        tema = next(t_ for t_ in k["temata"] if t_["otazek"].get("1", 0) >= 3)
        vysl[tema["id"]] = {"1": v(s_)}
    pokrok = {"verze": 2, "vysledky": vysl, "rozehrano": {}, "dny": {"posledni": "2026-11-01", "serie": 1, "nejdelsi": 1}, "stat": {"kol": 3, "nejdelsiRada": 3}, "odznaky": {}}
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ")
    page = ctx.new_page()
    page.set_default_timeout(8000)
    hlidac.pripoj(page)
    page.goto(zaklad)
    page.evaluate("""([n, p]) => { localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(n)); localStorage.setItem('kviz.v1.pokrok', JSON.stringify(p)); }""",
                  [{"ui": "cs", "otazky": "cs", "preklad": "vypnuto", "zvuky": False, "vibrace": False}, pokrok])
    page.reload()
    jdi(page, zaklad, "#/statistiky")
    poradi = [x.replace("stat-kat-", "") for x in page.eval_on_selector_all("[data-test^=stat-kat-]", "els => els.map(e => e.dataset.test)")]
    ocek = [vyber[1]["id"], vyber[2]["id"], vyber[0]["id"]] + [k["id"] for k in viditelne if k not in vyber]
    over(poradi == ocek, f"pořadí 90 % → 70 % → 50 % → nehrané v původním pořadí ({poradi[:4]}…)")
    if vystup:
        vystup.mkdir(parents=True, exist_ok=True)
        page.wait_for_timeout(600)
        page.locator("[data-test^=stat-kat-]").first.locator("xpath=..").screenshot(path=str(vystup / "razeni-kategorii-390.png"))
    ctx.close()


def scenar_d026(browser, zaklad, hlidac, index, otazky, vystup=None):
    """D-026: karta Pokračuj na Domů, hledání témat, filtr v kategorii, stupňové odznaky."""
    import unicodedata
    print("Pokračuj, hledání, filtr a stupňové odznaky (D-026):")
    viditelna = [(k, t_) for k in index["kategorie"] for t_ in k["temata"] if t_["otazek"].get("1", 0) >= 3]
    nast = {"ui": "cs", "otazky": "cs", "preklad": "vypnuto", "zvuky": False, "vibrace": False}
    v = lambda s_, cas=0: {"s": s_, "c": 10, "pul": s_, "odpovedi": [], "datum": "2026-11-01", "j": "cs", "r": 0, "cas": cas}
    prazdny = lambda: {"verze": 2, "vysledky": {}, "rozehrano": {}, "dny": {"posledni": None, "serie": 0, "nejdelsi": 0}, "stat": {"kol": 0, "nejdelsiRada": 0}, "odznaky": {}}

    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ")
    ctx.add_init_script(SLEDOVANI)
    page = ctx.new_page()
    page.set_default_timeout(8000)
    hlidac.pripoj(page)

    def nacti(pokrok):
        page.goto(zaklad)
        page.evaluate("""([n, p]) => { localStorage.clear(); localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(n));
            if (p) localStorage.setItem('kviz.v1.pokrok', JSON.stringify(p)); }""", [nast, pokrok])
        page.reload()
        jdi(page, zaklad, "#/")

    # --- Pokračuj
    nacti(None)
    over(page.locator("[data-test=pokracuj]").count() == 0, "nový hráč: karta Pokračuj není")
    (k1, T1), (k2, T2) = viditelna[0], viditelna[1]
    d2 = json.loads((KOREN / "data" / T2["soubor"]).read_text(encoding="utf-8"))
    ids = [q["id"] for q in d2["otazky"] if str(q["obtiznost"]) == "1"][:10]
    odp = [[ids[0], otazky[ids[0]]["spravne"]], [ids[1], otazky[ids[1]]["spravne"]], [ids[2], (otazky[ids[2]]["spravne"] + 1) % 4]]
    pk = prazdny()
    pk["vysledky"] = {T1["id"]: {"1": v(8, 1000)}}
    pk["rozehrano"] = {f'{T2["id"]}|1': {"poradi": ids, "odpovedi": odp, "rada": 0, "nejdelsiRada": 2, "prekladOtevren": False, "ziskaneBehem": [], "j": "cs", "spravne": 2, "cas": 2000}}
    nacti(pk)
    karta = page.locator("[data-test=pokracuj]")
    over(karta.count() == 1 and karta.get_attribute("href") == f'#/hra/{T2["id"]}/1' and f"otázka 4 z {len(ids)}" in karta.inner_text(),
         "Pokračuj: rozehrané kolo, „otázka 4 z 10“")
    if vystup:
        vystup.mkdir(parents=True, exist_ok=True)
        page.wait_for_timeout(700)
        page.screenshot(path=str(vystup / "d026-domu-pokracuj-390.png"))
    karta.click()
    page.wait_for_selector(".qcard")
    over(page.inner_text("[data-test=pocitadlo]").replace(" ", "").startswith("4/"), "ťuknutí na Pokračuj otevře kolo na 4. otázce")
    pk["rozehrano"] = {}
    nacti(pk)
    karta = page.locator("[data-test=pokracuj]")
    over(karta.count() == 1 and karta.get_attribute("href") == f'#/hra/{T1["id"]}/2' and "nová obtížnost" in karta.inner_text(),
         "Pokračuj bez rozehraného kola: další obtížnost naposledy hraného tématu")

    # --- hledání (D-027: na obrazovce Všechny kategorie, na Domů není)
    over(page.locator("[data-test=hledani]").count() == 0, "Domů: hledání není (je ve Všech kategoriích)")
    jdi(page, zaklad, "#/kategorie")
    jmeno = T1["nazev"]["cs"]
    slovo = next((w for w in jmeno.split() if len(w) >= 5), jmeno.split()[0])
    dotaz = unicodedata.normalize("NFD", slovo[:5]).encode("ascii", "ignore").decode().lower()  # bez diakritiky
    page.fill("[data-test=hledani]", dotaz)
    page.wait_for_timeout(200)
    over(page.locator(f'[data-test=vysledky-hledani] .hit[data-tema="{T1["id"]}"]').count() == 1 and not page.is_visible("[data-test=kategorie-vse]"),
         f"hledání „{dotaz}“ (bez diakritiky) najde „{jmeno}“ a schová kategorie")
    if vystup:
        page.screenshot(path=str(vystup / "d026-hledani-390.png"))
    page.fill("[data-test=hledani]", "qxqxzz")
    over(page.locator("[data-test=nic-nenalezeno]").count() == 1, "nesmyslný dotaz: „Žádné téma tomu neodpovídá“")
    page.fill("[data-test=hledani]", "")
    over(page.is_visible("[data-test=kategorie-vse]"), "smazané hledání: kategorie zpět")

    # --- filtr v kategorii (kategorie s nejvíc tématy)
    kat = max(index["kategorie"], key=lambda k: len(k["temata"]))
    tt = [t_ for t_ in kat["temata"] if t_["otazek"].get("1", 0) >= 3 and t_["otazek"].get("2", 0) >= 3]
    if len(tt) >= 4:
        pk = prazdny()
        pk["vysledky"] = {tt[0]["id"]: {"1": v(5)}, tt[1]["id"]: {"1": v(8)}}  # 1 hotové (pod 70 %), 1 rozehrané
        nacti(pk)
        jdi(page, zaklad, f'#/kategorie/{kat["id"]}')
        pocty = {f: page.inner_text(f'[data-filtr="{f}"] .chip-n') for f in ("vse", "nehrane", "rozehrane", "hotove")}
        n = page.locator(".topic").count()
        over(page.evaluate("document.querySelector('.chips').compareDocumentPosition(document.querySelector('.lead-ikona')) & 4") > 0,
             "„Vyber si téma“ je pod filtrem (D-031)")
        over(pocty == {"vse": str(n), "nehrane": str(n - 2), "rozehrane": "1", "hotove": "1"}, f"filtr: počty {pocty}")
        page.click('[data-filtr="hotove"]')
        vid = [x for x in page.eval_on_selector_all(".topic", "els => els.filter(e => !e.hidden).map(e => e.dataset.tema)")]
        over(vid == [tt[0]["id"]], "filtr Hotové ukáže jen uzavřené téma")
        if vystup:
            page.screenshot(path=str(vystup / "d026-filtr-390.png"))
        page.click('[data-filtr="nehrane"]')
        over(page.eval_on_selector_all(".topic", "els => els.filter(e => !e.hidden).length") == n - 2, "filtr Nehrané")
        page.click('[data-filtr="vse"]')
        page.set_viewport_size({"width": 320, "height": 640})
        horni = page.eval_on_selector_all("[data-filtr]", "els => [...new Set(els.map(e => Math.round(e.getBoundingClientRect().top)))]")
        ikony = page.eval_on_selector_all("[data-filtr] .chip-ico", "els => els.map(e => e.textContent)")
        over(len(horni) == 1 and ikony == ["🚦", "🏃", "🏁"], f"filtr na 320 px na jednom řádku, ikony {ikony} (D-027)")
        p_ = pretekani(page)
        over(not p_, "filtr na 320 px nepřetéká" + (f": {p_}" if p_ else ""))
        page.set_viewport_size({"width": 390, "height": 844})

    # --- stupňové odznaky: 9 uzavřených témat + 10. uzavřené kolem → Cestovatel – bronz
    if len(viditelna) >= 11:
        pk = prazdny()
        pk["vysledky"] = {t_["id"]: {"1": v(5)} for _, t_ in viditelna[:9]}
        nacti(pk)
        T10 = viditelna[9][1]["id"]
        zacni_kolo(page, zaklad, T10)
        zahraj_kolo(page, otazky, spatnych=4)  # 60 % → další obtížnost zamčená natrvalo → 10. uzavřené téma
        nove = page.inner_text("[data-test=nove-odznaky]")
        over("Cestovatel – bronz" in nove, "10. dohrané téma: nový odznak „Cestovatel – bronz“")
        over("Objevitel" in nove, "Objevitel = kolo ve 3 různých tématech (D-027)")
        jdi(page, zaklad, "#/odznaky")
        rada = page.locator('[data-rada="temata"]')
        over(rada.locator('.medal.on[data-odznak="temata-10"]').count() == 1 and "10 / 50 do stříbra" in rada.inner_text(),
             "Odznaky: řada Cestovatel – bronz získán, „10 / 50 do stříbra“")
        n_kat = len([k for k in index["kategorie"] if any(any(t_["otazek"].get(o, 0) >= 3 for o in "123") for t_ in k["temata"])])
        over(page.locator("[data-test=rady-kategorie] .bfam").count() == n_kat, f"Znalec kategorií: {n_kat} řad")
        bez_chybejicich_textu(page, "Odznaky (stupně)")
        p_ = pretekani(page)
        over(not p_, "Odznaky nepřetékají" + (f": {p_}" if p_ else ""))
        if vystup:
            page.wait_for_timeout(600)
            page.screenshot(path=str(vystup / "d026-odznaky-390.png"), full_page=True)
        T11 = viditelna[10][1]["id"]
        zacni_kolo(page, zaklad, T11)
        zahraj_kolo(page, otazky, spatnych=1)  # 90 % → konfety (D-027)
        try:
            page.wait_for_function("window.__konfety > 0", timeout=4000)
            ok("při 90 % (4,5 ★) padají konfety (D-027)")
        except Exception:
            chyba("při 90 % (4,5 ★) nejsou konfety")
        jdi(page, zaklad, "#/")
        celkem = 10 + 4 * 3 + 3 * n_kat
        over(page.inner_text("[data-test=odznaky] b").endswith(f"/ {celkem}"), f"Domů: odznaky z celkem {celkem}")
    ctx.close()


def scenar_d028(browser, zaklad, hlidac, index, otazky, temata, vystup=None):
    """D-028: Překvap mě (náhodné nehrané téma), tmavý režim (volba i podle telefonu), velikost písma;
    s největším písmem v tmavém režimu nic nepřetéká ani na 320 px."""
    print("Překvap mě, tmavý režim a velikost písma (D-028):")
    nast = {"ui": "cs", "otazky": "cs", "preklad": "vzdy", "zvuky": False, "vibrace": False}
    v = lambda s_: {"s": s_, "c": 10, "pul": s_, "odpovedi": [], "datum": "2026-11-01", "j": "cs", "r": 0, "cas": 1}
    hrane = [t_["id"] for _, t_ in temata[:2]]
    pk = {"verze": 2, "vysledky": {tid: {"1": v(8)} for tid in hrane}, "rozehrano": {}, "dny": {"posledni": None, "serie": 0, "nejdelsi": 0}, "stat": {"kol": 2, "nejdelsiRada": 0}, "odznaky": {}}
    vsechna = {t_["id"] for k in index["kategorie"] for t_ in k["temata"] if any(t_["otazek"].get(o, 0) >= 3 for o in "123")}

    def kontext(**kw):
        ctx = browser.new_context(locale="cs-CZ", **{"viewport": {"width": 390, "height": 844}, **kw})
        page = ctx.new_page()
        page.set_default_timeout(8000)
        hlidac.pripoj(page)
        page.goto(zaklad)
        page.evaluate("([n, p]) => { localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(n)); localStorage.setItem('kviz.v1.pokrok', JSON.stringify(p)); }", [nast, pk])
        page.reload()
        jdi(page, zaklad, "#/")
        return ctx, page

    pozadi = lambda page: page.evaluate("getComputedStyle(document.body).backgroundColor")
    SVETLE, TMAVE = "rgb(255, 246, 234)", "rgb(28, 18, 32)"

    # --- Překvap mě
    ctx, page = kontext()
    cile = []
    for _ in range(8):
        jdi(page, zaklad, "#/")
        page.click("[data-test=nahodne]")
        page.wait_for_selector(".diff")
        cile.append(page.url.split("#/tema/")[-1])
    over(all(c in vsechna and c not in hrane for c in cile) and len(set(cile)) > 1,
         f"Překvap mě: 8× náhodné nehrané téma ({len(set(cile))} různých, žádné z hraných)")

    # --- tmavý režim a písmo v Nastavení
    over(pozadi(page) == SVETLE, "výchozí vzhled (telefon ve světlém režimu): světlé pozadí")
    jdi(page, zaklad, "#/nastaveni")
    page.click('[aria-labelledby="nast-vzhled"] [data-hodnota="tmavy"]')
    page.wait_for_timeout(100)
    over(pozadi(page) == TMAVE and page.get_attribute("html", "data-vzhled") == "tmavy", "Tmavý: tmavé pozadí hned")
    jdi(page, zaklad, "#/kategorie")
    dl = page.eval_on_selector_all(".tiles .tile[data-kategorie]", """els => els.map(e => { const c = getComputedStyle(e);
        const [r, g, b] = c.backgroundColor.match(/\\d+/g).map(Number); return [c.color, (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255]; })""")
    over(dl and all(c == "rgb(255, 255, 255)" and jas < 0.4 for c, jas in dl), "tmavý režim: dlaždice kategorií tmavé s bílým textem (D-031)")
    jdi(page, zaklad, "#/nastaveni")
    page.click('[aria-labelledby="nast-pismo"] [data-hodnota="nejvetsi"]')
    page.wait_for_timeout(100)
    over(page.evaluate("getComputedStyle(document.body).fontSize") == "22.1px", "Největší písmo: 17 px × 1,3")
    page.reload()
    page.wait_for_selector("[aria-labelledby=nast-vzhled]")
    over(pozadi(page) == TMAVE and page.evaluate("getComputedStyle(document.body).fontSize") == "22.1px", "vzhled i písmo přežijí obnovení stránky")
    bez_chybejicich_textu(page, "Nastavení (vzhled)")
    # 320 px, tmavý režim, největší písmo: nic nepřetéká
    page.set_viewport_size({"width": 320, "height": 640})
    T = temata[2][1]["id"]
    zacni_kolo(page, zaklad, T)
    zodpovez(page, otazky, spravne=False)
    page.wait_for_timeout(500)
    problemy = {}
    p_ = pretekani(page)
    if p_:
        problemy["otázka"] = p_
    dalsi(page)
    zahraj_kolo(page, otazky, spatnych=0)
    page.wait_for_timeout(1500)
    for nazev, hsh in [("výsledek", None), ("Domů", "#/"), ("Kategorie", "#/kategorie"), ("Statistiky", "#/statistiky"), ("Odznaky", "#/odznaky"), ("Nastavení", "#/nastaveni"), ("Obtížnost", f"#/tema/{T}")]:
        if hsh:
            jdi(page, zaklad, hsh)
            page.wait_for_timeout(500)
        p_ = pretekani(page)
        if p_:
            problemy[nazev] = p_
        if vystup and nazev in ("Domů", "Odznaky"):
            vystup.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(vystup / f"d028-tmavy-nejvetsi-{nazev}-320.png"))
    over(not problemy, "320 px, tmavý režim, největší písmo: nic nepřetéká" + (f": {problemy}" if problemy else ""))
    ctx.close()

    # --- podle telefonu: telefon v tmavém režimu → tmavě, volba Světlý → světle
    ctx, page = kontext(color_scheme="dark")
    over(pozadi(page) == TMAVE, "Podle telefonu: telefon v tmavém režimu → tmavé pozadí")
    jdi(page, zaklad, "#/nastaveni")
    page.click('[aria-labelledby="nast-vzhled"] [data-hodnota="svetly"]')
    page.wait_for_timeout(100)
    over(pozadi(page) == SVETLE, "volba Světlý přebije tmavý telefon")
    ctx.close()


def scenar_procvicovani(browser, zaklad, hlidac, temata, otazky, vystup=None):
    """D-031: Procvičit chyby – z dohraných i rozehraných kol, výsledky se nemění, správné odpovědi ze seznamu zmizí."""
    print("Procvičování chyb (D-031):")
    (_, A), (_, B) = temata[0], temata[1]
    dA = json.loads((KOREN / "data" / A["soubor"]).read_text(encoding="utf-8"))
    dB = json.loads((KOREN / "data" / B["soubor"]).read_text(encoding="utf-8"))
    qa = [q for q in dA["otazky"] if str(q["obtiznost"]) == "1"][:3]
    qb = [q for q in dB["otazky"] if str(q["obtiznost"]) == "1"][:2]
    spatne = lambda q: (q["spravne"] + 1) % 4
    pk = {"verze": 2, "rozehrano": {f'{B["id"]}|1': {"poradi": [q["id"] for q in qb], "odpovedi": [[qb[0]["id"], spatne(qb[0])]], "rada": 0, "nejdelsiRada": 0,
                                                     "prekladOtevren": False, "ziskaneBehem": [], "j": "cs", "spravne": 0, "cas": 1}},
          "vysledky": {A["id"]: {"1": {"s": 1, "c": 3, "pul": 3, "datum": "2026-11-01", "j": "cs", "r": 1, "cas": 1,
                                       "odpovedi": [[qa[0]["id"], qa[0]["spravne"]], [qa[1]["id"], spatne(qa[1])], [qa[2]["id"], spatne(qa[2])]]}}},
          "dny": {"posledni": None, "serie": 0, "nejdelsi": 0}, "stat": {"kol": 1, "nejdelsiRada": 1}, "odznaky": {}}
    ctx = browser.new_context(viewport={"width": 320, "height": 640}, locale="cs-CZ")
    page = ctx.new_page()
    page.set_default_timeout(8000)
    hlidac.pripoj(page)
    page.goto(zaklad)
    page.evaluate("([n, p]) => { localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(n)); localStorage.setItem('kviz.v1.pokrok', JSON.stringify(p)); }",
                  [{"ui": "cs", "otazky": "cs", "preklad": "vzdy", "zvuky": False, "vibrace": False}, pk])
    page.reload()
    jdi(page, zaklad, "#/historie")
    page.wait_for_selector("[data-test=procvicit]")
    over("3 otázky s chybnou odpovědí" in page.inner_text("[data-test=procvicit]")
         and page.evaluate("document.querySelector('[data-test=procvicit]').compareDocumentPosition(document.querySelector('.hist')) & 4") > 0,
         "Historie: nahoře „Procvičit chyby – 3 otázky“ (2 z dohraného, 1 z rozehraného kola)")
    vysl_pred = page.evaluate("JSON.parse(localStorage.getItem('kviz.v1.pokrok')).vysledky")
    page.click("[data-test=procvicit]")
    page.wait_for_selector(".qcard")
    ids_chyb = {qa[1]["id"], qa[2]["id"], qb[0]["id"]}
    vidno = []
    for i in range(3):
        vidno.append(page.get_attribute(".qcard", "data-qid"))
        zodpovez(page, otazky, spravne=(i != 0))  # první špatně, další dvě správně
        p_ = pretekani(page)
        if p_:
            chyba(f"procvičování na 320 px přetéká: {p_}")
        dalsi(page)
    page.wait_for_selector("[data-test=procvic-konec]")
    over(set(vidno) == ids_chyb, "procvičují se přesně chybně zodpovězené otázky")
    over("2 / 3" in page.inner_text("[data-test=procvic-konec]") and "zbývá 1 otázka" in page.inner_text("[data-test=procvic-zbyva]"),
         "konec: 2 / 3 správně, k procvičení zbývá 1 otázka")
    if vystup:
        vystup.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(vystup / "d031-procvic-konec-320.png"))
    over(page.evaluate("JSON.parse(localStorage.getItem('kviz.v1.pokrok')).vysledky") == vysl_pred, "výsledky a hvězdy se procvičováním nezměnily")
    page.click("[data-test=procvic-znovu]")
    page.wait_for_selector(".qcard")
    over(page.get_attribute(".qcard", "data-qid") == vidno[0] and page.inner_text("[data-test=pocitadlo]").replace(" ", "") == "1/1",
         "Procvičit další: zbylá 1 otázka")
    zodpovez(page, otazky, spravne=True)
    dalsi(page)
    page.wait_for_selector("[data-test=procvic-konec]")
    over("procvičené" in page.inner_text("[data-test=procvic-zbyva]"), "všechny chyby procvičené")
    jdi(page, zaklad, "#/historie")
    page.wait_for_selector("[data-test=procvicit-nic]")
    ok("Historie: „Žádné chyby k procvičení“")
    bez_chybejicich_textu(page, "Historie (procvičování)")
    ctx.close()


SDILENI_MOCK = "window.__sdileno = null; navigator.share = (d) => { window.__sdileno = d; return Promise.resolve(); };"
BEZ_SDILENI = "try { delete Navigator.prototype.share; } catch (e) {} try { Object.defineProperty(navigator, 'share', { value: undefined }); } catch (e) {}"


def scenar_d032(browser, zaklad, hlidac, otazky, temata, vystup=None):
    """D-032: denní výzva (stejná pro všechny, jeden pokus, pokračování po obnovení, série) a sdílení výsledku."""
    print("Denní výzva a sdílení (D-032):")
    nast = {"ui": "cs", "otazky": "cs", "preklad": "vypnuto", "zvuky": False, "vibrace": False}

    def kontext(init=None, pokrok=None, **kw):
        ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ", **kw)
        if init:
            ctx.add_init_script(init)
        page = ctx.new_page()
        page.set_default_timeout(8000)
        hlidac.pripoj(page)
        page.goto(zaklad)
        page.evaluate("([n, p]) => { localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(n)); if (p) localStorage.setItem('kviz.v1.pokrok', JSON.stringify(p)); }", [nast, pokrok])
        page.reload()
        jdi(page, zaklad, "#/")
        return ctx, page

    ids = lambda page: page.evaluate("(() => { const p = JSON.parse(localStorage.getItem('kviz.v1.pokrok')); return Object.values(p.vyzvy)[0].ids; })()")

    # --- A: celá výzva, pokračování po obnovení, jeden pokus
    ctx, page = kontext(SDILENI_MOCK)
    over("5 otázek dne" in page.inner_text("[data-test=vyzva]"), "Domů: karta Denní výzva (5 otázek dne)")
    page.click("[data-test=vyzva]")
    page.wait_for_selector(".qcard")
    zodpovez(page, otazky, spravne=False)
    dalsi(page)
    zodpovez(page, otazky, spravne=True)
    page.reload()
    page.wait_for_selector(".qcard")
    over(page.inner_text("[data-test=pocitadlo]").replace(" ", "") == "3/5", "po obnovení stránky výzva pokračuje 3. otázkou")
    for _ in range(3):
        zodpovez(page, otazky, spravne=True)
        dalsi(page)
    page.wait_for_selector("[data-test=vyzva-konec]")
    konec = page.inner_text("[data-test=vyzva-konec]")
    over("4 / 5" in konec and "🟥🟩🟩🟩🟩" in konec and "1 den výzev" in konec, "výsledek výzvy: 4 / 5, 🟥🟩🟩🟩🟩, série 1 den")
    if vystup:
        vystup.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(vystup / "d032-vyzva-vysledek-390.png"))
    page.click("[data-test=sdilet]")
    page.wait_for_function("window.__sdileno !== null")
    d = page.evaluate("window.__sdileno")
    over("Denní výzva" in d["text"] and "4/5" in d["text"] and "🟥🟩🟩🟩🟩" in d["text"] and d["url"].endswith("#/vyzva"),
         f"Sdílet výzvu: systémové sdílení s textem a odkazem ({d['text'][:40]}…)")
    ids_a = ids(page)
    vysl_pred = page.evaluate("JSON.parse(localStorage.getItem('kviz.v1.pokrok')).vysledky")
    over(vysl_pred == {}, "výzva nemění výsledky kol ani hvězdy")
    jdi(page, zaklad, "#/")
    over("Dnes hotovo: 4 / 5" in page.inner_text("[data-test=vyzva]"), "Domů: „Dnes hotovo: 4 / 5“")
    if vystup:
        page.wait_for_timeout(700)
        page.screenshot(path=str(vystup / "d032-domu-vyzva-390.png"))
    jdi(page, zaklad, "#/vyzva")
    page.wait_for_selector("[data-test=vyzva-konec]")
    over(page.locator(".qcard").count() == 0, "dnešní výzvu nejde hrát znovu – ukáže se výsledek")
    jdi(page, zaklad, "#/statistiky")
    over(page.locator("[data-test=stat-vyzvy]").count() == 1, "Statistiky: řádek Denní výzvy")
    ctx.close()

    # --- B: jiný hráč má dnes stejné otázky; série pokračuje ze včerejška
    ctx, page = kontext()
    vcera = page.evaluate("(() => { const d = new Date(); d.setDate(d.getDate() - 1); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })()")
    page.evaluate("v => localStorage.setItem('kviz.v1.pokrok', JSON.stringify({ verze: 2, vysledky: {}, rozehrano: {}, odznaky: {}, vyzvy: {}, vyzvaDny: { posledni: v, serie: 4, nejdelsi: 4 } }))", vcera)
    page.reload()
    jdi(page, zaklad, "#/vyzva")
    page.wait_for_selector(".qcard")
    over(ids(page) == ids_a, "jiný hráč má dnes stejných 5 otázek")
    for _ in range(5):
        zodpovez(page, otazky, spravne=True)
        dalsi(page)
    page.wait_for_selector("[data-test=vyzva-konec]")
    over("5 dní výzev" in page.inner_text("[data-test=vyzva-serie]"), "série výzev ze včerejška pokračuje (4 → 5 dní)")
    ctx.close()

    # --- C: sdílení výsledku kola – systémové sdílení, jinak zkopírování
    T = temata[0][1]
    ctx, page = kontext(SDILENI_MOCK)
    zacni_kolo(page, zaklad, T["id"])
    zahraj_kolo(page, otazky, spatnych=2)
    page.click("[data-test=sdilet]")
    page.wait_for_function("window.__sdileno !== null")
    d = page.evaluate("window.__sdileno")
    over(T["nazev"]["cs"] in d["text"] and "★" in d["text"] and d["url"].endswith(f'#/tema/{T["id"]}'), "Sdílet výsledek kola: téma, skóre, hvězdy a odkaz na téma")
    ctx.close()
    ctx, page = kontext(BEZ_SDILENI, permissions=["clipboard-read", "clipboard-write"])
    zacni_kolo(page, zaklad, T["id"])
    zahraj_kolo(page, otazky, spatnych=2)
    page.click("[data-test=sdilet]")
    page.wait_for_selector("[data-test=oznameni]")
    schranka = page.evaluate("navigator.clipboard.readText()")
    over("Zkopírováno" in page.inner_text("[data-test=oznameni]") and schranka.strip().endswith(f'#/tema/{T["id"]}'),
         "bez systémového sdílení: text s odkazem se zkopíruje a ukáže se „Zkopírováno“")
    ctx.close()


MLUVENI_MOCK = """window.__mluv = [];
  if (window.speechSynthesis) { window.speechSynthesis.speak = (u) => window.__mluv.push({ text: u.text, lang: u.lang }); window.speechSynthesis.cancel = () => {}; }"""


def scenar_d033(browser, zaklad, hlidac, otazky, temata, vystup=None):
    """D-033: přenos pokroku souborem, výzva kamarádovi (stejné otázky přes odkaz), předčítání nahlas."""
    import tempfile
    print("Přenos pokroku, výzva kamarádovi, předčítání (D-033):")
    T = temata[0][1]
    nast = {"ui": "cs", "otazky": "cs", "preklad": "vypnuto", "zvuky": False, "vibrace": False}

    def kontext(init=None, nastaveni=nast, **kw):
        ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ", accept_downloads=True, **kw)
        for i in ([init] if isinstance(init, str) else init or []):
            ctx.add_init_script(i)
        page = ctx.new_page()
        page.set_default_timeout(8000)
        hlidac.pripoj(page)
        page.goto(zaklad)
        if nastaveni:
            page.evaluate("n => localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(n))", nastaveni)
            page.reload()
            jdi(page, zaklad, "#/")
        return ctx, page

    # --- výzva kamarádovi + předčítání
    ctx, page = kontext([SDILENI_MOCK, MLUVENI_MOCK])
    zacni_kolo(page, zaklad, T["id"])
    q0 = otazky[page.get_attribute(".qcard", "data-qid")]
    page.click(".qcard [data-test=predcist]")
    m = page.evaluate("window.__mluv")
    over(m and q0["otazka"]["cs"] in m[-1]["text"] and "A: " + q0["moznosti"]["cs"][0] in m[-1]["text"] and m[-1]["lang"] == "cs-CZ",
         "🔊 Přečíst: otázka i možnosti česky (cs-CZ)")
    zahraj_kolo(page, otazky, spatnych=3)
    ids_kola = page.evaluate(f"JSON.parse(localStorage.getItem('kviz.v1.pokrok')).vysledky['{T['id']}']['1'].odpovedi.map(x => x[0])")
    page.click("[data-test=vyzvat]")
    page.wait_for_function("window.__sdileno !== null")
    d = page.evaluate("window.__sdileno")
    over("/souboj/" in d["url"] and d["url"].endswith("/7") and "7/10" in d["text"], f"Vyzvat kamaráda: odkaz se stejnými otázkami a skóre 7 ({d['url'].split('#')[1][:40]}…)")
    ctx.close()
    # kamarád: nový hráč přijde z odkazu → první spuštění → souboj, stejné otázky, nic se mu nezapíše
    ctx, page = kontext(SDILENI_MOCK, nastaveni=None)
    page.goto(d["url"])
    page.wait_for_selector("[data-test=pokracovat]")
    page.click("[data-test=pokracovat]")
    page.click('[data-zpusob="muj"]')
    page.wait_for_selector("[data-test=souboj-uvod]")
    over("kamarád měl 7 z 10" in page.inner_text("[data-test=souboj-uvod]"), "kamarád z odkazu: po prvním spuštění rovnou výzva „kamarád měl 7 z 10“")
    hrane = []
    for _ in range(len(ids_kola)):
        hrane.append(page.get_attribute(".qcard", "data-qid"))
        zodpovez(page, otazky, spravne=True)
        dalsi(page)
    page.wait_for_selector("[data-test=souboj-konec]")
    over(hrane == ids_kola, "kamarád hraje stejné otázky ve stejném pořadí")
    over(page.get_attribute("[data-test=souboj-konec]", "data-verdikt") == "vyhra" and "10 / 10" in page.inner_text("[data-test=souboj-konec]"),
         "10 : 7 → „Vyhráváš! 🏆“")
    if vystup:
        vystup.mkdir(parents=True, exist_ok=True)
        page.wait_for_timeout(900)
        page.screenshot(path=str(vystup / "d033-souboj-390.png"))
    over(not page.evaluate("Object.keys((JSON.parse(localStorage.getItem('kviz.v1.pokrok') || '{}').vysledky) || {}).length"),
         "výzva od kamaráda nic nezapíše do pokroku")
    page.click("[data-test=sdilet]")
    page.wait_for_function("window.__sdileno !== null")
    over(page.evaluate("window.__sdileno.url").endswith("/10"), "Poslat výsledek zpět: odkaz s mým skóre 10")
    ctx.close()

    # --- předčítání automaticky / vypnuto
    ctx, page = kontext(MLUVENI_MOCK, nastaveni={**nast, "predcitani": "auto"})
    zacni_kolo(page, zaklad, temata[1][1]["id"])
    page.wait_for_timeout(200)
    over(len(page.evaluate("window.__mluv")) == 1, "předčítání Automaticky: otázka se přečte sama")
    zodpovez(page, otazky)
    page.click(".explain [data-test=predcist]")
    q = otazky[page.get_attribute(".qcard", "data-qid")]
    over(page.evaluate("window.__mluv")[-1]["text"] == q["vysvetleni"]["cs"], "🔊 u vysvětlení přečte vysvětlení")
    ctx.close()
    ctx, page = kontext(MLUVENI_MOCK, nastaveni={**nast, "predcitani": "vypnuto"})
    zacni_kolo(page, zaklad, temata[1][1]["id"])
    over(page.locator("[data-test=predcist]").count() == 0, "předčítání Vypnuto: žádné tlačítko 🔊")
    ctx.close()

    # --- přenos pokroku: uložit do souboru v jednom „zařízení“, nahrát v druhém
    ctx, page = kontext()
    zacni_kolo(page, zaklad, T["id"])
    zahraj_kolo(page, otazky, spatnych=1)
    jdi(page, zaklad, "#/")
    hvezdy_a = page.inner_text("[data-test=hvezdy-celkem] b")
    jdi(page, zaklad, "#/nastaveni")
    with page.expect_download() as dl:
        page.click("[data-test=prenos-ulozit]")
    soubor = Path(tempfile.mkdtemp()) / dl.value.suggested_filename
    dl.value.save_as(soubor)
    obsah = json.loads(soubor.read_text(encoding="utf-8"))
    over(soubor.name.startswith("oho-pokrok-") and obsah.get("aplikace") == "oho-kviz" and obsah["data"]["pokrok"]["vysledky"].get(T["id"]),
         f"Uložit pokrok do souboru: {soubor.name} s výsledky")
    ctx.close()
    ctx, page = kontext()
    jdi(page, zaklad, "#/nastaveni")
    spatny = soubor.with_name("jiny.json")
    spatny.write_text('{"neco": 1}', encoding="utf-8")
    page.set_input_files("[data-test=prenos-soubor]", str(spatny))
    page.wait_for_selector("[data-test=oznameni]")
    over("nejde nahrát" in page.inner_text("[data-test=oznameni]") and page.locator("[data-test=potvrdit]").count() == 0, "cizí soubor: „nejde nahrát“, nic se nemění")
    page.set_input_files("[data-test=prenos-soubor]", str(soubor))
    page.wait_for_selector("[data-test=potvrdit]")
    over("(1 dohrané kolo)" in page.inner_text("[data-test=potvrdit]"), "potvrzení uvnitř aplikace s popisem souboru („1 dohrané kolo“)")
    if vystup:
        page.screenshot(path=str(vystup / "d033-prenos-potvrzeni-390.png"))
    page.click("[data-test=potvrdit-ano]")
    page.wait_for_selector("[data-test=domu]")
    page.wait_for_timeout(300)
    over(page.inner_text("[data-test=hvezdy-celkem] b") == hvezdy_a, f"po nahrání má druhé zařízení stejné hvězdy ({hvezdy_a})")
    ctx.close()


def scenar_d034(browser, zaklad, hlidac, otazky, temata):
    """D-034: úroveň hráče (body za správné odpovědi podle obtížnosti + denní výzvy) a týdenní cíl se sérií týdnů."""
    print("Úroveň hráče a týdenní cíl (D-034):")
    (_, A), (_, B), (_, C) = temata[:3]
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="cs-CZ")
    page = ctx.new_page()
    page.set_default_timeout(8000)
    hlidac.pripoj(page)
    page.goto(zaklad)
    dny = page.evaluate("""(() => { const f = (d) => { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
        const d = new Date(); const po = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (d.getDay() + 6) % 7, 12);
        return { dnes: f(d), minuly: f(new Date(po.getFullYear(), po.getMonth(), po.getDate() - 7, 12)) }; })()""")
    v = lambda s_, datum: {"s": s_, "c": 10, "pul": s_, "odpovedi": [], "datum": datum, "j": "cs", "r": 0, "cas": 1}
    # body: 8×10 + 10×10 + 7×15 + výzva 3×10 = 315 → úroveň 3 (300–600) Nadšenec; tento týden 3 kola
    pk = {"verze": 2, "rozehrano": {}, "odznaky": {}, "dny": {"posledni": None, "serie": 0, "nejdelsi": 0}, "stat": {"kol": 3, "nejdelsiRada": 0},
          "vysledky": {A["id"]: {"1": v(8, dny["dnes"])}, B["id"]: {"1": v(10, dny["dnes"]), "2": v(7, dny["dnes"])}},
          "vyzvy": {"2026-01-01": {"ids": [], "odpovedi": [], "spravne": 3, "hotovo": True}}, "vyzvaDny": {"posledni": None, "serie": 0, "nejdelsi": 0}}
    nast = {"ui": "cs", "otazky": "cs", "preklad": "vypnuto", "zvuky": False, "vibrace": False}
    page.evaluate("([n, p]) => { localStorage.setItem('kviz.v1.nastaveni', JSON.stringify(n)); localStorage.setItem('kviz.v1.pokrok', JSON.stringify(p)); }", [nast, pk])
    page.reload()
    jdi(page, zaklad, "#/")
    u = page.inner_text("[data-test=uroven]")
    over("úroveň 3" in u.lower() and "Nadšenec" in u and "315 / 600 bodů do úrovně 4" in u, "Domů: 315 bodů = Úroveň 3 Nadšenec, „315 / 600 bodů do úrovně 4“")
    over("3/5" in page.inner_text("[data-test=tyden]") and "zbýv" in page.inner_text("[data-test=tyden]"), "týdenní cíl (výchozí 5 kol): 3/5, kolik dní zbývá")
    # cíl 3 kola + minulý týden také splněný → série 2 týdny
    pk["vysledky"][C["id"]] = {"1": v(9, dny["minuly"]), "2": v(9, dny["minuly"]), "3": v(9, dny["minuly"])}
    page.evaluate("p => localStorage.setItem('kviz.v1.pokrok', JSON.stringify(p))", pk)
    jdi(page, zaklad, "#/nastaveni")
    page.click('[aria-labelledby="nast-tyden"] [data-hodnota="3"]')
    page.reload()
    jdi(page, zaklad, "#/")
    over("✓" in page.inner_text("[data-test=tyden]") and "2 týdny v řadě" in page.inner_text("[data-test=tyden]"),
         "cíl 3 kola: tento týden splněno ✓, s minulým týdnem „2 týdny v řadě“")
    # výsledek kola: +body (Lehká 9 správně = 90) a nová úroveň, když se překročí hranice
    T = temata[3][1]["id"] if len(temata) > 3 else None
    if T:
        zacni_kolo(page, zaklad, T)
        zahraj_kolo(page, otazky, spatnych=1)
        over(page.inner_text("[data-test=body]").strip() == "⭐ +90 bodů", "výsledek kola: „⭐ +90 bodů“ (9 × 10 za Lehkou)")
        jdi(page, zaklad, "#/statistiky")
        over(page.locator("[data-test=stat-uroven]").count() == 1 and page.locator("[data-test=stat-tyden]").count() == 1, "Statistiky: řádky Úroveň a Týdenní cíl")
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
        snimky = [("1-domu", "#/", None), ("2-kategorie", "#/kategorie", None), ("8-statistiky", "#/statistiky", None), ("9-odznaky", "#/odznaky", None), ("3-otazka", f"#/hra/{T}/2", "odpoved"),
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
            lambda: scenar_hry(page, zaklad, otazky, temata, index),
            lambda: scenar_prekladu(page, zaklad, otazky, tema3["id"], tema["id"]),
            lambda: scenar_jazyka(page, zaklad, tema3["id"], tema["id"], kat["id"]),
            lambda: scenar_odznaku_a_nastaveni(page, zaklad),
            lambda: scenar_zvuku(page, zaklad, otazky, tema3["id"]),
            lambda: scenar_omezit_pohyb(browser, zaklad, hlidac, otazky, tema["id"]),
            lambda: scenar_statistik(browser, zaklad, hlidac, temata),
            lambda: scenar_d034(browser, zaklad, hlidac, otazky, temata),
            lambda: scenar_d033(browser, zaklad, hlidac, otazky, temata, None if args.bez_screenshotu else Path(args.vystup)),
            lambda: scenar_d032(browser, zaklad, hlidac, otazky, temata, None if args.bez_screenshotu else Path(args.vystup)),
            lambda: scenar_procvicovani(browser, zaklad, hlidac, temata, otazky, None if args.bez_screenshotu else Path(args.vystup)),
            lambda: scenar_d028(browser, zaklad, hlidac, index, otazky, temata, None if args.bez_screenshotu else Path(args.vystup)),
            lambda: scenar_d026(browser, zaklad, hlidac, index, otazky, None if args.bez_screenshotu else Path(args.vystup)),
            lambda: scenar_razeni_kategorii(browser, zaklad, hlidac, index, None if args.bez_screenshotu else Path(args.vystup)),
            lambda: scenar_postupu(browser, zaklad, hlidac, otazky, tema2["id"]),
            lambda: scenar_mnoho_kategorii(browser, zaklad, hlidac, index, None if args.bez_screenshotu else Path(args.vystup)),
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
