# STACK

Levantado em 2026-09-16 a partir de `package.json`, `tsconfig.json`, `wdio.conf.ts`,
`testspec.yml`, `testspec-ios.yml` e `.github/workflows/mobile_test.yml`.

## Linguagem e runtime

| Item | Valor | Onde |
|---|---|---|
| Linguagem | TypeScript, `strict: true`, `noEmit` (o WDIO transpila em memória) | `tsconfig.json` |
| Módulos | ESM (`"type": "module"`, `module: ESNext`, `target: es2022`) | `package.json`, `tsconfig.json` |
| Node local validado | v22.18.0 / npm 11.7.0 | `CLAUDE.md` |
| Node no CI (runner) | `lts/*` | workflow |
| Node no host Device Farm | Android: v18.20.8 nativo; iOS: Node 14 nativo → `nvm use 18` no testspec | `testspec-ios.yml` |

## Runner e drivers

| Pacote | Range declarado | Papel |
|---|---|---|
| `@wdio/cli`, `@wdio/local-runner` | `^9.20.1` | runner WebdriverIO 9 |
| `@wdio/mocha-framework` | `^9.20.1` | framework BDD (`describe`/`it`), `timeout: 900000` |
| `@wdio/appium-service` | `^9.20.1` | sobe o Appium **só na execução local** (`buildServices()` devolve `[]` no Device Farm e no Remote) |
| `appium-uiautomator2-driver` | `^6.3.0` | driver Android **local**; no Device Farm o driver é o do host |
| `appium` | **não declarado** (vem aninhado, 3.7.0) | regra inviolável — ver `REQUIREMENTS.md` e incidente run-22 no `CLAUDE.md` |
| XCUITest | nenhum pacote local | só existe no host do Device Farm / Remote Access |

Automation por plataforma: Android `UiAutomator2`, iOS `XCUITest`. App sob teste:
`com.aramis.ecomm` (`MainActivity` no Android; mesmo `bundleId` no iOS).

## Relatórios

| Pacote | Range | Saída |
|---|---|---|
| `@wdio/allure-reporter` | `^9.21.0` | `allure-results/` (com `disableWebdriverStepsReporting: true` — motivo no comentário do `wdio.conf.ts`) |
| `allure-commandline` | `^2.34.1` | `allure generate` local (`onComplete`) e no job `publish-report` |
| `wdio-ctrf-json-reporter` | `^0.0.17` | `ctrf/ctrf-report.json` |
| `@wdio/spec-reporter` | `^9.20.0` | console |

## Utilitários

| Pacote | Uso |
|---|---|
| `dotenv` (única `dependency`) | `.env` na raiz, lido por `wdio.conf.ts` e `scripts/install-apk.mjs` |
| `cross-env` | `npm run wdio:ios` seta `PLATFORM=ios` de forma portátil |

## Ferramentas externas (fora do `package.json`)

- **AWS CLI** — consultas ao Device Farm (`list-runs`, `list-jobs`, `list-artifacts`), sem `jq`
  na máquina local (usar `--query`). Credenciais no `.env`; carregar com `set -a; . ./.env`.
- **adb** — captura de tela/árvore no AVD-S24 (`screencap`, `uiautomator dump`) e limpeza do
  app na execução local (`pm clear`).
- **ffmpeg/ffprobe** — medição e re-encode de vídeo dos artefatos (memória
  `reference-devicefarm-artifact-pull`); no host iOS o `startRecordingScreen` usa `libx264`.
- **bundletool** — conversão AAB → APK em `scripts/install-apk.mjs`.
- **Git LFS** — `*.apk` (`.gitattributes`).

## Versões e rollback

Baseline de dependências e tabela de versões: seção "Registro de dependências e rollback" do
`CLAUDE.md` (tag `deps-baseline-2026-09-01`). Não repetir aqui.
