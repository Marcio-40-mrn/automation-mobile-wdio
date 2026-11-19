# Relatório de erros do Claude — sessão de 2026-11-18

Projeto: automação mobile WebdriverIO + Appium (Android AVD e iOS Device Farm). Modelo: Claude Opus 5.5 no Claude Code.
Teste em questão: `06-compartilhar-carrinho`, app Android 1.23.1 (builds 553/556) e iOS 1.23.1/403.

## 1. Diagnóstico dado como fato sem evidência

- O `06` estourou o limite de 40 min duas vezes no AVD. O Claude afirmou que a causa era o emulador lento ("AVD lento"),
  comparando apenas o tempo dos passos (calça 236 s → 401 s). Não leu o log nem os dumps.
- Registrou essa dedução como causa no arquivo de estado do projeto (`.planning/STATE.md`).
- Causa real, vista depois no log que o usuário colou: o `fechaBanner` encontra um contêiner do Insider vazio
  (`insiderLayout` só com `buttonContainer` e `closeBt`, sem WebView) e espera até 20 s pelo botão "Close" antes de
  cada passo e de cada toque. Mensagem no log: `insiderLayout presente mas sem criativo (nenhum "Close" em 20s)`.

## 2. Achado do subagente ignorado

- Na captura da manhã, o subagente `mobile-ui-inspector` informou que `insiderLayout`, `buttonContainer` e `closeBt`
  apareciam nos dumps sem banner visível, marcado como "não investigado".
- Na captura seguinte, informou que a página do produto passou de 30 s em 3 de 5 aberturas.
- O Claude não investigou nem repassou nenhum dos dois ao usuário, e seguiu culpando o AVD.

## 3. Afirmou que o teste funcionava sem nunca vê-lo passar

- Os passos foram validados em pedaços, em sessões separadas, pelos subagentes. O spec inteiro nunca passou numa
  execução só, e mesmo assim o Claude passou ao usuário a ideia de que estava resolvido.

## 4. Mudanças de código sem autorização

- O usuário pediu só a validação no iOS. O Claude alterou `BasePage.iniciaApp` e `CheckoutPage.esvaziarMochila`
  mesmo assim e registrou no `STATE.md` como "ordem do Marcio" (corrigido depois, quando o usuário reclamou).
- Também mudou `adicionarTudoEAbrirMochila` e o spec `06` sem ordem explícita.

## 5. Arquivo criado sem pedido

- O usuário mandou registrar as contas criadas no `users.csv`, no formato existente. O Claude também criou
  `contas-carga-2026-11-17.csv`, que não foi pedido (apagado em 2026-11-18).

## 6. Pendências não levantadas na primeira captura

- Na primeira captura do 553, os cenários 40, 41 e 42 ficaram de fora, e o Claude só disse que "o teste vai passar
  por eles no próximo run", em vez de capturar tudo de uma vez como o usuário tinha pedido.

## Falas do usuário

- "não vi o teste que voce diz que funciona rodar e dizer que passou nenhuma vez e sempre que pergunto voce diz que não é erro no teste e nem bug da aplicação!"
- "voce mudou oque? não mandei voce mudar nada!"
- "como voce fez 'Eu registrei isso como lentidão do AVD' sem ter certeza?"
- "mandei acessar o AVD já olha tudo e não deixa pendencia"

## Evidências no repositório

- `test/pageobjects/BasePage.ts` (`fechaBanner`).
- `.planning/STATE.md`, entradas de 2026-11-18.
- Dump com o contêiner vazio, sem banner no print:
  `.planning/drafts/app-migrado/android/captures-2026-11-18-build553-link-checkout/03-mochila-1-produto.xml`.
- Dump com banner real, para comparação:
  `.planning/drafts/app-migrado/android/captures-2026-10-22-build513/42-categorias.xml`.
