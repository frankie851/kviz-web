# HANDOFF – Kvízová webová aplikace
datum: 2026-11-04 · předává: prompt 00 (příprava dat, prostředí B) · přebírá: prompt 01 (Fáze 1, prostředí A – Claude Code v cloudu)

## Stav jednou větou
Fáze 0 je hotová: Excel má sloupec Web (hned za Shorts), v repozitáři jsou dokumenty, exportní nástroj s testem, data 4 českých témat v režimu „web“ a zástupná stránka; další je Fáze 1 – návrhy značky.

## Stav dat
- 2026-11-04 – 35 otázek, 1 téma (T001 Chobotnice a další hlavonožci), režim vzorek
- 2026-11-04 – 120 otázek, 4 témata (T146 České pohádky, T172 Praha – domovní znamení, T204 Československo 1918–1992, T254 Čeští sportovci), režim web (nahrazuje vzorek T001)

## Hotovo
- Repozitář: `CLAUDE.md` (s příkazy a adresou webu), `docs/` (SPEC, PLAN, DECISIONS, HANDOFF), `tools/export_otazky.py`, `tools/test_export.py`, `data/` (vzorek), `index.html` („Připravujeme…“).
- `Kvizy/nastroje/kviz_db.py`: nový sloupec **Web** (na Davidův pokyn sloupec D hned za Shorts na všech listech s otázkami, rozbalovací seznam Ano/Ne, oranžová hlavička jako u ručních voleb, ukotvení E2) a příkaz `web Ano T146 …` (D-007). `sync` ho převezme do `otazky.json` (`q["web"]`), list bez sloupce Web hodnotu nemaže; `pridat`, `prestavet`, `stav`, `ohraniceni` hodnoty zachovávají, nové řádky mají Web prázdné (ověřeno na kopii). Zálohy skriptu: `nastroje/kviz_db_zaloha_2026-11-04_pred_web.py` (před sloupcem Web) a `…_pred_web_za_shorts.py` (Web ještě na konci).
- Přesun Web za Shorts: `prestavet` 2026-11-04 22:43 UTC (záloha `kviz_otazky_zaloha_20261104_224349.xlsx`), ověření proti záloze prošlo; pak `web Ano T146 T172 T204 T254` (záloha `…_224442_pred_web.xlsx`) – proti záloze se liší jen těch 120 buněk Web.
- První `prestavet` proběhl 2026-11-04 21:41 (UTC); záloha Excelu `kviz_otazky_zaloha_20261104_214116.xlsx`. Ověření proti záloze prošlo: všech 12 535 řádků na 7 listech, shodné hodnoty Použít / Shorts / Poznámka i všech ostatních sloupců, list Témata shodný včetně vzorců, list YouTube shodný.
- Export a test vyzkoušené v obou režimech; test odhalí změněnou správnou odpověď, chybějící otázku i prázdnou možnost.
- Rozhodnutí D-003 (ikony = emoji + ID kategorie), D-004 (formát dat), D-005 (vzorek T001, nahrazeno), D-006 (4 česká témata, režim web), D-007 (Web za Shorts, příkaz `web`).

## Rozpracováno
- **GitHub Pages zatím nejsou zapnuté.** Agent v prostředí B je zapnout nemohl (rozhraní GitHubu pro nastavení Pages je pro něj zablokované a ve vestavěném prohlížeči není David na GitHubu přihlášený). Zapne je David ručně: github.com → repozitář kviz-web → Settings → Pages → Build and deployment → Source „Deploy from a branch“ → Branch „main“ a „/ (root)“ → Save. Za 1–2 minuty má běžet https://frankie851.github.io/kviz-web/ se stránkou „Připravujeme…“. Prompt 01 na začátku ověří, že adresa odpovídá (jinak Davida upozorní).

## Další krok
0. David zapne GitHub Pages (viz Rozpracováno).
1. Fáze 1 – prompt 01 v Claude Code (Cloud environment, repozitář kviz-web): 3 varianty značky s ukázkou na otázkách z `data/`.

## Připomínky Davida (k zapracování)
- zatím žádné

## Otevřené otázky a rizika
- Skill kviz-generator má vlastní kopii `kviz_db.py` (Příloha A, byla starší než skript ve složce). David dostal návrh aktualizace skillu (Příloha A = aktuální skript se sloupcem Web za Shorts a příkazem `web`; kopie návrhu i v `KvizWeb\web-aplikace\navrh_kviz-generator_SKILL.md`). Dokud ho neuloží, mohla by výměna skriptu ze skillu sloupec Web odstranit.
- David chce na web hlavně otázky, které nebudou na YouTube (D-006) – při dalším výběru na to pamatuj.

## Nápady na později (nestavět bez zadání)
- (sem agent zapisuje nápady mimo rozsah 1. verze)

## Jak navázat
Nejdřív `git pull`. Pak přečti v tomto pořadí: `CLAUDE.md` → `docs/HANDOFF.md` → `docs/PLAN.md` → `docs/SPEC.md` → `docs/DECISIONS.md`. Zvolenou značku (DECISIONS) a strukturu dat neměň bez souhlasu Davida.
