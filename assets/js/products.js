/* =========================================================
   PRODUCTS.JS — MARCELINHO
   Catálogo (aparelhos + acessórios) EMBUTIDO no front (Fase 1,
   sem banco). Renderiza os cards, os filtros por condição/marca
   e monta o botão WhatsApp por produto com link wa.me
   pré-preenchido (modelo + cor + condição + valor).

   >>> TODOS OS DADOS ABAIXO SÃO DE EXEMPLO (PLACEHOLDER) <<<
   Nada aqui é dado real do MARCELINHO. Ver o bloco
   "O QUE PRECISA SER TROCADO PELO DADO REAL" logo abaixo.

   Roda ANTES de scroll-reveal.js (ver ordem dos <script> em
   index.html): injeta os cards .reveal de forma síncrona, para
   que já existam no DOM quando o observer for criado.
   ========================================================= */

/* =========================================================
   ⚠️ O QUE PRECISA SER TROCADO PELO DADO REAL DO CLIENTE
   ---------------------------------------------------------
   1) WHATSAPP_NUMERO  → número oficial do MARCELINHO (só dígitos,
      com DDI+DDD, ex.: 5515999999999). Hoje = "55SEUNUMERO".
   2) PRODUCTS[]       → catálogo real (modelo, marca, condição,
      cor, preço, preço antigo/oferta, armazenamento) + fotos reais
      em assets/img/products/ (trocar photoPlaceholder por img real).
   3) ACCESSORIES[]    → acessórios reais (capas/películas/etc) + fotos.
   4) Textos institucionais, telefone, endereço, horário e redes
      ficam no index.html marcados com <!-- PLACEHOLDER: ... -->.
   ========================================================= */

(function () {
  "use strict";

  // ---- CONFIG: número de WhatsApp (PLACEHOLDER) --------------------------
  // Formato wa.me: só dígitos, DDI + DDD + número. Ex.: 5515999998888
  var WHATSAPP_NUMERO = "55SEUNUMERO"; // PLACEHOLDER — trocar pelo número real
  // Exposto para o formulário de orçamento (main.js) usar o mesmo número:
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
  var ACCESSORIES = [
    { id: "capa-anti-impacto", cat: "Capas", name: "Capa Anti-impacto", price: 49 },
    { id: "pelicula-3d", cat: "Películas", name: "Película 3D de Vidro", price: 39 },
    { id: "carregador-turbo", cat: "Carregadores", name: "Carregador Turbo 20W", price: 89 },
    { id: "fone-bluetooth", cat: "Fones", name: "Fone Bluetooth TWS", price: 129 }
  ];

  // ---- FILTROS do catálogo ---------------------------------------------
  // type: "all" mostra tudo; "condition"/"brand" filtram pelo campo.
  var FILTERS = [
    { type: "all", value: "all", label: "Todos" },
    { type: "condition", value: "novo", label: "Novos" },
    { type: "condition", value: "seminovo", label: "Seminovos" },
    { type: "brand", value: "apple", label: "Apple" },
    { type: "brand", value: "samsung", label: "Samsung" },
    { type: "brand", value: "xiaomi", label: "Xiaomi" },
    { type: "brand", value: "motorola", label: "Motorola" },
    { type: "oferta", value: "oferta", label: "Ofertas" }
  ];

  // ---- Helpers ----------------------------------------------------------
  function formatPrice(value) {
    return "R$ " + value.toFixed(2).replace(".", ",").replace(/\d(?=(\d{3})+,)/g, "$&.");
  }

  function conditionLabel(cond) {
    return cond === "novo" ? "Novo" : "Seminovo";
  }

  // Monta o link wa.me com a mensagem pré-preenchida do produto.
  function whatsappLink(product) {
    var msg =
      "Olá! Tenho interesse no " + product.name +
      " (" + conditionLabel(product.condition).toLowerCase() + ")" +
      ", cor " + product.color +
      ", no valor de " + formatPrice(product.price) +
      ". Ainda está disponível?";
    return "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(msg);
  }

  function whatsappLinkAccessory(item) {
    var msg =
      "Olá! Tenho interesse no acessório " + item.name +
      " (" + item.cat + "), no valor de " + formatPrice(item.price) +
      ". Ainda está disponível?";
    return "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(msg);
  }

  // SVG de celular reutilizado nos placeholders de foto
  var PHONE_SVG =
    '<svg class="photo-placeholder__icon" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
    '<rect x="6" y="2" width="12" height="20" rx="2.5"/>' +
    '<path d="M10 18h4" stroke-linecap="round"/></svg>';

  var WHATS_SVG =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7C17.18 3.03 14.68 2 12.04 2Zm5.8 14.14c-.24.68-1.4 1.31-1.93 1.35-.5.05-1 .24-3.37-.7-2.86-1.14-4.7-4.04-4.84-4.23-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.58.83 2 .9 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.15.46.13.63-.08.17-.21.72-.84.92-1.13.19-.29.38-.24.63-.14.26.1 1.65.78 1.93.92.29.15.48.22.55.34.07.13.07.72-.17 1.4Z"/></svg>';

  // ---- Markup de card de PRODUTO ---------------------------------------
  function buildBadges(product) {
    var condClass = product.condition === "novo" ? "badge--novo" : "badge--seminovo";
    var html =
      '<span class="badge ' + condClass + '">' + conditionLabel(product.condition) + "</span>";
    if (product.oldPrice) {
      html += '<span class="badge badge--oferta">Oferta</span>';
    }
    return '<div class="product-card__badges">' + html + "</div>";
  }

  function buildPrice(product) {
    var old = product.oldPrice
      ? '<span class="product-card__price-old">' + formatPrice(product.oldPrice) + "</span>"
      : "";
    return (
      '<div class="product-card__price">' + old +
      '<span class="product-card__price-value">' + formatPrice(product.price) + "</span>" +
      "</div>"
    );
  }

  // PLACEHOLDER de foto (não há fotos reais ainda). Quando as fotos
  // chegarem, trocar este bloco por:
  // <img class="product-card__img" src="assets/img/products/ID.jpg"
  //      alt="Descrição real" width="800" height="600"
  //      loading="lazy" decoding="async" />
  function buildPhoto() {
    return (
      '<div class="photo-placeholder">' +
      '<div class="photo-placeholder__label">' + PHONE_SVG +
      "Imagem de exemplo<br>foto real do cliente" +
      "</div></div>"
    );
  }

  function buildProductCard(product) {
    return (
      '<article class="product-card reveal" data-condition="' + product.condition +
      '" data-brand="' + product.brand + '">' +
      '<div class="product-card__media">' +
      buildBadges(product) +
      buildPhoto() +
      "</div>" +
      '<div class="product-card__body">' +
      '<span class="product-card__brand">' + product.brandLabel + "</span>" +
      '<h3 class="product-card__name">' + product.name + "</h3>" +
      '<p class="product-card__meta">Cor: ' + product.color + "</p>" +
      buildPrice(product) +
      '<div class="product-card__actions">' +
      '<a class="btn btn--whats btn--block" href="' + whatsappLink(product) +
      '" target="_blank" rel="noopener" ' +
      'aria-label="Falar no WhatsApp sobre ' + product.name + '">' +
      WHATS_SVG + "Tenho interesse</a>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  // ---- Markup de card de ACESSÓRIO -------------------------------------
  function buildAccessoryCard(item) {
    return (
      '<article class="acessorio-card reveal">' +
      buildPhoto() +
      '<div class="acessorio-card__body">' +
      '<span class="acessorio-card__cat">' + item.cat + "</span>" +
      '<h3 class="acessorio-card__name">' + item.name + "</h3>" +
      '<span class="acessorio-card__price">' + formatPrice(item.price) + "</span>" +
      '<div class="acessorio-card__actions">' +
      '<a class="btn btn--whats btn--small btn--block" href="' + whatsappLinkAccessory(item) +
      '" target="_blank" rel="noopener" ' +
      'aria-label="Falar no WhatsApp sobre ' + item.name + '">' +
      WHATS_SVG + "Quero este</a>" +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  // ---- Render do catálogo + filtros ------------------------------------
  function matchFilter(product, filter) {
    if (filter.type === "all") return true;
    if (filter.type === "condition") return product.condition === filter.value;
    if (filter.type === "brand") return product.brand === filter.value;
    if (filter.type === "oferta") return !!product.oldPrice;
    return true;
  }

  // reveal=true => marca os cards como visíveis imediatamente. Necessário
  // nos RE-RENDERS (clique em filtro/categoria), pois o IntersectionObserver
  // de scroll-reveal.js só observa os cards existentes no load — cards
  // injetados depois nunca receberiam .is-visible e ficariam invisíveis
  // (opacity:0). No 1º render (reveal=false) deixamos o observer animar.
  function renderCatalog(grid, filter, reveal) {
    var list = PRODUCTS.filter(function (p) { return matchFilter(p, filter); });
    grid.innerHTML = list.length
      ? list.map(buildProductCard).join("")
      : '<p class="product-card__meta">Nenhum aparelho nesta categoria por enquanto.</p>';
    if (reveal) {
      grid.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
  }

  function buildFiltersMarkup(active) {
    return FILTERS.map(function (f) {
      var isActive = f.type === active.type && f.value === active.value ? " is-active" : "";
      return (
        '<button type="button" class="filter' + isActive +
        '" data-type="' + f.type + '" data-value="' + f.value + '"' +
        (isActive ? ' aria-pressed="true"' : ' aria-pressed="false"') + ">" +
        f.label + "</button>"
      );
    }).join("");
  }

  // ---- Boot -------------------------------------------------------------
  var grid = document.querySelector(".vitrine-grid");
  if (grid) {
    var activeFilter = FILTERS[0];

    var filtersWrap = document.createElement("div");
    filtersWrap.className = "filters reveal";
    filtersWrap.setAttribute("role", "group");
    filtersWrap.setAttribute("aria-label", "Filtrar aparelhos por condição ou marca");
    filtersWrap.innerHTML = buildFiltersMarkup(activeFilter);
    grid.parentNode.insertBefore(filtersWrap, grid);

    // Aplica um filtro por type/value: atualiza estado dos botões e re-renderiza
    // com reveal=true (cards já visíveis, sem depender do observer de scroll).
    function applyFilter(type, value) {
      activeFilter = { type: type, value: value };
      filtersWrap.querySelectorAll(".filter").forEach(function (b) {
        var on = b.getAttribute("data-type") === type && b.getAttribute("data-value") === value;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      renderCatalog(grid, activeFilter, true);
    }

    filtersWrap.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (!btn) return;
      applyFilter(btn.getAttribute("data-type"), btn.getAttribute("data-value"));
    });

    // ---- Dropdown "Categorias" do dock: opções = TIPOS de item ----------
    // Fonte única = FILTERS. Escolher um tipo: (1) aplica o filtro no catálogo
    // e (2) abre a aba "Aparelhos" (SPA, in-page — nunca link externo).
    var dockMenu = document.getElementById("dockCategoriasMenu");
    if (dockMenu) {
      dockMenu.innerHTML = FILTERS.map(function (f) {
        return (
          '<button type="button" class="nav-dock__opt"' +
          ' data-type="' + f.type + '" data-value="' + f.value + '">' +
          f.label + "</button>"
        );
      }).join("");

      dockMenu.addEventListener("click", function (e) {
        var opt = e.target.closest(".nav-dock__opt");
        if (!opt) return;
        applyFilter(opt.getAttribute("data-type"), opt.getAttribute("data-value"));
        if (window.MarcelinhoNav && typeof window.MarcelinhoNav.go === "function") {
          window.MarcelinhoNav.go("aparelhos"); // abre a aba já filtrada
        }
        // O fechamento do menu é tratado por nav.js (delegação em .nav-dock__opt).
      });
    }

    renderCatalog(grid, activeFilter, false);
  }

  // ---- Boot: acessórios -------------------------------------------------
  var accGrid = document.querySelector(".acessorios-grid");
  if (accGrid) {
    accGrid.innerHTML = ACCESSORIES.map(buildAccessoryCard).join("");
  }
})();
