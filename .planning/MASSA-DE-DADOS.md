# MASSA DE DADOS

Dados usados nos testes e nas capturas. Este é o lugar onde eles ficam escritos. Segredos (senhas, chaves) não
entram aqui: só o nome da variável no `.env`.

## Contas

| Uso | Onde está |
|---|---|
| Conta local (AVD e Remote Access) | `CLIENT_USER` / `CLIENT_PASSWORD` no `.env` |
| Contas por device do CI | secrets do GitHub (ver `STATE.md`, "Atribuição de conta por device") |
| E-mail inexistente (LOG-05) | gerado em runtime por `gerarEmailFicticio()` em `test/utils/massa.ts`: `informatica.mrn+log05-<device>-<ts>-<rand>@gmail.com` |
| Senha inválida (LOG-05) | `Senha-Invalida-0000` (`gerarSenhaFicticia()`, `test/utils/massa.ts`) |

## Compra

| Dado | Valor | Origem |
|---|---|---|
| Termo de busca | `óculos` | `PRODUTO_BUSCA` em `test/specs/04-compra-pix.spec.ts` |
| Segundo produto | 1ª camisa de Categorias → Roupas → Camisas (sem nome fixo) | spec `04-compra-pix` |
| Endereço de entrega | o salvo na conta: Av. Paulista, 1000 | cadastrado na 2ª leva do M5 (2026-09-29) |
| Desconto do Pix | 10% sobre os produtos | `DESCONTO_PIX` no spec `04-compra-pix` |

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
| 2026-10-14 20:43 | #128763 | run do spec `04-compra-pix` no AVD |
| 2026-10-15 11:14 | #134367 e #134409 | run do spec `04-compra-pix` no AVD (parou na tela do Pix); os dois já aparecem como "Pedido Cancelado" |
| 2026-10-15 | #139889 (R$ 629,91) e #139933 (R$ 719,91) | captura iOS Pix, build 349, 1 toque em finalizar, 2 pedidos; QR do Pix não carregou |
| 2026-10-15 | #140130 (R$ 699,90) e #140139 (R$ 799,90) | captura iOS cartão fake, build 349, 1 toque, 2 pedidos, os dois "Pedido Cancelado" |

Os pedidos de runs não listados aqui não foram anotados. A tabela é atualizada a cada captura ou run que
finalizar uma compra.
