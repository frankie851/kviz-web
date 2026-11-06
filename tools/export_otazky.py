#!/usr/bin/env python3
"""Export otázek z Davidovy databáze (otazky.json) do dat webové aplikace (data/).

Použití (prostředí B – úkol propojený s Davidovým počítačem):
  python3 tools/export_otazky.py <cesta k otazky.json>               režim „web“: otázky s Web = Ano
  python3 tools/export_otazky.py <cesta k otazky.json> --vzorek T001  režim „vzorek“: celá uvedená témata
                                                                      (bez ohledu na Web; ID oddělená čárkou)

V obou režimech jdou na web jen otázky se stavem ověření „Ověřeno“ nebo „Opraveno po ověření“
a se správnou strukturou (4 neprázdné možnosti v CZ i EN, platná správná odpověď, neprázdné texty).
V režimu „web“ navíc jen otázky, které prošly nezávislou revizí (skill kviz-revize): sloupec Revize = OK, Opraveno
nebo Drobná a platný otisk (text se od revize nezměnil). Nezrevidované otázky export přeskočí a vypíše.
Téma se exportuje, jen když má aspoň jednu obtížnost se 3 a více otázkami (méně aplikace nezobrazí).

Výstup:
  data/index.json             kategorie → témata → počty otázek po obtížnostech, datum exportu, "rezim"
  data/topics/<ID>.json       otázky tématu

Před zápisem se složka data/ vyprázdní. Na konci se vypíše hlášení (počty a přeskočené otázky s důvodem).
Neznámá kategorie (chybí v tabulce KATEGORIE níže) = export skončí chybou a nic nezapíše.
"""
import hashlib
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

KOREN = Path(__file__).resolve().parent.parent
DATA = KOREN / "data"
VERZE_DAT = 1

STAVY_OVERENI = {"Ověřeno", "Opraveno po ověření"}
PISMENA = "ABCD"
OBTIZNOSTI = (1, 2, 3)
MIN_OTAZEK_OBTIZNOSTI = 3        # obtížnost s méně otázkami aplikace nezobrazí (SPEC, obrazovka Obtížnost)
VYCHOZI_LIST = "Otázky"          # list Excelu, když téma nemá pole "list" (jen do hlášení)
# Nezávislá revize (Davidův pokyn 6. 11. 2026): na web jen otázky, které revizí prošly.
# Otisk musí počítat stejně jako kviz_db.py (otisk, stav_revize) ve složce Kvizy – při změně uprav oba.
REVIZE_PROJDE = {"OK", "Opraveno", "Drobná"}
POLE_OTISKU = ["otazka_cz", "moznosti_cz", "otazka_en", "moznosti_en", "spravne", "vysvetleni_cz", "vysvetleni_en"]

# Český název kategorie (jak je v otazky.json) → stálé ID, anglický název, ikona.
# Ikona je emoji (rozhodnutí D-003 v docs/DECISIONS.md); ID je stálé a aplikace podle něj může
# kategorii později přiřadit vlastní barvu nebo SVG ikonu. Novou kategorii přidej sem.
KATEGORIE = {
    "Historie":                ("historie",             "History",               "🏛️"),
    "Zeměpis":                 ("zemepis",              "Geography",             "🌍"),
    "Příroda a zvířata":       ("priroda-a-zvirata",    "Nature & Animals",      "🐾"),
    "Umění a literatura":      ("umeni-a-literatura",   "Art & Literature",      "🎨"),
    "Sport":                   ("sport",                "Sport",                 "⚽"),
    "Kuriozity":               ("kuriozity",            "Curiosities",           "🤯"),
    "Věda a technika":         ("veda-a-technika",      "Science & Technology",  "🔬"),
    "Film a TV":               ("film-a-tv",            "Film & TV",             "🎬"),
    "Jídlo a pití":            ("jidlo-a-piti",         "Food & Drink",          "🍽️"),
    "Hudba":                   ("hudba",                "Music",                 "🎵"),
    "Lidské tělo":             ("lidske-telo",          "Human Body",            "🧠"),
    "Mytologie a náboženství": ("mytologie-a-nabozenstvi", "Mythology & Religion", "🔱"),
    "Jazyk a slova":           ("jazyk-a-slova",        "Language & Words",      "🔤"),
    "Česko":                   ("cesko",                "Czechia",               "🏰"),
    "Vesmír":                  ("vesmir",               "Space",                 "🚀"),
    "Ekonomika a peníze":      ("ekonomika-a-penize",   "Economy & Money",       "💰"),
    "Vynálezy":                ("vynalezy",             "Inventions",            "💡"),
    "Móda a životní styl":     ("moda-a-zivotni-styl",  "Fashion & Lifestyle",   "👗"),
    "Obecné":                  ("obecne",               "General Knowledge",     "🧩"),
}


def chyba(msg):
    print(f"CHYBA: {msg}")
    sys.exit(1)


def text(v):
    return v.strip() if isinstance(v, str) else ""


def otisk(q):
    data = json.dumps({k: q.get(k) for k in POLE_OTISKU}, ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(data.encode("utf-8")).hexdigest()[:12]


def stav_revize(q):
    """Platný výsledek revize, nebo "" (nerevidováno, nebo se text otázky od revize změnil)."""
    return q.get("revize", "") if q.get("revize") and q.get("revize_otisk") == otisk(q) else ""


def proc_preskocit(q, revize=True):
    """Důvod, proč otázka nesmí na web (None = je v pořádku). revize=False v režimu vzorek."""
    if revize and stav_revize(q) not in REVIZE_PROJDE:
        return f"revize „{stav_revize(q) or 'nerevidováno'}“ (spusť skill kviz-revize)"
    if q.get("overeni") not in STAVY_OVERENI:
        return f"stav ověření „{q.get('overeni') or 'prázdný'}“"
    if q.get("obtiznost") not in OBTIZNOSTI:
        return f"neplatná obtížnost {q.get('obtiznost')!r}"
    if q.get("spravne") not in list(PISMENA):
        return f"neplatná správná odpověď {q.get('spravne')!r}"
    for jaz in ("cz", "en"):
        m = q.get(f"moznosti_{jaz}")
        if not isinstance(m, list) or len(m) != 4 or any(not text(x) for x in m):
            return f"moznosti_{jaz} nemají 4 neprázdné položky"
        for k in ("otazka", "vysvetleni"):
            if not text(q.get(f"{k}_{jaz}")):
                return f"prázdné pole {k}_{jaz}"
    return None


def otazka_pro_web(q):
    return {
        "id": q["id"],
        "obtiznost": q["obtiznost"],
        "otazka": {"cs": text(q["otazka_cz"]), "en": text(q["otazka_en"])},
        "moznosti": {"cs": [text(x) for x in q["moznosti_cz"]], "en": [text(x) for x in q["moznosti_en"]]},
        "spravne": PISMENA.index(q["spravne"]),      # index 0–3 do pole možností (A = 0 … D = 3)
        "vysvetleni": {"cs": text(q["vysvetleni_cz"]), "en": text(q["vysvetleni_en"])},
    }


def main():
    args = sys.argv[1:]
    vzorek = None
    if "--vzorek" in args:
        i = args.index("--vzorek")
        if i + 1 >= len(args):
            chyba("za --vzorek chybí seznam ID témat (např. --vzorek T001,T002)")
        vzorek = [x.strip().upper() for x in args[i + 1].split(",") if x.strip()]
        del args[i:i + 2]
        if not vzorek:
            chyba("prázdný seznam témat u --vzorek")
    if len(args) != 1:
        print(__doc__)
        sys.exit(2)
    zdroj = Path(args[0])
    if not zdroj.is_file():
        chyba(f"soubor {zdroj} neexistuje")
    db = json.loads(zdroj.read_text(encoding="utf-8"))
    temata = db.get("temata")
    if not isinstance(temata, list):
        chyba("otazky.json nemá seznam 'temata'")

    neznama = sorted({t.get("kategorie") for t in temata} - set(KATEGORIE))
    if neznama:
        chyba(f"neznámé kategorie {neznama} – doplň je do tabulky KATEGORIE v tools/export_otazky.py. Nic nebylo zapsáno.")
    if vzorek:
        chybi = [x for x in vzorek if x not in {t["id"] for t in temata}]
        if chybi:
            chyba(f"témata {chybi} v otazky.json nejsou. Nic nebylo zapsáno.")

    rezim = "vzorek" if vzorek else "web"
    preskocene = []          # (ID, list, důvod)
    vystup = []              # (téma, [otázky pro web])
    for t in temata:
        if vzorek and t["id"] not in vzorek:
            continue
        lst = t.get("list") or VYCHOZI_LIST
        vybrane = []
        for q in t["otazky"]:
            if not vzorek and q.get("web") != "Ano":
                continue
            duvod = proc_preskocit(q, revize=not vzorek)
            if duvod:
                preskocene.append((q.get("id", "?"), lst, duvod))
                continue
            vybrane.append(q)
        if not vybrane:
            continue
        pocty = {u: sum(1 for q in vybrane if q["obtiznost"] == u) for u in OBTIZNOSTI}
        if max(pocty.values()) < MIN_OTAZEK_OBTIZNOSTI:
            for q in vybrane:
                preskocene.append((q["id"], lst, f"téma nemá žádnou obtížnost s {MIN_OTAZEK_OBTIZNOSTI}+ vybranými otázkami"))
            continue
        vystup.append((t, [otazka_pro_web(q) for q in vybrane]))

    if not vystup:
        chyba(f"režim „{rezim}“: žádná otázka k exportu (v Excelu nejsou otázky s Web = Ano, ověřeným stavem a prošlou revizí?). "
              "Složka data/ zůstala beze změny.")

    # index: kategorie v pořadí tabulky KATEGORIE, témata v pořadí databáze
    kat = {}
    for t, otazky in vystup:
        kid, en, ikona = KATEGORIE[t["kategorie"]]
        k = kat.setdefault(kid, {"id": kid, "nazev": {"cs": t["kategorie"], "en": en}, "ikona": ikona, "temata": []})
        k["temata"].append({
            "id": t["id"],
            "nazev": {"cs": text(t["tema_cz"]), "en": text(t["topic_en"])},
            "otazek": {str(u): sum(1 for q in otazky if q["obtiznost"] == u) for u in OBTIZNOSTI},
            "celkem": len(otazky),
            "soubor": f"topics/{t['id']}.json",
        })
    poradi = [v[0] for v in KATEGORIE.values()]
    index = {
        "verze": VERZE_DAT,
        "rezim": rezim,
        "exportovano": datetime.now().astimezone().isoformat(timespec="seconds"),
        "jazyky": ["cs", "en"],
        "pocet_temat": len(vystup),
        "pocet_otazek": sum(len(o) for _, o in vystup),
        "kategorie": sorted(kat.values(), key=lambda k: poradi.index(k["id"])),
    }
    if vzorek:
        index["vzorek_temata"] = vzorek

    # zápis: nejdřív vyprázdnit data/, aby nezůstaly staré soubory
    if DATA.exists():
        shutil.rmtree(DATA)
    (DATA / "topics").mkdir(parents=True)
    for t, otazky in vystup:
        kid, en, ikona = KATEGORIE[t["kategorie"]]
        soubor = {
            "verze": VERZE_DAT,
            "id": t["id"],
            "nazev": {"cs": text(t["tema_cz"]), "en": text(t["topic_en"])},
            "kategorie": {"id": kid, "nazev": {"cs": t["kategorie"], "en": en}},
            "otazky": otazky,
        }
        (DATA / "topics" / f"{t['id']}.json").write_text(json.dumps(soubor, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (DATA / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    # hlášení
    print(f"Export hotový – režim „{rezim}“, {index['exportovano']}")
    print(f"  otázek: {index['pocet_otazek']} · témat: {index['pocet_temat']} · kategorií: {len(kat)} → {DATA.relative_to(KOREN)}/")
    for k in index["kategorie"]:
        for t in k["temata"]:
            o = t["otazek"]
            print(f"  {t['id']} {t['nazev']['cs']} [{k['nazev']['cs']}] – lehké {o['1']}, střední {o['2']}, těžké {o['3']}")
    if preskocene:
        print(f"Přeskočené otázky: {len(preskocene)}")
        for qid, lst, duvod in preskocene:
            print(f"  {qid} (list {lst}): {duvod}")
    else:
        print("Přeskočené otázky: 0")


if __name__ == "__main__":
    main()
