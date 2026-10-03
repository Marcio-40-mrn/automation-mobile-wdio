import { BasePage, timewhait, seletorTestId } from "./BasePage";
import { PerfilPage } from "./PerfilPage";
import { driver, $ } from '@wdio/globals'
import { texto } from "../utils/textos";

export class LoginPage extends BasePage {

    // O app pode abrir JÁ LOGADO: a sessão local usa noReset, e no iPhone real (Remote Access) o
    // `mobile: clearApp` do afterTest não limpa os dados — a captura de 2026-10-01 (06-01 sessão A)
    // terminou logada, e um teste que espera o "Register or login" morreria aqui com seletor não
    // encontrado. Chamado com o Menu aberto (o spec faz abrirPerfil() antes de logar).
    // Sinal sem texto, o mesmo do confirmarLogout(): os `menu-card` ficam enabled=true SÓ logado.
    // fonte: Android captures-2026-09-29/45 (true) × 10 e 51 (false); iOS ACOES.md capturas 11
    // (false), 28 (true) e 32 (false).
    private async garantirDeslogado() {
        const cardLogado = process.env.PLATFORM === 'ios'
            ? '-ios predicate string:name == "menu-card" AND enabled == 1'
            : '-android uiautomator:new UiSelector().resourceId("menu-card").enabled(true)';

        if (!(await $(cardLogado).waitForExist({ timeout: 5000 }).then(() => true).catch(() => false))) return;

        console.log('🔓 O app abriu com uma conta já logada — fazendo logout antes do login');
        const perfil = new PerfilPage();
        await perfil.logout();
        await perfil.confirmarLogout();
    }

    // Login do app migrado (Android). Seletores NÃO VERIFICADOS em run: vêm das capturas do M5/06-01
    // e ficam "não verificados" até o run da fumaça (06-03 Tarefa 3).
    //
    // - Acesso ao Login: o item do Menu deslogado não tem testID (ELEMENTOS-SEM-TESTID.md); é
    //   achado pelo content-desc — seletor por texto, frágil, centralizado em textos.ts.
    // - Campos: sem testID e o placeholder some ao digitar, então são achados UMA vez, vazios,
    //   pela ordem de EditText (0 = e-mail, 1 = senha). fonte: draft android/08.
    // - Botão de entrar: o testID `pressable` é genérico no app (≥8 botões), mas a tela de Login
    //   só tem UM — conferido nas capturas m6e1 15, 17 e 20 (1 ocorrência em cada). Sem texto.
    // - O 1º toque no botão, com o teclado aberto, SÓ FECHA O TECLADO; o 2º é que loga (draft 08,
    //   regra medida). Por isso até 2 toques, validando o destino depois de cada um. NUNCA usar
    //   BACK para fechar o teclado: com o teclado já fechado o BACK saiu do app (captura 13-relaunch).
    // - O modal de credenciais recusadas é de outra janela (captura m6e1 20 mostra só o Login por
    //   baixo; a 26 mostra o modal sozinho). Como o logar() só espera a tab bar, a falha de credencial
    //   aparece como "o app não saiu da tela de Login". Quem precisa DETECTAR o modal
    //   (LOG-05) usa entrarEsperandoErro(), com seletor estrutural — ver o bloco do M6 Etapa 1 abaixo.
    async logar(email: string, senha: string) {
        await this.garantirDeslogado();
        if (process.env.PLATFORM === 'ios') return this.logarIOS(email, senha);

        // fonte: captures-2026-09-29/10-menu-deslogado.xml (draft android/07)
        const acesso = await $(this.seletorAcessoLogin('menu.acessoLogin'));
        await this.waitForElement(acesso);
        await acesso.click();
        await driver.pause(timewhait);

        // fonte: captures-2026-09-29-m6e1/15-login-vazio-pt.xml (draft android/08) — EditText 0 e 1
        const inputEmail = await $('-android uiautomator:new UiSelector().className("android.widget.EditText").instance(0)');
        const inputSenha = await $('-android uiautomator:new UiSelector().className("android.widget.EditText").instance(1)');
        // fonte: android/06-home — a aba Home só existe depois do login (o Menu deslogado, que
        // também tem tab bar, não entra aqui porque o Login é uma tela sem tab bar)
        const destino = seletorTestId('tab-home');

        await this.waitForElement(inputEmail);
        await inputEmail.addValue(email);
        await inputSenha.addValue(senha);
        console.log(`⌨ Email: ${email.length} caracteres; Senha: ${senha.length} caracteres`);

        // O laço dos dois toques (1º com teclado aberto só fecha o teclado) mora em entrar(), que
        // o LOG-06 (06-09) também usa. Aqui continua a validação do destino pela tab bar.
        await this.entrar(`conta "${email}"`);

        const chegou = await $(destino)
            .waitForDisplayed({ timeout: 20000 })
            .then(() => true)
            .catch(() => false);
        if (!chegou) {
            throw new Error('Login no Android: a tela de Login saiu, mas a tab bar (tab-home) não apareceu em 20s.');
        }

        console.log('✅ Login efetivado');
        await driver.pause(timewhait);
    }

    // O login no iOS não é o mesmo fluxo com outros seletores — tem três particularidades que
    // exigem código, não só troca de string (todas reconfirmadas no app migrado, 06-01 sessão A):
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
    // 3. O primeiro tap em "Sign in" logo depois de digitar NÃO registra. No app migrado a
    //    sessão A mediu o mesmo (2/2 vezes: o tap 1 só fecha o teclado, container 793->485) — é
    //    o comportamento padrão, não uma exceção. Não há erro, alerta nem spinner: a árvore
    //    fica igual. displayed=true + enabled=true não garantem nada aqui. Daí a pausa antes do
    //    submit e o retry do tap.
    private async logarIOS(email: string, senha: string) {
        // O Menu deslogado tem o item de acesso ao Login no topo; existe um segundo botão
        // ("login", minúsculo) no rodapé, mas ele fica fora da tela e exigiria scroll — são dois
        // nós distintos, não o mesmo elemento duplicado. (captura 11/12)
        const btnLogin = await $(this.seletorAcessoLogin('menu.acessoLogin'));
        await this.waitForElement(btnLogin);
        await this.fechaBanner();
        await btnLogin.click();
        await driver.pause(timewhait);

        await this.digitarIOS(`accessibility id:${texto('login.campoEmail')}`, email, 'Email');
        await this.digitarIOS(`accessibility id:${texto('login.campoSenha')}`, senha, 'Senha');

        // Pausa, toques com retry e detecção do modal: tocarEntrarIOS() (nota 3 acima).
        await this.tocarEntrarIOS(false, `"${email}"`);
    }

    // =====================================================================================
    // M6 Etapa 1 (06-04): métodos públicos de inspeção do formulário de Login.
    //
    // REGRA FIXA (Marcio, 2026-10-01, REQUIREMENTS.md): os testes NÃO validam texto e ignoram o
    // idioma. Nada aqui devolve ou compara a mensagem exibida: o que se asserta é o ESTADO
    // (botão habilitado/desabilitado, modal presente, tela que abriu, "não logou"). Texto só
    // entra para LOCALIZAR um nó que não tem testID nem estrutura viável (iOS: placeholders dos
    // campos, rótulo do botão, link de recuperação), sempre via textos.ts.
    //
    // TODOS os seletores abaixo são NÃO VERIFICADOS em run: vêm das capturas do 06-01
    // (Android `captures-2026-09-29-m6e1/15..26`, iOS `captures-m6-sessao-a/12..22`) e ficam
    // assim até o run da Etapa 1 (06-05 Tarefa 2). A tabela está no 06-04-SUMMARY.md.
    // =====================================================================================

    // Campos do Login no Android: sem testID e sem texto estável (o placeholder some ao digitar),
    // então a posição entre os EditText é o único critério. 0 = e-mail, 1 = senha.
    // fonte: captures-2026-09-29-m6e1/15-login-vazio-pt.xml (draft android/08)
    private seletorCampoAndroid(posicao: 0 | 1): string {
        return `-android uiautomator:new UiSelector().className("android.widget.EditText").instance(${posicao})`;
    }

    // iOS: os campos são `Other` com name = placeholder, e perdem o name ao receber valor — o
    // seletor só acha o campo VAZIO. fonte: ACOES.md da sessão A, captura 12.
    private seletorCampoIOS(campo: 'email' | 'senha'): string {
        return `accessibility id:${texto(campo === 'email' ? 'login.campoEmail' : 'login.campoSenha')}`;
    }

    // Botão de entrar. Android: `pressable` é testID genérico no app, mas único na tela de Login
    // (capturas m6e1 15, 17 e 20). iOS: `pressable` + rótulo, que só localiza (ACOES.md 12/16).
    private seletorBotaoEntrar(): string {
        return process.env.PLATFORM === 'ios'
            ? `-ios predicate string:name == "pressable" AND label == "${texto('login.botaoEntrar')}"`
            : seletorTestId('pressable');
    }

    // Modal de credenciais recusadas.
    //  - iOS: nó único da árvore (sem filho para o OK); o label serve só para DETECTAR (captura 18).
    //  - Android: sem testID. Estrutura da captura m6e1/26: o botão OK é o ViewGroup clicável
    //    IRMÃO que vem logo depois do ScrollView da mensagem, dentro do cartão do modal. Na tela de
    //    Login (captura 15) nenhum ScrollView é seguido de um ViewGroup clicável, então o seletor
    //    só casa com o modal. Não depende de idioma.
    private seletorModalErro(): string {
        return process.env.PLATFORM === 'ios'
            ? `-ios predicate string:label CONTAINS "${texto('login.modalCredenciais')}"`
            : '//android.widget.ScrollView/following-sibling::android.view.ViewGroup[@clickable="true"][1]';
    }

    private async modalErroVisivel(): Promise<boolean> {
        return $(this.seletorModalErro()).isDisplayed().catch(() => false);
    }

    // Entra no Login a partir do Menu deslogado e confirma que o formulário abriu vazio. Se o app
    // abriu logado, desloga antes (garantirDeslogado). Se o Menu não está aberto, abre pela aba.
    // "Vazio": iOS = os dois placeholders existem (o campo perde o name ao receber valor);
    // Android = botão de entrar desabilitado (não há como ler o placeholder sem texto).
    async abrirLogin() {
        await this.garantirDeslogado();

        const acessoSel = this.seletorAcessoLogin('menu.acessoLogin');
        if (!(await $(acessoSel).isDisplayed().catch(() => false))) {
            const aba = await $(seletorTestId('tab-menu'));
            if (await aba.isDisplayed().catch(() => false)) {
                await this.fechaBanner();
                await aba.click();
                await driver.pause(timewhait);
            }
        }

        const acesso = await $(acessoSel);
        await this.waitForElement(acesso);
        await this.fechaBanner();
        await acesso.click();
        await driver.pause(timewhait);

        const seletores = process.env.PLATFORM === 'ios'
            ? [this.seletorCampoIOS('email'), this.seletorCampoIOS('senha')]
            : [this.seletorCampoAndroid(0), this.seletorCampoAndroid(1)];
        for (const seletor of seletores) {
            const apareceu = await $(seletor).waitForDisplayed({ timeout: 20000 }).then(() => true).catch(() => false);
            if (!apareceu) {
                throw new Error(`Login não abriu com os dois campos vazios: ${seletor} não ficou visível em 20s depois de tocar no acesso ao Login.`);
            }
        }
        if (await this.botaoEntrarHabilitado()) {
            throw new Error('Login abriu com o botão de entrar HABILITADO: o formulário não está vazio (conta antiga preenchida?).');
        }
        console.log('🔐 Tela de Login aberta com o formulário vazio');
    }

    async preencherEmail(valor: string) {
        if (process.env.PLATFORM === 'ios') return this.preencherIOS('email', valor);
        const campo = await $(this.seletorCampoAndroid(0));
        await this.waitForElement(campo);
        await campo.addValue(valor);
        console.log(`⌨ Email: ${valor.length} caracteres`);
        await driver.pause(500);
    }

    // A senha nunca é logada — só o comprimento.
    async preencherSenha(valor: string) {
        if (process.env.PLATFORM === 'ios') return this.preencherIOS('senha', valor);
        const campo = await $(this.seletorCampoAndroid(1));
        await this.waitForElement(campo);
        await campo.addValue(valor);
        console.log(`⌨ Senha: ${valor.length} caracteres`);
        await driver.pause(500);
    }

    private async preencherIOS(campo: 'email' | 'senha', valor: string) {
        await this.digitarIOS(this.seletorCampoIOS(campo), valor, campo === 'email' ? 'Email' : 'Senha');
    }

    // Estado do botão de entrar, lido do atributo `enabled` — nunca da cor. Espera 1s antes de ler
    // para a validação do formulário (que roda ao sair do campo) assentar. Evidência em dois
    // estados nas capturas: Android m6e1 15/16/18 = false, 17 = true; iOS 12/14 = false, 16 = true.
    async botaoEntrarHabilitado(): Promise<boolean> {
        const botao = await $(this.seletorBotaoEntrar());
        await this.waitForElement(botao);
        await driver.pause(1000);
        return botao.isEnabled();
    }

    // Toca em entrar (até 2 vezes: o 1º toque com o teclado aberto só fecha o teclado) e devolve
    // quando a tela de Login SAI. Quem chama valida o destino — logar() espera a tab bar, o LOG-06
    // (06-09) valida a volta à tela de origem. `contexto` só entra na mensagem de erro.
    async entrar(contexto = 'conta não informada') {
        if (process.env.PLATFORM === 'ios') return this.tocarEntrarIOS(false, contexto);

        const btnEntrar = this.seletorBotaoEntrar();
        for (let tentativa = 1; tentativa <= 2; tentativa++) {
            // Entre os toques o login pode ter terminado devagar: se o botão já saiu, não tocar
            // de novo (o 2º toque cairia no conteúdo da tela seguinte).
            if (!(await $(btnEntrar).isDisplayed().catch(() => false))) break;

            await (await $(btnEntrar)).click();

            // Na tentativa 1 a espera é curta: o esperado é o toque só fechar o teclado.
            const saiu = await driver
                .waitUntil(async () => !(await $(btnEntrar).isDisplayed().catch(() => false)), {
                    timeout: tentativa === 1 ? 8000 : 20000,
                    interval: 500,
                })
                .then(() => true)
                .catch(() => false);

            if (saiu) break;
            console.log(`⚠ Toque ${tentativa}/2 em entrar não saiu da tela de Login — repetindo`);
        }

        if (await $(btnEntrar).isDisplayed().catch(() => false)) {
            throw new Error(
                `Login no Android: o app não saiu da tela de Login depois de 2 toques em entrar ` +
                `(${contexto}). Causas prováveis: o app recusou as credenciais (modal de erro) ou o ` +
                'toque se perdeu — conferir o vídeo.'
            );
        }
    }

    // Toca em entrar com credenciais que o app deve RECUSAR e devolve quando o modal de erro
    // aparece. Não lê a mensagem (regra fixa: sem texto): o modal presente + "não logou" é o
    // desfecho. Erro nomeado se o app LOGAR ou se nada acontecer.
    async entrarEsperandoErro() {
        if (process.env.PLATFORM === 'ios') return this.tocarEntrarIOS(true, 'as credenciais fictícias');

        const btnEntrar = this.seletorBotaoEntrar();
        const destino = seletorTestId('tab-home');

        for (let tentativa = 1; tentativa <= 2; tentativa++) {
            if (await this.modalErroVisivel()) {
                console.log('✅ Modal de erro de credenciais na tela');
                return;
            }
            if (!(await $(btnEntrar).isDisplayed().catch(() => false))) break;

            await (await $(btnEntrar)).click();

            // Na tentativa 1 a espera é curta: o esperado é o toque só fechar o teclado.
            let desfecho = null as 'modal' | 'logado' | null;
            await driver
                .waitUntil(async () => {
                    if (await this.modalErroVisivel()) { desfecho = 'modal'; return true; }
                    if (await $(destino).isDisplayed().catch(() => false)) { desfecho = 'logado'; return true; }
                    return false;
                }, { timeout: tentativa === 1 ? 8000 : 20000, interval: 500 })
                .catch(() => false);

            if (desfecho === 'modal') {
                console.log(`✅ Modal de erro de credenciais na tela (toque ${tentativa}/2)`);
                return;
            }
            if (desfecho === 'logado') {
                throw new Error(
                    'Login no Android: era esperado o modal de erro de credenciais, mas o app LOGOU ' +
                    '(tab-home visível) com as credenciais fictícias.'
                );
            }
            console.log(`⚠ Toque ${tentativa}/2 em entrar não produziu o modal de erro — repetindo`);
        }

        if (await this.modalErroVisivel()) return;
        throw new Error(
            'Login no Android: nenhum modal de erro de credenciais apareceu depois de 2 toques em entrar ' +
            '(seletor estrutural do modal NÃO VERIFICADO em run — conferir o vídeo e o dump com o modal na tela).'
        );
    }

    // Laço de toques do iOS, compartilhado por logarIOS() (esperaErro=false: o app deve logar) e
    // entrarEsperandoErro()/entrar() (esperaErro=true: o app deve recusar). `quem` só entra na
    // mensagem de erro. A pausa de 2,5s é a regra da nota 3 do logarIOS: sem ela o 1º tap se perde.
    private async tocarEntrarIOS(esperaErro: boolean, quem: string) {
        const btnSignIn = this.seletorBotaoEntrar();
        // Modal que o app abre quando o backend recusa as credenciais. Não é UIAlert
        // (getAlertText não o vê); é um nó comum da árvore, daí o predicate pelo label. Aqui o
        // label serve só para DETECTAR que o modal abriu (captura 18, draft ios/29).
        const modalErro = this.seletorModalErro();

        // Ver nota 3 do logarIOS. Sem esta pausa o primeiro tap se perde de forma silenciosa.
        await driver.pause(2500);

        for (let tentativa = 1; tentativa <= 2; tentativa++) {
            await this.fechaBanner();
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
                if (esperaErro) {
                    console.log(`✅ Modal de erro de credenciais na tela (tap ${tentativa}/2)`);
                    return;
                }
                throw new Error(
                    `Login no iOS: o app recusou as credenciais de ${quem} (modal de erro de ` +
                    'credenciais na tela). No iOS isso quase sempre é caractere PERDIDO na digitação ' +
                    'sintética, não conta errada — conferir o campo Email no frame do vídeo logo ' +
                    'após o preenchimento e, se faltar letra, baixar o maxTypingFrequency em digitarIOS().'
                );
            }

            if (saiu) {
                if (esperaErro) {
                    throw new Error(
                        `Login no iOS: era esperado o modal de erro de credenciais, mas o botão de entrar saiu ` +
                        `da tela sem ele — o app LOGOU com ${quem}?`
                    );
                }
                console.log(`✅ Login efetivado (tap ${tentativa}/2)`);
                await driver.pause(timewhait);
                return;
            }

            console.log(`⚠ Tap ${tentativa}/2 em entrar não navegou — repetindo`);
        }

        throw new Error(
            esperaErro
                ? 'Login no iOS: o modal de erro de credenciais não apareceu depois de 2 taps'
                : 'Login no iOS: o botão de entrar não navegou depois de 2 taps'
        );
    }

    // Fecha o modal de credenciais recusadas e deixa o app na tela de Login.
    //  - Android: toca o OK (botão estrutural do modal, ver seletorModalErro) e confirma que o
    //    modal saiu e o formulário voltou. Os campos mantêm o que foi digitado.
    //  - iOS (DEC-C item h): o modal é UM nó RN sem filho para o OK, e `mobile: alert` não o vê.
    //    Sem coordenada nova, o app é RELANÇADO (`mobile: terminateApp` + `mobile: activateApp`) e
    //    o caminho até o Login é refeito por abrirLogin(). Os campos voltam vazios. Que o app
    //    relançado cai na Home deslogada (dados preservados dentro da sessão) é NÃO VERIFICADO.
    async fecharModalErro() {
        if (process.env.PLATFORM === 'ios') return this.fecharModalErroIOS();

        const ok = await $(this.seletorModalErro());
        const apareceu = await ok.waitForDisplayed({ timeout: 15000 }).then(() => true).catch(() => false);
        if (!apareceu) {
            throw new Error('Fechar o modal de erro: o botão OK (estrutural) não apareceu em 15s — não há modal na tela?');
        }
        await ok.click();

        const saiu = await driver
            .waitUntil(async () => !(await this.modalErroVisivel()), { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!saiu) {
            throw new Error('Fechar o modal de erro: o modal continuou na tela 10s depois do toque no OK.');
        }

        const voltou = await $(this.seletorCampoAndroid(0)).waitForDisplayed({ timeout: 15000 }).then(() => true).catch(() => false);
        if (!voltou) {
            throw new Error('Fechar o modal de erro: o formulário de Login não voltou à tela em 15s.');
        }
        console.log('✅ Modal de erro fechado (OK) e Login de volta na tela');
    }

    private async fecharModalErroIOS() {
        const app = 'com.aramis.ecomm';
        await driver.execute('mobile: terminateApp', { bundleId: app });
        await driver.execute('mobile: activateApp', { bundleId: app });

        const home = await $(seletorTestId('tab-home')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!home) {
            throw new Error(
                'Fechar o modal de erro (iOS): depois de relançar o app a Home (tab-home) não apareceu em 30s — ' +
                'o app pode ter voltado ao onboarding ou ficado numa tela intermediária.'
            );
        }
        console.log('♻ App relançado para fechar o modal de erro (iOS, DEC-C h)');
        await this.abrirLogin();
    }

    // Toca em "Esqueci minha senha" e confirma que a tela de Login saiu (o campo de senha some).
    // Quem valida a tela de destino é EsqueciSenhaPage.validarTela().
    //  - Android: sem testID e sem clique no dump; é o TextView irmão que vem logo antes do
    //    `pressable` de entrar (captura m6e1/15). O toque do WebDriver num TextView não clicável
    //    vai às coordenadas do elemento, e a captura 24 mostra que a tela abre assim.
    //  - iOS: `Forgot my password` (accessibility id), ACOES.md captura 20.
    async abrirEsqueciSenha() {
        const ios = process.env.PLATFORM === 'ios';
        const link = ios
            ? `accessibility id:${texto('login.linkEsqueci')}`
            : '//*[@resource-id="pressable"]/preceding-sibling::android.widget.TextView[1]';

        const elemento = await $(link);
        await this.waitForElement(elemento);
        await this.fechaBanner();
        await elemento.click();
        await driver.pause(timewhait);

        const campoSenha = ios ? this.seletorCampoIOS('senha') : this.seletorCampoAndroid(1);
        const saiu = await driver
            .waitUntil(async () => !(await $(campoSenha).isDisplayed().catch(() => false)), { timeout: 15000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!saiu) {
            throw new Error('Esqueci minha senha: o campo de senha do Login continuou na tela 15s depois do toque no link — a tela de recuperação não abriu.');
        }
    }
}
