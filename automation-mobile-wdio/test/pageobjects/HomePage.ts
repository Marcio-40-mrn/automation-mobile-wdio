import { BasePage, timewhait, seletorTestId } from "./BasePage";
import { driver, $ } from '@wdio/globals'

const APP_ID = 'com.aramis.ecomm';

export class HomePage extends BasePage {

    async ativarApp() {
        // Android: os seletores sem texto do Menu/cabeçalho usam XPath com eixo `preceding`, que o
        // motor XPath 2 padrão do UiAutomator2 rejeita ("ArrayList$ListItr cannot be cast to
        // NodeType" — run local de 2026-10-01). O próprio Appium indica `enforceXPath1`. É
        // configuração da sessão (vale até o fim dela), por isso aqui, no 1º passo de todo spec.
        if (process.env.PLATFORM !== 'ios') {
            await driver.updateSettings({ enforceXPath1: true });
        }

        // Traz o app para a frente antes de qualquer toque — serve também depois de uma limpeza
        // do app (terminateApp/clearApp) e quando outra janela ficou por cima. Android usa
        // appId, iOS usa bundleId (o mesmo valor, `com.aramis.ecomm`, nas duas plataformas).
        await driver.execute(
            'mobile: activateApp',
            process.env.PLATFORM === 'ios' ? { bundleId: APP_ID } : { appId: APP_ID }
        );

        // App que já passou do onboarding (noReset local): as telas de Boas-vindas a Termos não
        // existem e esperá-las seria falha falsa. Quem confirma a chegada de verdade é o
        // validarHome() do spec.
        if (await this.onboardingJaConcluido()) {
            console.log('⏭️ Onboarding já concluído (aba Home presente) — pulando Boas-vindas a Termos');
            return;
        }

        if (process.env.PLATFORM === 'ios') {
            // Dois destes passos não têm seletor possível — o CTA das boas-vindas não existe na
            // árvore XCUITest e os alertas de ATT/localização são do SpringBoard, fora do
            // getPageSource() do app. Ver os comentários de cada método no BasePage.
            await this.iniciaAppIOS();
            await this.permissaoLocalizacaoIOS();
            // Um método só para as três telas de aceite: todas usam o mesmo accept-button,
            // mudando só o label. No Android são passos separados porque as telas têm
            // peculiaridades próprias (permission-topic, scroll longo da Política e dos Termos).
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

    // Confirma que o onboarding terminou na Home, com erro nomeado se não. A aba Home existe em
    // todas as abas, então sozinha não prova que a Home está aberta: o `editorial-home-root` é
    // o que só a Home tem (no iOS ele vem com visible=false no dump — por isso a checagem é de
    // EXISTÊNCIA, não de visibilidade). Seletores não verificados em run: ficam "não
    // verificados" até o run da fumaça (06-03 Tarefa 3).
    async validarHome() {
        // fonte: android/06-home (captures-2026-09-29/09-home.xml); ios/06-home (captures-m6-sessao-a/10-home-deslogada)
        const aba = seletorTestId('tab-home');
        const raiz = seletorTestId('editorial-home-root');

        const abaVisivel = await $(aba).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        const raizExiste = await $(raiz).waitForExist({ timeout: 10000 }).then(() => true).catch(() => false);

        if (!abaVisivel || !raizExiste) {
            // O app pode ter FECHADO sozinho: no run local de 2026-10-01 ele caiu logo depois do
            // aceite dos Termos (crash do React Native no logcat: "RetryableMountingLayerException:
            // Unable to find viewState") e o vídeo mostrou a tela inicial do Android. Nomear isso
            // em vez de culpar a Home. queryAppState: 4 = em primeiro plano; 1 = não está rodando.
            const estado = await driver
                .execute('mobile: queryAppState', process.env.PLATFORM === 'ios' ? { bundleId: APP_ID } : { appId: APP_ID })
                .catch(() => null);
            if (estado !== null && estado !== 4) {
                throw new Error(
                    `O app não está em primeiro plano depois do onboarding (queryAppState=${estado}; 1 = fechado, ` +
                    '3 = em segundo plano). Provável crash do app — no Android conferir `adb logcat -b crash -d`.'
                );
            }
            throw new Error(
                `Home não apareceu: tab-home visível=${abaVisivel}, editorial-home-root presente=${raizExiste} ` +
                '(esperados em 30s/10s depois do onboarding). O app pode ter ficado numa tela do ' +
                'onboarding ou com um modal por cima.'
            );
        }
        console.log('🏠 Home confirmada (tab-home + editorial-home-root)');
    }

    async irParaHome() {
        // fonte: android/06-home e ios/06-home (id tab-home nas duas plataformas)
        const element = await $(seletorTestId('tab-home'));
        await this.waitForElement(element);
        await this.fechaBanner();
        await element.click();
        await driver.pause(timewhait);
        await this.validarHome();
    }

    async abrirPerfil() {
        // `tab-menu` é o testID da aba nas duas plataformas (Android: resource-id; iOS: name).
        // O texto visível ("Menu"/"Perfil") varia por versão e idioma e nunca entra no seletor.
        // fonte: android/06-home (captures-2026-09-29/09-home.xml); ios/06-home
        const element = await $(seletorTestId('tab-menu'));
        await this.waitForElement(element);
        await this.fechaBanner();
        await element.click();
        await driver.pause(timewhait);
    }

    async abrirCategorias() {
        if (process.env.PLATFORM === 'ios') return this.abrirCategoriasIOS();

        // fonte: android/06-home (captures-2026-09-29/09-home.xml) — resource-id tab-categories
        const element = await $(seletorTestId('tab-categories'));
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


