# CONCERNS

Levantado em 2026-09-16. Riscos, dívidas e fragilidades **do código e do ambiente** — o que
um mantenedor deveria saber antes de mexer. Pendências de trabalho ficam em `STATE.md`; aqui
é o que continua verdade independentemente do marco.

## Fragilidades estruturais

| # | Preocupação | Onde | Por que importa |
|---|---|---|---|
| 1 | **Appium não pode ser declarado no `package.json`** | `package.json`, testspecs | autodetecção de `APPIUM_HOME` no host derruba as duas plataformas sem deixar o workflow vermelho de forma óbvia (run-22). Já foi mitigado com `exit 1` na guarda do `publish-report`, mas o risco de regressão em qualquer `npm install <x>` continua. |
| 2 | **Toda devDependency instala no host do Device Farm em Node 18** | `testspec*.yml` | uma dependência que exija Node ≥ 20 quebra o `npm install` do host; teste local não cobre isso. |
| 3 | **40 vulnerabilidades npm** (2 críticas), maioria na subárvore do `appium-uiautomator2-driver` | `package-lock.json` | `npm audit fix --force` rebaixa o WDIO para 7.x — proibido. Subir o driver para 8.x é possível mas exige run real. |
| 4 | **Dois pontos do onboarding iOS só funcionam por coordenada** | `BasePage.iniciaAppIOS`, `permissaoLocalizacaoIOS` | frações medidas em 402x874pt; um layout novo do app muda o ponto. Dívida a cobrar do time do app como `accessibilityIdentifier`. |
| 5 | **Estado "favoritado" não está na árvore de acessibilidade** | `CategoriasPage`, `FavoritosPage` | no iOS a guarda mede a largura do ícone (20 vs 32pt) — heurística; no Android não há guarda antes do toque. |
| 6 | **Favoritos persistem por conta e o coração é toggle** | contas de teste | um run que morre entre favoritar e desfavoritar contamina o run seguinte daquele device (Run #12 → #13). `limparFavoritoOrfao()` mitiga, mas ainda **não foi exercitado** num run real. |
| 7 | **Identidade do device iOS não é resolvível em runtime** | `credentials.ts`, workflow | o desenho "um run por iPhone" depende de o workflow, o pool e a ordenação `LC_ALL=C sort` estarem alinhados. Adicionar um iPhone ao pool sem adicionar email quebra a atribuição. |
| 8 | **Mapa de modelos Samsung hardcoded** | `device-index.ts`, `device-name.ts` | trocar um device do pool Android exige editar dois arquivos; modelo não mapeado cai na conta[0] com aviso (colisão de conta possível). |

## Comportamentos do XCUITest/WDA que enganam

Todos medidos em aparelho (`RELATORIO-ANOMALIAS-IOS.md`, seção 3, e `STATE.md`):

- `acceptAlert()`, `mobile: hideKeyboard`, `clearValue()` reportam sucesso sem agir.
- `isDisplayed()`/`hittable` de um elemento **por baixo** do banner do Insider respondem `true`.
- O nó `Close` do banner sobrevive na árvore com a tela limpa — não serve de marcador.
- `mobile: scroll` com `toVisible` leva ~85s e é reenviado 3x — derrubou um run.
- O primeiro tap em "Sign in" depois de digitar não registra; `setValue` rápido perde
  caracteres com o teclado subindo.
- `getPageSource()` de tela em transição devolve um estado intermediário — `telaMudou()` deu
  falso positivo e foi removido.

## Ambiente e operação

- **Emulador AVD-S24 é ambiente de trabalho do Marcio**: qualquer execução sem pedido
  explícito invalida o run dele. Vale também para "só um teste rápido".
- **Sessões de Remote Access** expiram (URL pré-assinada) e reabrir com `bundleId` costuma
  resetar o app; uma sessão deixada aberta segura o device.
- **Log de GitHub Actions é inacessível ao Claude** (hook `block-github.mjs`); diagnóstico de
  CI depende de o Marcio colar o log ou dos artefatos do Device Farm via AWS CLI.
- **Sem `jq`** no Git Bash local.
- **Vídeo**: arquivos > 100MB são apagados no publish (limite do GitHub) e o vídeo some do
  relatório (404). O 720p e o libx264 existem para ficar abaixo disso; qualquer mudança em
  resolução/fps precisa ser medida (`content-range` no `CLAUDE.md`).

## Dívida de código conhecida (não bloqueante)

- `validaElememnto` (typo) em `CategoriasPage`, `FavoritosPage` e na spec.
- `timewhait` (typo) exportado do `BasePage`.
- `BasePage` tem 695 linhas e mistura helpers genéricos com onboarding e banner; funciona,
  mas o custo de ler cresce a cada ramo iOS.
- `selecionarMangaCurta`, `selecionarProduto`, `selecionarTipo`, `adicionarItemFavoritos`
  em `CategoriasPage` não são chamados pela spec (restos de versões anteriores do fluxo).
- `negaNotificacao()` e as chamadas comentadas em `ativarApp()` são caminho morto.
- `before` usa `pause(10000)` fixo em vez de esperar um elemento.

## Fora do controle do repo

- **ReCAPTCHA** no `Finalize purchase` bloqueia o fluxo de compra (M7).
- **Campanhas do Insider** mudam sem aviso e alteram o timing dos banners.
- **App migrado** (M5): mesmo `bundleId`, versão 1.20.0/314, backend recusou a conta do `.env`
  em 2026-09-11 — pode ser outro ambiente. Não está escrito.
- **Catálogo** muda entre versões — por isso o produto é lido em runtime.
