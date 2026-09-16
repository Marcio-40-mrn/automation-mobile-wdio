# STRUCTURE

Levantado em 2026-09-16 (`git ls-files` + pastas ignoradas relevantes). O que existe em cada
lugar e o que é gerado.

## Versionado

```
.github/workflows/mobile_test.yml   1 workflow, 3 jobs: run-on-device-farm (Android),
                                    run-ios-on-device-farm (iOS), publish-report
.gitattributes                      *.apk em Git LFS
.gitignore                          exclui drafts/, RELATORIO-ANOMALIAS-IOS.md e um plano
Atualizaçoes/                       cópias de CLAUDE/PROJECT/ROADMAP/STATE (2026-09-11)
CLAUDE.md                           regras do repo; importa os 4 arquivos-raiz do .planning/
README.md                           onboarding humano: cenários, .env, secrets, arquitetura
package.json / package-lock.json    ver codebase/STACK.md
tsconfig.json                       include: test/, wdio.conf.ts
wdio.conf.ts                        configuração central (codebase/ARCHITECTURE.md)
testspec.yml                        Device Farm Android
testspec-ios.yml                    Device Farm iOS (linha marcadora __CREDENCIAIS_DO_RUN__)
scripts/
  install-apk.mjs                   EAS GraphQL → download do build (APK/AAB→APK, IPA),
                                    instala no AVD, escreve .build-info.json
  generate-report-index.mjs         index.html da branch reports (GitHub Pages)
test/
  specs/test.spec.ts                a suíte (1 cenário, 17 steps)
  pageobjects/
    BasePage.ts        695 linhas — helpers, banner, onboarding, iOS por coordenada
    HomePage.ts        114 — ativarApp, abrirPerfil, abrirCategorias
    LoginPage.ts       153 — logar (+ logarIOS, digitarIOS)
    CategoriasPage.ts  314 — clickRoupas, abrirCamisas, favoritarPrimeiroProduto, voltar
    PerfilPage.ts       73 — abrirFavoritos, logout, confirmarLogout
    FavoritosPage.ts   295 — validaElememnto, tirarSelecaoItem
  utils/
    credentials.ts     conta por device (Android: CSV + modelo; iOS: CLIENT_USER do run)
    device-index.ts    prefixo de modelo Samsung → índice (6 aparelhos)
    device-name.ts     prefixo → nome amigável no Allure
```

## Não versionado, mas parte do projeto

```
.planning/                  memória GSD (este diretório); drafts/ e RELATORIO fora do git
.claude/
  agents/                   mobile-ui-inspector, mobile-draft-writer, project-memory-keeper,
                            security-scanner
  hooks/block-github.mjs    PreToolUse: bloqueia gh, push/pull/fetch/clone, criação/troca
                            de branch — em Bash e em MCP github
  hooks/session-start.sh    SessionStart: imprime git status + STATE.md + linhas "em
                            andamento" do ROADMAP
  settings.json             registra os dois hooks; includeCoAuthoredBy: false
  skills/                   allure-multidevice-reporting, mobile-cicd-pipelines,
                            mobile-page-objects, mobile-wdio-scaffold, planejar-mudanca,
                            playwright-test-automation
.env                        credenciais e ARNs (nomes em README.md)
```

## Gerado em runtime (ignorado)

| Caminho | Quem gera | Quem consome |
|---|---|---|
| `allure-results/` | reporter + `onPrepare` | `allure generate` (local) / testspec `post_test` (CI) |
| `allure-report/` | `onComplete` local | navegador; `history/` é copiado de volta para o Trend |
| `ctrf/ctrf-report.json` | `wdio-ctrf-json-reporter` | `npm run report:ctrf`, consumo programático |
| `.build-info.json` | `scripts/install-apk.mjs` | `wdio.conf.ts` (versão do app no Allure/CTRF) |
| `app.apk`, `test-package.zip` | workflow | uploads para o Device Farm |
| `_results_/` | download de artefatos | análise manual |

## Onde NÃO existe nada (para não procurar)

- `docs/`, `mkdocs.yml`, `catalog-info.yml` — só no repositório principal (Backstage); aqui
  estão no `.gitignore` e não existem.
- Testes unitários, lint, prettier — não há. A verificação estática é `npx tsc --noEmit`.
- `test/Draft.ts` — existe em disco (rascunho do fluxo de compra, base do M7) mas está no
  `.gitignore`; não entra no ZIP do CI nem no `specs` do WDIO.
