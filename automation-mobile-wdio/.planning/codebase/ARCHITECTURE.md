# ARCHITECTURE

Levantado em 2026-09-16. Como as peças se encaixam em runtime — não o que cada pasta contém
(isso é `STRUCTURE.md`).

## Visão em uma frase

Uma única spec Mocha (`test/specs/test.spec.ts`) chama page objects que escolhem seletor
por plataforma **dentro do método**; o `wdio.conf.ts` decide, por variáveis de ambiente, em
qual dos 4 ambientes está e monta capabilities, conexão, serviços e gravação de vídeo de
acordo.

## Detecção de ambiente (`wdio.conf.ts`)

```
isDeviceFarm = !!DEVICEFARM_DEVICE_UDID
isCI         = !!CI
isIOS        = PLATFORM === 'ios'
isRemote     = isIOS && !!REMOTE_HOST
```

| Ambiente | Capabilities | Conexão | `services` | Vídeo | Limpeza no `afterTest` |
|---|---|---|---|---|---|
| Local Android (padrão) | `AVD-S24`, `noReset: true`, `autoGrantPermissions: true` | default do WDIO | `appium` (porta 4723) | `startRecordingScreen` | `adb shell pm clear` |
| Device Farm Android | `udid`/`app` das `DEVICEFARM_*`, `noReset: false`, **sem** `autoGrantPermissions` | `127.0.0.1:4723/wd/hub` | `[]` | `mobile: startMediaProjectionRecording` 720p | `mobile: clearApp` |
| Device Farm iOS | `usePrebuiltWDA` + `derivedDataPath` do host, `autoAcceptAlerts: true` | idem | `[]` | `startRecordingScreen` libx264 720p 8fps | `mobile: clearApp` |
| iOS Remote Access | só `bundleId` + `noReset: true` | `https://REMOTE_HOST:REMOTE_PORT` + `REMOTE_PATH_IOS` | `[]` | nenhum | `terminateApp` |

Detalhe que muda o desenho: **no Device Farm o Appium é o do host**, iniciado pelo testspec
(`appium --base-path=/wd/hub`), não pelo `@wdio/appium-service`. Por isso o `package.json`
não pode declarar `appium` (autodetecção de `APPIUM_HOME`, incidente run-22).

## Camadas

```
test/specs/test.spec.ts          1 it(), 17 steps nomeados via step() → Allure
        │  step() chama closeBannerIfPresent() ANTES de cada passo
        ▼
test/pageobjects/*Page.ts        HomePage, LoginPage, CategoriasPage, PerfilPage, FavoritosPage
        │  cada método: if (PLATFORM === 'ios') → ramo iOS; senão Android
        ▼
test/pageobjects/BasePage.ts     waits, clickIfPresent/clickFirstPresent, fechaBanner (2 ramos),
                                 onboarding Android e iOS, tapProporcional, voltarIOS,
                                 aguardarTelaEstavel, scroll helpers
        ▼
test/utils/                      credentials.ts (conta por device), device-index.ts (modelo →
                                 índice, Android), device-name.ts (rótulo no Allure)
```

O `BasePage` concentra as duas coisas que dão trabalho: o banner do Insider (WebView que
aparece a qualquer momento) e os pontos do iOS sem elemento na árvore (toque por fração da
janela). Os page objects de tela ficam finos e legíveis.

## Fluxo de um run no Device Farm (Android)

1. Workflow baixa o APK do EAS (`scripts/install-apk.mjs --no-install`), sobe APK, ZIP do
   repo (sem `node_modules`) e `testspec.yml` para o Device Farm, agenda 1 run no pool de 6
   Samsung com `CLIENT_USERS_EMAILS` (CSV) e `CLIENT_PASSWORD` como `environmentVariables`.
2. No host, `testspec.yml`: `devicefarm-cli use appium 2` → `npm install` (3 tentativas) →
   escreve `.env` → sobe Appium em background → `npm run wdio`.
3. `credentials.ts` lê `deviceModel` das capabilities, casa o prefixo em `device-index.ts` e
   escolhe o email daquele aparelho.
4. `post_test` copia `allure-results/` e `ctrf/` para `$DEVICEFARM_LOG_DIR`; o workflow baixa
   o "Customer Artifacts" de cada job e extrai.

## Fluxo de um run no Device Farm (iOS)

Difere em três pontos, todos por limitação do host (`STATE.md`, "Atribuição de conta por
device"):

- **Um run por iPhone** (`schedule-run --device-selection-configuration` mirando o ARN), porque
  o host não recebe `environmentVariables` nem expõe índice de job.
- O email, o `DEVICE_LABEL` e a versão do app **viajam no testspec**: o workflow substitui a
  linha `__CREDENCIAIS_DO_RUN__` do `testspec-ios.yml` por um `export` e sobe um testspec por
  aparelho.
- `nvm use 18` em cada fase (as fases não compartilham shell); `PLATFORM=ios` exportado na
  fase `test`.

## Publicação (`publish-report`)

Junta os `allure-results` das duas plataformas, gera um relatório por plataforma (subpastas
`android/` e `ios/`) com histórico (Trend) copiado da branch `reports`, gera o single-file
como artifact, e faz push na branch `reports` → GitHub Pages. `scripts/generate-report-index.mjs`
monta o `index.html` varrendo as pastas `run-N` (mantém `REPORTS_KEEP`, padrão 3). Se nenhuma
plataforma devolveu resultados, o job **falha** (`exit 1`) para não repetir o silêncio do run-22.

## Identidade no Allure

`addTestCaseId`/`addHistoryId` = `adiciona-favoritos::<device>` — sem isso os N devices
colapsam num único teste com "retries". `addParentSuite("<device> — <conta>")` põe a conta no
nome do nó da aba Suites. `onPrepare` escreve `environment.properties`, `categories.json` e
`executor.json`.
