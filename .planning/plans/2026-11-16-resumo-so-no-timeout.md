# Resumo da esteira só quando o timeout impede a execução

Data: 2026-11-16. Ordem do Marcio neste dia: planejar, alterar e documentar. Estado: implementado, não rodado no CI.

Não está escrito no `REQUIREMENTS.md`. A regra abaixo é a ordem dele, não uma regra antiga do arquivo.

## Como ele quer que funcione

A tela é o resumo do job no GitHub Actions (`run-on-device-farm` e `run-ios-on-device-farm`), a do print `FalhaTimeout.png`.

- Erro de teste que chegou a rodar aparece só no relatório Allure. Essa tela não diz `FAILED`, não lista o resultado por aparelho e não escreve "esperou N min · terminou".
- A mensagem de falha nessa tela existe só quando a espera de 120 min acaba e nenhum teste chegou a executar, porque o aparelho continuou na fila da frota pública ou a AWS não alocou. Nesse caso o relatório não é gerado, e o texto diz isso.
- O teto continua 120 min. Não foi aumentado.

## Como funcionava

Os dois passos "Wait" de `.github/workflows/mobile_test.yml`, ao ver o run do Device Farm terminar, gravavam no resumo o resultado (`FAILED`, `PASSED` ou outro) e as linhas do `scripts/devicefarm-situacao.sh`, inclusive "terminou: `FAILED` · esperou N min". Também publicavam `::notice::` com esse resultado. O job ficava verde ("não quebra a esteira") e o `publish-report` gerava o Allure.

O bloco "timeout de 120 min" só rodava se o run ainda estivesse em `PENDING`, `RUNNING` ou `SCHEDULING` depois das 120 consultas. O print não é esse bloco: os aparelhos tinham sido entregues e os testes tinham rodado.

## O que mudou

| Arquivo | Mudança |
|---|---|
| `.github/workflows/mobile_test.yml` | Android e iOS: o resumo e o `::notice::` com o resultado do teste saíram. O passo só grava erro e sai com código 1 quando a espera acaba e nenhuma linha diz que um teste executou (`rodando desde` ou `terminou: \`RESULTADO\``). O log de polling imprime o status do run, sem o resultado do teste. |
| `.github/workflows/mobile_test.yml` | Se o teto cortar uma execução que já começou, o passo não escreve falha de teste. Segue o download. Aviso só se ainda houver aparelho na fila. |
| `.github/workflows/mobile_test.yml` | Sem `*-result.json`, o resumo do `publish-report` diz "nenhum resultado de teste — relatório não gerado." |
| `scripts/devicefarm-situacao.sh` | Comentário: a linha de teste que terminou não vai para o resumo do job. A saída do script não mudou. |

## O que não mudou

`wdio.conf.ts`, `testspec.yml`, `testspec-ios.yml`, `package.json`, specs, page objects, o teto de 120 min, o `publish-report` com `if: always()` e a recusa de publicar quando não há `*-result.json`. O aviso "Unable to acquire device" continua, e não usa a palavra de resultado de teste.

## O que conferir no próximo run

- Testes que rodam e falham: o resumo desses dois jobs não mostra `FAILED` nem "esperou N min". A falha está no Allure. O job da esteira não fica vermelho por causa do resultado do teste.
- Fila até os 120 min, sem suite criada: o resumo mostra "timeout de 120 min, testes não rodaram" e o `publish-report` não publica.
