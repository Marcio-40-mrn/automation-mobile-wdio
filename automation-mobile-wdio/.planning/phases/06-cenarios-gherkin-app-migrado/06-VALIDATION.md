---
phase: 6
slug: cenarios-gherkin-app-migrado
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-01
---

# Phase 6 — Validation Strategy

> Contrato de validação por fase, para amostragem de feedback durante a execução.
> Fonte: `06-RESEARCH.md` → `## Validation Architecture`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | WebdriverIO 9.31.5 + Mocha 10.8.2 + Appium (UiAutomator2 / XCUITest); sem teste unitário no repo |
| **Config file** | `wdio.conf.ts` (`specs: ['./test/specs/**/*.ts']`) |
| **Quick run command** | `npx tsc --noEmit 2>&1 \| grep -v '^test/Draft.ts'` (saída vazia = OK) |
| **Full suite command** | **só o Marcio:** `npm run wdio:android` (AVD-S24) · CI: `workflow_dispatch` (Android + iOS no Device Farm) |
| **Estimated runtime** | quick: ~30 s · E2E: a medir no 1º run (estimativa A2 da pesquisa) |

---

## Sampling Rate

- **Após cada tarefa (agente):** quick run command + `git diff` restrito aos arquivos do plano + `node --test` dos helpers puros, quando existirem. O agente **nunca** roda `adb`, Appium, `wdio` nem o AVD.
- **Após cada etapa (humano):** (1) run no AVD-S24 pelo Marcio com os specs da etapa; (2) run no Device Farm nas duas plataformas; (3) conferir no log/Allure os prefixos esperados e os skips nomeados; (4) tamanho do `Customer Artifacts` (laço `content-range` do `CLAUDE.md`).
- **Antes do `/gsd-verify-work`:** as 6 etapas verdes nas duas plataformas.
- **Max feedback latency (agente):** ~30 s.

---

## Per-Task Verification Map

Preenchido pelos planos (`06-NN-PLAN.md`): cada tarefa traz `<verify>` com comando automático ou checkpoint humano. Escopo por cenário (IDs da pesquisa):

| Escopo | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| Helpers puros (CPF, datas, e-mail novo) | valida/gera corretamente | unit sem dependência | `node --test test/utils/cpf.check.mjs` | ❌ W0 | ⬜ pending |
| Tipagem de specs/page objects | compila em `strict` | estático | `npx tsc --noEmit \| grep -v Draft.ts` | ✅ | ⬜ pending |
| Etapas 1–6 (82 cenários) | cada `it` passa no app migrado | E2E | AVD: só o Marcio · DF: run no CI | ❌ W0 | ⬜ pending |
| 11 pendentes | aparecem como pulados com motivo | E2E (relatório) | conferir no Allure do 1º run | ❌ | ⬜ pending |
| Ramo iOS | mesmos `it` no iOS | E2E | run iOS no Device Farm | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/utils/` — helpers da Etapa 0 (Allure/skip nomeado, textos, CPF, conta nova, datas, sessão)
- [ ] fumaça: POC migrada passa no AVD (Marcio) e no Device Farm Android + iOS antes das etapas
- [ ] smoke de login das contas por device no app migrado
- [ ] captura Android em **inglês** + lacunas; captura iOS (checkpoints humanos)
- [ ] confirmar no 1º run que o skip nomeado mostra o motivo no Allure

---

## Manual-Only Verifications

| Behavior | Why Manual | Test Instructions |
|----------|------------|-------------------|
| Qualquer run no AVD-S24 | regra inviolável: só o Marcio roda no AVD | `npm run wdio:android` com os specs da etapa |
| Run no Device Farm | log de Actions só chega pelo Marcio | disparar o workflow; conferir Allure publicado |
| Sessões de captura Android/iOS | o Marcio abre o AVD / Remote Access | procedimento do `CLAUDE.md` (`mobile-ui-inspector`) |
| Aprovação de `wdio.conf.ts` / `testspec*.yml` / workflow | decisão do Marcio | revisão item a item |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
