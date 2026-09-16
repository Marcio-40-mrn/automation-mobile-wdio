# INTEGRATIONS

Levantado em 2026-09-16. Serviços externos, como o repo fala com cada um e quais segredos
cada um exige. Valores nunca ficam aqui — só nomes.

## AWS Device Farm (região `us-west-2`)

| Uso | Como | Arquivo |
|---|---|---|
| Uploads (APK/IPA, ZIP do teste, testspec) | `aws devicefarm create-upload` → `curl` PUT na URL pré-assinada → poll até `SUCCEEDED` | workflow, jobs `run-*` |
| Run Android | `schedule-run` com `--device-pool-arn` + `environmentVariables` (`CLIENT_USERS_EMAILS`, `CLIENT_PASSWORD`) | workflow |
| Runs iOS | 5× `schedule-run` com `--device-selection-configuration` (filtro `ARN IN [...]`, `maxDevices: 1`); um testspec por aparelho | workflow, step "Agendar runs iOS (um por device)" |
| Artefatos | `list-jobs` → `list-suites` → `list-tests` → `list-artifacts --type FILE` → "Customer Artifacts" | workflow (download) e `CLAUDE.md` (manual) |
| Remote Access iOS | sessão manual no console; endpoint em `REMOTE_HOST`/`REMOTE_PORT`/`REMOTE_PATH_IOS` | `wdio.conf.ts` (`isRemote`) |

Secrets/variáveis: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `DEVICE_FARM_PROJECT_ARN`,
`DEVICE_FARM_DEVICE_POOL_ARN` (Android), `DEVICE_FARM_IOS_DEVICE_POOL_ARN`.

Limites que moldaram o código: variável de ambiente ≤ 256 chars; `environmentVariables` são
do run (não do job) e **não chegam ao host iOS**; host Android Node 18, host iOS Node 14;
Appium 1.x por padrão (`devicefarm-cli use appium 2` no Android); URL pré-assinada do Remote
Access expira em minutos. Detalhes em `STATE.md` e `CLAUDE.md`.

## EAS / Expo

`scripts/install-apk.mjs` consulta a API GraphQL do EAS com `EXPO_TOKEN` e
`EXPO_PROJECT_ID`, filtra por `BUILD_PROFILE_ANDROID`/`BUILD_PROFILE_IOS` (fallback
`BUILD_PROFILE`, depois `development`), e por `BUILD_SELECTION`/`BUILD_FROM`/`BUILD_TO`
(datas; placeholder `YYYY-MM-DD` conta como vazio). Baixa APK (ou AAB → APK via bundletool)
ou IPA, e escreve `.build-info.json` com `appVersion`/`appBuildVersion` para o Allure/CTRF.
Bundle alvo: `com.aramis.ecomm`. Tabela de seleção: `README.md` → "Qual build do EAS é
baixado".

## GitHub Actions / GitHub Pages

- Workflow `Mobile Tests — AWS Device Farm`, gatilhos `workflow_dispatch` e `pull_request`.
- `publish-report` faz checkout da branch `reports`, escreve `run-N-AAAA-MM-DD/{android,ios}/`,
  mantém `REPORTS_KEEP` runs, regenera `index.html` (`scripts/generate-report-index.mjs`) e
  faz push → "pages build and deployment".
- Single-file Allure por plataforma sobe como artifact do workflow.
- **O CLI `gh` e o MCP do GitHub estão bloqueados** neste ambiente
  (`.claude/hooks/block-github.mjs`), inclusive leitura. Log de Actions chega só pelo Marcio.

Secrets do app: `CLIENT_PASSWORD`, `CLIENT_USERS_ANDROID_EMAILS`, `CLIENT_USERS_IOS_EMAILS`.

## Insider (in-app messaging do app)

Não é integração do repo, mas é o terceiro que mais influencia o código: banners em WebView
(`insiderLayout`/`htmlView` no Android; `Insider WebView Content`/`Inapp Window` no iOS)
que aparecem em qualquer tela, engolem toques e publicam a árvore de acessibilidade com
atraso. Campanhas mudam sem aviso (ex.: "Só no APP: 20% OFF" surgiu entre o Run #12 e o #13
no mesmo dia). Tratamento em `BasePage.fechaBanner()`.

## Backstage (só no repositório principal)

`catalog-info.yml` + TechDocs (`mkdocs.yml`, `docs/`) existem no repositório principal; neste
backup estão no `.gitignore` e não existem. Não há nada a manter aqui.

## Ferramentas locais

- **adb** (AVD-S24): captura de elementos e `pm clear` no `afterTest` local.
- **AWS CLI** sem `jq`: usar `--query` JMESPath. Carregar `.env` com `set -a; . ./.env; set +a`
  antes — sem isso, `InvalidClientTokenId` significa "faltou carregar", não "sem acesso".
- **ffmpeg/ffprobe**: medir/re-encodar vídeo de artefatos.
