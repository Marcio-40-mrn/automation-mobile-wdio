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

    // O login no iOS não é o mesmo fluxo com outros seletores — tem três particularidades que
    // exigem código, não só troca de string:
    //
    // 1. Os campos são XCUIElementTypeOther (não há TextField/SecureTextField na árvore) com
    //    name = placeholder, e PERDEM name e label assim que recebem valor. O seletor só serve
    //    para achar o campo VAZIO: não dá para reencontrá-lo depois, nem assertar o conteúdo
    //    (o texto digitado não aparece em atributo nenhum do XML).
    //
    // 2. A digitação sintética PERDE CARACTERES. Medido no CI iOS Run #8 (2026-09-10): o
    //    appium.log mostra o setValue saindo completo ("m","a","r","c","i","o",...) e o frame do
    //    vídeo mostra "mariorocha@maildrop.cc" no campo — sem o "c". No 15 Pro Max,
    //    "qatest" virou "qaest". Três dos cinco aparelhos caíram em "Incorrect username and/or
    //    password" por isso; o quarto passou pelo MESMO caminho com o mesmo timing, ou seja, é
    //    sorte, não determinismo. Ver digitarIOS() para o mecanismo e a contramedida.
    //
    // 3. O primeiro tap em "Sign in" logo depois de digitar NÃO registra. Cinco ocorrências,
    //    em quatro sessões e três aparelhos diferentes, uma delas byte-idêntica a outra —
    //    é o comportamento padrão, não uma exceção. Não há erro, alerta nem spinner: a árvore
    //    fica igual por 11s. displayed=true + enabled=true não garantem nada aqui. O mecanismo
    //    provável é o teclado ainda fechando (o container do formulário encolhe de 923 para
    //    615 entre as duas tentativas). Daí a pausa antes do submit e o retry do tap.
    private async logarIOS(email: string, senha: string) {
        const btnSignIn = '-ios predicate string:name == "pressable" AND label == "Sign in"';
        // Modal que o app abre quando o backend recusa as credenciais: título "Login", texto
        // "Incorrect username and/or password", botão "OK". Não é UIAlert (getAlertText não o
        // vê); é um nó comum da árvore, daí o predicate pelo label.
        const modalErro = '-ios predicate string:label CONTAINS "Incorrect username"';

        // "Register or login" é o caminho visível na viewport do Account Menu deslogado.
        // Existe um segundo botão ("login", minúsculo) no rodapé, mas ele fica fora da tela e
        // exigiria scroll — são dois nós distintos, não o mesmo elemento duplicado.
        const btnLogin = await $("accessibility id:Register or login");
        await this.waitForElement(btnLogin);
        await btnLogin.click();
        await driver.pause(timewhait);

        await this.digitarIOS("accessibility id:Email", email, 'Email');
        await this.digitarIOS("accessibility id:Password *", senha, 'Senha');

        // Ver nota 3 acima. Sem esta pausa o primeiro tap se perde de forma silenciosa.
        await driver.pause(2500);

        for (let tentativa = 1; tentativa <= 2; tentativa++) {
            await (await $(btnSignIn)).click();

            // Duas saídas possíveis depois do tap, e é preciso distinguir as duas:
            //   - logou: o botão "Sign in" sai da tela (âncora de sucesso — não usar o nome da
            //     conta, "MR <Nome>", porque varia por device);
            //   - credenciais recusadas: o modal de erro entra POR CIMA do botão, e o botão
            //     também passa a reportar displayed=false.
            // A versão anterior só olhava o botão, e por isso logou "✅ Login efetivado" nos
            // três aparelhos do Run #8 em que o modal estava na tela — o teste só morreu 20s
            // depois, em abrirCategorias(), com "tab-categories still not displayed". Falhar
            // aqui, nomeando a causa, é o que este bloco garante.
            let recusou = false;
            const saiu = await driver
                .waitUntil(async () => {
                    if (await $(modalErro).isDisplayed().catch(() => false)) { recusou = true; return true; }
                    return !(await $(btnSignIn).isDisplayed().catch(() => false));
                }, { timeout: 15000, interval: 500 })
                .then(() => true)
                .catch(() => false);

            if (recusou) {
                throw new Error(
                    `Login no iOS: o app recusou as credenciais de "${email}" ("Incorrect username ` +
                    'and/or password"). No iOS isso quase sempre é caractere PERDIDO na digitação ' +
                    'sintética, não conta errada — conferir o campo Email no frame do vídeo logo ' +
                    'após o preenchimento e, se faltar letra, baixar o maxTypingFrequency em digitarIOS().'
                );
            }

            if (saiu) {
                console.log(`✅ Login efetivado (tap ${tentativa}/2)`);
                await driver.pause(timewhait);
                return;
            }

            console.log(`⚠ Tap ${tentativa}/2 em "Sign in" não navegou — repetindo`);
        }

        throw new Error('Login no iOS: "Sign in" não navegou depois de 2 taps');
    }

    // Digita num campo do formulário sem deixar o WDA fazer "tap + digita" de uma vez só.
    //
    // O que o appium.log do Run #8 mostrou, igual nos cinco aparelhos: o addValue chega com o
    // campo sem foco ("Neither the XCUIElementTypeOther (Email) ... have the keyboard input
    // focus"), o WDA dá o tap ele mesmo ("Trying to tap the element to have it focused"), espera
    // ~0,5s de "idle" e despeja a string inteira em menos de 1s (maxTypingFrequency 60, o
    // default). Nesse meio segundo o teclado ainda está subindo e o formulário refluindo — o
    // draft 09 mediu o container encolhendo de 923 para 615 — e a letra perdida cai sempre no
    // 3º/4º caractere, dentro dessa janela. É a assinatura de TextInput controlado do React
    // Native engolindo tecla quando a thread JS não acompanha a digitação.
    //
    // Contramedida em duas partes: (a) focar o campo NÓS MESMOS e só digitar depois que o
    // teclado estiver de pé e o layout assentado; (b) digitar mais devagar, trocando o
    // maxTypingFrequency do WDA só durante o preenchimento — é setting de sessão
    // (/appium/settings), não capability, então não encosta no wdio.conf.ts nem no Android.
    // O valor 20 é ponto de partida; a unidade do WDA não é documentada de forma confiável e o
    // critério é empírico: os cinco emails íntegros no frame do vídeo.
    //
    // Não há como conferir o texto digitado pela árvore (nota 1 do logarIOS); a checagem real
    // é o modal de erro, tratado no laço do "Sign in".
    private async digitarIOS(seletor: string, texto: string, rotulo: string) {
        const campo = await $(seletor);
        await this.waitForElement(campo);
        await campo.click();

        const tecladoAbriu = await driver
            .waitUntil(() => driver.isKeyboardShown(), { timeout: 5000, interval: 250 })
            .then(() => true)
            .catch(() => false);
        if (!tecladoAbriu) {
            console.log(`⚠ ${rotulo}: isKeyboardShown() não confirmou o teclado em 5s — digitando mesmo assim`);
        }
        // Espera o reflow do formulário (923 -> 615) terminar antes da primeira tecla.
        await driver.pause(1000);

        await driver.updateSettings({ maxTypingFrequency: 20 });
        try {
            await campo.addValue(texto);
        } finally {
            await driver.updateSettings({ maxTypingFrequency: 60 });
        }
        console.log(`⌨ ${rotulo}: ${texto.length} caracteres digitados com o teclado ${tecladoAbriu ? 'aberto' : 'não confirmado'}`);
        await driver.pause(500);
    }
}
