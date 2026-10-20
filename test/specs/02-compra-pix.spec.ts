import { HomePage } from "../pageobjects/HomePage";
import { OnboardingPage } from "../pageobjects/OnboardingPage";
import { LoginPage } from "../pageobjects/LoginPage";
import { PerfilPage } from "../pageobjects/PerfilPage";
import { CategoriasPage } from "../pageobjects/CategoriasPage";
import { BuscaPage } from "../pageobjects/BuscaPage";
import { ProdutoPage } from "../pageobjects/ProdutoPage";
import { CheckoutPage, type ValoresResumo, type LinhaPix } from "../pageobjects/CheckoutPage";
import { PedidoPage } from "../pageobjects/PedidoPage";
import { getCredentials } from "../utils/credentials";
import {
    anexarCrashDoAppSeFechou,
    configurarFechadorDeBanner,
    limparLogDeCrash,
    rotularTeste,
    step,
} from "../utils/allure-helpers";
import allure from '@wdio/allure-reporter';

const PRODUTO_BUSCA = 'óculos';

const fmtPix = (l: LinhaPix | null) => (l ? `${l.percentual}% · R$ ${l.valor}` : 'não lido');


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
        let produtoNaMochila = false;
        let pedidoFinalizado = false;
        let precoOculos = 0;
        let precoCamisa = 0;
        const descontoCupom = 0;
        let valoresResumo: ValoresResumo | null = null;
        let totalPagamento: number | null = null;
        // Linha do desconto do Pix no Pagamento: prévia antes de escolher e valor depois de escolher.
        // O percentual vem da Wake e muda ao escolher o Pix (10% → 15% no 511/512); o teste usa o lido.
        let previaPix: LinhaPix | null = null;
        let pixEscolhido: LinhaPix | null = null;
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
            // Desconto do Pix no Pagamento, lido ANTES e DEPOIS de escolher o Pix (build 1.22.2/512:
            // `payment-wake-pix-discount-preview` e `payment-wake-pix-discount`). Comparados no passo 29,
            // porque a entrega só aparece no Resumo.
            await step('checkoutPage.lerPreviaPix() - antes de escolher o Pix', async () => { previaPix = await checkoutPage.lerPreviaPix(); });
            await step('checkoutPage.selecionarPix()', async () => { totalPagamento = await checkoutPage.selecionarPix(); });
            await step('checkoutPage.lerDescontoPix() - depois de escolher o Pix', async () => { pixEscolhido = await checkoutPage.lerDescontoPix(); });
            await step('checkoutPage.prosseguirParaResumo()', () => checkoutPage.prosseguirParaResumo());

            // Passo 29 — validação dos valores ANTES do clique que leva à tela do Pix (regra a partir
            // do build 1.21.7/507), com os valores guardados no teste:
            //   (1) Produtos do resumo  = precoOculos + precoCamisa (lidos na PDP);
            //   (2) Descontos do resumo = desconto de cupom + DESCONTO DO PIX (percentual lido no Pagamento
            //       DEPOIS de escolher o Pix, sobre produtos - cupom, SEM a entrega);
            //   (3) Total do resumo     = produtos - cupom + entrega - desconto do Pix;
            //   (4) valor do Pix escolhido no Pagamento e total do botão de pagamento = (3);
            //   (5) valor da prévia (antes de escolher) = produtos - cupom + entrega - (percentual da prévia).
            //       Com frete grátis em todas as capturas, não está provado se a prévia inclui a entrega.
            // A entrega vem do próprio resumo (o teste não escolhe frete com preço conhecido).
            // Se algum valor não conferir, o teste para AQUI, antes de finalizar — nenhum pedido é criado.
            await step('validar valores do resumo (com desconto do Pix)', async () => {
                const v = await checkoutPage.lerValoresDoResumo();
                valoresResumo = v;
                const somaProdutos = Math.round((precoOculos + precoCamisa) * 100) / 100;
                const baseDoPix = Math.round((somaProdutos - descontoCupom) * 100) / 100;
                const pix = pixEscolhido as LinhaPix | null;
                const previa = previaPix as LinhaPix | null;
                if (!pix || !previa) {
                    throw new Error('Pagamento: a prévia ou o desconto do Pix escolhido não foram lidos.');
                }
                const descontoPix = Math.round(baseDoPix * (pix.percentual / 100) * 100) / 100;
                const descontoPrevia = Math.round(baseDoPix * (previa.percentual / 100) * 100) / 100;
                const previaEsperada = Math.round((baseDoPix + v.entrega - descontoPrevia) * 100) / 100;
                const descontosEsperados = Math.round((descontoCupom + descontoPix) * 100) / 100;
                const totalEsperado = Math.round((baseDoPix + v.entrega - descontoPix) * 100) / 100;
                descontoPixEsperado = descontoPix;
                totalComPixEsperado = totalEsperado;

                // Os valores ficam salvos no relatório: parâmetros do teste + anexo com a conta.
                allure.addArgument('Preço óculos', String(precoOculos));
                allure.addArgument('Preço camisa', String(precoCamisa));
                allure.addArgument('Soma dos produtos', String(somaProdutos));
                allure.addArgument('Prévia do Pix (antes de escolher)', `${previa.percentual}% · ${previa.valor}`);
                allure.addArgument('Pix escolhido', `${pix.percentual}% · ${pix.valor}`);
                allure.addArgument(`Desconto do Pix (${pix.percentual}%)`, String(descontoPix));
                allure.addArgument('Total esperado com desconto do Pix', String(totalEsperado));
                allure.addAttachment(
                    'Valores da compra',
                    `Preço óculos (PDP): ${precoOculos}\n` +
                    `Preço camisa (PDP): ${precoCamisa}\n` +
                    `Soma dos produtos: ${somaProdutos}\n` +
                    `Desconto de cupom: ${descontoCupom}\n` +
                    `Entrega (resumo): ${v.entrega}\n` +
                    `Base do desconto do Pix (sem entrega): ${somaProdutos} - ${descontoCupom} = ${baseDoPix}\n` +
                    `Prévia do Pix (antes de escolher): ${previa.percentual}% · R$ ${previa.valor} | esperado ${baseDoPix} + ${v.entrega} - ${descontoPrevia} = ${previaEsperada}\n` +
                    `Pix escolhido: ${pix.percentual}% · R$ ${pix.valor}\n` +
                    `Desconto do Pix (${pix.percentual}%): ${descontoPix}\n` +
                    `Total esperado com desconto do Pix: ${baseDoPix} + ${v.entrega} - ${descontoPix} = ${totalEsperado}\n\n` +
                    `Resumo — Produtos: ${v.produtos} | Entrega: ${v.entrega} | Descontos: ${v.descontos} | Total: ${v.total}\n` +
                    `Total no botão do pagamento: ${totalPagamento ?? 'não lido'}`,
                    'text/plain'
                );
                console.log(
                    `💲 Óculos ${precoOculos} + camisa ${precoCamisa} = ${somaProdutos}; entrega ${v.entrega}; ` +
                    `prévia ${previa.percentual}% ${previa.valor}; Pix escolhido ${pix.percentual}%, desconto ${descontoPix}; total esperado ${totalEsperado} | ` +
                    `resumo: produtos ${v.produtos}, descontos ${v.descontos}, total ${v.total}`
                );

                const erros: string[] = [];
                if (Math.abs(v.produtos - somaProdutos) > 0.009) {
                    erros.push(`Produtos do resumo = ${v.produtos}, soma dos preços = ${precoOculos} + ${precoCamisa} = ${somaProdutos}`);
                }
                if (Math.abs(v.descontos - descontosEsperados) > 0.009) {
                    erros.push(
                        `Descontos do resumo = ${v.descontos}, esperado = desconto do Pix (${pix.percentual}% de ${baseDoPix}, sem entrega) ${descontoPix}` +
                        (descontoCupom ? ` + cupom ${descontoCupom} = ${descontosEsperados}` : '')
                    );
                }
                if (Math.abs(v.total - totalEsperado) > 0.009) {
                    erros.push(`Total do resumo = ${v.total}, total esperado com desconto do Pix = ${baseDoPix} + ${v.entrega} - ${descontoPix} = ${totalEsperado}`);
                }
                if (Math.abs(pix.valor - totalEsperado) > 0.009) {
                    erros.push(`Valor do Pix escolhido na tela de Pagamento (${pix.percentual}%) = ${pix.valor}, total esperado = ${totalEsperado}`);
                }
                if (Math.abs(previa.valor - previaEsperada) > 0.009) {
                    erros.push(`Prévia do Pix antes de escolher (${previa.percentual}%) = ${previa.valor}, esperado = ${baseDoPix} + ${v.entrega} - ${descontoPrevia} = ${previaEsperada}`);
                }
                if (totalPagamento === null || Math.abs(totalPagamento - totalEsperado) > 0.009) {
                    erros.push(`Total no botão da tela de Pagamento = ${totalPagamento ?? 'não lido'}, total esperado com desconto do Pix = ${totalEsperado}`);
                }
                if (erros.length > 0) {
                    throw new Error(`Valores do resumo não conferem com o desconto do Pix:\n- ${erros.join('\n- ')}`);
                }
                console.log('✅ Resumo confere: preços dos produtos e desconto do Pix (percentual do Pix escolhido, só dos produtos), igual ao Pagamento; prévia confere');
            });

            // Passo 30 — prosseguir com a compra (UM toque; cria o pedido).
            await step('checkoutPage.finalizarPedido()', async () => {
                pedidoFinalizado = true; // marcado antes do toque: a partir daqui a Mochila pode ter virado pedido
                await checkoutPage.finalizarPedido();
            });

            // Passos 31 a 33 — QR code, copiar o código, Meus pedidos com o número.
            await step('pedidoPage.validarQrCode()', () => pedidoPage.validarQrCode());
            await step('pedidoPage.numeroDoPedido()', async () => { numeroPedido = await pedidoPage.numeroDoPedido(); });
            // A partir do build 1.21.7/507 a tela do Pix não mostra valor em R$: o valor foi validado no
            // passo 29 (Pagamento e Resumo). Até o 506 havia aqui o step "validar valor da tela do Pix".
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
                `Prévia do Pix (antes de escolher): ${fmtPix(previaPix)}\n` +
                `Pix escolhido: ${fmtPix(pixEscolhido)}\n` +
                `Desconto do Pix esperado: ${descontoPixEsperado ?? 'não calculado'}\n` +
                `Total esperado com desconto do Pix: ${totalComPixEsperado ?? 'não calculado'}\n` +
                `Total no botão da tela de pagamento: ${totalPagamento ?? 'não lido'}\n` +
                (r
                    ? `Resumo — Produtos: ${r.produtos} | Entrega: ${r.entrega} | Descontos: ${r.descontos} | Total: ${r.total}\n`
                    : 'Resumo: não lido\n') +
                `Pedido nº: ${numeroPedido || 'não criado / não lido'}`,
                'text/plain'
            );
            if (numeroPedido) allure.addArgument('Pedido', numeroPedido);
            if (r) allure.addArgument('Total do resumo', String(r.total));
            if (totalPagamento !== null) allure.addArgument('Total no pagamento', String(totalPagamento));
        }
    });
});
