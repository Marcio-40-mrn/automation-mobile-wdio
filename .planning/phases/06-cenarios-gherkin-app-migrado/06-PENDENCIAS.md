# Fase 06 — Pendências de massa de dados e acesso

Criado em 2026-09-30, na discussão da fase 6 (`06-CONTEXT.md`), a pedido do Marcio: o que
ficou pendente, de onde a estrutura precisa vir, e as opções para ele decidir depois.
Enquanto cada item não for decidido, os cenários dele ficam como **skip nomeado** — o motivo
aparece no relatório, nenhum valor é inventado.

## 1. Cupons — 6 cenários (Mochila)

| Cenário | Precisa de |
|---|---|
| Aplicar cupom válido aplica desconto e recalcula o total | cupom válido A |
| Aplicar cupom com código inexistente… | nada (o teste gera um código aleatório) |
| Aplicar cupom expirado… | cupom expirado |
| Aplicar cupom que não atende às condições da compra… | cupom com condição conhecida (ex.: valor mínimo) que o pedido do teste não atende |
| Novo cupom válido substitui o anterior | cupons válidos A e B, diferentes |
| Remover cupom aplicado restaura o total | cupom válido A |

**Decidir:** quem cria/fornece os códigos (time do app/backend, painel da loja), se são
permanentes ou renovados, e como chegam ao teste (`.env` local + secrets do CI).
Observação: o de código inexistente não depende de massa. Hoje fica pendente junto com os
outros por decisão do Marcio; pode ser liberado sozinho.

## 2. Estoque — 2 cenários (Mochila)

"Aumentar a quantidade de um item até o limite de estoque disponível" e "Tentar adicionar
quantidade acima do estoque disponível exibe mensagem de limite".

**Precisa de:** um produto + tamanho com estoque **N conhecido e pequeno** (subir até N toques).

**Opções:**
- **Ler do app:** o teste sobe a quantidade até aparecer "Quantidade máxima disponível em
  estoque: N". Não depende de cadastro, mas se N for grande o teste fica longo.
- **Produto de teste fixo:** um SKU com estoque controlado, informado no `.env`. Previsível,
  mas quebra quando alguém compra ou repõe.

## 3. Frete grátis — 3 cenários (Mochila)

Barra abaixo do mínimo, ao atingir o mínimo, e voltando abaixo ao reduzir itens.

**Precisa de:** o valor mínimo do frete grátis e produtos cujos preços permitam ficar abaixo
e depois atingir o mínimo.

**Opções:**
- **Ler do app:** o valor que falta aparece na barra; o teste calcula quantas unidades somar.
- **Valor fixo no `.env`:** simples, quebra quando a regra comercial mudar.

## 4. Acesso à caixa do Gmail (recuperação de senha) — não bloqueia a fase

Nenhum dos 93 cenários da fase lê o e-mail: o único de recuperação para na tela "Esqueci minha
senha". O acesso à caixa só é necessário para um teste futuro de recuperação completa.
E-mail de cadastro definido: `informatica.mrn+{textogerado}@gmail.com` (regra do
`{textogerado}` a passar pelo Marcio).

**Opções a avaliar (trade-off), para decidir depois:**

| Opção | Prós | Contras / risco |
|---|---|---|
| Gmail API (OAuth, escopo só leitura) | escopo restrito (`gmail.readonly`), revogável | configurar projeto no Google Cloud; token de refresh vira segredo do CI; dá leitura de **toda** a caixa pessoal |
| IMAP com senha de app | simples de implementar | exige 2FA ligado; senha de app dá acesso total à caixa; segredo sensível no CI |
| Caixa dedicada de QA (outra conta Gmail só para testes) | isola a caixa pessoal; mesmas opções técnicas acima | criar e manter outra conta |
| Serviço de e-mail descartável com API (ex.: maildrop.cc, já usado em contas iOS) | sem credencial pessoal | caixa pública (qualquer um lê o link de recuperação); depende de serviço de terceiro |

## 5. Dados das contas por device

Os cenários "CPF já cadastrado" e "Dados do cadastro são exibidos corretamente em Meus Dados"
precisam do **CPF e dos dados cadastrais** de cada conta por device. Hoje o `.env`/secrets
têm só e-mail e senha. **Decidir:** onde guardar esses dados (novas variáveis/secrets).
