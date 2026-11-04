# DECISIONS – Kvízová webová aplikace
Nejnovější nahoře. Každé rozhodnutí jednou; pozdější změna = nový záznam s odkazem na původní.

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
