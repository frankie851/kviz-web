# Kvízová webová aplikace – pravidla pro Clauda
Veřejná dvojjazyčná (CZ/EN) kvízová aplikace z Davidových ověřených otázek. Statický web na GitHub Pages, bez serveru. Co a proč: `docs/SPEC.md` · postup: `docs/PLAN.md` · kde se skončilo: `docs/HANDOFF.md` · rozhodnutí: `docs/DECISIONS.md`.

Web: https://frankie851.github.io/kviz-web/

David není programátor: piš mu česky, bez žargonu, a výsledky ukazuj (screenshoty, odkaz), nepopisuj kód.

## Dvě prostředí
- **A – Claude Code, Cloud environment:** vidí jen tento repozitář. Staví aplikaci (prompt 01).
- **B – úkol v aplikaci Claude propojený s Davidovým počítačem:** vidí Excel a `otazky.json` ve složce Kvizy. Připravuje a aktualizuje data (prompty 00 a 03) a dělá nezávislou kontrolu (prompt 02). Repozitář, export, testy a Playwright běží v jeho kontejneru; Excel a `kviz_db.py` na počítači přes `device_bash`.
- Předávají si práci přes větev `main` tohoto repozitáře. Na začátku sezení vždy stáhni nejnovější `main` (`git fetch origin main` + případně `git merge origin/main`).

## Struktura
- `index.html`, `assets/css/`, `assets/js/` (ES moduly), `assets/fonts/`, `assets/img/` – aplikace
  - `assets/js/app.js` start a navigace · `screens/*.js` jedna obrazovka = jeden soubor (Domů s kategoriemi, Statistiky…) · `game.js` pravidla (hvězdy, odemykání) · `progress.js` pokrok · `badges.js` odznaky (jednotlivé + stupňové řady, D-026) · `settings.js` nastavení · `storage.js` jediný přístup k localStorage · `i18n.js` texty · `data.js` načítání otázek · `feedback.js` zvuk a vibrace · `oslavy.js` konfety a upozornění na nový odznak · `sada.js` sada otázek mimo kolo (procvičování, výzva) · `vyzva.js` výběr denní výzvy · `sdileni.js` sdílení · `predcitani.js` předčítání nahlas · `sbirka.js` tlačítko Do sbírky · `pruvodce.js` průvodce pravidly · `ui.js` stavební kameny
- `assets/i18n/cs.json`, `assets/i18n/en.json` – všechny texty rozhraní
- `data/index.json`, `data/topics/<ID tématu>.json` – otázky; generuje je `tools/export_otazky.py` v prostředí B. **Ručně je needituj.** `"rezim"` v indexu říká, jestli jde o ukázková data („vzorek“), nebo o Davidův výběr („web“).
- `tools/` – export dat, testy, průchod hrou a screenshoty, výroba obrázku pro náhled odkazu (nejsou součástí aplikace)
- `design/` – náhledy variant značky (Fáze 1)
- `docs/` – SPEC, PLAN, DECISIONS, HANDOFF, KONTROLA_*, `nahledy/` (screenshoty pro Davida), `kontrola-img/` (screenshoty kontroly)

## Příkazy
- Lokální server: `python3 -m http.server 8000` (v kořeni repozitáře)
- Výběr otázek pro web (jen prostředí B, na počítači): David je označuje v Excelu ve sloupci Web (sloupec D) u jednotlivých otázek, nebo u celého tématu ve sloupci Web na listu Témata (skript to při dalším `sync` promítne do všech otázek tématu, viz DECISIONS D-017); na jeho pokyn je jde označit i příkazem `cd $HOME/mnt/Kvizy && python3 nastroje/kviz_db.py web Ano T146 T172` (celá témata nebo jednotlivé otázky `T146-05`; hodnoty Ano / Ne / prazdne). Do Excelu nikdy nezapisuj jinak.
- Export dat (jen prostředí B): nejdřív na počítači `cd $HOME/mnt/Kvizy && python3 nastroje/kviz_db.py sync` (převezme sloupec Web z Excelu do `otazky.json`; Excel musí být zavřený), pak `otazky.json` přenést do kontejneru (`device_stage_files`) a v kořeni repozitáře:
  - ostrá data: `python3 tools/export_otazky.py /mnt/user-data/uploads/Kvizy/otazky.json`
  - ukázková data (celá uvedená témata bez ohledu na Web): `python3 tools/export_otazky.py /mnt/user-data/uploads/Kvizy/otazky.json --vzorek T146,T172`
  Export vždy nejdřív vyprázdní `data/`; když nic nevybráno, skončí chybou a `data/` nechá být.
  Na web jdou jen otázky, které prošly nezávislou revizí (sloupec Revize = OK / Opraveno / Drobná, viz D-019). Před exportem spusť na počítači `python3 nastroje/kviz_db.py revize-kontrola --web`; nezrevidované otázky nech zrevidovat skillem kviz-revize („zreviduj T146“), jinak je export přeskočí.
- Test dat: `python3 tools/test_export.py` (prostředí A – kontrola struktury) · `python3 tools/test_export.py --zdroj /mnt/user-data/uploads/Kvizy/otazky.json` (prostředí B – navíc porovnání se zdrojem; výběr podle `"rezim"` v indexu, volitelně `--vzorek T146,T172`). Nenulový návratový kód = chyba.
- Obrázek pro náhled odkazu a ikony: `python3 tools/og_obrazek.py` → `assets/img/og.png` (1200×630), `apple-touch-icon.png`, `icon-32.png` (jen při změně značky).
- Průchod hrou a screenshoty: `python3 tools/pruchod.py` (spustí vlastní server; projde celou hru včetně pravidel D-013 – 5 hvězd po půlkách, jedna hra na obtížnost, trvalý zámek pod 70 %, rozehrané kolo, přehled a historie –, 3 režimy překladu, CZ ↔ EN, obnovení stránky, zvuky a vibrace (vypínatelné), upozornění na odznak, konfety jen při 100 %, „omezit pohyb“, odkaz na téma u nového hráče, „Načítám…“ při pomalé síti, klávesy po rychlém odchodu, dlouhá slova a adresy na 320 px, Domů a Statistiky (D-021), 9 kategorií (Všechny kategorie), ukazatel postupu a tlačítko Další vidět po odpovědi (D-022), Pokračuj, hledání (ve Všech kategoriích), filtr v kategorii a stupňové odznaky (D-026, D-027), konfety od 90 %, Překvap mě, tmavý režim a velikost písma (D-028, i 320 px + tmavý + největší písmo), barvy dlaždic kategorií (D-029–D-031), Procvičit chyby (D-031), denní výzva a sdílení (D-032), přenos pokroku, výzva kamarádovi a předčítání (D-033), úroveň hráče a týdenní cíl (D-034), Moje sbírka a nová témata (D-035), průvodce pravidly pro nového hráče (D-036; ostatním scénářům se vypíná), náhled odkazu, konzoli a síť; screenshoty 9 obrazovek × 320/360/390/768/1280 px do `tools/vystup/`, který není v gitu; potřebuje aspoň 3 témata se všemi obtížnostmi). Volby: `--bez-screenshotu`, `--vystup DIR`, `--url https://frankie851.github.io/kviz-web/` (nasazený web). Nenulový návratový kód = chyba. Potřebuje `pip install playwright`; Chromium hledá standardně, pak v `/opt/pw-browsers` (v prostředí A stačí `pip install playwright==<verze z node playwright>`, `playwright install` není potřeba).

## Technické konvence
- Čisté HTML + CSS + JavaScript, bez frameworku a bez build kroku – GitHub Pages servíruje soubory přímo a každé další sezení je snadno upraví.
- Všechny cesty relativní – web běží v podsložce `/kviz-web/`, absolutní cesty `/assets/...` by se rozbily.
- Navigace přes hash (`#/kategorie/...`) – GitHub Pages neumí přesměrování na jednu stránku.
- Žádné požadavky na cizí servery: písma (licence OFL) a případné knihovny (MIT apod.) ulož do `assets/` i s licenčním souborem. Písma lze získat přes npm balíček `@fontsource/<písmo>`.
- Texty z dat vkládej jako text (`textContent`), nikdy jako HTML.
- Žádné texty rozhraní natvrdo v kódu – vše přes i18n soubory.
- localStorage jen přes jeden modul s try/catch a verzovaným klíčem (`kviz.v1.*`).
- Barvy jen přes CSS proměnné z `:root` (tmavý režim je přepisuje – D-028), velikosti písma jako `calc(Npx * var(--pismo, 1))`.
- Data jsou po jazycích (`{"cs": …, "en": …}`); kde to nic nestojí, nepředpokládej natvrdo jen dva jazyky.
- Playwright s Chromiem: v prostředí B je předinstalovaný (`playwright install` tam nespouštěj). V prostředí A ho podle potřeby nainstaluj (`pip install playwright`, `python3 -m playwright install chromium`).

## Pracovní pravidla (při stavbě)
- Na začátku sezení stáhni nejnovější `main`, pak přečti `docs/HANDOFF.md` a `docs/PLAN.md`; hotový krok v PLAN odškrtni.
- Rozhodnutí, která nejsou ve SPEC, zapiš do `docs/DECISIONS.md`.
- Na konci sezení (i při hrozícím vyčerpání limitů – raději dřív) aktualizuj `docs/HANDOFF.md`, commitni a pushni do `main`. Když prostředí dovolí jen vlastní větev, otevři pull request do `main` a požádej Davida o sloučení.
- Commity malé, popis česky: co a proč.

## Při kontrole (prompt 02)
- Kód neupravuj. Výstupem je jen `docs/KONTROLA_RRRR-MM-DD.md` (+ screenshoty v `docs/kontrola-img/`), odškrtnutí Fáze 4 v PLAN a „Další krok“ v HANDOFF. Opravy dělá stavitel ve Fázi 5.

## Nikdy bez Davidova souhlasu
- `git push --force`, mazání historie nebo větví, změna viditelnosti repozitáře.
- Zápis do Davidových složek Kvizy a KvizWeb mimo pravidla v promptu (Excel jen přes `nastroje/kviz_db.py`, nic nemazat).
- Cokoli placeného (doména, služby), registrace u cizích služeb, analytika.
