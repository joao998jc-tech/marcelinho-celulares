# PLANO DE TESTES / RELATÓRIO DE QA — Vitrine MARCELINHO (protótipo estático)

- **Projeto:** MARCELINHO — vitrine de celulares novos/seminovos (front-only, HTML/CSS/JS vanilla).
- **Escopo do QA:** protótipo estático em `CODIGO-FONTE-PROTOTIPO/` (index.html; assets/css/*; assets/js/{products,main,nav,scroll-reveal}.js).
- **Executado por:** Especialista em QA/Testes (subagente técnico do Analista de Sistemas).
- **Fluxo de origem:** acionado pelo Analista de Sistemas (QA do protótipo). Confirmado dentro do fluxo esperado.
- **Método:** leitura integral do código + simulação lógica do fluxo do usuário (roteirizado). Sem execução em navegador real (protótipo front-only, sem backend — riscos de ambiente listados no fim).
- **Regra respeitada:** nenhum arquivo de código foi alterado. Só este relatório foi escrito. Correções são do Analista de Sistemas.

---

## 1. Resumo executivo

O protótipo está bem estruturado, com placeholders honestamente marcados e boa base de acessibilidade (foco visível, reduced-motion, aria em nav/form). **Há 1 BUG REAL de comportamento** que precisa correção antes de mostrar ao cliente (cards somem ao filtrar) e alguns RISCOS de acessibilidade/UX. O deep link de WhatsApp por produto está **correto** em template e encoding — o único bloqueio funcional é o número placeholder, que é troca de dado esperada.

| Severidade | Qtde |
|---|---|
| BUG REAL | 1 |
| RISCO | 6 |
| RECOMENDAÇÃO | 4 |

---

## 2. BUGS REAIS (corrigir antes da entrega)

### BUG-01 — Cards do catálogo desaparecem ao clicar em qualquer filtro
- **Onde:** `assets/js/products.js:177` (buildProductCard tagueia cada card com classe `reveal`), `assets/js/products.js:227-232` (renderCatalog troca `grid.innerHTML` a cada clique de filtro), `assets/js/scroll-reveal.js:14,35` (observa `.reveal` **só uma vez, no load**), `assets/css/animations.css:11-16` (`.reveal { opacity:0 }`).
- **Passos de reprodução:**
  1. Abrir a página (catálogo inicial aparece normalmente — os cards iniciais são observados no load e revelados).
  2. Clicar em qualquer filtro (ex.: "Novos", "Apple", "Seminovos").
  3. `renderCatalog` reescreve o `innerHTML` da grade com cards novos que têm a classe `reveal` (opacity:0), mas o IntersectionObserver **não observa** esses elementos novos e nada adiciona `is-visible` neles.
- **Resultado esperado:** os aparelhos do filtro selecionado aparecem.
- **Resultado obtido:** a grade fica **em branco** (cards existem no DOM porém com `opacity:0` e `translateY(22px)` permanentes). O usuário vê o catálogo "sumir" ao filtrar — quebra o fluxo principal da vitrine.
- **Observações:** só não ocorre para quem tem `prefers-reduced-motion: reduce` (nesse caso `.reveal` já é `opacity:1`, animations.css:90-93) — ou seja, o bug é invisível para quem testar com movimento reduzido, o que aumenta o risco de passar despercebido.
- **Severidade:** ALTA (quebra a funcionalidade central: filtrar aparelhos).
- **Como corrigir (sugestões, decisão do Analista):**
  - Opção A (mínima): em `renderCatalog`, após setar `grid.innerHTML`, marcar os novos cards como visíveis: `grid.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'))`.
  - Opção B: expor a função de observe do scroll-reveal e reobservar os cards novos após cada render.
  - Opção C: nos cards **re-renderizados por filtro**, não usar a classe `reveal` (deixar a animação de entrada só para o primeiro paint).

---

## 3. RISCOS (avaliar/corrigir antes de vender como "pronto")

### RISCO-01 — Número de WhatsApp placeholder torna TODOS os links wa.me inválidos
- **Onde:** `assets/js/products.js:35` (`WHATSAPP_NUMERO = "55SEUNUMERO"`), `assets/js/main.js:25` (fallback), `index.html:51,70,320,345`.
- **Detalhe:** `wa.me/` exige apenas dígitos (DDI+DDD+número). `55SEUNUMERO` é alfanumérico → nenhum link abre uma conversa real. É placeholder documentado, mas é **bloqueio funcional obrigatório** antes de qualquer demo/entrega.
- **Severidade:** ALTA como dado (não é bug de código), item nº1 da lista de troca pré-entrega.
- **Correção:** substituir por número real só-dígitos (ex.: `5515999999999`) nos 6 pontos acima.

### RISCO-02 — Contraste AA: botões WhatsApp (texto branco sobre verde) abaixo de 4.5:1
- **Onde:** `assets/css/components.css:159-162` (`.btn--whats`, verde `#1faa54`) e `assets/css/components.css:652-655` (`.float-whatsapp`), texto branco `fs-sm` (14px) peso 600.
- **Detalhe:** branco sobre `#1faa54` ≈ **3.0:1** — reprova AA para texto normal (mínimo 4.5:1). É a cor "WhatsApp" reconhecível, mas o texto pequeno não passa.
- **Severidade:** MÉDIA (a11y). Botão é clicável e reconhecível, mas o rótulo textual falha AA.
- **Correção:** escurecer o verde do fundo (ex.: usar `--color-whats-strong #178f45` como base já ajuda, mas ainda fica ~3.4:1) ou aumentar peso/tamanho do texto para se qualificar como "large text" (>=18.66px bold), ou usar rótulo em navy sobre verde claro.

### RISCO-03 — Contraste AA: hover do botão primário (branco sobre laranja forte) marginal
- **Onde:** `assets/css/components.css:112-117` (`.btn--primary:hover` → fundo `#d9550f`, cor `#fff`).
- **Detalhe:** branco sobre `#d9550f` ≈ **4.0:1** — abaixo de 4.5:1 para texto normal. Estado default do primário (navy `#12264a` sobre laranja `#f26a1b` ≈ 4.9:1) passa; o problema é só no hover.
- **Severidade:** BAIXA/MÉDIA (transitório, só no hover).
- **Correção:** manter texto navy no hover, ou escurecer mais o fundo.

### RISCO-04 — Formulário mostra "sucesso" mesmo se o popup do WhatsApp for bloqueado
- **Onde:** `assets/js/main.js:75-76` (`successEl.classList.add("is-visible"); window.open(url, "_blank", "noopener");`).
- **Passos:** com bloqueador de popup ativo, enviar o formulário → mensagem "Abrimos o WhatsApp numa nova aba" aparece, mas nada abre.
- **Resultado esperado:** só confirmar sucesso se a aba abriu; caso contrário, oferecer link manual.
- **Severidade:** MÉDIA (falso positivo confunde o cliente/lead).
- **Correção:** checar retorno de `window.open`; se `null`/bloqueado, exibir link clicável de fallback em vez da mensagem de sucesso.

### RISCO-05 — Categoria "Ofertas" não tem filtro correspondente
- **Onde:** `index.html:162-166` (card categoria "Ofertas" com `href="#catalogo"`) vs. `assets/js/products.js:90-98` (array `FILTERS` não tem entrada de ofertas).
- **Detalhe:** clicar em "Ofertas" apenas rola até o catálogo, sem filtrar pelos itens com `oldPrice`. Expectativa do usuário (ver só ofertas) não é atendida.
- **Severidade:** BAIXA/MÉDIA (UX/expectativa).
- **Correção:** ou adicionar um filtro "Ofertas" (produtos com `oldPrice != null`), ou remover/ajustar o card de categoria para não prometer algo que o filtro não faz.

### RISCO-06 — Menu mobile não prende o foco nem torna o fundo inerte
- **Onde:** `assets/js/nav.js:31-43` (openMenu/closeMenu).
- **Detalhe:** com o menu off-canvas aberto, o Tab pode alcançar elementos atrás do overlay. `Esc` fecha e devolve foco corretamente (nav.js:51-56) e o `aria-hidden`/`aria-expanded` estão certos, mas falta focus-trap / `inert` no `<main>`.
- **Severidade:** BAIXA (a11y de teclado).
- **Correção:** aplicar `inert` ao conteúdo de fundo ao abrir, ou implementar trap de foco simples dentro de `#mobileNav`.

---

## 4. RECOMENDAÇÕES (melhorias, não bloqueiam entrega)

### REC-01 — Âncoras sob o header fixo (falta scroll-padding)
- **Onde:** `assets/css/reset.css:15-18` (`html`), header é `position:fixed` 72px (`layout.css:9-35`).
- **Detalhe:** links de âncora (#catalogo etc.) rolam a seção para o topo do viewport, ficando parcialmente sob o header de 72px. Na prática o `padding-block` generoso das seções (6rem) mantém o título visível, então o impacto é pequeno.
- **Correção:** `html { scroll-padding-top: 80px; }`.

### REC-02 — Salto de nível de heading no rodapé
- **Onde:** `index.html:308,317,326` (h4 de rodapé) sem h3 antecedendo na região do footer (vem de h2 de seção direto para h4).
- **Correção:** usar h3 ou revisar a hierarquia para não pular nível (a11y de estrutura).

### REC-03 — Instagram placeholder com href="#" e target="_blank"
- **Onde:** `index.html:331`.
- **Detalhe:** `href="#"` + `target="_blank"` abre uma nova aba no topo da própria página. Aceitável como placeholder, mas trocar por URL real (ou `#` sem `target`) evita comportamento estranho na demo.

### REC-04 — Mensagem de sucesso do form permanece visível em reenvio com erro
- **Onde:** `assets/js/main.js:75` — `is-visible` nunca é removido.
- **Detalhe:** após um envio bem-sucedido, se o usuário editar e reenviar com erro, a faixa verde de sucesso continua na tela. Minor.
- **Correção:** ocultar `.form-success` no início do handler de submit.

---

## 5. Casos testados (roteiro) e resultado

Referência de proporção (Test Pyramid): protótipo front-only sem suíte automatizada — cobertura aqui é E2E/manual roteirizada + inspeção estática.

| # | Caso | Cenário | Resultado |
|---|---|---|---|
| T01 | Deep link WhatsApp — produto NOVO | iPhone 15 Pro 256GB / Titânio Natural / novo / R$6.499,00 → `whatsappLink` (products.js:110-118) | **PASSA.** Mensagem: "Olá! Tenho interesse no iPhone 15 Pro 256GB (novo), cor Titânio Natural, no valor de R$ 6.499,00. Ainda está disponível?" — `encodeURIComponent` aplicado à string inteira, sem espaço/quebra crua; `target="_blank" rel="noopener"` (products.js:190). |
| T02 | Deep link WhatsApp — produto SEMINOVO | iPhone 13 128GB / Meia-noite / seminovo / preço atual R$2.899,00 (oldPrice 3299 ignorado na msg) | **PASSA.** Usa o preço atual (congela o valor vigente), acentos/hífen codificados corretamente. |
| T03 | `formatPrice` milhar/decimal | 6499 → "R$ 6.499,00"; 1499 → "R$ 1.499,00"; 49 → "R$ 49,00" (products.js:101-103) | **PASSA.** |
| T04 | Deep link acessório | Capa Anti-impacto / Capas / R$49,00 (products.js:120-126) | **PASSA.** Template coerente e codificado. |
| T05 | Consistência do número placeholder | products.js:35, main.js:25, index.html:51/70/320/345 | **PASSA (consistente)** — todos `55SEUNUMERO`; ver RISCO-01 (troca obrigatória). |
| T06 | Filtro exibe subconjunto correto | matchFilter (products.js:220-225) para all/condition/brand | Lógica **PASSA**, mas ver **BUG-01**: os cards renderizados ficam invisíveis. |
| T07 | Filtro que zera a lista | renderCatalog trata vazio (products.js:229-231) com mensagem "Nenhum aparelho nesta categoria por enquanto." | **PASSA** (há feedback; com os dados atuais nenhum filtro zera). |
| T08 | aria-pressed dos filtros | buildFiltersMarkup (products.js:234-244) + handler (products.js:258-268) | **PASSA** — `aria-pressed` alterna e `is-active` acompanha; `role="group"` + aria-label no wrapper. |
| T09 | Form: envio vazio | validate() (main.js:36-48) exige nome e interesse; foca 1º erro | **PASSA** — bloqueia, exibe erro em `.form-error` (aria-live), foca campo. |
| T10 | Form: envio válido → WhatsApp | main.js:63-77 monta msg e abre wa.me | **PASSA** na montagem; ver RISCO-04 (falso positivo se popup bloqueado). |
| T11 | Menu mobile toggle/aria/Esc | nav.js:22-56 | **PASSA** — aria-expanded/aria-hidden corretos, Esc fecha e devolve foco, alvo 44x44 (layout.css:63-70). Ver RISCO-06 (sem focus-trap). |
| T12 | Âncoras do menu apontam para IDs existentes | #categorias, #catalogo, #acessorios, #servicos, #contato | **PASSA** — todos os IDs existem (index.html:140,172,192,208,291). |
| T13 | WhatsApp flutuante presente | index.html:345-352 | **PASSA** — fixo, aria-label, rel="noopener". |
| T14 | IDs do HTML x seletores do JS | .vitrine-grid, .acessorios-grid, #year, #orcamentoForm, elements[nome/interesse/condicao/mensagem], #header/#menuToggle/#mobileNav, .reveal | **PASSA** — todos batem. |
| T15 | Ordem dos scripts (defer) | nav → products → scroll-reveal → main (index.html:356-359) | **PASSA** — defer preserva ordem; cards iniciais existem antes do observer. |
| T16 | prefers-reduced-motion | reset.css:23-35 + animations.css:90-103 | **PASSA** — desliga float/sprite/reveal e scroll suave. |
| T17 | Overflow horizontal mobile | `body { overflow-x:hidden }` (base.css:13) + grids responsivas | **PASSA** (sem overflow evidente); mascote `width:100%` dentro de `max-width:460px`. |
| T18 | Placeholders visivelmente marcados | ver seção 6 | **PASSA** — todos honestamente rotulados, incl. nota no rodapé (index.html:339). |
| T19 | Foco visível / alt / labels | reset.css:83-87; alt no mascote (index.html:120); labels no form | **PASSA.** |
| T20 | Contraste AA das cores de marca | navy/laranja/verde | **PARCIAL** — ver RISCO-02 (verde WhatsApp ~3.0:1) e RISCO-03 (hover laranja ~4.0:1). Demais pares (navy/laranja default 4.9:1, eyebrow orange-ink 4.76:1, badge novo 4.6:1) passam. |

---

## 6. Placeholders identificados (todos visivelmente marcados — item 7 OK)

- Número WhatsApp `55SEUNUMERO` — products.js:35, main.js:25, index.html:51/70/320/345.
- Catálogo de aparelhos `PRODUCTS[]` (exemplo) — products.js:41-78.
- Acessórios `ACCESSORIES[]` (exemplo) — products.js:81-86.
- Fotos de produto/acessório: placeholder "Imagem de exemplo / foto real do cliente" — products.js:166-173 + components.css:385-412.
- Logo desenhado em SVG (sem arquivo oficial) — index.html:29-37, components.css:21-38.
- Texto institucional do hero — index.html:88-91.
- Texto de serviços/assistência — index.html:214-216.
- Contato do rodapé: WhatsApp "(00) 00000-0000", tel "+5500000000000", "Rua Exemplo, 000 — Sarapuí/SP" — index.html:319-322.
- Atendimento: horários "00h — 00h", Instagram "@marcelinho" href="#" — index.html:328-331.
- Sprite do mascote (arquivo ainda não existe) — tokens.css:135-139; markup comentado em index.html:124-127.
- Nota explícita de protótipo no rodapé — index.html:339.

---

## 7. Riscos não cobertos por falta de ambiente/dados

- **Sem execução em navegador real:** contrastes foram calculados (WCAG) e o fluxo simulado logicamente; recomenda-se validar BUG-01 e RISCO-02/03 num navegador + ferramenta de contraste (axe/Lighthouse) antes da entrega.
- **WhatsApp real não testável:** com `55SEUNUMERO` não é possível confirmar abertura de conversa; validar após inserir o número real (RISCO-01).
- **Popup blocker / mobile:** comportamento de `window.open` (RISCO-04) varia por navegador/dispositivo — testar em Android/iOS reais.
- **Fotos e catálogo reais ausentes:** layout dos cards validado só com placeholder 4:3 / 1:1; possível ajuste fino quando fotos reais (proporções diferentes) chegarem.
- **Fontes via CDN (Google Fonts):** dependência externa; sem rede, cai para fallback system-ui (aceitável).

---

## 8. Lista priorizada para o Analista de Sistemas (o que corrigir antes da entrega)

1. **BUG-01 (ALTA):** cards somem ao filtrar — corrigir revelação dos cards re-renderizados (products.js:227-232 / scroll-reveal.js). **Único bug de código bloqueante.**
2. **RISCO-01 (ALTA, dado):** trocar `55SEUNUMERO` pelo número real nos 6 pontos.
3. **RISCO-04 (MÉDIA):** não mostrar "sucesso" do form se o popup for bloqueado (main.js:75-76).
4. **RISCO-02 (MÉDIA, a11y):** contraste do texto dos botões WhatsApp verdes.
5. **RISCO-05 (MÉDIA, UX):** categoria "Ofertas" sem filtro correspondente.
6. **RISCO-03 / RISCO-06 e RECs:** ajustes finos de contraste no hover, focus-trap do menu, scroll-padding, hierarquia de heading, href do Instagram, reset do form-success.

> A verificação final de qualidade da tarefa como um todo permanece com o Analista de Sistemas (Regra 18). Este relatório alimenta essa verificação.
