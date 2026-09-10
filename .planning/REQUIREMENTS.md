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

## Restrições conhecidas de ambiente

- O host Android do Device Farm roda Node 18; o `testspec-ios.yml` seleciona Node 18 via nvm
  porque o host iOS vem com Node 14, que quebra o WDIO 9.
- A lista de produtos tem 150 itens e leva mais de 20s para montar; continua hidratando
  depois do primeiro card aparecer.
- O banner do Insider é uma WebView que só publica a árvore de acessibilidade alguns
  segundos após aparecer.
- O estado "favoritado" não é exposto na árvore de acessibilidade — só o pixel muda. A
  asserção tem que ser na tela de Favoritos.
