# Plano — falhas Android do 562 (CI Runs #60 e #51) — APROVADO (Marcio, 2026-11-26) e implementado; só `tsc`, não rodado

App: Android 1.23.3/562 (CI Run #60, 09:40, e #51, 15:29, 2026-11-26; mesmo código, commit `8a5cfaf` só apagou logs).
O CI Run #61 (557) repetiu as três falhas e, no `04`, quebrou na edição do endereço, como esperado no 557.

## Requisito

- `REQUIREMENTS.md`: "O teste não pode depender de nome de produto fixo"; "A falha tem que ser explícita e no passo certo";
  "Mesmo fluxo e mesma regra de validação nas duas plataformas".
- Ordem do Marcio (2026-11-26): os aparelhos pegam o mesmo produto e o mesmo tamanho; sem estoque, o teste passa ao
  próximo tamanho e ao próximo produto, card a card, até achar estoque ou acabar a lista. Ter 2, 3 ou 4 aparelhos na
  mesma camiseta é normal. O que saiu em 2026-11-18 foi o salto de 11 cards por aparelho, não a troca de produto.

## 1. Sem estoque: próximo tamanho, depois próximo produto, card a card

### Evidência
- Mesmo produto e tamanho em vários aparelhos ao mesmo tempo: camiseta Wafle Preto, card 0 da busca, com o log
  "com estoque: P, GG". No #51, o S25 Ultra tocou P, o adicionar foi dado como habilitado e o print mostra P marcado e
  "Add to cart" cinza. O S23 Ultra acabou no M, sem estoque. No #60, falharam a calça 38 e a camiseta P em 5 testes.
  No #61 (557), 6 testes com "sheet de produto adicionado não apareceu".
- Nesses casos o `comprar()` lança `Error` comum (`ProdutoPage.ts:356`). O `comprarNaPosicao` só troca de produto com
  `SemEstoqueError` (`:200`), então o teste para no 1º produto.

### Como funciona hoje (Android)
1. `primeirosCards()` (`device-index.ts:39`) devolve as posições 0, 1 e 2.
2. `comprarNaPosicao` (`ProdutoPage.ts:190`) abre a posição, lê o preço e chama `comprar()`. Se der `SemEstoqueError`,
   volta à listagem e tenta a próxima posição. Depois da 3ª, ou com qualquer outro erro, falha.
3. `comprar()` (`:283`) abre o sheet e o `escolherTamanho` escolhe o tamanho, pelo `size-button` habilitado. Então:
   - toca em adicionar até 2 vezes (45 s de espera cada) e espera o sheet de "produto adicionado" ou o modal de estoque;
   - com o modal, o tamanho entra em `recusados` e o teste tenta outro tamanho;
   - sem sheet e sem modal, lança `Error` e o teste falha (`:355-357`).
4. iOS (`comprarIOS`, `:641`): tamanho que não adiciona (sem sheet, sem modal) passa ao próximo tamanho (`:702`); sem
   nenhum, `SemEstoqueError`. Ou seja, o iOS já faz o que o Android não faz.

### Como vai funcionar
- **Alterado, só Android (`comprar`, `:355-357`):** quando o adicionar não abre o sheet nem o modal depois dos 2 toques,
  o tamanho é tratado como sem estoque, igual ao modal:
  - print "Comprar — tamanho X não adicionou" e log `⚠ Tamanho X: o adicionar não abriu o sheet nem o modal — tratado como sem estoque`;
  - o tamanho entra em `recusados`, o sheet é fechado (o bloco `:358-362` já existe) e o Comprar é reaberto;
  - o `escolherTamanho` ignora os recusados. Sem tamanho restante, lança `SemEstoqueError` (`:504`, já existe), e com isso o teste passa ao próximo produto.
  Isso iguala o Android ao iOS.
- **Alterado, nas duas plataformas (`comprarNaPosicao`):** deixa de parar na 3ª posição. Começa na posição recebida e
  segue card a card (0, 1, 2, 3…) enquanto o produto vier sem estoque. Para:
  - no 1º produto que adicionar;
  - no fim da lista: o card não é alcançado (`:179`, erro que já existe). Aí o erro final lista todos os recusados:
    "Comprar X: nenhum produto a partir do card N tinha tamanho com estoque até o fim da lista".
  Qualquer outro erro (PDP não abriu, sheet não abriu) continua falhando na hora.
- **Alterado (`device-index.ts`, `primeirosCards`):** passa a devolver só a posição inicial (`primeirosCards(inicio = 0)`).
  O nome do passo no Allure fica `comprarNaPosicao(0)`.
- **Alterado (`06-compartilhar-carrinho.spec.ts:110`):** `primeirosCards(3, ultima + 1)` passa a ser `primeirosCards(ultima + 1)`.
  Os outros specs (`02`, `03`, `04`, `06:73/86`) chamam `primeirosCards()` e não mudam.
- **Não muda:** a leitura do estoque pela árvore (Svg) e o critério do `size-button`. O que falhar por eles vira
  "próximo tamanho/produto", sem captura nova. A captura do P da Wafle fica dispensada.

### Riscos
- Cada tamanho que não adiciona custa até 2 × 45 s, e cada produto trocado custa a volta e a abertura da PDP (cerca de 20–30 s).
  Muitos produtos sem estoque podem estourar o limite do teste (`02`: 25 min; `06`: 40 min).
- Se o sheet de "produto adicionado" chegar depois dos 90 s, o próximo tamanho pode ir à Mochila também (2 itens). O `03`
  (exige 1 item) e o `06` (compara a Mochila) falhariam com mensagem própria. Risco baixo: no CI o sheet chega em segundos.

## 2. Número do endereço coberto pelo teclado (S23+ e S26 Ultra, `04`)

### Evidência
- #60, #51 e #61 (557): `elementClear` do `address-number-input` "wasn't found", no passo do CEP inválido.
- Print do #60: teclado numérico da Samsung aberto, que é mais alto que o Gboard, e o formulário parado no CEP.
- O toque no Número retorna OK e o campo sai da árvore. No AVD (Gboard) e nos outros 4 aparelhos passa.

### Como funciona hoje (`EnderecoPage.digitarAndroid`, `:206`, só Android)
- Se o campo não está na tela, rola para cima e depois para baixo; então toca, `clearValue` e `addValue`.
- Não confere se o campo continua na árvore depois do toque.

### Como vai funcionar (só Android; `digitarCampoIOS` não muda)
- **Novo:** depois do toque, confere se o campo continua na árvore.
- **Novo:** se o campo saiu, fecha o teclado (`fecharTeclado`, `:94`, já existe), espera o campo voltar (até 5 s) e faz
  `clearValue` + `addValue` sem tocar de novo.
  - Por quê: o `addValue` do UiAutomator2 grava o texto no campo sem depender do teclado. Sem teclado, o campo volta à
    árvore: no print do erro do CEP ele está na tela.
  - Log `⚠ <id>: o campo saiu da árvore depois do toque (teclado por cima) — fechando o teclado e digitando`.
- **Novo:** nesse caminho, o valor é conferido pelo `textoDoCampo` (`:223`, já existe). Se não bater, a falha é explícita:
  "Endereço: o campo <id> ficou "<lido>", digitado "<valor>"". Se o campo não voltar em 5 s, a falha também é explícita,
  com print.
- Não verificado no aparelho: o teclado da Samsung não existe no AVD, então a prova é o run do CI no S23+ e no S26 Ultra.

## 3. Botão de compartilhar fora da tela (S26 Ultra, `06`)

### Evidência
- #60 e #51: depois de "quantidade 2 em um item", o `share-bag-cta` não é achado no "menu nativo e link".
- Print: a Mochila no topo, com os 2 cards e o "Finish purchase" fixo; o botão, que fica abaixo dos cards, não aparece.

### Como funciona hoje (`CompartilharPage.compartilharECopiar`, `:307`)
- Fecha o banner, grava a sentinela e toca no `share-bag-cta` sem conferir se ele está na tela.
- Quem rola até o botão é o `validarBotaoPresente` (`:130`), que roda antes da troca de quantidade.

### Como vai funcionar (nas duas plataformas, o mesmo código sem `if`)
- **Novo:** antes do toque, se o `share-bag-cta` não está na tela, rola a Mochila (`rolarMochila`, `:148`, já existe) até
  6 vezes, como o `validarBotaoPresente`.
- **Novo:** se não aparecer, falha explícita "Compartilhar: o share-bag-cta não apareceu na tela depois de 6 rolagens", com print.

## Arquivos

| Arquivo | Onde | Mudança |
|---|---|---|
| `test/pageobjects/ProdutoPage.ts` | `comprar` `:355-357` | sem sheet e sem modal = tamanho recusado (Android) |
| `test/pageobjects/ProdutoPage.ts` | `comprarNaPosicao` `:190-208` + comentário `:182-187` | card a card a partir da posição inicial, até o fim da lista |
| `test/utils/device-index.ts` | `primeirosCards` `:32-44` | só a posição inicial; comentário atualizado |
| `test/specs/06-compartilhar-carrinho.spec.ts` | `:110` | `primeirosCards(ultima + 1)` |
| `test/pageobjects/EnderecoPage.ts` | `digitarAndroid` `:206-220` | campo fora da árvore depois do toque: fecha o teclado, digita e confere |
| `test/pageobjects/CompartilharPage.ts` | `compartilharECopiar` `:307-310` | rola até o `share-bag-cta` antes do toque |

## iOS (1.23.3/409, passando no CI): o que vale e o que não muda

- **Troca de produto sem estoque, card a card (item 1, `comprarNaPosicao`):** é o mesmo código nas duas plataformas, e o
  iOS passa a seguir card a card igual ao Android.
- **Tamanho que não adiciona = próximo tamanho:** o iOS já faz isso (`comprarIOS`, `:702`) e não muda. Com o item 1, o
  Android passa a fazer igual.
- **Única diferença que fica:** no iOS, se o sheet de tamanho FECHAR sem abrir o de "produto adicionado", o teste para
  (`:695-700`). Não é falta de estoque: é tela inesperada, que o Android não tem (lá o sheet continua aberto). Fica como está.
- **Botão de compartilhar (item 3):** mesmo código, sem `if`. No iOS só rola se o `share-bag-cta` não estiver na tela. O
  `validarBotaoPresente` usa o mesmo `isDisplayed` e passa no iOS.
- **Número do endereço (item 2):** só Android. O iOS digita por outro caminho (`focarIOS`, que já rola o campo para fora
  do teclado) e passa; o problema é o teclado da Samsung.
- **Conferir no iOS:** `tsc` e o próximo CI iOS (5 iPhones): `02`, `03`, `04` e `06` continuam passando, com
  `comprarNaPosicao(0)` no nome do passo.

## O que NÃO muda

`wdio.conf.ts`, `testspec*.yml`, workflow, `package.json`, seletores, prazos e limites de tempo,
`escolherTamanho`, `fechaBanner`, `comprarIOS` e o caminho iOS do endereço (`digitarCampoIOS`/`focarIOS`).
Também não mudam os specs `01`–`05` nem as outras linhas do `06`.

## Verificação

- `npx tsc --noEmit` (ignorar `test/Draft.ts`) e `git diff` só nos 6 arquivos.
- No próximo CI, procurar no log:
  - `⚠ Tamanho X: o adicionar não abriu…` seguido de outro `📏 Tamanho escolhido` ou `⚠ <produto> da posição N sem tamanho com estoque — tentando a posição N+1`;
  - no `04` do S23+ e do S26 Ultra, `⚠ address-number-input: o campo saiu da árvore…` e o passo do CEP inválido passando;
  - no `06` do S26 Ultra, o "menu nativo e link" passando.
- O que aparece se falhar: "nenhum produto a partir do card N…" com a lista de recusados; "campo … ficou …"; "share-bag-cta não apareceu…".
