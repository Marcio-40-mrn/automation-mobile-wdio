# Fase 04 — Resumo

**Concluída:** 2026-09-10 (validação de infraestrutura) e 2026-09-11 (fluxo inteiro verde).

## Validação

- `CI iOS Run #7`: 5 runs separados (`CI iOS Run #7 - Apple iPhone 13 / 14 / 14 Pro Max /
  15 / 15 Pro Max`), os 5 executaram, 5 contas distintas; Android `CI Run #7` 18/18 sem
  regressão. Nenhum `Device iOS não encontrado`.
- `CI Run #14`: Android 18/18 + iOS 5/5, um run por iPhone.

## Fatos medidos que fixaram o desenho (`STATE.md`)

- `environmentVariables` do Device Farm são do **run**, não do job.
- O host iOS **não recebe** essas variáveis (artefato `Test spec shell script` do run #6:
  `CLIENT_USERS_EMAILS len=0`); só as `DEVICEFARM_*`.
- O host não expõe índice de job; o único valor único por aparelho é o UDID, que muda a cada
  run.
- Logo: a decisão de conta é do CI, um run por aparelho, email no testspec.

## O que ficou no código

- `credentials.ts`: ramo iOS lê `CLIENT_USER` com erro explícito se ausente no Device Farm.
- `device-index.ts`: só Android (6 prefixos Samsung).
- `device-name.ts` / `wdio.conf.ts`: `DEVICE_LABEL` primeiro.
- `testspec-ios.yml`: `__CREDENCIAIS_DO_RUN__`, escrita do `.env`, guarda de `CLIENT_USER`.
- Workflow: resolução do pool, 5× `schedule-run`, espera/download/extração por run,
  `publish-report` com `android/` e `ios/`.
