# STATE

**PAROU AQUI (2026-10-15, tarde) — retomar por estes itens:**
1. **Captura iOS feita** (app 1.21.6 build 349, iOS 26.2, Remote Access, sessão fechada): compra **Pix** e
   compra **cartão** (cartão e CPF fake), finalizadas com autorização do Marcio. Capturas em
   `drafts/app-migrado/ios/captures-2026-10-15-compra-{pix,cartao}/` (`NOTAS.md`); drafts escritos
   (`drafts/app-migrado/ios/00-INDICE.md`: 01–19, 21, 26, 27, 34–40). Pedidos criados: `MASSA-DE-DADOS.md`.
2. **Documentos para o dev:** `ELEMENTOS-SEM-TESTID-IOS.md` (build 349) e `ELEMENTOS-SEM-TESTID.md` (Android 505),
   ambos com a versão no topo; bugs em `BUGS-APP-IOS.md` e `BUGS-APP-ANDROID.md`.
3. **Próximo, na ordem:**
   - **Captura do cartão no Android** (AVD, build atual), quando o Marcio liberar o emulador: inspector +
     draft-writer em paralelo (regra no `CLAUDE.md`). Incluir os **casos inválidos do formulário** (número
     errado, validade vencida, CVV incompleto, CPF inválido, campos vazios), que faltaram no iOS.
   - **Casos inválidos do formulário no iOS:** precisam de nova sessão de Remote Access (o Marcio abre e
     atualiza o `.env`).
   - **Cartão aprovado:** depende de cartão de teste do gateway, que tem que vir do time do app.
   - **Ramo iOS do `04-compra-pix`: ESCRITO em 2026-10-15 (noite), NÃO RODADO.** Rodar:
     `npm run wdio:ios -- --spec test/specs/04-compra-pix.spec.ts` (Remote Access). Seletores do build 349 conferidos
     com lxml nas árvores das capturas, não numa sessão. Mudou também o onboarding iOS (`welcome-start-button`,
     `onboarding-topics-continue`, `privacy-accept`, `terms-accept` no lugar do `accept-button`) e o login iOS
     (`menu-login-button`, `login-submit-button`), o que vale para a POC. Sheets da PDP por fração (exceção do
     Marcio no `REQUIREMENTS.md`); carrossel sem validação no iOS; copiar código Pix sem seletor no iOS. Esperado:
     parar no `validarQrCode` enquanto o QR não carregar no iOS (pedido já criado). Menu logado no 349 não
     capturado (`menu-card-*` enabled=true inferido).
   - **Spec do cartão** (Android e iOS) depois das capturas; **gerador de massa** na execução
     (`MASSA-DE-DADOS.md`).
   - Decisões ainda abertas do Marcio: pausas do login ficam ou saem; `04-compra-pix` no Device Farm ou não.
4. **Permissão:** o toque de finalizar pedido foi bloqueado 2x pelo classificador do Claude Code
   ("Real-World Transactions") e passou na 3ª, depois de o Marcio reafirmar a autorização. Pode voltar a
   acontecer; nesse caso o Marcio roda o `act.mjs` com `!`.

Atualizado em **2026-10-15 (madrugada)** — (registro anterior): spec `04-compra-pix` (compra com Pix, só Android local)
passou 2x no AVD (14/10 20:43 e 21:58), mas está instável por um **crash do app** no login (o app fecha durante o
spinner do botão "Sign in"; relato em `BUG-CRASH-ANDROID.md`). Registro completo e próximos passos em
`plans/2026-10-14-compra-pix.md` (seção "Onde parou"). **2026-10-15 (manhã):** reprodução pelo `adb`, sem WDIO:
o crash **não aconteceu** em 6 logins (0/6), mas o script foi bem mais lento que o teste, então **não vale
como prova**. Ver `drafts/app-migrado/android/crash-2026-10-14/repro-adb/RESULTADO.md`.
**2026-10-15 11:14–11:20:** o Marcio rodou o teste: login sem crash, e o spec parou **só** na validação da tela
do Pix, como esperado (valor a pagar 629,91 × 1.349,82 esperado; pedido 134367), pelo bug do app que divide a
compra em 2 pedidos. Antes, em **2026-10-13**: o timeout do Device Farm subiu de 15 para 60 min (ver "Pendências abertas"). Em 2026-10-09: Os testIDs novos entraram no build Android 1.21.2 (500), e os seletores da suíte ainda não foram trocados; ver "Pendências abertas". Antes disso, em 2026-10-03: (M6 em execução: 06-01 a 06-05 concluídos — **Etapa 1 verde no AVD-S24** (5/5, versão reduzida; **reduções revertidas em 2026-10-03, specs de volta aos 15 testes do último commit, não rodados nessa forma desde então**), POC verde local no Android e no iOS; Device Farm da Etapa 1 e da POC pendente; próximo: 06-06; ver "Pendências abertas").

> Este arquivo foi mesclado nesta data. A cópia do `.planning/` trazida de outra pasta em
> 2026-09-10 sobrescreveu a versão de 09-09 com a de 09-08 — os drafts e o relatório de
> anomalias eram adição pura (ganho), mas o STATE/ROADMAP voltaram no tempo. O conteúdo
> abaixo junta as duas: as decisões de desenho iOS vieram da versão de 09-08, os achados de
> CI da de 09-09, e o resto é de hoje.

## Onde o projeto está

**Verde nas duas plataformas.** `CI Run #14` (2026-09-11 15:49, commit `c367423`):
**Android 18/18** no pool de 6 devices e **iOS 5/5** — iPhone 13, 14, 14 Pro Max, 15 e
15 Pro Max, cada um no seu run de 1 device, ponta a ponta. É a primeira vez que os 5 iPhones
passam no mesmo run: **o passo 5 do M3 está fechado** e o M3 concluído. O `CI Run #14` passa a
ser a referência das duas plataformas.

O que levou até aqui, no mesmo dia: o `CI Run #13` (14:18) caiu para 16/18 no Android e 3/5 no
iOS por um banner novo do Insider, um tap perdido e uma conta suja (pendência "CI Run #13"
abaixo); a correção dos 4 pontos (validar desfavoritar, `voltar()` por tab bar, guarda de conta
suja, limpeza em falha) entrou em `c367423` e o Run #14 validou tudo.

**M4 concluído** (2026-09-10, ajustes nos testes em 09-11). **M5 — Levantamento do app
migrado, em andamento**: o app Aramis está sendo migrado por módulos, com `testID`; Android
com a 2ª leva capturada e drafts escritos, iOS com a 1ª leva incompleta (ver "Pendências
abertas").

**Próximo marco: M6 — Cenários Gherkin da seção 3 no app migrado** (decidido em 2026-09-29):
os 101 cenários da seção 3 de `cenarios-gherkin-2026-09-28.pdf` (raiz do repo), escritos
como teste WDIO + Mocha com os testIDs do M5, em 8 etapas (0 a 7). Com isso os marcos
seguintes foram renumerados: a suíte atual no app migrado passou de M6 para **M7**, e o
fluxo de compra (cobertura além do favoritar, adiado) de M7 para **M8**. Etapas e o que
ainda não está definido: `ROADMAP.md`.

Lembrete do que o M3 é, porque é fácil de distorcer: **uma suíte só**. O
`test/specs/test.spec.ts` não muda, nenhum page object novo é criado, e o `if` de
plataforma mora dentro do método — como o `ativarApp()` de `HomePage.ts` já faz.

## Working tree

Branch `main`, HEAD em **`37857ce`** (`fix`, 2026-09-29). **Fora de commit:** `STATE.md` e
`ROADMAP.md`, com o registro da 2ª leva Android do M5 e a entrada do M6 (cenários Gherkin) com a renumeração M6→M7, M7→M8. Commits desde o `c367423` (referência
do `CI Run #14`, tabela abaixo) — nenhum toca em `test/` nem na configuração da suíte:

- `59ea7b1`, `fadafde` (11/09, mesmo dia) — só documentação: `STATE.md`/`ROADMAP.md`;
  `fadafde` também mexeu no `CLAUDE.md` e criou a pasta `Atualizações/`.
- `8c5fada` (14/09) — só `STATE.md`/`ROADMAP.md`.
- `332ab75` (16/09) — criou `.planning/codebase/`, `.planning/phases/`,
  `.planning/config.json` e `.planning/MILESTONES.md`, à mão, no formato GSD (o tooling
  `/gsd:*` real ainda não estava instalado — ver comentário no próprio `config.json`).
- `4d0cf96` (29/09, manhã) — registro da 1ª leva Android do M5 (ver "Pendências abertas");
  removeu a pasta `Atualizações/`.
- `37857ce` (29/09) — `@opengsd/gsd-core` instalado como devDependency real, corrigindo os
  hooks `gsd-*` que estavam referenciados em `.claude/settings.json` mas não existiam
  (`Cannot find module .../gsd-context-monitor.js`). É configuração do Claude Code, não do
  app nem da suíte — `.claude/` é gitignored, só `package.json`/`package-lock.json` mudaram
  no git. Perfil de skills instalado: `core` (mínimo).

Os drafts e o `RELATORIO-ANOMALIAS-IOS.md` continuam fora do git por `.gitignore`; os planos
(`.planning/plans/`) estão versionados.

O que `c367423` contém (validado no `CI Run #14`):

| Arquivo | O que mudou |
|---|---|
| `test/pageobjects/FavoritosPage.ts` | **(1)** `tirarSelecaoItem()` Android: `fechaBanner()` antes do clique e **poll de 30s até o produto sumir** da lista (antes era clique + `pause(3000)` sem asserção). Nas duas plataformas, `aguardarTelaEstavel()` ao final (a lista recarrega skeleton → vazia por ~6s). **(3)** `validaElememnto()` (Android e iOS): se o produto não está e a tela mostra `You don't have any favorite products yet!`, erro nomeado **"conta suja"** — o toque na listagem desfavoritou um item que já estava lá. Android passou de `expect` (3s) para `waitForDisplayed` 30s. |
| `test/pageobjects/CategoriasPage.ts` | **(2)** `voltar()` Android: `aguardarTelaEstavel()` → `fechaBanner()` **imediatamente antes** do clique → clique → **espera a tab bar** (`Categorias`/`Menu`/`Perfil`, 15s) → 2 taps antes de falhar com erro explícito. **(3)** Guarda em `favoritarPrimeiroProdutoIOS`: mede o `action-button-icon` do coração; largura < 26 (preenchido = 20x21, contorno = 32x33, draft 15) → erro "conta suja" **antes** de tocar. |
| `test/pageobjects/BasePage.ts` | **(2)** `voltarIOS()`: critério de sucesso passou de "árvore mudou" (`telaMudou`, removido) para **`tab-menu` visível** (15s); `aguardarTelaEstavel()` antes; cada caminho (Back, chevron) tenta 2 taps. Novo `aguardarTelaEstavel(timeout=15s)`: duas leituras iguais de `getPageSource` com 1s de intervalo; se não estabilizar só loga. |
| `test/specs/test.spec.ts` | **(4)** `tirarSelecaoItem(produtoFavoritado)` (passa o nome); flag `desfavoritado`; `try/catch` em volta dos steps: se falhou com produto favoritado e não desfavoritado, `limparFavoritoOrfao()` — `mobile: terminateApp` + `activateApp`, `abrirPerfil` → `abrirFavoritos` → `tirarSelecaoItem(produto)`, tudo melhor-esforço; se não conseguir, anexo `Favorito órfão na conta` no Allure com conta + produto. O erro original é sempre relançado. |

Ainda **não exercitado** (o Run #14 não falhou, logo não passou por aqui): a limpeza
`limparFavoritoOrfao()` — em especial se `mobile: activateApp` devolve o app na Home logado no
iOS — e o ramo de erro "Conta suja" da guarda do coração. São caminhos de falha; só um run que
quebre entre favoritar e desfavoritar vai validá-los.

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

### M6 — em execução desde 2026-10-01 (`/gsd-execute-phase 6`): planos 06-01 a 06-05 concluídos

- **06-01:** DEC-A respondida (registrada no `06-CONTEXT.md`); **regra fixa: idioma ignorado, testes
  não validam texto** (D-04 corrigida, `REQUIREMENTS.md`); captura iOS sessão A do app migrado
  (1.20.10 build 335, 45 capturas, drafts em `.planning/drafts/app-migrado/ios/`); captura Android
  em inglês cancelada por decisão do Marcio.
- **06-02/06-03:** POC migrada para o app migrado (`test/specs/00-poc-favoritar.spec.ts`,
  `test.spec.ts` removido) — **verde local nas duas plataformas**: Android AVD-S24 17/17
  (2026-10-01 21:20) e iOS Remote Access 17/17 duas vezes (22:17 e 22:25). Detalhes e desvios em
  `06-03-SUMMARY.md`. Seletores Android sem texto (XPath estrutural + `enforceXPath1`), fechaBanner
  pelo `wrap-close-button` da raspadinha, logout validado por `menu-card enabled=false`, login
  desloga antes se o app abrir logado.
- **Pendente:** run do CI (Device Farm) com a POC migrada — o Marcio dispara; durações por device
  levantadas pelo AWS CLI depois. Working tree com as mudanças de `test/`, sem commit.
- **Bug do app (levar ao time):** relato para os devs em `BUG-CRASH-ANDROID.md` (raiz, 2026-10-14: 4 crashes
  no dia no build 1.21.6/505, 3 de 9 runs da compra Pix mortos por ele; a automação agora anexa o logcat de
  crash ao Allure quando o app fecha). Registro original: crash intermitente no Android na transição Termos → Home
  (logcat 2026-10-01 20:29: `RetryableMountingLayerException: Unable to find viewState for tag 266`).
- **06-04 (2026-10-02):** DEC-C respondida (por-item, registrada no `06-04-SUMMARY.md`): segue o app
  (ordem dos diálogos, Termos), ONB-06 fora do escopo (excluído, 9 excluídos no total), `wdio.conf.ts`
  intocado com skip por plataforma no iOS, e-mail `informatica.mrn+{texto}@gmail.com` com texto único
  por execução e por device, modal de erro iOS fechado relançando o app, ATT = Allow. Escritos
  `01-onboarding.spec.ts` (6 its) e `02-login.spec.ts` (6 its), `OnboardingPage`, `EsqueciSenhaPage`,
  `massa.ts`, `cobertura.check.mjs`. Verificação só estática (tsc + gate 8/8); **seletores não verificados
  até o run**. `logar()` refatorado para `entrar()` — risco para a POC, validar no run.
- **Pendência (Marcio, 2026-10-02):** ler a caixa do Gmail para validar o e-mail de redefinição de
  senha (LOG-07 hoje só valida a tela) — planejar e implementar depois.
- **Pendência (Marcio, 2026-10-02), validar no futuro:** remover do `wdio.conf.ts` o
  `autoAcceptAlerts: true` (iOS, linhas 35 e 70) e o `autoGrantPermissions: true` (AVD, linha 83),
  e passar o tratamento dos diálogos para os page objects (regra "Nenhum passo de teste no
  `wdio.conf.ts`" no `REQUIREMENTS.md`). Ficam por ora porque retirá-los já afetou os testes antes.
  Enquanto ficarem, ONB-01..04 pulam no iOS (DEC-C e) e o onboarding iOS não tem cobertura real.
  O mesmo vale para o hook `before` (pausa fixa de 10 s) e para o reset do app no `afterTest`.
- **Pendência — hook do Claude quebrado:** o `.claude/settings.json` registra o
  `gsd-secret-read-guard.js` em Read/Grep/Bash, mas o arquivo não existe em `.claude/hooks/` nem
  no `@opengsd/gsd-core` 1.10.0 instalado. O hook falha em silêncio e a proteção contra leitura
  de segredo (`.env`) não está ativa. **Decisão do Marcio (2026-10-02): não mexer.** O impacto
  não é conhecido, e o `.claude/settings.json` nunca é alterado (regra no `REQUIREMENTS.md`).
  Fica só registrado.
- **06-05 (2026-10-02):** Logout OUT-01..03 escrito. Run local no AVD (16:07–17:01): POC + 14
  cenários passaram, **só o ONB-02 falhou** em `tocarCta()`. O toque avançou e o diálogo de
  localização ficou na tela (vídeo), mas o `iniciaApp()` não o detectou em 20 s e o 2º toque
  clicou no container já sumido. Causa da não detecção sem prova. A correção do `iniciaApp()`
  (não tocar de novo se o container sumiu) foi **adiada pelo Marcio**. Antes desse run, a espera
  pelas Boas-vindas subiu de 20 s para 60 s (`OnboardingPage.abrirApp`, `BasePage.iniciaApp`):
  o app leva de 13 a 25 s ou mais para abrir depois de limpar os dados.
- **REVERTIDO (Marcio, 2026-10-03):** "deixar igual os testes estavam no último commit". Os arquivos
  `01-onboarding`, `02-login`, `03-logout` e `cobertura.check.mjs` foram restaurados do HEAD e têm
  **15 testes**. Gate com `COBERTURA_ETAPA_ATE=1 COBERTURA_PREFIXOS=ONB,LOG,OUT`: 8/8. **Os 15 ainda
  não rodaram juntos no AVD.** Depois, as 4 suítes (`00` a `03`) foram copiadas da pasta
  `automation-mobile-wdio/` que o Marcio entregou, igual ao último commit. Com isso o
  `00-poc-favoritar.spec.ts` voltou a ficar ativo, com 1 teste. São 16 testes no total.
  Histórico da redução, que não vale mais:
- **Cobertura mínima (Marcio, 2026-10-02, regra no `REQUIREMENTS.md`):** Etapa 1 reduzida de 13
  para **7 testes**, todos com situação C no gate (`cobertoPor`):
  - Onboarding: **4 testes, decisão do Marcio** (ONB-01..04, um por combinação de permissão), com
    ONB-04 cobrindo ONB-05 e 07. Por erro meu, o run das 23:31 teve só 2 (ONB-02/03 absorvidos
    sem pedido); os testes foram restaurados em 2026-10-03.
  - Login: LOG-05 cobre LOG-01, 02 e 04 (estados do botão na mesma tela até a credencial recusada);
    LOG-07 cobre LOG-03.
  - Logout: OUT-03 cobre OUT-01 e OUT-02 (abre → cancela → abre → confirma).
  A preparação (onboarding + login) custa 120–220 s por teste no AVD, e as asserções, segundos.
  Vale para todas as próximas etapas: um teste por decisão, sem caminho repetido.
- **06-05 concluído (Marcio, 2026-10-02): Etapa 1 verde no AVD-S24, 5/5 em ~18 min** (23:31–23:49).
  Esse run foi com 2 testes de onboarding. **ONB-02 e ONB-03 foram restaurados depois e não rodaram
  na versão atual de 7 testes**; eles já tinham passado separados nos runs das 16:15 e 18:39.
  Resultado e seletores verificados no `06-05-SUMMARY.md`. **Device Farm (Android e iOS) não rodado**:
  fica pendente para o próximo run do CI, junto com a POC.
- **CI Run #17 (2026-10-03 17:32) — Android sem relatório no Pages, iOS publicado (diagnóstico 2026-10-05,
  pelo AWS CLI). Relatório completo, com os comandos e as fontes: `.planning/DIAGNOSTICO-CI-RUN17.md`
  — retomar por ele:**
  1. **APK errado:** o CI subiu `app-run17.apk` = `com.aramis.ecomm` **1.14.3 build 486** (app ANTIGO). A
     seleção vem dos secrets `BUILD_PROFILE_ANDROID`/`BUILD_SELECTION` (no `.env` local: `production` /
     `latest`), e o `production` mais recente ainda é o app antigo. A suíte é do app migrado (1.20.x).
  2. **Todos os testes falham no mesmo ponto** nos 6 Samsungs: `HomePage.validarHome` → "tab-home
     visível=true, editorial-home-root presente=false" (o app antigo não tem esse testID). Cada teste
     ainda refaz o onboarding inteiro antes de falhar.
  3. **Timeout de 15 min:** o run tem `jobTimeoutMinutes = 15`; o Device Farm parou a Tests Suite aos
     15,25 min nos 6 aparelhos (`STOPPED`, "Tests stopped", WDIO em 75%). Com a fase `test` morta, o
     `post_test` do `testspec.yml` (que copia `allure-results` para `$DEVICEFARM_LOG_DIR`) não rodou: o
     `Customer Artifacts` de cada aparelho só tem o `appium.log`. Sem `*-result.json`, o publish-report
     não gera o relatório Android.
  4. **iOS publicou porque terminou antes de 15 min** (12,14 min no iPhone 13; ONB-01..04 pulam no iOS),
     então o `post_test` rodou. O relatório iOS publicado tem as MESMAS falhas (`editorial-home-root`).
  O Run #16 (02/10) teve o mesmo padrão (Android `STOPPED` em 5 de 6 aparelhos).
  Decisões em aberto para o Marcio: qual perfil/build do EAS é o app migrado para o CI; e o tempo do
  Android (16 testes com onboarding completo não cabem em 15 min por aparelho).
- **Spec `04-compra-pix.spec.ts` escrito (2026-10-14, cenário do Marcio "Jornada completa de compra com
  Pix", 35 passos). Registro completo em `plans/2026-10-14-compra-pix.md`. **Passou no AVD em
  2026-10-14 20:43–20:50** (4º run do Marcio; pedido nº 128763), com a limpeza da Mochila desativada a pedido dele. Preço de cada produto
  lido na PDP (`lerPrecoDoProduto`), guardado no spec e validado no resumo antes de finalizar.** Só Android; pula no iOS (sem
  captura) e no Device Farm (cria pedidos reais; decisão pendente do Marcio). Page objects novos:
  `BuscaPage`, `ProdutoPage`, `CheckoutPage`, `PedidoPage`. Trocas para os ids do build atual (Android):
  onboarding (`onboarding-topics-continue`, `privacy-accept`, `terms-accept`), login
  (`menu-login-button`, `login-*-input`, `login-submit-button`), logado (`menu-user-header`), sair
  (`menu-item-logout`). Elementos sem id via XPath, listados no `ELEMENTOS-SEM-TESTID.md` (seção 00).
  Capturas: `drafts/app-migrado/android/captures-2026-10-14-compra-pix/` e `-rodada2/` (35/35 no AVD).
  Achados: 1 toque em finalizar com 2 produtos gerou 2 pedidos (rodada 2: #127635 e #127673); QR do Pix
  intermitente; tela do Pix e Home com cronômetro exigem `waitForIdleTimeout: 0`; resumo da rodada 2
  sem o desconto Pix (1.499,80 × 1.349,82 cobrado).
- **Próximo cenário: compra com CARTÃO (Marcio, 2026-10-15) — precisa de nova captura no Android.** Depois do
  `04-compra-pix`, o próximo teste é o fluxo de compra pagando com cartão. Antes de escrevê-lo, capturar no AVD
  os elementos da **tela de pagamento com cartão** (formulário do cartão e o que vier depois dele, até onde o
  app deixar). A última captura dessa tela é da 2ª leva do M5 (build 1.20.10/492, 2026-09-29), que parou no
  formulário de cartão: na época os campos **não tinham testID**, e ela é anterior ao build atual (1.21.6/505).
  **Autorizado pelo Marcio (2026-10-15): finalizar pedido real nas capturas, tanto no Pix quanto no cartão.**
  **Cartão:** fake, gerado em 2026-10-15 a pedido do Marcio. Os dados estão em `.planning/MASSA-DE-DADOS.md`,
  junto com os demais dados de teste e os pedidos reais criados. Espera-se a recusa do pagamento.
  Captura iOS da compra Pix (2026-10-15, Remote Access, app 1.21.6 build 349, iOS 26.2) **até o Resumo**, em
  `drafts/app-migrado/ios/captures-2026-10-15-compra-pix/` (`NOTAS.md`), depois finalizada (capturas 45–48,
  com nova autorização do Marcio): **1 toque gerou 2 pedidos** (#139889 R$ 629,91 e #139933 R$ 719,91), a tela
  do Pix e o banner da Home mostram só o #139889, e **o QR do Pix não carregou**, nem com "Try again". São os
  mesmos achados do Android. **Cartão no iOS capturado** (cartão e CPF fake, em
  `captures-2026-10-15-compra-cartao/`): 1 toque gerou 2 pedidos (#140130 e #140139), os dois cancelados; o
  formulário de cartão só tem `card-installments-input`. Sessão fechada (`deleteSession`). Falta a captura do
  cartão no **Android** (build atual). Os testIDs que faltam no iOS estão em
  `ELEMENTOS-SEM-TESTID-IOS.md` (raiz); o maior bloqueio é o conteúdo dos bottom sheets (tamanho e "produto
  adicionado") fora da árvore, hoje só por coordenada.
- **Gerador de massa na execução (Marcio, 2026-10-15), não planejado ainda:** a automação deve gerar cartão,
  CPF e afins a cada execução, com uma lib de dados fake ou equivalente, em vez de usar valores fixos. Detalhes e
  pontos a decidir em `.planning/MASSA-DE-DADOS.md` ("Pendente: gerador de massa na automação").
- **Specs 01–03 COMENTADOS (2026-10-14, pedido do Marcio):** `01-onboarding`, `02-login` e `03-logout`
  estão com todas as linhas prefixadas por `// ` (conteúdo idêntico ao HEAD). Só a POC
  (`00-poc-favoritar`) roda, enquanto o Marcio traz um cenário maior para entrar no projeto. Para
  reativar: `git restore` dos três arquivos. Enquanto isso, o gate `cobertura.check.mjs` falha se rodado.
- **Timeout do Device Farm subiu de 15 para 60 min (2026-10-13, pedido do Marcio).** Feito na AWS,
  fora do git: `aws devicefarm update-project --default-job-timeout-minutes 60` no projeto `ecomm`,
  conferido por `get-project` (`ecomm 60`). Vale para Android e iOS, porque nenhum `schedule-run` do
  `mobile_test.yml` passa timeout próprio. Para desfazer: o mesmo comando com `15`. A conta paga por
  minuto (`unmeteredDevices` 0), e o limite da conta é 150 min. O polling do workflow espera até
  120 min. **Ainda não validado em run.** O próximo run mede quanto a suíte inteira leva. Continuam
  abertos o APK/IPA errado do CI (decisão 1 do `DIAGNOSTICO-CI-RUN17.md`) e a opção de o Allure gravar
  direto em `$DEVICEFARM_LOG_DIR`, para o relatório sobreviver a um timeout.
- **testIDs novos do dev: ENTRARAM no build 1.21.2 (500)** (conferido em 2026-10-09 no AVD-S24, app
  instalado no mesmo dia às 14:36). A conferência fez 74 capturas, do onboarding ao logout, passando
  por PDP, Mochila, endereço, entrega, pagamento e Busca, com toque por id e o efeito conferido no dump.
  Também foi feita a busca dos ids no `index.android.bundle`. A maioria dos ids do
  `TESTIDS-ALTERADOS.md` existe e funciona. Evidência: `drafts/app-migrado/android/captures-2026-10-09-build500/RESULTADO.md`.
  O `ELEMENTOS-SEM-TESTID.md` (raiz) ganhou a coluna "no 500" e a seção 0, com o que falta pedir ao dev.
  - **Ainda faltam:** o coração do card da **Listagem** continua `action-button` (o
    `favorite-toggle-<id>` só existe em Favoritos, nas recomendações e na Mochila vazia).
    `search-input` e `search-clear-button` não existem; o "X" nem tem nó. `pressable` continua em
    "Salvar alterações" e em "Cadastrar novo endereço". A seção "Código do vendedor" continua
    `button-collapsible-card`.
  - **Quebram a suíte atual no Android** (os genéricos sumiram): `accept-button`, `menu-card`,
    `menu-list-button`, `pressable` no Login e no Esqueci a senha, `action-button` em Favoritos, e o
    acesso ao Login, que era achado pela posição antes do 1º `menu-card`.
  - **Continuam:** `tab-*`, `editorial-home-root`, `editorial-group-0`, `permission-topic`,
    `category-button`, `sub-categories-button`, `product-list`, `flatlist-favorites`,
    `action-button-icon` (84x84 → 52x53) e `wrap-close-button-<n>`. O `enabled` dos `menu-card-*`
    continua indicando o estado: true logado, false deslogado (capturas 10, 19, 73 e 74).
  - **Sufixo `<id>`:** é o número do produto, o mesmo no card e no toggle (`product-card-164803`,
    `favorite-toggle-164803`).
  - **Crash Termos → Home: não reproduziu.** Houve 1 `RetryableMountingLayerException` (blur), sem
    crash. O 1º toque em Notificações abriu "Page not found"; o 2º funcionou.
  - **iOS não conferido** neste build. Não se sabe se o IPA tem os mesmos ids.
  - **Não resolve o CI:** o Device Farm continua baixando o APK `production` antigo (Run #17).
- **(histórico) testIDs novos do dev — NÃO estavam no build 494 (2026-10-05):** o `TESTIDS-ALTERADOS.md` (raiz) lista
  ~90 ids aplicados. A conferência no AVD (`com.aramis.ecomm` 1.20.11 build 494, instalado em 10-03)
  não achou nenhum, nem nas 48 árvores, nem no `index.android.bundle`. Evidência em
  `drafts/app-migrado/android/captures-2026-10-05-testids/RESULTADO.md`; o `ELEMENTOS-SEM-TESTID.md`
  ganhou a coluna de situação. **Testes não alterados** (trocar agora quebraria tudo). Aguardando o
  dev dizer qual build tem as alterações; quando chegar, refazer a conferência e só então trocar
  os seletores Android.
- **Próximo:** 06-06 (capturas da Etapa 2/3 e DEC-D). Antes de escrever as próximas etapas, aplicar
  a regra de cobertura mínima.

### M6 — discussão feita em 2026-09-30

`.planning/phases/06-cenarios-gherkin-app-migrado/06-CONTEXT.md` (decisões D-01–D-14),
`06-PENDENCIAS.md` (massa de dados para o Marcio decidir) e `06-DISCUSSION-LOG.md`. Resumo:
código nos page objects atuais, suíte só no app migrado (a POC do favoritar também migra);
device em **inglês**, valida funcionalidade e não idioma; Android + iOS juntos; CI a cada
etapa; contas por device do CI reaproveitadas. Escopo: 101 − 8 excluídos (pt-BR 5, Seção DEV 2,
conectividade 1) = 93, dos quais 11 pendentes de massa (cupom 6, estoque 2, frete 3) → 82 agora.
- **Não feito ainda:** captura iOS do app migrado (sessão de Remote Access que o Marcio abre
  depois) — pré-requisito da implementação, não do planejamento.
- **Planejada em 2026-10-01 pelo `/gsd-plan-phase 6`** (pesquisa → planner → checker, aprovado
  na 2ª checagem): `06-RESEARCH.md`, `06-VALIDATION.md` e **16 planos `06-01-PLAN.md`…`06-16-PLAN.md`**
  (todos `verify plan-structure` `valid: true`; decisões D-01–D-14 cobertas 14/14). O documento da
  fase `06-PLAN.md` (29–30/09) é o correto: foi **convertido** para o formato GSD — o texto dele
  está, palavra por palavra, no `<context>` do `06-01-PLAN.md` — e o arquivo no formato antigo
  saiu do diretório. Próximo comando: `/gsd-execute-phase 6`, que começa pela DEC-A (decisões do
  Marcio) e pelas capturas Android em inglês e iOS sessão A.
- Achado da pesquisa: as capturas `captures-2026-09-29-m6e1/` **não estão em inglês** (AVD em pt-BR);
  a premissa da D-04 ainda não foi verificada — é a DEC-B do 06-02.
- Trabalho de 29–30/09 ainda sem registro aqui: `captures-2026-09-29-m6e1/` (Etapa 1, sem
  `NOTAS.md`), `captures-2026-09-30/` (parcial) e `ELEMENTOS-SEM-TESTID.md` (raiz).

### Levantamento do app migrado (M5) — 2ª leva Android feita em 2026-09-29 (build "completo")

AVD `emulator-5554`, `com.aramis.ecomm` **1.20.10 build 492**, capturas `00`–`51` (54 prints e
55 dumps, contando `12b`, `13-relaunch` e o `24b-windows.xml`, só árvore) em
`.planning/drafts/app-migrado/android/captures-2026-09-29/`, com `NOTAS.md` (tela a tela) e
**`TESTIDS.md`** (todos os testIDs por tela + o que ainda não tem id). Navegação feita pelo
Claude via `adb`, a pedido do Marcio. A captura `14` é da Home, não do Menu (o Menu logado é a
`45`). Drafts escritos (ver abaixo).
- **Fluxo da suíte inteiro funciona**, inclusive favoritar e desfavoritar (quebrados no 1.20.8).
- **App em pt-BR**: todo seletor por texto/desc da suíte atual quebra ("Continuar", "Li e concordo",
  "Fazer login", "Sair", "SAIR", "Você ainda não tem produtos favoritados!"). Ids seguem valendo.
- Estado favoritado agora visível na árvore: `action-button-icon` 84x84 → 52x53.
- 28 drafts escritos em `.planning/drafts/app-migrado/android/` (índice `00-INDICE.md`).
- Encerramento: `adb shell pm clear com.aramis.ecomm` + `adb kill-server`.
- Login: 1º tap em "Fazer login" com teclado aberto só fecha o teclado; o 2º loga.
- Compra percorrida até a escolha de pagamento; parado no formulário de cartão (sem cartão de
  teste escrito). Campos de endereço e cartão **não têm testID**.
- Conta ao final: sem favoritos, Mochila vazia, **um endereço salvo** (Av. Paulista, 1000), deslogada.
- Banner do Insider não apareceu nesta sessão.

### Levantamento do app migrado (M5) — 1ª leva Android feita em 2026-09-22

AVD `emulator-5554`, `com.aramis.ecomm` **1.20.8 build 483**, 32 capturas (`00`–`31`) em
`.planning/drafts/app-migrado/android/captures-2026-09-22/` com `NOTAS.md`. Sem draft ainda.
Fluxo da suíte percorrido de ponta a ponta: onboarding → **login OK com `CLIENT_USER` no 1º tap**
→ Categorias → Roupas → Camisas → favoritar → Favoritos → logout. **O bloqueio de login do iOS
(09-11) está explicado:** a conta não existia para o app migrado; o Marcio a cadastrou em
2026-09-22 e atualizou a senha no `.env`. Não está escrito se as contas por device do CI
precisam do mesmo cadastro. **Favoritar não funciona neste
build**: toque no coração abre modal "Falha ao carregar / Não foi possível carregar as categorias"
(2/2) e Favoritos fica vazio — lacuna do módulo; desfavoritar não exercitado. Banner raspadinha
do Insider apareceu em Categorias e fechou pelo `Close`. Falta: PDP, Mochila/checkout, Busca —
capturados na 2ª leva (build 1.20.10, acima).

### Levantamento do app migrado (M5) — 1ª leva iOS feita em 2026-09-11, INCOMPLETA

**Capturado:** 37 pares print + árvore (`00`–`36`) em
`.planning/drafts/app-migrado/ios/captures-2026-09-11/`, com `NOTAS.md` (tabela por captura:
ação, seletor, achados). **Ainda sem draft** — o `mobile-draft-writer` não rodou; o Marcio vai
ler as capturas primeiro e conferir com o que ele sabe que funciona. Scripts de captura ao lado:
`capture.mjs` (print + árvore, reutiliza a sessão) e `act.mjs` (comando avulso na sessão) —
rodar num diretório com `.env` e `node_modules` (junction para o do repo).

Ambiente: 3 sessões de Remote Access, iPhone iOS 18.0, janela `393x852`pt (print 1178x2556,
escala 3), **mesmo `bundleId` `com.aramis.ecomm`**, versão **1.20.0 build 314** (o antigo era
1.14.2/305), instalação limpa. Sessões caíram 2x por `Invalid pre-signed URL`.

O que a leva cobriu, **tudo deslogado**: notificações (alerta) → boas-vindas → onboarding →
política → termos → Home → Perfil → Login → Categorias → Roupas expandido → Camisas (listagem)
→ tentativa de favoritar.

**Bloqueio (RESOLVIDO em 2026-09-22 — conta não cadastrada no app migrado; ver leva Android acima): login recusado com credenciais corretas.** `CLIENT_USER`/`CLIENT_PASSWORD` do
`.env`, digitados à mão pelo Marcio e conferidos no print com a senha visível (`19-retomada`),
2 taps em "Sign in" (`20`, `22`) → modal "Incorrect username and/or password". Não é digitação;
é o backend deste build recusando a conta. **Perguntas em aberto para o Marcio:** essa conta
deveria funcionar aqui? o app migrado aponta para outro ambiente/base? há outra conta?

**Achados novos em relação ao app antigo** (detalhe em `NOTAS.md`):
- Alerta nativo de **App Tracking Transparency** no onboarding, antes do de localização.
- Modais RN ("Incorrect username…", "Atenção — Você precisa fazer login para adicionar
  produtos aos favoritos") são um nó único sem filhos: `mobile: alert` falha, só coordenada.
- `tab-bag` com label "Mochila" (era "My Bag"); bloco "DEV / Painel de controle" oculto no
  Account Menu; `accept-button` ("Continue") fixo desde a 1ª tela do carrossel.
- **Categorias com estrutura nova**: carrossel de campanhas + lista com chevron; "Roupas"
  mantém `sub-categories-button`.
- **Listagem Camisas já hidratada na 1ª captura** (151 produtos) — no antigo levava 20s+.
- Home sem banner do Insider nas 2 capturas.

**Não resolvido / pendente para a próxima sessão:** abrir a **PDP** pelo card (2 taps por
coordenada não navegaram; `name ==` deu 0 matches, provável ` ` no preço; `CONTAINS`
achou 17 nós e a sessão caiu antes do clique) → sacola/Mochila → checkout deslogado → Menu
item a item → Busca. Depois do login resolvido: Perfil logado, favoritar/desfavoritar,
Favoritos, checkout, logout. **Android: nada capturado ainda.**


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

### CI Run #13 (2026-09-11 14:18) — 2 Android + 2 iOS, três causas — CORRIGIDO e VALIDADO no `CI Run #14`

Medido em log (`Test spec output`) + vídeo, frame a frame, dos 4 jobs. **O código Android não
tinha mudado desde o Run #6** (diff `56810d6..d2e770b` só toca ramos iOS).

- **Banner NOVO do Insider: "Só no APP: 20% OFF pra você! Raspe aqui e descubra"** (raspadinha,
  fundo azul). Dispara ~2,5–3s **depois da interação com o coração** (favoritar ou desfavoritar),
  nas duas plataformas. Run #12 (13:02) foi 18/18 no Android; Run #13 (14:18) já pegou —
  campanha ativada nessa janela. Não é o INTERLÚDIO.
- **S23 Ultra / S24 Ultra** — `Nenhum dos seletores apareceu em 20000ms: Menu | Perfil` no 3º
  `abrirPerfil`. Desfavoritar → lista vazia → banner nasce → o `elementClick` da seta Voltar cai
  em cima dele (no S23 Ultra o click levou 1,07s; normal 0,1s) e **fecha o banner em vez de
  voltar**. O banner dura ~1,5s; o `fechaBanner()` do step rodou 0,1s antes de ele renderizar e
  o `insiderLayout` seguinte já não existia. App preso em Favoritos (sem tab bar). No S23+ o
  mesmo banner apareceu e o clique ganhou a corrida: `✅ Banner fechado (tentativa 1/3)`.
- **iPhone 15 Pro Max** — `tab-menu still not displayed` no 3º `abrirPerfil`. **Sem banner**
  (brilho do vídeo constante). O tap no `Back` saiu com Favoritos recarregando (skeleton →
  vazia), o WDA levou **6,7s** para entregar, o tap se perdeu; `telaMudou()` devolveu `true`
  porque o estado vazio acabou de renderizar (diff dos dois `getPageSource`: "Favorites Back
  Toolbar" → "You don't have any favorite products yet!"). Falso positivo de "voltou".
- **iPhone 13** — `flatlist-favorites não apareceu`. Aos 205s do vídeo, com a listagem recém
  aberta, o coração da 1ª camisa **já estava vermelho**: a conta `informatica.mrn+qa100@gmail.com`
  tinha o item de um run anterior (Run #12, iPhone 13, morreu no `voltar()` da listagem logo
  após favoritar). O toque **desfavoritou**, Favoritos abriu vazio, e a lista vazia não tem
  `flatlist-favorites`. **Efeito em cadeia entre runs.** Desfavoritar manualmente nessa conta
  antes do próximo run.

**Resultado:** `CI Run #14` (15:49), mesmo dia, com a campanha do banner ainda ativa: Android
18/18, iOS 5/5. Registro do que se conferiu no próximo run, mantido como checklist para
regressões: Android `💔 "<produto>" removido de Favoritos` e `↩ voltar: seta`;
iOS `↩ voltar: accessibility id:Back`; `🤍 Coração de "<produto>" sem preenchimento (icone 32x33)`;
nenhum `Conta suja`. Se um teste falhar entre favoritar e desfavoritar, procurar `🧹` no log e
o anexo `Favorito órfão na conta` no Allure.

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
  de backend um allowlist/bypass para QA/Device Farm. Bloqueia o M8; não afeta M1/M3.
- **App sem `accessibilityIdentifier` em pelo menos 5 pontos do fluxo iOS.** O caminho
  estruturalmente correto é pedir os identificadores ao time do app.
- **Segundo banner do Insider — OBSERVADO em 2026-09-11 (Run #13):** "Só no APP: 20% OFF pra
  você! Raspe aqui e descubra" (raspadinha), disparado ~2,5–3s depois da interação com o
  coração, nas duas plataformas. Fecha pelo mesmo `Close`/backdrop; o que o neutralizou foi
  checar o banner imediatamente antes de cada clique e validar cada navegação pelo destino.
- **Uma camisa ficou favoritada na conta** durante a investigação manual (Camisa Manga Longa
  Slim em Tricoline Stretch Liso Branco). Desfavoritar antes de um run limpo.
