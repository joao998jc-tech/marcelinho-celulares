# Deploy em produção — lojamarcelinho.com

Site estático (HTML/CSS/JS vanilla, sem build). Hospedagem atual: **GitHub Pages**
a partir do repositório `joao998jc-tech/marcelinho-celulares` (branch `main`, raiz).
Domínio oficial de produção: **https://lojamarcelinho.com** (apex), com
`www.lojamarcelinho.com` redirecionando 301 → apex.

---

## 1. O que já foi configurado no código

- **`CNAME`** → `lojamarcelinho.com` (GitHub Pages usa esse arquivo p/ vincular o
  domínio custom e definir o apex como canônico; `www` passa a fazer 301 → apex).
- **`<head>` do `index.html`**: canonical, `robots`, Open Graph, Twitter Cards,
  `manifest`, favicon/apple-touch-icon, referrer policy e JSON-LD (Schema.org
  `Store`) — todas as URLs absolutas no apex `https://lojamarcelinho.com/`.
- **`robots.txt`** → libera indexação e aponta o sitemap.
- **`sitemap.xml`** → 1 URL (é SPA de página única).
- **`site.webmanifest`** → PWA básico (nome, ícone, theme-color).

> A Hero (V1.0 congelada, Regra 96) **não foi tocada** — só o `<head>` e arquivos novos.

---

## 2. Publicar (deploy)

```
cd CODIGO-FONTE-PROTOTIPO
git add CNAME robots.txt sitemap.xml site.webmanifest index.html DEPLOY.md
git commit -m "Producao: dominio lojamarcelinho.com + SEO/robots/sitemap/manifest"
git push origin main
```

O GitHub Pages republica sozinho em ~1 min após o push.

> ⚠️ Há uma alteração **não commitada** em `assets/js/hero-iphone-3d.js` (Hero).
> Como a Hero está congelada, ela foi deixada intacta e **fora** deste commit.
> Decidir à parte se essa mudança entra ou é descartada.

---

## 3. Configuração no GitHub (uma vez)

`Settings → Pages` do repositório:
1. **Custom domain**: `lojamarcelinho.com` → Save (o arquivo `CNAME` já faz isso,
   mas confirme que aparece lá e sem erro de verificação).
2. Aguardar o check de DNS ficar verde.
3. Marcar **Enforce HTTPS** (só habilita depois que o DNS propaga; o certificado
   TLS é emitido de graça pelo GitHub/Let's Encrypt).

---

## 4. DNS — o que criar no provedor do domínio (última etapa)

No painel de DNS de **lojamarcelinho.com** (Registro.br, Cloudflare, GoDaddy,
Hostinger, onde o domínio estiver), criar:

**Apex (`lojamarcelinho.com`) — 4 registros A + 4 AAAA (IPs oficiais do GitHub Pages):**

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |

**www (`www.lojamarcelinho.com`) — 1 registro CNAME:**

| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | www | joao998jc-tech.github.io |

> Se usar **Cloudflare**, deixe os registros com proxy **desativado** (nuvem
> cinza) na 1ª ativação até o GitHub emitir o certificado; depois pode religar.
> Propagação: minutos a algumas horas.

Depois de propagar: `https://lojamarcelinho.com` e `https://www.lojamarcelinho.com`
funcionam, com www → apex (301) e HTTPS forçado.

---

## 5. Segurança — headers recomendados (limitação do GitHub Pages)

O GitHub Pages **não permite** definir cabeçalhos HTTP customizados. Portanto:

- **HTTPS**: garantido pelo "Enforce HTTPS" (passo 3) — sem conteúdo misto, pois
  todos os recursos externos (Google Fonts, `esm.sh` do three.js) já são `https`.
- **CSP não foi injetada via `<meta>`** de propósito: uma CSP restritiva poderia
  quebrar a Hero congelada (three.js carregado dinamicamente de `esm.sh` +
  importmap + handlers inline), e não dá para validar isso sem testar em produção.
  Se/quando for aplicar, a política mínima que preserva a Hero é:

  ```
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://esm.sh;
  style-src  'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src   'self' https://fonts.gstatic.com;
  img-src    'self' data:;
  connect-src 'self' https://esm.sh;
  ```

  Para aplicar CSP/HSTS/X-Frame-Options **de verdade** (via header, não meta),
  seria preciso pôr o site atrás de um proxy que injeta headers — ex.
  **Cloudflare** (Transform Rules / Response Headers) na frente do GitHub Pages.
  Recomendado num passo futuro; hoje não é bloqueador.

---

## 6. Pós-publicação (validar)

- [ ] `https://lojamarcelinho.com` abre com cadeado (HTTPS).
- [ ] `www.lojamarcelinho.com` redireciona p/ o apex.
- [ ] Hero (abertura cinematográfica) intacta e funcional.
- [ ] Compartilhar o link no WhatsApp mostra título + descrição + imagem (OG).
- [ ] `https://lojamarcelinho.com/robots.txt` e `/sitemap.xml` acessíveis.
- [ ] Submeter o sitemap no Google Search Console.
