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

  // ScrollTrigger meet zelf opnieuw bij resize; na het laden van afbeeldingen
  // verschuiven posities nog, dus dan één keer extra meten.
  if (window.ScrollTrigger) {
    window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
  }
})();
