---
phase: 06-cenarios-gherkin-app-migrado
plan: 02
subsystem: testing
tags: [m6, tracer, app-migrado, testid, onboarding, login, logout, allure-helpers, textos]

requires:
  - phase: 06-cenarios-gherkin-app-migrado
    provides: "06-01 — DEC-A, drafts e capturas iOS sessão A, achados iOS que mudam o código"
provides:
  - "test/utils/allure-helpers.ts: step(), configurarFechadorDeBanner(), rotularTeste(), registrarAvisoNoRelatorio()"
  - "test/utils/textos.ts: rótulos de fallback para seletores sem testID (nunca usados em asserção)"
  - "test/specs/00-poc-favoritar.spec.ts no lugar de test.spec.ts (fumaça da fase)"
  - "BasePage/HomePage/LoginPage/PerfilPage no app migrado: onboarding -> Home -> login -> logout, Android e iOS"
affects: [06-03, 06-04, 06-05]

key-files:
  created:
    - test/utils/allure-helpers.ts
    - test/utils/textos.ts
    - test/specs/00-poc-favoritar.spec.ts
  modified:
    - test/pageobjects/BasePage.ts
    - test/pageobjects/HomePage.ts
    - test/pageobjects/LoginPage.ts
    - test/pageobjects/PerfilPage.ts
  deleted:
    - test/specs/test.spec.ts

key-decisions:
  - "DEC-B resolvida pela regra de 2026-10-01: idioma ignorado, sem validação de texto"
  - "Android: testID via UiSelector.resourceId() (helper seletorTestId), não 'id:<testID>'"
  - "Android: botão de entrar só por testID 'pressable' (único na tela de Login); sem texto"
  - "textos.ts só guarda rótulos de seletor de fallback; texto() nunca entra em expect"
  - "ativarApp() pula Boas-vindas a Termos se a aba Home já existe (noReset local)"

requirements-completed: [D-01, D-02, D-03, D-04, D-05, D-08]

status: complete
completed: 2026-10-01

actuals:
  tokens: 20751   # chars/4 dos 7 arquivos tocados que continuam existindo; não conta o test.spec.ts removido
  tasks: 2        # Tarefa 1 não é tarefa de execução (resolvida pela regra); Tarefas 2 e 3 feitas
  commits: 0      # regra do projeto: nenhum commit (o Marcio versiona)
---

# Phase 06 Plan 02: Tracer — POC migrada, onboarding, Home, login e logout Summary

**A POC do favoritar virou `00-poc-favoritar.spec.ts` com helpers Allure compartilhados, e o caminho abrir app -> onboarding -> Home -> login -> logout está escrito para o app migrado nas duas plataformas, só por testID/estrutura e sem nenhuma asserção de texto. Nada foi exercitado em aparelho: o `tsc` está limpo e todos os seletores novos estão "não verificados" até o run da fumaça.**

## DEC-B

**DEC-B resolvida pela regra de 2026-10-01: idioma ignorado, sem validação de texto.** (`06-CONTEXT.md` D-04 corrigida, D-05 revogada; `REQUIREMENTS.md` critérios de aceite.) A Tarefa 1 do plano (checkpoint de decisão) não foi apresentada ao Marcio. Consequências aplicadas:

- Nenhum `expect`/comparação de texto exibido nos arquivos tocados (grep abaixo).
- `test/utils/textos.ts` ficou só com rótulos usados para **localizar** elemento onde o app não tem testID, cada um com `fonte`.
- O 06-02-PLAN falava em "duas linhas de Idioma do app observado copiadas das NOTAS.md"; isso não se aplica (a captura Android em inglês foi cancelada no 06-01).

## O que mudou

### Tarefa 2 (tracer) — fumaça até a Home

- **`test/utils/allure-helpers.ts` (novo):** `configurarFechadorDeBanner`, `step` (mesma semântica do spec antigo: fecha banner, roda, PASSED/FAILED, relança), `rotularTeste(codigo)` (testCaseId/historyId `codigo::device`, parentSuite "device — conta", argumentos Device/Conta, label host; devolve `{device, conta}`; a senha não sai do helper), `registrarAvisoNoRelatorio`.
- **`test/specs/00-poc-favoritar.spec.ts` (novo):** mesmo `describe`, mesmo título de `it` ("Adiciona produto em favoritos e valida adição"), `rotularTeste('adiciona-favoritos')` mantém o historyId de hoje, `limparFavoritoOrfao` fica no spec e usa `registrarAvisoNoRelatorio`, e `homePage.validarHome()` entra logo depois de `ativarApp()`. `test/specs/test.spec.ts` removido do working tree (arquivo apagado; nenhum comando git de estado).
- **`BasePage.ts`:** `seletorTestId(id)` (exportado); Android: `iniciaApp()` (container clicável ancestral de `first-access-item-animation`, destino validado, até 2 toques, erro "Boas-vindas não avançou"), `ativaGps()` -> `permission_allow_foreground_only_button`, `continua()` (exige `permission-topic`, aceita e espera sair), `termo1()/termos2()` (orçamento de 45 swipes, parada por `isDisplayed()`, erro "aceite da Política/dos Termos não apareceu após 45 swipes", transição validada); iOS: `iniciaAppIOS()` (alerta de notificação opcional, CTA por fração (0.510, 0.892) com destino validado), `permissaoLocalizacaoIOS()` (ATT + localização por `mobile: alert`, rótulo escolhido via `getButtons`, ordem não presumida), `aceitaOnboardingIOS()` (orçamento 45 swipes, erro nomeado no lugar do "Aceite pulado"); `rolaAteVisivelIOS(seletor, maxScrolls = 14)`; novos `algumVisivel()`, `onboardingJaConcluido()`, `seletorAcessoLogin()`.
- **`HomePage.ts`:** `ativarApp()` começa com `mobile: activateApp`; `validarHome()` e `irParaHome()` novos; `abrirPerfil()` e `abrirCategorias()` Android por `tab-menu`/`tab-categories` (o array `SELETORES_PERFIL` saiu).

### Tarefa 3 — login e logout

- **`LoginPage.ts`:** Android abre o Login pelo item do Menu deslogado, acha os dois `EditText` uma vez (ordem 0 e 1), digita, toca `pressable` até 2 vezes validando o destino (nunca `BACK` para o teclado), falha com "o app não saiu da tela de Login depois de 2 toques"; iOS mantém a digitação lenta, a pausa de 2,5s e o retry do tap, trocando só os seletores (`Password` sem asterisco no app migrado).
- **`PerfilPage.ts`:** `abrirFavoritos()` por `menu-card` + início do desc/label; `logout()` rola até o item de sair (swipe + `isDisplayed()`, erro nomeado); `confirmarLogout()` **não retorna mais cedo no iOS**: confirma o alerta nativo (Android `android:id/button1`, iOS class chain no `XCUIElementTypeAlert`) e valida o estado deslogado pelo acesso ao Login de volta no Menu.

## Seletores novos — TODOS "não verificados — confirmar no run do 06-03"

| Seletor | Arquivo | Captura de origem |
|---|---|---|
| Container das Boas-vindas: `//*[@resource-id="first-access-item-animation"]/ancestor::*[@clickable="true"][1]` | BasePage `iniciaApp` | android `captures-2026-09-29/01-boasvindas.xml` (**A5: toque no centro do container equivale ao CTA — inferido**) |
| `permission_message` / `permission_allow_foreground_only_button` / `permission_allow_button` | BasePage | android `02-permissao-local.xml`, `03-permissao-notif.xml` |
| `permission-topic`, `accept-button` (Android, resourceId) | BasePage `continua`/`termo1`/`termos2` | android `04-topicos.xml`, `05/06-politica*.xml`, `07/08-termos*.xml` |
| CTA iOS por fração (0.510, 0.892) | BasePage `iniciaAppIOS` | ios `captures-m6-sessao-a/ACOES.md` cap. 02 |
| Alertas SpringBoard: `mobile: alert` `getButtons`/`accept`, rótulos "Allow While Using App", "Allow" | BasePage | ACOES.md cap. 00, 03, 04, 05 |
| `accept-button` (iOS), `permission-topic` (iOS) | BasePage | ACOES.md cap. 02, 06-10 |
| `tab-home`, `editorial-home-root` (Android resourceId / iOS accessibility id; no iOS a raiz é checada por **existência**, vem `visible=false`) | HomePage `validarHome`/`irParaHome` | android `09-home.xml`; ios draft 06 / cap. 10 |
| `tab-menu`, `tab-categories` (Android resourceId) | HomePage | android `09-home.xml` |
| Acesso ao Login: Android desc "Cadastre-se ou, Faça o login"; iOS `~Register or login` — **por texto, frágil** | BasePage `seletorAcessoLogin` / textos.ts | android `10-menu-deslogado.xml`; ACOES.md cap. 11, 12 |
| Rodapé deslogado: Android desc "Faça o login"; iOS `~login` — **por texto, frágil** | textos.ts | android `51-pos-logout.xml`; ACOES.md cap. 32 |
| Campos Android: `EditText` instance 0 e 1 (estrutura) | LoginPage | android `captures-2026-09-29-m6e1/15-login-vazio-pt.xml` |
| Botão de entrar Android: resourceId `pressable` (1 ocorrência por tela de Login) | LoginPage | m6e1 `15`, `17`, `20` (conferido por contagem) |
| iOS login: `~Email`, `~Password`, `pressable`+label "Sign in", modal `label CONTAINS "Incorrect username"` — **por texto, frágil** | LoginPage / textos.ts | ACOES.md cap. 12, 16, 17, 18 |
| `menu-card` + início do desc "Favoritos" (Android) / label CONTAINS "Favorites" (iOS) — **por texto, frágil** | PerfilPage | android `45-menu-logado.xml`; ACOES.md cap. 41 |
| `menu-list-button` + desc "Sair" (Android) / label "Logout" (iOS) — **por texto, frágil** | PerfilPage | android `48-menu-rolado.xml`; ACOES.md cap. 29, 30 |
| `android:id/button1` (confirmar logout Android) | PerfilPage | android `50-dialogo-logout.xml` |
| iOS: class chain `XCUIElementTypeAlert/**/XCUIElementTypeButton[name == "Logout"]` — **por texto, frágil** | PerfilPage | ACOES.md cap. 32 (draft ios/28) |

## Deviations from Plan

**1. [Regra de 2026-10-01] Tarefa 1 (DEC-B) não virou checkpoint** — resolvida pela regra de idioma; ver seção DEC-B.

**2. [Rule 3 - risco de seletor] Android usa `UiSelector.resourceId()`, não `id:<testID>`** (pedido pelo plano: `id:accept-button`, `id:tab-menu`)
- **Motivo:** o testID do RN é `resource-id` sem prefixo de pacote; se o locator `id` do UiAutomator2 prefixar o pacote ele não casa. Isso **não foi verificado** neste repo. O `resourceId("action-button")` do `CategoriasPage` já provou verde no app antigo, então virou o padrão via `seletorTestId()`.
- **Efeito:** os greps `id:accept-button` e `id:tab-menu` da verificação automatizada do plano **não casam** (o código usa `seletorTestId('accept-button')`/`('tab-menu')`). Equivalente conferido: `seletorTestId('accept-button')` em BasePage e `seletorTestId('tab-menu')` em HomePage.

**2b. [Override do Marcio] `login.botaoEntrar` não é lido no Android** — o botão é achado só por `pressable` (único na tela de Login). `texto('login.botaoEntrar')` existe só para o iOS (a chave não tem valor Android e `texto()` lançaria se alguém a usasse lá, de propósito).

**3. [Rule 2 - correção/robustez] `onboardingJaConcluido()` em `ativarApp()`** — não estava no plano. Se a aba Home já existe (app com `noReset` local, já aceito), as telas de Boas-vindas a Termos não aparecem e esperá-las falharia falso; os passos antigos eram opcionais e toleravam isso. Custo: 4s de espera por execução num app limpo. Quem confirma a Home de verdade continua sendo `validarHome()`.

**4. [Rule 2] Ordem dos alertas iOS não presumida** — `aceitarAlertasSistemaIOS()` lê os botões (`getButtons`) e escolhe entre "Allow While Using App" e "Allow", em vez de fixar notificação/ATT/localização. `permissaoLocalizacaoIOS()` mantém o nome do plano mas hoje trata ATT + localização.

**5. [Observação] Itens do plano não aplicáveis ou parcialmente aplicados**
- "`accept-button` em laço com limite" no iOS: o laço é sobre as 3 telas; o limite é o orçamento de 45 swipes por tela.
- `HomePage.irParaHome()` foi escrito mas **ainda não é chamado** por nenhum spec (existe para as etapas seguintes).
- Comentários que ainda citam `test.spec.ts`: `FavoritosPage.ts` (06-03), `.github/workflows/mobile_test.yml` linha 205 e `wdio.conf.ts` linha 177 — não tocados (fora do plano; só comentário).

## Known Stubs

Nenhum. Os valores de `textos.ts` são rótulos reais capturados, com `fonte`. Rótulo não capturado lança erro nomeado.

## Threat Flags

Nenhum. Senha só aparece como contagem de caracteres (`⌨ N caracteres`); `rotularTeste` publica só o e-mail da conta, como já era (T-06-02-02, aceito).

## Verificação feita (estática, nada em aparelho)

- `npx tsc --noEmit` filtrando `test/Draft.ts` (erros pré-existentes de arquivo-rascunho, fora do escopo): **saída vazia**.
- `node -e "import('./test/utils/textos.ts')…"`: `textos ok 9`, nenhuma entrada sem `fonte`; `texto('login.botaoEntrar')` no Android lança "texto do app não capturado: login.botaoEntrar (android) — capturar antes de usar (CLAUDE.md)".
- Asserção de texto: `grep -E "toHaveText|toHaveTextContaining|toHaveElementText|getText\(\)|expect\("` em LoginPage, PerfilPage, HomePage, specs e utils: **nada**. (`BasePage.elementVisible` tem um `expect(...).toBeDisplayed()` pré-existente, de presença, não de texto.) Nenhum `texto(...)` em comparação.
- `grep "fonte:"`: BasePage 13, HomePage 4, LoginPage 6, PerfilPage 3 (critério: ≥6).
- `grep "pulado"` em BasePage: só o `clickIfPresent` genérico (diálogos de permissão opcionais); `termo1 pulado`/`termos2 pulado` não existem mais.
- `grep -E '\$\{(senha|password)\}' test`: nada.
- `find test -iname '*ios*' -o -iname '*android*'`: nada.
- `git status` em `package.json`, `package-lock.json`, `wdio.conf.ts`, `testspec*.yml`, `.github`: sem alteração.
- Nenhum comando git de estado, nenhum adb/Appium/wdio/AVD/Device Farm.

## O que o Marcio precisa rodar (o agente não roda) e o que olhar

**Android (AVD-S24, só quando o Marcio quiser — o emulador é dele):**

```bash
npm run wdio:android -- --spec test/specs/00-poc-favoritar.spec.ts
```

Olhar no log:
- `✅ Boas-vindas avançou (toque N/2)` — se vier `⚠ Toque 1/2 ... não avançou` seguido de erro "Boas-vindas não avançou", a Assumption A5 (toque no container = CTA) caiu: capturar de novo.
- `✅ Aceite (Tópicos de permissão)`, `(Política de Privacidade)`, `(Termos e condições)` e `🏠 Home confirmada (tab-home + editorial-home-root)`.
- No AVD local o `autoGrantPermissions` pula os diálogos: esperar `⏭️ Passo opcional pulado` para localização e notificação (normal).
- Login: `✅ Login efetivado`; se aparecer `⚠ Toque 1/2 em entrar não saiu da tela de Login — repetindo` é a regra do teclado (draft 08), esperada.
- Logout: `✅ Logout confirmado pelo estado da tela`.
- Os passos **após o login** (`categoriaPage.*`, `favoritosPage.*`, `voltar()`) ainda usam os seletores do app antigo — são o escopo do **06-03**; é esperado o spec **falhar a partir de `categoriaPage.clickRoupas()`** (ou antes, se algum seletor novo falhar). Para a fumaça deste plano basta ver passando `ativarApp`, `validarHome`, `abrirPerfil`, `logar`.

**iOS (sessão AWS Remote Access aberta pelo Marcio):**

```bash
npm run wdio:ios -- --spec test/specs/00-poc-favoritar.spec.ts
```

Olhar:
- `🔔 Alerta do sistema (notificação)` -> `✅ Alerta aceito por "Allow"`; `👆 Toque por coordenada (CTA ...)` -> `✅ Boas-vindas avançou`; depois ATT ("Allow") e localização ("Allow While Using App") em `permissaoLocalizacaoIOS`.
- `✅ Aceite (política de privacidade)` (~21 swipes, ~48s) e `(termos e condições)` (~9 swipes).
- `🏠 Home confirmada` — atenção ao `editorial-home-root` (existência, `visible=false` no dump): se `waitForExist` não o achar, o erro "Home não apareceu: ... editorial-home-root presente=false" aponta isso.
- Login com `⌨ Email: N caracteres...` e `✅ Login efetivado (tap 2/2)`.
- Não validado em nenhuma captura: `mobile: alert accept` no diálogo de logout (o plano usa o botão por class chain, que foi o que funcionou na sessão A).

## Self-Check: PASSED

- Arquivos criados existem: `test/utils/allure-helpers.ts`, `test/utils/textos.ts`, `test/specs/00-poc-favoritar.spec.ts`; `test/specs/test.spec.ts` ausente.
- `tsc --noEmit` limpo fora de `test/Draft.ts`; checagens estáticas acima.
- `STATE.md`, `ROADMAP.md`, `config.json` não foram alterados; nenhum commit.

## Arquivos alterados (working tree, sem commit)

- novo: `test/utils/allure-helpers.ts`, `test/utils/textos.ts`, `test/specs/00-poc-favoritar.spec.ts`
- modificado: `test/pageobjects/BasePage.ts`, `test/pageobjects/HomePage.ts`, `test/pageobjects/LoginPage.ts`, `test/pageobjects/PerfilPage.ts`
- removido: `test/specs/test.spec.ts`
- novo (este documento): `.planning/phases/06-cenarios-gherkin-app-migrado/06-02-SUMMARY.md`
