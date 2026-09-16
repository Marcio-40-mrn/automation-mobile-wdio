# Fase 05 — Levantamento do app migrado, Android e iOS (M5)

**Status:** 🔄 em andamento — fase atual. 1ª leva iOS feita em 2026-09-11, incompleta e sem
draft. Escrita em 2026-09-16 a partir do `ROADMAP.md` (M5) e do `STATE.md` (pendência
"Levantamento do app migrado").

## Objetivo

Capturar os elementos das telas do app migrado (versão nova, migrada por módulos, com
`testID`) **nas duas plataformas**, pelo mesmo procedimento da fase 02, para que a fase 06
faça a suíte atual — e os testes futuros — rodarem nesse app. **Só levantamento; nenhum
cenário de teste é criado nesta fase.**

## Escopo da captura

1. O fluxo da suíte atual: onboarding → login → categorias → camisas → favoritar →
   favoritos → desfavoritar → logout.
2. O fluxo de compra completo, até onde o app deixar (PDP → sacola/Mochila → checkout).
3. Menu item a item e Busca.

Só as partes que já funcionam (o Marcio indica). O que não funcionar entra no draft como
**lacuna do módulo**, não como anomalia.

## Procedimento

O Marcio instala o build, abre a sessão e avisa; o `mobile-ui-inspector` captura; o
`mobile-draft-writer` redige. Regras de Remote Access do `STATE.md`: capturar primeiro,
documentar depois; um `getPageSource()` por tela; fechar a sessão ao final. Android: método
a definir (ver "Não está escrito").

## Tarefas

| # | Tarefa | Entrega | Status |
|---|---|---|---|
| 1 | Capturas iOS, fluxo deslogado (notificações → boas-vindas → onboarding → política → termos → Home → Perfil → Login → Categorias → Roupas → Camisas) | 37 pares print + árvore em `drafts/app-migrado/ios/captures-2026-09-11/` + `NOTAS.md` | ✅ 2026-09-11 |
| 2 | Resolver o login (backend recusa `CLIENT_USER`/`CLIENT_PASSWORD` do `.env` neste build) | resposta do Marcio: conta válida / ambiente / outra conta | ⏳ bloqueado |
| 3 | Capturas iOS, fluxo deslogado restante: PDP pelo card, sacola/Mochila, checkout deslogado, Menu item a item, Busca | capturas + `NOTAS.md` | ⬜ |
| 4 | Capturas iOS, logado: Perfil, favoritar/desfavoritar, Favoritos, checkout, logout | capturas + `NOTAS.md` | ⬜ depende de 2 |
| 5 | Drafts iOS (`mobile-draft-writer`) + `00-INDICE.md` | `drafts/app-migrado/ios/NN-*.md` | ⬜ o Marcio quer ler as capturas antes |
| 6 | Capturas Android (fluxo 1 + 2 + 3) | `drafts/app-migrado/android/` | ⬜ nada capturado |
| 7 | Drafts Android + índice | idem | ⬜ |
| 8 | Comparativo tela a tela com os drafts do app atual (`drafts/ios/`) — o que mudou de seletor | seção no `00-INDICE.md` | ⬜ |

## Já sabido sobre o app migrado (1ª leva, `NOTAS.md`)

Mesmo `bundleId` `com.aramis.ecomm`, versão **1.20.0 build 314** (o atual é 1.14.2/305),
iOS 18.0, janela 393x852pt. Alerta de **App Tracking Transparency** antes do de
localização; modais RN sem filhos (só coordenada); `tab-bag` com label "Mochila"; bloco
"DEV / Painel de controle" oculto no Account Menu; `accept-button` fixo desde a 1ª tela do
carrossel; Categorias com carrossel de campanhas + lista com chevron, "Roupas" mantém
`sub-categories-button`; listagem Camisas já hidratada na 1ª captura (151 produtos); Home
sem banner do Insider nas 2 capturas.

## Não está escrito (definir com o Marcio)

- Identificador/versão/origem do build (o iOS já mostrou: mesmo bundle id, 1.20.0/314; o
  Android ainda não).
- Se o app migrado vai viver neste repositório ou em outro — decisão adiada em 2026-09-11.
- Como o Android será capturado (AVD local via `adb`, como na fase 02, ou outro caminho).
- Se o backend do app migrado é outro ambiente (explicaria o login recusado).

## Critério de conclusão

Drafts das duas plataformas em `drafts/app-migrado/<plataforma>/` com `00-INDICE.md`, no
mesmo formato dos atuais, cobrindo os fluxos 1 e 2 até onde o app deixar; `STATE.md`
atualizado e M5 marcado no `ROADMAP.md`.
