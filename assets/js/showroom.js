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
      : "https://wa.me/" + (cfg.whatsapp || "5515997031149");
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
  // Hook do palco 3D (setado pelo IIFE 3D no fim). Recebe o produto CENTRAL
  // atual (ou null quando a categoria fica vazia) e decide, PELA MARCA, se
  // monta/mostra o modelo 3D (hoje só Samsung => S24) ou volta ao mockup CSS.
  var updateHero3d = null;

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
    if (updateHero3d) updateHero3d(currentList[center]); // marca do novo central
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
      if (updateHero3d) updateHero3d(null); // categoria vazia: nada a destacar
      updateArrows();
      return;
    }
    center = Math.floor((currentList.length - 1) / 2);
    phones = currentList.map(buildPhone);
    phones.forEach(function (p) { track.appendChild(p); });
    layout();
    renderInfo(currentList[center]);
    if (updateHero3d) updateHero3d(currentList[center]); // marca do central inicial
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

  /* =========================================================
     PALCO 3D DO APARELHO EM DESTAQUE — dirigido por MARCA (Samsung=S24)
     ---------------------------------------------------------
     Modelo 3D associado por MARCA via REGISTRY (ver MODEL_BY_BRAND
     abaixo): quando o central é Samsung, sobe o Galaxy S24 procedural;
     qualquer outra marca (Apple/Motorola/Xiaomi/…) esconde o palco e
     fica o mockup CSS do card central (modelo padrão). É um MODELO 3D
     REAL do S24 (geometria PROCEDURAL em Three.js + CanvasTexture, zero
     .glb), sobreposto ao SLOT CENTRAL do coverflow (que é sempre a mesma
     posição de tela). NÃO altero a mecânica de coverflow: o palco é
     um <div> irmão do track, pointer-events:none (cliques passam p/
     os cards), z entre o card central e o hover lateral. Quando o
     3D sobe, o CSS esconde só o corpo do card central (class
     has-3d) — os laterais seguem mockup CSS. O aparelho fica em
     "flutuação contínua + rotação contínua" (padrão da bola do
     SLAMDUNK/hero: giro Y por frame + senoide de flutuação + lerp).

     Técnica reaproveitada da Hero (hero-iphone-3d.js, Regra 80 — a
     MECÂNICA, nunca o layout): três@importmap via import() dinâmico
     (módulo já em cache do hero → 0 rede extra), PMREM+RoomEnvironment,
     ACES, luz de acento laranja de token. Só a GEOMETRIA muda p/ o S24
     (slab flat, punch-hole central, 3 câmeras verticais SEM ilha).

     Performance/salvaguardas (espelham o hero): só constrói quando o
     palco entra no viewport (IntersectionObserver, lazy); rAF só com
     palco visível E aba visível (visibilitychange) — a rotação é
     frame-based, então aba/scroll oculto NÃO acumula tempo; sem
     WebGL / prefers-reduced-motion / contexto perdido → fallback
     gracioso: fica o card central em mockup CSS (comportamento atual).
     ========================================================= */
  (function () {
    var reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return; // sem 3D: fica o mockup CSS (acessível)

    var uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    var isMobile = window.innerWidth < 720 || coarse || uaMobile;
    var MAX_DPR = isMobile ? 1.5 : 2;

    /* ---- REGISTRY marca -> modelo 3D (DADO/config, Regra 74) --------------
       Associação do "modelo 3D" por MARCA (solução temporária). Precedência
       FUTURA prevista: produto > marca > padrão (mockup CSS). Hoje só a
       Samsung tem modelo 3D — o Galaxy S24 procedural construído em
       buildScene(); TODO Samsung (S24/S23/A54…) usa esse MESMO modelo.
       Apple/Motorola/Xiaomi/Realme/… => sem chave => "modelo padrão" = card
       CSS do coverflow (palco 3D escondido). Para evoluir sem tocar na lógica
       de palco, basta registrar aqui a chave do modelo + (no futuro) seu
       builder: MODEL_BY_PRODUCT p/ precedência por produto (ex.:
       "iphone-15-pro" -> "iphone15"), MODEL_BY_BRAND p/ o padrão da marca. */
    var MODEL_BY_PRODUCT = {};                  // futuro: precedência por produto
    var MODEL_BY_BRAND   = { samsung: "s24" };  // demais marcas => null (CSS)
    function modelKeyFor(product) {
      if (!product) return null;
      return MODEL_BY_PRODUCT[product.id] || MODEL_BY_BRAND[product.brand] || null;
    }
    var built3dKey = "s24"; // a única cena WebGL construída hoje renderiza o S24

    // Contêiner do palco (irmão do track/setas). pointer-events:none no CSS.
    var host = document.createElement("div");
    host.className = "showroom__hero3d";
    host.setAttribute("aria-hidden", "true"); // decorativo: a info textual é o card
    stage.appendChild(host);

    var renderer, scene, camera, rig, phone, halo, haloMat, pmrem;
    var MAX_ANISO = 1;
    var raf = 0, running = false, dead = false, built = false, inView = false;
    var wantShow = false; // o central atual tem modelo 3D (Samsung => S24)?
    var painted = false; // 1º frame 3D pintado (só então esconde o card central)
    var spinY = 0, floatPhase = 0;
    var CENTER_SCALE = isMobile ? 1.06 : 1.28;
    var SPIN_SPEED = 0.009;   // giro turntable (mesmo valor do hero: objeto vivo)
    var FLOAT_SPEED = 0.02;   // avanço da senoide de flutuação (por frame)
    var FLOAT_AMP = 0.05;     // amplitude da flutuação (unidades de mundo)
    function lerp(a, b, f) { return a + (b - a) * f; }

    function buildScene(THREE, RoomEnvironment) {
      var css = window.getComputedStyle(document.documentElement);
      function token(name, fb) {
        var v = (css.getPropertyValue(name) || "").trim();
        return v || fb;
      }
      var BRAND_ORANGE = token("--color-orange", "#f26a1b");
      var BRAND_NAVY = token("--color-navy", "#163a6b");
      var BRAND_NAVY_DEEP = token("--color-navy-deep", "#0b1f3d");
      var BRAND_NAVY_STRONG = token("--color-navy-strong", "#0f2b52");

      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch (e) {
        return false;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      host.appendChild(renderer.domElement);
      MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.set(0, 0.02, 5.0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.42));
      var key = new THREE.SpotLight(0xffffff, 4.0);
      key.position.set(-2, 12, 5); key.angle = 0.3; key.penumbra = 1; key.decay = 0;
      scene.add(key);
      var accent = new THREE.SpotLight(new THREE.Color(BRAND_ORANGE), 4.6);
      accent.position.set(5, 0, -5); accent.angle = 0.5; accent.penumbra = 1; accent.decay = 0;
      scene.add(accent);
      var fill = new THREE.PointLight(new THREE.Color(BRAND_NAVY), 1.0);
      fill.position.set(-5, 0, 5); fill.decay = 0;
      scene.add(fill);

      pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

      /* ---- Helpers de geometria/textura (mesma técnica do hero) ---- */
      function roundedRectShape(w, h, r) {
        var s = new THREE.Shape();
        var x = -w / 2, y = -h / 2;
        s.moveTo(x + r, y);
        s.lineTo(x + w - r, y);
        s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
        s.lineTo(x + w, y + h - r);
        s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
        s.lineTo(x + r, y + h);
        s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
        s.lineTo(x, y + r);
        s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
        return s;
      }
      function normalizeUVs(geo) {
        geo.computeBoundingBox();
        var bb = geo.boundingBox;
        var sx = bb.max.x - bb.min.x || 1;
        var sy = bb.max.y - bb.min.y || 1;
        var pos = geo.attributes.position, uv = geo.attributes.uv;
        for (var i = 0; i < uv.count; i++) {
          uv.setXY(i, (pos.getX(i) - bb.min.x) / sx, (pos.getY(i) - bb.min.y) / sy);
        }
        uv.needsUpdate = true;
        return geo;
      }
      function brushedTexture(base, noise, w, h) {
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        var x = c.getContext("2d");
        x.fillStyle = base; x.fillRect(0, 0, w, h);
        var img = x.getImageData(0, 0, w, h), d = img.data;
        for (var i = 0; i < d.length; i += 4) {
          var n = (Math.random() - 0.5) * noise;
          d[i] = Math.min(255, Math.max(0, d[i] + n));
          d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
          d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
        }
        x.putImageData(img, 0, 0);
        var t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO;
        return t;
      }
      function roughStreakTexture() {
        var S = 128;
        var c = document.createElement("canvas");
        c.width = c.height = S;
        var g = c.getContext("2d");
        g.fillStyle = "#cfcfcf"; g.fillRect(0, 0, S, S);
        for (var i = 0; i < 70; i++) {
          var gx = Math.random() * S, v = 150 + Math.random() * 90;
          g.strokeStyle = "rgba(" + v + "," + v + "," + v + ",0.35)";
          g.lineWidth = 0.5 + Math.random() * 1.5;
          g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx + (Math.random() - 0.5) * 4, S); g.stroke();
        }
        var t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = MAX_ANISO;
        return t;
      }
      var roughMap = roughStreakTexture();

      /* ===== S24: slab FLAT, cantos menos arredondados que o iPhone ===== */
      var PW = 0.74, PH = 1.54, PR = 0.085;

      phone = new THREE.Group();

      // Moldura (frame de alumínio escovado — tom titânio/grafite Samsung)
      var frameGeo = new THREE.ExtrudeGeometry(roundedRectShape(PW, PH, PR), {
        depth: 0.052, bevelEnabled: true, bevelThickness: 0.008,
        bevelSize: 0.007, bevelSegments: 4, curveSegments: 14
      });
      frameGeo.center();
      var frameMat = new THREE.MeshStandardMaterial({
        map: brushedTexture("#9aa0a8", 16, 256, 256), roughnessMap: roughMap,
        metalness: 0.9, roughness: 0.25, envMapIntensity: 1.9
      });
      phone.add(new THREE.Mesh(frameGeo, frameMat));

      // TELA limpa premium (apagada): gradiente navy + sheen + punch-hole central.
      function screenTexture() {
        var W = 512, H = 1024;
        var c = document.createElement("canvas");
        c.width = W; c.height = H;
        var x = c.getContext("2d");
        var g = x.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, BRAND_NAVY_STRONG);
        g.addColorStop(0.5, BRAND_NAVY_DEEP);
        g.addColorStop(1, "#060f1e");
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        var sh = x.createLinearGradient(0, 0, W, H * 0.55);
        sh.addColorStop(0, "rgba(255,255,255,0.06)");
        sh.addColorStop(0.4, "rgba(255,255,255,0)");
        x.fillStyle = sh; x.fillRect(0, 0, W, H);
        // Punch-hole central (marca registrada do S24), bem no topo.
        x.fillStyle = "#04070d";
        x.beginPath(); x.arc(W / 2, 52, 15, 0, Math.PI * 2); x.fill();
        x.strokeStyle = "rgba(120,140,170,0.45)"; x.lineWidth = 2;
        x.beginPath(); x.arc(W / 2, 52, 16, 0, Math.PI * 2); x.stroke();
        var t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO;
        return t;
      }
      var screenGeo = normalizeUVs(
        new THREE.ShapeGeometry(roundedRectShape(PW - 0.05, PH - 0.05, PR - 0.02), 14)
      );
      var screen = new THREE.Mesh(
        screenGeo, new THREE.MeshBasicMaterial({ map: screenTexture() })
      );
      screen.position.z = 0.0275;
      phone.add(screen);

      var glass = new THREE.Mesh(
        screenGeo.clone(),
        new THREE.MeshStandardMaterial({
          color: 0xffffff, transparent: true, opacity: 0.12,
          metalness: 0, roughness: 0.05, envMapIntensity: 2.2, depthWrite: false
        })
      );
      glass.position.z = 0.029;
      phone.add(glass);

      // Traseira: cor sólida "marble" com sheen + wordmark discreto SAMSUNG.
      function backTexture() {
        var W = 256, H = 512;
        var c = document.createElement("canvas");
        c.width = W; c.height = H;
        var x = c.getContext("2d");
        var g = x.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, "#6d7178"); g.addColorStop(0.5, "#585c63"); g.addColorStop(1, "#4c4f56");
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        var img = x.getImageData(0, 0, W, H), d = img.data;
        for (var i = 0; i < d.length; i += 4) {
          var n = (Math.random() - 0.5) * 8;
          d[i] += n; d[i + 1] += n; d[i + 2] += n;
        }
        x.putImageData(img, 0, 0);
        x.save();
        x.translate(W / 2, H * 0.9); x.scale(-1, 1); // espelha p/ ler certo na face traseira
        x.fillStyle = "rgba(230,232,236,0.55)"; x.textAlign = "center";
        x.font = "600 20px Inter, system-ui, sans-serif";
        x.fillText("SAMSUNG", 0, 0);
        x.restore();
        var t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO;
        return t;
      }
      var back = new THREE.Mesh(
        normalizeUVs(new THREE.ShapeGeometry(roundedRectShape(PW - 0.04, PH - 0.04, PR - 0.015), 14)),
        new THREE.MeshStandardMaterial({
          map: backTexture(), roughnessMap: roughMap,
          metalness: 0.45, roughness: 0.34, envMapIntensity: 1.4
        })
      );
      back.rotation.y = Math.PI; back.position.z = -0.0275;
      phone.add(back);

      // Botões laterais (direita: power + volume) — cápsulas do próprio frame.
      function sideButton(h, y, sideX) {
        var b = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, h, 3, 8), frameMat);
        b.position.set(sideX, y, 0.006);
        return b;
      }
      phone.add(sideButton(0.14, 0.30, PW / 2 + 0.010));  // volume
      phone.add(sideButton(0.08, 0.10, PW / 2 + 0.010));  // power

      // ===== 3 CÂMERAS VERTICAIS, SEM ILHA (assinatura do S24) =====
      // Cada lente protrai direto da traseira, no canto superior. Como a
      // traseira olha p/ -z, as lentes ficam em z negativo, alinhadas em x.
      var lensRingMat = new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.95, roughness: 0.2, envMapIntensity: 1.8 });
      var lensGlassMat = new THREE.MeshStandardMaterial({ color: 0x0a1220, metalness: 0.2, roughness: 0.05, envMapIntensity: 2.4 });
      var camX = -0.20; // canto (esquerda vista de frente = câmeras à direita na traseira)
      var camY = [0.56, 0.40, 0.24];
      for (var li = 0; li < camY.length; li++) {
        var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.03, 26), lensRingMat);
        ring.rotation.x = Math.PI / 2; ring.position.set(camX, camY[li], -0.05);
        phone.add(ring);
        var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.028, 26), lensGlassMat);
        lens.rotation.x = Math.PI / 2; lens.position.set(camX, camY[li], -0.056);
        phone.add(lens);
      }
      // Flash + sensor, ao lado das lentes (pequenos, discretos).
      var flash = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.022, 16),
        new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xfff3d6, emissiveIntensity: 0.3, metalness: 0, roughness: 0.3 })
      );
      flash.rotation.x = Math.PI / 2; flash.position.set(-0.05, 0.56, -0.05);
      phone.add(flash);

      phone.rotation.set(-0.05, -0.42, 0.02); // pose de vitrine (fixa na peça)
      rig = new THREE.Group();
      rig.add(phone);
      rig.scale.setScalar(CENTER_SCALE);
      scene.add(rig);

      // HALO de marca atrás do aparelho (acompanha o rig) — igual conceito do hero.
      var sc = document.createElement("canvas");
      sc.width = sc.height = 256;
      (function () {
        var x = sc.getContext("2d");
        var g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, "rgba(242,106,27,0.38)");
        g.addColorStop(0.45, "rgba(242,106,27,0.13)");
        g.addColorStop(1, "rgba(242,106,27,0)");
        x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      })();
      haloMat = new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false
      });
      halo = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), haloMat);
      halo.position.z = -0.9;
      scene.add(halo);

      // Contexto WebGL perdido -> desmonta e volta ao mockup CSS (fail-safe).
      renderer.domElement.addEventListener("webglcontextlost", function (e) {
        e.preventDefault();
        teardown();
      }, false);

      return true;
    }

    function resize() {
      if (!renderer) return;
      var w = host.clientWidth || 1, h = host.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function tick() {
      if (!running) return;
      spinY += SPIN_SPEED;    // rotação contínua (frame-based: aba oculta não acumula)
      floatPhase += FLOAT_SPEED;
      var floatY = Math.sin(floatPhase) * FLOAT_AMP;
      // Suavização (lerp): "movimentos extremamente suaves", objeto em suspensão.
      rig.position.y = lerp(rig.position.y, floatY, 0.1);
      rig.rotation.y = lerp(rig.rotation.y, spinY, 0.12);
      if (halo) { halo.position.y = rig.position.y; }
      renderer.render(scene, camera);
      // Esconde o corpo do card central só APÓS o 1º frame 3D pintar (sem
      // janela de "centro vazio" caso a cena construa já visível).
      if (!painted) { painted = true; section.classList.add("has-3d"); }
      raf = window.requestAnimationFrame(tick);
    }
    function play() {
      if (running || dead || !renderer || !inView || document.hidden || !wantShow) return;
      running = true;
      raf = window.requestAnimationFrame(tick);
    }
    function pause() {
      if (!running) return;
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    }
    function teardown() {
      dead = true;
      pause();
      section.classList.remove("has-3d"); // volta o mockup CSS do card central
      if (io) io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      // Libera TODA a GPU/DOM desta cena (evento terminal, sem rebuild): dispose
      // de geometrias/materiais/texturas + PMREM + remove o canvas morto.
      if (scene) {
        scene.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (o.material.map) o.material.map.dispose();
            o.material.dispose();
          }
        });
      }
      if (pmrem) { try { pmrem.dispose(); } catch (e) {} }
      if (renderer) {
        try { renderer.dispose(); } catch (e) {}
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      scene = phone = halo = renderer = pmrem = null;
    }
    function onVis() { if (document.hidden) pause(); else play(); }
    function onResize() { resize(); }

    // Aplica o estado desejado (wantShow) + visibilidade (inView) à peça 3D,
    // reaproveitando a MESMA cena/contexto WebGL. Trocar de marca só PAUSA e
    // esconde (volta o card CSS) ou RETOMA — NUNCA cria/destrói contexto por
    // clique: mount/dismount por marca sem vazar contexto WebGL, à prova de
    // clique rápido Samsung<->não-Samsung. Dispose real fica só no teardown
    // (contexto perdido / sem WebGL / reduced-motion), evento terminal.
    function refresh() {
      if (dead || !wantShow) {              // sem 3D p/ este central (ou morto)
        pause();
        host.style.display = "none";
        section.classList.remove("has-3d"); // reexibe o mockup CSS do central
        return;
      }
      if (!inView) { pause(); return; }     // fora da viewport: pausa, mantém estado
      host.style.display = "";
      if (!built) { boot(); }               // 1ª vez: has-3d entra após o 1º frame (tick)
      else { resize(); play(); if (painted) section.classList.add("has-3d"); } // reexibe imediato
      // resize() no reexibir: se a janela foi redimensionada enquanto o palco
      // estava display:none (não-Samsung), o renderer teria ficado 1x1 (host
      // com clientWidth 0); revalida a dimensão antes de retomar o loop.
    }
    // Hook chamado pelo coverflow a cada troca de central (ou null se vazio):
    // decide PELA MARCA se há modelo 3D registrado (hoje só a cena S24).
    updateHero3d = function (product) {
      wantShow = (modelKeyFor(product) === built3dKey);
      refresh();
    };

    /* Carrega three (importmap, já em cache do hero) só quando o palco entra
       no viewport. Se falhar (CDN fora / sem WebGL) → mockup CSS segue. */
    var booting = false;
    function boot() {
      if (built || booting || dead) return;
      booting = true;
      import("three")
        .then(function (THREE) {
          return import(
            "https://esm.sh/three@0.182.0/examples/jsm/environments/RoomEnvironment.js"
          ).then(function (m) {
            if (dead) return;
            if (!buildScene(THREE, m.RoomEnvironment)) { teardown(); return; }
            built = true;
            resize();
            window.addEventListener("resize", onResize, { passive: true });
            document.addEventListener("visibilitychange", onVis);
            play();
          });
        })
        .catch(function () { teardown(); }); // sem three/WebGL -> fallback gracioso
    }

    // Sincroniza o estado inicial (wantShow) com o aparelho central já montado
    // pelo coverflow. NÃO constrói ainda (inView=false até a IO disparar) — só
    // define se este central pede 3D. Assim o boot segue lazy (viewport).
    updateHero3d(currentList.length ? currentList[center] : null);

    var io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        refresh(); // boot/play/pause conforme wantShow + viewport
      }, { threshold: 0.15 });
      io.observe(section);
    } else {
      inView = true; refresh(); // sem IO: resolve direto (navegador antigo)
    }
  })();
})();
