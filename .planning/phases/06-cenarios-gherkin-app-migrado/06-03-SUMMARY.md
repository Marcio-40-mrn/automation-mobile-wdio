---
phase: 06-cenarios-gherkin-app-migrado
plan: 03
subsystem: testing
tags: [m6, fumaca, app-migrado, favoritar, favoritos, categorias, testid, readme]

requires:
  - phase: 06-cenarios-gherkin-app-migrado
    provides: "06-01 — DEC-A e capturas iOS sessão A; 06-02 — onboarding, login, logout, helpers e textos.ts"
provides:
  - "CategoriasPage e FavoritosPage no app migrado (Android e iOS), com guarda de conta suja e confirmação do toque no coração"
  - "Fumaça (00-poc-favoritar.spec.ts) verde em run local: AVD-S24 e iPhone via Remote Access"
  - "README: como rodar uma suíte ou um teste só, localmente"
affects: [06-04, 06-05]

key-files:
  created: []
  modified:
    - test/pageobjects/CategoriasPage.ts
    - test/pageobjects/FavoritosPage.ts
    - test/utils/textos.ts
    - README.md
    - test/pageobjects/BasePage.ts
    - test/pageobjects/HomePage.ts
    - test/pageobjects/LoginPage.ts
    - test/pageobjects/PerfilPage.ts

key-decisions:
  - "DEC-A 'como está hoje' mantida: nenhuma mudança em wdio.conf.ts, testspecs, workflow; sem test/utils/sessao.ts"
  - "Estado vazio de Favoritos sem texto: status-alert-icon visível e flatlist-favorites ausente"
  - "Guarda do coração Android pela RAZÃO largura do ícone / largura do botão (limite 0,8), não por pixel"
  - "Android sem texto de interface onde der: acesso ao Login, voltar do cabeçalho, card Favoritos e Sair por estrutura"
  - "XPath1 forçado no Android (enforceXPath1) no início de ativarApp()"

requirements-completed: [D-01, D-02, D-06, D-07, D-08]

status: complete-ci-pendente

completed: 2026-10-01

actuals:
  tokens: 0       # não medido; medir chars/4 do diff só se o plano for recalibrado
  tasks: 3
  commits: 0      # regra do projeto: nenhum commit (o Marcio versiona)
---

# Phase 06 Plan 03: Fumaça completa — Categorias, favoritar e Favoritos no app migrado Summary

**A POC do favoritar percorre onboarding → login → Categorias → Roupas → Camisas → favoritar → Favoritos → desfavoritar → logout no app migrado e passou 17/17 steps no AVD-S24 e no iPhone (Remote Access). O run no Device Farm ainda NÃO foi feito: o plano está concluído em run local, com o CI pendente.**

## Estado

- **Plano concluído com CI pendente.** A fumaça foi considerada concluída pelo Marcio nas duas plataformas em run local.
- **Pendente (próximo passo do Marcio):** disparar o workflow existente (todos os testes em todos os devices). Depois, o agente levanta duração por job (`list-jobs`) e tamanho do Customer Artifacts por device pelo AWS CLI (comandos do CLAUDE.md, com `set -a; . ./.env`). O critério "Device Farm Android 6/6 e iOS 5/5" do plano **não está atendido ainda**.
- Como o 06-03 não alterou `wdio.conf.ts`, testspecs nem workflow (DEC-A "como hoje"), o run do CI não valida mudança de configuração desta etapa; ele valida os page objects no caminho do host e mede a duração.

## Resultado dos runs (medido pelo orquestrador nos allure-results locais)

| Ambiente | Resultado | Duração | Quando |
|---|---|---|---|
| Android AVD-S24 (conta marciorocha@maildrop.cc) | `00-poc-favoritar` PASSED, 17/17 steps | 198 s | 2026-10-01 21:20 |
| iOS, sessão AWS Remote Access (iPhone, iOS 26.3) | PASSED, 17/17 steps | 265 s | 2026-10-01 22:17 |
| iOS, mesma sessão, 2º run | PASSED, 17/17 steps | 410 s | 2026-10-01 22:25 |
| Device Farm Android (6 devices) | **NÃO rodado** | — | pendente |
| Device Farm iOS (5 devices) | **NÃO rodado** | — | pendente |

Duração por job do CI e tamanho do Customer Artifacts por device: **não medidos** (dependem do run do CI). A estimativa A2 do `06-RESEARCH.md` continua sem calibração.

## Tarefas

### Tarefa 1 — Categorias, favoritar e Favoritos

- `textos.ts`: `categorias.roupas` e `categorias.camisas` (rótulos de fallback, só para localizar, com `fonte`). Não existe `favoritos.vazio`.
- `CategoriasPage` Android: `category-button`/`sub-categories-button` + desc; `favoritarPrimeiroProdutoAndroid()` espera `product-list`, acha o rodapé pelo padrão `descriptionContains(", R$")`, confere que o coração é do mesmo card, aplica a guarda de conta suja (erro "Conta suja: ...") antes do toque e confirma o ícone preenchido em até 10 s; `voltar()` espera a tab bar por `tab-categories`/`tab-menu`.
- `CategoriasPage` iOS: predicate do card passou a `name CONTAINS "R$"` com faixa de largura 30–60% da janela (o nome do 1º card começa com espaço no app migrado); guardas mantidas.
- `FavoritosPage`: Android por `flatlist-favorites`, card por desc e coração = `action-button` de maior x (erro nomeado se houver menos de 2); `validaElememnto` espera o item OU `status-alert-icon`; iOS com `CONTAINS` em vez de `BEGINSWITH`. `TEXTO_LISTA_VAZIA` removido.

### Tarefa 2 — Política de execução da DEC-A

Tabela "item da DEC-A → linhas alteradas":

| Item da DEC-A | Resultado |
|---|---|
| (a) build | sem código |
| (b) POC migra na Etapa 0 | feito nos planos 06-02 e 06-03 |
| (c1) sessão por spec / limpeza | **não implementado (decisão)** — limpeza por teste como hoje; `test/utils/sessao.ts` não criado |
| (c2) vídeo | **não implementado (decisão)** — vídeo de todos os testes como hoje |
| (c3) `autoGrantPermissions` | **não implementado (decisão)** — mantido |
| (d) filtro de specs no CI (`WDIO_SPECS`) | **não implementado (decisão)** — CI roda tudo em todos os devices |
| `jobTimeoutMinutes` e teto de polling | **não decididos, não alterados** — decisão depois da medição do run do CI |
| (e) idioma / locale | **não implementado (decisão)** — idioma ignorado |
| Documentação local | `README.md`: subseção "Rodar uma suíte ou um teste só (local)" (`--spec`, `--mochaOpts.grep`, CI sem filtro) |

`package.json`, `package-lock.json`, `wdio.conf.ts`, `testspec.yml`, `testspec-ios.yml` e `.github/` sem alteração (conferido). `appium` fora das dependências.

### Tarefa 3 — Run da fumaça (checkpoint)

Resume-signal do Marcio: "passou — dê como concluído no Android e iOS". Resultado na tabela acima; CI pendente.

## Deviations from Plan

**1. [Regra de 2026-10-01] Grep `texto('favoritos.vazio')` substituído** por evidência de "nenhuma asserção de texto" (sem `toHaveText|getText()|expect(` nos page objects tocados).

**2. [Convenção do 06-02] Grep `id:tab-categories` não casa:** o código usa `seletorTestId('tab-categories')` (`UiSelector.resourceId`).

**3. [Rule 1/2] Guarda do coração Android pela razão** largura do ícone / largura do botão (limite 0,8; vazio ≈ 1,00, preenchido ≈ 0,62), não 52x53 em px — em px o limite quebraria em devices de 1440 de largura.

**4. [Rule 1] iOS: `BEGINSWITH "Camisa"` quebrava** pelo espaço inicial do nome do 1º card (captura 37) → `CONTAINS "R$"`/`CONTAINS "<produto>"`.

Correções feitas pelo orquestrador durante os runs locais, com causa medida:

**5. [Rule 1] Android em inglês quebrou seletores por texto de interface.** O app mostra "Register or login", não "Cadastre-se ou, Faça o login". Trocados por estrutura, sem texto:
- acesso ao Login: `(//*[@resource-id="menu-card"])[1]/preceding::*[@clickable="true"][1]` (`BasePage.seletorAcessoLogin`);
- rodapé de login: `(//*[@resource-id="tab-home"])[1]/preceding::*[@clickable="true"][1][@resource-id=""]`;
- voltar do cabeçalho: `(//*[@clickable="true"])[1]` (`CategoriasPage.voltar`); a entrada `navegacao.voltar` saiu do `textos.ts`;
- card Favoritos: `resourceId("menu-card").instance(2)`;
- Sair: XPath por irmãos de seção (`PerfilPage.logout`).
Validados offline contra as capturas 10, 14, 17, 18, 38, 39, 45, 48 e 51.

**6. [Rule 3] XPath com eixo `preceding` rejeitado** pelo motor XPath2 do UiAutomator2 ("ArrayList$ListItr cannot be cast to NodeType") → `driver.updateSettings({ enforceXPath1: true })` no início de `HomePage.ativarApp()` (só Android). `wdio.conf.ts` inalterado.

**7. [Rule 1] Banner do Insider (raspadinha "Só no APP: 20% OFF") no app migrado.** O "X" é `Button text="Close"`, content-desc vazio, resource-id `wrap-close-button-<n>` (captura do inspector em `.planning/drafts/app-migrado/android/captures-2026-10-01-banner/`); `accessibility id:Close` não o acertava. `fechaBanner` Android: candidatos `resourceIdMatches(".*wrap-close-button.*")` → `text("Close")` → `accessibility id:Close`; espera 20 s; 1ª tentativa `click`, depois `mobile: clickGesture`. O `insiderLayout` sobra na árvore sem criativo (vídeo do run das 20:41 sem banner): sem botão de fechar em 20 s segue sem lançar; só lança se contêiner E botão continuam visíveis.

**8. [Rule 2] Validação do logout sem texto:** `menu-card` com `enabled=false` (Android e iOS) como sinal de "deslogado". No iOS o diálogo nativo de logout pode ser aceito sozinho pelo `autoAcceptAlerts` da sessão remota → sem diálogo, valida pelo estado do Menu (`PerfilPage.confirmarLogout`).

**9. [Rule 2] `LoginPage.garantirDeslogado()`:** se o app abrir logado (`menu-card` com `enabled=true`), faz logout antes de logar (`noReset` local; `clearApp` não limpa no iPhone real).

**10. [Rule 2] `HomePage.validarHome`:** se a Home não vem, `mobile: queryAppState` nomeia crash do app. **Crash real do app observado 1x no AVD** (logcat 2026-10-01 20:29: `RetryableMountingLayerException: Unable to find viewState for tag 266`, React Native Fabric/Reanimated, na transição Termos → Home) — bug intermitente do app, para o time do app; não é da suíte.

**11. Política de execução (DEC-A "como hoje") mantida;** só README documentado.

## Seletores da POC — situação

Android = verificado no AVD-S24 (run verde 17/17). iOS = verificado no iPhone, Remote Access (2 runs verdes 17/17). Nenhum seletor falhou nos runs.

| Seletor | Android | iOS |
|---|---|---|
| `category-button` + rótulo (Roupas) | verificado | verificado |
| `sub-categories-button` + rótulo (Camisas) | verificado | verificado |
| `product-list` | verificado | n/a |
| rodapé do card `descriptionContains(", R$")` / card iOS `name CONTAINS "R$"` (faixa 30–60%) | verificado | verificado |
| `action-button` instance(0) como coração do mesmo card | verificado | verificado (class chain `[1]`) |
| razão `action-button-icon` / `action-button` (guarda e confirmação) | verificado | — (iOS pela largura do ícone, <26: verificado) |
| voltar do cabeçalho (Android estrutural; iOS chevron `[2]` / `~Back`) | verificado | verificado |
| tab bar `tab-categories` / `tab-menu` | verificado | verificado |
| `flatlist-favorites` | verificado | verificado |
| `status-alert-icon` (estado vazio) | verificado só como seletor presente no fluxo; o ramo "vazio inesperado" não foi exercitado | idem |
| card de Favoritos por desc / `CONTAINS "<produto>"` e coração = `action-button` de maior x | verificado | verificado |
| Guarda "Conta suja" (ramo de erro) | não exercitado (conta começou limpa) | não exercitado |
| Banner do Insider — "Close" Android (`wrap-close-button-<n>` / `text("Close")`) | verificado por captura do inspector (1 ocorrência) + run verde | — |
| Banner do Insider — iOS | — | **não verificado** (não apareceu nos runs) |

## Known Stubs

Nenhum.

## Threat Flags

Nenhum. Nenhuma linha nova ecoa senha; nenhum arquivo de CI foi tocado.

## Self-Check: PASSED

- `npx tsc --noEmit` filtrando `test/Draft.ts`: saída vazia (0 linhas).
- `package.json`, `package-lock.json`, `wdio.conf.ts`, `testspec.yml`, `testspec-ios.yml` e `.github/` sem alteração; `test/utils/sessao.ts` não existe (por decisão).
- Arquivos citados existem: `test/pageobjects/CategoriasPage.ts`, `FavoritosPage.ts`, `test/utils/textos.ts`, `README.md`, `test/specs/00-poc-favoritar.spec.ts`.
- Nenhum commit; `STATE.md`, `ROADMAP.md` e `config.json` não foram alterados por este plano.
- Pendência declarada (não é falha): run do Device Farm, duração por job e tamanho do Customer Artifacts.
