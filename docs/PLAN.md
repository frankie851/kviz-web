# PLAN – Kvízová webová aplikace
Agent: po dokončení kroku ho odškrtni (☐ → ☑) a připiš datum. Pořadí fází neměň bez zapsaného důvodu v DECISIONS.md. Na konci každého sezení aktualizuj HANDOFF.md. ⏸ = kontrolní bod, kde se zastavíš a čekáš na Davida.

Prostředí: **A** = Claude Code, Cloud environment (jen repozitář) · **B** = úkol v aplikaci Claude propojený s Davidovým počítačem (Excel, otazky.json) + GitHub. Před spuštěním promptu v B musí být v `main` vše z A (sloučené pull requesty). Každý prompt odškrtává svoje kroky; prompt 01 navíc odškrtne kroky B, jejichž výsledek je v repozitáři doložený.

## Fáze 0 – Příprava dat (prompt 00, prostředí B)
- ☑ (2026-11-04) Připojit a naklonovat repozitář; zkopírovat do něj `CLAUDE.md` (kořen) a `SPEC.md`, `PLAN.md`, `DECISIONS.md`, `HANDOFF.md` (do `docs/`) z `KvizWeb\web-aplikace\`.
- ☑ (2026-11-04) Rozšířit `Kvizy/nastroje/kviz_db.py` o sloupec Web (záloha skriptu předem) a spustit `prestavet`; ověřit proti záloze, že počty řádků, volby Použít / Shorts / Poznámka a list Témata zůstaly beze změny.
- ☑ (2026-11-04) Navrhnout aktualizaci skillu kviz-generator (jeho kopie `kviz_db.py` v Příloze A + zmínka o sloupci Web).
- ☑ (2026-11-04) Exportní nástroj `tools/export_otazky.py` (režimy „web“ a „vzorek“) a test `tools/test_export.py` (s `--zdroj` i bez něj).
- ☑ (2026-11-04) Ukázková data v `data/` – na Davidův pokyn místo vzorku rovnou 4 česká témata s Web = Ano v režimu „web“ (DECISIONS D-006).
- ◐ (2026-11-04) Zástupná stránka `index.html` („Připravujeme…“) je v repozitáři; **GitHub Pages musí zapnout David** (postup v HANDOFF – agent k nastavení repozitáře nemá přístup). Ověření adresy udělá prompt 01 na začátku Fáze 1.
- ☑ (2026-11-04) Doplnit příkazy do `CLAUDE.md`, commit + push do `main`.

## Fáze 1 – Značka (prompt 01, prostředí A)
- ☑ (2026-11-04) 3 varianty značky podle SPEC (název, paleta, písmo, logo SVG, ukázka obrazovek Domů a Otázka s otázkami z `data/`) v `design/index.html` – A Oho!, B Kvark, C Hop.
- ☑ (2026-11-04) Krátká rešerše názvů na webu (D-008): „Aha“ zamítnuto (existuje Aha Quiz); Oho, Kvark, Hop – žádná známá kvízová aplikace stejného jména.
- ☑ (2026-11-04) Screenshoty variant na telefonu (390 px) ukázány Davidovi (i v `docs/nahledy/faze1-*`) + odkaz na `…/kviz-web/design/`.

**⏸ Kontrolní bod:** ☑ (2026-11-04) David vybral variantu **A Oho!** (D-009). Ostrá data (4 témata, režim „web“) už v `data/` jsou, takže prompt 03 je potřeba jen pro další témata. → HANDOFF, konec sezení.

## Mezikrok – Ostrá data (prompt 03, prostředí B)
- ☑ (2026-11-04, už v promptu 00) `data/` obsahuje Davidův výběr (`"rezim": "web"`: T146, T172, T204, T254 – 120 otázek), test s `--zdroj` prošel. Prompt 03 je potřeba až ve chvíli, kdy David v Excelu označí další otázky.

## Fáze 2 – Základ aplikace (prompt 01, prostředí A)
- ☑ (2026-11-05) Ověřit ostrá data (`"rezim": "web"`, aspoň 3 témata s obtížností o 3+ otázkách); jinak ⏸ a požádat o prompt 03. – 4 témata po 10/10/10, `test_export.py` prošel.
- ☑ (2026-11-05) Design systém zvolené značky v CSS (barvy, písmo, tlačítka, karty, rozestupy); písmo uložené v repozitáři. – `assets/css/app.css`, Baloo 2 + Nunito v `assets/fonts/`.
- ☑ (2026-11-05) Obrazovky 1–9 podle SPEC, navigace přes hash, texty rozhraní CZ/EN.
- ☑ (2026-11-05) Logika kola, hvězd, odemykání, série, série dní; ukládání pokroku a nastavení. (Navíc už základ odznaků, zvuků a vibrací – D-012.)
- ☑ (2026-11-05) Jazyková nastavení (3 režimy překladu) včetně vysvětlení.
- ☑ (2026-11-05) Automatický průchod hrou a screenshoty 5 šířek jako opakovatelný nástroj `tools/pruchod.py` (Playwright); příkaz doplnit do `CLAUDE.md` (spoléhá na něj i prompt 03 a kontrola). Opravit nálezy. – 65 kontrol prošlo, nic nepřetéká.
- ◐ (2026-11-05) Nasadit (push do `main`, případně pull request ke sloučení) a ověřit online. – kód je v `main`; online ověření z cloudu nejde (síť nepustí github.io), ověří David na mobilu.

**⏸ Kontrolní bod:** ☑ (2026-11-05) 1. kolo připomínek zapracované (D-013 – nová pravidla hvězd a jedné hry na obtížnost); novou verzi David vyzkoušel: „bez připomínek“. David vyzkouší aplikaci na svém mobilu a připomínky napíše v téže relaci (nebo pod prompt v příští relaci); zapsat je do HANDOFF a zapracovat na začátku Fáze 3. → HANDOFF, konec sezení.

## Fáze 3 – Chytlavost (prompt 01, prostředí A)
- ☑ (2026-11-05, ještě v relaci Fáze 2) Připomínky Davida z Fáze 2 – D-013.
- ☑ (2026-11-05) Mikroanimace a přechody, animace hvězd, konfety při ★★★ (= 100 %, 5 ★ podle D-013). – D-015
- ☑ (2026-11-05) Zvuky (generované ve Web Audio, vypínatelné) a vibrace (kde je prohlížeč podporuje; jinde potichu nic). – D-015
- ☑ (2026-11-05) Odznaky (finální seznam do DECISIONS.md), obrazovka Odznaky, upozornění na nový odznak. – D-014, D-015
- ☑ (2026-11-05) Favicon, titulek stránky, náhled pro sdílení odkazu (Open Graph obrázek v barvách značky). – `assets/img/og.png`, `tools/og_obrazek.py`
- ☑ (2026-11-05) Kompletní ověření (prompt 01, část „Ověření“) a nasazení. – `test_export.py` i `pruchod.py` (106 kontrol, 7 obrazovek × 5 šířek) prošly; pull request #1 sloučený do `main`; nasazenou verzi David vyzkoušel na mobilu – bez připomínek (z cloudu online ověření nejde, síť nepustí github.io).

**⏸ Kontrolní bod:** ☑ (2026-11-05) David sloučil změny a vyzkoušel Fázi 3 na mobilu: „bez připomínek“. Další: prompt 02 (kontrola) v prostředí B. → HANDOFF, konec sezení.

## Fáze 4 – Kontrola (prompt 02, prostředí B)
- ☑ (2026-11-05) `docs/KONTROLA_2026-11-05.md` s verdiktem a nálezy – **Připraveno po opravách**: 0 zásadních, 1 střední, 7 drobných, 5 k zvážení; screenshoty v `docs/kontrola-img/`.

## Fáze 5 – Opravy a dokončení (prompt 01, prostředí A)
- ☐ Přečíst nejnovější `docs/KONTROLA_*.md`; každý zásadní a střední nález nejdřív zopakovat, pak opravit; drobné podle uvážení, neopravené zapsat do HANDOFF.
- ☐ Kompletní ověření a nasazení.
- ☐ Závěrečná zpráva Davidovi + zaškrtnout kritéria přijetí ve SPEC.

## Stav
Poslední aktualizace: 2026-11-05 (kontrola) · Aktuální fáze: 5 – opravy a dokončení (prompt 01, prostředí A); Fáze 4 hotová · Blokováno: nic; online ověření z cloudu jde jen přes WebFetch (síť nepustí github.io)
