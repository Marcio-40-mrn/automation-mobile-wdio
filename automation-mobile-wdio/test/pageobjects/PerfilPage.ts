import { BasePage, timewhait, scrollUntilVisible } from "./BasePage";
import { driver, $, $$ } from '@wdio/globals'
import { texto } from "../utils/textos";

// Seletores deste arquivo NÃO VERIFICADOS em run: vêm das capturas do M5/06-01 e ficam "não
// verificados" até o run da fumaça (06-03 Tarefa 3). `menu-card` (4 cards) e `menu-list-button`
// (≥7 itens) repetem o testID, então só o content-desc/label distingue — seletor por texto,
// frágil (sem testID), centralizado em test/utils/textos.ts e usado só para LOCALIZAR, nunca
// para comparar o que a tela mostra.
const MAX_SWIPES_MENU = 14;

export class PerfilPage extends BasePage {

    // Android: o content-desc do card é "Título, Subtítulo", então o início basta
    // (descriptionStartsWith) e não depende do subtítulo. iOS: o texto vem no label e o CONTAINS
    // faz o mesmo papel.
    // fonte: Android captures-2026-09-29/45-menu-logado.xml (draft android/24);
    //        iOS captures-m6-sessao-a/ACOES.md captura 41.
    async abrirFavoritos() {
        // Android SEM texto: "Favoritos" virou "Favorites" com o AVD em inglês (run local de
        // 2026-10-01). Os 4 menu-card têm ordem fixa — Meus dados, Meus pedidos, Favoritos,
        // Notificações —, logado e deslogado (45-menu-logado.xml, 10-menu-deslogado.xml), então o
        // Favoritos é o 3º: instance(2).
        const element = await $(
            process.env.PLATFORM === 'ios'
                ? `-ios predicate string:name == "menu-card" AND label CONTAINS "${texto('menu.favoritos')}"`
                : '-android uiautomator:new UiSelector().resourceId("menu-card").instance(2)'
        );
        await this.waitForElement(element);
        if (process.env.PLATFORM === 'ios') await this.fechaBanner();
        await element.click();
        await driver.pause(timewhait);
    }

    // Seletor do item "Sair" do Menu logado, compartilhado por logout() e validarLogado().
    // Android: o XPath estrutural do 06-03 (sem texto), VERBATIM do que logout() já usava e que
    // passou no AVD. iOS: menu-list-button + rótulo (texto só para LOCALIZAR, como o 06-03 fez).
    // O item só existe com a conta logada — no Menu deslogado não há "Sair" (draft android/28, 51).
    private seletorSair(): string {
        return process.env.PLATFORM === 'ios'
            ? `-ios predicate string:name == "menu-list-button" AND label == "${texto('menu.sair')}"`
            : '//*[@resource-id="menu-list-button"]' +
              '[preceding-sibling::*[1][@resource-id="menu-list-button"][preceding-sibling::*[1][not(@resource-id="menu-list-button")]]]' +
              '[not(following-sibling::*[1][@resource-id="menu-list-button"])]';
    }

    async logout() {
        // "Sair"/"Logout" fica numa lista virtualizada e NÃO existe na árvore até ser montado
        // (Android: só aparece rolando — draft 24; iOS: o scrollto falha com "still not existing"
        // em vez de rolar). Por isso o laço de swipe + isDisplayed() nas duas plataformas.
        // fonte: Android captures-2026-09-29/48-menu-rolado.xml; iOS ACOES.md capturas 29 e 30.
        if (process.env.PLATFORM === 'ios') {
            const seletor = this.seletorSair();
            const achou = await this.rolaAteVisivelIOS(seletor, MAX_SWIPES_MENU);
            if (!achou) {
                throw new Error(`Logout: o item de sair do Menu (menu-list-button) não apareceu após ${MAX_SWIPES_MENU} swipes.`);
            }

            const element = await $(seletor);
            await this.waitForElement(element);
            await this.fechaBanner();
            await element.click();
            await driver.pause(timewhait);
            return;
        }

        // Android SEM texto (o desc "Sair" muda com o idioma do aparelho). Na árvore do Menu logado
        // (48-menu-rolado.xml) os itens são irmãos separados por TextViews de seção:
        //   [seção] Troca, Ajuda, Central, Richard, Avalie | [seção] Configurações, Sair | [seção] Painel
        // "Sair" é o único menu-list-button cujo irmão anterior é outro menu-list-button que abre a
        // seção (precedido por não-botão) e cujo próximo irmão não é menu-list-button (fim da seção
        // ou fim da lista, se o Painel de controle não existir no build).
        const element = await $(this.seletorSair());
        const achou = await scrollUntilVisible(element, MAX_SWIPES_MENU);
        if (!achou) {
            throw new Error(`Logout: o item de sair do Menu (menu-list-button) não apareceu após ${MAX_SWIPES_MENU} swipes.`);
        }
        await element.click();
        await driver.pause(timewhait);
    }

    // No app migrado AS DUAS plataformas têm diálogo de confirmação (no app antigo o iOS não
    // tinha — por isso este método retornava cedo lá; não retorna mais):
    //   Android: AlertDialog nativo, botão positivo `android:id/button1` (id do sistema, sem
    //            texto). fonte: captures-2026-09-29/50-dialogo-logout.xml (draft android/28).
    //   iOS:     XCUIElementTypeAlert com Cancel/Logout (ACOES.md capturas 30 a 32, draft
    //            ios/28). O botão de confirmar é achado por class chain dentro do Alert pelo
    //            name — seletor por texto, frágil (sem testID); `~Logout` sozinho seria ambíguo
    //            com o menu-list-button. `mobile: alert accept` NÃO foi testado.
    // Depois de confirmar, o estado DESLOGADO é validado pelo destino (item de acesso ao Login
    // no Menu), com erro nomeado — nunca pelo retorno do clique.
    async confirmarLogout() {
        const botao = process.env.PLATFORM === 'ios'
            ? `-ios class chain:**/XCUIElementTypeAlert/**/XCUIElementTypeButton[\`name == "${texto('logout.confirmar')}"\`]`
            : "id:android:id/button1";

        const element = await $(botao);
        const apareceu = await element
            .waitForDisplayed({ timeout: 15000 })
            .then(() => true)
            .catch(() => false);
        // Sem diálogo NÃO é falha por si só: na sessão iOS remota o wdio.conf.ts liga
        // autoAcceptAlerts, e o diálogo de logout do app migrado é um UIAlert nativo — o Appium o
        // aceita sozinho antes de o teste vê-lo (run iOS local de 2026-10-01: 16/17 passos, parou
        // aqui com "o diálogo não apareceu"). Quem decide é o estado seguinte, validado abaixo.
        if (apareceu) {
            await element.click();
            await driver.pause(timewhait);
        } else {
            console.log('ℹ Diálogo de logout não apareceu em 15s (provável autoAcceptAlerts) — validando pelo estado do Menu');
        }

        // Deslogado = o Menu mostra de novo o acesso ao Login. iOS: o convite do topo OU o botão do
        // rodapé. Android: os `menu-card` ficam enabled=false SÓ com a conta deslogada (true logada),
        // no topo e com o Menu rolado — captures-2026-09-29/10-menu-deslogado.xml e 51-pos-logout.xml
        // (false) × 45-menu-logado.xml (true). O rodapé sozinho não bastou: no run local de
        // 2026-10-01 o logout foi confirmado no diálogo e o rodapé não apareceu em 20s (o Menu não
        // estava na posição rolada da captura 51). O topo por posição não serve (logado é o card da
        // conta, ver seletorAcessoLogin).
        const deslogou = await this.algumVisivel(
            process.env.PLATFORM === 'ios'
                ? [
                    // iOS: mesmo sinal sem texto do Android — menu-card enabled=false só deslogado
                    // (ACOES.md capturas 11 e 32 = false; 28 = true).
                    '-ios predicate string:name == "menu-card" AND enabled == 0',
                    this.seletorAcessoLogin('menu.acessoLogin'),
                    this.seletorAcessoLogin('menu.acessoLoginRodape'),
                ]
                : [
                    '-android uiautomator:new UiSelector().resourceId("menu-card").enabled(false)',
                    this.seletorAcessoLogin('menu.acessoLoginRodape'),
                ],
            20000
        );
        if (!deslogou) {
            throw new Error(
                `Logout: a conta continua logada 20s depois (diálogo de confirmação ${apareceu ? 'confirmado' : 'não apareceu'}) — ` +
                'o Menu não voltou ao estado deslogado.'
            );
        }

        console.log('✅ Logout confirmado pelo estado da tela (acesso ao Login de volta no Menu)');
    }

    // ---- Etapa 1 do M6 (06-05): OUT-01..03 -------------------------------------------------
    // REGRA FIXA (REQUIREMENTS.md, 2026-10-01): os testes NÃO validam texto. O PDF pede o diálogo
    // "Logout" com a pergunta "Você deseja sair da sua conta?" e as opções CANCELAR e SAIR; aqui o
    // diálogo é asserido pela ESTRUTURA (título, mensagem e os dois botões presentes) e nenhuma
    // string exibida é lida ou comparada. Seletores abaixo NÃO VERIFICADOS em run até o 06-05
    // Tarefa 2 — exceção: `android:id/button1` já passou no AVD e no iPhone via confirmarLogout().
    // fonte Android: .planning/drafts/app-migrado/android/28-logout.md (captura 50-dialogo-logout);
    // fonte iOS: captures-m6-sessao-a/NOTAS.md capturas 30 a 32 (XCUIElementTypeAlert, 2 botões).

    // O diálogo de logout é OBSERVÁVEL neste ambiente? Android: sempre. iOS: só se a sessão NÃO
    // aceita alertas sozinha — com `autoAcceptAlerts` ligado (wdio.conf.ts, que não muda: DEC-C e)
    // o Appium aceita o UIAlert nativo antes de o teste vê-lo e o logout acontece sem passar por
    // aqui (06-03, desvio 8). A capability é lida da sessão; se a chave não vier, assume NÃO
    // observável (a escolha segura: pular com motivo em vez de tocar em Sair e perder o diálogo).
    // Não toca o device. Nunca decide por texto.
    dialogoLogoutObservavel(): boolean {
        if (process.env.PLATFORM !== 'ios') return true;
        const caps = driver.capabilities as unknown as Record<string, unknown>;
        const auto = caps['appium:autoAcceptAlerts'] ?? caps['autoAcceptAlerts'];
        return auto === false;
    }

    // Presença do diálogo: Android = o título (`alert_title`); iOS = o próprio XCUIElementTypeAlert.
    private seletorDialogoLogout(): string {
        return process.env.PLATFORM === 'ios'
            ? '-ios class chain:**/XCUIElementTypeAlert'
            : 'id:com.aramis.ecomm:id/alert_title';
    }

    private async dialogoLogoutVisivel(): Promise<boolean> {
        return $(this.seletorDialogoLogout()).isDisplayed().catch(() => false);
    }

    // Rola até "Sair", toca e confirma que o diálogo apareceu (10s), com erro nomeado.
    async abrirDialogoLogout() {
        await this.logout();
        const apareceu = await $(this.seletorDialogoLogout())
            .waitForDisplayed({ timeout: 10000 })
            .then(() => true)
            .catch(() => false);
        if (!apareceu) {
            throw new Error(
                'Logout: o diálogo de confirmação não apareceu 10s depois de tocar em Sair ' +
                `(${this.seletorDialogoLogout()}). Se um banner do Insider ou a lista rolada ` +
                'escondeu o toque, o Menu continua na tela; se o logout foi feito sem diálogo, o ' +
                'ambiente aceitou o alerta sozinho (autoAcceptAlerts).'
            );
        }
        console.log('💬 Diálogo de logout exibido');
    }

    // OUT-01: o diálogo tem a estrutura esperada. Sem comparar nenhuma string.
    //   Android: título + mensagem + botão de cancelar (button2) + botão de confirmar (button1).
    //   iOS: o Alert + exatamente 2 botões (o resto da árvore do Alert não foi capturado).
    async validarEstruturaDialogoLogout() {
        if (process.env.PLATFORM === 'ios') return this.validarEstruturaDialogoLogoutIOS();

        const partes: Array<[string, string]> = [
            ['título (alert_title)', 'id:com.aramis.ecomm:id/alert_title'],
            ['mensagem (android:id/message)', 'id:android:id/message'],
            ['botão de cancelar (android:id/button2)', 'id:android:id/button2'],
            ['botão de confirmar (android:id/button1)', 'id:android:id/button1'],
        ];
        const ausentes: string[] = [];
        for (const [nome, seletor] of partes) {
            if (!(await $(seletor).isDisplayed().catch(() => false))) ausentes.push(nome);
        }
        if (ausentes.length > 0) {
            throw new Error(`Diálogo de logout sem a estrutura esperada: ausente(s) ${ausentes.join('; ')}.`);
        }
        console.log('✅ Diálogo de logout com título, mensagem e os dois botões');
    }

    private async validarEstruturaDialogoLogoutIOS() {
        const total = await $$('-ios class chain:**/XCUIElementTypeAlert/**/XCUIElementTypeButton').length;
        if (total !== 2) {
            throw new Error(`Diálogo de logout no iOS com ${total} botão(ões) no Alert; esperados 2 (cancelar e confirmar).`);
        }
        console.log('✅ Diálogo de logout (iOS) com o Alert e os dois botões');
    }

    // OUT-02: cancela, confirma que o diálogo fechou e que a conta continua logada.
    //   Android: android:id/button2. iOS: 1º botão do Alert (Cancel vem antes de Logout na árvore —
    //   getButtons = ["Cancel","Logout"], NOTAS.md captura 30; não verificado em run).
    async cancelarLogout() {
        const botao = process.env.PLATFORM === 'ios'
            ? '-ios class chain:**/XCUIElementTypeAlert/**/XCUIElementTypeButton[1]'
            : 'id:android:id/button2';
        const element = await $(botao);
        const visivel = await element.waitForDisplayed({ timeout: 10000 }).then(() => true).catch(() => false);
        if (!visivel) {
            throw new Error(`Logout: o botão de cancelar do diálogo não ficou visível em 10s (${botao}).`);
        }
        await element.click();
        await driver.pause(timewhait);

        const fechou = await driver
            .waitUntil(async () => !(await this.dialogoLogoutVisivel()), { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!fechou) {
            throw new Error('Logout: o diálogo continuou na tela 10s depois de tocar em cancelar.');
        }
        await this.validarLogado();
    }

    // Menu no estado LOGADO, por estrutura. Sinais: o item "Sair" visível (só existe logado) OU um
    // `menu-card` enabled=true (logado; deslogado é enabled=false — ver confirmarLogout). Depois do
    // cancelar o Menu fica rolado e os cards podem estar fora da árvore (lista virtualizada;
    // m6e1 31/32 só têm menu-list-button), por isso o "Sair" entra como 1º sinal. Como contraprova,
    // nenhum `menu-card` enabled=false pode estar na tela. Erro nomeado nos dois casos.
    async validarLogado() {
        const cardLogado = process.env.PLATFORM === 'ios'
            ? '-ios predicate string:name == "menu-card" AND enabled == 1'
            : '-android uiautomator:new UiSelector().resourceId("menu-card").enabled(true)';
        const cardDeslogado = process.env.PLATFORM === 'ios'
            ? '-ios predicate string:name == "menu-card" AND enabled == 0'
            : '-android uiautomator:new UiSelector().resourceId("menu-card").enabled(false)';

        const sinal = await this.algumVisivel([this.seletorSair(), cardLogado], 15000);
        if (!sinal) {
            throw new Error(
                'Estado logado não confirmado: nem o item de sair do Menu nem um menu-card habilitado ' +
                'ficaram visíveis em 15s. O Menu não está na tela ou a conta deslogou.'
            );
        }
        if (await $(cardDeslogado).isDisplayed().catch(() => false)) {
            throw new Error('A conta está DESLOGADA (menu-card enabled=false na tela) quando devia continuar logada.');
        }
        console.log('✅ Conta continua logada (Menu no estado logado)');
    }

}
