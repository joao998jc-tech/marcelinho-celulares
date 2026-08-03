/* =========================================================
   SCROLL-REVEAL.JS — MARCELINHO
   Revela elementos com classe ".reveal" conforme entram na
   viewport, usando IntersectionObserver nativo (sem libs).
   Respeita prefers-reduced-motion via CSS (animations.css).

   Roda DEPOIS de products.js (ver ordem dos <script> em
   index.html): os cards de catálogo/acessórios são injetados
   por products.js de forma síncrona, então já existem no DOM
   quando este observer é criado.
   ========================================================= */

(function () {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  // Fallback: sem IntersectionObserver, mostra tudo direto
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target); // anima uma vez só
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
})();
