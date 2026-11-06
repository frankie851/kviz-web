#!/usr/bin/env python3
"""Test dat webové aplikace (data/).

  python3 tools/test_export.py
      Kontrola struktury (prostředí A – Claude Code v cloudu, bez přístupu ke zdroji):
      každá otázka má 4 možnosti a texty v obou jazycích, správná možnost je platná,
      počty v index.json souhlasí se soubory témat, žádné prázdné pole, žádné soubory navíc.

  python3 tools/test_export.py --zdroj <cesta k otazky.json> [--vzorek T001,T002]
      Navíc porovnání se zdrojem (prostředí B): množina ID v data/ přesně odpovídá výběru
      ze zdroje a u každé otázky sedí otázka, všechny možnosti, správná možnost, obtížnost
      a vysvětlení v CZ i EN. Bez --vzorek se výběr řídí indexem: režim „web“ = Web = Ano,
      režim „vzorek“ = témata z "vzorek_temata".

Návratový kód 0 = vše v pořádku, 1 = něco nesedí (vypíše co).
Výběr ze zdroje je tu napsaný znovu a nezávisle na export_otazky.py, aby test chybu exportu skutečně odhalil.
"""
import json
import sys
from pathlib import Path

KOREN = Path(__file__).resolve().parent.parent
DATA = KOREN / "data"
JAZYKY = ("cs", "en")
OBTIZNOSTI = ("1", "2", "3")

chyby = []


def chyba(msg):
    chyby.append(msg)


def prazdna_pole(obj, cesta=""):
    """Vrátí cesty k prázdným hodnotám (prázdný text, None, prázdný seznam/objekt) kdekoli v obj."""
    out = []
    if obj is None or (isinstance(obj, str) and not obj.strip()) or (isinstance(obj, (list, dict)) and not obj):
        return [cesta or "(kořen)"]
    if isinstance(obj, dict):
        for k, v in obj.items():
            out += prazdna_pole(v, f"{cesta}.{k}" if cesta else k)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            out += prazdna_pole(v, f"{cesta}[{i}]")
    return out


def nacti(p):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        chyba(f"{p.relative_to(KOREN)}: nejde načíst JSON ({e})")
        return None


def test_struktury():
    """Vrátí (index, {ID tématu: data tématu})."""
    index = nacti(DATA / "index.json") if (DATA / "index.json").is_file() else None
    if index is None:
        chyba("data/index.json chybí nebo je neplatný")
        return None, {}
    for p in prazdna_pole(index):
        chyba(f"index.json: prázdné pole {p}")
    if index.get("rezim") not in ("web", "vzorek"):
        chyba(f"index.json: neplatný rezim {index.get('rezim')!r}")
    if index.get("rezim") == "vzorek" and not index.get("vzorek_temata"):
        chyba("index.json: režim vzorek bez seznamu vzorek_temata")
    if not index.get("exportovano"):
        chyba("index.json: chybí datum a čas exportu")
    if list(index.get("jazyky", [])) != list(JAZYKY):
        chyba(f"index.json: jazyky {index.get('jazyky')} (čekám {list(JAZYKY)})")

    temata, vsechna_id, kat_id = {}, set(), set()
    soubory_v_indexu = set()
    for k in index.get("kategorie", []):
        if k.get("id") in kat_id:
            chyba(f"kategorie {k.get('id')} je v indexu dvakrát")
        kat_id.add(k.get("id"))
        if not all(text_ok(k.get("nazev", {}).get(j)) for j in JAZYKY):
            chyba(f"kategorie {k.get('id')}: chybí název v některém jazyce")
        if not text_ok(k.get("ikona")):
            chyba(f"kategorie {k.get('id')}: chybí ikona")
        if not k.get("temata"):
            chyba(f"kategorie {k.get('id')}: nemá žádné téma")
        for ti in k.get("temata", []):
            tid = ti.get("id")
            if tid in temata:
                chyba(f"téma {tid} je v indexu dvakrát")
            soubor = DATA / ti.get("soubor", "")
            soubory_v_indexu.add(soubor.resolve())
            if ti.get("soubor") != f"topics/{tid}.json" or not soubor.is_file():
                chyba(f"téma {tid}: soubor {ti.get('soubor')} chybí nebo má špatný název")
                continue
            t = nacti(soubor)
            if t is None:
                continue
            temata[tid] = t
            for p in prazdna_pole(t):
                chyba(f"{tid}.json: prázdné pole {p}")
            if t.get("id") != tid:
                chyba(f"{tid}.json: id {t.get('id')!r} nesouhlasí s indexem")
            if t.get("nazev") != ti.get("nazev"):
                chyba(f"{tid}: název tématu v indexu a v souboru se liší")
            if (t.get("kategorie") or {}).get("id") != k.get("id") or (t.get("kategorie") or {}).get("nazev") != k.get("nazev"):
                chyba(f"{tid}: kategorie v souboru nesouhlasí s indexem")
            pocty = {u: 0 for u in OBTIZNOSTI}
            for q in t.get("otazky", []):
                qid = q.get("id", "?")
                if qid in vsechna_id:
                    chyba(f"otázka {qid} je v datech dvakrát")
                vsechna_id.add(qid)
                if not str(qid).startswith(f"{tid}-"):
                    chyba(f"otázka {qid} nepatří k tématu {tid}")
                if str(q.get("obtiznost")) not in OBTIZNOSTI:
                    chyba(f"{qid}: neplatná obtížnost {q.get('obtiznost')!r}")
                else:
                    pocty[str(q["obtiznost"])] += 1
                for j in JAZYKY:
                    if not text_ok((q.get("otazka") or {}).get(j)):
                        chyba(f"{qid}: chybí text otázky ({j})")
                    if not text_ok((q.get("vysvetleni") or {}).get(j)):
                        chyba(f"{qid}: chybí vysvětlení ({j})")
                    m = (q.get("moznosti") or {}).get(j)
                    if not isinstance(m, list) or len(m) != 4 or not all(text_ok(x) for x in m):
                        chyba(f"{qid}: možnosti ({j}) nejsou 4 neprázdné texty")
                    elif len({x.strip().lower() for x in m}) != 4:
                        chyba(f"{qid}: možnosti ({j}) obsahují duplicitu")
                if not (isinstance(q.get("spravne"), int) and not isinstance(q.get("spravne"), bool) and 0 <= q["spravne"] <= 3):
                    chyba(f"{qid}: neplatná správná možnost {q.get('spravne')!r} (čekám 0–3)")
            if {u: ti.get("otazek", {}).get(u) for u in OBTIZNOSTI} != pocty:
                chyba(f"{tid}: počty v indexu {ti.get('otazek')} nesouhlasí se souborem {pocty}")
            if ti.get("celkem") != len(t.get("otazky", [])):
                chyba(f"{tid}: celkem v indexu {ti.get('celkem')} ≠ {len(t.get('otazky', []))} otázek v souboru")
            if max(pocty.values()) < 3:
                chyba(f"{tid}: žádná obtížnost nemá aspoň 3 otázky – téma by se na webu neukázalo")
    if index.get("pocet_temat") != len(temata):
        chyba(f"index.json: pocet_temat {index.get('pocet_temat')} ≠ {len(temata)}")
    if index.get("pocet_otazek") != len(vsechna_id):
        chyba(f"index.json: pocet_otazek {index.get('pocet_otazek')} ≠ {len(vsechna_id)}")
    navic = sorted(p.name for p in (DATA / "topics").glob("*") if p.resolve() not in soubory_v_indexu) if (DATA / "topics").is_dir() else []
    navic += sorted(p.name for p in DATA.iterdir() if p.name not in ("index.json", "topics"))
    if navic:
        chyba(f"v data/ jsou soubory, které index nezná: {navic}")
    return index, temata


def text_ok(v):
    return isinstance(v, str) and bool(v.strip())


def otazka_ok(q):
    """Nezávislá kopie pravidla „smí na web“: ověřená a se správnou strukturou."""
    if q.get("overeni") not in ("Ověřeno", "Opraveno po ověření"):
        return False
    if q.get("obtiznost") not in (1, 2, 3) or q.get("spravne") not in ("A", "B", "C", "D"):
        return False
    for j in ("cz", "en"):
        m = q.get(f"moznosti_{j}")
        if not (isinstance(m, list) and len(m) == 4 and all(text_ok(x) for x in m)):
            return False
        if not (text_ok(q.get(f"otazka_{j}")) and text_ok(q.get(f"vysvetleni_{j}"))):
            return False
    return True


def revize_ok(q):
    """Stejná podmínka jako export: nezávislá revize OK / Opraveno / Drobná a text se od revize nezměnil."""
    import hashlib
    pole = ["otazka_cz", "moznosti_cz", "otazka_en", "moznosti_en", "spravne", "vysvetleni_cz", "vysvetleni_en"]
    o = hashlib.sha1(json.dumps({k: q.get(k) for k in pole}, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:12]
    return q.get("revize") in ("OK", "Opraveno", "Drobná") and q.get("revize_otisk") == o


def test_zdroje(index, temata, zdroj, vzorek):
    db = json.loads(Path(zdroj).read_text(encoding="utf-8"))
    rezim = index.get("rezim")
    if vzorek is None and rezim == "vzorek":
        vzorek = index.get("vzorek_temata") or []
    if vzorek is not None:
        if rezim != "vzorek":
            chyba(f"čekám režim vzorek, index má {rezim!r}")
        if sorted(index.get("vzorek_temata") or []) != sorted(vzorek):
            chyba(f"vzorek_temata v indexu {index.get('vzorek_temata')} ≠ {vzorek}")
    elif rezim != "web":
        chyba(f"čekám režim web, index má {rezim!r}")

    ocekavane = {}          # ID otázky → (téma, otázka)
    for t in db["temata"]:
        if vzorek is not None and t["id"] not in vzorek:
            continue
        qs = [q for q in t["otazky"] if (vzorek is not None or (q.get("web") == "Ano" and revize_ok(q))) and otazka_ok(q)]
        if not any(sum(1 for q in qs if q["obtiznost"] == u) >= 3 for u in (1, 2, 3)):
            continue
        for q in qs:
            ocekavane[q["id"]] = (t, q)
    v_datech = {q["id"]: (t, q) for t in temata.values() for q in t.get("otazky", [])}
    chybi, navic = sorted(set(ocekavane) - set(v_datech)), sorted(set(v_datech) - set(ocekavane))
    if chybi:
        chyba(f"v data/ chybí {len(chybi)} otázek ze zdroje: {chybi[:10]}")
    if navic:
        chyba(f"v data/ je {len(navic)} otázek navíc oproti výběru: {navic[:10]}")
    for qid in sorted(set(ocekavane) & set(v_datech)):
        ts, qs = ocekavane[qid]
        tw, qw = v_datech[qid]
        if tw["id"] != ts["id"]:
            chyba(f"{qid}: je v tématu {tw['id']}, ve zdroji {ts['id']}")
        if tw["nazev"] != {"cs": ts["tema_cz"].strip(), "en": ts["topic_en"].strip()}:
            chyba(f"{qid}: název tématu nesouhlasí se zdrojem")
        if tw["kategorie"]["nazev"]["cs"] != ts["kategorie"]:
            chyba(f"{qid}: kategorie nesouhlasí se zdrojem")
        if qw["obtiznost"] != qs["obtiznost"]:
            chyba(f"{qid}: obtížnost {qw['obtiznost']} ≠ zdroj {qs['obtiznost']}")
        if qw["spravne"] != "ABCD".index(qs["spravne"]):
            chyba(f"{qid}: správná možnost {qw['spravne']} ≠ zdroj {qs['spravne']}")
        for jw, jz in (("cs", "cz"), ("en", "en")):
            if qw["otazka"][jw] != qs[f"otazka_{jz}"].strip():
                chyba(f"{qid}: text otázky ({jw}) nesouhlasí se zdrojem")
            if qw["moznosti"][jw] != [x.strip() for x in qs[f"moznosti_{jz}"]]:
                chyba(f"{qid}: možnosti ({jw}) nesouhlasí se zdrojem")
            if qw["vysvetleni"][jw] != qs[f"vysvetleni_{jz}"].strip():
                chyba(f"{qid}: vysvětlení ({jw}) nesouhlasí se zdrojem")
            # kontrola i přes text správné odpovědi (chrání před posunem pořadí možností)
            if qw["moznosti"][jw][qw["spravne"]] != qs[f"moznosti_{jz}"]["ABCD".index(qs["spravne"])].strip():
                chyba(f"{qid}: text správné odpovědi ({jw}) nesouhlasí se zdrojem")
    return len(ocekavane)


def main():
    args = sys.argv[1:]
    zdroj = vzorek = None
    if "--zdroj" in args:
        i = args.index("--zdroj")
        zdroj = args[i + 1] if i + 1 < len(args) else None
        del args[i:i + 2]
        if not zdroj or not Path(zdroj).is_file():
            print(f"CHYBA: zdroj {zdroj} neexistuje")
            sys.exit(1)
    if "--vzorek" in args:
        i = args.index("--vzorek")
        vzorek = [x.strip().upper() for x in (args[i + 1] if i + 1 < len(args) else "").split(",") if x.strip()]
        del args[i:i + 2]
    if args:
        print(__doc__)
        sys.exit(2)

    index, temata = test_struktury()
    n_otazek = sum(len(t.get("otazky", [])) for t in temata.values())
    print(f"Struktura: {len(temata)} témat, {n_otazek} otázek, režim {index.get('rezim') if index else '?'}")
    if vzorek is not None and index and not zdroj:
        if sorted(temata) != sorted(vzorek):
            chyba(f"témata v data/ {sorted(temata)} ≠ --vzorek {sorted(vzorek)}")
    if zdroj and index:
        n = test_zdroje(index, temata, zdroj, vzorek)
        print(f"Porovnání se zdrojem: čekáno {n} otázek")
    if chyby:
        print(f"TEST NEPROŠEL – {len(chyby)} chyb:")
        for c in chyby[:200]:
            print("  ✗", c)
        sys.exit(1)
    print("TEST PROŠEL" + (" (struktura + porovnání se zdrojem)" if zdroj else " (struktura)"))


if __name__ == "__main__":
    main()
