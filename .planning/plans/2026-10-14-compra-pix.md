# Jornada completa de compra com Pix (spec `02-compra-pix`)

**Status:** escrito em 2026-10-14 (working tree, não commitado). **Passou no AVD-S24 em 2026-10-14
20:43–20:50** (4º run do Marcio; ver "Execuções"). Só Android.

## O cenário (do Marcio, 2026-10-14)

Do primeiro acesso até o retorno à Home com o pedido aguardando pagamento: onboarding e termos →
print da versão/build no rodapé do Menu → login passando pela mensagem de e-mail inválido → Menu
logado → Categorias → lupa → busca "óculos" → comprar o 1º resultado → carrossel de indicação com
scroll lateral → continuar comprando → voltar até Categorias → Roupas › Camisas → comprar a 1ª
camisa com tamanho → voltar → Mochila → finalizar compra → endereço → entrega → Pix → resumo →
**validação dos valores** → prosseguir com a compra → QR code → copiar o código → Meus pedidos com
o número → Home com o alerta "aguardando pagamento". 35 passos; os comentários "Passo N" do spec
seguem essa numeração.

## Como rodar

```
npx wdio run ./wdio.conf.ts --spec test/specs/02-compra-pix.spec.ts
```

Não usar `npm run wdio:android -- --spec ...` no PowerShell: o `--` não chega ao wdio, o filtro se
perde e a suíte inteira roda (aconteceu no 1º run, com a POC `00` falhando junto).

**O teste finaliza uma compra de verdade.** Cada execução que passa do passo 29 cria pedido(s) Pix
reais "aguardando pagamento" na conta. Roda no Device Farm também: a guarda que o pulava lá foi
colocada sem pedido do Marcio e removida em 2026-10-16.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `test/specs/02-compra-pix.spec.ts` | o cenário; guarda os valores da compra e valida no passo 29; limpeza da Mochila em falha |
| `test/pageobjects/BuscaPage.ts` | lupa de Categorias (XPath), campo de busca, Enter, resultados |
| `test/pageobjects/ProdutoPage.ts` | `lerPrecoDoProduto()`, `comprar()` (tamanho + adicionar), carrossel, continuar comprando, `voltarAteCategorias()` |
| `test/pageobjects/CheckoutPage.ts` | Mochila, endereço, entrega, Pix, `lerValoresDoResumo()`, `finalizarPedido()`, `esvaziarMochila()` |
| `test/pageobjects/PedidoPage.ts` | QR code, número do pedido, copiar (clipboard), Meus pedidos, voltar à Home |
| `test/pageobjects/HomePage.ts` | + `validarAlertaPedido(numero)` |
| `test/pageobjects/LoginPage.ts` | ids do build atual (Android); + `completarEmail()`, `validarEmailInvalido()` |
| `test/pageobjects/PerfilPage.ts` | logado = `menu-user-header`; Sair = `menu-item-logout`; + `anexarRodapeDoMenu()` |
| `test/pageobjects/BasePage.ts` | aceites do onboarding com os ids novos; acesso ao Login = `menu-login-button` |

As trocas de id no `BasePage`, `LoginPage` e `PerfilPage` valem só para o Android (o ramo iOS não
mudou). O `accept-button`, o `pressable` do Login e o `menu-card` não existem mais no build atual.

## Valores da compra — guardados no teste e validados antes do Pix

Pedido do Marcio: o valor de cada produto fica salvo no teste, a soma também, e a soma é validada
de verdade — base para calcular cupom quando o teste aplicar um.

- **Nenhum preço fica fixo no código.** A cada execução os preços são LIDOS da tela e o cálculo é
  feito com eles; os produtos comprados (1º resultado da busca, 1ª camisa) e os preços mudam com o
  catálogo, e o teste acompanha.
- **Preço de cada produto:** `produtoPage.lerPrecoDoProduto()` roda como step próprio **antes** do
  clique em comprar e lê o nó `price` da PDP (único na PDP, conferido nas capturas de 2026-10-14).
  Vai para as variáveis `precoOculos` e `precoCamisa` do spec, que começam em 0 e são preenchidas
  na execução.
- **Desconto de cupom:** `descontoCupom = 0` enquanto não há cupom. Quando o teste aplicar cupom, o
  desconto calculado entra nessa variável.
- **Desconto do Pix — regra confirmada pelo Marcio no site da empresa (2026-10-14):** pagamento com Pix
  tem **10% de desconto**, e **o frete entra na base**. No spec: `DESCONTO_PIX = 0.10`;
  base = produtos − cupom + entrega; desconto do Pix = 10% da base; total = base − desconto do Pix.
- **Passo 29 — "validar valores do resumo (com desconto do Pix)"**, no resumo, antes do clique que leva
  à tela do Pix:
  1. Produtos do resumo = `precoOculos + precoCamisa`
  2. Descontos do resumo = cupom + desconto do Pix
  3. Total do resumo = base − desconto do Pix
  4. Total do botão da tela de pagamento = o mesmo total com desconto do Pix (antes era só aviso)

  Qualquer divergência falha o teste **antes** de finalizar (nenhum pedido criado), com esperado e
  lido na mensagem. Nas rodadas 2 e 3 de captura e nos runs do Marcio o resumo mostrou Descontos
  R$ 0,00 — com a regra, o teste passa a falhar aqui até o app mostrar o desconto do Pix no resumo.
- **POR ORA (Marcio, 2026-10-14, run das 23:10): no resumo só o item 1 (valor dos produtos).** O resumo
  do app não mostra o desconto do Pix (Descontos 0 e Total 1.499,80, esperado 149,98 e 1.349,82), então os
  itens 2, 3 e 4 estão desligados pela chave `VALIDAR_DESCONTO_PIX_NO_RESUMO = false` no spec (o step se
  chama "validar valor dos produtos no resumo"). O desconto do Pix é validado só na tela do Pix. Quando
  os devs corrigirem o resumo, trocar a chave para `true`.
- **Tela do Pix — "validar valor da tela do Pix (com desconto do Pix)":** o "Valor a pagar" tem que ser
  o total com desconto do Pix calculado no passo 29. Com a compra dividida em 2 pedidos, a tela mostra
  só um (R$ 629,91 nas capturas) e a checagem falha.
- **No relatório:** parâmetros do teste no Allure (Preço óculos, Preço camisa, Soma dos produtos,
  Total esperado) e o anexo "Valores da compra" com a conta inteira e o que o resumo mostrou.
- **Valor a pagar da tela do Pix = total do resumo (pedido do Marcio, 2026-10-14):** step
  "validar valor da tela do Pix com o resumo", logo depois do número do pedido. `PedidoPage.valorAPagar()`
  lê o TextView sem id com "R$" no bloco do `wake-pix-copiar`. Com o app dividindo a compra em 2 pedidos,
  a tela do Pix mostra só o valor de um (capturas: R$ 629,91 contra resumo R$ 1.499,80) — a checagem
  falha nesse caso, depois do pedido criado, com os dois valores na mensagem.
- **Evidências no relatório (pedido do Marcio, 2026-10-14):** anexo "Evidências da compra" no nível do
  teste (gravado no `finally`, passe ou falhe) com preços, soma, total do pagamento, valores do resumo e
  nº do pedido; parâmetros Pedido / Total do resumo / Total no pagamento; prints da PDP (com o preço),
  do Pagamento com Pix, do Resumo, da tela do Pix com o QR, de Meus pedidos e da Home com o alerta
  (`anexarPrint` em `test/utils/allure-helpers.ts`); o código Pix copiado vai como anexo de texto.
- **Leitura do resumo:** os 4 valores são TextViews sem id, lidos pelo formato "R$ n,nn" na ordem da
  tela. O "Valor total" fica atrás do botão fixo de finalizar e o Appium não o devolve sem rolar —
  `lerValoresDoResumo()` rola o resumo (até 3x) até achar os 4.

## Regras de segurança do teste

- **Finalizar é tocado UMA vez e nunca repetido** (`CheckoutPage.finalizarPedido`): cada toque cria
  pedido. Se a tela do Pix não abrir em 60s, falha sem tocar de novo.
- **`waitForIdleTimeout: 0`** é ligado antes de finalizar: a tela do Pix e a Home com o alerta têm
  cronômetro e, com a espera padrão, nenhum comando responde ali ("could not get idle state").
- **Limpeza da Mochila:** `esvaziarMochila()` (toca `wake-remove-item` até não sobrar
  `wake-product-card-bag-*`) é o último passo do caminho feliz e roda no `catch` se o teste falhar
  depois de pôr produto na Mochila e antes de finalizar (o app é reaberto antes). Falha na limpeza
  vira aviso "Produto na Mochila da conta" no relatório; o erro do teste é o que vale. Observação do
  Marcio: depois dos runs que falharam, a Mochila estava vazia — o `clearApp` do `afterTest` já a
  esvazia; a limpeza fica como garantia.
- **Limpeza DESATIVADA (Marcio, 2026-10-14):** as duas chamadas da limpeza (passo final e `catch`) e a
  função `limparMochila` estão comentadas no spec. O Marcio quer ver se a Mochila fica com item da
  execução anterior (ele acha que não). A evidência é o log do passo 22: `🎒 Mochila com N produto(s)` —
  N maior que 2 = sobrou item. O método `esvaziarMochila()` continua no `CheckoutPage`.
  Conferido pelo Marcio no app: Mochila vazia depois dos runs que falharam (antes do 4º run) e depois
  do run verde de 20:43. Até aqui, nenhum item sobrou entre execuções.
- **Tamanho:** os tamanhos do sheet são tentados em ordem até o botão de adicionar habilitar
  (o P da camisa não habilitou no 2º run; hipótese de falta de estoque, não provada).

## Elementos sem testID (XPath enquanto o id não chega)

Todos listados para o dev em `ELEMENTOS-SEM-TESTID.md`, seção 00, com o XPath usado:
seta de voltar da PDP, lupa de Categorias, mensagem de e-mail inválido, campo de busca, card do
endereço, valores do resumo, número e código do Pix, "Ver meus pedidos" (`pressable`) e o número do
pedido em Meus pedidos.

## Crash do app (instabilidade dos runs)

3 dos 9 runs de 14/10 morreram porque o app fechou sozinho (`RetryableMountingLayerException`,
react-native-reanimated) ao chegar na Home — relato em `BUG-CRASH-ANDROID.md` (raiz). O spec limpa o
buffer de crash do Android no início (`limparLogDeCrash`) e, se falhar com o app fechado, anexa o logcat
de crash e o print (`anexarCrashDoAppSeFechou`, em `test/utils/allure-helpers.ts`).

Correção no teste (2026-10-15, Marcio): o crash cai no toque em "Sign in" logo depois da sequência
do e-mail inválido. O login agora segue ritmo de pessoa — apaga o campo e espera 1 s, escreve o
e-mail completo, espera 2 s depois que a mensagem de erro some, e espera 2,5 s antes de cada toque
em "Sign in" (`LoginPage`). E o `entrar()` passou a conferir se o app continua aberto depois do
toque: se fechou, falha ALI ("O app fechou depois do toque em entrar"), não no `validarHome` 30 s
depois. Não validado em run ainda.

## Achados do app (para o dev)

- **Um toque em finalizar com 2 produtos criou 2 pedidos**, um por produto (rodada 1: #126885 e
  #126932; rodada 2: #127635 e #127673). A tela do Pix e o alerta da Home mostram só o primeiro.
  Pedido do Marcio feito à mão com 1 produto: 1 pedido (#127457).
- **QR do Pix intermitente:** não carregou na rodada 1 ("We could not load the PIX code right now",
  nem com "Try again"); carregou na rodada 2 e no teste manual do Marcio.
- **Resumo sem o desconto do Pix:** rodada 1 mostrou Descontos R$ 149,98 e total R$ 1.349,82; rodada 2
  mostrou Descontos R$ 0,00 e total R$ 1.499,80, embora o botão de pagamento e o código Pix cobrassem
  R$ 1.349,82.

## Execuções no AVD (Marcio)

| Hora (2026-10-14) | Até onde foi | Falha | Correção |
|---|---|---|---|
| 18:43–18:50 | suíte inteira (o `--spec` se perdeu no PowerShell); compra parou no passo 6 | mensagem de e-mail inválido não sumiu depois de anexar o restante do e-mail | `completarEmail()` grava o e-mail inteiro; comando com `npx wdio run` |
| 19:10–19:13 | passos 1–17 | tamanho P da camisa não habilitou o adicionar | tenta os tamanhos em ordem |
| 19:44–19:50 | passos 1–28 (sem pedido criado) | só 3 dos 4 valores do resumo (total fora da tela) | rola o resumo antes de ler; preço de cada produto lido na PDP e validado |
| **20:43–20:50** | **PASSOU, 35 passos** (limpeza da Mochila desativada) | — | — |

Run verde (20:43–20:50), valores lidos na execução: óculos 699,90 + camisa 799,90 = 1.499,80; entrega 0;
desconto esperado 0; resumo Produtos 1.499,80, Descontos 0, Total 1.499,80 — conferem. Aviso no relatório:
o botão de pagamento mostrava 1.349,82 (desconto Pix) e o resumo 1.499,80. Pedido nº **128763** (tela do
Pix e alto de Meus pedidos). Se esse toque também gerou um 2º pedido não foi verificado (o teste só
confere o pedido da tela do Pix).

**Vídeo do Allure limitado a ~3 min** (144–180 s nos três runs; limite de gravação de tela do
Android). O teste leva mais de 6 min, então o vídeo não cobre o fim. **Corrigido em 2026-10-14 (ordem do
Marcio):** `timeLimit` do `startRecordingScreen` do AVD local passou de 180 para 900 no `wdio.conf.ts`
(o Appium grava em pedaços de 3 min e junta com ffmpeg). Device Farm não muda. Ainda não validado em run.

## Onde parou (2026-10-15, madrugada) — retomar daqui

- **Estado do spec:** escreve, valida e finaliza a compra; passou 2x (20:43 e 21:58 de 14/10). Validações
  ativas: Produtos do resumo = soma dos preços lidos na PDP; valor a pagar da tela do Pix = total com
  desconto do Pix (10% de produtos − cupom + frete). Validação do desconto do Pix NO RESUMO desligada pela
  chave `VALIDAR_DESCONTO_PIX_NO_RESUMO = false` (o resumo do app não mostra o desconto — bug a levar ao dev).
  Limpeza da Mochila comentada (a Mochila não ficou com item entre execuções).
- **Esperado no próximo run que passar do login:** falha na tela do Pix (valor a pagar de 1 pedido só,
  R$ 629,91, contra R$ 1.349,82), porque a compra vira 2 pedidos.
- **Instabilidade:** crash do app ~2 s depois do toque em "Sign in", durante o spinner do botão, na troca
  para a Home (vídeo do run de 15/10 00:22). O teste agora acusa no `entrar()` e anexa o logcat. As esperas
  de ritmo de pessoa no login (apagar + 1 s, +2 s após a mensagem sumir, 2,5 s antes do "Sign in") NÃO
  evitaram o crash — **pendente decidir com o Marcio se ficam ou saem**.
- **PRÓXIMA SESSÃO — primeira tarefa (pedido do Marcio, 2026-10-15 madrugada):** reproduzir o crash do
  login no AVD **pelo `adb`, sem WDIO** — login (e-mail, senha, toque em "Sign in"), screencaps rápidos do
  spinner, checar `pidof com.aramis.ecomm` e `adb logcat -d -b crash`, logout e repetir (~6 tentativas; nas
  últimas, com a sequência do e-mail inválido como a automação faz). Saída em
  `.planning/drafts/app-migrado/android/crash-2026-10-14/repro-adb/`. Na madrugada de 15/10 a tentativa
  foi interrompida antes de mexer no AVD.
  **Feito em 2026-10-15 (manhã): o crash NÃO reproduziu pelo `adb`, 0 de 6 tentativas válidas** (3 diretas e 3
  com a sequência do e-mail inválido), com o mesmo PID do início ao fim e o `logcat -b crash` vazio. Outras 2
  tentativas foram invalidadas pelo banner do Insider sobre o Login. **Não vale como prova:** o script foi
  bem mais lento que o teste (dump antes de cada toque; ~24 s do e-mail ao Sign in), então não reproduziu o
  ritmo da automação. O Marcio vai rodar o teste. Detalhes em
  `drafts/app-migrado/android/crash-2026-10-14/repro-adb/RESULTADO.md`.
- **Run do Marcio em 2026-10-15 11:14–11:20 (AVD): passou do login sem crash e parou só na validação da
  tela do Pix, como esperado** — `Tela do Pix: valor a pagar 629.91 diferente do total esperado com desconto
  do Pix 1349.82 (desconto do Pix 149.98; pedido 134367)`. Todos os passos anteriores (login, busca, PDP,
  Mochila, checkout, finalizar, QR Code, número do pedido) passaram. A falha é o bug do app (compra vira 2
  pedidos), não do teste.
- **iOS (2026-10-15, tarde):** jornada Pix capturada no iPhone (build 349) até a Home, com o pedido finalizado
  (#139889 e #139933, QR não carregou). Drafts em `drafts/app-migrado/ios/` (12–18, 21, 26, 34–37). O ramo iOS
  do spec ainda não foi escrito; o que falta antes está no topo do `STATE.md` (item 3).
- **Pendentes de decisão do Marcio:** entrar no CI (Device Farm) ou não (cria pedidos reais);
  relatório de bug para os achados da compra (2 pedidos por compra, tela do Pix com 1 pedido, resumo sem
  desconto do Pix, QR intermitente) — o do crash já existe (`BUG-CRASH-ANDROID.md`).
- **Nada commitado.** Arquivos novos/alterados: `test/specs/02-compra-pix.spec.ts`, `test/pageobjects/{Busca,Produto,Checkout,Pedido}Page.ts`
  (novos), `BasePage`, `LoginPage`, `PerfilPage`, `HomePage`, `test/utils/allure-helpers.ts`, `wdio.conf.ts`
  (`timeLimit` 900 do vídeo local), specs 01–03 comentados, `ELEMENTOS-SEM-TESTID.md` (seção 00),
  `BUG-CRASH-ANDROID.md` (novo).

## Evidência

- `.planning/drafts/app-migrado/android/captures-2026-10-14-compra-pix/` — rodada 1 (`RESULTADO.md`,
  Parte 1 e Parte 2).
- `.planning/drafts/app-migrado/android/captures-2026-10-14-compra-pix-rodada2/` — rodada 2, 35/35,
  árvore da tela do Pix lida pelo Appium.
- `.planning/drafts/app-migrado/android/captures-2026-10-14-precos/` — conferência dos preços (sem
  finalizar): `price` único em cada PDP e igual ao `size-button` e ao `wake-unit-price` da Mochila; a
  soma das PDPs bateu com o Produtos do resumo; o "Valor total" só tem posição válida depois de rolar
  o resumo (1 swipe bastou); mesma divergência do desconto Pix (botão de pagamento com 10% a menos,
  resumo e Finalizar sem desconto, Descontos R$ 0,00).

## Instabilidades do app vistas na conferência de preços (não tratadas no teste)

- O 1º toque no 1º resultado da busca abriu "Page not found" (o mesmo sintoma do 1º toque em
  Notificações no build 500). O teste falharia em `abrirPrimeiroProduto()` com a PDP não aberta.
- A listagem de Camisas ficou mais de 1 minuto em skeleton antes dos cards.
- Ao adicionar a camisa, abriu o modal "The backpack took too long to respond" no lugar do sheet de
  produto adicionado, mas o item entrou na Mochila. O teste falharia em `comprar()` (sheet não
  apareceu).
- Tamanhos da camisa: P, M e GG não habilitam o adicionar; G, XGG e XXG habilitam — confirma o
  motivo da falha do 2º run (o P) e a escolha por tentativa em ordem.

## 2026-10-17 — Desconto do Pix só sobre produtos, validado no Pagamento e no Resumo (build 1.21.7/507)

**Motivo (Marcio, 2026-10-17):** a partir do build **1.21.7/507** a tela do Pix não mostra mais valor, e o
desconto de 10% incide só sobre os produtos (frete fora da base), mostrado antes do QR code.

**Evidência:** captura no AVD, build 1.21.7/507, `drafts/app-migrado/android/captures-2026-10-17-pix-desconto/`
(00–39, pedido real #165851; drafts 18, 32 e 38). Óculos 699,90 + camisa 799,90 = 1.499,80; entrega 0,00:
- Pagamento com Pix escolhido (cap. 34): `payment-wake-pix-discount` "10% off - R$ 1.349,82" (antes da
  escolha o id é `payment-wake-pix-discount-preview`, "... estimated"); `payment-submit-button` passa a ter o valor.
- Resumo (cap. 36): Produtos 1.499,80 | Entrega 0,00 | Descontos 149,98 | Valor total 1.349,82 (visível sem rolar).
- Tela do Pix (cap. 39): nenhum "R$".
- Limite: frete grátis, então a captura não separa "10% só dos produtos" de "10% com frete". A regra é a do Marcio.
- 1 toque em finalizar com 2 produtos criou 1 pedido só (até o 506 eram 2). Uma tentativa; não prova correção.

**Mudança (build 1.21.7/507):**
- `02-compra-pix.spec.ts`: base do desconto = produtos − cupom (antes: + entrega); sai a flag
  `VALIDAR_DESCONTO_PIX_NO_RESUMO`; o passo 29 exige Produtos, Descontos, Total do Resumo e que o valor com
  desconto do Pagamento e o total do botão sejam iguais ao Total; novo step `checkoutPage.lerDescontoPix()`
  depois do `selecionarPix()`; removido o step "validar valor da tela do Pix".
- `CheckoutPage.lerDescontoPix()` (novo): `payment-wake-pix-discount`, reserva `-preview`. No iOS o id depois
  da escolha não foi capturado (só o `-preview`, build 352): **não verificado no iOS**.
- `PedidoPage`: removidos `valorAPagar()` e o seletor `VALOR_A_PAGAR_PIX` (o elemento não existe no 507).
- Não mudou: `lerValoresDoResumo()`, `03-compra-cartao`, `wdio.conf.ts`, CI.

**Conferir no próximo run (Android 507 e iOS):** log `💠 Valor com desconto do Pix no Pagamento (...)` e
`✅ Resumo confere: preços dos produtos e desconto do Pix (10% só dos produtos), igual ao Pagamento`. Se falhar,
o erro do passo 29 lista cada valor divergente, e nenhum pedido é criado. Num run com frete pago, conferir que
Descontos = 10% só dos produtos.
