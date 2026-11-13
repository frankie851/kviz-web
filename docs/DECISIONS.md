# DECISIONS – Kvízová webová aplikace
Nejnovější nahoře. Každé rozhodnutí jednou; pozdější změna = nový záznam s odkazem na původní.

## D-031 · 2026-11-14 · Jemnější barvy dlaždic, tmavé dlaždice v tmavém režimu, Procvičit chyby, „Vyber si téma“ pod filtrem (Davidovy pokyny, upravuje D-030)
- **Světlý režim – ještě jemnější pastely:** malinová `#F8C3D6`, zelená `#B5E3C5`, modrá `#BDD7F7`, oranžová `#FAD0AE`, fialová `#DDCDFA`, tyrkysová `#AEE0D9`, červená `#F8C2C3`, hnědá → cihlová `#EDB9A2` (světle hnědá by byla béžová). Tmavý text `#1A1020` (≥ 11 : 1), od pozadí odlišené jen jemně (≈ 1,3–1,5 : 1).
- **Tmavý režim – tlumené tmavé odstíny s bílým textem** (světlé dlaždice v tmavém režimu „zářily“): malinová `#6E2A44`, zelená `#1F5A3A`, modrá `#24466F`, oranžová `#7A4421`, fialová `#4A3577`, tyrkysová `#1C5652`, červená `#702A2E`, hnědá `#5E4128`; bílý text ≥ 7,8 : 1, od tmavého pozadí odlišené ≈ 1,8–2,3 : 1. Barvy jsou CSS proměnné `--tc-*` a `--tile-ink`, přidělování podle tématu a bez opakování (D-029/D-030) beze změny.
- **Procvičit chyby (návrh 4):** v Historii nahoře karta „🎯 Procvičit chyby – n otázek s chybnou odpovědí“ (obrys jako Pokračuj). Seznam = otázky zodpovězené špatně v dohraných i rozehraných kolech (témata na webu), náhodně nejvýš 10 za sebou; obrazovka jako hra (překlad podle nastavení, vysvětlení, zvuk/vibrace, klávesy, posun k Další), nahoře téma a obtížnost otázky. **Hvězdy, výsledky, série ani odznaky se nemění.** Správně zodpovězená otázka se uloží do `procviceno` a ze seznamu zmizí; na konci „x / n správně“, kolik zbývá, „Procvičit další“ a „Zpět do historie“. Bez chyb: „Žádné chyby k procvičení – skvělé! 🎉“. `progress.js` `chybneOtazky()`, `oznacProcviceno()`, `screens/procvicovani.js` (`#/procvicovani`).
- **Témata v kategorii:** text „Vyber si téma“ je pod filtrem (filtr hned pod nadpisem).
- **Ověření:** `pruchod.py` – Procvičit chyby (3 chyby z dohraného i rozehraného kola, přesně tyto otázky, 2 / 3 → zbývá 1, výsledky beze změny, Procvičit další, nakonec „Žádné chyby“, 320 px bez přetékání), tmavé dlaždice s bílým textem v tmavém režimu, „Vyber si téma“ pod filtrem; 178 kontrol. Náhled `docs/nahledy/d031-barvy-procvicovani.png`.
- **Kdo:** David (pokyny, výběr návrhu 4), prompt 01 (provedení)

## D-030 · 2026-11-14 · Světlejší barvy dlaždic s tmavým textem, ohraničení Všech kategorií (Davidův pokyn, upravuje D-029)
- **Proč:** sytě barevné dlaždice s bílým textem (D-029) byly Davidovi „až moc kontrastní“. Chce světlejší odstíny stejných barev, černý text a barvy odlišné od pozadí – bez černé, bílé a béžové.
- **Paleta (světlé odstíny, text `#1A1020`):** malinová `#F29BBB`, zelená `#86D3A2`, modrá `#93BEF2`, oranžová `#F7B27F`, fialová `#C4AAF6`, tyrkysová `#7FCDC3`, červená `#F39A9D`, hnědá `#D9A47A`. Kontrast textu 8,7–10,4 : 1; od světlého pozadí jemně odlišené (≈ 1,7–2 : 1), od tmavého výrazně (≈ 9 : 1).
- **Indigo vyřazeno** (ve světlém odstínu splývá s fialovou); **hnědá patří do stejné „rodiny“ jako oranžová** (ve světlém odstínu jsou si blízko), takže nejsou vedle sebe ani nad sebou. Pravidlo přidělování z D-029 beze změny; upravené pořadí u Mytologie, Jazyka a Ekonomiky, aby Vesmír zůstal modrý.
- **Dlaždice Všechny kategorie** má stejné ohraničení jako karta Pokračuj (malinová linka 2 px místo přerušované).
- **Ověření:** `pruchod.py` – dlaždice barevné (ne průhledné, černé, bílé ani béžové), tmavý text, barva se neopakuje u 3 předchozích; 169 kontrol. Náhled `docs/nahledy/d030-svetle-barvy.png`.
- **Kdo:** David (pokyn), prompt 01 (provedení)

## D-029 · 2026-11-14 · Barvy dlaždic kategorií podle tématu, bez opakování vedle sebe (Davidův pokyn, nahrazuje D-024)
- **Proč:** při přesunu hledání (D-027) jsem omylem přepsal `kategorie.js` starší verzí a ztratil pravidla barev z D-024; dlaždice se znovu střídaly podle pořadí a třetí v pořadí odkazovala na zrušenou černou dlaždici, takže zůstala béžová jako pozadí. David zároveň chce: bez černé a béžové, barvy podle tématu, v kontrastu s pozadím i s obrázkem na dlaždici a stejné barvy ne vedle sebe.
- **Paleta (9 barev, všechny s bílým textem):** malinová `#C2255C`, zelená `#15803D`, modrá `#1D63C9`, oranžová `#C2410C`, fialová `#7C3AED`, tyrkysová `#0F766E`, červená `#C0262D`, indigo `#4F46E5`, hnědá `#9A4A12`. Kontrast s bílým textem ≥ 5,0 : 1, se světlým pozadím ≥ 4,7 : 1, s tmavým pozadím ≈ 3 : 1 (stejné v obou režimech). Petrolejová vyřazena (moc podobná tyrkysové a modré).
- **Přidělení (`kategorie.js` `barvaKategorie`):** každá kategorie má seznam barev podle tématu (např. Příroda zelená, Zeměpis modrá, Sport oranžová, Historie hnědá, Vesmír indigo/modrá, Česko zelená – vlajka by na červené nebo modré splývala); barvy se přidělují podle pořadí kategorií – vezme se první, která není u 3 předchozích dlaždic a jejíž „rodina“ (modrá+indigo, zelená+tyrkysová, červená+malinová) není u 2 předchozích. Tím nejsou stejné ani podobné barvy vedle sebe ani nad sebou ve 2 i 3 sloupcích. S novými kategoriemi se barvy přidělí samy (nejdřív tematické, jinak z palety).
- **Ověření:** `pruchod.py` – každá dlaždice má barvu (ne průhlednou, béžovou ani černou), bílý text a barva se neopakuje u 3 předchozích dlaždic (tato kontrola by chybu z D-027 zachytila); náhled `docs/nahledy/d029-barvy-kategorii.png` (Domů, Všechny kategorie ve světlém i tmavém režimu).
- **Kdo:** David (pokyn), prompt 01 (provedení)

## D-028 · 2026-11-13 · Překvap mě, tmavý režim, velikost písma (Davidova volba návrhů 5 a 6)
- **Překvap mě (Domů):** tlačítko „🎲 Překvap mě – náhodné téma“ pod kartou Pokračuj otevře náhodné téma (obrazovku Obtížnost). Vybírá z nehraných témat, když žádné není, z témat, kde jde hrát dál, jinak z jakéhokoli. `progress.js` `nahodneTema()`.
- **Tmavý režim:** Nastavení → Vzhled → Barevný režim **Podle telefonu** (výchozí, `prefers-color-scheme`) / **Světlý** / **Tmavý**. Tmavá paleta je sada CSS proměnných (`:root[data-vzhled="tmavy"]` a stejná v `@media (prefers-color-scheme: dark)` pro „podle telefonu“); barvy, které byly v CSS napevno (ozdobné kruhy, zamčené karty, stíny odpovědí, vypínač, lišty Načítám…/nový odznak…), jsou nově proměnné. Barevné dlaždice kategorií zůstávají, jen růžová a šedá dostaly tmavší odstín s bílým textem. Barva lišty prohlížeče (`theme-color`) se řídí režimem. Konfety bez tmavé švestkové barvy (na tmavém pozadí by zmizela). Kontrast v tmavém režimu ověřen výpočtem: text 13,8 : 1, tlumený 8,3 : 1, překlad 7,2 : 1, tlačítko 4,6 : 1, písmeno správné odpovědi 10,2 : 1 (tmavé písmeno na světle zelené).
- **Velikost písma:** Nastavení → Vzhled → **Normální / Větší (×1,15) / Největší (×1,3)**. Všechna `font-size` v CSS jsou `calc(Npx * var(--pismo, 1))`; rozložení se nemění, zvětší se jen text. Velké hvězdy na výsledku a medaile u odznaků se nezvětšují (ozdoba, jinak by se na 320 px nevešly); pruh na Domů se při větším písmu zalomí na 2 řádky.
- **Uložení:** nastavení `vzhled` (`auto` | `svetly` | `tmavy`) a `pismo` (`normalni` | `vetsi` | `nejvetsi`), u starších nastavení se doplní výchozí; `settings.js` `aplikujVzhled()` je zapíše na `<html>` (`data-vzhled`, `data-pismo`).
- **Ověření:** `pruchod.py` scénář `scenar_d028` – Překvap mě 8× jen nehraná témata, Tmavý / Světlý / Podle telefonu (telefon v tmavém režimu), Největší písmo 22,1 px, obojí přežije obnovení, 320 px + tmavý + největší písmo: otázka, výsledek, Domů, Kategorie, Statistiky, Odznaky, Nastavení, Obtížnost bez přetékání; ručně prohlédnuto i 360 px / Větší a 390 px / Normální.
- **Kdo:** David (výběr návrhů 5 a 6), prompt 01 (provedení)

## D-027 · 2026-11-13 · Hledání ve Všech kategoriích, filtr ikonami, konfety od 90 %, oprava odznaků Neomylný a Objevitel (Davidovy pokyny a volby)
- **Hledání témat** přesunuto z Domů na obrazovku **Všechny kategorie** (nahoře pole, výsledky místo dlaždic). Dlaždice „Všechny kategorie (n)“ na Domů má podtitul „🔎 i hledání témat“. Pozn.: dlaždice se ukáže jen při víc než 6 kategoriích (dnes 17); při méně by hledání z Domů nebylo vidět.
- **Filtr v kategorii ikonami:** Vše (text) · 🚦 Nehrané · 🏃 Rozehrané · 🏁 Hotové, s počty; text je v popisku pro myš a čtečky. Mřížka 4 sloupců – jeden řádek i na 320 px.
- **Konfety od 90 %** (4,5 ★ a 5 ★) místo jen 100 % – původní SPEC chtěl „konfety při ★★★“ a ★★★ bylo od 90 %. Zlaté paprsky a fanfára zůstávají jen pro 100 %. David konfety v poslední verzi „nezaznamenal“, protože 100 % je vzácné.
- **Neomylný:** dřív 10 správně za sebou – u kola s 10 otázkami totéž co Bez chyby. Nově **bez chyby v Těžké** (nové id `tezka-bez-chyby`; starý `rada-10` zrušen, kdo ho měl, přijde o něj; upozornění během kola zůstává jen u Rozjetého – 5 za sebou).
- **Objevitel:** kontrola logiky – chyba v kódu nebyla, ale podmínka „3 témata až po Těžkou“ (aspoň 9 kol a 70 % v Lehké i Střední) je těžší než Na vrcholu (1 téma až po Těžkou s 70 %), takže Na vrcholu logicky přišlo dřív. Nově **Objevitel = dohrané kolo ve 3 různých tématech** (snadný, brzy; dohrávání témat odměňuje Cestovatel). Kdo ho už má, nechá si ho.
- **Ověření:** `pruchod.py` – Domů bez hledání, hledání ve Všech kategoriích, filtr na 320 px v jednom řádku s ikonami, konfety při 90 %, Neomylný za bez chyby v Těžké, Objevitel za 3 témata; 160 kontrol.
- **Kdo:** David (pokyny a volby), prompt 01 (provedení)

## D-026 · 2026-11-12 · Karta Pokračuj, hledání a filtr témat, stupňové odznaky (Davidova volba z návrhů 1–3)
- **Pokračuj (Domů):** karta nad hledáním. Přednost má naposledy rozehrané kolo s aspoň jednou odpovědí („Lehká · otázka 4 z 10“ + pruh zeleně/červeně), jinak další otevřená obtížnost naposledy hraného tématu („Střední · nová obtížnost“). Bez obojího se karta neukáže. Rozehrané kolo nově ukládá `spravne` a `cas`, výsledek kola `cas` (pořadí „naposledy“); starší záznamy bez času mají nejnižší přednost. `progress.js` `pokracovani()`.
- **Hledání (Domů):** pole „Hledat téma…“; od 2 znaků se místo dlaždic kategorií ukážou nalezená témata (v obou jazycích názvu, bez ohledu na diakritiku a velká písmena), nejvýš 30 + „…a ještě n dalších“. Dotaz se pamatuje do zavření stránky; Esc nebo smazání vrátí kategorie.
- **Filtr v kategorii:** od 4 témat přepínač Vše / Nehrané / Rozehrané / Hotové s počty (Hotové = dál nejde hrát, stejně jako „dohráno x / t“ – D-021; Rozehrané = něco odehráno nebo rozehráno). Volba se pamatuje pro každou kategorii do zavření stránky. `progress.js` `stavTematu()`.
- **Stupňové odznaky** (bronz 🥉 / stříbro 🥈 / zlato 🥇), každý stupeň je samostatný odznak (upozornění, „Nový!“, výsledek kola fungují jako dřív):
  - Cestovatel – dohraná (uzavřená) témata 10 / 50 / 100;
  - Učenec – správné odpovědi z dohraných kol 100 / 500 / 2000;
  - Sběratel hvězd – celé hvězdy 50 / 250 / 1000;
  - Vytrvalec – série dní 3 / 7 / 30 (původní odznaky „Tři dny v řadě“ a „Celý týden“ jsou jeho bronz a stříbro, nově „Celý měsíc“);
  - Znalec: <kategorie> – 25 / 50 / 100 % témat kategorie dohráno (aspoň 1 téma; u malých kategorií může jedno téma dát víc stupňů najednou). Řady se tvoří podle kategorií v datech, takže s novými kategoriemi přibývají samy.
  Odznaky se udělují po dohraném kole – hráč, který už podmínky splnil dřív, je dostane po příštím kole. Celkem dnes 73 odznaků (10 jednotlivých + 12 stupňů + 3 × 17 kategorií). Obrazovka Odznaky: Postup po stupních (medaile + pruh k dalšímu stupni + „10 / 50 do stříbra“), Jednotlivé odznaky, Znalec kategorií.
- **Ověření:** `pruchod.py` scénář `scenar_d026` (Pokračuj z rozehraného kola i bez něj, hledání bez diakritiky, nic nenalezeno, filtr s počty, 10. dohrané téma → „Cestovatel – bronz“, 17 řad Znalec, počet odznaků na Domů); screenshot Odznaků na 5 šířkách.
- **Kdo:** David (výběr návrhů 1, 2, 3), prompt 01 (provedení)

## D-025 · 2026-11-08 · Statistiky: kategorie seřazené od nejúspěšnější (Davidův pokyn)
- **Rozhodnutí:** v části „Podle kategorií“ jsou kategorie seřazené sestupně podle úspěšnosti (i s odpovědmi z rozehraných kol, D-022); při shodě je výš kategorie s víc odpověďmi; kategorie bez jediné odpovědi jsou na konci v původním pořadí (jako na Domů).
- **Ověření:** `pruchod.py` scénář `scenar_razeni_kategorii` – tři kategorie s 50 / 90 / 70 % se seřadí 90 → 70 → 50, za nimi nehrané v původním pořadí.
- **Kdo:** David (pokyn), prompt 01 (provedení)

## D-024 · 2026-11-08 · Barvy dlaždic kategorií (Davidův pokyn)
- **Rozhodnutí:** černá (švestková) dlaždice pryč; Sport a Příroda a zvířata zeleně (`.tile-zelena`), Kuriozity modře (`.tile-modra`); bílá nahrazena šedou (`.tile-4`). Ostatní kategorie střídají žlutou, malinovou, růžovou a šedou. Pevné barvy jsou v `kategorie.js` (`PEVNE`).
- **Kdo:** David (pokyn), prompt 03 session

## D-023 · 2026-11-08 · Menší posun k Další, pruhy ve Statistikách zeleně/barevně, barvy pruhů v proměnných (Davidovy připomínky)
- **Posun k Další:** rezerva nad spodním okrajem zmenšena z 14 % / max 96 px na **6 % / max 40 px**, místo pod obrazovkou otázky z 72 na 40 px (David: „odskok je zbytečně velký“). Kontrola v `pruchod.py`: tlačítko vidět s rezervou aspoň 20 px.
- **Statistiky:** každý pruh úspěšnosti je jako u otázky – zeleně správné, za nimi barevně špatné (`statistiky.js` `pruh`).
- **Barvy pruhů** jsou v CSS proměnných `--bar-ok` (dnes plná zelená `--ok`) a `--bar-bad` (dnes oranžovo-červený přechod `--progress`), aby šla varianta změnit na jednom místě. Davidovi ukázány dvě další varianty (`docs/nahledy/d023-barvy-porovnani.png`): **A** obě s přechodem (zelená `#B4E05A → #1E9E5A`), **B** obě bez přechodu (zelená `#1E9E5A`, červená `#D9363E`). **David vybral B** – `--bar-ok: var(--ok)`, `--bar-bad: var(--bad)`. Oranžovo-červený přechod `--progress` zůstává jen u ozdob (např. Načítám…), ne u pruhů úspěšnosti.
- **Kdo:** David (připomínky), prompt 01 (provedení)

## D-022 · 2026-11-08 · Ukazatel postupu podle správnosti, posun k Další, statistiky i z rozehraných kol (Davidovy připomínky)
- **Ukazatel postupu u otázky:** dva úseky – **zeleně** správné odpovědi, **za nimi** v dosavadní oranžovo-červené barvě špatné (pořadí není chronologické, jde o poměr). `hra.js` `obnovPostup`, CSS `.p-ok` / `.p-bad`.
- **Posun k tlačítku Další:** dřív `scrollIntoView({ block: "nearest" })` – tlačítko skončilo přesně u spodního okraje okna, kde ho na telefonu překryje lišta prohlížeče nebo systémová navigace (v emulaci Chromia to vypadalo v pořádku). Nově se stránka posune tak, aby nad spodním okrajem zbyla rezerva (14 % výšky, nejvýš 96 px, měřeno z `visualViewport`), zkusí se to hned a ještě jednou po 450 ms (po animacích); obrazovka otázky má dole 72 px místa navíc, aby se tlačítko dalo vysunout. Když je tlačítko vidět, nic se neposouvá.
- **Statistiky i z rozehraných kol:** úspěšnost celkem, podle obtížnosti, kategorií a jazyka, nejlepší téma (nově aspoň 5 odpovědí) a nejdelší série správných odpovědí počítají i odpovědi z rozehraných kol (správnost se zjistí z otázek tématu). Hvězdy, „Jak dopadla kola“, dohraná kola/témata a dny hraní zůstávají jen z dohraných kol (rozehrané kolo hvězdy nemá). Pod celkovou úspěšností je „včetně odpovědí z n rozehraných kol“, u řádků „x dohraných · y rozehraných · s z c správně“. Rozehrané kolo nově ukládá jazyk otázek (`j`).
- **Ověření:** `pruchod.py` – šířky zeleného a barevného úseku, tlačítko Další vidět s rezervou 60 px na okně 390 × 600 (kontrola starou chybu zachytí), statistiky s rozehraným kolem (85 %, Střední 92 %, série 12).
- **Kdo:** David (připomínky), prompt 01 (provedení)

## D-021 · 2026-11-07 · Nová obrazovka Domů (varianta C s úpravami), Statistiky, „dohráno x / t“ (Davidova volba, mění SPEC – obrazovka 2)
- **Domů** (návrh C z `design/domu.html`, David): malé záhlaví (logo, Oho!, Nastavení), nadpis „Co si dnes zahraješ?“, podtitul **„Vědomostní kvíz. Česky i anglicky.“** (místo „Ověřené otázky…“, platí i pro titulek stránky), pruh 🔥 série dní · ★ hvězdy · 🎯 úspěšnost · 🏅 odznaky, **dlaždice kategorií přímo na Domů** (tlačítko Hrát odpadá), dole **Odznaky · Historie · Statistiky**. Okno „Věděli jste?“ z návrhu **není** (David: byla by to nápověda).
- **Hodně kategorií:** na Domů nejvýš 6 dlaždic (3 plné řady), při víc kategoriích pod nimi široké tlačítko **„Všechny kategorie (n)“** → obrazovka Kategorie se všemi. Domů tak zůstane krátké; Kategorie se posouvá svisle jako běžná stránka (žádný vodorovný posuvník – na mobilu se špatně objevuje a hůř ovládá jednou rukou).
- **„Dohráno x / t“** u kategorií (Domů i Kategorie): x = témata, ve kterých hráč **už nemůže pokračovat** – všechny obtížnosti odehrané, nebo další zamčená natrvalo (pod 70 %); t = všechna zobrazená témata kategorie (`progress.js` `jeUzavrene`, `uzavrenaVKategorii`). Odznak Objevitel dál počítá „dohrané“ podle SPEC (všechny obtížnosti odehrané) – beze změny.
- **Statistiky** (`#/statistiky`, `screens/statistiky.js`): celková úspěšnost (správně z odpovědí), dohraná kola, hvězdy, dohraná témata; úspěšnost **podle obtížnosti** a **podle kategorií** (s hvězdami a dohráno x / t); **jak dopadla kola** (bez chyby / od 70 % / pod 70 %); **rekordy** (nejdelší série správných odpovědí, nejdelší série dní, dny s aspoň jedním kolem, nejlepší téma); **podle jazyka otázek**. Bez dohraného kola výzva ke hraní. Počítá se jen z dohraných kol témat, která jsou na webu.
- **Ukládání:** výsledek kola nově obsahuje `j` (jazyk otázek) a `r` (nejdelší série v kole); starší výsledky je nemají – jazyková část je ukazuje jen z nových kol. Verze pokroku se nemění.
- **Zpět z Témat** vede na Domů. Nepoužívané styly staré Domů (hero, Hrát, pilulka) odstraněny.
- **Ověření:** `pruchod.py` – Domů (podtitul, bez Věděli jste?, dlaždice, Statistiky), Statistiky z připraveného pokroku (86 %, 80/100/90 % podle obtížnosti, 21 hvězd, rozdělení kol, rekordy, dohráno x / t), 9 kategorií (6 + Všechny kategorie), EN texty, screenshot Statistik na 5 šířkách.
- **Kdo:** David (volba a úpravy), prompt 01 (provedení, vlastní nápady ve Statistikách)

## D-020 · 2026-11-06 · Součty hvězd bez půlek, česká vlajka u kategorie Česko (Davidův pokyn)
- **Hvězdy:** výsledek kola dál ukazuje půlhvězdy podle D-013 (70 % = 3,5 ★). **Součty** na Domů („3 / 60“), u kategorií a u témat („3 / 15 ★“) se zaokrouhlí **dolů na celé hvězdy** (`ui.js` `celeHvezdy`, `hvezdyText`). Uložený pokrok a odznaky počítají dál s půlkami. David vybral tuto variantu z nabídky (druhá možnost byla zrušit půlky úplně).
- **Vlajka:** kategorie `cesko` ukazuje místo emoji 🏰 z dat českou vlajku jako vlastní SVG `assets/img/vlajka-cz.svg` (emoji vlajky Windows nezobrazí – ukázalo by jen písmena „CZ“). Mapa `OBRAZKY_KATEGORII` v `ui.js`, použito na Kategoriích, u nadpisu Témat a v Historii. Data ani exportní nástroj se nemění.
- **Ověření:** `pruchod.py` kontroluje celé součty u kategorií a načtenou vlajku.
- **Kdo:** David (pokyn a volba), prompt 01 (provedení)

## D-019 · 2026-11-06 · Na web jen otázky po nezávislé revizi
- **Rozhodnutí:** export v režimu „web“ bere jen otázky, které prošly nezávislou revizí (skill kviz-revize ve složce Kvizy): pole `revize` v `otazky.json` = **OK, Opraveno nebo Drobná** a `revize_otisk` sedí s aktuálním textem otázky (jinak se text od revize změnil a otázka se musí zrevidovat znovu). Ostatní (nerevidované, Střední, Závažná) export přeskočí s důvodem v hlášení. Režim „vzorek“ revizi nehlídá (ukázková data).
- **Kde:** `tools/export_otazky.py` (`otisk`, `stav_revize`, `proc_preskocit`), `tools/test_export.py` (`revize_ok`). Otisk se počítá stejně jako v `Kvizy/nastroje/kviz_db.py` – při změně uprav oba.
- **Před exportem:** `cd $HOME/mnt/Kvizy && python3 nastroje/kviz_db.py revize-kontrola --web` ukáže otázky s Web = Ano, které revizí neprošly; zrevidují se skillem kviz-revize („zreviduj T146“).
- **Proč:** Davidův pokyn – chyba na veřejném webu poškodí důvěru; každá otázka má mít druhý, nezávislý pohled.
- **Kdo:** David (pokyn), návrh skillu kviz-revize (provedení)

## D-018 · 2026-11-05 · Domů: úspěšnost v % místo druhé série dní (KONTROLA – K zvážení 4, Davidovo rozhodnutí)
- **Rozhodnutí:** prostřední dlaždice na Domů už neukazuje „1 den v řadě“ (série dní zůstává jen v pilulce 🔥 vlevo nahoře), ale **úspěšnost** = správné odpovědi / všechny otázky ve všech dohraných kolech, zaokrouhleno na celá procenta („80 %“ / „80%“). Dokud hráč nic nedohrál, ukazuje „–“. Rozehraná kola se nepočítají.
- **Kde:** `progress.js` `uspesnost()`, `screens/domu.js`, texty `domu.uspesnost` a `domu.procent` (v češtině s nezlomitelnou mezerou). Nepoužívané texty `domu.serieDni` odstraněny. `pruchod.py` kontroluje „–“ na začátku a 80 % po kole s 2 chybami.
- **Ostatní body „K zvážení“:** K1 – David témata doplní (prompt 03); K2, K3 – David nic nežádal, zůstávají beze změny; K5 – jen informace.
- **Kdo:** David (volba), prompt 01 (provedení)

## D-017 · 2026-11-05 · Sloupec Web i na listu Témata (výběr celého tématu)
- **Rozhodnutí:** list „Témata“ má dva nové sloupce za „Shorts“: **Web** (rozbalovací seznam Ano / Ne, oranžová hlavička = ruční volba) a **Na webu** (vzorec: kolik otázek tématu má Web = Ano). „List“ se posunul na konec (sloupec P). Když David u tématu změní Web na **Ano** (nebo **Ne**), skript při nejbližším běhu (`sync`, `pridat`, `stav`, `web`, `ohraniceni`, `export`, `prestavet`) nastaví stejnou hodnotu Web u **všech otázek tématu** – v `otazky.json` i v Excelu. Vymazání volby u tématu otázky nemění. Volba tématu je uložená v `otazky.json` jako `t["web"]`, takže přežije přestavbu listu Témata.
- Otázky se přepisují jen při **změně** volby tématu. Potom jde u jednotlivé otázky Web ručně změnit (např. jednu vyřadit) a další `sync` to nepřepíše.
- Excel bez maker neumí zaškrtnout otázky hned po kliknutí; proto to dělá skript při dalším běhu (pro export na web se `sync` spouští vždy). Když je Excel při promítání otevřený, skript skončí chybou a nic neuloží, aby se JSON a Excel nerozešly.
- Příkaz `web Ano T146` u celého tématu vyplní i sloupec Web na listu Témata.
- **Proč:** Davidův pokyn – nechce u tématu odklikávat 30 otázek jednotlivě.
- **Kdo:** David (pokyn), prompt 00 (provedení)

## D-016 · 2026-11-05 · Opravy po kontrole (Fáze 5, KONTROLA_2026-11-05)
- **S-1 dlouhé slovo / adresa:** `overflow-wrap: anywhere` na panelu Věděli jste? (`.explain`) a na kartách přehledu (`.review`); navíc celá stránka `overflow-wrap: break-word` jako pojistka pro ostatní texty. Zopakováno před opravou (320 px: stránka 1024 px, přehled 1076 px), po opravě nic nepřetéká. `pruchod.py` má trvalou kontrolu: prohlížeči podstrčí kopii tématu s 80znakovým slovem a dlouhou adresou v otázce, možnostech i vysvětlení (data v repozitáři se nemění).
- **D-1 preload písem:** odstraněn `<link rel="preload">` z `index.html` (zdroj náhodného varování v konzoli). Písma mají 28–40 kB a CSS si je řekne hned; `font-display: swap` zajistí, že text je vidět i před jejich načtením. Varování v testu se **neignoruje** – zmizela jeho příčina.
- **D-2 pomalá síť:** obrazovka Obtížnost stahuje otázky tématu na pozadí už při otevření (stahování se sdílí se začátkem kola, nepovedené se zapomene a zkusí znovu). Když se jakákoli obrazovka chystá déle než 0,3 s, dole se ukáže tmavá pilulka „Načítám… / Loading…“ (`app.js`, text v i18n `app.nacitam`).
- **D-3 vypínače:** Zvuky a Vibrace 80 × 48 px (dřív 60 × 36) – podle SPEC „aspoň 48 px“.
- **D-4 kontrast:** písmeno správné odpovědi na tmavší zelené `--ok-ink` (#146C3C, bílá 6,8 : 1 místo 3,45 : 1).
- **D-5 odkaz u nového hráče:** adresa, se kterou nový hráč přišel (např. `#/tema/T146`), se zapamatuje a po prvním spuštění se na ni přejde (místo Domů).
- **D-6 klávesy po rychlém odchodu:** když se obrazovka dočte až po odchodu jinam, `app.js` zavolá její úklid (odebere posluchač kláves). Test v `pruchod.py` chybu bez opravy zachytí.
- **D-7 mrtvý kód:** odstraněny `smaz()`, `smazVse()`, `znovuNacti()`, `.btn-danger*`, zdvojené `grid-template-columns` u `.diff`, `bezFokusu: false`. `.screen-vysledek .hint` ponechán (je omezený na obrazovku Výsledek, neškodí).
- **„K zvážení“ 1–5 z kontroly** se nestavěly – čekají na Davidovo rozhodnutí (HANDOFF).
- **Kdo:** prompt 01

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
