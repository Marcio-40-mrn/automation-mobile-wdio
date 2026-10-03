# Phase 6: Cenários Gherkin da seção 3 no app migrado - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-30
**Phase:** 06-cenarios-gherkin-app-migrado
**Areas discussed:** Onde o código entra, Idioma, iOS e CI, Massa de dados e contas, Exclusões

Todas as respostas foram texto livre do Marcio (opção "Other"); registradas literalmente.

---

## Onde o código entra
Opções: neste repo × outro; ramo nos page objects atuais × page objects novos.
**Resposta:** "o código entra nos page objects atual pois vai rodar o teste somente neste app migrado"

## Idioma
Opções: travar locale pt-BR nas capabilities × seletor só por testID.
**Resposta:** "o idioma é para pegar como aparece no device farm e ou AVD com lingua em ingles e não se importar com como aparece agora porque quero validar a funcionalidade e não o idioma por enquanto"

## iOS e CI
**Resposta (iOS):** "se quiser podemos pegar os elementos em uma sessão do ios agora e já aplicar os testes tanto no Android como iOS simultaneamente depois"

| Option | Description | Selected |
|---|---|---|
| A cada etapa (Recomendado) | etapa fecha verde no AVD e no Device Farm | ✓ |
| Só no final | CI ligado ao terminar todas as etapas | |

## Massa de dados e contas
| Pergunta | Resposta |
|---|---|
| Cupons | "deixa estes testes do Cupom pendente pois preciso verificar de onde vai vir isso" |
| Estoque / frete grátis | "vai precisar fazer um documento com estas pendencias de onde vai vir a estrutura para eu decidir depois! estes testes também vai ficar pendente" |
| Cadastro (e-mail/CPF) | "pode gerar por execução mas vou passar regras para criação de email do tipo informatica.mrn+{textogerado}@gmail.com porque na recuperação de conta vai precisar acessar o email" |
| Contas por device | "já existe uma conta/email para cada device quando roda no CI pode utilizar os mesmos email/variaveis… o teste que existe atual foi uma POC e também será migrado para este app" |

## Exclusões
| Pergunta | Resposta |
|---|---|
| Etapa 7 (pt-BR) | "excluir este cenários do planejamento! não precisa fazer por agora! talvez faça sentido no futuro" |
| Leitura do Gmail | "precisamos planejar isso e ver qual a forma mais facil… o quanto isso é seguro! precisamos avaliar prós e contras" |
| Etapa 6 (conectividade / DEV) | "falha de conexão imagino que não vai ser possivel testar com automação sem tornar um teste Flaky e não deve ter nenhum teste em seção DEV" |

## Claude's Discretion
Estrutura interna dos specs e forma do skip nomeado dos pendentes.

## Deferred Ideas
Validação pt-BR; leitura automatizada do Gmail; Seção DEV; falha de conectividade.
