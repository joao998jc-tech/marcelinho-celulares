/* =========================================================
   HERO-IPHONE-3D.JS — MARCELINHO
   CONTROLADOR DA INTRO CINEMATOGRÁFICA (pedido João 2026-08-03).
   Substitui a antiga "jornada do celular pelas seções": agora o
   aparelho 3D vive SÓ dentro da abertura (#intro), na mesma página
   (sem trocar URL / sem reload) — decisão de arquitetura 4.2 do
   handoff: uma mecânica só, nunca dois celulares.

   FASES (window.__heroIntro.phaseState):
   - "mao"          progress 0: celular flutuando na palma do mascote
                    (leve sobe/desce + micro-rotação, contínuo/elegante).
   - "voando"       durante o scroll: sai da mão, aproxima com
                    profundidade (cresce de escala), ruma ao centro.
                    Amarrado ao progress do scroll e REVERSÍVEL (voltar
                    o scroll reproduz em sentido inverso ao estado inicial).
   - "centralizado" fim do scroll: centro da tela, flutuação + micro-giro;
                    o CTA "Acessar o site" aparece (fade + translate).
   - "entrando"     clique no CTA: zoom-in rápido (entra na tela do
                    aparelho); sem navegar/URL/reload.
   - "site"         intro concluída: o restante do site (oculto até aqui)
                    é revelado; a intro é desmontada.

   O APARELHO é o MODELO JÁ EXISTENTE do projeto — construção procedural
   reaproveitada VERBATIM (Three.js via esm.sh, zero .glb): geometria +
   CanvasTexture, RoomEnvironment+PMREM, ACES, luz de acento laranja de
   token. Só trajetória/timing/easing/comportamento mudaram (Regra 80).

   FALLBACK GRACIOSO (o site NUNCA fica inacessível):
   - sem three (CDN fora) / sem WebGL / prefers-reduced-motion -> intro
     ESTÁTICA: mascote parado + CTA visível de imediato; clicar revela o
     site sem zoom. Se o próprio módulo não rodar, a intro nasce
     display:none no CSS -> o site aparece normalmente (fallback por omissão).
   - aba oculta pausa o rAF; contexto WebGL perdido cai no fallback estático.

   MASCOTE: micro-animações de "personagem vivo" (respiração/sway) são
   CSS (transform-only). A piscada usa um overlay de olhos (sprite-window
   do próprio PNG) e nasce DESLIGADA (INTRO_BLINK=false): sem verificação
   visual no navegador, ligar um recorte mal-alinhado descaracterizaria o
   rosto (cláusula de honestidade 4.3). Mecanismo + hook blinkCount ficam
   prontos: pôr INTRO_BLINK=true e o Atlas confirma no Chrome.
   ========================================================= */

(function () {
  "use strict";

  var body = document.body;
  var intro = document.getElementById("intro");
  var stage = intro ? intro.querySelector(".intro__phone") : null;
  var mascote = intro ? intro.querySelector(".intro__mascote") : null;
  var eyes = intro ? intro.querySelector(".intro__eyes") : null;
  var cta = document.getElementById("introCta");
  var skip = document.getElementById("introSkip");
  var spacer = document.querySelector(".intro-spacer");

  // Sem a marcação da intro no DOM -> não faz nada: o site fica normal
  // (fallback por omissão). A intro nasce escondida no CSS e só é ligada aqui.
  if (!intro || !stage || !cta) return;

  var INTRO_BLINK = false; // ver cabeçalho (cláusula de honestidade 4.3)

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var mql = window.matchMedia ? window.matchMedia.bind(window) : null;
  var coarse = !!(mql && mql("(pointer: coarse)").matches);
  var uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  var isMobile = window.innerWidth < 760 || coarse || uaMobile;
  var MAX_DPR = isMobile ? 1.5 : 2;

  /* Estado da intro (também lido pelos hooks de verificação). */
  var phase = "mao"; // mao|voando|centralizado|entrando|site
  var blinkCount = 0;
  var revealed = false;
  var entering = false;
  var enterStart = 0;
  var ENTER_MS = 780; // duração do zoom-in de entrada
  var phoneReady = false;

  var TRAVEL_END = 0.9;   // progress em que o celular chega ao centro
  var CTA_AT = 0.9;       // progress que revela o CTA

  /* ---- Ativa a intro: some com o site (CSS) e mostra a abertura ---- */
  body.classList.add("is-intro");

  /* Trava/destrava o scroll do documento (fallback estático não tem
     jornada, então não faz sentido rolar; a jornada precisa de rolagem). */
  function lockScroll(on) {
    document.documentElement.style.overflow = on ? "hidden" : "";
    body.style.overflow = on ? "hidden" : "";
  }
  lockScroll(true); // trava até decidir o modo (jornada libera)

  function showCta() {
    cta.hidden = false;
    // reflow antes da classe p/ a transição (fade+translate) rodar
    void cta.offsetWidth;
    cta.classList.add("is-visible");
  }
  function hideCta() {
    cta.classList.remove("is-visible");
  }

  /* ---- Revela o site (fim da intro), na MESMA página ---- */
  function revealSite() {
    if (revealed) return;
    revealed = true;
    phase = "site";
    stop();
    body.classList.remove("is-intro");
    body.classList.add("intro-done");
    lockScroll(false);
    if (spacer && spacer.parentNode) spacer.parentNode.removeChild(spacer);
    window.scrollTo(0, 0);
    // desmonta a intro após o fade do CSS (sem deixar canvas custando frames)
    window.setTimeout(function () {
      intro.style.display = "none";
      if (renderer) {
        try { renderer.dispose(); } catch (e) {}
      }
    }, 480);
  }

  /* ---- Entrada pelo CTA: zoom-in no aparelho, depois revela ---- */
  function onEnter() {
    if (entering || revealed) return; // guarda clique-duplo (Regra 7)
    entering = true;
    hideCta();
    if (!phoneReady || reduceMotion) {
      // sem aparelho 3D (fallback) -> revela direto, com o fade do CSS
      phase = "entrando";
      intro.classList.add("is-entering");
      window.setTimeout(revealSite, 260);
      return;
    }
    phase = "entrando";
    enterStart = performance.now();
    intro.classList.add("is-entering"); // fade do fundo/mascote via CSS
  }
  cta.addEventListener("click", onEnter);
  if (skip) skip.addEventListener("click", onEnter);

  /* ---- Progress do scroll (0..1), base da jornada reversível ---- */
  function scrollable() {
    return Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
  }
  function getProgress() {
    return Math.min(Math.max(window.scrollY / scrollable(), 0), 1);
  }

  /* Atualiza fase + CTA a partir do progress — roda MESMO sem o loop 3D
     (garante que o CTA apareça no fim da jornada ainda que o aparelho
     não tenha carregado). */
  function syncProgressUI() {
    if (revealed || entering) return;
    var p = getProgress();
    if (p >= CTA_AT) {
      phase = "centralizado";
      showCta();
    } else {
      phase = p > 0.02 ? "voando" : "mao";
      hideCta();
    }
  }

  /* ---- Piscada + micro-shift dos olhos (overlay), DESLIGADA por padrão ---- */
  var blinkTimer = 0;
  function scheduleBlink() {
    if (!INTRO_BLINK || !eyes || reduceMotion) return;
    var delay = 3000 + Math.random() * 1000; // ~3–4s, natural (não robótico)
    blinkTimer = window.setTimeout(function () {
      if (document.hidden) { scheduleBlink(); return; }
      eyes.classList.add("is-blinking");
      blinkCount++;
      window.setTimeout(function () {
        eyes.classList.remove("is-blinking");
      }, 130);
      scheduleBlink();
    }, delay);
  }

  /* =========================================================
     FALLBACK ESTÁTICO — sem three/WebGL/movimento
     ========================================================= */
  function staticIntro() {
    body.classList.add("intro-static");
    // AJUSTE 3: sem loop/projeção -> CTA volta ao rodapé (acessível e clicável)
    cta.classList.remove("is-onscreen");
    cta.style.left = cta.style.top = cta.style.fontSize = cta.style.padding = cta.style.transform = "";
    lockScroll(true); // sem jornada: não há o que rolar
    phase = "mao";
    showCta();        // entrada sempre acessível
    scheduleBlink();
  }
  if (reduceMotion) { staticIntro(); exposeHooks(); return; }

  /* =========================================================
     MODO JORNADA — carrega three e constrói o aparelho existente
     ========================================================= */
  var renderer, scene, camera, rig, phone, halo, haloMat;
  var screenAnchor, screenEdge, projA, projB; // AJUSTE 3: projeção do CTA na tela
  var pmrem;
  var MAX_ANISO = 1;

  (async function boot() {
    var THREE, RoomEnvironment;
    try {
      THREE = await import("three");
      RoomEnvironment = (
        await import(
          "https://esm.sh/three@0.182.0/examples/jsm/environments/RoomEnvironment.js"
        )
      ).RoomEnvironment;
    } catch (e) {
      staticIntro(); // CDN fora -> intro estática (site acessível)
      exposeHooks();
      return;
    }
    if (!buildScene(THREE, RoomEnvironment)) {
      staticIntro(); // sem WebGL -> idem
      exposeHooks();
      return;
    }

    /* jornada liberada: mostra o trilho de scroll e destrava a rolagem */
    body.classList.add("intro-journey");
    cta.classList.add("is-onscreen"); // AJUSTE 3: CTA passa a viver dentro da tela
    lockScroll(false);
    scheduleBlink();
    window.addEventListener("scroll", syncProgressUI, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    // a largura do mascote (âncora da mão) só existe após o PNG carregar
    var mimg = mascote && mascote.querySelector(".intro__mascote-img");
    if (mimg && !mimg.complete) mimg.addEventListener("load", computeHand, { once: true });
    resize();
    syncProgressUI();
    play();
    phoneReady = true;
    exposeHooks();
  })();

  function buildScene(THREE, RoomEnvironment) {
    /* ---- Cores de marca de tokens.css (single source of truth) ---- */
    var css = window.getComputedStyle(document.documentElement);
    function token(name, fb) {
      var v = (css.getPropertyValue(name) || "").trim();
      return v || fb;
    }
    var BRAND_ORANGE = token("--color-orange", "#f26a1b");
    var BRAND_ORANGE_STRONG = token("--color-orange-strong", "#d9550f");
    var BRAND_NAVY_DEEP = token("--color-navy-deep", "#0b1f3d");
    var BRAND_NAVY = token("--color-navy", "#163a6b");
    var BRAND_NAVY_STRONG = token("--color-navy-strong", "#0f2b52");

    /* Conteúdo da TELA = perfil do Instagram do MARCELINHO (tokens, sem
       string solta). O print real substitui o mock ao carregar. */
    var IG = {
      handle: "marcelinho", name: "MARCELINHO", bio: "novos · seminovos",
      place: "Loja de celulares · Sarapuí-SP",
      posts: "148", followers: "3.204", following: "87", follow: "Seguir"
    };

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    stage.appendChild(renderer.domElement);
    MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.05, 4.6);

    /* ---- Luzes (valores do playbook; acento na cor de marca) ---- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    var key = new THREE.SpotLight(0xffffff, 4.1);
    key.position.set(-2, 12, 4); key.angle = 0.3; key.penumbra = 1; key.decay = 0;
    scene.add(key);
    var accent = new THREE.SpotLight(new THREE.Color(BRAND_ORANGE), 5.5);
    accent.position.set(5, 0, -5); accent.angle = 0.5; accent.penumbra = 1; accent.decay = 0;
    scene.add(accent);
    var fill = new THREE.PointLight(new THREE.Color(BRAND_NAVY), 1.1);
    fill.position.set(-5, 0, 5); fill.decay = 0;
    scene.add(fill);

    pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    /* ===== GEOMETRIA — iPhone procedural (reaproveitada VERBATIM) ===== */
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
    var PW = 0.72, PH = 1.56, PR = 0.115;

    function normalizeUVs(geo) {
      geo.computeBoundingBox();
      var bb = geo.boundingBox;
      var sx = bb.max.x - bb.min.x || 1;
      var sy = bb.max.y - bb.min.y || 1;
      var pos = geo.attributes.position;
      var uv = geo.attributes.uv;
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
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = MAX_ANISO;
      return t;
    }
    function roughStreakTexture() {
      var S = 128;
      var c = document.createElement("canvas");
      c.width = c.height = S;
      var g = c.getContext("2d");
      g.fillStyle = "#cfcfcf"; g.fillRect(0, 0, S, S);
      for (var i = 0; i < 70; i++) {
        var gx = Math.random() * S;
        var v = 150 + Math.random() * 90;
        g.strokeStyle = "rgba(" + v + "," + v + "," + v + ",0.35)";
        g.lineWidth = 0.5 + Math.random() * 1.5;
        g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx + (Math.random() - 0.5) * 4, S); g.stroke();
      }
      var t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = MAX_ANISO; // sem colorSpace sRGB (dado linear)
      return t;
    }
    var roughMap = roughStreakTexture();

    function drawAppleLogo(ctx, cx, cy, R) {
      var o = document.createElement("canvas");
      o.width = o.height = Math.ceil(R * 3.2);
      var g = o.getContext("2d");
      var ox = o.width / 2, oy = o.height / 2, TWO = Math.PI * 2;
      g.fillStyle = "#f6ddbe";
      g.beginPath();
      g.arc(ox - R * 0.30, oy + R * 0.02, R * 0.47, 0, TWO);
      g.arc(ox + R * 0.30, oy + R * 0.02, R * 0.47, 0, TWO);
      g.arc(ox - R * 0.20, oy + R * 0.34, R * 0.44, 0, TWO);
      g.arc(ox + R * 0.20, oy + R * 0.34, R * 0.44, 0, TWO);
      g.fill();
      g.globalCompositeOperation = "destination-out";
      g.beginPath(); g.arc(ox + R * 0.74, oy + R * 0.02, R * 0.32, 0, TWO); g.fill();
      g.globalCompositeOperation = "source-over";
      g.beginPath();
      g.ellipse(ox + R * 0.14, oy - R * 0.66, R * 0.13, R * 0.28, -Math.PI / 4, 0, TWO);
      g.fill();
      ctx.save();
      ctx.shadowColor = "rgba(246,221,190,0.55)"; ctx.shadowBlur = R * 0.5;
      ctx.translate(cx, cy); ctx.scale(-1, 1);
      ctx.drawImage(o, -o.width / 2, -o.height / 2);
      ctx.restore();
    }
    function backTexture() {
      var W = 256, H = 512;
      var c = document.createElement("canvas");
      c.width = W; c.height = H;
      var x = c.getContext("2d");
      x.fillStyle = BRAND_ORANGE; x.fillRect(0, 0, W, H);
      var img = x.getImageData(0, 0, W, H), d = img.data;
      for (var i = 0; i < d.length; i += 4) {
        var n = (Math.random() - 0.5) * 10;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
      x.putImageData(img, 0, 0);
      drawAppleLogo(x, W / 2, H / 2, 42);
      var t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO;
      return t;
    }

    phone = new THREE.Group();

    var frameGeo = new THREE.ExtrudeGeometry(roundedRectShape(PW, PH, PR), {
      depth: 0.05, bevelEnabled: true, bevelThickness: 0.014,
      bevelSize: 0.012, bevelSegments: 5, curveSegments: 14
    });
    frameGeo.center();
    var titanMat = new THREE.MeshStandardMaterial({
      map: brushedTexture(BRAND_ORANGE, 18, 256, 256),
      roughnessMap: roughMap,
      metalness: 0.55, roughness: 0.26, envMapIntensity: 1.85
    });
    phone.add(new THREE.Mesh(frameGeo, titanMat));

    function screenTexture() {
      var W = 512, H = 1024;
      var c = document.createElement("canvas");
      c.width = W; c.height = H;
      var x = c.getContext("2d");
      var IG_DARK = "#262626", IG_GRAY = "#8e8e8e", IG_LINE = "#dbdbdb";
      function rr(px, py, pw, ph, r) {
        x.beginPath();
        if (x.roundRect) x.roundRect(px, py, pw, ph, r); else x.rect(px, py, pw, ph);
      }
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
      x.textAlign = "left"; x.fillStyle = IG_DARK;
      x.font = "700 34px Inter, system-ui, sans-serif";
      x.fillText(IG.handle, 30, 62);
      var hw = 30 + x.measureText(IG.handle).width + 24;
      x.fillStyle = BRAND_ORANGE;
      x.beginPath(); x.arc(hw, 52, 12, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "#fff"; x.lineWidth = 3; x.lineCap = "round";
      x.beginPath(); x.moveTo(hw - 5, 52); x.lineTo(hw - 1, 56); x.lineTo(hw + 6, 47); x.stroke();
      var ax = 96, ay = 152, ar = 60;
      x.strokeStyle = BRAND_ORANGE; x.lineWidth = 5;
      x.beginPath(); x.arc(ax, ay, ar + 9, 0, Math.PI * 2); x.stroke();
      var ag = x.createLinearGradient(ax - ar, ay - ar, ax + ar, ay + ar);
      ag.addColorStop(0, BRAND_NAVY); ag.addColorStop(1, BRAND_ORANGE);
      x.fillStyle = ag;
      x.beginPath(); x.arc(ax, ay, ar, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#fff"; x.textAlign = "center";
      x.font = "700 62px Poppins, system-ui, sans-serif";
      x.fillText(IG.name.charAt(0), ax, ay + 22);
      var stats = [[IG.posts, "posts"], [IG.followers, "seguidores"], [IG.following, "seguindo"]];
      for (var si = 0; si < stats.length; si++) {
        var sx = 232 + si * 96;
        x.fillStyle = IG_DARK; x.font = "700 30px Poppins, system-ui, sans-serif";
        x.fillText(stats[si][0], sx, 140);
        x.fillStyle = IG_GRAY; x.font = "400 22px Inter, system-ui, sans-serif";
        x.fillText(stats[si][1], sx, 174);
      }
      x.textAlign = "left";
      x.fillStyle = IG_DARK; x.font = "700 30px Poppins, system-ui, sans-serif";
      x.fillText(IG.name, 34, 264);
      x.fillStyle = BRAND_ORANGE; x.font = "600 26px Inter, system-ui, sans-serif";
      x.fillText(IG.bio, 34, 300);
      x.fillStyle = IG_GRAY; x.font = "400 24px Inter, system-ui, sans-serif";
      x.fillText(IG.place, 34, 334);
      rr(30, 360, W - 60, 60, 12); x.fillStyle = BRAND_ORANGE; x.fill();
      x.fillStyle = "#fff"; x.textAlign = "center";
      x.font = "700 30px Inter, system-ui, sans-serif";
      x.fillText(IG.follow, W / 2, 400);
      x.strokeStyle = IG_LINE; x.lineWidth = 2;
      x.beginPath(); x.moveTo(0, 452); x.lineTo(W, 452); x.stroke();
      x.fillStyle = BRAND_ORANGE;
      for (var gr = 0; gr < 3; gr++)
        for (var gc = 0; gc < 3; gc++) {
          x.beginPath(); x.arc(W / 2 - 14 + gc * 14, 436 + gr * 14, 3.2, 0, Math.PI * 2); x.fill();
        }
      var gap = 6, cols = 3;
      var cell = (W - gap * (cols - 1)) / cols;
      var gy0 = 470;
      for (var r = 0; r < 3; r++)
        for (var col = 0; col < 3; col++) {
          var tx = col * (cell + gap), ty = gy0 + r * (cell + gap);
          var tg = x.createLinearGradient(tx, ty, tx, ty + cell);
          tg.addColorStop(0, BRAND_NAVY); tg.addColorStop(1, BRAND_NAVY_DEEP);
          x.fillStyle = tg; x.fillRect(tx, ty, cell, cell);
          var tglow = x.createRadialGradient(tx + cell * 0.68, ty + cell * 0.3, 4,
            tx + cell * 0.68, ty + cell * 0.3, cell * 0.85);
          tglow.addColorStop(0, "rgba(242,106,27,0.5)");
          tglow.addColorStop(1, "rgba(242,106,27,0)");
          x.fillStyle = tglow; x.fillRect(tx, ty, cell, cell);
          var pw2 = cell * 0.30, ph2 = cell * 0.55;
          var pcx = tx + cell / 2, pcy = ty + cell / 2;
          rr(pcx - pw2 / 2, pcy - ph2 / 2, pw2, ph2, 10);
          x.fillStyle = "rgba(255,255,255,0.94)"; x.fill();
          rr(pcx - pw2 / 2 + 4, pcy - ph2 / 2 + 8, pw2 - 8, ph2 - 20, 6);
          x.fillStyle = BRAND_NAVY_DEEP; x.fill();
        }
      var t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO;
      return t;
    }
    var screenGeo = normalizeUVs(
      new THREE.ShapeGeometry(roundedRectShape(PW - 0.055, PH - 0.055, PR - 0.03), 14)
    );
    var screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: screenTexture() }));
    screen.position.z = 0.0405;
    phone.add(screen);

    new THREE.TextureLoader().load(
      "assets/img/instagram-perfil.png",
      function (tex) {
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = MAX_ANISO;
        var old = screen.material.map;
        screen.material.map = tex; screen.material.needsUpdate = true;
        if (old) old.dispose();
      },
      undefined,
      function () {}
    );

    var glass = new THREE.Mesh(
      screenGeo.clone(),
      new THREE.MeshStandardMaterial({
        color: 0xffffff, transparent: true, opacity: 0.14,
        metalness: 0, roughness: 0.05, envMapIntensity: 2.2, depthWrite: false
      })
    );
    glass.position.z = 0.0425;
    phone.add(glass);

    var back = new THREE.Mesh(
      normalizeUVs(new THREE.ShapeGeometry(roundedRectShape(PW - 0.045, PH - 0.045, PR - 0.025), 14)),
      new THREE.MeshStandardMaterial({
        map: backTexture(), roughnessMap: roughMap,
        metalness: 0.42, roughness: 0.28, envMapIntensity: 1.5
      })
    );
    back.rotation.y = Math.PI; back.position.z = -0.0405;
    phone.add(back);

    function sideButton(h, y, sideX) {
      var b = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, h, 3, 8), titanMat);
      b.position.set(sideX, y, 0.008);
      return b;
    }
    phone.add(sideButton(0.05, 0.52, -(PW / 2 + 0.012)));
    phone.add(sideButton(0.10, 0.33, -(PW / 2 + 0.012)));
    phone.add(sideButton(0.10, 0.16, -(PW / 2 + 0.012)));
    phone.add(sideButton(0.16, 0.30, PW / 2 + 0.012));

    var portMat = new THREE.MeshStandardMaterial({ color: 0x11161f, metalness: 0.5, roughness: 0.4 });
    var usbc = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.062, 3, 8), portMat);
    usbc.rotation.z = Math.PI / 2; usbc.position.set(0, -(PH / 2 + 0.0155), 0);
    phone.add(usbc);
    var holeGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.012, 10);
    for (var hi = 0; hi < 6; hi++) {
      var hole = new THREE.Mesh(holeGeo, portMat);
      var sideH = hi < 3 ? -1 : 1;
      hole.position.set(sideH * (0.13 + (hi % 3) * 0.052), -(PH / 2 + 0.0155), 0);
      phone.add(hole);
    }
    var bandGeo = new THREE.BoxGeometry(0.006, 0.02, 0.078);
    var bandMat = new THREE.MeshStandardMaterial({ color: BRAND_ORANGE_STRONG, metalness: 0.2, roughness: 0.6 });
    var bandL = new THREE.Mesh(bandGeo, bandMat);
    bandL.position.set(-0.27, -(PH / 2 + 0.008), 0);
    phone.add(bandL);
    var bandR = bandL.clone(); bandR.position.x = 0.27;
    phone.add(bandR);

    var camPlateGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.30, 0.30, 0.09), {
      depth: 0.018, bevelEnabled: true, bevelThickness: 0.006,
      bevelSize: 0.006, bevelSegments: 3, curveSegments: 10
    });
    camPlateGeo.center();
    var camPlate = new THREE.Mesh(camPlateGeo, new THREE.MeshStandardMaterial({
      map: brushedTexture(BRAND_ORANGE, 14, 128, 128), roughnessMap: roughMap,
      metalness: 0.5, roughness: 0.32, envMapIntensity: 1.4
    }));
    camPlate.position.set(0.16, 0.58, -0.055);
    phone.add(camPlate);

    var lensRingMat = new THREE.MeshStandardMaterial({ color: 0xcbb9a6, metalness: 0.95, roughness: 0.18, envMapIntensity: 1.8 });
    var lensGlassMat = new THREE.MeshStandardMaterial({ color: 0x0a1220, metalness: 0.2, roughness: 0.05, envMapIntensity: 2.4 });
    var lensPos = [[0.095, 0.645], [0.095, 0.515], [0.215, 0.58]];
    for (var li = 0; li < lensPos.length; li++) {
      var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.022, 24), lensRingMat);
      ring.rotation.x = Math.PI / 2; ring.position.set(lensPos[li][0], lensPos[li][1], -0.075);
      phone.add(ring);
      var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.024, 24), lensGlassMat);
      lens.rotation.x = Math.PI / 2; lens.position.set(lensPos[li][0], lensPos[li][1], -0.077);
      phone.add(lens);
    }
    var flash = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: 0xfff3d6, emissive: 0xfff3d6, emissiveIntensity: 0.35, metalness: 0, roughness: 0.3 })
    );
    flash.rotation.x = Math.PI / 2; flash.position.set(0.215, 0.68, -0.066);
    phone.add(flash);

    phone.rotation.set(-0.06, -0.42, 0.03); // pose de vitrine (fixa na peça)
    rig = new THREE.Group();
    rig.add(phone);
    scene.add(rig);

    /* AJUSTE 3 — âncoras invisíveis na TELA do aparelho: 'center' = ponto do
       display onde o CTA fica; 'edge' = borda útil (margem interna), define a
       escala em px do CTA. Presas ao phone -> giram/flutuam com o aparelho;
       o CTA (HTML) é projetado sobre elas a cada frame (getWorldPosition+
       project). z 0.045 = logo à frente do vidro (só posição, sem desenhar). */
    var CTA_LOCAL_Y = 0.0;  // desloca o CTA no eixo vertical da tela. 'a afinar'
    var CTA_HALF_W = 0.29;  // meia-largura útil da tela (margem interna). 'a afinar'
    screenAnchor = new THREE.Object3D();
    screenAnchor.position.set(0, CTA_LOCAL_Y, 0.045);
    phone.add(screenAnchor);
    screenEdge = new THREE.Object3D();
    screenEdge.position.set(CTA_HALF_W, CTA_LOCAL_Y, 0.045);
    phone.add(screenEdge);
    projA = new THREE.Vector3();
    projB = new THREE.Vector3();

    /* HALO de marca atrás do aparelho (acompanha o rig). */
    var sc = document.createElement("canvas");
    sc.width = sc.height = 256;
    (function () {
      var x = sc.getContext("2d");
      var g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, "rgba(242,106,27,0.4)");
      g.addColorStop(0.45, "rgba(242,106,27,0.14)");
      g.addColorStop(1, "rgba(242,106,27,0)");
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    })();
    haloMat = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false
    });
    halo = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), haloMat);
    halo.position.z = -0.9;
    scene.add(halo);

    /* Perda de contexto WebGL -> cai no fallback estático. */
    renderer.domElement.addEventListener("webglcontextlost", function (e) {
      e.preventDefault();
      stop();
      if (!revealed) staticIntro();
    }, false);

    return true;
  }

  /* =========================================================
     TRAJETÓRIA — mão -> centro (reversível) + flutuação + zoom
     ========================================================= */
  function viewportSize() {
    var dist = camera.position.z;
    var h = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist;
    return { w: h * camera.aspect, h: h };
  }
  /* fração de tela (0..1, canto sup-esq) -> mundo em z=0 */
  function fracToWorld(sx, sy) {
    var vp = viewportSize();
    return { x: (sx - 0.5) * vp.w, y: (0.5 - sy) * vp.h };
  }
  /* Palma do mascote (âncora "mão"): fração do PNG onde está a palma aberta
     (~x14%, ~y66%). CACHEADA (resize/load) — nunca por frame: getBoundingClientRect
     no loop forçaria reflow a cada quadro. Fallback fixo até o rect ter layout
     (o PNG define a largura do container só depois de carregar). */
  var handSx = null, handSy = null;
  function computeHand() {
    if (!mascote) return;
    var r = mascote.getBoundingClientRect();
    if (r.width) {
      handSx = (r.left + r.width * 0.14) / window.innerWidth;
      handSy = (r.top + r.height * 0.66) / window.innerHeight;
    }
  }
  function handFrac() {
    if (handSx === null) computeHand();
    return { sx: handSx === null ? 0.28 : handSx, sy: handSy === null ? 0.6 : handSy };
  }

  var HAND_SCALE = isMobile ? 0.34 : 0.44;
  var CENTER_SCALE = isMobile ? 0.92 : 1.16;
  /* AJUSTE 2 — eleva o celular ACIMA da palma no repouso (gap visível de
     levitação). Em unidades de mundo (y+); some ao chegar ao centro, então
     NÃO altera a fase centralizada/zoom nem a trajetória. 'a afinar'. */
  var REST_LIFT = isMobile ? 0.07 : 0.055;
  /* AJUSTE 3 — escala do CTA projetado na tela, relativa à meia-largura útil
     do display em px (CTA_HALF_W). A razão botão/display depende SÓ destes
     fatores (o halfW se cancela). Calibrado p/ o botão caber DENTRO da tela
     com margem lateral visível (~74% da largura interna, não transborda) e o
     texto seguir legível. 'a afinar' na verificação no Chrome. */
  var CTA_FIT = { font: 0.19, padY: 0.10, padX: 0.10 };
  var lastCtaX = 0, lastCtaY = 0;
  function ease(t) { return -(Math.cos(Math.PI * Math.min(Math.max(t, 0), 1)) - 1) / 2; }

  function resize() {
    if (!renderer) return;
    var w = stage.clientWidth || window.innerWidth;
    var h = stage.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    computeHand();
  }
  function onResize() { resize(); }

  var raf = 0, running = false;
  var t0 = performance.now();
  function lerp(a, b, f) { return a + (b - a) * f; }

  function tick(now) {
    if (!running) return;
    var t = (now - t0) / 1000;
    var floatY = Math.sin(t * 1.2) * 0.05;     // sobe/desce contínuo, elegante
    var floatRz = Math.sin(t * 0.9) * 0.05;    // micro-rotação
    var floatRy = Math.sin(t * 0.6) * 0.06;

    var tx, ty, ts, try_ = 0.42, trx = 0.03;

    if (entering) {
      // ZOOM-IN de entrada: cresce rápido rumo à câmera (entra na tela)
      var k = ease((now - enterStart) / ENTER_MS);
      tx = 0; ty = 0;
      ts = CENTER_SCALE + k * 9;             // preenche e "engole" a tela
      rig.position.z = k * 2.6;              // aproxima da câmera
      try_ = 0.42; trx = 0.03;
      if ((now - enterStart) >= ENTER_MS) { revealSite(); return; }
    } else {
      var p = getProgress();
      var e = ease(p / TRAVEL_END);
      var hand = handFrac();
      var sx = lerp(hand.sx, 0.5, e);
      var sy = lerp(hand.sy, 0.5, e);
      var w = fracToWorld(sx, sy);
      tx = w.x; ty = w.y + REST_LIFT * (1 - e); // AJUSTE 2: gap acima da palma no repouso, some ao centro
      ts = lerp(HAND_SCALE, CENTER_SCALE, e);
      try_ = lerp(0.18, 0.42, e);            // vira a tela p/ a câmera ao chegar
      rig.position.z = lerp(0, 0.15, e);     // leve aproximação (profundidade)
    }

    rig.position.x = lerp(rig.position.x, tx, 0.12);
    rig.position.y = lerp(rig.position.y, ty + floatY, 0.12);
    var s = lerp(rig.scale.x, ts, entering ? 0.22 : 0.12);
    rig.scale.setScalar(s);
    rig.rotation.x = lerp(rig.rotation.x, trx, 0.1);
    rig.rotation.y = lerp(rig.rotation.y, try_ + floatRy, 0.1);
    rig.rotation.z = lerp(rig.rotation.z, entering ? 0 : floatRz, 0.1);

    if (halo) {
      halo.position.x = rig.position.x;
      halo.position.y = rig.position.y;
      halo.scale.setScalar(Math.max(0.6, s));
      haloMat.opacity = Math.max(0, 1 - Math.max(0, s - 1.4) * 0.9);
    }

    // AJUSTE 3: enquanto o CTA está visível (fase centralizada) e NÃO no zoom,
    // gruda-o na tela do aparelho. No zoom (is-entering) ele apenas some (fade).
    if (screenAnchor && !entering && cta.classList.contains("is-visible")) {
      updateCtaOnScreen();
    }

    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(tick);
  }

  /* Projeta as âncoras da tela p/ px e posiciona o CTA sobre o display,
     dimensionando-o pela meia-largura útil projetada (respeita margem interna
     e escala responsivo). Só roda com aparelho pronto (modo jornada). */
  function updateCtaOnScreen() {
    if (!screenAnchor || cta.hidden) return;
    var W = stage.clientWidth || window.innerWidth;
    var H = stage.clientHeight || window.innerHeight;
    screenAnchor.getWorldPosition(projA).project(camera);
    screenEdge.getWorldPosition(projB).project(camera);
    var cx = (projA.x * 0.5 + 0.5) * W;
    var cy = (-projA.y * 0.5 + 0.5) * H;
    var ex = (projB.x * 0.5 + 0.5) * W;
    var halfW = Math.abs(ex - cx) || 1;
    lastCtaX = cx; lastCtaY = cy;
    cta.style.left = cx + "px";
    cta.style.top = cy + "px";
    cta.style.fontSize = (halfW * CTA_FIT.font) + "px";
    cta.style.padding = (halfW * CTA_FIT.padY) + "px " + (halfW * CTA_FIT.padX) + "px";
    cta.style.transform = "translate(-50%, -50%)";
  }
  function play() {
    if (running || !renderer) return;
    running = true;
    raf = window.requestAnimationFrame(tick);
  }
  function pause() {
    if (!running) return;
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }
  function stop() { pause(); }

  function onVisibility() {
    if (document.hidden) pause();
    else if (!revealed) play();
  }

  /* =========================================================
     HOOKS DE VERIFICAÇÃO (Regra 81 / item 4.4 do handoff)
     ========================================================= */
  function exposeHooks() {
    window.__heroIntro = {
      get progress() { return getProgress(); },
      get phaseState() { return phase; },
      get blinkCount() { return blinkCount; },
      get blinkEnabled() { return INTRO_BLINK; },
      get revealed() { return revealed; },
      get phoneReady() { return phoneReady; },
      get running() { return running; },
      get ctaVisible() { return !cta.hidden && cta.classList.contains("is-visible"); },
      /* AJUSTE 3: posição (px) projetada do CTA sobre a tela, p/ verificação */
      get ctaOnScreen() { return cta.classList.contains("is-onscreen"); },
      get ctaScreen() { return screenAnchor ? { x: lastCtaX, y: lastCtaY } : null; },
      /* aciona a entrada por código (teste do zoom+reveal) */
      enter: onEnter,
      /* revela direto, sem zoom (teste do estado final) */
      reveal: revealSite,
      get rig() {
        return rig
          ? { x: rig.position.x, y: rig.position.y, z: rig.position.z, s: rig.scale.x }
          : null;
      }
    };
  }
})();
