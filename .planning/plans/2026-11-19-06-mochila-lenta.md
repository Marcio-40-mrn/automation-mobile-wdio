# Plano — `06-compartilhar-carrinho`: Mochila lenta e escolha de tamanho (Android 1.23.1/557)

Situação: **itens 1 a 5 aprovados pelo Marcio (2026-11-19) e implementados. Rodado no AVD pelo Marcio (2026-11-19, 14:18–14:46): o `06`
PASSOU inteiro em 27,2 min (1ª vez); os outros 5 specs também passaram. CI e iOS não rodados.** Leitor da árvore
(`test/utils/arvore-android.ts`) conferido offline nas 21 árvores de Mochila da captura de 2026-11-19: mesmos ids, tamanhos e
quantidades que o teste leu. **Desvio no item 3:** a árvore inteira leva 4–12 s e uma busca 3–5 s na Mochila lenta, então no
`esvaziarMochila` a árvore seria mais lenta; ficou só o reaproveitamento da contagem (1 busca a menos por produto, nas duas
plataformas). Pelo mesmo motivo a espera de quantidade (`quantidade`) usa o `textoDe` com uma busca, não a árvore.
Evidência: `drafts/app-migrado/android/captures-2026-11-19-build557-06-passo-a-passo/NOTAS.md` (passo a passo no AVD, 2026-11-19).
Regra: nenhum tempo/timeout muda (Marcio). Mudanças nas duas plataformas, salvo onde dito.

## Por que o teste não passa

1. **Tempo.** O `06` inteiro leva ≈ 31 min de passos, no AVD, e o limite é 40 min; no `run-06f` estourou no cenário 19. Mais de 80% do
   tempo dos passos lentos é busca de elemento na Mochila. **Causa provada:** com "You won Free Shipping!" o caminhão da barra anima sem
   parar, o app fica em 70–136% de CPU e cada busca leva 2,7–6,8 s; sem frete grátis, 0,6–1,2 s (mesma Mochila, calça x2 ↔ x1).
   O frete grátis é inevitável no teste (calça x2 + camiseta passa de R$ 799).
2. **`waitForIdleTimeout` 0 não resolve** (medido com memória estável): descartado.
3. **"View sobre a tela" (`insiderLayout`) não é a causa:** árvores iguais antes e depois, buscas lentas com e sem o nó.
4. **Tamanho:** o `size-button` some ~4 s depois do toque no tamanho; o teste conclui "não habilitou", toca num tamanho SEM estoque e loga o
   tamanho errado (log "P", Mochila "XGG"). Em 2026-11-10 tocar num tamanho com "+" desmarcou o escolhido → falha "nenhum tamanho habilitou".
5. **Buy:** 1 vez em 2 calças o 1º toque no `pdp-buy-button` foi aceito e o sheet não abriu; o `comprar()` só repete o toque se houver banner.

## Como funciona hoje × como vai funcionar

### 1. Ler a Mochila com uma árvore por tela (Android) — `CompartilharPage.lerMochila` e `quantidade`

- **Hoje:** para cada card, 2 XPaths `following::` (tamanho e quantidade), cada um como `$()` + `isExisting()` = 4 buscas por card. Cada XPath
  no UiAutomator2 já gera a árvore inteira. `lerMochila` de 3 cards: 25 buscas, 105 s. É chamado 6 vezes no spec (`validarMochila` ×4, `lerMochila` ×2).
- **Vai funcionar:** no Android, um `driver.getPageSource()` por rolagem (4–12 s na Mochila lenta) e leitura local, na ordem do XML:
  card `wake-product-card-bag-<id>` → próximo `wake-item-size` (text) → próximo `remove-button` → próximo `TextView` (quantidade). Mesma
  regra dos XPaths de hoje, aplicada no texto. A validação (ids, tamanhos, quantidades, o que falha) não muda. iOS continua como está
  (estrutura `following-sibling` não conferida em árvore bruta). É diferença só de LEITURA, permitida pela regra; vai comentada no método.
- **Ganho esperado:** de ~25 para ~3–4 comandos por `lerMochila` (≈ 105 s → ≈ 20–35 s). Medir no run.

### 2. Uma busca por campo onde sobrar — `CompartilharPage.textoDe`

- **Hoje:** `$(seletor)` + `isExisting()` = 2 buscas.
- **Vai funcionar:** `$$(seletor)` uma vez; vazio = null; senão lê o atributo do 1º. Nas duas plataformas. Mesmo resultado.

### 3. `esvaziarMochila` sem recontar à toa — `CheckoutPage.esvaziarMochila`

- **Hoje:** por produto, `$$(card).length` + `$$(remover)` com `isDisplayed()` em cada um + recontagem a cada 0,5 s (3 cards: 22 buscas, 127 s).
- **Vai funcionar:** Android: contagem de cards e posição do `wake-remove-item` visível tirada da mesma `getPageSource()` (bounds dentro da
  janela, acima do "Finish purchase"); toque pelo elemento achado por id + índice. iOS sem mudança. Mesmos erros nomeados, mesmos prazos.

### 4. Tamanho: não abandonar o tamanho que pegou — `ProdutoPage.escolherTamanho`

- **Hoje:** depois de 4 s sem ver o `size-button` habilitado, passa ao próximo tamanho, inclusive sem estoque, e loga o último tocado.
- **Vai funcionar:** antes de tocar no próximo tamanho, confere de novo o botão; se agora está habilitado (ou o botão de adicionar está no
  lugar), o tamanho anterior é o escolhido e o log diz qual. Tamanho sem estoque só é tocado se nenhum com estoque deu resultado. A espera de
  4 s não muda. Nas duas plataformas (o iOS usa `comprarIOS`, por fração: sem efeito lá).

### 5. Buy: repetir o toque uma vez sem banner — `ProdutoPage.comprar`

- **Hoje:** espera 15 s pelo sheet; repete o toque só se fechou um banner.
- **Vai funcionar:** se os 15 s acabarem sem sheet, sem modal e sem banner, toca o `pdp-buy-button` mais 1 vez e espera de novo 15 s (mesmo
  prazo, um toque a mais, com log `⚠ Comprar: 1º toque sem efeito`). Também no `comprarIOS`, nas duas plataformas.
  **Decisão do Marcio:** isso soma até 15 s no pior caso; se for entendido como "mudar tempo", fica fora.

## O que NÃO entra

- Nenhum timeout/prazo alterado; nada no `wdio.conf.ts`; `waitForIdleTimeout` não muda.
- `fechaBanner` sem mudança.

## Para o Marcio decidir (fora do código)

- **Bug do app (a causa raiz):** com frete grátis, o caminhão da barra anima sem parar e o app fica em 70–136% de CPU com a Mochila parada
  (AVD 1.23.1/557, prova no `NOTAS.md`, achado 1b). Registrar no `BUGS-APP.md` e levar ao time do app? A correção do teste só reduz o número
  de buscas; cada busca continua lenta enquanto a animação roda.

## Como validar

`tsc --noEmit`; depois o Marcio roda `06` no AVD. Conferir no log: tempo de cada `validarMochila`/`lerMochila`, `📏 Tamanho escolhido` igual ao
tamanho da Mochila, e o spec inteiro dentro dos 40 min.
