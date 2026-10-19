import { BasePage, seletorTestId, timewhait } from "./BasePage";
import { driver, $ } from '@wdio/globals'

// Onboarding passo a passo, usado pelo 03-compra-cartao (que nega as permissões). Os specs que
// só atravessam o onboarding aceitando tudo usam o HomePage.ativarApp().
//
// REGRA FIXA (Marcio, 2026-10-01, REQUIREMENTS.md): os testes NÃO validam texto e ignoram o
// idioma. Seletores por testID/estrutura/id do sistema; asserção pelo destino ou estado.

const APP_ID = 'com.aramis.ecomm';
const PERM = 'com.android.permissioncontroller:id/';

export class OnboardingPage extends BasePage {

    // Container clicável das Boas-vindas (ancestral do `first-access-item-animation`); o CTA
    // "Toque para começar" não tem nó próprio. fonte: draft android/01.
    private readonly boasVindasAndroid = '//*[@resource-id="first-access-item-animation"]/ancestor::*[@clickable="true"][1]';

    // Marcador de cada diálogo de permissão do Android (pacote permissioncontroller), pelo id do
    // botão de permitir — independe de idioma. fonte: drafts android/02.
    private readonly dialogoAndroid = {
        localizacao: { marcador: `id:${PERM}permission_allow_foreground_only_button` },
        notificacao: { marcador: `id:${PERM}permission_allow_button` },
    };

    // Abre o app NO ESTADO LIMPO e devolve 'limpo' (Boas-vindas na tela) ou 'ja-concluido'.
    //  - Android: `mobile: clearApp` antes de ativar. O afterTest limpa DEPOIS de cada teste, mas o
    //    1º teste de um run local (noReset: true) começaria com o onboarding já feito.
    //  - iOS: não há como limpar — `mobile: clearApp` não é suportado em iPhone real e o Remote
    //    Access só dá terminateApp. O estado é DETECTADO: se a aba Home já existe, devolve
    //    'ja-concluido'.
    async abrirApp(): Promise<'limpo' | 'ja-concluido'> {
        if (process.env.PLATFORM === 'ios') return this.abrirAppIOS();

        // Os seletores estruturais do Android usam eixos XPath que o motor 2 do UiAutomator2
        // rejeita; HomePage.ativarApp() faz o mesmo ajuste.
        await driver.updateSettings({ enforceXPath1: true });
        await driver.execute('mobile: clearApp', { appId: APP_ID });
        await driver.execute('mobile: activateApp', { appId: APP_ID });

        const apareceu = await $(this.boasVindasAndroid)
            .waitForDisplayed({ timeout: 60000 })
            .then(() => true)
            .catch(() => false);
        if (!apareceu) {
            throw new Error(
                'Boas-vindas não apareceu depois de limpar e ativar o app: o container clicável ' +
                '(ancestral de first-access-item-animation) não ficou visível em 60s. clearApp funcionou?'
            );
        }
        console.log('🆕 App limpo e Boas-vindas na tela');
        return 'limpo';
    }

    private async abrirAppIOS(): Promise<'limpo' | 'ja-concluido'> {
        await driver.execute('mobile: activateApp', { bundleId: APP_ID });
        if (await this.onboardingJaConcluido(4000)) {
            console.log('⏭️ iOS: a aba Home já existe — o onboarding não pode ser refeito sem reinstalar o app');
            return 'ja-concluido';
        }
        return 'limpo';
    }

    // ---- Onboarding NEGANDO as permissões (spec 03-compra-cartao, Marcio 2026-10-15) ----------
    //
    // Android, build 1.21.6/506. fonte: captures-2026-10-15-compra-cartao/00 a 10 (NOTAS.md) e
    // drafts android/02 e 03 (seção "build 506"). O app pede as permissões DUAS vezes quando são
    // negadas, sempre localização -> notificação:
    //   1ª: logo depois do CTA das Boas-vindas, negar = `permission_deny_button` (caps. 01 e 02);
    //   2ª: logo depois do `onboarding-topics-continue`, negar =
    //       `permission_deny_and_dont_ask_again_button` (caps. 04 e 05). O id MUDA na 2ª vez.
    // Negar é melhor-esforço (Marcio, 2026-10-16): se o diálogo não vier (ex.: permissão já
    // concedida antes), ou se não der para negar, o teste
    // NÃO quebra — registra um aviso no log e segue. O que continua sendo exigido é o destino de cada
    // passo (Tópicos na tela; depois, saída dos Tópicos sem diálogo do sistema).
    //
    // iOS (o `autoAcceptAlerts` saiu do wdio.conf.ts em 2026-10-16, decisão do Marcio): os alertas
    // são do SpringBoard e são negados por `mobile: alert` (BasePage.negarAlertasSistemaIOS). Ordem
    // no build 352 (captures-2026-10-16-calcas-cadastro, 00–06): notificação ANTES das Boas-vindas;
    // ATT e localização depois do `onboarding-topics-continue`. Também melhor-esforço.

    private readonly negarAndroid = {
        1: `id:${PERM}permission_deny_button`,
        2: `id:${PERM}permission_deny_and_dont_ask_again_button`,
    } as const;

    // Boas-vindas -> 1ª solicitação: toca no CTA e NEGA localização e notificação; chega nos Tópicos.
    // iOS: nega a notificação (que vem antes do CTA), toca no CTA e chega nos Tópicos.
    async negarPermissoesIniciais() {
        if (process.env.PLATFORM === 'ios') {
            await this.negarAlertasSistemaIOS('notificação', 1, 10000);
            await this.iniciaAppIOS();
        } else {
            await this.iniciaApp();
            await this.negarDialogoAndroid('localizacao', 1);
            await this.negarDialogoAndroid('notificacao', 1);
        }

        // Android, build 507: a notificação pode chegar ~15-25s depois da localização, já por cima
        // dos Tópicos (BasePage.continua); a espera nega o que aparecer no caminho.
        const topicos = process.env.PLATFORM === 'ios'
            ? await $(seletorTestId('onboarding-topics-continue'))
                .waitForDisplayed({ timeout: 20000 })
                .then(() => true)
                .catch(() => false)
            : await this.esperarTelaRespondendoPermissoesAndroid(seletorTestId('onboarding-topics-continue'), 'negar');
        if (!topicos) {
            throw new Error('Depois de negar localização e notificação, a tela de Tópicos (onboarding-topics-continue) não apareceu sem diálogo por cima.');
        }
        console.log('✅ 1ª solicitação: permissões negadas; Tópicos na tela');
    }

    // Tópicos -> 2ª solicitação: toca no Continue e NEGA de novo (id `deny_and_dont_ask_again`).
    // Destino: a Política de Privacidade (sem permission-topic e sem diálogo do sistema).
    // iOS: o Continue dispara ATT e localização, negados aqui; a tela só sai dos Tópicos num toque
    // seguinte (mesmo laço de até 3 toques do aceitaOnboardingIOS). Destino: `privacy-accept` existe.
    async continuarTopicosNegandoPermissoes() {
        if (process.env.PLATFORM === 'ios') {
            const continuarIOS = seletorTestId('onboarding-topics-continue');
            const politica = seletorTestId('privacy-accept');
            for (let toque = 1; toque <= 3; toque++) {
                if (!(await $(continuarIOS).isDisplayed().catch(() => false))) break;
                await this.fechaBanner();
                await (await $(continuarIOS)).click();
                console.log(`👆 Tópicos: Continue (toque ${toque}/3)`);
                await this.negarAlertasSistemaIOS('ATT e localização', 3, 8000);
                if (await $(politica).waitForExist({ timeout: 10000 }).then(() => true).catch(() => false)) break;
            }
            if (!(await $(politica).isExisting().catch(() => false))) {
                throw new Error(
                    'Onboarding iOS travado nos Tópicos: 3 toques em onboarding-topics-continue e a Política ' +
                    '(privacy-accept) não abriu. Suspeitar de alerta do sistema por cima do app.'
                );
            }
            console.log('✅ ATT e localização negados; Política na tela');
            await driver.pause(timewhait);
            return;
        }

        const continuar = await $(seletorTestId('onboarding-topics-continue'));
        await this.waitForElement(continuar);
        await continuar.click();
        console.log('👆 Tópicos: Continue');

        await this.negarDialogoAndroid('localizacao', 2);
        await this.negarDialogoAndroid('notificacao', 2);

        const saiu = await driver
            .waitUntil(async () => {
                // Diálogo que chegar atrasado (build 507) também é negado aqui.
                await this.responderDialogosPermissaoAndroid('negar');
                const topico = await $(seletorTestId('permission-topic')).isDisplayed().catch(() => false);
                const dialogo = await this.dialogoPermissaoAndroidNaTela();
                return !topico && !dialogo;
            }, { timeout: 30000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!saiu) {
            throw new Error('Depois da 2ª negação, o app não saiu dos Tópicos (permission-topic ou diálogo do sistema ainda na tela em 15s).');
        }
        console.log('✅ 2ª solicitação: localização e notificação negadas; Política na tela');
        await driver.pause(timewhait);
    }

    // Política (`privacy-accept`) e Termos (`terms-accept`): os mesmos passos que o ativarApp() do
    // 02-compra-pix usa (BasePage.termo1/termos2); no iOS, os do aceitaOnboardingIOS().
    async aceitarPoliticaETermos() {
        if (process.env.PLATFORM === 'ios') return this.aceitarPoliticaETermosIOS();
        await this.termo1();
        await this.termos2();
    }

    // Um diálogo de permissão do Android: espera o diálogo (marcador por tipo, pelo id do botão de
    // permitir — nunca pelo texto), toca no NEGAR da solicitação e confere que fechou. Melhor-esforço:
    // nada aqui lança erro; o que não der certo vira aviso no log e o teste segue.
    private async negarDialogoAndroid(tipo: 'localizacao' | 'notificacao', solicitacao: 1 | 2) {
        const nome = `${tipo === 'localizacao' ? 'localização' : 'notificação'} (${solicitacao}ª solicitação)`;
        const marcador = this.dialogoAndroid[tipo].marcador;

        const apareceu = await $(marcador).waitForDisplayed({ timeout: 20000 }).then(() => true).catch(() => false);
        if (!apareceu) {
            console.warn(
                `⚠ Diálogo de ${nome} não apareceu em 20s — seguindo sem negar ` +
                '(permissão provavelmente já concedida).'
            );
            return;
        }

        // O id esperado para a solicitação; se não estiver, o outro botão de negar que estiver na tela.
        let negar = await $(this.negarAndroid[solicitacao]);
        if (!(await negar.waitForDisplayed({ timeout: 5000 }).then(() => true).catch(() => false))) {
            const outro = await $(this.negarAndroid[solicitacao === 1 ? 2 : 1]);
            if (!(await outro.isDisplayed().catch(() => false))) {
                console.warn(`⚠ Diálogo de ${nome}: nenhum botão de negar na tela — seguindo sem negar.`);
                return;
            }
            negar = outro;
        }
        await negar.click();

        const fechou = await driver
            .waitUntil(async () => !(await $(marcador).isDisplayed().catch(() => false)), { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        console.log(fechou ? `🚫 Diálogo de ${nome}: negado` : `⚠ Diálogo de ${nome}: continuou na tela 10s depois de tocar em negar — seguindo.`);
        await driver.pause(1000);
    }
}
