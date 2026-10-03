import { HomePage } from "../pageobjects/HomePage";
import { LoginPage } from "../pageobjects/LoginPage";
import { PerfilPage } from "../pageobjects/PerfilPage";
import { getCredentials } from "../utils/credentials";
import {
    configurarFechadorDeBanner,
    pularNestaPlataforma,
    rotularTeste,
    step,
} from "../utils/allure-helpers";

// Etapa 1 do M6 — Logout (Funcionalidade "Menu — Logout", PDF §3, página 24).
//
// REGRAS DESTE SPEC (todas decididas pelo Marcio):
//  - Os testes NÃO validam texto e ignoram o idioma (REQUIREMENTS.md, 2026-10-01). O PDF pede o
//    diálogo "Logout" com a pergunta "Você deseja sair da sua conta?" e as opções CANCELAR e SAIR;
//    o OUT-01 valida a ESTRUTURA do diálogo (título, mensagem e os dois botões presentes) e nenhuma
//    string é lida. O estado logado/deslogado é validado pelo Menu (item de sair / menu-card
//    habilitado ou não), nunca por texto. Nenhum seletor mora aqui.
//  - O teste segue o APLICATIVO, nunca o PDF (REQUIREMENTS.md, 2026-10-01).
//  - iOS (DEC-C f, 2026-10-02): o wdio.conf.ts liga autoAcceptAlerts e NÃO foi alterado; o diálogo
//    nativo de logout é aceito sozinho antes de o teste vê-lo. Onde o diálogo não é observável,
//    OUT-01 e OUT-02 são pulados com motivo visível no relatório, e o OUT-03 valida o logout
//    direto pelo estado do Menu (PerfilPage.confirmarLogout já faz isso quando não vê o diálogo).
//
// Cada `it` se prepara sozinho (DEC-A "como hoje": sem sessão mantida entre testes): ativa o app,
// confere a Home, abre o Menu, loga com a conta do device e volta ao Menu logado.

const MOTIVO_IOS_DIALOGO_LOGOUT =
    'DEC-C (f): neste ambiente o iOS roda com autoAcceptAlerts ligado (wdio.conf.ts, não alterado) e ' +
    'o diálogo nativo de logout é aceito sozinho antes de o teste vê-lo; sem diálogo observável não ' +
    'há o que asserir nem cancelar. O OUT-03 valida o logout direto pelo estado do Menu.';

describe('Menu — Logout', () => {
    const homePage = new HomePage();
    const loginPage = new LoginPage();
    const perfilPage = new PerfilPage();

    // Rótulos Allure por aparelho + fechador de banner antes de cada passo (ver allure-helpers.ts).
    async function iniciar(codigo: string) {
        configurarFechadorDeBanner(() => homePage.fechaBanner());
        await rotularTeste(codigo);
    }

    // Dado que o usuário está logado no Menu (a partir do app, com a conta atribuída ao device).
    async function abrirMenuLogado() {
        const { user, password } = await getCredentials();
        await step('homePage.ativarApp()', () => homePage.ativarApp());
        await step('homePage.validarHome()', () => homePage.validarHome());
        await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());
        await step('loginPage.logar()', () => loginPage.logar(user, password));
        await step('homePage.abrirPerfil() — Menu logado', () => homePage.abrirPerfil());
    }

    it('[OUT-01] Sistema solicita confirmação antes de efetuar o logout', async function (this: Mocha.Context) {
        await iniciar('OUT-01');
        if (!perfilPage.dialogoLogoutObservavel()) pularNestaPlataforma(this, MOTIVO_IOS_DIALOGO_LOGOUT);

        // Dado que o usuário está logado e acessa a opção de logout no Menu
        await abrirMenuLogado();

        // Quando o usuário toca na opção de sair
        await step('perfilPage.abrirDialogoLogout()', () => perfilPage.abrirDialogoLogout());

        // Então o sistema exibe o diálogo de logout com a pergunta e as opções CANCELAR e SAIR.
        // Regra fixa (sem texto): vale a estrutura — título, mensagem e os dois botões presentes.
        await step('perfilPage.validarEstruturaDialogoLogout()', () => perfilPage.validarEstruturaDialogoLogout());
    });

    it('[OUT-02] Cancelar logout mantém o usuário autenticado', async function (this: Mocha.Context) {
        await iniciar('OUT-02');
        if (!perfilPage.dialogoLogoutObservavel()) pularNestaPlataforma(this, MOTIVO_IOS_DIALOGO_LOGOUT);

        // Dado que o diálogo de confirmação de logout está exibido
        await abrirMenuLogado();
        await step('perfilPage.abrirDialogoLogout()', () => perfilPage.abrirDialogoLogout());

        // Quando o usuário toca em CANCELAR -> Então o diálogo é fechado e o usuário permanece logado
        await step('perfilPage.cancelarLogout()', () => perfilPage.cancelarLogout());
    });

    it('[OUT-03] Confirmar logout encerra a sessão do usuário', async () => {
        await iniciar('OUT-03');

        // Dado que o diálogo de confirmação de logout está exibido (no iOS com autoAcceptAlerts o
        // diálogo não é visto — DEC-C f — e o logout é validado direto pelo estado do Menu).
        await abrirMenuLogado();
        await step('perfilPage.logout()', () => perfilPage.logout());

        // Quando o usuário toca em SAIR -> Então a sessão do usuário é encerrada. confirmarLogout()
        // toca no botão de confirmar quando o diálogo aparece e, nos dois casos, valida o Menu
        // deslogado (menu-card enabled=false) com erro nomeado — nunca pelo retorno do clique.
        await step('perfilPage.confirmarLogout()', () => perfilPage.confirmarLogout());
    });
});
