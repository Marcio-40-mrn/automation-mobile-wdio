# STATE

Atualizado em **2026-09-10**.

> Este arquivo foi mesclado nesta data. A cópia do `.planning/` trazida de outra pasta em
> 2026-09-10 sobrescreveu a versão de 09-09 com a de 09-08 — os drafts e o relatório de
> anomalias eram adição pura (ganho), mas o STATE/ROADMAP voltaram no tempo. O conteúdo
> abaixo junta as duas: as decisões de desenho iOS vieram da versão de 09-08, os achados de
> CI da de 09-09, e o resto é de hoje.

## Onde o projeto está

**Android: verde.** `CI Run #6` (2026-09-09) fechou **18/18 PASSED** no pool de 6 devices.
É a referência, e o desenho do Android não deve ser alterado.

**Marco atual: M3, passo 5** — a mesma suíte rodando no iOS. O código iOS **já foi
exercitado contra aparelho de verdade**: no `CI iOS Run #6` o onboarding, o alerta de
localização, os três aceites, o login e o `voltar()` pelo chevron funcionaram. O fluxo
morre depois disso, por bugs pontuais (ver Pendências).

Lembrete do que o M3 é, porque é fácil de distorcer: **uma suíte só**. O
`test/specs/test.spec.ts` não muda, nenhum page object novo é criado, e o `if` de
plataforma mora dentro do método — como o `ativarApp()` de `HomePage.ts` já faz.

## Working tree

Branch `main`, HEAD em **`3a6f813`**. As correções de 2026-09-09 (`.env` do iOS viajando no
ZIP e o chevron do `voltarIOS()`) **estão commitadas** ali e **foram validadas** no
`CI iOS Run #6` — não são mais pendência.

Não commitado (a mudança de hoje, "um email por device"):

| Arquivo | O que mudou |
|---|---|
| `.github/workflows/mobile_test.yml` | job iOS: 5 runs de 1 device em vez de 1 run de 5. Novo step `Resolver devices e contas do pool iOS` (monta `<nome, arn, email>`), `Agendar runs iOS (um por device)` gera e sobe um testspec por aparelho, e o wait/download passam a iterar os 5 runs. **Job Android e `publish-report` byte a byte idênticos.** |
| `testspec-ios.yml` | o bloco do `.env` deixa de preservar `CLIENT_USERS_EMAILS`/`IOS_DEVICE_MAP` e passa a montar o `.env` a partir da linha `__CREDENCIAIS_DO_RUN__` que o CI injeta |
| `test/utils/credentials.ts` | ramo iOS lê `CLIENT_USER` (a conta já vem resolvida). Ramo Android inalterado |
| `test/utils/device-index.ts` | `resolveIOSDevice()`, `IOSDeviceEntry` e o memo removidos. `deviceIndex.android` intacto |
| `test/utils/device-name.ts` | iOS lê `DEVICE_LABEL`. Mapa e ramo Android intactos |
| `wdio.conf.ts` | `deviceLabel()` prefere `DEVICE_LABEL` — some o `Device=<UDID>` do `environment.properties` no iOS |

Também não commitado: os 35 drafts em `.planning/drafts/ios/`, o
`RELATORIO-ANOMALIAS-IOS.md` e `plans/2026-09-08-ramo-ios-nos-page-objects.md`, copiados
para cá em 2026-09-10.

## O levantamento iOS (2026-09-04)

8 sessões de AWS Device Farm Remote Access, 3 iPhones diferentes, iOS 26.3, janela
`402x874`pt (print `1206x2622`px, escala 3), app **1.14.2 build 305** de produção:

- `.planning/drafts/ios/` — 35 drafts, um por tela, com print + árvore XCUITest de cada
  estado. `00-INDICE.md` é o mapa e concentra as descobertas que mudam a estratégia de seletor.
- `.planning/RELATORIO-ANOMALIAS-IOS.md` — o consolidado por tipo de problema.

Cobertura: fluxo do M1 inteiro **e** o fluxo de compra do `test/Draft.ts` até o
`Finalize purchase`.

## Decisões tomadas

### Atribuição de conta por device (2026-09-10)

- **As `environmentVariables` do Device Farm são do RUN, não do JOB.** Num run com N
  aparelhos todos recebem exatamente as mesmas variáveis. Não existe "este device usa o
  email 3".
- **O host iOS não recebe nem essas variáveis.** O script que a AWS gera monta o próprio
  ambiente e exporta só as `DEVICEFARM_*` — conferido no artefato `Test spec shell script`
  do run #6, onde o diagnóstico imprimiu `CLIENT_USERS_EMAILS len=0`. No Android o processo
  herda o ambiente do agente, e é por isso que lá funciona.
- **O host não expõe índice/ordinal de job.** As únicas variáveis são
  `DEVICEFARM_{APP_PATH,DEVICE_NAME,DEVICE_OS_VERSION,DEVICE_PLATFORM_NAME,DEVICE_UDID,`
  `LOG_DIR,SCREENSHOT_PATH,TEST_PACKAGE_PATH,WORKING_DIR,WDA_*,EXIT_CODE}`. O único valor
  único por aparelho é o UDID, e ele muda a cada run (frota pública).
- **Logo, no iOS não existe auto-identificação confiável** — e o mapa por (versão de OS,
  resolução) que tentava isso foi removido. Ele falhava em 2 dos 5 aparelhos porque a API
  informa a versão completa (`17.3.1`, `18.6.2`) e o host exporta truncada (`17.3`, `18.6`)
  e, pior, **abortava o teste** quando não casava: no run #6 o iPhone 14 e o iPhone 15 Pro
  Max não executaram nada.
- **A decisão de conta voltou para o CI: um run por aparelho.** `schedule-run` com
  `--device-selection-configuration '{"filters":[{"attribute":"ARN","operator":"IN",
  "values":["<arn>"]}],"maxDevices":1}'` mira um device sem precisar criar device pool.
- **O email viaja no testspec, não no `.env` do ZIP.** O testspec é o único canal que chega
  no host com valor por aparelho, já tinha a função de montar o `.env`, e são 5 arquivos de
  poucos KB contra 5 ZIPs de ~33 MB. Custo aceito: o email aparece no artefato
  `Test spec file` (já aparecia no `Test spec output`).
- **A ordem do pool usa `LC_ALL=C sort`.** Sem isso o collation do runner muda a posição de
  "iPhone 14" vs "iPhone 14 Pro Max", as contas trocam de dono entre runs e o Trend do
  Allure quebra.

### Android (M1)

- **O banner do Insider se fecha pelo `Close` do criativo, dentro da WebView.** O `closeBt`
  nativo é decorativo; o `back()` do Android também não fecha. Testado com dump antes/depois.
- **O marcador de presença do banner é o `insiderLayout`, nunca o `htmlView`** — o `htmlView`
  some da árvore em alguns momentos mesmo com o banner visível.
- **A tela de listagem de produtos não tem a barra de abas** (nenhum `tab-*`). Por isso o
  `voltar()` antes do `abrirPerfil()` é obrigatório.
- **O `action-button` é o favoritar**, mas o estado favoritado não aparece na árvore — só o
  pixel muda. A asserção tem que ser na tela de Favoritos.

### iOS — o que muda o desenho dos page objects

- **Logout no iOS não tem diálogo de confirmação** (draft `24`). É a única divergência de
  *fluxo* do M1: `confirmarLogout()` retorna cedo no iOS.
- **Dois pontos do onboarding só funcionam por coordenada** (drafts `01`, `02`), guardadas
  como **fração** da janela — a medição foi em `402x874`pt.
- **O alerta de localização é do SpringBoard** e `autoAcceptAlerts`/`acceptAlert()` não o
  dispensam. Quem o fecha é `mobile: alert` com `buttonLabel`. Validado no run #6:
  `✅ Alerta de localização aceito por "Allow While Using App"` nos 5 aparelhos.
- **`acceptAlert()`, `mobile: hideKeyboard` e `clearValue()` reportam sucesso sem agir**
  neste app. Regra: validar pelo estado seguinte, nunca pelo retorno.
- **Não usar `mobile: scroll` com `toVisible`** nos aceites: derrubou o `CI iOS Run #61` por
  timeout (~85s por chamada, reenviada 3x). O laço de swipe + `isDisplayed()` converge.
- **`accessibility id` no iOS é o id interno, não o texto visível** — vários nós compartilham
  o mesmo `name`, o que obriga `-ios predicate string` combinando `name` e `label`.
- **O primeiro tap em "Sign in" depois de digitar não registra** (draft `09`) — regra, não
  exceção. Confirmado no run #6: `⚠ Tap 1/2 em "Sign in" não navegou — repetindo`.
- **`voltar()` na listagem é o chevron do cabeçalho**, `[2]` de dois nós homônimos (draft
  `34`). Validado no run #6: `↩ voltar: chevron do cabeçalho ("Camisas")`.
- **Favoritos persistem por CONTA, no backend** (draft `22`) — nenhum cenário pode assumir a
  lista vazia, e é por isso que cada device precisa de uma conta só sua.

## Pendências abertas

### Validar a mudança de hoje

Ainda não rodou no CI. O que conferir no primeiro run: os **5** aparelhos executam (nenhum
`Device iOS não encontrado`), e os 5 logs trazem `🔑 Conta deste run:` com emails
**diferentes entre si**. Se o `--device-selection-configuration` for recusado pela conta AWS,
o plano B é `create-device-pool` com uma regra ARN/IN por aparelho.

### Bugs de teste no iOS (medidos no `CI iOS Run #6`)

- **iPhone 14 Pro Max — nome do produto poluído.** Chegou até Favoritos. O
  `favoritarPrimeiroProdutoIOS()` (`CategoriasPage.ts`) capturou
  `Camisas Filter and sort 152 products Camisa Manga Longa Slim...`: a class chain
  `**/XCUIElementTypeOther[name BEGINSWITH "Camisa" AND name CONTAINS "R$"][1]` casa com o
  **wrapper da tela**, cujo `name` agrega os labels dos filhos. O guard `CONTAINS "R$"` foi
  escrito para descartar o título e não cobre o container. Favoritar funcionou; só o nome
  saiu sujo, e por isso a validação em Favoritos não casa. **O draft `14` descreve o card
  (`185x488` externo, `183x472` interno) mas não lista esse wrapper** — decidir o seletor
  com uma captura nova, não por tentativa.
- **iPhone 13 — banner do Insider não fecha.** `accessibility id:Close` visível, três
  cliques, e o banner continua na tela.
- **iPhone 15 — `tab-categories` não aparece** depois do login (20s). Possivelmente o mesmo
  banner cobrindo a home.

### Outras

- **ReCAPTCHA bloqueia o `Finalize purchase`** (draft `33`), 2/2 tentativas. Escalar ao time
  de backend um allowlist/bypass para QA/Device Farm. Bloqueia o M5; não afeta M1/M3.
- **App sem `accessibilityIdentifier` em pelo menos 5 pontos do fluxo iOS.** O caminho
  estruturalmente correto é pedir os identificadores ao time do app.
- **Segundo banner do Insider.** No Android o Marcio relatou dois criativos e só o
  "INTERLÚDIO" foi capturado. Registrar como "não observado depois", não como "não aparece".
- **Uma camisa ficou favoritada na conta** durante a investigação manual (Camisa Manga Longa
  Slim em Tricoline Stretch Liso Branco). Desfavoritar antes de um run limpo.
