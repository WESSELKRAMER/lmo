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
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/WESSELKRAMER/lmo@v0.6.2/css/lmo.min.css">
```

**Footer** (voor `</body>`)
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.27/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/WESSELKRAMER/lmo@v0.6.2/js/lmo.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/WESSELKRAMER/lmo@v0.6.2/js/zoeken.min.js"></script>
```

jsDelivr maakt van elk `.css`/`.js`-bestand automatisch een `.min`-versie.

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
| Themalijst (`.themarij`) en nieuws (`.nieuwsitem`) | Directional List Hover van Osmo Supply: een donkerbeige tegel (Zand/200) schuift in vanaf de kant waar de muis binnenkomt |
| Praktijkkaarten | Zachte schaduw, foto zoomt iets in, download-regel schuift op |
| Tekstlinks | Pijl wisselt van rechts naar links |
| Footerlinks | Koraal onderlijn groeit |
| Tags, gemeente-chips, zoekveld | Kleurwissels en focusring uit Figma |
| Kerncijfers (`.kerncijfer`) | De accentbalk links groeit over de hele kaart, tekst wisselt mee (Figma: Kerncijfer › Hover) |
| Knoppen (`.knop`) | Tekst rolt omhoog, pijl schuift door, vlak wordt lichter; per variant (standaard, `is-koraal`, `is-outline`) |

De markup in Webflow blijft gewoon: `lmo.js` voegt de tegels, de rol-tekst en de tweede pijl zelf toe.

## Animaties uit Figma

- **Hero-vormen**: elke 2,5 s schuiven de vier vormen één vak met de klok mee en draaien 90° (0,9 s, ease in-out). Loopt alleen als de hero in beeld is.
- **Logo-marquee**: 4 s per logo, met pauzeknop.
- **Kerncijfers**: tellen op vanaf 0 als ze in beeld komen.

## Zoeken

- **Overlay**: de zoekknop in de nav (of `/`) opent het zoekpaneel uit Figma: suggesties, "Direct naar" (beste 3), veel gezocht en een knop naar alle resultaten. ↑ ↓ kiezen, Enter opent, Esc sluit.
- **Resultatenpagina** `/zoeken?q=…`: in Webflow staan alleen de kop en een leeg blok met `data-lmo-zoekresultaten`; `zoeken.js` vult zoekbalk, filters per soort, sorteren, resultaten (8 per pagina) en paginering. De h1 met `data-lmo-zoektitel` krijgt "24 resultaten voor …".
- **Index**: `data/zoekindex.json`. Per item: `soort` (praktijkvoorbeeld, nieuws, kennisbank, agenda), `titel`, `samenvatting`, `gemeente`, `datum`, `formaat`, `beeld`, `trefwoorden`, `url`. `zoektermen` voeden de suggesties, `veelGezocht` de tags. Zodra er een CMS is, kan dit bestand daaruit gegenereerd worden.

## Smooth scroll (Lenis)

Staat aan voor muis en trackpad; touch scrolt native. Uit bij `prefers-reduced-motion`.

- Een element dat zelf scrolt (popup, lijst met overflow): attribute `data-lenis-prevent`.
- Scrollen pauzeren, bijv. bij een open menu: `lmoLenis.stop()` en `lmoLenis.start()`.
- Naar een plek scrollen: `lmoLenis.scrollTo("#nieuwsbrief")`.

## Nieuwe versie live zetten

```bash
git commit -am "Wat er veranderd is"
./release.sh 0.7.0
```

Het script pusht, maakt tag `v0.7.0` en print de nieuwe links. Zet die in Webflow en publiceer opnieuw.

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
