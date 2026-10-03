---
phase: 06-cenarios-gherkin-app-migrado
plan: 05
subsystem: testing
tags: [m6, etapa-1, logout, dialogo-nativo, app-migrado, testid, parcial]

requires:
  - phase: 06-cenarios-gherkin-app-migrado
    provides: "06-03 — logout()/confirmarLogout() validados no AVD e no iPhone; 06-04 — onboarding, login, gate de cobertura, DEC-C (f)"
provides:
  - "PerfilPage: dialogoLogoutObservavel(), abrirDialogoLogout(), validarEstruturaDialogoLogout(), cancelarLogout(), validarLogado()"
  - "03-logout.spec.ts: OUT-01..03, sem seletor no spec e sem asserção por texto"
  - "A Etapa 1 inteira (15 cenários) completa no código; gate de cobertura verde para COBERTURA_ETAPA_ATE=1"
affects: [06-06]

key-files:
  created:
    - test/specs/03-logout.spec.ts
  modified:
    - test/pageobjects/PerfilPage.ts

key-decisions:
  - "REGRA FIXA sem texto (2026-10-01): OUT-01 asserta a ESTRUTURA do diálogo (título, mensagem, button2, button1), nunca uma string"
  - "DEC-C (f): no iOS sem diálogo observável, OUT-01 e OUT-02 pulam com motivo; OUT-03 valida o logout direto pelo estado do Menu"
  - "Sem test/utils/sessao.ts (DEC-A): cada it se prepara sozinho com os métodos existentes"

requirements-completed: []

status: parcial — Tarefa 1 concluída; Tarefa 2 (run da Etapa 1) aguardando o Marcio

completed: pendente (a Tarefa 2 ainda não rodou)

actuals:
  tokens: 3500    # chars/4 sobre o acréscimo em PerfilPage.ts (~8,5k chars) e o spec novo (5,3k chars), medido por wc -c
  tasks: 1        # de 2; a Tarefa 2 é checkpoint humano e está pendente
  commits: 0      # Nenhum commit (regra do projeto): o Marcio versiona
---

# Phase 06 Plan 05: Etapa 1 — Logout (OUT-01..03) e fechamento da etapa — Summary PARCIAL

**OUT-01..03 escritos como WDIO + Mocha para as duas plataformas, com o diálogo de logout asserido pela estrutura (sem ler texto) e o ramo iOS pulado por DEC-C (f) onde o `autoAcceptAlerts` engole o diálogo. A Etapa 1 (15 cenários) está completa no código; NADA disto foi exercitado contra device. O run da Etapa 1 (Tarefa 2) é do Marcio e está pendente.**

Nenhum commit (regra do projeto). Nenhum comando de device foi executado: só `tsc`, `node --test` e `grep`.

## Estado

| Tarefa | Situação |
|---|---|
| 1 — Logout OUT-01..03 nas duas plataformas | **Concluída** (código + verificações estáticas) |
| 2 — Run da Etapa 1 (AVD-S24 + Device Farm Android e iOS) | **Aguardando o Marcio** (checkpoint:human-verify) |

## Tarefa 1 — o que foi feito

- `PerfilPage.ts`
  - `seletorSair()` (private): o seletor de "Sair" que `logout()` já usava (Android: XPath estrutural do 06-03, **verbatim**; iOS: `menu-list-button` + rótulo via `texto('menu.sair')`), extraído para ser compartilhado com `validarLogado()`. `logout()` passou a chamá-lo; strings idênticas, comportamento igual. `confirmarLogout()` **não foi tocado**.
  - `dialogoLogoutObservavel()`: Android sempre `true`; iOS `true` só se a capability `autoAcceptAlerts` da sessão for explicitamente `false`. Chave ausente conta como "não observável" (a escolha segura: pula com motivo em vez de tocar em Sair e perder o diálogo). Não toca o device.
  - `abrirDialogoLogout()`: `logout()` + espera de 10 s pelo diálogo (Android `alert_title`; iOS o `XCUIElementTypeAlert`), com erro nomeado.
  - `validarEstruturaDialogoLogout()`: Android confere `alert_title`, `android:id/message`, `android:id/button2` e `android:id/button1` visíveis e lista os ausentes no erro; iOS (`private validarEstruturaDialogoLogoutIOS()`) confere o Alert com exatamente 2 botões. Nenhuma string lida.
  - `cancelarLogout()`: Android `android:id/button2`; iOS 1º botão do Alert (class chain `[1]`); espera o diálogo fechar (10 s) e chama `validarLogado()`.
  - `validarLogado()`: o item "Sair" visível OU um `menu-card` `enabled=true`, e como contraprova nenhum `menu-card` `enabled=false` na tela. Erros nomeados nos dois casos.
- `03-logout.spec.ts` (novo): `describe('Menu — Logout')` com 3 `it` de títulos idênticos aos do PDF/inventário. Cada `it` se prepara sozinho (`ativarApp` → `validarHome` → `abrirPerfil` → `logar(getCredentials())` → `abrirPerfil`). OUT-01 e OUT-02 chamam `pularNestaPlataforma(this, MOTIVO_IOS_DIALOGO_LOGOUT)` (citando "DEC-C (f)") quando `dialogoLogoutObservavel()` é falso, **antes** de mexer no app. OUT-03 usa `logout()` + `confirmarLogout()` (que já confirma quando o diálogo aparece e valida o Menu deslogado nos dois casos).

## Deviations from Plan

**1. [Regra fixa — sem texto/idioma] `textosDialogoLogout()` e as chaves `logout.*` de `textos.ts` NÃO foram criados.** O plano mandava devolver título/mensagem/rótulos lidos da árvore e o OUT-01 compará-los com os textos capturados (D-05). Fora (REQUIREMENTS.md, 2026-10-01): em vez disso `validarEstruturaDialogoLogout()` asserta a presença de título, mensagem e dos dois botões pelos ids. `test/utils/textos.ts` **não foi alterado** (a chave `logout.confirmar` que já existe é do 06-02/06-03, usada só para localizar o botão no iOS). Consequência: o conteúdo do PDF ("Você deseja sair da sua conta?", CANCELAR, SAIR) **não é conferido**; é decisão registrada.

**2. [Regra fixa] "Sair" localizado como o 06-03 fez, sem `texto('menu.sair')` no Android.** O `PerfilPage` já tinha o XPath estrutural (desvio 5 do 06-03-SUMMARY); foi reaproveitado via `seletorSair()`. No iOS segue o `texto('menu.sair')` do 06-03, só para localizar.

**3. [Regra fixa] Estado logado/deslogado pelo `menu-card` `enabled`**, padrão do desvio 8 do 06-03 (`validarLogado()` e `confirmarLogout()`), e não por "o acesso ao login ausente" por texto. Detalhe de projeto: depois do cancelar o Menu fica rolado e os `menu-card` podem sair da árvore (lista virtualizada; as capturas m6e1 31/32 só têm `menu-list-button`), por isso o item "Sair" é o 1º sinal de logado e o `menu-card` o 2º.

**4. [DEC-A] Sem `test/utils/sessao.ts`:** nenhum `garantirPreparo`/`invalidarPreparo`. Cada `it` refaz o preparo (onboarding se preciso + login). O plano (T-06-05-01) previa `invalidarPreparo()` em OUT-03; sem sessão mantida não há o que invalidar.

**5. [DEC-C f] O critério "diálogo observável no iOS" é lido da sessão, não fixo.** A 06-04 usou um `alertasObservaveis()` estático (falso no iOS). Aqui o `dialogoLogoutObservavel()` lê `driver.capabilities` (`appium:autoAcceptAlerts` ou `autoAcceptAlerts`). Como o `wdio.conf.ts` liga `autoAcceptAlerts` em todos os ramos iOS e não muda, na prática OUT-01 e OUT-02 pulam sempre no iOS e o ramo iOS de abrir/validar/cancelar o diálogo é **código ainda não exercitável** neste ambiente (mantido para o dia em que a configuração mudar). **Risco:** se o WDIO devolver a capability sem a chave, a função devolve `false` e também pula — comportamento seguro, mas indistinguível de "ligado"; o motivo no Allure diz "autoAcceptAlerts" nos dois casos.

**6. [Contagem] 15 cenários, não 16.** ONB-06 está excluído (06-04); a Etapa 1 é ONB-01..05, ONB-07, LOG-01..05, LOG-07, OUT-01..03.

**7. [Informativo] Caminho de captura do plano não existe** (`captures-m6-e01-en/`, já registrado no 06-04, desvio 9). Usados: `.planning/drafts/app-migrado/android/captures-2026-09-29-m6e1/` (31 e 32), os drafts `24-menu-logado.md` e `28-logout.md`, e `ios/captures-m6-sessao-a/NOTAS.md` (capturas 30 a 32).

**8. [Informativo] Os dumps m6e1 31/32 não contêm o diálogo** (o `getPageSource` de janela única não o expõe e há o banner do Insider por cima — 06-RESEARCH). Os ids do diálogo vêm do draft 28 (captura A09 `50-dialogo-logout`). O `android:id/button1` já foi exercitado em run (17/17 da POC, via `confirmarLogout()`); `alert_title`, `android:id/message` e `android:id/button2` **não**.

## Seletores novos — situação: NÃO VERIFICADOS

Nenhum foi exercitado por WDIO. O run da Etapa 1 (Tarefa 2) é a verificação.

| Seletor / comportamento | Plataforma | Evidência | Situação |
|---|---|---|---|
| `id:com.aramis.ecomm:id/alert_title` (presença do diálogo) | Android | draft 28 (captura 50); ausente nos dumps m6e1 31/32 | não verificado |
| `id:android:id/message` | Android | draft 28 | não verificado |
| `id:android:id/button2` (cancelar) | Android | draft 28 | não verificado |
| `id:android:id/button1` (confirmar) | Android | draft 28 **e** run verde da POC (AVD 17/17) | **verificado** (via `confirmarLogout()`) |
| Os 4 ids acima aparecem no `getPageSource()` do Appium com o diálogo aberto (e não só no dump de janelas) | Android | só a captura 50 (dump padrão) | não verificado — se faltar, `abrirDialogoLogout()` falha com erro nomeado |
| `seletorSair()` Android (XPath estrutural) | Android | 06-03: run verde no AVD | verificado (reaproveitado) |
| `menu-card` `enabled(true)` como sinal de logado | Android | m6e1/29 e captura 45 (true); usado em `garantirDeslogado()` só como "não existe" nos runs verdes | não verificado como PRESENÇA positiva num run |
| "Sair" visível após cancelar (Menu rolado, dialog fechado) | Android | m6e1/32 (`Sair` presente com o diálogo fechado) | não verificado em run |
| `-ios class chain:**/XCUIElementTypeAlert` (+ `/**/XCUIElementTypeButton`, `[1]` = Cancel) | iOS | NOTAS.md capturas 30 a 32 (Alert [41,365 320x172], `getButtons` = ["Cancel","Logout"]) | não verificado — e **inalcançável** com `autoAcceptAlerts` ligado (OUT-01/02 pulam) |
| Leitura de `driver.capabilities['appium:autoAcceptAlerts']` | iOS | nenhuma | **não verificado** (ver desvio 5) |

## Pendências

1. **Tarefa 2 — run da Etapa 1** (AVD pelo Marcio; CI pelo Marcio) — ver "Resultado do run".
2. iOS: OUT-01 e OUT-02 não exercitam o diálogo enquanto `autoAcceptAlerts` estiver ligado no `wdio.conf.ts` (exceção temporária no REQUIREMENTS.md). Cobertura real do diálogo no iOS depende dessa decisão do Marcio — não está escrito.
3. A pergunta/rótulos do PDF ("Você deseja sair da sua conta?", CANCELAR, SAIR) não são conferidos (regra fixa sem texto).
4. Pendências herdadas do 06-04 seguem abertas: iOS sem reset de dados (ONB-05/07 podem pular), `clearApp` x `autoGrantPermissions` no AVD, LOG-05 2ª cláusula, e a leitura da caixa do Gmail (LOG-07).

## Resultado do run da Etapa 1 (Tarefa 2) — PENDENTE

| Ambiente | passing | skipped | failing | Duração | Quando |
|---|---|---|---|---|---|
| Android AVD-S24 (Marcio) | pendente | pendente | pendente | pendente | pendente |
| Device Farm Android (6 devices) | pendente | pendente | pendente | pendente por job | pendente |
| Device Farm iOS (5 devices, 1 run cada) | pendente | pendente | pendente | pendente por job | pendente |

Tamanho do Customer Artifacts por device e duração por job (AWS CLI, só leitura): **pendente**. Seletores "verificados" depois do run: **pendente**. Divergências novas observadas: **pendente**.

## Known Stubs

Nenhum.

## Threat Flags

Nenhum. Superfície nova só em código de teste; nenhuma linha interpola senha; nenhum arquivo de CI foi tocado. T-06-05-01: OUT-03 encerra a sessão; sem sessão mantida entre `it`, cada um refaz o login (a limpeza do app do `afterTest` segue valendo).

## Self-Check: PASSED (verificações estáticas da Tarefa 1; nenhum run em device)

Saídas reais, desta sessão:

```
$ npx tsc --noEmit 2>&1 | grep -v '^test/Draft.ts'
(vazio — 0 linhas)
```
(Na 1ª execução apontou `TS2367` em `PerfilPage.ts`: `$$(...)` devolve um chainable e `.length` é `Promise<number>`; corrigido com `await $$(...).length`, depois 0 linhas.)

```
$ COBERTURA_ETAPA_ATE=1 node --test test/utils/cobertura.check.mjs
ok 1 - inventário: 101 IDs únicos e títulos preenchidos
ok 2 - inventário: A+P por etapa e total de excluídos
ok 3 - inventário: ONB-06 e LOG-06 conforme as decisões
ok 4 - cada A exigido aparece em exatamente um it( com "[ID] título"
ok 5 - cada P exigido aparece em exatamente um it.skip( "[PENDENTE — ...] [ID] título"
ok 6 - nenhum excluído (E) aparece em it/it.skip
ok 7 - nenhum ID repetido nem fora do inventário
ok 8 - uma suíte só: nenhum arquivo de test/ com ios ou android no nome
# tests 8  # pass 8  # fail 0   (exit 0)
```

Caso negativo conferido: com `COBERTURA_ETAPA_ATE=2`, o teste 4 falha (`not ok 4`), como esperado (a Etapa 2 não existe).

```
$ grep -cE 'it(\.skip)?\(.*\[OUT-0[1-3]\]' test/specs/03-logout.spec.ts          -> 3
$ grep -nE '\$\(|accessibility id:|uiautomator' test/specs/03-logout.spec.ts     -> vazio (exit 1)
$ grep -nE '\$\{(senha|password)\}' -r test/                                      -> vazio (exit 1)
$ grep -nE 'toHaveText|getText\(|getAlertText|expect\(' PerfilPage.ts 03-logout.spec.ts -> vazio (exit 1)
$ git diff -- wdio.conf.ts package.json package-lock.json testspec.yml testspec-ios.yml .github   -> vazio
```

- `.claude/`, `wdio.conf.ts`, `package.json`, `package-lock.json`, `testspec*.yml`, `.github/` e `test/utils/textos.ts` não foram editados por este plano. `STATE.md`, `ROADMAP.md`, `REQUIREMENTS.md` e `config.json` também não: já constavam como modificados no `git status` inicial (o `REQUIREMENTS.md` e o `STATE.md` têm mtime de hoje 12:13; este agente não os editou, a alteração veio de fora).
- Arquivos citados existem: `test/specs/03-logout.spec.ts`, `test/pageobjects/PerfilPage.ts`.
- Nenhum commit.
- **Não verificado, por regra:** nenhum seletor, toque ou comportamento do app foi exercitado (tabela acima). `logout()`/`confirmarLogout()` e a POC não foram rodados após a refatoração de `seletorSair()`; só `tsc`. Se a POC regredir no run, olhar `seletorSair()` primeiro (as strings são idênticas às anteriores).
