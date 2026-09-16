# Fase 07 — Cobertura além do favoritar (M7)

**Status:** ⏸ adiada em 2026-09-11 — nenhum cenário de compra é criado antes das fases 05
e 06. Escrita em 2026-09-16 a partir do `ROADMAP.md` (M7).

## Objetivo

O fluxo de compra como cenário de teste, **no app migrado**: adicionar à sacola → escolher
tamanho → endereço → cartão → finalizar compra. Rascunho existente: `test/Draft.ts`
(ignorado pelo git).

## Referência disponível

Drafts `25`–`33` do app atual (`drafts/ios/`) documentam tudo até o Summary. No app migrado
o fluxo é recapturado na fase 05 (escopo 2).

## Bloqueio externo

`Finalize purchase` falha com erro de **ReCAPTCHA**, 2/2 tentativas byte-idênticas (draft
`33`) — proteção anti-bot do backend, não bug de seletor nem de timing. Encaminhamento:
pedir ao time de backend allowlist/bypass para o ambiente de QA/Device Farm. Até lá, o
critério de sucesso possível é **chegar ao Summary**. Não se sabe se o app migrado tem o
mesmo ReCAPTCHA.

## Pré-requisitos

- Fase 06 concluída.
- Resposta do backend sobre o ReCAPTCHA (define se o critério é Summary ou compra
  finalizada).

## Não afeta

Fases 01, 03, 06 — nenhuma passa por compra.
