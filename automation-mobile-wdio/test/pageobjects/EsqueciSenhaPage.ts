import { BasePage, seletorTestId } from "./BasePage";
import { driver, $, $$ } from '@wdio/globals'
import { texto } from "../utils/textos";

// Tela "Esqueceu sua senha" (link do Login). M6 Etapa 1, LOG-07.
//
// Os testes NÃO validam texto e ignoram o idioma (REGRA FIXA, REQUIREMENTS.md): a tela é
// reconhecida pela ESTRUTURA (um campo de e-mail + o botão de envio) e o estado do formulário
// pelo atributo `enabled` do botão. O link NUNCA é enviado — nenhum e-mail sai para conta real
// (T-06-04-03). A leitura da caixa do Gmail para validar o e-mail de redefinição fica para um
// plano futuro (pendência registrada no 06-04-SUMMARY.md).
//
// Seletores NÃO VERIFICADOS em run (capturas: Android m6e1/24; iOS sessão A 20 e 21) até o run
// da Etapa 1 (06-05 Tarefa 2).
export class EsqueciSenhaPage extends BasePage {

    // Android: o único EditText da tela (o Login tem dois). iOS: Other com name = placeholder
    // "E-mail" (textos.ts); o campo perde o name ao receber valor.
    private seletorCampo(): string {
        return process.env.PLATFORM === 'ios'
            ? `accessibility id:${texto('esqueci.campoEmail')}`
            : '-android uiautomator:new UiSelector().className("android.widget.EditText").instance(0)';
    }

    // Android: `pressable` é único na tela (m6e1/24). iOS: `pressable` + rótulo, que só localiza.
    private seletorBotao(): string {
        return process.env.PLATFORM === 'ios'
            ? `-ios predicate string:name == "pressable" AND label == "${texto('esqueci.botaoEnviar')}"`
            : seletorTestId('pressable');
    }

    // Confirma que a tela de recuperação está aberta: campo de e-mail e botão de envio visíveis e,
    // no Android, EXATAMENTE um campo de texto — é o que distingue esta tela do Login (2 campos).
    async validarTela() {
        const campo = await $(this.seletorCampo());
        const campoOk = await campo.waitForDisplayed({ timeout: 20000 }).then(() => true).catch(() => false);
        if (!campoOk) {
            throw new Error('Tela de recuperação de senha não abriu: o campo de e-mail não ficou visível em 20s.');
        }

        const botao = await $(this.seletorBotao());
        const botaoOk = await botao.waitForDisplayed({ timeout: 10000 }).then(() => true).catch(() => false);
        if (!botaoOk) {
            throw new Error('Tela de recuperação de senha: o botão de envio não ficou visível em 10s.');
        }

        if (process.env.PLATFORM !== 'ios') {
            const totalCampos = await $$('-android uiautomator:new UiSelector().className("android.widget.EditText")').length;
            if (totalCampos !== 1) {
                throw new Error(
                    `Tela de recuperação de senha: esperado 1 campo de texto, encontrados ${totalCampos} ` +
                    '(2 campos = ainda é a tela de Login).'
                );
            }
        }
        console.log('📨 Tela de recuperação de senha aberta (campo de e-mail + botão de envio)');
    }

    async preencherEmail(valor: string) {
        if (process.env.PLATFORM === 'ios') return this.preencherEmailIOS(valor);

        const campo = await $(this.seletorCampo());
        await this.waitForElement(campo);
        await campo.addValue(valor);
        console.log(`⌨ Email: ${valor.length} caracteres`);
        await driver.pause(500);
    }

    private async preencherEmailIOS(valor: string) {
        await this.digitarIOS(this.seletorCampo(), valor, 'Email');
    }

    // Estado do botão de envio, lido de `enabled` (nunca da cor). Espera 1s para a validação do
    // formulário assentar. Evidência em dois estados: Android m6e1/24 = false (vazio); iOS 20 =
    // false e 21 = true (e-mail digitado).
    async botaoEnviarHabilitado(): Promise<boolean> {
        const botao = await $(this.seletorBotao());
        await this.waitForElement(botao);
        await driver.pause(1000);
        return botao.isEnabled();
    }
}
