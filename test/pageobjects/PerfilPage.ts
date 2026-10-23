import { BasePage, timewhait, scrollUntilVisible, seletorTestId } from "./BasePage";
import { driver, $ } from '@wdio/globals'
import allure from '@wdio/allure-reporter';
import { texto } from "../utils/textos";

// Seletores deste arquivo NÃO VERIFICADOS em run: vêm das capturas do M5/06-01 e ficam "não
// verificados" até o run da fumaça (06-03 Tarefa 3). `menu-card` (4 cards) e `menu-list-button`
// (≥7 itens) repetem o testID, então só o content-desc/label distingue — seletor por texto,
// frágil (sem testID), centralizado em test/utils/textos.ts e usado só para LOCALIZAR, nunca
// para comparar o que a tela mostra.
const MAX_SWIPES_MENU = 14;

export class PerfilPage extends BasePage {

    async abrirFavoritos() {
        // Desde o build 500 (Android) e o 350 (iOS) o card tem testID próprio: o `menu-card`
        // genérico sumiu (captures-2026-10-09-build500/RESULTADO.md; ELEMENTOS-SEM-TESTID-IOS.md).
        const element = await $(seletorTestId('menu-card-favorites'));
        await this.waitForElement(element);
        if (process.env.PLATFORM === 'ios') await this.fechaBanner();
        await element.click();
        await driver.pause(timewhait);
    }

    // Seletor do item "Sair" do Menu logado, compartilhado por logout() e validarLogado().
    // Android: o XPath estrutural do 06-03 (sem texto), VERBATIM do que logout() já usava e que
    // passou no AVD. iOS: menu-list-button + rótulo (texto só para LOCALIZAR, como o 06-03 fez).
    // O item só existe com a conta logada — no Menu deslogado não há "Sair" (draft android/28, 51).
    // Android: desde o build 500 o item tem testID próprio (`menu-item-logout`); o
    // `menu-list-button` genérico sumiu (captures-2026-10-09-build500/RESULTADO.md, capturas 20 e 72).
    // iOS: o mesmo `menu-item-logout` desde o build 350 (Button, label "Logout"; o predicate
    // `menu-list-button` + "Logout" do 335 devolveu 0 nós). Já está na árvore com visible=false no
    // topo do Menu; 2 swipes o trouxeram para a tela. fonte:
    // drafts/app-migrado/ios/captures-2026-10-15-build350-menu-logado/ (capturas 01 e 02).
    private seletorSair(): string {
        return seletorTestId('menu-item-logout');
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
                throw new Error(`Logout: o item de sair do Menu (menu-item-logout) não apareceu após ${MAX_SWIPES_MENU} swipes.`);
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
    //
    // iOS, build 350 (captures-2026-10-15-build350-menu-logado, 03 e 04): o Alert "Logout" aparece
    // no getPageSource e no `mobile: alert getButtons` (["Cancel","Logout"]); confirmado por
    // `mobile: alert accept` com buttonLabel "Logout" e conferido na árvore (deslogou). O click no
    // Button do Alert não foi medido, por isso o iOS confirma pelo `mobile: alert`.
    async confirmarLogout() {
        const ios = process.env.PLATFORM === 'ios';
        const botao = ios ? '-ios class chain:**/XCUIElementTypeAlert' : "id:android:id/button1";

        const element = await $(botao);
        const apareceu = await element
            .waitForDisplayed({ timeout: 15000 })
            .then(() => true)
            .catch(() => false);
        // Sem diálogo NÃO é falha por si só: quem decide é o estado seguinte, validado abaixo.
        if (apareceu && ios) {
            await driver.execute('mobile: alert', { action: 'accept', buttonLabel: texto('logout.confirmar') });
            await driver.pause(timewhait);
        } else if (apareceu) {
            await element.click();
            await driver.pause(timewhait);
        } else {
            console.log('ℹ Diálogo de logout não apareceu em 15s — validando pelo estado do Menu');
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
                    // iOS, build 350: `menu-card-*` enabled=false só deslogado (captura 04 = false;
                    // 01 = true). O Menu fica rolado depois do logout, então o rodapé `login` também vale.
                    '-ios predicate string:name BEGINSWITH "menu-card-" AND enabled == 0',
                    this.seletorAcessoLogin('menu.acessoLogin'),
                    this.seletorAcessoLogin('menu.acessoLoginRodape'),
                ]
                : [
                    // Build 500+: `menu-card-*` no lugar do `menu-card` genérico, mesmo sinal enabled.
                    '-android uiautomator:new UiSelector().resourceIdMatches("menu-card-.*").enabled(false)',
                    this.seletorAcessoLogin('menu.acessoLoginRodape'),
                ],
            20000
        );
        if (!deslogou) {
            allure.addAttachment('Logout — árvore da tela', await driver.getPageSource(), 'text/xml');
            throw new Error(
                `Logout: a conta continua logada 20s depois (diálogo de confirmação ${apareceu ? 'confirmado' : 'não apareceu'}) — ` +
                'o Menu não voltou ao estado deslogado.'
            );
        }

        console.log('✅ Logout confirmado pelo estado da tela (acesso ao Login de volta no Menu)');
    }

    // Menu no estado LOGADO, por estrutura, nas duas plataformas (ver validarLogadoAndroid).
    async validarLogado() {
        // iOS desde o build 350 usa o mesmo sinal do Android: `menu-user-header` só logado e
        // `menu-login-button` só deslogado (captures-2026-10-15-build350-menu-logado, 01 × 04).
        return this.validarLogadoAndroid();
    }

    // Android, desde o build 500: logado = `menu-user-header` presente (o cabeçalho com o nome da
    // conta) e `menu-login-button` ausente (o "fazer login" do topo). Medido nos dois estados:
    // captures-2026-10-14-compra-pix-rodada2/03h-menu-logado.xml × 02a-menu-deslogado.xml.
    // O nome exibido não é comparado (regra: o teste não valida texto).
    private async validarLogadoAndroid() {
        const cabecalho = await $(seletorTestId('menu-user-header'))
            .waitForDisplayed({ timeout: 15000 })
            .then(() => true)
            .catch(() => false);
        if (!cabecalho) {
            throw new Error('Estado logado não confirmado: o cabeçalho da conta (menu-user-header) não apareceu no Menu em 15s.');
        }
        if (await $(seletorTestId('menu-login-button')).isDisplayed().catch(() => false)) {
            throw new Error('O Menu mostra o cabeçalho da conta E o botão de fazer login (menu-login-button): o login não refletiu no Menu.');
        }
        console.log('✅ Menu no estado logado (menu-user-header presente, menu-login-button ausente)');
    }

    // Rola o Menu até o fim e anexa o print ao Allure: a versão e o build ficam no rodapé, num
    // TextView sem id (captures-2026-10-14-compra-pix-rodada2/02b-menu-rodape.png). O print é a
    // evidência pedida; o texto da versão não é lido. Depois volta ao topo, onde ficam o acesso ao
    // Login e o cabeçalho da conta. `mobile: scrollGesture` devolve se ainda dá para rolar, então a
    // parada é o fim real da lista, não uma contagem fixa.
    //
    // iOS: `mobile: scrollGesture` é só do UiAutomator2. No build 349 um swipe para cima levou o
    // rodapé (versão e build) para a tela (captures-2026-10-15-compra-pix/10-menu-rodape); aqui
    // são 2, com `mobile: swipe`, e depois 2 para baixo para voltar ao topo.
    async anexarRodapeDoMenu() {
        if (process.env.PLATFORM === 'ios') {
            for (let i = 0; i < 2; i++) await driver.execute('mobile: swipe', { direction: 'up' });
            await driver.pause(1000);
            const printIOS = await driver.takeScreenshot();
            allure.addAttachment('Menu — rodapé com versão e build', Buffer.from(printIOS, 'base64'), 'image/png');
            console.log('📸 Print do rodapé do Menu (versão e build) anexado ao relatório');
            for (let i = 0; i < 2; i++) await driver.execute('mobile: swipe', { direction: 'down' });
            await driver.pause(1000);
            return;
        }

        const { width, height } = await driver.getWindowRect();
        const area = {
            left: Math.round(width * 0.1),
            top: Math.round(height * 0.2),
            width: Math.round(width * 0.8),
            height: Math.round(height * 0.6),
        };

        for (let i = 0; i < MAX_SWIPES_MENU; i++) {
            const podeMais = await driver.execute('mobile: scrollGesture', { ...area, direction: 'down', percent: 0.9 });
            if (!podeMais) break;
        }
        await driver.pause(1000);
        const print = await driver.takeScreenshot();
        allure.addAttachment('Menu — rodapé com versão e build', Buffer.from(print, 'base64'), 'image/png');
        console.log('📸 Print do rodapé do Menu (versão e build) anexado ao relatório');

        for (let i = 0; i < MAX_SWIPES_MENU; i++) {
            const podeMais = await driver.execute('mobile: scrollGesture', { ...area, direction: 'up', percent: 0.9 });
            if (!podeMais) break;
        }
        await driver.pause(1000);
    }

}
