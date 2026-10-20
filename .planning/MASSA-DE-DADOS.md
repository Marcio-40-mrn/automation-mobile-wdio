# MASSA DE DADOS

Dados usados nos testes e nas capturas. Este é o lugar onde eles ficam escritos. Segredos (senhas, chaves) não
entram aqui: só o nome da variável no `.env`.

## Contas

| Uso | Onde está |
|---|---|
| Conta local (AVD e Remote Access) | `CLIENT_USER` / `CLIENT_PASSWORD` no `.env` |
| Contas por device do CI | secrets do GitHub (ver `STATE.md`, "Atribuição de conta por device") |

## Contas criadas pela automação e pelas capturas (Criar Conta)

O Marcio decidiu (2026-10-16) que o cadastro vai até o fim e cria conta real. E-mail no padrão
`informatica.mrn+{texto}@gmail.com`, com `{texto}` = `cadastro-` + device normalizado + timestamp (base 36) +
sufixo aleatório: único por execução e por device, e nunca casa com as contas do CI (`qa`/`test` + número).
CPF gerado na hora, válido pelos 2 dígitos verificadores. Todos os campos preenchidos ficam registrados aqui e
no relatório Allure. **Senha registrada de propósito:** conta descartável, criada só para teste (pedido do
Marcio de anotar todos os dados preenchidos).

**No spec `test/specs/04-criar-conta.spec.ts`** os dados são gerados a cada execução por
`gerarDadosCadastro(device)` (`test/utils/massa.ts`): nome `Teste`, sobrenome `Automacao`, CPF válido aleatório,
nascimento aleatório entre 1970 e 1999, telefone `(11) 9xxxx-xxxx` aleatório, senha `Aramis@<4 letras><dígito>a`.
Cada execução anexa no Allure o "Dados do cadastro" com todos os campos; a linha é copiada para a tabela abaixo
quando o run é levantado. Inválidos usados no spec: e-mail `abc`, CPF `111.111.111-11`, telefone `1193`, senhas
UMA senha sorteada por execução entre `abc`, `abcdefgh`, `Abcdefgh` e `Abcdefg1` (Marcio, 2026-10-19, para reduzir o tempo; a sorteada aparece no nome do step) e confirmação diferente.

| Data | Origem | E-mail | Nome | Sobrenome | CPF | Nascimento | Telefone | Senha | Resultado |
|---|---|---|---|---|---|---|---|---|---|
| 2026-10-16 13:50 | captura Android (AVD-S24, build 506) | `informatica.mrn+cadastro-avd-s24-mvb7e8sd-xxny@gmail.com` | Teste | Automacao | `285.729.154-00` | 15/05/1990 | 11 933683272 | `Aramis@E8SD9a` | conta criada; senha aceita sem troca; cadastro concluiu e a conta ficou logada direto na Home (cap. 29), Menu mostrou "Teste Automacao" (cap. 30) |
| 2026-10-16 ~18:01 | captura iOS (Remote Access, build 1.21.7/352) | `informatica.mrn+cadastro-ios-mvbfy8l1-nrhv@gmail.com` | Teste | Automacao | `842.523.377-12` | 15/03/1990 | (11) 96384-7205 | `Aramis@57189a` | conta criada; Home logada direto após o 2º toque em finalizar, Menu mostrou "TA Teste Automacao" (cap. 43); logout feito em seguida. E-mail lido no print (`l`/`1` ambíguos na fonte); login confirmado na captura das ~19h (`captures-2026-10-16-build352-compra`), que salvou nela o endereço Av. Paulista 1000, CEP 01310-100, destinatário Teste Automacao. Estado final: Mochila vazia, sem favoritos, sem pedidos, deslogada |
| 2026-10-18 ~21:30 | CI Run #24, Device Farm, Samsung Galaxy S23 Ultra | `informatica.mrn+cadastro-samsung-galaxy-s23-u-mvejtj3p-nkur@gmail.com` | Teste | Automacao | `856.566.187-30` | 23/04/1980 | (11) 94795-9941 | `Aramis@QWVE6a` | conta criada (spec 04 PASSED neste device; dados do `Test spec output`) |
| 2026-10-18 ~21:30 | CI Run #24, Device Farm, Samsung Galaxy S24 Ultra | `informatica.mrn+cadastro-samsung-galaxy-s24-u-mvein5tg-fc13@gmail.com` | Teste | Automacao | `272.262.087-17` | 18/08/1984 | (11) 93850-2237 | `Aramis@RMDJ6a` | conta criada (spec 04 PASSED neste device; dados do `Test spec output`) |
| 2026-10-18 ~21:30 | CI Run #24, Device Farm, Samsung Galaxy S24+ | `informatica.mrn+cadastro-samsung-galaxy-s24-mveje2sh-slz0@gmail.com` | Teste | Automacao | `621.911.278-43` | 26/03/1973 | (11) 97659-3433 | `Aramis@EFGK5a` | conta criada (spec 04 PASSED neste device; dados do `Test spec output`) |
| 2026-10-18 ~21:30 | CI Run #24, Device Farm, Samsung Galaxy S25 Ultra | `informatica.mrn+cadastro-samsung-galaxy-s25-u-mvejfjfj-cmq2@gmail.com` | Teste | Automacao | `416.503.081-32` | 12/02/1997 | (11) 95025-0667 | `Aramis@LQZB9a` | conta criada (spec 04 PASSED neste device; dados do `Test spec output`) |
| 2026-10-19 | captura Android (AVD-S24, build 1.22.0/509, `captures-2026-10-19-qa160/`), conta do CI recriada | `aaliyahrochanascimento087+qa160@gmail.com` | Aaliyah | Rocha Nascimento | `384.915.267-73` | 01/01/1990 | (11) 98765-4321 | não registrada (= `CLIENT_PASSWORD`) | conta criada; Home logada direto após o 2º toque em finalizar; logout e novo login funcionaram |

## Compra

| Dado | Valor | Origem |
|---|---|---|
| Termo de busca | `óculos` | `PRODUTO_BUSCA` em `test/specs/02-compra-pix.spec.ts` |
| Segundo produto | 1ª camisa de Categorias → Roupas → Camisas (sem nome fixo) | spec `02-compra-pix` |
| Endereço de entrega | o salvo na conta: Av. Paulista, 1000 | cadastrado na 2ª leva do M5 (2026-09-29) |
| Endereço das contas do CI | CEP 01310-100, Av. Paulista 1000, destinatário Teste Automacao | cadastrado no AVD em 2026-10-19 nas 10 contas do CI que logaram no 508 (a `marciorocha` já tinha); a `qa160` (conta recriada no 509 pelo cadastro) **ficou com o endereço**: formulário preenchido e salvo no checkout (`captures-2026-10-19-qa160/` caps. 49–57, a Entrega abriu em seguida); a reentrada pela lista de endereços não foi conferida nela. Persistência provada na `test150` (build 508: logout, force-stop, login, checkout abriu a lista) |
| Desconto do Pix | 10% sobre os produtos | `DESCONTO_PIX` no spec `02-compra-pix` |

## Cartão de crédito (fake)

Gerado em 2026-10-15, a pedido do Marcio ("gere dados fake de cartão"), por script local. O número só passa no
dígito verificador (Luhn). **Não é cartão de teste do gateway:** espera-se que o pagamento seja recusado.

| Campo | Valor |
|---|---|
| Bandeira | Visa |
| Número | `4693 5775 7175 8219` |
| Validade | `12/30` |
| CVV | `123` |
| Nome impresso | `TESTE AUTOMACAO` |
| CPF do titular | `598.998.115-56` (fake, válido pelo dígito verificador; gerado em 2026-10-15 pelo mesmo algoritmo do 4devs, a pedido do Marcio) |

Para ver um pagamento aprovado, é preciso um cartão de teste aceito pelo ambiente. Esse cartão **não está escrito**
e tem que vir do time do app.

## Pendente: gerador de massa na automação (pedido do Marcio, 2026-10-15)

Hoje o cartão e o CPF acima são **fixos**, gerados uma vez à mão para a captura. O Marcio quer que a automação
**gere a massa no momento da execução**, a cada teste, com uma biblioteca de dados fake ou algo equivalente.
Ainda não planejado nem implementado.

O que precisa ser gerado, pelo que os fluxos pedem até agora:

| Dado | Regra de validade | Usado em |
|---|---|---|
| Número de cartão | dígito verificador Luhn, prefixo da bandeira (Visa `4…`) | compra com cartão |
| Validade e CVV | validade futura (MM/AA), CVV de 3 dígitos | compra com cartão |
| Nome do titular | texto qualquer | compra com cartão |
| CPF | os 2 dígitos verificadores do CPF | formulário de cartão (se pedir) e Criar Conta (M6, Etapa 5) |
| E-mail | `informatica.mrn+{texto}@gmail.com`, nunca `@example.com` | já existe: `gerarEmailFicticio()` em `test/utils/massa.ts` |

Pontos a decidir quando for planejado:

- **Com ou sem dependência nova.** Uma lib como `@faker-js/faker` (locale `pt_BR`) entra como devDependency, e
  pela regra do projeto **toda devDependency nova exige um run real do Device Farm antes do merge** (o host
  roda `npm install` em Node 18). Os cálculos do cartão (Luhn) e do CPF são curtos e podem ficar no próprio
  `test/utils/massa.ts`, que hoje é um módulo puro sem imports. Foi assim que os valores acima foram gerados.
- **Aleatório × reproduzível.** Gerar a cada execução e registrar o valor usado no Allure, para que uma falha
  possa ser repetida com o mesmo dado.
- **Cartão aprovado.** Um número só válido pelo Luhn leva à recusa do pagamento. Para testar a aprovação é
  preciso um cartão de teste do gateway, que não se gera: tem que vir do time do app.

## Pedidos reais criados pela automação e pelas capturas

O Marcio autorizou (2026-10-15) finalizar pedidos reais nas capturas, no Pix e no cartão. Todos ficam "aguardando
pagamento" na conta `CLIENT_USER`.

| Data | Pedido(s) | Origem |
|---|---|---|
| 2026-10-14 | #126885 e #126932 | captura Android, rodada 1 (1 toque, 2 pedidos) |
| 2026-10-14 | #127457 | compra feita à mão pelo Marcio, 1 produto |
| 2026-10-14 | #127635 e #127673 | captura Android, rodada 2 (1 toque, 2 pedidos) |
| 2026-10-14 20:43 | #128763 | run do spec `02-compra-pix` no AVD |
| 2026-10-15 11:14 | #134367 e #134409 | run do spec `02-compra-pix` no AVD (parou na tela do Pix); os dois já aparecem como "Pedido Cancelado" |
| 2026-10-15 | #139889 (R$ 629,91) e #139933 (R$ 719,91) | captura iOS Pix, build 349, 1 toque em finalizar, 2 pedidos; QR do Pix não carregou |
| 2026-10-15 22:21 | #145112 (R$ 629,91; o 2º pedido, da camisa, não aparece na tela) | run do spec `02-compra-pix` no iOS (Remote Access, build 350); QR carregou |
| 2026-10-15 (noite) | #146214 (R$ 716,80, 1 calça + frete; cartão fake, Cancelado) | captura Android do cartão, build 506, 1 toque, 1 pedido |
| 2026-10-15 | #140130 (R$ 699,90) e #140139 (R$ 799,90) | captura iOS cartão fake, build 349, 1 toque, 2 pedidos, os dois "Pedido Cancelado" |
| 2026-10-18 | #178710 (R$ 196,81: polo M R$ 199,90 + frete 16,90 − Pix 19,99) | captura iOS Pix (Remote Access, build presumido 1.21.7/352, `captures-2026-10-18-pix-ate-pedido/`), 1 toque, 1 pedido; QR carregou; ficou "Aguardando Pagamento" |
| 2026-10-18 | #180606 (R$ 1.349,82: óculos R$ 699,90 + camisa R$ 799,90, frete 0 − Pix 149,98) | run do Marcio `02-compra-pix` iOS (Remote Access, 1.21.7/352), 13:37–13:47, **PASSOU**; QR carregou; mesmo número na tela do Pix e em Meus pedidos |
| 2026-10-19 | #201280 (R$ 716,80: calça R$ 699,90 + frete 16,90; cartão fake, Cancelado; Meus pedidos mostra a data 20/10/2026, relógio do AVD) | captura Android do cartão, build 1.22.0/509 (`captures-2026-10-19-build509-run25/`), conta `marciorocha`, 1 toque, 1 pedido; a tela nova "Não conseguimos aprovar o pagamento" apareceu no lugar do modal antifraude. O Pix foi levado só até o Resumo, sem finalizar |

Os pedidos de runs não listados aqui não foram anotados. A tabela é atualizada a cada captura ou run que
finalizar uma compra.
