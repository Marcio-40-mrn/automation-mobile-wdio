# Fase 03 — Resumo

**Concluída:** 2026-09-11. **Validação:** `CI Run #14` (15:49, commit `c367423`) — iOS 5/5
(iPhone 13, 14, 14 Pro Max, 15, 15 Pro Max) no mesmo run em que o Android fez 18/18.

## Linha do tempo dos runs (o que cada um ensinou)

| Run | Resultado iOS | Causa medida | Correção |
|---|---|---|---|
| CI iOS #5 | 0/5 | `CLIENT_USER` undefined aflorava 3 telas depois | guarda em `credentials.ts` |
| CI iOS #6 | 2 não executaram | mapa (versão OS, resolução) não casava e abortava | mapa removido → fase 04 |
| CI iOS #7 | logins recusados | WDA digita 23 chars em <1s com teclado subindo → letra perdida | `digitarIOS` com teclado aberto |
| CI iOS #8 | **1º verde** (iPhone 15) | `Close` fantasma tocava em "Meus Pedidos"; desfavoritar clicava na sacola (x=21) | marcador = WebView `Insider WebView Content`; coração = maior `x` no card |
| CI iOS #9 | 4/5 | banner INTERLÚDIO por cima do `voltar()`; fechamento estava desligado | fechamento reativado com marcador certo |
| CI #12 | 4/5 | iPhone 13 morreu no `voltar()` após favoritar → conta suja para o #13 | — |
| CI #13 | 3/5 | conta suja (13); tap perdido no `Back` + falso positivo `telaMudou` (15 Pro Max) | `voltarIOS` valida `tab-menu`; guarda do coração; `limparFavoritoOrfao` |
| **CI #14** | **5/5** | — | referência |

## O que ficou no código

- 14 ramificações `if (PLATFORM === 'ios')` em `BasePage`, `HomePage`, `LoginPage`,
  `CategoriasPage`, `PerfilPage`, `FavoritosPage`.
- `fechaBanner()` chamado antes de **cada clique** do ramo iOS (não só no início do step),
  3s antes/3s depois, screenshot no Allure se não fechar.
- `aguardarTelaEstavel()`, `voltarIOS()` por tab bar, guarda "conta suja" pela largura do
  ícone do coração, `limparFavoritoOrfao()` na spec.

## Ainda não exercitado

`limparFavoritoOrfao()` e o ramo "Conta suja" da guarda do coração — só um run que quebre
entre favoritar e desfavoritar valida esses caminhos (`STATE.md`).

## Registro detalhado

`plans/2026-09-08-ramo-ios-nos-page-objects.md`,
`plans/2026-09-11-banner-insider-ios-antes-de-cada-clique.md`, `STATE.md` → "Pendências
abertas" (seções Run #7–#14), `RELATORIO-ANOMALIAS-IOS.md`.
