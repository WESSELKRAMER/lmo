/* Leernetwerk Menswaardige Opvang — zoeken.
   Figma: "LMO - Zoeken Overlay" en "LMO - Zoekresultaten" (desktop + mobiel).

   - Overlay: opent vanuit de zoekknop in de nav (en met "/"). Suggesties,
     "Direct naar" (beste 3), veel gezocht en een knop naar alle resultaten.
     Pijltjes kiezen, Enter opent, Esc sluit.
   - Resultatenpagina /zoeken?q=…: element met data-lmo-zoekresultaten wordt
     gevuld met zoekbalk, filters per soort, sorteren, resultaten en paginering.
     Een element met data-lmo-zoektitel krijgt de kop ("24 resultaten voor …").
   - Het hero-formulier en de "veel gezocht"-tags gaan naar /zoeken.

   De index staat in data/zoekindex.json (zelfde versie als dit script). */

(function () {
  "use strict";

  var ZOEKPAGINA = "/zoeken";
  var PER_PAGINA = 8;

  /* ---------- index ---------- */

  var scriptSrc = (document.currentScript && document.currentScript.src) || "";
  var INDEX_URL = window.LMO_ZOEKINDEX ||
    scriptSrc.replace(/\/js\/zoeken(\.min)?\.js.*$/, "/data/zoekindex.json");

  var indexBelofte = null;
  function laadIndex() {
    if (!indexBelofte) {
      indexBelofte = fetch(INDEX_URL)
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch(function (e) {
          console.warn("[lmo] zoekindex niet geladen", e);
          return { items: [], zoektermen: [], veelGezocht: [] };
        });
    }
    return indexBelofte;
  }

  var SOORTEN = {
    praktijkvoorbeeld: { naam: "Praktijkvoorbeeld", meervoud: "Praktijkvoorbeelden", icoon: "student" },
    nieuws: { naam: "Nieuws", meervoud: "Nieuws", icoon: "newspaper" },
    kennisbank: { naam: "Kennisbank", meervoud: "Kennisbank", icoon: "file" },
    agenda: { naam: "Agenda", meervoud: "Agenda", icoon: "calendar" }
  };
  var SOORT_VOLGORDE = ["praktijkvoorbeeld", "nieuws", "kennisbank", "agenda"];

  /* Phosphor Icons (Regular, MIT) — dezelfde als in Figma */
  var ICONEN = {
    student: "M21.23 5.28L12.23 2.28C12.08 2.23 11.91 2.23 11.76 2.28L2.76 5.28C2.61 5.33 2.48 5.43 2.39 5.56C2.29 5.68 2.24 5.84 2.25 6.00V13.50C2.25 13.69 2.32 13.88 2.46 14.03C2.61 14.17 2.80 14.25 3 14.25C3.19 14.25 3.38 14.17 3.53 14.03C3.67 13.88 3.75 13.69 3.75 13.50V7.04L6.89 8.08C6.06 9.44 5.79 11.06 6.15 12.61C6.52 14.16 7.48 15.50 8.83 16.34C7.14 17.00 5.68 18.20 4.62 19.84C4.56 19.92 4.52 20.01 4.50 20.11C4.48 20.21 4.48 20.31 4.50 20.40C4.52 20.50 4.56 20.59 4.62 20.68C4.67 20.76 4.75 20.83 4.83 20.88C4.91 20.94 5.01 20.97 5.10 20.99C5.20 21.01 5.30 21.01 5.40 20.99C5.50 20.97 5.59 20.93 5.67 20.87C5.75 20.81 5.82 20.74 5.87 20.65C7.29 18.49 9.52 17.25 12 17.25C14.47 17.25 16.70 18.49 18.12 20.65C18.23 20.82 18.40 20.93 18.59 20.97C18.78 21.01 18.98 20.97 19.15 20.86C19.31 20.76 19.43 20.59 19.47 20.40C19.51 20.20 19.48 20.00 19.37 19.84C18.31 18.20 16.84 17.00 15.16 16.34C16.51 15.50 17.47 14.16 17.83 12.61C18.20 11.07 17.93 9.44 17.10 8.09L21.23 6.71C21.38 6.66 21.51 6.57 21.60 6.44C21.70 6.31 21.75 6.16 21.75 6.00C21.75 5.84 21.70 5.69 21.60 5.56C21.51 5.43 21.38 5.34 21.23 5.29V5.28ZM16.5 11.25C16.50 11.96 16.33 12.66 16.00 13.29C15.68 13.93 15.21 14.47 14.63 14.89C14.06 15.31 13.39 15.58 12.69 15.69C11.99 15.80 11.27 15.74 10.59 15.52C9.92 15.30 9.30 14.92 8.80 14.42C8.30 13.91 7.93 13.29 7.71 12.62C7.49 11.94 7.44 11.22 7.55 10.52C7.67 9.82 7.95 9.15 8.37 8.58L11.76 9.70C11.91 9.75 12.08 9.75 12.23 9.70L15.62 8.58C16.19 9.35 16.50 10.29 16.5 11.25ZM12 8.20L5.37 6.00L12 3.79L18.62 6.00L12 8.20Z",
    newspaper: "M8.25 10.5C8.25 10.30 8.32 10.11 8.46 9.96C8.61 9.82 8.80 9.75 9 9.75H16.5C16.69 9.75 16.88 9.82 17.03 9.96C17.17 10.11 17.25 10.30 17.25 10.5C17.25 10.69 17.17 10.88 17.03 11.03C16.88 11.17 16.69 11.25 16.5 11.25H9C8.80 11.25 8.61 11.17 8.46 11.03C8.32 10.88 8.25 10.69 8.25 10.5ZM9 14.25H16.5C16.69 14.25 16.88 14.17 17.03 14.03C17.17 13.88 17.25 13.69 17.25 13.5C17.25 13.30 17.17 13.11 17.03 12.96C16.88 12.82 16.69 12.75 16.5 12.75H9C8.80 12.75 8.61 12.82 8.46 12.96C8.32 13.11 8.25 13.30 8.25 13.5C8.25 13.69 8.32 13.88 8.46 14.03C8.61 14.17 8.80 14.25 9 14.25ZM21.75 6V17.25C21.75 17.84 21.51 18.41 21.09 18.84C20.66 19.26 20.09 19.5 19.5 19.5H3C2.40 19.5 1.83 19.26 1.41 18.84C0.99 18.42 0.75 17.85 0.75 17.26V8.25C0.75 8.05 0.82 7.86 0.96 7.71C1.11 7.57 1.30 7.5 1.5 7.5C1.69 7.5 1.88 7.57 2.03 7.71C2.17 7.86 2.25 8.05 2.25 8.25V17.25C2.25 17.44 2.32 17.63 2.46 17.78C2.61 17.92 2.80 18 3 18C3.19 18 3.38 17.92 3.53 17.78C3.67 17.63 3.75 17.44 3.75 17.25V6C3.75 5.60 3.90 5.22 4.18 4.93C4.47 4.65 4.85 4.5 5.25 4.5H20.25C20.64 4.5 21.02 4.65 21.31 4.93C21.59 5.22 21.75 5.60 21.75 6ZM20.25 6H5.25V17.25C5.25 17.50 5.20 17.75 5.12 18H19.5C19.69 18 19.88 17.92 20.03 17.78C20.17 17.63 20.25 17.44 20.25 17.25V6Z",
    file: "M20.03 7.71L14.78 2.46C14.71 2.39 14.62 2.34 14.53 2.30C14.44 2.26 14.34 2.24 14.25 2.25H5.25C4.85 2.25 4.47 2.40 4.18 2.68C3.90 2.97 3.75 3.35 3.75 3.75V20.25C3.75 20.64 3.90 21.02 4.18 21.31C4.47 21.59 4.85 21.75 5.25 21.75H18.75C19.14 21.75 19.52 21.59 19.81 21.31C20.09 21.02 20.25 20.64 20.25 20.25V8.25C20.25 8.15 20.23 8.05 20.19 7.96C20.15 7.87 20.10 7.78 20.03 7.71ZM15 4.81L17.68 7.5H15V4.81ZM18.75 20.25H5.25V3.75H13.5V8.25C13.5 8.44 13.57 8.63 13.71 8.78C13.86 8.92 14.05 9 14.25 9H18.75V20.25ZM14.78 14.46C14.85 14.53 14.90 14.62 14.94 14.71C14.98 14.80 15.00 14.90 15.00 15C15.00 15.09 14.98 15.19 14.94 15.28C14.90 15.37 14.85 15.46 14.78 15.53L12.53 17.78C12.46 17.85 12.37 17.90 12.28 17.94C12.19 17.98 12.09 18.00 12 18.00C11.90 18.00 11.80 17.98 11.71 17.94C11.62 17.90 11.53 17.85 11.46 17.78L9.21 15.53C9.07 15.38 8.99 15.19 8.99 15C8.99 14.80 9.07 14.61 9.21 14.46C9.36 14.32 9.55 14.24 9.75 14.24C9.94 14.24 10.13 14.32 10.28 14.46L11.25 15.43V11.25C11.25 11.05 11.32 10.86 11.46 10.71C11.61 10.57 11.80 10.5 12 10.5C12.19 10.5 12.38 10.57 12.53 10.71C12.67 10.86 12.75 11.05 12.75 11.25V15.43L13.71 14.46C13.78 14.39 13.87 14.34 13.96 14.30C14.05 14.26 14.15 14.24 14.25 14.24C14.34 14.24 14.44 14.26 14.53 14.30C14.62 14.34 14.71 14.39 14.78 14.46Z",
    calendar: "M19.5 3H17.25V2.25C17.25 2.05 17.17 1.86 17.03 1.71C16.88 1.57 16.69 1.5 16.5 1.5C16.30 1.5 16.11 1.57 15.96 1.71C15.82 1.86 15.75 2.05 15.75 2.25V3H8.25V2.25C8.25 2.05 8.17 1.86 8.03 1.71C7.88 1.57 7.69 1.5 7.5 1.5C7.30 1.5 7.11 1.57 6.96 1.71C6.82 1.86 6.75 2.05 6.75 2.25V3H4.5C4.10 3 3.72 3.15 3.43 3.43C3.15 3.72 3 4.10 3 4.5V19.5C3 19.89 3.15 20.27 3.43 20.56C3.72 20.84 4.10 21 4.5 21H19.5C19.89 21 20.27 20.84 20.56 20.56C20.84 20.27 21 19.89 21 19.5V4.5C21 4.10 20.84 3.72 20.56 3.43C20.27 3.15 19.89 3 19.5 3ZM6.75 4.5V5.25C6.75 5.44 6.82 5.63 6.96 5.78C7.11 5.92 7.30 6 7.5 6C7.69 6 7.88 5.92 8.03 5.78C8.17 5.63 8.25 5.44 8.25 5.25V4.5H15.75V5.25C15.75 5.44 15.82 5.63 15.96 5.78C16.11 5.92 16.30 6 16.5 6C16.69 6 16.88 5.92 17.03 5.78C17.17 5.63 17.25 5.44 17.25 5.25V4.5H19.5V7.5H4.5V4.5H6.75ZM19.5 19.5H4.5V9H19.5V19.5Z"
  };

  function icoon(naam, maat) {
    return '<svg aria-hidden="true" width="' + maat + '" height="' + maat + '" viewBox="0 0 24 24" fill="currentColor"><path d="' + ICONEN[naam] + '"/></svg>';
  }
  var SVG_ZOEK = '<svg aria-hidden="true" width="1.25rem" height="1.25rem" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.66" d="M9.16 14.99A5.83 5.83 0 1 0 9.16 3.33a5.83 5.83 0 0 0 0 11.66Z"/><path stroke="currentColor" stroke-width="1.66" stroke-linecap="round" d="M16.66 16.66 13.75 13.75"/></svg>';
  var SVG_ZOEK_KLEIN = SVG_ZOEK.replace(/1\.25rem/g, "1.125rem");
  var SVG_PIJL_KLEIN = '<svg aria-hidden="true" width="0.875rem" height="0.875rem" viewBox="0 0 14 14" fill="none"><path stroke="currentColor" stroke-width="1.53" stroke-linecap="round" stroke-linejoin="round" d="M2.91 7H11.08M7.58 10.5L11.08 7L7.58 3.5"/></svg>';
  var SVG_PIJL = '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" width="1.5rem" height="1.5rem"><path stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M5 12H19M13 18L19 12L13 6"/></svg>';
  var SVG_SLUIT = '<svg aria-hidden="true" width="0.75rem" height="0.75rem" viewBox="0 0 12 12" fill="none"><path stroke="currentColor" stroke-width="1.75" stroke-linecap="round" d="M1 1l10 10M11 1 1 11"/></svg>';
  var SVG_CHEVRON = '<svg aria-hidden="true" width="0.625rem" height="0.375rem" viewBox="0 0 10 6" fill="none"><path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M1 1l4 4 4-4"/></svg>';

  /* ---------- tekst ---------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Per teken vouwen (é → e, hoofdletters weg) zodat posities gelijk blijven.
  function vouw(s) {
    var uit = "";
    for (var i = 0; i < s.length; i++) uit += s[i].normalize("NFD")[0].toLowerCase();
    return uit;
  }

  function termen(q) {
    return vouw(q.trim()).split(/[^a-z0-9]+/).filter(function (t) { return t.length > 0; });
  }

  var LETTER = /[a-z0-9]/;

  // Zoek naar woorden die met de term beginnen (of hem bevatten).
  function treffers(tekst, term) {
    var v = vouw(tekst), uit = [], i = v.indexOf(term);
    while (i !== -1) {
      uit.push({ start: i, eind: i + term.length, begin: i === 0 || !LETTER.test(v[i - 1]) });
      i = v.indexOf(term, i + 1);
    }
    return uit;
  }

  // Markeer de treffers in de tekst (escaped HTML terug).
  function markeer(tekst, ts, klasse) {
    if (!ts.length) return esc(tekst);
    var stukken = [];
    ts.forEach(function (t) {
      treffers(tekst, t).forEach(function (m) { if (m.begin) stukken.push(m); });
    });
    if (!stukken.length) return esc(tekst);
    stukken.sort(function (a, b) { return a.start - b.start; });
    var uit = "", pos = 0;
    stukken.forEach(function (m) {
      if (m.start < pos) return;
      uit += esc(tekst.slice(pos, m.start)) + '<mark class="' + klasse + '">' + esc(tekst.slice(m.start, m.eind)) + "</mark>";
      pos = m.eind;
    });
    return uit + esc(tekst.slice(pos));
  }

  /* ---------- zoeken ---------- */

  function score(item, ts) {
    var velden = [
      [item.titel, 6],
      [(item.trefwoorden || []).join(" · "), 3],
      [item.samenvatting, 2],
      [[item.gemeente, SOORTEN[item.soort] && SOORTEN[item.soort].naam, item.formaat].join(" "), 1.5]
    ];
    var totaal = 0;
    for (var i = 0; i < ts.length; i++) {
      // Per veld de beste treffer; treffers in meer velden tellen op.
      var term = 0;
      velden.forEach(function (v) {
        var best = 0;
        treffers(v[0] || "", ts[i]).forEach(function (m) {
          best = Math.max(best, v[1] * (m.begin ? 1 : 0.35));
        });
        term += best;
      });
      if (!term) return 0;  // alle termen moeten ergens voorkomen
      if (vouw(item.titel).indexOf(ts[i]) === 0) term += 3;  // titel begint ermee
      totaal += term;
    }
    return totaal;
  }

  function zoek(index, q) {
    var ts = termen(q);
    if (!ts.length) return [];
    return index.items
      .map(function (item) { return { item: item, score: score(item, ts) }; })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score || (b.item.datum || "").localeCompare(a.item.datum || ""); })
      .map(function (r) { return r.item; });
  }

  function suggesties(index, q, max) {
    var v = vouw(q.trim());
    if (!v) return [];
    var ts = termen(q);
    var bron = index.zoektermen || [];
    var begint = bron.filter(function (s) { return vouw(s).indexOf(v) === 0 && vouw(s) !== v; });
    var bevat = bron.filter(function (s) {
      return begint.indexOf(s) === -1 && vouw(s) !== v && ts.every(function (t) {
        return treffers(s, t).some(function (m) { return m.begin; });
      });
    });
    return begint.concat(bevat).slice(0, max);
  }

  // Getypte deel licht, de aanvulling vet (Figma: Suggestie).
  function suggestieHTML(s, q) {
    var v = vouw(s), qv = vouw(q.trim());
    if (qv && v.indexOf(qv) === 0) {
      return '<span class="search-suggestion-typed">' + esc(s.slice(0, qv.length)) + "</span>" + esc(s.slice(qv.length));
    }
    return markeer(s, termen(q), "search-suggestion-typed");
  }

  function metaTekst(item, metDatum) {
    var delen = [];
    if (item.soort === "kennisbank" && item.formaat) delen.push(item.formaat);
    if (item.soort === "agenda" && item.datum) delen.push(datumTekst(item.datum));
    if (item.gemeente) delen.push(item.gemeente);
    if (metDatum && item.soort === "nieuws" && item.datum) delen.push(datumTekst(item.datum));
    return delen.join(" · ");
  }

  var MAANDEN = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  function datumTekst(iso) {
    var d = iso.split("-");
    return parseInt(d[2], 10) + " " + MAANDEN[parseInt(d[1], 10) - 1] + " " + d[0];
  }

  function zoekUrl(q) { return ZOEKPAGINA + "?q=" + encodeURIComponent(q); }

  function knopHTML(tekst, href, extraKlasse) {
    return '<a href="' + esc(href) + '" class="button ' + (extraKlasse || "") + '">' +
      '<span class="button-pill"><span class="button-roll"><span class="button-roll-text">' + esc(tekst) + "</span></span></span>" +
      '<span class="button-arrow">' + SVG_PIJL + SVG_PIJL.replace("<svg ", '<svg class="button-arrow-in" ') + "</span></a>";
  }

  var bewegingUit = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* =================================================================
     OVERLAY
     ================================================================= */

  var overlay, paneel, invoer, lijst, kolommen, leegMelding, onderKnop, toetsen, veelBlok, trigger, laatsteFocus;
  var opties = [], actief = -1, open = false, indexData = null;

  function bouwOverlay() {
    overlay = document.createElement("div");
    overlay.className = "search-overlay";
    overlay.id = "lmo-zoek";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Zoeken in het leernetwerk");
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="search-scrim" data-zoek-sluit></div>' +
      '<div class="search-panel">' +
        '<div class="search-inner">' +
          '<div class="kicker search-kicker"><span class="kicker-dot"></span><span class="kicker-text">Zoeken in het leernetwerk</span></div>' +
          '<form class="search-bar" role="search" action="' + ZOEKPAGINA + '">' +
            '<label class="lmo-sr" for="lmo-zoek-invoer">Zoek in het leernetwerk</label>' +
            '<div class="search-field search-field-overlay">' + SVG_ZOEK +
              '<input id="lmo-zoek-invoer" class="search-input" type="search" name="q" autocomplete="off" spellcheck="false"' +
              ' placeholder="Zoek op onderwerp, gemeente of document" role="combobox" aria-autocomplete="list"' +
              ' aria-expanded="false" aria-controls="lmo-zoek-lijst">' +
            "</div>" +
            '<button type="submit" class="search-submit lmo-form-button" aria-label="Zoeken">' +
              '<span class="button-roll"><span class="button-roll-text">Zoeken</span></span>' +
              '<span class="lmo-form-button-icon">' + SVG_ZOEK + "</span>" +
            "</button>" +
          "</form>" +
          '<div class="search-keys" aria-hidden="true">' +
            '<span class="search-key-group"><kbd class="search-key">Enter</kbd>zoeken</span>' +
            '<span class="search-key-group"><kbd class="search-key">↑ ↓</kbd>kiezen</span>' +
            '<span class="search-key-group"><kbd class="search-key">Esc</kbd>sluiten</span>' +
          "</div>" +
          '<div class="search-columns" id="lmo-zoek-lijst" role="listbox" aria-label="Suggesties en resultaten"></div>' +
          '<p class="search-empty" role="status" aria-live="polite"></p>' +
          '<div class="search-footer">' +
            '<div class="search-popular"><span class="search-popular-label">Veel gezocht</span><span class="search-tags"></span></div>' +
            '<div class="search-all"></div>' +
          "</div>" +
        "</div>" +
      "</div>";
    document.body.appendChild(overlay);

    paneel = overlay.querySelector(".search-panel");
    invoer = overlay.querySelector("#lmo-zoek-invoer");
    kolommen = overlay.querySelector(".search-columns");
    leegMelding = overlay.querySelector(".search-empty");
    onderKnop = overlay.querySelector(".search-all");
    toetsen = overlay.querySelector(".search-keys");
    veelBlok = overlay.querySelector(".search-popular");

    overlay.addEventListener("click", function (e) {
      if (e.target.closest("[data-zoek-sluit]")) sluit();
    });
    overlay.querySelector(".search-bar").addEventListener("submit", function (e) {
      e.preventDefault();
      kies();
    });
    var wacht;
    invoer.addEventListener("input", function () {
      clearTimeout(wacht);
      wacht = setTimeout(teken, 60);
    });
    invoer.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); zet(actief + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); zet(actief - 1); }
    });
    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); sluit(); }
      else if (e.key === "Tab") vangFocus(e);
    });
    kolommen.addEventListener("mousemove", function (e) {
      var o = e.target.closest("[role=option]");
      if (o) zet(opties.indexOf(o), true);
    });
  }

  function teken() {
    var q = invoer.value;
    var heeft = q.trim().length > 0;
    var res = heeft ? zoek(indexData, q) : [];
    var sugg = heeft ? suggesties(indexData, q, 5) : [];
    var direct = res.slice(0, 3);
    var ts = termen(q);
    var html = "";

    if (sugg.length) {
      html += '<div class="search-column is-suggestions" role="group" aria-labelledby="lmo-zoek-kop-sugg">' +
        '<p class="search-column-heading" id="lmo-zoek-kop-sugg">Suggesties</p><div class="search-suggestion-list">' +
        sugg.map(function (s, i) {
          return '<a class="search-suggestion" role="option" id="lmo-zoek-s' + i + '" href="' + esc(zoekUrl(s)) + '">' +
            '<span class="search-suggestion-icon">' + SVG_ZOEK_KLEIN + "</span>" +
            '<span class="search-suggestion-text">' + suggestieHTML(s, q) + "</span>" +
            '<span class="search-arrow-box">' + SVG_PIJL_KLEIN + "</span></a>";
        }).join("") + "</div></div>";
    }
    if (direct.length) {
      html += '<div class="search-column is-direct" role="group" aria-labelledby="lmo-zoek-kop-direct">' +
        '<p class="search-column-heading" id="lmo-zoek-kop-direct">Direct naar</p><div class="search-direct-list">' +
        direct.map(function (item, i) {
          var soort = SOORTEN[item.soort] || SOORTEN.nieuws;
          var meta = metaTekst(item, false);
          return '<a class="search-direct" role="option" id="lmo-zoek-d' + i + '" href="' + esc(item.url || "#") + '">' +
            '<span class="search-icon-box">' + icoon(soort.icoon, "1.5rem") + "</span>" +
            '<span class="search-direct-text"><span class="search-label">' + esc(soort.naam) +
              (meta ? '<span class="search-separator" aria-hidden="true"></span><span class="search-label-meta">' + esc(meta) + "</span>" : "") +
            '</span><span class="search-direct-title">' + markeer(item.titel, ts, "search-highlight") + "</span></span>" +
            '<span class="search-arrow-box">' + SVG_PIJL_KLEIN + "</span></a>";
        }).join("") + "</div></div>";
    }
    kolommen.innerHTML = html;
    kolommen.hidden = !html;

    opties = [].slice.call(kolommen.querySelectorAll("[role=option]"));
    actief = -1;
    invoer.setAttribute("aria-expanded", String(opties.length > 0));
    invoer.removeAttribute("aria-activedescendant");
    if (sugg.length && window.matchMedia("(min-width: 768px)").matches) zet(0, true);

    leegMelding.textContent = heeft && !res.length
      ? "Geen resultaten voor “" + q.trim() + "”. Probeer een ander woord of een van de onderwerpen hieronder."
      : "";
    leegMelding.hidden = !leegMelding.textContent;

    toetsen.hidden = !heeft;
    onderKnop.innerHTML = res.length
      ? knopHTML("Alle " + res.length + " resultaten voor “" + q.trim() + "”", zoekUrl(q.trim()), "search-all-button")
      : "";
    var kort = onderKnop.querySelector(".button-roll-text");
    if (kort) kort.setAttribute("data-kort", "Alle " + res.length + " resultaten");
  }

  function zet(i, stil) {
    if (!opties.length) return;
    if (i < 0) i = opties.length - 1;
    if (i >= opties.length) i = 0;
    opties.forEach(function (o) { o.classList.remove("is-active"); o.setAttribute("aria-selected", "false"); });
    actief = i;
    var o = opties[i];
    o.classList.add("is-active");
    o.setAttribute("aria-selected", "true");
    invoer.setAttribute("aria-activedescendant", o.id);
    if (!stil) o.scrollIntoView({ block: "nearest" });
  }

  function kies() {
    var q = invoer.value.trim();
    // Alleen een expliciet met de pijltjes gekozen optie volgen; anders zoeken.
    var o = opties[actief];
    if (o && o.dataset.gekozen === "1") { window.location.href = o.getAttribute("href"); return; }
    if (q) window.location.href = zoekUrl(q);
  }

  function vulVeelGezocht() {
    var tags = overlay.querySelector(".search-tags");
    tags.innerHTML = (indexData.veelGezocht || []).map(function (t) {
      return '<a class="tag" href="' + esc(zoekUrl(t)) + '">' + esc(t) + "</a>";
    }).join("");
    veelBlok.hidden = !(indexData.veelGezocht || []).length;
  }

  function focusbaar() {
    var lijst = [].slice.call(overlay.querySelectorAll("a[href], button, input"))
      .filter(function (el) { return !el.closest("[hidden]") && el.offsetParent !== null; });
    if (trigger) lijst.unshift(trigger);
    return lijst;
  }

  function vangFocus(e) {
    var els = focusbaar();
    if (!els.length) return;
    var eerste = els[0], laatste = els[els.length - 1];
    if (e.shiftKey && document.activeElement === eerste) { e.preventDefault(); laatste.focus(); }
    else if (!e.shiftKey && document.activeElement === laatste) { e.preventDefault(); eerste.focus(); }
  }

  function openOverlay(beginTekst) {
    if (open) return;
    open = true;
    laatsteFocus = document.activeElement;
    laadIndex().then(function (data) {
      indexData = data;
      vulVeelGezocht();
      if (typeof beginTekst === "string") invoer.value = beginTekst;
      teken();
    });
    overlay.hidden = false;
    document.documentElement.classList.add("lmo-search-open");
    if (trigger) {
      trigger.setAttribute("aria-expanded", "true");
      trigger.setAttribute("aria-label", "Zoeken sluiten");
    }
    if (window.lmoLenis) window.lmoLenis.stop();

    var gsap = window.gsap;
    if (gsap && !bewegingUit.matches) {
      gsap.killTweensOf([overlay.querySelector(".search-scrim"), paneel]);
      gsap.fromTo(overlay.querySelector(".search-scrim"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power1.out" });
      gsap.fromTo(paneel, { yPercent: -100 }, { yPercent: 0, duration: 0.6, ease: "expo.out" });
      gsap.fromTo(overlay.querySelectorAll(".search-inner > *"), { autoAlpha: 0, y: "1rem" },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.04, delay: 0.15, clearProps: "transform,opacity,visibility" });
    }
    setTimeout(function () { invoer.focus(); invoer.select(); }, 30);
  }

  function sluit() {
    if (!open) return;
    open = false;
    document.documentElement.classList.remove("lmo-search-open");
    if (trigger) {
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-label", "Zoeken");
    }
    if (window.lmoLenis) window.lmoLenis.start();
    var klaar = function () { if (!open) overlay.hidden = true; };
    var gsap = window.gsap;
    if (gsap && !bewegingUit.matches) {
      gsap.to(overlay.querySelector(".search-scrim"), { autoAlpha: 0, duration: 0.25 });
      gsap.to(paneel, { yPercent: -100, duration: 0.4, ease: "power3.in", onComplete: klaar });
      setTimeout(klaar, 500);  // ook als de animatie niet afloopt (bijv. tab op de achtergrond)
    } else klaar();
    var terug = trigger || laatsteFocus;
    if (terug && terug.focus) terug.focus();
  }

  function initOverlay() {
    bouwOverlay();
    // Met pijltjes gekozen opties volgen bij Enter; muis-hover niet.
    invoer.addEventListener("keydown", function (e) {
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && opties[actief]) {
        opties.forEach(function (o) { delete o.dataset.gekozen; });
        opties[actief].dataset.gekozen = "1";
      }
    });

    trigger = document.querySelector(".nav .search-button");
    if (trigger) {
      trigger.setAttribute("href", ZOEKPAGINA);
      trigger.setAttribute("role", "button");
      trigger.setAttribute("aria-haspopup", "dialog");
      trigger.setAttribute("aria-controls", "lmo-zoek");
      trigger.setAttribute("aria-expanded", "false");
      if (!trigger.querySelector(".search-button-close")) {
        var sluitIcoon = document.createElement("span");
        sluitIcoon.className = "search-button-close";
        sluitIcoon.innerHTML = SVG_SLUIT + '<span class="search-button-close-text">Sluiten</span>';
        trigger.appendChild(sluitIcoon);
      }
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        open ? sluit() : openOverlay();
      });
      trigger.addEventListener("keydown", function (e) {
        if (e.key === " ") { e.preventDefault(); trigger.click(); }
      });
    }

    // "/" opent het zoeken, behalve als je al in een veld typt.
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || open || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      e.preventDefault();
      openOverlay();
    });
  }

  /* =================================================================
     HERO-FORMULIER, TAGS EN LINKS NAAR /zoeken
     ================================================================= */

  function initKoppelingen() {
    document.querySelectorAll(".hero-search form").forEach(function (form) {
      var veld = form.querySelector("input[type=search], input[type=text]");
      var knop = form.querySelector("[type=submit]");
      if (knop) {
        // Webflow zet de knop op disabled zolang zijn formulierbeveiliging laadt;
        // dit formulier verstuurt niets naar Webflow, dus de knop blijft bruikbaar.
        knop.removeAttribute("disabled");
        new MutationObserver(function () {
          if (knop.hasAttribute("disabled")) knop.removeAttribute("disabled");
        }).observe(knop, { attributes: true, attributeFilter: ["disabled"] });
      }
      var stuur = function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var q = veld ? veld.value.trim() : "";
        window.location.href = q ? zoekUrl(q) : ZOEKPAGINA;
      };
      form.addEventListener("submit", stuur, true);
      if (veld) veld.addEventListener("keydown", function (e) { if (e.key === "Enter") stuur(e); });
      if (knop) knop.addEventListener("click", stuur, true);
    });

    document.querySelectorAll(".popular-searches .tag").forEach(function (tag) {
      if (!tag.getAttribute("href") || tag.getAttribute("href") === "#") tag.setAttribute("href", zoekUrl(tag.textContent.trim()));
    });
    document.querySelectorAll("a").forEach(function (a) {
      if (a.getAttribute("href") === "#" && /^zoeken$/i.test(a.textContent.trim())) a.setAttribute("href", ZOEKPAGINA);
    });
  }

  /* =================================================================
     RESULTATENPAGINA
     ================================================================= */

  function initResultaten() {
    var doel = document.querySelector("[data-lmo-zoekresultaten]");
    if (!doel) return;
    var titelEl = document.querySelector("[data-lmo-zoektitel]");

    var staat = leesUrl();

    doel.innerHTML =
      '<form class="search-bar search-page-bar" role="search" action="' + ZOEKPAGINA + '">' +
        '<label class="lmo-sr" for="lmo-zoekpagina-invoer">Zoek in het leernetwerk</label>' +
        '<div class="search-field">' + SVG_ZOEK +
          '<input id="lmo-zoekpagina-invoer" class="search-input" type="search" name="q" autocomplete="off"' +
          ' placeholder="Zoek op onderwerp, gemeente of document">' +
        "</div>" +
        '<button type="submit" class="search-submit lmo-form-button" aria-label="Zoeken">' +
          '<span class="button-roll"><span class="button-roll-text">Zoeken</span></span>' +
          '<span class="lmo-form-button-icon">' + SVG_ZOEK + "</span>" +
        "</button>" +
      "</form>" +
      '<div class="search-page-list">' +
        '<div class="search-page-filters">' +
          '<div class="search-filters" role="group" aria-label="Filter op soort"></div>' +
          '<label class="search-sort"><span>Sorteer op</span>' +
            '<span class="search-sort-field"><select><option value="relevantie">Relevantie</option><option value="nieuwste">Nieuwste eerst</option></select>' + SVG_CHEVRON + "</span>" +
          "</label>" +
        "</div>" +
        '<p class="lmo-sr" role="status" aria-live="polite" data-zoek-status></p>' +
        '<ol class="search-results"></ol>' +
        '<div class="search-empty-page" hidden></div>' +
        '<nav class="search-pagination" aria-label="Paginering"></nav>' +
      "</div>";

    var form = doel.querySelector("form");
    var veld = doel.querySelector("input");
    var filters = doel.querySelector(".search-filters");
    var sorteer = doel.querySelector("select");
    var lijstEl = doel.querySelector(".search-results");
    var leeg = doel.querySelector(".search-empty-page");
    var pag = doel.querySelector(".search-pagination");
    var status = doel.querySelector("[data-zoek-status]");

    veld.value = staat.q;
    sorteer.value = staat.sort;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      staat.q = veld.value.trim();
      staat.soort = "";
      staat.pagina = 1;
      schrijfUrl(true);
      render();
    });
    filters.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-soort]");
      if (!b) return;
      staat.soort = b.dataset.soort;
      staat.pagina = 1;
      schrijfUrl(true);
      render();
    });
    sorteer.addEventListener("change", function () {
      staat.sort = sorteer.value;
      staat.pagina = 1;
      schrijfUrl(false);
      render();
    });
    pag.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pagina]");
      if (!b) return;
      e.preventDefault();
      staat.pagina = parseInt(b.dataset.pagina, 10);
      schrijfUrl(true);
      render();
      var top = doel.querySelector(".search-page-list");
      if (window.lmoLenis) window.lmoLenis.scrollTo(top, { offset: -120 });
      else top.scrollIntoView({ behavior: bewegingUit.matches ? "auto" : "smooth" });
    });
    window.addEventListener("popstate", function () {
      staat = leesUrl();
      veld.value = staat.q;
      sorteer.value = staat.sort;
      render();
    });

    function leesUrl() {
      var p = new URLSearchParams(window.location.search);
      return {
        q: (p.get("q") || p.get("query") || "").trim(),
        soort: p.get("soort") || "",
        sort: p.get("sort") === "nieuwste" ? "nieuwste" : "relevantie",
        pagina: Math.max(1, parseInt(p.get("pagina"), 10) || 1)
      };
    }

    function schrijfUrl(nieuw) {
      var p = new URLSearchParams();
      if (staat.q) p.set("q", staat.q);
      if (staat.soort) p.set("soort", staat.soort);
      if (staat.sort !== "relevantie") p.set("sort", staat.sort);
      if (staat.pagina > 1) p.set("pagina", staat.pagina);
      var url = ZOEKPAGINA + (p.toString() ? "?" + p : "");
      history[nieuw ? "pushState" : "replaceState"](null, "", url);
    }

    var data;
    function render() {
      if (!data) return;
      var ts = termen(staat.q);
      var alle = staat.q ? zoek(data, staat.q) : [];
      if (staat.sort === "nieuwste") {
        alle = alle.slice().sort(function (a, b) { return (b.datum || "").localeCompare(a.datum || ""); });
      }
      var tellingen = {};
      alle.forEach(function (i) { tellingen[i.soort] = (tellingen[i.soort] || 0) + 1; });
      if (staat.soort && !tellingen[staat.soort]) staat.soort = "";
      var gefilterd = staat.soort ? alle.filter(function (i) { return i.soort === staat.soort; }) : alle;

      var paginas = Math.max(1, Math.ceil(gefilterd.length / PER_PAGINA));
      if (staat.pagina > paginas) staat.pagina = paginas;
      var van = (staat.pagina - 1) * PER_PAGINA;
      var deze = gefilterd.slice(van, van + PER_PAGINA);

      // kop
      var kop = !staat.q ? "Zoeken"
        : !alle.length ? "Geen resultaten voor “" + staat.q + "”"
        : alle.length === 1 ? "1 resultaat voor “" + staat.q + "”"
        : alle.length + " resultaten voor “" + staat.q + "”";
      if (titelEl) titelEl.textContent = kop;
      document.title = (staat.q ? kop : "Zoeken") + " – Leernetwerk Menswaardige Opvang";

      // filters
      var knoppen = [["", "Alles", alle.length]].concat(SOORT_VOLGORDE
        .filter(function (s) { return tellingen[s]; })
        .map(function (s) { return [s, SOORTEN[s].meervoud, tellingen[s]]; }));
      filters.innerHTML = alle.length ? knoppen.map(function (k) {
        var aan = staat.soort === k[0];
        return '<button type="button" class="search-filter' + (aan ? " is-active" : "") + '" data-soort="' + k[0] + '" aria-pressed="' + aan + '">' +
          '<span class="search-filter-label">' + esc(k[1]) + '</span><span class="search-filter-count">' + k[2] + "</span></button>";
      }).join("") : "";
      doel.querySelector(".search-page-filters").hidden = !alle.length;

      // resultaten
      lijstEl.innerHTML = deze.map(function (item) {
        var soort = SOORTEN[item.soort] || SOORTEN.nieuws;
        var meta = metaTekst(item, true);
        return '<li class="search-result' + (item.beeld ? " has-image" : "") + '">' +
          '<a class="search-result-link" href="' + esc(item.url || "#") + '">' +
            '<span class="lmo-tile" data-directional-hover-tile></span>' +
            '<span class="search-result-text">' +
              '<span class="search-label"><span class="search-label-icon">' + icoon(soort.icoon, "1rem") + "</span>" + esc(soort.naam) +
                (meta ? '<span class="search-separator" aria-hidden="true"></span><span class="search-label-meta">' + esc(meta) + "</span>" : "") +
              "</span>" +
              '<span class="search-result-title">' + markeer(item.titel, ts, "search-highlight") + "</span>" +
              '<span class="search-result-summary">' + markeer(item.samenvatting || "", ts, "search-bold") + "</span>" +
            "</span>" +
            (item.beeld ? '<img class="search-result-image" src="' + esc(item.beeld) + '" alt="" loading="lazy">' : "") +
            '<span class="search-arrow-box">' + SVG_PIJL_KLEIN + "</span>" +
          "</a></li>";
      }).join("");
      lijstEl.hidden = !deze.length;
      lijstEl.querySelectorAll(".search-result-link").forEach(richtingHover);

      // leeg
      if (!staat.q) {
        leeg.innerHTML = '<p class="search-empty-text">Waar ben je naar op zoek? Zoek op onderwerp, gemeente of document.</p>' + veelHTML();
      } else if (!alle.length) {
        leeg.innerHTML = '<p class="search-empty-text">Niets gevonden voor “' + esc(staat.q) + '”. Controleer de spelling, gebruik minder woorden of kies een van deze onderwerpen.</p>' + veelHTML();
      }
      leeg.hidden = alle.length > 0;

      // paginering
      if (gefilterd.length > PER_PAGINA) {
        var html = '<p class="search-counter">Resultaat ' + (van + 1) + "–" + (van + deze.length) + " van " + gefilterd.length + "</p><div class=\"zoek-paginas\">";
        for (var p = 1; p <= paginas; p++) {
          html += p === staat.pagina
            ? '<span class="search-page-link is-active" aria-current="page">' + p + "</span>"
            : '<a class="search-page-link" href="' + paginaUrl(p) + '" data-pagina="' + p + '" aria-label="Pagina ' + p + '">' + p + "</a>";
        }
        if (staat.pagina < paginas) {
          html += '<a class="search-page-link is-next" href="' + paginaUrl(staat.pagina + 1) + '" data-pagina="' + (staat.pagina + 1) + '" aria-label="Volgende pagina">' + SVG_PIJL + "</a>";
        }
        pag.innerHTML = html + "</div>";
      } else {
        pag.innerHTML = gefilterd.length ? '<p class="search-counter">' + gefilterd.length + (gefilterd.length === 1 ? " resultaat" : " resultaten") + "</p>" : "";
      }

      status.textContent = staat.q ? kop + (staat.soort ? ", gefilterd op " + SOORTEN[staat.soort].meervoud.toLowerCase() : "") : "";
    }

    function paginaUrl(p) {
      var u = new URLSearchParams(window.location.search);
      u.set("pagina", p);
      return ZOEKPAGINA + "?" + u;
    }

    function veelHTML() {
      var t = (data.veelGezocht || []);
      return t.length ? '<div class="search-popular is-page"><span class="search-popular-label">Veel gezocht</span><span class="search-tags">' +
        t.map(function (x) { return '<a class="tag" href="' + esc(zoekUrl(x)) + '">' + esc(x) + "</a>"; }).join("") + "</span></div>" : "";
    }

    // Zoekresultaten rollen als nieuws/themalijst: tegel vanaf de kant van de muis.
    function richtingHover(item) {
      var tegel = item.querySelector("[data-directional-hover-tile]");
      item.setAttribute("data-directional-hover-item", "");
      var kant = function (e) {
        var r = item.getBoundingClientRect();
        return e.clientY - r.top < r.height / 2 ? "top" : "bottom";
      };
      var naar = { top: "translateY(-100%)", bottom: "translateY(100%)" };
      item.addEventListener("mouseenter", function (e) {
        var k = kant(e);
        tegel.style.transition = "none";
        tegel.style.transform = naar[k];
        void tegel.offsetHeight;
        tegel.style.transition = "";
        tegel.style.transform = "translate(0%, 0%)";
        item.setAttribute("data-status", "enter-" + k);
      });
      item.addEventListener("mouseleave", function (e) {
        var k = kant(e);
        item.setAttribute("data-status", "leave-" + k);
        tegel.style.transform = naar[k];
      });
    }

    laadIndex().then(function (d) { data = d; render(); });
  }

  /* ---------- start ---------- */

  function start() {
    initKoppelingen();
    initOverlay();
    initResultaten();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
