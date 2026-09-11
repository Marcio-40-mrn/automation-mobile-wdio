# ROADMAP

## M1 — Suíte Android estável ✅

Concluído em 2026-09-03.

- `fechaBanner` fecha o banner do Insider por **seletor** (`accessibility id:Close`, o botão
  do próprio criativo), esperando a WebView publicar a árvore, confirmando que o
  `insiderLayout` sumiu e repetindo o ciclo até 3 vezes. Nenhuma coordenada.
- O produto favoritado deixou de ser um nome fixo: `favoritarPrimeiroProduto()` pega a
  primeira camisa que a lista mostrar, lê o nome do `content-desc` do card e favorita ali
  mesmo, no `action-button`.
- Favoritando na listagem, o teste fica uma tela antes na navegação e um único `voltar()`
  chega em categorias, que é onde a aba Perfil existe.
- `abrirPerfil` aceita `Menu` ou `Perfil`, porque o id da aba muda entre versões do app.

## M2 — Inspeção de elementos padronizada ✅

Concluído em 2026-09-04 — mas **não** como este marco estava escrito. Em vez de um agente
por plataforma, foram criados dois agentes por **papel**:

- `.claude/agents/mobile-ui-inspector.md` — inspeção nas duas plataformas: Android via
  `adb` (`uiautomator dump` + `screencap`), iOS via sessão Appium/XCUITest contra o
  endpoint de Remote Access do Device Farm (`getPageSource()` + `takeScreenshot()`).
- `.claude/agents/mobile-draft-writer.md` — lê as capturas brutas e escreve os drafts. Não
  toca no device, para que a inspeção e a redação corram em paralelo sem uma travar a
  outra (as sessões de Remote Access duram 20–30min; a captura sobrevive à sessão, a
  redação não precisa esperar).

**O `ios-ui-inspector` não existe e não será criado.** A divisão que se mostrou útil é por
papel (inspecionar × redigir), não por sistema operacional.

## M3 — Rodar a MESMA suíte no iOS ✅

Concluído em 2026-09-11 — `CI Run #14`: Android 18/18 e iOS 5/5 no mesmo run.

**Regra que define este marco: não existe uma suíte iOS.** É a mesma suíte, o mesmo
`test/specs/test.spec.ts`, os mesmos page objects, os mesmos nomes de método. Cada método
que precisar detecta a plataforma (`process.env.PLATFORM === 'ios'`) e escolhe o seletor
ali dentro — o padrão que o `ativarApp()` de `test/pageobjects/HomePage.ts` já inaugurou.
**Nunca** criar spec, classe ou arquivo separado por SO.

A infraestrutura já existe: `npm run wdio:ios`, `testspec-ios.yml`, capabilities XCUITest
no `wdio.conf.ts`, variáveis no `.env`.

Passos:

1. ✅ Sessão de Remote Access num iPhone do Device Farm, com o IPA instalado.
2. ✅ `REMOTE_HOST` / `REMOTE_PORT` / `REMOTE_PATH_IOS` no `.env`.
3. ✅ Inspeção tela a tela — **encerrada em 2026-09-04**: 8 sessões, 3 iPhones, 33 drafts
   em `.planning/drafts/ios/` (índice em `00-INDICE.md`), mais o consolidado
   `.planning/RELATORIO-ANOMALIAS-IOS.md`. Cobre o fluxo do M1 inteiro e o do
   `test/Draft.ts` até o `Finalize purchase`.
4. ✅ Ramo iOS preenchido em `test/pageobjects/` (2026-09-08) — 14 ramificações em 6
   arquivos, `tsc --noEmit` limpo. **Escrito a partir dos drafts, ainda não exercitado
   contra device**: o que valida é o passo 5.
5. ✅ A suíte roda no iOS ponta a ponta. **Passou pela primeira vez** no `CI iOS Run #8`
   (2026-09-10), no iPhone 15 — os 17 steps, de `ativarApp` a `confirmarLogout`. No `CI iOS Run #9`,
   **4/5** — o login (caractere perdido na digitação) está corrigido e validado; o 14 Pro Max
   caiu porque o banner do Insider não era fechado no iOS (fechamento reativado com o marcador
   de presença certo, aguardando run). Detalhes no `STATE.md`. `CI iOS Run #12`: 4/5; `CI iOS Run #13`: 3/5 (iPhone 13 por conta suja
   herdada do #12, 15 Pro Max por tap perdido no `Back` + falso positivo do `telaMudou`) e o
   **Android caiu para 16/18** pelo banner novo "Só no APP: 20% OFF" — correção dos 4 pontos
   (validar desfavoritar, `voltar()` por tab bar, guarda de conta suja, limpeza em falha) no
   `c367423`. **`CI Run #14` (2026-09-11 15:49): Android 18/18 e iOS 5/5** — os 5 aparelhos
   passaram no mesmo run. Passo fechado.

O bloqueio original deste marco — 19 dos 31 seletores eram Android-only e os 12
`accessibility id:` não podiam ser presumidos — **está resolvido**: o valor iOS de cada um
está documentado por captura, draft por draft.

### Divergências de FLUXO, não só de seletor

São estas que obrigam o `if`, e não apenas a troca de uma string:

- **Logout não tem diálogo de confirmação no iOS** (draft `24`). No Android é
  `id:android:id/button1`; no iOS o tap em "Logout" desloga na hora — não existe elemento,
  alerta nem timeout que resolva sozinho, então `confirmarLogout()` não tem o que esperar.
- **O onboarding depende de toque por coordenada em dois pontos** (drafts `01` e `02`): o
  CTA "Toque para começar" não gera nó nenhum na árvore de acessibilidade, e o alerta de
  localização é do SpringBoard — fora do `getPageSource()` do app. `autoAcceptAlerts: true`
  e `driver.acceptAlert()` reportam sucesso sem fechar nada.
- **`accessibility id` no iOS é id interno, não o texto visível** (drafts `03`–`05`, `12`,
  `13`): `tab-menu`/`tab-categories`/`accept-button`/`category-button` no lugar de
  `Menu`/`Categorias`/`Continue`/`Roupas`. O texto mostrado vive no `label`, e vários nós
  compartilham o mesmo `name` — daí o uso de `-ios predicate string` combinando os dois.
- **Campos de formulário perdem `name` e `label` ao serem preenchidos** (draft `08`) — o
  seletor por placeholder só serve para achar o campo vazio.
- **O primeiro tap em "Sign in" depois de digitar não registra** (draft `09`): 5
  ocorrências, 4 sessões, 3 devices, uma delas byte-idêntica a outra. É comportamento
  padrão esperado, não exceção — pausa de 2–3s antes do submit é regra do page object.
- **A listagem de produtos e a PDP não têm tab bar**, igual ao Android (draft `21`) — a
  regra "`voltar()` antes de `abrirPerfil()`" vale no iOS do mesmo jeito.
- **Favoritos persistem por CONTA, no backend** (draft `22`) — sobreviveram à reinstalação
  do app em outro iPhone. Nenhum cenário pode assumir a lista de Favoritos vazia. A Sacola,
  ao contrário, não persiste (draft `19`).
- **Comandos de conveniência do XCUITest reportam sucesso sem agir neste app** — três casos
  confirmados: `acceptAlert()`, `mobile: hideKeyboard` e `clearValue()` (seção 3 do
  `RELATORIO-ANOMALIAS-IOS.md`). Validar sempre pelo estado seguinte, nunca pelo retorno.

### Lacuna fechada em 2026-09-08

O `voltar()` da listagem de produtos era o único ponto do fluxo do M1 sem seletor capturado.
Resolvido: a tela tem um chevron sem nó próprio, dentro do nó do título, e o cabeçalho tem
dois nós homônimos — o `[1]` é a barra (inerte) e o `[2]` é o botão. Seletor validado 2x, ver
draft `34`. `driver.back()` e o gesto de borda foram testados e **não** funcionam nesta tela.

### Sobre o banner do Insider no iOS

O `Close` do criativo é `accessibility id:Close` nas duas plataformas — mas no iOS ele **não
serve como marcador de presença**: o nó sobrevive na árvore e responde `displayed=true` com a
tela limpa. O equivalente ao `insiderLayout` é a WebView `label == "Insider WebView Content"`
(e a Window `Inapp Window`): `displayed=true` só com o criativo visível. Medido no
`CI iOS Run #9` nos dois estados, no mesmo aparelho. Regra: presença pela WebView, clique no
`Close`, confirmação pela WebView sumir — o mesmo ciclo do Android. Nunca desligar o
fechamento por causa de falso positivo do `Close`; corrigir a checagem.

**2026-09-11 — medido com banner real (2x, Remote Access):** o `Close` é o "X" e o `element click`
fecha; a árvore fica sem nenhum nó Insider. Mas um elemento por baixo do banner responde
`displayed=true`/`hittable=true`, então a única checagem no início do step não basta: o
`fechaBanner()` passou a ser chamado **antes de cada clique do ramo iOS**, com 3s antes do
clique no `Close`, 3s depois e validação, e screenshot no Allure se não fechar. Aguardando run.

## M4 — Paridade em CI 🔄

O job `run-ios-on-device-farm` **já existe** em `.github/workflows/mobile_test.yml`, com
`testspec-ios.yml`, pool de devices iOS próprio e os `allure-results` entrando no mesmo
relatório do Android. O que falta é o fluxo do M3 passar — não infraestrutura.

**Resolvido em 2026-09-10 — a pendência dos mapas `ios` deixou de existir.** A tentativa de
identificar o iPhone em runtime (primeiro por modelId, depois pelo par versão de OS +
resolução) foi abandonada: o XCUITest não devolve `deviceModel`, o UDID muda a cada run e o
host não expõe índice de job. Pior, o mapa virou **condição de partida** — no `CI iOS Run #6`
dois aparelhos não executaram nada por não casarem a chave.

Agora quem decide a conta é o CI: **um run por aparelho**, com o email daquele device
injetado no testspec do run (`schedule-run --device-selection-configuration`, mirando o ARN).
Nenhum aparelho pode ficar de fora por não ser reconhecido, e nada disso encosta no Android,
que segue com o mapa por modelo do `deviceIndex.android`. Ver `STATE.md`.

Falta: validar num run real e conferir que os 5 logs trazem emails distintos.

## M5 — Cobertura além do favoritar ⬜

O fluxo de compra rascunhado em `test/Draft.ts`: adicionar à sacola → escolher tamanho →
endereço → cartão → finalizar compra.

**Bloqueado por fora da automação:** o `Finalize purchase` falha com erro de ReCAPTCHA,
2/2 tentativas byte-idênticas (draft `33`). Não é bug de seletor nem de timing — é proteção
anti-bot do backend funcionando como projetada. Tudo até o Summary é automatizável e está
documentado (drafts `25`–`32`). Encaminhamento: pedir ao time de backend um allowlist ou
bypass de ReCAPTCHA para o ambiente de QA/Device Farm; até lá, o critério de sucesso
possível é a chegada ao Summary. **O M1 e o M3 não são afetados** — não passam por compra.
