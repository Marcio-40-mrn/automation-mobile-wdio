import { HomePage } from "../pageobjects/HomePage";
import { OnboardingPage } from "../pageobjects/OnboardingPage";
import { LoginPage } from "../pageobjects/LoginPage";
import { PerfilPage } from "../pageobjects/PerfilPage";
import { CadastroPage } from "../pageobjects/CadastroPage";
import { gerarDadosCadastro, type DadosCadastro } from "../utils/massa";
import {
    anexarCrashDoAppSeFechou,
    configurarFechadorDeBanner,
    limparLogDeCrash,
    rotularTeste,
    step,
} from "../utils/allure-helpers";
import allure from '@wdio/allure-reporter';

const EMAIL_INVALIDO = 'abc';
const CPF_INVALIDO = '11111111111';
const TELEFONE_INCOMPLETO = '1193';
const SENHAS_FORA_DA_REGRA = ['abc', 'abcdefgh', 'Abcdefgh', 'Abcdefg1']; // curta, sem maiúscula, sem número, sem especial

describe('Criar Conta', () => {
    it('Cadastro de conta nova, com os casos inválidos de cada etapa', async function (this: Mocha.Context) {
        const homePage = new HomePage();
        const onboardingPage = new OnboardingPage();
        const loginPage = new LoginPage();
        const perfilPage = new PerfilPage();
        const cadastroPage = new CadastroPage();

        configurarFechadorDeBanner(() => homePage.fechaBanner());
        const { device } = await rotularTeste('criar-conta');

        const dados: DadosCadastro = gerarDadosCadastro(device);
        allure.addArgument('Conta criada', dados.email);
        console.log(`🆕 Dados do cadastro: ${JSON.stringify(dados)}`);

        let contaCriada = false;
        await limparLogDeCrash();

        try {
            // Primeiro acesso, onboarding e Home deslogada.
            await step('onboardingPage.abrirApp() - primeiro acesso', async () => { await onboardingPage.abrirApp(); });
            await step('homePage.ativarApp() - onboarding e termos', () => homePage.ativarApp());
            await step('homePage.validarHome()', () => homePage.validarHome());

            // Menu → Login → Criar Conta.
            await step('homePage.abrirPerfil()', () => homePage.abrirPerfil());
            await step('loginPage.abrirLogin()', () => loginPage.abrirLogin());
            await step('cadastroPage.abrirCadastro()', () => cadastroPage.abrirCadastro());

            // Etapa 1 — cada inválido mostra erro no campo; o válido tira o erro.
            await step(`e-mail inválido ("${EMAIL_INVALIDO}")`, async () => {
                await cadastroPage.preencherCampo('email', EMAIL_INVALIDO);
                await cadastroPage.validarErroNoCampo('email', true);
                await cadastroPage.validarEnviarEtapa1(false);
            });
            await step(`e-mail válido (${dados.email})`, async () => {
                await cadastroPage.preencherCampo('email', dados.email);
                await cadastroPage.validarErroNoCampo('email', false);
            });
            await step(`nome e sobrenome (${dados.nome} ${dados.sobrenome})`, async () => {
                await cadastroPage.preencherCampo('firstName', dados.nome);
                await cadastroPage.preencherCampo('lastName', dados.sobrenome);
                await cadastroPage.validarErroNoCampo('firstName', false);
            });
            await step(`CPF inválido (${CPF_INVALIDO})`, async () => {
                await cadastroPage.preencherCampo('document', CPF_INVALIDO);
                await cadastroPage.validarErroNoCampo('document', true);
                await cadastroPage.validarEnviarEtapa1(false);
            });
            await step(`CPF válido (${dados.cpfFormatado})`, async () => {
                await cadastroPage.preencherCampo('document', dados.cpf);
                await cadastroPage.validarErroNoCampo('document', false);
            });
            await step(`nascimento (${dados.nascimentoFormatado})`, async () => {
                await cadastroPage.preencherCampo('birthDate', dados.nascimento);
                await cadastroPage.validarErroNoCampo('birthDate', false);
            });
            await step(`telefone incompleto (${TELEFONE_INCOMPLETO})`, async () => {
                await cadastroPage.preencherCampo('phone', TELEFONE_INCOMPLETO);
                await cadastroPage.validarErroNoCampo('phone', true);
                await cadastroPage.validarEnviarEtapa1(false);
            });
            await step(`telefone válido (${dados.telefoneFormatado})`, async () => {
                await cadastroPage.preencherCampo('phone', dados.telefone);
                await cadastroPage.validarErroNoCampo('phone', false);
                await cadastroPage.validarEnviarEtapa1(true);
            });
            await step('cadastroPage.enviarEtapa1()', () => cadastroPage.enviarEtapa1());

            // Etapa 2 — cada senha fora da regra e a confirmação diferente deixam finalizar desabilitado.
            for (const senha of SENHAS_FORA_DA_REGRA) {
                await step(`senha fora da regra ("${senha}")`, async () => {
                    await cadastroPage.preencherSenha(senha, senha);
                    await cadastroPage.validarFinalizar(false);
                });
            }
            await step('confirmação diferente da senha', async () => {
                await cadastroPage.preencherSenha(dados.senha, `${dados.senha}x`);
                await cadastroPage.validarFinalizar(false);
            });
            await step(`senha válida ("${dados.senha}")`, async () => {
                await cadastroPage.preencherSenha(dados.senha, dados.senha);
                await cadastroPage.validarFinalizar(true);
            });

            // Finaliza (UM toque, cria a conta) e confere: Home, e o Menu logado.
            await step('cadastroPage.finalizar()', async () => {
                await cadastroPage.finalizar();
                contaCriada = true;
            });
            await step('homePage.validarHome() - depois do cadastro', () => homePage.validarHome());
            await step('homePage.abrirPerfil() - logado', () => homePage.abrirPerfil());
            await step('perfilPage.validarLogado()', () => perfilPage.validarLogado());
        } catch (erro) {
            await anexarCrashDoAppSeFechou();
            throw erro;
        } finally {
            // Todos os dados preenchidos, passe ou falhe (pedido do Marcio). Copiar para a tabela
            // "Contas criadas…" do .planning/MASSA-DE-DADOS.md.
            allure.addAttachment(
                'Dados do cadastro',
                `Device: ${device}\n` +
                `E-mail: ${dados.email}\n` +
                `Nome: ${dados.nome}\n` +
                `Sobrenome: ${dados.sobrenome}\n` +
                `CPF: ${dados.cpfFormatado}\n` +
                `Nascimento: ${dados.nascimentoFormatado}\n` +
                `Telefone: ${dados.telefoneFormatado}\n` +
                `Senha: ${dados.senha}\n` +
                `Conta criada: ${contaCriada ? 'sim (finalizar saiu da etapa 2)' : 'não / não confirmado'}`,
                'text/plain'
            );
        }
    });
});
