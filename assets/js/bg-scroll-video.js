/* =========================================================
   BG-SCROLL-VIDEO.JS — MARCELINHO
   Vídeo de FUNDO controlado por SCROLL (scroll-scrubbed).

   Conceito (pedido do João, literal):
   - "o ponto inicial é o mascote com o celular e a tela desligada
     no inicio do site" -> no TOPO da página o vídeo fica no 1º quadro
     (mascote segurando o celular, tela apagada);
   - "ao scrolar o site para baixo o celular vai voando sobre o fundo
     da tela e para ligado na area branca" -> conforme a página rola,
     video.currentTime AVANÇA amarrado ao progresso do scroll; no fim
     (área branca do rodapé) trava no último quadro (celular sozinho,
     Instagram ligado);
   - "movimentos que semenham naturais" -> o tempo do vídeo é
     INTERPOLADO (lerp em rAF) rumo ao alvo do scroll, sem pulos/saltos.
   - "garanta que ao scrolar para frente o video segue e ao voltar o
     video regride" -> o vínculo é BIDIRECIONAL e contínuo: targetTime é
     mapeado DIRETO da fração de scroll (topo=0, base=duração); descer
     avança o vídeo, subir o REGRIDE, sempre proporcional à posição. O
     lerp trata diff positivo E negativo (não gruda ao inverter o sentido).

   O elemento vive fixo (.bg-video-layer): na LATERAL DIREITA no desktop
   e mais CENTRALIZADO no mobile (CSS). Este script cuida SÓ do scrub +
   fallbacks; posição/blend/máscara são no bg-video.css.

   FALLBACK GRACIOSO (público majoritário mobile):
   - prefers-reduced-motion  -> NÃO faz scrub; fica 1 quadro estático
     (o poster/1º quadro), sem custo de seek;
   - vídeo não carrega/erro   -> classe .is-failed: some o <video> e fica
     a imagem-poster estática (o layout/texto nunca dependem do vídeo).
     Coberto por: handler de 'error', checagem imediata de video.error e
     um watchdog (se os metadados nunca chegam);
   - decodificação mobile     -> "prime" (play->pause mudo) no 1º gesto
     do usuário p/ liberar o seek em iOS/Android;
   - seek performático        -> vídeo reencodado ALL-INTRA (todo quadro
     é keyframe) => currentTime cai EXATO e barato; um novo seek só é
     emitido quando o anterior terminou (guarda 'seeking'/'seeked'), o
     que estrangula pela velocidade do decoder e evita thrash no mobile;
     o rAF DORME ao alcançar o alvo e reacorda no próximo scroll.

   NÃO controla o conteúdo/textos (o João disse "depois ajustamos os
   textos"): só o vídeo de fundo.
   ========================================================= */
(function () {
  "use strict";

  var layer = document.querySelector(".bg-video-layer");
  var video = layer ? layer.querySelector(".bg-video-layer__video") : null;
  if (!layer || !video) return;

  // Âncora onde o scrub TERMINA: a área de Instagram (celular aberto no
  // Instagram = último quadro). O progresso 0..1 é mapeado do topo até esta
  // área — e NÃO até o fim da página (serviços/contato vêm depois dela).
  var endAnchor = document.getElementById("instagram");
  var dead = false; // vídeo falhou -> encerra o scrub e fica o poster
  // O vídeo só faz scrub na aba "Bem-vindo"; nas outras abas a camada é
  // ocultada (não deve cobrir o catálogo) e o quadro descansa no início.
  var welcomeActive = true;

  // ---- Estado do scrub (declarado antes p/ markFailed enxergar) ---------
  var duration = 0; // s (preenchido em loadedmetadata)
  var targetTime = 0; // alvo derivado do scroll (s)
  var shownTime = 0; // tempo atualmente aplicado ao vídeo (s)
  var rafId = 0;
  var running = false;
  var primed = false;
  var isSeeking = false; // há um seek em andamento? (estrangula o decoder)
  var maxScroll = 0; // scroll (px) no qual o scrub chega a 1 (área de Instagram)
  var pastThreshold = Infinity; // scroll além do qual o vídeo some (job cumprido)
  // Suavização: fração do caminho percorrida por frame rumo ao alvo.
  // Menor = mais "arrastado"/suave; maior = mais colado ao scroll.
  var LERP = 0.14;
  // "Chegou" quando falta < ~1/4 de quadro (24fps) -> snap exato e dorme.
  var SETTLE = 1 / 96;

  // ---- Falha de mídia -> só o poster estático (checado CEDO) ------------
  function markFailed() {
    dead = true;
    layer.classList.add("is-failed");
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    running = false;
  }
  video.addEventListener("error", markFailed, false);
  // Se o elemento já nasceu em erro (cache/rede), captura de imediato.
  if (video.error) markFailed();

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Reduced motion: 1 quadro estático, sem scrub ---------------------
  if (reduceMotion) {
    layer.classList.add("is-static");
    var showFirst = function () {
      try {
        if (video.readyState >= 1) video.currentTime = 0;
      } catch (e) {}
    };
    if (video.readyState >= 1) showFirst();
    else video.addEventListener("loadedmetadata", showFirst, { once: true });
    // Mesmo sem scrub, o vídeo é OPACO e fica acima do conteúdo: precisa ser
    // ocultado fora da aba Bem-vindo (senão o quadro estático cobre o catálogo).
    if (window.MarcelinhoNav && typeof window.MarcelinhoNav.onViewChange === "function") {
      var toggleInactive = function (view) {
        layer.classList.toggle("is-inactive", view !== "bemvindo");
      };
      window.MarcelinhoNav.onViewChange(toggleInactive);
      toggleInactive(window.MarcelinhoNav.current());
    }
    return; // o handler de 'error' acima continua valendo (poster no erro)
  }

  // O seek é throttled pelos eventos do próprio vídeo: só emitimos um novo
  // currentTime quando o anterior terminou. Evita fila de seeks/thrash.
  video.addEventListener("seeking", function () { isSeeking = true; }, { passive: true });
  video.addEventListener("seeked", function () { isSeeking = false; }, { passive: true });

  // ---- Medições de layout (cacheadas; recalculadas em resize/meta) ------
  // maxScroll = a posição de scroll na qual a ÁREA DE INSTAGRAM fica centrada
  // na viewport => é aí que o vídeo chega ao último quadro (celular no
  // Instagram). Depois dela (serviços/contato) o vídeo permanece no fim.
  function measure() {
    var doc = document.documentElement;
    var docMax = (doc.scrollHeight || 0) - window.innerHeight;
    if (docMax < 0) docMax = 0;

    // Só há scrub na aba "Bem-vindo" (a que contém a área de Instagram
    // visível). offsetParent === null significa que a âncora está numa aba
    // oculta (display:none) -> não medir contra ela.
    if (welcomeActive && endAnchor && endAnchor.offsetParent !== null) {
      var mid = endAnchor.offsetTop + endAnchor.offsetHeight / 2 - window.innerHeight / 2;
      if (mid < 1) mid = 1; // evita divisão por ~0 no topo
      maxScroll = Math.min(mid, docMax);
      // Depois de PASSAR a área de Instagram (o vídeo já mostrou o quadro final),
      // ele SOME para não cobrir Serviços/Contato (protege o form no mobile). O
      // limiar fica um pouco abaixo do fim da seção, então o "pouso" é visto.
      pastThreshold = endAnchor.offsetTop + endAnchor.offsetHeight - window.innerHeight * 0.35;
    } else {
      // Aba sem a âncora (Aparelhos/Acessórios): mantém o vídeo no início.
      maxScroll = 0;
      pastThreshold = Infinity;
    }
  }

  function scrollY() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  // ---- Progresso de scroll [0..1] (sem leitura de layout) ---------------
  function scrollProgress() {
    if (maxScroll <= 0) return 0;
    var p = scrollY() / maxScroll;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  // O vídeo é reencodado ALL-INTRA (todo quadro é keyframe), então
  // currentTime cai EXATO no quadro certo, instantâneo — sem depender de
  // fastSeek (que arredonda para keyframe e, num vídeo com poucos keyframes,
  // saltaria para o quadro errado). Precisão total nos dois sentidos.
  function seekTo(t) {
    try {
      video.currentTime = t;
    } catch (e) {
      /* seek pode falhar durante buffering; próximo frame tenta de novo */
    }
  }

  // ---- Loop de interpolação (rAF) ---------------------------------------
  function tick() {
    if (!running || dead) return;
    var diff = targetTime - shownTime;
    var abs = diff < 0 ? -diff : diff;

    if (abs <= SETTLE) {
      // chegou: aplica o alvo exato e dorme (economia de CPU/GPU/bateria)
      shownTime = targetTime;
      if (video.readyState >= 1) {
        seekTo(shownTime);
        running = false;
        rafId = 0;
        return;
      }
      // ainda sem dado de vídeo: NÃO dorme de vez (senão o quadro exato só
      // aplicaria no próximo scroll) — reagenda até poder aplicar o seek.
      rafId = window.requestAnimationFrame(tick);
      return;
    }

    shownTime += diff * LERP;
    // Emite um novo seek só se o decoder não estiver ocupado -> throttle
    // natural, sem congelar (shownTime segue convergindo todo frame).
    if (video.readyState >= 1 && !isSeeking) seekTo(shownTime);
    rafId = window.requestAnimationFrame(tick);
  }

  function ensureRunning() {
    if (running || dead || !duration) return;
    running = true;
    rafId = window.requestAnimationFrame(tick);
  }

  // ---- Aplica o alvo a partir do scroll ---------------------------------
  function syncTargetFromScroll() {
    if (!duration || dead) return;
    // maxScroll==0 (abas sem a âncora) => progress 0 => vídeo descansa no
    // 1º quadro (mascote). Na aba "Bem-vindo", mapeia topo->área de Instagram.
    targetTime = scrollProgress() * duration;
    // Some ao ultrapassar a área de Instagram (só classe; opacidade no CSS).
    layer.classList.toggle("is-past", scrollY() > pastThreshold);
    ensureRunning();
  }

  // ---- "Prime" do decoder (iOS/Android liberam seek após play) ----------
  function prime() {
    if (primed || dead) return;
    primed = true;
    var p = video.play();
    if (p && typeof p.then === "function") {
      p.then(function () {
        video.pause(); // mantém PAUSADO: quem manda no quadro é o scroll
      }).catch(function () {
        /* autoplay bloqueado: seek de vídeo mudo ainda costuma funcionar */
      });
    } else {
      try {
        video.pause();
      } catch (e) {}
    }
  }

  // ---- Metadados prontos -> liga o scrub --------------------------------
  var metaTimer = window.setTimeout(function () {
    // watchdog: se os metadados nunca chegam, cai para o poster estático.
    if (!duration && !dead) markFailed();
  }, 8000);

  function onMeta() {
    window.clearTimeout(metaTimer);
    duration = video.duration && isFinite(video.duration) ? video.duration : 0;
    if (!duration) return; // sem duração utilizável -> scrub desligado
    measure();
    // Snap à posição ATUAL do scroll (evita varredura longa 0->alvo quando
    // a página abre já rolada: refresh no meio, âncora, restauração de scroll).
    targetTime = scrollProgress() * duration;
    shownTime = targetTime;
    if (video.readyState >= 1) seekTo(shownTime);
    // shownTime == targetTime -> o loop não precisa rodar; o próximo scroll aciona.
  }
  if (video.readyState >= 1) onMeta();
  else video.addEventListener("loadedmetadata", onMeta, { once: true });

  // ---- Listeners --------------------------------------------------------
  window.addEventListener("scroll", syncTargetFromScroll, { passive: true });
  // Resize DEBOUNCED (~150ms): no mobile, mostrar/ocultar a barra de URL durante
  // o scroll dispara resize em rajada; measure() lê layout (reflow). Sem debounce
  // isso causaria reflows forçados durante o gesto. Mesmo cuidado do hero-shader.
  var resizeTimer = 0;
  window.addEventListener(
    "resize",
    function () {
      if (dead) return;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        resizeTimer = 0;
        if (dead) return;
        measure(); // scrollHeight/offset da âncora mudam com o layout
        syncTargetFromScroll();
      }, 150);
    },
    { passive: true }
  );

  // Prime no 1º gesto real (necessário p/ iOS liberar decodificação de seek).
  var primeOnce = function () {
    prime();
    window.removeEventListener("touchstart", primeOnce);
    window.removeEventListener("pointerdown", primeOnce);
    window.removeEventListener("wheel", primeOnce);
    window.removeEventListener("scroll", primeOnce);
  };
  window.addEventListener("touchstart", primeOnce, { passive: true });
  window.addEventListener("pointerdown", primeOnce, { passive: true });
  window.addEventListener("wheel", primeOnce, { passive: true });
  window.addEventListener("scroll", primeOnce, { passive: true });

  // ---- Troca de aba (SPA): o vídeo só age na aba "Bem-vindo" -------------
  // Fora dela, oculta a camada (não cobre o catálogo) e reancora o scrub.
  function onViewChange(view) {
    welcomeActive = view === "bemvindo";
    layer.classList.toggle("is-inactive", !welcomeActive);
    if (dead) return;
    measure();          // recomputa o alvo (âncora visível só na Bem-vindo)
    syncTargetFromScroll();
  }
  if (window.MarcelinhoNav && typeof window.MarcelinhoNav.onViewChange === "function") {
    window.MarcelinhoNav.onViewChange(onViewChange);
    // Estado inicial (a aba corrente pode não ser "bemvindo" via hash).
    onViewChange(window.MarcelinhoNav.current());
  }

  // Medição inicial (antes de qualquer scroll).
  measure();
})();
