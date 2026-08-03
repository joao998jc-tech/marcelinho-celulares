/* =========================================================
   NAV.JS — MARCELINHO
   Espelha o padrão de navegação do BARBER SHOP ERICK GARCIA (Regra 80):
   - Cabeçalho só com a logo (com estado "is-scrolled" ao rolar).
   - Navegação SPA por ABAS (.view): só uma fica ativa por vez, sem
     recarregar. Sincroniza com o hash (#bemvindo, #aparelhos, #acessorios)
     para permitir link direto e o botão "voltar" do navegador.
   - Dock flutuante à direita: botões "Aparelhos"/"Acessórios" (data-target)
     e o botão "Categorias", que abre um dropdown com os TIPOS de item
     (opções injetadas por products.js). O realce da aba ativa é
     sincronizado aqui.
   - Ao ativar uma aba, revela imediatamente os .reveal internos (as abas
     ocultas não recebem o IntersectionObserver de scroll-reveal a tempo).

   Expõe window.MarcelinhoNav = { go, onViewChange, current }.
   ========================================================= */
(function () {
  "use strict";

  var VALID = ["bemvindo", "aparelhos", "acessorios"];
  var DEFAULT = "bemvindo";
  var listeners = [];
  var current = DEFAULT;
  // Seletor a rolar após ativar uma aba (ex.: rodapé "Serviços" -> aba
  // Bem-vindo + rola até #servicos). Consumido uma vez no setActive.
  var pendingScroll = null;

  function onViewChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
  }

  // Abas ocultas (display:none) não são observadas pelo IntersectionObserver
  // no load; ao ativá-las, garantimos que o conteúdo apareça sem depender do
  // observer (mesma lição do re-render de filtros em products.js).
  function revealWithin(viewEl) {
    if (!viewEl) return;
    viewEl.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  function setActive(view) {
    if (VALID.indexOf(view) === -1) view = DEFAULT;
    current = view;

    var activeEl = null;
    document.querySelectorAll(".view").forEach(function (el) {
      var on = el.getAttribute("data-view") === view;
      el.classList.toggle("is-active", on);
      if (on) activeEl = el;
    });
    revealWithin(activeEl);

    // Realce dos botões do dock que apontam para uma aba (Aparelhos/Acessórios).
    // A aba "bemvindo" não tem botão no dock (a "home" é a logo), então nela
    // nenhum botão fica ativo — comportamento intencional.
    document.querySelectorAll(".nav-dock__btn[data-target]").forEach(function (b) {
      var on = b.getAttribute("data-target") === view;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-current", on ? "page" : "false");
    });

    // Reset de UI transitória entre abas: a confirmação do form de orçamento
    // não deve persistir ao sair/voltar da aba Bem-vindo.
    var fs = document.querySelector(".form-success.is-visible");
    if (fs) fs.classList.remove("is-visible");

    // Rolagem pós-troca:
    // (1) pendingScroll (ex.: rodapé "Serviços") -> rola até a sub-seção;
    // (2) deep-link para âncora interna que NÃO é aba (ex.: #instagram no
    //     load) -> deixa o browser rolar até ela (não força topo);
    // (3) caso normal -> volta ao topo (bom no mobile).
    if (pendingScroll) {
      var sel = pendingScroll;
      pendingScroll = null;
      var tgt = document.querySelector(sel);
      if (tgt) {
        window.requestAnimationFrame(function () {
          tgt.scrollIntoView({ behavior: "auto", block: "start" });
        });
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    } else {
      var h = (window.location.hash || "").replace("#", "");
      var isInternalAnchor = h && VALID.indexOf(h) === -1 && document.getElementById(h);
      if (!isInternalAnchor) window.scrollTo({ top: 0, behavior: "auto" });
    }

    listeners.forEach(function (fn) { fn(view); });
  }

  function go(view) {
    if (VALID.indexOf(view) === -1) view = DEFAULT;
    if (("#" + view) !== window.location.hash) {
      window.location.hash = view; // dispara hashchange -> setActive
    } else {
      setActive(view);
    }
  }

  function currentFromHash() {
    var h = (window.location.hash || "").replace("#", "");
    return VALID.indexOf(h) !== -1 ? h : DEFAULT;
  }

  // Clique em qualquer elemento com [data-target] troca de aba (logo,
  // botões do dock). Âncoras internas fora das abas seguem normais.
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-target]");
    if (!el) return;
    e.preventDefault();
    var scrollSel = el.getAttribute("data-scroll");
    if (scrollSel) pendingScroll = scrollSel; // rola até a sub-seção após ativar
    go(el.getAttribute("data-target"));
  });

  window.addEventListener("hashchange", function () {
    var h = (window.location.hash || "").replace("#", "");
    // Âncora interna que NÃO é aba (ex.: #contato, #instagram): deixa o
    // browser rolar até o elemento, sem trocar de aba nem forçar scroll ao topo.
    if (h && VALID.indexOf(h) === -1) return;
    setActive(h || DEFAULT);
  }, false);

  // ---- Header: estado "scrolled" ----------------------------------------
  var header = document.getElementById("header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- Dropdown "Categorias" do dock ------------------------------------
  // Só abre/fecha o menu e cuida de acessibilidade; as OPÇÕES (tipos) e a
  // ação de filtrar são injetadas/ligadas por products.js (dono de FILTERS).
  (function initDropdown() {
    var btn = document.getElementById("dockCategorias");
    var menu = document.getElementById("dockCategoriasMenu");
    if (!btn || !menu) return;

    function openMenu() {
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      btn.classList.add("is-open");
      document.addEventListener("click", onOutside, true);
      document.addEventListener("keydown", onEsc, true);
      document.addEventListener("focusin", onOutsideFocus, true);
    }
    function closeMenu() {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      btn.classList.remove("is-open");
      document.removeEventListener("click", onOutside, true);
      document.removeEventListener("keydown", onEsc, true);
      document.removeEventListener("focusin", onOutsideFocus, true);
    }
    function toggleMenu() {
      if (menu.hidden) openMenu(); else closeMenu();
    }
    function onOutside(e) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
    }
    // Fecha ao mover o foco (Tab) para fora do botão/menu — teclado.
    function onOutsideFocus(e) {
      if (!menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
    }
    function onEsc(e) {
      if (e.key === "Escape") { closeMenu(); btn.focus(); }
    }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
    // Fecha o dropdown depois que uma opção é escolhida (products.js aplica o
    // filtro e troca de aba; aqui só garantimos que o menu não fique aberto).
    menu.addEventListener("click", function (e) {
      if (e.target.closest(".nav-dock__opt")) closeMenu();
    });
  })();

  document.addEventListener("DOMContentLoaded", function () {
    setActive(currentFromHash());
  });

  window.MarcelinhoNav = {
    go: go,
    onViewChange: onViewChange,
    current: function () { return current; }
  };
})();
