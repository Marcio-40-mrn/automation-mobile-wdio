import { BasePage, timewhait, scrollUntilVisible } from "./BasePage";
import { driver, $ } from '@wdio/globals'

export class PerfilPage extends BasePage {

    // Os quatro cards do topo do Account Menu compartilham name="menu-card" no iOS; o texto
    // ("Favorites Manage your interests") vem no label. O CONTAINS evita depender do subtítulo,
    // que é a parte mais provável de mudar numa revisão de copy.
    async abrirFavoritos() {
        const element = await $(
            process.env.PLATFORM === 'ios'
                ? '-ios predicate string:name == "menu-card" AND label CONTAINS "Favorites"'
                : "accessibility id:Favorites, Manage your interests"
        );
        await this.waitForElement(element);
        if (process.env.PLATFORM === 'ios') await this.fechaBanner();
        await element.click();
        await driver.pause(timewhait);
    }

    async logout() {
        if (process.env.PLATFORM === 'ios') {
            // "Logout" fica numa lista virtualizada e NÃO existe na árvore até ser montado —
            // o scrollto falha com "still not existing" em vez de rolar. rolaAteVisivelIOS
            // trata esse caso com swipe manual, que é o que resolve aqui.
            const seletor = '-ios predicate string:name == "menu-list-button" AND label == "Logout"';
            await this.rolaAteVisivelIOS(seletor);

            const element = await $(seletor);
            await this.waitForElement(element);
            await this.fechaBanner();
            await element.click();
            await driver.pause(timewhait);
            return;
        }

        const element = await $("accessibility id:Logout");
        await scrollUntilVisible(element);
        await element.click();
        await driver.pause(timewhait);
    }

    // Única divergência de FLUXO entre as plataformas, não de seletor: no iOS o tap em
    // "Logout" desloga na hora, sem diálogo nenhum. Confirmado por três evidências: "Logout"
    // some da árvore, o botão "login" reaparece, e o comando alert devolve "An attempt was
    // made to operate on a modal dialog when one was not open".
    //
    // O método continua existindo (e o test.spec.ts continua chamando) para o passo aparecer
    // no relatório Allure nas duas plataformas — mas no iOS ele não confirma nada: valida.
    // Esperar por um diálogo aqui travaria o teste até o timeout, sem nada para encontrar.
    async confirmarLogout() {
        if (process.env.PLATFORM === 'ios') {
            const login = await $("accessibility id:login");
            const deslogou = await login
                .waitForDisplayed({ timeout: 15000 })
                .then(() => true)
                .catch(() => false);

            if (!deslogou) {
                throw new Error('Logout no iOS: o botão "login" não reapareceu — a conta pode não ter sido deslogada');
            }

            console.log('✅ Logout confirmado pelo estado da tela (no iOS não há diálogo)');
            return;
        }

        const element = await $("id:android:id/button1");
        await scrollUntilVisible(element);
        await element.click();
        await driver.pause(timewhait);
    }

}
