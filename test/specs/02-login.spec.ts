import { HomePage } from "../pageobjects/HomePage";
import { LoginPage } from "../pageobjects/LoginPage";
import { EsqueciSenhaPage } from "../pageobjects/EsqueciSenhaPage";
import { gerarEmailFicticio, gerarSenhaFicticia } from "../utils/massa";
import {
    configurarFechadorDeBanner,
    rotularTeste,
    step,
} from "../utils/allure-helpers";

// Etapa 1 do M6 — Login (Funcionalidade "Login — Autenticação e Recuperação de Senha", PDF §3).
//
// LOG-06 ("Login bem-sucedido retorna o usuário à tela de origem com os itens da Mochila
// preservados") NÃO está neste arquivo: depende de PDP e Mochila e é implementado no 06-09, junto
// com o MOC-06. Por isso são 6 `it` (LOG-01..05 e LOG-07), nenhum deles pulado.
//
// REGRAS DESTE SPEC (decididas pelo Marcio):
//  - Os testes NÃO validam texto e ignoram o idioma (REQUIREMENTS.md, 2026-10-01). A asserção é
//    pelo ESTADO: botão de entrar habilitado/desabilitado (atributo `enabled`), modal de erro
//    presente e "não logou", tela de recuperação aberta. Nenhuma mensagem é lida ou comparada, e
//    nenhum seletor mora aqui.
//  - O teste segue o APLICATIVO, nunca o PDF. LOG-05: o PDF cita a mensagem "E-mail ou senha
//    inválidos" e diz que ela "não indica qual campo está errado"; ambas as cláusulas dependem de
//    LER o texto, então o teste só asserta que o app recusa com UM modal genérico e NÃO loga. A
//    cláusula de texto fica sem asserção por decisão da regra fixa.
//  - Conta de teste: LOG-05 usa e-mail fictício `informatica.mrn+log05-<device>-...@gmail.com`
//    (DEC-C g) — endereço único por device e por execução, nunca cadastrado; a conta real do
//    device (getCredentials) nunca recebe senha errada (risco de bloqueio por tentativas).
//
// App limpo por teste: o afterTest do wdio.conf.ts limpa o app depois de cada `it`, então cada um
// refaz o onboarding (ativarApp) e começa em loginPage.abrirLogin(). Sessão mantida por spec não
// foi adotada (DEC-A "como hoje").

describe('Login — Autenticação e Recuperação de Senha', () => {
    const homePage = new HomePage();
    const loginPage = new LoginPage();
    const esqueciSenhaPage = new EsqueciSenhaPage();

    // Rótulos Allure por aparelho + fechador de banner antes de cada passo; devolve o device, que
    // alimenta o e-mail fictício (único por aparelho).
    async function iniciar(codigo: string): Promise<string> {
        configurarFechadorDeBanner(() => homePage.fechaBanner());
        const { device } = await rotularTeste(codigo);
        return device;
    }

    // Dado que o usuário está na tela de Login (a partir do app limpo)
    async function abrirTelaDeLogin() {
        await step('homePage.ativarApp()', () => homePage.ativarApp());
        await step('homePage.validarHome()', () => homePage.validarHome());
        await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());
        await step('loginPage.abrirLogin()', () => loginPage.abrirLogin());
    }

    // Asserção por ESTADO do botão de entrar, com erro nomeado (nunca "esperado true, veio false").
    async function exigirBotaoEntrar(habilitado: boolean, situacao: string) {
        const atual = await loginPage.botaoEntrarHabilitado();
        if (atual !== habilitado) {
            throw new Error(
                `Botão de entrar ${atual ? 'HABILITADO' : 'DESABILITADO'} com ${situacao}; ` +
                `esperado ${habilitado ? 'habilitado' : 'desabilitado'}.`
            );
        }
    }

    it('[LOG-01] Botão de entrar desabilitado com e-mail e senha em branco', async () => {
        await iniciar('LOG-01');

        // Dado que o usuário está na tela de Login com ambos os campos em branco
        await abrirTelaDeLogin();

        // Quando o usuário visualiza o botão de entrar -> Então o botão de entrar está desabilitado
        await step('botão de entrar desabilitado (e-mail e senha em branco)', () =>
            exigirBotaoEntrar(false, 'e-mail e senha em branco'));
    });

    it('[LOG-02] Botão de entrar desabilitado com e-mail válido mas senha em branco', async () => {
        const device = await iniciar('LOG-02');

        // Dado que o usuário está na tela de Login com o e-mail em formato válido e a senha em branco
        await abrirTelaDeLogin();
        await step('loginPage.preencherEmail(e-mail válido)', () => loginPage.preencherEmail(gerarEmailFicticio(device)));

        // Quando o usuário visualiza o botão de entrar -> Então o botão de entrar está desabilitado
        await step('botão de entrar desabilitado (senha em branco)', () =>
            exigirBotaoEntrar(false, 'e-mail válido e senha em branco'));
    });

    it('[LOG-03] Botão de entrar desabilitado com senha preenchida mas e-mail em formato inválido', async () => {
        const device = await iniciar('LOG-03');
        // Formato inválido = sem o caractere arroba.
        const emailSemArroba = gerarEmailFicticio(device).replace('@', '');

        // Dado que o usuário está na tela de Login com o e-mail sem arroba e a senha preenchida
        await abrirTelaDeLogin();
        await step('loginPage.preencherEmail(e-mail sem arroba)', () => loginPage.preencherEmail(emailSemArroba));
        await step('loginPage.preencherSenha()', () => loginPage.preencherSenha(gerarSenhaFicticia()));

        // Quando o usuário visualiza o botão de entrar -> Então o botão de entrar está desabilitado
        await step('botão de entrar desabilitado (e-mail inválido)', () =>
            exigirBotaoEntrar(false, 'e-mail em formato inválido e senha preenchida'));
    });

    it('[LOG-04] Botão de entrar habilitado com e-mail válido e senha preenchida', async () => {
        const device = await iniciar('LOG-04');

        // Dado que o usuário está na tela de Login
        await abrirTelaDeLogin();

        // Quando o usuário preenche o e-mail em formato válido e a senha com qualquer valor
        // (o botão NÃO é tocado: o cenário só olha o estado)
        await step('loginPage.preencherEmail(e-mail válido)', () => loginPage.preencherEmail(gerarEmailFicticio(device)));
        await step('loginPage.preencherSenha()', () => loginPage.preencherSenha(gerarSenhaFicticia()));

        // Então o botão de entrar está habilitado
        await step('botão de entrar habilitado', () =>
            exigirBotaoEntrar(true, 'e-mail válido e senha preenchida'));
    });

    it('[LOG-05] Credenciais incorretas exibem mensagem genérica sem indicar qual campo está errado', async () => {
        const device = await iniciar('LOG-05');

        // Dado que o usuário está na tela de Login com o botão de entrar habilitado — com e-mail
        // FICTÍCIO e único (DEC-C g): a conta real do device nunca recebe senha errada.
        await abrirTelaDeLogin();
        await step('loginPage.preencherEmail(e-mail fictício)', () => loginPage.preencherEmail(gerarEmailFicticio(device)));
        await step('loginPage.preencherSenha()', () => loginPage.preencherSenha(gerarSenhaFicticia()));
        await step('botão de entrar habilitado', () => exigirBotaoEntrar(true, 'e-mail fictício e senha preenchida'));

        // Quando o usuário toca em entrar com credenciais que não correspondem a uma conta.
        // Então o app recusa com o modal de erro e NÃO loga. A mensagem não é lida (regra fixa: sem
        // texto) — vale o estado: modal presente e nenhuma tab bar.
        await step('loginPage.entrarEsperandoErro()', () => loginPage.entrarEsperandoErro());

        // Deixa o app de volta na tela de Login (Android: toca o OK; iOS: relança o app, DEC-C h).
        await step('loginPage.fecharModalErro()', () => loginPage.fecharModalErro());
    });

    it('[LOG-07] Acessar a tela de recuperação de senha a partir do link Esqueci minha senha', async () => {
        const device = await iniciar('LOG-07');

        // Dado que o usuário está na tela de Login
        await abrirTelaDeLogin();

        // Quando o usuário toca no link "Esqueci minha senha"
        await step('loginPage.abrirEsqueciSenha()', () => loginPage.abrirEsqueciSenha());

        // Então o sistema exibe uma tela com a instrução, um campo de E-mail e o botão de envio.
        // A instrução é texto e não é lida (regra fixa): a tela é reconhecida pela estrutura
        // (um campo de e-mail + o botão) e o estado do formulário pelo `enabled` do botão.
        await step('esqueciSenhaPage.validarTela()', () => esqueciSenhaPage.validarTela());
        await step('botão de envio desabilitado com o campo vazio', async () => {
            if (await esqueciSenhaPage.botaoEnviarHabilitado()) {
                throw new Error('Botão de envio HABILITADO com o campo de e-mail vazio; esperado desabilitado.');
            }
        });
        await step('esqueciSenhaPage.preencherEmail()', () => esqueciSenhaPage.preencherEmail(gerarEmailFicticio(device)));
        await step('botão de envio habilitado com e-mail preenchido', async () => {
            if (!(await esqueciSenhaPage.botaoEnviarHabilitado())) {
                throw new Error('Botão de envio DESABILITADO com o e-mail preenchido; esperado habilitado.');
            }
        });
        // O link de redefinição NÃO é enviado: nenhum e-mail sai (T-06-04-03). A leitura da caixa
        // do Gmail para validar o e-mail recebido será planejada depois (pendência 06-04).
    });
});
