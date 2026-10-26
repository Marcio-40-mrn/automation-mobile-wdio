import { HomePage } from "../pageobjects/HomePage";
import { OnboardingPage } from "../pageobjects/OnboardingPage";
import { LoginPage } from "../pageobjects/LoginPage";
import { PerfilPage } from "../pageobjects/PerfilPage";
import { CategoriasPage } from "../pageobjects/CategoriasPage";
import { ProdutoPage } from "../pageobjects/ProdutoPage";
import { CheckoutPage, type DadosCartao, type ValoresResumo } from "../pageobjects/CheckoutPage";
import { PedidoPage } from "../pageobjects/PedidoPage";
import { getCredentials } from "../utils/credentials";
import { posicoesDoProduto } from "../utils/device-index";
import {
    anexarCrashDoAppSeFechou,
    configurarFechadorDeBanner,
    limparLogDeCrash,
    rotularTeste,
    step,
} from "../utils/allure-helpers";
import allure from '@wdio/allure-reporter';

// Compra com CARTÃO, recusa esperada (pedido do Marcio, 2026-10-15; STATE.md "PAROU AQUI
// 2026-10-15, noite", item 2). Igual ao 02-compra-pix, com estas diferenças:
//   - onboarding NEGANDO localização e notificação (o app pede duas vezes; o id de negar muda na
//     2ª — OnboardingPage);
//   - login direto, sem o teste de e-mail inválido;
//   - um item só: a 1ª calça de Categorias → Roupas → Calças;
//   - pagamento com cartão FAKE (MASSA-DE-DADOS.md) até finalizar;
//   - RECUSA = VERDE: um toque em finalizar, a tela de pagamento recusado
//     (`wake-order-processing-recusado`) e, em Meus pedidos, o 1º pedido com o total igual ao
//     total do resumo (build 1.22.0/509; o número do pedido vai para o Allure).
//
// Rodar (AVD, quem roda é o Marcio):
//   npx wdio run ./wdio.conf.ts --spec test/specs/03-compra-cartao.spec.ts
//
// ATENÇÃO: o teste FINALIZA uma compra de verdade. Cada execução cria um pedido real (que o
// backend cancela sozinho ~15–20 s depois, porque o cartão é fake). O toque em finalizar nunca é
// repetido (CheckoutPage.finalizarPedidoComCartao).
//
// Seletores: .planning/drafts/app-migrado/android/captures-2026-10-15-compra-cartao/ (build
// 1.21.6/506, caps. 00–61, NOTAS.md) e drafts android 29–33.
//
// iOS: o onboarding negando tem ramo (alertas negados por `mobile: alert`, autoAcceptAlerts fora
// do wdio.conf.ts desde 2026-10-16); os métodos de Calças, cartão e pedido ainda falham explícito.

// Cartão fake de .planning/MASSA-DE-DADOS.md ("Cartão de crédito (fake)", gerado em 2026-10-15):
// passa só no Luhn; o gateway recusa. Número e CPF só com dígitos (a máscara é do app).
const CARTAO_FAKE: DadosCartao = {
    numero: '4693577571758219',
    titular: 'TESTE AUTOMACAO',
    mes: '12',
    ano: '30',
    cvv: '123',
    cpf: '59899811556',
};

describe('Compra', () => {
    it('Fluxo de compra com cartão', async function (this: Mocha.Context) {
        const homePage = new HomePage();
        const onboardingPage = new OnboardingPage();
        const loginPage = new LoginPage();
        const perfilPage = new PerfilPage();
        const categoriasPage = new CategoriasPage();
        const produtoPage = new ProdutoPage();
        const checkoutPage = new CheckoutPage();
        const pedidoPage = new PedidoPage();

        const { user, password } = await getCredentials();

        configurarFechadorDeBanner(() => homePage.fechaBanner());
        await rotularTeste('compra-cartao');

        // Valores lidos da tela a cada execução (nenhum fixo) e guardados para as validações e para
        // o anexo "Evidências da compra" no fim (finally).
        let precoCalca = 0;
        let itensNaMochila: number | null = null;
        let totalPagamento: number | null = null;
        let valorParcela: number | null = null;
        let valoresResumo: ValoresResumo | null = null;
        let numeroPedido = '';
        let totalPedido: number | null = null;
        let pedidoFinalizado = false;

        // Começa com o buffer de crash do Android vazio: se o app travar, o log anexado é DESTA execução.
        await limparLogDeCrash();

        try {
            // Onboarding negando as permissões (as duas solicitações) e aceitando Política e Termos.
            await step('onboardingPage.abrirApp() - primeiro acesso', async () => { await onboardingPage.abrirApp(); });
            await step('onboardingPage.negarPermissoesIniciais() - localização e notificação', () => onboardingPage.negarPermissoesIniciais());
            await step('onboardingPage.continuarTopicosNegandoPermissoes() - 2ª solicitação', () => onboardingPage.continuarTopicosNegandoPermissoes());
            await step('onboardingPage.aceitarPoliticaETermos()', () => onboardingPage.aceitarPoliticaETermos());
            await step('homePage.validarHome()', () => homePage.validarHome());

            // Menu: print da versão e do build, no rodapé (igual ao 04).
            await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());
            await step('perfilPage.anexarRodapeDoMenu()', () => perfilPage.anexarRodapeDoMenu());

            // Login direto.
            await step('loginPage.abrirLogin()', () => loginPage.abrirLogin());
            await step('loginPage.preencherEmail()', () => loginPage.preencherEmail(user));
            await step('loginPage.preencherSenha()', () => loginPage.preencherSenha(password));
            await step('loginPage.entrar()', () => loginPage.entrar(`conta "${user}"`));
            await step('homePage.validarHome() - depois do login', () => homePage.validarHome());
            await step('homePage.abrirPerfil() - logado', () => homePage.abrirPerfil());
            await step('perfilPage.validarLogado()', () => perfilPage.validarLogado());

            // Categorias → Roupas → Calças: a calça da posição DESTE device, com tamanho, e volta até
            // Categorias. Produto diferente por teste e por device (device-index.ts): blocos 0, 1 e 2;
            // o 2º e o 3º só se o anterior não tiver tamanho com estoque.
            const calca = posicoesDoProduto([0, 1, 2]);
            console.log(`👖 Calça das posições ${calca.posicoes.join(', ')} da listagem (${calca.comoAchei})`);
            await step('homePage.abrirCategorias()', () => homePage.abrirCategorias());
            await step('categoriasPage.clickRoupas()', () => categoriasPage.clickRoupas());
            await step('categoriasPage.abrirCalcas()', () => categoriasPage.abrirCalcas());
            await step(`produtoPage.comprarNaPosicao(${calca.posicoes.join(', ')}) - calça`, async () => {
                precoCalca = await produtoPage.comprarNaPosicao(calca.posicoes, 'Calça');
            });
            await step('produtoPage.continuarComprando()', () => produtoPage.continuarComprando());
            await step('produtoPage.voltarAteCategorias()', () => produtoPage.voltarAteCategorias());

            // Mochila com UM item só (o cenário compra uma calça).
            await step('checkoutPage.abrirMochila()', async () => {
                itensNaMochila = await checkoutPage.abrirMochila(1);
                if (itensNaMochila !== 1) {
                    throw new Error(
                        `Mochila com ${itensNaMochila} produtos; o cenário compra 1 item só (produto de execução anterior na conta ${user}?).`
                    );
                }
            });

            // Endereço, entrega, cartão.
            await step('checkoutPage.finalizarCompraESelecionarEndereco()', () => checkoutPage.finalizarCompraESelecionarEndereco());
            await step('checkoutPage.selecionarEntregaEContinuar()', () => checkoutPage.selecionarEntregaEContinuar());
            await step('checkoutPage.selecionarCartao()', async () => { totalPagamento = await checkoutPage.selecionarCartao(); });
            await step('checkoutPage.prosseguirParaFormularioDoCartao()', () => checkoutPage.prosseguirParaFormularioDoCartao());
            await step('checkoutPage.preencherCartao() - cartão fake', () => checkoutPage.preencherCartao(CARTAO_FAKE));
            await step('checkoutPage.escolherParcelaAVista()', async () => { valorParcela = await checkoutPage.escolherParcelaAVista(); });
            await step('checkoutPage.prosseguirDoCartaoParaResumo()', () => checkoutPage.prosseguirDoCartaoParaResumo());

            // Resumo, ANTES do toque em finalizar: Produtos = preço da calça lido na PDP (igual ao 04).
            // Se não conferir, o teste para aqui e nenhum pedido é criado.
            await step('validar valor dos produtos no resumo', async () => {
                const v = await checkoutPage.lerValoresDoResumo();
                valoresResumo = v;
                allure.addArgument('Preço calça', String(precoCalca));
                allure.addArgument('Total do resumo', String(v.total));
                console.log(
                    `💲 Calça ${precoCalca} | resumo: produtos ${v.produtos}, entrega ${v.entrega}, descontos ${v.descontos}, total ${v.total} | ` +
                    `botão do pagamento ${totalPagamento ?? 'não lido'} | parcela 1x ${valorParcela ?? 'não lida'}`
                );
                if (Math.abs(v.produtos - precoCalca) > 0.009) {
                    throw new Error(`Produtos do resumo = ${v.produtos}, preço da calça lido na PDP = ${precoCalca}.`);
                }
                console.log('✅ Resumo confere: valor dos produtos = preço da calça lido na PDP');
            });

            // UM toque em finalizar (cria o pedido) e a tela de pagamento recusado (Android 509+) ou, se
            // vier o modal antifraude, "Entendi" e a tela do pedido (iOS 1.22.2, CI Run #29). O modal é
            // aceito sempre que aparecer (Marcio, 2026-10-20). Verde = tela de recusa/do pedido + 1º
            // pedido de Meus pedidos com o total do resumo (decisão do Marcio, 2026-10-19).
            await step('checkoutPage.finalizarPedidoComCartao()', async () => {
                pedidoFinalizado = true; // marcado antes do toque: a partir daqui pode existir pedido
                await checkoutPage.finalizarPedidoComCartao();
            });
            await step('pedidoPage.abrirMeusPedidosDepoisDaRecusa()', () => pedidoPage.abrirMeusPedidosDepoisDaRecusa());
            await step('pedidoPage.numeroDoPedidoComCartao()', async () => { numeroPedido = await pedidoPage.numeroDoPedidoComCartao(); });

            // Total do 1º pedido de Meus pedidos = total do resumo.
            await step('validar total do pedido em Meus pedidos = total do resumo', async () => {
                totalPedido = await pedidoPage.totalDoPedidoComCartao();
                allure.addArgument('Total do pedido', String(totalPedido));
                const r = valoresResumo as ValoresResumo | null;
                if (!r) {
                    throw new Error('Pedido recusado: o total do resumo não foi lido, não há com o que comparar.');
                }
                if (Math.abs(totalPedido - r.total) > 0.009) {
                    throw new Error(`Pedido ${numeroPedido}: total ${totalPedido} em Meus pedidos, diferente do total do resumo ${r.total}.`);
                }
                console.log(`✅ Pedido ${numeroPedido} em Meus pedidos com total ${totalPedido} = total do resumo`);
            });
        } catch (erro) {
            // Se a falha foi o app fechando (crash intermitente do app), anexa o logcat de crash.
            await anexarCrashDoAppSeFechou();
            throw erro;
        } finally {
            // Evidências no nível do TESTE, passe ou falhe.
            const r = valoresResumo as ValoresResumo | null;
            allure.addAttachment(
                'Evidências da compra',
                `Preço calça (lido na PDP): ${precoCalca || 'não lido'}\n` +
                `Itens na Mochila: ${itensNaMochila ?? 'não lido'}\n` +
                `Total no botão da tela de pagamento: ${totalPagamento ?? 'não lido'}\n` +
                `Parcela escolhida (1x): ${valorParcela ?? 'não lida'}\n` +
                (r
                    ? `Resumo — Produtos: ${r.produtos} | Entrega: ${r.entrega} | Descontos: ${r.descontos} | Total: ${r.total}\n`
                    : 'Resumo: não lido\n') +
                `Toque em finalizar: ${pedidoFinalizado ? 'sim (1 vez)' : 'não'}\n` +
                `Pedido nº: ${numeroPedido || 'não criado / não lido'}\n` +
                `Total na tela do pedido cancelado: ${totalPedido ?? 'não lido'}\n` +
                `Cartão (fake, MASSA-DE-DADOS.md): final ${CARTAO_FAKE.numero.slice(-4)}, validade ${CARTAO_FAKE.mes}/${CARTAO_FAKE.ano}`,
                'text/plain'
            );
            if (numeroPedido) allure.addArgument('Pedido', numeroPedido);
            if (totalPagamento !== null) allure.addArgument('Total no pagamento', String(totalPagamento));
        }
    });
});
