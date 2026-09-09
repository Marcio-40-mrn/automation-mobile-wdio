import { BasePage, timewhait } from "./BasePage";
import { driver, $ } from '@wdio/globals'

export class LoginPage extends BasePage {

    async logar(email: string, senha: string) {
        if (process.env.PLATFORM === 'ios') return this.logarIOS(email, senha);

        const btnLogin = await $("-android uiautomator:new UiSelector().text(\"login\")");
        const inputEmail = await $("-android uiautomator:new UiSelector().text(\"Email\")");
        const inputPassword = await $("-android uiautomator:new UiSelector().text(\"Password\")");
        const btnSignIn = await $("accessibility id:Sign in");
        await this.waitForElement(btnLogin);
        await btnLogin.scrollIntoView();
        await btnLogin.click();
        await driver.pause(timewhait)
        await inputEmail.addValue(email);
        await inputPassword.addValue(senha);
        await btnSignIn.click();
    }

    // O login no iOS não é o mesmo fluxo com outros seletores — tem duas particularidades que
    // exigem código, não só troca de string:
    //
    // 1. Os campos são XCUIElementTypeOther (não há TextField/SecureTextField na árvore) com
    //    name = placeholder, e PERDEM name e label assim que recebem valor. O seletor só serve
    //    para achar o campo VAZIO: não dá para reencontrá-lo depois, nem assertar o conteúdo
    //    (o texto digitado não aparece em atributo nenhum do XML).
    //
    // 2. O primeiro tap em "Sign in" logo depois de digitar NÃO registra. Cinco ocorrências,
    //    em quatro sessões e três aparelhos diferentes, uma delas byte-idêntica a outra —
    //    é o comportamento padrão, não uma exceção. Não há erro, alerta nem spinner: a árvore
    //    fica igual por 11s. displayed=true + enabled=true não garantem nada aqui. O mecanismo
    //    provável é o teclado ainda fechando (o container do formulário encolhe de 923 para
    //    615 entre as duas tentativas). Daí a pausa antes do submit e o retry do tap.
    private async logarIOS(email: string, senha: string) {
        const btnSignIn = '-ios predicate string:name == "pressable" AND label == "Sign in"';

        // "Register or login" é o caminho visível na viewport do Account Menu deslogado.
        // Existe um segundo botão ("login", minúsculo) no rodapé, mas ele fica fora da tela e
        // exigiria scroll — são dois nós distintos, não o mesmo elemento duplicado.
        const btnLogin = await $("accessibility id:Register or login");
        await this.waitForElement(btnLogin);
        await btnLogin.click();
        await driver.pause(timewhait);

        await (await $("accessibility id:Email")).addValue(email);
        await (await $("accessibility id:Password *")).addValue(senha);

        // Ver nota 2 acima. Sem esta pausa o primeiro tap se perde de forma silenciosa.
        await driver.pause(2500);

        for (let tentativa = 1; tentativa <= 2; tentativa++) {
            await (await $(btnSignIn)).click();

            // Âncora de sucesso: o próprio botão sair da tela. Não usar o nome da conta
            // ("MR <Nome Sobrenome>") — ele varia por device, porque cada aparelho roda com
            // uma conta diferente (ver getCredentials()).
            const logou = await driver
                .waitUntil(async () => !(await $(btnSignIn).isDisplayed().catch(() => false)),
                    { timeout: 15000, interval: 500 })
                .then(() => true)
                .catch(() => false);

            if (logou) {
                console.log(`✅ Login efetivado (tap ${tentativa}/2)`);
                await driver.pause(timewhait);
                return;
            }

            console.log(`⚠ Tap ${tentativa}/2 em "Sign in" não navegou — repetindo`);
        }

        throw new Error('Login no iOS: "Sign in" não navegou depois de 2 taps');
    }
}

