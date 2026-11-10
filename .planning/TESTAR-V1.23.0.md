# A testar na versão 1.23.0

Fonte: notas de release "Release Aramis v1.23.0" (artefato https://claude.ai/artifact/ARsQXuC15J3fBtiQzFwJYa, rascunho,
comparação da develop em 10/11/2026: a qa sai da 1.22.9 e entra a 1.23.0, com 74 commits e 146 arquivos do app).
Demandas: `recuperar-senha-pelo-app` e `links-do-site-abrem-o-app`, as duas validadas. Exige build nova de loja.
Build Android/iOS da 1.23.0: não informado ainda.

## Roteiro do QA (15 itens, iOS e Android)

| # | O que testar | Roteiro | Precisa de |
|---|---|---|---|
| 1 | Nova senha pelo link | Pedir a recuperação no app. Tocar no link do e-mail com o app fechado e de novo com o app aberto. A tela Nova senha abre. Salvar. O app entra e abre a Home. | Conta de teste (cada troca muda a senha dela) |
| 2 | Nova senha logado | Entrar numa conta e tocar no link do e-mail. O app sai da conta e abre Nova senha. Depois da troca, abre Entrar com o aviso "Senha trocada". | Conta de teste |
| 3 | Link já usado | Tocar de novo num link já usado. Aparece o aviso de link vencido e o botão "Pedir novo e-mail". | Conta de teste |
| 4 | Voltar na Nova senha | Na tela Nova senha, tocar em voltar. Vai para Entrar e depois para a Home, sem fechar o app. | Nada |
| 5 | E-mail preenchido | Errar a senha em Entrar. Tocar em "Esqueci a senha". O e-mail já vem preenchido. | Conta de teste |
| 6 | Links do site | Tocar, fora do app, em links de produto, categoria, busca, sacola, conta, pedidos, favoritos, lojas, login e ajuda. Cada um abre a tela certa. Com o app fechado e aberto. | iPhone: o AASA de teste da demanda. Android: o dev libera os links pelo adb |
| 7 | Página sem tela | Tocar num link de /trocas-e-devolucoes. Abre o Safari ou o Chrome, fora do app. No Android, "Abrir com" não mostra a Aramis. | O mesmo do item 6 |
| 8 | Voltar depois do link | Com o app fechado, abrir pelo link de um produto. Tocar em voltar: aparece a Home. Voltar de novo fecha o app. | O mesmo do item 6 |
| 9 | Link de conta sem login | Deslogado, tocar num link de pedidos. Fazer login. O app abre Pedidos, não a Home. | Conta de teste |
| 10 | Produto indisponível | Abrir o link de um produto esgotado ou que não existe. Aparece o aviso. Sem internet, aparece "Tentar de novo". | Um produto esgotado |
| 11 | Compartilhar produto | Na tela do produto, tocar em compartilhar. O link é `aramis.com.br/produto/<alias>` e abre o mesmo produto. | Nada |
| 12 | Banner da Home | Tocar num banner da Home. Abre a tela certa, dentro do app. | Nada |
| 13 | Cupom no Android | Na sacola, aplicar um cupom, o giftback e um código de vendedora. O app não fecha e os valores mudam. | Um cupom válido |
| 14 | Insider na compra | Fechar uma compra na sacola Wake. No painel da Insider, a compra aparece com nome e foto do item. | Acesso ao painel da Insider |
| 15 | Android de release | Na build de loja do Android, passar pela Home, produto, sacola, checkout, login e push. Nada fecha nem fica em branco. | Build de release, não de teste |

## Riscos e o que observar (das notas)

- Ofuscação nova (R8/ProGuard) no Android de release: uma biblioteca que procura código pelo nome pode quebrar só na
  build de loja. Olhar o item 15 e o Sentry nas primeiras horas.
- Insider: item sem nome ou sem foto fica fora da compra, com registro no log. Cópia da sacola Wake salva antes da
  atualização é lida sem foto, e a compra dela não vai à Insider.
- O evento `select_content` com `login:confirmar` volta a ser enviado no toque em "Salvar nova senha".
- Banner e links internos da Home não registram mais origem de campanha; o banner conta como visto só depois que a
  Home aparece.
- O link de nova senha tira o cliente logado da conta antes de abrir a tela.
- iPhone: os links do site abrem o navegador até o time do site publicar o AASA, o que só acontece depois que a versão
  estiver na loja.
- O link do e-mail de recuperação depende de a Wake trocar o endereço para `applink.aramis.com.br`.
- Painel de controle (só build de teste): as sobreposições ficam salvas entre aberturas (chave
  `dev-remote-config-overrides`).

## Pontos que tocam a automação (para conferir no levantamento do build)

- Itens 6 a 9 e 11 mexem em links e deep links. O `06-compartilhar-carrinho` abre a Mochila compartilhada por
  `aramisnova://share-bag/<uuid>`; conferir se o link copiado continua `https://applink.aramis.com.br/share-bag/<uuid>`
  e se o deep link ainda abre a "Shared Backpack".
- Item 13: a sacola mudou (cupom, giftback e código de vendedora sem animação). O `02` e o `03` passam pela Mochila.
- Item 5: "Esqueci a senha" com o e-mail preenchido. O backlog do M9 tem a recuperação de senha sem teste.
- Falhas do `06` no CI Run #52 a reconferir no build novo: tabela "A testar na próxima versão" do `ROADMAP.md`.
