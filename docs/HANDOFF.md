# HANDOFF – Kvízová webová aplikace
datum: 2026-11-04 · předává: prompt 01 (Fáze 1, prostředí A) · přebírá: prompt 01 (Fáze 2, prostředí A – Claude Code v cloudu)

## Stav jednou větou
Fáze 1 je hotová: David vybral značku **A „Oho!“** (D-009); další je Fáze 2 – stavba aplikace v této značce na ostrých datech, která už v `data/` jsou.

## Stav dat
- 2026-11-04 – 35 otázek, 1 téma (T001 Chobotnice a další hlavonožci), režim vzorek
- 2026-11-04 – 120 otázek, 4 témata (T146 České pohádky, T172 Praha – domovní znamení, T204 Československo 1918–1992, T254 Čeští sportovci), režim web (nahrazuje vzorek T001) – pro Fázi 2 stačí (všechna 4 témata mají 10/10/10 otázek)

## Hotovo
- Fáze 0 (prompt 00, prostředí B): dokumenty, export a test dat, ostrá data, zástupná stránka – podrobnosti v PLAN a DECISIONS D-003 až D-007.
- Fáze 1 (2026-11-04): `design/index.html` se 3 variantami (A Oho!, B Kvark, C Hop), loga `design/logo-*.svg`, písma OFL v `design/fonts/` (Baloo 2, Nunito, Unbounded, Inter, Rubik – z npm `@fontsource-variable/*`, u každého `OFL-*.txt`). Screenshoty v `docs/nahledy/faze1-*.png`. Rešerše názvů a ověření písem a kontrastu v D-008. Volba David: **A Oho!** (D-009).
- Náhledová stránka nemá konzolové chyby ani požadavky mimo vlastní adresu a nepřetéká na 320 / 390 / 1280 px (ověřeno Playwrightem přes Node – `require('playwright')` v prostředí A funguje, Chromium je předinstalované; pythonový balíček playwright ale nainstalovaný není).

## Rozpracováno
- **GitHub Pages:** zda už běží, se z prostředí A ověřit nedá – cloudová síť nepustí `frankie851.github.io` (WebFetch i curl odmítnuty). Pokud David Pages ještě nezapnul: github.com → repozitář kviz-web → Settings → Pages → Build and deployment → Source „Deploy from a branch“ → Branch „main“ a „/ (root)“ → Save. Ověření online ve Fázi 2 bude potřeba udělat přes Davida (nebo povolit doménu `frankie851.github.io` v síťovém nastavení cloudového prostředí).

## Další krok
1. Fáze 2 – prompt 01 v Claude Code (Cloud environment, repozitář kviz-web): design systém značky Oho! v CSS (hodnoty z `design/index.html`, třída `.v-a`), písma Baloo 2 + Nunito přesunout do `assets/fonts/`, obrazovky 1–9, logika, `tools/pruchod.py`.
   - Pro `tools/pruchod.py` (Python) bude potřeba `pip install playwright`; Chromium je v `/opt/pw-browsers` – při rozdílné verzi spouštět s `executable_path='/opt/pw-browsers/chromium...'` (najít skutečnou cestu), `playwright install` nespouštět, pokud to jde bez něj.
2. Prompt 03 (prostředí B) jen tehdy, když David v Excelu označí další otázky Web = Ano.

## Připomínky Davida (k zapracování)
- zatím žádné

## Otevřené otázky a rizika
- Skill kviz-generator má vlastní kopii `kviz_db.py` (Příloha A). Dokud David neuloží navržený update, mohla by výměna skriptu ze skillu sloupec Web odstranit.
- David chce na web hlavně otázky, které nebudou na YouTube (D-006) – při dalším výběru na to pamatuj.
- Název „Oho!“: rešerše jen přes webové vyhledávání, ochranné známky neověřené.
- Pro hezký tvar loga „Oho!“ v Baloo 2: ve wordmarku je „!“ v barvě Malina.

## Nápady na později (nestavět bez zadání)
- (zatím nic)

## Jak navázat
Nejdřív `git fetch origin main` (+ `git merge origin/main`). Pak přečti v tomto pořadí: `CLAUDE.md` → `docs/HANDOFF.md` → `docs/PLAN.md` → `docs/SPEC.md` → `docs/DECISIONS.md`. Zvolenou značku (D-009) a strukturu dat neměň bez souhlasu Davida.
