# MARCELINHO — Protótipo de Vitrine (Fase 1, front-only)

> **Status: PROTÓTIPO FUNCIONAL (Fase 1).** Vitrine estática de encantamento,
> HTML/CSS/JS vanilla, **sem build, sem framework, sem backend, sem banco**.
> Todos os dados de negócio são **PLACEHOLDER de EXEMPLO** — falta apenas
> plugar as informações reais do cliente (ver lista abaixo).
>
> Projeto em **pipeline** (sem venda fechada). Admin + Firebase = **Fase 2**
> (fora deste protótipo).

## Como abrir

É um site estático: **basta abrir `index.html` no navegador** (duplo clique).
Não precisa de servidor, Node, nem instalar nada. As fontes (Poppins + Inter)
vêm do Google Fonts via CDN, então a primeira abertura precisa de internet.

Se quiser servir localmente (opcional):
```
# na pasta CODIGO-FONTE-PROTOTIPO
python -m http.server 8080
# abre http://localhost:8080
```

## Identidade visual

- **Paleta:** azul-marinho (`--color-navy #163a6b`, marca/estrutura/confiança) +
  laranja (`--color-orange #f26a1b`, ação/CTA/preço), extraídos do logo/mascote.
  Verde só nos badges "Novo" e no botão do WhatsApp.
- **Tema claro** (diferente do Decotime, que é escuro/luxo): loja de celular pede
  leveza, clareza e agilidade. O fundo claro também permite fundir o mascote no
  hero (o JPEG tem fundo branco; usamos `mix-blend-mode` no hero).
- **Tipografia:** Poppins (títulos) + Inter (corpo/UI), via Google Fonts.
- Tudo centralizado em **`assets/css/tokens.css`** (paleta, tipografia,
  espaçamento, motion, variáveis do sprite).

## Estrutura

```
CODIGO-FONTE-PROTOTIPO/
├── index.html                (todas as seções da vitrine)
├── assets/css/
│   ├── tokens.css            (design tokens + variáveis do SPRITE do mascote)
│   ├── reset.css             (normalização + prefers-reduced-motion)
│   ├── base.css              (tipografia global, container, eyebrow, títulos)
│   ├── layout.css            (header, hero, categorias, catálogo, acessórios, serviços, footer)
│   ├── components.css        (botões, cards, badges, mascote, formulário, WhatsApp)
│   └── animations.css        (scroll-reveal + flutuação do mascote + SPRITE via steps())
├── assets/js/
│   ├── nav.js                (menu mobile acessível: aria-*, Esc, foco)
│   ├── products.js           (DADOS de exemplo + render do catálogo/acessórios + links wa.me)
│   ├── scroll-reveal.js      (IntersectionObserver)
│   └── main.js               (ano do rodapé + formulário de orçamento -> WhatsApp)
└── assets/img/
    ├── mascote-marcelinho.jpeg   (fallback estático do hero — em uso hoje)
    └── products/                 (fotos reais dos aparelhos — pendente)
```

## Seções entregues (todas funcionando)

Header/nav responsivo · Hero com mascote · Categorias · Catálogo com filtros
(Novos/Seminovos/marca) · Acessórios · Serviços de assistência · Formulário de
orçamento (front-only, vira mensagem de WhatsApp) · Botão WhatsApp por produto ·
WhatsApp flutuante · Rodapé.

---

## ⚠️ O QUE FALTA — informações reais a preencher

Tudo abaixo está como **placeholder** sinalizado (`<!-- PLACEHOLDER: ... -->` no
HTML e comentários no JS). Procure por `PLACEHOLDER` e `55SEUNUMERO` para achar.

| # | O quê | Onde trocar |
|---|-------|-------------|
| 1 | **Número do WhatsApp** (DDI+DDD+número, ex. `5515999998888`) | `assets/js/products.js` → `WHATSAPP_NUMERO`; e as strings `55SEUNUMERO` em `index.html` (header, menu, footer, botão flutuante) |
| 2 | **Catálogo real** (modelo, marca, condição, cor, preço, oferta) | `assets/js/products.js` → array `PRODUCTS` |
| 3 | **Fotos dos aparelhos** | `assets/img/products/` + trocar o `photo-placeholder` por `<img>` no `buildPhoto()` de `products.js` (modelo de `<img>` comentado lá) |
| 4 | **Acessórios reais** | `assets/js/products.js` → array `ACCESSORIES` |
| 5 | **Serviços oferecidos** | `index.html` → seção `#servicos` (cards) |
| 6 | **Logo oficial** | hoje é um ícone CSS/SVG; trocar por `assets/img/logo-marcelinho.png` no header e footer |
| 7 | **Textos institucionais** (hero, subtítulos) | `index.html` (marcados com PLACEHOLDER) |
| 8 | **Contato/endereço/horário/redes** | `index.html` → rodapé (`footer`) |
| 9 | **Condições comerciais** (parcelamento, prazo de garantia) | `index.html` → `#servicos` aside |

---

## 🎬 Intro cinematográfica (abertura)

A abertura vive em `#intro` (topo do `<body>`) e é controlada por
`assets/js/hero-iphone-3d.js`: mascote dominante (`assets/img/mascote-hero.png`,
fundo removido) + celular 3D flutuando na palma; o scroll leva o celular ao
centro (reversível) e o CTA "Acessar o site" dá zoom-in e revela o restante do
site na MESMA página (sem URL/reload). Sem WebGL/CDN/`prefers-reduced-motion` a
intro fica estática com o CTA acessível (o site nunca fica inacessível).

- Piscada do mascote: mecanismo pronto no overlay `.intro__eyes`, mas
  **desligado por padrão** (`INTRO_BLINK=false` no JS) até verificação visual —
  ver cabeçalho de `hero-iphone-3d.js`.
- Hooks de verificação: `window.__heroIntro` (`progress`, `phaseState`,
  `blinkCount`, `ctaVisible`, `enter()`, `reveal()`).

## Acessibilidade & performance

- Mobile-first, breakpoints progressivos, alvos de toque ≥44px, `:focus-visible`,
  `aria-*` no menu (Esc fecha e devolve foco), contraste mirando AA (≥4.5:1).
- Hero sem imagem pesada bloqueante; `prefers-reduced-motion` respeitado; CSS/JS
  enxutos e modulares. Fotos reais devem entrar com `width/height`, `loading="lazy"`
  e `decoding="async"` (evitar CLS) — modelo comentado em `products.js`.

## Fora da Fase 1 (não fazer agora)

Banco de dados, Firebase, painel admin, carrinho/checkout — tudo isso é **Fase 2**,
só após o "sim" do cliente (ver `BRIEFING-MARCELINHO.md`).
