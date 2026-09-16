# Fase 02 — Inspeção de elementos padronizada (M2)

**Status:** ✅ concluída em 2026-09-04. Reconstruída em 2026-09-16 a partir do `ROADMAP.md`
e do `CLAUDE.md` ("Como levantar os elementos de uma tela").

## Objetivo

Um procedimento único, repetível e documentado para levantar os elementos de uma tela nas
duas plataformas — porque o Appium Inspector não expõe WebView nem nós sem `resource-id`, e
vários ciclos de "trocar o seletor e torcer" já tinham sido perdidos.

## Tarefas

| # | Tarefa | Entrega | Critério |
|---|---|---|---|
| 1 | Fixar o procedimento Android: Marcio navega e avisa; Claude captura `screencap` + `uiautomator dump` e **para** | `CLAUDE.md` | nenhum toque no AVD pelo Claude |
| 2 | Fixar o procedimento iOS: sessão Appium contra o Remote Access do Device Farm, `getPageSource()` + `takeScreenshot()`; capturar primeiro, documentar depois | `CLAUDE.md`, `STATE.md` | captura sobrevive à queda da sessão |
| 3 | Sub-agent de captura, por papel (não por SO) | `.claude/agents/mobile-ui-inspector.md` | cobre Android e iOS |
| 4 | Sub-agent de redação, sem acesso ao device | `.claude/agents/mobile-draft-writer.md` | inspeção e redação rodam em paralelo |
| 5 | Formato de draft por tela (print + árvore + seletores + achados) e índice | `drafts/<plataforma>/NN-*.md`, `00-INDICE.md` | um draft por estado de tela |

## Regras que saíram desta fase

- Esperar a tela carregar antes de capturar (WebView publica a árvore com atraso).
- Um `getPageSource()` por tela; medir rects parseando o XML, não com dezenas de
  `getLocation()/getSize()`.
- Sempre `deleteSession` ao final.
