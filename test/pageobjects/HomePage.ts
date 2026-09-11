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
            await this.fechaBanner();
            await element.click();
            await driver.pause(timewhait);
            return;
        }

        await this.clickFirstPresent(SELETORES_PERFIL);
    }

    async abrirCategorias() {
        if (process.env.PLATFORM === 'ios') return this.abrirCategoriasIOS();

        const element = await $("accessibility id:Categorias"); // Android usa o texto visível como id
        await this.waitForElement(element);
        await element.click();
        await driver.pause(timewhait);
    }

    // A aba "Categorias" e o card "Meus Pedidos" nunca se confundem por SELETOR — `tab-categories`
    // e `menu-card` sao nos distintos, em areas opostas da tela ([100,794 101x80] no rodape contra
    // [205,222 181x105] no topo). Mesmo assim o app ja foi parar em Meus Pedidos no lugar de
    // Categorias, e por um caminho que nenhum seletor protege: o clique no "Close" fantasma do
    // Insider tocava a coordenada (330,298), que cai dentro daquele card (ver fechaBannerIOS).
    //
    // As duas guardas abaixo existem para que um desvio desses falhe AQUI, nomeado, em vez de
    // tres passos adiante como "elemento X nao encontrado":
    //   - antes de clicar, confirmar que o alvo esta mesmo na barra inferior;
    //   - depois de clicar, confirmar que a tela de categorias abriu.
    private async abrirCategoriasIOS() {
        const aba = "accessibility id:tab-categories"; // id interno; o label é "Categorias"
        const element = await $(aba);
        await this.waitForElement(element);

        const { height: alturaJanela } = await driver.getWindowRect();
        const loc = await element.getLocation();
        const size = await element.getSize();
        const centroY = loc.y + size.height / 2;

        if (centroY < alturaJanela * 0.75) {
            throw new Error(
                `A aba "Categorias" foi encontrada fora da barra inferior (centro y=${Math.round(centroY)} ` +
                `numa janela de ${alturaJanela}pt). A barra de abas fica no rodape; um alvo no topo da ` +
                'tela indica que o app nao esta na tela esperada, ou que outro no assumiu o ' +
                'accessibility id "tab-categories". Nao clicar as cegas aqui e proposital.'
            );
        }

        await this.fechaBanner();
        await element.click();
        await driver.pause(timewhait);

        // `category-button` e a linha de categoria da tela de Categorias (draft 12): so existe la.
        const chegou = await $('-ios predicate string:name == "category-button"')
            .waitForDisplayed({ timeout: 20000 })
            .then(() => true)
            .catch(() => false);

        if (!chegou) {
            const titulo = await $('-ios class chain:**/XCUIElementTypeStaticText[1]')
                .getAttribute('name')
                .catch(() => '(nao lido)');
            throw new Error(
                'O toque na aba "Categorias" nao abriu a tela de categorias: nenhum ' +
                `"category-button" apareceu em 20s. Titulo da tela atual: "${titulo}". ` +
                'Se disser "Meus pedidos", o app foi desviado antes deste passo — conferir o ' +
                'diagnostico do banner (fechaBannerIOS) no log.'
            );
        }
    }

}


