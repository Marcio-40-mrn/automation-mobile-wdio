# REQUIREMENTS

## O fluxo coberto hoje

Um único cenário, em `test/specs/test.spec.ts`, rodando por device:

1. Abrir o app e tratar os diálogos iniciais (GPS, notificação, termos).
2. Login com a conta atribuída ao device.
3. Categorias → Roupas → Camisas.
4. Favoritar a **primeira camisa que a lista mostrar**, seja qual for.
5. Voltar para categorias, abrir Perfil → Favoritos.
6. Validar que o item favoritado está lá, pelo nome capturado no passo 4.
7. Desfavoritar.
8. Logout.

## Critérios de aceite

- **O teste não valida texto e ignora o idioma** (decisão do Marcio, 2026-10-01): nenhuma
  configuração de idioma/locale, nenhuma asserção por string exibida; seletor por
  testID/estrutura e asserção pelo destino/estado da tela. Não é assunto para perguntar.
- **O teste segue como o APLICATIVO funciona, nunca o PDF** (decisão do Marcio, 2026-10-01):
  onde o Gherkin do `cenarios-gherkin-2026-09-28.pdf` diverge do app (ordem de diálogos, telas a
  mais/a menos, navegação), o teste valida o comportamento do app e só registra a diferença em
  comentário/SUMMARY. Não é assunto para perguntar — vale para todas as etapas do M6.
- **Onboarding não tem retorno**: cenário de "Voltar" dentro do onboarding (ONB-06) está fora
  do escopo (decisão do Marcio, 2026-10-01). Não planejar nem perguntar.
- O teste não pode depender de nome de produto fixo: o catálogo muda entre versões e
  ambientes.
- O teste não pode depender de coordenada de tela: resolução e layout variam por device.
  **Exceção obrigatória no iOS**, em dois pontos do onboarding onde o app não expõe elemento
  nenhum: o CTA "Toque para começar" e o alerta de localização do SpringBoard (drafts `01` e
  `02`). Onde não há saída, a coordenada é guardada como **fração** da janela — nunca como
  pixel absoluto — e multiplicada pelo `getWindowRect()` do device real. Cada um desses
  pontos é dívida a ser cobrada do time do app, na forma de um `accessibilityIdentifier`.
- Todo passo é precedido de uma tentativa de fechar o banner do Insider, que aparece em
  qualquer tela, a qualquer momento.
- A falha tem que ser explícita e no passo certo. Nada de seguir em silêncio e estourar
  três passos adiante.
- Cada device aparece separadamente no relatório Allure, com a conta usada visível.

## Regras invioláveis

Cada uma custou um incidente. Detalhes no `CLAUDE.md`.

- **Nunca declarar `appium` no `package.json`.** Quebra a resolução de driver no Device Farm
  nas duas plataformas e derruba o relatório do GitHub Pages sem deixar o workflow vermelho
  de forma óbvia. Foi o run-22, em 2026-09-01.
- **Toda mudança de dependência exige run real do Device Farm antes do merge.** Teste local
  contra o AVD não cobre o caminho do host.
- **Nunca `npm audit fix --force`.** Rebaixa o núcleo do projeto para versões incompatíveis
  com o `wdio.conf.ts`.
- **Não subir execução no AVD sem pedido explícito do Marcio.** O emulador é ambiente de
  trabalho dele; dois runs simultâneos invalidam os dois.
- **Uma suíte só, para as duas plataformas.** Nunca criar spec, classe ou arquivo de page
  object separado por sistema operacional. O `test/specs/test.spec.ts` é o mesmo, os page
  objects são os mesmos e os nomes de método são os mesmos; quem precisar detecta a
  plataforma (`process.env.PLATFORM === 'ios'`) e escolhe o seletor **dentro do método** —
  o padrão que o `ativarApp()` de `test/pageobjects/HomePage.ts` inaugurou. Duplicar a suíte
  dobra o custo de cada mudança de fluxo e faz as duas versões divergirem em silêncio.
- **Nenhum passo de teste no `wdio.conf.ts`, em hipótese alguma** (decisão do Marcio,
  2026-10-02). O `wdio.conf.ts` só configura o ambiente: conexão, device, app, reporters, timeouts.
  Todo comportamento do teste mora no page object: aceitar ou negar diálogo/alerta, conceder
  permissão, fechar banner, navegar. Capabilities que agem no lugar do teste são proibidas,
  como `autoAcceptAlerts`, `autoDismissAlerts` e `autoGrantPermissions`. Elas escondem o que o
  app faz e impedem o teste de ver e tratar o diálogo. Encontrado em 2026-10-02: o
  `autoAcceptAlerts: true` (iOS) e o `autoGrantPermissions: true` (AVD local), que entraram no
  `8536e92`, deixaram o onboarding sem teste no iOS. O Device Farm Android já seguia a regra.
  **Exceção temporária (Marcio, 2026-10-02):** as três linhas que já existem
  (`wdio.conf.ts:35`, `:70` e `:83`) **ficam como estão por enquanto**, porque retirá-las já
  afetou os testes antes. Validar no futuro se dá para removê-las (pendência no `STATE.md`).
  Nenhuma linha nova desse tipo entra.
- **Nunca alterar o `.claude/settings.json`** (decisão do Marcio, 2026-10-02). Isso inclui hooks,
  permissões e qualquer outra chave, mesmo quando houver algo aparentemente quebrado nele, como o
  `gsd-secret-read-guard.js` registrado sem o arquivo existir. Achado ali vira registro no
  `STATE.md` para o Marcio decidir, nunca correção.
- **Sem impacto conhecido, não se muda o que funciona hoje** (decisão do Marcio, 2026-10-02).
  Uma mudança em configuração, dependência, hook ou infraestrutura cujo efeito no projeto não
  esteja medido não é feita. O que existe e funciona fica como está, e a ideia vai para as
  pendências do `STATE.md` como "validar no futuro".

## Restrições conhecidas de ambiente

- O host Android do Device Farm roda Node 18; o `testspec-ios.yml` seleciona Node 18 via nvm
  porque o host iOS vem com Node 14, que quebra o WDIO 9.
- A lista de produtos tem 150 itens e leva mais de 20s para montar; continua hidratando
  depois do primeiro card aparecer.
- O banner do Insider é uma WebView que só publica a árvore de acessibilidade alguns
  segundos após aparecer.
- O estado "favoritado" não é exposto na árvore de acessibilidade — só o pixel muda. A
  asserção tem que ser na tela de Favoritos.
