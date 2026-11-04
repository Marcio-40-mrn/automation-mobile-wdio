# Pix e cartão até o Resumo, sem criar pedido (M10)

Data: 2026-11-04. Decisão e aprovação do plano: Marcio. Estado: implementado, só `tsc`, NÃO RODADO.
Último build levantado: Android 1.22.9/530. A mudança vem de decisão do Marcio, não de um build novo.

## Problema

O `02-compra-pix` e o `03-compra-cartao` criavam pedido real a cada execução, em cada device.

## Solução

Os dois specs terminam na validação do Resumo, nas duas plataformas. A chegada à tela já é provada por
`prosseguirParaResumo()` e `prosseguirDoCartaoParaResumo()`, que falham sem `summary-finalize-purchase`.
Nenhum método, seletor ou espera novo.

| Arquivo | Mudança |
|---|---|
| `test/specs/02-compra-pix.spec.ts` | saíram finalizar, QR code, número, cópia do código, Meus pedidos, Home, alerta do pedido e o bloco comentado de limpeza |
| `test/specs/03-compra-cartao.spec.ts` | saíram finalizar, Meus pedidos, número e total do pedido; cabeçalho reescrito |
| `test/pageobjects/PedidoPage.ts` | excluído |
| `test/pageobjects/CheckoutPage.ts` | saíram `finalizarPedido`, `finalizarPedidoComCartao`, `esperarDestinoDoFinalizar` e `anexarArvoreDaTela` |
| `test/pageobjects/HomePage.ts` | saiu `validarAlertaPedido` |

Os títulos dos testes não mudaram, para manter o histórico do Trend no Allure.

## Mochila

Sem limpeza nova. Evidência: `plans/2026-10-14-compra-pix.md`, o Marcio conferiu no app a Mochila vazia depois de
runs que falharam e de um run verde (`clearApp` do `afterTest`, AVD).

Não medido: CI e iOS do app migrado (o draft iOS 27 lista a persistência como não conferida). No Remote Access o
`afterTest` só faz `terminateApp`, com `noReset: true`, então a Mochila pode sobrar entre runs manuais.

## Cobertura que saiu

QR code do Pix, cópia do código, recusa/antifraude do cartão, Meus pedidos com pedido e alerta do pedido na Home.

## O que conferir no run

- O último passo é a validação do Resumo, com `🧾 Resumo do pedido aberto` e `✅ Resumo confere` no log.
- A partir do 2º run: `🎒 Mochila com 2 produto(s)` no `02` e 1 item no `03`.
- Nenhum pedido novo nas contas usadas.
