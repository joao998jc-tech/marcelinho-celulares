/* =========================================================
   SHOWROOM.JS — MARCELINHO
   Vitrine interativa premium (showroom digital) de smartphones,
   logo após o hero da aba Bem-vindo. Conceito de movimentação
   inspirado no carrossel do Motion Sites (TOONHUB) — só a MECÂNICA
   de interação (aparelho central em destaque + secundários ao redor
   recuados/desfocados; seleção contínua que traz o escolhido ao
   centro e recua o anterior), NUNCA o layout/identidade da referência.

   Dados: 100% reaproveitados de products.js via window.MARCELINHO_CONFIG
   (catálogo + link de WhatsApp por produto). Nada de número/produto
   duplicado aqui — fonte única continua sendo products.js (Regra 74).

   Visual do aparelho = MOCKUP CSS (moldura + tela com glow) — R$0,
   demonstrável hoje. Ver PLACEHOLDER de foto real (Fase 2) no markup
   do card, abaixo.

   Interação SÓ por transform/opacity/filter em transições CSS (60fps,
   GPU). Sem requestAnimationFrame, sem watchdog: a micro-flutuação é
   keyframe CSS puro, que o browser pausa sozinho quando a aba/aba-SPA
   fica oculta (a .view usa display:none) — nada conta tempo escondido.
   ========================================================= */

(function () {
  "use strict";

  var cfg = window.MARCELINHO_CONFIG || {};
  var PRODUCTS = cfg.products || [];
  var stage = document.getElementById("showroomStage");
  var infoBox = document.getElementById("showroomInfo");
  var section = document.getElementById("showroom");
  if (!stage || !infoBox || !section) return;

  // 0 aparelhos: nada a exibir — esconde a seção inteira (caso de borda).
  if (!PRODUCTS.length) { section.hidden = true; return; }

  // ---- Dados que NÃO existem no catálogo (marcados como PLACEHOLDER) -----
  // "Condições de pagamento" não é campo de PRODUCTS[]. Enquanto o cliente
  // não passar as condições reais (por aparelho, se variarem), usamos um
  // texto único de exemplo. FASE 2: virar campo em PRODUCTS[] (products.js).
  var PAYMENT_PLACEHOLDER = "Em até 12x no cartão ou à vista com desconto"; // PLACEHOLDER — condições reais do MARCELINHO

  // Mapa cor-do-aparelho -> tom de luz ambiente. Base da cena é navy+laranja
  // (identidade Marcelinho, igual ao hero); ao trocar de aparelho, a luz
  // ambiente PENDE para a cor do próprio device (verde no Galaxy verde, etc.),
  // sem trocar a cena inteira como no Motion Sites. Fallback = laranja da marca.
  var COLOR_LIGHT = {
    "verde": "#2fae6a", "azul": "#3b82f6", "azul marinho": "#2447a8",
    "preto": "#f26a1b", "branco": "#8fb2e6", "rosé": "#e58fb0", "rosa": "#e58fb0",
    "grafite": "#7f8aa0", "estelar": "#cbb9a6", "meia-noite": "#3a5a8c",
    "titânio natural": "#c9b79c", "roxo": "#8b5cf6", "vermelho": "#e0483a",
    "dourado": "#d8b24a", "prata": "#9fb0c4", "amarelo": "#e8b93a"
  };
  function accentFor(product) {
    var key = (product.color || "").trim().toLowerCase();
    return COLOR_LIGHT[key] || "var(--color-orange)";
  }

  // Capacidade não é campo próprio: deriva do nome ("iPhone 15 Pro 256GB").
  function capacityOf(product) {
    var m = /(\d+)\s?(gb|tb)/i.exec(product.name || "");
    return m ? (m[1] + m[2].toUpperCase()) : "";
  }
  // Nome do modelo sem a capacidade (a capacidade vira campo próprio na UI).
  function modelOf(product) {
    return (product.name || "").replace(/\s*\d+\s?(gb|tb)\b/i, "").trim();
  }
  function conditionLabel(cond) { return cond === "novo" ? "Novo" : "Seminovo"; }
  function formatPrice(v) {
    return "R$ " + Number(v).toFixed(2).replace(".", ",").replace(/\d(?=(\d{3})+,)/g, "$&.");
  }

  // ---- Markup de um aparelho (mockup CSS) -------------------------------
  // PLACEHOLDER FASE 2: quando houver foto/render real, trocar o bloco
  // .showroom-phone__screen por <img ... loading="lazy"> do aparelho.
  function buildPhone(product, index) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = "showroom-phone";
    el.dataset.index = String(index);
    el.setAttribute("aria-label", product.name + " — " + product.color + ", " + conditionLabel(product.condition));
    el.style.setProperty("--device", accentFor(product));
    el.innerHTML =
      '<span class="showroom-phone__float">' +
        '<span class="showroom-phone__shadow" aria-hidden="true"></span>' +
        '<span class="showroom-phone__body">' +
          '<span class="showroom-phone__screen">' +
            '<span class="showroom-phone__notch"></span>' +
            '<span class="showroom-phone__glow"></span>' +
            '<span class="showroom-phone__label">' + product.brandLabel + "</span>" +
          "</span>" +
          '<span class="showroom-phone__gloss" aria-hidden="true"></span>' +
        "</span>" +
      "</span>";
    return el;
  }

  // ---- Info dinâmica do aparelho selecionado ----------------------------
  function renderInfo(product) {
    var oldPrice = product.oldPrice
      ? '<span class="showroom-info__old">' + formatPrice(product.oldPrice) + "</span>" : "";
    var link = (typeof cfg.whatsappLink === "function")
      ? cfg.whatsappLink(product)
      : "https://wa.me/" + (cfg.whatsapp || "55SEUNUMERO");
    infoBox.innerHTML =
      '<p class="showroom-info__brand">' + product.brandLabel + "</p>" +
      '<h3 class="showroom-info__name">' + modelOf(product) + "</h3>" +
      '<ul class="showroom-info__specs">' +
        (capacityOf(product) ? '<li><span>Capacidade</span>' + capacityOf(product) + "</li>" : "") +
        '<li><span>Cor</span>' + product.color + "</li>" +
        '<li><span>Estado</span>' + conditionLabel(product.condition) + "</li>" +
      "</ul>" +
      '<div class="showroom-info__price">' + oldPrice +
        '<span class="showroom-info__now">' + formatPrice(product.price) + "</span>" +
      "</div>" +
      '<p class="showroom-info__pay">' + PAYMENT_PLACEHOLDER + "</p>" +
      '<div class="showroom-info__cta">' +
        // Página única: o CTA leva direto ao WhatsApp (conversão). A antiga
        // ação "Ver detalhes" (abria a aba de catálogo) saiu com a página única.
        '<a class="btn btn--whats btn--block" target="_blank" rel="noopener" href="' + link + '">Comprar agora</a>' +
      "</div>";
    // Retriga a animação suave de troca de conteúdo.
    infoBox.classList.remove("is-swapped");
    void infoBox.offsetWidth; // reflow para reiniciar a animação
    infoBox.classList.add("is-swapped");
    // Luz ambiente da cena pende para a cor do aparelho selecionado.
    section.style.setProperty("--showroom-accent", accentFor(product));
  }

  // ---- Coreografia coverflow (posição de cada card por offset) ----------
  // O track é criado UMA vez e persiste; só os cards são reconstruídos quando
  // o filtro troca o subconjunto (currentList). Assim o componente/palco NÃO
  // é destruído nem a página recarrega — só os dados exibidos mudam.
  var track = document.createElement("div");
  track.className = "showroom__track";
  stage.appendChild(track);

  var currentList = PRODUCTS.slice(); // subconjunto ativo (filtro)
  var phones = [];                    // cards do subconjunto atual
  var center = 0;                     // índice central em currentList

  function layout() {
    for (var i = 0; i < phones.length; i++) {
      var offset = i - center;
      var abs = Math.abs(offset);
      var sign = offset < 0 ? -1 : 1;
      var isCenter = offset === 0;
      var st = phones[i].style;
      // Além da janela visível, o card sai de cena por opacidade (sem "corte":
      // ele desliza para a lateral e some suavemente; o SELECIONADO nunca some).
      // Só custom properties inline: filter/opacity/z-index/transform ficam
      // no CSS lendo essas props, para o :hover (pré-seleção) conseguir
      // sobrescrevê-los (uma custom property inline venceria o :hover).
      st.setProperty("--tx", (offset * 240) + "px");
      st.setProperty("--tz", (-abs * 180) + "px");
      st.setProperty("--ry", (-sign * Math.min(abs, 2) * 32) + "deg");
      st.setProperty("--sc", isCenter ? "1" : String(Math.max(0.6, 1 - abs * 0.14)));
      st.setProperty("--blur-base", isCenter ? "0px" : Math.min(6, abs * 2.4) + "px");
      st.setProperty("--op", abs > 3 ? "0" : String(Math.max(0.28, 1 - abs * 0.26)));
      st.setProperty("--z", String(100 - abs)); // central sempre à frente
      phones[i].classList.toggle("is-center", isCenter);
      phones[i].setAttribute("aria-current", isCenter ? "true" : "false");
      phones[i].tabIndex = isCenter ? 0 : -1;
      // Fora da janela não recebe clique/hover (não é pré-selecionável).
      phones[i].style.pointerEvents = abs > 3 ? "none" : "auto";
    }
  }

  function setCenter(i) {
    var clamped = Math.max(0, Math.min(currentList.length - 1, i));
    if (clamped === center) return; // clique duplo/no próprio central = no-op
    center = clamped;
    layout();
    renderInfo(currentList[center]);
    updateArrows();
  }

  // ---- Setas prev/next --------------------------------------------------
  var prev = document.createElement("button");
  prev.type = "button";
  prev.className = "showroom__arrow showroom__arrow--prev";
  prev.setAttribute("aria-label", "Aparelho anterior");
  prev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var next = document.createElement("button");
  next.type = "button";
  next.className = "showroom__arrow showroom__arrow--next";
  next.setAttribute("aria-label", "Próximo aparelho");
  next.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  // Setas criadas UMA vez; a visibilidade é recalculada por render/filtro
  // (0 ou 1 aparelho => sem setas).
  stage.appendChild(prev);
  stage.appendChild(next);
  function updateArrows() {
    var few = currentList.length <= 1;
    prev.hidden = few;
    next.hidden = few;
    prev.disabled = center <= 0;
    next.disabled = center >= currentList.length - 1;
  }
  prev.addEventListener("click", function () { setCenter(center - 1); });
  next.addEventListener("click", function () { setCenter(center + 1); });

  // ---- (Re)render do subconjunto atual ----------------------------------
  // Reconstrói apenas os cards dentro do MESMO track/palco (não recria o
  // componente). Trata os extremos: lista vazia (estado elegante), 1 item
  // (sem setas/profundidade quebrada).
  function render(list) {
    currentList = list.slice();
    track.innerHTML = "";
    if (!currentList.length) {
      center = 0;
      phones = [];
      track.innerHTML = '<p class="showroom__empty">Nenhum aparelho nesta categoria por enquanto.</p>';
      infoBox.innerHTML = "";
      updateArrows();
      return;
    }
    center = Math.floor((currentList.length - 1) / 2);
    phones = currentList.map(buildPhone);
    phones.forEach(function (p) { track.appendChild(p); });
    layout();
    renderInfo(currentList[center]);
    updateArrows();
  }

  // ---- Clique/toque num card lateral => centraliza (seleção) -------------
  track.addEventListener("click", function (e) {
    var card = e.target.closest(".showroom-phone");
    if (!card) return;
    setCenter(Number(card.dataset.index));
  });

  // ---- Teclado (setas ← →, foco no palco) -------------------------------
  stage.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); setCenter(center - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); setCenter(center + 1); }
  });

  // ---- Swipe horizontal (mobile) ----------------------------------------
  var startX = null, startY = null;
  stage.addEventListener("touchstart", function (e) {
    if (currentList.length <= 1 || !e.touches.length) return;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var t = (e.changedTouches && e.changedTouches[0]) || null;
    if (t) {
      var dx = t.clientX - startX, dy = t.clientY - startY;
      // Só conta como swipe se for majoritariamente horizontal (não atrapalha
      // a rolagem vertical da página).
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        setCenter(center + (dx < 0 ? 1 : -1));
      }
    }
    startX = startY = null;
  }, { passive: true });

  // ---- Filtro de categorias (segmented control) -------------------------
  // Controla o subconjunto exibido: "todos" | "novo" | "seminovo". Só troca
  // os DADOS (re-render), preservando animações/coverflow. Sem reload, sem
  // recriar o componente. Clique repetido na mesma categoria = no-op.
  var filterEl = document.getElementById("showroomFilter");
  var currentCat = "todos";
  function catMatch(p, cat) {
    return cat === "todos" ? true : p.condition === cat;
  }
  function applyCat(cat) {
    if (cat === currentCat) return; // evita re-render/reset desnecessário
    currentCat = cat;
    if (filterEl) {
      filterEl.setAttribute("data-active", cat);
      filterEl.querySelectorAll(".showroom__filter-opt").forEach(function (b) {
        var on = b.getAttribute("data-cat") === cat;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    render(PRODUCTS.filter(function (p) { return catMatch(p, cat); }));
  }
  if (filterEl) {
    filterEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".showroom__filter-opt");
      if (!btn) return;
      applyCat(btn.getAttribute("data-cat"));
    });
  }

  // ---- Boot -------------------------------------------------------------
  render(PRODUCTS.slice());
})();
