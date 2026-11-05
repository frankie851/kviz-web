# HANDOFF – Kvízová webová aplikace
datum: 2026-11-05 · předává: prompt 01 (Fáze 2, prostředí A) · přebírá: prompt 01 (Fáze 3, prostředí A – Claude Code v cloudu)

## Stav jednou větou
Fáze 2 je hotová a první Davidovy připomínky jsou zapracované (nová pravidla D-013: 5 hvězd po půlkách, každá obtížnost jen jednou, přehled odpovědí a Historie, odemčení od 70 %, bez Smazat pokrok); David novou verzi vyzkoušel „bez připomínek“ – kontrolní bod je uzavřený, další je Fáze 3.

## Stav dat
- 2026-11-04 – 35 otázek, 1 téma (T001 Chobotnice a další hlavonožci), režim vzorek
- 2026-11-04 – 120 otázek, 4 témata (T146 České pohádky, T172 Praha – domovní znamení, T204 Československo 1918–1992, T254 Čeští sportovci), režim web (nahrazuje vzorek T001)

## Hotovo
- Fáze 0 (prompt 00, prostředí B): dokumenty, export a test dat, ostrá data, zástupná stránka – podrobnosti v PLAN a DECISIONS D-003 až D-007.
- Fáze 1 (2026-11-04): 3 návrhy značky v `design/`, David vybral **A Oho!** (D-009).
- Fáze 2 (2026-11-05):
  - Aplikace: `index.html`, `assets/css/app.css`, `assets/js/` (moduly, mapa v `CLAUDE.md`), texty `assets/i18n/cs.json` + `en.json` (129 klíčů, oba stejné), písma a logo v `assets/`. Technické volby D-010, odznaky D-011, co je už z Fáze 3 hotové D-012.
  - `tools/pruchod.py` – 65 kontrol prošlo (celá cesta, obnovení stránky, klávesnice, 3 režimy překladu, jazyk otázek, CZ ↔ EN, smazání pokroku, konzole bez chyb, žádné cizí požadavky); screenshoty 5 obrazovek × 5 šířek bez přetékání. `python3 tools/test_export.py` prošel.
  - Náhledy pro Davida: `docs/nahledy/faze2-*.png`.
  - Připomínky Davida (2026-11-05) zapracované – D-013: nové `screens/prehled.js` a `screens/historie.js`, pravidla v `game.js`, pokrok verze 2 v `progress.js` (výsledky s odpověďmi, rozehraná kola). `tools/pruchod.py` přepsaný na nová pravidla: 82 kontrol prošlo, 7 obrazovek × 5 šířek bez přetékání.

## Rozpracováno
- **Online ověření:** z cloudu nejde – síť prostředí A nepustí `frankie851.github.io` (curl 403, WebFetch „ENOTFOUND“). Ověří David na mobilu. Pokud by to šlo povolit: síťové nastavení cloudového prostředí → přidat doménu `frankie851.github.io`; pak `python3 tools/pruchod.py --url https://frankie851.github.io/kviz-web/` projde i nasazený web.
- **Vlastní zařízení:** zvuky a vibrace se v Chromiu bez hlavy nedají slyšet/cítit – ověří David na telefonu (iPhone vibrace v prohlížeči nemá vůbec; to je v pořádku, „potichu nic“).

## Další krok
1. Fáze 3 – prompt 01 v Claude Code (Cloud environment). Připomínky z Fáze 2 jsou hotové (D-013). Zbývá: konfety při 5 ★ (100 %), přechody mezi obrazovkami, animace hvězd (teď 5 a půlky), vyladění zvuků, upozornění na nový odznak během hry, Open Graph obrázek a náhled odkazu; finální seznam odznaků (D-011 + změny D-013) zapsat do DECISIONS. Pozor: SPEC mluví o „konfetách při ★★★“ – podle D-013 to znamená 100 % (5 ★). Favicon (logo) už je.
2. Při ověření spouštět `python3 tools/pruchod.py` (82 kontrol) – při změnách pravidel ho upravit.
3. Prompt 03 (prostředí B) jen tehdy, když David v Excelu označí další otázky Web = Ano. Po exportu má prompt 03 spustit `python3 tools/pruchod.py`.

## Připomínky Davida (k zapracování)
- 2026-11-05 – po vyzkoušení nové verze: **bez připomínek**.
- 2026-11-05 (po Fázi 2) – **zapracováno** (D-013): 5 hvězd místo 3, ½ ★ za každých 10 %; obtížnost nejde opakovat, ale jde procházet historii odpovědí; Smazat pokrok zrušit; odemykat od 70 %; v „O hře“ vynechat text o ověření faktů a o reklamách. Na dotaz zvolil: pod 70 % zůstane další obtížnost zamčená natrvalo.

## Otevřené otázky a rizika
- Skill kviz-generator má vlastní kopii `kviz_db.py` (Příloha A). Dokud David neuloží navržený update, mohla by výměna skriptu ze skillu sloupec Web odstranit.
- David chce na web hlavně otázky, které nebudou na YouTube (D-006) – při dalším výběru na to pamatuj.
- Název „Oho!“: rešerše jen přes webové vyhledávání, ochranné známky neověřené.
- Pro hezký tvar loga „Oho!“ v Baloo 2: ve wordmarku je „!“ v barvě Malina.

## Nápady na později (nestavět bez zadání)
- „Pokračovat v posledním tématu“ na obrazovce Domů.

## Jak navázat
Nejdřív `git fetch origin main` (+ `git merge origin/main`). Pak přečti v tomto pořadí: `CLAUDE.md` → `docs/HANDOFF.md` → `docs/PLAN.md` → `docs/SPEC.md` → `docs/DECISIONS.md`. Zvolenou značku (D-009) a strukturu dat neměň bez souhlasu Davida.
