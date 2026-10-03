# Phase 6: Cenários Gherkin da seção 3 no app migrado - Context

**Gathered:** 2026-09-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Escrever como teste automatizado **WebdriverIO + Mocha** os cenários da seção 3 de
`cenarios-gherkin-2026-09-28.pdf`, no **app migrado** (`com.aramis.ecomm` 1.20.10), com os
`testID` levantados no M5, nas **duas plataformas** (Android e iOS). O Gherkin do PDF é a
especificação de cada caso.

Escopo depois desta discussão: **101 cenários − 8 excluídos = 93**. Desses 93, **11 ficam
pendentes** de massa de dados (skip nomeado, ver D-09/D-10); **82 são implementados agora**.

| Situação | Cenários | Qtde |
|---|---|---|
| Excluídos | Etapa 7 inteira — "Exibição de Conteúdo em Português do Brasil" (5); "Menu — Visibilidade da Seção DEV por Tipo de Build" (2); "Meus Dados — Falha de conectividade ao salvar exibe mensagem de erro e mantém os valores digitados" (1) | 8 |
| Pendentes (massa de dados) | Mochila — os 6 de cupom; os 2 de estoque ("Aumentar a quantidade… até o limite de estoque", "Tentar adicionar quantidade acima do estoque…"); os 3 da barra de frete grátis | 11 |
| Implementar agora | todo o resto | 82 |

Etapas do `ROADMAP.md` (M6) continuam valendo, com a Etapa 7 removida e a Etapa 6 reduzida a
14 cenários (Meus Dados 8, Configurações 4, Estado vazio 2; Seção DEV e conectividade fora).
A Etapa 3 (Mochila) fica com 5 implementáveis agora e 11 pendentes.

</domain>

<decisions>
## Implementation Decisions

### Onde o código entra
- **D-01:** O código entra **neste repositório, nos page objects atuais** (`test/pageobjects/`).
  A suíte passa a rodar **somente no app migrado** — o app antigo deixa de ser alvo. —
  **Reversibility:** costly — os seletores e textos atuais do app antigo são substituídos;
  voltar exige recuperar a versão anterior dos page objects pelo git.
- **D-02:** O teste atual (`test/specs/test.spec.ts`, favoritar) foi uma POC e **também será
  migrado** para o app migrado. (É o M7 do `ROADMAP.md`; aqui só registra que ele não pode
  ficar quebrado sem dono — o planner decide se ele acompanha a Etapa 0 ou fica para o M7.)
- **D-03:** "Uma suíte só" continua: specs por funcionalidade, nunca por sistema operacional;
  o `if` de plataforma mora dentro do método (padrão `HomePage.ativarApp()`).

### Idioma
- **D-04 (corrigida em 2026-10-01 pelo Marcio):** **o idioma é ignorado e os testes não validam
  texto nenhum.** Nenhuma configuração de idioma/locale no AVD, no Device Farm ou no
  `wdio.conf.ts`; capturas valem em qualquer idioma. Seletor por testID/estrutura, asserção
  pelo destino/estado da tela — nunca por string exibida. O objetivo é validar a
  **funcionalidade, não o idioma**. A redação anterior ("aparelho em inglês, valida o texto como
  o app mostra") foi leitura errada da fala do Marcio e está revogada. Não perguntar mais sobre
  idioma.
- **D-05:** revogada pela D-04 corrigida — não há validação de texto (o caso do erro de login
  valida que o modal de erro aparece, não a frase).

### Plataformas e CI
- **D-06:** **Android e iOS juntos.** Antes de implementar, capturar os elementos do iOS numa
  sessão de Remote Access (o Marcio se ofereceu para abrir a sessão); depois os testes são
  aplicados nas duas plataformas simultaneamente. As capturas iOS do M5 (2026-09-11) estão
  incompletas: sem login, sem PDP.
- **D-07:** Os cenários entram no **CI (Device Farm) a cada etapa**: uma etapa só fecha verde
  no AVD (rodado pelo Marcio) **e** no Device Farm.

### Contas e massa de dados
- **D-08:** Contas: **reusar as contas por device que o CI já usa** (as mesmas variáveis:
  `CLIENT_USERS_EMAILS` no Android, `CLIENT_USER` por run no iOS, `CLIENT_USER`/`CLIENT_PASSWORD`
  local). Elas já existem no app migrado. Servem para login e para os cenários de "e-mail já
  cadastrado"/"CPF já cadastrado".
- **D-09:** **Cupons: pendentes.** Os 6 cenários de cupom ficam como skip nomeado até o Marcio
  definir de onde vêm os códigos. Nenhum código inventado.
- **D-10:** **Estoque e frete grátis: pendentes.** Os 2 de estoque e os 3 da barra de frete
  ficam como skip nomeado. A origem da massa vai para `06-PENDENCIAS.md` para o Marcio decidir.
- **D-11:** **Criar Conta: gerar por execução.** CPF válido calculado pelo algoritmo; e-mail no
  formato **`informatica.mrn+{textogerado}@gmail.com`** (caixa real — o Marcio ainda vai passar
  a regra do `{textogerado}`). O cadastro de sucesso cria conta de verdade a cada execução
  (aceito). — **Reversibility:** one-way — cada execução cria uma conta real no backend, que
  não é apagada pelo teste.

### Exclusões
- **D-12:** Etapa 7 (pt-BR, 5 cenários) **fora do planejamento** — talvez faça sentido no futuro.
- **D-13:** **Nenhum teste da Seção DEV** (2 cenários fora).
- **D-14:** Falha de conectividade em Meus Dados **fora**: não dá para automatizar sem tornar o
  teste flaky.

### DEC-A — respondida pelo Marcio em 2026-10-01 (execução do 06-01; não perguntar de novo)
- **(a) Build:** é o que a automação baixa e instala (`scripts/install-apk.mjs` + secrets
  `BUILD_*`). Para captura, o Marcio instala na sessão. Não se pergunta build/versão.
- **(b) POC:** migra na Etapa 0 (fumaça). Nenhuma etapa é pulada; o M7 continua marco próprio.
- **(c) Execução:** como está hoje — limpeza do app por teste e **vídeo de todos os testes**;
  `wdio.conf.ts` sem mudança de política.
- **(d) CI:** todo run executa **todos os testes em todos os devices**, sem filtro. Rodar suíte
  ou teste único só **local** (AVD; sessão AWS no iOS): `--spec <arquivo>` e
  `--mochaOpts.grep "<id>"`. O limite de 120 min de polling será reavaliado com o tempo medido.
- **(e) Idioma:** ignorado (D-04 corrigida).
- **Sem replanejamento:** os planos 06-01…06-16 seguem como estão; onde mencionarem inglês,
  DEC-B de idioma ou validação de texto, vale a D-04 corrigida. Elemento localizado por texto
  que quebrar é corrigido quando der erro.
- **Próximo passo decidido:** captura iOS do app migrado (o Claude conecta na sessão de Remote
  Access) e implementação dos testes; a captura Android em inglês do 06-01 Tarefa 2 não é
  necessária (o motivo dela era o idioma).

### DEC-C e regra geral de divergência — Marcio, 2026-10-01 (não perguntar de novo)
- **D-15: o teste segue como o aplicativo funciona, nunca o PDF.** Divergência de comportamento
  (ordem dos diálogos, Termos depois da Política, etc.) = valida o app e registra a diferença.
  Vale para todas as etapas e substitui toda pergunta "assert-app × assert-pdf" dos planos.
- **D-16: ONB-06 (Voltar na Política / no onboarding) EXCLUÍDO** — "no onboarding não existe
  retorno". Sem `it`, registrado como excluído. Escopo: 82 → **81** implementados (Etapa 1: 15).
- DEC-C do 06-04, demais itens, decididos sem pergunta: (d) sem efeito (ONB-06 excluído);
  (e) negar permissão no iOS não observável com autoAcceptAlerts → o it de negar roda só onde o
  diálogo aparece, com skip nomeado no iOS; (f) iOS tem diálogo de logout (capturado); (g) credencial
  errada com e-mail fictício gerado; (h) modal de erro iOS fechado pelo OK por fração (0.5, 0.619),
  medido na sessão A; (i) ATT no iOS: "Allow".

### Claude's Discretion
- Estrutura interna dos specs por funcionalidade, nome dos arquivos de spec e como organizar o
  skip nomeado dos pendentes — desde que o motivo do pendente apareça no relatório.
- Como os page objects atuais absorvem os testIDs (seletores novos no lugar dos antigos),
  respeitando D-01 e D-03.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Especificação
- `cenarios-gherkin-2026-09-28.pdf` §3 — os cenários (Gherkin). Seções 1, 2 e 4 fora.
- `.planning/ROADMAP.md` — M6 (etapas, dependências) e M7 (migração da POC).
- `.planning/REQUIREMENTS.md` — regras invioláveis (uma suíte só, não rodar no AVD sem pedido,
  validar pelo destino, coordenada só como fração).
- Documento da fase (etapas, decisão de 30/09), antes em `06-PLAN.md` — é o documento correto.
  Em 2026-10-01 o `/gsd-plan-phase 6` o converteu para o formato GSD: o texto está, palavra por
  palavra, no `<context>` do `06-01-PLAN.md`, e os planos `06-01`…`06-16` o executam.
- `.planning/phases/06-cenarios-gherkin-app-migrado/06-PENDENCIAS.md` — o que está pendente e
  de onde a massa tem que vir.

### Elementos do app migrado (M5)
- `.planning/drafts/app-migrado/android/00-INDICE.md` e os drafts `01`–`28`.
- `.planning/drafts/app-migrado/android/captures-2026-09-29/TESTIDS.md` — testIDs por tela.
- `.planning/drafts/app-migrado/android/captures-2026-09-29/NOTAS.md`.
- `.planning/drafts/app-migrado/android/captures-2026-09-29-m6e1/` — capturas da Etapa 1
  (onboarding em EN, login, esqueci senha, credenciais erradas, menu logado, logout). Sem
  `NOTAS.md`.
- `ELEMENTOS-SEM-TESTID.md` (raiz) — elementos sem testID e como achá-los hoje.
- `.planning/drafts/app-migrado/ios/captures-2026-09-11/NOTAS.md` — 1ª leva iOS (incompleta).

### Código e convenções
- `.planning/codebase/CONVENTIONS.md`, `TESTING.md`, `STRUCTURE.md`.
- `test/pageobjects/*.ts`, `test/specs/test.spec.ts`, `test/utils/credentials.ts`,
  `wdio.conf.ts`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BasePage` (695 linhas): `clickIfPresent`, `clickFirstPresent`, `aguardarTelaEstavel`,
  `tapProporcional`, `fechaBanner` (Insider), helpers de onboarding e permissões.
- `LoginPage.logar()` (+ `logarIOS`/`digitarIOS` com digitação lenta e 2 taps no submit).
- `PerfilPage.logout()`/`confirmarLogout()`; `FavoritosPage` (estado vazio já detectado).
- `test/utils/credentials.ts` — conta por device nas 3 formas de ambiente.

### Established Patterns
- Ramo iOS como `private ...IOS()` no mesmo arquivo; nomes de método em português.
- Validação pelo destino, laços com limite e erro nomeado; log com prefixo de emoji.
- Um `step()` Allure por chamada de page object; `historyId` por device.

### Integration Points
- `wdio.conf.ts` — `specs`, capabilities (locale do device), flags `isDeviceFarm/isIOS/isRemote`.
- `testspec.yml` / `testspec-ios.yml` e `.github/workflows/mobile_test.yml` — entrada no CI (D-07).

</code_context>

<specifics>
## Specific Ideas

- E-mail de cadastro: `informatica.mrn+{textogerado}@gmail.com` — caixa real, porque a
  recuperação de conta precisa do e-mail.
- Observação: **nenhum dos 93 cenários lê a caixa de e-mail** — o único cenário de recuperação
  ("Acessar a tela de recuperação de senha a partir do link Esqueci minha senha") para na tela.
  O acesso à caixa do Gmail é pendência para depois (ver `06-PENDENCIAS.md`), não bloqueia a fase.

</specifics>

<deferred>
## Deferred Ideas

- Validação de idioma pt-BR (Etapa 7) — futuro.
- Acesso automatizado à caixa do Gmail (recuperação de senha completa) — avaliar trade-off de
  segurança antes (`06-PENDENCIAS.md`).
- Seção DEV e falha de conectividade — fora, sem previsão.

</deferred>

---

*Phase: 06-cenarios-gherkin-app-migrado*
*Context gathered: 2026-09-30*
