# Fase 03 — Rodar a MESMA suíte no iOS (M3)

**Status:** ✅ concluída em 2026-09-11 (`CI Run #14`, iOS 5/5). Reconstruída em 2026-09-16 a
partir do `ROADMAP.md` (passos 1–5 e "Divergências de FLUXO") e de
`plans/2026-09-08-ramo-ios-nos-page-objects.md`.

## Objetivo

A mesma spec, os mesmos page objects, os mesmos nomes de método rodando no iOS. **Não
existe uma suíte iOS.** Cada método detecta `process.env.PLATFORM === 'ios'` e escolhe o
seletor ali dentro — o padrão do `HomePage.ativarApp()`.

## Passos (como no ROADMAP)

| # | Passo | Entrega | Concluído |
|---|---|---|---|
| 1 | Sessão de Remote Access num iPhone do Device Farm com o IPA instalado | sessão | ✅ |
| 2 | `REMOTE_HOST` / `REMOTE_PORT` / `REMOTE_PATH_IOS` no `.env` | `.env`, `wdio.conf.ts` (`isRemote`) | ✅ |
| 3 | Inspeção tela a tela | 33 drafts (fase 02) | ✅ 2026-09-04 |
| 4 | Ramo iOS em `test/pageobjects/` — 14 ramificações em 6 arquivos, `tsc --noEmit` limpo | page objects | ✅ 2026-09-08 |
| 5 | A suíte roda no iOS ponta a ponta | `CI iOS Run #8` (1º verde, iPhone 15) … `CI Run #14` (5/5) | ✅ 2026-09-11 |

## Divergências de fluxo que obrigam o `if` (não só troca de string)

- Logout sem diálogo de confirmação (`confirmarLogout()` valida pelo estado).
- Dois pontos do onboarding só por coordenada, como fração da janela
  (`tapProporcional`).
- Alerta de localização é do SpringBoard → `mobile: alert` com `buttonLabel`.
- `accessibility id` é id interno (`tab-menu`, `accept-button`, `category-button`), não o
  texto visível; nós homônimos → `-ios predicate string` com `name` + `label`.
- Campos de formulário perdem `name`/`label` ao serem preenchidos.
- Primeiro tap em "Sign in" não registra → 2 tentativas por regra.
- `acceptAlert()`, `hideKeyboard`, `clearValue()` reportam sucesso sem agir.
- `voltar()` na listagem é o chevron `[2]` do cabeçalho (draft 34).

## Restrições

- Nenhum seletor Android alterado — só movido para dentro do `if`/ternário.
- Validação só por run real no Device Farm (a sessão Remote Access captura, não valida).
