<!-- Cenários passados pelo Marcio em 2026-11-06, texto original. Análise de automação: .planning/drafts/app-migrado/android/ANALISE-COMPARTILHAR-CARRINHO.md -->

# ANÁLISE E GERAÇÃO DE CENÁRIOS DE TESTE — COMPARTILHAMENTO DE CARRINHO

---

## 1. ANÁLISE DAS REGRAS DE NEGÓCIO

### 1.1 Resumo Funcional

A funcionalidade permite que um cliente com itens no carrinho do aplicativo mobile gere um link de compartilhamento e o envie para outras pessoas. O destinatário, ao abrir o link, visualiza os mesmos produtos selecionados pelo remetente, podendo adicionar itens, editar o carrinho e finalizar a compra. O link carrega produtos, variações, quantidades, CDV e cupons públicos, preservando rastreabilidade via UTM e eventos de analytics. O carrinho do remetente nunca é alterado. Dados pessoais nunca são expostos. O comportamento varia conforme o destinatário ter ou não o app instalado, ter ou não itens no carrinho e ter ou não login ativo.

---

### 1.2 Regras Identificadas (numeradas)

| # | Regra |
|---|-------|
| R01 | O botão "Compartilhar carrinho" aparece no carrinho somente quando há pelo menos 1 item. |
| R02 | Ao tocar no botão, o app gera o link e abre o menu de compartilhamento nativo do celular. |
| R03 | O link armazena produtos, variações (cor e tamanho) e quantidades do momento do compartilhamento. |
| R04 | O link carrega o CDV aplicado ao carrinho, quando houver. |
| R05 | O link carrega somente cupons compartilháveis (genéricos/públicos). |
| R06 | Cupons exclusivos (colaborador, influenciador, primeira compra etc.) nunca são carregados no link. |
| R07 | O link não expõe dados pessoais do remetente (nome, CPF, endereço ou e-mail). |
| R08 | Compartilhar não altera o carrinho do remetente. |
| R09 | Com o app instalado, o link abre o app diretamente no carrinho. |
| R10 | Sem o app instalado, o link abre o carrinho no site https://applink.aramis.com.br/. |
| R11 | Se o destinatário já tem itens no carrinho, os itens do link são somados ao carrinho existente. |
| R12 | Ao somar os itens, o aviso "Itens adicionados a partir de um carrinho compartilhado" é exibido. |
| R13 | Preço, estoque e promoções são recalculados na abertura do link. Vale o preço atual e estoque atual. |
| R14 | O carrinho pode ser visualizado sem login. A finalização segue o fluxo normal de login/cadastro. |
| R15 | O destinatário pode adicionar novos produtos, remover itens e alterar quantidade e variação. |
| R16 | Alterações feitas pelo destinatário não afetam o carrinho do remetente. |
| R17 | O CDV do link permanece aplicado após as alterações feitas pelo destinatário. |
| R18 | Se o destinatário já tiver um CDV ativo, prevalece [regra a definir com Comercial] — cenário de conflito de CDV. |
| R19 | O cupom é recalculado após as alterações conforme elegibilidade do CPF do destinatário. |
| R20 | Se o destinatário não for elegível ao cupom, exibe "Este cupom não está disponível". |
| R21 | A URL contém utm_source=app, utm_medium=compartilhamento e utm_campaign=carrinho_compartilhado. |
| R22 | O evento share_cart é registrado quando o link é gerado e compartilhado, com quantidade de itens e valor do carrinho. |
| R23 | O evento open_shared_cart é registrado quando o destinatário abre o link, indicando app ou site. |
| R24 | O evento shared_cart_purchase é registrado ao finalizar o pedido, com valor total, itens originais e itens adicionados. |
| R25 | A origem "compartilhamento" é mantida até a finalização do pedido. |
| R26 | As UTMs não substituem o CDV. Ambas as atribuições convivem. |
| R27 | Falha ao gerar o link: exibir mensagem já existente e opção de tentar novamente. |
| R28 | Remetente cancela o compartilhamento: o evento share_cart não é registrado. |
| R29 | Link expirado ou inválido: exibir "Carrinho não está mais disponível." e direcionar para a home. |
| R30 | Produto ou variação sem estoque: o item não é adicionado e aparece um aviso. |
| R31 | Todos os itens indisponíveis: aviso e direcionamento para a vitrine. |
| R32 | Quantidade maior que o estoque disponível: ajusta para o máximo disponível com aviso. |
| R33 | Preço alterado desde o compartilhamento: sinalização no item. |
| R34 | Cupom expirado ou esgotado: não é aplicado e não bloqueia a abertura do carrinho. |
| R35 | Link aberto pelo navegador interno do WhatsApp/Instagram: o fluxo funciona normalmente. |

---

### 1.3 Estados / Condições / Limites Identificados

**Estados do Carrinho do Remetente:**
- Carrinho vazio → botão ausente
- Carrinho com 1+ itens → botão visível
- Link gerado com sucesso
- Falha na geração do link
- Compartilhamento cancelado pelo remetente

**Estados do Carrinho do Destinatário:**
- Carrinho vazio, sem app instalado
- Carrinho vazio, com app instalado
- Carrinho com itens existentes, com app instalado
- Carrinho visualizado sem login
- Carrinho em processo de finalização (login/cadastro)

**Estados dos Itens no Link:**
- Item com estoque disponível e preço inalterado
- Item com estoque insuficiente (quantidade ajustada)
- Item sem estoque (não adicionado)
- Todos os itens sem estoque
- Item com preço alterado desde o compartilhamento

**Estados do Cupom:**
- Sem cupom no link
- Cupom público/genérico (compartilhável)
- Cupom exclusivo (não deve ser carregado)
- Cupom expirado ou esgotado
- Destinatário não elegível ao cupom

**Estados do CDV:**
- Sem CDV no carrinho do remetente
- Com CDV no carrinho do remetente
- Destinatário sem CDV ativo
- Destinatário com CDV ativo (conflito — regra a definir)

**Limites Numéricos:**
- Quantidade de itens no carrinho: limite inferior = 0 (botão oculto), limite inferior válido = 1 (botão visível)
- Quantidade de item: quantidade solicitada > estoque disponível → ajuste para o máximo

---

## 2. APLICAÇÃO DAS TÉCNICAS

### 2.1 Particionamento de Equivalência (EP)

| Entrada / Condição | Partição Válida | Partição Inválida |
|---|---|---|
| Quantidade de itens no carrinho | ≥ 1 item | 0 itens (carrinho vazio) |
| Tipo de cupom no link | Cupom público/genérico | Cupom exclusivo (colaborador, influenciador, primeira compra) |
| App instalado no dispositivo do destinatário | App instalado | App não instalado |
| Destinatário com carrinho | Carrinho vazio | Carrinho com itens existentes |
| Login do destinatário | Logado | Não logado |
| Estoque dos itens | Todos disponíveis | Alguns sem estoque / Todos sem estoque |
| Quantidade solicitada vs estoque | Quantidade ≤ estoque | Quantidade > estoque |
| Status do link | Link válido e ativo | Link expirado / Link inválido |
| Cupom no momento da abertura | Cupom válido e elegível | Cupom expirado / Destinatário não elegível |
| Ambiente de abertura do link | App nativo / Navegador externo | Navegador interno do WhatsApp/Instagram |

---

### 2.2 Análise de Valor Limite (BVA)

**Limite: quantidade mínima de itens para exibir o botão "Compartilhar carrinho"**

| Valor | Situação | Resultado Esperado |
|---|---|---|
| 0 itens | Abaixo do limite inferior | Botão não exibido |
| 1 item | No limite inferior válido | Botão exibido |
| 2+ itens | Acima do limite inferior | Botão exibido |

**Limite: quantidade do item vs. estoque disponível**

| Valor | Situação | Resultado Esperado |
|---|---|---|
| Quantidade < estoque | Abaixo do limite | Quantidade mantida conforme compartilhamento |
| Quantidade = estoque | No limite superior | Quantidade mantida conforme compartilhamento |
| Quantidade > estoque | Acima do limite superior | Quantidade ajustada para o máximo disponível + aviso |
| Estoque = 0 | Limite zero | Item não adicionado + aviso |

---

### 2.3 Tabela de Decisão

**Tabela 1 — Geração e Compartilhamento do Link**

| Condição | C1 | C2 | C3 | C4 |
|---|---|---|---|---|
| Carrinho possui ≥ 1 item? | Não | Sim | Sim | Sim |
| Geração do link bem-sucedida? | — | Sim | Não | Sim |
| Remetente confirma compartilhamento? | — | Sim | — | Não |
| **Resultado: Botão visível** | Não | Sim | Sim | Sim |
| **Resultado: Menu de compartilhamento aberto** | Não | Sim | Não | Não |
| **Resultado: Evento share_cart registrado** | Não | Sim | Não | Não |
| **Resultado: Mensagem de erro + tentar novamente** | Não | Não | Sim | Não |

**Tabela 2 — Abertura do Link pelo Destinatário**

| Condição | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|
| Link válido? | Não | Sim | Sim | Sim | Sim |
| App instalado? | — | Sim | Não | Sim | Sim |
| Destinatário tem itens no carrinho? | — | Não | — | Sim | Não |
| **Resultado: Abre app no carrinho** | Não | Sim | Não | Sim | Sim |
| **Resultado: Abre no site** | Não | Não | Sim | Não | Não |
| **Resultado: Itens somados ao carrinho existente** | Não | Não | Não | Sim | Não |
| **Resultado: Aviso "Itens adicionados..."** | Não | Não | Não | Sim | Não |
| **Resultado: Mensagem "Carrinho não está mais disponível."** | Sim | Não | Não | Não | Não |
| **Resultado: Direcionamento para a home** | Sim | Não | Não | Não | Não |
| **Resultado: Evento open_shared_cart registrado** | Não | Sim | Sim | Sim | Sim |

**Tabela 3 — Cupom no Link**

| Condição | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|
| Cupom presente no carrinho do remetente? | Não | Sim | Sim | Sim | Sim |
| Tipo do cupom: público/genérico? | — | Sim | Não | Sim | Sim |
| Destinatário é elegível ao cupom? | — | Sim | — | Não | Sim |
| Cupom válido (não expirado/esgotado)? | — | Sim | — | Sim | Não |
| **Resultado: Cupom carregado no link** | Não | Sim | Não | Sim | Sim |
| **Resultado: Cupom aplicado ao carrinho do destinatário** | Não | Sim | Não | Não | Não |
| **Resultado: "Este cupom não está disponível"** | Não | Não | Não | Sim | Não |
| **Resultado: Cupom não aplicado, carrinho abre normalmente** | Não | Não | Não | Não | Sim |

**Tabela 4 — CDV no Link**

| Condição | C1 | C2 | C3 |
|---|---|---|---|
| CDV aplicado no carrinho do remetente? | Não | Sim | Sim |
| Destinatário já tem CDV ativo? | — | Não | Sim |
| **Resultado: CDV carregado no link** | Não | Sim | Sim |
| **Resultado: CDV do link aplicado ao carrinho** | Não | Sim | Regra a definir |
| **Resultado: UTMs convivem com CDV** | Não | Sim | Sim |

**Tabela 5 — Disponibilidade dos Itens na Abertura**

| Condição | C1 | C2 | C3 | C4 |
|---|---|---|---|---|
| Todos os itens com estoque? | Sim | Não (parcial) | Não (total) | Sim |
| Quantidade solicitada ≤ estoque disponível? | Sim | — | — | Não |
| **Resultado: Todos os itens adicionados normalmente** | Sim | Não | Não | Não |
| **Resultado: Item sem estoque não adicionado + aviso** | Não | Sim | Sim | Não |
| **Resultado: Direcionamento para vitrine** | Não | Não | Sim | Não |
| **Resultado: Quantidade ajustada para máximo + aviso** | Não | Não | Não | Sim |

---

### 2.4 Transição de Estado

**Estados do Link:**
- `Não gerado` → `Gerado` (evento: toque no botão + geração bem-sucedida)
- `Gerado` → `Compartilhado` (evento: confirmação no menu de compartilhamento)
- `Gerado` → `Cancelado` (evento: remetente cancela o menu de compartilhamento)
- `Compartilhado` → `Aberto` (evento: destinatário abre o link)
- `Compartilhado` → `Expirado/Inválido` (evento: link vence ou se torna inválido)
- `Aberto` → `Finalizado` (evento: destinatário conclui a compra)

**Transições válidas a cobrir:**
1. Não gerado → Gerado → Compartilhado → Aberto → Finalizado (fluxo completo)
2. Gerado → Cancelado (cancelamento antes de compartilhar)
3. Compartilhado → Expirado → Tentativa de abertura (link inválido)

**Transições inválidas a cobrir:**
1. Tentativa de geração com carrinho vazio
2. Tentativa de abertura de link já expirado

---

### 2.5 Caso de Uso

**UC01 — Remetente compartilha o carrinho (fluxo principal)**
- Fluxo principal: cliente com itens no carrinho toca "Compartilhar carrinho", link é gerado, menu nativo é aberto, link é compartilhado via WhatsApp.
- Fluxo alternativo: compartilhamento via SMS, Instagram, copiar link.
- Fluxo de erro: falha na geração do link.
- Fluxo de cancelamento: remetente fecha o menu sem compartilhar.

**UC02 — Destinatário abre o link com app instalado**
- Fluxo principal: app instalado, carrinho vazio, abre direto no carrinho do app.
- Fluxo alternativo: app instalado, carrinho com itens → itens somados + aviso.
- Fluxo de erro: link expirado → mensagem + redirecionamento para home.

**UC03 — Destinatário abre o link sem app instalado**
- Fluxo principal: abre no site https://applink.aramis.com.br/.
- Fluxo alternativo: abre pelo navegador interno do WhatsApp/Instagram.

**UC04 — Destinatário edita e finaliza o carrinho**
- Fluxo principal: destinatário adiciona item, remove item, altera quantidade, finaliza a compra logado.
- Fluxo alternativo: destinatário visualiza sem login e faz login/cadastro na finalização.
- Fluxo de erro: item que tenta adicionar está sem estoque.

---

## 3. CENÁRIOS DE TESTE EM GHERKIN

```gherkin
Funcionalidade: Exibição do botão "Compartilhar carrinho"

  # Técnica: BVA
  # Tipo: Mobile
  Cenário: Botão "Compartilhar carrinho" não exibido quando o carrinho está vazio
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho não possui nenhum item
    Quando o cliente visualiza a tela do carrinho
    Então o botão "Compartilhar carrinho" não deve ser exibido

  # Técnica: BVA
  # Tipo: Mobile
  Cenário: Botão "Compartilhar carrinho" exibido com exatamente 1 item no carrinho
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui exatamente 1 item adicionado
    Quando o cliente visualiza a tela do carrinho
    Então o botão "Compartilhar carrinho" deve ser exibido

  # Técnica: EP
  # Tipo: Mobile
  Cenário: Botão "Compartilhar carrinho" exibido com múltiplos itens no carrinho
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui mais de 1 item adicionado
    Quando o cliente visualiza a tela do carrinho
    Então o botão "Compartilhar carrinho" deve ser exibido


Funcionalidade: Geração e compartilhamento do link do carrinho

  # Técnica: Caso de Uso
  # Tipo: Mobile
  Cenário: Geração do link e abertura do menu de compartilhamento nativo ao tocar no botão
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui pelo menos 1 item adicionado
    Quando o cliente toca no botão "Compartilhar carrinho"
    Então o app deve gerar um link do carrinho
    E o menu de compartilhamento nativo do celular deve ser aberto com as opções disponíveis (WhatsApp, Instagram, SMS, copiar link, entre outras)

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Link gerado contém os produtos, variações e quantidades do momento do compartilhamento
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui um item "Camiseta Polo" na cor "Azul", tamanho "M" e quantidade "2"
    Quando o cliente toca no botão "Compartilhar carrinho" e o link é gerado com sucesso
    Então o link gerado deve conter o item "Camiseta Polo" com a variação cor "Azul", tamanho "M" e quantidade "2"

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Link gerado contém o CDV aplicado ao carrinho do remetente
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui pelo menos 1 item
    E o CDV "CDV123" está aplicado ao carrinho
    Quando o cliente toca no botão "Compartilhar carrinho" e o link é gerado com sucesso
    Então o link gerado deve conter o CDV "CDV123"

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Link gerado não contém CDV quando nenhum CDV está aplicado ao carrinho
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui pelo menos 1 item
    E nenhum CDV está aplicado ao carrinho
    Quando o cliente toca no botão "Compartilhar carrinho" e o link é gerado com sucesso
    Então o link gerado não deve conter nenhum CDV

  # Técnica: Tabela de Decisão — Cupons
  # Tipo: Mobile
  Cenário: Link gerado contém cupom público aplicado ao carrinho do remetente
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui pelo menos 1 item
    E o cupom público "DESCONTO10" está aplicado ao carrinho
    Quando o cliente toca no botão "Compartilhar carrinho" e o link é gerado com sucesso
    Então o link gerado deve conter o cupom "DESCONTO10"

  # Técnica: Tabela de Decisão — Cupons
  # Tipo: Mobile
  Cenário: Link gerado não contém cupom exclusivo de colaborador aplicado ao carrinho do remetente
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui pelo menos 1 item
    E o cupom exclusivo de colaborador "COLAB2024" está aplicado ao carrinho
    Quando o cliente toca no botão "Compartilhar carrinho" e o link é gerado com sucesso
    Então o link gerado não deve conter o cupom "COLAB2024"

  # Técnica: EP
  # Tipo: Mobile
  Cenário: Link gerado não contém cupom exclusivo de influenciador
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui pelo menos 1 item
    E o cupom exclusivo de influenciador "INFLUENCER50" está aplicado ao carrinho
    Quando o cliente toca no botão "Compartilhar carrinho" e o link é gerado com sucesso
    Então o link gerado não deve conter o cupom "INFLUENCER50"

  # Técnica: EP
  # Tipo: Mobile
  Cenário: Link gerado não contém cupom exclusivo de primeira compra
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui pelo menos 1 item
    E o cupom de primeira compra "PRIMEIRAVEZ" está aplicado ao carrinho
    Quando o cliente toca no botão "Compartilhar carrinho" e o link é gerado com sucesso
    Então o link gerado não deve conter o cupom "PRIMEIRAVEZ"

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Link gerado não expõe dados pessoais do remetente
    Dado que o cliente está autenticado no app com nome, CPF, endereço e e-mail cadastrados
    E o carrinho possui pelo menos 1 item
    Quando o cliente toca no botão "Compartilhar carrinho" e o link é gerado com sucesso
    Então o link gerado não deve conter o nome do remetente
    E o link gerado não deve conter o CPF do remetente
    E o link gerado não deve conter o endereço do remetente
    E o link gerado não deve conter o e-mail do remetente

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Compartilhamento não altera o carrinho do remetente
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui os itens "Camiseta Polo" (cor Azul, tamanho M, quantidade 2) e "Calça Chino" (cor Preta, tamanho 40, quantidade 1)
    Quando o cliente toca no botão "Compartilhar carrinho"
    E o link é gerado e compartilhado com sucesso
    Então o carrinho do remetente deve continuar com os mesmos itens "Camiseta Polo" (cor Azul, tamanho M, quantidade 2) e "Calça Chino" (cor Preta, tamanho 40, quantidade 1)

  # Técnica: Transição de Estado
  # Tipo: Mobile
  Cenário: Evento share_cart registrado ao confirmar o compartilhamento
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui 3 itens com valor total de R$ 350,00
    Quando o cliente toca no botão "Compartilhar carrinho"
    E o link é gerado com sucesso
    E o cliente confirma o compartilhamento pelo menu nativo
    Então o evento "share_cart" deve ser registrado
    E o evento deve conter a quantidade de 3 itens
    E o evento deve conter o valor do carrinho de R$ 350,00

  # Técnica: Transição de Estado
  # Tipo: Mobile
  Cenário: Evento share_cart não registrado quando o remetente cancela o compartilhamento
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui pelo menos 1 item
    Quando o cliente toca no botão "Compartilhar carrinho"
    E o link é gerado com sucesso
    E o cliente fecha o menu de compartilhamento sem confirmar o envio
    Então o evento "share_cart" não deve ser registrado

  # Técnica: Caso de Uso — Fluxo de erro
  # Tipo: Mobile
  Cenário: Falha ao gerar o link exibe mensagem de erro com opção de tentar novamente
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui pelo menos 1 item
    E o sistema não consegue gerar o link por falha técnica
    Quando o cliente toca no botão "Compartilhar carrinho"
    Então a mensagem de erro padrão do sistema deve ser exibida
    E a opção de tentar novamente deve ser apresentada ao cliente


Funcionalidade: Abertura do link pelo destinatário

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Link aberto com app instalado abre o carrinho diretamente no app
    Dado que o destinatário recebeu um link de carrinho compartilhado válido
    E o destinatário possui o app instalado no celular
    E o carrinho do destinatário está vazio
    Quando o destinatário toca no link recebido
    Então o app deve ser aberto diretamente na tela do carrinho
    E os itens do link compartilhado devem estar presentes no carrinho

  # Técnica: Tabela de Decisão
  # Tipo: Web
  Cenário: Link aberto sem app instalado abre o carrinho no site
    Dado que o destinatário recebeu um link de carrinho compartilhado válido
    E o destinatário não possui o app instalado no celular
    Quando o destinatário toca no link recebido
    Então o carrinho deve ser aberto no site "https://applink.aramis.com.br/"
    E os itens do link compartilhado devem estar presentes no carrinho

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Itens do link são somados ao carrinho existente do destinatário com aviso
    Dado que o destinatário possui o app instalado no celular
    E o carrinho do destinatário já contém o item "Bermuda Jeans" (tamanho 40, quantidade 1)
    E o destinatário recebeu um link de carrinho compartilhado contendo o item "Camiseta Polo" (cor Branca, tamanho G, quantidade 1)
    Quando o destinatário abre o link
    Então o carrinho do destinatário deve conter o item "Bermuda Jeans" (tamanho 40, quantidade 1)
    E o carrinho do destinatário deve conter o item "Camiseta Polo" (cor Branca, tamanho G, quantidade 1)
    E a mensagem "Itens adicionados a partir de um carrinho compartilhado" deve ser exibida

  # Técnica: EP
  # Tipo: Mobile
  Cenário: Preço dos itens é recalculado com o valor atual ao abrir o link
    Dado que o destinatário recebeu um link de carrinho compartilhado
    E o preço de um item do link foi alterado desde o momento do compartilhamento
    E o destinatário possui o app instalado
    Quando o destinatário abre o link
    Então o item deve ser exibido no carrinho com o preço atual vigente
    E o item deve apresentar uma sinalização indicando que o preço foi alterado desde o compartilhamento

  # Técnica: EP
  # Tipo: Mobile
  Cenário: Estoque dos itens é recalculado com a disponibilidade atual ao abrir o link
    Dado que o destinatário recebeu um link de carrinho compartilhado contendo um item com estoque disponível no momento do compartilhamento
    E o estoque do item foi zerado após o compartilhamento
    E o destinatário possui o app instalado
    Quando o destinatário abre o link
    Então o item sem estoque não deve ser adicionado ao carrinho do destinatário
    E um aviso deve ser exibido informando a indisponibilidade do item

  # Técnica: EP
  # Tipo: Mobile
  Cenário: Carrinho pode ser visualizado pelo destinatário sem login
    Dado que o destinatário recebeu um link de carrinho compartilhado válido
    E o destinatário possui o app instalado
    E o destinatário não está autenticado no app
    Quando o destinatário abre o link
    Então o carrinho com os itens do link deve ser exibido normalmente sem exigir login

  # Técnica: Caso de Uso
  # Tipo: Mobile
  Cenário: Finalização da compra pelo destinatário segue o fluxo normal de login
    Dado que o destinatário está visualizando o carrinho aberto pelo link compartilhado sem estar autenticado
    Quando o destinatário toca no botão para finalizar a compra
    Então o fluxo de login ou cadastro deve ser iniciado normalmente

  # Técnica: Transição de Estado
  # Tipo: Todos
  Cenário: Evento open_shared_cart registrado ao abrir o link no app
    Dado que o destinatário recebeu um link de carrinho compartilhado válido
    E o destinatário possui o app instalado
    Quando o destinatário abre o link
    Então o evento "open_shared_cart" deve ser registrado
    E o evento deve indicar que a abertura ocorreu no "app"

  # Técnica: Transição de Estado
  # Tipo: Web
  Cenário: Evento open_shared_cart registrado ao abrir o link no site
    Dado que o destinatário recebeu um link de carrinho compartilhado válido
    E o destinatário não possui o app instalado
    Quando o destinatário abre o link
    Então o evento "open_shared_cart" deve ser registrado
    E o evento deve indicar que a abertura ocorreu no "site"

  # Técnica: EP
  # Tipo: Mobile
  Cenário: Link aberto pelo navegador interno do WhatsApp funciona normalmente
    Dado que o destinatário recebeu o link de carrinho compartilhado via WhatsApp
    E o destinatário abre o link pelo navegador interno do WhatsApp
    Quando o link é carregado
    Então o carrinho com os itens compartilhados deve ser exibido normalmente

  # Técnica: EP
  # Tipo: Mobile
  Cenário: Link aberto pelo navegador interno do Instagram funciona normalmente
    Dado que o destinatário recebeu o link de carrinho compartilhado via Instagram
    E o destinatário abre o link pelo navegador interno do Instagram
    Quando o link é carregado
    Então o carrinho com os itens compartilhados deve ser exibido normalmente


Funcionalidade: CDV no carrinho compartilhado

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: CDV do link permanece aplicado após o destinatário adicionar um novo item
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o CDV "CDV123"
    E o carrinho foi carregado com o CDV "CDV123" aplicado
    E o destinatário não possui nenhum CDV ativo próprio
    Quando o destinatário adiciona o item "Meia Esportiva" ao carrinho
    Então o CDV "CDV123" deve permanecer aplicado ao carrinho

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: CDV do link permanece aplicado após o destinatário remover um item
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o CDV "CDV123"
    E o carrinho foi carregado com os itens "Camiseta Polo" e "Calça Chino" e com o CDV "CDV123" aplicado
    E o destinatário não possui nenhum CDV ativo próprio
    Quando o destinatário remove o item "Calça Chino" do carrinho
    Então o CDV "CDV123" deve permanecer aplicado ao carrinho

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Alterações feitas pelo destinatário no carrinho não afetam o carrinho do remetente
    Dado que o remetente compartilhou um carrinho contendo os itens "Camiseta Polo" e "Bermuda Jeans"
    E o destinatário abriu o link e visualiza o carrinho com esses itens
    Quando o destinatário remove o item "Bermuda Jeans" do carrinho
    Então o carrinho do remetente deve continuar com os itens "Camiseta Polo" e "Bermuda Jeans" inalterados

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: UTMs e CDV convivem sem que as UTMs substituam o CDV
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o CDV "CDV123"
    E a URL contém os parâmetros utm_source=app, utm_medium=compartilhamento e utm_campaign=carrinho_compartilhado
    Quando o carrinho é carregado
    Então o CDV "CDV123" deve estar aplicado ao carrinho
    E os parâmetros UTM devem estar presentes na URL
    E o CDV "CDV123" não deve ter sido substituído pelas UTMs


Funcionalidade: Cupom no carrinho compartilhado

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Cupom público é recalculado conforme a elegibilidade do CPF do destinatário
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o cupom público "DESCONTO10"
    E o CPF do destinatário é elegível ao cupom "DESCONTO10"
    Quando o carrinho é carregado
    Então o cupom "DESCONTO10" deve ser aplicado ao carrinho do destinatário

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Cupom não aplicado quando destinatário não é elegível ao cupom do link
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o cupom público "DESCONTO10"
    E o CPF do destinatário não é elegível ao cupom "DESCONTO10"
    Quando o carrinho é carregado
    Então a mensagem "Este cupom não está disponível" deve ser exibida
    E o cupom "DESCONTO10" não deve ser aplicado ao carrinho do destinatário

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Cupom expirado não é aplicado e não bloqueia a abertura do carrinho
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o cupom "PROMO20" que está expirado
    Quando o carrinho é carregado
    Então o cupom "PROMO20" não deve ser aplicado ao carrinho do destinatário
    E o carrinho deve ser exibido normalmente com os itens do link

  # Técnica: EP
  # Tipo: Mobile
  Cenário: Cupom esgotado não é aplicado e não bloqueia a abertura do carrinho
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o cupom "SALDAO" que está esgotado
    Quando o carrinho é carregado
    Então o cupom "SALDAO" não deve ser aplicado ao carrinho do destinatário
    E o carrinho deve ser exibido normalmente com os itens do link

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Cupom recalculado após destinatário alterar itens do carrinho
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o cupom público "DESCONTO10"
    E o cupom "DESCONTO10" está aplicado ao carrinho do destinatário
    Quando o destinatário adiciona o item "Jaqueta Bomber" ao carrinho
    Então o cupom "DESCONTO10" deve ser recalculado conforme as regras de elegibilidade do CPF do destinatário


Funcionalidade: UTM e rastreabilidade de eventos

  # Técnica: Tabela de Decisão
  # Tipo: Todos
  Cenário: URL do link contém os parâmetros UTM obrigatórios
    Dado que o cliente está com o app aberto na tela do carrinho
    E o carrinho possui pelo menos 1 item
    Quando o cliente toca no botão "Compartilhar carrinho" e o link é gerado com sucesso
    Então a URL do link deve conter o parâmetro "utm_source=app"
    E a URL do link deve conter o parâmetro "utm_medium=compartilhamento"
    E a URL do link deve conter o parâmetro "utm_campaign=carrinho_compartilhado"

  # Técnica: Transição de Estado
  # Tipo: Todos
  Cenário: Origem "compartilhamento" é mantida até a finalização do pedido
    Dado que o destinatário abriu um link de carrinho compartilhado válido
    E o destinatário visualiza o carrinho carregado pelo link
    E o destinatário realiza a autenticação no app
    Quando o destinatário finaliza o pedido
    Então a origem "compartilhamento de carrinho" deve estar associada ao pedido finalizado

  # Técnica: Transição de Estado
  # Tipo: Todos
  Cenário: Evento shared_cart_purchase registrado ao finalizar o pedido com itens originais e adicionados
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o item "Camiseta Polo" (cor Azul, tamanho M)
    E o destinatário adicionou o item "Bermuda Jeans" ao carrinho
    E o destinatário realizou a autenticação e está na etapa de finalização
    Quando o destinatário confirma a finalização do pedido
    Então o evento "shared_cart_purchase" deve ser registrado
    E o evento deve conter o valor total do pedido
    E o evento deve identificar o item "Camiseta Polo" como item original do link
    E o evento deve identificar o item "Bermuda Jeans" como item adicionado pelo destinatário


Funcionalidade: Edição do carrinho pelo destinatário

  # Técnica: Caso de Uso
  # Tipo: Mobile
  Cenário: Destinatário adiciona um novo produto ao carrinho recebido pelo link
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o item "Camiseta Polo"
    E o carrinho está carregado com o item "Camiseta Polo"
    Quando o destinatário adiciona o item "Tênis Casual" ao carrinho
    Então o carrinho deve exibir o item "Camiseta Polo" e o item "Tênis Casual"

  # Técnica: Caso de Uso
  # Tipo: Mobile
  Cenário: Destinatário remove um item do carrinho recebido pelo link
    Dado que o destinatário abriu um link de carrinho compartilhado contendo os itens "Camiseta Polo" e "Calça Chino"
    Quando o destinatário remove o item "Calça Chino" do carrinho
    Então o carrinho deve exibir apenas o item "Camiseta Polo"

  # Técnica: Caso de Uso
  # Tipo: Mobile
  Cenário: Destinatário altera a quantidade de um item do carrinho recebido pelo link
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o item "Camiseta Polo" com quantidade 1
    E o estoque de "Camiseta Polo" é maior que 1
    Quando o destinatário altera a quantidade do item "Camiseta Polo" para 3
    Então o carrinho deve exibir o item "Camiseta Polo" com quantidade 3

  # Técnica: Caso de Uso
  # Tipo: Mobile
  Cenário: Destinatário altera a variação de um item do carrinho recebido pelo link
    Dado que o destinatário abriu um link de carrinho compartilhado contendo o item "Camiseta Polo" na cor "Azul" e tamanho "M"
    Quando o destinatário altera a variação do item para cor "Branca" e tamanho "G"
    Então o carrinho deve exibir o item "Camiseta Polo" na cor "Branca" e tamanho "G"


Funcionalidade: Exceções na abertura do link e disponibilidade de itens

  # Técnica: Tabela de Decisão
  # Tipo: Todos
  Cenário: Link expirado exibe mensagem e direciona para a home
    Dado que o destinatário recebeu um link de carrinho compartilhado que está expirado
    Quando o destinatário tenta abrir o link
    Então a mensagem "Carrinho não está mais disponível." deve ser exibida
    E o destinatário deve ser direcionado para a página inicial (home)

  # Técnica: EP
  # Tipo: Todos
  Cenário: Link inválido exibe mensagem e direciona para a home
    Dado que o destinatário recebeu um link de carrinho compartilhado com formato inválido
    Quando o destinatário tenta abrir o link
    Então a mensagem "Carrinho não está mais disponível." deve ser exibida
    E o destinatário deve ser direcionado para a página inicial (home)

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Item sem estoque não é adicionado ao carrinho do destinatário com aviso
    Dado que o destinatário recebeu um link de carrinho compartilhado contendo os itens "Camiseta Polo" e "Bermuda Jeans"
    E o item "Bermuda Jeans" está sem estoque no momento da abertura do link
    E o destinatário possui o app instalado
    Quando o destinatário abre o link
    Então o item "Camiseta Polo" deve ser adicionado normalmente ao carrinho
    E o item "Bermuda Jeans" não deve ser adicionado ao carrinho
    E um aviso deve ser exibido informando a indisponibilidade do item "Bermuda Jeans"

  # Técnica: Tabela de Decisão
  # Tipo: Mobile
  Cenário: Todos os itens do link sem estoque exibem aviso e direcionam para a vitrine
    Dado que o destinatário recebeu um link de carrinho compartilhado contendo os itens "Camiseta Polo" e "Bermuda Jeans"
    E todos os itens do link estão sem estoque no momento da abertura
    E o destinatário possui o app instalado
    Quando o destinatário abre o link
    Então nenhum item deve ser adicionado ao carrinho
    E um aviso de indisponibilidade deve ser exibido
    E o destinatário deve ser direcionado para a vitrine

  # Técnica: BVA
  # Tipo: Mobile
  Cenário: Quantidade do item ajustada para o máximo disponível em estoque com aviso
    Dado que o destinatário recebeu um link com o item "Camiseta Polo" na quantidade 5
    E o estoque disponível de "Camiseta Polo" é de 3 unidades no momento da abertura
    E o destinatário possui o app instalado
    Quando o destinatário abre o link
    Então a quantidade do item "Camiseta Polo" deve ser ajustada para 3
    E um aviso deve ser exibido informando o ajuste de quantidade

  # Técnica: BVA
  # Tipo: Mobile
  Cenário: Quantidade do item mantida quando é igual ao estoque disponível
    Dado que o destinatário recebeu um link com o item "Camiseta Polo" na quantidade 3
    E o estoque disponível de "Camiseta Polo" é exatamente 3 unidades no momento da abertura
    E o destinatário possui o app instalado
    Quando o destinatário abre o link
    Então a quantidade do item "Camiseta Polo" deve ser mantida como 3
    E nenhum aviso de ajuste de quantidade deve ser exibido

  # Técnica: EP
  # Tipo: Mobile
  Cenário: Item com preço alterado desde o compartilhamento é sinalizado no carrinho
    Dado que o destinatário recebeu um link de carrinho compartilhado contendo o item "Camiseta Polo" com preço de R$ 89,90 no momento do compartilhamento
    E o preço atual de "Camiseta Polo" é R$ 79,90
    E o destinatário possui o app instalado
    Quando o destinatário abre o link
    Então o item "Camiseta Polo" deve ser exibido com o preço atual de R$ 79,90
    E o item deve apresentar uma sinalização indicando alteração de preço desde o compartilhamento
```

---

## 4. SUGESTÕES DE TESTES NÃO FUNCIONAIS

### Desempenho

| Categoria | Sugestão |
|---|---|
| Desempenho | Verificar o tempo de geração do link ao tocar no botão "Compartilhar carrinho" com um carrinho contendo o volume máximo de itens permitido, garantindo que a resposta ocorra dentro do tempo aceitável para a experiência mobile. |
| Desempenho | Simular múltiplos destinatários abrindo o mesmo link compartilhado simultaneamente e verificar se o sistema mantém o tempo de resposta e a consistência dos dados de estoque e preço exibidos. |
| Desempenho | Avaliar o tempo de carregamento do carrinho no site https://applink.aramis.com.br/ para destinatários sem o app instalado, em condições de conexão 4G e Wi-Fi. |

### Segurança

| Categoria | Sugestão |
|---|---|
| Segurança | Verificar que a URL do link gerado não contém tokens de autenticação, sessão ou qualquer dado sensível do remetente que possa ser explorado por terceiros. |
| Segurança | Testar se é possível manipular manualmente os parâmetros da URL do link (produtos, quantidades, CDV, cupom) e verificar que o sistema rejeita ou ignora valores adulterados, aplicando somente os dados validados pelo servidor. |
| Segurança | Confirmar que o link não concede ao destinatário acesso a informações da conta do remetente (histórico de pedidos, endereços salvos, dados financeiros). |
| Segurança | Verificar que o compartilhamento do link não cria vulnerabilidade de CSRF ou session fixation no fluxo de abertura do carrinho pelo destinatário. |
| Segurança | Validar que cupons exclusivos não trafegam em nenhum parâmetro da URL, mesmo ofuscados ou codificados. |

### Confiabilidade

| Categoria | Sugestão |
|---|---|
| Confiabilidade | Verificar o comportamento do sistema ao tentar gerar o link com perda de conexão no momento do toque no botão, garantindo exibição da mensagem de erro e opção de nova tentativa. |
| Confiabilidade | Testar a abertura do link pelo destinatário em situação de conexão intermitente e verificar se os dados de estoque e preço são recalculados corretamente assim que a conexão é restabelecida. |
| Confiabilidade | Verificar que o carrinho do remetente permanece inalterado mesmo em cenários de falha durante a geração ou compartilhamento do link. |
| Confiabilidade | Garantir que o evento "share_cart" não é registrado em duplicidade caso o usuário toque rapidamente no botão de compartilhamento mais de uma vez. |

### Usabilidade

| Categoria | Sugestão |
|---|---|
| Usabilidade | Verificar se as mensagens de aviso (item indisponível, quantidade ajustada, preço alterado, cupom não disponível) são exibidas com clareza, em linguagem acessível e com destaque visual adequado. |
| Usabilidade | Avaliar se o aviso "Itens adicionados a partir de um carrinho compartilhado" é suficientemente visível para o destinatário distinguir os itens recém-adicionados dos seus itens preexistentes. |
| Usabilidade | Verificar se o fluxo de compartilhamento (toque no botão → geração → menu nativo) é fluido e não apresenta etapas desnecessárias ou confusas para o remetente. |
| Usabilidade | Testar a acessibilidade do botão "Compartilhar carrinho" e das mensagens de aviso com ferramentas de leitura de tela (VoiceOver no iOS e TalkBack no Android). |

### Manutenibilidade

| Categoria | Sugestão |
|---|---|
| Manutenibilidade | Verificar se a adição de um novo tipo de cupom exclusivo ao sistema não requer alteração no mecanismo de filtragem de cupons do link sem impactar os cupons públicos existentes. |
| Manutenibilidade | Garantir que a alteração da nomenclatura das UTMs (a validar com a equipe) pode ser feita de forma centralizada, sem necessidade de alterações em múltiplos pontos do código. |

### Portabilidade e Compatibilidade

| Categoria | Sugestão |
|---|---|
| Compatibilidade | Testar a geração, o compartilhamento e a abertura do link nas versões mínimas suportadas do iOS e Android definidas para o aplicativo. |
| Compatibilidade | Verificar o comportamento do link nos principais navegadores mobile (Safari, Chrome, Samsung Internet) para o fluxo do destinatário sem app instalado. |
| Compatibilidade | Validar a abertura do link nos navegadores internos das versões mais recentes do WhatsApp e do Instagram em iOS e Android. |
| Portabilidade | Verificar que o carrinho carregado no site https://applink.aramis.com.br/ é exibido corretamente em diferentes resoluções e tamanhos de tela de dispositivos móveis. |
| Compatibilidade | Testar o fluxo completo (geração → compartilhamento → abertura → finalização) em diferentes versões do app (versão atual e versão imediatamente anterior), garantindo compatibilidade retroativa dos links gerados. |
