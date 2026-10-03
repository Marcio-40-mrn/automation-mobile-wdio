# TESTING

Levantado em 2026-09-16. Como a suíte é executada e verificada em cada ambiente. O cenário
em si e os critérios de aceite estão em `REQUIREMENTS.md`.

## O que existe

- **1 spec, 1 `it()`, 17 steps** (`test/specs/test.spec.ts`): onboarding → login →
  Categorias → Roupas → Camisas → favoritar 1º produto → voltar → Perfil → Favoritos →
  validar → desfavoritar → voltar → Perfil → logout → confirmar.
- Nenhum teste unitário; nenhum lint. Verificação estática: `npx tsc --noEmit`.
- `test/Draft.ts` (ignorado) é rascunho do fluxo de compra — não roda.

## Comandos

| Comando | Ambiente | Observação |
|---|---|---|
| `npm run wdio:android` (= `npm run wdio`) | AVD-S24 local | **só o Marcio roda** — regra inviolável |
| `npm run wdio:fresh` | AVD-S24 | baixa/instala o build do EAS antes |
| `npm run wdio:ios` | iOS Remote Access | precisa de `REMOTE_HOST/PORT/PATH_IOS` no `.env` e sessão aberta no console |
| `npm run install-apk` | local | `scripts/install-apk.mjs` (flags `--no-install`, `--platform ios`) |
| `npm run report:allure` | local | `allure generate --clean && allure open` |
| `npm run report:ctrf` | local | `cat ctrf/ctrf-report.json` |
| `workflow_dispatch` / `pull_request` | GitHub Actions → Device Farm | Android 6 devices + iOS 5 runs |

## Contas de teste

Favoritos persistem por conta no backend e o coração é toggle, então **cada device precisa de
conta própria**:

- Android: `CLIENT_USERS_EMAILS` (CSV, secret `CLIENT_USERS_ANDROID_EMAILS`) + índice por
  prefixo de modelo (`test/utils/device-index.ts`). Limite de 256 chars por variável do Device
  Farm → CSV, não base64.
- iOS: `CLIENT_USER` injetado no testspec de cada run (secret `CLIENT_USERS_IOS_EMAILS`,
  ordenado com `LC_ALL=C sort` para a atribuição ser estável).
- Local: `CLIENT_USER`/`CLIENT_PASSWORD` do `.env`.

Estado sujo (item já favoritado) é detectado e nomeado: guarda do coração no iOS (largura do
ícone < 26), mensagem "conta suja" em `validaElememnto`, e `limparFavoritoOrfao()` em caso de
falha entre favoritar e desfavoritar.

## Evidências por run

- Vídeo por teste no Allure (Android DF: MediaProjection 720p; iOS: libx264 720p 8fps; local:
  `startRecordingScreen`).
- Screenshot anexado quando o banner não fecha.
- Log com prefixos por emoji (ver `CONVENTIONS.md`) — o `STATE.md` mantém, por run, a lista
  do que conferir no log.
- Artefatos do Device Farm: `Customer Artifacts` (allure-results + ctrf + vídeo),
  `appium.log`, `Test spec output`, `Test spec shell script`. Como baixar sem `jq`: bloco de
  comandos no `CLAUDE.md`.

## Como validar uma mudança

| Tipo de mudança | Validação mínima |
|---|---|
| Seletor / page object Android | run no AVD-S24 pelo Marcio |
| Seletor / page object iOS | run iOS no Device Farm (Remote Access serve para capturar, não para validar a suíte) |
| `package.json` / `package-lock.json` | **run real no Device Farm nas duas plataformas antes do merge** |
| `testspec*.yml` / workflow | run no Device Farm; log de Actions chega só pelo Marcio (`!` no prompt) |
| `wdio.conf.ts` (vídeo, reporter) | run no DF + conferir tamanho dos anexos (`CLAUDE.md`, laço de `content-range`) |

Referência verde atual: **`CI Run #14`** (2026-09-11, `c367423`) — Android 18/18, iOS 5/5.

## Como levantar elementos (não é teste, mas alimenta os testes)

Procedimento fixo em `CLAUDE.md` → "Como levantar os elementos de uma tela": o Marcio navega,
avisa, o Claude captura (`adb screencap` + `uiautomator dump` no Android; `getPageSource()` +
`takeScreenshot()` na sessão Remote Access no iOS) e **para**. Agentes:
`mobile-ui-inspector` (captura) e `mobile-draft-writer` (redige). Drafts em
`.planning/drafts/`.

## Timeouts que importam

- `mochaOpts.timeout: 900000` (15 min por teste).
- `before`: pausa fixa de 10s para o app subir.
- Vídeo: `timeLimit: 180` s (`startRecordingScreen`), `maxDurationSec: 600` (MediaProjection).
- `defaultTimeout` dos page objects: 20s; polls específicos de 30s (desfavoritar, Favoritos).
