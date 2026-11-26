# ROADMAP

## Levantamento contínuo do app 🔄 (sem fim — fora da sequência de marcos)

O app está em desenvolvimento: cada versão nova traz features e mudanças que precisam ser verificadas e validadas.
Por isso o levantamento de elementos não é um marco com fim (deixou de ser o M5 em 2026-10-21, decisão do Marcio).
A cada build novo: captura nas duas plataformas (`mobile-ui-inspector` + `mobile-draft-writer`), docs reescritos para
esse build (regra "um build só" do `REQUIREMENTS.md`) e esta tabela atualizada — só a ÚLTIMA versão de cada plataforma.

Como funciona a cada versão nova (Marcio, 2026-10-21):
1. O time do app avisa o Marcio das modificações da versão; ele testa essas mudanças na mão.
2. O Marcio passa para o Claude o que mudou. Só ele avisa quando algo foge do padrão.
3. **Premissa:** a versão nova deriva da anterior e segue os mesmos padrões (ids, fluxos, telas). O Claude não refaz
   o levantamento do zero nem trata como suspeito o que não foi avisado.
4. O Claude levanta as telas/fluxos das modificações informadas, ajusta a automação que elas afetam e confere o
   caminho dos 4 testes no build novo, para pegar o que pode ter passado no teste manual (regressão de id, fluxo ou
   comportamento); o que divergir vai para o Marcio, com a evidência.

| Plataforma | Versão | Build | Profile (EAS) | Data | Evidência |
|---|---|---|---|---|---|
| Android | 1.23.1 | 557 (e 553) | não conferido no EAS | 2026-11-18 | 557: `captures-2026-11-18-build557-sheet-adicionado/` (draft 14) e `captures-2026-11-18-build557-insiderlayout/` (draft 44); 553: `captures-2026-11-18-build553-link-checkout/` e `captures-2026-11-18-build553-cenarios-40-42/` (`ANALISE-COMPARTILHAR-CARRINHO.md`). Só compartilhar carrinho, sheet "adicionado" e `insiderLayout`; o resto dos drafts segue no 534/530 (`android/00-INDICE.md`) |
| iOS | 1.23.2 | 408 | não conferido no EAS | 2026-11-24 | `drafts/app-migrado/ios/captures-2026-11-24-endereco/` (Remote Access; só cadastro e edição de endereço, `NOTAS.md`). Compartilhar carrinho segue no 1.23.1/403; o resto dos drafts segue no 377 (`ios/00-INDICE.md`) |

Profile conferido no EAS (API GraphQL `api.expo.dev`, `EXPO_TOKEN`/`EXPO_PROJECT_ID` do `.env`, campo `buildProfile`).
O Android 1.22.3/514 (production, 2026-10-22) é build de ROLLBACK, não de teste (Marcio, 2026-10-22): não entra
nesta tabela nem na documentação de elementos.

**Versão 1.23.0 (próxima):** roteiro de 15 itens das notas de release, riscos e pontos que tocam a automação em
`.planning/TESTAR-V1.23.0.md`.

**A testar na próxima versão (falhas do `06-compartilhar-carrinho` no CI Run #52, 2026-11-09, Android 1.22.9/534 e
iOS 1.22.9/377; detalhes no `STATE.md`):**

| # | Plataforma / aparelho | O que testar | Por quê |
|---|---|---|---|
| 1 | Android, Samsung do Device Farm | Ler o link copiado sem `mobile: setClipboard` (área de transferência ou prévia do menu nativo) e se o Copy existe no menu de compartilhar dos Samsung | `Unknown mobile command "mobile: setClipboard"` em S23U, S23+, S24U, S24+ e S25U: o Appium do host não tem o comando. **Corrigido em 2026-11-10 (endpoint antigo do Appium nesse erro), não rodado** |
| 2 | Android, S26 Ultra | Botão de compartilhar (`share-bag-cta`) com 2 produtos na Mochila | Não apareceu no Run #52; causa não levantada |
| 3 | iOS, todos | Tempo do teste inteiro (limite de 15 min por teste) | iPhone 13, 14 e 14 Pro Max estouraram os 900 s no cenário 40; o iPhone 15 levou 12 min até o cenário 4. **Corrigido em 2026-11-10 (limite do `06` em 40 min), não rodado; o job do Device Farm tem limite de 60 min** |
| 4 | iOS, iPhone 15 Pro Max | "Copy" no menu nativo de compartilhar (`actionGroupCell`) | "Copy não apareceu no menu nativo" |
| 5 | iOS, iPhone 15 | Mochila antes e depois do Copy: só os produtos adicionados pelo teste | Apareceu o `479721` (tamanho UN) depois do Copy, sem origem provada |
| 6 | iOS, iPhone 14 Pro Max | `02-compra-pix`: voltar até Categorias | "a tela atual não tem seta de voltar"; não investigado |

**Próximo levantamento:** o próximo build que o Marcio instalar. O report de 2026-11-06 cita o build 377 também no Android;
não está escrito se existe build Android com esse número (o Android levantado é o 534).

## M10 — Atualizações e melhorias 🔄 (sem fim — fora da sequência de marcos)

Aberto em 2026-11-04 (Marcio). Marco contínuo, como o levantamento acima: reúne as atualizações e melhorias da
automação do app e não tem data de término. Cada melhoria entra aqui como um item e só é feita com ordem do Marcio.

| Item | Situação |
|---|---|
| Resumo do job no GitHub: falha só quando o timeout de 120 min impede os testes de rodarem; erro de teste só no Allure | ✅ no código (2026-11-16), não rodado no CI |
| Pix e cartão até a última tela antes de finalizar, sem criar pedido | ✅ rodado no CI Run #42 (2026-11-05, Android 1.22.9/534): `03` 6/6, `02` 5/6 (falha do S24+ por banner, `STATE.md`); iOS 5/5 iPhones |
| Coleção Especial: rolar até a parte não visível, tocar no link e validar a tela de destino pelo cabeçalho | ⬜ não iniciado |

### Melhoria — Coleção Especial até o destino do link (Marcio, 2026-11-06)

O `05-colecao-especial` hoje só abre a tela da coleção e valida a chegada. Pedido: depois de chegar, rolar até a parte
que não está visível, tocar no link e validar que ele leva à tela correta da coleção, pela mensagem do cabeçalho.
Vale para as duas plataformas.

Antes de escrever:

- **iOS 1.22.9/377 capturado (draft iOS `50`, caps. 12–18).** O "Saiba mais" não existe na árvore; o toque foi por coordenada
  e abriu a listagem "Aramis em Milão" (30 produtos). O cabeçalho do destino é lido: `header-back-button` com label
  "Aramis em Milão". Tocar no `editorial-group-0` não foi testado.
- **Sem elemento não há como tocar:** o teste não pode usar coordenada fora das exceções aprovadas. Falta testID do time do
  app no link ou decisão do Marcio. Android: link não capturado no build atual; no 530 ele também estava só na foto.
- **Validar o cabeçalho é pedido do Marcio para este teste.** A regra geral do `REQUIREMENTS.md` é não validar texto;
  falta definir se o valor esperado é fixo ou lido da tela anterior, e o que acontece quando o idioma muda.
- O nome do arquivo, do teste e dos métodos continua sem nome de pessoa; só o testID do app mantém o nome.

### Melhoria — Pix e cartão param antes de finalizar (2026-11-04)

Decisão do Marcio: o `02-compra-pix` e o `03-compra-cartao` vão até a última tela antes de finalizar, **sem criar
pedido**, e as etapas seguintes saem dos testes. A última tela é o Resumo (botão `summary-finalize-purchase`).
Vale para as duas plataformas.

| Spec | Antes | Agora |
|---|---|---|
| `02-compra-pix` | validava o Resumo, tocava em finalizar e criava o pedido | para depois de `validar valores do resumo (com desconto do Pix)` |
| `03-compra-cartao` | validava o Resumo, tocava em finalizar e criava o pedido (cartão fake) | para depois de `validar valor dos produtos no resumo` |

Etapas que saíram:

- `02`: `finalizarPedido`, `validarQrCode`, `numeroDoPedido`, `copiarCodigo`, `verMeusPedidos`, `sairParaHome` e
  `validarAlertaPedido`.
- `03`: `finalizarPedidoComCartao`, `abrirMeusPedidosDepoisDaRecusa`, `numeroDoPedidoComCartao` e a validação do total
  em Meus pedidos.

Decisões e riscos da implementação (plano aprovado pelo Marcio em 2026-11-04,
`plans/2026-11-04-pix-cartao-ate-o-resumo.md`):

- **Mochila:** sem limpeza nova. O `clearApp` do `afterTest` esvazia a Mochila: conferido pelo Marcio no AVD em
  2026-10-14. Em CI e no iOS do app migrado isso não foi conferido, e no Remote Access o `afterTest` só faz
  `terminateApp`. O `03` falha com erro nomeado se a Mochila não tiver 1 item. O `esvaziarMochila()` continua no
  `CheckoutPage`, sem chamada.
- **Cobertura que deixa de existir:** QR code do Pix, cópia do código, recusa/antifraude do cartão, Meus pedidos com
  pedido e alerta do pedido na Home.
- **Código removido:** `PedidoPage.ts`, os métodos de finalizar do `CheckoutPage` e o `validarAlertaPedido` do
  `HomePage`. Continuam no histórico do git.
- **Run real:** feito no CI Run #42 (2026-11-05), nas duas plataformas (`STATE.md`).

## Marcos concluídos (M1–M8) ✅

M1, M2, M3, M4, M6, M7 e M8 concluídos, e o histórico do levantamento (era o M5): texto completo em `.planning/ROADMAP-HISTORICO.md` (fora do carregamento automático).

## M9 — Ampliar a cobertura com novos cenários ⬜ planejamento

Aberto em 2026-10-21 (Marcio): os 4 testes (`01`–`04`) cobrem boa parte do app, e outras funcionalidades serão
validadas no futuro. **Escolhidos:** Richard Stad Selection (2026-11-03, rodado no CI Run #42), Compartilhar carrinho (2026-11-06, escrito, não rodado) e Criar conta + cadastro e alteração de endereço com CEP inválido e válido (2026-11-23, elementos capturados; teste escrito em 2026-11-25 dentro do `04-criar-conta`; passou no AVD (Android 1.23.3/562) e no iOS (Remote Access) em 2026-11-25, CI não rodado, `STATE.md`). O resto
da lista abaixo continua backlog, sem escolha: tirado da seção 3 do `cenarios-gherkin-2026-09-28.pdf`
(funcionalidades que os 4 testes não percorrem) e das pendências registradas; quais entram, em que ordem e com que
massa é decisão do Marcio, cenário a cenário.

### Cenário escolhido — Menu → Richard Stad Selection (2026-11-03)

Navegação: abrir o Menu, tocar em Richard Stad Selection e validar que a tela de destino carregou. **Escrito em
2026-11-04 por ordem do Marcio (`test/specs/05-colecao-especial.spec.ts`), rodado no CI Run #42 (2026-11-05): Android 6/6, iOS 5/5 iPhones.**
Escrito sem esperar a captura do Android 531.

Android, build 1.22.9/530, 2026-11-03, `captures-2026-11-03-m9-colecao-especial-e-preco-100/` (Menu deslogado, captura `18`):

- Abrir o Menu: `tab-menu`.
- Toque: `menu-item-richard-stad`, `content-desc` "Richard Stad Selection", bounds `[0,1754][1080,1901]`.
- Destino (capturas `20`–`22`): tela editorial, não é WebView. Ids: `editorial-home-root`, `editorial-group-0`
  (hero), `editorial-group-1` (altura zero), `header-back-button`, `editorial-tab-home`, `editorial-tab-categories`,
  `editorial-tab-bag`, `editorial-tab-menu`. A Home comum usa `tab-home` / `search` / `heart`, sem `header-back-button`.
- O título "RICHARD STAD SELECTION", o texto e o "Saiba mais" estão só na foto. Não há `text` nem `content-desc`
  com esse nome. Rolagem vertical e horizontal não abriu outra tela. BACK volta ao Menu.

iOS, build 1.22.9/372, 2026-11-04, `drafts/app-migrado/ios/50-colecao-especial.md`: `menu-item-richard-stad` abre o destino,
deslogado e logado, sem WebView. Chegada: `editorial-tab-home` com `header-back-button`; `editorial-home-root` também existe
na Home e vem `visible=false`, então não serve de âncora. `header-back-button` volta ao Menu. O teste não faz swipe horizontal:
o swipe horizontal abriu a listagem "2150 - Expert XP", causa não confirmada, e não deve contar grupos. O Android 531 ainda não foi
capturado.

### Cenários escolhidos — Compartilhar carrinho (2026-11-06)

Decisão do Marcio: o que o app faz hoje é tomado como certo, e aqui só entra o que a automação valida. Android 1.22.9/534,
AVD, evidência em `drafts/app-migrado/android/captures-2026-11-06-compartilhar-carrinho/`, `-2/` e `-3/`, análise em
`drafts/app-migrado/android/ANALISE-COMPARTILHAR-CARRINHO.md`, Gherkin em `cenarios-compartilhar-carrinho-2026-11-06.md`.
**Escrito em 2026-11-06 (`test/specs/06-compartilhar-carrinho.spec.ts` + `CompartilharPage`), só `tsc`, NÃO RODADO, nas duas plataformas.**

| Nº | Cenário | O que o teste valida |
|---|---|---|
| 1 | Botão ausente com a Mochila vazia | `share-bag-cta` ausente |
| 2 | Botão com 1 item | `share-bag-cta` presente |
| 3 | Botão com mais de 1 item | `share-bag-cta` presente |
| 4 | Toque gera o link e abre o menu nativo | `android:id/resolver_list` aberto e link lido por Copy + área de transferência |
| 7 | Link sem CDV | URL só `/share-bag/<uuid>`, sem query |
| 12 | Link sem dados pessoais | URL só `/share-bag/<uuid>`, sem query |
| 13 | Compartilhar não altera a Mochila | mesmos cards `wake-product-card-bag-*` e quantidades, antes do toque e depois do Copy |
| 5 | Link traz os produtos e tamanhos | `shared-bag-item-<id>` e tamanho na "Shared Backpack"; a quantidade é conferida na Mochila, depois de "Add all" |
| 17 | Link abre o carrinho no app | tela "Shared Backpack" com `shared-bag-item-<id>` e `shared-bag-add-all` |
| 22 | Carrinho visível sem login | `shared-bag-item-<id>` deslogado |
| 19 | "Add all" soma à Mochila | cards e quantidades na Mochila depois de `shared-bag-add-all` |
| 40 | Adicionar produto diferente depois do carrinho recebido | novo card na Mochila |
| 41 | Remover item depois de adicionar | card sumiu, por `wake-remove-item` |
| 42 | Alterar quantidade de item vindo do link | quantidade muda por `add-button` e `remove-button` |
| 45 | Link inválido | `shared-bag-unavailable` e, depois de "Go to store" (`pressable`), `editorial-home-root` |

**Executados por Appium no AVD em 2026-11-06 (`captures-2026-11-06-compartilhar-carrinho-3/`, 00–60): 15/15 passaram no app atual, sem coordenada.**

Mecanismos conferidos para os testes:

- **Abrir o link:** `mobile: deepLink` com `aramisnova://share-bag/<uuid>` e `package: com.aramis.ecomm`, logado e deslogado.
  A URL copiada é convertida para esse formato; o https por `mobile: deepLink` dá "Page not found".
- **Ler o link:** `setClipboard` com sentinela antes do Copy e `getClipboard` depois, porque a área de transferência do
  emulador é compartilhada com o host.
- **Quantidade:** `//*[@resource-id="remove-button"]/following-sibling::android.widget.TextView[1]`, relativo ao card.
- **Rolar a Mochila:** `mobile: scrollGesture` no container `scrollable`.

**iOS 1.22.9/377, Remote Access, 2026-11-06 (`drafts/app-migrado/ios/captures-2026-11-06-compartilhar-carrinho/`, 00–61): 15/15 passaram.**

- **Abrir o link:** `mobile: deepLink` com `bundleId`, igual ao Android nos demais parâmetros.
- **Ler o link:** `getClipboard`/`setClipboard` não funcionam no aparelho. O caminho é Copy (`actionGroupCell`), colar no campo de
  Busca e ler o `value`. Desde 2026-11-24 o texto copiado pode ser uma frase mais a URL (a frase não é fixa); o teste acha a
  URL dentro do texto (`CompartilharPage`, não rodado de novo; `STATE.md`).
- **Card:** botões e quantidade são irmãos de `wake-product-card-bag-<id>`, por `following-sibling`.
- **Sheets da PDP:** por fração da janela, exceção já aprovada.

O cenário 13 compara a Mochila antes e depois do Copy, que fecha o menu nativo nas duas plataformas; não há cancelamento nem coordenada.
Mochila depois do logout no Android: não conferido. Copy nos Samsung do Device Farm: não conferido.

### Cenário escolhido — Criar conta + cadastro de endereço com CEP inválido e válido (2026-11-23)

Ordem do Marcio (2026-11-23): criar uma conta e, com ela, cadastrar um endereço, primeiro tentando um CEP inválido e
depois salvando com um CEP válido. **Elementos capturados no Android 1.23.1/557** (AVD,
`drafts/app-migrado/android/captures-2026-11-23-build557-cadastro-endereco/`, `NOTAS.md`, draft `39`); teste **escrito em 2026-11-25 dentro do `04-criar-conta`; passou no AVD (Android 1.23.3/562) e no iOS (Remote Access) em 2026-11-25, CI não rodado** (`STATE.md`). iOS capturado em 2026-11-24 no 1.23.2/408 (`drafts/app-migrado/ios/captures-2026-11-24-endereco/`, `NOTAS.md`): o formulário não tem os testIDs do Android (`address-zip-input` e os demais campos, fora `address-state-input` e `address-save-button`). Decisão 1 fechada: entrou no `04-criar-conta`.

Caminho no app (Android 557): Criar Conta (igual ao `04`) → produto na Mochila → `bag-checkout-button` → formulário
"New delivery address" direto (a conta nova não tem endereço; Menu e My Data não têm endereço).

| Decisão | O que o teste valida (sem texto) |
|---|---|
| CEP inválido (`00000000`) | erro no campo (XPath estrutural: `SvgView` logo depois do contêiner do `address-zip-input`) e `address-save-button` `enabled=false`, mesmo com todos os outros campos preenchidos; o toque não sai do formulário |
| CEP válido | erro some; o app preenche `address-street-input`, `address-state-input`, `address-city-input` e `address-neighborhood-input`; com Número e Destinatário, `address-save-button` `enabled=true`; o toque leva à Entrega (`delivery-option-slas`) |

Não conferido: CEP incompleto (`1234`) não mostra mensagem no Android (só o Save desabilitado; decidir se entra); no iOS
não foi capturado. Massa de CEP usada: válido `01310100`, inválido `00000000`, edição `01226030`. iOS da tela: capturado
em 2026-11-24 (drafts `16` e `51`); o plano guarda o que não pode ser copiado do Android.

**Alterar endereço com CEP inválido e CEP válido novo (ordem do Marcio, 2026-11-23).** Levantado no Android
1.23.1/559 (`drafts/app-migrado/android/captures-2026-11-23-build559-endereco/`, `NOTAS.md`, drafts `16` e `39`; o 557,
com o bug, ficou em `captures-2026-11-23-build557-alterar-endereco/` e no `RELATORIO-ENDERECO-DEV-2026-11-23.txt`);
teste **escrito em 2026-11-25 dentro do `04-criar-conta`; passou no AVD (Android 1.23.3/562) e no iOS (Remote Access) em 2026-11-25, CI não rodado** (plano: `plans/2026-11-23-teste-endereco.md`, `STATE.md`). No iOS 1.23.2/408 o mesmo caminho abre a lista ("Alterar" sem id, `pressable` "Cadastrar novo endereço") e o formulário em modo Update; o CEP novo preenche a rua, o Update fica habilitado e o toque não sai da tela nem mostra carregando (gravação não conferida, `NOTAS.md`). Caminho: Entrega →
"+ Add or choose another address" (ou login → Mochila → `bag-checkout-button`) → Meus endereços → "Alterar" (sem id;
XPath por irmãos, draft `16`) → o mesmo formulário, com o `address-save-button` em modo Update.

| Decisão | O que o app faz (559) | O que o teste validaria (sem texto) |
|---|---|---|
| CEP inválido (`00000000`) | erro no campo, Update `enabled=false`, toque não faz nada | erro pelo XPath estrutural, Update desabilitado, continua no formulário |
| CEP válido novo (`01226030`) | Rua e Bairro trocam pelo CEP; Update grava (2 de 2), mostra carregando e vai à **Entrega** com o CEP novo; a lista tem o mesmo cartão editado | chegada na Entrega (`delivery-option-slas`) e, ao reabrir "Alterar", o CEP do campo igual ao digitado (dado) |

No 557 o Update com CEP novo não gravava nem dava retorno (corrigido no 559, que só mostra carregando, sem mensagem de
sucesso). O `enabled` do Update não é confiável no 559: o teste decide pelo destino.

Regras que valem para cada cenário novo (`REQUIREMENTS.md`):
- **um teste por decisão**; o que repete o caminho de um dos 4 testes vira asserção dentro dele, e nenhum teste é
  juntado ou removido sem ordem do Marcio para aquele spec;
- cada teste roda em todos os devices do CI (11 hoje), então o tempo se multiplica: o custo entra na escolha;
- **captura antes de escrever** (inspector + draft-writer, nas duas plataformas, no build atual);
- uma suíte só, sem texto/idioma, sem produto fixo, sem coordenada fora das exceções do iOS.

### Backlog (o que os 4 testes NÃO cobrem hoje)

| Área (PDF, nº de cenários) | Coberto hoje | Falta | Dependência |
|---|---|---|---|
| Login — Recuperação de senha (parte dos 7) | login válido e e-mail inválido (`02`) | "Esqueci a senha", senha errada, conta inexistente | e-mail Gmail plus que recebe a redefinição |
| Busca por palavra-chave (3) | 1 busca com resultado (`02`) | busca sem resultado, limpar busca | `search-input`/`search-clear-button` sem testID no Android |
| Filtros de busca (7) | nada | combinar, contar e limpar filtros | captura das telas de filtro |
| PDP (7) | tamanho, adicionar, carrossel (`02`/`03`) | casos restantes do PDF (a mapear) | — |
| Mochila (16) | só adicionar | quantidade (+/−), remover, estado vazio | — |
| Mochila — cupom (6, pendentes de massa) | nada | válido, inexistente, expirado, condicional | cupons de teste do time do app |
| Mochila — estoque (2) e frete grátis (3), pendentes de massa | nada | limite de estoque, barra de frete grátis | produto com estoque conhecido; valor mínimo do frete |
| Checkout — Cadastro de endereço (7) | nada (as contas do CI já têm endereço); novo endereço e CEP inválido escolhidos em 2026-11-23 (acima) | campos obrigatórios restantes | conta nova (sem endereço) resolve a massa; campos com testID no 557 |
| Menu — Meus Dados (9, sem o de conectividade) | nada | editar e validar campos | captura da edição |
| Menu — Configurações de comunicação (parte dos 4) | nada | 4 toggles de comunicação | a tela existe (draft iOS 48), mas os toggles estão fora da árvore no iOS; Android não capturado no 512 |
| Menu — Estado vazio de Meus pedidos e Favoritos (2) | Favoritos vazio ao final do `01` | Meus pedidos vazio | conta sem pedido |

Fora do backlog (decisões já tomadas): Exibição em pt-BR (5, idioma não é validado), Seção DEV (2), falha de
conectividade em Meus Dados (1), "Voltar" no onboarding. **Pagamento com cartão APROVADO: nunca será implementado**
(Marcio, 2026-10-21) — por segurança e por ser inviável usar cartão válido neste ambiente; o cartão é coberto só pela
recusa/antifraude do `03-compra-cartao`, com cartão fake. Não planejar nem perguntar. **Exclusão de conta: fora** —
o app não tem a opção (Marcio, 2026-10-21; a captura de Meus dados, draft Android 25, também não mostra exclusão).

### Não está escrito ainda
- Quais áreas entram primeiro e quantos testes novos (o limite de tempo do CI por device).
- Se os cenários novos entram no CI a cada teste ou em bloco.
- A origem da massa: cupons, estoque, frete, conta sem endereço/sem pedido.
