import { HomePage } from "../pageobjects/HomePage";
import { OnboardingPage } from "../pageobjects/OnboardingPage";
import { LoginPage } from "../pageobjects/LoginPage";
import { PerfilPage } from "../pageobjects/PerfilPage";
import { CadastroPage } from "../pageobjects/CadastroPage";
import { BuscaPage } from "../pageobjects/BuscaPage";
import { ProdutoPage } from "../pageobjects/ProdutoPage";
import { CheckoutPage } from "../pageobjects/CheckoutPage";
import { EnderecoPage, type EnderecoLido } from "../pageobjects/EnderecoPage";
import { primeirosCards } from "../utils/device-index";
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
// Uma senha fora da regra por execução, sorteada entre as 4 (Marcio, 2026-10-19: para caber no tempo
// do iOS; cada run, e cada device do CI, pode validar uma diferente). A sorteada aparece no nome do step.
const SENHAS_INVALIDAS = ['abc', 'abcdefgh', 'Abcdefgh', 'Abcdefg1']; // curta, sem maiúscula, sem número, sem especial
const SENHAS_FORA_DA_REGRA = [SENHAS_INVALIDAS[Math.floor(Math.random() * SENHAS_INVALIDAS.length)]];

// Endereço na mesma conta nova (decisão 1, 2026-11-25): não repete onboarding nem cadastro.
// CEP incompleto `1234` não entra. O teste não toca em `delivery-continue-button`.
const CEP_INVALIDO = '00000000';
const CEP_VALIDO = '01310100';
const CEP_EDITADO = '01226030';
const NUMERO = '1000';
const NUMERO_EDITADO = '1001';

describe('Criar Conta', () => {
    it('Cadastro de conta nova, com os casos inválidos de cada etapa', async function (this: Mocha.Context) {
        const homePage = new HomePage();
        const onboardingPage = new OnboardingPage();
        const loginPage = new LoginPage();
        const perfilPage = new PerfilPage();
        const cadastroPage = new CadastroPage();
        const buscaPage = new BuscaPage();
        const produtoPage = new ProdutoPage();
        const checkoutPage = new CheckoutPage();
        const enderecoPage = new EnderecoPage();

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

            // Conta sem endereço: camiseta na Mochila e o checkout abre o formulário direto.
            await step('homePage.abrirCategorias()', () => homePage.abrirCategorias());
            await step('buscaPage.abrirPelaLupaDeCategorias()', () => buscaPage.abrirPelaLupaDeCategorias());
            await step('buscaPage.buscar("camiseta")', () => buscaPage.buscar('camiseta'));
            const camiseta = primeirosCards();
            console.log(`👕 Camiseta das posições ${camiseta.posicoes.join(', ')} da busca (${camiseta.comoAchei})`);
            await step(`produtoPage.comprarNaPosicao(${camiseta.posicoes.join(', ')}) - camiseta`, async () => {
                await produtoPage.comprarNaPosicao(camiseta.posicoes, 'Camiseta');
            });
            // Igual ao `02`: fecha o sheet de produto adicionado e só então volta a Categorias,
            // onde existe `tab-bag`. No AVD de 2026-11-25 o voltar rodou com o sheet aberto
            // (`bag-continue-shopping` na tela) e 6 toques não chegaram em Categorias.
            await step('produtoPage.continuarComprando()', () => produtoPage.continuarComprando());
            await step('produtoPage.voltarAteCategorias()', () => produtoPage.voltarAteCategorias());
            await step('checkoutPage.abrirCheckoutSemEnderecoSalvo()', () => checkoutPage.abrirCheckoutSemEnderecoSalvo());

            const destinatario = `${dados.nome} ${dados.sobrenome}`;
            await step('enderecoPage.validarFormularioAberto()', () => enderecoPage.validarFormularioAberto());
            await step(`CEP inválido (${CEP_INVALIDO})`, async () => {
                await enderecoPage.preencherCep(CEP_INVALIDO);
                // O erro é conferido antes do Número e do Destinatário: digitar o Destinatário
                // rola o formulário e tira o CEP (e o erro) da tela e da árvore (AVD 1.23.3/562, 2026-11-25).
                await enderecoPage.validarErroNoCep(true);
                await enderecoPage.preencherNumeroEDestinatario(NUMERO, destinatario);
                await enderecoPage.validarSalvar(false);
                await enderecoPage.tocarSalvarSemSair();
            });
            let enderecoDoCep: EnderecoLido = { rua: '', bairro: '', textoNaArvore: false };
            await step(`CEP válido (${CEP_VALIDO})`, async () => {
                await enderecoPage.preencherCep(CEP_VALIDO);
                await enderecoPage.validarErroNoCep(false);
                enderecoDoCep = await enderecoPage.validarEnderecoDoCep();
                await enderecoPage.validarSalvar(true);
            });
            await step('enderecoPage.salvarEIrParaEntrega()', async () => {
                await enderecoPage.salvarEIrParaEntrega();
                await enderecoPage.conferirCepNaEntrega(CEP_VALIDO);
            });

            await step('enderecoPage.abrirMeusEnderecos()', () => enderecoPage.abrirMeusEnderecos());
            await step('enderecoPage.validarUmCartao()', () => enderecoPage.validarUmCartao());
            await step('enderecoPage.abrirAlterarPrimeiro()', () => enderecoPage.abrirAlterarPrimeiro());
            await step('enderecoPage.validarFormularioDeEdicao()', () => enderecoPage.validarFormularioDeEdicao());
            await step(`edição — CEP inválido (${CEP_INVALIDO})`, async () => {
                await enderecoPage.preencherCep(CEP_INVALIDO);
                await enderecoPage.validarErroNoCep(true);
                await enderecoPage.validarSalvar(false);
                await enderecoPage.tocarSalvarSemSair();
            });
            await step(`edição — CEP novo (${CEP_EDITADO})`, async () => {
                await enderecoPage.preencherCep(CEP_EDITADO);
                await enderecoPage.validarErroNoCep(false);
                await enderecoPage.validarRuaEBairroMudaram(enderecoDoCep);
                await enderecoPage.preencherNumero(NUMERO_EDITADO);
            });
            await step('enderecoPage.salvarEIrParaEntrega() - edição', async () => {
                await enderecoPage.salvarEIrParaEntrega();
                await enderecoPage.conferirCepNaEntrega(CEP_EDITADO);
            });
            await step('enderecoPage.abrirMeusEnderecos() - depois da edição', () => enderecoPage.abrirMeusEnderecos());
            await step('enderecoPage.validarUmCartao() - CEP editado', () => enderecoPage.validarUmCartao(CEP_EDITADO));
            await step('enderecoPage.abrirAlterarPrimeiro() - conferir o CEP', async () => {
                await enderecoPage.abrirAlterarPrimeiro();
                await enderecoPage.conferirCepNoFormulario(CEP_EDITADO);
            });
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
                `Conta criada: ${contaCriada ? 'sim (finalizar saiu da etapa 2)' : 'não / não confirmado'}\n` +
                `Destinatário do endereço: ${dados.nome} ${dados.sobrenome}\n` +
                `Número: ${NUMERO} → ${NUMERO_EDITADO}\n` +
                `CEP inválido: ${CEP_INVALIDO}\n` +
                `CEP válido: ${CEP_VALIDO}\n` +
                `CEP editado: ${CEP_EDITADO}`,
                'text/plain'
            );
        }
        // O caminho do endereço entra neste spec. 25 min, como o `02`: o `this.timeout()` dentro
        // do `it` não vale, e os 15 min do mochaOpts cortam a conta + a Mochila + os dois CEPs.
    }).timeout(25 * 60 * 1000);
});
