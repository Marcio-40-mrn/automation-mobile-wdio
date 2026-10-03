# Fase 04 — Paridade em CI (M4)

**Status:** ✅ concluída em 2026-09-10, ajustes nos testes em 2026-09-11. Reconstruída em
2026-09-16 a partir do `ROADMAP.md` e de `STATE.md` → "Atribuição de conta por device".

## Objetivo

O job `run-ios-on-device-farm` entregando os 5 iPhones executados, cada um com a própria
conta, e os `allure-results` das duas plataformas no mesmo relatório publicado — sem
regressão no Android (que já rodava 18/18 em um run de 6 devices).

## Ponto de partida

A infraestrutura já existia (`testspec-ios.yml`, pool iOS, job no workflow). O que faltava
era a **atribuição de conta por iPhone**: as tentativas de auto-identificação em runtime
(modelId, depois versão de OS + resolução) falharam porque o XCUITest não devolve
`deviceModel`, o UDID muda a cada run, a API informa `17.3.1` e o host exporta `17.3`, e o
mapa abortava o teste quando não casava (`CI iOS Run #6`: 2 aparelhos sem executar).

## Tarefas

| # | Tarefa | Arquivo | Critério |
|---|---|---|---|
| 1 | Remover o mapa iOS de `device-index.ts`; `credentials.ts` no iOS lê `CLIENT_USER` pronto, com guarda explícita | `test/utils/` | nenhum aparelho aborta por não se reconhecer |
| 2 | Workflow resolve os devices do pool iOS + lista de emails, ordenados com `LC_ALL=C sort` | workflow, step "Resolver devices e contas do pool iOS" | atribuição estável entre runs |
| 3 | Um `schedule-run` por aparelho com `--device-selection-configuration` (ARN, `maxDevices: 1`) | workflow, step "Agendar runs iOS (um por device)" | 5 runs, 5 contas |
| 4 | Email, `DEVICE_LABEL` e versão do app viajam no testspec (linha `__CREDENCIAIS_DO_RUN__` → `export`), porque o host iOS não recebe `environmentVariables` | `testspec-ios.yml` | `.env` do host com `CLIENT_USER` (diag imprime só o comprimento) |
| 5 | Rótulo do device no Allure vem de `DEVICE_LABEL` (antes aparecia o UDID) | `device-name.ts`, `wdio.conf.ts` | aba Suites mostra "Apple iPhone 15 — conta" |
| 6 | Esperar os N runs, baixar e extrair artefatos de todos, publicar `android/` e `ios/` separados | workflow, `publish-report` | dois relatórios + índice |

## Restrições

- Android inalterado (CSV + índice por modelo continua sendo o caminho verde).
- Custo aceito: o email aparece no artefato `Test spec file`.
