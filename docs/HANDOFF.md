# HANDOFF – Kvízová webová aplikace
datum: 2026-11-05 · předává: prompt 01 (Fáze 3, prostředí A) · přebírá: prompt 02 (Fáze 4 – kontrola, prostředí B), pak prompt 01 (Fáze 5, prostředí A)

## Stav jednou větou
Fáze 3 (chytlavost) je hotová a ověřená automatickým průchodem (106 kontrol); změny jsou v pull requestu do `main`, který musí David sloučit – pak vyzkouší na mobilu a spustí kontrolu (prompt 02) v prostředí B.

## Stav dat
- 2026-11-04 – 35 otázek, 1 téma (T001 Chobotnice a další hlavonožci), režim vzorek
- 2026-11-04 – 120 otázek, 4 témata (T146 České pohádky, T172 Praha – domovní znamení, T204 Československo 1918–1992, T254 Čeští sportovci), režim web (nahrazuje vzorek T001)

## Hotovo
- Fáze 0 (prompt 00, prostředí B): dokumenty, export a test dat, ostrá data, zástupná stránka – podrobnosti v PLAN a DECISIONS D-003 až D-007.
- Fáze 1 (2026-11-04): 3 návrhy značky v `design/`, David vybral **A Oho!** (D-009).
- Fáze 2 (2026-11-05): aplikace (obrazovky 1–9 + Přehled a Historie), pravidla D-013 (5 hvězd po půlkách, každá obtížnost jen jednou, odemčení od 70 %), `tools/pruchod.py`. David: „bez připomínek“.
- Fáze 3 (2026-11-05) – D-014 (finální odznaky), D-015 (vše ostatní):
  - přechody mezi obrazovkami podle směru, postupné naskakování seznamů, animace otázek, ✓/✗, série 🔥;
  - výsledek: hvězdy se zvukem jedna po druhé, zvuk podle výsledku, při 100 % konfety a zlaté paprsky; oslava jen při prvním zobrazení (`assets/js/oslavy.js`, `screens/vysledek.js`);
  - zvuky přepracované (`feedback.js`): kompresor, stoupající tón se sérií, měkčí „vedle“, ukázka po zapnutí v Nastavení;
  - odznaky Rozjetý a Neomylný se udělí hned během kola s upozorněním nahoře; štítek „Nový!“ na obrazovce Odznaky;
  - náhled odkazu: `assets/img/og.png` + značky Open Graph v `index.html`, ikony `apple-touch-icon.png` a `icon-32.png` (vyrábí `tools/og_obrazek.py`);
  - `tools/pruchod.py` rozšířený: zvuky/vibrace jdou vypnout, upozornění na odznak, konfety jen při 100 % a ne po obnovení, „omezit pohyb“, značky náhledu odkazu → **106 kontrol prošlo**, 7 obrazovek × 5 šířek bez přetékání; `test_export.py` prošel;
  - náhledy pro Davida: `docs/nahledy/faze3-*.png`.

## Rozpracováno
- **Pull request do `main`** z větve `claude/happy-cannon-9g2ef0` – web se aktualizuje až po sloučení Davidem.
- **Online ověření:** z cloudu nejde – síť prostředí A nepustí `frankie851.github.io` (ani ogp.me). Ověří David na mobilu; prompt 02 může spustit `python3 tools/pruchod.py --url https://frankie851.github.io/kviz-web/`.
- **Vlastní zařízení:** zvuky a vibrace v Chromiu bez hlavy nejde slyšet/cítit (test jen počítá, že se spustily) – poslech ověří David na telefonu. iPhone vibrace v prohlížeči nemá (je to v pořádku, „potichu nic“).
- **Náhled odkazu** ověří až sdílení nasazené adresy (např. poslat si odkaz ve WhatsAppu/Messengeru). Sítě si náhled pamatují – kdyby ukazovaly starou zástupnou stránku, chce to chvíli počkat.

## Další krok
1. **David:** sloučit pull request (tlačítko „Merge pull request“), za 1–2 minuty otevřít web na mobilu a vyzkoušet (hlavně zvuky, vibrace, konfety při 10/10). Připomínky napsat (do relace nebo pod prompt příště).
2. **Prompt 02 (kontrola)** v prostředí B – až po sloučení pull requestu. Výstup `docs/KONTROLA_RRRR-MM-DD.md`.
3. **Fáze 5** – prompt 01 v Claude Code (Cloud environment): přečíst nejnovější `docs/KONTROLA_*.md`, opravit nálezy, ověřit, nasadit, zaškrtnout kritéria přijetí ve SPEC.
4. Prompt 03 (prostředí B) jen tehdy, když David v Excelu označí další otázky Web = Ano. Po exportu spustit `python3 tools/pruchod.py`.

## Připomínky Davida (k zapracování)
- 2026-11-05 – po vyzkoušení verze z Fáze 2: **bez připomínek**.
- 2026-11-05 (po Fázi 2) – **zapracováno** (D-013).

## Otevřené otázky a rizika
- Skill kviz-generator má vlastní kopii `kviz_db.py` (Příloha A). Dokud David neuloží navržený update, mohla by výměna skriptu ze skillu sloupec Web odstranit.
- David chce na web hlavně otázky, které nebudou na YouTube (D-006) – při dalším výběru na to pamatuj.
- Název „Oho!“: rešerše jen přes webové vyhledávání, ochranné známky neověřené.
- Odznaky Hvězda tématu a Král kategorie vyžadují 100 % ve všech obtížnostech – při pravidle „každá obtížnost jen jednou“ jsou hodně těžké (záměr: vzácné odznaky). Kdyby to Davidovi přišlo moc, jde snížit.

## Nápady na později (nestavět bez zadání)
- „Pokračovat v posledním tématu“ na obrazovce Domů.
- Tečka u tlačítka Odznaky na Domů, dokud si hráč nový odznak neprohlédne.

## Jak navázat
Nejdřív `git fetch origin main` (+ `git merge origin/main`). Pak přečti v tomto pořadí: `CLAUDE.md` → `docs/HANDOFF.md` → `docs/PLAN.md` → `docs/SPEC.md` → `docs/DECISIONS.md` (+ nejnovější `docs/KONTROLA_*.md`, je-li na řadě Fáze 5). Zvolenou značku (D-009) a strukturu dat neměň bez souhlasu Davida.
