# STATE

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
`menu-user-header` (25). O cadastro FUNCIONA; o defeito do app é o estado `enabled` errado (`BUGS-APP-ANDROID.md` 39).
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

**2026-10-21 (tarde) — CI Run #31 (11:10, A+B no ar): `01` 11/11; `02` 0/11; `03` 7/11; `04` 11/11.** O B funcionou (cada
device numa camisa diferente, nenhum "Size sold out"), mas 7 devices pararam no `voltarAteCategorias()`: com a lista
rolada o cabeçalho (`header-back-button`) sai da árvore e a volta da PDP mantém a rolagem — provado no AVD 1.22.2/512
(`captures-2026-10-21-listagem-rolada/`, draft Android 11). Efeito do B, não bug do app. Clipboard vazio de novo em
3 Androids. `03`: crash no login (S23 Ultra, S24 Ultra), Mochila com 0 itens (S25 Ultra), finalizar sem destino em 60 s
(iPhone 15 Pro Max) — não investigados. S25 Ultra `02`: carrossel não rolou. **Correções, só `tsc`, NÃO RODADAS:**
`ProdutoPage.voltarAteCategorias` → `mostrarCabecalhoDaListagem()` (arrasto curto para baixo até 5x até o
`header-back-button` voltar; print se falhar), nas duas plataformas; `PedidoPage.copiarCodigo` com UMA regra para as
duas (vazio = aviso; com conteúdo = igual; código começa com 000201) — a decisão de 18/10 tinha ficado só no iOS.
Nova regra no `REQUIREMENTS.md`: mesmo fluxo e mesma validação nas duas plataformas; diferença só com decisão do Marcio
na tabela de diferenças.
**Investigação do `03` no Run #31 (aprovada pelo Marcio), só `tsc`, NÃO RODADO:** (1) crash no login S23 Ultra
(SIGSEGV nativo em `libreanimated.so`, variante nova) e S24 Ultra (`RetryableMountingLayerException` tag 718) = bug
do app, registrado no `BUG-CRASH-ANDROID.md`; (2) S25 Ultra "Mochila com 0 itens" = erro do TESTE: o
`abrirMochila` rolava até o botão antes de contar e o card saía da árvore (print: 1 item) → agora conta os cards
primeiro (espera até 30 s), nas duas plataformas; (3) iPhone 15 Pro Max = modal do app "Erro ao realizar compra"
(o mesmo do S24 Ultra no Run #30), que o teste não reconhece; id nunca capturado → o finalizar (Pix e cartão) anexa a
árvore da tela (`getPageSource`) ao Allure quando estoura os 60 s, para levantar o id no próximo run em que aparecer.
(4) S25 Ultra `02`, carrossel que "não rolou" = banner do Insider (polos 3POR2) abriu POR CIMA do sheet no meio do
passo, depois da tentativa do `step()`, e o gesto caiu nele (print da falha) → `validarCarrosselDeIndicacao` fecha o
banner imediatamente antes de cada gesto e repete o gesto 1 vez se não vier card novo (só Android: no iOS o
carrossel não é validado, decisão do Marcio de 2026-10-15). Todas as falhas do Run #31 têm causa conhecida.

**2026-10-21 — CI Run #30 (20/10 21:00, app 1.22.2) diagnosticado pelo AWS CLI: `01` 11/11; `02` 0/11; `03` 10/11; `04` 11/11.**
`02`: estoque da 1ª camisa (`164803`), que os 11 aparelhos compram ao mesmo tempo: "Size sold out" em 4 iPhones (13, 14,
14 Pro Max, 15 Pro Max; o `comprarIOS` não conhece o modal e falha com "sheet fechou"); camisa tirada do pedido no checkout
sem aviso no S24+ e no iPhone 15 (Resumo "Pacote 1 (1 item)", só o óculos); `getClipboard` vazio no S23+, S25 Ultra e S26
Ultra (o app mostrou "Copiado"; pedido #215078 no S25 Ultra); S24 Ultra: modal "Erro ao realizar compra" no finalizar, no
Pix e no cartão (o teste não reconhece, esperou 60 s); S23 Ultra: crash no login. **Decisão do Marcio (A + B; C só se
voltar):**
- **B APLICADO, só `tsc`, NÃO RODADO:** cada device compra a camisa da sua posição na listagem —
  `device-index.ts` `posicaoDoProduto()` (Android 0–5 pelo `deviceModel`; iOS 6–10 pelo `DEVICE_LABEL`; local 0),
  `ProdutoPage.abrirProdutoNaPosicao(n)` (rola com `arrastar` W3C até o card inteiro na tela; erro explícito se a rolagem
  não trouxer card novo), `02-compra-pix` passo da camisa. Óculos, `01` e calça do `03` sem mudança. No run: log
  `👕 Camisa da posição N` e `🛍 PDP aberta (product-card-X, posição N)`, um id diferente por device.
- **A APLICADO, só `tsc`, NÃO RODADO:** `ProdutoPage.comprarIOS` reconhece o modal de estoque (`alert-modal`), toca
  `alert-modal-confirm`, valida que fechou, reabre o sheet pelo `pdp-buy-button` e tenta o próximo tamanho; erro final
  lista os recusados. Android sem mudança. Evidência: captura iOS (Remote Access, **build 1.21.7/352**, não o 1.22.2 do
  CI) `drafts/app-migrado/ios/captures-2026-10-21-modal-estoque/` 17–18: "Insufficient stock" da 2ª unidade; os dois ids
  achados com o modal e ausentes com a tela limpa; o sheet de tamanho já fechou quando o modal aparece; OK fecha só o
  modal; `alert-modal-message` NÃO existe no iOS; conteúdo do sheet continua fora da árvore. O id do "Size sold out" não
  está verificado em NENHUMA plataforma. No run: `⚠ O app recusou o Nº tamanho (modal de estoque)` + print no Allure.
- **C pendente (só se o erro voltar depois de A+B):** produto sem tamanho com estoque → `comprar()` tenta o próximo card.
- Não tratados ainda: `getClipboard` vazio no Android do Device Farm e o modal "Erro ao realizar compra".

**PAROU AQUI (2026-10-20, noite) — AMANHÃ (2026-10-21) COMEÇAR POR AQUI:** o Marcio commitou as mudanças do dia e
disparou o CI. Validar esse run pelo AWS CLI (`Test spec output` dos 11 aparelhos + print "Falha — <passo>" do Allure no
`Customer Artifacts`): `02-compra-pix` (prévia e Pix escolhido lidos, 15%), `03-compra-cartao` (modal antifraude OU
recusa = verde; "Oops"/`error-id` = falha certa, bug do app), `04-criar-conta` no S23+ e S26 Ultra (foco pelo campo
visível acima). Copiar para o `MASSA-DE-DADOS.md` os pedidos e contas criados pelo run.

**2026-10-20 (noite) — CI Run #29 (18:40, commit `037560c`, app 1.22.2): `01` 11/11; `02` 0/11; `03` 0/11; `04` 9/11.**
`02`: o run usou o código antigo (10% fixo); a leitura do percentual na tela ainda não estava commitada. `03` Android
(print do S24+): depois de finalizar, a tela de erro do app "Oops" com `WakeOrderProcessing: Exception in HostFunction:
__next_prime overflow` (ID `41cbead3c84c48028710de2902602781`); NÃO reproduziu no Android 16 (Galaxy S26, Remote Access,
20/10: antifraude + Pedido Cancelado #214832).
`03` iOS (print do iPhone 15): veio o modal antifraude ("Entendi"), não a tela de recusa. `04` S23+ e S26 Ultra
(prints): o erro do telefone estava na tela; falhou o toque em `create-account-email` para tirar o foco, porque o
formulário rolou e o e-mail saiu da árvore. **Mudanças (Marcio), só `tsc`:** `CheckoutPage.esperarDestinoDoFinalizar`
(Pix e cartão) aceita o modal antifraude (`button-confirm`) sempre que aparecer; no cartão o modal aceito OU a tela de recusa = verde (Marcio), nas duas plataformas; falha na hora, com o texto, se vier
a tela de erro do app (`error-id`/`error-name`); o cartão aceita `wake-order-processing-recusado|aguardando|cancelado|erro`.
`CadastroPage.validarErroNoCampo` Android tira o foco pelo campo visível mais próximo acima.

**2026-10-20 (noite) — PR do Android 16 (build 1.22.2/512, targetSdk 36) VALIDADA em Android 16 / API 36:** Samsung Galaxy
S26 (SM-S942U1), navegação por gestos, Remote Access do Device Farm aberto pelo Marcio. Evidência
`drafts/app-migrado/android/captures-2026-10-20-android16-remoto/` (68 prints + árvores, `NOTAS.md`); texto para a PR em
`captures-2026-10-20-android16/RELATORIO-PR-ANDROID16.md`. A captura do AVD (API 34, `captures-2026-10-20-android16/`) NÃO
é evidência da PR. No S26, finalizar com cartão deu modal antifraude + Pedido Cancelado (#214832); o `__next_prime overflow`
do Run #29 não reproduziu (`BUGS-APP-ANDROID.md` item 38). Voltar do Android OK em 14 fluxos. `ELEMENTOS-SEM-TESTID.md` e drafts 12/13/15/17 reescritos para o 512; os demais drafts seguem no
511 (ids comparados, iguais). **`ProdutoPage.comprar()` Android vale no 512, sem mudança de código:** a captura
`captures-2026-10-20-build512-comprar/` (óculos e camisa, 2/2) provou `pdp-buy-button` → sheet "Select size"
(`size-option-*`, `size-button` enabled=false) → tamanho → `size-button` enabled → `bag-continue-shopping` em ≤9 s.
O "sem sheet de tamanho" da captura android16 estava ERRADO: lá o tamanho foi escolhido na PDP rolada (tamanhos inline,
que o app IGNORA: o Buy reabre o sheet com `size-button` desabilitado) e o Buy foi tocado por coordenada. Tamanho sem
estoque: no dump igual aos outros, sem o `TextView` filho (só `SvgView` "+"); o toque não habilita o `size-button`,
que é o critério do `escolherTamanho`. **Pix (Marcio):** o percentual vem
da Wake e muda ao escolher o Pix (prévia "10% off … estimated" → escolhido "15% off"). `02-compra-pix` agora lê a linha
ANTES (`CheckoutPage.lerPreviaPix`, `payment-wake-pix-discount-preview`) e DEPOIS (`lerDescontoPix`,
`payment-wake-pix-discount`) e valida cada valor pelo percentual lido; saiu o `DESCONTO_PIX = 0.10`. Só `tsc`.
O 10% → 15% é comportamento da Wake, não bug: item 34 retirado do `BUGS-APP-ANDROID.md` (Marcio, 2026-10-20).

**2026-10-20 — AVD no build 1.22.1/511: captura completa (sem finalizar) e docs Android reescritos para o 511.**
Capturas `drafts/app-migrado/android/captures-2026-10-20-build511/` (00–72) e `captures-2026-10-20-contas-ci-meus-dados/`
(Meus dados das 11 contas do CI; lista nome/sobrenome/e-mail em `CONTAS-CI-AUTOMACAO.csv`/`.md`, raiz, para o time de
dados). `ELEMENTOS-SEM-TESTID.md`, drafts 01–30/32/34–36/40 e `00-INDICE.md` reescritos; não conferidos no 511: 31, 33,
37, 38, 39 (exigem finalizar pedido/cadastro ou abrir o formulário de endereço). `BUGS-APP-ANDROID.md` 33 (crash no Criar
Conta) e 34 (prévia do Pix "10% off", Pix escolhido "15% off"). **No 511 o Resumo do Pix voltou a mostrar o desconto, de
15%** (R$ 187,47 sobre 1.249,80); o `02-compra-pix` calcula 10% (`DESCONTO_PIX`) e vai falhar no Resumo. **Aguarda o
Marcio dizer qual é o desconto certo** antes de mudar o spec e o `CheckoutPage.lerDescontoPix` (que pode passar a ler
`payment-wake-pix-discount`). Teste mudado: só `LoginPage.seletorModalErro` Android → `alert-modal` (o método só é usado
no laço iOS, sem efeito no Android). Só `tsc`. CI Run #32 (20/10 14:21): Tests Suite FAILED nos 11 aparelhos, não
diagnosticado (o Marcio decidiu deixar o status do workflow como está).

**2026-10-19 (noite) — CI Run #25 (18:18, `f5ff5e9`, app 1.22.0: Android 509 / iOS 354): nenhuma compra passou;
correções ESCRITAS (aprovadas pelo Marcio), NÃO RODADAS, só `tsc`.** Registro completo:
`plans/2026-10-19-ci-run25-build509.md`. Resultado: `01` Android 5/6, iOS 5/5; `02` 0/11; `03` 0/11; `04` Android 3/6,
iOS 0/5. Causas: (1) o 509 trocou o modal antifraude + Pedido Cancelado pela tela `wake-order-processing-recusado`, e o
pedido só aparece em Meus pedidos; (2) o 509 tirou a linha `payment-wake-pix-discount` e o Resumo do Pix mostra
Descontos 0,00 (bug, `BUGS-APP-ANDROID.md` 27); (3) o host iOS do Device Farm não tem `mobile: keys`/`tap`/
`dragFromToForDuration`/`touchAndHold`; (4) a `qa160` (S23 Ultra) recusava o login desde o Run #22.
Mudanças: ações W3C no iOS (`BasePage.tocarPonto/arrastar/segurarElemento/teclaW3C`, 6 pontos); cartão verde = tela de
recusa + total do 1º pedido de Meus pedidos = total do resumo; `lerDescontoPix` lê o botão do Pagamento e o Resumo
continua exigindo o desconto (vermelho enquanto o bug existir). Capturas no AVD (509):
`captures-2026-10-19-build509-run25/` (pedido real #201280, Cancelado) e `captures-2026-10-19-qa160/`. **`qa160`
RECRIADA** no AVD com a `CLIENT_PASSWORD` (o app aceitou o e-mail e o CPF como novos), login provado, endereço salvo,
Mochila e Favoritos vazios. Docs Android reescritos para o 509 (`ELEMENTOS-SEM-TESTID.md`, drafts, `BUGS-APP-ANDROID.md`
26–32, `MASSA-DE-DADOS.md`). Em aberto: `04-criar-conta` no S23+/S26 Ultra (não reproduzido no AVD); ações de teclado
W3C no host iOS não verificadas; iOS 354 sem captura da recusa, do Pix e de Meus pedidos.

**2026-10-19 (tarde) — `04-criar-conta` iOS: a etapa 1 PASSOU inteira, inclusive o telefone, mas o run estourou os
15 min do mocha.** O passo da senha `abcdefgh` levou 410 s sem terminar, e a causa não está provada (falta o log do
terminal). Por ordem do Marcio, o spec valida UMA senha fora da regra por execução, sorteada entre as 4 (`abc`, `abcdefgh`,
`Abcdefgh`, `Abcdefg1`), nas duas plataformas, além da confirmação diferente e da senha válida. Só `tsc`.

**2026-10-19 — `04-criar-conta` iOS (Remote Access) falhou de novo no telefone ("1193" foi digitado no Nascimento, que
ficou "11/93"); a causa é a mesma da captura de 18/10. Correção APLICADA (ordem do Marcio), NÃO RODADA:**
`CadastroPage.focarCampoIOS` agora lê o rect com a tela parada (2 leituras iguais). Se a caixa estiver atrás do
teclado, arrasta o formulário (`mobile: dragFromToForDuration`, distância calculada do rect do campo e do teclado).
No telefone, confirma o foco pela ausência da tecla ".". São 3 tentativas, depois erro explícito. Só `tsc`. Os
comandos `mobile: tap`/`keys`/`dragFromToForDuration`/`touchAndHold` continuam sem rodar no host iOS do Device Farm
(xcuitest 7.27.0). No `appium.log` do iPhone 13 (Run #24), `POST /actions` (W3C) responde 200 nesse host.

**2026-10-19 — Contas do CI limpas no AVD (app 1.21.7/508), pedido do Marcio.** Capturas
`drafts/app-migrado/android/captures-2026-10-19-build508-contas-ci/` (`NOTAS.md`). 10 das 11 contas logaram; o que segue
vale SÓ para essas 10 (a `qa160` não logou: sem endereço nem limpeza nesta sessão — recriada depois, ver entrada da
noite). Nas 10, os Favoritos estão vazios. Em 9 o único favorito era a "Camisa Manga Longa Regular Tech Flex Falso Liso Azul"
(`favorite-toggle-164803`), removida; a `marciorocha` não tinha favorito. A Mochila ficou vazia e o endereço genérico
foi cadastrado (CEP 01310-100, Av. Paulista 1000); a `marciorocha` já tinha endereço. Persistência do endereço provada
na `test150`: logout, force-stop, login e checkout abriram a LISTA de endereços, e o caminho seguiu até o Pagamento,
sem finalizar. **`aaliyahrochanascimento087+qa160` (S23 Ultra) RECUSA o login** ("Incorrect e-mail or password", com
"Create new password"), e a senha é a mesma das outras. Isso explica o S23 Ultra do Run #24, que não chegou à
tab-home: o Marcio precisa resetar ou recriar essa conta. Ids do 508 iguais aos do 507 nas telas dos 4 testes; novo
só o `pickup-address` (opção "Store pickup" da Entrega). Bug: crash (error boundary + `JavascriptException`) no login
da `qatest100`, que não se repetiu na 2ª vez. Menu deslogado rolado depois do logout mostra o login sem
`menu-login-button` até rolar ao topo.

**2026-10-18 (noite) — CI Run #24 (21:15, commit `1e3c49e`, anterior às correções do cadastro iOS): tudo FAILED.**
Diagnóstico pelo AWS CLI (`Test spec output` dos 11 aparelhos + Allure do S24+ e do iPhone 13):
- `01-fluxo-favoritar`: "Conta suja" em 9 aparelhos. As contas do CI já tinham a "Camisa Manga Longa Regular Tech
  Flex Falso Liso Azul" favoritada. O S23 Ultra caiu no login (tab-home não veio em 20 s). O iPhone 14 passou.
- `02-compra-pix` (Android 6/6) e `03-compra-cartao` (Android 5/6, iOS 4/5): **as contas do CI não têm endereço
  salvo**. Depois do `bag-checkout-button` o app abre direto o formulário "New delivery address" (print da falha no
  S24+ e no iPhone 13), e não a lista com "Cadastrar novo endereço" que o `finalizarCompraESelecionarEndereco` espera.
- iOS no host do Device Farm: o WDA responde `Unhandled endpoint` para `mobile: keys`
  (`/wda/element/0/keyboardInput`) e `mobile: tap` (`/wda/tap/0`). Isso derrubou o login do Pix nos 5 iPhones
  (`LoginPage.completarEmailIOS`) e o cadastro no 14 Pro Max e no 15 Pro Max. No Remote Access os dois funcionam.
  Todo passo iOS que use esses dois comandos não roda no CI.
- `04-criar-conta`: Android 4/6 passou (contas no `MASSA-DE-DADOS.md`). S23+ e S26 Ultra: no passo do telefone, o
  `create-account-email` (usado para tirar o foco) não foi achado. iOS: o seletor por tamanho, já corrigido.
**Captura `ios/captures-2026-10-18-cadastro-telefone/` (402x874):** a tela rola a cada tecla do Nascimento e o y do
Phone oscila (629/574/605…), depois assenta em 509. Lido no meio da rolagem, o toque cai no teclado e o foco fica no
Nascimento (cap. 13). O `focarCampoIOS` dá sucesso porque o teclado já estava aberto. O discriminador de foco é a
tecla "." (existe no teclado do Nascimento, some no do telefone). Rolar até sair do teclado e tocar funciona (14d).
Drafts 42 e 43 reescritos. Correção NÃO aplicada (aguarda o Marcio).

**2026-10-18 (21:21) — `04-criar-conta` iOS rodou (app 1.21.7/352, janela 402x874) e FALHOU no 1º campo.** Onboarding,
login e abertura do Criar Conta passaram. O formulário estava na tela (print). Causa: o seletor dos campos usava o
TAMANHO (`x=16`, `width=398`, `height=48/49`), medido só em 430x932. Em 402 pt o campo tem 370 de largura. Nenhuma conta
foi criada. **Mudança (352, aprovada pelo Marcio), NÃO RODADA:** `CadastroPage` no iOS: o campo N é o N-ésimo irmão
`Other` com accessible="true" ANTES do botão da etapa (`create-account-submit` / `create-account-security-submit`). O
toque vai na moldura do campo, que é o irmão anterior. O erro é o campo seguido de nó accessible="false" e de StaticText.
Nenhum tamanho e nenhuma posição na tela. Conferido com lxml nas 24 árvores de `captures-2026-10-16-calcas-cadastro/`
(6 campos na etapa 1 e 2 na etapa 2; erro achado só onde existe), todas em 430 pt. Só `tsc`. Android sem mudança.
`ELEMENTOS-SEM-TESTID-IOS.md`: os campos do cadastro estão anotados para os devs, com o impacto.

**2026-10-18 (noite) — `03-compra-cartao` iOS rodou (app 1.21.7/352, 19:52–20:01) e FALHOU na parcela.** Passou onboarding,
login, Calças (R$ 699,90), Mochila, endereço, entrega, cartão (R$ 716,80) e o formulário inteiro (print com todos os campos
certos). Parou em `escolherParcelaAVistaIOS`: o sheet abriu, o toque na "1ª opção" não o fechou em 10 s. Nenhum pedido criado.
Sem print da falha. **Mudança (todas as plataformas):** `step()` de `test/utils/allure-helpers.ts` anexa "Falha — <passo>"
(print) em toda falha de passo, nos 4 specs. Só `tsc`.
**Captura `captures-2026-10-18-parcelas/` (352, 402x874):** as opções de parcela estão FORA da árvore (só backdrop, `Bottom
Sheet` sem filhos, X em y=236); o filtro "R$" pegava o `pressable` escondido e o sheet não fechava; `mobile: tap` na 1x
(201,297) fechou com "1x de R$ 716,80" (cap. 12). O 1º toque no campo só fecha o teclado (o 2º toque do teste é necessário).
**Mudança (352, aprovada pelo Marcio), NÃO RODADA:** `CheckoutPage.escolherParcelaAVistaIOS` procura nó "x de R$" + "sem
juros" abaixo do X; sem nó, `mobile: tap` 61 pt abaixo do X no centro da largura (medido em 402x874 e 430x932, não em
outras). Android sem mudança. `ELEMENTOS-SEM-TESTID-IOS.md`: opções sem testID e fora da árvore, com o impacto, para os devs.

**2026-10-18 (tarde) — `03-compra-cartao`: ramo iOS ESCRITO (app 1.21.7/352), NÃO RODADO.** Run pedido pelo Marcio na
sessão aberta caiu em 4 s (`Invalid pre-signed URL`: sessão expirada, nada tocado). Os passos de Calças e do cartão falhavam
de propósito no iOS; agora têm ramo: `CategoriasPage.abrirCalcas` (4º `sub-categories-button`, cap. 12 de
`captures-2026-10-16-calcas-cadastro/`); `CheckoutPage` selecionarCartao (label), formulário (placeholder + `digitarIOS`
com maxTypingFrequency 3, campo rolado para cima do teclado, cada campo conferido pela prévia do cartão), parcela à vista
(nó de menor y com "R$" no sheet; parcela = total do Prosseguir), finalizar sem `waitForIdleTimeout`, modal aceita
`-erro`; `PedidoPage` número e total por `following::StaticText` (cap. 46 do 349). `BasePage.digitarIOS` ganhou o
parâmetro opcional `frequencia` (padrão 10, login e busca sem mudança). Android sem mudança. Só `tsc`. Riscos: frequência 3
no cartão e `mobile: swipe` com teclado aberto não medidos; tamanhos da calça por fração (sheet de 7 tamanhos não medido);
finalizar/antifraude/Cancelado capturados só no 349.

**2026-10-18 — `02-compra-pix` no iOS (Remote Access, app 1.21.7/352): PASSOU no run das 13:37–13:47 (pedido #180606), com as mudanças abaixo.**
- Run 01:05: parou no `buscar("óculos")` (nenhum `product-card-*` em 30 s), sem print nem vídeo (Remote Access não
  grava). Run 11:05: passou da busca e parou no `prosseguirParaResumo()` (Resumo não abriu em 30 s).
- Captura `drafts/app-migrado/ios/captures-2026-10-18-pix-ate-pedido/` (01–26), finalizada com autorização: pedido
  **#178710** (R$ 196,81, 1 toque = 1 pedido, QR carregou). Prosseguir → Resumo abriu em ~1 s (falha não reproduzida).
  Todos os ids do caminho conferem, exceto o "tentar de novo" do QR: `wake-pix-tentar-de-novo` no iOS. Resumo: 4
  valores únicos (cada StaticText duplicado na árvore; o teste agrupa por y). `getClipboard` volta vazio no Remote Access.
- **Mudanças (352):** `PedidoPage.validarQrCode()` usa `wake-pix-tentar-de-novo` no iOS; `PedidoPage.copiarCodigo()`
  ganhou ramo iOS (código = StaticText `000201…` dentro de `wake-pix-aguardando`, toca `wake-pix-copiar`; clipboard
  vazio = só aviso, com conteúdo tem que ser igual); `CheckoutPage.prosseguirParaResumo()` no iOS toca 2ª vez se o
  Resumo não vier em 15 s e o botão continuar na tela, e anexa print se falhar. Android sem mudança. Só `tsc`.
- Runs 12:16 e ~12:30 pararam de novo na busca; o Marcio viu "óculos" digitado errado (digitação rápida). **Mudança
  (352):** `BuscaPage.buscar()` iOS digita com maxTypingFrequency 10 (medido: addValue padrão 11/11 errado,
  com 10/5/3 9/9 certo e 4 product-card) e falha se o value do campo não for o termo exato. O `BasePage.digitarIOS()`
  (login) também passou de 20 para 10.
- Run 12:47: a busca passou; parou no `continuarComprando()` — a fração do "Continue shopping" (medida no 349, 402x874)
  tocou ~36 pt abaixo do texto em 440x956 (o sheet fica preso ao topo). **Mudança (352):**
  `ProdutoPage.continuarComprandoIOS()` fecha o sheet pelo X (`bottom-sheet-close`, element click), testado no device
  3/3 (`captures-2026-10-18-sheet-fechar-x/`); a fração do "Continue shopping" saiu. Tamanho e "Add to cart" seguem por
  fração (risco em telas mais estreitas do CI, não medido). Só `tsc`. Só `tsc`. Captura da busca em `captures-2026-10-18-busca-oculos/`.

**2026-10-17 (noite) — `01-fluxo-favoritar` no iOS (Remote Access, app 1.21.7/352), NÃO RODADO depois da mudança.**
- Run 22:23: parou no `favoritarPrimeiroProduto` (coração não visível em 20 s). Captura de hoje
  (`drafts/app-migrado/ios/captures-2026-10-17-listagem-camisas/`) achou o `action-button` displayed=true e o
  click funcionou: a falha não se reproduziu e a causa não está provada (hidratação?).
- Run 23:07: o favoritar passou e o `voltar()` da listagem falhou. O `voltarIOS()` procura `Back` / 2º nó
  "Camisas", que não existem no 352; o voltar é `header-back-button`. Run 23:33: a limpeza nova desfavoritou,
  mas o voltar falhou de novo. **Mudança (352), ordem do Marcio:** o `BasePage.voltarIOS()` tenta primeiro o
  `accessibility id:header-back-button`, e o sucesso continua sendo a tab bar. Só `tsc`.
- A limpeza não desfavoritou: no 352, Favoritos não tem `action-button`, e o coração é
  `favorite-toggle-<id>` (`captures-2026-10-17-favoritos-com-item/`). A camisa foi desfavoritada na captura,
  e a conta `marciorocha` está limpa. **Mudança (352):** o `FavoritosPage.coracaoDoCardIOS()` passa a procurar
  `favorite-toggle-*` dentro do rect do card. Só `tsc`.

**2026-10-17 — `02-compra-pix`: desconto do Pix só sobre produtos (regra do build 1.21.7/507), NÃO RODADO.**
Captura no AVD (507, `captures-2026-10-17-pix-desconto/`, pedido #165851, drafts 18/32/38 reescritos): a tela do Pix
não mostra mais valor; o desconto aparece no Pagamento (`payment-wake-pix-discount`) e no Resumo (Descontos). O spec
passou a validar no passo 29 Produtos, Descontos (10% de produtos − cupom, sem frete), Total, o valor do Pagamento e
o botão; saiu a validação da tela do Pix e o `PedidoPage.valorAPagar()`. Só `tsc`. Detalhes e o que conferir:
`plans/2026-10-14-compra-pix.md` (seção 2026-10-17). Pendências: iOS sem captura do id depois de escolher o Pix
(reserva `-preview`); nenhum run com frete pago ainda separa as duas regras. No 507, 1 toque criou 1 pedido só
(1 tentativa).
- **3 runs do Marcio (12:11, 12:19, 12:38, build 507), 3 causas:** crash do app no login (registrado no
  `BUG-CRASH-ANDROID.md`); Meus pedidos só em esqueleto >30 s (o desconto novo passou inteiro, pedido #166766);
  modal "Size sold out" no G da camisa — **NÃO é bug** (Marcio): a última unidade do G estava reservada pelo pedido
  Pix pendente do run das 12:19; o app avisou corretamente. Captura `captures-2026-10-17-sold-out-meus-pedidos/`
  (13:26): tamanhos sem estoque vêm cinza com "+" (o toque não habilita o adicionar), enabled=true no dump; "Insufficient stock" = `alert-modal`
  /`alert-modal-confirm` (OK volta à PDP); Meus pedidos carregou em ~3 s, `order-status-container` existe; o sheet
  de "produto adicionado" levou ~95 s numa tentativa. **Mudança (507), NÃO RODADA:** `ProdutoPage.comprar()` Android
  trata o modal de estoque (OK, reabre o sheet, próximo tamanho; id do "Size sold out" presumido = `alert-modal`,
  não verificado); `PedidoPage.verMeusPedidos()` espera 60 s (era 30) e anexa print se falhar.

**2026-10-16 — SUÍTE REDUZIDA A 4 TESTES (Marcio): os principais e únicos.** Renumerados: `01-fluxo-favoritar`,
`02-compra-pix`, `03-compra-cartao` (era 05), `04-criar-conta` (era 06). Excluídos os specs comentados de onboarding,
login e logout, o `EsqueciSenhaPage`, o gate `cobertura.check.mjs`, os planos 06-04/06-05 e o código de page object
usado só por eles (conferido com `tsc` e busca de uso antes de excluir). Comandos: `COMO-RODAR-TESTES.md`.

**2026-10-16 23h — `01-fluxo-favoritar` no AVD, 2 falhas corrigidas, NÃO RODADO depois:**
- 22:00 parou em `abrirFavoritos()` pelo `menu-card` genérico, que sumiu no build 500. Viraram ids próprios:
  `menu-card-favorites` no `PerfilPage.abrirFavoritos`, `menu-card-*` no `confirmarLogout` e
  `favorite-toggle-<id>` no desfavoritar Android do `FavoritosPage`. Ficou favoritada a "Camisa Manga Longa
  Regular Tech Flex Falso Liso Azul" na conta `marciorocha`, para desfavoritar na mão.
- 23:01, com o AVD já no **build 1.21.7/507**, parou no onboarding. A notificação chega ~15-25 s depois da
  localização, por cima dos Tópicos. O `BasePage.continua()` e o `OnboardingPage` (03) agora respondem os
  diálogos de permissão que aparecerem no caminho (`responderDialogosPermissaoAndroid`,
  `esperarTelaRespondendoPermissoesAndroid`).
- 2026-10-17 00:18 — `01-fluxo-favoritar` **PASSOU** no AVD (507). `02-compra-pix` parou em `ProdutoPage.comprar()`:
  o sheet de "produto adicionado" (`bag-continue-shopping`) não apareceu depois do Add to cart. No vídeo, o sheet
  fechou, veio o overlay cinza com o logo e a PDP ficou sem sheet.
- 2026-10-17 01h, captura no AVD (507), em `captures-2026-10-17-build507-adicionar-pagamento/` (`NOTAS.md`):
  **o bug NÃO se reproduziu.** O sheet abriu em 3 de 3 tentativas (2x óculos, 1x camisa G), ~7 s depois do toque.
  Registrado como bug (item 22 do `BUGS-APP-ANDROID.md`). No run de 01:26 ficou provado: o sheet abre ~30 s depois do toque e o `comprar()` espera 20 s. Espera do `ProdutoPage.comprar()` (Android) subiu de 20 s para 45 s por ordem do Marcio (2026-10-17).
  - 2ª unidade de camisa sem estoque abre o modal `alert-modal` "Insufficient stock" em vez do sheet (item 23 do `BUGS-APP-ANDROID.md`).
  - Tamanho sem estoque deixa o `size-button` desabilitado.
  - Mochila → `bag-checkout-button` → endereço (card sem id) → `delivery-option-slas` →
    `delivery-continue-button` → Payment (`select-wake-method-*`, `payment-submit-button`) funciona, com os ids do 506.
  - Estado final: Mochila vazia, `pm clear`.

**PAROU AQUI (2026-10-16, noite) — RETOMAR POR AQUI:**
1. **`04-criar-conta` PASSOU no AVD** (Android, build 506). A conta desse run não foi registrada no
   `MASSA-DE-DADOS.md`: a `allure-results/` sumiu antes do levantamento.
2. **Captura iOS FEITA** (Remote Access, app **1.21.7 / build 352**, janela 430x932 pt), capturas 00–46 em
   `drafts/app-migrado/ios/captures-2026-10-16-calcas-cadastro/`, drafts **41–45** (Calças + cadastro), `00-INDICE`,
   `ELEMENTOS-SEM-TESTID-IOS.md` (seção 5) e `BUGS-APP-IOS.md` (14–19) atualizados. Conta iOS real criada
   (`MASSA-DE-DADOS.md`). Achados: Calças = 4º `sub-categories-button` (igual ao Android); campos do cadastro **sem
   testID e sem TextField** na árvore (só placeholder); erro = StaticText x=36 sem id; enviar/finalizar com 2 toques;
   `mobile: keys` 1 caractere por vez; apagar só com `touchAndHold` na tecla delete; logout com alerta nativo (o
   `confirmarLogout()` já trata).
2b. **2ª captura iOS no 352 FEITA** (`captures-2026-10-16-build352-compra/`, 00–81, até o Resumo, sem finalizar).
   `ELEMENTOS-SEM-TESTID-IOS.md` **reescrito do zero só para o 352** (46 pedidos; seção 3 = não conferido: Pix/QR,
   resposta do cartão/antifraude/cancelado, Meus pedidos com pedidos, Favoritos com itens, banner do pedido na Home,
   cupom aplicado, erros do endereço, edição de Meus dados/toggles). Drafts iOS com seção "Build 352" (21 arquivos)
   e novos 46–48; `BUGS-APP-IOS.md` itens 20–29. Fechar a seção 3 exige outra sessão e finalizar pedido (autorização).
3. **`autoGrantPermissions` REMOVIDO do `wdio.conf.ts` (AVD), ordem do Marcio 2026-10-16. NÃO RODADO.** Os
   diálogos já eram tratados por resource-id (`BasePage.ativaGps/permiteNotificacao`, permitir; `OnboardingPage.
   negarDialogoAndroid`, negar), o mesmo caminho que o Device Farm Android já usava. Validar no próximo run no AVD:
   `01-fluxo-favoritar`, `02-compra-pix`, `03-compra-cartao` e `04-criar-conta`. **Os dois `autoAcceptAlerts` do iOS também saíram** (Marcio, mesmo dia): aceitar
   já era feito por `mobile: alert` (`BasePage.aceitarAlertasSistemaIOS`); negar ganhou
   `BasePage.negarAlertasSistemaIOS` ("Don’t Allow" / "Ask App Not to Track", fallback `dismiss`), e o `03-compra-cartao`
   tem ramo iOS no onboarding (`OnboardingPage.negarPermissoesIniciais`, `continuarTopicosNegandoPermissoes`,
   `aceitarPoliticaETermos` → `BasePage.aceitarPoliticaETermosIOS`, extraído do `aceitaOnboardingIOS` sem mudar
   o comportamento). Nada disso rodou; validar no iOS o `01`, o `02` e o `04`.
3b. **Ramo iOS do `CadastroPage` ESCRITO (aprovado pelo Marcio, 2026-10-16), NÃO RODADO.** Campos por posição
   (`Other` x=16 398x48 sem name, 1..6 / etapa 2: 1..2), foco por toque perto da borda direita do rect, apagar
   segurando a tecla `delete`/`Delete` (por nome), `mobile: keys` 1 caractere a cada 260 ms, erro = StaticText x=36 em
   y = campo.y+56, enviar/finalizar com até 2 toques. Rodar: `npx cross-env PLATFORM=ios wdio run ./wdio.conf.ts --spec test/specs/04-criar-conta.spec.ts`.
4. **Spec `03-compra-cartao` ESCRITO (Android), NÃO RODADO** (agente, 2026-10-16): `test/specs/03-compra-cartao.spec.ts`
   + métodos novos em `OnboardingPage`, `CategoriasPage`, `CheckoutPage`, `PedidoPage`; iOS falha explícito. Só `tsc`.
   Rodar: `npx wdio run ./wdio.conf.ts --spec test/specs/03-compra-cartao.spec.ts`. Negar permissão é
   **melhor-esforço** (Marcio, 2026-10-16): se o diálogo não vier ou não der para negar, só aviso no log e segue
   (`OnboardingPage.negarDialogoAndroid`). Riscos: XPaths da parcela 1x, nº do pedido e
   total do cancelado só conferidos em dump; Mochila tem que ter exatamente 1 item.

**PAROU AQUI (2026-10-16) — RETOMAR POR AQUI:**
1. **Rodar o `04-criar-conta` no AVD** (o Marcio roda) e levantar o resultado: copiar o anexo "Dados do cadastro"
   do Allure para a tabela "Contas criadas…" do `MASSA-DE-DADOS.md`. Pontos de risco se falhar: XPath da
   mensagem de erro sob o campo (validado só nos dumps) e o `clearValue` nos campos com máscara (CPF, telefone).
2. **CI:** o Marcio vai corrigir o secret `BUILD_PROFILE_ANDROID` para `production` e recriar as 11 contas do CI
   (senha nova na loja nova). No próximo run, conferir pelo AWS CLI se o APK veio **506** (`get-upload`,
   `version_code`) e se o `02-compra-pix` e a POC executaram. Nada desta sessão foi commitado (o Marcio sobe).
3. **Captura iOS do cadastro** (Remote Access) para escrever o ramo iOS do `CadastroPage` (hoje falha explícito).
4. Em aberto, sem ordem do Marcio: checagem do modal de login recusado (procura texto antigo e dá "Login
   efetivado"); fallback silencioso para `development` no `install-apk.mjs`; remover `autoAcceptAlerts`/
   `autoGrantPermissions` do `wdio.conf.ts`; spec `03-compra-cartao`.

**TASK DE 2026-10-16: cenário de teste de criação/cadastro de conta no app.**
- **Precisa de captura antes de escrever, nas duas plataformas** (inspector + draft-writer em paralelo), no
  build atual (Android 1.21.6/506, iOS 1.21.6/350). O que existe hoje não basta:
  - Android: só o link `login-create-account` no Login; o formulário nunca foi capturado.
  - iOS: só a 1ª tela do formulário, no build 335 (draft `drafts/app-migrado/ios/31-criar-conta.md`): campos sem
    testID (placeholder), só `create-account-submit`; nenhuma validação, etapa 2 (senha) nem envio capturados.
    Provavelmente desatualizado (o 349 trocou ids genéricos).
- Referência de escopo: Etapa 5 do M6 (Criar Conta — Etapas 1 e 2, 22 cenários do PDF) e o padrão de e-mail
  `informatica.mrn+{texto}@gmail.com`.
- **Captura Android FEITA (2026-10-16, build 506)**, capturas 00–30 em
  `drafts/app-migrado/android/captures-2026-10-16-criar-conta/`, drafts 34–37; conta real criada
  (`MASSA-DE-DADOS.md`). Todos os campos têm testID (`create-account-*`, `create-account-security-*`).
- **Spec ESCRITO, NÃO RODADO: `test/specs/04-criar-conta.spec.ts`** + `test/pageobjects/CadastroPage.ts` +
  `gerarDadosCadastro()`/`gerarCpf()` em `test/utils/massa.ts`. Decisões do Marcio (2026-10-16): vai até o fim
  criando conta real; inválidos + caminho feliz no mesmo teste (e-mail, CPF, telefone com erro no campo e botão
  desabilitado; 4 senhas fora da regra e confirmação diferente com finalizar desabilitado); dados no anexo
  "Dados do cadastro" do Allure e no `MASSA-DE-DADOS.md`; **iOS falha explícito** no `CadastroPage` até a
  captura iOS. Só `tsc` conferido. Rodar: `npx wdio run ./wdio.conf.ts --spec test/specs/04-criar-conta.spec.ts`.
  Roda também no Device Farm (cria 1 conta por device por run).

**Andamento de 2026-10-16:** guarda do Device Farm removida do `02-compra-pix` (ver item 3 abaixo, nota de 16/10).
CI Run #20: Android baixou 1.20.11/494 (perfil `development` no EAS; o Marcio vai corrigir o secret
`BUILD_PROFILE_ANDROID` para `production`, conferir no próximo run se o APK vem 506); iOS (1.21.6/350) recusou o
login das contas do CI ("Incorrect e-mail or password ... create a new password") e o Marcio vai recriar as 11
contas. Em aberto, sem ordem: o login dá "Login efetivado" com o modal de recusa na tela (procura o texto antigo);
o `install-apk.mjs` cai em `development` em silêncio quando o secret vem vazio.

**PAROU AQUI (2026-10-15, noite) — COMEÇAR AMANHÃ (2026-10-16) POR AQUI:**
1. **Remover do `wdio.conf.ts` o que aceita diálogo sozinho (Marcio, 2026-10-15: "amanhã vamos atacar isso").**
   São três linhas, que o Claude escreveu durante o M3 (commit `8536e92`, 09/09) e que ficaram por causa da
   exceção temporária de 02/10 (`REQUIREMENTS.md`): `autoAcceptAlerts: true` no iOS (linha 35, Device Farm, e
   linha 70, Remote Access) e `autoGrantPermissions: true` no AVD (linha 83). O Marcio não quer nada no
   `wdio.conf.ts` aceitando diálogo. Enquanto o `autoAcceptAlerts` estiver ligado, o iOS aceita as permissões
   antes de o teste poder negar, e o onboarding "negando tudo" do spec do cartão não funciona no iOS. Planejar
   (skill `planejar-mudanca`): tirar as linhas, passar o tratamento dos diálogos para os page objects e medir
   no run o efeito na POC e no `02-compra-pix` (iOS e AVD).
2. **Spec `03-compra-cartao` (Android e iOS), pedido do Marcio em 2026-10-15. Ainda não escrito.** Decisões
   tomadas: igual ao `02-compra-pix`, com estas diferenças:
   - onboarding **negando** localização e notificação;
   - login direto, **sem** o teste de e-mail inválido;
   - **um item só, uma calça qualquer** (a 1ª de Categorias → Roupas → Calças);
   - pagamento com **cartão** até finalizar (cartão fake do `MASSA-DE-DADOS.md`);
   - **recusa = verde**: finalizar com um toque, fechar o modal antifraude ("Entendi") e validar o Pedido
     Cancelado com o número e o valor igual ao total do resumo;
   - **Android: capturar antes de escrever.**
   **Captura Android disparada em 2026-10-15 (noite)**, no AVD com o build 506 (`mobile-ui-inspector` +
   `mobile-draft-writer` em paralelo), em `drafts/app-migrado/android/captures-2026-10-15-compra-cartao/`
   (`NOTAS.md`). **Captura CONCLUÍDA (build 1.21.6/506, capturas 00–61, sem crash, device encerrado com
   `pm clear` Success e `kill-server`).** Pedido criado: **#146214** (1 calça + frete = R$ 716,80), um pedido
   só, que vai sozinho para Cancelado ~15 s depois. Achados que entram no spec:
   - o id de negar muda na 2ª solicitação (`permission_deny_and_dont_ask_again_button`), que vem depois do
     `onboarding-topics-continue`;
   - Calças = `sub-categories-button` índice 3;
   - no Android nenhum método de pagamento vem marcado;
   - os ids do formulário existem; as opções de parcela não têm id (content-desc "Nx de R$ …");
   - o Prosseguir do formulário é `pressable`;
   - o "Entendi" do modal antifraude é `button-confirm`;
   - o número do pedido não tem id;
   - **o app não valida Luhn nem o dígito do CPF** (o botão habilita com cartão e CPF inválidos; captura 48).
   **Drafts escritos** (`drafts/app-migrado/android/`):
   - novos: 29 (Calças), 30 (parcelas), 31 (validações do cartão), 32 (resumo + antifraude),
     33 (pedido processando/cancelado);
   - atualizados com uma seção "build 506": 02, 03, 06, 12–19 e 26;
   - `00-INDICE.md` atualizado.
   O `ELEMENTOS-SEM-TESTID.md` foi reescrito para o build 506, e o `BUGS-APP-ANDROID.md` ganhou os itens 13–17.
   Correção do draft-writer: o titular vazio MOSTRA "Nome do titular obrigatório" (dump 50). A tabela de
   seletores por passo está no relatório do draft-writer e nos drafts 29–33. **iOS:** o caminho de Calças nunca foi capturado e precisa de
   uma sessão de Remote Access. O resto do cartão no iOS já está capturado (build 349).
3. **Run do `02-compra-pix` no iOS (Remote Access, 2026-10-15 22:13–22:21): primeiro Pix de ponta a ponta no
   iOS.** O QR code carregou (pedido **#145112**). A única falha foi a validação do valor: a tela do Pix mostra
   629,91 (só o óculos com 10%), contra 1.349,82 esperado. É o bug conhecido de 1 toque gerar 2 pedidos. Antes
   desse run, o Pix das 21:54 parou no `abrirLogin()` porque o app abriu já logado e o `garantirDeslogado()` não
   detectou (o Menu estava rolado até o rodapé pelo `anexarRodapeDoMenu()`). Hipótese sem prova. A POC iOS
   falhou com "conta suja" (camisa favoritada na conta `marciorocha`) e depois com o `action-button` não achado
   na listagem do build 350.
4. **Allure local acumula runs:** a `allure-results/` não é limpa entre execuções (o `onPrepare` só cria a
   pasta), e o relatório mistura testes de runs anteriores. Validar no futuro a limpeza no `onPrepare`, só
   local e preservando `history/`.

**(anterior) PAROU AQUI (2026-10-15, tarde):**
1. **Captura iOS feita** (app 1.21.6 build 349, iOS 26.2, Remote Access, sessão fechada): compra **Pix** e
   compra **cartão** (cartão e CPF fake), finalizadas com autorização do Marcio. Capturas em
   `drafts/app-migrado/ios/captures-2026-10-15-compra-{pix,cartao}/` (`NOTAS.md`); drafts escritos
   (`drafts/app-migrado/ios/00-INDICE.md`: 01–19, 21, 26, 27, 34–40). Pedidos criados: `MASSA-DE-DADOS.md`.
2. **Documentos para o dev:** `ELEMENTOS-SEM-TESTID-IOS.md` (build 349) e `ELEMENTOS-SEM-TESTID.md` (Android 505),
   ambos com a versão no topo; bugs em `BUGS-APP-IOS.md` e `BUGS-APP-ANDROID.md`.
3. **Próximo, na ordem:**
   - **Captura do cartão no Android** (AVD, build atual), quando o Marcio liberar o emulador: inspector +
     draft-writer em paralelo (regra no `CLAUDE.md`). Incluir os **casos inválidos do formulário** (número
     errado, validade vencida, CVV incompleto, CPF inválido, campos vazios), que faltaram no iOS.
   - **Casos inválidos do formulário no iOS:** precisam de nova sessão de Remote Access (o Marcio abre e
     atualiza o `.env`).
   - **Cartão aprovado: NUNCA será implementado** (Marcio, 2026-10-21): segurança e inviabilidade de cartão válido
     neste ambiente. O cartão fica coberto só pela recusa/antifraude (`03-compra-cartao`).
   - **Ramo iOS do `02-compra-pix`: ESCRITO em 2026-10-15 (noite), NÃO RODADO.** Rodar:
     `npx cross-env PLATFORM=ios wdio run ./wdio.conf.ts --spec test/specs/02-compra-pix.spec.ts` (Remote Access). Seletores do build 349 conferidos
     com lxml nas árvores das capturas, não numa sessão. Mudou também o onboarding iOS (`welcome-start-button`,
     `onboarding-topics-continue`, `privacy-accept`, `terms-accept` no lugar do `accept-button`) e o login iOS
     (`menu-login-button`, `login-submit-button`), o que vale para a POC. Sheets da PDP por fração (exceção do
     Marcio no `REQUIREMENTS.md`); carrossel sem validação no iOS; copiar código Pix sem seletor no iOS. Esperado:
     parar no `validarQrCode` enquanto o QR não carregar no iOS (pedido já criado). Menu logado no 349 não
     capturado (`menu-card-*` enabled=true inferido).
   - **Spec do cartão** (Android e iOS) depois das capturas; **gerador de massa** na execução
     (`MASSA-DE-DADOS.md`).
   - Decisões ainda abertas do Marcio: pausas do login ficam ou saem.
   - **2026-10-16: guarda do Device Farm REMOVIDA do `02-compra-pix`.** Foi colocada pelo Claude sem pedido
     do Marcio e registrada errado como "decisão pendente dele". No CI Run #20 (16/10 00:15) ela fez o
     teste ser pulado nos 11 aparelhos (`⏭️ Teste pulado nesta plataforma` no `Test spec output`). Agora o
     spec roda no Device Farm, Android e iOS.
4. **Permissão:** o toque de finalizar pedido foi bloqueado 2x pelo classificador do Claude Code
   ("Real-World Transactions") e passou na 3ª, depois de o Marcio reafirmar a autorização. Pode voltar a
   acontecer; nesse caso o Marcio roda o `act.mjs` com `!`.

Atualizado em **2026-10-15 (madrugada)** — (registro anterior): spec `02-compra-pix` (compra com Pix, só Android local)
passou 2x no AVD (14/10 20:43 e 21:58), mas está instável por um **crash do app** no login (o app fecha durante o
spinner do botão "Sign in"; relato em `BUG-CRASH-ANDROID.md`). Registro completo e próximos passos em
`plans/2026-10-14-compra-pix.md` (seção "Onde parou"). **2026-10-15 (manhã):** reprodução pelo `adb`, sem WDIO:
o crash **não aconteceu** em 6 logins (0/6), mas o script foi bem mais lento que o teste, então **não vale
como prova**. Ver `drafts/app-migrado/android/crash-2026-10-14/repro-adb/RESULTADO.md`.
**2026-10-15 11:14–11:20:** o Marcio rodou o teste: login sem crash, e o spec parou **só** na validação da tela
do Pix, como esperado (valor a pagar 629,91 × 1.349,82 esperado; pedido 134367), pelo bug do app que divide a
compra em 2 pedidos. Antes, em **2026-10-13**: o timeout do Device Farm subiu de 15 para 60 min (ver "Pendências abertas"). Em 2026-10-09: Os testIDs novos entraram no build Android 1.21.2 (500), e os seletores da suíte ainda não foram trocados; ver "Pendências abertas". Antes disso, em 2026-10-03: POC verde local no Android e no iOS; Device Farm da POC pendente.

> Este arquivo foi mesclado nesta data. A cópia do `.planning/` trazida de outra pasta em
> 2026-09-10 sobrescreveu a versão de 09-09 com a de 09-08 — os drafts e o relatório de
> anomalias eram adição pura (ganho), mas o STATE/ROADMAP voltaram no tempo. O conteúdo
> abaixo junta as duas: as decisões de desenho iOS vieram da versão de 09-08, os achados de
> CI da de 09-09, e o resto é de hoje.

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

## Working tree

Branch `main`, HEAD em **`37857ce`** (`fix`, 2026-09-29). **Fora de commit:** `STATE.md` e
`ROADMAP.md`, com o registro da 2ª leva Android do M5 e a entrada do M6 (cenários Gherkin) com a renumeração M6→M7, M7→M8. Commits desde o `c367423` (referência
do `CI Run #14`, tabela abaixo) — nenhum toca em `test/` nem na configuração da suíte:

- `59ea7b1`, `fadafde` (11/09, mesmo dia) — só documentação: `STATE.md`/`ROADMAP.md`;
  `fadafde` também mexeu no `CLAUDE.md` e criou a pasta `Atualizações/`.
- `8c5fada` (14/09) — só `STATE.md`/`ROADMAP.md`.
- `332ab75` (16/09) — criou `.planning/codebase/`, `.planning/phases/`,
  `.planning/config.json` e `.planning/MILESTONES.md`, à mão, no formato GSD (o tooling
  `/gsd:*` real ainda não estava instalado — ver comentário no próprio `config.json`).
- `4d0cf96` (29/09, manhã) — registro da 1ª leva Android do M5 (ver "Pendências abertas");
  removeu a pasta `Atualizações/`.
- `37857ce` (29/09) — `@opengsd/gsd-core` instalado como devDependency real, corrigindo os
  hooks `gsd-*` que estavam referenciados em `.claude/settings.json` mas não existiam
  (`Cannot find module .../gsd-context-monitor.js`). É configuração do Claude Code, não do
  app nem da suíte — `.claude/` é gitignored, só `package.json`/`package-lock.json` mudaram
  no git. Perfil de skills instalado: `core` (mínimo).

Os drafts e o `RELATORIO-ANOMALIAS-IOS.md` continuam fora do git por `.gitignore`; os planos
(`.planning/plans/`) estão versionados.

O que `c367423` contém (validado no `CI Run #14`):

| Arquivo | O que mudou |
|---|---|
| `test/pageobjects/FavoritosPage.ts` | **(1)** `tirarSelecaoItem()` Android: `fechaBanner()` antes do clique e **poll de 30s até o produto sumir** da lista (antes era clique + `pause(3000)` sem asserção). Nas duas plataformas, `aguardarTelaEstavel()` ao final (a lista recarrega skeleton → vazia por ~6s). **(3)** `validaElememnto()` (Android e iOS): se o produto não está e a tela mostra `You don't have any favorite products yet!`, erro nomeado **"conta suja"** — o toque na listagem desfavoritou um item que já estava lá. Android passou de `expect` (3s) para `waitForDisplayed` 30s. |
| `test/pageobjects/CategoriasPage.ts` | **(2)** `voltar()` Android: `aguardarTelaEstavel()` → `fechaBanner()` **imediatamente antes** do clique → clique → **espera a tab bar** (`Categorias`/`Menu`/`Perfil`, 15s) → 2 taps antes de falhar com erro explícito. **(3)** Guarda em `favoritarPrimeiroProdutoIOS`: mede o `action-button-icon` do coração; largura < 26 (preenchido = 20x21, contorno = 32x33, draft 15) → erro "conta suja" **antes** de tocar. |
| `test/pageobjects/BasePage.ts` | **(2)** `voltarIOS()`: critério de sucesso passou de "árvore mudou" (`telaMudou`, removido) para **`tab-menu` visível** (15s); `aguardarTelaEstavel()` antes; cada caminho (Back, chevron) tenta 2 taps. Novo `aguardarTelaEstavel(timeout=15s)`: duas leituras iguais de `getPageSource` com 1s de intervalo; se não estabilizar só loga. |
| `test/specs/test.spec.ts` | **(4)** `tirarSelecaoItem(produtoFavoritado)` (passa o nome); flag `desfavoritado`; `try/catch` em volta dos steps: se falhou com produto favoritado e não desfavoritado, `limparFavoritoOrfao()` — `mobile: terminateApp` + `activateApp`, `abrirPerfil` → `abrirFavoritos` → `tirarSelecaoItem(produto)`, tudo melhor-esforço; se não conseguir, anexo `Favorito órfão na conta` no Allure com conta + produto. O erro original é sempre relançado. |

Ainda **não exercitado** (o Run #14 não falhou, logo não passou por aqui): a limpeza
`limparFavoritoOrfao()` — em especial se `mobile: activateApp` devolve o app na Home logado no
iOS — e o ramo de erro "Conta suja" da guarda do coração. São caminhos de falha; só um run que
quebre entre favoritar e desfavoritar vai validá-los.

## O levantamento iOS (2026-09-04)

8 sessões de AWS Device Farm Remote Access, 3 iPhones diferentes, iOS 26.3, janela
`402x874`pt (print `1206x2622`px, escala 3), app **1.14.2 build 305** de produção:

- `.planning/drafts/ios/` — 35 drafts, um por tela, com print + árvore XCUITest de cada
  estado. `00-INDICE.md` é o mapa e concentra as descobertas que mudam a estratégia de seletor.
- `.planning/RELATORIO-ANOMALIAS-IOS.md` — o consolidado por tipo de problema.

Cobertura: fluxo do M1 inteiro **e** o fluxo de compra do `test/Draft.ts` até o
`Finalize purchase`.

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

### M6 — em execução desde 2026-10-01 (`/gsd-execute-phase 6`): planos 06-01 a 06-03 concluídos

- **06-01:** DEC-A respondida (registrada no `06-CONTEXT.md`); **regra fixa: idioma ignorado, testes
  não validam texto** (D-04 corrigida, `REQUIREMENTS.md`); captura iOS sessão A do app migrado
  (1.20.10 build 335, 45 capturas, drafts em `.planning/drafts/app-migrado/ios/`); captura Android
  em inglês cancelada por decisão do Marcio.
- **06-02/06-03:** POC migrada para o app migrado (`test/specs/01-fluxo-favoritar.spec.ts`,
  `test.spec.ts` removido) — **verde local nas duas plataformas**: Android AVD-S24 17/17
  (2026-10-01 21:20) e iOS Remote Access 17/17 duas vezes (22:17 e 22:25). Detalhes e desvios em
  `06-03-SUMMARY.md`. Seletores Android sem texto (XPath estrutural + `enforceXPath1`), fechaBanner
  pelo `wrap-close-button` da raspadinha, logout validado por `menu-card enabled=false`, login
  desloga antes se o app abrir logado.
- **Pendente:** run do CI (Device Farm) com a POC migrada — o Marcio dispara; durações por device
  levantadas pelo AWS CLI depois. Working tree com as mudanças de `test/`, sem commit.
- **Bug do app (levar ao time):** relato para os devs em `BUG-CRASH-ANDROID.md` (raiz, 2026-10-14: 4 crashes
  no dia no build 1.21.6/505, 3 de 9 runs da compra Pix mortos por ele; a automação agora anexa o logcat de
  crash ao Allure quando o app fecha). Registro original: crash intermitente no Android na transição Termos → Home
  (logcat 2026-10-01 20:29: `RetryableMountingLayerException: Unable to find viewState for tag 266`).
- **FEITO em 2026-10-16 (Marcio) — era pendência de 2026-10-02:** remover do `wdio.conf.ts` o
  `autoAcceptAlerts: true` (iOS, linhas 35 e 70) e o `autoGrantPermissions: true` (AVD, linha 83),
  e passar o tratamento dos diálogos para os page objects (regra "Nenhum passo de teste no
  `wdio.conf.ts`" no `REQUIREMENTS.md`). Ficam por ora porque retirá-los já afetou os testes antes.
  O mesmo vale para o hook `before` (pausa fixa de 10 s) e para o reset do app no `afterTest`.
- **Pendência — hook do Claude quebrado:** o `.claude/settings.json` registra o
  `gsd-secret-read-guard.js` em Read/Grep/Bash, mas o arquivo não existe em `.claude/hooks/` nem
  no `@opengsd/gsd-core` 1.10.0 instalado. O hook falha em silêncio e a proteção contra leitura
  de segredo (`.env`) não está ativa. **Decisão do Marcio (2026-10-02): não mexer.** O impacto
  não é conhecido, e o `.claude/settings.json` nunca é alterado (regra no `REQUIREMENTS.md`).
  Fica só registrado.
- **CI Run #17 (2026-10-03 17:32) — Android sem relatório no Pages, iOS publicado (diagnóstico 2026-10-05,
  pelo AWS CLI). Relatório completo, com os comandos e as fontes: `.planning/DIAGNOSTICO-CI-RUN17.md`
  — retomar por ele:**
  1. **APK errado:** o CI subiu `app-run17.apk` = `com.aramis.ecomm` **1.14.3 build 486** (app ANTIGO). A
     seleção vem dos secrets `BUILD_PROFILE_ANDROID`/`BUILD_SELECTION` (no `.env` local: `production` /
     `latest`), e o `production` mais recente ainda é o app antigo. A suíte é do app migrado (1.20.x).
  2. **Todos os testes falham no mesmo ponto** nos 6 Samsungs: `HomePage.validarHome` → "tab-home
     visível=true, editorial-home-root presente=false" (o app antigo não tem esse testID). Cada teste
     ainda refaz o onboarding inteiro antes de falhar.
  3. **Timeout de 15 min:** o run tem `jobTimeoutMinutes = 15`; o Device Farm parou a Tests Suite aos
     15,25 min nos 6 aparelhos (`STOPPED`, "Tests stopped", WDIO em 75%). Com a fase `test` morta, o
     `post_test` do `testspec.yml` (que copia `allure-results` para `$DEVICEFARM_LOG_DIR`) não rodou: o
     `Customer Artifacts` de cada aparelho só tem o `appium.log`. Sem `*-result.json`, o publish-report
     não gera o relatório Android.
  4. **iOS publicou porque terminou antes de 15 min** (12,14 min no iPhone 13),
     então o `post_test` rodou. O relatório iOS publicado tem as MESMAS falhas (`editorial-home-root`).
  O Run #16 (02/10) teve o mesmo padrão (Android `STOPPED` em 5 de 6 aparelhos).
  Decisões em aberto para o Marcio: qual perfil/build do EAS é o app migrado para o CI; e o tempo do
  Android (16 testes com onboarding completo não cabem em 15 min por aparelho).
- **Spec `02-compra-pix.spec.ts` escrito (2026-10-14, cenário do Marcio "Jornada completa de compra com
  Pix", 35 passos). Registro completo em `plans/2026-10-14-compra-pix.md`. **Passou no AVD em
  2026-10-14 20:43–20:50** (4º run do Marcio; pedido nº 128763), com a limpeza da Mochila desativada a pedido dele. Preço de cada produto
  lido na PDP (`lerPrecoDoProduto`), guardado no spec e validado no resumo antes de finalizar.** Só Android; pula no iOS (sem
  captura). (A guarda que pulava o Device Farm foi removida em 2026-10-16: não tinha sido pedida.) Page objects novos:
  `BuscaPage`, `ProdutoPage`, `CheckoutPage`, `PedidoPage`. Trocas para os ids do build atual (Android):
  onboarding (`onboarding-topics-continue`, `privacy-accept`, `terms-accept`), login
  (`menu-login-button`, `login-*-input`, `login-submit-button`), logado (`menu-user-header`), sair
  (`menu-item-logout`). Elementos sem id via XPath, listados no `ELEMENTOS-SEM-TESTID.md` (seção 00).
  Capturas: `drafts/app-migrado/android/captures-2026-10-14-compra-pix/` e `-rodada2/` (35/35 no AVD).
  Achados: 1 toque em finalizar com 2 produtos gerou 2 pedidos (rodada 2: #127635 e #127673); QR do Pix
  intermitente; tela do Pix e Home com cronômetro exigem `waitForIdleTimeout: 0`; resumo da rodada 2
  sem o desconto Pix (1.499,80 × 1.349,82 cobrado).
- **Próximo cenário: compra com CARTÃO (Marcio, 2026-10-15) — precisa de nova captura no Android.** Depois do
  `02-compra-pix`, o próximo teste é o fluxo de compra pagando com cartão. Antes de escrevê-lo, capturar no AVD
  os elementos da **tela de pagamento com cartão** (formulário do cartão e o que vier depois dele, até onde o
  app deixar). A última captura dessa tela é da 2ª leva do M5 (build 1.20.10/492, 2026-09-29), que parou no
  formulário de cartão: na época os campos **não tinham testID**, e ela é anterior ao build atual (1.21.6/505).
  **Autorizado pelo Marcio (2026-10-15): finalizar pedido real nas capturas, tanto no Pix quanto no cartão.**
  **Cartão:** fake, gerado em 2026-10-15 a pedido do Marcio. Os dados estão em `.planning/MASSA-DE-DADOS.md`,
  junto com os demais dados de teste e os pedidos reais criados. Espera-se a recusa do pagamento.
  Captura iOS da compra Pix (2026-10-15, Remote Access, app 1.21.6 build 349, iOS 26.2) **até o Resumo**, em
  `drafts/app-migrado/ios/captures-2026-10-15-compra-pix/` (`NOTAS.md`), depois finalizada (capturas 45–48,
  com nova autorização do Marcio): **1 toque gerou 2 pedidos** (#139889 R$ 629,91 e #139933 R$ 719,91), a tela
  do Pix e o banner da Home mostram só o #139889, e **o QR do Pix não carregou**, nem com "Try again". São os
  mesmos achados do Android. **Cartão no iOS capturado** (cartão e CPF fake, em
  `captures-2026-10-15-compra-cartao/`): 1 toque gerou 2 pedidos (#140130 e #140139), os dois cancelados; o
  formulário de cartão só tem `card-installments-input`. Sessão fechada (`deleteSession`). Falta a captura do
  cartão no **Android** (build atual). Os testIDs que faltam no iOS estão em
  `ELEMENTOS-SEM-TESTID-IOS.md` (raiz); o maior bloqueio é o conteúdo dos bottom sheets (tamanho e "produto
  adicionado") fora da árvore, hoje só por coordenada.
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
- **testIDs novos do dev: ENTRARAM no build 1.21.2 (500)** (conferido em 2026-10-09 no AVD-S24, app
  instalado no mesmo dia às 14:36). A conferência fez 74 capturas, do onboarding ao logout, passando
  por PDP, Mochila, endereço, entrega, pagamento e Busca, com toque por id e o efeito conferido no dump.
  Também foi feita a busca dos ids no `index.android.bundle`. A maioria dos ids do
  `TESTIDS-ALTERADOS.md` existe e funciona. Evidência: `drafts/app-migrado/android/captures-2026-10-09-build500/RESULTADO.md`.
  O `ELEMENTOS-SEM-TESTID.md` (raiz) ganhou a coluna "no 500" e a seção 0, com o que falta pedir ao dev.
  - **Ainda faltam:** o coração do card da **Listagem** continua `action-button` (o
    `favorite-toggle-<id>` só existe em Favoritos, nas recomendações e na Mochila vazia).
    `search-input` e `search-clear-button` não existem; o "X" nem tem nó. `pressable` continua em
    "Salvar alterações" e em "Cadastrar novo endereço". A seção "Código do vendedor" continua
    `button-collapsible-card`.
  - **Quebram a suíte atual no Android** (os genéricos sumiram): `accept-button`, `menu-card`,
    `menu-list-button`, `pressable` no Login e no Esqueci a senha, `action-button` em Favoritos, e o
    acesso ao Login, que era achado pela posição antes do 1º `menu-card`.
  - **Continuam:** `tab-*`, `editorial-home-root`, `editorial-group-0`, `permission-topic`,
    `category-button`, `sub-categories-button`, `product-list`, `flatlist-favorites`,
    `action-button-icon` (84x84 → 52x53) e `wrap-close-button-<n>`. O `enabled` dos `menu-card-*`
    continua indicando o estado: true logado, false deslogado (capturas 10, 19, 73 e 74).
  - **Sufixo `<id>`:** é o número do produto, o mesmo no card e no toggle (`product-card-164803`,
    `favorite-toggle-164803`).
  - **Crash Termos → Home: não reproduziu.** Houve 1 `RetryableMountingLayerException` (blur), sem
    crash. O 1º toque em Notificações abriu "Page not found"; o 2º funcionou.
  - **iOS não conferido** neste build. Não se sabe se o IPA tem os mesmos ids.
  - **Não resolve o CI:** o Device Farm continua baixando o APK `production` antigo (Run #17).
- **(histórico) testIDs novos do dev — NÃO estavam no build 494 (2026-10-05):** o `TESTIDS-ALTERADOS.md` (raiz) lista
  ~90 ids aplicados. A conferência no AVD (`com.aramis.ecomm` 1.20.11 build 494, instalado em 10-03)
  não achou nenhum, nem nas 48 árvores, nem no `index.android.bundle`. Evidência em
  `drafts/app-migrado/android/captures-2026-10-05-testids/RESULTADO.md`; o `ELEMENTOS-SEM-TESTID.md`
  ganhou a coluna de situação. **Testes não alterados** (trocar agora quebraria tudo). Aguardando o
  dev dizer qual build tem as alterações; quando chegar, refazer a conferência e só então trocar
  os seletores Android.
- **Próximo:** antes de escrever qualquer teste novo, aplicar a regra de cobertura mínima.

### M6 — discussão feita em 2026-09-30

`.planning/phases/06-cenarios-gherkin-app-migrado/06-CONTEXT.md` (decisões D-01–D-14),
`06-PENDENCIAS.md` (massa de dados para o Marcio decidir) e `06-DISCUSSION-LOG.md`. Resumo:
código nos page objects atuais, suíte só no app migrado (a POC do favoritar também migra);
device em **inglês**, valida funcionalidade e não idioma; Android + iOS juntos; CI a cada
etapa; contas por device do CI reaproveitadas. Escopo: 101 − 8 excluídos (pt-BR 5, Seção DEV 2,
conectividade 1) = 93, dos quais 11 pendentes de massa (cupom 6, estoque 2, frete 3) → 82 agora.
- **Não feito ainda:** captura iOS do app migrado (sessão de Remote Access que o Marcio abre
  depois) — pré-requisito da implementação, não do planejamento.
- **Planejada em 2026-10-01 pelo `/gsd-plan-phase 6`** (pesquisa → planner → checker, aprovado
  na 2ª checagem): `06-RESEARCH.md`, `06-VALIDATION.md` e **16 planos `06-01-PLAN.md`…`06-16-PLAN.md`**
  (todos `verify plan-structure` `valid: true`; decisões D-01–D-14 cobertas 14/14). O documento da
  fase `06-PLAN.md` (29–30/09) é o correto: foi **convertido** para o formato GSD — o texto dele
  está, palavra por palavra, no `<context>` do `06-01-PLAN.md` — e o arquivo no formato antigo
  saiu do diretório. Próximo comando: `/gsd-execute-phase 6`, que começa pela DEC-A (decisões do
  Marcio) e pelas capturas Android em inglês e iOS sessão A.
- Achado da pesquisa: as capturas `captures-2026-09-29-m6e1/` **não estão em inglês** (AVD em pt-BR);
  a premissa da D-04 ainda não foi verificada — é a DEC-B do 06-02.
- Trabalho de 29–30/09 ainda sem registro aqui: `captures-2026-09-29-m6e1/` (sem
  `NOTAS.md`), `captures-2026-09-30/` (parcial) e `ELEMENTOS-SEM-TESTID.md` (raiz).

### Levantamento do app migrado (M5) — 2ª leva Android feita em 2026-09-29 (build "completo")

AVD `emulator-5554`, `com.aramis.ecomm` **1.20.10 build 492**, capturas `00`–`51` (54 prints e
55 dumps, contando `12b`, `13-relaunch` e o `24b-windows.xml`, só árvore) em
`.planning/drafts/app-migrado/android/captures-2026-09-29/`, com `NOTAS.md` (tela a tela) e
**`TESTIDS.md`** (todos os testIDs por tela + o que ainda não tem id). Navegação feita pelo
Claude via `adb`, a pedido do Marcio. A captura `14` é da Home, não do Menu (o Menu logado é a
`45`). Drafts escritos (ver abaixo).
- **Fluxo da suíte inteiro funciona**, inclusive favoritar e desfavoritar (quebrados no 1.20.8).
- **App em pt-BR**: todo seletor por texto/desc da suíte atual quebra ("Continuar", "Li e concordo",
  "Fazer login", "Sair", "SAIR", "Você ainda não tem produtos favoritados!"). Ids seguem valendo.
- Estado favoritado agora visível na árvore: `action-button-icon` 84x84 → 52x53.
- 28 drafts escritos em `.planning/drafts/app-migrado/android/` (índice `00-INDICE.md`).
- Encerramento: `adb shell pm clear com.aramis.ecomm` + `adb kill-server`.
- Login: 1º tap em "Fazer login" com teclado aberto só fecha o teclado; o 2º loga.
- Compra percorrida até a escolha de pagamento; parado no formulário de cartão (sem cartão de
  teste escrito). Campos de endereço e cartão **não têm testID**.
- Conta ao final: sem favoritos, Mochila vazia, **um endereço salvo** (Av. Paulista, 1000), deslogada.
- Banner do Insider não apareceu nesta sessão.

### Levantamento do app migrado (M5) — 1ª leva Android feita em 2026-09-22

AVD `emulator-5554`, `com.aramis.ecomm` **1.20.8 build 483**, 32 capturas (`00`–`31`) em
`.planning/drafts/app-migrado/android/captures-2026-09-22/` com `NOTAS.md`. Sem draft ainda.
Fluxo da suíte percorrido de ponta a ponta: onboarding → **login OK com `CLIENT_USER` no 1º tap**
→ Categorias → Roupas → Camisas → favoritar → Favoritos → logout. **O bloqueio de login do iOS
(09-11) está explicado:** a conta não existia para o app migrado; o Marcio a cadastrou em
2026-09-22 e atualizou a senha no `.env`. Não está escrito se as contas por device do CI
precisam do mesmo cadastro. **Favoritar não funciona neste
build**: toque no coração abre modal "Falha ao carregar / Não foi possível carregar as categorias"
(2/2) e Favoritos fica vazio — lacuna do módulo; desfavoritar não exercitado. Banner raspadinha
do Insider apareceu em Categorias e fechou pelo `Close`. Falta: PDP, Mochila/checkout, Busca —
capturados na 2ª leva (build 1.20.10, acima).

### Levantamento do app migrado (M5) — 1ª leva iOS feita em 2026-09-11, INCOMPLETA

**Capturado:** 37 pares print + árvore (`00`–`36`) em
`.planning/drafts/app-migrado/ios/captures-2026-09-11/`, com `NOTAS.md` (tabela por captura:
ação, seletor, achados). **Ainda sem draft** — o `mobile-draft-writer` não rodou; o Marcio vai
ler as capturas primeiro e conferir com o que ele sabe que funciona. Scripts de captura ao lado:
`capture.mjs` (print + árvore, reutiliza a sessão) e `act.mjs` (comando avulso na sessão) —
rodar num diretório com `.env` e `node_modules` (junction para o do repo).

Ambiente: 3 sessões de Remote Access, iPhone iOS 18.0, janela `393x852`pt (print 1178x2556,
escala 3), **mesmo `bundleId` `com.aramis.ecomm`**, versão **1.20.0 build 314** (o antigo era
1.14.2/305), instalação limpa. Sessões caíram 2x por `Invalid pre-signed URL`.

O que a leva cobriu, **tudo deslogado**: notificações (alerta) → boas-vindas → onboarding →
política → termos → Home → Perfil → Login → Categorias → Roupas expandido → Camisas (listagem)
→ tentativa de favoritar.

**Bloqueio (RESOLVIDO em 2026-09-22 — conta não cadastrada no app migrado; ver leva Android acima): login recusado com credenciais corretas.** `CLIENT_USER`/`CLIENT_PASSWORD` do
`.env`, digitados à mão pelo Marcio e conferidos no print com a senha visível (`19-retomada`),
2 taps em "Sign in" (`20`, `22`) → modal "Incorrect username and/or password". Não é digitação;
é o backend deste build recusando a conta. **Perguntas em aberto para o Marcio:** essa conta
deveria funcionar aqui? o app migrado aponta para outro ambiente/base? há outra conta?

**Achados novos em relação ao app antigo** (detalhe em `NOTAS.md`):
- Alerta nativo de **App Tracking Transparency** no onboarding, antes do de localização.
- Modais RN ("Incorrect username…", "Atenção — Você precisa fazer login para adicionar
  produtos aos favoritos") são um nó único sem filhos: `mobile: alert` falha, só coordenada.
- `tab-bag` com label "Mochila" (era "My Bag"); bloco "DEV / Painel de controle" oculto no
  Account Menu; `accept-button` ("Continue") fixo desde a 1ª tela do carrossel.
- **Categorias com estrutura nova**: carrossel de campanhas + lista com chevron; "Roupas"
  mantém `sub-categories-button`.
- **Listagem Camisas já hidratada na 1ª captura** (151 produtos) — no antigo levava 20s+.
- Home sem banner do Insider nas 2 capturas.

**Não resolvido / pendente para a próxima sessão:** abrir a **PDP** pelo card (2 taps por
coordenada não navegaram; `name ==` deu 0 matches, provável ` ` no preço; `CONTAINS`
achou 17 nós e a sessão caiu antes do clique) → sacola/Mochila → checkout deslogado → Menu
item a item → Busca. Depois do login resolvido: Perfil logado, favoritar/desfavoritar,
Favoritos, checkout, logout. **Android: nada capturado ainda.**


### Um email por device — VALIDADO no `CI iOS Run #7`

Funcionou: 5 runs separados (`CI iOS Run #7 - Apple iPhone 13 / 14 / 14 Pro Max / 15 / 15 Pro
Max`), **os 5 aparelhos executaram**, 5 contas distintas, e Android sem regressão
(`CI Run #7` = 18/18 PASSED). Nenhum `Device iOS não encontrado`.

### Correções de fluxo iOS — VALIDADAS no `CI iOS Run #8` (onde o login passou)

No iPhone 15 (PASSED) e no 14 Pro Max (logou): `🛍 Produto escolhido: Camisa Manga Longa Slim
em Tricoline Stretch Liso Branco` só com o nome; `💔 Desfavoritar: 2 action-button no card
(x = 155, 21); escolhido o de maior x = 155`; nenhum `Banner do Insider não fechou`, nenhum
`🔎 [diag banner]` (o `Close` fantasma não apareceu neste run); `voltar`, `abrirPerfil`,
`logout` e `confirmarLogout` exercitados pela primeira vez e passaram
(`✅ Logout confirmado pelo estado da tela`).

### Login iOS perde caracteres na digitação — CORRIGIDO e VALIDADO no `CI iOS Run #9`

Run #9 (2026-09-10, noite): `⌨ Email: N caracteres digitados com o teclado aberto` nos 5
aparelhos, **5/5 logins**, 4/5 PASSED (13, 14, 15, 15 Pro Max). O único FAILED (14 Pro Max)
foi o banner, abaixo. Diagnóstico original mantido a seguir para registro.


Causa dos "email ou senha incorreto" do Run #7 (`marciorocha`, "em observação") e do Run #8
(iPhones 13, 14 e 15 Pro Max). **Medido nos artefatos, não deduzido** — detalhe completo na
seção 4.4 do `RELATORIO-ANOMALIAS-IOS.md`:

- testspec e `🔑 Conta deste run` corretos nos 5 aparelhos → não é `.env`/secret;
- `appium.log`: `setValue` sai completo (`"m","a","r","c","i","o",...`) → não é o Appium;
- frame do vídeo após o `setValue`: `mariorocha@maildrop.cc` (iPhone 14) e `qaest@maildrop.cc`
  (15 Pro Max) → a letra some **no ato de digitar**;
- o WDA dá o tap para focar e digita 23 caracteres em <1s, com o teclado ainda subindo; o
  iPhone 15 passou pelo mesmo caminho e logou — é aleatório;
- iPhone 13 digitou o email certo e foi recusado: o vídeo **não mostra senha** (campo
  `secureTextEntry` sai vazio até no aparelho que logou), então a letra perdida na senha é a
  única variável restante (inferência; o resto é medição).

Agravante corrigido junto: `logarIOS()` dava `✅ Login efetivado` com o modal de erro na tela,
porque o modal cobre o botão "Sign in" e a âncora era "botão sumiu". O teste morria 20s depois
em `tab-categories still not displayed` — o sintoma errado, no passo errado.

No próximo run, conferir: `⌨ Email: N caracteres digitados com o teclado aberto` nos 5; frame
do vídeo com os 5 emails íntegros; nenhum `Login efetivado` seguido de `tab-categories`. Se
aparecer o novo erro `o app recusou as credenciais`, o frame diz se ainda falta letra (baixar
mais o `maxTypingFrequency`) ou se é outra coisa.

### Banner do Insider no iOS — MEDIDO em 2026-09-11, correção no working tree, aguardando run

Run na empresa (mesma versão `581de84`): o banner abriu logo depois de favoritar e o teste morreu
por baixo dele. Medição em Remote Access, 2 ocorrências (Account Menu e Categorias), iPhone iOS 18.0:

- `Close` em `[313,273 25x25]`, centro = o "X" do print (1178px ÷ 3). `element click` **fechou** as
  duas vezes; ≤1s depois `find` de `Close`/WebView/`InsiderTemplateWindow` → `no such element`.
  Sem fantasma neste aparelho. Só existe contexto `NATIVE_APP`.
- Com o banner na tela, `tab-categories` (por baixo) respondeu `displayed=true`, `hittable=true`:
  o WDA não vê o banner como obstrução, o toque é engolido em silêncio. Enquanto o banner está
  aberto, a `Window` principal do app fica `visible=false` (segundo discriminador possível).
- Conclusão: o método fecha; o furo é ser chamado só no início do step — o banner que nasce
  durante os 40s de espera da grade engole o clique no coração. Correção: chamada antes de cada
  clique do ramo iOS + 3s/3s + evidência no log/Allure (tabela do Working tree).
- Próximo run: com banner, esperar `🟡 ... aguardando 3s` → `👆 Clicando no "Close" em [...]` →
  `✅ Banner fechado e confirmado fora da tela`; se falhar, o erro traz o rect e um screenshot.

Registro anterior (Run #9), mantido:


No Run #9 o 14 Pro Max favoritou, o banner INTERLÚDIO abriu em cima da listagem (frame t=159s,
`Close` em `[332,313 24x25]`) e o `voltar()` morreu por baixo dele. O `fechaBannerIOS()` rodou
antes do passo e **viu** o banner — mas não clicou, pela decisão de `a53c6b6`. Essa decisão
foi errada e está revertida: o marcador de presença certo (WebView `Insider WebView Content`
displayed=true) saiu do próprio diagnóstico do Run #9 e agora o ciclo de fechar é o mesmo do
Android. No próximo run conferir `✅ Banner fechado (tentativa 1/3)` quando o banner aparecer e
**nenhum** fechamento com a tela limpa.

O `abrirFavoritos()` do 14 Pro Max no Run #8 (`flatlist-favorites` não apareceu) provavelmente
era o mesmo banner num passo diferente; não há diag naquele run para provar. Reavaliar se
reaparecer com o fechamento ativo.

### CI Run #13 (2026-09-11 14:18) — 2 Android + 2 iOS, três causas — CORRIGIDO e VALIDADO no `CI Run #14`

Medido em log (`Test spec output`) + vídeo, frame a frame, dos 4 jobs. **O código Android não
tinha mudado desde o Run #6** (diff `56810d6..d2e770b` só toca ramos iOS).

- **Banner NOVO do Insider: "Só no APP: 20% OFF pra você! Raspe aqui e descubra"** (raspadinha,
  fundo azul). Dispara ~2,5–3s **depois da interação com o coração** (favoritar ou desfavoritar),
  nas duas plataformas. Run #12 (13:02) foi 18/18 no Android; Run #13 (14:18) já pegou —
  campanha ativada nessa janela. Não é o INTERLÚDIO.
- **S23 Ultra / S24 Ultra** — `Nenhum dos seletores apareceu em 20000ms: Menu | Perfil` no 3º
  `abrirPerfil`. Desfavoritar → lista vazia → banner nasce → o `elementClick` da seta Voltar cai
  em cima dele (no S23 Ultra o click levou 1,07s; normal 0,1s) e **fecha o banner em vez de
  voltar**. O banner dura ~1,5s; o `fechaBanner()` do step rodou 0,1s antes de ele renderizar e
  o `insiderLayout` seguinte já não existia. App preso em Favoritos (sem tab bar). No S23+ o
  mesmo banner apareceu e o clique ganhou a corrida: `✅ Banner fechado (tentativa 1/3)`.
- **iPhone 15 Pro Max** — `tab-menu still not displayed` no 3º `abrirPerfil`. **Sem banner**
  (brilho do vídeo constante). O tap no `Back` saiu com Favoritos recarregando (skeleton →
  vazia), o WDA levou **6,7s** para entregar, o tap se perdeu; `telaMudou()` devolveu `true`
  porque o estado vazio acabou de renderizar (diff dos dois `getPageSource`: "Favorites Back
  Toolbar" → "You don't have any favorite products yet!"). Falso positivo de "voltou".
- **iPhone 13** — `flatlist-favorites não apareceu`. Aos 205s do vídeo, com a listagem recém
  aberta, o coração da 1ª camisa **já estava vermelho**: a conta `informatica.mrn+qa100@gmail.com`
  tinha o item de um run anterior (Run #12, iPhone 13, morreu no `voltar()` da listagem logo
  após favoritar). O toque **desfavoritou**, Favoritos abriu vazio, e a lista vazia não tem
  `flatlist-favorites`. **Efeito em cadeia entre runs.** Desfavoritar manualmente nessa conta
  antes do próximo run.

**Resultado:** `CI Run #14` (15:49), mesmo dia, com a campanha do banner ainda ativa: Android
18/18, iOS 5/5. Registro do que se conferiu no próximo run, mantido como checklist para
regressões: Android `💔 "<produto>" removido de Favoritos` e `↩ voltar: seta`;
iOS `↩ voltar: accessibility id:Back`; `🤍 Coração de "<produto>" sem preenchimento (icone 32x33)`;
nenhum `Conta suja`. Se um teste falhar entre favoritar e desfavoritar, procurar `🧹` no log e
o anexo `Favorito órfão na conta` no Allure.

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

### Bugs de teste no iOS — corrigidos e VALIDADOS no `CI iOS Run #8` (registro)

Os três vieram do `CI iOS Run #7` (5 runs de 1 device, todos os aparelhos executaram) e do run
local do Marcio. **Todos com causa medida em aparelho, nenhum por dedução.** Fica como
registro do diagnóstico; o resultado está na pendência "Correções de fluxo iOS" acima.

- **Nome do produto poluído — CORRIGIDO.** O predicate
  `name BEGINSWITH "Camisa" AND name CONTAINS "R$"` casa também com o **wrapper da tela**,
  cujo `name` agrega os labels dos filhos (`Camisas Filter and sort 152 products Camisa Manga
  Longa Slim...`). O guard `CONTAINS "R$"` existia para descartar o *título*, não o
  *container*. Medido na listagem real: 10 nós de **402pt** (wrapper), 3 de **370pt** (linha da
  grade) e os cards de **185pt**. Filtro: largura < 60% da janela.
- **"Banner do Insider não fechou" — era o `Close` FANTASMA, e ele tocava em Meus Pedidos.**
  O nó do `Close` sobrevive escondido na árvore e o `isDisplayed()` do WDA mente sobre ele. O
  `elementClick` então tocava o rect velho — `[318,286 24x24]`, centro **(330,298)** — que cai
  dentro do `menu-card` "My Orders" `[205,222 181x105]`, e de nenhum outro. Confirmado no vídeo
  do iPhone 15 Pro Max (t≈184s, tela "Meus pedidos" entrando por cima do Account Menu) e no
  log, onde as 3 tentativas usam o mesmo element id e os 3 cliques retornam `RESULT null`.
  Correção: `fechaBannerIOS()` **não clica e não lança** — só registra rect do `Close` e estado
  do `InsiderWKWebView`/`InsiderTemplateWindow`, para fechar o discriminador de presença num
  próximo run. O banner real foi visto **uma vez em 8 sessões**; o falso positivo derrubava 3
  de 5 aparelhos.
- **Desfavoritar clicava na SACOLA — CORRIGIDO.** Medido em sessão de Remote Access
  (2026-09-10), tela de Favoritos: card `[16,131 181x457]` com **dois** `action-button`,
  coração em **x=155** e sacola em **x=21**; o `class chain [...][1]` resolvia para **x=21**.
  Ou seja, o toque mandava o item para a sacola, a lista não mudava, e o erro dizia "o conteúdo
  não mudou depois do toque no coração". Correção: coração pelo **maior x dentro do rect do
  card**, e poll de 30s no lugar do `pause(3000)` (desfavoritar é chamada de backend).
- **Guarda do coração na listagem comparava só o `x` — CORRIGIDO.** Bug latente, escrito no
  commit `8536e92`: a grade tem duas colunas, então todo card da mesma coluna divide o mesmo
  intervalo de `x` e o coração da linha de baixo passava na checagem. Resultado seria ler o
  nome de uma camisa e favoritar outra. Agora compara `x` e `y`.

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
