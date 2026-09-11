# 2026-09-11 — Banner do Insider no iOS: medição e correção

## O que foi feito

### 1. Medição ao vivo (Remote Access Device Farm, iPhone iOS 18.0)

Capturada estrutura XCUITest e screenshots de 2 ocorrências do banner (telas Account Menu e
Categorias, criativo "INTERLÚDIO"):

- `accessibility id:Close` em rect `[313,273 25x25]`, centro bate com o "X" do screenshot (1178px ÷ 3)
- `element click` no Close **fechou** ambas as vezes; ≤1s depois nenhum nó Insider na árvore
- Sem "Close fantasma" neste aparelho
- Elemento por baixo (tab-categories) fica `hittable=true`, mas toque engolido enquanto banner aberto
- Conclusão: método `fechaBannerIOS()` fecha; furo é ser chamado só uma vez — o banner nasce durante os 40s de espera da grade e engole cliques

### 2. Técnica de captura que funcionou

Sessão XCUITest SEM `app`/`bundleId` (autodetecção via `GET /sessions`), comandos via curl direto na API W3C — não reativa o app nem consome a URL pré-assinada do Appium. Sessão pode durar 20–30min, ideal para medições múltiplas.

### 3. Implementação (working tree, não commitada)

#### BasePage.ts — `fechaBannerIOS()` refatorada

- **3s aguarda** WebView `Insider WebView Content` detectada
- **3s após clique** confirma WebView sumiu
- Logs: `🟡 ... aguardando 3s` → `👆 Clicando no "Close" em [rect]` → `✅ Banner fechado e confirmado`
- No erro: screenshot anexado ao Allure + rect na mensagem
- Helper privado `rectDe(seletor)` para extrair bounds de um elemento

#### Inserção: 15 pontos, antes de cada clique do ramo iOS

| Arquivo | Métodos | Contexto |
|---|---|---|
| BasePage | iniciaAppIOS (boas-vindas), aceitaOnboardingIOS, voltarIOS ×2 | padrão |
| HomePage | abrirPerfil iOS, abrirCategoriasIOS | navegação |
| LoginPage | logarIOS ×2 (novo e retry), digitarIOS (aguarda teclado) | autenticação |
| CategoriasPage | clickRoupas iOS, abrirCamisas iOS, favoritarPrimeiroProdutoIOS (o coração) | grade e compra |
| PerfilPage | abrirFavoritos (guardado por `if ios`), logout iOS | perfil |
| FavoritosPage | tirarSelecaoItemIOS (coração de maior x) | favoritos |

Validações:
- `tsc --noEmit` limpo
- `.planning/STATE.md` e `.planning/ROADMAP.md` atualizados
- Aguardando run real na empresa (mesma versão `581de84`)

## Decisões registradas na memória

- **Feedback novo:** disciplina no escopo — não criar método quando pedido é arrumar existente; não tocar Android quando problema é iOS; não mexer em config sem necessidade; plano deve dizer estado atual vs esperado item a item; todo clique validado
- **CLAUDE.md atualizado:** bloco "Regras deste projeto" com importação dos 4 arquivos `.planning/` (PROJECT, REQUIREMENTS, STATE, ROADMAP)
- **Agentes:** regra inviolável em `.claude/agents/mobile-ui-inspector.md` — nenhum seletor entregue sem (a) cruzar rect+print, (b) consultar com alvo+sem alvo, (c) clicar e comparar estado antes/depois

## Próximos passos

- Executar run real na empresa para validar que `fechaBannerIOS()` fecha quando banner nasce durante esperas
- Com sucesso, marcar M3 passo 5 como CONCLUÍDO em ROADMAP.md
- Caso falhe, o step vermelho traz rect + screenshot para diagnóstico
