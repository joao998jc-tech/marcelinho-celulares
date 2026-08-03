# SPECS — Sprite sheet do mascote animado MARCELINHO (aceno/boas-vindas)

> **Artefato de HANDOFF para o Analista de Sistemas.** Consolidado pelo Coordenador de Design & Conteúdo Visual/Branding a partir da produção do Produtor de Vídeo/Motion (spec técnica) e da validação do Guardião de Branding Aplicado. Documento autossuficiente: contém o que é preciso para (1) renderizar o vídeo-loop e (2) montar o sprite + calibrar `steps()`/`background-position` no hero.
>
> **Fronteira:** Design entrega ATÉ o sprite sheet + estas specs. O consumo no site (CSS `steps()`, "efeito de fundo se movendo") é do **Analista de Sistemas** (Regra 17).
>
> **Status:** vídeo AINDA NÃO renderizado (bloqueio de acesso ao arquivo — ver §6). Frames e sprite dependem do vídeo. Esta spec está pronta para disparo imediato.
>
> Fonte técnica detalhada (prompt/negativos/parâmetros na íntegra): `CLIENTES/SITES/MARCELINHO/Mascote/SPEC-video-loop-mascote-v3.md`.

## Menção literal do João (preservada 100% — Regra 45)
"tenho o mascote, preciso gerar o video do mascote se movendo, separar os frames e depois na montagem do site criarmos o efeito de fundo se movendo, seria muito um diferencial nosso e chamaria atenção"

## Asset de origem
`C:\Users\joao9\OneDrive\Área de Trabalho\AVANZIA\CLIENTES\SITES\MARCELINHO\Mascote\Marcelinho mascote.jpeg`
Cópia no projeto: `assets/img/mascote-marcelinho.jpeg`.
Mascote 3D Pixar: camisa azul-marinho, logo MARCELINHO (ícone laranja de celular) no peito, corrente + crucifixo dourados, tatuagem no antebraço esquerdo, relógio no pulso esquerdo, segura celular de tela preta na mão direita. Fundo cinza-claro em gradiente com sombra suave (NÃO é branco puro → exige remoção de fundo por frame).

Conceito FIXO por decisão do João, não reabrir: **movimento = ACENO/BOAS-VINDAS, loop suave sem cortes**.

---

## 1) PROMPT image-to-video (PT-BR) — validado pelo Guardião (v3)
Anime a imagem de referência com um ACENO curto e amigável de BOAS-VINDAS, mantendo personagem, enquadramento e estilo idênticos ao original. O ÚNICO movimento significativo é a MÃO ESQUERDA acenando (palma aberta, dedos juntos), articulada apenas a partir do PULSO/PUNHO. O ANTEBRAÇO ESQUERDO permanece fixo e ancorado — só a mão/punho articula; o antebraço não varre o quadro. Logo, a TATUAGEM e o RELÓGIO permanecem estáticos, sem esticar/deslizar/deformar. O aceno ocorre ACIMA da linha do ombro e à LATERAL da silhueta, FORA da projeção vertical do logo MARCELINHO no peito — a mão nunca cruza, cobre nem projeta sombra sobre o logo. Preserve o CELULAR na mão direita com a tela 100% preta e vazia, sem reflexos, sem conteúdo, sem deformação. Apenas respiração muito sutil do tronco. Corrente e crucifixo estáveis. Rosto sorridente, tatuagem, relógio, logo e qualquer texto nítidos e inalterados. Iluminação, cores, fundo e proporções idênticos à referência. Câmera 100% estática (sem zoom/paneo/corte). Loop suave, contínuo e curto.

## 2) NEGATIVOS (final)
antebraço esquerdo se movendo / varrendo o quadro; cotovelo levantando; tatuagem esticando/deslizando/deformando/mudando de desenho; relógio deformando/deslizando/sumindo; mão cobrindo/cruzando o logo do peito, sombra sobre o logo, oclusão do logo; celular deformado, tela com conteúdo/reflexo/acesa, aparelho entortando; corrente/crucifixo oscilando/deformando; logo/texto distorcido, letras trocadas, lettering ilegível; rosto deformado, dedos extras/derretendo, mãos deformadas; mudança de roupa/cor/fundo; câmera se movendo/zoom/paneo/corte/tremor; personagem se deslocando; morphing, flicker, artefatos, blur, baixa qualidade.

## 3) PARÂMETROS de render
| Parâmetro | Valor |
|---|---|
| Modo | Image-to-video (entrada = JPEG de referência) |
| Duração | 2,0 s (se o motor só der 1,0 s, aceitável desde que o ciclo feche) |
| FPS de render | 24 fps → 48 frames brutos (superamostragem para decimação limpa) |
| Aspect ratio | Manter o NATIVO do asset (é ~quadrado 1:1) |
| Resolução | A maior que o motor permitir mantendo o AR nativo |
| Motion strength | BAIXO (aceno curto de pulso + respiração) — âncora antebraço/tatuagem/relógio |
| Câmera | Estática |
| Loop | Frame inicial = frame final (mão aberta em aceno), costura sem salto |
| Saída | MP4 (H.264) ou WEBM alta qualidade |

---

## 4) MATEMÁTICA DO SPRITE — CONSOLIDADA (para calibrar `steps()` / `background-position`)

> **Correção do Coordenador (verificação final de consistência):** a spec v3 propunha um "Plano A" em tira única 24×1 = **14400 px** de largura. **REJEITADO** — 14400 px estoura o limite de textura de GPU de ~4096 px/eixo em navegadores mobile Android antigos (público do Marcelinho é majoritariamente mobile), risco de o hero não pintar. **Regra de ouro desta entrega: ambos os eixos do sprite < 4096 px.** Por isso o layout recomendado é GRADE, não tira única.

**Constantes:**
- **N = 24 frames** (decimação 48→24, aceno a ~12 fps efetivos — fluido no mobile e metade do peso).
- **Layout recomendado: GRADE REGULAR 6 colunas × 4 linhas** (= 24 células, célula de dimensão CONSTANTE).
- Frame 0 (mão aberta em aceno) = poster/estado de repouso quando a animação não roda; os 24 frames são o loop.

**Opção A — RECOMENDADA (célula quadrada, casa com asset 1:1):**
- Célula: **400 × 400 px** (constante).
- Sprite total: **2400 × 1600 px** (6×400 × 4×400). Ambos eixos < 4096 ✔.
- CSS: stepping 2D — `steps(6)` no eixo X avança −400 px por passo; ao fim de cada linha, avança −400 px no eixo Y (`steps(4)`), percorrendo os 24 frames no tempo do loop.

**Opção B — se o Analista recortar a silhueta em retrato após remove_background:**
- Célula: até **600 × 800 px** (retrato), constante.
- Sprite total: **3600 × 3200 px** (6×600 × 4×800). Ambos eixos < 4096 ✔.

**Opção C — peso mínimo (conexões lentas):**
- Célula: **320 × 320 px** → sprite **1920 × 1280 px**. Mesma lógica de grade 6×4.

**Resumo para o Analista:**
| | Célula (px) | Layout | Sprite total (px) | Nº frames |
|---|---|---|---|---|
| A (recom.) | 400 × 400 | 6 col × 4 lin | 2400 × 1600 | 24 |
| B (retrato) | 600 × 800 | 6 col × 4 lin | 3600 × 3200 | 24 |
| C (leve) | 320 × 320 | 6 col × 4 lin | 1920 × 1280 | 24 |
| ~~tira única~~ | ~~600 × 800~~ | ~~24 × 1~~ | ~~14400 × 800~~ REJEITADO | 24 |

- Duração do loop CSS: alinhar à captura (≈2,0 s) — decisão fina do Analista.
- A célula final depende do AR nativo confirmado do JPEG e de o Analista cropar (ou não) as margens transparentes após a remoção de fundo; qualquer que seja a escolha, manter grade 6×4 e ambos os eixos < 4096 px.

---

## 5) HANDOFF ao Analista de Sistemas (Regra 17 — Design não codifica)
Cadeia de pós-produção, toda de CÓDIGO, portanto do Analista de Sistemas:
1. Extração de frames do MP4/WEBM (ffmpeg) — 48 brutos a 24 fps.
2. Decimação 48→24 (1 frame a cada 2).
3. `remove_background` por frame → PNGs com alpha (fundo do asset tem gradiente/sombra; recorte limpo é obrigatório).
4. Costura do sprite em grade 6×4, célula constante (Opção A/B/C acima) → PNG com alpha.
5. Calibração de `steps()` + `background-position` (2D) para o loop suave; frame 0 = repouso.
6. Montagem no hero: "efeito de fundo se movendo" (parallax/loop de fundo) + mascote acenando em camada sobreposta — implementação e decisão de UX do Analista.

Salvar o sprite final como `assets/img/mascote-sprite.png`.

## 6) BLOQUEIO DE RENDER (precisa do João/Coordenador para destravar)
As tools MCP de vídeo (Higgsfield `generate_video` / Gravyx) **não leem o arquivo LOCAL** do disco. Para renderizar é obrigatório UM destes caminhos:
- **Upload do JPEG em sessão Apps UI** (widget `media_upload_widget` do Higgsfield); OU
- **URL pública** do JPEG (hospedar e passar a URL ao motor). Hospedar é tarefa técnica → Analista de Sistemas (Regra 17).

## 7) DECISÃO DE DIRETRIZ ESCALADA AO JOÃO (não reaberta por Design)
O asset original comunica **"olha este celular"** (mascote APONTANDO para o produto — dedo indicador estendido). O aceno de boas-vindas substitui esse gesto por **"olá"**, perdendo o apontar-para-o-produto, que é mensagem de marca forte numa loja de celulares. O Guardião sinalizou isso 2×; é decisão de conceito/branding, não de aplicação técnica. **Recomendação do Coordenador:** confirmar com o João / Especialista em Branding se abrir mão do gesto de apontar é aceitável. Alternativa, se não for: loop de MICRO-MOVIMENTO mantendo o mascote apontando para o produto (mesma pipeline vídeo→frames→sprite, só muda a pose-âncora). Como o João já fixou "aceno", a spec acima assume ACENO; esta é apenas a sinalização de risco para decisão consciente.

## 8) Pendências
- tokens.css do MARCELINHO ainda é placeholder (sem paleta de produção). Validação de branding feita por fidelidade ao asset + azul-marinho + logo. Revalidar o azul-marinho contra o token oficial quando o Especialista em Branding fechar a paleta.
- Validação da PEÇA RENDERIZADA (não só da spec) pelo Guardião de Branding Aplicado fica PENDENTE até o render ser executado.
