# STATE

Atualizado em **2026-09-11** (após a medição do banner em Remote Access).

> Este arquivo foi mesclado nesta data. A cópia do `.planning/` trazida de outra pasta em
> 2026-09-10 sobrescreveu a versão de 09-09 com a de 09-08 — os drafts e o relatório de
> anomalias eram adição pura (ganho), mas o STATE/ROADMAP voltaram no tempo. O conteúdo
> abaixo junta as duas: as decisões de desenho iOS vieram da versão de 09-08, os achados de
> CI da de 09-09, e o resto é de hoje.

## Onde o projeto está

**Android: verde.** `CI Run #6` (2026-09-09) fechou **18/18 PASSED** no pool de 6 devices.
É a referência, e o desenho do Android não deve ser alterado.

**Marco atual: M3, passo 5** — a mesma suíte rodando no iOS. **Primeiro iOS verde:** no
`CI iOS Run #8` (2026-09-10 18:31, 5 runs de 1 device) o **iPhone 15 passou ponta a ponta**
— onboarding, login, favoritar, validar em Favoritos, desfavoritar (coração de maior x = 155),
logout. Os outros quatro falharam por duas causas distintas, ambas medidas nos artefatos
(ver Pendências): três por **caractere perdido na digitação do login** e um (14 Pro Max) em
`abrirFavoritos()`.

Lembrete do que o M3 é, porque é fácil de distorcer: **uma suíte só**. O
`test/specs/test.spec.ts` não muda, nenhum page object novo é criado, e o `if` de
plataforma mora dentro do método — como o `ativarApp()` de `HomePage.ts` já faz.

## Working tree

Branch `test`, HEAD em **`581de84`** (1 commit à frente de `main` = `9c14b0a`). O `digitarIOS()`
está em `9c14b0a` e o `fechaBannerIOS()` que clica em `581de84` — ambos commitados. Os drafts,
o `RELATORIO-ANOMALIAS-IOS.md` e o plano de 09-08 continuam fora do git por `.gitignore`.

Não commitado (2026-09-11 — banner do Insider no iOS, 4ª tentativa; Android intocado):

| Arquivo | O que mudou |
|---|---|
| `test/pageobjects/BasePage.ts` | `fechaBannerIOS()`: **3s** entre detectar a WebView e clicar no `Close` (antes clicava na hora); **3s** depois do clique e então valida que a WebView sumiu (antes poll de 5s); log com o rect do `Close` antes do clique e o estado depois; **screenshot anexado ao Allure** quando não fechar. Helper privado `rectDe()` para o rect no log. Chamada de `fechaBanner()` antes do tap das boas-vindas, do aceite do onboarding e dos dois cliques do `voltarIOS`. |
| `HomePage.ts`, `LoginPage.ts`, `CategoriasPage.ts`, `PerfilPage.ts`, `FavoritosPage.ts` | `await this.fechaBanner();` **imediatamente antes de cada clique do ramo iOS** (15 pontos no total, incluindo o coração em `favoritarPrimeiroProdutoIOS`). Hoje só o `step()` do spec chamava, uma vez por passo. |
| `.planning/STATE.md`, `.planning/ROADMAP.md` | este registro |

## O levantamento iOS (2026-09-04)

8 sessões de AWS Device Farm Remote Access, 3 iPhones diferentes, iOS 26.3, janela
`402x874`pt (print `1206x2622`px, escala 3), app **1.14.2 build 305** de produção:

- `.planning/drafts/ios/` — 35 drafts, um por tela, com print + árvore XCUITest de cada
  estado. `00-INDICE.md` é o mapa e concentra as descobertas que mudam a estratégia de seletor.
- `.planning/RELATORIO-ANOMALIAS-IOS.md` — o consolidado por tipo de problema.

Cobertura: fluxo do M1 inteiro **e** o fluxo de compra do `test/Draft.ts` até o
`Finalize purchase`.

## Decisões tomadas

### Atribuição de conta por device (2026-09-10)

- **As `environmentVariables` do Device Farm são do RUN, não do JOB.** Num run com N
  aparelhos todos recebem exatamente as mesmas variáveis. Não existe "este device usa o
  email 3".
- **O host iOS não recebe nem essas variáveis.** O script que a AWS gera monta o próprio
  ambiente e exporta só as `DEVICEFARM_*` — conferido no artefato `Test spec shell script`
  do run #6, onde o diagnóstico imprimiu `CLIENT_USERS_EMAILS len=0`. No Android o processo
  herda o ambiente do agente, e é por isso que lá funciona.
- **O host não expõe índice/ordinal de job.** As únicas variáveis são
  `DEVICEFARM_{APP_PATH,DEVICE_NAME,DEVICE_OS_VERSION,DEVICE_PLATFORM_NAME,DEVICE_UDID,`
  `LOG_DIR,SCREENSHOT_PATH,TEST_PACKAGE_PATH,WORKING_DIR,WDA_*,EXIT_CODE}`. O único valor
  único por aparelho é o UDID, e ele muda a cada run (frota pública).
- **Logo, no iOS não existe auto-identificação confiável** — e o mapa por (versão de OS,
  resolução) que tentava isso foi removido. Ele falhava em 2 dos 5 aparelhos porque a API
  informa a versão completa (`17.3.1`, `18.6.2`) e o host exporta truncada (`17.3`, `18.6`)
  e, pior, **abortava o teste** quando não casava: no run #6 o iPhone 14 e o iPhone 15 Pro
  Max não executaram nada.
- **A decisão de conta voltou para o CI: um run por aparelho.** `schedule-run` com
  `--device-selection-configuration '{"filters":[{"attribute":"ARN","operator":"IN",
  "values":["<arn>"]}],"maxDevices":1}'` mira um device sem precisar criar device pool.
- **O email viaja no testspec, não no `.env` do ZIP.** O testspec é o único canal que chega
  no host com valor por aparelho, já tinha a função de montar o `.env`, e são 5 arquivos de
  poucos KB contra 5 ZIPs de ~33 MB. Custo aceito: o email aparece no artefato
  `Test spec file` (já aparecia no `Test spec output`).
- **A ordem do pool usa `LC_ALL=C sort`.** Sem isso o collation do runner muda a posição de
  "iPhone 14" vs "iPhone 14 Pro Max", as contas trocam de dono entre runs e o Trend do
  Allure quebra.

### Android (M1)

- **O banner do Insider se fecha pelo `Close` do criativo, dentro da WebView.** O `closeBt`
  nativo é decorativo; o `back()` do Android também não fecha. Testado com dump antes/depois.
- **O marcador de presença do banner é o `insiderLayout`, nunca o `htmlView`** — o `htmlView`
  some da árvore em alguns momentos mesmo com o banner visível.
- **A tela de listagem de produtos não tem a barra de abas** (nenhum `tab-*`). Por isso o
  `voltar()` antes do `abrirPerfil()` é obrigatório.
- **O `action-button` é o favoritar**, mas o estado favoritado não aparece na árvore — só o
  pixel muda. A asserção tem que ser na tela de Favoritos.

### iOS — o que muda o desenho dos page objects

- **Logout no iOS não tem diálogo de confirmação** (draft `24`). É a única divergência de
  *fluxo* do M1: `confirmarLogout()` retorna cedo no iOS.
- **Dois pontos do onboarding só funcionam por coordenada** (drafts `01`, `02`), guardadas
  como **fração** da janela — a medição foi em `402x874`pt.
- **O alerta de localização é do SpringBoard** e `autoAcceptAlerts`/`acceptAlert()` não o
  dispensam. Quem o fecha é `mobile: alert` com `buttonLabel`. Validado no run #6:
  `✅ Alerta de localização aceito por "Allow While Using App"` nos 5 aparelhos.
- **`acceptAlert()`, `mobile: hideKeyboard` e `clearValue()` reportam sucesso sem agir**
  neste app. Regra: validar pelo estado seguinte, nunca pelo retorno.
- **Não usar `mobile: scroll` com `toVisible`** nos aceites: derrubou o `CI iOS Run #61` por
  timeout (~85s por chamada, reenviada 3x). O laço de swipe + `isDisplayed()` converge.
- **`accessibility id` no iOS é o id interno, não o texto visível** — vários nós compartilham
  o mesmo `name`, o que obriga `-ios predicate string` combinando `name` e `label`.
- **O primeiro tap em "Sign in" depois de digitar não registra** (draft `09`) — regra, não
  exceção. Confirmado no run #6: `⚠ Tap 1/2 em "Sign in" não navegou — repetindo`.
- **`voltar()` na listagem é o chevron do cabeçalho**, `[2]` de dois nós homônimos (draft
  `34`). Validado no run #6: `↩ voltar: chevron do cabeçalho ("Camisas")`.
- **Favoritos persistem por CONTA, no backend** (draft `22`) — nenhum cenário pode assumir a
  lista vazia, e é por isso que cada device precisa de uma conta só sua.

## Pendências abertas

### Um email por device — VALIDADO no `CI iOS Run #7`

Funcionou: 5 runs separados (`CI iOS Run #7 - Apple iPhone 13 / 14 / 14 Pro Max / 15 / 15 Pro
Max`), **os 5 aparelhos executaram**, 5 contas distintas, e Android sem regressão
(`CI Run #7` = 18/18 PASSED). Nenhum `Device iOS não encontrado`.

### Correções de fluxo iOS — VALIDADAS no `CI iOS Run #8` (onde o login passou)

No iPhone 15 (PASSED) e no 14 Pro Max (logou): `🛍 Produto escolhido: Camisa Manga Longa Slim
em Tricoline Stretch Liso Branco` só com o nome; `💔 Desfavoritar: 2 action-button no card
(x = 155, 21); escolhido o de maior x = 155`; nenhum `Banner do Insider não fechou`, nenhum
`🔎 [diag banner]` (o `Close` fantasma não apareceu neste run); `voltar`, `abrirPerfil`,
`logout` e `confirmarLogout` exercitados pela primeira vez e passaram
(`✅ Logout confirmado pelo estado da tela`).

### Login iOS perde caracteres na digitação — CORRIGIDO e VALIDADO no `CI iOS Run #9`

Run #9 (2026-09-10, noite): `⌨ Email: N caracteres digitados com o teclado aberto` nos 5
aparelhos, **5/5 logins**, 4/5 PASSED (13, 14, 15, 15 Pro Max). O único FAILED (14 Pro Max)
foi o banner, abaixo. Diagnóstico original mantido a seguir para registro.


Causa dos "email ou senha incorreto" do Run #7 (`marciorocha`, "em observação") e do Run #8
(iPhones 13, 14 e 15 Pro Max). **Medido nos artefatos, não deduzido** — detalhe completo na
seção 4.4 do `RELATORIO-ANOMALIAS-IOS.md`:

- testspec e `🔑 Conta deste run` corretos nos 5 aparelhos → não é `.env`/secret;
- `appium.log`: `setValue` sai completo (`"m","a","r","c","i","o",...`) → não é o Appium;
- frame do vídeo após o `setValue`: `mariorocha@maildrop.cc` (iPhone 14) e `qaest@maildrop.cc`
  (15 Pro Max) → a letra some **no ato de digitar**;
- o WDA dá o tap para focar e digita 23 caracteres em <1s, com o teclado ainda subindo; o
  iPhone 15 passou pelo mesmo caminho e logou — é aleatório;
- iPhone 13 digitou o email certo e foi recusado: o vídeo **não mostra senha** (campo
  `secureTextEntry` sai vazio até no aparelho que logou), então a letra perdida na senha é a
  única variável restante (inferência; o resto é medição).

Agravante corrigido junto: `logarIOS()` dava `✅ Login efetivado` com o modal de erro na tela,
porque o modal cobre o botão "Sign in" e a âncora era "botão sumiu". O teste morria 20s depois
em `tab-categories still not displayed` — o sintoma errado, no passo errado.

No próximo run, conferir: `⌨ Email: N caracteres digitados com o teclado aberto` nos 5; frame
do vídeo com os 5 emails íntegros; nenhum `Login efetivado` seguido de `tab-categories`. Se
aparecer o novo erro `o app recusou as credenciais`, o frame diz se ainda falta letra (baixar
mais o `maxTypingFrequency`) ou se é outra coisa.

### Banner do Insider no iOS — MEDIDO em 2026-09-11, correção no working tree, aguardando run

Run na empresa (mesma versão `581de84`): o banner abriu logo depois de favoritar e o teste morreu
por baixo dele. Medição em Remote Access, 2 ocorrências (Account Menu e Categorias), iPhone iOS 18.0:

- `Close` em `[313,273 25x25]`, centro = o "X" do print (1178px ÷ 3). `element click` **fechou** as
  duas vezes; ≤1s depois `find` de `Close`/WebView/`InsiderTemplateWindow` → `no such element`.
  Sem fantasma neste aparelho. Só existe contexto `NATIVE_APP`.
- Com o banner na tela, `tab-categories` (por baixo) respondeu `displayed=true`, `hittable=true`:
  o WDA não vê o banner como obstrução, o toque é engolido em silêncio. Enquanto o banner está
  aberto, a `Window` principal do app fica `visible=false` (segundo discriminador possível).
- Conclusão: o método fecha; o furo é ser chamado só no início do step — o banner que nasce
  durante os 40s de espera da grade engole o clique no coração. Correção: chamada antes de cada
  clique do ramo iOS + 3s/3s + evidência no log/Allure (tabela do Working tree).
- Próximo run: com banner, esperar `🟡 ... aguardando 3s` → `👆 Clicando no "Close" em [...]` →
  `✅ Banner fechado e confirmado fora da tela`; se falhar, o erro traz o rect e um screenshot.

Registro anterior (Run #9), mantido:


No Run #9 o 14 Pro Max favoritou, o banner INTERLÚDIO abriu em cima da listagem (frame t=159s,
`Close` em `[332,313 24x25]`) e o `voltar()` morreu por baixo dele. O `fechaBannerIOS()` rodou
antes do passo e **viu** o banner — mas não clicou, pela decisão de `a53c6b6`. Essa decisão
foi errada e está revertida: o marcador de presença certo (WebView `Insider WebView Content`
displayed=true) saiu do próprio diagnóstico do Run #9 e agora o ciclo de fechar é o mesmo do
Android. No próximo run conferir `✅ Banner fechado (tentativa 1/3)` quando o banner aparecer e
**nenhum** fechamento com a tela limpa.

O `abrirFavoritos()` do 14 Pro Max no Run #8 (`flatlist-favorites` não apareceu) provavelmente
era o mesmo banner num passo diferente; não há diag naquele run para provar. Reavaliar se
reaparecer com o fechamento ativo.

### Sessões de Remote Access: o que não fazer

Custou três sessões em 2026-09-10. Abrir sessão Appium com `bundleId` **reativa o app, e a
sessão nova costuma vir com ele resetado** (cai nas boas-vindas mesmo com `noReset: true`), o
que obriga a refazer onboarding + login — 3 a 4 minutos. E a URL pré-assinada **expira em
poucos minutos e não renova** (`403 Invalid pre-signed URL`).

Regra prática: **o Marcio navega até a tela e avisa; o Claude só conecta e captura.** Na
captura, pegar `getPageSource()` UMA vez e medir os rects parseando o XML local — dezenas de
`getLocation()/getSize()` custam ~300ms cada na sessão remota, somam 20-30s e deixam as
referências de elemento obsoletas (um clique depois disso não registra). E **sempre fechar a
sessão** (`deleteSession`) ao final: uma sessão deixada aberta segura o device.

### Bugs de teste no iOS — corrigidos e VALIDADOS no `CI iOS Run #8` (registro)

Os três vieram do `CI iOS Run #7` (5 runs de 1 device, todos os aparelhos executaram) e do run
local do Marcio. **Todos com causa medida em aparelho, nenhum por dedução.** Fica como
registro do diagnóstico; o resultado está na pendência "Correções de fluxo iOS" acima.

- **Nome do produto poluído — CORRIGIDO.** O predicate
  `name BEGINSWITH "Camisa" AND name CONTAINS "R$"` casa também com o **wrapper da tela**,
  cujo `name` agrega os labels dos filhos (`Camisas Filter and sort 152 products Camisa Manga
  Longa Slim...`). O guard `CONTAINS "R$"` existia para descartar o *título*, não o
  *container*. Medido na listagem real: 10 nós de **402pt** (wrapper), 3 de **370pt** (linha da
  grade) e os cards de **185pt**. Filtro: largura < 60% da janela.
- **"Banner do Insider não fechou" — era o `Close` FANTASMA, e ele tocava em Meus Pedidos.**
  O nó do `Close` sobrevive escondido na árvore e o `isDisplayed()` do WDA mente sobre ele. O
  `elementClick` então tocava o rect velho — `[318,286 24x24]`, centro **(330,298)** — que cai
  dentro do `menu-card` "My Orders" `[205,222 181x105]`, e de nenhum outro. Confirmado no vídeo
  do iPhone 15 Pro Max (t≈184s, tela "Meus pedidos" entrando por cima do Account Menu) e no
  log, onde as 3 tentativas usam o mesmo element id e os 3 cliques retornam `RESULT null`.
  Correção: `fechaBannerIOS()` **não clica e não lança** — só registra rect do `Close` e estado
  do `InsiderWKWebView`/`InsiderTemplateWindow`, para fechar o discriminador de presença num
  próximo run. O banner real foi visto **uma vez em 8 sessões**; o falso positivo derrubava 3
  de 5 aparelhos.
- **Desfavoritar clicava na SACOLA — CORRIGIDO.** Medido em sessão de Remote Access
  (2026-09-10), tela de Favoritos: card `[16,131 181x457]` com **dois** `action-button`,
  coração em **x=155** e sacola em **x=21**; o `class chain [...][1]` resolvia para **x=21**.
  Ou seja, o toque mandava o item para a sacola, a lista não mudava, e o erro dizia "o conteúdo
  não mudou depois do toque no coração". Correção: coração pelo **maior x dentro do rect do
  card**, e poll de 30s no lugar do `pause(3000)` (desfavoritar é chamada de backend).
- **Guarda do coração na listagem comparava só o `x` — CORRIGIDO.** Bug latente, escrito no
  commit `8536e92`: a grade tem duas colunas, então todo card da mesma coluna divide o mesmo
  intervalo de `x` e o coração da linha de baixo passava na checagem. Resultado seria ler o
  nome de uma camisa e favoritar outra. Agora compara `x` e `y`.

### Outras

- **ReCAPTCHA bloqueia o `Finalize purchase`** (draft `33`), 2/2 tentativas. Escalar ao time
  de backend um allowlist/bypass para QA/Device Farm. Bloqueia o M5; não afeta M1/M3.
- **App sem `accessibilityIdentifier` em pelo menos 5 pontos do fluxo iOS.** O caminho
  estruturalmente correto é pedir os identificadores ao time do app.
- **Segundo banner do Insider.** No Android o Marcio relatou dois criativos e só o
  "INTERLÚDIO" foi capturado. Registrar como "não observado depois", não como "não aparece".
- **Uma camisa ficou favoritada na conta** durante a investigação manual (Camisa Manga Longa
  Slim em Tricoline Stretch Liso Branco). Desfavoritar antes de um run limpo.
