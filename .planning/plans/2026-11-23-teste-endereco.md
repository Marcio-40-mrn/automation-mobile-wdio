# Plano — teste de Cadastro de Endereço e Edição de Endereço (M9)

Escrito em 2026-11-23 (ordem do Marcio: planejar e guardar para mostrar depois). **Implementado em 2026-11-25 dentro do `04-criar-conta`. Os runs do AVD nesse dia não chegaram ao formulário (`STATE.md`).**
Parada em 2026-11-24: captura do iOS feita; nenhum `EnderecoPage` e nenhum spec. Retomar por este arquivo e pelo `STATE.md`.

Base Android: 1.23.1/557 (`captures-2026-11-23-build557-cadastro-endereco/` e `-alterar-endereco/`, drafts `16` e `39`)
e reteste no 559 (`captures-2026-11-23-build559-endereco/`). Relatório do bug do 557 para o DEV:
`RELATORIO-ENDERECO-DEV-2026-11-23.txt` (raiz). Não reenviar.

Base iOS: 1.23.2/408, Remote Access, 2026-11-24 (`drafts/app-migrado/ios/captures-2026-11-24-endereco/`, `NOTAS.md`;
drafts `16` reescrito e `51` novo). O `.env` ainda diz `BUILD_NUMBER_IOS=406`. Conta `…mwv0asda-hgp4` em `MASSA-DE-DADOS.md`.

## Como é hoje

Nenhum teste cobre endereço. `CheckoutPage.finalizarCompraESelecionarEndereco()` espera sempre a lista "Meus
endereços"; com conta nova (o checkout abre o formulário direto) ele falharia.

## Como vai funcionar

Um teste com **conta nova** (único jeito de ter conta sem endereço a cada run): cadastra e depois edita.

### Preparação (mesmo caminho do `04-criar-conta`)
1. Primeiro acesso: onboarding, Home deslogada.
2. Menu → Login → Criar Conta com dados gerados na hora (`gerarDadosCadastro`).
3. Finalizar; Home e Menu logados; dados da conta no Allure.
4. Buscar "camiseta" e pôr o 1º card com estoque na Mochila (`primeirosCards`, como no `02`).
5. Abrir a Mochila e tocar em `bag-checkout-button`.

### Cenário 1 — Cadastro de endereço
6. Formulário abre direto: `address-zip-input` na tela (não a lista).
7. CEP inválido `00000000`: erro no campo pelo XPath estrutural
   `//*[@resource-id="address-zip-input"]/../following-sibling::*[1][self::com.horcrux.svg.SvgView]` (sem ler texto);
   preencher Número e Destinatário; `address-save-button` `enabled=false`; tocar e conferir que continua no formulário.
8. CEP válido `01310100`: erro some; Rua, Município e Bairro preenchidos pelo app (não vazios) e UF preenchida
   (`content-desc` ≠ vazio "UF"); Save `enabled=true`.
9. Salvar: chegada na Entrega (`delivery-option-slas`).

### Cenário 2 — Edição de endereço
10. Da Entrega, "+ Add or choose another address" → Meus endereços (`header-back-button` + `pressable`); tocar no
    1º "Alterar" pelo XPath por irmãos
    `//*[@clickable="true" and following-sibling::*[1][@clickable="true" and count(android.widget.TextView)>=3]]`.
    (**Não** usar o XPath com `following::`: quebra no UiAutomator2 — conferido no 559.)
11. Formulário preenchido: CEP igual ao cadastrado. (No 559 o Update já abre `enabled=true` sem mudança: não validar.)
12. CEP inválido `00000000`: erro no campo, Update desabilitado; tocar e conferir que continua no formulário.
13. CEP válido novo `01226030`: erro some; Rua e Bairro mudam em relação ao antigo; trocar o Número.
    (Não validar o `enabled` do Update aqui: no 559 veio `false` uma vez e o toque gravou.)
14. Tocar em Update (até 2 toques) e esperar a **Entrega** (`delivery-option-slas`), passando pelo carregando.
    **No 557 falhava (bug); no 559 grava e vai à Entrega (2 de 2).**
15. Conferir o que foi gravado: "+ Add or choose another address" → reabrir "Alterar" e comparar o CEP do campo com
    `01226-030` (dado, não texto do app); 1 cartão só (editou, não duplicou).
16. Voltar; o `afterTest` limpa o app (`pm clear`).

Allure: `step()` por passo; print em cada passo de CEP (inválido, válido, salvo, editado); dados da conta e dos
endereços anexados.

## Arquivos

- `test/pageobjects/EnderecoPage.ts` (novo): `validarFormularioAberto`, `preencherCep`, `erroNoCep`,
  `preencherNumeroEDestinatario`, `validarSalvar(habilitado)`, `salvarEIrParaEntrega`, `abrirAlterarPrimeiro`,
  `atualizarEVoltarParaLista`, `lerCepDoFormulario`.
- `CheckoutPage`: método para tocar em `bag-checkout-button` sem exigir endereço salvo; o
  `finalizarCompraESelecionarEndereco` atual não muda.
- Spec: conforme a decisão 1.
- iOS: ramo dentro do mesmo método (uma suíte só). A captura de 2026-11-24 está feita. Os passos 6 a 15 acima são o
  Android. No iOS 408 eles não valem do jeito que estão escritos.

## iOS 1.23.2/408 — o que a captura mostrou

Não copiar o XPath nem os testIDs de campo do Android.

- Não existem `address-zip-input`, `address-street-input`, `address-number-input`, `address-recipient-input`,
  `address-city-input` nem `address-neighborhood-input`, e não há `TextField`.
- Campo vazio: `Other` acessível com o placeholder no `name` ("Digite o seu CEP", "Digite a rua", "Number",
  "Neighborhood", "Município", "Digite um complemento", "Digite o nome do destinatário"). Preenchido, `name` e `value`
  ficam vazios. CEP, rua, número, bairro, cidade e destinatário estão só no print.
- Existem `address-state-input` (label "UF", vira "SP"), `address-save-button` ("Save information and proceed" no
  cadastro, "Update" na edição), `favorite-address-button` e `header-back-button`.
- Erro de CEP: StaticText "CEP inválido", sem id. Com ele, o Save/Update fica `enabled=false`.
- Cadastro: CEP `01310100` preenche Avenida Paulista / Bela Vista; o Save mostra carregando e cai na Entrega
  (`21-depois`). Na PDP não há `tab-bag`; a Mochila abre pelo `action-icon-button`.
- Lista: card com `name` começando em "Receba em"; "Alterar" é um `Other` com `name` próprio (não usar o XPath
  Android); `pressable` é "Cadastrar novo endereço". "+ Add or choose another address" na Entrega é StaticText.
- Edição: CEP `01226030` preenche Rua Barão de Tatuí / Vila Buarque e o Update fica habilitado. Os toques
  (`element.click`, `mobile: tap` e três alturas) não saíram do formulário e não mostraram carregando. A lista não
  foi reaberta: **não está provado se o CEP novo gravou**. Não registrar em `BUGS-APP.md` sem o Marcio pedir.
- Não capturado: toque no card, "Cadastrar novo endereço", sheet da UF, favorito marcado.

## Decisões do Marcio (abertas)

1. **Fechada (2026-11-25): entrou no `04-criar-conta`**, depois de `perfilPage.validarLogado()` e ainda dentro do `try`. Não cria `07-endereco`. (A opção era: aproveitar a conta nova, sem repetir onboarding e cadastro nos 11 aparelhos, ou spec novo `07-endereco` com conta própria, ≈ +5 min por aparelho.)
2. ~~Passo 14 com o bug~~: corrigido no 559 (reteste de 2026-11-23); decidir se o teste mira o 559 em diante.
   No iOS 408 o Update com CEP novo não foi conferido.
3. CEP incompleto `1234` (sem mensagem, só Save desabilitado): entra ou não. No iOS não foi capturado.
4. ~~Capturar o iOS antes de implementar~~: feito em 2026-11-24 (1.23.2/408). Falta decidir o seletor do campo sem
   testID e se o teste de edição do iOS espera a Entrega ou fica de fora até o Update sair da tela.
