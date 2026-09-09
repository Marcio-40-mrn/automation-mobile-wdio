import { BasePage, timewhait } from "./BasePage";
import { driver, $ } from '@wdio/globals'

const SELETORES_PERFIL = [
    "accessibility id:Menu",    // versão com ícone de mochila
    "accessibility id:Perfil",  // versão com ícone de sacola/perfil
];

export class HomePage extends BasePage {

    async ativarApp() {
        if (process.env.PLATFORM === 'ios') {
            // Dois destes três passos não têm seletor possível — o CTA das boas-vindas não
            // existe na árvore XCUITest e o alerta de localização é do SpringBoard, fora do
            // getPageSource() do app. Ver os comentários de cada método no BasePage.
            await this.iniciaAppIOS();
            await this.permissaoLocalizacaoIOS();
            // Um método só para as três telas de aceite: todas usam o mesmo accept-button,
            // mudando só o label. No Android são passos separados porque os ids diferem
            // (Continue, depois "I have read and agree" duas vezes).
            await this.aceitaOnboardingIOS();
        } else {
            await this.iniciaApp();
            await this.ativaGps();
            await this.permiteNotificacao();
            await this.continua();
            // await this.negaNotificacao();
            // await this.continua();
            await this.termo1();
            await this.termos2();
        }
    }

    async abrirPerfil() {
        if (process.env.PLATFORM === 'ios') {
            // No iOS o accessibility id é o id INTERNO da aba (tab-menu), estável entre
            // versões; o texto visível ("Perfil") mora no label. Por isso não existe o
            // problema de "Menu vs Perfil" que o clickFirstPresent resolve no Android — e
            // por isso copiar SELETORES_PERFIL para cá não casaria com nada.
            const element = await $("accessibility id:tab-menu");
            await this.waitForElement(element);
            await element.click();
            await driver.pause(timewhait);
            return;
        }

        await this.clickFirstPresent(SELETORES_PERFIL);
    }

    async abrirCategorias() {
        const element = await $(
            process.env.PLATFORM === 'ios'
                ? "accessibility id:tab-categories"  // id interno; o label é "Categorias"
                : "accessibility id:Categorias"      // Android usa o texto visível como id
        );
        await this.waitForElement(element);
        await element.click();
        await driver.pause(timewhait);
    }

}


