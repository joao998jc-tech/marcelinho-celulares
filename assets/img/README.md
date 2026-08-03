# assets/img — Assets do protótipo (Fase 1)

> **Status: EM USO.** O protótipo já roda com o mascote estático. Faltam a logo
> oficial, as fotos reais dos aparelhos e o sprite de aceno do mascote.

## Já presente

- **`mascote-marcelinho.jpeg`** — mascote oficial (fallback ESTÁTICO do hero,
  em uso hoje). Fundo branco fundido via `mix-blend-mode` no hero.

## Pendências

- **`mascote-sprite.png`** — sprite sheet de aceno (em produção pela frente de
  Design). Como plugar: ver README do protótipo e comentários em `tokens.css` /
  `animations.css`. **Pendente.**
- **Logo** — logo oficial do MARCELINHO (`logo-marcelinho.png`), para header e
  footer (hoje há um ícone CSS/SVG como placeholder). **Pendente.**
- **`products/`** — fotos reais dos aparelhos (uma por modelo), para os cards.
  Hoje os cards usam um placeholder visual "Imagem de exemplo". **Pendente.**

## Recomendações para os assets (quando chegarem)

- Preferir WebP/JPEG comprimido, mobile-first (menos de ~150kb por foto), já
  que o tráfego tende a ser majoritariamente mobile.
- Usar `<img>` com `alt` descritivo, `width`/`height` reais, `loading="lazy"`
  e `decoding="async"`, respeitando a proporção real do arquivo (evitar CLS).
- Decisões finais de formato/otimização são do Analista de Sistemas na Fase 1.
