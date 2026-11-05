# HANDOFF – Kvízová webová aplikace
datum: 2026-11-05 · předává: prompt 01 (Fáze 5 – opravy po kontrole, prostředí A) · přebírá: David (sloučit pull request a vyzkoušet), pak podle jeho rozhodnutí prompt 01 nebo 03

## Stav jednou větou
Všechny nálezy z kontroly jsou opravené (S-1 a D-1 až D-7, DECISIONS D-016) a ověřené (`pruchod.py` 2× za sebou, 113 kontrol); všech 10 kritérií přijetí ve SPEC je zaškrtnutých – **1. verze je hotová, jakmile David sloučí pull request do `main`**.

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
- Fáze 4 (2026-11-05, prompt 02): kontrola – Připraveno po opravách (`docs/KONTROLA_2026-11-05.md`).
- Fáze 5 (2026-11-05) – D-016:
  - **S-1** dlouhé slovo / adresa: zopakováno (320 px → stránka 1024 px), opraveno v CSS; `pruchod.py` to teď hlídá trvale (podstrčená kopie tématu s 80znakovým slovem a adresou v otázce, možnostech i vysvětlení, i v přehledu);
  - **D-1** odstraněn preload písem (příčina náhodného varování) → `pruchod.py` prošel 2× za sebou bez chyby;
  - **D-2** Obtížnost stahuje otázky na pozadí + pilulka „Načítám…“ po 0,3 s čekání (test se zpomaleným serverem);
  - **D-3** vypínače 48 px vysoké · **D-4** písmeno správné odpovědi na tmavší zelené (6,8 : 1) · **D-5** odkaz na téma vede nového hráče po prvním spuštění na téma · **D-6** úklid kláves u zahozené obrazovky (test chybu bez opravy zachytí) · **D-7** mrtvý kód pryč;
  - náhledy pro Davida: `docs/nahledy/faze5-*.png`.

## Rozpracováno
- **Pull request Fáze 5 čeká na sloučení** – web se aktualizuje až potom. Po sloučení ověřit online (WebFetch `…/kviz-web/?v=<hash>` nebo David na mobilu) a v PLAN odškrtnout „Kompletní ověření a nasazení“.
- **Online ověření:** z cloudu nejde – síť prostředí A nepustí `frankie851.github.io` (ani ogp.me). Ověří David na mobilu; prompt 02 může spustit `python3 tools/pruchod.py --url https://frankie851.github.io/kviz-web/`.
- **Vlastní zařízení:** zvuky a vibrace v Chromiu bez hlavy nejde slyšet/cítit (test jen počítá, že se spustily) – poslech ověří David na telefonu. iPhone vibrace v prohlížeči nemá (je to v pořádku, „potichu nic“).
- **Náhled odkazu** ověří až sdílení nasazené adresy (např. poslat si odkaz ve WhatsAppu/Messengeru). Sítě si náhled pamatují – kdyby ukazovaly starou zástupnou stránku, chce to chvíli počkat.

## Další krok
1. **David:** sloučit pull request (tlačítko „Merge pull request“), po 1–2 minutách vyzkoušet web na mobilu.
2. **David rozhodne o bodech „K zvážení“** z kontroly (nic z toho se nestavělo):
   - K1 – víc témat před širším sdílením (dnes 4 témata = 12 kol, ~25 minut hry) → označit v Excelu Web = Ano a spustit **prompt 03** v úkolu propojeném s počítačem;
   - K2 – trvalý zámek pod 70 % je se 4 tématy přísný (odznak Objevitel může být navždy nedosažitelný) – nechat / zmírnit (např. zámek do přidání nového tématu nebo „druhá šance“ po pár dnech);
   - K3 – odznaky Hvězda tématu a Král kategorie (100 % všude bez opakování) – nechat vzácné / zmírnit;
   - K4 – série dní je na Domů dvakrát (pilulka i dlaždice) – nechat / pilulku nahradit „Pokračovat: téma · obtížnost“;
   - K5 – v režimu „Obě řeči najednou“ se shodné texty (jména) nepřekládají – je to záměr, jen pro informaci.
   Úpravy podle K2–K4 udělá **prompt 01** (prostředí A) – rozhodnutí napsat pod prompt.

## Z kontroly 2026-11-05 (prompt 02)
- Data: `otazky.json` ↔ `data/` ↔ Excel 100 % shodné (120 otázek, vlastní skript v příloze KONTROLA).
- Online verze odpovídá `main` (ověřeno přes WebFetch; z kontejneru `github.io` nejde ani v prostředí B).
- `tools/pruchod.py`: 1. běh selhal na varování o preload písem, 2. běh prošel – viz nález D-1.

## Připomínky Davida (k zapracování)
- 2026-11-05 – po kontrole: zadání „podívej se na to podle promptu“ → Fáze 5 (opravy nálezů); ke „K zvážení“ zatím bez rozhodnutí.
- 2026-11-05 – po sloučení a vyzkoušení Fáze 3 na mobilu: **bez připomínek**.
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
