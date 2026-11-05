# DECISIONS – Kvízová webová aplikace
Nejnovější nahoře. Každé rozhodnutí jednou; pozdější změna = nový záznam s odkazem na původní.

## D-015 · 2026-11-05 · Chytlavost (Fáze 3): animace, konfety, zvuky, upozornění, náhled odkazu
- **Přechody mezi obrazovkami:** nová obrazovka přijede zprava, když jde hráč „hlouběji“ (Domů → Kategorie → Téma → Obtížnost → Otázka → Výsledek), a zleva, když se vrací. Mapa hloubek je v `app.js` (`HLOUBKA`). Překreslení téže obrazovky (např. změna jazyka) se neanimuje.
- **Mikroanimace:** dlaždice, karty, obtížnosti a odznaky naskakují postupně; logo na Domů se při příchodu zavrtí a jiskra občas zajiskří; každá otázka přijede a možnosti naskočí jedna po druhé; ✓/✗ naskočí; série 🔥 poskočí při každé další správné odpovědi.
- **Výsledek:** nadpis „vyskočí“, hvězdy (i půlky) naskakují jedna po druhé a každá má svůj tón (stoupá po pentatonice), pak závěrečný zvuk podle výsledku (100 % fanfára, od 70 % „dobře“, jinak měkký tón), nové odznaky se zvukem. **Konfety jen při 100 % (5 ★)** – SPEC říká „při ★★★“, po D-013 to znamená 5 ★. Při 100 % se za hvězdami navíc točí zlaté paprsky. Oslava (zvuky, vibrace, konfety) jen při **prvním** zobrazení výsledku (`posledni.cerstvy`), po obnovení stránky už ne.
- **Konfety:** vlastní kód v `assets/js/oslavy.js` (canvas, barvy značky, ~3 s, neblokují ťuknutí), žádná knihovna.
- **Zvuky (Web Audio, žádné soubory):** přes kompresor, aby se souběžné tóny nepřebíjely; správná odpověď je s každou další správnou v řadě o půltón výš (nejvýš +6); špatná je měkké klesající „bum-bum“ místo tvrdého bzučáku; po zapnutí Zvuků / Vibrací v Nastavení zazní krátká ukázka.
- **Upozornění na nový odznak během hry:** odznaky Rozjetý (5 za sebou) a Neomylný (10 za sebou) se udělí **hned** v okamžiku série – nahoře vyjede tmavá lišta „Nový odznak!“ se zvukem; na výsledku jsou pak i mezi novými odznaky (kolo si je pamatuje v `ziskaneBehem`, takže to přežije i obnovení stránky). Ostatní odznaky závisí na výsledku celého kola, proto se ukazují až na výsledku. Na obrazovce Odznaky mají dnes získané odznaky štítek „Nový!“.
- **Omezit pohyb:** všechny animace, přechody, paprsky i konfety se vypnou; zvuky a vibrace zůstávají (řídí je vlastní vypínače).
- **Náhled odkazu (Open Graph):** `assets/img/og.png` 1200×630 v barvách značky, vyrábí ho `tools/og_obrazek.py` (Playwright + vlastní písma) spolu s `apple-touch-icon.png` (180×180, ikona na iPhonu) a `icon-32.png` (záložní ikona pro prohlížeče bez SVG). `og:image` a `og:url` jsou **absolutní adresy** `https://frankie851.github.io/kviz-web/…` – sociální sítě relativní cesty neberou; prohlížeč hráče je nestahuje, takže to neporušuje pravidlo „žádné cizí požadavky“. Ověřeno 2026-11-05 vyhledáním (stránka ogp.me sama z cloudu není dostupná): `og:image` má být absolutní URL, k obrázku patří `og:image:alt`, locale ve tvaru `cs_CZ` / `en_GB`.
- **Ověření:** `tools/pruchod.py` nově kontroluje i zvuky a vibrace (počítá tóny a vibrace – zapnuto se ozvou, vypnuto ne), upozornění na odznak, konfety jen při 100 % a ne po obnovení, „omezit pohyb“ a značky náhledu odkazu.
- **Kdo:** prompt 01

## D-014 · 2026-11-05 · Finální seznam odznaků (12, nahrazuje D-011 a podmínky z D-013)
| | Odznak | Jak ho získat | Kdy se udělí |
|---|---|---|---|
| 🎉 | První kolo | dohraj první kolo | výsledek |
| 💎 | Bez chyby | kolo na 100 % (5 ★) | výsledek |
| 🔥 | Rozjetý | 5 správně za sebou v jednom kole | **hned během kola** |
| ⚡ | Neomylný | 10 správně za sebou v jednom kole | **hned během kola** |
| 🏔️ | Na vrcholu | aspoň 70 % v Těžké | výsledek |
| 🧭 | Objevitel | 3 témata dohraná až po Těžkou (všechny zobrazené obtížnosti odehrané) | výsledek |
| 🌟 | Hvězda tématu | všechny hvězdy v jednom tématu | výsledek |
| 👑 | Král kategorie | všechny hvězdy v celé kategorii | výsledek |
| 📅 | Tři dny v řadě | hraj 3 dny po sobě | výsledek |
| 🗓️ | Celý týden | hraj 7 dní po sobě | výsledek |
| 🌍 | Polyglot | kolo s otázkami v jiném jazyce, než je tvůj | výsledek |
| 🦉 | Bez nápovědy | kolo v cizím jazyce za 70 %+, překlad „na ťuknutí“ ani jednou neotevřený | výsledek |
- Definice v `assets/js/badges.js`, názvy a popisy v i18n (`odznak.<id>`). David seznam viděl na kontrolním bodě Fáze 2 bez připomínek; další změny jen na jeho přání.
- **Kdo:** prompt 01

## D-013 · 2026-11-05 · Nová pravidla: 5 hvězd po půlkách, každá obtížnost jen jednou (mění SPEC)
- **Rozhodnutí (David, připomínky po Fázi 2):**
  - **5 hvězd místo 3:** každých celých 10 % správně = půl hvězdy (10 % = ½ ★, 20 % = ★, … 90 % = 4½ ★, 100 % = 5 ★). Počítá se celočíselně `⌊správně × 10 / počet⌋` půlhvězd, bez zaokrouhlování nahoru.
  - **Každou obtížnost lze zahrát jen jednou.** Dohrané kolo nejde opakovat – jinak by šlo snadno sbírat odznaky a odemykat obtížnosti. Místo „Znovu“ je **Prohlédnout odpovědi**: přehled všech otázek kola s tvou a správnou odpovědí a vysvětlením (i s překladem podle nastavení), plus nová obrazovka **Historie** (z Domů) se všemi dohranými koly.
  - **Odemčení další obtížnosti od 70 %** (dřív ★★). **Pod 70 % zůstane další obtížnost v tématu zamčená natrvalo** (Davidova volba z nabídnutých možností „konec tématu / jedna druhá šance / odemknout vždy“).
  - **Smazat pokrok zrušeno** – šlo by jím pravidlo „jen jednou“ obejít.
  - **O hře:** bez textu o ověření faktů a bez zmínky o reklamě. Nově tam je krátké vysvětlení pravidel.
- **Dopočteno agentem:**
  - Rozehrané kolo se ukládá po každé odpovědi (`kviz.v1.pokrok` → `rozehrano`). Odchod ani obnovení stránky ho nezahodí, pokračuje se stejnými otázkami – jinak by šlo kolo po chybě opustit a začít znovu. Proto zmizel i dotaz „Ukončit kolo?“.
  - Ukládá se, jak hráč na každou otázku odpověděl (pro přehled). Starý formát pokroku (verze 1, 3 hvězdy) se zahodí – hrál jen David při testu.
  - „Dohrané téma“ = všechny zobrazené obtížnosti odehrané (dřív „aspoň ★ ve všech“). Odznaky: Bez chyby = 100 %, Na vrcholu = 70 % v Těžké, Objevitel = 3 témata dohraná až po Těžkou, Bez nápovědy = 70 %+.
- **Mění:** SPEC (Obrazovky 5, 7, 9; Pravidla hry), D-010 (klíč `posledni`, mazání pokroku), D-011 (podmínky odznaků).
- **Kdo:** David (pravidla), prompt 01 (doplnění)

## D-012 · 2026-11-05 · Co z „chytlavosti“ je už ve Fázi 2
- **Rozhodnutí:** Fáze 2 obsahuje i jednoduché verze věcí, které PLAN řadí do Fáze 3, protože bez nich by obrazovky 6–9 nefungovaly celé: obrazovka Odznaky a vyhodnocování odznaků (seznam D-011), krátké zvuky generované ve Web Audio (správně / špatně / konec kola), vibrace (`navigator.vibrate`, kde ho prohlížeč má), vypínače v Nastavení, drobné animace (hvězdy na výsledku, „zatřesení“ u špatné odpovědi) a logo jako ikona v záložce. Všechny animace vypíná systémové „omezit pohyb“.
- **Pro Fázi 3 zůstává:** konfety při ★★★, výraznější přechody mezi obrazovkami a animace, vyladění zvuků, upozornění na nový odznak během hry, Open Graph obrázek a náhled odkazu, finální kontrola seznamu odznaků s Davidem.
- **Proč:** David má na kontrolním bodě Fáze 2 vyzkoušet celou hru, jak ji SPEC popisuje (obrazovky 1–9), ne polotovar.
- **Kdo:** prompt 01

## D-011 · 2026-11-05 · Seznam odznaků (12)
- **Rozhodnutí:** 🎉 První kolo · 💎 Bez chyby (★★★ v kole) · 🔥 Rozjetý (5 správně za sebou v kole) · ⚡ Neomylný (10 za sebou) · 🏔️ Na vrcholu (★★ v Těžké) · 🧭 Objevitel (3 dohraná témata) · 🌟 Hvězda tématu (všechny hvězdy v tématu) · 👑 Král kategorie (všechny hvězdy v kategorii) · 📅 Tři dny v řadě · 🗓️ Celý týden (7 dní) · 🌍 Polyglot (kolo v jiném jazyce, než je můj) · 🦉 Bez nápovědy (kolo v cizím jazyce za ★★+, překlad na ťuknutí, ani jednou neotevřený). Definice v `assets/js/badges.js`, názvy a popisy v i18n (`odznak.<id>`).
- **Proč:** inspirace ze SPEC; „5 dohraných témat“ změněno na **3**, protože na webu jsou zatím jen 4 témata. Přidán „Na vrcholu“, aby měla smysl i Těžká obtížnost.
- **Kdo:** prompt 01 (Fáze 3 může seznam s Davidem doladit)

## D-010 · 2026-11-05 · Technické řešení aplikace (Fáze 2)
- **Struktura:** jedna stránka `index.html`, ES moduly v `assets/js/` (jedna obrazovka = jeden soubor v `screens/`), styl `assets/css/app.css`, písma Baloo 2 + Nunito v `assets/fonts/` i s licencemi OFL, logo `assets/img/logo.svg`. Bez frameworku a bez build kroku.
- **Adresy (hash):** `#/` Domů · `#/vitej` první spuštění · `#/kategorie` · `#/kategorie/<id>` témata · `#/tema/<ID>` obtížnost · `#/hra/<ID>/<1–3>` kolo · `#/vysledek` · `#/odznaky` · `#/nastaveni`. Rozehrané kolo se při obnovení stránky začne znovu (jednoduché, kolo je krátké). Na výsledek se jde „bez záznamu v historii“, takže tlačítko Zpět z výsledku nevrací do dohraného kola.
- **Ukládání (localStorage):** `kviz.v1.nastaveni` (jazyk rozhraní, jazyk otázek, překlad, zvuky, vibrace), `kviz.v1.pokrok` (nejlepší výsledek po tématech a obtížnostech, série dní, statistiky, odznaky s datem), `kviz.v1.posledni` (poslední výsledek – aby obrazovka Výsledek přežila obnovení). „Smazat pokrok“ maže pokrok a poslední výsledek, nastavení nechá.
- **Jazyky:** jazyk prohlížeče předvyplní češtinu u českých a slovenských prohlížečů, jinak angličtinu. Jazyk překladu = můj jazyk, když otázky běží v jiném, jinak druhý jazyk. Názvy kategorií a témat se ukazují v jazyce rozhraní. Nadpis „Věděli jste?“ je v jazyce rozhraní.
- **Nejlepší výsledek:** víc hvězd, při shodě vyšší podíl správných. Hvězdy se počítají celočíselně (`správně × 10 ≥ počet × 9` atd.), aby nevznikla chyba zaokrouhlení.
- **Mezipaměť:** index se načítá s `cache: no-cache`, soubory témat s `?v=<datum exportu>` – po aktualizaci otázek hráči uvidí nová data.
- **Ověření:** `tools/pruchod.py` (Playwright v Pythonu, vlastní server) – příkaz v `CLAUDE.md`.
- **Kdo:** prompt 01

## D-009 · 2026-11-04 · Zvolená značka: A „Oho!“
- **Rozhodnutí:** David vybral variantu **A Oho!** beze změn: název „Oho!“, logo `design/logo-a-oho.svg` (bublina s vykřičníkem a jiskrou), paleta Malina #C2255C (hlavní tlačítka, bílý text), Slunce #FFC53D, Krém #FFF6EA (pozadí), Švestka #2B1630 (text), tlumený text #6E5466, překlad #7A5F70, Správně #1E9E5A / #DDF5E6, Špatně #D9363E / #FDE2E2; písma Baloo 2 (nadpisy, tlačítka) + Nunito (texty); zaoblená „pilulková“ tlačítka, karty s poloměrem 22 px, dekorativní kruhy v rozích. Přesné hodnoty jsou v `design/index.html` (třída `.v-a`).
- **Pro Fázi 2:** písma Baloo 2 a Nunito (i s licencemi OFL) přesunout do `assets/fonts/`; ostatní písma z `design/fonts/` aplikace nepoužívá.
- **Kdo:** David (volba v relaci prompt 01)

## D-008 · 2026-11-04 · Návrhy značky: názvy, písma, rešerše
- **Rozhodnutí:** tři varianty v `design/index.html`: **A Oho!** (malina + slunce na krému, písma Baloo 2 + Nunito), **B Kvark** (tmavá noční, limetka + fialová + růžová, Unbounded + Inter), **C Hop** (moře + pomeranč + námořní modrá, „mačkací“ tlačítka, Rubik). Loga jako SVG v `design/logo-*.svg`, písma (OFL, z npm `@fontsource-variable/*`, i s licencemi) v `design/fonts/`. Po volbě se písma zvolené varianty přesunou do `assets/fonts/`.
- **Ověřeno:** všechna použitá písma mají česká písmena (kontrola znakové sady nástrojem fontTools); kontrast barev textu ≥ 4,5 : 1 (WCAG AA, výpočtem).
- **Rešerše názvů (WebSearch 2026-11-04):** „Aha“ zamítnuto – existuje iOS aplikace „Aha Quiz“. „Oho“, „Kvark“ a „Hop“ – žádná známá kvízová aplikace stejného jména (je jen „Quiz Hopper!“ a hospodský „Hop Quiz“). „Fakt“ zamítnuto – známý polský deník. Ochranné známky ověřené nejsou.
- **Zamítnuté alternativy:** písmo Fredoka (nemá ř, ě, ů, ď, ť, ň – v češtině by se míchala písma).
- **Kdo:** prompt 01 (návrh), David vybere

## D-007 · 2026-11-04 · Sloupec Web hned za Shorts + příkaz `web`
- **Rozhodnutí:** sloupec Web je v Excelu sloupec **D** (ID · Použít · Shorts · **Web** · Téma …), ukotvení listu je za ním (E2), takže ruční volby jsou vidět i při posunu doprava. Nový příkaz `python3 nastroje/kviz_db.py web Ano T146 T172 …` nastaví Web u všech otázek tématu (nebo u jednotlivých otázek `T146-05`); hodnoty Ano / Ne / prazdne. Upravuje Excel i `otazky.json` zároveň a předtím udělá zálohu Excelu.
- **Proč:** Davidův pokyn (sloupec za Shorts). Posun je bezpečný: vzorce listu Témata odkazují jen na sloupce A–C a ostatní skripty (kviz_video, kviz_shorts) hledají sloupce podle názvu hlavičky. Příkaz `web` vznikl, protože ruční zápis do Excelu je zakázaný a `prestavet` by ruční úpravu JSON přepsal hodnotami z Excelu.
- **Mění:** umístění z D-005 / prvního běhu promptu 00 (Web byl poslední sloupec AB).
- **Kdo:** David (umístění), prompt 00 (příkaz)

## D-006 · 2026-11-04 · Data na webu: 4 náhodná česká témata s Web = Ano (nahrazuje D-005)
- **Rozhodnutí:** místo vzorku T001 jsou v `data/` 4 náhodně vybraná témata z listu „České“: T146 České pohádky na plátně i obrazovce, T172 Praha: domovní znamení, legendy a skryté příběhy, T204 Československo 1918–1992, T254 Čeští sportovci a olympijští vítězové (120 otázek). V Excelu mají Web = Ano a export běžel v režimu **„web“** (`"rezim": "web"`) – jde tedy už o Davidův skutečný výběr, ne o vzorek.
- **Proč:** David na web chce hlavně otázky, které **nebudou** na YouTube, takže pravidlo „jen zveřejněná videa“ (prompt 00, krok 8) přestalo dávat smysl. Témata se vybírala jen z těch, která nemají žádnou otázku ve videu ani v Shortu.
- **Kdo:** David (pokyn), náhodný výběr prompt 00

## D-005 · 2026-11-04 · Ukázková data jen z tématu T001 (nahrazeno D-006)
- **Rozhodnutí:** vzorek v `data/` = celé téma T001 (Chobotnice, 35 ověřených otázek: 15 lehkých, 10 středních, 10 těžkých). Podle zadání se do vzorku bere celé téma bez ohledu na sloupec Web, tedy i 20 otázek, které ve videu nebyly.
- **Proč:** na listu „YouTube“ v Excelu nemá k 4. 11. 2026 žádné video stav „YouTube“ a žádná otázka nemá Použít = „YouTube“; jisté zveřejnění je jen u T001 (od října 2026, podle zadání). Ostatní videa (T002, T004, T006…) mají stav „Vytvořeno+kontrola“, zveřejnění tedy z Excelu jisté není.
- **Zamítnuté alternativy:** přidat T002/T004 (stav YouTube v Excelu chybí); vzít jen 15 otázek T001 z videa (zadání definuje vzorek jako celé téma).
- **Kdo:** prompt 00 podle pravidla v zadání

## D-004 · 2026-11-04 · Formát dat pro aplikaci
- **Rozhodnutí:** `data/index.json` = `verze`, `rezim` („vzorek“/„web“), `exportovano` (datum a čas s časovou zónou), `jazyky`, `pocet_temat`, `pocet_otazek`, `kategorie[]` (`id`, `nazev{cs,en}`, `ikona`, `temata[]` s `id`, `nazev{cs,en}`, `otazek{"1","2","3"}`, `celkem`, `soubor`), u vzorku navíc `vzorek_temata`. `data/topics/<ID>.json` = `id`, `nazev`, `kategorie{id,nazev}`, `otazky[]` s `id`, `obtiznost` (1–3), `otazka{cs,en}`, `moznosti{cs:[4],en:[4]}`, `spravne` (**index 0–3** do pole možností, A = 0), `vysvetleni{cs,en}`. Pořadí možností je přesně jako ve zdroji.
- Export vynechá téma, které nemá žádnou obtížnost se 3+ otázkami (aplikace by ho stejně nezobrazila), a vypíše ho v hlášení. Obtížnost s 1–2 otázkami v datech zůstává – skryje ji aplikace (SPEC).
- Když v režimu „web“ není vybraná žádná otázka, export skončí chybou a `data/` nechá být (aby omylem nezmizela data z webu).
- **Proč:** index je malý (načte se hned), otázky tématu až po výběru; data po jazycích dovolí přidat jazyk bez přestavby.
- **Kdo:** prompt 00

## D-003 · 2026-11-04 · Ikony kategorií = emoji + stálé ID kategorie
- **Rozhodnutí:** mapovací tabulka v `tools/export_otazky.py` (`KATEGORIE`) dává každé ze 19 kategorií v `otazky.json` stálé ID (např. `priroda-a-zvirata`), anglický název a ikonu jako **emoji** (🏛️ Historie, 🌍 Zeměpis, 🐾 Příroda a zvířata, 🎨 Umění a literatura, ⚽ Sport, 🤯 Kuriozity, 🔬 Věda a technika, 🎬 Film a TV, 🍽️ Jídlo a pití, 🎵 Hudba, 🧠 Lidské tělo, 🔱 Mytologie a náboženství, 🔤 Jazyk a slova, 🏰 Česko, 🚀 Vesmír, 💰 Ekonomika a peníze, 💡 Vynálezy, 👗 Móda a životní styl, 🧩 Obecné).
- **Proč:** emoji nepotřebují žádné soubory ani cizí servery, jsou barevné a hravé a fungují hned v návrzích značky. Pokud si zvolená značka řekne o vlastní kreslené ikony, aplikace je přiřadí podle stálého ID kategorie – data se měnit nemusí. Česko nemá vlajku, protože vlajková emoji se ve Windows ukazují jen jako písmena „CZ“.
- **Zamítnuté alternativy:** název ikony z ikonové sady (aplikace by musela sadu hned mít; rozhodne se až se značkou ve Fázi 1).
- **Kdo:** prompt 00

## D-002 · 2026-11-04 · Dvě prostředí
- **Rozhodnutí:** stavba aplikace (prompt 01) běží v Claude Code s cloudovým prostředím, které vidí jen repozitář. Vše, co potřebuje Davidův počítač – sloupec Web, export otázek (prompty 00 a 03) a nezávislá kontrola proti zdroji (prompt 02) –, běží v úkolu v aplikaci Claude propojeném s počítačem. Předávají si práci přes `main`.
- **Proč:** Claude Code s cloudovým prostředím nejde propojit se složkami na počítači (zjistil David).
- **Zamítnuté alternativy:** vše v úkolu propojeném s počítačem (David chce stavět v Claude Code); nahrát celý Excel na GitHub (veřejně by byly všechny otázky, zdroje a poznámky).
- **Kdo:** David + návrh zadání

## D-001 · 2026-11-04 · Zadání první verze
- **Rozhodnutí:** veřejný web pro kohokoli; klasický kvíz se 4 možnostmi; režim výběr tématu s volbou obtížnosti a odemykáním; dvojjazyčnost s volbou překladu (vždy / na ťuknutí / vypnuto); pokrok jen v prohlížeči; nová vlastní značka (3 varianty); GitHub Pages zdarma, doména později; výběr otázek novým sloupcem Web; hvězdy 50 / 70 / 90 %, odemčení za ★★; animace, zvuky, vibrace, série a odznaky už v 1. verzi; aktualizace otázek pokynem Claudovi.
- **Proč:** dohodnuto s Davidem při návrhu zadání.
- **Zamítnuté alternativy:** účty a žebříček (server, GDPR, správa); styl Four Doors Quiz (David chce novou značku); nahrávání celého Excelu na GitHub (veřejně by byly všechny otázky, zdroje a poznámky); rychlá hra, denní výzva a hra na čas v 1. verzi (později).
- **Kdo:** David
