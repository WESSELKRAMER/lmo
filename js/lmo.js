/* Leernetwerk Menswaardige Opvang — animaties (GSAP + ScrollTrigger).
   Geladen in Site settings › Custom code › Footer, ná gsap en ScrollTrigger.

   Gebruik in Webflow via een custom attribute op een element:
     data-lmo="fade-up"   schuift omhoog en vervaagt in bij in beeld komen
     data-lmo="fade"      alleen invagen
     data-lmo-stagger     de directe kinderen komen na elkaar in beeld
   Bij prefers-reduced-motion wordt er niets geanimeerd en scrolt de pagina gewoon.

   Lenis (smooth scroll) loopt op de GSAP-ticker, zodat ScrollTrigger en Lenis
   precies gelijk lopen. Bereikbaar als window.lmoLenis, bijv. om te stoppen
   bij een open menu: lmoLenis.stop() / lmoLenis.start().
   Een element dat zelf scrolt krijgt data-lenis-prevent. */

(function () {
  if (!window.gsap) {
    console.warn("[lmo] GSAP niet geladen");
    return;
  }

  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  document.documentElement.classList.add("lmo-js");

  // Animaties per Webflow-klasse. Werkt hetzelfde als het attribute in de
  // Designer zetten; handig voor terugkerende onderdelen.
  var perKlasse = {
    "fade-up": [".themas-intro", ".gemeenten-blok", ".kerncijfers-intro", ".evenement",
                ".sectie-kop", ".praktijkkaarten", ".beeldtekst-inhoud", ".nieuwsbrief-blok"],
    "fade":    [".beeldtekst-foto"],
    "stagger": [".themalijst", ".cijfers", ".tijdlijn"]
  };
  Object.keys(perKlasse).forEach(function (soort) {
    document.querySelectorAll(perKlasse[soort].join(",")).forEach(function (el) {
      if (soort === "stagger") el.setAttribute("data-lmo-stagger", "");
      else if (!el.hasAttribute("data-lmo")) el.setAttribute("data-lmo", soort);
    });
  });

  function inBeeld(el, vars) {
    return gsap.from(el, Object.assign({
      autoAlpha: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true }
    }, vars));
  }

  var mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", function () {
    if (window.Lenis) {
      var lenis = new window.Lenis({ autoRaf: false });
      var tick = function (tijd) { lenis.raf(tijd * 1000); };
      if (window.ScrollTrigger) lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      window.lmoLenis = lenis;

      // Opruimen als de gebruiker alsnog 'minder beweging' aanzet.
      return function () {
        gsap.ticker.remove(tick);
        lenis.destroy();
        window.lmoLenis = null;
      };
    }
  });

  mm.add("(prefers-reduced-motion: no-preference)", function () {
    gsap.utils.toArray('[data-lmo="fade-up"]').forEach(function (el) {
      inBeeld(el, { y: "2rem" });
    });

    gsap.utils.toArray('[data-lmo="fade"]').forEach(function (el) {
      inBeeld(el, {});
    });

    gsap.utils.toArray("[data-lmo-stagger]").forEach(function (lijst) {
      gsap.from(lijst.children, {
        autoAlpha: 0,
        y: "1.5rem",
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: lijst, start: "top 85%", once: true }
      });
    });
  });

  /* Hero-vormen — Figma: "elke 2,5 s schuiven de vormen één vak met de
     klok mee (ease in-out, 0,9 s); elke vorm draait per stap 90° mee".
     Raster 2×2: boog linksboven, cirkel rechtsboven, blad linksonder,
     kwart rechtsonder. Stapt alleen als de hero in beeld is. */
  mm.add("(prefers-reduced-motion: no-preference)", function () {
    var raster = document.querySelector(".vormen");
    if (!raster) return;
    var vormen = gsap.utils.toArray(".vormen > .vorm");
    if (vormen.length !== 4) return;

    // vakken met de klok mee: 0 linksboven, 1 rechtsboven, 2 rechtsonder, 3 linksonder
    var vak = [[0, 0], [1, 0], [1, 1], [0, 1]];
    var start = [0, 1, 3, 2];  // DOM-volgorde → vak

    function stap() {
      // offsetLeft/offsetWidth negeren transforms, dus ook mid-animatie juist
      return ((vormen[1].offsetLeft - vormen[0].offsetLeft) / vormen[0].offsetWidth) * 100;
    }

    function naarStap(k) {
      return {
        xPercent: function (i) { return (vak[(start[i] + k) % 4][0] - vak[start[i]][0]) * stap(); },
        yPercent: function (i) { return (vak[(start[i] + k) % 4][1] - vak[start[i]][1]) * stap(); },
        rotation: k * 90,
        duration: 0.9,
        ease: "power1.inOut"
      };
    }

    var tl = gsap.timeline({ repeat: -1, paused: true });
    for (var k = 1; k <= 4; k++) tl.to(vormen, naarStap(k), (k - 1) * 2.5 + 1.6);
    tl.set({}, {}, 10);  // 4 stappen × 2,5 s, daarna naadloos opnieuw (360° = 0°)

    var st = window.ScrollTrigger && window.ScrollTrigger.create({
      trigger: ".hero",
      start: "top bottom",
      end: "bottom top",
      onToggle: function (self) { self.isActive ? tl.play() : tl.pause(); }
    });
    if (!st) tl.play();

    // Andere breakpoint = andere maten: afstanden opnieuw laten meten.
    var opnieuw = function () { tl.invalidate(); };
    if (window.ScrollTrigger) window.ScrollTrigger.addEventListener("refresh", opnieuw);

    return function () {
      if (window.ScrollTrigger) window.ScrollTrigger.removeEventListener("refresh", opnieuw);
      tl.kill();
      gsap.set(vormen, { clearProps: "transform" });
    };
  });

  /* Kerncijfers tellen op als ze in beeld komen (alleen hele getallen;
     "20 mei" blijft staan). De echte waarde staat in de HTML. */
  mm.add("(prefers-reduced-motion: no-preference)", function () {
    var getallen = [];
    gsap.utils.toArray(".cijfer").forEach(function (el) {
      var tekst = el.textContent.trim();
      if (!/^\d+$/.test(tekst)) return;
      var doel = parseInt(tekst, 10);
      getallen.push([el, tekst]);
      var teller = { n: 0 };
      el.textContent = "0";
      gsap.to(teller, {
        n: doel,
        duration: 1.4,
        ease: "power2.out",
        onUpdate: function () { el.textContent = Math.round(teller.n); },
        onComplete: function () { el.textContent = tekst; },
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });
    return function () { getallen.forEach(function (g) { g[0].textContent = g[1]; }); };
  });

  /* Golven (hero-onderkant en footer-bovenkant): één keer een zachte golf
     door de lijn als hij in beeld komt. Alleen de curvepunten (C) bewegen;
     de rechte randen blijven staan. De uitslag zwelt aan en dooft uit,
     dus de vorm eindigt precies zoals hij in Webflow staat. */
  mm.add("(prefers-reduced-motion: no-preference)", function () {
    var golven = gsap.utils.toArray(".hero-golf path, .footer-golf path");
    var tweens = [];
    golven.forEach(function (pad) {
      var origineel = pad.getAttribute("d");
      var vb = pad.ownerSVGElement && pad.ownerSVGElement.viewBox.baseVal;
      var breedte = (vb && vb.width) || 1440;
      var hoogte = (vb && vb.height) || 160;
      var amplitude = hoogte * 0.045;  // ± 7 van 160: subtiel

      // Splits in stukken: commando's blijven tekst, coördinaten worden getallen.
      var stukken = origineel.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g);
      var buig = function (t) {
        var omhulling = Math.sin(Math.PI * t);                // 0 → 1 → 0
        var fase = t * Math.PI * 2;                            // één lange golf schuift van links naar rechts
        var verschuif = function (x) {
          return amplitude * omhulling * Math.sin((x / breedte) * Math.PI * 2 - fase);
        };
        // Elk punt van de lijn beweegt mee (ankers én handvatten, ook het
        // begin- en eindpunt), zodat de golf één doorlopend geheel blijft.
        // Alleen de onderrand (V tot onderaan, H) blijft staan.
        var uit = [], cmd = "", n = 0, x = 0;
        for (var i = 0; i < stukken.length; i++) {
          var st = stukken[i];
          if (/[A-Za-z]/.test(st)) { cmd = st.toUpperCase(); n = 0; uit.push(st); continue; }
          var v = parseFloat(st);
          if (cmd === "M" || cmd === "C" || cmd === "L") {
            if (n % 2 === 0) x = v;
            else v += verschuif(x);
          } else if (cmd === "H") {
            x = v;
          } else if (cmd === "V") {
            if (v < hoogte * 0.98) v += verschuif(x);
          }
          uit.push(Math.round(v * 100) / 100);
          n++;
        }
        return uit.join(" ");
      };

      var staat = { t: 0 };
      var tw = gsap.to(staat, {
        t: 1,
        duration: 2.6,
        ease: "sine.inOut",
        onUpdate: function () { pad.setAttribute("d", buig(staat.t)); },
        onComplete: function () { pad.setAttribute("d", origineel); },
        scrollTrigger: { trigger: pad.closest(".hero-golf, .footer-golf"), start: "top 95%", once: true }
      });
      tweens.push([tw, pad, origineel]);
    });
    return function () {
      tweens.forEach(function (x) { x[0].kill(); x[1].setAttribute("d", x[2]); });
    };
  });

  // ScrollTrigger meet zelf opnieuw bij resize; na het laden van afbeeldingen
  // verschuiven posities nog, dus dan één keer extra meten.
  if (window.ScrollTrigger) {
    window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
  }
})();


/* ---------------------------------------------------------------
   Nav-items: tekst in een rol-span (rolt bij hover omhoog). CSS in lmo.css.
   --------------------------------------------------------------- */
(function () {
  document.querySelectorAll(".nav-link").forEach(function (link) {
    if (link.querySelector(".nav-rol") || link.children.length) return;
    var tekst = link.textContent.trim();
    if (!tekst) return;
    link.innerHTML = '<span class="nav-rol"><span class="nav-rol-tekst"></span></span>';
    link.querySelector(".nav-rol-tekst").textContent = tekst;
  });
})();


/* ---------------------------------------------------------------
   Knoppen: tekst in een rol-span (rolt bij hover omhoog) en een
   tweede pijl die bij hover van links binnenschuift. CSS in lmo.css.
   --------------------------------------------------------------- */
(function () {
  document.querySelectorAll(".knop").forEach(function (knop) {
    var pil = knop.querySelector(".knop-pil");
    if (pil && pil.children.length === 0 && pil.textContent.trim()) {
      var rol = document.createElement("span");
      rol.className = "knop-rol";
      var tekst = document.createElement("span");
      tekst.className = "knop-rol-tekst";
      tekst.textContent = pil.textContent.trim();
      rol.appendChild(tekst);
      pil.textContent = "";
      pil.appendChild(rol);
    }

    var pijl = knop.querySelector(".knop-pijl svg");
    if (pijl && !knop.querySelector(".knop-pijl-in")) {
      var kopie = pijl.cloneNode(true);
      kopie.classList.add("knop-pijl-in");
      pijl.parentNode.appendChild(kopie);
    }
  });
})();


/* ---------------------------------------------------------------
   Lijsten (thema's en nieuws): koppelen aan de Directional List Hover
   hieronder. Webflow-markup blijft zoals hij is; attributen en tegels
   komen hier.
   --------------------------------------------------------------- */
(function () {
  [[".themalijst", ".themarij"], [".tijdlijn", ".nieuwsitem"]].forEach(function (paar) {
    document.querySelectorAll(paar[0]).forEach(function (lijst) {
      lijst.setAttribute("data-directional-hover", "");
      lijst.setAttribute("data-type", "y");
      lijst.querySelectorAll(paar[1]).forEach(function (rij) {
        rij.setAttribute("data-directional-hover-item", "");
        if (!rij.querySelector("[data-directional-hover-tile]")) {
          var tegel = document.createElement("div");
          tegel.className = "lmo-tegel";
          tegel.setAttribute("data-directional-hover-tile", "");
          rij.insertBefore(tegel, rij.firstChild);
        }
      });
    });
  });
})();


/* ---------------------------------------------------------------
   Tekstlinks: tweede pijl vóór het label; bij hover wisselt de pijl
   van rechts naar links (Figma: Tekstlink › Hover).
   --------------------------------------------------------------- */
(function () {
  document.querySelectorAll(".tekstlink").forEach(function (link) {
    var pijl = link.querySelector(".tekstlink-pijl");
    if (!pijl || link.querySelector(".tekstlink-pijl.is-voor")) return;
    var voor = pijl.cloneNode(true);
    voor.classList.add("is-voor");
    voor.setAttribute("aria-hidden", "true");
    link.insertBefore(voor, link.firstChild);
  });
})();
/* ---------------------------------------------------------------
   Directional List Hover — Osmo Supply (ongewijzigd overgenomen)
   --------------------------------------------------------------- */
function initDirectionalListHover() {

  const directionMap = {
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)',
    left: 'translateX(-100%)',
    right: 'translateX(100%)'
  };

  document.querySelectorAll('[data-directional-hover]').forEach(container => {
    const type = container.getAttribute('data-type') || 'all';

    container.querySelectorAll('[data-directional-hover-item]').forEach(item => {
      const tile = item.querySelector('[data-directional-hover-tile]');
      if (!tile) return;

      item.addEventListener('mouseenter', e => {
        const dir = getDirection(e, item, type);
        tile.style.transition = 'none';
        tile.style.transform = directionMap[dir] || 'translate(0, 0)';
        void tile.offsetHeight;
        tile.style.transition = '';
        tile.style.transform = 'translate(0%, 0%)';
        item.setAttribute('data-status', `enter-${dir}`);
      });

      item.addEventListener('mouseleave', e => {
        const dir = getDirection(e, item, type);
        item.setAttribute('data-status', `leave-${dir}`);
        tile.style.transform = directionMap[dir] || 'translate(0, 0)';
      });
    });

    function getDirection(event, el, type) {
      const { left, top, width: w, height: h } = el.getBoundingClientRect();
      const x = event.clientX - left;
      const y = event.clientY - top;

      if (type === 'y') return y < h / 2 ? 'top' : 'bottom';
      if (type === 'x') return x < w / 2 ? 'left' : 'right';

      const distances = {
        top: y,
        right: w - x,
        bottom: h - y,
        left: x
      };

      return Object.entries(distances).reduce((a, b) => (a[1] < b[1] ? a : b))[0];
    }
  });
}

// Initialize Directional List Hover
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDirectionalListHover();
  });
} else {
  initDirectionalListHover();
}


/* ---------------------------------------------------------------
   Gemeenten (homepage) — kaart, chips en kaartje uit het CMS.
   Webflow: een verborgen collectielijst .gemeenten-data met per item
   data-attributen (data-gemeente, data-slug, data-azc, data-gemeentelijk,
   data-amv, data-uitdaging, data-goed-in, data-x, data-y, data-volgorde).
   Gemeenten met een kaartpositie krijgen een punt en een chip; de rest
   telt mee in "+ … gemeenten". Zonder CMS-data blijft de statische
   versie uit Webflow staan.
   --------------------------------------------------------------- */
(function () {
  var blok = document.querySelector(".gemeenten-blok");
  if (!blok) return;
  var bron = [].slice.call(blok.querySelectorAll(".gemeenten-data [data-gemeente]"));
  if (!bron.length) return;

  var getal = function (v) { var n = parseFloat(v); return isNaN(n) ? null : n; };
  var gemeenten = bron.map(function (el) {
    var d = el.dataset;
    return {
      naam: d.gemeente,
      slug: d.slug,
      azc: d.azc || "–",
      gemeentelijk: d.gemeentelijk || "–",
      amv: d.amv || "–",
      uitdaging: d.uitdaging || "",
      goedIn: d.goedIn || "",
      x: getal(d.x),
      y: getal(d.y),
      volgorde: getal(d.volgorde)
    };
  }).sort(function (a, b) {
    return (a.volgorde == null ? 999 : a.volgorde) - (b.volgorde == null ? 999 : b.volgorde);
  });

  var opKaart = gemeenten.filter(function (g) { return g.x != null && g.y != null; });
  var overig = gemeenten.length - opKaart.length;
  if (!opKaart.length) return;

  var kaart = blok.querySelector(".kaart");
  var chips = blok.querySelector(".chips");
  var popup = blok.querySelector(".popup");
  var punten = {}, chipEls = {};

  // kaartpunten
  if (kaart) {
    kaart.querySelectorAll(".kaartpunt").forEach(function (p) { p.remove(); });
    opKaart.forEach(function (g) {
      var p = document.createElement("button");
      p.type = "button";
      p.className = "kaartpunt";
      p.style.left = g.x + "%";
      p.style.top = g.y + "%";
      p.setAttribute("aria-label", g.naam);
      p.setAttribute("aria-pressed", "false");
      p.addEventListener("click", function () { kies(g, true); });
      kaart.appendChild(p);
      punten[g.slug] = p;
    });
  }

  // chips
  if (chips) {
    chips.innerHTML = "";
    opKaart.forEach(function (g) {
      var c = document.createElement("button");
      c.type = "button";
      c.className = "chip";
      c.setAttribute("aria-pressed", "false");
      c.innerHTML = '<span class="chip-punt"></span>';
      c.appendChild(document.createTextNode(g.naam));
      c.addEventListener("click", function () { kies(g, true); });
      chips.appendChild(c);
      chipEls[g.slug] = c;
    });
    if (overig > 0) {
      var meer = document.createElement("a");
      meer.className = "chip";
      meer.href = "#";
      meer.innerHTML = '<span class="chip-punt is-hol"></span>';
      meer.appendChild(document.createTextNode("+ " + overig + (overig === 1 ? " gemeente" : " gemeenten")));
      chips.appendChild(meer);
    }
  }

  if (popup) popup.setAttribute("aria-live", "polite");

  var zet = function (sel, tekst) { var el = popup && popup.querySelector(sel); if (el) el.textContent = tekst; };

  function kies(g, animeer) {
    Object.keys(punten).forEach(function (s) {
      var aan = s === g.slug;
      punten[s].classList.toggle("is-actief", aan);
      punten[s].setAttribute("aria-pressed", String(aan));
    });
    Object.keys(chipEls).forEach(function (s) {
      var aan = s === g.slug;
      chipEls[s].classList.toggle("is-actief", aan);
      chipEls[s].setAttribute("aria-pressed", String(aan));
      var punt = chipEls[s].querySelector(".chip-punt");
      if (punt) punt.classList.toggle("is-actief", aan);
    });
    if (!popup) return;

    var vul = function () {
      zet(".popup-titel .h3", g.naam);
      var getallen = popup.querySelectorAll(".opvang-getal");
      [g.azc, g.gemeentelijk, g.amv].forEach(function (n, i) { if (getallen[i]) getallen[i].textContent = n; });
      var citaat = popup.querySelector(".popup-citaat");
      if (citaat) {
        citaat.textContent = g.uitdaging ? "“" + g.uitdaging + "”" : "";
        citaat.closest(".popup-blok").hidden = !g.uitdaging;
      }
      var tag = popup.querySelector(".popup-blok .tag");
      if (tag) {
        tag.textContent = g.goedIn;
        tag.href = "/zoeken?q=" + encodeURIComponent(g.goedIn);
        tag.closest(".popup-blok").hidden = !g.goedIn;
      }
      var knop = popup.querySelector(".knop");
      if (knop) {
        knop.href = "/gemeenten/" + g.slug;
        var t = knop.querySelector(".knop-rol-tekst") || knop.querySelector(".knop-pil");
        if (t) t.textContent = "Naar " + g.naam;
      }
    };

    var gsap = window.gsap;
    var stil = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animeer && gsap && !stil) {
      var delen = popup.children;
      gsap.killTweensOf(delen);
      gsap.to(delen, {
        autoAlpha: 0, y: "-0.5rem", duration: 0.18, ease: "power1.in", stagger: 0.02,
        onComplete: function () {
          vul();
          gsap.fromTo(delen, { autoAlpha: 0, y: "0.75rem" },
            { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.04, clearProps: "transform,opacity,visibility" });
        }
      });
    } else vul();
  }

  kies(opKaart[0], false);
})();
