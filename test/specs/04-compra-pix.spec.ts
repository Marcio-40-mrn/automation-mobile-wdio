import { HomePage } from "../pageobjects/HomePage";
import { OnboardingPage } from "../pageobjects/OnboardingPage";
import { LoginPage } from "../pageobjects/LoginPage";
import { PerfilPage } from "../pageobjects/PerfilPage";
import { CategoriasPage } from "../pageobjects/CategoriasPage";
import { BuscaPage } from "../pageobjects/BuscaPage";
import { ProdutoPage } from "../pageobjects/ProdutoPage";
import { CheckoutPage, type ValoresResumo } from "../pageobjects/CheckoutPage";
import { PedidoPage } from "../pageobjects/PedidoPage";
import { getCredentials } from "../utils/credentials";
import {
    anexarCrashDoAppSeFechou,
    configurarFechadorDeBanner,
    limparLogDeCrash,
    // registrarAvisoNoRelatorio,   // só a limpeza da Mochila usa (desativada)
    rotularTeste,
    step,
} from "../utils/allure-helpers";
import allure from '@wdio/allure-reporter';
// import { Status } from 'allure-js-commons';   // só a limpeza da Mochila usa (desativada)
// import { driver } from '@wdio/globals';         // só a limpeza da Mochila usa (desativada)

// Cenário 1 — Jornada completa de compra com Pix (cenário do Marcio, 2026-10-14): do primeiro
// acesso até o alerta "aguardando pagamento" na Home. Os comentários "Passo N" seguem a
// numeração do cenário.
//
// Rodar (AVD, quem roda é o Marcio):
//   npx wdio run ./wdio.conf.ts --spec test/specs/04-compra-pix.spec.ts
// (no PowerShell, `npm run wdio:android -- --spec ...` perde o --spec e roda a suíte inteira)
//
// ATENÇÃO: o teste FINALIZA uma compra de verdade. Cada execução cria pedido(s) Pix reais
// "aguardando pagamento" na conta — nas capturas de 2026-10-14, um toque em finalizar com 2
// produtos na Mochila criou 2 pedidos. Por isso o toque em finalizar nunca é repetido
// (CheckoutPage.finalizarPedido).
//
// Seletores e tempos: .planning/drafts/app-migrado/android/captures-2026-10-14-compra-pix/ e
// captures-2026-10-14-compra-pix-rodada2/ (35 passos percorridos no AVD).
//
// iOS (2026-10-15, build 1.21.6/349): ramo escrito a partir de
// .planning/drafts/app-migrado/ios/captures-2026-10-15-compra-pix/ e -compra-cartao/, com os
// seletores conferidos nas árvores, AINDA NÃO RODADO. Rodar no Remote Access (REMOTE_* no .env):
//   npm run wdio:ios -- --spec test/specs/04-compra-pix.spec.ts
// Diferenças no iOS, todas no page object:
//   - sheet de tamanho e de "produto adicionado" fora da árvore: toque por fração da tela
//     (exceção autorizada pelo Marcio, 2026-10-15; ProdutoPage);
//   - carrossel de indicação SEM validação por ora (fora da árvore; ProdutoPage);
//   - copiar código Pix sem seletor (o QR nunca carregou nas capturas iOS; PedidoPage). Enquanto o
//     QR não carregar no iOS, o teste para no validarQrCode, com o pedido já criado.

// Produto buscado no passo 11 (variável do cenário). O teste compra o 1º resultado, seja qual for.
const PRODUTO_BUSCA = 'óculos';

// LIMPEZA DA MOCHILA DESATIVADA (Marcio, 2026-10-14): ele quer ver se a Mochila fica com item da
// execução anterior. Para religar: descomentar esta função, os imports `Status` e `driver`, e as
// duas chamadas no fim do `it` (passo final e catch).
// // Limpeza depois de uma falha com produto na Mochila. Melhor esforço: o erro do teste é o que
// // vale, e cada erro aqui só vira aviso no relatório. O app é reaberto primeiro (a falha pode ter
// // deixado qualquer tela aberta: sheet, PDP, checkout); terminate + activate volta à Home logado.
// async function limparMochila(checkoutPage: CheckoutPage, homePage: HomePage, conta: string) {
//     const app = 'com.aramis.ecomm';
//     allure.startStep('Limpeza: esvaziar a Mochila');
//     try {
//         await driver.execute('mobile: terminateApp', { appId: app });
//         await driver.execute('mobile: activateApp', { appId: app });
//         await driver.pause(5000);
//         await homePage.fechaBanner();
//         await checkoutPage.esvaziarMochila();
//         allure.endStep(Status.PASSED);
//     } catch (erroLimpeza) {
//         const motivo = erroLimpeza instanceof Error ? erroLimpeza.message : String(erroLimpeza);
//         registrarAvisoNoRelatorio(
//             'Produto na Mochila da conta',
//             `A Mochila da conta ${conta} pode ter ficado com produto(s) deste teste. Motivo: ${motivo}`
//         );
//         allure.endStep(Status.FAILED);
//     }
// }

describe('Compra', () => {
    it('Jornada completa de compra com Pix', async function (this: Mocha.Context) {
        const homePage = new HomePage();
        const onboardingPage = new OnboardingPage();
        const loginPage = new LoginPage();
        const perfilPage = new PerfilPage();
        const categoriasPage = new CategoriasPage();
        const buscaPage = new BuscaPage();
        const produtoPage = new ProdutoPage();
        const checkoutPage = new CheckoutPage();
        const pedidoPage = new PedidoPage();

        const { user, password } = await getCredentials();
        const inicioEmail = user.split('@')[0];

        configurarFechadorDeBanner(() => homePage.fechaBanner());
        await rotularTeste('compra-pix');

        let numeroPedido = '';
        // Limpeza da Mochila (pedido do Marcio, 2026-10-14): a conta do teste não pode acumular
        // produtos entre execuções. Se o teste falhar depois de pôr produto na Mochila e antes de
        // finalizar o pedido, o catch esvazia a Mochila (melhor esforço) e relança o erro original.
        // No caminho feliz, o último passo esvazia o que tiver sobrado.
        let produtoNaMochila = false;
        let pedidoFinalizado = false;
        // Valores da compra, guardados no teste para a validação do passo 29 (antes do clique que
        // leva à tela do Pix):
        //   - o preço de cada produto, lido na PDP ANTES do clique em comprar;
        //   - a soma dos preços;
        //   - o desconto de cupom: 0 enquanto o teste não aplica cupom. Quando aplicar, o valor
        //     do desconto do cupom entra aqui;
        //   - o DESCONTO DO PIX, calculado com a regra abaixo.
        // Nenhum valor é fixo: preços e entrega são lidos da tela a cada execução.
        let precoOculos = 0;
        let precoCamisa = 0;
        const descontoCupom = 0;
        // Regra: pagamento com Pix tem 10% de desconto, e o frete ENTRA na base do desconto
        // (confirmado pelo Marcio no site da empresa, 2026-10-14). Base = produtos - cupom + entrega.
        const DESCONTO_PIX = 0.10;
        // DESLIGADO por ora (Marcio, 2026-10-14): o resumo do app NÃO mostra o desconto do Pix
        // (run de 23:10: Descontos 0 e Total 1499.8, esperado 149.98 e 1349.82). Enquanto os devs não
        // corrigem, o desconto do Pix é validado SÓ na tela do Pix. Corrigido o app, trocar para `true`
        // e o passo 29 volta a exigir Descontos e Total do resumo com o desconto do Pix.
        const VALIDAR_DESCONTO_PIX_NO_RESUMO = false;
        // Guardados também para o anexo "Evidências da compra" no fim do teste (ver finally).
        let valoresResumo: ValoresResumo | null = null;
        let totalPagamento: number | null = null;
        let valorPix: number | null = null;
        let descontoPixEsperado: number | null = null;
        let totalComPixEsperado: number | null = null;

        // Começa com o buffer de crash do Android vazio: se o app travar, o log anexado é DESTA execução.
        await limparLogDeCrash();

        try {

            // Passo 1 — primeiro acesso (dados do app limpos) e aceite das permissões e dos termos.
            await step('onboardingPage.abrirApp() - primeiro acesso', async () => { await onboardingPage.abrirApp(); });
            await step('homePage.ativarApp() - onboarding e termos', () => homePage.ativarApp());
            // Passo 2 — o app abre na Home.
            await step('homePage.validarHome()', () => homePage.validarHome());

            // Passo 3 — Menu: print da versão e do build, no rodapé.
            await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());
            await step('perfilPage.anexarRodapeDoMenu()', () => perfilPage.anexarRodapeDoMenu());

            // Passos 4 a 7 — login, passando pela mensagem de e-mail inválido.
            await step('loginPage.abrirLogin()', () => loginPage.abrirLogin());
            await step('loginPage.preencherEmail() - incompleto', () => loginPage.preencherEmail(inicioEmail));
            await step('loginPage.validarEmailInvalido(true)', () => loginPage.validarEmailInvalido(true));
            await step('loginPage.completarEmail()', () => loginPage.completarEmail(user));
            await step('loginPage.validarEmailInvalido(false)', () => loginPage.validarEmailInvalido(false));
            await step('loginPage.preencherSenha()', () => loginPage.preencherSenha(password));
            await step('loginPage.entrar()', () => loginPage.entrar(`conta "${user}"`));
            // O app cai na Home depois do login (capturas de 2026-10-14), não no Menu.
            await step('homePage.validarHome() - depois do login', () => homePage.validarHome());

            // Passo 8 — o Menu mostra a conta e não mostra mais o "fazer login".
            await step('homePage.abrirPerfil() - logado', () => homePage.abrirPerfil());
            await step('perfilPage.validarLogado()', () => perfilPage.validarLogado());

            // Passos 9 a 11 — Categorias, lupa e busca.
            await step('homePage.abrirCategorias()', () => homePage.abrirCategorias());
            await step('buscaPage.abrirPelaLupaDeCategorias()', () => buscaPage.abrirPelaLupaDeCategorias());
            await step(`buscaPage.buscar("${PRODUTO_BUSCA}")`, () => buscaPage.buscar(PRODUTO_BUSCA));

            // Passos 12 a 14 — compra o 1º resultado e valida o carrossel de indicação.
            await step('produtoPage.abrirPrimeiroProduto() - busca', () => produtoPage.abrirPrimeiroProduto());
            await step('produtoPage.lerPrecoDoProduto() - óculos', async () => { precoOculos = await produtoPage.lerPrecoDoProduto(); });
            await step('produtoPage.comprar() - produto da busca', async () => {
                produtoNaMochila = true; // marcado antes: o toque em adicionar pode ter passado mesmo se o passo falhar
                await produtoPage.comprar();
            });
            await step('produtoPage.validarCarrosselDeIndicacao()', () => produtoPage.validarCarrosselDeIndicacao());

            // Passos 15 e 16 — continuar comprando e voltar até Categorias.
            await step('produtoPage.continuarComprando()', () => produtoPage.continuarComprando());
            await step('produtoPage.voltarAteCategorias()', () => produtoPage.voltarAteCategorias());

            // Passos 17 a 21 — Roupas > Camisas, compra a 1ª camisa com tamanho, volta.
            await step('categoriasPage.clickRoupas()', () => categoriasPage.clickRoupas());
            await step('categoriasPage.abrirCamisas()', () => categoriasPage.abrirCamisas());
            await step('produtoPage.abrirPrimeiroProduto() - camisa', () => produtoPage.abrirPrimeiroProduto());
            await step('produtoPage.lerPrecoDoProduto() - camisa', async () => { precoCamisa = await produtoPage.lerPrecoDoProduto(); });
            await step('produtoPage.comprar() - camisa', () => produtoPage.comprar());
            await step('produtoPage.continuarComprando() - camisa', () => produtoPage.continuarComprando());
            await step('produtoPage.voltarAteCategorias() - camisa', () => produtoPage.voltarAteCategorias());

            // Passo 22 — Mochila com os produtos adicionados.
            await step('checkoutPage.abrirMochila()', async () => { await checkoutPage.abrirMochila(2); });

            // Passos 23 a 26 — finalizar compra, endereço, entrega, continuar.
            await step('checkoutPage.finalizarCompraESelecionarEndereco()', () => checkoutPage.finalizarCompraESelecionarEndereco());
            await step('checkoutPage.selecionarEntregaEContinuar()', () => checkoutPage.selecionarEntregaEContinuar());

            // Passos 27 e 28 — Pix e resumo do pedido.
            await step('checkoutPage.selecionarPix()', async () => { totalPagamento = await checkoutPage.selecionarPix(); });
            await step('checkoutPage.prosseguirParaResumo()', () => checkoutPage.prosseguirParaResumo());

            // Passo 29 — validação dos valores ANTES do clique que leva à tela do Pix, com os
            // valores guardados no teste:
            //   (1) Produtos do resumo  = precoOculos + precoCamisa (lidos na PDP);
            //   (2) Descontos do resumo = desconto de cupom + DESCONTO DO PIX (10% de produtos - cupom + entrega);
            //   (3) Total do resumo     = produtos - cupom + entrega - desconto do Pix.
            // A entrega vem do próprio resumo (o teste não escolhe frete com preço conhecido).
            // Se o resumo não mostrar o desconto do Pix, o teste para AQUI, antes de finalizar —
            // nenhum pedido é criado.
            // POR ORA (VALIDAR_DESCONTO_PIX_NO_RESUMO = false) só o (1) é exigido aqui; os valores com
            // desconto do Pix são calculados e validados na tela do Pix.
            await step(VALIDAR_DESCONTO_PIX_NO_RESUMO ? 'validar valores do resumo (com desconto do Pix)' : 'validar valor dos produtos no resumo', async () => {
                const v = await checkoutPage.lerValoresDoResumo();
                valoresResumo = v;
                const somaProdutos = Math.round((precoOculos + precoCamisa) * 100) / 100;
                const baseDoPix = Math.round((somaProdutos - descontoCupom + v.entrega) * 100) / 100;
                const descontoPix = Math.round(baseDoPix * DESCONTO_PIX * 100) / 100;
                const descontosEsperados = Math.round((descontoCupom + descontoPix) * 100) / 100;
                const totalEsperado = Math.round((baseDoPix - descontoPix) * 100) / 100;
                descontoPixEsperado = descontoPix;
                totalComPixEsperado = totalEsperado;

                // Os valores ficam salvos no relatório: parâmetros do teste + anexo com a conta.
                allure.addArgument('Preço óculos', String(precoOculos));
                allure.addArgument('Preço camisa', String(precoCamisa));
                allure.addArgument('Soma dos produtos', String(somaProdutos));
                allure.addArgument('Desconto do Pix (10%)', String(descontoPix));
                allure.addArgument('Total esperado com desconto do Pix', String(totalEsperado));
                allure.addAttachment(
                    'Valores da compra',
                    `Preço óculos (PDP): ${precoOculos}\n` +
                    `Preço camisa (PDP): ${precoCamisa}\n` +
                    `Soma dos produtos: ${somaProdutos}\n` +
                    `Desconto de cupom: ${descontoCupom}\n` +
                    `Entrega (resumo): ${v.entrega}\n` +
                    `Base do desconto do Pix: ${somaProdutos} - ${descontoCupom} + ${v.entrega} = ${baseDoPix}\n` +
                    `Desconto do Pix (10%): ${descontoPix}\n` +
                    `Total esperado com desconto do Pix: ${baseDoPix} - ${descontoPix} = ${totalEsperado}\n\n` +
                    `Resumo — Produtos: ${v.produtos} | Entrega: ${v.entrega} | Descontos: ${v.descontos} | Total: ${v.total}\n` +
                    `Total no botão do pagamento (tela anterior): ${totalPagamento ?? 'não lido'}`,
                    'text/plain'
                );
                console.log(
                    `💲 Óculos ${precoOculos} + camisa ${precoCamisa} = ${somaProdutos}; entrega ${v.entrega}; ` +
                    `desconto do Pix (10%) ${descontoPix}; total esperado ${totalEsperado} | ` +
                    `resumo: produtos ${v.produtos}, descontos ${v.descontos}, total ${v.total}`
                );

                const erros: string[] = [];
                if (Math.abs(v.produtos - somaProdutos) > 0.009) {
                    erros.push(`Produtos do resumo = ${v.produtos}, soma dos preços = ${precoOculos} + ${precoCamisa} = ${somaProdutos}`);
                }
                if (VALIDAR_DESCONTO_PIX_NO_RESUMO) {
                    if (Math.abs(v.descontos - descontosEsperados) > 0.009) {
                        erros.push(
                            `Descontos do resumo = ${v.descontos}, esperado = desconto do Pix (10% de ${baseDoPix}) ${descontoPix}` +
                            (descontoCupom ? ` + cupom ${descontoCupom} = ${descontosEsperados}` : '')
                        );
                    }
                    if (Math.abs(v.total - totalEsperado) > 0.009) {
                        erros.push(`Total do resumo = ${v.total}, total esperado com desconto do Pix = ${baseDoPix} - ${descontoPix} = ${totalEsperado}`);
                    }
                } else {
                    console.log(
                        `ℹ Desconto do Pix NÃO validado no resumo (desligado até o app corrigir): ` +
                        `resumo mostra descontos ${v.descontos} e total ${v.total}; esperado ${descontosEsperados} e ${totalEsperado}`
                    );
                }
                if (VALIDAR_DESCONTO_PIX_NO_RESUMO && totalPagamento !== null && Math.abs(totalPagamento - totalEsperado) > 0.009) {
                    erros.push(`Total no botão da tela de pagamento = ${totalPagamento}, total esperado com desconto do Pix = ${totalEsperado}`);
                }
                if (erros.length > 0) {
                    throw new Error(`Valores do resumo não conferem com o desconto do Pix:\n- ${erros.join('\n- ')}`);
                }
                console.log(VALIDAR_DESCONTO_PIX_NO_RESUMO
                    ? '✅ Resumo confere: preços dos produtos e desconto do Pix (10%)'
                    : '✅ Resumo confere: valor dos produtos = soma dos preços lidos na PDP');
            });

            // Passo 30 — prosseguir com a compra (UM toque; cria o pedido).
            await step('checkoutPage.finalizarPedido()', async () => {
                pedidoFinalizado = true; // marcado antes do toque: a partir daqui a Mochila pode ter virado pedido
                await checkoutPage.finalizarPedido();
            });

            // Passos 31 a 33 — QR code, copiar o código, Meus pedidos com o número.
            await step('pedidoPage.validarQrCode()', () => pedidoPage.validarQrCode());
            await step('pedidoPage.numeroDoPedido()', async () => { numeroPedido = await pedidoPage.numeroDoPedido(); });
            // Valor a pagar da tela do Pix = total com o DESCONTO DO PIX calculado no passo 29 (pedido
            // do Marcio, 2026-10-14), que é também o total do resumo. Nas capturas o Pix mostrou só o
            // valor de UM dos 2 pedidos criados (óculos), então esta checagem falha enquanto o app
            // dividir a compra — com os valores na mensagem.
            await step('validar valor da tela do Pix (com desconto do Pix)', async () => {
                valorPix = await pedidoPage.valorAPagar();
                allure.addArgument('Valor a pagar no Pix', String(valorPix));
                if (totalComPixEsperado === null) {
                    throw new Error('Tela do Pix: o total esperado com desconto do Pix não foi calculado (resumo não lido).');
                }
                if (Math.abs(valorPix - totalComPixEsperado) > 0.009) {
                    throw new Error(
                        `Tela do Pix: valor a pagar ${valorPix} diferente do total esperado com desconto do Pix ` +
                        `${totalComPixEsperado} (desconto do Pix ${descontoPixEsperado}; pedido ${numeroPedido}).`
                    );
                }
                console.log(`✅ Valor a pagar no Pix (${valorPix}) = total com desconto do Pix (${totalComPixEsperado})`);
            });
            await step('pedidoPage.copiarCodigo()', () => pedidoPage.copiarCodigo());
            await step('pedidoPage.verMeusPedidos()', async () => { await pedidoPage.verMeusPedidos(numeroPedido); });

            // Passos 34 e 35 — volta para a Home e o alerta do pedido aguardando pagamento.
            await step('pedidoPage.sairParaHome()', () => pedidoPage.sairParaHome());
            await step('homePage.validarAlertaPedido()', () => homePage.validarAlertaPedido(numeroPedido));

            // Fim — a Mochila não fica com produto para a próxima execução.
            // DESATIVADO (Marcio, 2026-10-14): validar se a Mochila fica com item da execução anterior.
            // O passo 22 (abrirMochila) registra no log quantos produtos a Mochila tem.
            // await step('checkoutPage.esvaziarMochila()', () => checkoutPage.esvaziarMochila());
        } catch (erro) {
            // Se a falha foi o app fechando (crash intermitente do app), anexa o logcat de crash.
            await anexarCrashDoAppSeFechou();
            if (produtoNaMochila && !pedidoFinalizado) {
                // DESATIVADO (Marcio, 2026-10-14) — ver o comentário da função limparMochila.
                // await limparMochila(checkoutPage, homePage, user);
                console.log('ℹ Limpeza da Mochila desativada: produto(s) deste teste podem ter ficado na Mochila');
            }
            throw erro;
        } finally {
            // Evidências no nível do TESTE (fora dos steps), para aparecerem direto no relatório,
            // passe ou falhe. Os prints de cada tela ficam nos steps correspondentes.
            const soma = Math.round((precoOculos + precoCamisa) * 100) / 100;
            const r = valoresResumo as ValoresResumo | null;
            allure.addAttachment(
                'Evidências da compra',
                `Preço óculos (lido na PDP): ${precoOculos || 'não lido'}\n` +
                `Preço camisa (lido na PDP): ${precoCamisa || 'não lido'}\n` +
                `Soma dos produtos: ${soma}\n` +
                `Desconto de cupom: ${descontoCupom}\n` +
                `Desconto do Pix (10%) esperado: ${descontoPixEsperado ?? 'não calculado'}\n` +
                `Total esperado com desconto do Pix: ${totalComPixEsperado ?? 'não calculado'}\n` +
                `Total no botão da tela de pagamento: ${totalPagamento ?? 'não lido'}\n` +
                (r
                    ? `Resumo — Produtos: ${r.produtos} | Entrega: ${r.entrega} | Descontos: ${r.descontos} | Total: ${r.total}\n`
                    : 'Resumo: não lido\n') +
                `Valor a pagar na tela do Pix: ${valorPix ?? 'não lido'}\n` +
                `Pedido nº: ${numeroPedido || 'não criado / não lido'}`,
                'text/plain'
            );
            if (numeroPedido) allure.addArgument('Pedido', numeroPedido);
            if (r) allure.addArgument('Total do resumo', String(r.total));
            if (totalPagamento !== null) allure.addArgument('Total no pagamento', String(totalPagamento));
        }
    });
});
