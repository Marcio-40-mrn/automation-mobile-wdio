import { BasePage, timewhait, seletorTestId } from "./BasePage";
import { driver, $ } from '@wdio/globals'

// Criar Conta (cadastro), a partir da tela de Login. Seletores medidos no Android, build
// 1.21.6/506: .planning/drafts/app-migrado/android/captures-2026-10-16-criar-conta/ (drafts 34–37).
//
// iOS: SEM captura no build atual (só o draft iOS 31, build 335, com a tela vazia). Decisão do
// Marcio (2026-10-16): no iOS o teste FALHA explícito aqui, em vez de pular — fica vermelho até a
// captura iOS ser feita e o ramo ser escrito.
//
// Duas etapas:
//   1. e-mail, nome, sobrenome, CPF, nascimento, telefone → `create-account-submit`;
//   2. senha e confirmação → `create-account-security-submit`, que cria a conta e cai na Home
//      LOGADO (cap. 29), sem tela de sucesso nem verificação de e-mail.
// Os dois botões ficam enabled=false até a etapa inteira estar válida: é o assert sem texto.

export type CampoCadastro = 'email' | 'firstName' | 'lastName' | 'document' | 'birthDate' | 'phone';

const ID_CAMPO: Record<CampoCadastro, string> = {
    email: 'create-account-email',
    firstName: 'create-account-firstName',
    lastName: 'create-account-lastName',
    document: 'create-account-document',
    birthDate: 'create-account-birthDate',
    phone: 'create-account-phone',
};

const ID_SENHA = 'create-account-security-password';
const ID_CONFIRMACAO = 'create-account-security-password-confirmation';
const ID_ENVIAR_ETAPA1 = 'create-account-submit';
const ID_FINALIZAR = 'create-account-security-submit';

function falharNoIOS(passo: string): void {
    if (process.env.PLATFORM === 'ios') {
        throw new Error(
            `CadastroPage.${passo}: ramo iOS não escrito — o Criar Conta não foi capturado no iOS no build ` +
            'atual (só o draft iOS 31, build 335). Capturar no Remote Access e escrever o ramo iOS.'
        );
    }
}

export class CadastroPage extends BasePage {

    // Mensagem de erro do campo, SEM id e sem texto (regra: o teste não valida texto): o TextView
    // logo depois do ícone (SvgView) que segue o contêiner do campo. Validado com lxml nos caps. 16,
    // 18 e 21 (draft 35): devolve a mensagem quando há erro e nada quando não há. `lastName` não foi
    // validado com ele (mesma estrutura, inferido). Pedido de id no ELEMENTOS-SEM-TESTID.md, seção 6.
    private seletorErro(campo: CampoCadastro): string {
        return `//*[@resource-id="${ID_CAMPO[campo]}"]/../following-sibling::*[1][@class="com.horcrux.svg.SvgView"]` +
            '/following-sibling::*[1][@class="android.widget.TextView"]';
    }

    private async fecharTeclado() {
        if (await driver.isKeyboardShown().catch(() => false)) {
            await driver.hideKeyboard().catch(() => undefined);
            await driver.pause(500);
        }
    }

    private async digitar(id: string, valor: string) {
        const campo = await $(seletorTestId(id));
        await this.waitForElement(campo);
        await campo.click();
        await campo.clearValue();
        await campo.addValue(valor);
        await driver.pause(500);
    }

    private async botaoHabilitado(id: string): Promise<boolean> {
        await this.fecharTeclado();
        const botao = await $(seletorTestId(id));
        await this.waitForElement(botao);
        await driver.pause(1000);
        return botao.isEnabled();
    }

    // Login → Criar Conta. O nó `login-create-account` é clickable=false, mas o toque no centro dele
    // abre a tela (cap. 13 → 14). Confere a etapa 1 aberta com o botão desabilitado (formulário vazio).
    async abrirCadastro() {
        falharNoIOS('abrirCadastro');
        const link = await $(seletorTestId('login-create-account'));
        await this.waitForElement(link);
        await this.fechaBanner();
        await link.click();
        await driver.pause(timewhait);

        const abriu = await $(seletorTestId(ID_CAMPO.email))
            .waitForDisplayed({ timeout: 20000 })
            .then(() => true)
            .catch(() => false);
        if (!abriu) {
            throw new Error('Criar Conta não abriu: create-account-email não ficou visível em 20s depois de tocar em login-create-account.');
        }
        if (await this.botaoHabilitado(ID_ENVIAR_ETAPA1)) {
            throw new Error('Criar Conta abriu com create-account-submit HABILITADO: o formulário não está vazio.');
        }
        console.log('📝 Tela de Criar Conta (etapa 1) aberta com o formulário vazio');
    }

    // Etapa 1: preenche um campo (CPF, nascimento e telefone só com dígitos: a máscara é do app).
    async preencherCampo(campo: CampoCadastro, valor: string) {
        falharNoIOS('preencherCampo');
        await this.digitar(ID_CAMPO[campo], valor);
        console.log(`⌨ ${campo}: "${valor}"`);
    }

    // A validação aparece ao perder o foco (campo intocado não mostra erro; cap. 15). Por isso o
    // foco vai para outro campo antes de olhar a mensagem.
    async validarErroNoCampo(campo: CampoCadastro, comErro: boolean) {
        falharNoIOS('validarErroNoCampo');
        const outro: CampoCadastro = campo === 'email' ? 'firstName' : 'email';
        await (await $(seletorTestId(ID_CAMPO[outro]))).click();
        await driver.pause(1000);

        const apareceu = await $(this.seletorErro(campo))
            .waitForDisplayed({ timeout: comErro ? 5000 : 2000 })
            .then(() => true)
            .catch(() => false);
        if (apareceu !== comErro) {
            throw new Error(
                `Campo "${campo}": esperado ${comErro ? 'COM' : 'SEM'} mensagem de erro, ` +
                `mas a tela mostrou ${apareceu ? 'a mensagem' : 'nenhuma mensagem'}.`
            );
        }
        console.log(`✅ Campo "${campo}" ${comErro ? 'com' : 'sem'} mensagem de erro, como esperado`);
    }

    async validarEnviarEtapa1(habilitado: boolean) {
        falharNoIOS('validarEnviarEtapa1');
        const real = await this.botaoHabilitado(ID_ENVIAR_ETAPA1);
        if (real !== habilitado) {
            throw new Error(`create-account-submit: esperado ${habilitado ? 'HABILITADO' : 'DESABILITADO'}, está ${real ? 'habilitado' : 'desabilitado'}.`);
        }
        console.log(`✅ Enviar da etapa 1 ${habilitado ? 'habilitado' : 'desabilitado'}, como esperado`);
    }

    // Etapa 1 → etapa 2 (senha). Destino conferido pelo campo de senha.
    async enviarEtapa1() {
        falharNoIOS('enviarEtapa1');
        await this.fecharTeclado();
        await this.fechaBanner();
        await (await $(seletorTestId(ID_ENVIAR_ETAPA1))).click();

        const abriu = await $(seletorTestId(ID_SENHA))
            .waitForDisplayed({ timeout: 20000 })
            .then(() => true)
            .catch(() => false);
        if (!abriu) {
            throw new Error('Etapa 2 (senha) não abriu: create-account-security-password não ficou visível em 20s depois do toque em create-account-submit.');
        }
        console.log('🔒 Etapa 2 (senha) aberta');
    }

    // A senha vai para o log e para o relatório de propósito: conta descartável, e o Marcio pediu
    // todos os dados preenchidos registrados (2026-10-16).
    async preencherSenha(senha: string, confirmacao: string) {
        falharNoIOS('preencherSenha');
        await this.digitar(ID_SENHA, senha);
        await this.digitar(ID_CONFIRMACAO, confirmacao);
        console.log(`⌨ Senha: "${senha}" / confirmação: "${confirmacao}"`);
    }

    // Senha fora das regras = finalizar desabilitado. As mensagens da etapa 2 não são conferidas:
    // o XPath do draft 35 não foi verificado nesta etapa (draft 36).
    async validarFinalizar(habilitado: boolean) {
        falharNoIOS('validarFinalizar');
        const real = await this.botaoHabilitado(ID_FINALIZAR);
        if (real !== habilitado) {
            throw new Error(`create-account-security-submit: esperado ${habilitado ? 'HABILITADO' : 'DESABILITADO'}, está ${real ? 'habilitado' : 'desabilitado'}.`);
        }
        console.log(`✅ Finalizar ${habilitado ? 'habilitado' : 'desabilitado'}, como esperado`);
    }

    // UM toque: cria a conta. Destino: Home (cap. 29). Quem chama valida a Home e o Menu logado.
    async finalizar() {
        falharNoIOS('finalizar');
        await this.fecharTeclado();
        await this.fechaBanner();
        await (await $(seletorTestId(ID_FINALIZAR))).click();

        const saiu = await driver
            .waitUntil(async () => !(await $(seletorTestId(ID_FINALIZAR)).isDisplayed().catch(() => false)), {
                timeout: 30000,
                interval: 500,
            })
            .then(() => true)
            .catch(() => false);
        if (!saiu) {
            throw new Error('Cadastro não concluído: a etapa 2 continuou na tela 30s depois do toque em create-account-security-submit (conferir o vídeo: e-mail/CPF já cadastrado?).');
        }
        console.log('🎉 Cadastro enviado: saiu da etapa 2');
    }
}
