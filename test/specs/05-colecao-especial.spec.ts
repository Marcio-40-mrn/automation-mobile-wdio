import { HomePage } from "../pageobjects/HomePage";
import { PerfilPage } from "../pageobjects/PerfilPage";
import {
    anexarCrashDoAppSeFechou,
    configurarFechadorDeBanner,
    limparLogDeCrash,
    rotularTeste,
    step,
} from "../utils/allure-helpers";

// M9, ordem do Marcio (2026-11-04): abrir o Menu, tocar no item da Coleção Especial e validar a tela
// de destino. Sem login: o item existe logado e deslogado. Escrito com Android 1.22.9/530 e iOS
// 1.22.9/372; o Android 531 não foi capturado.
describe('Coleção Especial', () => {
    it('Abre a Coleção Especial pelo Menu e valida a tela de destino', async () => {
        const homePage = new HomePage();
        const perfilPage = new PerfilPage();

        configurarFechadorDeBanner(() => homePage.fechaBanner());
        await rotularTeste('colecao-especial');
        await limparLogDeCrash();

        try {
            await step('homePage.ativarApp()', () => homePage.ativarApp());
            await step('homePage.validarHome()', () => homePage.validarHome());
            await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());
            await step('perfilPage.abrirColecaoEspecial()', () => perfilPage.abrirColecaoEspecial());
            await step('perfilPage.validarColecaoEspecial()', () => perfilPage.validarColecaoEspecial());
        } catch (erro) {
            await anexarCrashDoAppSeFechou();
            throw erro;
        }
    });
});
