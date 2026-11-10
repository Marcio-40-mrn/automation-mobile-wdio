import { HomePage } from "../pageobjects/HomePage";
import { LoginPage } from "../pageobjects/LoginPage";
import { PerfilPage } from "../pageobjects/PerfilPage";
import { CategoriasPage } from "../pageobjects/CategoriasPage";
import { BuscaPage } from "../pageobjects/BuscaPage";
import { ProdutoPage } from "../pageobjects/ProdutoPage";
import { CheckoutPage } from "../pageobjects/CheckoutPage";
import { CompartilharPage, type ItemMochila } from "../pageobjects/CompartilharPage";
import { getCredentials } from "../utils/credentials";
import { posicoesDoProduto } from "../utils/device-index";
import {
    anexarCrashDoAppSeFechou,
    configurarFechadorDeBanner,
    limparLogDeCrash,
    rotularTeste,
    step,
} from "../utils/allure-helpers";

// Compartilhar carrinho, um e2e com os 15 cenários do M9 (Marcio, 2026-11-06; nº no ROADMAP). Escrito
// com Android 1.22.9/534 e iOS 1.22.9/377, depois de executar os 15 por Appium nas duas plataformas.
// Não cria pedido. Os blocos dos produtos são livres nos outros specs (device-index.ts).
describe('Compartilhar carrinho', () => {
    it('Compartilha a Mochila e valida o carrinho recebido pelo link', async function () {
        // Limite só deste teste, nas duas plataformas: 40 min no lugar dos 15 min do `mochaOpts.timeout`.
        // No CI Run #52 (2026-11-09, iOS 1.22.9/377) o iPhone 13, o 14 e o 14 Pro Max estouraram os
        // 15 min no cenário 40, com 4 cenários ainda pela frente.
        this.timeout(40 * 60 * 1000);

        const homePage = new HomePage();
        const loginPage = new LoginPage();
        const perfilPage = new PerfilPage();
        const categoriasPage = new CategoriasPage();
        const buscaPage = new BuscaPage();
        const produtoPage = new ProdutoPage();
        const checkoutPage = new CheckoutPage();
        const compartilharPage = new CompartilharPage();

        const { user, password } = await getCredentials();

        configurarFechadorDeBanner(() => homePage.fechaBanner());
        await rotularTeste('compartilhar-carrinho');
        await limparLogDeCrash();

        const comprarNaBusca = async (blocos: number[], rotulo: string) => {
            const { posicoes } = posicoesDoProduto(blocos);
            await step('homePage.abrirCategorias()', () => homePage.abrirCategorias());
            await step('buscaPage.abrirPelaLupaDeCategorias()', () => buscaPage.abrirPelaLupaDeCategorias());
            await step('buscaPage.buscar("bermuda")', () => buscaPage.buscar('bermuda'));
            await step(`produtoPage.comprarNaPosicao(${posicoes.join(', ')}) - ${rotulo}`, async () => {
                await produtoPage.comprarNaPosicao(posicoes, rotulo);
            });
            await step('produtoPage.continuarComprando()', () => produtoPage.continuarComprando());
            await step('produtoPage.voltarAteCategorias()', () => produtoPage.voltarAteCategorias());
        };

        let compartilhados: ItemMochila[] = [];
        let linkDoApp = '';

        try {
            await step('homePage.ativarApp()', () => homePage.ativarApp());
            await step('homePage.validarHome()', () => homePage.validarHome());
            await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());
            await step('loginPage.logar()', () => loginPage.logar(user, password));

            // 1: Mochila vazia, sem o botão.
            await step('checkoutPage.esvaziarMochila() - início', () => checkoutPage.esvaziarMochila());
            await step('compartilhar: botão ausente (1)', () => compartilharPage.validarBotaoAusente());

            // 2: 1 produto.
            const calca = posicoesDoProduto([3, 4]);
            await step('homePage.abrirCategorias()', () => homePage.abrirCategorias());
            await step('categoriasPage.clickRoupas()', () => categoriasPage.clickRoupas());
            await step('categoriasPage.abrirCalcas()', () => categoriasPage.abrirCalcas());
            await step(`produtoPage.comprarNaPosicao(${calca.posicoes.join(', ')}) - calça`, async () => {
                await produtoPage.comprarNaPosicao(calca.posicoes, 'Calça');
            });
            await step('produtoPage.continuarComprando()', () => produtoPage.continuarComprando());
            await step('produtoPage.voltarAteCategorias()', () => produtoPage.voltarAteCategorias());
            await step('checkoutPage.abrirMochila(1)', async () => { await checkoutPage.abrirMochila(1); });
            await step('compartilhar: botão com 1 item (2)', () => compartilharPage.validarBotaoPresente(1));

            // 3: 2 produtos, um deles com quantidade 2.
            await comprarNaBusca([3, 4], 'Bermuda');
            await step('checkoutPage.abrirMochila(2)', async () => { await checkoutPage.abrirMochila(2); });
            await step('compartilhar: botão com 2 itens (3)', () => compartilharPage.validarBotaoPresente(2));
            await step('compartilhar: quantidade 2 em um item', async () => {
                compartilhados = await compartilharPage.aumentarQuantidadeDeUmItem(await compartilharPage.lerMochila());
            });

            // 4, 7, 12 e 13: menu nativo, link só com o código e Mochila igual depois de compartilhar.
            await step('compartilhar: menu nativo e link (4, 7, 12, 13)', async () => {
                const previa = await compartilharPage.compartilharECopiar();
                await compartilharPage.validarMochila(compartilhados, 'depois de compartilhar');
                linkDoApp = compartilharPage.validarFormatoDoLink(await compartilharPage.lerLinkCopiado(previa));
            });

            // 5 e 17: Mochila vazia, link abre no app e "Add all" traz os mesmos itens.
            await step('checkoutPage.esvaziarMochila() - antes de abrir o link', () => checkoutPage.esvaziarMochila());
            await step('compartilhar: abrir o carrinho recebido (17)', () => compartilharPage.abrirCarrinhoRecebido(linkDoApp, compartilhados));
            await step('compartilhar: "Add all" e Mochila igual à compartilhada (5)', async () => {
                await compartilharPage.adicionarTudoEAbrirMochila();
                await compartilharPage.validarMochila(compartilhados, 'igual à compartilhada');
            });

            // 40: produto diferente, somado aos que vieram do link.
            await comprarNaBusca([5, 6], 'Bermuda diferente');
            await step('checkoutPage.abrirMochila() - produto novo (40)', async () => { await checkoutPage.abrirMochila(compartilhados.length + 1); });
            let produtoNovo: ItemMochila | undefined;
            await step('compartilhar: produto diferente na Mochila (40)', async () => {
                const lidos = await compartilharPage.lerMochila();
                produtoNovo = lidos.find((l) => !compartilhados.some((c) => c.id === l.id));
                if (!produtoNovo) throw new Error('Mochila: o produto diferente não entrou junto dos itens do link.');
            });

            // 41 e 42: editar os itens que vieram do link.
            const comQuantidade = compartilhados.find((i) => i.quantidade >= 2) as ItemMochila;
            const semQuantidade = compartilhados.find((i) => i.id !== comQuantidade.id) as ItemMochila;
            await step('compartilhar: remover item vindo do link (41)', () => compartilharPage.removerItem(semQuantidade.id));
            await step('compartilhar: alterar quantidade de item vindo do link (42)', () => compartilharPage.validarAlteracaoDeQuantidade(comQuantidade));

            // 19: "Add all" com outro produto já na Mochila.
            await step('compartilhar: deixar só o produto diferente na Mochila', () => compartilharPage.removerItem(comQuantidade.id));
            await step('compartilhar: abrir o link com a Mochila cheia (19)', () => compartilharPage.abrirCarrinhoRecebido(linkDoApp, compartilhados));
            await step('compartilhar: "Add all" soma à Mochila (19)', async () => {
                await compartilharPage.adicionarTudoEAbrirMochila();
                await compartilharPage.validarMochila([...compartilhados, produtoNovo as ItemMochila], 'somada');
            });

            // 45: link inválido.
            await step('checkoutPage.esvaziarMochila() - antes do logout', () => checkoutPage.esvaziarMochila());
            await step('compartilhar: link inválido (45)', () => compartilharPage.validarLinkInvalido());

            // 22: deslogado, o link abre e o "Add all" funciona sem login.
            await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());
            await step('perfilPage.logout()', () => perfilPage.logout());
            await step('perfilPage.confirmarLogout()', () => perfilPage.confirmarLogout());
            await step('compartilhar: carrinho recebido sem login (22)', () => compartilharPage.abrirCarrinhoRecebido(linkDoApp, compartilhados));
            await step('compartilhar: Mochila deslogada igual à compartilhada (22)', async () => {
                await compartilharPage.adicionarTudoEAbrirMochila();
                await compartilharPage.validarMochila(compartilhados, 'deslogada');
            });

            // A Mochila deslogada sobrevive ao `terminateApp` do Remote Access.
            await step('checkoutPage.esvaziarMochila() - fim', () => checkoutPage.esvaziarMochila());
        } catch (erro) {
            await anexarCrashDoAppSeFechou();
            throw erro;
        }
    });
});
