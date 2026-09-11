# Banner do Insider no iOS: olhar antes de cada clique

**Status:** implementado em 2026-09-11 (working tree, não commitado). Aguardando run real na empresa.

## Problema

Run iOS no repositório principal (mesma versão de código, `581de84`): o banner do Insider abriu
logo depois de favoritar e o teste morreu por baixo dele. Era a 4ª tentativa de resolver o banner
no iOS:

| Tentativa | O que fez | Por que falhou |
|---|---|---|
| Run #7 | presença pelo `Close`, clique nele | o nó `Close` sobrevive na árvore com a tela limpa e o WDA diz `displayed=true` — clicava num fantasma e navegava para "Meus Pedidos" |
| `a53c6b6` | só diagnóstico, sem clicar | banner real ficou aberto sobre o `voltar()` (Run #9, 14 Pro Max) |
| `581de84` | presença pela WebView `Insider WebView Content`, clique no `Close`, confirma que sumiu | mecanismo certo (provado hoje), mas chamado **uma vez por step**, no `step()` do spec |

Lacuna comum das três: ninguém havia clicado no `Close` com o banner na tela e comparado a
árvore antes/depois. No Android isso foi feito no plano de 2026-09-03 — e é por isso que
funciona lá.

## Evidência (Remote Access, iPhone iOS 18.0, janela 393x852pt, print 1178x2556px, escala 3)

Duas ocorrências do criativo "INTERLÚDIO", em telas diferentes (Account Menu e Categorias):

| Medição | Com banner | Após `element click` no `Close` |
|---|---|---|
| `accessibility id:Close` | found, `displayed=true`, `[313,273 25x25]` — centro (325,286)pt = "X" do print | `no such element` |
| WebView `label == "Insider WebView Content"` | found, `displayed=true`, `[0,59 393x759]` | `no such element` |
| Window `InsiderTemplateWindow` | found, `displayed=true`, `visible=true` | `no such element` |
| Window principal do app | `visible=false` | `visible=true` |
| `tab-categories` (por baixo do banner) | **`displayed=true`, `hittable=true`** | idem |
| Contextos | só `NATIVE_APP` | — |

O clique fechou as duas vezes, em ≤1s, sem navegação indesejada. Sem fantasma neste aparelho.

O achado que explica a falha: **o WDA não enxerga o banner como obstrução**. Um elemento por
baixo dele responde `displayed=true`/`hittable=true`, então todo `waitForDisplayed` passa e o
toque vai para a janela do Insider, engolido em silêncio. Como o `fechaBanner()` só rodava no
início do step, um banner que nasce durante os 40s de espera da grade de produtos engolia o
clique no coração — e o passo morria com uma mensagem que não fala em banner.

Técnica de captura: sessão XCUITest criada **sem `app`/`bundleId`** no endpoint de Remote Access
(não relança o app); `GET /sessions` antes, para anexar se já houver; chamadas W3C diretas por
`curl` (`/element`, `/displayed`, `/source`, `/screenshot`); `deleteSession` ao final.

## Solução

Ramo iOS apenas. Android, `wdio.conf.ts`, spec e seletores intocados. Nenhum método novo de
fechamento.

1. `fechaBannerIOS()` (`test/pageobjects/BasePage.ts`): detectou a WebView → **3s** → `Close` →
   clica → **3s** → **valida que a WebView sumiu** → repete o laço (2º criativo) → 3 falhas: erro.
   Antes clicava na hora e validava por poll de 5s. Tempos definidos pelo Marcio.
2. **Evidência**: log `🟡 Banner do Insider na tela — aguardando 3s` → `👆 Clicando no "Close" em
   [rect]` → `✅ Banner fechado e confirmado fora da tela`; se não fechar, `⚠ ... Close agora em
   [rect]` e, no erro final, **screenshot anexado ao Allure** + rect na mensagem. Helper privado
   `rectDe(seletor)` formata o rect.
3. **`await this.fechaBanner();` imediatamente antes de cada clique do ramo iOS** — 15 pontos:
   `BasePage` (`iniciaAppIOS`, `aceitaOnboardingIOS`, `voltarIOS` ×2), `HomePage` (`abrirPerfil`
   iOS, `abrirCategoriasIOS`), `LoginPage` (`logarIOS` ×2, `digitarIOS`), `CategoriasPage`
   (`clickRoupas` iOS, `abrirCamisas` iOS, `favoritarPrimeiroProdutoIOS` — o coração),
   `PerfilPage` (`abrirFavoritos` guardado por `if ios`, `logout` iOS), `FavoritosPage`
   (`tirarSelecaoItemIOS`). O `step()` do spec continua chamando no início de cada passo.

`tsc --noEmit` limpo (erros só em `test/Draft.ts`, rascunho gitignored, pré-existente).

## O que conferir no run

- Com banner: `🟡` → `👆 ... [313,273 25x25]` → `✅`, e o clique seguinte executa.
- Tela limpa: nenhuma dessas linhas.
- Se falhar, o step vermelho traz o rect e o screenshot: rect certo e banner ainda lá = clique
  cedo demais; rect fora do "X" = elemento errado; nenhuma linha `🟡` antes da falha = banner não
  visto (nasceu entre a checagem e o toque).

## Pendência que saiu daqui

Validação do estado seguinte após toda ação no ramo iOS: `abrirPerfil`, `clickRoupas`,
`abrirCamisas`, `abrirFavoritos` e `logout` ainda clicam e pausam sem conferir que a tela
mudou. Iniciativa separada, com plano antes.
