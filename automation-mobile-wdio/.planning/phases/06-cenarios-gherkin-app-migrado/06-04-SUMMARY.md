---
phase: 06-cenarios-gherkin-app-migrado
plan: 04
subsystem: testing
tags: [m6, etapa-1, onboarding, login, esqueci-senha, gate-de-cobertura, app-migrado, testid]

requires:
  - phase: 06-cenarios-gherkin-app-migrado
    provides: "06-01 — capturas iOS sessão A e Android m6e1; 06-02 — helpers Allure e textos.ts; 06-03 — fumaça verde e page objects do app migrado"
provides:
  - "OnboardingPage: cada passo do onboarding exposto, com diálogos de permissão asseridos como APARECIDOS (Android)"
  - "01-onboarding.spec.ts (6 it: ONB-01..05 e ONB-07) e 02-login.spec.ts (6 it: LOG-01..05 e LOG-07), sem seletor nos specs"
  - "LoginPage com inspeção do formulário por estado (enabled, modal, destino) e EsqueciSenhaPage"
  - "cobertura.check.mjs: inventário dos 101 cenários e gate de cobertura por etapa (node:test, sem dependência)"
  - "massa.ts: e-mail fictício Gmail plus único por device e por execução"
affects: [06-05, 06-09]

key-files:
  created:
    - test/pageobjects/OnboardingPage.ts
    - test/pageobjects/EsqueciSenhaPage.ts
    - test/specs/01-onboarding.spec.ts
    - test/specs/02-login.spec.ts
    - test/utils/cobertura.check.mjs
    - test/utils/massa.ts
  modified:
    - test/pageobjects/LoginPage.ts
    - test/pageobjects/BasePage.ts
    - test/utils/allure-helpers.ts
    - test/utils/textos.ts

key-decisions:
  - "DEC-C por-item (Marcio, 2026-10-02): o teste segue o app; ONB-06 fora do escopo; wdio.conf.ts NÃO muda; e-mail do LOG-05 no formato Gmail plus; modal iOS fechado relançando o app"
  - "REGRA FIXA sem texto/idioma: asserção por estado (enabled, modal, destino); nenhuma chave de textos.ts para asserção"
  - "Onboarding Android parte de clearApp + activateApp (app limpo por it); iOS detecta app já onboardado e pula com motivo"

requirements-completed: []

status: complete-sem-run

completed: 2026-10-02

actuals:
  tokens: 23000   # chars/4 sobre os arquivos criados e o acréscimo no LoginPage (medido por wc -c, não por contagem do harness)
  tasks: 3
  commits: 0      # Nenhum commit (regra do projeto): o Marcio versiona
---

# Phase 06 Plan 04: Etapa 1 — Onboarding e Login Summary

**ONB-01..05, ONB-07, LOG-01..05 e LOG-07 escritos como WDIO + Mocha para as duas plataformas, mais o gate de cobertura dos 101 cenários, tudo por testID/estrutura e asserção por estado (sem ler texto). Nenhum run: nada disto foi exercitado contra device — o run da Etapa 1 é o 06-05.**

Nenhum commit (regra do projeto). Nenhum comando de device foi executado: só `tsc`, `node --test` e `node -e`.

## DEC-C (respondida por-item pelo Marcio em 2026-10-02) e consequência no código

| Item | Decisão | Onde está no código |
|---|---|---|
| **(a) ONB-01, ordem dos diálogos** | O teste segue o **APP**. Android = localização → notificação (m6e1 02/03); iOS = notificação → toque no CTA → ATT → localização (sessão A, NOTAS.md 00-05). A divergência com o PDF (que diz notificação → localização) fica em comentário no `it` e aqui. | `OnboardingPage.ordemEsperadaDosDialogos()`; `01-onboarding.spec.ts` ONB-01 compara a ordem observada com ela |
| **(b) ONB-04, Termos** | Segue o **APP**: Política → Termos → Home (o PDF vai da Política direto à Home). Estendi o mesmo critério ao ONB-05 e ao ONB-07, que têm a mesma divergência (ver desvio 6). | ONB-04/05/07: `aceitarPolitica` → `validarTermos` → `aceitarTermos` → `validarHomeComAbas` |
| **(c)/(d) ONB-06 (Voltar na Política)** | **Fora do escopo** (REQUIREMENTS.md: "Onboarding não tem retorno", Marcio, 2026-10-01). Sem `it`, sem `it.skip`; `voltarNaPolitica()` NÃO implementado; no inventário vira **E** com o motivo "fora do escopo — Onboarding não tem retorno (decisão do Marcio, 2026-10-01, REQUIREMENTS.md)". | `cobertura.check.mjs` (INVENTARIO); `01-onboarding.spec.ts` com 6 `it` |
| **(e) ONB-02/04 no iOS** | **`wdio.conf.ts` NÃO muda** (autoAcceptAlerts nas linhas 35 e 70 fica). Onde o iOS não consegue negar ou observar o diálogo, `pularNestaPlataforma(this, motivo)` com motivo citando a "DEC-C (e)": alerta aceito sozinho pelo autoAcceptAlerts, e negar permissão exige reinstalação limpa (NOTAS.md, "Lacunas"). | ONB-01..04 pulam no iOS (`alertasObservaveis()` falso, `MOTIVO_IOS_ALERTAS`); ONB-05/07 pulam se o app já passou do onboarding (`MOTIVO_APP_NAO_LIMPO`). `git diff -- wdio.conf.ts` vazio. |
| **(f) OUT-01..03 no iOS** | Implementado no 06-05, só registrado aqui: se o iOS não tiver diálogo de logout (ou ele for aceito pelo autoAcceptAlerts), OUT-01 e OUT-02 são pulados no iOS com motivo citando "DEC-C (f)", e OUT-03 valida o logout direto pelo estado do Menu. (O 06-03 já mostrou que o diálogo existe no iOS migrado e que `confirmarLogout()` valida pelo estado do Menu quando o diálogo não é visto.) | nada neste plano |
| **(g) LOG-05, e-mail** | **Não é `@example.com`.** Formato `informatica.mrn+{texto}@gmail.com`, com `{texto}` gerado a cada execução e **único por device** (`log05-` + device normalizado + timestamp base 36 + sufixo aleatório) — nunca casa com `qa` + números das contas reais. `gerarEmailFicticio(device)` alimentado pelo `device` de `rotularTeste()`. Esse padrão será usado depois para receber o e-mail de redefinição. | `test/utils/massa.ts` (sem imports); `02-login.spec.ts` |
| **(h) Modal de erro do iOS** | `fecharModalErro()` no iOS **relança o app** (`mobile: terminateApp` + `mobile: activateApp` em `com.aramis.ecomm`), **sem coordenada**, e volta ao Login por `abrirLogin()`. No Android toca o OK pelo botão estrutural capturado. | `LoginPage.fecharModalErro()` / `fecharModalErroIOS()` |
| **(i) ATT (iOS)** | Tocar **"Allow"** via `mobile: alert` com `buttonLabel`. É o caminho que `aceitarAlertasSistemaIOS` já usa (validado nas sessões 2026-09-11 e A); `tratarPermissoes` no iOS o reaproveita via `permissaoLocalizacaoIOS()`. | `BasePage.aceitarAlertasSistemaIOS` (existente), chamado por `OnboardingPage.tratarPermissoes` |
| **LOG-07** | Segue o plano: valida a tela e o estado do formulário e **NÃO envia o link**. **Pendência (Marcio, 2026-10-02):** a leitura da caixa do Gmail para validar o e-mail de redefinição será planejada e implementada depois (ver "Pendências"). | `EsqueciSenhaPage`, `02-login.spec.ts` |

## Tarefas

### Tarefa 1 — DEC-C
Respondida pelo Marcio antes da execução; registrada acima. Sem mudança de capability: o aviso do plano ("se (e) pedir mudança de capability, o run do 06-05 é a validação obrigatória") não se aplica.

### Tarefa 2 — Onboarding + gate de cobertura
- `allure-helpers.ts`: `pularNestaPlataforma(ctx, motivo)` = `addDescription` + tag `pulado-plataforma` + `ctx.skip()` (devolve `never`).
- `OnboardingPage` (nova): `abrirApp()` (Android: `clearApp` + `activateApp` + Boas-vindas; iOS: detecta onboarding já feito), `tocarCta()` (reaproveita `iniciaApp`/`iniciaAppIOS`, incluindo a coordenada **por fração** já existente — nenhuma coordenada nova), `tratarPermissoes()` (Android: assere que cada diálogo apareceu em 15 s, permite/nega pelo id do sistema, confirma que fechou, devolve a ordem observada), `validarTopicos()` (4 `permission-topic`), `continuarTopicos(reSolicitacao?)` (trata a 2ª solicitação das permissões negadas), `validarPolitica/aceitarPolitica/validarTermos/aceitarTermos`, `validarHomeComAbas()`, `validarSemNavegacaoCircular()`.
- `01-onboarding.spec.ts`: 6 `it` (ONB-01..05, ONB-07), `abrirApp()` no início de cada um, Dado/Quando/Então em comentário, nenhum seletor.
- `cobertura.check.mjs`: INVENTARIO com os 101 cenários (A/P/E, motivo), filtros `COBERTURA_ETAPA_ATE` e `COBERTURA_PREFIXOS`, 8 testes. Conferi também os casos negativos (ver Self-Check).

### Tarefa 3 — Login
- `massa.ts`: `gerarEmailFicticio(device)` e `gerarSenhaFicticia()`.
- `LoginPage`: `abrirLogin()`, `preencherEmail()`, `preencherSenha()`, `botaoEntrarHabilitado()`, `entrar()`, `entrarEsperandoErro()`, `fecharModalErro()`, `abrirEsqueciSenha()`. `logar()` passou a usar `entrar()` (Android) e `tocarEntrarIOS()` (iOS), mantendo a validação de tab bar.
- `EsqueciSenhaPage` (nova): `validarTela()`, `preencherEmail()`, `botaoEnviarHabilitado()`.
- `02-login.spec.ts`: 6 `it` (LOG-01..05, LOG-07), comentário no topo registrando que o LOG-06 vai para o 06-09 com o MOC-06; nenhum seletor.
- `textos.ts`: só 3 chaves novas, **para localizar** (`login.linkEsqueci`, `esqueci.campoEmail`, `esqueci.botaoEnviar`, todas iOS).

## Deviations from Plan

**1. [Regra fixa — sem texto/idioma] Asserções por estado, não por string.** O plano mandava comparar a mensagem (LOG-05 "igual a `texto('login.erroCredenciais')`"), ler o texto sob o campo (`mensagemEmailInvalido()`), devolver o texto do modal (`entrarEsperandoErro(): string`) e conferir título/instrução da tela de recuperação "pelos textos". Fora tudo isso (REQUIREMENTS.md, 2026-10-01; substitui D-04/D-05):
- **Não criei** as chaves `login.erroCredenciais`, `login.erroEmailInvalido`, `esqueci.titulo`, `esqueci.instrucao` nem as do modal (título/OK); `mensagemEmailInvalido()` não existe; `entrarEsperandoErro()` devolve `void`.
- LOG-03 asserta só "botão desabilitado" (que é o que o Gherkin pede); LOG-05 asserta "modal presente + não logou"; LOG-07 reconhece a tela pela estrutura (1 campo de texto + botão) e pelo `enabled` do botão.
- **LOG-05, 2ª cláusula** ("a mensagem não indica qual campo está errado") depende de LER o texto e **ficou sem asserção**. Não tentei um substituto estrutural (detectar erro inline por geometria ou por irmão SVG seria seletor especulativo, sem captura que o sustente).
- Android: o modal é achado por estrutura (OK = ViewGroup clicável irmão que vem logo depois do ScrollView da mensagem, capturas m6e1 15 × 26); o link "Esqueci minha senha" por estrutura (TextView irmão que precede o `pressable`). Só o iOS usa texto, para localizar (placeholders, rótulo do botão, link, trecho do modal), via `textos.ts`.

**2. [DEC-C c/d] ONB-06 excluído.** Sem `it`/`it.skip`; `voltarNaPolitica()` não implementado; `INVENTARIO` com ONB-06 = **E**. Contagens que mudaram em relação ao plano, conferidas contra o inventário real: A+P por etapa **15, 17, 17, 7, 22, 14** (plano: 16, 17, 17, 7, 22, 14), excluídos **9** (plano: 8: PTBR×5, DEV×2, MD-08 e agora ONB-06). Total A+P = 92 (81 A + 11 P). `01-onboarding.spec.ts` tem **6** `it`; a verificação automática passou a esperar 6, não 7.

**3. [DEC-C g] E-mail do LOG-05 em Gmail plus, não `@example.com`.** `gerarEmailFicticio` ganhou o parâmetro `device` (contrato do plano era sem argumento) e `massa.ts` ganhou `gerarSenhaFicticia()`. A verificação automática da Tarefa 3 mudou (ver Self-Check). **T-06-04-01 atualizada:** o endereço é único por device e por execução e nunca é cadastrado, então nenhuma conta real recebe senha errada; e o prefixo `log05-` impede a colisão com o padrão `qa<número>` das contas do CI. Os LOG-02, 03, 04 e 07 usam o mesmo gerador só para ter um e-mail "válido"; nenhum deles envia nada.

**4. [DEC-C e] `wdio.conf.ts` intocado.** Em vez de mudar `autoAcceptAlerts`, ONB-01..04 pulam no iOS (`alertasObservaveis()` falso). Consequência de cobertura: **no iOS os diálogos de permissão não são exercitados por este plano.**

**5. [Rule 2] `OnboardingPage.abrirApp()` no Android faz `mobile: clearApp` antes de `activateApp`.** O plano descrevia só `activateApp` + Boas-vindas, confiando no `afterTest`. Mas o `afterTest` limpa DEPOIS de cada teste, e o AVD local roda com `noReset: true`: o 1º teste de um run local começaria com o onboarding já feito. No iOS não há como limpar (`mobile: clearApp` não é suportado em iPhone real e o Remote Access só faz `terminateApp`), então o estado é detectado e o cenário pula com motivo (`MOTIVO_APP_NAO_LIMPO`).

**6. [DEC-C b estendida] ONB-05 e ONB-07 também passam pelos Termos.** A decisão (b) cita o ONB-04, mas o ONB-05 ("Continue na Política → Home") e o ONB-07 têm a mesma divergência; aplicar o critério "o teste segue o app" só ao ONB-04 deixaria os outros dois vermelhos por construção.

**7. [Rule 3] `digitarIOS` saiu do `LoginPage` (private) para o `BasePage` (protected).** Corpo copiado sem alteração, só reindentado. Motivo: `EsqueciSenhaPage` (que estende `BasePage`) precisa da mesma digitação lenta do iOS, e duplicá-la faria as duas divergirem. O ramo iOS de digitação do login não mudou de comportamento.

**8. [Rule 1/3] `LoginPage.logar()` refatorado sem mudar comportamento.** Android: o laço dos dois toques foi para `entrar()` (verbatim, mensagem de erro com `contexto`); `logar()` continua validando `tab-home` em 20 s. iOS: o laço de taps virou `tocarEntrarIOS(esperaErro, quem)`, que `logar` chama com `esperaErro=false` — mesma pausa de 2,5 s, mesmo `fechaBanner()` antes de cada tap, mesma detecção do modal; só a mensagem do modal agora diz `de "<e-mail>"`. **Risco:** a fumaça (POC) está verde e este caminho é o dela; foi só `tsc`, não run. Se a POC regredir no próximo run, olhar aqui primeiro.

**9. [Informativo] Caminho de captura do plano não existe.** O plano cita `captures-m6-e01-en/`; a pasta real é `.planning/drafts/app-migrado/android/captures-2026-09-29-m6e1/` (os dumps estão em pt-BR apesar do sufixo `-en` nos arquivos; ver `06-RESEARCH.md`, achado 1). Os seletores vieram dela e de `ios/captures-m6-sessao-a/`.

**10. [Informativo] `pularNestaPlataforma` devolve `never`** (o contrato do plano dizia `void`): `ctx.skip()` não retorna, e o tipo deixa o compilador saber disso.

## Seletores novos — situação: NÃO VERIFICADOS

Nenhum foi exercitado por WDIO. A coluna "evidência" é o que as capturas sustentam; o run da Etapa 1 (06-05 Tarefa 2) é a verificação.

| Seletor / comportamento | Plataforma | Evidência nas capturas | Situação |
|---|---|---|---|
| `id:...permission_allow_foreground_only_button` (localização), `id:...permission_allow_button` (notificação) | Android | m6e1 02, 03, 05, 06 (dois estados: 1ª e 2ª solicitação) | não verificado |
| `resourceIdMatches(".*permission_deny.*button")` (negar, cobre `permission_deny_button` e `..._and_dont_ask_again_button`) | Android | m6e1 02/03 (1ª vez) e 05/06 (2ª vez) | não verificado |
| 2ª solicitação das permissões negadas depois do Continue dos Tópicos | Android | m6e1 05/06/07 (só o caso "ambas negadas"; "só uma negada" é inferido) | não verificado |
| `mobile: clearApp` revoga as permissões e traz os diálogos de volta no AVD (`autoGrantPermissions: true`) | Android local | nenhuma | **não verificado** — se não revogar, ONB-01..04 falham com o erro nomeado (`autoGrantPermissions`) |
| Boas-vindas: container clicável ancestral de `first-access-item-animation` (existente no BasePage, Assumption A5) | Android | m6e1 01/09 | não verificado |
| `permission-topic` ×4 + `accept-button` na tela final | Android e iOS | m6e1 04/10; iOS sessão A 02 | não verificado (contagem exata = 4) |
| Política/Termos reconhecidos por estrutura (sem `permission-topic`, sem `tab-home`, `accept-button` fora da viewport, sem diálogo) | Android e iOS | m6e1 05/07/11/12; iOS 07/09 | não verificado — **Política e Termos só se distinguem pela ordem do fluxo** |
| `tab-home/categories/bag/menu`, `editorial-home-root`, `editorial-group-0` (existência) | Android e iOS | m6e1 13; iOS 10 | não verificado |
| Voltar do sistema na Home não leva ao onboarding (`driver.back()` + reativar) | Android | nenhuma (só o Voltar na Política foi capturado) | não verificado |
| `Back` ausente na Home | iOS | iOS 10 (sem `Back`) | não verificado |
| `EditText` instance(0/1) como e-mail/senha | Android | m6e1 15–18 | não verificado |
| `pressable` único no Login, `enabled` false → true | Android | m6e1 15/16/18 = false, 17 = true | não verificado (dois estados lidos nos dumps) |
| `Email`/`Password` por name; `pressable` + rótulo, `enabled` false → true | iOS | iOS 12/14 = false, 16 = true | não verificado (dois estados) |
| Modal de erro: OK = ViewGroup clicável irmão seguinte ao ScrollView (`//android.widget.ScrollView/following-sibling::android.view.ViewGroup[@clickable="true"][1]`) | Android | m6e1 26 (o modal aparece sozinho no dump) × 15 (Login sem esse padrão) | **não verificado — um só dump com o modal**; se o `getPageSource()` do Appium não expuser a janela do modal, `entrarEsperandoErro()` falha com erro nomeado |
| Modal de erro: `label CONTAINS` (nó único sem filho) | iOS | iOS 18 | não verificado (já usado em `logarIOS`, que teve run verde, mas só no ramo de sucesso) |
| Relançar o app (`terminateApp` + `activateApp`) cai na Home deslogada com os dados preservados | iOS | nenhuma (a POC usa o mesmo par na limpeza de favorito órfão, sem ter exercitado essa limpeza) | **não verificado** |
| Link "Esqueci minha senha": TextView irmão que precede o `pressable` | Android | m6e1 15 (TextView não clicável no dump) e 24 (tela abre) | não verificado |
| `Forgot my password` (accessibility id) | iOS | iOS 20 | não verificado |
| Tela de recuperação: 1 `EditText` + `pressable`; botão `enabled` false com campo vazio | Android | m6e1 24 (um estado) | não verificado — **o estado "habilitado com e-mail preenchido" no Android não foi capturado** |
| Tela de recuperação: `E-mail` + `pressable` "Send link", `enabled` false → true | iOS | iOS 20 = false, 21 = true | não verificado (dois estados) |

## Pendências

1. **Leitura da caixa do Gmail** para validar o e-mail de redefinição de senha — será **planejada e implementada depois** (pedido do Marcio, 2026-10-02). O LOG-07 hoje não envia o link. O formato `informatica.mrn+{texto}@gmail.com` já está pronto para isso; o `{texto}` por device/execução está em `massa.ts`.
2. **Run da Etapa 1 no 06-05** (AVD, rodado pelo Marcio, e Device Farm): é a única verificação dos seletores acima. Nada deste plano foi executado contra device.
3. **iOS sem reset de dados:** ONB-01..04 pulam sempre (autoAcceptAlerts, DEC-C e) e ONB-05/ONB-07 só rodam no 1º teste de uma sessão com o app limpo; os demais pulam com `MOTIVO_APP_NAO_LIMPO`. Cobertura iOS real do onboarding exige uma forma de reinstalar/limpar o app entre testes (ou um arquivo de spec por sessão) — **decisão do Marcio, não está escrito.**
4. **AVD local:** conferir no run se `clearApp` traz os diálogos de volta apesar do `autoGrantPermissions: true` (linha 83 do `wdio.conf.ts`, não alterada). Se não trouxer, ONB-01..04 falham no Android local com o erro nomeado, e a decisão (mudar a capability só para esses specs ou rodá-los só no Device Farm) é do Marcio.
5. **LOG-05, 2ª cláusula** (mensagem não indica o campo) sem asserção — depende de ler texto (desvio 1).
6. **Sessão mantida por spec não adotada** (DEC-A "como hoje"): cada `it` de login refaz o onboarding (custo de tempo por device; medir no run do CI).
7. OUT-01..03 (Logout) e a DEC-C (f) seguem para o 06-05.
8. LOG-06 fica para o 06-09 (junto com o MOC-06).

## Known Stubs

Nenhum.

## Threat Flags

Nenhum. Superfície nova só em código de teste: `mobile: clearApp` apaga os dados do app no device de teste (já era feito pelo `afterTest`); nenhuma linha interpola senha (`grep` vazio); nenhum arquivo de CI foi tocado; a conta real do device nunca recebe senha errada (T-06-04-01).

## Self-Check: PASSED (verificações estáticas; nenhum run em device)

Saídas reais, desta sessão:

```
$ npx tsc --noEmit 2>&1 | grep -v '^test/Draft.ts'
(vazio — 0 linhas)

$ COBERTURA_ETAPA_ATE=1 COBERTURA_PREFIXOS=ONB,LOG node --test test/utils/cobertura.check.mjs
ok 1 - inventário: 101 IDs únicos e títulos preenchidos
ok 2 - inventário: A+P por etapa e total de excluídos
ok 3 - inventário: ONB-06 e LOG-06 conforme as decisões
ok 4 - cada A exigido aparece em exatamente um it( com "[ID] título"
ok 5 - cada P exigido aparece em exatamente um it.skip( "[PENDENTE — ...] [ID] título"
ok 6 - nenhum excluído (E) aparece em it/it.skip
ok 7 - nenhum ID repetido nem fora do inventário
ok 8 - uma suíte só: nenhum arquivo de test/ com ios ou android no nome
# tests 8  # pass 8  # fail 0   (exit 0)
```

Casos negativos do gate (conferidos e revertidos): com `COBERTURA_ETAPA_ATE=2`, o teste 4 falha (cenários BUS/FIL/PDP sem `it`); com um `it('[ONB-06] ...')` acrescentado, o teste 6 falha com `ONB-06 é excluído e não pode ter it( (01-onboarding.spec.ts)`; o arquivo foi restaurado e voltou a 8/8.

`massa.ts` (verificação **ajustada** pelo item g — em vez de `endsWith('@example.com')`):

```
massa ok
informatica.mrn+log05-samsung-galaxy-s23-u-mur0yygb-u3ak@gmail.com
informatica.mrn+log05-avd-s24-mur0yygc-ymua@gmail.com
informatica.mrn+log05-apple-iphone-15-pro-mur0yygc-0nun@gmail.com
```
Conferido no mesmo `node -e`: duas chamadas com o mesmo device diferem; devices diferentes geram e-mails diferentes; todos casam `/^informatica\.mrn\+[a-z0-9-]+@gmail\.com$/`; nenhum casa `/\+qa\d+@/`; parte local ≤ 64 caracteres; 2000 chamadas do mesmo device sem nenhuma repetição.

Contagens e greps:

```
its em 01-onboarding.spec.ts ([ONB-01..07], ONB-06 excluído): 6
its em 02-login.spec.ts: 6   it.skip em 02-login.spec.ts: 0
grep -nE "\$\(|accessibility id:|uiautomator" test/specs/01-onboarding.spec.ts test/specs/02-login.spec.ts   -> vazio (exit 1)
grep -nE '\$\{(senha|password)\}' -r test/                                                                  -> vazio (exit 1)
git diff --stat -- wdio.conf.ts package.json package-lock.json testspec.yml testspec-ios.yml .github      -> vazio
```

- `STATE.md`, `ROADMAP.md`, `config.json` e `REQUIREMENTS.md` não foram editados (aparecem como modificados no `git status` porque já estavam assim antes do plano; as datas de modificação deles são de 2026-10-01 e 2026-09-30, anteriores a esta execução).
- Arquivos citados existem: `OnboardingPage.ts`, `EsqueciSenhaPage.ts`, `01-onboarding.spec.ts`, `02-login.spec.ts`, `cobertura.check.mjs`, `massa.ts`.
- Nenhum commit.
- **Não verificado, por regra:** nenhum seletor, nenhuma sequência de toques e nenhum comportamento do app foi exercitado (tabela acima).
