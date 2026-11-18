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
| 2026-10-16 13:50 | captura Android (AVD-S24, build 506) | `informatica.mrn+cadastro-avd-s24-mvb7e8sd-xxny@gmail.com` | Teste | Automacao | `285.729.154-00` | 15/05/1990 | 11 933683272 | `Aramis@Ios12c` (confirmada por login no iOS 1.23.0/395 em 2026-11-12; trocada pelos links de recuperação no iOS: `Aramis@Ios12a` 14:48:38, `Aramis@Ios12b` 14:54:22, `Aramis@Ios12c` 14:56:35; capturas `drafts/app-migrado/ios/captures-2026-11-12-roteiro-1.23.0/`. Antes: `Aramis@Nova12d`, confirmada por login em 2026-11-12 10:59:52, build 1.23.0/544; trocada pelos links de recuperação nesse dia: `Aramis@Nova12a` 10:49:13, `Aramis@Nova12c` 10:53:12, `Aramis@Nova12d` 10:59:22; capturas `captures-2026-11-12-roteiro-1.23.0-544/`; original `Aramis@E8SD9a`) | senha trocada 2026-11-11 pelo link de recuperação, build 1.23.0/541: `Aramis@E8SD9a` para `Aramis@Nova11a` (11:30:07) e para `Aramis@Nova11b` (11:33:54). Criação: conta criada; senha aceita sem troca; cadastro concluiu e a conta ficou logada direto na Home (cap. 29), Menu mostrou "Teste Automacao" (cap. 30) |
| 2026-10-16 ~18:01 | captura iOS (Remote Access, build 1.21.7/352) | `informatica.mrn+cadastro-ios-mvbfy8l1-nrhv@gmail.com` | Teste | Automacao | `842.523.377-12` | 15/03/1990 | (11) 96384-7205 | `Aramis@57189a` | conta criada; Home logada direto após o 2º toque em finalizar, Menu mostrou "TA Teste Automacao" (cap. 43); logout feito em seguida. E-mail lido no print (`l`/`1` ambíguos na fonte); login confirmado na captura das ~19h (`captures-2026-10-16-build352-compra`), que salvou nela o endereço Av. Paulista 1000, CEP 01310-100, destinatário Teste Automacao. Estado final: Mochila vazia, sem favoritos, sem pedidos, deslogada |
| 2026-10-18 ~21:30 | CI Run #24, Device Farm, Samsung Galaxy S23 Ultra | `informatica.mrn+cadastro-samsung-galaxy-s23-u-mvejtj3p-nkur@gmail.com` | Teste | Automacao | `856.566.187-30` | 23/04/1980 | (11) 94795-9941 | `Aramis@QWVE6a` | conta criada (spec 04 PASSED neste device; dados do `Test spec output`) |
| 2026-10-18 ~21:30 | CI Run #24, Device Farm, Samsung Galaxy S24 Ultra | `informatica.mrn+cadastro-samsung-galaxy-s24-u-mvein5tg-fc13@gmail.com` | Teste | Automacao | `272.262.087-17` | 18/08/1984 | (11) 93850-2237 | `Aramis@RMDJ6a` | conta criada (spec 04 PASSED neste device; dados do `Test spec output`) |
| 2026-10-18 ~21:30 | CI Run #24, Device Farm, Samsung Galaxy S24+ | `informatica.mrn+cadastro-samsung-galaxy-s24-mveje2sh-slz0@gmail.com` | Teste | Automacao | `621.911.278-43` | 26/03/1973 | (11) 97659-3433 | `Aramis@EFGK5a` | conta criada (spec 04 PASSED neste device; dados do `Test spec output`) |
| 2026-10-18 ~21:30 | CI Run #24, Device Farm, Samsung Galaxy S25 Ultra | `informatica.mrn+cadastro-samsung-galaxy-s25-u-mvejfjfj-cmq2@gmail.com` | Teste | Automacao | `416.503.081-32` | 12/02/1997 | (11) 95025-0667 | `Aramis@LQZB9a` | conta criada (spec 04 PASSED neste device; dados do `Test spec output`) |
| 2026-10-19 | captura Android (AVD-S24, build 1.22.0/509, `captures-2026-10-19-qa160/`), conta do CI recriada | `aaliyahrochanascimento087+qa160@gmail.com` | Aaliyah | Rocha Nascimento | `384.915.267-73` | 01/01/1990 | (11) 98765-4321 | não registrada (= `CLIENT_PASSWORD`) | conta criada; Home logada direto após o 2º toque em finalizar; logout e novo login funcionaram |
| 2026-10-22 ~19:52 | captura AVD (build 1.22.2/513, `captures-2026-10-22-cadastro-513-conta-criada/`) | `informatica.mrn+cadastro513-1792709262@gmail.com` | Teste | Automacao | `213.176.296-80` | 15/05/1990 | (11) 98765-4321 | `Aramis@qa513x1` | conta criada; os botões das duas etapas estavam `enabled=false` no dump e o 2º toque em cada um avançou (etapa 1 → 2; etapa 2 → Home logada, cap. 24); Menu mostrou "TA, Teste Automacao" (cap. 25). Estado final: `pm clear` |
| 2026-11-10 ~20:07 | spec `04`, AVD-S24, build 1.23.0/541 (falhou no 2º toque do Finalizar) | `informatica.mrn+cadastro-avd-s24-mwb46v3h-pofp@gmail.com` | Teste | Automacao | `906.657.987-09` | 09/01/1995 | (11) 90211-6963 | `Aramis@UZST9a` | provável conta criada, não confirmada: o print da falha mostra a Home, o botão Finalizar já tinha saído da tela; o login com ela não foi testado. Estado final: `pm clear` do `afterTest` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-002@gmail.com` | Carga | Teste I | `845.632.698-40` | 01/03/1994 | (11) 90975-7339 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-003@gmail.com` | Carga | Teste D | `246.977.071-84` | 09/06/1982 | (11) 93884-3756 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-004@gmail.com` | Carga | Teste Y | `888.560.343-28` | 05/08/1983 | (11) 94441-2024 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-005@gmail.com` | Carga | Teste J | `567.423.249-02` | 01/12/1981 | (11) 99492-2976 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-006@gmail.com` | Carga | Teste L | `123.728.270-57` | 01/01/1978 | (11) 99727-2285 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-007@gmail.com` | Carga | Teste G | `044.063.511-08` | 04/08/1997 | (11) 93408-2331 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-010@gmail.com` | Carga | Teste A | `373.329.810-17` | 13/12/1973 | (11) 91650-5417 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-013@gmail.com` | Carga | Teste I | `838.466.931-70` | 16/12/1994 | (11) 92452-4546 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-014@gmail.com` | Carga | Teste C | `190.078.186-78` | 08/02/1980 | (11) 99590-8292 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-015@gmail.com` | Carga | Teste O | `644.213.472-56` | 18/10/1995 | (11) 97270-2582 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-016@gmail.com` | Carga | Teste Y | `688.458.942-66` | 07/08/1994 | (11) 91022-5728 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-017@gmail.com` | Carga | Teste O | `875.554.857-10` | 09/01/1992 | (11) 96381-7088 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-018@gmail.com` | Carga | Teste H | `338.311.210-10` | 28/11/1990 | (11) 92649-7245 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-020@gmail.com` | Carga | Teste Q | `476.890.333-93` | 22/11/1990 | (11) 97331-9242 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-021@gmail.com` | Carga | Teste F | `519.727.057-84` | 08/01/1987 | (11) 98758-4441 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-022@gmail.com` | Carga | Teste S | `977.767.449-05` | 23/06/1975 | (11) 91638-9780 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-024@gmail.com` | Carga | Teste B | `045.049.625-27` | 20/07/1972 | (11) 94529-2590 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-025@gmail.com` | Carga | Teste T | `357.318.822-23` | 19/07/1974 | (11) 93560-6454 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-027@gmail.com` | Carga | Teste D | `706.116.886-20` | 26/08/1989 | (11) 95252-5264 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-028@gmail.com` | Carga | Teste T | `151.276.194-07` | 09/11/1993 | (11) 93008-0681 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-030@gmail.com` | Carga | Teste L | `843.723.372-05` | 14/10/1998 | (11) 99756-3943 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-031@gmail.com` | Carga | Teste I | `613.077.238-61` | 08/05/1994 | (11) 96576-0338 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-032@gmail.com` | Carga | Teste T | `717.461.205-92` | 13/07/1974 | (11) 91215-2334 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-033@gmail.com` | Carga | Teste B | `341.915.018-01` | 15/07/1990 | (11) 99420-9978 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-034@gmail.com` | Carga | Teste S | `816.753.385-90` | 03/10/1986 | (11) 97594-7410 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-035@gmail.com` | Carga | Teste L | `567.086.123-05` | 18/01/1976 | (11) 95958-4494 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-037@gmail.com` | Carga | Teste Y | `507.411.620-16` | 24/05/1970 | (11) 99571-7271 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-039@gmail.com` | Carga | Teste Z | `911.485.452-04` | 07/07/1997 | (11) 96166-9325 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-040@gmail.com` | Carga | Teste E | `262.255.826-06` | 24/09/1971 | (11) 96602-5043 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-043@gmail.com` | Carga | Teste K | `273.186.270-07` | 15/11/1997 | (11) 92618-8842 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-044@gmail.com` | Carga | Teste E | `730.496.221-64` | 15/05/1988 | (11) 95497-2916 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-045@gmail.com` | Carga | Teste K | `663.117.935-12` | 21/03/1997 | (11) 97585-5565 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-046@gmail.com` | Carga | Teste X | `990.354.520-70` | 10/12/1993 | (11) 94927-5329 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-047@gmail.com` | Carga | Teste Y | `934.501.615-55` | 09/09/1980 | (11) 94859-6377 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-048@gmail.com` | Carga | Teste J | `252.558.118-07` | 20/08/1978 | (11) 95303-9698 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-051@gmail.com` | Carga | Teste P | `066.253.763-70` | 05/01/1995 | (11) 98207-0410 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-052@gmail.com` | Carga | Teste L | `902.242.518-56` | 17/08/1980 | (11) 98435-5296 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-053@gmail.com` | Carga | Teste Q | `036.939.966-87` | 10/06/1987 | (11) 96134-1493 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-054@gmail.com` | Carga | Teste F | `933.473.207-51` | 21/08/1973 | (11) 99387-7068 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-055@gmail.com` | Carga | Teste W | `769.566.639-45` | 19/03/1974 | (11) 96291-8111 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-056@gmail.com` | Carga | Teste E | `592.329.145-22` | 20/08/1990 | (11) 92367-5575 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-057@gmail.com` | Carga | Teste A | `926.341.963-93` | 10/11/1990 | (11) 93348-0097 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-058@gmail.com` | Carga | Teste E | `702.348.507-44` | 12/04/1992 | (11) 91804-8867 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-059@gmail.com` | Carga | Teste K | `800.896.470-76` | 10/03/1987 | (11) 99196-1363 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-061@gmail.com` | Carga | Teste N | `492.299.479-38` | 13/01/1990 | (11) 93541-2740 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-062@gmail.com` | Carga | Teste T | `557.818.196-14` | 26/01/1984 | (11) 98164-8024 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-063@gmail.com` | Carga | Teste M | `660.817.147-13` | 18/08/1991 | (11) 99082-5617 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-064@gmail.com` | Carga | Teste X | `080.011.010-29` | 22/12/1978 | (11) 93798-9446 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.0/550 | `informatica.mrn+carga1117-066@gmail.com` | Carga | Teste D | `133.654.976-92` | 05/09/1993 | (11) 96150-1298 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |
| 2026-11-17 | lote de contas para teste de carga, AVD-S24, build 1.23.1/551 | `informatica.mrn+carga1117-076@gmail.com` | Carga | Teste W | `152.574.468-20` | 05/07/1995 | (11) 92023-6675 | `Maje+1425` | conta criada e confirmada logada no Menu; listada no `users.csv`. Estado final: `pm clear` |

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
- **Cartão aprovado: NUNCA será testado** (Marcio, 2026-10-21), por segurança e por ser inviável usar cartão
  válido neste ambiente. Só cartão fake, que leva à recusa/antifraude.

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
| 2026-10-22 ~11:43 | #239678 (R$ 1.349,82: óculos 699,90 + camisa 799,90 − Pix 10% 149,98; frete 0; Pix, QR carregou) | spec `02-compra-pix` no iOS (Remote Access), conta `marciorocha`, PASSOU; camisa da posição 0 (execução local) |
| 2026-10-20 23:43 | #214832 (R$ 716,80: calça R$ 699,90 + frete 16,90; cartão fake, Cancelado) | captura no Galaxy S26 (Android 16, Device Farm Remote Access), build 1.22.2/512 (`captures-2026-10-20-android16-remoto/`), conta `marciorocha`, 1 toque, 1 pedido; modal antifraude + Pedido Cancelado |
| 2026-10-30 16:50 | #446640 (R$ 38,85: meia Sapatilha Lisa Preto 195142 R$ 39,90 + frete Econômica 16,90 − Pix 15% 5,98 − Giftback 11,97; Pix NÃO pago, Aguardando Pagamento) | captura no AVD, build 1.22.9/530 (`captures-2026-10-30-build530-pedido-meia-giftback/`), conta `marcio.rocha.ext@aramisinc.com.br`, autorizado pelo Marcio; 1 toque, 1 pedido; saldo de Giftback 113,96 antes → zero depois |

Os pedidos de runs não listados aqui não foram anotados. A tabela é atualizada a cada captura ou run que
finalizar uma compra.
