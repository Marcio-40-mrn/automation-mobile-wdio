---
phase: 06-cenarios-gherkin-app-migrado
plan: 01
subsystem: testing
tags: [m6, dec-a, captura-ios, remote-access, app-migrado, testid, xcuitest, drafts]

requires:
  - phase: 05-levantamento-app-migrado
    provides: drafts Android do app migrado (01-28) e a 1ª leva iOS deslogada de 2026-09-11
provides:
  - DEC-A registrada (cinco itens, respostas do Marcio em 2026-10-01)
  - Captura iOS "sessão A" do app migrado 1.20.10 build 335 — 45 pares xml/png logados, com NOTAS.md e ACOES.md
  - 21 drafts iOS do app migrado e 00-INDICE.md novo
  - Lista de achados iOS que mudam o desenho dos page objects (06-02 e 06-03)
affects: [06-02, 06-03, 06-04, 06-05]

actuals:
  tokens: 0
  tasks: 2
  commits: 0

tech-stack:
  added: []
  patterns:
    - "iOS: alertas do SpringBoard só por `mobile: alert` com buttonLabel; ordem notificação -> CTA -> ATT -> localização"
    - "iOS: modal RN é nó único sem filho; detectar por label e fechar por fração da janela"

key-files:
  created:
    - .planning/drafts/app-migrado/ios/00-INDICE.md
    - .planning/drafts/app-migrado/ios/captures-m6-sessao-a/NOTAS.md
    - .planning/drafts/app-migrado/ios/captures-m6-sessao-a/ACOES.md
    - .planning/drafts/app-migrado/ios/captures-m6-sessao-a/ (45 pares NN-*.xml/.png, 00-44, mais helpers .js/.mjs/.sh de captura)
    - .planning/drafts/app-migrado/ios/01-boas-vindas.md
    - .planning/drafts/app-migrado/ios/02-permissoes-sistema.md
    - .planning/drafts/app-migrado/ios/03-topicos-permissao.md
    - .planning/drafts/app-migrado/ios/04-politica-privacidade.md
    - .planning/drafts/app-migrado/ios/05-termos.md
    - .planning/drafts/app-migrado/ios/06-home.md
    - .planning/drafts/app-migrado/ios/07-menu-deslogado.md
    - .planning/drafts/app-migrado/ios/08-login.md
    - .planning/drafts/app-migrado/ios/09-categorias.md
    - .planning/drafts/app-migrado/ios/10-subcategorias-roupas.md
    - .planning/drafts/app-migrado/ios/11-listagem-camisas.md
    - .planning/drafts/app-migrado/ios/20-favoritos.md
    - .planning/drafts/app-migrado/ios/24-menu-logado.md
    - .planning/drafts/app-migrado/ios/27-mochila-vazia.md
    - .planning/drafts/app-migrado/ios/28-logout.md
    - .planning/drafts/app-migrado/ios/29-modal-credenciais-erradas.md
    - .planning/drafts/app-migrado/ios/30-esqueci-senha.md
    - .planning/drafts/app-migrado/ios/31-criar-conta.md
    - .planning/drafts/app-migrado/ios/32-favoritar.md
    - .planning/drafts/app-migrado/ios/33-favoritos-vazio.md
  modified: []

key-decisions:
  - "DEC-A (a)-(e) respondida pelo Marcio: build = o que a automação baixa; POC migra na Etapa 0; limpeza e vídeo por teste como hoje; CI roda tudo em todos os devices; idioma ignorado"
  - "D-04 corrigida: idioma ignorado, nenhum teste valida texto; D-05 revogada"
  - "Tarefa 2 (captura Android em inglês) cancelada pelo Marcio — o único motivo dela era o idioma"

patterns-established:
  - "Capturas iOS feitas pelo mobile-ui-inspector com autorização do Marcio para os toques; sessão fechada com deleteSession antes da redação"

requirements-completed: [D-01, D-02, D-04, D-06, D-07, D-08]

status: complete

duration: n/d (execução conduzida pelo orquestrador junto com o Marcio, 2026-10-01)
completed: 2026-10-01
---

# Phase 06 Plan 01: DEC-A + capturas da fumaça e da Etapa 1 Summary

**DEC-A fechada pelo Marcio e captura iOS logada do app migrado 1.20.10 (build 335) em 45 estados, com 21 drafts; a captura Android em inglês foi cancelada porque a D-04 corrigida eliminou o motivo dela.**

## DEC-A

Respostas do Marcio em 2026-10-01, como registradas no `06-CONTEXT.md` (seção "DEC-A", linhas 83-98). Nenhum valor foi preenchido pelo agente.

- **(a) Build:** é o que a automação baixa e instala (`scripts/install-apk.mjs` + secrets `BUILD_*`). Para captura, o Marcio instala na sessão; não se pergunta build/versão. Capturado no iOS: `com.aramis.ecomm` **1.20.10 build 335** (lido no Account Menu). Não está escrito se os secrets `BUILD_*` do workflow já apontam para o app migrado, nem (a2) o build de referência dos seletores Android entre 492/493/posterior, nem (a3) se os testIDs de campo de `ELEMENTOS-SEM-TESTID.md` já foram entregues — a resposta do Marcio ("o que a automação baixa") não os cobre.
- **(b) POC:** migra na Etapa 0 como fumaça. Nenhuma etapa é pulada; o M7 continua marco próprio.
- **(c) Execução:** como hoje — limpeza do app por teste e **vídeo de todos os testes**; `wdio.conf.ts` sem mudança de política.
- **(d) CI:** todo run executa **todos os testes em todos os devices**, sem filtro. Suíte ou teste único só local (AVD; sessão AWS no iOS), com `--spec <arquivo>` e `--mochaOpts.grep "<id>"`. O limite de 120 min de polling será reavaliado com o tempo medido.
- **(e) Idioma:** ignorado (D-04 corrigida; revoga a D-05). Os testes não validam texto.
- **Consequência registrada:** com `appium:autoGrantPermissions: true` mantido no AVD (`wdio.conf.ts`, política não mudou por (c)), os cenários ONB de **negar** permissão só são efetivos no **Device Farm** (que já não concede). No AVD local o diálogo não aparece.
- **Sem replanejamento:** os planos 06-01…06-16 seguem como estão; onde mencionarem inglês, DEC-B de idioma ou validação de texto, vale a D-04 corrigida.

## Tarefas

| # | Tarefa | Estado |
|---|---|---|
| 1 | DEC-A (checkpoint:decision) | Concluída — respondida pelo Marcio |
| 2 | Captura Android em inglês | **Não executada — cancelada** (ver Deviations) |
| 3 | Captura iOS, sessão A | Concluída |

## Captura iOS — sessão A

- Pasta: `.planning/drafts/app-migrado/ios/captures-m6-sessao-a/` — **45 pares** `NN-*.xml`/`.png` (00–44), confirmado por `ls` (45 xml, 45 png), mais `NOTAS.md`, `ACOES.md` e helpers (`capture.mjs`, `act.mjs`, `type.js`, `clear.js`, `tapf.js`, `login-real.js`, `swipeloop.js`, `swipe-to.js`, `unfav.js`, `sum.mjs`, `st.sh`, `step.sh`). O critério do plano pedia 25 ou mais.
- Ambiente: iPhone via AWS Device Farm Remote Access, iOS 26.3, janela 402x874 pt (print 1206x2622, escala 3); `autoAcceptAlerts` **não usado**; instalação limpa; sessão fechada ao final (`deleteSession`).
- Feita pelo `mobile-ui-inspector`, com o Marcio autorizando o agente a dar os toques (ele não toca no aparelho). Drafts redigidos pelo `mobile-draft-writer`.
- Cobertura: notificação, Boas-vindas, ATT, localização, Tópicos, Política, Termos, Home, Menu deslogado, Login (vazio, só e-mail, sem arroba, preenchido), modal de credenciais erradas (e-mail fictício), Esqueci minha senha (Send link não tocado), tela de Criar conta, login real, Menu logado, logout (Cancel e confirmar), Categorias, Roupas, Camisas, favoritar, Favoritos, desfavoritar, lista vazia, Mochila vazia.
- **Estado final da conta (`CLIENT_USER`):** logada, sem favoritos (cap. 42), Mochila vazia (cap. 44).
- Respostas explícitas exigidas pelo plano: existe diálogo de logout no iOS — **sim** (cap. 30); o alerta de notificação foi aceito automaticamente — **não**; a PDP não faz parte da sessão.

### Drafts iOS escritos (21, confirmados por `ls`)

`01-boas-vindas`, `02-permissoes-sistema`, `03-topicos-permissao`, `04-politica-privacidade`, `05-termos`, `06-home`, `07-menu-deslogado`, `08-login`, `09-categorias`, `10-subcategorias-roupas`, `11-listagem-camisas`, `20-favoritos`, `24-menu-logado`, `27-mochila-vazia`, `28-logout`, `29-modal-credenciais-erradas`, `30-esqueci-senha`, `31-criar-conta`, `32-favoritar`, `33-favoritos-vazio` (todos `.md` em `.planning/drafts/app-migrado/ios/`), mais `00-INDICE.md`. A numeração coincide com a do Android migrado quando a tela é a mesma; 29-33 são só iOS.

### Achados que alimentam o 06-02 e o 06-03

1. **O logout iOS agora tem diálogo nativo** (`XCUIElementTypeAlert` com Cancel/Logout, cap. 30). O `confirmarLogout()` do iOS, que hoje retorna cedo, precisa mudar: confirmar por class chain `**/XCUIElementTypeAlert/**/XCUIElementTypeButton[`name == "Logout"`]`; `~Cancel` cancela. `mobile: alert accept` no logout não foi testado.
2. **Três alertas do SpringBoard, nenhum automático**, todos por `mobile: alert` com `buttonLabel` (`Allow`; `Allow`; `Allow While Using App`). Ordem real: notificação -> CTA -> ATT -> localização. O ATT é novo no app migrado.
3. **CTA "Toque para começar"** sem nó: tap por fração **(0.510, 0.892)**, 1 tap basta.
4. **Modal RN de credenciais erradas** é nó único sem filho: detectar por `label CONTAINS "Incorrect username"`, fechar por fração **(0.5, 0.619)**; `mobile: alert` não serve.
5. **Campos de login perdem o `name`** ao receber valor (digitar com teclado aberto e `maxTypingFrequency` 20); **Sign in exige 2 taps** (1º só fecha o teclado, 2/2 vezes); limpar exige tocar à direita do texto + backspaces.
6. **Estado do coração visível na árvore:** `action-button-icon` 32x33 (vazio) -> 20x21 (cheio) na listagem. Em Favoritos o coração é o `action-button` de **maior x** (x=160; sacola em x=21) — não confiar na ordem do `$$`.
7. `voltar()` na listagem é o chevron `name == "Camisas"` `[2]`; `~Back` não existe ali. Listagem já hidratada (741 produtos).
8. Política exige ~21 swipes (~48s) e Termos ~9 (~21s); paridade de testID com o Android migrado em `tab-*`, `accept-button`, `category-button`, `sub-categories-button`, `action-button`, `menu-card`, `menu-list-button`, `pressable`, `flatlist-favorites`, `status-alert-icon`.

## Lacunas (declaradas, não falhas)

- Negar permissões (notificação, ATT, localização) no iOS: exige reinstalação limpa.
- iOS sem PDP, Mochila com itens, checkout, Busca, Filtros, Settings, Notificações, Meus dados, Meus pedidos.
- Criar conta: validações e etapa 2 não capturadas (só a tela); Esqueci minha senha: resultado do envio não capturado de propósito.
- Banner do Insider não apareceu; `~Close` não exercitado no app migrado.
- Tempos mínimos de espera (listagem, favoritar, desfavoritar, login) não medidos.
- Os drafts não foram comparados linha a linha com `test/pageobjects/`.

## Deviations from Plan

**1. [Decisão do Marcio, não falha] Tarefa 2 (captura Android em inglês) cancelada**
- **Motivo:** o único propósito da tarefa era garantir o aparelho em inglês (D-04 original). A D-04 foi corrigida em 2026-10-01: o idioma é ignorado e nenhum teste valida texto. Sem validação de texto, a captura em inglês não tem utilidade.
- **Efeito:** não existe `.planning/drafts/app-migrado/android/captures-m6-e01-en/`; o `android/00-INDICE.md` não foi atualizado. As referências Android continuam `captures-2026-09-29/` e `captures-2026-09-29-m6e1/` e os drafts 01–28 (existem também `captures-2026-09-22/` e `captures-2026-09-30/`).
- **Consequência para o plano:** o `must_haves` "Existe captura Android do app migrado com o aparelho em inglês" e o artefato `captures-m6-e01-en/NOTAS.md` ficam **não atendidos por decisão**, não por falha de execução. Estados Android da Etapa 1 que as capturas pt-BR de 29/09 não cobrirem (por exemplo, caminho de negar permissão) ficam como lacuna a tratar no 06-02/06-04.

**2. [Observação] Critério de verificação sem `-en`**
- As verificações da Tarefa 2 (`grep "While using the app"`, 30+ xml) deixam de se aplicar junto com a tarefa.

**3. [Observação] Tarefa 3 conduzida com toques do agente**
- O plano previa que o Marcio navegasse e o inspector só capturasse. Aqui o Marcio autorizou o `mobile-ui-inspector` a dar os toques na sessão de Remote Access (ele não toca no aparelho). Não é violação do CLAUDE.md, que reserva essa regra ao AVD local, e a sessão foi fechada com `deleteSession`.

**4. [Observação] 06-PLAN.md já não está no diretório da fase**
- O plano dizia para deixá-lo intacto até o orquestrador retirá-lo; o arquivo não existe mais em `.planning/phases/06-cenarios-gherkin-app-migrado/` (a verificação `git diff --quiet` sobre ele devolve 0 por ser caminho inexistente/não rastreado, o que não prova nada). Não foi alterado por este plano.

## Verificação

`git status --porcelain -- test wdio.conf.ts testspec.yml testspec-ios.yml .github package.json package-lock.json` -> **saída vazia** (nenhuma alteração em código, configuração, workflow ou dependências).

## Known Stubs

Nenhum (plano só de decisão e captura; não há código).

## Threat Flags

Nenhum. `.planning/drafts/` está no `.gitignore`; o modal de erro usou e-mail fictício (`qa.inexistente.<ts>@example.com`), nunca a conta do device com senha errada; Send link e Criar conta não foram submetidos; a sessão Remote Access foi fechada.

## Self-Check

**PASSED**, com a ressalva da Tarefa 2:
- `git status --porcelain` nos caminhos protegidos: vazio.
- `captures-m6-sessao-a/`: 45 xml e 45 png, `NOTAS.md` e `ACOES.md` presentes.
- `ios/00-INDICE.md` e os 20 drafts numerados existem (21 `.md` contando o índice).
- DEC-A conferida contra o `06-CONTEXT.md` (itens a–e).
- Nenhum commit foi feito (regra do projeto); `actuals.commits: 0`.
- Ressalva: a Tarefa 2 não foi executada por decisão do Marcio; os must_haves e artefatos dela (captura Android EN) ficam não entregues e estão registrados em Deviations.
- Pendente de resposta (não está escrito): secrets `BUILD_*` apontam para o migrado; build de referência Android (a2); testIDs de campo entregues (a3).
