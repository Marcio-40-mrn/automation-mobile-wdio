# Fase 08 — Cobertura além do favoritar (M8)

**Status:** ⏸ adiada em 2026-09-11 — nenhum cenário de compra é criado antes das fases 05
e 07. Escrita em 2026-09-16 a partir do `ROADMAP.md` (então M7; renumerado para M8 e fase 08 em 2026-09-29).

## Objetivo

O fluxo de compra como cenário de teste, **no app migrado**: adicionar à sacola → escolher
tamanho → endereço → cartão → finalizar compra. Rascunho existente: `test/Draft.ts`
(ignorado pelo git).

**Sobreposição com a fase 06 (2026-09-29):** sacola, tamanho e endereço passam a ser cobertos
pelas etapas 2, 3 e 4 da fase 06 (cenários Gherkin); o que sobra aqui é cartão → finalizar
compra.

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

- Fase 07 concluída.
- Resposta do backend sobre o ReCAPTCHA (define se o critério é Summary ou compra
  finalizada).

## Não afeta

Fases 01, 03, 07 — nenhuma passa por compra.
