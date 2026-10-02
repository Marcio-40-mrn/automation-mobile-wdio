# Phase 6: Cenários Gherkin da seção 3 no app migrado - Research

**Researched:** 2026-10-01
**Domain:** automação E2E mobile (WebdriverIO 9 + Mocha + Appium, Android/iOS, AWS Device Farm, Allure) sobre o app Aramis migrado (`com.aramis.ecomm` 1.20.10)
**Confidence:** MEDIUM — o inventário, o código existente e a mecânica de CI/Allure estão lidos em fonte (HIGH); o mapa de elementos é só de dumps/drafts, nenhum seletor do app migrado foi clicado por WDIO ainda, o idioma do app em inglês nunca foi capturado e várias telas nunca foram capturadas (MEDIUM/LOW).

> Fonte de verdade do escopo: `06-CONTEXT.md` (2026-09-30, D-01..D-14) refina o `06-PLAN.md`, que continua sendo o documento de fase aprovado (etapas, regra de "vale o que o app mostra"). Onde o CONTEXT é mais novo que o PLAN, está dito explicitamente abaixo (Etapa 7 e Seção DEV fora; aparelho em inglês; texto do erro de login "no idioma do device").

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Onde o código entra**
- **D-01:** O código entra **neste repositório, nos page objects atuais** (`test/pageobjects/`). A suíte passa a rodar **somente no app migrado** — o app antigo deixa de ser alvo. — **Reversibility:** costly — os seletores e textos atuais do app antigo são substituídos; voltar exige recuperar a versão anterior dos page objects pelo git.
- **D-02:** O teste atual (`test/specs/test.spec.ts`, favoritar) foi uma POC e **também será migrado** para o app migrado. (É o M7 do `ROADMAP.md`; aqui só registra que ele não pode ficar quebrado sem dono — o planner decide se ele acompanha a Etapa 0 ou fica para o M7.)
- **D-03:** "Uma suíte só" continua: specs por funcionalidade, nunca por sistema operacional; o `if` de plataforma mora dentro do método (padrão `HomePage.ativarApp()`).

**Idioma**
- **D-04:** Os testes rodam com o aparelho **em inglês** (Device Farm e AVD) e validam o texto **como o app mostra nesse idioma**. O objetivo é validar a **funcionalidade, não o idioma**. Onde o PDF cita um texto em pt-BR, vale o equivalente que o app exibe em inglês.
- **D-05:** Decisão de 2026-09-30 (texto do erro de login) segue valendo no espírito: **vale o que o app mostra, não o que o PDF diz** — agora no idioma do device (inglês).

**Plataformas e CI**
- **D-06:** **Android e iOS juntos.** Antes de implementar, capturar os elementos do iOS numa sessão de Remote Access (o Marcio se ofereceu para abrir a sessão); depois os testes são aplicados nas duas plataformas simultaneamente. As capturas iOS do M5 (2026-09-11) estão incompletas: sem login, sem PDP.
- **D-07:** Os cenários entram no **CI (Device Farm) a cada etapa**: uma etapa só fecha verde no AVD (rodado pelo Marcio) **e** no Device Farm.

**Contas e massa de dados**
- **D-08:** Contas: **reusar as contas por device que o CI já usa** (as mesmas variáveis: `CLIENT_USERS_EMAILS` no Android, `CLIENT_USER` por run no iOS, `CLIENT_USER`/`CLIENT_PASSWORD` local). Elas já existem no app migrado. Servem para login e para os cenários de "e-mail já cadastrado"/"CPF já cadastrado".
- **D-09:** **Cupons: pendentes.** Os 6 cenários de cupom ficam como skip nomeado até o Marcio definir de onde vêm os códigos. Nenhum código inventado.
- **D-10:** **Estoque e frete grátis: pendentes.** Os 2 de estoque e os 3 da barra de frete ficam como skip nomeado. A origem da massa vai para `06-PENDENCIAS.md` para o Marcio decidir.
- **D-11:** **Criar Conta: gerar por execução.** CPF válido calculado pelo algoritmo; e-mail no formato **`informatica.mrn+{textogerado}@gmail.com`** (caixa real — o Marcio ainda vai passar a regra do `{textogerado}`). O cadastro de sucesso cria conta de verdade a cada execução (aceito). — **Reversibility:** one-way — cada execução cria uma conta real no backend, que não é apagada pelo teste.

**Exclusões**
- **D-12:** Etapa 7 (pt-BR, 5 cenários) **fora do planejamento** — talvez faça sentido no futuro.
- **D-13:** **Nenhum teste da Seção DEV** (2 cenários fora).
- **D-14:** Falha de conectividade em Meus Dados **fora**: não dá para automatizar sem tornar o teste flaky.

### Claude's Discretion
- Estrutura interna dos specs por funcionalidade, nome dos arquivos de spec e como organizar o skip nomeado dos pendentes — desde que o motivo do pendente apareça no relatório.
- Como os page objects atuais absorvem os testIDs (seletores novos no lugar dos antigos), respeitando D-01 e D-03.

### Deferred Ideas (OUT OF SCOPE)
- Validação de idioma pt-BR (Etapa 7) — futuro.
- Acesso automatizado à caixa do Gmail (recuperação de senha completa) — avaliar trade-off de segurança antes (`06-PENDENCIAS.md`).
- Seção DEV e falha de conectividade — fora, sem previsão.
</user_constraints>

<phase_requirements>
## Phase Requirements

Nenhum ID de requisito foi mapeado para esta fase (`phase_req_ids` nulo). O escopo é a lista de cenários da seção 3 do PDF, filtrada pelo CONTEXT.md (93 em escopo, 82 agora, 11 skips nomeados). O planner deve usar os IDs de cenário definidos na seção "Inventário dos 101 cenários" (ONB-01, LOG-05, MOC-12…) como chave de rastreabilidade — são IDs desta pesquisa, **não** requisitos do `REQUIREMENTS.md`.
</phase_requirements>

## Summary

O PDF foi lido por inteiro (extraído com `pdftotext`; o `Read` de PDF do harness não funciona aqui porque falta `pdftoppm`). A seção 3 tem **101 cenários em 15 funcionalidades** — bate com ROADMAP/CONTEXT (17+17+16+7+22+17+5). A única divergência é uma frase do próprio PDF, a "Nota de cobertura" do fim (p. 29), que diz "78 cenários Gherkin funcionais, organizados em 12 funcionalidades"; está desatualizada em relação à seção 3 e não muda nada do plano. Os números do CONTEXT conferem: 101 − 8 excluídos = 93; 93 − 11 pendentes = **82 implementáveis** (E1 17, E2 17, E3 5, E4 7, E5 22, E6 14).

Três achados mudam o desenho e precisam de decisão do Marcio **antes** dos planos de implementação: (1) **nenhuma captura do app migrado está em inglês** — as capturas `-en` de `captures-2026-09-29-m6e1/` têm sufixo enganoso: o conteúdo, o launcher ("Início", "Ter., 29 de set.") e os diálogos do sistema ("Permitir que o app Aramis acesse…") estão em pt-BR, ou seja, o AVD estava em pt-BR; não se sabe se o app 1.20.10 acompanha o idioma do aparelho (D-04 presume que sim). (2) **O custo de tempo por device inviabiliza "onboarding + login em cada `it`"**: o `afterTest` do `wdio.conf.ts` limpa o app depois de cada teste e grava um vídeo por teste; com 82 cenários isso estoura o polling de 120 min do workflow, o timeout padrão do job do Device Farm e o volume de anexos do Allure. É preciso uma política de sessão por spec e de vídeo, o que exige mexer no `wdio.conf.ts` (aprovação). (3) **Telas nunca capturadas bloqueiam etapas inteiras**: Criar Conta (22 cenários), Configurações (4), modal de Gênero, folhas de Cor/Matéria-prima e "Limpar filtros", busca sem resultado, mensagens de CEP, caminho "novo endereço" — no Android; e praticamente tudo logado no iOS. A captura vem antes da implementação de cada etapa (regra do `CLAUDE.md`: o Marcio navega, o agente captura e para).

Vários cenários do PDF **descrevem comportamento diferente do que o app já mostrou** (voltar na Política sai do app; "−" desabilitado com quantidade 1 não existe, é uma lixeira habilitada; Mochila vazia não tem "continuar comprando" nem "finalizar" desabilitado). Pela regra D-05 vale o que o app mostra, mas aqui a diferença é de **comportamento**, não de texto — o planner não deve decidir sozinho entre "asserir o PDF (teste vermelho documenta bug)" e "asserir o app"; está em Open Questions.

**Primary recommendation:** Etapa 0 entrega (a) utilitários compartilhados (`step()`/rótulos Allure/skip nomeado extraídos da spec, tabela única de textos, gerador de CPF/e-mail, política de sessão), (b) ajustes do `BasePage`/page objects para o app migrado validados pela **POC migrada** como teste de fumaça (resolve D-02), e (c) uma sessão de captura (EN no Android + iOS completo) como checkpoint humano — só depois as etapas 1..6, uma por plano, cada uma fechando com `tsc`, run no AVD pelo Marcio e run no Device Farm nas duas plataformas.

## Project Constraints (from CLAUDE.md)

Diretivas acionáveis do `./CLAUDE.md` e das regras que ele importa (`REQUIREMENTS.md`, skills do projeto). Tratar com a autoridade de decisão travada:

- **Não inventar requisito, fase ou decisão** que não esteja em `.planning/`; se não está escrito, dizer "não está escrito". Antes de editar: dizer quais arquivos de código vai abrir.
- **Nunca declarar `appium` no `package.json`** (run-22). **Toda mudança de dependência exige run real do Device Farm antes do merge** (o host é Node 18; `npm install` roda lá). **Nunca `npm audit fix --force`.** → esta fase **não deve adicionar dependência alguma** (CPF, datas e skip são código próprio/nativo; ver Don't Hand-Roll).
- **Não subir execução no AVD sem pedido explícito do Marcio** (`npm run wdio:android` é dele). Agentes nunca rodam `adb`, sessão Appium ou `wdio`; capturas só quando o Marcio avisa que a tela está pronta (procedimento do `CLAUDE.md`: captura e **para**; sempre fechar a conexão ao final).
- **Uma suíte só, duas plataformas**: nunca spec/classe/arquivo de page object por SO; `if (process.env.PLATFORM === 'ios')` dentro do método (`HomePage.ativarApp()` é o padrão).
- **Coordenada só como fração da janela** (`tapProporcional`) e só nos dois pontos do onboarding iOS; nenhuma dependência de nome de produto fixo nem de coordenada de tela nos testes.
- **Todo passo é precedido do fechamento do banner do Insider**; **falha explícita no passo certo**; **toda ação valida o estado seguinte** (não o retorno do comando); cada device aparece separado no Allure com a conta visível.
- **Seletor só com evidência** (rect×print, dois estados, clique antes/depois); sem isso é "não verificado" — por isso o rótulo de verificação em cada seletor abaixo.
- **Escopo (skill `planejar-mudanca`, feedback do Marcio):** "arruma X = mexe só em X"; problema numa plataforma = zero linhas na outra; **`wdio.conf.ts`, `testspec*.yml`, workflow e `package.json` são "mudança grande" — exigem plano mostrado e confirmação antes**; plano no formato "como funciona hoje × como vai funcionar".
- **Nunca commitar/push/PR/branch** (o Marcio versiona; memória do projeto). `commit_docs: false` no `config.json`.
- **Entregar o escopo completo ou declarar a lacuna** (memória do projeto): registrar no plano os 11 pendentes e os 8 excluídos com o D-xx, não sumir com eles.
- Ao concluir iniciativa: atualizar `STATE.md` e marcar o marco no `ROADMAP.md`; não duplicar conteúdo entre `.planning/`, `CLAUDE.md` e `README.md`.
- CLI do GitHub é bloqueado por hook; log de Actions só chega pelo Marcio (`!`). Sem `jq` no Git Bash local.

## Architectural Responsibility Map

Camadas deste projeto (não é app web): o "tier" aqui é a camada do harness de teste.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Especificação de cada caso (Gherkin → `it`) | `test/specs/*.spec.ts` | — | specs só orquestram; nenhum seletor em spec (skill `mobile-page-objects`) |
| Seletores, textos do app, validação do estado seguinte | `test/pageobjects/*Page.ts` | `test/utils/textos.ts` (novo) | D-01/D-03: seletor mora no método; texto do app numa tabela única para trocar em um lugar |
| Onboarding, banner, scroll, voltar, espera de tela estável | `BasePage` | — | já concentra essas peças; reaproveitar |
| Conta por device, massa gerada (CPF, e-mail, datas) | `test/utils/*` | `.env` / secrets / testspec | `credentials.ts` já resolve conta; geradores são funções puras no repo |
| Rótulos Allure por device, skip nomeado, `step()` | `test/utils/` (extrair da spec) | `wdio.conf.ts` (só reporter) | hoje `step()`/`historyId` vivem dentro de `test.spec.ts`; com N specs viram helper compartilhado |
| Política de sessão, vídeo, limpeza do app | `wdio.conf.ts` (hooks) | `test/utils/sessao.ts` (flag) | os hooks `beforeTest/afterTest` decidem hoje por teste, sem exceção |
| Seleção de specs por etapa, timeouts do run | workflow + `testspec*.yml` | `wdio.conf.ts` `specs` | `npm run wdio` roda `./test/specs/**/*.ts` inteiro; não há filtro |
| Dados de conta que o backend guarda (favoritos, mochila, endereço, canais) | Backend do app (fora do repo) | limpeza no teste | o teste só pode guardar/limpar o estado por UI |

## Standard Stack

### Core (já instalado — **nenhum pacote novo**)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@wdio/cli` / `@wdio/local-runner` / `@wdio/mocha-framework` | 9.31.5 | runner | [VERIFIED: node_modules/@wdio/cli/package.json:3, @wdio/mocha-framework/package.json:3] |
| `mocha` (transitivo) | 10.8.2 | `describe/it`, `this.skip()` | [VERIFIED: node_modules/mocha/package.json] |
| `@wdio/allure-reporter` | 9.31.4 | steps, labels, anexos | [VERIFIED: node_modules/@wdio/allure-reporter/package.json:3] |
| `allure-js-commons` | 3.11.1 | `Status` | [VERIFIED: node_modules/allure-js-commons/package.json] |
| `appium-uiautomator2-driver` (local) / host DF | `^6.3.0` (6.9.3 instalado) | Android | [CITED: CLAUDE.md "Registro de dependências"] |
| Node | 22.18.0 local / **18 no host DF** | runtime | [VERIFIED: `node --version` nesta sessão; CLAUDE.md para o host] |

### Supporting (código próprio, sem dependência)
| Módulo novo (proposto) | Purpose | When to Use |
|---------|---------|-------------|
| `test/utils/cpf.ts` | gerar/validar CPF por algoritmo (D-11) | Etapa 5 |
| `test/utils/conta-nova.ts` | e-mail `informatica.mrn+{textogerado}@gmail.com` (regra do `{textogerado}` isolada numa função) | Etapa 5 |
| `test/utils/datas.ts` | nascimento "hoje − 18 anos", "17 anos e 364 dias", futura, 30/02/2000 | Etapa 5 e 6 |
| `test/utils/textos.ts` | tabela única dos textos do app (D-04/D-05) | Todas |
| `test/utils/allure-helpers.ts` | `step()`, `rotularTeste(codigo)`, `pendente(...)` | Etapa 0 |
| `test/utils/sessao.ts` | flag "manter sessão entre testes" lida pelo `afterTest` | Etapa 0 (se aprovado) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gerador de CPF próprio | pacote npm de CPF | **proibido na prática**: qualquer `package.json` novo exige run real no DF; o algoritmo são 6 linhas e foi conferido nesta sessão (ver Code Examples) |
| `it.skip` com motivo no título | `this.skip()` dentro do `it` + `addDescription` | `it.skip` custa zero no device; `this.skip()` roda `beforeTest`/`afterTest` (vídeo + `clearApp`) por teste pulado |
| `node:test` para checar helpers puros | framework de teste unitário | Node 22.18 importa `.ts` direto e `node:test` é nativo [VERIFIED: executado nesta sessão]; sem dependência |

**Installation:** nenhuma. (`npm install` está fora do escopo da fase.)

**Version verification:** versões lidas dos `package.json` dentro de `node_modules` (acima). Não houve consulta ao registro npm porque nenhum pacote é recomendado.

## Package Legitimacy Audit

Nenhum pacote externo é recomendado ou instalado por esta fase. `gsd-tools query package-legitimacy check` não foi executado (nada a verificar).

**Packages removed due to [SLOP] verdict:** none (nenhum avaliado)
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
  workflow_dispatch / pull_request  (.github/workflows/mobile_test.yml)
        │  baixa build EAS (scripts/install-apk.mjs)  ← qual build? ver Open Question 8
        ▼
  ZIP do repo (sem node_modules) ──► Device Farm
        │
        ├── Android: 1 run, pool de 6 Samsung, N jobs em paralelo
        │     testspec.yml: appium 2 do host → npm install → .env(CLIENT_PASSWORD, CLIENT_USERS_EMAILS) → `npm run wdio`
        └── iOS: 1 run POR iPhone (5), testspec-ios.yml com CLIENT_USER injetado → `npm run wdio`
                                   │
                                   ▼   (por device)
   wdio.conf.ts  specs: ['./test/specs/**/*.ts']   ← 1 sessão Appium POR ARQUIVO de spec (maxInstances 1)
        │  before: pause 10s │ beforeTest: grava vídeo │ afterTest: anexa vídeo + clearApp
        ▼
   test/specs/NN-<funcionalidade>.spec.ts     describe(feature) → it('[COD-NN] título do PDF')
        │  step() Allure ─ fechaBanner() antes de cada passo ─ rotularTeste(COD)
        ▼
   test/pageobjects/<Tela>Page.ts  (herda BasePage; if PLATFORM==='ios' dentro do método)
        │  textos ← test/utils/textos.ts ; conta ← credentials.ts ; massa ← cpf/conta-nova/datas
        ▼
   Appium (UiAutomator2 | XCUITest) ──► app migrado com testID
        │
        ▼
   allure-results/ + ctrf/ → Customer Artifacts → publish-report (GitHub Pages, 1 relatório por plataforma)
```

### Recommended Project Structure
```
test/
├── specs/
│   ├── 00-poc-favoritar.spec.ts          # POC migrada (D-02) = teste de fumaça da base
│   ├── 01-onboarding.spec.ts             # ONB-01..07  (sessão limpa a cada it)
│   ├── 02-login.spec.ts                  # LOG-01..07
│   ├── 03-logout.spec.ts                 # OUT-01..03
│   ├── 04-busca.spec.ts / 05-filtros.spec.ts / 06-pdp.spec.ts
│   ├── 07-mochila.spec.ts                # 5 agora + 11 it.skip nomeados
│   ├── 08-checkout-endereco.spec.ts
│   ├── 09-criar-conta-etapa1.spec.ts / 10-criar-conta-etapa2.spec.ts
│   ├── 11-meus-dados.spec.ts / 12-configuracoes.spec.ts / 13-estados-vazios.spec.ts
├── pageobjects/   (existentes + OnboardingPage, EsqueciSenhaPage, CriarContaPage, BuscaPage,
│                   FiltrosPage, PdpPage, MochilaPage, EnderecoPage, MeusDadosPage, ConfiguracoesPage,
│                   MeusPedidosPage — uma por família de tela, nunca por SO)
└── utils/         (credentials, device-index, device-name + allure-helpers, textos, cpf, conta-nova, datas, sessao)
```
Prefixo numérico: o glob do WDIO é alfabético; a ordem importa porque cada arquivo é uma sessão.

### Pattern 1: especificação por funcionalidade, código do cenário estável
**What:** um `describe` por funcionalidade do PDF; um `it` por cenário com título `[COD-NN] <título exato do PDF>`; `historyId = COD::<device>` (não depende do título, que pode ser reescrito sem quebrar o Trend).
**When to use:** todos os 82 + os 11 skips.

### Pattern 2: asserção por estado, não por texto, quando o cenário permite
`enabled` do `pressable`/`size-button`, presença de testID, contagem de nós. O texto em inglês do app **nunca foi capturado**; cada asserção por texto passa por `textos.ts` e fica bloqueada até haver captura (ver "Idioma").

### Pattern 3: política de sessão por spec (proposta — exige aprovação do Marcio)
Spec de **logado** faz onboarding+login uma vez no `before`; cada `it` começa chamando um helper que volta à Home (`tab-home`) e valida; limpeza do app só no fim do arquivo. Specs de **onboarding** e **criar conta** precisam de app limpo por `it` (comportamento atual do `afterTest`). Detalhes e números em "CI".

### Anti-Patterns to Avoid
- **Onboarding + login dentro de cada `it` de 82 cenários:** ~2 min × 82 por device (estimativa, A2) ≈ 2,7 h só de preparo — estoura o polling (120 min) e o teto padrão do job.
- **Texto pt-BR do PDF como seletor:** o próprio PDF cita "Continue" (inglês) onde o app 1.20.10 mostra "Continuar"; use o id `accept-button`.
- **`id=pressable` / `menu-card` / `menu-list-button` / `action-button` / `button-collapsible-card` sem `desc`:** ids repetidos (`TESTIDS.md`); sempre combinar com `description`/posição por bounds.
- **Tocar o coração (`action-button`) em Busca/Filtros/PDP "só para olhar":** favoritos persistem por conta (STATE.md); um toque suja a conta do device.
- **Assertar "estoque disponível" ou "cor do botão" pela UI:** a árvore não expõe estoque nem cor (ver PDP-05, MD-04).
- **Duplicar spec/arquivo por plataforma** (D-03, REQUIREMENTS).

## Inventário dos 101 cenários (item 1)

Contagem **verificada** por extração do texto da seção 3 (`pdftotext`, `Cenário:` por `Funcionalidade:`) [VERIFIED: PDF §3, executado nesta sessão]: Onboarding 7, PDP 7, Mochila 16, Checkout 7, Criar Conta E1 15, Criar Conta E2 7, Login 7, Meus Dados 9, Configurações 4, Logout 3, Seção DEV 2, Busca 3, Filtros 7, pt-BR 5, Estados vazios 2 = **101 / 15 funcionalidades**.

Legenda de situação: **A** = implementar agora (82) · **P** = pendente de massa, skip nomeado (11) · **E** = excluído (8). Os títulos abaixo são os do PDF, na ordem do PDF.

**Etapa 1 — Acesso (17: A 17)**

| ID | Título (PDF §3) | Sit. |
|---|---|---|
| ONB-01 | Avançar pelo onboarding concedendo permissões de notificação e localização | A |
| ONB-02 | Avançar pelo onboarding negando permissão de notificações | A |
| ONB-03 | Avançar pelo onboarding negando permissão de localização | A |
| ONB-04 | Avançar pelo onboarding negando ambas as permissões de notificações e localização | A |
| ONB-05 | Concluir o onboarding e acessar a Home ao tocar em Continue na Política de Privacidade | A |
| ONB-06 | Retornar à tela final do onboarding ao pressionar Voltar na Política de Privacidade | A (diverge do app, ver divergências; sem equivalente iOS) |
| ONB-07 | Ausência de navegação circular entre a tela final do onboarding e a Política de Privacidade | A |
| LOG-01 | Botão de entrar desabilitado com e-mail e senha em branco | A |
| LOG-02 | Botão de entrar desabilitado com e-mail válido mas senha em branco | A |
| LOG-03 | Botão de entrar desabilitado com senha preenchida mas e-mail em formato inválido | A |
| LOG-04 | Botão de entrar habilitado com e-mail válido e senha preenchida | A |
| LOG-05 | Credenciais incorretas exibem mensagem genérica sem indicar qual campo está errado | A |
| LOG-06 | Login bem-sucedido retorna o usuário à tela de origem com os itens da Mochila preservados | A (depende de PDP/Mochila; implementar junto com MOC-06) |
| LOG-07 | Acessar a tela de recuperação de senha a partir do link Esqueci minha senha | A |
| OUT-01 | Sistema solicita confirmação antes de efetuar o logout | A |
| OUT-02 | Cancelar logout mantém o usuário autenticado | A |
| OUT-03 | Confirmar logout encerra a sessão do usuário | A |

**Etapa 2 — Catálogo (17: A 17)**

| ID | Título (PDF §3) | Sit. |
|---|---|---|
| BUS-01 | Busca por palavra-chave retorna lista de resultados com informações completas | A |
| BUS-02 | Ordenação padrão dos resultados de busca é Relevância antes de qualquer filtro | A |
| BUS-03 | Busca sem resultados exibe mensagem de estado vazio | A |
| FIL-01 | Filtros de tipos diferentes combinam por interseção | A |
| FIL-02 | Valores do mesmo tipo de filtro combinam por união | A |
| FIL-03 | Filtros de tipos diferentes com múltiplos valores no mesmo tipo combinam interseção entre tipos e união dentro do tipo | A |
| FIL-04 | Contador do botão de aplicar atualiza a cada seleção de filtro | A |
| FIL-05 | Botão Limpar filtros restaura o estado padrão sem filtros ativos | A |
| FIL-06 | Filtros aplicados são mantidos ao retornar de uma PDP para a listagem | A |
| FIL-07 | Combinação de filtros sem resultados exibe mensagem com opção de limpar filtros | A |
| PDP-01 | Visualizar a PDP com todos os elementos obrigatórios | A |
| PDP-02 | Botão de adicionar à mochila desabilitado antes da seleção de tamanho | A |
| PDP-03 | Botão de adicionar à mochila habilitado após seleção de tamanho | A |
| PDP-04 | Adicionar produto à mochila e verificar a tela de confirmação | A |
| PDP-05 | Seção de venda cruzada exibe apenas produtos com estoque, excluindo o item adicionado | A (estoque não observável, ver divergências) |
| PDP-06 | Acessar a PDP de um produto da venda cruzada | A |
| PDP-07 | Navegar entre abas após adicionar produto à mochila sem travamentos | A |

**Etapa 3 — Mochila (16: A 5, P 11)**

| ID | Título (PDF §3) | Sit. |
|---|---|---|
| MOC-01 | Botão de diminuir quantidade desabilitado quando quantidade do item é 1 | A (diverge do app) |
| MOC-02 | Aumentar a quantidade de um item até o limite de estoque disponível | **P** — estoque (D-10; PENDENCIAS §2) |
| MOC-03 | Tentar adicionar quantidade acima do estoque disponível exibe mensagem de limite | **P** — estoque (D-10; PENDENCIAS §2) |
| MOC-04 | Remover um item da mochila e verificar o recálculo do total | A |
| MOC-05 | Mochila vazia exibe estado vazio e botão para continuar comprando com botão finalizar desabilitado | A (diverge do app) |
| MOC-06 | Visitante não logado é redirecionado ao Login ao finalizar compra e retorna com itens preservados | A |
| MOC-07 | Itens da mochila são preservados após o logout | A |
| MOC-08 | Barra de frete grátis indica valor faltante quando subtotal está abaixo do mínimo | **P** — frete grátis (D-10; PENDENCIAS §3) |
| MOC-09 | Barra de frete grátis exibe mensagem de frete grátis ao atingir o valor mínimo | **P** — frete grátis (D-10) |
| MOC-10 | Barra de frete grátis volta ao estado incompleto ao reduzir itens abaixo do mínimo | **P** — frete grátis (D-10) |
| MOC-11 | Aplicar cupom válido aplica desconto e recalcula o total | **P** — cupom válido A (D-09; PENDENCIAS §1) |
| MOC-12 | Aplicar cupom com código inexistente exibe mensagem de erro e mantém total inalterado | **P** — D-09 (o próprio PENDENCIAS §1 diz que **não depende de massa**: o teste gera o código; pode ser liberado sozinho — decisão do Marcio) |
| MOC-13 | Aplicar cupom expirado exibe mensagem de erro e mantém total inalterado | **P** — cupom expirado (D-09) |
| MOC-14 | Aplicar cupom que não atende às condições da compra exibe mensagem de erro | **P** — cupom com condição conhecida (D-09) |
| MOC-15 | Novo cupom válido substitui o cupom anteriormente aplicado | **P** — cupons válidos A e B (D-09) |
| MOC-16 | Remover cupom aplicado restaura o total sem desconto | **P** — cupom válido A (D-09) |

**Etapa 4 — Checkout (7: A 7)**

| ID | Título (PDF §3) | Sit. |
|---|---|---|
| CHK-01 | Preencher CEP válido com autopreenchimento dos campos de endereço | A |
| CHK-02 | Interagir com o campo Número imediatamente após o autopreenchimento do CEP sem interrupções | A |
| CHK-03 | Inserir CEP incompleto exibe mensagem de CEP inválido | A |
| CHK-04 | Inserir CEP com 8 dígitos inexistente exibe mensagem de CEP não encontrado | A |
| CHK-05 | Botão de salvar endereço desabilitado sem o campo Número preenchido | A |
| CHK-06 | Campo Complemento é opcional e não impede o salvamento do endereço | A |
| CHK-07 | Botão de salvar endereço habilitado com todos os campos obrigatórios preenchidos | A |

**Etapa 5 — Criar Conta (22: A 22)**

| ID | Título (PDF §3) | Sit. |
|---|---|---|
| CC1-01 | Avançar para a etapa 2 do cadastro após preenchimento válido de todos os campos da etapa 1 | A |
| CC1-02 | Tentar avançar na etapa 1 com todos os campos vazios exibe mensagens de campo obrigatório | A |
| CC1-03 | Validação em tempo real de e-mail com formato inválido ao sair do campo | A |
| CC1-04 | E-mail com formato válido não exibe mensagem de erro ao sair do campo | A |
| CC1-05 | CPF com dígitos verificadores inválidos exibe mensagem de CPF inválido | A |
| CC1-06 | CPF com sequência de dígitos repetidos exibe mensagem de CPF inválido | A |
| CC1-07 | CPF já cadastrado exibe diálogo com opções de OK e Fazer login ao concluir o cadastro | A (precisa de CPF existente, ver §7) |
| CC1-08 | Data de nascimento futura exibe mensagem de data inválida | A |
| CC1-09 | Data de nascimento inexistente exibe mensagem de data inválida | A |
| CC1-10 | Data de nascimento de usuário com menos de 18 anos exibe mensagem de restrição de idade | A |
| CC1-11 | Data de nascimento de usuário com exatamente 18 anos completos é aceita | A |
| CC1-12 | Telefone com 9 dígitos exibe mensagem de formato inválido | A |
| CC1-13 | Telefone com 10 dígitos é aceito | A |
| CC1-14 | Telefone com 11 dígitos é aceito | A |
| CC1-15 | Telefone com 12 dígitos exibe mensagem de formato inválido | A |
| CC2-01 | Senha com 7 caracteres mantém botão Concluir cadastro desabilitado e exibe mensagem de senha curta | A |
| CC2-02 | Senha com 8 caracteres e confirmação idêntica habilita botão Concluir cadastro | A |
| CC2-03 | Confirmação de senha diferente da senha exibe mensagem e mantém botão desabilitado | A |
| CC2-04 | Senha curta e confirmação diferente exibem ambas as mensagens de erro e mantêm botão desabilitado | A |
| CC2-05 | Concluir cadastro com e-mail já cadastrado exibe diálogo com opções de OK e Fazer login | A |
| CC2-06 | Validação de unicidade do e-mail não ocorre ao sair do campo na etapa 1 | A |
| CC2-07 | Cadastro concluído com sucesso autentica o usuário e exibe o nome no Menu | A (**one-way**, D-11) |

**Etapa 6 — Menu (17: A 14, E 3)**

| ID | Título (PDF §3) | Sit. |
|---|---|---|
| MD-01 | Campos E-mail e CPF são exibidos como somente leitura em Meus Dados | A |
| MD-02 | Dados do cadastro são exibidos corretamente na tela de Meus Dados | A (precisa de dados da conta, §7) |
| MD-03 | Botão Salvar alterações permanece desabilitado sem modificação em nenhum campo | A |
| MD-04 | Botão Salvar alterações é habilitado ao modificar qualquer campo editável | A |
| MD-05 | Salvar dados válidos com sucesso mantém o usuário na tela de Meus Dados sem mensagem de confirmação | A (**altera a conta**) |
| MD-06 | Tentar salvar data de nascimento inválida exibe mensagem de erro e impede a gravação | A |
| MD-07 | Tentar salvar telefone com 9 dígitos em Meus Dados exibe mensagem de erro e impede a gravação | A |
| MD-08 | Falha de conectividade ao salvar exibe mensagem de erro e mantém os valores digitados | **E** — D-14 |
| MD-09 | Selecionar gênero pelo modal de seleção única fecha o modal e exibe o valor escolhido | A |
| CFG-01 | Todos os canais de comunicação estão habilitados por padrão na tela de Configurações | A |
| CFG-02 | Desabilitar individualmente o canal WhatsApp | A (**altera a conta**, restaurar) |
| CFG-03 | Reabilitar canal de comunicação previamente desabilitado | A (**altera a conta**, restaurar) |
| CFG-04 | Opção Excluir conta informa que os dados serão apagados em até 14 dias | A (**nunca confirmar a exclusão**) |
| DEV-01 | Seção DEV com Painel de controle não é exibida em builds de produção | **E** — D-13 |
| DEV-02 | Seção DEV com Painel de controle é exibida em builds internas de desenvolvimento | **E** — D-13 |
| VZ-01 | Tela Meus Pedidos exibe estado vazio com vitrine de recomendados quando não há pedidos | A |
| VZ-02 | Tela de Favoritos exibe estado vazio quando não há produtos favoritados | A |

**Etapa 7 — pt-BR (5: E 5, todos D-12):** PTBR-01 "Conteúdo textual do app é exibido em português do Brasil independentemente do idioma do dispositivo" · PTBR-02 "Tela de Filtros exibe todos os elementos em português do Brasil" · PTBR-03 "Tela de Criar Conta exibe todos os rótulos em português do Brasil" · PTBR-04 "Tela da Mochila exibe todos os elementos em português do Brasil" · PTBR-05 "Confirmação de adição à mochila exibe botões e título da venda cruzada em português do Brasil".

**Totais conferidos:** A = 17+17+5+7+22+14 = **82** · P = **11** (MOC-02, 03, 08, 09, 10, 11, 12, 13, 14, 15, 16) · E = **8** (PTBR×5 D-12, DEV×2 D-13, MD-08 D-14) · 82+11+8 = 101. Subtotais por etapa batem com `ROADMAP.md` e `06-CONTEXT.md` (Etapa 6 = 9−1 + 4 + 2 = 14 ✓).

Observação para o `01-PLAN` conversion: o `06-PLAN.md` lista a Etapa 6 como 17 e a Etapa 7 como 5; o CONTEXT (posterior) reduz para 14 e remove a 7. A conversão para planos GSD deve seguir os números do CONTEXT.

## Mapa cenário → tela → elementos (item 2)

**Rótulos de verificação** (regra do projeto: seletor tirado só de draft/dump = "não verificado"):
- **P (parcial)** — dump em dois estados distintos, lidos nesta sessão (ex.: `enabled` muda). Ainda **não** clicado por WDIO.
- **NV (não verificado)** — um dump/draft só.
- **L (lacuna)** — tela/estado nunca capturado; bloqueia a implementação.

**Nenhum seletor do app migrado foi exercitado por WDIO** (a suíte nunca rodou nele; STATE.md); portanto até o primeiro run da Etapa 0, tudo é no máximo "P". Fontes: `A09` = `captures-2026-09-29/` (build 492), `M6` = `captures-2026-09-29-m6e1/` (build 493 — mostra `Version: 1.20.10 Build: 493` em `30-menu-logado-rolado-pt.xml`), drafts `NN` = `drafts/app-migrado/android/NN-*.md`, `iOS11` = `ios/captures-2026-09-11/NOTAS.md` (build 1.20.0/314).

### Evidência verbatim usada nos exemplos (lida nesta sessão)

| Valor | Origem (nó verbatim) |
|---|---|
| `id=com.android.permissioncontroller:id/permission_allow_foreground_only_button` text="Durante o uso do app" | M6 `02-permissao-1-en.xml` (localização) |
| `…/permission_deny_button` text="Não permitir" (1ª vez) · `…/permission_deny_and_dont_ask_again_button` text="Não permitir" (2ª vez) | M6 `02-…xml` e `05-politica-topo-en.xml` |
| `…/permission_allow_button` text="Permitir" · `…/permission_allow_one_time_button` text="Apenas esta vez" | M6 `03-apos-negar-local-en.xml`; `02-…xml` |
| `id=permission-topic` ×4; `id=accept-button desc="Continuar"` | M6 `04-topicos-apos-negar-ambas-en.xml` |
| `id=accept-button desc="Li e concordo"` (Política, só após rolar) | M6 `11-politica-fim-en.xml` |
| `id=tab-home desc="Home"`, `tab-categories desc="Categorias"`, `tab-bag desc="Mochila"`, `tab-menu desc="Menu"` | M6 `13-home-en.xml` |
| `id=pressable desc="Fazer login"` **enabled="false"** (vazio, e-mail sem senha, e-mail sem arroba) e **enabled="true"** (ambos preenchidos) | M6 `15`/`16`/`18`/`17-login-…-pt.xml` (grep de atributo) |
| `TextView text="email inválido"` sob o campo, e-mail `qa.testeexemplo.com` | M6 `18-login-email-sem-arroba-pt.xml` |
| modal: `ViewGroup desc="Login"`, `TextView text="E-mail ou senha incorretos."`, `ViewGroup desc="OK"` | M6 `26-modal-cred-erradas-pt.xml` |
| Esqueci: `TextView text="Esqueceu sua senha"`, `text="Informe seu e-mail e enviaremos um link para você redefinir sua senha."`, `EditText text="E-mail"`, `pressable desc="Enviar link"` enabled="false" | M6 `24-esqueci-senha-pt.xml` |
| `id=size-button desc="Adicionar ao carrinho - R$ 799,90"` enabled="false" → "true" após escolher G | A09 `22-apos-comprar.xml` / `23-sheet-tamanho-g.xml` |
| `id=pressable desc="Salvar alterações"` enabled="false" (Meus dados, sem edição) | A09 `46-meus-dados.xml` |
| `id=pressable desc="Salvar informações e prosseguir"` enabled="false" (29 vazio e 32 quase completo) | A09 `29`/`32` |
| `id=pressable desc="Continuar"` enabled="false" (Entrega, nenhuma opção) | A09 `33-checkout-pos-endereco.xml` |
| `id=remove-button` enabled="true" com quantidade 1 (ícone lixeira); `id=add-button` enabled="true"; `id=gift-button desc="Finalizar compra (1) • R$ 799,90"` | A09 `25-mochila.xml` |
| diálogo logout: `com.aramis.ecomm:id/alert_title` "Logout", `android:id/message` "Você deseja sair da sua conta?", `android:id/button2` "CANCELAR", `android:id/button1` "SAIR" | draft 28 (A09 `50-dialogo-logout.xml`; os dumps M6 `31`/`32` **não** contêm o diálogo — outra janela, e há banner do Insider por cima) |

### Etapa 1 — Acesso

| Cenários | Telas | Elementos e testIDs | Sem testID / fallback | Lacunas bloqueantes | Texto? |
|---|---|---|---|---|---|
| ONB-01..04 | Boas-vindas → [diálogos do sistema] → Tópicos → Política → Termos → Home | Boas-vindas: container `desc="Boas-Vindas!, Seu estilo, sua escolha."` clicável (NV); diálogos: ids `permissioncontroller` acima (P — 1ª vs 2ª vez muda o id de negar); Tópicos: `permission-topic`×4 + `accept-button` (NV); Política/Termos: `accept-button` só após ~30 swipes (draft 04); Home: `editorial-home-root`, `tab-*` (NV) | CTA "Toque para começar" **sem nó** (clique no container clicável é inferido, não verificado — draft 01); iOS: coordenada por fração (exceção do REQUIREMENTS) | **Local:** `autoGrantPermissions: true` (wdio.conf.ts:83) impede os diálogos de aparecerem no AVD — "negar" só roda no AVD com isso desligado; **iOS DF:** `autoAcceptAlerts: true` (wdio.conf.ts:35/70) pode aceitar o alerta de notificação antes do teste; ordem dos diálogos difere do PDF (Android: localização, depois notificação — M6 02/03) | `permission-topic` por contagem; títulos só se assertar texto |
| ONB-05, ONB-07 | Home | `editorial-home-root` + 4 `tab-*`; ausência de `accept-button`/`permission-topic` e de "Voltar" na Home (NV) | "banner promocional" = `editorial-group-0`, sem id próprio | — | ids bastam |
| ONB-06 | Política | Back do Android (`driver.back()`) | — | **App sai para o launcher** (M6 `07→08→09`: o print `08` é o launcher; a reabertura `09` volta a Boas-vindas); iOS sem botão Voltar de hardware | — |
| LOG-01..04 | Menu deslogado → Login | `pressable desc="Fazer login"` com `enabled` (**P**, 4 estados M6 15–18/17); campos: 1º/2º `EditText` (`className("android.widget.EditText").instance(0/1)`, NV, placeholder some ao preencher); e-mail inválido mostra `text="email inválido"` sob o campo | acesso ao Login: `desc="Cadastre-se ou, Faça o login"` sem id (fallback do `ELEMENTOS-SEM-TESTID.md`: "posição: clicável antes do 1º `menu-card`"); olho da senha sem id | iOS: Sign in `name=="pressable" AND label=="Sign in"` enabled false/true (iOS11 12/14, inglês) — fluxo logado nunca capturado | desc do botão é texto ("Fazer login"/"Sign in"); usar `id=pressable`+posição/`desc` por `textos.ts` |
| LOG-05 | Login + modal | modal sem testID: `desc="Login"`, texto da mensagem, `desc="OK"`; iOS: nó único sem filhos, OK só por coordenada (iOS11 achado 3) | usar conta fictícia (não bloquear conta real por tentativas) | texto em inglês no Android **desconhecido** (iOS 1.20.0: "Incorrect username and/or password") | **sim** — D-05 |
| LOG-06 | Mochila deslogada → Login → retorno | ver MOC-06 | — | **Mochila de visitante nunca capturada** (Android 09-29 e iOS sempre logados/deslogados sem item); tela após login no checkout não capturada | — |
| LOG-07 | Esqueci minha senha | link `TextView text="Esqueci minha senha"` (não clicável no dump; sem id) → tela "Esqueceu sua senha" | link por texto/posição (abaixo do 2º `EditText`); campo e-mail `EditText` único da tela | iOS: tela nunca capturada ("Forgot my password" só como link) | **sim** (4 textos) |
| OUT-01..03 | Menu logado (rolado) | `menu-list-button desc="Sair"` (precisa rolar; lista virtualizada — draft 24); diálogo nativo ids acima (P p/ ids do sistema); pós-logout `desc="Faça o login"` | — | iOS: **o app antigo não tinha diálogo** (PerfilPage.confirmarLogout, iOS retorna cedo); no migrado nunca capturado logado | título "Logout" (não traduzido) + mensagem pt |

### Etapa 2 — Catálogo

| Cenários | Telas | Elementos e testIDs | Sem testID / fallback | Lacunas bloqueantes |
|---|---|---|---|---|
| BUS-01..02 | Busca → resultado | entrada `id=search` (Home, NV); campo sem id (`EditText`); resultado: `id=product-list`, `id=filter-button desc="Filtro e ordenação"`, contagem `TextView "N produtos"` (sem id), 3 botões de grade sem id, `action-button` por card, card com `desc="nome, R$ preço"`; Ordenar: `button-open-facet desc="Relevância"` no modal (draft 22) | termo digitado/confirmado: **"como a busca foi submetida não está em NOTAS"** (draft 21) | confirmar busca (Enter) não documentado; busca com "camiseta" do PDF (a captura usou "camisa") |
| BUS-03 | Busca sem resultado | — | — | **L**: estado vazio da busca nunca capturado (id/texto) |
| FIL-01..04 | Filtros | `id=filter-modal`; `button-open-facet desc="Selecione Cor"` / `"Selecione Matéria Prima"`; `button-filter desc="Ver N produtos"` (contador); `toggle-button` (faixa de preço, `desc` com contagem) | seleção de cor/matéria-prima e **estado selecionado** (sem atributo na árvore) | **L**: folhas de Cor e Matéria-prima nunca capturadas; contador só legível por `desc` |
| FIL-05, FIL-07 | Filtros / listagem | — | — | **L**: botão "Limpar filtros" e mensagem "Nenhum produto encontrado" nunca capturados (o dump do modal só cobre a viewport até "Modelo veste") |
| FIL-06 | Resultado → PDP → voltar | card (desc) → PDP; voltar sem id (`desc` = título) | — | prova de "filtro ainda ativo": proxy por contagem `N produtos` |
| PDP-01 | PDP | `price`, `pagination-indicator` (aparece 2×), `action-icon-button`/`bag-icon-button` (mochila), `pressable-image-header` (coração, **função inferida do print**), `button-icon-share` (draft 12); "Comprar" sem id | "Comprar" por `text("Comprar")` (propagação do toque ao pai é inferida) | iOS: PDP **nunca aberta** (iOS11: 2 taps por coordenada não navegaram; `name ==` deu 0 matches por `\xa0` no preço) |
| PDP-02..03 | Sheet de tamanho | `size-button` `enabled` false→true (**P**, A09 22/23); tamanhos por `desc` P/M/G/GG/XGG(/XXG) sem id; **disponibilidade só no print** | escolher tamanho por tentativa: tocar e esperar `size-button.enabled` (um tamanho indisponível abre "Veja itens similares disponíveis" — draft 12) | — |
| PDP-04..06 | Sheet "Produto adicionado" | `remove-button`/`add-button`, quantidade `TextView` sem id, `pressable desc="Ver mochila"`/`"Continuar comprando"`, 3 sugestões por `desc` (draft 14) | título do sheet só por texto | iOS não capturado |
| PDP-07 | Continuar comprando → Voltar → tab Menu | `tab-menu`; "sem ANR" = nenhum diálogo de sistema "não está respondendo" | id do diálogo ANR **não está escrito** | — |

### Etapa 3 — Mochila (5 agora)

| Cenários | Elementos e testIDs | Divergência/lacuna |
|---|---|---|
| MOC-01 | `remove-button`, `add-button`, quantidade `TextView` sem id (draft 15) | com quantidade 1 o botão é **lixeira habilitada** (`enabled="true"`, A09 25), não "−" desabilitado; o estado com quantidade ≥2 **não foi capturado** |
| MOC-04 | `wake-remove-item desc="Remover"`, `wake-summary-subtotal/-total` (valor é filho sem id), `wake-product-card-bag-<sku>` (`resourceIdMatches`) | "recalcular" exige ≥2 itens (duas PDPs); remover o último cai no estado vazio |
| MOC-05 | `status-alert-icon`, `TextView "Sua mochila está vazia"`, `pressable desc="Precisa de ajuda?"` (draft 27) | o app **não tem** "continuar comprando" nem "finalizar compra" (nem desabilitado) — sem `gift-button` no vazio |
| MOC-06 | `gift-button` (= "Finalizar compra"), login/criar conta | mochila de visitante e tela de destino nunca capturadas |
| MOC-07 | `tab-bag` com `desc="Mochila, N"` (badge) | persistência por conta **não verificada** (draft 27) |

### Etapa 4 — Checkout (7)

Campos do endereço **sem nenhum testID** (draft 16, `ELEMENTOS-SEM-TESTID.md` pede `address-<campo>-input` ao time do app — não está escrito se já foi entregue). Fallback: `EditText` por classe + `text` do placeholder só com o campo vazio (`Digite o seu CEP`, `Digite a rua`, `Município`, `Número`, `Bairro`, `Digite um complemento`, `Digite o nome do destinatário`) ou por ordem 0..6. `Salvar` = `pressable desc="Salvar informações e prosseguir"` (`enabled="false"` em 29 e em 32). **Lacunas:** (a) mensagens "CEP inválido"/"CEP não encontrado" (CHK-03/04) nunca capturadas; (b) **o que habilita "Salvar" é desconhecido** — em 32 só faltava o Destinatário e o botão ficou desabilitado, o PDF (CHK-07) não cita Destinatário entre os obrigatórios; (c) a conta de teste **já tem endereço salvo** (Av. Paulista, 1000 — draft 16), então o formulário vazio não aparece de novo: o caminho "+ Adicionar ou escolher outro endereço" → novo endereço no app migrado não foi capturado; (d) **CEP válido/inexistente não estão em `06-PENDENCIAS.md`** (só cupom, estoque, frete, Gmail, dados da conta); a única evidência de CEP válido é `01310100` (A09 30; o `Draft.ts` antigo usa `04347090`); nenhum CEP inexistente foi testado.

### Etapa 5 — Criar Conta (22): **toda a tela é L**

Nenhuma das telas de Criar Conta (etapas 1 e 2, diálogos "CPF já cadastrado"/"E-mail já cadastrado", mensagens de validação) foi capturada em nenhuma plataforma. Só se sabe que o link existe no Login (`TextView "Criar conta"`, sem id). Bloqueia as 22. Massa: tudo calculável por código (datas, telefones de 9/10/11/12 dígitos, senhas de 7/8) exceto "CPF existente" (CC1-07) e a regra do `{textogerado}` (D-11).

### Etapa 6 — Menu (14)

| Cenários | Elementos | Lacunas |
|---|---|---|
| MD-01, 03, 04 | `profile-email-input`, `profile-document-input` (`clickable="false"` — leitura-somente é **inferido**); `pressable desc="Salvar alterações"` `enabled="false"` sem edição (P parcial: só um estado); demais campos sem id (`EditText` por ordem: 0 Nome, 1 Sobrenome, 2 e-mail, 3 nascimento, 4 telefone, 5 CPF — draft 25) | estado **habilitado** após editar nunca capturado; "cinza/preto" é cor (não observável) |
| MD-02 | idem | exige os valores esperados da conta (PENDENCIAS §5) |
| MD-05..07 | campos acima | mensagens de erro de data/telefone nunca capturadas; MD-05 **grava na conta** |
| MD-09 | `ViewGroup desc="Selecione"` (Gênero) | **L**: modal "Selecione um item" e opções nunca capturados |
| CFG-01..04 | `menu-list-button desc="Configurações"` | **L**: tela de Configurações inteira (canais, estados, "Excluir conta") nunca capturada |
| VZ-01 | `status-alert-icon`, `status-alert-button desc="Navegar por produtos"`, `TextView "Comece por aqui"` (draft 26) | precisa de conta sem pedidos |
| VZ-02 | `header-favorites` + `status-alert-icon` (+ texto) (draft 20) | precisa de conta sem favoritos (conta suja) |

## Idioma (item 3)

**Fato central (verificado):** os arquivos de `captures-2026-09-29-m6e1/` com sufixo `-en` **não estão em inglês**. Evidências: print `04-topicos…-en.png` ("Fique por dentro de tudo!", botão "Continuar"), print `02-permissao-1-en.png` (diálogo do sistema "Permitir que o app Aramis acesse a localização deste dispositivo?" — texto do `permissioncontroller`, que segue o idioma do **aparelho**), dump `08-politica-back-en.xml` (launcher com `desc="Início"`, `desc="Pesquisar"`, data "Ter., 29 de set."), e `captures-2026-09-30/00-estado-inicial.xml` (`desc="Sinal Wi-Fi cheio."`, "Qua., 30 de set."). Conclusão: **o AVD estava em pt-BR em 29 e 30/09**; o sufixo `-en` é rótulo do capturador (o brief desta pesquisa chamou-as de "onboarding in EN" — não procede).

**O que isso significa para D-04:**
- Android 1.20.8 (22/09, `captures-2026-09-22/NOTAS.md`) estava em inglês ("Continue", "Sign in", "Register or, login", "My Data…") — idioma do AVD naquele dia **não está registrado** (os dumps de 22/09 não trazem janelas de sistema).
- iOS 1.20.0 (11/09) estava em inglês **misturado** com pt-BR: abas `tab-categories` label "Categorias" e `tab-bag` "Mochila", modal "Atenção — Você precisa fazer login…" em pt-BR, enquanto o resto era inglês (iOS11 11, 26, 32).
- Android 1.20.10 (29–30/09): tudo pt-BR, exceto o título do diálogo de logout ("Logout") e `Version:`.
- **Não está escrito** se o 1.20.10 acompanha o idioma do aparelho ou se passou a ser pt-BR fixo (o cenário PTBR-01 do PDF afirma pt-BR "independentemente do idioma do dispositivo" — se for assim, D-04 não produz inglês nenhum). **Pré-requisito da Etapa 0:** uma captura com o AVD em inglês no build atual, nas duas plataformas (Open Question 1).

**Textos já conhecidos em inglês** (todos do iOS 1.20.0, `iOS11`, tag `[CITED]`; **não** valem para o 1.20.10 Android): "Register or login", "My Data / Update your information", "My Orders / Track your orders", "Favorites / Manage your interests", "Notifications / See everything, all the time", "User center", "Returns and Exchanges", "Help and Feedback", "Help Center", "Rate the app", "Terms and Conditions", "Privacy policies", "Sign in", "Forgot my password", "Don't have an account? Create account", "Incorrect username and/or password" (modal "Login", botão "OK"), "Continue", "I have read and agree", "Filter and sort".

**Textos em pt-BR conhecidos** (Android 1.20.10): os do bloco de evidência acima + "Menu conta", "Meus dados", "Meus pedidos", "Favoritos", "Notificações", "Central do usuário", "Ajustes e conta", "Configurações", "Sair", "Painel de controle", "Minha Mochila", "Sua mochila está vazia", "Você ainda não tem produtos favoritados!", "Comece por aqui", "Navegar por produtos", "Produto adicionado à mochila", "Leve também:", "Ver mochila", "Continuar comprando", "Filtro e ordenação", "Relevância", "Selecione Cor", "Selecione Matéria Prima", "Ver N produtos", "Entrega e frete", "Cupom de desconto", "Salvar informações e prosseguir", "Salvar alterações".

**Cenários que localizam ou assertam por texto visível** (precisam do equivalente em inglês capturado — **desconhecido** para todos): ONB-01 (títulos dos tópicos; evitável via `permission-topic`), LOG-05, LOG-07, OUT-01 (título/mensagem do diálogo), BUS-02 ("Relevância"), BUS-03, FIL-07, PDP-04 (labels de "Ver mochila"/"Continuar comprando" — são `desc` de `pressable`), MOC-05, CHK-03, CHK-04, CC1-02/03/05/06/08/09/10/12/15 (todas as mensagens de validação), CC1-07, CC2-01/03/04/05 (mensagens e diálogos), MD-06, MD-07, MD-09 (opções do modal), CFG-04 ("14 dias"), VZ-01, VZ-02. **Estratégia:** `test/utils/textos.ts` com uma única chave por texto; valor `undefined` + erro nomeado "texto em inglês não capturado: <chave>" até a captura — o teste **não** inventa o texto (CLAUDE.md). Para o que o cenário permite, assertar por estado (`enabled`, presença do nó de erro, contagem) e usar o texto só como segunda evidência.

## Código existente (item 4)

**Reaproveitável como está:** `BasePage.waitForElement`, `clickIfPresent`, `clickFirstPresent`, `fechaBanner` (Android: `insiderLayout` + `accessibility id:Close`; iOS: WebView `Insider WebView Content`) — o banner da raspadinha continua o mesmo nos dumps M6 `30`–`32` (`wrap-close-button-… desc="Close"`); `aguardarTelaEstavel`, `tapProporcional`, `scrollFinger`/`scrollUntilVisible`/`forceScrollBeforeSearching`, `permissaoLocalizacaoIOS` (usa `mobile: alert`), `rolaAteVisivelIOS`, `voltarIOS` (critério `tab-menu`), `credentials.ts`, `device-name.ts`/`device-index.ts`, `confirmarLogout` Android (`id:android:id/button1`), o padrão `step()` + `closeBannerIfPresent`.

**Precisa mudar para o app migrado (D-01 substitui os seletores do app antigo):**

| Onde | Hoje (app antigo) | No app migrado |
|---|---|---|
| `BasePage.continua()` (`:239`) | `accessibility id:Continue` | `id:accept-button` (desc agora "Continuar") |
| `BasePage.termo1()/termos2()` (`:243-265`) | `I have read and agree`, `forceScrollBeforeSearching(6)` + `scrollUntilVisible` (14) = **20 swipes** | `accept-button` só aparece após ~30 swipes (draft 04) → com 20 o método **pula em silêncio** ("⏭️ termo1 pulado") e o erro aflora depois |
| `BasePage.ativaGps()` (`:227`) | `permission_allow_one_time_button` ("Apenas esta vez") | ONB-01 exige "Durante o uso do app" = `permission_allow_foreground_only_button` |
| `BasePage.negaNotificacao()` | `permission_deny_button` | na 2ª solicitação o id vira `permission_deny_and_dont_ask_again_button` |
| `BasePage.iniciaApp()` (`:223`) | `className("android.view.View").instance(0)` | CTA é o container clicável `ViewGroup desc="Boas-Vindas!…"`; o seletor antigo **não está verificado** no app novo |
| `HomePage.abrirPerfil/abrirCategorias` | `accessibility id:Menu|Perfil`, `accessibility id:Categorias` | usar `id:tab-menu`, `id:tab-categories` (resource-id independe de idioma) |
| `LoginPage.logar()` Android (`:9-12`) | `text("login")`, `text("Email")`, `text("Password")`, `accessibility id:Sign in`, 1 toque | `desc="Cadastre-se ou, Faça o login"`, `EditText` instance 0/1, `pressable`+desc "Fazer login", **2 toques com teclado aberto** (1º só fecha o teclado — draft 08) |
| `PerfilPage` | `Favorites, Manage your interests`, `Logout` | `menu-card` + `descriptionStartsWith("Favoritos")`, `menu-list-button` + desc "Sair" |
| `CategoriasPage.clickRoupas/abrirCamisas` | `accessibility id:Roupas|Camisas` | `category-button`/`sub-categories-button` + `desc` (mesmo texto; idioma EN desconhecido) |
| `FavoritosPage` | texto "You don't have any favorite products yet!" | pt-BR/EN via `textos.ts`; estado vazio por `status-alert-icon` + ausência de `flatlist-favorites` |
| `CategoriasPage.voltar()` Android | `com.horcrux.svg.PathView instance(0)` | Voltar do cabeçalho sem id; `desc` = título da tela (varia) |

Métodos mortos já listados no `CONCERNS.md` (`selecionarMangaCurta`, `selecionarProduto`, `selecionarTipo`, `adicionarItemFavoritos`, `negaNotificacao` comentado) — não limpar nesta fase (escopo).

**Page objects novos** (um por família de tela, métodos em português, `if` de plataforma dentro do método): `OnboardingPage` (granular: `abrirApp`, `tocarCta`, `tratarPermissaoLocalizacao(acao)`, `tratarPermissaoNotificacao(acao)`, `continuarTopicos`, `aceitarPolitica`, `aceitarTermos` — `HomePage.ativarApp()` passa a compor estes), `EsqueciSenhaPage`, `CriarContaPage`, `BuscaPage` (+ listagem), `FiltrosPage`, `PdpPage` (+ sheets), `MochilaPage`, `EnderecoPage`, `MeusDadosPage`, `ConfiguracoesPage`, `MeusPedidosPage`; `PerfilPage` ganha `abrirMeusDados/Configuracoes/MeusPedidos`.

**POC (`test.spec.ts`, D-02):** ela chama 17 steps que dependem de todos os seletores acima; no instante em que a Etapa 0 troca os page objects (D-01) ela quebra. **Recomendação:** migrar a POC **na Etapa 0**, como `00-poc-favoritar.spec.ts` (ou mantendo o nome), porque ela é o único teste que exercita onboarding→login→categorias→listagem→favoritar→favoritos→logout de ponta a ponta no app migrado — ou seja, é o teste de fumaça que valida a base antes das 8 etapas. Isso absorve o essencial do M7 do ROADMAP; marcar o M7 como "absorvido pela fase 6" é decisão do Marcio (não está escrito). Se a POC ficar para o M7, ela precisa ser marcada `it.skip` com motivo no mesmo commit da Etapa 0, para não ficar vermelha sem dono.

## iOS — checklist para a sessão de Remote Access (item 5)

Regras que valem (CLAUDE.md/STATE.md): **o Marcio navega e avisa; o agente só conecta e captura (`getPageSource()` UMA vez por tela + `takeScreenshot()`) e para**; sessão dura 20–30 min e a URL pré-assinada **não renova**; capturar primeiro, documentar depois; **sempre `deleteSession` ao final**; abrir com `bundleId` costuma resetar o app. Build iOS atual do M5 é 1.20.0/314 — **confirmar a versão** a instalar (o Android está em 1.20.10). Conta: a do `.env`/CI; **login recusado em 11/09** porque a conta não existia no app migrado — conferir antes de gastar a sessão que as contas por device existem (D-08 afirma que sim; não verificado em iOS). Dividir em 2–3 sessões; ordem sugerida por dependência:

**Sessão A — acesso (deslogado → logado)**
1. Alerta de notificação (SpringBoard) — `mobile: alert` `getButtons`; Boas-vindas; alerta ATT (botões); alerta de localização (`getButtons`: Allow While Using App / Allow Once / Don't Allow); Tópicos com `accept-button`; Política (topo e fim); Termos; Home. *(ONB-01..05, 07)*
2. **Negar**: estado seguinte após "Don't Allow" (notificação, localização e ambas) — só dá para observar em instalação limpa (uma tentativa por combinação). *(ONB-02..04)* Registrar o efeito de `autoAcceptAlerts`.
3. Menu deslogado; Login: vazio, só e-mail, e-mail sem arroba (há "email inválido" inline?), ambos preenchidos; modal de erro (OK por coordenada); **"Forgot my password"** (tela, texto, campo, botão `enabled`); link "Create account". *(LOG, LOG-07)*
4. **Login bem-sucedido**; Menu logado (cabeçalho do nome, rolado até "Settings"/"Logout"); **logout: existe diálogo?** (tela, ids, botões CANCEL/…); pós-logout. *(OUT-01..03, CC2-07)*

**Sessão B — catálogo**
5. Home logada → Categorias → Roupas → Camisas/Camisetas (já há iOS11 26–29 deslogado) → **abrir a PDP** (método que funcione: `name CONTAINS` + comparar rect, ver iOS11 "Achado — abrir a PDP") → PDP topo e rolada, tamanhos, sheet "Comprar" (botão desabilitado/habilitado), sheet "Produto adicionado" (sugestões, "Ver mochila"/"Continuar comprando"). *(PDP-01..07)*
6. Mochila com 1 item e com ≥2 (controles de quantidade: lixeira vs "−"), remover, vazia, **Mochila de visitante** + Finalizar compra → tela de Login/Criar conta e retorno. *(MOC-01,04,05,06,07; LOG-06)*
7. Busca: vazia, resultado, **sem resultado**; Filtros: modal, folha de Cor, folha de Matéria-prima, contador "View N products", **Clear filters**, combinação sem resultado ("No products found"). *(BUS, FIL)*

**Sessão C — conta**
8. Checkout: endereço (vazio, CEP válido com autopreenchimento, CEP incompleto, CEP inexistente, Número vazio, completo — estado do "Save"), "escolher outro endereço" → novo endereço; Entrega. *(CHK-01..07)*
9. **Criar conta** etapa 1 (vazia, cada mensagem de erro, datas, telefones), etapa 2 (senhas), diálogos "CPF/E-mail já cadastrado", sucesso (cria conta real — D-11). *(CC1, CC2)*
10. Menu logado: Meus dados (todos os campos, gênero + modal, "Save" habilitado/desabilitado, mensagens de erro), Configurações (canais; **não confirmar "Excluir conta"**), Meus pedidos vazio, Favoritos vazio e com item, Notificações. *(MD, CFG, VZ)*

O Android precisa de uma **levantamento de lacunas** equivalente via AVD (o Marcio navega, o `mobile-ui-inspector` captura), **com o AVD em inglês**: Criar Conta, Configurações, modal de Gênero, folhas de Cor/Matéria-prima, "Limpar filtros", "Nenhum produto encontrado", busca vazia, CEP (mensagens e caminho "novo endereço"), Mochila com quantidade ≥2 e de visitante, estados habilitados de Meus Dados/Salvar, diálogo de logout (nos dumps M6 não aparece), e a repetição das telas de texto crítico em inglês.

## CI — Device Farm por etapa (item 6)

**Como as specs entram hoje** `[VERIFIED: leitura de arquivos]`: `wdio.conf.ts:148` `specs: ['./test/specs/**/*.ts']`; `testspec.yml:60` e `testspec-ios.yml:90` rodam `npm run wdio` (sem `--spec`); o workflow (`mobile_test.yml`) dispara em `workflow_dispatch` **e em `pull_request`**, sobe o ZIP do repo inteiro (menos `node_modules`) e agenda: Android = **1 run** no pool de 6 aparelhos (`--device-pool-arn`), iOS = **1 run por iPhone** (5), com `--device-selection-configuration` por ARN. **Não existe filtro de spec**: todo spec novo em `test/specs/` roda em **todos** os aparelhos a cada run. O `--spec` do WDIO existe (comentário em `test.spec.ts:11`: `npx wdio run ./wdio.conf.js --spec ./test/specs/test.spec.ts`).

**Como cada etapa entraria no CI (D-07)** — duas opções, ambas mudam workflow/testspec (mudança grande, aprovação + run real):
- (A) **tudo roda sempre** (cumulativo): nenhuma mudança de CI, mas o tempo cresce a cada etapa.
- (B) **filtro por etapa**: input opcional `specs` no `workflow_dispatch` → `environmentVariables` (Android herda o ambiente do agente) / linha injetada no testspec iOS (o host iOS **não recebe** `environmentVariables`, STATE.md) → `npm run wdio -- --spec "$SPECS"`; `pull_request` sem input = suíte inteira. Recomendado: **B**, porque D-07 é "etapa fecha verde" — isolar a etapa mantém o run curto e o diagnóstico claro.

**Timeouts relevantes**
- `mochaOpts.timeout: 900000` (15 min **por teste**) — folga de sobra por `it`.
- Workflow aguarda no máximo **120 × 60 s = 120 min** nos dois jobs (Android linhas 175-186; iOS idem). `schedule-run` **não define** `executionConfiguration`/`jobTimeoutMinutes`. A doc oficial descreve `jobTimeoutMinutes` ("The number of minutes a test run executes before it times out") mas **não informa o padrão**; o valor de 150 min vem de um resultado de busca sem fonte oficial — `[ASSUMED]`, tratar como "o padrão do job é da ordem de 2,5 h" e **medir**.
- `before` fixo de 10 s **por arquivo de spec** (cada arquivo = nova sessão Appium + reinstalação do app: `appium:noReset: false`, `noIncrementalInstall: true`).
- Vídeo: `maxDurationSec: 600` (Android DF) e `timeLimit: 180` (iOS e AVD) — num teste iOS/AVD que passe de 3 min o vídeo é cortado (o teste não falha).

**Estimativa de tempo por device** (`[ASSUMED]` — derivada de constantes do código; **medir no run da Etapa 1** e recalibrar): onboarding Android completo ≈ 1,5–2,5 min (~30 swipes de ~1,3 s só na Política + Termos + `timewhait` 3 s após cada clique); login ≈ 20–40 s; sessão nova (instalar app + Appium + `before` 10 s) ≈ 1–1,5 min.

| Estratégia | Conta | Veredito |
|---|---|---|
| Onboarding + login em **cada** `it` (como a POC) | 82 × (~2,5 min preparo + ~1 min corpo) ≈ **4,8 h/device** | inviável (120 min de polling; teto do job) |
| Sessão **por spec** (onboarding+login 1× no `before`; `it` volta à Home) | ~13 arquivos × (~1,25 + ~2,5 min) ≈ 50 min + 82 × ~1 min ≈ **~2,2 h/device** acumulado; **≤ 40 min por etapa** se filtrar por etapa (B) | viável **se** B e sessão-por-spec |
| Híbrido: `it` com app limpo só onde o cenário exige (ONB, CC) e sessão logada no resto | ≈ a linha anterior + ~7 × 2 min de onboarding | recomendado |

**Todas as etapas rodam em todos os devices?** Android sim (mesmo ZIP, 6 contas por modelo). iOS: um run por aparelho com a **conta própria injetada**; cada run reexecuta tudo — 5× o custo de sessões. Cenários que **alteram a conta** (MD-05, CFG-02/03, CHK-06, CC2-07) rodam em cada aparelho com **sua** conta, então não colidem entre aparelhos; colidem **entre runs do mesmo aparelho** (ver §7). Cenários com `it` por plataforma não aplicável (ONB-06 no iOS) precisam de skip **por plataforma com motivo** dentro do teste.

**Efeito no relatório/artefatos:** `afterTest` anexa **um vídeo por teste**. Hoje são 1 vídeo × 11 devices; com 82 testes seriam ~902 vídeos por run completo (cada `.mp4` 720p; arquivos > 100 MB são apagados no publish — `CONCERNS.md`; o iOS já estourou o heap do `allure generate` com 1,16 GB de anexos no run #26 — `wdio.conf.ts:169-177`). Recomendação para a Etapa 0 (**exige aprovação, `wdio.conf.ts`**): anexar vídeo **só quando o teste falha** (`afterTest(_test, _ctx, result)` tem `result.passed` — `[VERIFIED: node_modules/@wdio/types/build/Frameworks.d.ts:31-39]`) ou um vídeo por spec; e medir o tamanho dos anexos com o laço `content-range` do `CLAUDE.md`.

**Outros pontos de CI a decidir (Open Questions):** (i) o workflow baixa "o último EAS build" por `BUILD_*` secrets — **não está escrito** se esses secrets já apontam para o build migrado; (ii) variáveis novas por device (CPF etc.) no Android têm teto de **256 caracteres por variável** (credentials.ts) → CSV; no iOS entram pelo marcador do testspec; (iii) qualquer mudança em `wdio.conf.ts`, `testspec*.yml` ou workflow exige run real no DF (TESTING.md).

## Estado de conta e massa de dados (item 7)

Princípio já em vigor (STATE.md): favoritos persistem **por conta no backend**; "conta suja" tem erro nomeado. Cada etapa precisa de **guarda no começo** (estado esperado) e **limpeza no fim, mesmo em falha** (`try/finally`, padrão `limparFavoritoOrfao`).

| Etapa | Estado que o teste muda | Guarda no início | Limpeza |
|---|---|---|---|
| 1 Acesso | sessão (token local); `clearApp` zera | — | `afterTest`/`clearApp` (já existe) |
| 2 Catálogo | **mochila** (PDP-04/06/07 adicionam item); favoritos **só se** alguém tocar o coração (não tocar) | `tab-bag` `desc` sem contagem ("Mochila", não "Mochila, N") | remover itens por `wake-remove-item` até o vazio (confirmar por `tab-bag` perder o badge — draft 27) |
| 3 Mochila | itens, quantidade, remoção | idem | idem; falha deixa item órfão → anexo Allure "Mochila órfã na conta" (análogo ao favorito órfão) |
| 4 Checkout | **endereços acumulam** (CHK-06 salva de verdade); a conta de teste **já tem** endereço (Av. Paulista, 1000) | contar endereços/qual formulário abre | **não está escrito** se há como excluir endereço no app migrado; decidir se CHK-06 roda e como limpar |
| 5 Criar conta | **cria conta real** a cada execução (D-11, one-way); fica autenticado | e-mail/CPF únicos por execução e por device | nenhuma (aceito); logout via `clearApp` |
| 6 Menu | MD-05 grava telefone; CFG-02/03 mudam canais; MD-09 muda gênero (não salvo) | ler valor original antes e comparar | restaurar valor original em `finally`; falha deixa canal desabilitado e quebra CFG-01 no run seguinte ("conta suja" de Configurações) |

**D-11 (one-way):** `informatica.mrn+{textogerado}@gmail.com` — todos os aliases caem na mesma caixa; a regra do `{textogerado}` **ainda vem do Marcio**, então o gerador fica numa função só (`gerarEmailNovo()`), com unicidade por execução **e por device** (os 11 devices podem criar contas no mesmo segundo: incluir rótulo do device + `Date.now()` + aleatório). Nenhum cenário lê a caixa (CONTEXT, specifics).

**CPF sem dependência:** algoritmo módulo 11 em ~6 linhas, conferido nesta sessão (ver Code Examples). Rejeitar os 10 CPFs de dígitos repetidos (CC1-06 usa `111.111.111-11` como caso inválido). CPF **inválido** para CC1-05: trocar o último dígito verificador do CPF gerado.

**CPF existente (CC1-07) e dados cadastrais (MD-02) — PENDENCIAS §5, ainda sem decisão.** Hoje `.env`/secrets só têm e-mail e senha. Opções para o Marcio:
1. Secrets novos por device (CPF, nome, nascimento, telefone) — Android: CSV; limite de 256 caracteres por variável (6 CPFs de 11 dígitos = 71 chars cabem; 6 conjuntos cadastrais completos provavelmente não); iOS: via testspec.
2. **Sem secrets, usando D-11:** CC2-07 cria uma conta cujos CPF/nome/telefone o teste **conhece**; CC1-07 reutiliza o CPF dessa conta (com e-mail novo) e MD-02 lê Meus Dados dessa conta. Custo: dependência de ordem entre testes (se o cadastro falha, os dois dependentes caem) e MD-02 deixa de usar a conta por device. Não está decidido — o planner deve apresentar as duas.
3. MD-02 enfraquecido para "campos preenchidos e no formato" (não confere valor) — só como último recurso.

**Login com credencial errada (LOG-05):** usar e-mail fictício gerado, **não** a conta real do device com senha errada — evita bloqueio/limite de tentativas no backend por repetição em 11 aparelhos (risco, não verificado).

## Mocha / WDIO / Allure (item 8)

**Skip nomeado — como o motivo chega ao relatório** (`[VERIFIED: node_modules/@wdio/allure-reporter/build/index.js:1189,1693-1712]`; comportamento visual no Allure **não observado**):
- `onTestSkip` (usado por `it.skip`) inicia um teste com `test.title` como nome e encerra com `SKIPPED/PENDING`; **não há `statusDetails` nem descrição** — nenhum motivo automático. O que aparece é o **título**.
- `this.skip()` dentro do `it` (função normal, não arrow) também termina `SKIPPED`, mas o teste já iniciou, então `allure.addDescription(...)`/`addTag(...)` antes do `this.skip()` anexam metadado — ao custo de rodar `beforeTest` (começa vídeo) e `afterTest` (para vídeo + `clearApp`) para um teste que não faz nada.
- **Recomendação:** `it.skip('[PENDENTE — cupom válido A, D-09] [MOC-11] Aplicar cupom válido…', …)`: zero custo no device, motivo no título (aparece no Allure e no `spec` reporter), e o prefixo `[PENDENTE — …]` permite filtrar. Se o Marcio quiser o motivo também como descrição, usar o helper `pendente()` do Code Examples (`this.skip()` + `addDescription`) e aceitar o custo de ~11 sessões de vídeo/limpeza. **Verificar no primeiro run** (Wave 0) que o título aparece no relatório publicado.

**`historyId` por device para N specs:** `addTestCaseId`/`addHistoryId` com `COD::<device>` (ex.: `LOG-05::Samsung Galaxy S24 Ultra`) — hoje isso vive dentro de `test.spec.ts` (`:99-106`). Com 13 arquivos e 82 testes precisa virar `rotularTeste(codigo)` em `test/utils/allure-helpers.ts`, chamado na primeira linha de cada `it` (como a POC faz; não mexe no `wdio.conf.ts`). `addParentSuite("<device> — <conta>")`, `addArgument('Device'|'Conta')`, `addLabel('host', device)` iguais ao da POC. Chave estável por código, não por título (renomear título não quebra o Trend).

**`step()` e banner:** hoje `step()` e `closeBannerIfPresent` (variável de módulo) estão **dentro** de `test.spec.ts` (`:17-31`) e `limparFavoritoOrfao` também. Extrair para `allure-helpers.ts` com `configurarFechadorDeBanner(fn)` por spec (cada arquivo roda em worker próprio, então o estado de módulo não vaza entre specs).

**Estrutura de spec por funcionalidade:** `describe('<Funcionalidade do PDF>')`, `before` (sessão, quando aplicável), `it('[COD-NN] <título exato do PDF>')`; Dado/Quando/Então do Gherkin como comentário curto + `step()` por chamada de page object (`objeto.metodo()`), como a convenção atual. `strict` + `noUnusedLocals`: usar `function (this: Mocha.Context)` quando precisar de `this.skip()`.

**Allure:** `categories.json` (escrito no `onPrepare`) classifica por regex `.*displayed.*`/`.*Timeout.*`; mensagens de erro nomeadas ("conta suja", "texto em inglês não capturado") entram em "Outras falhas" — sem mudança.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CPF válido | dependência npm | `test/utils/cpf.ts` (6 linhas, conferido) | `package.json` novo = run real no DF; algoritmo determinístico |
| Data "18 anos exatos / 17a364d / futura / inexistente" | biblioteca de datas | `Date` nativo com ano/mês/dia (cuidado com 29/02) | casos de borda do BVA são só aritmética de calendário |
| Fechar banner do Insider | seletor novo ou coordenada | `BasePage.fechaBanner()` | 5 incidentes de iOS/Android já endureceram isso |
| Esperar tela estável / validar destino | `pause` fixo | `aguardarTelaEstavel`, `waitUntil` com destino | regra do projeto: nunca confiar no retorno do comando |
| Scroll até `accept-button` | número fixo de swipes | `scrollUntilVisible` com `maxScrolls` ≥ ~40 e `isDisplayed()` | ~30 swipes medidos; número varia |
| Voltar no iOS | `driver.back()` | `voltarIOS()` (chevron/`Back` + `tab-menu`) | `back()` e borda não funcionam na listagem |
| Skip nomeado | flag própria/arquivo de pendências | `it.skip`/`this.skip()` do Mocha | nativo, aparece no relatório |
| Seleção de conta por device | nova lógica | `getCredentials()` | já resolve as 3 formas de ambiente |

**Key insight:** a base de infraestrutura (conta por device, banner, voltar, espera estável, Allure por device) já existe e foi endurecida por incidentes; o risco desta fase é trocar seletores sem verificar e inflar tempo/artefatos — não faltar framework.

## Common Pitfalls

### Pitfall 1: `autoGrantPermissions: true` no AVD esconde os diálogos
**What goes wrong:** ONB-01..04 passam "sem o diálogo" ou nem testam a permissão. **Why:** `wdio.conf.ts:83` concede tudo na sessão local; `clickIfPresent` pula em silêncio quando o diálogo não aparece. **How to avoid:** os cenários de permissão exigem asserir que o diálogo **apareceu** (erro nomeado se não) e, no AVD, `autoGrantPermissions:false` (mudança de `wdio.conf.ts`, só para esses specs ou global — decisão). No DF Android não há `autoGrantPermissions`. **Warning signs:** log "⏭️ Passo opcional pulado" no onboarding.

### Pitfall 2: iOS `autoAcceptAlerts: true` aceita o que o teste quer negar
**What goes wrong:** ONB-02/04 "negar notificações" viram "aceitar". **Why:** capability em `wdio.conf.ts:35,70`; o STATE.md registra que ela não dispensa o alerta de localização do SpringBoard, mas **não está escrito** se aceita o de notificação/ATT. **How to avoid:** capturar o comportamento na sessão iOS A; se aceitar, o cenário exige capability diferente (mudança global do iOS → run real nos 5 iPhones).

### Pitfall 3: `afterTest` limpa o app depois de cada teste
**What goes wrong:** sessão compartilhada entre `it`s é desfeita (volta ao onboarding). **Why:** `wdio.conf.ts:272-318` roda `clearApp`/`pm clear` incondicionalmente. **How to avoid:** política de sessão (flag em `test/utils/sessao.ts` lida pelo hook) — aprovada antes.

### Pitfall 4: 1º toque em "Fazer login" com teclado aberto só fecha o teclado
**How to avoid:** 2 toques, validando o estado seguinte (tab bar presente). `KEYCODE_BACK` com o teclado já fechado **sai do app** (draft 08, captura `13-relaunch`). Para os cenários LOG-01..04 (só olhar `enabled`) não tocar no botão.

### Pitfall 5: onboarding Android — scroll insuficiente
`termo1()/termos2()` fazem 20 swipes; o aceite pede ~30 (draft 04). Falha silenciosa ("pulado"). Subir o orçamento de swipes e **lançar erro nomeado** se `accept-button` não aparecer.

### Pitfall 6: banner do Insider (raspadinha) aparece a qualquer momento
Aparece ~2,5–3 s depois de tocar o coração (STATE.md) e foi visto no Menu logado em M6 `30`–`32`, escondendo o diálogo de logout do dump. Manter `fechaBanner()` antes de cada passo **e** antes de cada clique no ramo iOS.

### Pitfall 7: lista de produtos hidrata devagar (Android: 730 produtos, > 20 s)
Esperar `product-list` + card, não só o primeiro. No iOS migrado a listagem veio hidratada na 1ª captura (151 produtos) — não generalizar.

### Pitfall 8: seletores por placeholder somem ao preencher
Campos de login/endereço/busca/Meus dados: achar o campo vazio **uma vez**, guardar a referência (ou usar `EditText` por ordem), não reconsultar por `text`. No iOS os campos perdem `name`/`label` ao receber valor.

### Pitfall 9: iOS — comandos que mentem
`acceptAlert()`, `mobile: hideKeyboard`, `clearValue()` reportam sucesso sem agir; `setValue` rápido perde caracteres (`maxTypingFrequency` baixo em `digitarIOS`); o 1º tap em "Sign in" se perde; modais RN são nó único (OK só por coordenada medida no print). Reusar `LoginPage.logarIOS/digitarIOS`; para os campos de **Criar Conta** e **endereço** (muita digitação) o `digitarIOS` precisa ser generalizado — **não** copiado.

### Pitfall 11: ids repetidos
`pressable` (≥8 botões), `menu-card`, `menu-list-button`, `action-button`, `button-collapsible-card`, `toggle-button`, `checkbox`, `remove-button`/`add-button` (reaparecem em sheet e Mochila). Combinar com `description`; desc de tamanho `P/M/G…` existe na PDP **e** no sheet (dois nós): indexar pelo sheet.

### Pitfall 12: o PDF e o app divergem em comportamento
Ver tabela abaixo; não decidir sozinho.

### Pitfall 13: ações destrutivas
CFG-04 "Excluir conta": parar na informação — **nunca** tocar na confirmação (as contas por device são o ativo do CI). Idem qualquer "Finalizar compra" (`ReCAPTCHA` + pedido real; fora do escopo, M8).

### Divergências PDF × app (comportamento, não texto)

| Cenário | O que o PDF afirma | O que o app mostrou | Evidência |
|---|---|---|---|
| ONB-06 | Voltar na Política retorna ao onboarding e o app segue aberto | BACK levou ao **launcher**; relançar voltou a Boas-vindas | M6 `07→08→09` (print `08` = launcher) |
| ONB-01 | notificação, depois localização | localização, depois notificação (Android); iOS: ATT + localização + notificação | M6 `02`/`03`; iOS11 achado 4 |
| ONB-04 | Política "Continue" → Home | Política → **Termos** ("Li e concordo") → Home | M6 `11`/`12`/`13` |
| MOC-01 | "−" desabilitado com quantidade 1 | lixeira **habilitada** (`remove-button`) | A09 `25` |
| MOC-05 | botão "continuar comprando" + finalizar desabilitado | só `Precisa de ajuda?`; sem finalizar | draft 27 |
| PDP-05 | produtos com estoque | estoque **não observável** na árvore; só dá para checar "≠ item adicionado" e "≠ itens já na mochila" | draft 14 |
| MD-04 / MD-03 | botão "em preto"/"em cinza" | cor não observável; só `enabled` | A09 `46` |
| CHK-07 | habilitado com CEP, Rua, Bairro, Município, Estado e Número | com todos exceto **Destinatário** o botão ficou desabilitado | A09 `32` |
| LOG-05 | "E-mail ou senha inválidos" | "E-mail ou senha incorretos." (pt) — D-05 já resolve | M6 `26` / 06-PLAN |
| OUT (iOS) | diálogo "Logout" com CANCELAR/SAIR | app antigo iOS **não tinha diálogo**; migrado não capturado | PerfilPage.confirmarLogout |

## Code Examples

### Skip nomeado (motivo visível no relatório)
```ts
// Source: node_modules/@wdio/allure-reporter/build/index.js:1189,1693-1712 (leitura); API Mocha
// Opção recomendada — zero custo no device, motivo no título:
it.skip('[PENDENTE — cupom válido A, D-09 / PENDENCIAS §1] [MOC-11] Aplicar cupom válido aplica desconto e recalcula o total', () => {});

// Opção com descrição (custa vídeo + clearApp por teste pulado):
export function pendente(cod: string, titulo: string, motivo: string) {
    it(`[PENDENTE — ${motivo}] [${cod}] ${titulo}`, async function (this: Mocha.Context) {
        allure.addDescription(`Pendente: ${motivo}`, 'text');
        allure.addTag('pendente');
        this.skip();
    });
}
```

### CPF por algoritmo (conferido: `529.982.247-25` válido; `111.111.111-11` e `…-24` inválidos; 10.000 gerados, 10.000 válidos)
```ts
// Source: execução em scratchpad nesta sessão (node 22.18); algoritmo módulo 11 público
function dv(digs: number[]): number {
    const f = digs.length + 1;
    const s = digs.reduce((a, d, i) => a + d * (f - i), 0);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
}
export function cpfValido(c: string): boolean {
    const d = c.replace(/\D/g, '').split('').map(Number);
    if (d.length !== 11 || d.every((x) => x === d[0])) return false;
    return dv(d.slice(0, 9)) === d[9] && dv(d.slice(0, 10)) === d[10];
}
export function gerarCpf(rnd: () => number = Math.random): string {
    for (;;) {
        const b = Array.from({ length: 9 }, () => Math.floor(rnd() * 10));
        if (b.every((x) => x === b[0])) continue;
        const d1 = dv(b);
        return [...b, d1, dv([...b, d1])].join('');
    }
}
```
Nota: este arquivo **não pode** importar de forma extensionless se for checado com `node` puro (ver Validation Architecture); o validador do **app** pode rejeitar CPFs que o algoritmo aceita (lista de bloqueio própria) — **não verificado**.

### Asserção por estado (botão habilitado/desabilitado)
```ts
// Valores verbatim: id "pressable" + content-desc "Fazer login" (M6 15/17); atributo enabled (uiautomator)
const entrar = await $('-android uiautomator:new UiSelector().resourceId("pressable").description("Fazer login")');
await expect(entrar).toBeDisabled();          // 15-login-vazio-pt: enabled="false"
// ... preencher e-mail e senha ...
await expect(entrar).toBeEnabled();           // 17-login-ambos-preenchidos-pt: enabled="true"
```
(O `desc` "Fazer login" vem de `textos.ts`; em iOS o equivalente é `name == "pressable" AND label == "Sign in"` — idioma a confirmar.)

### Diálogos de permissão (ids do sistema, não dependem do idioma)
```ts
// Valores verbatim de M6 02/03/05
const P = 'com.android.permissioncontroller:id/';
await $(`id:${P}permission_allow_foreground_only_button`).click(); // "Durante o uso do app"
await $(`id:${P}permission_deny_button`).click();                  // 1ª solicitação
// 2ª solicitação do mesmo diálogo: permission_deny_and_dont_ask_again_button
```

### Cleanup condicional no `afterTest` (PROPOSTA — exige aprovação; `wdio.conf.ts`)
```ts
// Hoje (wdio.conf.ts:272-318): vídeo + clearApp incondicionais. Proposta mínima:
afterTest: async function (_test, _ctx, result) {
    const manter = (await import('./test/utils/sessao.ts')).manterSessao();   // flag do spec
    // vídeo: anexar só se !result.passed (TestResult.passed — @wdio/types Frameworks.d.ts:34)
    if (!manter) { /* clearApp como hoje */ }
}
```
O restante do hook fica igual; `after`/`afterSuite` do arquivo faz a limpeza final.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Suíte no app antigo, seletor por texto em inglês | app migrado com `testID` (resource-id no Android, `name` no iOS) | 2026-09-11 (M5) | preferir `id:`; texto só quando não há id |
| Estado "favoritado" invisível na árvore | `action-button-icon` 84x84 → 52x53 (listagem) | build 1.20.10 | guarda de conta suja no Android passa a ser possível |
| Favoritar quebrado (1.20.8) | funciona (1.20.10) | 2026-09-29 | POC migrável |

**Deprecated/outdated:** o brief e o `06-PLAN.md` falam em "onboarding em EN" para M6 e em "Etapa 7 / Seção DEV" dentro do escopo — superado pelo CONTEXT (D-04, D-12, D-13).

## Runtime State Inventory

Fase **não** é rename/migração de dados; a "migração" aqui é de seletores no código (D-01, reversível por git). O estado de runtime relevante são as contas de teste no backend — tratado em "Estado de conta e massa de dados". **Stored data:** favoritos, mochila, endereço e canais por conta (backend). **Live service config:** nenhuma configuração fora do git a renomear. **OS-registered state:** nenhum. **Secrets/env vars:** nomes existentes não mudam; variáveis **novas** só se o Marcio escolher a opção 1 de §7. **Build artifacts:** nenhum.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | O padrão de `jobTimeoutMinutes` do Device Farm é ~150 min (resultado de busca; a doc oficial não informa o padrão) | CI | planejar o teto de tempo errado; mitigação: definir `jobTimeoutMinutes` explícito e medir |
| A2 | Estimativas de tempo (onboarding 1,5–2,5 min, login 20–40 s, sessão 1–1,5 min, ~1 min por cenário) | CI | a estratégia de sessão pode ser mais ou menos urgente; medir no run da Etapa 1 |
| A3 | Hooks do `wdio.conf.ts` e a spec rodam no mesmo processo worker (flag de módulo compartilhada) | Mocha/CI | a política de sessão por flag falharia; alternativa: `process.env` ou `globalThis` |
| A4 | O app 1.20.10 acompanha o idioma do aparelho (premissa de D-04) | Idioma | todos os textos "em inglês" não existem; D-04 vira pt-BR fixo e a Etapa 7 reaparece como contrapartida |
| A5 | Tocar o container "Boas-Vindas…" (clicável) equivale ao CTA "Toque para começar" | Mapa | `iniciaApp()` novo falha; fallback: coordenada por fração (já permitida no iOS, não no Android) |
| A6 | `it.skip` com motivo no título aparece legível no Allure publicado | Mocha | motivo invisível; fallback `pendente()` com descrição |
| A7 | `profile-email-input`/`profile-document-input` são somente leitura (só `clickable=false` no dump) | Mapa | MD-01 mal assertado; confirmar tentando digitar e checando valor |
| A8 | As contas por device (D-08) existem no backend do app migrado nas duas plataformas | Contas | login falha nos devices; o login iOS foi recusado em 11/09 e o Android passou em 22/09 só para o `CLIENT_USER` |
| A9 | O CPF gerado pelo algoritmo é aceito pelo validador do app | Massa | CC1-01/13/14 não avançam; testar na captura de Criar Conta |
| A10 | `autoAcceptAlerts:true` (iOS) aceita o alerta de notificação/ATT antes do teste | Pitfall 2 | ONB-02/04 iOS mal planejados; confirmar na sessão iOS A |

## Open Questions (deferred to checkpoints DEC-A..E)

Nenhuma destas perguntas é respondida pela pesquisa nem pelo planner: cada uma vira item de um
checkpoint de decisão (`checkpoint:decision`, gate bloqueante) respondido pelo Marcio antes do
código que depende dela, com a resposta literal registrada no SUMMARY do plano. O texto das
perguntas abaixo não muda; o mapa diz onde cada uma é decidida. A DEC-F (06-13, porta sem volta
da D-11) não responde nenhuma destas perguntas.

| Pergunta | Checkpoint | Plano / tarefa | Item do checkpoint |
|---|---|---|---|
| 1 — Idioma | DEC-A (como o aparelho fica em inglês) e DEC-B (o que vai para `textos.ts`, a partir das capturas do 06-01) | 06-01 Tarefa 1; 06-02 Tarefa 1 | DEC-A (e); DEC-B (decisão única) |
| 2 — Política de sessão/vídeo e `wdio.conf.ts` | DEC-A | 06-01 Tarefa 1 | (c) |
| 3 — POC (D-02) e M7 absorvido | DEC-A | 06-01 Tarefa 1 | (b) |
| 4 — Divergências PDF × app | DEC-C (ONB-04, ONB-06); DEC-D (PDP-05, MOC-01, MOC-05); DEC-E (CHK-07, MD-03/04) | 06-04 Tarefa 1; 06-06 Tarefa 3; 06-10 Tarefa 3 | DEC-C (b), (c); DEC-D (a), (b), (c); DEC-E (c), (f) |
| 5 — CEP válido e inexistente | DEC-E | 06-10 Tarefa 3 | (a) |
| 6 — CPF existente e dados cadastrais | DEC-E | 06-10 Tarefa 3 | (d), (e) |
| 7 — `{textogerado}` | DEC-E | 06-10 Tarefa 3 | (h) |
| 8 — Build que o CI baixa e build iOS da captura | DEC-A | 06-01 Tarefa 1 | (a) |
| 9 — iOS: ONB-06, diálogo de logout, ONB-02/04 com `autoAcceptAlerts` | DEC-C | 06-04 Tarefa 1 | (d), (f), (e) |
| 10 — Mochila (persistência, visitante) e endereço (excluir, endereço salvo na conta) | DEC-D (MOC-07, visitante); DEC-E (CHK-06) | 06-06 Tarefa 3; 06-10 Tarefa 3 | DEC-D (e), (d); DEC-E (b) |
| 11 — MOC-12 | DEC-D | 06-06 Tarefa 3 | (f) |
| 12 — Tempo/custo do Device Farm | DEC-A | 06-01 Tarefa 1 | (d) — `jobTimeoutMinutes`, teto de polling e filtro de specs; o custo por minuto de device não é perguntado em nenhum checkpoint e continua não escrito |
| 13 — Build 492 × 493 e testIDs de campo | DEC-A | 06-01 Tarefa 1 | (a), subitens (a2) referência dos seletores e (a3) testIDs de `ELEMENTOS-SEM-TESTID.md` |

1. **Idioma (bloqueia a Etapa 0).** O app 1.20.10 muda de idioma com o aparelho? Todas as capturas Android recentes são pt-BR (AVD em pt-BR). *Recomendação:* o Marcio põe o AVD em inglês e navega onboarding, Login, Menu, Mochila; o agente captura; o resultado decide se `textos.ts` terá `en` ou se D-04 muda.
2. **Política de sessão/vídeo e `wdio.conf.ts`.** Aprovar: limpeza por spec em vez de por teste, vídeo só em falha, `autoGrantPermissions:false` para specs de permissão (AVD) e `autoAcceptAlerts` (iOS). *Recomendação:* aprovar o pacote mínimo na Etapa 0, com run real no DF.
3. **POC (D-02):** migrar na Etapa 0 (recomendado, é o teste de fumaça) ou `it.skip` até o M7? Marcar M7 como absorvido?
4. **Divergências PDF × app (tabela acima):** asserir o PDF (teste vermelho documenta possível bug), asserir o app, ou skip nomeado "diverge do app"? Vale ONB-06, ONB-04, MOC-01, MOC-05, PDP-05, CHK-07, MD-03/04.
5. **CEP:** confirmar `01310100` como válido e escolher um CEP inexistente de 8 dígitos (não está em `06-PENDENCIAS.md`).
6. **CPF existente e dados cadastrais** (PENDENCIAS §5): secrets por device ou reaproveitar a conta criada por CC2-07?
7. **`{textogerado}`** (regra do e-mail de cadastro) — o gerador espera por ela.
8. **Qual build o CI baixa?** Os secrets `BUILD_*` do workflow apontam para o app migrado (Android e iOS)? Qual versão iOS usar na sessão de captura?
9. **iOS:** ONB-06 não se aplica (sem Voltar de hardware) — skip por plataforma com motivo? Há diálogo de logout no migrado? ONB-02/04 viáveis com `autoAcceptAlerts`?
10. **Mochila:** o item persiste por conta (MOC-07)? Visitante pode adicionar? Há como excluir endereço (CHK-06)? Contas de device têm endereço salvo?
11. **MOC-12** (cupom inexistente, sem massa): liberar já, como o próprio PENDENCIAS §1 sugere?
12. **Tempo/custo do DF:** definir `jobTimeoutMinutes` e o teto de polling; aceitar filtro de specs por etapa (opção B)? Custo por minuto de device **não está escrito**.
13. **Build 492 × 493:** as capturas de 29/09 misturam os dois (M6 = 493); o testID de campos (login, endereço) foi pedido ao time do app (`ELEMENTOS-SEM-TESTID.md`) — já foi entregue em build posterior? Não está escrito.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node (local) | tsc, helpers, WDIO | ✓ | v22.18.0 | — |
| npm | scripts | ✓ | 11.7.0 | — |
| TypeScript (`npx tsc`) | verificação estática | ✓ | baseline limpo exceto `test/Draft.ts` | — |
| `pdftotext` | extrair o PDF (pesquisa) | ✓ (`/mingw64/bin`) | — | `pypdf` 6.14.2 |
| AVD-S24 + `adb` | runs locais, capturas Android | não sondado (proibido para esta pesquisa) | — | só o Marcio |
| AWS Device Farm / AWS CLI | CI | não sondado | — | — |
| Sessão iOS Remote Access | capturas iOS | aberta só pelo Marcio | — | — |
| Node 18 (host DF) | `npm install` e execução no host | ✓ no host (CLAUDE.md) | 18.20.8 | — |

**Missing dependencies with no fallback:** nenhuma para o planejamento. **Para a implementação:** as capturas (Android em inglês + iOS) dependem de o Marcio abrir AVD/sessão — checkpoint humano.

## Validation Architecture

> Nyquist habilitado (`workflow.nyquist_validation` ausente no `config.json` ⇒ ativo).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | WebdriverIO 9.31.5 + Mocha 10.8.2 + Appium (UiAutomator2/XCUITest); sem teste unitário no repo |
| Config file | `wdio.conf.ts` (`specs: ['./test/specs/**/*.ts']`) |
| Quick run command | `npx tsc --noEmit 2>&1 \| grep -v '^test/Draft.ts'` (vazio = OK; `Draft.ts` é rascunho gitignored com erros conhecidos) — baseline verificado limpo nesta sessão |
| Full suite command | **só o Marcio:** `npm run wdio:android` (AVD) · CI: `workflow_dispatch` (Android + iOS no Device Farm) |

### Phase Requirements → Test Map
Sem IDs de requisito; mapeamento por **cenário** (IDs desta pesquisa) → verificação:

| Escopo | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| Helpers puros (CPF, datas, e-mail novo) | valida/gera corretamente | unit sem dependência | `node --test test/utils/cpf.check.mjs` (importa `./cpf.ts`; Node 22.18 faz type stripping) | ❌ Wave 0 |
| Tipagem de specs/page objects | compila em `strict` | estático | `npx tsc --noEmit \| grep -v Draft.ts` | ✅ |
| Etapas 0–6 (82 cenários) | cada `it` passa no app migrado | E2E | **AVD: só o Marcio**; **DF: run no CI** | ❌ Wave 0 (specs novas) |
| 11 pendentes | aparecem como pulados com motivo | E2E (relatório) | conferir no Allure do primeiro run | ❌ |
| iOS ramo | mesmos `it` no iOS | E2E | run iOS no DF (Remote Access só captura) | ❌ |

### Sampling Rate
- **Por commit/tarefa (agente):** `tsc` (acima) + `git diff` restrito aos arquivos do plano + `node --test` dos helpers puros, quando existirem. O agente **nunca** roda `adb`, Appium, `wdio` ou o AVD.
- **Por etapa (humano):** (1) run no AVD-S24 pelo Marcio com os specs da etapa; (2) run no DF **nas duas plataformas** filtrado pela etapa (opção B de CI) ou completo (A); (3) conferir no log/Allure os prefixos esperados (✅/⚠/🧹) e a ausência de "⏭️ pulado" onde não deveria; (4) anexos: tamanho do `Customer Artifacts` (laço `content-range` do CLAUDE.md).
- **Phase gate:** as 6 etapas verdes nas duas plataformas, 11 skips nomeados visíveis no relatório publicado, 8 excluídos registrados, `STATE.md` e `ROADMAP.md` atualizados.

### Wave 0 Gaps
- [ ] `test/utils/allure-helpers.ts` (`step`, `rotularTeste`, `pendente`), `textos.ts`, `cpf.ts`, `conta-nova.ts`, `datas.ts`, `sessao.ts`
- [ ] verificação de uma fumaça: POC migrada passa no AVD (Marcio) e no DF Android + iOS antes das etapas
- [ ] smoke de login das contas por device no app migrado (A8) — pode ser o primeiro passo da POC
- [ ] captura Android em **inglês** + lacunas; captura iOS A/B/C (checkpoints humanos)
- [ ] confirmar no primeiro run que `it.skip` mostra o motivo no Allure (A6)
- [ ] decisões 1–4 de Open Questions antes de tocar `wdio.conf.ts`

### O que se verifica automaticamente × por checkpoint humano
- **Automático (agente):** compilação, formato dos helpers, ausência de seletor em spec, ausência de `appium` no `package.json` (`grep`), ausência de arquivo/classe por SO (`find`/`grep` de sufixo `IOS`/`Android` exposto), contagem de `it`/`it.skip` por spec = contagem do inventário (82 + 11 skips), nenhum texto do PDF hardcoded fora de `textos.ts`.
- **Checkpoint humano:** qualquer run no AVD; qualquer sessão de captura (Android/iOS); aprovação de `wdio.conf.ts`/`testspec*.yml`/workflow; decisões de massa (CEP, CPF, `{textogerado}`, cupom/estoque/frete); leitura do log de Actions (só o Marcio, `!`).

## Security Domain

> `security_enforcement` ausente no `config.json` ⇒ aplicável.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | sim (login de teste, criar conta) | credenciais só em `.env`/secrets/testspec; nunca em log (o iOS já imprime só o **comprimento**) |
| V3 Session Management | sim (logout, sessão entre testes) | `clearApp` por spec; confirmar logout por estado (`Faça o login`/tab) |
| V4 Access Control | parcial | cada device só usa **sua** conta; Meus Dados não expõe dados de outro usuário (teste não faz isso) |
| V5 Input Validation | sim (o produto valida CPF/telefone/e-mail; o teste só gera entradas) | geradores próprios e determinísticos; **não** enviar payloads maliciosos (fora de escopo — S06 do PDF é §4, não §3) |
| V6 Cryptography | não | — |
| V8 Data Protection | sim | **PII em capturas** (draft 25 e dump 46 têm CPF/telefone/nascimento): não anexar a relatório público; screenshots/vídeo do Allure vão para o GitHub Pages — evitar telas de Meus Dados com dados reais nos anexos de sucesso |

### Known Threat Patterns for esta stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Segredos (senha, e-mail) vazando no Allure/ctrf/log | Information disclosure | não logar valores; anexos de vídeo contêm tela de login (senha mascarada) — manter o comportamento atual |
| PII de conta real em screenshots publicados no GitHub Pages | Information disclosure | contas de teste dedicadas; sem anexo de tela de Meus Dados fora de falha, e então sem ela pública se possível |
| Criação de contas reais em massa (D-11) e spam na caixa `informatica.mrn@` | Tampering/DoS (de caixa) | aceito pela D-11; limitar a 1 criação por device por execução (CC2-07 só); CC1/CC2 de validação **não** concluem cadastro |
| Ação destrutiva (Excluir conta, Finalizar compra) | Tampering | nunca confirmar; guarda no page object que **não expõe** o método de confirmar |
| Bloqueio de conta por tentativas de login erradas | DoS | e-mail fictício em LOG-05 |
| Dependência maliciosa (slopsquatting) | Supply chain | nenhuma dependência nova; gerador de CPF no repo |

## Recomendação de quebra em planos

Granularidade `standard`, `parallelization: false` (config.json) ⇒ ondas sequenciais. Proposta de **9 planos** (a conversão do `06-PLAN.md` para GSD deve seguir isto; o CONTEXT, não o PLAN, vale nos números):

| Plano | Conteúdo | Cenários | Depende de | Checkpoint humano |
|---|---|---|---|---|
| 06-01 | **Etapa 0 — Base:** utilitários (`allure-helpers`, `textos`, `cpf`, `conta-nova`, `datas`, `sessao`), ajustes de `BasePage`/`HomePage`/`LoginPage`/`PerfilPage`/`CategoriasPage`/`FavoritosPage` ao app migrado, **POC migrada** como fumaça, proposta de mudança de `wdio.conf.ts` (sessão/vídeo/permissões) | 0 (+POC) | decisões 1–3 de Open Questions; captura Android EN | aprovação de `wdio.conf.ts`; run AVD + DF |
| 06-02 | **Captura (checkpoint humano):** Android lacunas em inglês + iOS sessões A/B/C; agentes `mobile-ui-inspector`/`mobile-draft-writer`; drafts em `drafts/app-migrado/<plataforma>/` | — | Marcio abre AVD/sessão | **todo o plano é humano+agente** — pode ser parcial por etapa (captura da tela X antes da etapa X) |
| 06-03 | **Etapa 1 — Acesso** (ONB, LOG sem 06, OUT) | 15 + (LOG-06 fica no 06-05) | 06-01; iOS A | run AVD + DF Android+iOS |
| 06-04 | **Etapa 2 — Catálogo** (BUS, FIL, PDP) | 17 | 06-01, 06-02 (filtros/busca vazia) | idem |
| 06-05 | **Etapa 3 — Mochila:** 5 implementáveis + **LOG-06/MOC-06 juntos** + 11 `it.skip` nomeados + guarda/limpeza de mochila | 5 + LOG-06 (+11 skips) | 06-04 (PDP/adicionar) | idem; decisão 4 e 10 |
| 06-06 | **Etapa 4 — Checkout:** 7 | 7 | 06-02 (campos, mensagens, caminho "novo endereço"); **CEP (OQ5)** | idem |
| 06-07 | **Etapa 5 — Criar Conta:** 22 | 22 | 06-02 (**tela nunca capturada**); `{textogerado}` (OQ7); CPF existente (OQ6) | idem; cria contas reais |
| 06-08 | **Etapa 6 — Menu:** 14 (+ restauração de estado) | 14 | 06-02 (Configurações, gênero); dados da conta (OQ6) | idem |
| 06-09 | **Fechamento:** filtro de specs por etapa no CI (se opção B), conferência dos 11 skips e 8 excluídos no relatório, atualizar `STATE.md`/`ROADMAP.md` | — | todos | run DF completo |

Observação sobre a contagem: LOG-06 está no inventário da Etapa 1 (17), mas só é implementável depois de PDP/Mochila; se mudar de plano, a **Etapa 1 fecha com 16 e a Etapa 3 com 6** — a soma (82) não muda; registrar essa realocação no plano para o `/gsd-verify-work` não achar "um cenário faltando".

O que **tem que vir primeiro:** 06-01 (base + fumaça) — nenhuma etapa deve ser escrita antes de a POC migrada passar nas duas plataformas, porque ela prova os page objects trocados. O que **depende da sessão iOS:** o ramo iOS de todas as etapas (D-06) e a decisão de ONB-06/OUT. O que **depende de decisão do Marcio:** OQ1–OQ4 (antes do 06-01), OQ5 (06-06), OQ6–OQ7 (06-07/08), OQ11 (06-05).

## Sources

### Primary (HIGH confidence)
- `cenarios-gherkin-2026-09-28.pdf` §3 — lido por extração `pdftotext` (101 cenários, 15 funcionalidades, títulos exatos)
- `wdio.conf.ts`, `test/specs/test.spec.ts`, `test/utils/credentials.ts`, `device-index.ts`, `device-name.ts`, `test/pageobjects/{BasePage,HomePage,LoginPage,PerfilPage}.ts`, `CategoriasPage.ts`/`FavoritosPage.ts` (assinaturas e seletores), `testspec.yml`, `testspec-ios.yml`, `.github/workflows/mobile_test.yml` (trechos 1–200 e 455–665), `package.json`, `tsconfig.json`
- `.planning/{PROJECT,REQUIREMENTS,STATE,ROADMAP}.md`, `.planning/phases/06-*/{CONTEXT,PLAN,PENDENCIAS,DISCUSSION-LOG}.md`, `.planning/codebase/{CONCERNS,TESTING,CONVENTIONS,ARCHITECTURE}.md`, `.planning/config.json`, `.claude/skills/{planejar-mudanca,mobile-page-objects}/SKILL.md`
- Dumps/prints do app migrado: `captures-2026-09-29-m6e1/` (01–32, `nodes.mjs`, prints `02`/`04`/`08`/`16`/`17` lidos), `captures-2026-09-29/` (grep de `enabled`), `captures-2026-09-30/` (só 2 capturas iniciais: launcher e Boas-vindas, sem trabalho útil), drafts Android `00`–`28`, `TESTIDS.md`, `NOTAS.md`, `ELEMENTOS-SEM-TESTID.md`, iOS `captures-2026-09-11/NOTAS.md`
- `node_modules/@wdio/allure-reporter/build/index.js` (`onTestSkip`, `_skipTest`), `node_modules/@wdio/types/build/Frameworks.d.ts` (`TestResult.passed`), `package.json` de wdio/mocha/allure
- Execuções nesta sessão: `npx tsc --noEmit` (limpo exceto `Draft.ts`), script de CPF (10.000/10.000), import de `.ts` por `node` 22.18

### Secondary (MEDIUM confidence)
- AWS Device Farm API `ExecutionConfiguration` (`jobTimeoutMinutes` sem padrão documentado) — https://docs.aws.amazon.com/devicefarm/latest/APIReference/API_ExecutionConfiguration.html ; CLI `schedule-run` — https://docs.aws.amazon.com/cli/latest/reference/devicefarm/schedule-run.html

### Tertiary (LOW confidence)
- "padrão de 150 min" do job — apenas resultado de busca, sem página oficial que o confirme (A1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nenhum pacote novo; versões lidas em `node_modules`.
- Inventário e contagens: HIGH — extraídos do PDF e conferidos contra CONTEXT/ROADMAP.
- Mapa de elementos: MEDIUM/LOW — dumps de uma só leva, nenhum clique por WDIO; muitas telas nunca capturadas; idioma inglês desconhecido.
- CI/tempo: MEDIUM — mecânica lida em arquivo; números de tempo são estimativas (A2) e o timeout padrão é suposição (A1).
- Pitfalls: HIGH para os herdados do STATE.md/CONCERNS (medidos em run), MEDIUM para os novos.

**Research date:** 2026-10-01
**Valid until:** 2026-10-15 (o app migrado muda por build — 492/493 já divergem — e o catálogo/campanhas do Insider mudam sem aviso)
