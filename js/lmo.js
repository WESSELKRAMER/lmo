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

  // ScrollTrigger meet zelf opnieuw bij resize; na het laden van afbeeldingen
  // verschuiven posities nog, dus dan één keer extra meten.
  if (window.ScrollTrigger) {
    window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
  }
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
   Logo-marquee: pauzeknop (Figma: "bouw op de site een pauzeknop in").
   --------------------------------------------------------------- */
(function () {
  var sectie = document.querySelector(".logos");
  if (!sectie || sectie.querySelector(".logos-pauze")) return;
  var knop = document.createElement("button");
  knop.type = "button";
  knop.className = "logos-pauze";
  knop.setAttribute("aria-pressed", "false");
  knop.setAttribute("aria-label", "Logo's pauzeren");
  knop.innerHTML =
    '<svg class="is-pauze" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>' +
    '<svg class="is-speel" aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 2.9v10.2a.8.8 0 0 0 1.2.7l8.2-5.1a.8.8 0 0 0 0-1.4L5.7 2.2a.8.8 0 0 0-1.2.7z"/></svg>';
  knop.addEventListener("click", function () {
    var gepauzeerd = sectie.classList.toggle("is-gepauzeerd");
    knop.setAttribute("aria-pressed", String(gepauzeerd));
    knop.setAttribute("aria-label", gepauzeerd ? "Logo's afspelen" : "Logo's pauzeren");
  });
  sectie.appendChild(knop);
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
