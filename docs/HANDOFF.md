# HANDOFF – Kvízová webová aplikace
datum: 2026-11-16 · předává: prompt 01 (D-039 vysoký kontrast a čitelnější písmo, prostředí A) · přebírá: David (sloučit pull request, vyzkoušet)

## Stav jednou větou
Web je online s funkcemi do D-038 (sloučeno). V pull requestu čeká D-039: vysoký kontrast a čitelnější písmo v Nastavení → Vzhled.

## Stav dat
- 2026-11-04 – 35 otázek, 1 téma (T001 Chobotnice a další hlavonožci), režim vzorek
- 2026-11-04 – 120 otázek, 4 témata (T146 České pohádky, T172 Praha – domovní znamení, T204 Československo 1918–1992, T254 Čeští sportovci), režim web (nahrazuje vzorek T001)
- 2026-11-08 – 3480 otázek, 116 témat, režim web (všechny prošly revizí; T146, T172, T204, T254 zůstávají; +3360 / −0; 3 otázky s Drobnou: T354-04, T363-24, T398-23); `pruchod.py` prošel (133 kontrol)

## Hotovo
- 2026-11-06 (Davidův pokyn – D-019): export v režimu „web“ bere jen otázky, které prošly nezávislou revizí (skill kviz-revize, sloupec Revize v Excelu = OK / Opraveno / Drobná). **Před příštím exportem** (prompt 03) nejdřív na počítači `python3 nastroje/kviz_db.py revize-kontrola --web` a nezrevidované otázky (zatím všechny, i T146, T172, T204, T254) nech zrevidovat skillem kviz-revize – jinak je export přeskočí. Data na webu se touto změnou nezměnila.
- Fáze 0 (prompt 00, prostředí B): dokumenty, export a test dat, ostrá data, zástupná stránka – podrobnosti v PLAN a DECISIONS D-003 až D-007.
- 2026-11-05 (prostředí B, Davidův pokyn – D-017): list **Témata** v Excelu má sloupce **Web** (volba pro celé téma – skript ji při dalším `sync` promítne do všech otázek tématu) a **Na webu** (počet otázek s Web = Ano). Listy s otázkami ani data na webu se nezměnily; T146, T172, T204, T254 mají Web = Ano i na listu Témata.
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
  - náhledy pro Davida: `docs/nahledy/faze5-*.png`;
  - pull request #3 sloučený, nasazená verze ověřena přes WebFetch.
- D-018 (2026-11-05, Davidova volba): Domů – prostřední dlaždice ukazuje úspěšnost v % (série dní jen v pilulce nahoře); `pruchod.py` 116 kontrol; náhled `docs/nahledy/faze5-5-domu-uspesnost-390.png`.

- D-018 sloučené (pull request #4) – nasazení ověřit při příštím sezení přes WebFetch.
- D-020 (2026-11-06): součty hvězd zaokrouhlené dolů (výsledek kola s půlkami zůstává), česká vlajka u kategorie Česko (Kategorie, Témata, Historie); `pruchod.py` 118 kontrol; náhled `docs/nahledy/d020-hvezdy-vlajka-390.png`.

- D-021 (2026-11-07): Domů podle návrhu C s Davidovými úpravami, Statistiky, „dohráno x / t“; `pruchod.py` 135 kontrol; náhledy `docs/nahledy/d021-*.png`.
- D-022 (2026-11-08): ukazatel postupu zeleně/barevně, posun k Další s rezervou nad lištou prohlížeče, statistiky i z rozehraných kol; `pruchod.py` 138 kontrol; náhledy `docs/nahledy/d022-*.png`.
- D-023 (2026-11-08): menší posun k Další, pruhy ve Statistikách zeleně/barevně, barvy pruhů v proměnných `--bar-ok` / `--bar-bad`; `pruchod.py` 139 kontrol; porovnání barev `docs/nahledy/d023-barvy-*.png`.

- D-025 (2026-11-08): Statistiky – kategorie od nejúspěšnější, nehrané na konci; `pruchod.py` 140 kontrol (s novými daty); náhled `docs/nahledy/d025-razeni-kategorii-390.png`.

- D-026 (2026-11-12): karta Pokračuj, hledání a filtr témat, stupňové odznaky (73 odznaků); `pruchod.py` 155 kontrol; náhledy `docs/nahledy/d026-*.png`.

- D-027 (2026-11-13): hledání ve Všech kategoriích, filtr ikonami 🚦 🏃 🏁, konfety od 90 %, Neomylný = bez chyby v Těžké, Objevitel = 3 hraná témata; `pruchod.py` 160 kontrol; náhled `docs/nahledy/d027-hledani-filtr.png`.

- D-028 (2026-11-13): Překvap mě, tmavý režim, velikost písma; `pruchod.py` 168 kontrol; náhled `docs/nahledy/d028-tmavy-pismo.png`.

- D-029 (2026-11-14): barvy dlaždic kategorií podle tématu, bez opakování vedle sebe; `pruchod.py` 169 kontrol; náhled `docs/nahledy/d029-barvy-kategorii.png`.

- D-030 (2026-11-14): světlejší odstíny dlaždic, černý text, ohraničení Všech kategorií; náhled `docs/nahledy/d030-svetle-barvy.png`.

- D-031 (2026-11-14): jemnější pastely / tmavé dlaždice v tmavém režimu, Procvičit chyby, „Vyber si téma“ pod filtrem; `pruchod.py` 178 kontrol; náhled `docs/nahledy/d031-barvy-procvicovani.png`.

- D-032 (2026-11-14): denní výzva, sdílení výsledku, společná sada otázek; `pruchod.py` 190 kontrol; náhled `docs/nahledy/d032-vyzva-sdileni.png`.

- D-033 (2026-11-15): přenos pokroku, výzva kamarádovi, předčítání; `pruchod.py` 204 kontrol; náhled `docs/nahledy/d033-prenos-souboj-predcitani.png`.

- D-034 (2026-11-15): úroveň hráče a týdenní cíl; `pruchod.py` 209 kontrol; náhled `docs/nahledy/d034-uroven-tyden.png`.

- D-035 (2026-11-15): Moje sbírka, štítek „Nové“ u nových témat (bez změny exportu); `pruchod.py` 219 kontrol; náhled `docs/nahledy/d035-sbirka-nova.png`.

- D-036 (2026-11-16): průvodce pravidly pro nové hráče; `pruchod.py` 225 kontrol; náhled `docs/nahledy/d036-pruvodce.png`.

- D-037 (2026-11-16): oblíbené kategorie, co ukazovat na Domů; `pruchod.py` 233 kontrol; náhled `docs/nahledy/d037-oblibene-domu.png`.

- D-038 (2026-11-16): kalendář aktivity a měsíční souhrn; `pruchod.py` 248 kontrol; náhled `docs/nahledy/d038-kalendar-souhrn.png`.

- D-039 (2026-11-16): vysoký kontrast a čitelnější písmo; `pruchod.py` 255 kontrol; náhled `docs/nahledy/d039-kontrast-pismo.png`.

## Rozpracováno
- **Štítek „Nové“ uvidí hráči až u témat přidaných po této verzi** – po příštím exportu promptem 03 (prostředí B) ověřit na webu.
- **Na skutečném telefonu ověří David:** hlas předčítání (čeština záleží na hlasech v telefonu), stažení a nahrání souboru s pokrokem (iPhone: Soubory), otevření odkazu výzvy kamarádovi z WhatsAppu/Messengeru.
- **Sdílení na skutečném telefonu** ověří David (systémová nabídka sdílení se v Chromiu bez hlavy jen napodobí).
- ~~Volba barev pruhů~~ – David vybral B (plná zelená a červená), nastaveno (D-023).
- **Posun k Další na skutečném telefonu** ověří David (v emulaci prošlo; rezerva po D-023 je 6 % výšky / max 40 px – kdyby nestačila nebo byla moc, upravit v `hra.js` `ukazDalsi`).
- ~~Volba obrazovky Domů~~ – vyřešeno (D-021). Původní poznámka: `design/domu.html` (online `…/kviz-web/design/domu.html` po sloučení), screenshoty `docs/nahledy/domu-varianta-a…d.png`. Každá varianta potřebuje i logiku: A/D karta „Pokračuj“ = poslední rozehrané kolo, jinak další otevřená obtížnost naposledy hraného tématu; B/D týden = dny s dohraným kolem v aktuálním týdnu (dnes se ukládá jen poslední den a délka série, takže je potřeba ukládat i data hraní); B/D nejbližší odznak = nezískaný odznak s největším podílem splnění; C dlaždice kategorií + „Věděli jste?“ jen z už zodpovězených otázek. Po volbě: zapsat do DECISIONS, postavit, rozšířit `pruchod.py`.
- **Online ověření:** z cloudu nejde – síť prostředí A nepustí `frankie851.github.io` (ani ogp.me). Ověří David na mobilu; prompt 02 může spustit `python3 tools/pruchod.py --url https://frankie851.github.io/kviz-web/`.
- **Vlastní zařízení:** zvuky a vibrace v Chromiu bez hlavy nejde slyšet/cítit (test jen počítá, že se spustily) – poslech ověří David na telefonu. iPhone vibrace v prohlížeči nemá (je to v pořádku, „potichu nic“).
- **Náhled odkazu** ověří až sdílení nasazené adresy (např. poslat si odkaz ve WhatsAppu/Messengeru). Sítě si náhled pamatují – kdyby ukazovaly starou zástupnou stránku, chce to chvíli počkat.

## Další krok
1. **David:** sloučit pull request s D-039 a vyzkoušet (Nastavení → Vzhled → Vysoký kontrast, Čitelnější písmo; i s tmavým režimem).
2. **Návrhy z 2026-11-12 uzavřené:** 1–8 hotové (D-026–D-032); 9 Instalace na plochu / offline – **David nechce** (2026-11-15), nestavět; 10 Nahlásit chybu v otázce – jen **možnost do budoucna** (viz Nápady na později).
2b. **Nápady z 2026-11-15** (číslování podle zprávy Davidovi): hotové 11 Výzva kamarádovi, 12 Předčítání, 13 Přenos pokroku (D-033), 14 Úroveň hráče, 15 Týdenní cíl (D-034), 16 Moje sbírka, 17 Štítek „Nové“ (D-035); **vynechané pro teď** (David 2026-11-16): 18 Žolík 50 : 50, 19 Duel dvou hráčů na jednom telefonu, 20 Rychlovka na čas.
2c. **Nové nápady z 2026-11-16** (číslování podle zprávy Davidovi; hotové 21 Průvodce pravidly (D-036), 22 Oblíbené kategorie a 23 Co ukazovat na Domů (D-037), 26 Kalendář aktivity a 27 Měsíční souhrn (D-038), 30 Vysoký kontrast a čitelnější písmo (D-039); **David zatím nevybral:** 24 Opakování chyb s rozestupy (1, 3, 7 dní), 25 Odznaky za odpovědi v cizím jazyce, 28 Tisk kvízu (otázky a zvlášť odpovědi), 29 Prezentační režim na televizi/projektor).
2. **Další témata (kdykoli):** v Excelu označit Web = Ano (u celého tématu stačí list Témata, D-017), uložit, zavřít; pak **prompt 03** v úkolu propojeném s počítačem (prostředí B). Prompt 03 po exportu spustí `python3 tools/pruchod.py`.
3. Body „K zvážení“ z kontroly: K4 hotovo (D-018), K1 = krok 2, K2 a K3 beze změny (David nic nežádal), K5 jen informace. Kdyby David chtěl K2/K3 přece změnit, udělá to prompt 01.

## Z kontroly 2026-11-05 (prompt 02)
- Data: `otazky.json` ↔ `data/` ↔ Excel 100 % shodné (120 otázek, vlastní skript v příloze KONTROLA).
- Online verze odpovídá `main` (ověřeno přes WebFetch; z kontejneru `github.io` nejde ani v prostředí B).
- `tools/pruchod.py`: 1. běh selhal na varování o preload písem, 2. běh prošel – viz nález D-1.

## Připomínky Davida (k zapracování)
- 2026-11-16 – „30“ (vysoký kontrast, čitelnější písmo) → **zapracováno** (D-039).
- 2026-11-16 – „26 a 27“ (kalendář aktivity, měsíční souhrn) → **zapracováno** (D-038).
- 2026-11-16 – „22 a 23“ (oblíbené kategorie, co ukazovat na Domů) → **zapracováno** (D-037).
- 2026-11-16 – „21“ (průvodce pravidly) → **zapracováno** (D-036).
- 2026-11-16 – „18–20 pro teď vynecháváme, vymysli 10 dalších nápadů“ → zapsáno (2b, 2c v Dalším kroku).
- 2026-11-15 – „udělej ještě 16 a 17“ (Moje sbírka, štítek Nové) → **zapracováno** (D-035).
- 2026-11-15 – „udělej ještě 14 a 15“ (úroveň hráče, týdenní cíl) → **zapracováno** (D-034).
- 2026-11-15 – „udělej 13, 11 a 12“ (přenos pokroku, výzva kamarádovi, předčítání) → **zapracováno** (D-033).
- 2026-11-15 – „9 nedělej, 10 zaznamenej jako možnost do budoucna, vymysli dalších 10 nápadů“ → zapsáno (Nápady na později), nápady 11–20 v Dalším kroku.
- 2026-11-14 – „udělej ještě návrh 7 a 8“ (denní výzva, sdílení výsledku) → **zapracováno** (D-032).
- 2026-11-14 – „ještě méně kontrastu; v tmavém režimu barvy ztmavit a text bílý; návrh 4 procvičení špatných odpovědí s tlačítkem nahoře v Historii; Vyber si téma pod filtry“ → **zapracováno** (D-031).
- 2026-11-14 – „až moc kontrastní; světlejší odstíny, černý text, bez černé/bílé/béžové; Všechny kategorie ohraničit jako Pokračuj“ → **zapracováno** (D-030).
- 2026-11-14 – „rozházely se barvy z předchozí verze; černou a béžovou jako pozadí nepoužívat; barvy k tématu, v kontrastu s pozadím a obrázkem, stejné ne vedle sebe“ → **zapracováno** (D-029).
- 2026-11-13 – „udělej ještě návrh 5 a 6“ (náhodné téma; tmavý režim a velikost písma) → **zapracováno** (D-028).
- 2026-11-13 – hledání do karty Všechny kategorie; filtr ikonami (start, běžec, cíl) na jeden řádek; konfety po kole nevidí; Neomylný = Bez chyby; Na vrcholu dřív než Objevitel → **zapracováno** (D-027, volby: Neomylný = bez chyby v Těžké, Objevitel zjednodušit, konfety od 90 %).
- 2026-11-12 – z 10 návrhů vybral 1 (Pokračuj), 2 (hledání a filtr), 3 (víc odznaků po stupních) → **zapracováno** (D-026).
- 2026-11-08 – „u statistik kategorií seřazení od nejúspěšnější sestupně“ → **zapracováno** (D-025).
- 2026-11-08 – „odskok je zbytečně velký“, pruh ve Statistikách zeleně jako u otázek → **zapracováno** (D-023); ukázat variantu A (i zelená s přechodem) a B (obě bez přechodu) → David vybral **B** (obě bez přechodu) → **zapracováno**.
- 2026-11-08 – ukazatel u otázek zeleně správné + za nimi špatné v současné barvě; po odpovědi automaticky posunout dolů k Další (na telefonu musel posouvat ručně); statistiky započítávat i nedokončená kola, kde je to vhodné → **zapracováno** (D-022).
- 2026-11-07 – „Nejvíc se mi líbí C, ale s úpravami“: podtitul „Vědomostní kvíz.“, u kategorií x / t (dohraná do okamžiku, kdy nejde pokračovat), bez okna Věděli jste?, tlačítko Statistiky (celkem, podle obtížnosti, podle kategorií, hvězdy + vlastní nápady), dotaz na hodně kategorií → **zapracováno** (D-021).
- 2026-11-06 – „Půlky hvězdiček zaokrouhli dolů“ (upřesněno: jen součty), „u českých místo současného obrázku česká vlajka“ → **zapracováno** (D-020). „Navrhni možnosti vylepšení úvodní stránky, více variant, něco tomu chybí“ → 4 návrhy v `design/domu.html`, **čeká na volbu**.
- 2026-11-05 – „mírně zmenši stín pod Hrát“, upřesněno „užší stín, zasahoval do tlačítek Odznaky a Historie“ → **zapracováno**: `.btn-cta` stín `0 6px 8px -6px` (sahá ~8 px pod tlačítko, mezera k řadě Odznaky/Historie je 12 px).
- 2026-11-05 – ke „K zvážení“: „témata budou doplněna. Série ‚1 den v řadě‘ nahraď úspěšností v %“ → **zapracováno** (D-018); témata = prompt 03.
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
- **Nahlásit chybu v otázce** (návrh 10 z 2026-11-12, David: „zaznamenat jako možnost do budoucna“): hráč u otázky ťukne a popíše chybu. Statický web zprávy sám nepřijme – možnosti: předvyplněný e-mail (zveřejní adresu), formulář cizí služby (registrace – jen s Davidovým souhlasem), nebo odkaz na GitHub issue (hráč potřebuje účet). Rozhodnutí o službě je na Davidovi.
- ~~Instalace na plochu / offline (PWA)~~ – David nechce (2026-11-15).
- Tečka u tlačítka Odznaky na Domů, dokud si hráč nový odznak neprohlédne.

## Jak navázat
Nejdřív `git fetch origin main` (+ `git merge origin/main`). Pak přečti v tomto pořadí: `CLAUDE.md` → `docs/HANDOFF.md` → `docs/PLAN.md` → `docs/SPEC.md` → `docs/DECISIONS.md` (+ nejnovější `docs/KONTROLA_*.md`, je-li na řadě Fáze 5). Zvolenou značku (D-009) a strukturu dat neměň bez souhlasu Davida.
