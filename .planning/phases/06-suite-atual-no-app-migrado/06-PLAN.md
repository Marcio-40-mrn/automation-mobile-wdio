# Fase 06 — A suíte atual rodando no app migrado (M6)

**Status:** ⬜ não iniciada. Depende da fase 05. Escrita em 2026-09-16 a partir do
`ROADMAP.md` (M6); tudo abaixo do "Objetivo" é o que **está** escrito lá — não há mais.

## Objetivo

Replicar no app migrado o mesmo cenário de `test/specs/test.spec.ts` — e os testes que
vierem depois — a partir dos drafts da fase 05.

## O que depende de decisão ainda não tomada

Como isso entra no código depende da decisão de repositório adiada na fase 05:

- mais um ramo nos page objects (à la `PLATFORM === 'ios'`), ou
- suíte separada, ou
- repositório novo.

**Não está escrito.** A regra "uma suíte só, para as duas plataformas" de `REQUIREMENTS.md`
vale para Android × iOS; se ela se estende a app atual × app migrado é uma decisão desta
fase, a tomar com o Marcio antes de qualquer edição.

## Pré-requisitos

- Fase 05 concluída nas duas plataformas (drafts + índice).
- Login funcionando no app migrado (bloqueio da fase 05, tarefa 2).
- Decisão de repositório.

## Critério de conclusão

O cenário de `REQUIREMENTS.md` verde no app migrado, nas duas plataformas, num run real do
Device Farm — mesmo critério das fases 03/04.
