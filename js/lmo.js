/* Leernetwerk Menswaardige Opvang — animaties (GSAP + ScrollTrigger).
   Geladen in Site settings › Custom code › Footer. GSAP en ScrollTrigger komen uit
   Webflow zelf (Site settings › GSAP-integratie).

   Gebruik in Webflow via een custom attribute op een element:
     data-lmo="fade-up"   schuift omhoog en vervaagt in bij in beeld komen
     data-lmo="fade"      alleen invagen
     data-lmo-stagger     de directe kinderen komen na elkaar in beeld
   Bij prefers-reduced-motion wordt er niets geanimeerd en scrolt de pagina gewoon.

   Lenis (smooth scroll) loopt op de GSAP-ticker, zodat ScrollTrigger en Lenis
   precies gelijk lopen. Bereikbaar als window.lmoLenis, bijv. om te stoppen
   bij een open menu: lmoLenis.stop() / lmoLenis.start().
   Een element dat zelf scrolt krijgt data-lenis-prevent. */

(function start() {
  // GSAP komt uit Webflow (Site settings › GSAP). Is het er nog niet als dit
  // script draait, dan wachten we tot de pagina geladen is.
  if (!window.gsap) {
    if (!start.wacht) { start.wacht = true; window.addEventListener("load", start); }
    else console.warn("[lmo] GSAP niet geladen");
    return;
  }

  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  document.documentElement.classList.add("lmo-js");

  // Animaties per Webflow-klasse. Werkt hetzelfde als het attribute in de
  // Designer zetten; handig voor terugkerende onderdelen.
  var perKlasse = {
    "fade-up": [".themes-intro", ".municipalities-block", ".key-figures-intro", ".event",
                ".section-header", ".practice-cards", ".image-text-content", ".newsletter-block"],
    "fade":    [".image-text-photo"],
    "stagger": [".theme-list", ".figures", ".timeline"]
  };
  // Sections van /components (bouwstenen voor nieuwe pagina's).
  var perKlasseBouwstenen = {
    "fade-up": [".statement", ".cta-banner", ".media-block", ".split-hero-content", ".testimonial",
                ".table-block", ".article-body", ".stats-intro", ".faq-side", ".sticky-split-side",
                ".image-hero-content", ".stage-hero-content", ".arch-hero-content"],
    "stagger": [".feature-grid", ".step-list", ".team-grid", ".event-list", ".file-list", ".member-grid",
                ".route-grid", ".stats-row", ".sticky-split-list", ".milestone-list", ".accordion", ".slider-track"]
  };
  Object.keys(perKlasse).forEach(function (soort) {
    perKlasse[soort] = perKlasse[soort].concat(perKlasseBouwstenen[soort] || []);
  });
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
    var raster = document.querySelector(".shapes");
    if (!raster) return;
    var vormen = gsap.utils.toArray(".shapes > .shape");
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
    gsap.utils.toArray(".figure").forEach(function (el) {
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

  /* Hero's met beeld (/components 02B–02D):
     - 02B: foto zoomt bij het laden rustig uit en schuift bij scrollen
       iets langzamer mee (parallax).
     - 02D: koraal cirkel groeit, infokaart schuift omhoog. */
  mm.add("(prefers-reduced-motion: no-preference)", function () {
    gsap.utils.toArray(".image-hero").forEach(function (hero) {
      var foto = hero.querySelector(".image-hero-photo");
      if (!foto) return;
      gsap.fromTo(foto, { scale: 1.12 }, { scale: 1, duration: 1.8, ease: "power2.out" });
      if (window.ScrollTrigger) {
        gsap.to(foto, { yPercent: 12, ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      }
    });
    gsap.utils.toArray(".arch-hero-visual").forEach(function (v) {
      var st = { trigger: v, start: "top 85%", once: true };
      var cirkel = v.querySelector(".arch-hero-circle");
      var kaart = v.querySelector(".arch-hero-card");
      var beeld = v.querySelector(".arch-hero-media");
      if (beeld) gsap.from(beeld, { clipPath: "inset(100% 0% 0% 0% round 999px 999px 24px 24px)", duration: 1.2, ease: "power3.inOut", scrollTrigger: st });
      if (cirkel) gsap.from(cirkel, { scale: 0, duration: 0.9, ease: "back.out(1.6)", delay: 0.5, scrollTrigger: st });
      if (kaart) gsap.from(kaart, { autoAlpha: 0, y: "1.5rem", duration: 0.7, ease: "power3.out", delay: 0.8, scrollTrigger: st });
    });
  });

  /* Tijdlijn: de koraal lijn groeit mee met scrollen; bolletjes die
     gepasseerd zijn krijgen een koraal rand. */
  mm.add("(prefers-reduced-motion: no-preference)", function () {
    if (!window.ScrollTrigger) return;
    var triggers = gsap.utils.toArray(".milestone-list").map(function (lijst) {
      var stukken = [].slice.call(lijst.querySelectorAll(".milestone"));
      if (stukken.length < 2) return null;
      var n = stukken.length - 1;
      return window.ScrollTrigger.create({
        trigger: lijst,
        start: "top 65%",
        end: "bottom 65%",
        scrub: 0.4,
        onUpdate: function (self) {
          var p = self.progress * n;
          stukken.forEach(function (m, i) {
            m.style.setProperty("--fill", Math.max(0, Math.min(1, p - i)).toFixed(3));
            m.classList.toggle("is-passed", p >= i);
          });
        }
      });
    });
    return function () {
      triggers.forEach(function (t) { if (t) t.kill(); });
      document.querySelectorAll(".milestone").forEach(function (m) {
        m.style.removeProperty("--fill");
        m.classList.remove("is-passed");
      });
    };
  });

  /* Statement: markeerstift trekt regel voor regel over de accenttekst. */
  mm.add("(prefers-reduced-motion: no-preference)", function () {
    gsap.utils.toArray(".statement-accent").forEach(function (el) {
      gsap.fromTo(el, { backgroundSize: "0% 78%" }, {
        backgroundSize: "100% 78%", duration: 1.6, ease: "power2.inOut", delay: 0.35,
        scrollTrigger: { trigger: el, start: "top 80%", once: true }
      });
    });
  });

  /* Thema's en Laatste nieuws: een afbeelding volgt de muis over de lijst
     (zoals op dennissnellenberg.com/work). De afbeelding schuift verticaal
     naar de foto van het item waar je op staat; een koraal rondje volgt
     iets sneller. Alleen met een muis op desktop.
     Foto per item: data-image op het item (later uit het CMS);
     zonder data-image vallen we terug op de foto's van de site. */
  var lijstPreview = function (lijstSel, itemSel, label, start) {
    var lijst = document.querySelector(lijstSel);
    var items = lijst ? [].slice.call(lijst.querySelectorAll(itemSel)) : [];
    if (!items.length) return;

    var reserve = [].slice.call(document.querySelectorAll(".practice-card-photo, .image-text-photo"))
      .map(function (img) { return img.currentSrc || img.src; })
      .filter(function (src, i, a) { return src && a.indexOf(src) === i; });
    var fotos = items.map(function (it, i) {
      return it.getAttribute("data-image") || reserve[(i + start) % Math.max(reserve.length, 1)] || "";
    });
    if (!fotos.some(Boolean)) return;

    var beeld = document.createElement("div");
    beeld.className = "list-preview";
    beeld.setAttribute("aria-hidden", "true");
    beeld.innerHTML = '<div class="list-preview-track" style="height:' + (items.length * 100) + '%">' +
      fotos.map(function (src) {
        return '<div class="list-preview-slide" style="height:' + (100 / items.length) + '%">' +
          (src ? '<img src="' + src + '" alt="" loading="lazy">' : "") + "</div>";
      }).join("") + "</div>";
    var rondje = document.createElement("div");
    rondje.className = "list-preview-cursor";
    rondje.setAttribute("aria-hidden", "true");
    rondje.innerHTML = "<span></span>";
    rondje.firstChild.textContent = label;
    document.body.appendChild(beeld);
    document.body.appendChild(rondje);
    var spoor = beeld.firstChild;

    gsap.set([beeld, rondje], { xPercent: -50, yPercent: -50, scale: 0 });
    var bx = gsap.quickTo(beeld, "x", { duration: 0.8, ease: "power3" });
    var by = gsap.quickTo(beeld, "y", { duration: 0.8, ease: "power3" });
    var rx = gsap.quickTo(rondje, "x", { duration: 0.45, ease: "power3" });
    var ry = gsap.quickTo(rondje, "y", { duration: 0.45, ease: "power3" });

    // Bepaalt bij elke muisbeweging én bij scrollen welk item onder de muis
    // staat. Bij scrollen beweegt de muis niet, dus mouseenter/-leave komen
    // dan niet; zonder deze check bleef het rondje boven de hero hangen.
    var binnen = false, huidig = -1, mx = -1, my = -1;
    var naar = function (i) {
      gsap.to(spoor, { yPercent: -(100 / items.length) * i, duration: 0.6, ease: "power3.inOut", overwrite: true });
    };
    var check = function () {
      if (mx < 0) return;
      var el = document.elementFromPoint(mx, my);
      var item = el && el.closest ? el.closest(itemSel) : null;
      var i = item ? items.indexOf(item) : -1;
      if (i >= 0 && !binnen) {
        binnen = true;
        gsap.set([beeld, rondje], { x: mx, y: my });
        // Eerst de schaal-tweens stoppen: overwrite "auto" laat een tween met
        // delay die nog niet loopt staan, en dan kwam het rondje na snel
        // doorscrollen terug. (Niet overwrite: true, dat stopt ook het volgen.)
        gsap.killTweensOf([beeld, rondje], "scale");
        gsap.to(beeld, { scale: 1, duration: 0.45, ease: "power3.out" });
        gsap.to(rondje, { scale: 1, duration: 0.45, ease: "power3.out", delay: 0.05 });
      } else if (i < 0 && binnen) {
        binnen = false;
        gsap.killTweensOf([beeld, rondje], "scale"); gsap.to([beeld, rondje], { scale: 0, duration: 0.35, ease: "power3.in" });
      }
      if (i >= 0 && i !== huidig) { huidig = i; naar(i); }
    };
    var volg = function (e) {
      mx = e.clientX; my = e.clientY;
      bx(mx); by(my); rx(mx); ry(my);
      check();
    };
    var weg = function () { mx = -1; if (binnen) { binnen = false; gsap.killTweensOf([beeld, rondje], "scale"); gsap.to([beeld, rondje], { scale: 0, duration: 0.35, ease: "power3.in" }); } };

    window.addEventListener("mousemove", volg, { passive: true });
    window.addEventListener("scroll", check, { passive: true });
    document.documentElement.addEventListener("mouseleave", weg);
    // Lenis geeft tijdens smooth scroll niet elke frame een scroll-event;
    // daarom zolang het beeld zichtbaar is elke frame opnieuw kijken.
    var tik = function () { if (binnen) check(); };
    gsap.ticker.add(tik);

    return function () {
      window.removeEventListener("mousemove", volg);
      window.removeEventListener("scroll", check);
      gsap.ticker.remove(tik);
      document.documentElement.removeEventListener("mouseleave", weg);
      beeld.remove();
      rondje.remove();
    };
  };
  mm.add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine) and (min-width: 992px)", function () {
    var opruimen = [
      lijstPreview(".theme-list", ".theme-row", "Bekijk", 0),
      lijstPreview(".timeline", ".news-item", "Lees", 3)
    ];
    return function () { opruimen.forEach(function (f) { if (f) f(); }); };
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
    if (link.querySelector(".nav-roll") || link.children.length) return;
    var tekst = link.textContent.trim();
    if (!tekst) return;
    link.innerHTML = '<span class="nav-roll"><span class="nav-roll-text"></span></span>';
    link.querySelector(".nav-roll-text").textContent = tekst;
  });
})();


/* ---------------------------------------------------------------
   Knoppen: tekst in een rol-span (rolt bij hover omhoog) en een
   tweede pijl die bij hover van links binnenschuift. CSS in lmo.css.
   --------------------------------------------------------------- */
(function () {
  document.querySelectorAll(".button").forEach(function (knop) {
    var pil = knop.querySelector(".button-pill");
    if (pil && pil.children.length === 0 && pil.textContent.trim()) {
      var rol = document.createElement("span");
      rol.className = "button-roll";
      var tekst = document.createElement("span");
      tekst.className = "button-roll-text";
      tekst.textContent = pil.textContent.trim();
      rol.appendChild(tekst);
      pil.textContent = "";
      pil.appendChild(rol);
    }

    var pijl = knop.querySelector(".button-arrow svg");
    if (pijl && !knop.querySelector(".button-arrow-in")) {
      var kopie = pijl.cloneNode(true);
      kopie.classList.add("button-arrow-in");
      pijl.parentNode.appendChild(kopie);
    }
  });
})();


/* ---------------------------------------------------------------
   Download-icoon in de praktijkkaarten (Figma: Praktijkvoorbeeld-kaart
   › Hover): de pijl zakt de bak in en een nieuwe pijl komt van boven.
   De pijl komt in een groep met een kopie erboven, afgesneden boven de
   bak (clipPath 18 × 11,5). CSS in lmo.css.
   --------------------------------------------------------------- */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  document.querySelectorAll(".practice-card .download svg").forEach(function (svg, i) {
    var paden = svg.querySelectorAll("path");
    if (paden.length !== 2 || svg.querySelector(".download-arrows")) return;
    var pijl = paden[1];
    var id = "lmo-dl-clip-" + i;

    var defs = document.createElementNS(NS, "defs");
    var clip = document.createElementNS(NS, "clipPath");
    clip.setAttribute("id", id);
    var rect = document.createElementNS(NS, "rect");
    rect.setAttribute("width", "18");
    rect.setAttribute("height", "11.5");
    clip.appendChild(rect);
    defs.appendChild(clip);

    var masker = document.createElementNS(NS, "g");
    masker.setAttribute("clip-path", "url(#" + id + ")");
    var groep = document.createElementNS(NS, "g");
    groep.setAttribute("class", "download-arrows");
    var kopie = pijl.cloneNode(true);
    kopie.setAttribute("transform", "translate(0 -11.5)");
    groep.appendChild(pijl);
    groep.appendChild(kopie);
    masker.appendChild(groep);

    svg.insertBefore(defs, svg.firstChild);
    svg.appendChild(masker);
  });
})();


/* ---------------------------------------------------------------
   Lijsten (thema's en nieuws): koppelen aan de Directional List Hover
   hieronder. Webflow-markup blijft zoals hij is; attributen en tegels
   komen hier.
   --------------------------------------------------------------- */
(function () {
  [[".theme-list", ".theme-row"], [".timeline", ".news-item"]].forEach(function (paar) {
    document.querySelectorAll(paar[0]).forEach(function (lijst) {
      lijst.setAttribute("data-directional-hover", "");
      lijst.setAttribute("data-type", "y");
      lijst.querySelectorAll(paar[1]).forEach(function (rij) {
        rij.setAttribute("data-directional-hover-item", "");
        if (!rij.querySelector("[data-directional-hover-tile]")) {
          var tegel = document.createElement("div");
          tegel.className = "lmo-tile";
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
  document.querySelectorAll(".text-link").forEach(function (link) {
    var pijl = link.querySelector(".text-link-arrow");
    if (!pijl || link.querySelector(".text-link-arrow.is-before")) return;
    var voor = pijl.cloneNode(true);
    voor.classList.add("is-before");
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
  var blok = document.querySelector(".municipalities-block");
  if (!blok) return;
  var bron = [].slice.call(blok.querySelectorAll(".municipalities-data [data-gemeente]"));
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

  var kaart = blok.querySelector(".map");
  var chips = blok.querySelector(".chips");
  var popup = blok.querySelector(".popup");
  var punten = {}, chipEls = {};

  // kaartpunten
  if (kaart) {
    kaart.querySelectorAll(".map-point").forEach(function (p) { p.remove(); });
    opKaart.forEach(function (g) {
      var p = document.createElement("button");
      p.type = "button";
      p.className = "map-point";
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
      c.innerHTML = '<span class="chip-dot"></span>';
      c.appendChild(document.createTextNode(g.naam));
      c.addEventListener("click", function () { kies(g, true); toonKaartje(); });
      chips.appendChild(c);
      chipEls[g.slug] = c;
    });
    if (overig > 0) {
      var meer = document.createElement("a");
      meer.className = "chip";
      meer.href = "#";
      meer.innerHTML = '<span class="chip-dot is-hollow"></span>';
      meer.appendChild(document.createTextNode("+ " + overig + (overig === 1 ? " gemeente" : " gemeenten")));
      chips.appendChild(meer);
    }
  }

  if (popup) popup.setAttribute("aria-live", "polite");

  // Op mobiel staat het kaartje boven de chips: na een keuze er even heen.
  function toonKaartje() {
    if (!popup || !window.matchMedia("(max-width: 991px)").matches) return;
    var r = popup.getBoundingClientRect();
    if (r.top >= 90 && r.bottom <= window.innerHeight) return;
    if (window.lmoLenis) window.lmoLenis.scrollTo(popup, { offset: -100, duration: 0.9 });
    else popup.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  var zet = function (sel, tekst) { var el = popup && popup.querySelector(sel); if (el) el.textContent = tekst; };

  function kies(g, animeer) {
    Object.keys(punten).forEach(function (s) {
      var aan = s === g.slug;
      punten[s].classList.toggle("is-active", aan);
      punten[s].setAttribute("aria-pressed", String(aan));
    });
    Object.keys(chipEls).forEach(function (s) {
      var aan = s === g.slug;
      chipEls[s].classList.toggle("is-active", aan);
      chipEls[s].setAttribute("aria-pressed", String(aan));
      var punt = chipEls[s].querySelector(".chip-dot");
      if (punt) punt.classList.toggle("is-active", aan);
    });
    if (!popup) return;

    var vul = function () {
      zet(".popup-title .h3", g.naam);
      var getallen = popup.querySelectorAll(".shelter-number");
      [g.azc, g.gemeentelijk, g.amv].forEach(function (n, i) { if (getallen[i]) getallen[i].textContent = n; });
      var citaat = popup.querySelector(".popup-quote");
      if (citaat) {
        citaat.textContent = g.uitdaging ? "“" + g.uitdaging + "”" : "";
        citaat.closest(".popup-block").hidden = !g.uitdaging;
      }
      var tag = popup.querySelector(".popup-block .tag");
      if (tag) {
        tag.textContent = g.goedIn;
        tag.href = "/zoeken?q=" + encodeURIComponent(g.goedIn);
        tag.closest(".popup-block").hidden = !g.goedIn;
      }
      var knop = popup.querySelector(".button");
      if (knop) {
        knop.href = "/gemeenten/" + g.slug;
        var t = knop.querySelector(".button-roll-text") || knop.querySelector(".button-pill");
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



/* ---------------------------------------------------------------
   Mobiel menu (Figma: "Mobiel menu – open"). De Menu-knop in de nav
   opent een donkergroen paneel met zoekveld, de nav-links genummerd
   (01–07), de nieuwsbriefknop en het e-mailadres uit de footer.
   De links komen uit .nav-menu, dus aanpassen in de Nav-component
   werkt hier vanzelf door.
   --------------------------------------------------------------- */
(function () {
  var knop = document.querySelector(".nav .menu-button");
  var links = [].slice.call(document.querySelectorAll(".nav .nav-menu a"));
  if (!knop || !links.length) return;

  var esc = function (t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  };
  var PIJL = '<svg aria-hidden="true" width="1.5rem" height="1.5rem" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M5 12H19M13 18L19 12L13 6"/></svg>';
  var ZOEK = '<svg aria-hidden="true" width="1.25rem" height="1.25rem" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.66" d="M9.16 14.99A5.83 5.83 0 1 0 9.16 3.33a5.83 5.83 0 0 0 0 11.66Z"/><path stroke="currentColor" stroke-width="1.66" stroke-linecap="round" d="M16.66 16.66 13.75 13.75"/></svg>';
  var mail = document.querySelector('footer a[href^="mailto:"]');

  var paneel = document.createElement("div");
  paneel.className = "lmo-menu";
  paneel.id = "lmo-menu";
  paneel.hidden = true;
  paneel.setAttribute("role", "dialog");
  paneel.setAttribute("aria-modal", "true");
  paneel.setAttribute("aria-label", "Menu");
  paneel.innerHTML =
    '<div class="lmo-menu-inner">' +
      '<form class="search-bar lmo-menu-search" role="search" action="/zoeken">' +
        '<label class="lmo-sr" for="lmo-menu-zoek">Zoek in het leernetwerk</label>' +
        '<div class="search-field">' + ZOEK + '<input id="lmo-menu-zoek" class="search-input" type="search" name="q" autocomplete="off" placeholder="Zoek in het leernetwerk"></div>' +
        '<button type="submit" class="search-submit lmo-form-button" aria-label="Zoeken"><span class="button-roll"><span class="button-roll-text">Zoeken</span></span><span class="lmo-form-button-icon">' + ZOEK + "</span></button>" +
      "</form>" +
      '<ol class="lmo-menu-list">' +
        links.map(function (a, i) {
          var nr = (i + 1 < 10 ? "0" : "") + (i + 1);
          return '<li><a class="lmo-menu-link" href="' + esc(a.getAttribute("href") || "#") + '">' +
            '<span class="lmo-menu-number" aria-hidden="true">' + nr + "</span>" +
            '<span class="lmo-menu-text">' + esc(a.textContent.trim()) + "</span>" +
            '<span class="lmo-menu-arrow">' + PIJL + "</span></a></li>";
        }).join("") +
      "</ol>" +
      '<div class="lmo-menu-actions">' +
        '<a href="/#nieuwsbrief" class="button lmo-menu-button" data-menu-sluit>' +
          '<span class="button-pill is-coral"><span class="button-roll"><span class="button-roll-text">Schrijf je in voor de nieuwsbrief</span></span></span>' +
          '<span class="button-arrow is-coral">' + PIJL + PIJL.replace("<svg ", '<svg class="button-arrow-in" ') + "</span></a>" +
      "</div>" +
    "</div>";
  if (mail) {
    var m = mail.cloneNode(true);
    m.classList.add("lmo-menu-mail");
    paneel.querySelector(".lmo-menu-actions").appendChild(m);
  }
  document.body.appendChild(paneel);

  var open = false;
  var gsap = window.gsap;
  var stil = window.matchMedia("(prefers-reduced-motion: reduce)");
  var tekst = knop.textContent.trim() || "Menu";

  knop.setAttribute("role", "button");
  knop.setAttribute("aria-controls", "lmo-menu");
  knop.setAttribute("aria-expanded", "false");

  function zetKnop(dicht) {
    var rol = knop.querySelector(".button-roll-text");
    if (rol) rol.textContent = dicht ? tekst : "Sluiten";
    else knop.textContent = dicht ? tekst : "Sluiten";
  }

  // Vorm van de Menu-knop als clip-path: het paneel groeit daaruit en
  // krimpt er weer in terug.
  function knopVorm() {
    var r = knop.getBoundingClientRect();
    var rond = parseFloat(getComputedStyle(knop).borderTopLeftRadius) || r.height / 2;
    rond = Math.min(rond, r.height / 2);
    return "inset(" + r.top + "px " + (window.innerWidth - r.right) + "px " +
      (window.innerHeight - r.bottom) + "px " + r.left + "px round " + rond + "px)";
  }
  var VOL = "inset(0px 0px 0px 0px round 0px)";

  var inhoud = function () { return paneel.querySelectorAll(".lmo-menu-inner > *"); };
  var vangnet = 0;
  // Animeert de clip-path vanaf waar hij nu is (ook als je halverwege
  // opnieuw tikt), in plaats van terug te springen naar het begin.
  function clipNaar(doel, vars) {
    gsap.killTweensOf(paneel);
    if (!paneel.style.clipPath) gsap.set(paneel, { clipPath: VOL });
    return gsap.to(paneel, Object.assign({ clipPath: doel, ease: "power3.inOut" }, vars));
  }

  function openMenu() {
    if (open) return;
    open = true;
    clearTimeout(vangnet);
    var wasDicht = paneel.hidden;
    paneel.hidden = false;
    document.documentElement.classList.add("lmo-menu-open", "lmo-menu-lock");
    knop.setAttribute("aria-expanded", "true");
    zetKnop(false);
    if (window.lmoLenis) window.lmoLenis.stop();
    if (gsap && !stil.matches) {
      gsap.killTweensOf(inhoud());
      gsap.set(inhoud(), { clearProps: "opacity,visibility" });
      if (wasDicht) gsap.set(paneel, { clipPath: knopVorm() });
      clipNaar(VOL, { duration: 0.7, onComplete: function () { gsap.set(paneel, { clearProps: "clipPath" }); } });
      gsap.fromTo(paneel.querySelectorAll(".lmo-menu-search, .lmo-menu-list li, .lmo-menu-actions > *"),
        { autoAlpha: 0, y: "1rem" },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.035, delay: wasDicht ? 0.35 : 0, overwrite: true, clearProps: "transform,opacity,visibility" });
    }
  }

  function sluit(terugFocus) {
    if (!open) return;
    open = false;
    // De nav krijgt meteen zijn gewone stand (zodat de knop op z'n
    // eindplek staat); scrollen gaat pas weer aan als het paneel weg is.
    document.documentElement.classList.remove("lmo-menu-open");
    knop.setAttribute("aria-expanded", "false");
    zetKnop(true);
    var klaar = function () {
      if (open) return;
      clearTimeout(vangnet);
      paneel.hidden = true;
      document.documentElement.classList.remove("lmo-menu-lock");
      if (window.lmoLenis) window.lmoLenis.start();
      if (gsap) {
        gsap.set(paneel, { clearProps: "clipPath" });
        gsap.set(inhoud(), { clearProps: "opacity,visibility" });
      }
    };
    if (gsap && !stil.matches) {
      gsap.killTweensOf(paneel.querySelectorAll(".lmo-menu-search, .lmo-menu-list li, .lmo-menu-actions > *"));
      gsap.to(inhoud(), { autoAlpha: 0, duration: 0.15, ease: "power1.in", overwrite: true });
      clipNaar(knopVorm(), { duration: 0.55, delay: 0.05, onComplete: klaar });
      clearTimeout(vangnet);
      vangnet = setTimeout(klaar, 1000);
    } else klaar();
    if (terugFocus) knop.focus({ preventScroll: true });
  }

  knop.addEventListener("click", function (e) {
    e.preventDefault();
    open ? sluit(true) : openMenu();
  });
  knop.addEventListener("keydown", function (e) {
    if (e.key === " ") { e.preventDefault(); knop.click(); }
  });

  paneel.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (a) sluit(false);  // naar een link of anker: menu dicht
  });
  paneel.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = paneel.querySelector("input").value.trim();
    window.location.href = q ? "/zoeken?q=" + encodeURIComponent(q) : "/zoeken";
  });

  document.addEventListener("keydown", function (e) {
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); sluit(true); return; }
    if (e.key !== "Tab") return;
    var els = [knop].concat([].slice.call(paneel.querySelectorAll("a[href], button, input")));
    var eerste = els[0], laatste = els[els.length - 1];
    if (e.shiftKey && document.activeElement === eerste) { e.preventDefault(); laatste.focus(); }
    else if (!e.shiftKey && document.activeElement === laatste) { e.preventDefault(); eerste.focus(); }
  });

  // Naar desktopbreedte: menu dicht.
  window.matchMedia("(min-width: 992px)").addEventListener("change", function (m) { if (m.matches) sluit(false); });
})();


/* ---------------------------------------------------------------
   Accordeon (/components, sectie Veelgestelde vragen).
   Markup in Webflow: .accordion > .accordion-item > .accordion-trigger
   (+ .accordion-question, .accordion-icon) en .accordion-panel.
   Het script maakt de trigger een knop (toetsenbord, aria) en klapt het
   paneel open met GSAP. Zonder JS staan alle antwoorden open.
   --------------------------------------------------------------- */
(function () {
  var items = document.querySelectorAll(".accordion-item");
  if (!items.length) return;
  document.documentElement.classList.add("lmo-accordion");
  var stil = window.matchMedia("(prefers-reduced-motion: reduce)");

  items.forEach(function (item, i) {
    var knop = item.querySelector(".accordion-trigger");
    var paneel = item.querySelector(".accordion-panel");
    if (!knop || !paneel) return;
    var id = "lmo-accordeon-" + i;
    paneel.id = id;
    paneel.setAttribute("role", "region");
    paneel.hidden = true;
    knop.setAttribute("role", "button");
    knop.setAttribute("tabindex", "0");
    knop.setAttribute("aria-expanded", "false");
    knop.setAttribute("aria-controls", id);

    var zet = function (open) {
      var gsap = window.gsap;
      knop.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) paneel.hidden = false;
      if (gsap && !stil.matches) {
        gsap.killTweensOf(paneel);
        gsap.fromTo(paneel, { height: open ? 0 : paneel.offsetHeight },
          { height: open ? "auto" : 0, duration: open ? 0.5 : 0.4, ease: "power3.inOut",
            onComplete: function () { if (!open) paneel.hidden = true; } });
      } else {
        paneel.style.height = open ? "auto" : "0px";
        if (!open) paneel.hidden = true;
      }
    };
    var wissel = function () { zet(knop.getAttribute("aria-expanded") !== "true"); };
    knop.addEventListener("click", wissel);
    knop.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); wissel(); }
    });
  });
})();


/* ---------------------------------------------------------------
   Slider (/components, sectie 12B). Alleen GSAP, geen plugin.
   Markup: een section met .slider-button.is-prev / .is-next,
   .slider-viewport > .slider-track > slides, en optioneel
   .slider-progress > .slider-progress-bar.
   - Pijlen schuiven één kaart; slepen met muis of vinger, met
     doorglijden en uitlijnen op de dichtstbijzijnde kaart.
   - Pijltjestoetsen werken als de focus in de slider staat.
   - Na slepen wordt een klik op een link in de kaart genegeerd.
   --------------------------------------------------------------- */
(function () {
  var gsap = window.gsap;
  if (!gsap) return;
  var stil = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll(".slider-viewport").forEach(function (viewport) {
    var track = viewport.querySelector(".slider-track");
    if (!track || track.children.length < 2) return;
    var blok = viewport.closest("section") || viewport.parentElement;
    var vorige = blok.querySelector(".slider-button.is-prev");
    var volgende = blok.querySelector(".slider-button.is-next");
    var balk = blok.querySelector(".slider-progress-bar");
    var slides = [].slice.call(track.children);

    var x = 0, max = 0, punten = [];
    var meet = function () {
      max = Math.max(0, track.scrollWidth - viewport.clientWidth);
      punten = slides.map(function (s) { return Math.min(s.offsetLeft, max); })
        .filter(function (p, i, a) { return a.indexOf(p) === i; });
      if (punten[punten.length - 1] !== max) punten.push(max);
    };
    var dichtstbij = function (waarde) {
      var best = 0;
      punten.forEach(function (p, i) { if (Math.abs(p - waarde) < Math.abs(punten[best] - waarde)) best = i; });
      return best;
    };
    var toon = function () {
      if (balk) gsap.set(balk, { scaleX: max ? (x + viewport.clientWidth) / track.scrollWidth : 1 });
      var begin = x <= 1, eind = x >= max - 1;
      [[vorige, begin], [volgende, eind]].forEach(function (k) {
        if (!k[0]) return;
        k[0].setAttribute("aria-disabled", k[1] ? "true" : "false");
      });
    };
    var naar = function (doel, duur) {
      x = Math.max(0, Math.min(max, doel));
      gsap.to(track, {
        x: -x, duration: stil.matches ? 0 : (duur == null ? 0.8 : duur), ease: "power3.out",
        overwrite: true
      });
      toon();
    };
    var stap = function (richting) {
      var i = dichtstbij(x) + richting;
      naar(punten[Math.max(0, Math.min(punten.length - 1, i))]);
    };

    [[vorige, -1], [volgende, 1]].forEach(function (k) {
      var knop = k[0];
      if (!knop) return;
      knop.setAttribute("role", "button");
      knop.addEventListener("click", function (e) { e.preventDefault(); stap(k[1]); });
      knop.addEventListener("keydown", function (e) {
        if (e.key === " ") { e.preventDefault(); stap(k[1]); }
      });
    });
    blok.addEventListener("keydown", function (e) {
      if (!blok.contains(document.activeElement)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); stap(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); stap(-1); }
    });

    // Tab naar een kaart buiten beeld: schuif hem erin.
    track.addEventListener("focusin", function (e) {
      var slide = slides.filter(function (s) { return s.contains(e.target); })[0];
      if (!slide) return;
      viewport.scrollLeft = 0;
      var links = slide.offsetLeft, rechts = links + slide.offsetWidth;
      if (links < x || rechts > x + viewport.clientWidth) naar(punten[dichtstbij(links)]);
    });

    // Slepen
    var sleep = null, gesleept = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      gsap.killTweensOf(track);
      x = -gsap.getProperty(track, "x");
      sleep = { start: e.clientX, startY: e.clientY, x: x, t: performance.now(), laatst: e.clientX, v: 0, actief: false, id: e.pointerId };
      gesleept = false;
    });
    window.addEventListener("pointermove", function (e) {
      if (!sleep || e.pointerId !== sleep.id) return;
      var dx = e.clientX - sleep.start;
      if (!sleep.actief) {
        if (Math.abs(dx) < 6) return;
        if (Math.abs(e.clientY - sleep.startY) > Math.abs(dx)) { sleep = null; return; }  // verticaal: pagina scrollen
        sleep.actief = true;
        gesleept = true;
        track.style.cursor = "grabbing";
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
      }
      var doel = sleep.x - dx;
      // Weerstand voorbij de randen
      if (doel < 0) doel = doel / 3;
      if (doel > max) doel = max + (doel - max) / 3;
      x = doel;
      gsap.set(track, { x: -x });
      var nu = performance.now();
      sleep.v = (e.clientX - sleep.laatst) / Math.max(1, nu - sleep.t);
      sleep.laatst = e.clientX; sleep.t = nu;
      toon();
    });
    var los = function () {
      if (!sleep) return;
      var actief = sleep.actief, v = sleep.v;
      sleep = null;
      track.style.cursor = "";
      if (!actief) return;
      naar(punten[dichtstbij(x - v * 250)], 0.7);  // doorglijden met de sleepsnelheid
    };
    window.addEventListener("pointerup", los);
    window.addEventListener("pointercancel", los);
    track.addEventListener("click", function (e) {
      if (gesleept) { e.preventDefault(); e.stopPropagation(); gesleept = false; }
    }, true);
    track.addEventListener("dragstart", function (e) { e.preventDefault(); });

    meet();
    toon();
    window.addEventListener("resize", function () { meet(); naar(punten[dichtstbij(x)], 0); });
    window.addEventListener("load", function () { meet(); toon(); });
  });
})();
