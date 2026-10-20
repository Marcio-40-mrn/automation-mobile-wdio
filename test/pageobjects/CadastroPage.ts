import { BasePage, timewhait, seletorTestId } from "./BasePage";
import { driver, $, $$ } from '@wdio/globals'

// Criar Conta (cadastro), a partir da tela de Login. Seletores medidos no Android, build
// 1.21.6/506: .planning/drafts/app-migrado/android/captures-2026-10-16-criar-conta/ (drafts 34–37).
//
// iOS, build 1.21.7/352: .planning/drafts/app-migrado/ios/captures-2026-10-16-calcas-cadastro/
// (drafts 42–45). Diferenças que mudam o código:
//   - os campos NÃO têm testID nem TextField na árvore (pedido de id no ELEMENTOS-SEM-TESTID-IOS.md).
//     Âncora estrutural, sem tamanho nem posição na tela: os irmãos `Other` com accessible="true"
//     que vêm ANTES do botão da etapa (`create-account-submit` / `create-account-security-submit`),
//     na ordem e-mail, nome, sobrenome, CPF, nascimento, telefone (etapa 2: senha, confirmação).
//     Conferido nas caps. 19, 20b, 28, 30, 31, 33, 34, 38, 39: sempre 6 (etapa 1) e 2 (etapa 2),
//     com ou sem mensagem de erro (logo, instrução, moldura e erro são accessible="false");
//   - o valor digitado não aparece na árvore: a prova é a mensagem de erro e o `enabled` do botão;
//   - digitar: 1 caractere por ação (string inteira perde caracteres; 120–170 ms ainda perdeu no
//     cartão, 260 ms não); apagar: segurar a tecla `delete` (alfa) / `Delete` (numérico) do
//     teclado, achada por nome — `clearValue` e "\b" não funcionam. Toque, arrasto, segurar e
//     tecla são ações W3C (BasePage), porque o host iOS do Device Farm não tem `mobile: keys`,
//     `mobile: tap`, `dragFromToForDuration` nem `touchAndHold` (CI Run #24/#25);
//   - erro do campo: logo depois do campo vêm a moldura do próximo campo (ou o botão); com erro,
//     vêm um ícone `Other` accessible="false" e o StaticText da mensagem (caps. 20b, 28, 30, 34, 39);
//   - enviar e finalizar: o 1º toque com o teclado aberto só fecha o teclado; o 2º age.
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

const isIOS = () => process.env.PLATFORM === 'ios';

// iOS: posição (1-based) de cada campo na etapa 1; na etapa 2, senha = 1 e confirmação = 2.
const POSICAO_IOS: Record<CampoCadastro, number> = {
    email: 1, firstName: 2, lastName: 3, document: 4, birthDate: 5, phone: 6,
};
const PAUSA_TECLA_IOS = 260;

export class CadastroPage extends BasePage {

    // ---------- iOS ----------

    // Campo nº `posicao` da etapa aberta: só um dos dois botões existe na tela por vez.
    private seletorCampoIOS(posicao: number): string {
        return `(//*[@name="${ID_ENVIAR_ETAPA1}" or @name="${ID_FINALIZAR}"]` +
            `/preceding-sibling::XCUIElementTypeOther[@accessible="true"])[${posicao}]`;
    }

    // Moldura do campo: o irmão imediatamente anterior a ele.
    private seletorCaixaIOS(posicao: number): string {
        return `${this.seletorCampoIOS(posicao)}/preceding-sibling::*[1]`;
    }

    // Rect do elemento depois de a tela parar de rolar: a tela rola a cada tecla digitada
    // (captures-2026-10-18-cadastro-telefone, y do Phone 629/574/605 → 509), e um rect lido no
    // meio da rolagem manda o toque para o teclado. Duas leituras iguais seguidas = parou.
    private async rectEstavelIOS(seletor: string) {
        let anterior = await driver.getElementRect(await $(seletor).elementId);
        for (let i = 0; i < 15; i++) {
            await driver.pause(300);
            const atual = await driver.getElementRect(await $(seletor).elementId);
            if (atual.x === anterior.x && atual.y === anterior.y && atual.height === anterior.height) return atual;
            anterior = atual;
        }
        return anterior;
    }

    // Tecla "." do teclado numérico: existe no do Nascimento e não no do telefone (cap. 13 × 14d
    // de captures-2026-10-18-cadastro-telefone). Ainda presente depois do toque no Phone = o foco
    // ficou no Nascimento.
    private async teclaPontoNaTelaIOS(): Promise<boolean> {
        return (await $$('-ios predicate string:type == "XCUIElementTypeKey" AND name == "."').length) > 0;
    }

    // Toque na caixa do campo, perto da borda direita (o centro cai no placeholder, que some ao
    // focar); ponto calculado do rect do próprio elemento, lido com a tela parada. Se a caixa
    // estiver atrás do teclado, arrasta o formulário para cima antes (cap. 14d). Confere o teclado
    // aberto e, no telefone, a troca de teclado (sem a tecla ".").
    private async focarCampoIOS(posicao: number) {
        const teclado = '-ios class chain:**/XCUIElementTypeKeyboard';
        const seletor = this.seletorCaixaIOS(posicao);
        for (let tentativa = 1; tentativa <= 3; tentativa++) {
            const existe = await $(seletor).waitForExist({ timeout: 10000 }).then(() => true).catch(() => false);
            if (!existe) {
                throw new Error(`Criar Conta (iOS): o campo nº ${posicao} (irmão accessible antes do botão da etapa) não está na árvore.`);
            }
            let caixa = await this.rectEstavelIOS(seletor);
            const tecladoAberto = await $(teclado).isExisting();
            if (tecladoAberto) {
                const tec = await driver.getElementRect(await $(teclado).elementId);
                const sobra = caixa.y + caixa.height + 16 - tec.y;
                if (sobra > 0) {
                    // arrasta de logo acima do teclado para cima, a distância que a caixa precisa subir
                    const xMeio = Math.round(tec.x + tec.width / 2);
                    const yIni = Math.round(tec.y - 20);
                    const yFim = Math.max(Math.round(yIni - sobra - 40), 80);
                    console.log(`↕ Campo nº ${posicao} atrás do teclado (${Math.round(sobra)} pt): arrastando o formulário`);
                    await this.arrastar(xMeio, yIni, xMeio, yFim, 500);
                    caixa = await this.rectEstavelIOS(seletor);
                    if (caixa.y + caixa.height > tec.y) {
                        console.log(`⚠ Tentativa ${tentativa}/3: campo nº ${posicao} continua atrás do teclado`);
                        continue;
                    }
                }
            }
            const pontoAntes = tecladoAberto && await this.teclaPontoNaTelaIOS();
            await this.tocarPonto(caixa.x + caixa.width - 40, caixa.y + caixa.height / 2);
            if (!(await $(teclado).waitForExist({ timeout: 5000 }).then(() => true).catch(() => false))) {
                console.log(`⚠ Toque ${tentativa}/3 no campo nº ${posicao} não abriu o teclado`);
                continue;
            }
            if (posicao === POSICAO_IOS.phone && pontoAntes) {
                await driver.pause(500);
                if (await this.teclaPontoNaTelaIOS()) {
                    console.log(`⚠ Toque ${tentativa}/3 no telefone: o teclado com "." continua (foco no Nascimento)`);
                    continue;
                }
            }
            return;
        }
        throw new Error(`Criar Conta (iOS): não consegui focar o campo nº ${posicao} em 3 tentativas ` +
            '(teclado não abriu, campo atrás do teclado ou foco ficou no campo anterior).');
    }

    // Apaga o campo focado: segura a tecla de apagar (`delete` no teclado alfa, `Delete` no numérico).
    private async limparCampoIOS() {
        const seletor = '-ios predicate string:type == "XCUIElementTypeKey" AND (name == "delete" OR name == "Delete")';
        if (!(await $(seletor).waitForExist({ timeout: 5000 }).then(() => true).catch(() => false))) {
            throw new Error('Criar Conta (iOS): a tecla de apagar (delete/Delete) não está no teclado.');
        }
        await this.segurarElemento(seletor, 3500);
        await driver.pause(300);
    }

    private async digitarCampoIOS(posicao: number, valor: string) {
        await this.focarCampoIOS(posicao);
        await this.limparCampoIOS();
        for (const caractere of valor) {
            await this.teclaW3C(caractere);
            await driver.pause(PAUSA_TECLA_IOS);
        }
        await driver.pause(500);
    }

    private async botaoHabilitadoIOS(id: string): Promise<boolean> {
        const botao = await $(seletorTestId(id));
        if (!(await botao.waitForExist({ timeout: 10000 }).then(() => true).catch(() => false))) {
            throw new Error(`Criar Conta (iOS): ${id} não está na árvore.`);
        }
        await driver.pause(1000);
        return (await botao.getAttribute('enabled')) === 'true';
    }

    // Toca até 2 vezes (o 1º toque com teclado aberto só fecha o teclado) até `chegou()` ser verdade.
    private async tocarAteAvancarIOS(id: string, chegou: () => Promise<boolean>, timeoutFinal: number): Promise<boolean> {
        for (let toque = 1; toque <= 2; toque++) {
            const botao = await $(seletorTestId(id));
            if (!(await botao.isExisting().catch(() => false))) break;
            await this.fechaBanner();
            await botao.click();
            console.log(`👆 ${id} (toque ${toque}/2)`);
            const ok = await driver
                .waitUntil(chegou, { timeout: toque === 1 ? 5000 : timeoutFinal, interval: 500 })
                .then(() => true)
                .catch(() => false);
            if (ok) return true;
        }
        return chegou();
    }

    // ---------- Android ----------

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
        const link = await $(seletorTestId('login-create-account'));
        await this.waitForElement(link);
        await this.fechaBanner();
        await link.click();
        await driver.pause(timewhait);

        if (isIOS()) {
            // iOS: os campos não têm id; a tela é provada pelo botão da etapa 1 (cap. 19).
            const abriuIOS = await $(seletorTestId(ID_ENVIAR_ETAPA1))
                .waitForExist({ timeout: 20000 })
                .then(() => true)
                .catch(() => false);
            if (!abriuIOS) {
                throw new Error('Criar Conta não abriu: create-account-submit não apareceu em 20s depois de tocar em login-create-account.');
            }
            if (await this.botaoHabilitadoIOS(ID_ENVIAR_ETAPA1)) {
                throw new Error('Criar Conta abriu com create-account-submit HABILITADO: o formulário não está vazio.');
            }
            console.log('📝 Tela de Criar Conta (etapa 1) aberta com o formulário vazio');
            return;
        }

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
        if (isIOS()) {
            await this.digitarCampoIOS(POSICAO_IOS[campo], valor);
        } else {
            await this.digitar(ID_CAMPO[campo], valor);
        }
        console.log(`⌨ ${campo}: "${valor}"`);
    }

    // A validação aparece ao perder o foco (campo intocado não mostra erro; cap. 15). Por isso o
    // foco vai para outro campo antes de olhar a mensagem.
    async validarErroNoCampo(campo: CampoCadastro, comErro: boolean) {
        if (isIOS()) return this.validarErroNoCampoIOS(campo, comErro);
        // O campo que recebe o foco é o mais próximo ACIMA que está na tela. Com o teclado aberto o
        // formulário rola e o `create-account-email` sai da árvore: CI Run #29 (1.22.2/512), S23+ e
        // S26 Ultra, no telefone — o print da falha mostra o erro "Telefone inválido" na tela e o 1º
        // campo visível é o Nome. Para o e-mail, o Nome (abaixo).
        const ordem = Object.keys(ID_CAMPO) as CampoCadastro[];
        const candidatos: CampoCadastro[] = campo === 'email'
            ? ['firstName']
            : ordem.slice(0, ordem.indexOf(campo)).reverse();
        let outro: CampoCadastro | null = null;
        for (const c of candidatos) {
            if (await $(seletorTestId(ID_CAMPO[c])).isDisplayed().catch(() => false)) { outro = c; break; }
        }
        if (!outro) {
            throw new Error(`Campo "${campo}": nenhum outro campo na tela para tirar o foco (${candidatos.join(', ')}).`);
        }
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

    // iOS: a mensagem aparece com o foco ainda no campo (cap. 20b), então não há blur. Erro = o
    // campo seguido de um nó accessible="false" (ícone) e de um StaticText, sem ler o texto. Sem
    // erro, o 1º irmão seguinte é a moldura do próximo campo (e o 2º, o campo) ou o botão
    // (accessible="true"), o que exclui o "Already have an account?" depois do telefone.
    private async validarErroNoCampoIOS(campo: CampoCadastro, comErro: boolean) {
        const erro = `${this.seletorCampoIOS(POSICAO_IOS[campo])}` +
            '/following-sibling::*[1][@accessible="false"]/following-sibling::*[1][self::XCUIElementTypeStaticText]';

        const apareceu = await $(erro)
            .waitForExist({ timeout: comErro ? 5000 : 2000 })
            .then(() => true)
            .catch(() => false);
        if (apareceu !== comErro) {
            throw new Error(
                `Campo "${campo}": esperado ${comErro ? 'COM' : 'SEM'} mensagem de erro, ` +
                `mas a tela mostrou ${apareceu ? 'a mensagem' : 'nenhuma mensagem'} (StaticText logo depois do campo).`
            );
        }
        console.log(`✅ Campo "${campo}" ${comErro ? 'com' : 'sem'} mensagem de erro, como esperado`);
    }

    async validarEnviarEtapa1(habilitado: boolean) {
        const real = isIOS() ? await this.botaoHabilitadoIOS(ID_ENVIAR_ETAPA1) : await this.botaoHabilitado(ID_ENVIAR_ETAPA1);
        if (real !== habilitado) {
            throw new Error(`create-account-submit: esperado ${habilitado ? 'HABILITADO' : 'DESABILITADO'}, está ${real ? 'habilitado' : 'desabilitado'}.`);
        }
        console.log(`✅ Enviar da etapa 1 ${habilitado ? 'habilitado' : 'desabilitado'}, como esperado`);
    }

    // Etapa 1 → etapa 2 (senha). Destino conferido pelo campo de senha.
    async enviarEtapa1() {
        if (isIOS()) {
            // Destino: o botão da etapa 2 na árvore (cap. 33).
            const chegou = () => $(seletorTestId(ID_FINALIZAR)).isExisting().catch(() => false);
            if (!(await this.tocarAteAvancarIOS(ID_ENVIAR_ETAPA1, chegou, 20000))) {
                throw new Error('Etapa 2 (senha) não abriu: create-account-security-submit não apareceu depois de 2 toques em create-account-submit.');
            }
            console.log('🔒 Etapa 2 (senha) aberta');
            return;
        }
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
        if (isIOS()) {
            await this.digitarCampoIOS(1, senha);
            await this.digitarCampoIOS(2, confirmacao);
        } else {
            await this.digitar(ID_SENHA, senha);
            await this.digitar(ID_CONFIRMACAO, confirmacao);
        }
        console.log(`⌨ Senha: "${senha}" / confirmação: "${confirmacao}"`);
    }

    // Senha fora das regras = finalizar desabilitado. As mensagens da etapa 2 não são conferidas:
    // o XPath do draft 35 não foi verificado nesta etapa (draft 36).
    async validarFinalizar(habilitado: boolean) {
        const real = isIOS() ? await this.botaoHabilitadoIOS(ID_FINALIZAR) : await this.botaoHabilitado(ID_FINALIZAR);
        if (real !== habilitado) {
            throw new Error(`create-account-security-submit: esperado ${habilitado ? 'HABILITADO' : 'DESABILITADO'}, está ${real ? 'habilitado' : 'desabilitado'}.`);
        }
        console.log(`✅ Finalizar ${habilitado ? 'habilitado' : 'desabilitado'}, como esperado`);
    }

    // UM toque: cria a conta. Destino: Home (cap. 29). Quem chama valida a Home e o Menu logado.
    async finalizar() {
        if (isIOS()) {
            // Destino: a etapa 2 sai da árvore e a barra de abas aparece (Home logada, cap. 42).
            const chegou = async () =>
                !(await $(seletorTestId(ID_FINALIZAR)).isExisting().catch(() => false)) &&
                (await $(seletorTestId('tab-menu')).isDisplayed().catch(() => false));
            if (!(await this.tocarAteAvancarIOS(ID_FINALIZAR, chegou, 30000))) {
                throw new Error('Cadastro não concluído: a etapa 2 continuou na tela depois de 2 toques em create-account-security-submit (conferir o vídeo: e-mail/CPF já cadastrado?).');
            }
            console.log('🎉 Cadastro enviado: saiu da etapa 2');
            return;
        }
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
