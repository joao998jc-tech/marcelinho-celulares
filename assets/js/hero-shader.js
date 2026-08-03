/* =========================================================
   HERO-SHADER.JS — MARCELINHO
   Hero animado: REDE DE PARTÍCULAS INTERATIVAS (constelação)
   em <canvas> 2D VANILLA. Porte fiel do componente React
   `aether-flow-hero.tsx` para a stack estática real — sem
   React, sem build, sem framer-motion/lucide.

   NÚCLEO (mantido intacto do original — só a paleta muda):
   - partículas flutuantes com deriva lenta e quique nas bordas
     (inverte a direção ao sair da tela);
   - conexão por linhas entre pares próximos (constelação):
     distância² < (W/7)*(H/7), opacidade = 1 - dist²/20000;
   - interação de ponteiro: repulsão das partículas dentro do
     raio do mouse (força = (raio-dist)/raio, empurra p/ longe)
     e realce das linhas em BRANCO perto do cursor.

   Cores travadas pelo Coordenador de Referências e LIDAS de
   tokens.css em tempo de execução (getComputedStyle) — nada de
   hex "cru": fundo navy-deep (nunca preto), partículas laranja
   (~70%) + branco (~30%), linhas translúcidas laranja / branco
   perto do cursor. (O original era roxo — descartado.)

   O nome do arquivo permanece hero-shader.js para preservar a
   ordem/inclusão de scripts do projeto (o <script defer> não
   muda); só o MECANISMO de fundo foi trocado (WebGL2 nebulosa
   -> rede de partículas 2D).

   FALLBACK GRACIOSO (acesso majoritário via celular):
   - sem canvas 2D  -> classe .hero--static (só o gradiente de marca do CSS);
   - prefers-reduced-motion -> não roda (fundo estático);
   - mobile/baixa performance -> menos partículas, DPR/resolução
     reduzidos, teto absoluto de pixels do backing, ponteiro
     desligado, FPS limitado a 30;
   - pausa o loop fora do viewport (IntersectionObserver) e com a
     aba oculta (visibilitychange) — poupa CPU/GPU/bateria;
   - perda de contexto do canvas -> encerra de vez (flag dead) e
     fica no fundo estático, sem religar o loop;
   - LCP protegido: o texto/CTA renderizam por HTML/CSS,
     independentes do canvas (este script nunca bloqueia o conteúdo).

   Física em coordenadas CSS-px (mesma escala do original em
   DPR 1): o backing store é ampliado por devicePixelRatio via
   ctx.setTransform(scale,...) só para nitidez — assim todas as
   constantes do componente original (raio 200, 20000, W/7, size,
   velocidade) ficam idênticas, sem reescalar a mecânica.
   ========================================================= */
(function () {
  "use strict";

  var hero = document.getElementById("hero");
  var canvas = hero ? hero.querySelector(".hero__canvas") : null;
  if (!hero || !canvas) return;

  function useStaticFallback() {
    hero.classList.add("hero--static");
  }

  // 1) Respeita quem pede menos movimento -> fundo estático de marca.
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    useStaticFallback();
    return;
  }

  // 2) Contexto 2D (com fallback se indisponível). alpha:false = opaco
  //    (o original também pinta o fundo cheio a cada frame) e evita
  //    composição custosa; a 1ª pintura de navy remove o flash preto.
  var ctx = null;
  try {
    // alpha:false = opaco (fundo cheio a cada frame). NÃO usamos
    // desynchronized: como a perda de contexto é definitiva (dead), evitar
    // o modo dessincronizado reduz o risco de queda em drivers sensíveis.
    ctx = canvas.getContext("2d", { alpha: false });
  } catch (e) {
    ctx = null;
  }
  if (!ctx) {
    useStaticFallback();
    return;
  }

  // 3) Perfil de dispositivo -> custo da cena (mobile mais leve).
  //    Duas checagens SEPARADAS e independentes:
  //      (a) isMobile      -> governa só o CUSTO da cena (densidade/DPR/FPS);
  //      (b) pointerEnabled -> governa só a INTERAÇÃO de mouse (repulsão/realce).
  //    Antes ambas dependiam de Math.min(innerWidth, innerHeight) < 760. Como a
  //    ALTURA útil de uma janela de desktop comumente fica < 760px, o desktop era
  //    classificado como mobile por engano -> pointerEnabled=false -> o listener
  //    'pointermove' nunca era anexado e a reatividade de mouse ficava desligada.
  //    Correção: NÃO usar a altura. Perfil leve = largura pequena OU ponteiro
  //    grosso (touch) OU UA mobile; interação = existe ponteiro FINO (mouse).
  // .bind(window): matchMedia faz brand-check no receptor; chamado destacado
  // (sob "use strict", this=undefined) lançaria TypeError: Illegal invocation.
  var mql = window.matchMedia ? window.matchMedia.bind(window) : null;
  var coarsePointer = !!(mql && mql("(pointer: coarse)").matches);
  var finePointer = !!(mql && mql("(pointer: fine)").matches);
  var uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  var isMobile = window.innerWidth < 760 || coarsePointer || uaMobile;
  // DENSITY: 1 partícula a cada N px² (original = 9000). MAX_PARTICLES
  // limita o custo O(n²) do connect() em telas grandes.
  var DENSITY = isMobile ? 20000 : 9000;
  var MAX_PARTICLES = isMobile ? 55 : 140;
  var QUALITY = isMobile ? 0.75 : 1.0; // fator de resolução do backing
  var MAX_DPR = isMobile ? 1.5 : 2.0; // teto de devicePixelRatio
  var MAX_PIXELS = isMobile ? 900000 : 2600000; // teto absoluto do backing
  var FPS_CAP = isMobile ? 30 : 60; // cadência de desenho (bateria/calor)
  // Reatividade de ponteiro: LIGADA sempre que houver mouse fino, INDEPENDENTE do
  // perfil de performance. Um desktop com janela baixa (isMobile por largura? não)
  // ou um híbrido touch+mouse (isMobile por coarse) ainda tem ponteiro fino e
  // merece a interação. Fallback robusto para browsers sem media query de ponteiro:
  // sem 'coarse' e sem UA mobile -> assume mouse fino (desktop antigo).
  var pointerEnabled = finePointer || (!coarsePointer && !uaMobile);
  var MOUSE_RADIUS = 200; // raio de interação do ponteiro (CSS px, = original)

  // ---- Cores de marca lidas de tokens.css (single source of truth) ----
  function parseHex(hex, fallback) {
    hex = (hex || "").trim().replace(/^#/, "");
    if (hex.length === 3)
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (hex.length !== 6 || /[^0-9a-fA-F]/.test(hex)) return fallback;
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16)
    ];
  }
  var css = window.getComputedStyle(document.documentElement);
  function token(name, fb) {
    return parseHex(css.getPropertyValue(name), fb);
  }
  var C_NAVY = token("--color-navy-deep", [11, 31, 61]); // fundo (nunca preto)
  var C_ORANGE = token("--color-orange", [242, 106, 27]); // partícula/linha quente
  var C_WHITE = token("--color-white", [255, 255, 255]); // partícula/linha fria
  var NAVY_CSS = "rgb(" + C_NAVY[0] + "," + C_NAVY[1] + "," + C_NAVY[2] + ")";

  // ---- Estado ---------------------------------------------------------
  var particles = [];
  var W = 0; // largura lógica (CSS px)
  var H = 0; // altura lógica (CSS px)
  var io = null;
  var dead = false; // contexto perdido -> encerra de vez
  var mouse = { x: null, y: null };

  // ---- Partícula (mecânica idêntica ao componente original) -----------
  function Particle(x, y, dx, dy, size, warm) {
    this.x = x;
    this.y = y;
    this.dx = dx; // directionX
    this.dy = dy; // directionY
    this.size = size;
    this.warm = warm; // true = laranja, false = branco
  }
  Particle.prototype.draw = function () {
    var c = this.warm ? C_ORANGE : C_WHITE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",0.85)";
    ctx.fill();
  };
  Particle.prototype.update = function () {
    // Quique nas bordas: inverte a direção ao sair da tela (= original).
    if (this.x > W || this.x < 0) this.dx = -this.dx;
    if (this.y > H || this.y < 0) this.dy = -this.dy;

    // Colisão com o ponteiro: repulsão dentro do raio (= original).
    if (mouse.x !== null) {
      var dx = mouse.x - this.x;
      var dy = mouse.y - this.y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < MOUSE_RADIUS + this.size && distance > 0) {
        var forceDirectionX = dx / distance;
        var forceDirectionY = dy / distance;
        var force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
        // dx aponta da partícula P/ o mouse; subtrair empurra P/ LONGE.
        this.x -= forceDirectionX * force * 5;
        this.y -= forceDirectionY * force * 5;
      }
    }

    // Deriva lenta constante.
    this.x += this.dx;
    this.y += this.dy;
    this.draw();
  };

  // ---- Constelação: linhas entre pares próximos (= original) ----------
  function connect() {
    // (W/7)*(H/7) é o corte do original; em telas grandes ele fica MAIOR que
    // 20000 (onde a opacidade já zera), então pares nessa faixa entrariam no
    // laço só para cair no `continue`. Limitar em 20000 corta esse cálculo
    // morto no desktop sem mudar nada visual (no mobile o corte já é menor).
    var threshold = Math.min((W / 7) * (H / 7), 20000);
    for (var a = 0; a < particles.length; a++) {
      var pa = particles[a];
      // Realce em branco se a partícula "a" está dentro do raio do cursor.
      var nearMouse = false;
      if (mouse.x !== null) {
        var mdx = mouse.x - pa.x;
        var mdy = mouse.y - pa.y;
        if (mdx * mdx + mdy * mdy < MOUSE_RADIUS * MOUSE_RADIUS) nearMouse = true;
      }
      for (var b = a + 1; b < particles.length; b++) {
        var pb = particles[b];
        var dx = pa.x - pb.x;
        var dy = pa.y - pb.y;
        var distance = dx * dx + dy * dy; // distância²
        if (distance < threshold) {
          var opacity = 1 - distance / 20000;
          if (opacity <= 0) continue;
          var c = nearMouse ? C_WHITE : C_ORANGE;
          ctx.strokeStyle =
            "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + opacity + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }
    }
  }

  // ---- Init / Resize (recria as partículas em escala CSS-px) ----------
  function init() {
    particles = [];
    var count = Math.floor((W * H) / DENSITY);
    if (count > MAX_PARTICLES) count = MAX_PARTICLES;
    if (count < 0) count = 0;
    for (var i = 0; i < count; i++) {
      var size = Math.random() * 2 + 1;
      var x = Math.random() * (W - size * 2) + size;
      var y = Math.random() * (H - size * 2) + size;
      var dx = Math.random() * 0.4 - 0.2;
      var dy = Math.random() * 0.4 - 0.2;
      var warm = Math.random() < 0.7; // ~70% laranja / ~30% branco
      particles.push(new Particle(x, y, dx, dy, size, warm));
    }
  }

  function resize() {
    var newW = hero.clientWidth || window.innerWidth;
    var newH = hero.clientHeight || window.innerHeight;
    // Só recria as partículas quando a LARGURA muda (ou no 1º resize). Em
    // navegadores mobile a barra de URL aparece/some no scroll e altera só a
    // ALTURA do hero -> re-inicializar aqui faria a constelação "pular"/
    // reembaralhar na frente do usuário. Mantendo o campo, o efeito segue fluido.
    var needInit = particles.length === 0 || newW !== W;
    W = newW;
    H = newH;
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    var scale = dpr * QUALITY;
    // Teto absoluto de pixels do backing (protege viewport grande x DPR alto).
    if (W * scale * (H * scale) > MAX_PIXELS) {
      scale = Math.sqrt(MAX_PIXELS / (W * H));
    }
    var bw = Math.max(1, Math.round(W * scale));
    var bh = Math.max(1, Math.round(H * scale));
    canvas.width = bw;
    canvas.height = bh;
    // Física em CSS-px; o backing maior só dá nitidez (setTransform).
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (needInit) init();
    paintBackground();
  }

  function paintBackground() {
    ctx.fillStyle = NAVY_CSS;
    ctx.fillRect(0, 0, W, H);
  }

  // ---- Ponteiro (coordenadas relativas ao hero; só desktop) -----------
  function onPointerMove(e) {
    var rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }
  function onPointerLeave() {
    mouse.x = null;
    mouse.y = null;
  }
  if (pointerEnabled) {
    hero.addEventListener("pointermove", onPointerMove, { passive: true });
    hero.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }

  // ---- Loop com pausa (viewport + aba) + cap de FPS -------------------
  var raf = 0;
  var running = false;
  var heroVisible = true;
  var lastDraw = 0;
  var frameInterval = 1000 / FPS_CAP;

  function frame(now) {
    if (!running) return;
    if (now - lastDraw >= frameInterval) {
      lastDraw = now;
      // Fundo navy opaco a cada frame (= "fillRect preto" do original,
      // mas na cor de marca) -> zera rastros e mantém o navy consistente.
      paintBackground();
      for (var i = 0; i < particles.length; i++) particles[i].update();
      connect();
    }
    raf = window.requestAnimationFrame(frame);
  }

  function play() {
    if (running || dead) return;
    running = true;
    lastDraw = 0;
    raf = window.requestAnimationFrame(frame);
  }
  function pause() {
    if (!running) return;
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }

  // Perda de contexto -> encerra de vez e cai para o fundo estático.
  canvas.addEventListener(
    "contextlost",
    function (e) {
      e.preventDefault();
      dead = true;
      pause();
      useStaticFallback();
      if (io) io.disconnect();
    },
    false
  );

  // Resize com debounce leve.
  var resizeTimer = 0;
  window.addEventListener(
    "resize",
    function () {
      if (dead) return;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    },
    { passive: true }
  );

  // Pausa quando a aba fica oculta.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause();
    else if (heroVisible) play();
  });

  resize(); // já pinta o navy ao final (1º paint imediato, sem flash preto)

  // Pausa quando o hero sai do viewport.
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          heroVisible = en.isIntersecting;
          if (heroVisible && !document.hidden) play();
          else pause();
        });
      },
      { threshold: 0.01 }
    );
    io.observe(hero);
  } else {
    play();
  }
})();
