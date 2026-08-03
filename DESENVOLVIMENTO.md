# Fluxo de Desenvolvimento — Marcelinho

Fluxo profissional obrigatório a partir de 2026-08-03. Objetivo: nada vai para a
produção (`https://lojamarcelinho.com`) sem aprovação explícita do João.

```
Desenvolvimento (local, branch dev) → Testes → Aprovação do João → Deploy (branch main)
```

## Branches

| Branch | Papel | Quem publica |
|--------|-------|--------------|
| `dev`  | **Desenvolvimento.** Todo trabalho novo acontece aqui. | Livre (não afeta o site oficial) |
| `main` | **Produção.** GitHub Pages serve `lojamarcelinho.com` a partir daqui. | **Só com aprovação explícita do João** |

> **Regra dura:** `main` só é tocada quando o João disser uma das frases de
> aprovação (ver abaixo). Fora disso, todo commit vai para `dev`.

## Ambiente local (hot reload)

Servidor local de homologação com recarga automática (browser-sync: injeta CSS
sem recarregar, recarrega a página em mudança de HTML/JS). Serve os **mesmos
arquivos** que a produção — estrutura idêntica por construção.

Primeira vez (instala o ferramental de dev; não vai para produção):
```
cd CODIGO-FONTE-PROTOTIPO
npm install
```

Iniciar o ambiente local:
```
npm run dev
```
Abre em **http://localhost:8099** com hot reload. É aqui que todo
desenvolvimento e teste acontece. Edite os arquivos → o navegador atualiza
sozinho.

Atalho no Windows: `./dev.ps1`

## Deploy para produção (só sob aprovação)

O deploy (merge `dev` → `main` + push) só é feito quando o João escrever
explicitamente uma destas frases:

- **"Aprovado para produção"**
- **"Pode publicar"**
- **"Enviar para o site oficial"**
- **"Fazer o deploy"**

Sem uma dessas, **nenhuma** alteração sobe para `lojamarcelinho.com`.

Passo de deploy (executado só após a aprovação):
```
git checkout main
git merge --no-ff dev -m "Deploy: <descrição da funcionalidade aprovada>"
git push origin main         # GitHub Pages republica lojamarcelinho.com
git checkout dev             # volta para desenvolvimento
```

## Hero congelada (V1.0)

A Hero (abertura cinematográfica: `#intro` no `index.html` + `hero-iphone-3d.js`)
é **Versão Final 1.0, bloqueada**. Não se altera nada nela — nem em `dev` — exceto
por pedido explícito do João. (Regra 96.)
