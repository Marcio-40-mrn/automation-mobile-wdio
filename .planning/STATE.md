# STATE

Atualizado em **2026-09-09**.

## Onde o projeto está

Marco atual: **M3 — replicar a suíte no iOS**. Android segue a referência (`CI Run #5`:
5/6 devices PASSED).

O iOS estava travado por **duas causas independentes**, as duas diagnosticadas hoje pelos
artefatos do `CI iOS Run #5` (`arn:...run:dd0b325a-.../6892bea9-...`, 5/5 devices FAILED) e
pelo run local. Correção no working tree, **pendente de validação**.

## Working tree

Branch `main`, último commit `7888d1e`. Não commitado:

| Arquivo | O que mudou |
|---|---|
| `test/pageobjects/CategoriasPage.ts` | `abrirCamisas()` guarda `tituloListagem`; `voltar()` repassa para `voltarIOS(titulo)` |
| `test/utils/device-index.ts` | mapa iOS deixou de ser hardcoded: `resolveIOSDevice()` lê o `IOS_DEVICE_MAP` que o CI gera, memoizado por chave. Android inalterado |
| `test/utils/credentials.ts` | `async`; erro nomeado quando falta `CLIENT_USERS_EMAILS`, e no **iOS** também quando o aparelho não recebe índice único. Android inalterado (avisa e usa `conta[0]`) |
| `test/utils/device-name.ts` | `async`; no iOS o rótulo do relatório vem do nome no `IOS_DEVICE_MAP`, não do UDID |
| `test/specs/test.spec.ts` | `await` nas duas chamadas |
| `.github/workflows/mobile_test.yml` | job iOS: step `Gerar .env do test package (iOS)` gera credenciais **e** `IOS_DEVICE_MAP` a partir dos ARNs do pool; guarda de que o `.env` entrou no ZIP |
| `testspec-ios.yml` | preserva o `.env` que veio no pacote (reescrever apagaria o `IOS_DEVICE_MAP`); exige `IOS_DEVICE_MAP` presente |

Nada de Android foi tocado: nem o job do workflow, nem o `testspec.yml`, nem o comportamento
do código (modelo não mapeado segue avisando e usando `conta[0]`).

## Decisões tomadas

- **A AWS não repassa as `environmentVariables` do run para o host iOS.** O script que o
  Device Farm gera (artefato `Test spec shell script`) monta o próprio ambiente e exporta
  **só** as `DEVICEFARM_*`; não há `export CLIENT_USERS_EMAILS` nele. No script do Android
  essas variáveis também não aparecem — lá o processo **herda** o ambiente do agente, e é
  por isso que funciona. Sintoma: o `echo "...=$CLIENT_USERS_EMAILS" > .env` do testspec
  gravava vazio, `getCredentials()` caía no fallback local (`CLIENT_USER`, que só existe na
  máquina do Marcio) e o login ia com `user=undefined` → `addValue` estourava em
  `LoginPage.ts:47` nos 5 aparelhos. **Não era secret faltando**: o `get-run` devolve os 5
  emails e a senha gravados no run.
  → Por isso o `.env` do iOS passa a ser gerado no workflow e viaja dentro do ZIP.
- **O caminho do chevron do `voltarIOS()` era código morto.** Nenhum chamador passava
  `titulo`, e é o único caminho que funciona na listagem de produtos (o `accessibility
  id:Back` não existe lá; `driver.back()` e o swipe de borda não disparam pop no header
  custom). Daí o `voltar() no iOS: nenhum caminho mudou a tela (titulo="—")` depois de
  favoritar.
- **`deviceModel` não existe no iOS.** A resposta do `createSession` (conferida no
  `appium.log` do host) traz `platformName, deviceName, udid, app, automationName, noReset,
  bundleId, autoAcceptAlerts, usePrebuiltWDA, derivedDataPath, showXcodeLog,
  platformVersion` — sem `deviceModel`. O mapa `ios` do `device-index.ts` (por modelId
  "A2482") não casa com nada.
- **O UDID do iOS não serve como chave fixa.** Comparados os 5 aparelhos entre o run #5 e o
  run #62: os 10 valores são diferentes (frota pública). O prefixo é o SoC e colide (iPhone
  13 e 14 são `00008110`; 14 Pro Max e 15 são `00008120`).
- **A identidade do device iOS é o par (versão de OS, resolução em pontos)** — único nos 5
  aparelhos do pool: `18.5|390x844` (13), `18.6.2|390x844` (14), `18.6|430x932` (14 Pro
  Max), `18.5|393x852` (15), `17.3.1|430x932` (15 Pro Max). Nem OS nem resolução isolados
  bastam (13 e 15 rodam 18.5; 13 e 14 são 390x844).
- **O mapa é gerado pelo CI, não hardcoded.** Cada ARN de device do Device Farm fixa modelo
  + versão de OS, então `get-device` nos 5 ARNs do pool devolve exatamente o que o aparelho
  vai reportar (conferido: os `os` da API batem com os do run, e `pixels/3` bate com o
  `getWindowRect` observado no iPhone 13 — 1170x2532 -> 390x844). Assim o mapa não
  apodrece quando o pool muda, e uma colisão de chave derruba o job **antes** de gastar
  minuto de device.

## Pendências abertas

- **Validar as duas correções.** Local: `npm run wdio:ios` deve passar o
  `categoriaPage.voltar() - categoria` com o log `↩ voltar: chevron do cabeçalho
  ("Camisas")`. CI: o run iOS deve mostrar o `[diag] host env: ... len=0` (confirmando que a
  AWS segue sem repassar) e o `🔑 Device model ... -> conta[N]`, e passar do login.
- **`Device=` do `environment.properties`** continua mostrando o UDID no iOS. É o
  `deviceLabel()` do `wdio.conf.ts`, chamado no `onPrepare` — que roda no launcher, antes
  de existir sessão, então não tem como medir a resolução e resolver o nome ali. Cosmético:
  a identificação por aparelho no relatório (aba Suites, Timeline, parâmetro `Conta`) já sai
  com o nome real.
- **Uma camisa ficou favoritada na conta** durante a investigação manual (Camisa Manga Longa
  Slim em Tricoline Stretch Liso Branco). Desfavoritar antes de um run limpo.
