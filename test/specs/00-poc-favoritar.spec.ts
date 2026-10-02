import { HomePage } from "../pageobjects/HomePage";
import { LoginPage } from "../pageobjects/LoginPage";
import { CategoriasPage } from "../pageobjects/CategoriasPage";
import { PerfilPage } from "../pageobjects/PerfilPage";
import { FavoritosPage } from "../pageobjects/FavoritosPage";
import { getCredentials } from "../utils/credentials";
import {
    configurarFechadorDeBanner,
    registrarAvisoNoRelatorio,
    rotularTeste,
    step,
} from "../utils/allure-helpers";
import allure from '@wdio/allure-reporter';
import { Status } from 'allure-js-commons';

// POC do favoritar, migrada para o app migrado como FUMAÇA da fase 06 (DEC-A item b, D-02).
// Roda só local, uma plataforma por vez (o CI roda a suíte inteira em todos os devices):
//   Android (AVD, pedido do Marcio):  npm run wdio:android -- --spec test/specs/00-poc-favoritar.spec.ts
//   iOS (sessão AWS Remote Access):   npm run wdio:ios -- --spec test/specs/00-poc-favoritar.spec.ts

// Limpeza depois de uma falha entre favoritar e desfavoritar. Melhor esforço: cada erro aqui é
// registrado e engolido, porque o erro do teste é o que veio antes. O app é reaberto primeiro —
// a falha pode ter deixado a tela em qualquer estado (banner aberto, listagem, modal) e
// terminate + activate volta à Home com o login preservado. Se mesmo assim não der, o Allure
// recebe um anexo dizendo qual conta ficou com qual item, para a limpeza manual ser dirigida.
async function limparFavoritoOrfao(
    produto: string,
    conta: string,
    pages: { homePage: HomePage; perfilPage: PerfilPage; favoritosPage: FavoritosPage },
) {
    const app = 'com.aramis.ecomm';
    console.log(`🧹 Teste falhou com "${produto}" favoritado na conta ${conta} — tentando desfavoritar antes de encerrar`);
    allure.startStep('Limpeza: desfavoritar item órfão');
    try {
        if (process.env.PLATFORM === 'ios') {
            await driver.execute('mobile: terminateApp', { bundleId: app });
            await driver.execute('mobile: activateApp', { bundleId: app });
        } else {
            await driver.execute('mobile: terminateApp', { appId: app });
            await driver.execute('mobile: activateApp', { appId: app });
        }
        await driver.pause(5000);

        await pages.homePage.fechaBanner();
        await pages.homePage.abrirPerfil();
        await pages.homePage.fechaBanner();
        await pages.perfilPage.abrirFavoritos();
        await pages.favoritosPage.tirarSelecaoItem(produto);

        console.log(`🧹 Favorito órfão removido: "${produto}" (${conta})`);
        allure.endStep(Status.PASSED);
    } catch (erroLimpeza) {
        const motivo = erroLimpeza instanceof Error ? erroLimpeza.message : String(erroLimpeza);
        const aviso =
            `O favorito "${produto}" FICOU na conta ${conta}. O próximo run deste device vai ` +
            `DESfavoritar em vez de favoritar — desfavoritar manualmente antes.\nMotivo: ${motivo}`;
        registrarAvisoNoRelatorio('Favorito órfão na conta', aviso);
        allure.endStep(Status.FAILED);
    }
}

describe('Teste Login e Perfil', () => {
    it('Adiciona produto em favoritos e valida adição', async () => {
        const homePage = new HomePage();
        const loginPage = new LoginPage();
        const categoriaPage = new CategoriasPage();
        const perfilPage = new PerfilPage();
        const favoritosPage = new FavoritosPage();

        const { user, password } = await getCredentials();

        // O nome sai da tela em runtime: o teste favorita a primeira camisa que a lista
        // mostrar, e a validação nos favoritos precisa procurar exatamente esse item.
        let produtoFavoritado = '';

        // Habilita a limpeza automática do banner antes de cada step (ver allure-helpers.ts).
        configurarFechadorDeBanner(() => homePage.fechaBanner());

        // Rótulos por aparelho no Allure (historyId adiciona-favoritos::<device>, conta visível).
        await rotularTeste('adiciona-favoritos');

        // Favoritos persistem por CONTA no backend e o coração é um toggle. Um teste que morre
        // entre favoritar e desfavoritar deixa o item na conta, e o run seguinte daquele device
        // DESfavorita em vez de favoritar (CI iOS Run #12 -> #13, iPhone 13). O try/catch abaixo
        // tenta limpar esse rastro antes de relançar o erro original — que continua sendo o erro
        // do teste; a limpeza nunca o substitui.
        let desfavoritado = false;

        try {
            await step('homePage.ativarApp()', () => homePage.ativarApp());
            // Tracer da fase 06: a chegada na Home é validada ANTES de seguir (erro nomeado
            // "Home não apareceu" em vez de falhar três passos adiante).
            await step('homePage.validarHome()', () => homePage.validarHome());
            await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());

            await step('loginPage.logar()', () => loginPage.logar(user, password));
            await step('homePage.abrirCategorias()', () => homePage.abrirCategorias());

            await step('categoriaPage.clickRoupas()', () => categoriaPage.clickRoupas());
            await step('categoriaPage.abrirCamisetas()', () => categoriaPage.abrirCamisas());
            await step('categoriaPage.favoritarPrimeiroProduto()', async () => {produtoFavoritado = await categoriaPage.favoritarPrimeiroProduto();});
            // Um voltar() só: favoritando na listagem, esta é a única tela a sair para chegar em
            // categorias, que é onde a aba Perfil existe (a listagem não tem tab-* nenhum).
            await step('categoriaPage.voltar() - categoria', () => categoriaPage.voltar());

            await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());
            await step('perfilPage.abrirFavoritos()', () => perfilPage.abrirFavoritos());

            await step('favoritosPage.validaElememnto()', () => favoritosPage.validaElememnto(produtoFavoritado));
            await step('favoritosPage.tirarSelecaoItem()', async () => {
                await favoritosPage.tirarSelecaoItem(produtoFavoritado);
                desfavoritado = true;
            });

            await step('categoriaPage.voltar()', () => categoriaPage.voltar());

            await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());
            await step('perfilPage.logout()', () => perfilPage.logout());
            await step('perfilPage.confirmarLogout()', () => perfilPage.confirmarLogout());
        } catch (erro) {
            if (produtoFavoritado && !desfavoritado) {
                await limparFavoritoOrfao(produtoFavoritado, user, { homePage, perfilPage, favoritosPage });
            }
            throw erro;
        }
    });

});
