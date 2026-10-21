# REQUIREMENTS

## O fluxo coberto hoje

**Os quatro testes principais e únicos** (decisão do Marcio, 2026-10-16), em `test/specs/`, cada um
rodando por device nas duas plataformas. Comando de cada um: `COMO-RODAR-TESTES.md` (raiz).

| Spec | Cenário |
|---|---|
| `01-fluxo-favoritar` | onboarding, login, Categorias → Roupas → Camisas, favoritar a 1ª camisa, conferir em Favoritos, desfavoritar, logout |
| `02-compra-pix` | jornada completa de compra com Pix até o QR code, com os valores do resumo validados pelos preços lidos na PDP |
| `03-compra-cartao` | onboarding negando as permissões, 1 calça, pagamento com cartão fake até a recusa (Pedido Cancelado com número e valor) |
| `04-criar-conta` | cadastro de conta real, com os casos inválidos de cada etapa no mesmo teste |

## Critérios de aceite

- **O teste não valida texto e ignora o idioma** (decisão do Marcio, 2026-10-01): nenhuma
  configuração de idioma/locale, nenhuma asserção por string exibida; seletor por
  testID/estrutura e asserção pelo destino/estado da tela. Não é assunto para perguntar.
- **O teste segue como o APLICATIVO funciona, nunca o PDF** (decisão do Marcio, 2026-10-01):
  onde o Gherkin do `cenarios-gherkin-2026-09-28.pdf` diverge do app (ordem de diálogos, telas a
  mais/a menos, navegação), o teste valida o comportamento do app e só registra a diferença em
  comentário/SUMMARY. Não é assunto para perguntar — vale para todas as etapas do M6.
- **Cobertura mínima e simples: um teste por decisão** (decisão do Marcio, 2026-10-02). Vale para
  todas as etapas do M6 e para qualquer teste novo. Cada teste automatizado cobre uma **decisão**
  do usuário ou do app, como permitir ou negar, campo válido ou inválido, ou confirmar ou cancelar.
  Um cenário do PDF que repete o caminho de outro, ou que só confere o fim de um fluxo que outro
  teste já percorre, **não ganha teste próprio**: vira asserção dentro desse outro teste, e o
  título dele cita o ID do cenário coberto. Caso repetido ou desnecessário é excluído. O motivo é
  que cada teste roda em todos os devices do CI e o tempo se multiplica.
  **Nenhum teste é juntado ou removido sem autorização explícita do Marcio para aquele spec e
  aquele número.** A redução pode ser proposta, mas não pode ser aplicada por
  conta própria.
- **Onboarding não tem retorno**: cenário de "Voltar" dentro do onboarding está fora
  do escopo (decisão do Marcio, 2026-10-01). Não planejar nem perguntar.
- O teste não pode depender de nome de produto fixo: o catálogo muda entre versões e
  ambientes.
- O teste não pode depender de coordenada de tela: resolução e layout variam por device.
  **Exceção obrigatória no iOS**, em dois pontos do onboarding onde o app não expõe elemento
  nenhum: o CTA "Toque para começar" e o alerta de localização do SpringBoard (drafts `01` e
  `02`). Onde não há saída, a coordenada é guardada como **fração** da janela — nunca como
  pixel absoluto — e multiplicada pelo `getWindowRect()` do device real. Cada um desses
  pontos é dívida a ser cobrada do time do app, na forma de um `accessibilityIdentifier`.
  No build 349 o CTA ganhou id (`welcome-start-button`), e a fração ficou só como reserva.
  **Exceção nova (Marcio, 2026-10-15), também só no iOS:** o sheet de tamanho e o de "produto
  adicionado" da PDP (tamanhos, "Add to cart", "Continue shopping") ficam fora da árvore, então
  são tocados por fração da janela, com o efeito validado pelo contador da Mochila
  (`ProdutoPage`, drafts iOS 13 e 14). O carrossel de indicação desse sheet fica **sem
  validação no iOS** até o app expor os filhos do sheet.
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
  object separado por sistema operacional. Cada spec de `test/specs/` é o mesmo, os page
  objects são os mesmos e os nomes de método são os mesmos; quem precisar detecta a
  plataforma (`process.env.PLATFORM === 'ios'`) e escolhe o seletor **dentro do método** —
  o padrão que o `ativarApp()` de `test/pageobjects/HomePage.ts` inaugurou. Duplicar a suíte
  dobra o custo de cada mudança de fluxo e faz as duas versões divergirem em silêncio.
- **Mesmo fluxo e mesma regra de validação nas duas plataformas** (Marcio, reforçada em 2026-10-21).
  O `if` de plataforma serve só para **ler/tocar** o elemento (seletor, gesto); o que o teste valida, quando
  falha e quando só avisa é o mesmo nos dois sistemas, de preferência no mesmo bloco de código. Toda decisão
  tomada para uma plataforma vale para a outra, salvo ordem explícita. **Qualquer diferença de fluxo ou de
  validação entre Android e iOS só existe com decisão do Marcio sobre o porquê**, informada a ele e registrada
  na tabela abaixo (e no comentário do método). Diferença sem linha na tabela é defeito a corrigir.
  Caso que motivou: a regra da área de transferência do Pix (vazia = aviso) foi decidida para o iOS em
  2026-10-18 e ficou só no iOS; o Android falhou em 6/6 devices nos CI Runs #30 e #31 até ser igualado.

  | Diferença Android × iOS | Onde | Porquê | Decisão |
  |---|---|---|---|
  | Tamanho e "Add to cart" da PDP tocados por fração da janela no iOS | `ProdutoPage.comprarIOS` | conteúdo do sheet fora da árvore XCUITest (drafts iOS 13, 14, 49) | Marcio, 2026-10-15 |
  | Carrossel de indicação sem validação no iOS | `ProdutoPage.validarCarrosselDeIndicacao` | filhos do sheet fora da árvore | Marcio, 2026-10-15 |
  | CTA das Boas-vindas e alerta de localização por fração (só se faltar id) | `BasePage.iniciaAppIOS` | sem elemento na árvore; no build 349+ o CTA tem id | REQUIREMENTS (exceção obrigatória no iOS) |
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
  **2026-10-16 (Marcio):** o `autoGrantPermissions: true` do AVD (antiga linha 83) **saiu**; os diálogos
  de permissão do Android são tratados nos page objects pelo resource-id do `permissioncontroller`.
  No mesmo dia saíram também os dois `autoAcceptAlerts: true` do iOS (Device Farm e Remote Access):
  os alertas do sistema são aceitos ou negados nos page objects por `mobile: alert`. **Não sobrou
  nenhuma capability que aja no lugar do teste.**
- **Nunca alterar o `.claude/settings.json`** (decisão do Marcio, 2026-10-02). Isso inclui hooks,
  permissões e qualquer outra chave, mesmo quando houver algo aparentemente quebrado nele, como o
  `gsd-secret-read-guard.js` registrado sem o arquivo existir. Achado ali vira registro no
  `STATE.md` para o Marcio decidir, nunca correção.
- **Sem impacto conhecido, não se muda o que funciona hoje** (decisão do Marcio, 2026-10-02).
  Uma mudança em configuração, dependência, hook ou infraestrutura cujo efeito no projeto não
  esteja medido não é feita. O que existe e funciona fica como está, e a ideia vai para as
  pendências do `STATE.md` como "validar no futuro".
- **Documentação de elementos = UM build só, o último instalado** (Marcio, 2026-10-15, reforçada em
  2026-10-16). Vale para o `ELEMENTOS-SEM-TESTID.md` (Android), o `ELEMENTOS-SEM-TESTID-IOS.md` (iOS) e
  todos os drafts de `.planning/drafts/app-migrado/<plataforma>/`. A cada build novo que o Marcio instala
  e manda capturar:
  1. conferir todos os ids nos dumps desse build, inclusive os que o dev diz ter colocado (`TESTIDS-ALTERADOS.md`);
  2. **reescrever** os documentos no lugar: o que ganhou testID **sai** da lista de falta, o que mudou é
     corrigido no corpo, o build anterior é **descartado**;
  3. o que a captura não alcançou fica numa seção "Não conferido neste build", só com o nome.
  **Proibido:** seção ou coluna por build ("Build 352", "no 349 era", "acréscimo de…"), histórico de
  versões, e bug do app misturado (bug vai no `BUGS-APP-ANDROID.md` / `BUGS-APP-IOS.md`). No topo de cada
  documento, uma linha só: versão/build, data e pasta de capturas.

## Restrições conhecidas de ambiente

- O host Android do Device Farm roda Node 18; o `testspec-ios.yml` seleciona Node 18 via nvm
  porque o host iOS vem com Node 14, que quebra o WDIO 9.
- A lista de produtos tem 150 itens e leva mais de 20s para montar; continua hidratando
  depois do primeiro card aparecer.
- O banner do Insider é uma WebView que só publica a árvore de acessibilidade alguns
  segundos após aparecer.
- O estado "favoritado" não é exposto na árvore de acessibilidade — só o pixel muda. A
  asserção tem que ser na tela de Favoritos.
