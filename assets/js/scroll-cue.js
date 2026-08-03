/* =========================================================
   SCROLL-CUE.JS — MARCELINHO
   Indicador de scroll da abertura (elemento NOVO sobreposto, FORA da Hero
   congelada #intro — Regra 96). Não toca mascote/celular/logo/animações da
   intro: só liga/desliga a PRÓPRIA opacidade via classe .is-hidden.

   - Some ao 1º scroll e reaparece quando o usuário volta ao topo da abertura.
   - Scroll lido com throttle por requestAnimationFrame (nunca cálculo contínuo
     no evento bruto); só toca o DOM na TROCA de estado.
   - Reduced-motion: a intro nem engata a jornada, então o indicador não aparece
     (gate CSS body.is-intro.intro-journey); o bob também é desligado no CSS.
   - Casos de borda: topo exato (scrollY 0 -> visível), scroll rápido bidirecional
     (cada rAF lê o scrollY atual), reload já rolado (apply() no init).
   ========================================================= */
(function () {
  "use strict";

  var cue = document.getElementById("scrollCue");
  if (!cue) return;

  // "primeiro scroll" = passou deste limiar; topo exato (<= limiar) reaparece.
  var HIDE_AFTER = 8;
  var ticking = false;
  var hidden = false;

  function apply() {
    ticking = false;
    var shouldHide = window.scrollY > HIDE_AFTER;
    if (shouldHide === hidden) return; // só mexe no DOM quando o estado muda
    hidden = shouldHide;
    cue.classList.toggle("is-hidden", hidden);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(apply);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  apply(); // estado inicial correto (ex.: reload com a página já rolada)
})();
