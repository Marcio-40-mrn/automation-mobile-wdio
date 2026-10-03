# MILESTONES

Arquivo de marcos **concluídos**, no formato GSD. O marco corrente e os futuros vivem no
`ROADMAP.md`; aqui entra o registro fechado, com data, o que entregou e o run que validou.
Criado em 2026-09-16 a partir do `ROADMAP.md` e do `STATE.md`.

| Marco | Fase | Concluído | Validação |
|---|---|---|---|
| M1 — Suíte Android estável | `phases/01-suite-android-estavel` | 2026-09-03 | teste ponta a ponta no AVD-S24; CI Run #6 18/18 |
| M2 — Inspeção de elementos padronizada | `phases/02-inspecao-de-elementos-padronizada` | 2026-09-04 | 33 drafts iOS produzidos pelo procedimento |
| M3 — Rodar a MESMA suíte no iOS | `phases/03-mesma-suite-no-ios` | 2026-09-11 | CI Run #14: iOS 5/5 |
| M4 — Paridade em CI | `phases/04-paridade-em-ci` | 2026-09-10 (ajustes 09-11) | CI Run #14: Android 18/18 + iOS 5/5, 1 run por iPhone, 5 contas |

---

## M1 — Suíte Android estável (2026-09-03)

**Entregou:** o cenário de `REQUIREMENTS.md` passando de ponta a ponta no AVD-S24, sem nome
de produto fixo e sem coordenada.

**Decisões que ficaram:**
- Banner do Insider fecha pelo `Close` do criativo (dentro da WebView), com `insiderLayout`
  como marcador de presença, 3 ciclos.
- `favoritarPrimeiroProduto()` lê o nome do 1º card em runtime.
- Favoritar na listagem → um `voltar()` só até Categorias (onde a aba Perfil existe).
- `abrirPerfil` aceita `Menu` | `Perfil` (`clickFirstPresent`).

**Registro:** `plans/2026-09-03-banner-insider-e-favoritar-listagem.md`.

## M2 — Inspeção de elementos padronizada (2026-09-04)

**Entregou:** dois sub-agents por papel — `mobile-ui-inspector` (captura, Android via `adb`,
iOS via sessão Appium no Remote Access) e `mobile-draft-writer` (redige, não toca no
device). Procedimento fixo no `CLAUDE.md`.

**Resultado direto:** 8 sessões, 3 iPhones, 33 drafts em `drafts/ios/` +
`RELATORIO-ANOMALIAS-IOS.md`, cobrindo o fluxo do M1 e o de compra até o `Finalize purchase`.

## M3 — Rodar a MESMA suíte no iOS (2026-09-11)

**Entregou:** a mesma spec e os mesmos page objects rodando no iOS, com o `if` de plataforma
dentro de cada método (14 ramificações em 6 arquivos, 2026-09-08). Primeiro verde: `CI iOS
Run #8` (iPhone 15). 5/5: `CI Run #14`.

**O que custou:** login perdendo caracteres (Run #7–#9), `Close` fantasma do banner
(Run #7–#8), desfavoritar clicando na sacola, guarda do coração por `x` só, banner novo "Só no
APP: 20% OFF" (Run #13), tap perdido no `Back` + falso positivo do `telaMudou` (Run #13).
Cada um com causa medida em aparelho — `STATE.md`, "Pendências abertas".

**Registro:** `plans/2026-09-08-ramo-ios-nos-page-objects.md`,
`plans/2026-09-11-banner-insider-ios-antes-de-cada-clique.md`.

## M4 — Paridade em CI (2026-09-10, ajustes 2026-09-11)

**Entregou:** o job `run-ios-on-device-farm` funcionando com **um run por iPhone**, email
injetado no testspec de cada run, `DEVICE_LABEL` para o Allure, e os `allure-results` das
duas plataformas no mesmo `publish-report` (dois relatórios, `android/` e `ios/`).

**Decisão que define o marco:** abandonar a auto-identificação do iPhone em runtime (o host
não expõe índice de job nem recebe `environmentVariables`; `CI iOS Run #6` deixou 2
aparelhos sem executar). Detalhes em `STATE.md` → "Atribuição de conta por device".

**Validação:** `CI iOS Run #7` (5 runs, 5 contas, os 5 executaram) e `CI Run #14` (tudo verde).
