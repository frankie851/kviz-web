# HANDOFF – Kvízová webová aplikace
datum: 2026-11-04 · předává: prompt 00 (příprava dat, prostředí B) · přebírá: prompt 01 (Fáze 1, prostředí A – Claude Code v cloudu)

## Stav jednou větou
Fáze 0 je hotová: Excel má sloupec Web, v repozitáři jsou dokumenty, exportní nástroj s testem, ukázková data (téma T001) a zástupná stránka; další je Fáze 1 – návrhy značky.

## Stav dat
- 2026-11-04 – 35 otázek, 1 téma (T001 Chobotnice a další hlavonožci), režim vzorek

## Hotovo
- Repozitář: `CLAUDE.md` (s příkazy a adresou webu), `docs/` (SPEC, PLAN, DECISIONS, HANDOFF), `tools/export_otazky.py`, `tools/test_export.py`, `data/` (vzorek), `index.html` („Připravujeme…“).
- `Kvizy/nastroje/kviz_db.py`: nový sloupec **Web** (poslední sloupec AB na všech listech s otázkami, rozbalovací seznam Ano/Ne, oranžová hlavička jako u ručních voleb). `sync` ho převezme do `otazky.json` (`q["web"]`), list bez sloupce Web hodnotu nemaže; `pridat`, `prestavet`, `stav`, `ohraniceni` hodnoty zachovávají, nové řádky mají Web prázdné (ověřeno na kopii). Záloha skriptu: `nastroje/kviz_db_zaloha_2026-11-04_pred_web.py`.
- `prestavet` proběhl 2026-11-04 21:41 (UTC); záloha Excelu `kviz_otazky_zaloha_20261104_214116.xlsx`. Ověření proti záloze prošlo: všech 12 535 řádků na 7 listech, shodné hodnoty Použít / Shorts / Poznámka i všech ostatních sloupců, list Témata shodný včetně vzorců, list YouTube shodný.
- Export a test vyzkoušené v obou režimech; test odhalí změněnou správnou odpověď, chybějící otázku i prázdnou možnost.
- Rozhodnutí D-003 (ikony = emoji + ID kategorie), D-004 (formát dat), D-005 (vzorek jen T001).

## Rozpracováno
- nic

## Další krok
1. Fáze 1 – prompt 01 v Claude Code (Cloud environment, repozitář kviz-web): 3 varianty značky s ukázkou na otázkách z `data/`.

## Připomínky Davida (k zapracování)
- zatím žádné

## Otevřené otázky a rizika
- `kviz_db.py prestavet` přesouvá list „YouTube“ na konec sešitu (za „Témata“). Dělal to už původní skript, nejde o novinku; obsah listu je stejný.
- Skill kviz-generator má vlastní kopii `kviz_db.py` – David dostal návrh aktualizace skillu; dokud ho neuloží, mohla by výměna skriptu ze skillu sloupec Web odstranit.
- Ukázková data T001 obsahují i 20 otázek, které ve videu nebyly (D-005).

## Nápady na později (nestavět bez zadání)
- (sem agent zapisuje nápady mimo rozsah 1. verze)

## Jak navázat
Nejdřív `git pull`. Pak přečti v tomto pořadí: `CLAUDE.md` → `docs/HANDOFF.md` → `docs/PLAN.md` → `docs/SPEC.md` → `docs/DECISIONS.md`. Zvolenou značku (DECISIONS) a strukturu dat neměň bez souhlasu Davida.
