/* =========================================================
   PRODUCTS.JS — MARCELINHO
   Fonte ÚNICA de dados do front (Fase 1, sem banco):
   - PRODUCTS[]    → aparelhos (consumidos pela vitrine coverflow em
     showroom.js via window.MARCELINHO_CONFIG).
   - ACCESSORIES[] → acessórios, renderizados aqui no CARROSSEL premium
     (#acessoriosTrack) com setas + arraste + modal "Ver detalhes".
   - whatsappLink(product) → link wa.me pré-preenchido (reusado no showroom).

   >>> TODOS OS DADOS ABAIXO SÃO DE EXEMPLO (PLACEHOLDER) <<<
   Nada aqui é dado real do MARCELINHO. Ver o bloco
   "O QUE PRECISA SER TROCADO PELO DADO REAL" logo abaixo.

   Roda ANTES de scroll-reveal.js (ver ordem dos <script> em index.html).
   Os cards do carrossel NÃO usam .reveal: como estão num scroll horizontal,
   os que ficam fora da viewport (à direita) nunca intersectariam o observer
   e ficariam invisíveis; então nascem visíveis. Só o cabeçalho usa .reveal.
   ========================================================= */

/* =========================================================
   ⚠️ O QUE PRECISA SER TROCADO PELO DADO REAL DO CLIENTE
   ---------------------------------------------------------
   1) WHATSAPP_NUMERO  → número oficial do MARCELINHO (só dígitos,
      com DDI+DDD, ex.: 5515999999999). Hoje = "5515997031149".
   2) PRODUCTS[]       → catálogo real (modelo, marca, condição,
      cor, preço, preço antigo/oferta, armazenamento) + fotos reais
      em assets/img/products/ (trocar o mockup CSS por img real).
   3) ACCESSORIES[]    → acessórios reais (nome, categoria, preço,
      descrição) + fotos.
   4) Textos institucionais, telefone, endereço, horário e redes
      ficam no index.html marcados com <!-- PLACEHOLDER: ... -->.
   ========================================================= */

(function () {
  "use strict";

  // ---- CONFIG: número de WhatsApp (PLACEHOLDER) --------------------------
  // Formato wa.me: só dígitos, DDI + DDD + número. Ex.: 5515999998888
  var WHATSAPP_NUMERO = "5515997031149"; // MARCELINHO — (15) 99703-1149
  window.MARCELINHO_CONFIG = { whatsapp: WHATSAPP_NUMERO };

  // ---- DADOS DE EXEMPLO: aparelhos (PLACEHOLDER) -------------------------
  // condition: "novo" | "seminovo" · brand: apple|samsung|xiaomi|motorola
  var PRODUCTS = [
    { id: "iphone-15-pro", brand: "apple", brandLabel: "Apple",
      name: "iPhone 15 Pro 256GB", color: "Titânio Natural",
      condition: "novo", price: 6499, oldPrice: null },
    { id: "iphone-13-128", brand: "apple", brandLabel: "Apple",
      name: "iPhone 13 128GB", color: "Meia-noite",
      condition: "seminovo", price: 2899, oldPrice: 3299 },
    { id: "iphone-14-256", brand: "apple", brandLabel: "Apple",
      name: "iPhone 14 256GB", color: "Estelar",
      condition: "novo", price: 4599, oldPrice: null },
    { id: "iphone-11-64", brand: "apple", brandLabel: "Apple",
      name: "iPhone 11 64GB", color: "Preto",
      condition: "seminovo", price: 1799, oldPrice: 1999 },
    { id: "galaxy-s23", brand: "samsung", brandLabel: "Samsung",
      name: "Galaxy S23 256GB", color: "Verde",
      condition: "novo", price: 3499, oldPrice: null },
    { id: "galaxy-a54", brand: "samsung", brandLabel: "Samsung",
      name: "Galaxy A54 128GB", color: "Grafite",
      condition: "seminovo", price: 1599, oldPrice: 1849 },
    { id: "redmi-note-13", brand: "xiaomi", brandLabel: "Xiaomi",
      name: "Redmi Note 13 256GB", color: "Azul",
      condition: "novo", price: 1499, oldPrice: 1699 },
    { id: "poco-x6-pro", brand: "xiaomi", brandLabel: "Xiaomi",
      name: "Poco X6 Pro 512GB", color: "Preto",
      condition: "novo", price: 2199, oldPrice: null },
    { id: "moto-g84", brand: "motorola", brandLabel: "Motorola",
      name: "Moto G84 256GB", color: "Azul Marinho",
      condition: "seminovo", price: 1299, oldPrice: 1499 },
    { id: "moto-edge-40", brand: "motorola", brandLabel: "Motorola",
      name: "Moto Edge 40 256GB", color: "Preto",
      condition: "novo", price: 2599, oldPrice: null },
    { id: "iphone-12-128", brand: "apple", brandLabel: "Apple",
      name: "iPhone 12 128GB", color: "Branco",
      condition: "seminovo", price: 2399, oldPrice: 2699 },
    { id: "galaxy-s22", brand: "samsung", brandLabel: "Samsung",
      name: "Galaxy S22 128GB", color: "Rosé",
      condition: "seminovo", price: 2099, oldPrice: 2399 }
  ];

  // ---- DADOS DE EXEMPLO: acessórios (PLACEHOLDER) -----------------------
  // icon = chave do SVG por categoria (ACC_ICONS). desc = texto curto do modal.
  var ACCESSORIES = [
    { id: "fone-tws", cat: "Fones", icon: "fones", price: 129,
      name: "Fone Bluetooth TWS",
      desc: "Fone sem fio com estojo de recarga, cancelamento de ruído e boa autonomia — ideal para o dia a dia." },
    { id: "capa-anti-impacto", cat: "Capinhas", icon: "capas", price: 49,
      name: "Capa Anti-impacto",
      desc: "Proteção reforçada nas quatro bordas, toque emborrachado e recorte preciso para botões e câmeras." },
    { id: "carregador-turbo", cat: "Carregadores", icon: "carregadores", price: 89,
      name: "Carregador Turbo 20W",
      desc: "Carregamento rápido com proteção contra sobrecarga — recupera boa parte da bateria em minutos." },
    { id: "pelicula-3d", cat: "Películas", icon: "peliculas", price: 39,
      name: "Película 3D de Vidro",
      desc: "Vidro temperado com cobertura total da tela, alta transparência e resistência a riscos." },
    { id: "cabo-usbc", cat: "Cabos", icon: "cabos", price: 35,
      name: "Cabo USB-C Reforçado",
      desc: "Cabo trançado durável com transferência rápida e conectores resistentes ao uso frequente." },
    { id: "caixa-som", cat: "Caixas de Som", icon: "som", price: 199,
      name: "Caixa de Som Bluetooth",
      desc: "Som potente e graves reforçados, à prova de respingos, com horas de reprodução sem fio." },
    { id: "smartwatch-fit", cat: "Smartwatches", icon: "watch", price: 279,
      name: "Smartwatch Fit",
      desc: "Monitoramento de atividades, notificações e frequência cardíaca, com várias faces de relógio." },
    { id: "power-bank-10k", cat: "Power Banks", icon: "powerbank", price: 149,
      name: "Power Bank 10.000mAh",
      desc: "Bateria portátil com carga para vários reforços no dia, saída rápida e indicador de nível." }
  ];

  // ---- Helpers ----------------------------------------------------------
  function formatPrice(value) {
    return "R$ " + Number(value).toFixed(2).replace(".", ",").replace(/\d(?=(\d{3})+,)/g, "$&.");
  }

  function conditionLabel(cond) {
    return cond === "novo" ? "Novo" : "Seminovo";
  }

  // Monta o link wa.me com a mensagem pré-preenchida do APARELHO.
  function whatsappLink(product) {
    var msg =
      "Olá! Tenho interesse no " + product.name +
      " (" + conditionLabel(product.condition).toLowerCase() + ")" +
      ", cor " + product.color +
      ", no valor de " + formatPrice(product.price) +
      ". Ainda está disponível?";
    return "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(msg);
  }

  // Link wa.me para o ACESSÓRIO (usado no CTA do modal).
  function whatsappLinkAccessory(item) {
    var msg =
      "Olá! Tenho interesse no acessório " + item.name +
      " (" + item.cat + "), no valor de " + formatPrice(item.price) +
      ". Ainda está disponível?";
    return "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(msg);
  }

  // ---- Exposição p/ o showroom (showroom.js) ---------------------------
  // Fonte ÚNICA de catálogo + link de WhatsApp: o showroom reusa daqui, sem
  // duplicar o número nem os produtos (Regra 74). Só expõe leitura.
  window.MARCELINHO_CONFIG.products = PRODUCTS;
  window.MARCELINHO_CONFIG.whatsappLink = whatsappLink;

  var WHATS_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7C17.18 3.03 14.68 2 12.04 2Zm5.8 14.14c-.24.68-1.4 1.31-1.93 1.35-.5.05-1 .24-3.37-.7-2.86-1.14-4.7-4.04-4.84-4.23-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.58.83 2 .9 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.15.46.13.63-.08.17-.21.72-.84.92-1.13.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.15.48.22.55.34.07.13.07.72-.17 1.4Z"/></svg>';

  // ---- Ícones por categoria (mockup Fase 1; troca por foto real na Fase 2) --
  function svg(inner) {
    return '<svg class="acc-card__icon" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  }
  var ACC_ICONS = {
    fones: svg('<path d="M4 13a8 8 0 0 1 16 0"/><rect x="2.5" y="13" width="4" height="7" rx="2"/><rect x="17.5" y="13" width="4" height="7" rx="2"/>'),
    capas: svg('<rect x="6" y="2" width="12" height="20" rx="3"/><circle cx="9" cy="6" r="1"/><path d="M8 2v3"/>'),
    carregadores: svg('<path d="M9 2v4M15 2v4"/><rect x="7" y="6" width="10" height="7" rx="2"/><path d="M12 13v4a3 3 0 0 0 3 3h1"/>'),
    peliculas: svg('<path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    cabos: svg('<rect x="3" y="2" width="4" height="4" rx="1"/><path d="M5 6v4a4 4 0 0 0 4 4h6a4 4 0 0 1 4 4v0"/><rect x="17" y="18" width="4" height="4" rx="1"/>'),
    som: svg('<rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="14" r="3.5"/><circle cx="12" cy="7" r="1"/>'),
    watch: svg('<rect x="7" y="7" width="10" height="10" rx="3"/><path d="M9 7V4h6v3M9 17v3h6v-3"/>'),
    powerbank: svg('<rect x="4" y="7" width="16" height="10" rx="2"/><path d="M20 10.5v3"/><path d="M11 9l-2 3h3l-2 3"/>')
  };

  function accMedia(item) {
    return (
      '<span class="acc-card__media">' +
      '<span class="acc-card__glow" aria-hidden="true"></span>' +
      (ACC_ICONS[item.icon] || ACC_ICONS.fones) +
      '<span class="acc-card__gloss" aria-hidden="true"></span>' +
      '<span class="acc-card__ph">Imagem de exemplo</span>' +
      "</span>"
    );
  }

  function buildAccCard(item) {
    return (
      '<article class="acc-card" role="listitem" data-id="' + item.id + '">' +
      accMedia(item) +
      '<div class="acc-card__body">' +
      '<span class="acc-card__cat">' + item.cat + "</span>" +
      '<h3 class="acc-card__name">' + item.name + "</h3>" +
      '<span class="acc-card__price">' + formatPrice(item.price) + "</span>" +
      '<button type="button" class="btn btn--primary btn--block acc-card__details" ' +
      'data-id="' + item.id + '">Ver detalhes</button>' +
      "</div>" +
      "</article>"
    );
  }

  // ---- Modal "Ver detalhes" do acessório --------------------------------
  // Injetado uma vez no fim do body. Fecha por X / backdrop / Esc; devolve o
  // foco ao botão que o abriu. Trava a rolagem de fundo enquanto aberto.
  function createAccModal() {
    var modal = document.createElement("div");
    modal.className = "acc-modal";
    modal.id = "accModal";
    modal.hidden = true;
    modal.innerHTML =
      '<div class="acc-modal__backdrop" data-close></div>' +
      '<div class="acc-modal__panel" role="dialog" aria-modal="true" aria-labelledby="accModalName">' +
      '<button type="button" class="acc-modal__close" data-close aria-label="Fechar">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>' +
      "</button>" +
      '<div class="acc-modal__media" id="accModalMedia"></div>' +
      '<div class="acc-modal__body">' +
      '<span class="acc-modal__cat" id="accModalCat"></span>' +
      '<h3 class="acc-modal__name" id="accModalName"></h3>' +
      '<p class="acc-modal__desc" id="accModalDesc"></p>' +
      '<span class="acc-modal__price" id="accModalPrice"></span>' +
      '<a class="btn btn--whats btn--block acc-modal__cta" id="accModalCta" target="_blank" rel="noopener">' +
      WHATS_SVG + "Tenho interesse</a>" +
      "</div>" +
      "</div>";
    document.body.appendChild(modal);
    return modal;
  }

  // ---- Boot: carrossel de acessórios ------------------------------------
  var track = document.getElementById("acessoriosTrack");
  if (track) {
    track.innerHTML = ACCESSORIES.map(buildAccCard).join("");

    var carousel = track.parentNode; // .acessorios-carousel (position: relative)
    var byId = {};
    ACCESSORIES.forEach(function (a) { byId[a.id] = a; });

    // --- Setas prev/next (injetadas; roláveis por card) ---
    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "acessorios-carousel__arrow acessorios-carousel__arrow--prev";
    prev.setAttribute("aria-label", "Acessórios anteriores");
    prev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var next = document.createElement("button");
    next.type = "button";
    next.className = "acessorios-carousel__arrow acessorios-carousel__arrow--next";
    next.setAttribute("aria-label", "Próximos acessórios");
    next.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    carousel.appendChild(prev);
    carousel.appendChild(next);

    function stepSize() {
      var card = track.querySelector(".acc-card");
      // largura do card + gap (fallback razoável se ainda não medido).
      return card ? card.getBoundingClientRect().width + 20 : 260;
    }
    function updateArrows() {
      // Sem overflow (tudo cabe): esconde as setas.
      var overflow = track.scrollWidth - track.clientWidth > 2;
      prev.hidden = !overflow;
      next.hidden = !overflow;
      if (!overflow) return;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= (track.scrollWidth - track.clientWidth - 1);
    }
    prev.addEventListener("click", function () {
      track.scrollBy({ left: -stepSize(), behavior: "smooth" });
    });
    next.addEventListener("click", function () {
      track.scrollBy({ left: stepSize(), behavior: "smooth" });
    });
    track.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);

    // --- Arraste com o mouse (desktop). No touch, a rolagem nativa
    //     (overflow-x:auto) já cuida; não interferimos. ---
    var down = false, moved = false, startX = 0, startScroll = 0;
    track.addEventListener("mousedown", function (e) {
      down = true; moved = false;
      startX = e.pageX; startScroll = track.scrollLeft;
      track.classList.add("is-dragging");
    });
    window.addEventListener("mousemove", function (e) {
      if (!down) return;
      var dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    window.addEventListener("mouseup", function () {
      if (!down) return;
      down = false;
      track.classList.remove("is-dragging");
    });
    // Após um arraste real, cancela o clique que abriria o modal.
    track.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    // --- Modal "Ver detalhes" ---
    var modal = createAccModal();
    var lastTrigger = null;
    var prevOverflow = "";
    var mMedia = modal.querySelector("#accModalMedia");
    var mCat = modal.querySelector("#accModalCat");
    var mName = modal.querySelector("#accModalName");
    var mDesc = modal.querySelector("#accModalDesc");
    var mPrice = modal.querySelector("#accModalPrice");
    var mCta = modal.querySelector("#accModalCta");
    var mClose = modal.querySelector(".acc-modal__close");

    function openModal(item, trigger) {
      lastTrigger = trigger || null;
      mMedia.innerHTML = accMedia(item);
      mCat.textContent = item.cat;
      mName.textContent = item.name;
      mDesc.textContent = item.desc || "";
      mPrice.textContent = formatPrice(item.price);
      mCta.setAttribute("href", whatsappLinkAccessory(item));
      modal.hidden = false;
      // trava a rolagem de fundo (restaura no fechamento).
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onEsc, true);
      mClose.focus();
    }
    function closeModal() {
      if (modal.hidden) return;
      modal.hidden = true;
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onEsc, true);
      if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
      lastTrigger = null;
    }
    function onEsc(e) {
      if (e.key === "Escape") { e.preventDefault(); closeModal(); }
    }

    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) closeModal();
    });

    track.addEventListener("click", function (e) {
      var btn = e.target.closest(".acc-card__details");
      if (!btn) return;
      var item = byId[btn.getAttribute("data-id")];
      if (item) openModal(item, btn);
    });

    updateArrows();
  }
})();
