# SPEC – Kvízová webová aplikace
verze: v1 · datum: 2026-11-04 · pracovní název repozitáře `kviz-web` (název značky vybere David ve Fázi 1)

## Cíl a smysl
Veřejná webová aplikace, ve které kdokoli hraje kvízy z Davidových ověřených otázek – česky, anglicky nebo dvojjazyčně. Dvojjazyčný režim z ní dělá i nástroj na procvičování jazyka: Čech hraje anglické otázky a překlad si zobrazí, jen když nerozumí (cizinec totéž s češtinou). Aplikace má být chytlavá – hráč se má chtít vracet pro další hvězdy, odznaky a sérii dní.

## Uživatelé
- Kdokoli, Češi i cizinci, dospívající i dospělí. Hlavně na **mobilu** (jedna ruka, krátké chvilky), sekundárně na PC.
- Hráč nemá účet a nic nevyplňuje.

## Rozsah
**V první verzi:**
- klasický kvíz se 4 možnostmi (otázky označené v Excelu „Web = Ano“),
- režim „výběr tématu“: kategorie → téma → obtížnost → kolo,
- jazyková nastavení (viz Jazyky), rozhraní v CZ a EN,
- hvězdy, odemykání obtížností, série správných odpovědí, série dní, odznaky,
- animace a oslavy, zvuky a vibrace (obojí vypínatelné),
- ukládání pokroku v prohlížeči hráče,
- zveřejnění zdarma na GitHub Pages.

**Mimo rozsah (záměrně – ale kód a data mají jít později rozšířit bez přestavby):**
- další typy otázek (Co bylo dřív, Seřaď, Hádanky, Města z letadla),
- rychlá hra, denní výzva, hra na čas,
- účty, žebříčky, synchronizace mezi zařízeními,
- instalace na plochu / offline (PWA), vlastní doména,
- reklama, platby, statistiky návštěvnosti,
- další jazyky než CZ a EN,
- sdílení výsledku na sociální sítě.

## Obrazovky
1. **První spuštění** – nejvýš 2 kroky:
   (a) *Můj jazyk* (CZ / EN, předvyplnit podle jazyka prohlížeče),
   (b) *Jak chceš hrát*:
   - „Hrát v mém jazyce“ – otázky v mém jazyce, překlad vypnutý,
   - „Učím se angličtinu“ / „I'm learning Czech“ – otázky ve druhém jazyce, překlad na ťuknutí,
   - „Obě řeči najednou“ – otázky v mém jazyce, překlad pořád viditelný.
   Volbu jde kdykoli změnit v Nastavení.
2. **Domů** – logo a název značky, velké tlačítko **Hrát** (→ Kategorie), celkem hvězd, série dní, vstup do Odznaků a Nastavení.
3. **Kategorie** – mřížka barevných dlaždic s ikonou, názvem, počtem témat a získanými hvězdami (např. „12 / 45 ★“).
4. **Témata v kategorii** – karty témat; u každé tři malé ukazatele hvězd (Lehká / Střední / Těžká).
5. **Obtížnost** – tři velká tlačítka. Lehká je vždy otevřená, Střední a Těžká mají zámek, dokud hráč nezíská ★★ v předchozí obtížnosti. U každé je nejlepší výsledek. Obtížnost s méně než 3 otázkami se nezobrazí. Pokud by lehká obtížnost chyběla, zamčení se počítá od nejnižší zobrazené.
6. **Otázka** – nahoře zpět, název tématu, „3 / 10“, ukazatel postupu, série 🔥. Text otázky (+ překlad podle nastavení) a 4 velká tlačítka A–D.
   Po odpovědi: správná se vždy zbarví zeleně, špatně zvolená červeně, krátký zvuk a vibrace, panel **„Věděli jste? / Did you know?“** s vysvětlením (překlad podle nastavení) a tlačítko **Další**. Druhé ťuknutí na odpověď už nic nemění.
   Na PC jde odpovídat klávesami 1–4 nebo A–D a pokračovat Enterem.
7. **Výsledek kola** – skóre, 1–3 hvězdy s animací, konfety při ★★★, nově získané odznaky, „Odemčeno: Střední“. Tlačítka Znovu / Další obtížnost / Zpět na témata.
8. **Odznaky** – mřížka získaných a zamčených odznaků; u zamčených, jak je získat.
9. **Nastavení** – Můj jazyk (rozhraní), Jazyk otázek, Překlad (vždy / na ťuknutí / vypnuto), Zvuky, Vibrace, „O hře“ (krátce: otázky jsou ověřené, pokrok se ukládá jen v tomto zařízení, nic se nesleduje), Smazat pokrok (potvrzení uvnitř aplikace, ne systémovým dialogem prohlížeče).

## Pravidla hry
> **Změna 2026-11-05 (DECISIONS D-013, Davidovo rozhodnutí) – platí místo starších bodů níže:** hvězd je **5**, každých celých 10 % správně = **půl hvězdy** (100 % = 5 ★). **Každou obtížnost lze zahrát jen jednou**; dohrané kolo jde jen **prohlédnout** (otázky, tvoje a správná odpověď, vysvětlení) – z výsledku, z obrazovky Obtížnost a z nové obrazovky **Historie**. Další obtížnost se odemkne **od 70 %**; pod 70 % zůstane v tématu **zamčená natrvalo**. Rozehrané kolo se ukládá průběžně a pokračuje se v něm. **Smazat pokrok** v Nastavení **není**. „O hře“ neobsahuje text o ověření faktů ani o reklamě.

- **Kolo** = až 10 otázek jedné obtížnosti jednoho tématu. Má-li obtížnost víc než 10 otázek, vyber náhodně 10. Pořadí otázek v kole je náhodné, **pořadí možností A–D zůstává jako v datech** (např. čísla jsou v datech seřazená a přeházení by působilo zmateně).
- **Hvězdy za kolo:** ★ od 50 %, ★★ od 70 %, ★★★ od 90 % správně (procento = správně / počet otázek v kole, bez zaokrouhlování; u kratších kol to znamená přísnější hodnocení – např. ze 3 otázek dá ★★ až 3/3). Ukládá se nejlepší výsledek.
- **Odemykání:** Střední po ★★ v Lehké, Těžká po ★★ ve Střední, vždy v rámci tématu.
- **Série 🔥** = počet správných odpovědí v řadě v aktuálním kole (zobrazit od 2).
- **Série dní** = počet po sobě jdoucích dní (místní čas hráče), kdy dohrál aspoň jedno kolo.
- **Odznaky:** 10–12 kusů, finální seznam zapiš do DECISIONS.md. Inspirace: První kolo · První ★★★ · 5 v řadě · 10 v řadě · 5 dohraných témat · Všechny hvězdy v tématu · Všechny hvězdy v kategorii · Série 3 dní · Série 7 dní · Polyglot (kolo s otázkami v jiném jazyce, než je můj) · Bez nápovědy (kolo s otázkami v jiném jazyce, než je můj, s výsledkem aspoň 70 %, v režimu překladu „na ťuknutí“, aniž by hráč překlad otevřel).
- **Dohrané téma** = všechny zobrazené obtížnosti tématu mají aspoň ★.
- Body ani žebříčky nejsou – měřítkem jsou hvězdy (jednoduché, nepotřebují vysvětlování).

## Jazyky
- **Rozhraní:** CZ a EN, všechny texty v obou jazycích.
- **Otázky:** hráč volí jazyk otázek nezávisle na jazyku rozhraní.
- **Překlad** = stejný obsah ve druhém jazyce (v 1. verzi ten z CZ/EN, který není jazykem otázek):
  - *vždy* – pod otázkou, každou možností i vysvětlením menším a tlumenějším písmem,
  - *na ťuknutí* – u otázky tlačítko „Přeložit / Translate“; ťuknutí ukáže překlad otázky i všech možností (a zůstane zobrazený do konce otázky); u vysvětlení totéž,
  - *vypnuto*.
- Data jsou uložená po jazycích (`{"cs": …, "en": …}`), aby šlo později přidat další jazyk bez přestavby.

## Data
- **Zdroj pravdy:** `C:\Users\mlcoc\Desktop\AIProjekty\Kvizy\otazky.json`, který spravuje skript `Kvizy\nastroje\kviz_db.py`. `kviz_otazky.xlsx` je jeho přehled, ve kterém David ručně vybírá.
- **Výběr pro web:** nový sloupec **„Web“** (hodnota „Ano“, hned za sloupcem Shorts) na všech listech s otázkami. Přidá se rozšířením `kviz_db.py` (Fáze 0); do JSON se převezme příkazem `kviz_db.py sync`. Vybírá se po jednotlivých otázkách; téma se na webu ukáže, když má aspoň jednu obtížnost se 3 a více vybranými otázkami.
- **Do aplikace jdou jen otázky** s Web = Ano a stavem ověření „Ověřeno“ nebo „Opraveno po ověření“. Neověřené se přeskočí a vypíšou v hlášení exportu.
- **Na web jdou jen pole:** ID otázky, ID a název tématu (CZ/EN), kategorie (CZ/EN), obtížnost (1–3), otázka, 4 možnosti, správná možnost, vysvětlení – vše v CZ i EN. Zdroje, stavy ověření, poznámky, sloupce Použít/Shorts ani stav videí ne.
- **Kategorie:** český název je v datech, anglický název a ikonu doplní mapovací tabulka v exportním nástroji – hned pro všechny kategorie, které se v `otazky.json` vyskytují (včetně např. „Obecné“, „Česko“). Neznámá kategorie = export skončí srozumitelnou chybou, aby se nic tiše neztratilo.
- **Struktura v repozitáři:** `data/index.json` (kategorie → témata → počty otázek po obtížnostech, datum exportu, `"rezim"`: „vzorek“ nebo „web“) a `data/topics/<ID tématu>.json` (otázky tématu).
- **Ukázková data:** než David vybere otázky, je v `data/` vzorek 2–3 témat, jejichž otázky už jsou ve zveřejněných videích (repozitář je veřejný). Prvním ostrým exportem (prompt 03) se nahradí. *Změna 2026-11-04 (DECISIONS D-006): David na web chce hlavně otázky, které nebudou na YouTube; v `data/` jsou rovnou 4 česká témata s Web = Ano v režimu „web“.* Aplikace načte nejdřív jen index, otázky tématu až po jeho výběru – kvůli rychlosti na mobilu i při tisících otázek.
- Listy Excelu (Otázky, Mezinárodní, Pro ženy, Rafinovaná, České, Aktuální, Obecné…) hráč nevidí, třídí se jen podle kategorií.

## Vzhled a značka
- **Nová vlastní značka** (ne Four Doors Quiz). Ve Fázi 1 vzniknou **3 výrazně odlišné varianty**, každá s: názvem (krátký, funguje česky i anglicky, snadno se vyslovuje), barevnou paletou, písmem, logem (SVG) a ukázkou obrazovek Domů a Otázka v telefonu. David vybere jednu (případně kombinaci).
- Charakter: moderní, hravý, chytlavý – výrazné barvy, velké zaoblené prvky, plynulé mikroanimace. Ne dětinský, ne korporátní šablona.
- Mobil na prvním místě: hratelné jednou rukou, tlačítka aspoň 48 px vysoká, nic nepřetéká do stran od šířky 320 px. Na PC centrovaný sloupec rozumné šířky.
- Animace respektují systémové nastavení „omezit pohyb“ (prefers-reduced-motion).
- Kontrast textu aspoň WCAG AA.

## Soukromí a provoz
- Žádný server, žádná registrace, žádné cookies ani statistiky, žádné požadavky na cizí servery (písma, knihovny, analytika). Data hráče neopustí jeho zařízení, takže není potřeba cookie lišta.
- Pokrok se ukládá v prohlížeči (localStorage). Když ukládání nejde (např. anonymní okno), hra funguje dál, jen si nepamatuje pokrok.
- Hosting: GitHub Pages zdarma, adresa `https://<GitHub účet>.github.io/kviz-web/`.

## Kritéria přijetí (hotovo pro 1. verzi)
- [ ] Web běží na GitHub Pages a otevře se na mobilu i PC.
- [ ] Na šířkách 320, 360, 390, 768 a 1280 px nic nepřetéká do stran a vše je čitelné (ověřeno screenshoty).
- [ ] Celá cesta funguje: první spuštění → kategorie → téma → obtížnost → otázky → výsledek → hvězdy → odemčení další obtížnosti.
- [ ] Všechny tři režimy překladu fungují u otázky, možností i vysvětlení; rozhraní je kompletně v CZ i EN (žádný chybějící text).
- [ ] Pokrok (hvězdy, odemčení, série dní, odznaky, nastavení) přežije zavření a znovuotevření prohlížeče.
- [ ] Na webu jsou přesně otázky s Web = Ano a ověřeným stavem; správné odpovědi souhlasí se zdrojem (automatický test).
- [ ] Zvuky i vibrace jdou vypnout; s „omezit pohyb“ se nespouštějí velké animace.
- [ ] Prohlížeč nestahuje nic z cizích serverů (ověřeno sledováním síťových požadavků).
- [ ] Postup aktualizace otázek (prompt 03) proběhl aspoň jednou celý: na webu jsou ostrá data (`"rezim": "web"`).
- [ ] Kontrola v čistém kontextu (prompt 02) nenašla zásadní chybu, nebo jsou zásadní a střední nálezy opravené.

## Otevřené otázky
- (agent sem zapisuje otázky, které vyžadují Davidovo rozhodnutí)
