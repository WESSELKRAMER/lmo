# LMO — custom code voor Webflow

Custom CSS en GSAP-animaties voor de site van het Leernetwerk Menswaardige Opvang
([leernetwerk-menswaardige-opvang.webflow.io](https://leernetwerk-menswaardige-opvang.webflow.io)).
Webflow laadt de bestanden via [jsDelivr](https://www.jsdelivr.com), rechtstreeks uit deze repo.

| Bestand | Wat |
|---|---|
| `css/lmo.css` | Font-smoothing, vloeiende rem-schaal, logo-marquee, Lenis-CSS, verbergen van elementen tot GSAP ze animeert |
| `js/lmo.js` | Lenis smooth scroll op de GSAP-ticker, en animaties via `data-lmo`-attributen |
| `js/zoeken.js` | Zoekoverlay en resultatenpagina (/zoeken) |
| `data/zoekindex.json` | Zoekindex (voorbeeldcontent tot het CMS er is) |
| `release.sh` | Tagt een versie en print de code voor Webflow |

## In Webflow

Site settings › Custom code:

**Head**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/WESSELKRAMER/lmo@v0.16.0/css/lmo.min.css">
```

GSAP komt uit Webflow zelf: Site settings › GSAP aan, met **ScrollTrigger** aangevinkt.

**Footer** (voor `</body>`)
```html
<script src="https://cdn.prod.website-files.com/gsap/3.15.0/Flip.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/WESSELKRAMER/lmo@v0.16.0/js/lmo.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/WESSELKRAMER/lmo@v0.16.0/js/zoeken.min.js"></script>
```

jsDelivr maakt van elk `.css`/`.js`-bestand automatisch een `.min`-versie.

## Klassen

Alle klassen zijn Engels (Webflow én de klassen die `lmo.js`/`zoeken.js` zelf aanmaken), bijvoorbeeld `button`, `button-pill`, `button-arrow`, `practice-card`, `theme-row`, `news-item`, `map-point`, `key-figure`, met modifiers als `is-coral`, `is-green`, `is-sand`, `is-active`, `is-dark`. Data-attributen (`data-lmo`, `data-gemeente`, …) en teksten blijven Nederlands.

## Animaties toevoegen

Geef in de Designer een element een custom attribute (Element settings › Custom attributes):

| Attribute | Effect |
|---|---|
| `data-lmo="fade-up"` | Schuift omhoog en vervaagt in als het in beeld komt |
| `data-lmo="fade"` | Alleen invagen |
| `data-lmo-stagger` | De directe kinderen komen na elkaar in beeld (kaarten, lijsten) |

Terugkerende onderdelen staan per klasse in `perKlasse` bovenin `js/lmo.js`; daar hoeft in Webflow niets voor ingesteld.

Bij `prefers-reduced-motion` gebeurt er niets en is alles meteen zichtbaar. Zonder JavaScript ook.

## Hovers

| Onderdeel | Effect |
|---|---|
| Themalijst (`.theme-row`) en nieuws (`.news-item`) | Directional List Hover van Osmo Supply: een donkerbeige tegel (Zand/200) schuift in vanaf de kant waar de muis binnenkomt |
| Praktijkkaarten | Zachte schaduw, foto zoomt iets in, download-regel schuift op; de pijl in het download-icoon zakt de bak in en een nieuwe komt van boven |
| Tekstlinks | Pijl wisselt van rechts naar links |
| Footerlinks | Koraal onderlijn groeit |
| Tags, gemeente-chips, zoekveld | Kleurwissels en focusring uit Figma |
| Kerncijfers (`.key-figure`) | De accentbalk links groeit over de hele kaart, tekst wisselt mee (Figma: Kerncijfer › Hover) |
| Knoppen (`.button`) | Tekst rolt omhoog, pijl schuift door, vlak wordt lichter; per variant (standaard, `is-coral`, `is-outline`) |

De markup in Webflow blijft gewoon: `lmo.js` voegt de tegels, de rol-tekst en de tweede pijl zelf toe.

## Animaties uit Figma

- **Hero-vormen**: elke 2,5 s schuiven de vier vormen één vak met de klok mee en draaien 90° (0,9 s, ease in-out). Loopt alleen als de hero in beeld is.
- **Logo-marquee**: 4 s per logo; pauzeert bij hover en toetsenbordfocus.
- **Kerncijfers**: tellen op vanaf 0 als ze in beeld komen.

## Gemeenten (CMS)

Collectie **Gemeenten** in Webflow: naam, plekken azc / gemeentelijke opvang / kleinschalige opvang AMV, uitdaging 2027, goed in, kaartpositie (links/boven in %), volgorde, contactadres, website en logo.

Op de homepage staat direct na het gemeentenblok een verborgen collectielijst (`.municipalities-data`) met de velden als data-attributen. (Het blok zelf is een Webflow-component, en een component kan geen CMS-lijst bevatten.) Op pagina's zonder die lijst, zoals `/gemeenten`, haalt `lmo.js` hem van de homepage. `lmo.js` bouwt daaruit:
- de **kaartpunten** (alleen gemeenten met een kaartpositie),
- de **chips** eronder, plus "+ N gemeenten" voor de gemeenten zonder kaartpositie,
- het **kaartje** (naam, drie aantallen, uitdaging, "Hier zijn we goed in", knop naar `/gemeenten/<slug>`).

Klik op een punt of chip wisselt het kaartje. De gemeente met de laagste volgorde staat bij het laden open.

## Mobiel menu

De Menu-knop in de nav (mobiel en tablet) opent een donkergroen paneel volgens Figma, dat uit de knop zelf groeit en er bij sluiten weer in terugkrimpt: zoekveld, de nav-links genummerd 01–07, de knop "Schrijf je in voor de nieuwsbrief" en het e-mailadres uit de footer. De links komen uit `.nav-menu` in de Nav-component. Esc of "Sluiten" sluit het menu; een link kiezen ook.

## Zoeken

- **Overlay**: de zoekknop in de nav (of `/`) opent het zoekpaneel uit Figma: suggesties, "Direct naar" (beste 3), veel gezocht en een knop naar alle resultaten. ↑ ↓ kiezen, Enter opent, Esc sluit.
- **Resultatenpagina** `/zoeken?q=…`: in Webflow staan alleen de kop en een leeg blok met `data-lmo-zoekresultaten`; `zoeken.js` vult zoekbalk, filters per soort, sorteren, resultaten (8 per pagina) en paginering. De h1 met `data-lmo-zoektitel` krijgt "24 resultaten voor …".
- **Index**: `data/zoekindex.json`. Per item: `soort` (praktijkvoorbeeld, nieuws, kennisbank, agenda), `titel`, `samenvatting`, `gemeente`, `datum`, `formaat`, `beeld`, `trefwoorden`, `url`. `zoektermen` voeden de suggesties, `veelGezocht` de tags. Zodra er een CMS is, kan dit bestand daaruit gegenereerd worden.

## Thema's en nieuws: afbeelding volgt de muis

Over de themalijst en de lijst Laatste nieuws volgt een afbeelding (22×16rem) de muis met wat vertraging, plus een koraal rondje ("Bekijk" bij thema's, "Lees" bij nieuws). Per item schuift de afbeelding naar de foto van dat item. Foto per item: `data-image="<url>"` op `.theme-row` / `.news-item` (later koppelen aan het beeldveld in het CMS); zonder `data-image` gebruikt het script voorlopig de foto's van de site. Alleen met een muis op desktop; niet bij touch, tablet of "minder beweging".

## Bouwstenen (/components)

De pagina `/components` bevat 20 sections om nieuwe pagina's mee op te bouwen: kopieer een section naar een andere pagina. Achtergrond per section met `.section` en een modifier: `is-white`, `is-dark` (donkergroen) of geen (zand). `is-compact` geeft minder ruimte boven en onder.

| # | Section | Klassen |
|---|---|---|
| 01 | Page hero, donker met kruimelpad | `page-hero`, `breadcrumb`, `h1 is-light` |
| 02 | Split hero, tekst + foto + kerngegevens | `split-hero`, `fact-list` |
| 02B | Hero met foto over de volle breedte, donkere verloop onderin, scroll-knop; foto zoomt uit en heeft parallax | `image-hero`, `image-hero-photo`, `image-hero-shade` |
| 02C | Gecentreerde hero op donkergroen, brede foto valt over de rand naar de zandkleur | `stage-hero`, `stage-hero-media`, `h1 is-light is-centered` |
| 02D | Hero met foto in boogvorm, koraal cirkel en infokaart (bijv. volgende bijeenkomst) | `arch-hero`, `arch-hero-media`, `arch-hero-card` |
| 03 | Statement, grote introtekst; de accenttekst krijgt een markeerstift die regel voor regel intekent | `statement`, `statement-accent` |
| 04 | Artikel met zijkolom | `article`, `article-body`, `article-quote` |
| 05 | Citaat met persoon | `testimonial`, `person` |
| 06 | Cijfers | `stats`, `stat` |
| 07 | Kenmerken, 3 kolommen | `feature-grid`, `feature-icon is-coral/is-blue/is-green` |
| 08 | Stappenplan | `step-list`, `step` |
| 09 | Overzicht met filters, kaarten en paginering | `filter-chip`, `practice-cards`, `pagination` |
| 10 | Sticky split | `sticky-split`, `principle` |
| 11 | Veelgestelde vragen (accordeon, `lmo.js`) | `accordion-item`, `accordion-trigger`, `accordion-panel` |
| 12 | Contactpersonen | `team-grid`, `team-card` |
| 12B | Contactpersonen als slider (GSAP, `lmo.js`): pijlen, slepen, pijltjestoetsen, voortgangsbalk | `slider-viewport`, `slider-track`, `team-card slider-slide`, `slider-button is-prev/is-next`, `slider-progress` |
| 13 | Call to action, koraal | `cta-banner` |
| 14 | Downloads | `file-row`, `file-type is-blue/is-green` |
| 15 | Agenda | `event-card`, `event-date is-blue/is-green` |
| 16 | Deelnemende gemeenten | `member-grid`, `member` |
| 17 | Tijdlijn; lijn tussen de bolletjes die bij scrollen koraal volloopt | `milestone`, `milestone-dot is-current` |
| 18 | Brede foto met onderschrift | `media-block`, `media-badge` |
| 19 | Twee routes | `route-card is-dark/is-sand` |
| 20 | Tabel | `data-table`, `data-row is-head`, `data-cell is-number` |
| 21 | Bento-grid: grote fotokaart, cijfer, link en citaat | `bento-grid`, `bento-photo-card`, `bento-stat-card`, `bento-link-card`, `bento-quote-card` |
| 22 | Tabs per thema (`lmo.js`): knop n opent paneel n, pijltjestoetsen wisselen | `tabs-list`, `tab-button`, `tab-panels`, `tab-panel` |
| 23 | Horizontale galerij: op desktop vastgezet en zijwaarts scrollend, mobiel vegen | `h-scroll`, `h-scroll-track`, `h-card` |
| 24 | Staafdiagram: staven groeien naar het getal in `.bar-value` | `bar-list`, `bar-row`, `bar-value`, `bar-fill` |
| 25 | Deelnamevormen met checklist, middelste uitgelicht | `tier-grid`, `tier is-featured`, `check-list` |
| 26 | Dagprogramma met tijden | `schedule`, `schedule-row`, `tag is-workshop` |
| 27 | Contactpersoon uitgelicht, ronde foto, telefoon en mail | `contact-spotlight`, `contact-line` |
| 28 | Checklist in twee kolommen op donkergroen | `check-grid`, `check-row` |
| 29 | Video-poster met afspeelknop (link naar video) | `video-poster`, `video-play` |
| 30 | Lees ook, lijst met thumbnails | `related-list`, `related-item` |
| 31 | List/Grid Toggle (Flip) van Osmo Supply: wissel tussen lijst en raster; foto's glijden naar hun nieuwe plek. Data-attributen niet hernoemen. Nodig: GSAP Flip | `list-grid`, `list-grid__toggle`, `list-grid__item`, `[data-list-grid-*]` |

De sections komen in beeld met dezelfde animaties als de homepage (`perKlasseBouwstenen` in `lmo.js`).

## Page loader

Bij het laden staat er kort een donkergroen vlak met een dun koraal streepje (minimaal 300 ms, uiterlijk tot 1,2 s na laden); daarna vervaagt het. Bij een klik op een interne link komt het vlak terug en gaat de browser door naar de volgende pagina. Alles in `lmo.css` (body::before/::after) en onderaan `lmo.js`. Zonder JavaScript verdwijnt het vanzelf na 2,5 s, bij "minder beweging" is er geen loader.

## Smooth scroll (Lenis)

Staat aan voor muis en trackpad; touch scrolt native. Uit bij `prefers-reduced-motion`.

- Een element dat zelf scrolt (popup, lijst met overflow): attribute `data-lenis-prevent`.
- Scrollen pauzeren, bijv. bij een open menu: `lmoLenis.stop()` en `lmoLenis.start()`.
- Naar een plek scrollen: `lmoLenis.scrollTo("#nieuwsbrief")`.

## Nieuwe versie live zetten

```bash
git commit -am "Wat er veranderd is"
./release.sh 0.11.0
```

Het script pusht, maakt tag `v0.11.0` en print de nieuwe links. Zet die in Webflow en publiceer opnieuw.

**Waarom een tag en niet `@main`?** jsDelivr bewaart `@main` tot 12 uur in de cache, dus wijzigingen
komen dan pas later door. Een tag is direct beschikbaar en verandert nooit, en je kunt in Webflow
terug naar een vorige versie door alleen het nummer te veranderen.

Even snel testen zonder nieuwe tag kan met een commit-hash:
`https://cdn.jsdelivr.net/gh/WESSELKRAMER/lmo@<hash>/js/lmo.js`.

## Schaal

Alle maten in Webflow staan in rem. `lmo.css` laat de root meeschalen:

| Viewport | 1rem |
|---|---|
| ≥ 992px | `clamp(14px, 1.1111vw, 18px)` — 16px op 1440 |
| 768–991px | 16px |
| ≤ 767px | `clamp(14px, 4.1026vw, 17px)` — 16px op 390 |

De maximale breedte van de inhoud is de Webflow-variabele *Ruimte/Max breedte* (120rem).

## Pagina's en components

Alle sections zijn Webflow-components (groep **Sections** voor /components, **Homepage** voor de homepage) met properties voor teksten, beelden en links. Een pagina bouw je door components onder elkaar te zetten en per instance de properties in te vullen.

| Pagina | Components |
|---|---|
| `/praktijkvoorbeelden` | Page hero · Overzicht met filters · Call to action · Nieuwsbrief |
| `/themas` | Page hero · Thema's · Staafdiagram · Nieuwsbrief |
| `/gemeenten` | Page hero · Gemeenten kaart · Gemeenten raster · Tabel · Call to action |
| `/nieuws` | Page hero · Laatste nieuws · Nieuwsbrief |
| `/agenda` | Page hero · Evenement · Agenda · Programma · Nieuwsbrief |
| `/kennisbank` | Page hero · Downloads · Nieuwsbrief |
| `/over-het-leernetwerk` | Stage hero · Statement · Sticky split · Tijdlijn · Gemeenten raster · Contactpersoon uitgelicht · Twee routes · Veelgestelde vragen |

Page hero heeft de schakelaars *Toon kruimel 2* (uit voor hoofdpagina's: Home / pagina) en *Toon labels*.
