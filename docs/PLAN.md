# PLAN – Kvízová webová aplikace
Agent: po dokončení kroku ho odškrtni (☐ → ☑) a připiš datum. Pořadí fází neměň bez zapsaného důvodu v DECISIONS.md. Na konci každého sezení aktualizuj HANDOFF.md. ⏸ = kontrolní bod, kde se zastavíš a čekáš na Davida.

Prostředí: **A** = Claude Code, Cloud environment (jen repozitář) · **B** = úkol v aplikaci Claude propojený s Davidovým počítačem (Excel, otazky.json) + GitHub. Před spuštěním promptu v B musí být v `main` vše z A (sloučené pull requesty). Každý prompt odškrtává svoje kroky; prompt 01 navíc odškrtne kroky B, jejichž výsledek je v repozitáři doložený.

## Fáze 0 – Příprava dat (prompt 00, prostředí B)
- ☑ (2026-11-04) Připojit a naklonovat repozitář; zkopírovat do něj `CLAUDE.md` (kořen) a `SPEC.md`, `PLAN.md`, `DECISIONS.md`, `HANDOFF.md` (do `docs/`) z `KvizWeb\web-aplikace\`.
- ☑ (2026-11-04) Rozšířit `Kvizy/nastroje/kviz_db.py` o sloupec Web (záloha skriptu předem) a spustit `prestavet`; ověřit proti záloze, že počty řádků, volby Použít / Shorts / Poznámka a list Témata zůstaly beze změny.
- ☑ (2026-11-04) Navrhnout aktualizaci skillu kviz-generator (jeho kopie `kviz_db.py` v Příloze A + zmínka o sloupci Web).
- ☑ (2026-11-04) Exportní nástroj `tools/export_otazky.py` (režimy „web“ a „vzorek“) a test `tools/test_export.py` (s `--zdroj` i bez něj).
- ☑ (2026-11-04) Ukázková data v `data/` (režim „vzorek“) jen z témat, jejichž video už je na YouTube (pravidlo v promptu 00, krok 8).
- ☐ Zástupná stránka `index.html` („Připravujeme…“) a zapnutí GitHub Pages; ověřit, že adresa běží.  ← doplní se níže
- ☑ (2026-11-04) Doplnit příkazy do `CLAUDE.md`, commit + push do `main`.

## Fáze 1 – Značka (prompt 01, prostředí A)
- ☐ 3 varianty značky podle SPEC (název, paleta, písmo, logo SVG, ukázka obrazovek Domů a Otázka s otázkami z `data/`) v `design/index.html`.
- ☐ Krátká rešerše názvů na webu: nekolidují se známou kvízovou aplikací nebo značkou (máš-li webové vyhledávání; jinak to Davidovi napiš jako neověřené).
- ☐ Screenshoty variant na telefonu (390 px) ukázat Davidovi + odkaz na `…/kviz-web/design/`.

**⏸ Kontrolní bod:** David vybere variantu – odpoví v téže relaci (zapsat do DECISIONS.md, commit). Pak v Excelu označí Web = Ano aspoň u 3–5 témat a v prostředí B spustí prompt 03 (ostrá data). → HANDOFF, konec sezení.

## Mezikrok – Ostrá data (prompt 03, prostředí B)
- ☐ `data/` obsahuje Davidův výběr (`"rezim": "web"`), test s `--zdroj` prošel. (Odškrtne prompt 03; kdyby to nestihl, odškrtne ho prompt 01 podle `"rezim": "web"`.)

## Fáze 2 – Základ aplikace (prompt 01, prostředí A)
- ☐ Ověřit ostrá data (`"rezim": "web"`, aspoň 3 témata s obtížností o 3+ otázkách); jinak ⏸ a požádat o prompt 03.
- ☐ Design systém zvolené značky v CSS (barvy, písmo, tlačítka, karty, rozestupy); písmo uložené v repozitáři.
- ☐ Obrazovky 1–9 podle SPEC, navigace přes hash, texty rozhraní CZ/EN.
- ☐ Logika kola, hvězd, odemykání, série, série dní; ukládání pokroku a nastavení.
- ☐ Jazyková nastavení (3 režimy překladu) včetně vysvětlení.
- ☐ Automatický průchod hrou a screenshoty 5 šířek jako opakovatelný nástroj `tools/pruchod.py` (Playwright); příkaz doplnit do `CLAUDE.md` (spoléhá na něj i prompt 03 a kontrola). Opravit nálezy.
- ☐ Nasadit (push do `main`, případně pull request ke sloučení) a ověřit online.

**⏸ Kontrolní bod:** David vyzkouší aplikaci na svém mobilu a připomínky napíše v téže relaci (nebo pod prompt v příští relaci); zapsat je do HANDOFF a zapracovat na začátku Fáze 3. → HANDOFF, konec sezení.

## Fáze 3 – Chytlavost (prompt 01, prostředí A)
- ☐ Připomínky Davida z Fáze 2.
- ☐ Mikroanimace a přechody, animace hvězd, konfety při ★★★.
- ☐ Zvuky (generované ve Web Audio, vypínatelné) a vibrace (kde je prohlížeč podporuje; jinde potichu nic).
- ☐ Odznaky (finální seznam do DECISIONS.md), obrazovka Odznaky, upozornění na nový odznak.
- ☐ Favicon, titulek stránky, náhled pro sdílení odkazu (Open Graph obrázek v barvách značky).
- ☐ Kompletní ověření (prompt 01, část „Ověření“) a nasazení.

**⏸ Kontrolní bod:** napiš Davidovi, ať v prostředí B spustí prompt 02 (kontrola). → HANDOFF, konec sezení.

## Fáze 4 – Kontrola (prompt 02, prostředí B)
- ☐ `docs/KONTROLA_RRRR-MM-DD.md` s verdiktem a nálezy (zapisuje a odškrtává kontrolor; kdyby to nestihl, odškrtne prompt 01 podle existence zprávy).

## Fáze 5 – Opravy a dokončení (prompt 01, prostředí A)
- ☐ Přečíst nejnovější `docs/KONTROLA_*.md`; každý zásadní a střední nález nejdřív zopakovat, pak opravit; drobné podle uvážení, neopravené zapsat do HANDOFF.
- ☐ Kompletní ověření a nasazení.
- ☐ Závěrečná zpráva Davidovi + zaškrtnout kritéria přijetí ve SPEC.

## Stav
Poslední aktualizace: 2026-11-04 · Aktuální fáze: 1 (Fáze 0 hotová) · Blokováno: nic
