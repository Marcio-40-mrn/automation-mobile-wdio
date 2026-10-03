# Fase 01 — Suíte Android estável (M1)

**Status:** ✅ concluída em 2026-09-03. Reconstruída em 2026-09-16 a partir do `ROADMAP.md`,
do `STATE.md` e de `plans/2026-09-03-banner-insider-e-favoritar-listagem.md`.

## Objetivo

O cenário único de `REQUIREMENTS.md` (onboarding → login → Camisas → favoritar → Favoritos
→ desfavoritar → logout) passando ponta a ponta no AVD-S24, sem depender de nome de produto
nem de coordenada de tela.

## Ponto de partida

O teste quebrava no meio do fluxo por duas causas independentes:

1. O banner do Insider não fechava — `fechaBanner` calculava uma coordenada a partir do
   `closeBt` nativo e não conferia o resultado.
2. O produto favoritado era um nome fixo, que sumia da listagem entre versões/ambientes.

## Tarefas

| # | Tarefa | Arquivo | Critério |
|---|---|---|---|
| 1 | Fechar o banner por seletor (`accessibility id:Close`), esperar a WebView publicar a árvore, confirmar `insiderLayout` sumiu, repetir até 3x | `BasePage.fechaBanner()` | dump antes/depois mostra o `insiderLayout` ausente |
| 2 | Chamar o fechamento antes de todo passo | `test.spec.ts` (`step()`) | nenhum passo começa com banner na tela |
| 3 | Favoritar a 1ª camisa da lista e devolver o nome lido do `content-desc` | `CategoriasPage.favoritarPrimeiroProduto()` | nome usado na asserção em Favoritos |
| 4 | Ficar uma tela antes na navegação: favoritar na listagem, um `voltar()` só até Categorias | `test.spec.ts`, `CategoriasPage.voltar()` | aba Perfil visível após o `voltar()` |
| 5 | `abrirPerfil` aceitando `Menu` ou `Perfil` | `HomePage`, `BasePage.clickFirstPresent()` | funciona nas duas versões do app |

## Fora de escopo

iOS, CI, contas por device — fases 03 e 04.
