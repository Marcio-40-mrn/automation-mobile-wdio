# STATE

Entradas anteriores a 2026-10-22 e seções antigas: `.planning/STATE-HISTORICO.md` (texto original, fora do carregamento automático).

**2026-11-06 — Compartilhar carrinho testado no AVD (Android 1.22.9/534), nenhum teste escrito.** Cenários do Marcio em `.planning/cenarios-compartilhar-carrinho-2026-11-06.md` (Gherkin); análise em `drafts/app-migrado/android/ANALISE-COMPARTILHAR-CARRINHO.md`; capturas `captures-2026-11-06-compartilhar-carrinho/`, 00–46. Remetente funciona: `share-bag-cta` some com a Mochila vazia e aparece com itens, chooser nativo, link por Copy + clipboard, cancelar não muda a Mochila. Link `https://applink.aramis.com.br/share-bag/<uuid>`, sem UTM e sem dado pessoal, UUID novo a cada toque. **Destinatário, 2ª rodada (`captures-2026-11-06-compartilhar-carrinho-2/`, 01–35):** o link ABRE pelo Chrome, que redireciona para `aramisnova://share-bag/<uuid>` e leva à tela "Shared Backpack" (`shared-bag-item-<id>`, `shared-bag-add-all`), com Mochila vazia ou cheia. Com `-p com.aramis.ecomm` no link https dá "Page not found"; essa foi a falha da 1ª rodada, que testou só esse caminho. O `aramisnova://` com `-p` abre direto. Link inválido pelo Chrome: `shared-bag-unavailable`, "Go to store" leva à Home. 15 cenários entraram no M9 (Marcio, 2026-11-06: o que o app faz hoje é tomado como certo, e só se registra o que a automação valida). **3ª rodada, por Appium, `captures-2026-11-06-compartilhar-carrinho-3/`, 00–60: 15/15 passaram no app atual, sem coordenada**, com `mobile: deepLink` em `aramisnova://`, logado e deslogado. Os 15 foram dados como corretos pelo Marcio: 5, 17, 19 e 45 pelo resultado final, com o Gherkin escrito só a partir das regras; decisão do Marcio de seguir o app. iOS 1.22.9/377 (Remote Access, `drafts/app-migrado/ios/captures-2026-11-06-compartilhar-carrinho/`, 00–61, sessão fechada, Mochila e Favoritos vazios): 15/15 passaram; `getClipboard` não funciona, link lido colando na Busca; a Mochila mantém os itens depois do logout e o `afterTest` do Remote Access não limpa. **Teste escrito (ordem do Marcio): `06-compartilhar-carrinho` + `CompartilharPage`, só `tsc`, NÃO RODADO, nas duas plataformas.** Entra sozinho no CI, nos 11 devices. `esvaziarMochila` passou a valer no iOS. Conferir no primeiro run: Copy nos Samsung (com a prévia do menu como reserva), Mochila depois do logout no Android e tempo do spec. O 13 compara a Mochila antes e depois do Copy, que fecha o menu nativo. iOS não testado. Nenhum pedido nem conta; `pm clear` e `adb kill-server` feitos.

**2026-11-06 — CI Run #43 (11:49, Android 1.22.9/534): Android 29/30, iOS 24/25.** Rodou SEM a correção de "Back to top"/"Continue shopping" (só local, sem commit) e sem o `wdio.conf.ts` novo (`resolution: '1280x720'` e `timeLimit: 180` nos logs). `01` S23 Ultra: mesma falha do Run #42, banner "Só no APP: 20% OFF" visto no vídeo na hora do "Back to top". `02` iPhone 13: o "Add to cart" do 3º tamanho funcionou (contador da Mochila em 1 no print), mas o sheet de produto adicionado não abriu nos 8 s de espera do `comprarIOS()`, e o teste falhou. Causa não provada: o vídeo iOS parou em 172 s, antes da falha (~320 s); hipótese de demora do sheet, como o A22 do Android, não medida no iOS. O banner desse teste foi fechado e o passo repetido corretamente pelo `step()`, antes dessa falha. Nada alterado.

**2026-11-06 — iOS levantado no 1.22.9/377 (Remote Access, 390x844, sessão fechada; `drafts/app-migrado/ios/captures-2026-11-06-build377/`, 00–59).** Nenhum pedido nem conta; Mochila e Favoritos vazios. Drafts, `00-INDICE.md`, `ELEMENTOS-SEM-TESTID-IOS.md` e `BUGS-APP.md` (I33 e I34; 30, 31 e 32 retirados pelo Marcio, não impedem o funcionamento e idioma não se trata) reescritos. Ids do caminho dos testes sem mudança em relação ao 372; id novo `menu-item-control-panel`. Nenhuma mudança de teste exigida: o Alert do logout já é tratado no `confirmarLogout()`. Pix até o Resumo: total 376,81 (produtos 399,90, entrega 16,90, descontos 39,99). "Saiba mais" sem elemento: toque por coordenada abriu a listagem "Aramis em Milão", item do M10 depende de testID ou decisão do Marcio. Não conferido: cartão além do número, parcelas, Resumo com cartão, banner do Insider, "Size sold out", cadastro além da etapa 1, Meus pedidos, Coleção Especial logado. Sem causa provada, fora dos bugs: botão da Mochila de 399,90 para 416,80 depois do frete, lupa ausente na Home logada e "DEV / Painel de controle" visível no Menu.

**2026-11-05 — CI Run #42 (13:26, Android 1.22.9/534): os testes novos rodaram.** Android 26/30: `02` 5/6, `03`, `04` e `05` 6/6, `01` 3/6. iOS 5/5 iPhones (build do iOS não conferido). `✅ Resumo confere` e `✅ Coleção Especial aberta` nos logs dos 6 Androids e do iPhone 15; `🎒 Mochila com 2 produto(s)` nos 5 Androids que chegaram lá e no iPhone 15. Nos outros 4 iPhones só o resultado do job foi conferido.
As 4 falhas Android são o banner "Só no APP: 20% OFF" na hora de um toque, vistas nos vídeos; que o banner engoliu o toque é inferência (único toque no intervalo; o banner some e a tela não muda). `01` S23 Ultra, S24 Ultra e S25 Ultra: o toque em "Back to top" não sobe a lista, o `irParaOTopoDaListagem()` loga `⬆ "Back to top" tocado` sem conferir, e o `voltar()` abre um card (`(//*[@clickable="true"])[1]`); o 2º toque só volta da PDP. `02` S24+: o toque em `bag-continue-shopping` não fecha o sheet e o `continuarComprando()` não repete. **Corrigido (ordem do Marcio, 2026-11-06), só `tsc`, NÃO RODADO, nas duas plataformas:** `ProdutoPage.irParaOTopoDaListagem`, `continuarComprando` e `continuarComprandoIOS` chamam o `fechaBanner()` antes do toque, conferem o efeito e tocam até 2x; o log do "Back to top" só diz topo com o `header-back-button` na tela. O `fechaBanner` não mudou. Conferir no próximo run: `⚠ "Back to top": toque` e `⚠ Continuar comprando` quando o banner interferir.
Vídeo: o Run #42 NÃO usou o `wdio.conf.ts` deste repositório (`849f97e`, 22/10): rodou com `timeLimit: 180` no iOS (conferido no iPhone 15: 4 vídeos de ~172 s, testes de 281 a 435 s) e `resolution: '1280x720'` no Android (vídeos inteiros, 13 de 30 acima dos 95 MiB e apagados na publicação). Provável causa: o outro repositório sem esse arquivo (não aberto). 720x480 sem tamanho medido em run real. Com a suíte nova rodando, o `finalizarPedidoComCartao is not a function` do `#41` não apareceu no iPhone 15.

**2026-11-05 — Android levantado no 1.22.9/534 (AVD, conta `marcio.rocha.ext@aramisinc.com.br`; `drafts/app-migrado/android/captures-2026-11-05-build534/`, 00–104, `NOTAS.md`).** Nenhum pedido criado; `summary-finalize-purchase` não tocado. Drafts `13`–`18`, `20`–`22`, `27`, `32` e `00-INDICE.md` reescritos; `BUGS-APP.md` A42 (sheet de tamanho preso). Meia + chinelo juntos = `bag-without-shipping` nos 2 endereços testados: **não é bug (Marcio, 2026-11-06)**, descrito só no draft `17`. Não conferido no 534: cartão, Resumo com cartão, parcelas, tela do Pix/QR code, Rápido selecionado, Entrega com camisa/calça, meia + chinelo nos endereços 3 e 4, sheet pela PDP, formulário de novo endereço. **Pendente:** `ELEMENTOS-SEM-TESTID.md` continua com o cabeçalho do 513 (regra "um build só"). O caminho dos testes no 534 foi coberto pelo Run #42 acima.

**2026-11-04 — `05-colecao-especial` escrito (ordem do Marcio; o teste e os arquivos não levam o nome Richard, só o testID do app), só `tsc`, NÃO RODADO, nas duas plataformas.** Spec novo + `PerfilPage.abrirColecaoEspecial`/`validarColecaoEspecial`, mesmo código e sem `if` de plataforma, sem login, sem voltar ao Menu. Seletores conferidos nos dumps Android 1.22.9/530 (18 × 20) e iOS 1.22.9/372 (09/20 × 10/21); o 531 não foi capturado. Entra sozinho no CI (`specs: ./test/specs/**/*.ts`), nos 11 devices. Conferir no próximo run: log `✅ Coleção Especial aberta` e o print "Coleção Especial — tela de destino" no Allure.

**2026-11-04 — iOS levantado no 1.22.9/372 (Remote Access, 402x874, sessão fechada; `drafts/app-migrado/ios/captures-2026-11-04-build372/`, 00–44).** Nenhum pedido nem conta; Mochila e Favoritos vazios. Drafts, `00-INDICE.md`, `ELEMENTOS-SEM-TESTID-IOS.md` e `BUGS-APP.md` atualizados; draft novo `50-colecao-especial.md`. Pix 10% antes e depois de escolhido. Não conferido: busca, PDP em promoção, cartão preenchido e parcela, Resumo com cartão, Meus pedidos, cadastro. O final do novo `03` não foi visto no 372. Falta o Android 531 (versão não escrita).

**2026-11-04 — M10, Atualizações e melhorias (Marcio), marco contínuo no `ROADMAP.md`. 1º item implementado, só `tsc`, NÃO RODADO, nas duas plataformas:** `02-compra-pix` e `03-compra-cartao` param no Resumo, sem criar pedido (último build levantado: Android 1.22.9/530; a mudança vem de decisão, não de build). Removidos `PedidoPage.ts`, `CheckoutPage.finalizarPedido`/`finalizarPedidoComCartao`/`esperarDestinoDoFinalizar`/`anexarArvoreDaTela` e `HomePage.validarAlertaPedido`. Sem limpeza nova da Mochila: o `clearApp` do `afterTest` a esvazia (visto no AVD em 14/10; CI e iOS do app migrado não conferidos). Conferir no próximo run: o log termina em `✅ Resumo confere`; a partir do 2º run, `🎒 Mochila com 2 produto(s)` no `02` e nenhum pedido novo nas contas. Registro: `plans/2026-11-04-pix-cartao-ate-o-resumo.md`. A pendência "produtos mais baratos" saiu do M9 (Marcio, 2026-11-04).

**2026-11-03 — M9 capturado no AVD (1.22.9/530), testes não escritos.** Pasta `drafts/app-migrado/android/captures-2026-11-03-m9-colecao-especial-e-preco-100/` (`NOTAS.md`). Encerramento: `pm clear` Success e `adb kill-server`.

Richard Stad (Menu deslogado): toque em `menu-item-richard-stad`. Destino editorial, sem WebView. Âncoras: `editorial-home-root`, `editorial-group-0`, `header-back-button`, `editorial-tab-home|categories|bag|menu`. O título e o "Saiba mais" estão só na foto. iOS do destino não capturado.

Preço até R$ 100: lupa `search`, termo `bermuda`, `filter-button` → `filter-modal` → `toggle-button` com `content-desc` `Up to R$ 100 (23)` → `button-filter` (`See 23 products`). Não há input de valor. Dez cards vistos, camiseta infantil, venda R$ 79,90 (8) ou R$ 99,90 (2). PP com estoque em `161936`, `161861` e `161945`. Os outros 13 dos 23 não foram vistos; a faceta tem 2 camisetas masculinas que não apareceram nas telas. Specs `02` e `03` não mudaram.

**2026-11-03 — REGRA: ao terminar o uso do AVD, `adb shell pm clear com.aramis.ecomm` e em seguida `adb kill-server`.** Decisão do Marcio. Escrita no `REQUIREMENTS.md` (regras invioláveis), no `Claude.md` (seção do AVD) e no `mobile-ui-inspector.md`. O `pm clear` vem primeiro: o `kill-server` derruba o adb. Na suíte WDIO local o `afterTest` já faz o `pm clear`; o `kill-server` só no fim da suíte. A sessão do giftback/Pix deste dia terminou sem essa limpeza — a Mochila do emulador pode ainda ter a polo, o giftback e o Pix de 10%.

**2026-11-03 — FEITO no AVD (1.22.9/530): a linha Pix da Mochila ignora o giftback enquanto o Pix não foi escolhido. Pagamento e Resumo descontam.** Nenhum pedido finalizado. Conta `marcio.rocha.ext@aramisinc.com.br` (TS, TESTE SQUAD APP). Evidência: `drafts/app-migrado/android/captures-2026-11-03-avd-pix-giftback/` (00–45, `NOTAS.md`). O print do celular (pt-BR, build não identificado) está em `captures-2026-11-03-celular-pix-giftback/` e os números da Mochila batem com o AVD.

Polo `169024` / Mochila `444333`, XGG, venda 199,90 (riscado 499,90). Saldo de giftback **R$ 39,98** — o mesmo valor já aparecia com a camisa de 799,90 na Mochila, então é o saldo da conta, não um teto de 20% ou 30% deste subtotal. Resgatou o saldo inteiro. "Receba R$ 19,99" é giftback a ganhar (10% de 199,90), outra linha.

| Tela | Lido | Conta |
|---|---|---|
| Mochila, Pix não escolhido (35) | Subtotal 199,90; Giftback 39,98; Total 159,92; linha 10% OFF **179,91**; botão 159,92 | A linha é só 199,90 × 0,90. Não é A (139,93) nem B (143,93). Fica 19,99 acima do total. Igual ao print do celular. |
| Entrega antes do frete (37) | os mesmos 179,91 e 159,92 | igual à Mochila |
| Entrega com Econômica 16,90 (38) | total 176,82; linha Pix **156,83**; giftback permanece | A + frete cheio: 199,90 × 0,90 − 39,98 + 16,90. B + frete seria 160,83 e não bate. Frete não é grátis (faltam 599,10). |
| Pagamento, prévia e Pix escolhido (39–41) | `10% off · R$ 156,83`. O id vira `payment-wake-pix-discount`, o rádio marca, e **não passou a 15%** | A + frete, a 10% |
| Resumo (43) | Produtos 199,90; Entrega 16,90; Descontos 19,99; Giftback 39,98; total 156,83 | A + frete. 19,99 = 10% do bruto. Giftback em linha própria (`summary-giftback`). |
| Mochila depois do BACK (45), Pix já escolhido | Discounts 19,99; Giftback 39,98; Freight 16,90; total e linha Pix **156,83** | a linha passa a igualar o total |

A (Pix sobre o bruto do produto, giftback depois, frete cheio) é a conta do Pagamento e do Resumo. B (Pix sobre o valor já com giftback) não apareceu. O giftback não sumiu em nenhum passo (sem código de vendedor). A Mochila ficou com 1 item, giftback aplicado e Pix 10% persistido.

**2026-10-29 — CI Run #40 (28/10 21:26, app Android 1.22.9/529): S23 Ultra 0/4, os 4 no onboarding = defeito de
CONFIGURAÇÃO do aparelho do Device Farm, não do app nem do teste.** Os 4 specs passaram das Boas-vindas e pararam nos
Tópicos (`permission-topic` displayed=true; `onboarding-topics-continue|accept-button` = 0 nós em todas as buscas do
`appium.log`). Prints da falha (`01` e `03`): a barra de navegação de 3 botões (|||, ○, ‹) desenhada POR CIMA do botão
Continue. Logcat do aparelho: dois overlays de navegação ativos ao mesmo tempo (`NavigationBarModeGesturalNoHint` +
`NavigationBarMode3Button`) e `ITYPE_NAVIGATION_BAR mFrame=[0,3088][1440,3088]` (inset 0: o app ocupa a tela inteira e
o Continue fica sob a barra). No Run #48 (20:10, mesmo modelo SM-S918U1, Android 13, mesmo 529, onboarding passou): só o
`3Button` e `mFrame=[0,2953][1440,3088]` (135 px reservados, app acima da barra). Botão ausente da árvore por estar
coberto pela janela da barra: INFERIDO (sem dump da tela na falha). Frota pública: o aparelho físico não é
identificável pelo `get-job` (`instanceArn` None). Nada alterado no código. As outras falhas do S23 Ultra no dia
(`01` "conta suja", conta `qa160` com a "Camisa Bold Manga Longa Preto" favoritada) são outra causa.

**2026-10-27 (noite) — CI Run #45 (16:00, app Android 1.22.9/526, conferido no `get-upload`): `01` 0/6 Androids, `02`
falhou no S23+.** No 526 o "Back to top" (sem testID, já no `ELEMENTOS-SEM-TESTID.md`) passou a ser o irmão SEGUINTE do
bloco do `product-list`; o XPath Android do `BACK_TO_TOP` (irmão anterior) deu 0 nós, a lista ficou rolada e o
`CategoriasPage.voltar()` tocou o 1º clicável (um card), sem tab bar; no `02` S23+, "sem seta de voltar". **Corrigido
(ordem do Marcio), só `tsc`, NÃO RODADO:** `BACK_TO_TOP` Android = `…/following-sibling::*/*[@clickable="true"]`,
conferido com lxml nas 12 árvores de listagem rolada do Run #45: 1 nó em todas. Com a lista no topo NÃO conferido no
526/528 (só no 515: 0 nós). iOS sem mudança. O Run #46 (21:54) roda o 1.22.9/528 com o XPath antigo. Não investigado:
`03` S26 Ultra ("Home não apareceu"). Os "519" das entradas de 26/10 abaixo não foram conferidos no APK (o Run #37 do
Device Farm instalou 1.22.3/515).

**2026-10-26 (noite) — CI Run #42 (18:59, app Android 1.22.8/519): `02-compra-pix` falhou em 5/6 Androids.** A
bermuda passou em todos; na listagem de Camisas recém-aberta (no topo) o `irParaOTopoDaListagem()` tocou o que o
XPath Android do `BACK_TO_TOP` achou, outro botão do cabeçalho, e abriu a Mochila (print do S24 Ultra: "My Backpack"
com as bermudas recomendadas; os 2 "cards" do erro, `155077`/`152372`, são essas recomendações). S23 Ultra passou
(posição 0 abre o 1º card sem esse toque). **Corrigido (ordem do Marcio), só `tsc`, NÃO RODADO, nas duas
plataformas:** com o `header-back-button` na tela, `irParaOTopoDaListagem()` não toca nada. Qual botão o XPath casou
no 519 não foi conferido na árvore.

**2026-10-26 — Produto diferente por teste e por device (ordem do Marcio), só `tsc`, NÃO RODADO.** Causa: CI Run #41
(app Android 1.22.8/519), S26 Ultra, `02`: a camisa da posição 5 estava sem P e M; depois do OK no modal do M, o toque em
Comprar abriu direto o "Size sold out" (`alert-modal`, agora confirmado no Android) e o teste só esperava o sheet.
Mudanças, nas duas plataformas: `device-index.ts` `posicoesDoProduto(blocos)` = posição do device + 11 × bloco
(Camisas: `01` bloco 1, `02` blocos 0/2/3; bermuda e calça: 0/1/2); `02` troca o óculos (só 4 na busca) por **bermuda**
(busca); `03` calça pela posição; `01` `CategoriasPage.favoritarProdutoNaPosicao` (coração = `action-button` dentro do
card, conferido no draft android/11 e na captura iOS 2026-10-17/04) e "Back to top" antes do `voltar()`;
`ProdutoPage.comprarNaPosicao` (sem tamanho com estoque = `SemEstoqueError` → volta à listagem e tenta o próximo
bloco), modal de estoque ao tocar em Comprar tratado, tamanhos com/sem estoque no log (Android: sem estoque tem o "+"
SvgView, conferido no 513 cap. 64). Riscos: busca "bermuda" com ≥ 33 resultados e "Back to top" na tela de busca não
verificados; rolagem até a posição 43 não medida. CI: single-file do Allure gerado sem os vídeos (OutOfMemoryError no
outro repositório); o Pages continua com vídeo.

**2026-10-23 (14:13) — CI Run #39: `BUILD_SELECTION=version` validado no CI** (os dois downloads passaram e o Device
Farm rodou). Android 23/24: só o `01` no S25 Ultra falhou (banner do Insider na hora de favoritar levou a uma tela sem
os elementos). iOS 18/20: `03-compra-cartao` falhou no iPhone 15 e no 14 Pro Max (tela demorou a carregar). Causas
levantadas pelo Marcio; nenhuma mudança decidida.

**2026-10-23 (tarde) — Pendências iOS validadas no Remote Access, app 1.22.3/359** (janela 440x956;
`drafts/app-migrado/ios/captures-2026-10-23-pendencias-ios/`, 00–26; sessão fechada, Mochila e Favoritos vazios,
nada finalizado). Onboarding: `welcome-start-button` → `onboarding-topics-continue` → `privacy-accept` →
`terms-accept` valem (sem `accept-button`). Home: `editorial-home-root` existe (visible=false; o teste checa
existência), `bell` visível. "Back to top": 2 nós (wrapper + botão), o 1º tocado leva a lista ao topo e traz o
`header-back-button`, que some da árvore com a lista rolada; voltar da PDP mantém a rolagem. PDP em promoção: `price` =
cortado, promocional = irmão anterior sem id (XPath `PRECO_PROMOCIONAL` iOS: 1 nó na 21, 0 na 23). Menu deslogado
rolado: Button `login` do rodapé visível, `menu-login-button` não; 0 nós `login` no logado. **Nenhuma mudança de lógica
nos testes** (só comentários do `ProdutoPage` de "inferido" para conferido). Não alcançado: banner do Insider (marcador
iOS continua sem medição), "Size sold out", "Erro ao realizar compra".

**2026-10-23 — `scripts/install-apk.mjs` ganhou `BUILD_SELECTION=version`** (pedido do Marcio, modelo: o
`installArys-apk.mjs` dele). Variáveis `BUILD_VERSION_ANDROID`/`BUILD_NUMBER_ANDROID`/`BUILD_VERSION_IOS`/
`BUILD_NUMBER_IOS` (fallback `BUILD_VERSION`/`BUILD_NUMBER`), passadas pelo `mobile_test.yml` como secrets; sem a
variável da plataforma, falha explícito. `latest`/`date` sem mudança. Testado só o erro e a busca sem match (sem
download). Achado na listagem do EAS: o **513 está no profile `development`**, não `production`.
CI Run #38 (15:01) caiu nos dois downloads (12–14 s, nenhum run no Device Farm): `version` exigia o profile, e o
`.env` pedia 1.22.3/515 e /359 em `development` (estão em `production`). Correção (Marcio): no modo `version` o
profile é ignorado; conferido localmente (Android com `development` achou o 515 `production`), sem download.

**2026-10-22 (noite) — CI Run #36 (18:55, app Android 1.22.2/513): Android `04` 0/6 (botão desabilitado), `01` falhou
no S23+ e no S26 Ultra ("continua logada"); iOS `02` falhou no iPhone 15 Pro Max (banner).**
- **`04` (ordem do Marcio), só `tsc`, NÃO RODADO:** `CadastroPage.conferirBotao`: com a etapa válida, botão
  desabilitado = AVISO (log + print "Aviso — … não habilitou" no Allure), e o teste toca mesmo assim; habilitado com
  dado inválido continua sendo falha. `enviarEtapa1`/`finalizar` tocam até 2x nas duas plataformas (`tocarAteAvancar`),
  com o destino validado pela tela.
- **`02` iPhone 15 Pro Max:** o vídeo mostra a PDP limpa por cerca de 6 s; depois o banner "polos 3POR2" abre e fica até a falha. O
  `fechaBanner()` roda só ANTES do toque no Buy e a espera de 15 s pelo sheet não olha o banner. No log não há "🟡"
  (o banner nunca foi detectado). **Corrigido (ordem do Marcio), só `tsc`, NÃO RODADO, nas duas plataformas:**
  (a) `step()` (`allure-helpers.ts`): todo passo que falhar com o banner na tela anexa o print "Banner na tela na
  falha", fecha o banner e repete o passo 1 vez; só a 2ª falha sobe (4 specs). (b) `BasePage.esperarFechandoBanner`
  + `bannerDoInsiderNaTela()`: as esperas do `ProdutoPage.comprar()`/`comprarIOS()` conferem o banner a cada volta;
  na espera do sheet de tamanho, fecha e toca o Buy de novo; na espera do "adicionado", só fecha (sem repetir o
  toque). Sheet que não abriu anexa a árvore da tela. Risco: repetir um passo não idempotente (ex.: finalizar
  pedido) se o banner estiver na tela na falha; marcador iOS do banner não medido no app migrado.
- **`01` S23+/S26 Ultra:** os prints mostram o app DESLOGADO (Menu rolado, botão "login" do rodapé). O teste procura
  `menu-card-*` enabled=false (fora da tela com o Menu rolado) ou o rodapé pelo XPath "último clicável antes do
  tab-home", que casa no dump do AVD (513, cap. 85) e não casou nesses 2 aparelhos (sem árvore anexada; causa
  não provada). Falso negativo do teste. **Corrigido (Marcio: "o botão login ativo na tela basta"), só `tsc`, NÃO
  RODADO:** `BasePage.seletorAcessoLogin('menu.acessoLoginRodape')` Android = clicável antes do `tab-home` que não é
  `menu-*` e está `enabled=true` (sem depender de `resource-id=""`); conferido com lxml nos dumps do 513: acha só nos
  deslogados rolados (34, 85), nada nos logados (41, 83, 25). Sem rolar a tela. Falha anexa a árvore (`PerfilPage`).

**2026-10-22 (noite) — CI Run #35 (14:55): `04` Android 0/6, iOS 5/5; `02` falhou no iPhone 15 Pro Max (e no S26 Ultra).**
`04` Android: os 6 campos válidos no print e o `create-account-submit` desabilitado — mesmo comportamento da captura
do 513 de manhã (`captures-2026-10-22-build513/` 95–100): app 513 não habilita o envio. Captura com logcat
(`captures-2026-10-22-cadastro-513-logcat/`, autorizada pelo Marcio): preenchido por toque + `input text`, sem Appium,
o botão segue `enabled=false`, nada escondido ao rolar, logcat sem validação; o ENTER do teclado no telefone avançou
para a etapa 2 (cap. 23) com o botão desabilitado. **Conta REAL criada (autorizada pelo Marcio,
`captures-2026-10-22-cadastro-513-conta-criada/`, `MASSA-DE-DADOS.md`):** os dois botões ficam `enabled=false` no dump,
mas o 2º toque avança (1º só fecha o teclado): etapa 1 → 2 (cap. 19), etapa 2 → Home logada (24) e Menu com
`menu-user-header` (25). O cadastro FUNCIONA; o defeito do app é o estado `enabled` errado (`BUGS-APP.md` A39).
O `04` falha por esperar `enabled=true`. Teste NÃO alterado: proposta (validar pelo destino da tela, nas duas
plataformas) aguarda decisão do Marcio. Toque via Appium (`element click`) não testado; só `input tap`. `02`: o teste
leu o preço CORTADO. Captura no AVD (513, `captures-2026-10-22-preco-promocional/`, 12 com promoção × 14 sem): na PDP em
promoção o `price` é o cortado e o promocional é o irmão anterior, sem id. **Correção, só `tsc`, NÃO RODADA:**
`ProdutoPage.lerPrecoDoProduto` lê o promocional (`PRECO_PROMOCIONAL`, XPath conferido com lxml: 1 nó no 12, 0 no 14)
quando existir, senão o `price`; iOS pela mesma estrutura, INFERIDO (PDP em promoção não capturada no iOS).

**2026-10-22 (tarde) — AVD no build 1.22.3/514 (`npm run wdio:fresh`, rodado pelo Claude a pedido do Marcio): 0/4, os 4
no onboarding.** O Continue dos Tópicos não foi achado (`onboarding-topics-continue`); no `03` o mesmo botão depois de
negar. Run anterior do Marcio (12:37, 512): `01`–`03` não abriram sessão (`Unable to connect` na 4723; causa não
levantada, não se repetiu neste run) e o `04` passou; o cartão "quebrado no onboarding" do report local era do run de
21/10 16:49 (a `allure-results/` acumula). Captura do onboarding no 514 (`drafts/app-migrado/android/
captures-2026-10-22-build514/`, 00–12, só permitindo; drafts 01–05 reescritos): Continue, aceite da Política e dos Termos
= `accept-button` (sem `onboarding-topics-continue`/`privacy-accept`/`terms-accept`); Home sem `editorial-home-root`
(marcador: `bell` do cabeçalho, só nos dumps da Home). **Correção, só `tsc`, NÃO RODADA:** `ACEITE_ONBOARDING_ANDROID`
(`onboarding-topics-continue|accept-button`, `resourceIdMatches`) em `BasePage.continua/termo1/termos2` e no
`OnboardingPage` (Tópicos do `03`); `HomePage.validarHome` Android aceita `editorial-home-root|bell`. iOS sem mudança.
**O 514 é build de ROLLBACK, não de teste (Marcio, 2026-10-22):** o build de teste continua o 513, e o código acima
segue valendo nele (aceita os ids do 513). Os drafts 01–05 e o `ELEMENTOS-SEM-TESTID.md` voltaram para o 513; as
capturas do 514 ficam só como registro. O `install-apk.mjs` pega o `production` mais recente (o 514); o secret do CI
foi ajustado pelo Marcio. Também no dia (só local, não rodado): `install-apk.mjs` espera o emulador (`device` +
boot) antes do `adb install`; `wdio.conf.ts` `onWorkerStart` espera a 4723 (o WDIO NÃO aborta o spec com erro nesse
hook, só registra). CI (não rodado): vídeo iOS `timeLimit` 180 → 600 (cortava em 3 min); Android `startMediaProjection`
1280x720 → 720x480 (55–105 MB por spec no Run #34, >95 MB é apagado na publicação). Vídeo Android ausente no relatório
do Run #34: causa não fechada, falta o log do `publish-report`.

**2026-10-22 — CI Run #33 (21/10 17:43; Android baixou o build NOVO 1.22.2/513): Android 0/24; iOS `01`, `03`, `04` 5/5,
`02` 0/5.** Android: os 4 specs pararam no onboarding (`privacy-accept` não achado em 45 swipes; o botão estava na tela).
iOS: `02` parou no `voltarAteCategorias` com a listagem rolada; o "Back to top" estava na tela (print do iPhone 13) e o
`mostrarCabecalhoDaListagem` saiu sem arrastar (guarda "card visível" deu false). Captura no AVD (513,
`drafts/app-migrado/android/captures-2026-10-22-build513/`, 00–21): no 513 o aceite da Política e dos Termos é
`onboarding-topics-continue` (sem `privacy-accept`/`terms-accept`); "Back to top" sem id, tocado 3x: lista ao topo e
`header-back-button` de volta. **Correções, só `tsc`, NÃO RODADAS:** `BasePage.termo1/termos2` (Android) aceitam os
dois ids (`privacy-accept|onboarding-topics-continue`, `terms-accept|onboarding-topics-continue`, `resourceIdMatches`;
ordem do Marcio: passar com o id antigo e com o novo); iOS segue em `privacy-accept`/`terms-accept` (o IPA do Run #33
passou o onboarding), sem tolerância ao id novo até haver captura iOS; `ProdutoPage.mostrarCabecalhoDaListagem` toca o "Back to top" (`BACK_TO_TOP`: Android XPath
estrutural conferido nos dumps; **iOS `label == "Back to top"`, inferido, sem árvore capturada**) e só depois arrasta;
saiu a guarda do card. Pendente: árvore iOS da listagem rolada (Remote Access) para confirmar o seletor iOS; o resto do
513 além do onboarding e da listagem não foi conferido.

## Onde o projeto está

**Verde nas duas plataformas.** `CI Run #14` (2026-09-11 15:49, commit `c367423`):
**Android 18/18** no pool de 6 devices e **iOS 5/5** — iPhone 13, 14, 14 Pro Max, 15 e
15 Pro Max, cada um no seu run de 1 device, ponta a ponta. É a primeira vez que os 5 iPhones
passam no mesmo run: **o passo 5 do M3 está fechado** e o M3 concluído. O `CI Run #14` passa a
ser a referência das duas plataformas.

O que levou até aqui, no mesmo dia: o `CI Run #13` (14:18) caiu para 16/18 no Android e 3/5 no
iOS por um banner novo do Insider, um tap perdido e uma conta suja (pendência "CI Run #13"
abaixo); a correção dos 4 pontos (validar desfavoritar, `voltar()` por tab bar, guarda de conta
suja, limpeza em falha) entrou em `c367423` e o Run #14 validou tudo.

**M4 concluído** (2026-09-10, ajustes nos testes em 09-11). **M5 — Levantamento do app
migrado, em andamento**: o app Aramis está sendo migrado por módulos, com `testID`; Android
com a 2ª leva capturada e drafts escritos, iOS com a 1ª leva incompleta (ver "Pendências
abertas").

**M6, M7 e M8 concluídos em 2026-10-21 (Marcio)**: a suíte é a de 4 testes (`01`–`04`) no app migrado,
nas duas plataformas, com compra Pix e cartão. O levantamento deixou de ser o M5: é contínuo, a cada build
(topo do `ROADMAP.md`, com a última versão levantada). Próximo marco: M9 (novos cenários, só planejamento).

Lembrete do que o M3 é, porque é fácil de distorcer: **uma suíte só**. O
`test/specs/test.spec.ts` não muda, nenhum page object novo é criado, e o `if` de
plataforma mora dentro do método — como o `ativarApp()` de `HomePage.ts` já faz.

## Decisões tomadas

### Atribuição de conta por device (2026-09-10)

- **As `environmentVariables` do Device Farm são do RUN, não do JOB.** Num run com N
  aparelhos todos recebem exatamente as mesmas variáveis. Não existe "este device usa o
  email 3".
- **O host iOS não recebe nem essas variáveis.** O script que a AWS gera monta o próprio
  ambiente e exporta só as `DEVICEFARM_*` — conferido no artefato `Test spec shell script`
  do run #6, onde o diagnóstico imprimiu `CLIENT_USERS_EMAILS len=0`. No Android o processo
  herda o ambiente do agente, e é por isso que lá funciona.
- **O host não expõe índice/ordinal de job.** As únicas variáveis são
  `DEVICEFARM_{APP_PATH,DEVICE_NAME,DEVICE_OS_VERSION,DEVICE_PLATFORM_NAME,DEVICE_UDID,`
  `LOG_DIR,SCREENSHOT_PATH,TEST_PACKAGE_PATH,WORKING_DIR,WDA_*,EXIT_CODE}`. O único valor
  único por aparelho é o UDID, e ele muda a cada run (frota pública).
- **Logo, no iOS não existe auto-identificação confiável** — e o mapa por (versão de OS,
  resolução) que tentava isso foi removido. Ele falhava em 2 dos 5 aparelhos porque a API
  informa a versão completa (`17.3.1`, `18.6.2`) e o host exporta truncada (`17.3`, `18.6`)
  e, pior, **abortava o teste** quando não casava: no run #6 o iPhone 14 e o iPhone 15 Pro
  Max não executaram nada.
- **A decisão de conta voltou para o CI: um run por aparelho.** `schedule-run` com
  `--device-selection-configuration '{"filters":[{"attribute":"ARN","operator":"IN",
  "values":["<arn>"]}],"maxDevices":1}'` mira um device sem precisar criar device pool.
- **O email viaja no testspec, não no `.env` do ZIP.** O testspec é o único canal que chega
  no host com valor por aparelho, já tinha a função de montar o `.env`, e são 5 arquivos de
  poucos KB contra 5 ZIPs de ~33 MB. Custo aceito: o email aparece no artefato
  `Test spec file` (já aparecia no `Test spec output`).
- **A ordem do pool usa `LC_ALL=C sort`.** Sem isso o collation do runner muda a posição de
  "iPhone 14" vs "iPhone 14 Pro Max", as contas trocam de dono entre runs e o Trend do
  Allure quebra.

### Android (M1)

- **O banner do Insider se fecha pelo `Close` do criativo, dentro da WebView.** O `closeBt`
  nativo é decorativo; o `back()` do Android também não fecha. Testado com dump antes/depois.
- **O marcador de presença do banner é o `insiderLayout`, nunca o `htmlView`** — o `htmlView`
  some da árvore em alguns momentos mesmo com o banner visível.
- **A tela de listagem de produtos não tem a barra de abas** (nenhum `tab-*`). Por isso o
  `voltar()` antes do `abrirPerfil()` é obrigatório.
- **O `action-button` é o favoritar**, mas o estado favoritado não aparece na árvore — só o
  pixel muda. A asserção tem que ser na tela de Favoritos.

### iOS — o que muda o desenho dos page objects

- **Logout no iOS não tem diálogo de confirmação** (draft `24`). É a única divergência de
  *fluxo* do M1: `confirmarLogout()` retorna cedo no iOS.
- **Dois pontos do onboarding só funcionam por coordenada** (drafts `01`, `02`), guardadas
  como **fração** da janela — a medição foi em `402x874`pt.
- **O alerta de localização é do SpringBoard** e `autoAcceptAlerts`/`acceptAlert()` não o
  dispensam. Quem o fecha é `mobile: alert` com `buttonLabel`. Validado no run #6:
  `✅ Alerta de localização aceito por "Allow While Using App"` nos 5 aparelhos.
- **`acceptAlert()`, `mobile: hideKeyboard` e `clearValue()` reportam sucesso sem agir**
  neste app. Regra: validar pelo estado seguinte, nunca pelo retorno.
- **Não usar `mobile: scroll` com `toVisible`** nos aceites: derrubou o `CI iOS Run #61` por
  timeout (~85s por chamada, reenviada 3x). O laço de swipe + `isDisplayed()` converge.
- **`accessibility id` no iOS é o id interno, não o texto visível** — vários nós compartilham
  o mesmo `name`, o que obriga `-ios predicate string` combinando `name` e `label`.
- **O primeiro tap em "Sign in" depois de digitar não registra** (draft `09`) — regra, não
  exceção. Confirmado no run #6: `⚠ Tap 1/2 em "Sign in" não navegou — repetindo`.
- **`voltar()` na listagem é o chevron do cabeçalho**, `[2]` de dois nós homônimos (draft
  `34`). Validado no run #6: `↩ voltar: chevron do cabeçalho ("Camisas")`.
- **Favoritos persistem por CONTA, no backend** (draft `22`) — nenhum cenário pode assumir a
  lista vazia, e é por isso que cada device precisa de uma conta só sua.

## Pendências abertas

- **Pendência — hook do Claude quebrado:** o `.claude/settings.json` registra o
  `gsd-secret-read-guard.js` em Read/Grep/Bash, mas o arquivo não existe em `.claude/hooks/` nem
  no `@opengsd/gsd-core` 1.10.0 instalado. O hook falha em silêncio e a proteção contra leitura
  de segredo (`.env`) não está ativa. **Decisão do Marcio (2026-10-02): não mexer.** O impacto
  não é conhecido, e o `.claude/settings.json` nunca é alterado (regra no `REQUIREMENTS.md`).
  Fica só registrado.

- **Gerador de massa na execução (Marcio, 2026-10-15), não planejado ainda:** a automação deve gerar cartão,
  CPF e afins a cada execução, com uma lib de dados fake ou equivalente, em vez de usar valores fixos. Detalhes e
  pontos a decidir em `.planning/MASSA-DE-DADOS.md` ("Pendente: gerador de massa na automação").
- **Timeout do Device Farm subiu de 15 para 60 min (2026-10-13, pedido do Marcio).** Feito na AWS,
  fora do git: `aws devicefarm update-project --default-job-timeout-minutes 60` no projeto `ecomm`,
  conferido por `get-project` (`ecomm 60`). Vale para Android e iOS, porque nenhum `schedule-run` do
  `mobile_test.yml` passa timeout próprio. Para desfazer: o mesmo comando com `15`. A conta paga por
  minuto (`unmeteredDevices` 0), e o limite da conta é 150 min. O polling do workflow espera até
  120 min. **Ainda não validado em run.** O próximo run mede quanto a suíte inteira leva. Continuam
  abertos o APK/IPA errado do CI (decisão 1 do `DIAGNOSTICO-CI-RUN17.md`) e a opção de o Allure gravar
  direto em `$DEVICEFARM_LOG_DIR`, para o relatório sobreviver a um timeout.

4. **Allure local acumula runs:** a `allure-results/` não é limpa entre execuções (o `onPrepare` só cria a
   pasta), e o relatório mistura testes de runs anteriores. Validar no futuro a limpeza no `onPrepare`, só
   local e preservando `history/`.

### Sessões de Remote Access: o que não fazer

Custou três sessões em 2026-09-10. Abrir sessão Appium com `bundleId` **reativa o app, e a
sessão nova costuma vir com ele resetado** (cai nas boas-vindas mesmo com `noReset: true`), o
que obriga a refazer onboarding + login — 3 a 4 minutos. E a URL pré-assinada **expira em
poucos minutos e não renova** (`403 Invalid pre-signed URL`).

Regra prática: **o Marcio navega até a tela e avisa; o Claude só conecta e captura.** Na
captura, pegar `getPageSource()` UMA vez e medir os rects parseando o XML local — dezenas de
`getLocation()/getSize()` custam ~300ms cada na sessão remota, somam 20-30s e deixam as
referências de elemento obsoletas (um clique depois disso não registra). E **sempre fechar a
sessão** (`deleteSession`) ao final: uma sessão deixada aberta segura o device.

### Outras

- **ReCAPTCHA bloqueia o `Finalize purchase`** (draft `33`), 2/2 tentativas. Escalar ao time
  de backend um allowlist/bypass para QA/Device Farm. Bloqueia o M8; não afeta M1/M3.
- **App sem `accessibilityIdentifier` em pelo menos 5 pontos do fluxo iOS.** O caminho
  estruturalmente correto é pedir os identificadores ao time do app.
- **Segundo banner do Insider — OBSERVADO em 2026-09-11 (Run #13):** "Só no APP: 20% OFF pra
  você! Raspe aqui e descubra" (raspadinha), disparado ~2,5–3s depois da interação com o
  coração, nas duas plataformas. Fecha pelo mesmo `Close`/backdrop; o que o neutralizou foi
  checar o banner imediatamente antes de cada clique e validar cada navegação pelo destino.
- **Uma camisa ficou favoritada na conta** durante a investigação manual (Camisa Manga Longa
  Slim em Tricoline Stretch Liso Branco). Desfavoritar antes de um run limpo.
