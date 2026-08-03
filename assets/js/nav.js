/* =========================================================
   NAV.JS — MARCELINHO
   Página ÚNICA (sem abas SPA): toda a descoberta acontece numa só
   experiência contínua (apresentação -> filtro -> vitrine de
   smartphones -> carrossel de acessórios). Este módulo cuida de:
   - Cabeçalho: estado "is-scrolled" ao rolar.
   - Rolagem SUAVE para as âncoras internas (logo/rodapé): #top,
     #showroom (vitrine), #acessorios (carrossel), #servicos.
     Respeita prefers-reduced-motion (rola sem animação).

   O antigo roteador de abas (.view/data-target/hash) foi removido:
   com página única não há aba para trocar. Expõe um MarcelinhoNav
   mínimo (go = rola até um id) por compatibilidade.
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rola suavemente até o elemento de id informado (sem alterar o hash,
  // para não interferir na abertura cinematográfica controlada por scroll).
  function scrollToId(id) {
    if (!id) return false;
    var el = document.getElementById(id);
    if (!el) return false;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    return true;
  }

  // Intercepta cliques em âncoras internas (a[href^="#"]) que apontam para um
  // elemento existente na página. Âncoras sem alvo seguem o comportamento
  // nativo do navegador (nenhum link morto é esperado após a reformulação).
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = (a.getAttribute("href") || "").slice(1);
    if (!id) return; // "#" puro
    if (scrollToId(id)) e.preventDefault();
  });

  // ---- Header: estado "scrolled" ----------------------------------------
  var header = document.getElementById("header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  window.MarcelinhoNav = { go: scrollToId };
})();
