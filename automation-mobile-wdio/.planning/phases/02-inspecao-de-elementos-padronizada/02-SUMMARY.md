# Fase 02 — Resumo

**Concluída:** 2026-09-04.

## Entregue

- `.claude/agents/mobile-ui-inspector.md` — captura nas duas plataformas.
- `.claude/agents/mobile-draft-writer.md` — redige a partir das capturas brutas.
- Procedimento e regras no `CLAUDE.md` (seção "Como levantar os elementos de uma tela").

## Resultado direto (levantamento iOS do app atual)

8 sessões de Remote Access, 3 iPhones, iOS 26.3, janela 402x874pt, app 1.14.2 build 305:
**33 drafts** em `drafts/ios/` (índice `00-INDICE.md`) + `RELATORIO-ANOMALIAS-IOS.md`. Cobre o
fluxo do M1 inteiro e o fluxo de compra do `test/Draft.ts` até o `Finalize purchase`.

Foi esse levantamento que desbloqueou a fase 03: os 19 seletores Android-only e os 12
`accessibility id` que não podiam ser presumidos passaram a ter o valor iOS documentado
draft por draft.

## Lições registradas depois (`STATE.md` → "Sessões de Remote Access: o que não fazer")

Custaram 3 sessões em 2026-09-10: abrir sessão com `bundleId` reseta o app; a URL
pré-assinada expira e não renova; sessão aberta segura o device.
