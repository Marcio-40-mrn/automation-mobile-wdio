import { BasePage, seletorTestId, scrollUntilVisible, timewhait } from "./BasePage";
import { HomePage } from "./HomePage";
import { driver, $, $$ } from '@wdio/globals'

// Onboarding do app migrado, passo a passo, para os cenários ONB-01..07 (M6 Etapa 1, 06-04).
//
// Diferença para HomePage.ativarApp(): lá o onboarding é um caminho feliz de passos OPCIONAIS
// (clickIfPresent) que aceita tudo e não prova que cada diálogo apareceu — serve à fumaça. Aqui
// cada passo é exposto, os diálogos de permissão são asseridos como APARECIDOS antes de tratados
// (erro nomeado se não vierem) e o destino de cada passo é validado.
//
// REGRA FIXA (Marcio, 2026-10-01, REQUIREMENTS.md): os testes NÃO validam texto e ignoram o
// idioma. Seletores por testID/estrutura/id do sistema; asserção pelo destino ou estado.
//
// TODOS os seletores novos deste arquivo são NÃO VERIFICADOS em run: vêm das capturas do 06-01
// (Android `captures-2026-09-29-m6e1/01..13`, iOS `captures-m6-sessao-a/00..10`) e ficam assim
// até o run da Etapa 1 (06-05 Tarefa 2). Tabela no 06-04-SUMMARY.md.

const APP_ID = 'com.aramis.ecomm';
const PERM = 'com.android.permissioncontroller:id/';

export type Acao = 'permitir' | 'negar';
export type TipoDialogo = 'localizacao' | 'notificacao' | 'att';
export type EscolhaPermissoes = { localizacao: Acao; notificacao: Acao };
export type OpcoesPermissoes = {
    // true (padrão): cada diálogo de permissão PRECISA aparecer, senão erro nomeado.
    // false: diálogos opcionais — trata os que vierem e segue (cenários que só atravessam o onboarding).
    exigir?: boolean;
    // Quanto esperar por cada diálogo. Padrão 15 s.
    timeoutMs?: number;
};

// Motivo único do skip por plataforma dos cenários que dependem de observar ou negar um alerta
// no iOS. Citado no `it` pelo spec (DEC-C item e, 2026-10-02): o wdio.conf.ts NÃO muda.
export const MOTIVO_IOS_ALERTAS =
    'DEC-C (e): no iOS o wdio.conf.ts liga autoAcceptAlerts (linhas 35 e 70), que aceita o alerta do ' +
    'sistema antes de o teste poder observá-lo ou negá-lo, e negar uma permissão exige reinstalação ' +
    'limpa do app (captures-m6-sessao-a/NOTAS.md, "Lacunas"). A capability não foi alterada.';

export class OnboardingPage extends BasePage {

    // Container clicável das Boas-vindas (ancestral do `first-access-item-animation`); o CTA
    // "Toque para começar" não tem nó próprio. fonte: m6e1/01-boasvindas-en.xml (draft android/01).
    private readonly boasVindasAndroid = '//*[@resource-id="first-access-item-animation"]/ancestor::*[@clickable="true"][1]';

    // Diálogos de permissão do Android (pacote permissioncontroller), por resource-id — independem
    // de idioma. O botão de negar muda de id entre a 1ª solicitação (`permission_deny_button`) e a
    // 2ª (`permission_deny_and_dont_ask_again_button`), por isso o regex cobre as duas.
    // fonte: m6e1/02 (localização, 1ª vez), 03 (notificação, 1ª vez), 05 e 06 (2ª vez).
    private readonly dialogoAndroid = {
        localizacao: { marcador: `id:${PERM}permission_allow_foreground_only_button`, permitir: `id:${PERM}permission_allow_foreground_only_button` },
        notificacao: { marcador: `id:${PERM}permission_allow_button`, permitir: `id:${PERM}permission_allow_button` },
        negar: '-android uiautomator:new UiSelector().resourceIdMatches(".*permission_deny.*button")',
    };

    // Os alertas do iOS só são observáveis/negáveis se o autoAcceptAlerts estiver desligado — não
    // está (DEC-C e). Falso no iOS, verdadeiro no Android. Não toca o device.
    alertasObservaveis(): boolean {
        return process.env.PLATFORM !== 'ios';
    }

    // Ordem em que os diálogos aparecem NO APP (DEC-C item a: o teste segue o app, nunca o PDF).
    // O PDF (ONB-01) diz notificação -> localização; o app mostra:
    //   Android: localização -> notificação (m6e1/02 e 03);
    //   iOS: notificação -> [toque no CTA] -> ATT -> localização (sessão A, NOTAS.md 00-05).
    ordemEsperadaDosDialogos(): TipoDialogo[] {
        return process.env.PLATFORM === 'ios'
            ? ['notificacao', 'att', 'localizacao']
            : ['localizacao', 'notificacao'];
    }

    // Abre o app NO ESTADO LIMPO e devolve 'limpo' (Boas-vindas na tela) ou 'ja-concluido'.
    //  - Android: `mobile: clearApp` antes de ativar. O afterTest limpa DEPOIS de cada teste, mas o
    //    1º teste de um run local (noReset: true) começaria com o onboarding já feito.
    //  - iOS: não há como limpar — `mobile: clearApp` não é suportado em iPhone real e o Remote
    //    Access só dá terminateApp. O estado é DETECTADO: se a aba Home já existe, devolve
    //    'ja-concluido' e quem chama pula o cenário com motivo visível (pularNestaPlataforma).
    async abrirApp(): Promise<'limpo' | 'ja-concluido'> {
        if (process.env.PLATFORM === 'ios') return this.abrirAppIOS();

        // Os seletores estruturais do Android usam eixos XPath que o motor 2 do UiAutomator2
        // rejeita; HomePage.ativarApp() faz o mesmo ajuste (06-03, desvio 6).
        await driver.updateSettings({ enforceXPath1: true });
        await driver.execute('mobile: clearApp', { appId: APP_ID });
        await driver.execute('mobile: activateApp', { appId: APP_ID });

        const apareceu = await $(this.boasVindasAndroid)
            .waitForDisplayed({ timeout: 20000 })
            .then(() => true)
            .catch(() => false);
        if (!apareceu) {
            throw new Error(
                'Boas-vindas não apareceu depois de limpar e ativar o app: o container clicável ' +
                '(ancestral de first-access-item-animation) não ficou visível em 20s. clearApp funcionou?'
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

    // Toca no CTA das Boas-vindas e valida o destino (diálogo de permissão ou Tópicos).
    // Reaproveita o que o BasePage já provou: iniciaApp() (Android, container clicável) e
    // iniciaAppIOS() (aceita o alerta de notificação que antecede o CTA e toca por FRAÇÃO da
    // janela — a exceção de coordenada do REQUIREMENTS.md; nenhuma coordenada nova aqui).
    async tocarCta() {
        if (process.env.PLATFORM === 'ios') return this.iniciaAppIOS();
        return this.iniciaApp();
    }

    // Trata os diálogos de permissão na ordem em que o app os mostra e devolve essa ordem.
    //
    // Android: para cada diálogo, ASSERE que apareceu (erro nomeado em `timeoutMs` se não vier),
    // toca permitir ou negar, e confirma que ele fechou. O tipo do diálogo vem do id do botão
    // (foreground_only = localização; allow sem foreground = notificação), nunca do texto.
    // iOS: só o modo tolerante com permitir (cenários que apenas atravessam o onboarding) —
    // aceita ATT e localização pelo caminho já provado (`mobile: alert` com buttonLabel "Allow",
    // DEC-C item i). Observar ou negar no iOS não é suportado (DEC-C e) e lança erro.
    async tratarPermissoes(escolha: EscolhaPermissoes, opcoes: OpcoesPermissoes = {}): Promise<TipoDialogo[]> {
        const exigir = opcoes.exigir !== false;
        const timeoutMs = opcoes.timeoutMs ?? 15000;

        if (process.env.PLATFORM === 'ios') {
            if (exigir || escolha.localizacao === 'negar' || escolha.notificacao === 'negar') {
                throw new Error(`tratarPermissoes no iOS só aceita o modo tolerante com "permitir". ${MOTIVO_IOS_ALERTAS}`);
            }
            await this.permissaoLocalizacaoIOS();
            return [];
        }

        const topicos = seletorTestId('permission-topic');
        const ordem: TipoDialogo[] = [];

        for (let i = 0; i < 2; i++) {
            const tipo = await this.esperarDialogoAndroid(timeoutMs, topicos);
            if (!tipo) break;
            ordem.push(tipo);
            await this.responderDialogoAndroid(tipo, escolha[tipo]);
        }

        if (exigir) {
            for (const tipo of ['localizacao', 'notificacao'] as const) {
                if (!ordem.includes(tipo)) {
                    throw new Error(
                        `diálogo de ${tipo === 'localizacao' ? 'localização' : 'notificação'} não apareceu ` +
                        `em ${timeoutMs}ms — conferir autoGrantPermissions (AVD local, wdio.conf.ts) e se o app ` +
                        `estava limpo (observados: ${ordem.join(' -> ') || 'nenhum'})`
                    );
                }
            }
        }
        return ordem;
    }

    // Espera até `timeout` por um diálogo de permissão do Android. Devolve o tipo, ou null se a
    // tela de Tópicos apareceu primeiro (ou o tempo acabou) — não há (mais) diálogo a tratar.
    private async esperarDialogoAndroid(timeout: number, topicos: string): Promise<'localizacao' | 'notificacao' | null> {
        let tipo = null as 'localizacao' | 'notificacao' | null;
        await driver
            .waitUntil(async () => {
                if (await $(this.dialogoAndroid.localizacao.marcador).isDisplayed().catch(() => false)) { tipo = 'localizacao'; return true; }
                if (await $(this.dialogoAndroid.notificacao.marcador).isDisplayed().catch(() => false)) { tipo = 'notificacao'; return true; }
                // Tópicos na tela e nenhum diálogo: o sistema não vai mostrar mais nada agora.
                return $(topicos).isDisplayed().catch(() => false);
            }, { timeout, interval: 500 })
            .catch(() => false);
        return tipo;
    }

    private async responderDialogoAndroid(tipo: 'localizacao' | 'notificacao', acao: Acao) {
        const alvo = acao === 'permitir' ? this.dialogoAndroid[tipo].permitir : this.dialogoAndroid.negar;

        const botao = await $(alvo);
        const apareceu = await botao.waitForDisplayed({ timeout: 10000 }).then(() => true).catch(() => false);
        if (!apareceu) {
            throw new Error(`Diálogo de ${tipo}: o botão de "${acao}" (${alvo}) não ficou visível em 10s.`);
        }
        await botao.click();

        // Confirma pelo estado: o diálogo deste tipo sai da tela. "O clique não deu erro" não vale.
        const saiu = await driver
            .waitUntil(async () => !(await $(this.dialogoAndroid[tipo].marcador).isDisplayed().catch(() => false)), {
                timeout: 10000,
                interval: 500,
            })
            .then(() => true)
            .catch(() => false);
        if (!saiu) {
            throw new Error(`Diálogo de ${tipo}: continuou na tela 10s depois de tocar em "${acao}".`);
        }
        console.log(`✅ Diálogo de ${tipo}: ${acao}`);
        await driver.pause(1000);
    }

    // Tela final do onboarding ("Como criamos sua experiência?"): os três blocos informativos e a
    // seção final são 4 `permission-topic` nas duas plataformas (m6e1/04; iOS sessão A cap. 02) —
    // o PDF conta "três blocos + a seção". O `accept-button` fica fixo no rodapé.
    async validarTopicos() {
        const topico = seletorTestId('permission-topic');
        const apareceu = await $(topico).waitForDisplayed({ timeout: 20000 }).then(() => true).catch(() => false);
        if (!apareceu) {
            throw new Error('Tela final do onboarding não apareceu: nenhum permission-topic visível em 20s.');
        }
        const total = await $$(topico).length;
        if (total !== 4) {
            throw new Error(`Tela final do onboarding: esperados 4 permission-topic (3 blocos + a seção), encontrados ${total}.`);
        }
        const aceite = await $(seletorTestId('accept-button')).isDisplayed().catch(() => false);
        if (!aceite) {
            throw new Error('Tela final do onboarding: o accept-button (Continue) não está visível.');
        }
    }

    // Toca em Continue na tela final e confirma que ela saiu. No Android, permissão NEGADA volta a
    // ser pedida depois do Continue (m6e1/05 e 06: 2ª solicitação, com o botão de negar
    // `deny_and_dont_ask_again`): se `reSolicitacao` vier, esses diálogos são tratados (opcionais,
    // 8 s para o primeiro) e a ordem observada é devolvida. Sem `reSolicitacao` não espera nada.
    async continuarTopicos(reSolicitacao?: EscolhaPermissoes): Promise<TipoDialogo[]> {
        await this.validarTopicos();
        if (process.env.PLATFORM === 'ios') await this.fechaBanner();

        const aceite = seletorTestId('accept-button');
        await (await $(aceite)).click();

        const saiu = await driver
            .waitUntil(async () => !(await $(seletorTestId('permission-topic')).isDisplayed().catch(() => false)), {
                timeout: 15000,
                interval: 500,
            })
            .then(() => true)
            .catch(() => false);
        if (!saiu) {
            throw new Error('Onboarding travado na tela final: os permission-topic continuaram visíveis 15s depois do Continue.');
        }
        console.log('✅ Aceite (tela final do onboarding)');
        await driver.pause(timewhait);

        if (reSolicitacao && process.env.PLATFORM !== 'ios') {
            return this.tratarPermissoes(reSolicitacao, { exigir: false, timeoutMs: 8000 });
        }
        return [];
    }

    // Política de Privacidade e Termos são telas de leitura longa SEM testID e SEM texto
    // estável: o que as caracteriza é (1) não ser a tela final (sem permission-topic), (2) não ser
    // a Home (sem tab-home), (3) o `accept-button` só aparece depois de rolar até o fim e (4) nenhum
    // diálogo do sistema por cima. Quem distingue Política de Termos é a ORDEM do fluxo (Política
    // vem logo depois da tela final; Termos, logo depois da Política) — por isso os dois métodos
    // públicos chamam a mesma checagem estrutural. NÃO VERIFICADO em run.
    private async validarTelaDeLeitura(nome: string) {
        const semTopicos = await driver
            .waitUntil(async () => !(await $(seletorTestId('permission-topic')).isDisplayed().catch(() => false)), { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        const naHome = await $(seletorTestId('tab-home')).isDisplayed().catch(() => false);
        const aceiteJaVisivel = await $(seletorTestId('accept-button')).isDisplayed().catch(() => false);
        const dialogo = process.env.PLATFORM === 'ios'
            ? false
            : await $(`id:${PERM}permission_message`).isDisplayed().catch(() => false);

        if (!semTopicos || naHome || aceiteJaVisivel || dialogo) {
            throw new Error(
                `${nome} não está na tela: esperada uma tela de leitura longa (sem permission-topic, sem tab-home, ` +
                `accept-button fora da viewport, sem diálogo do sistema) mas veio permission-topic ` +
                `${semTopicos ? 'ausente' : 'PRESENTE'}, tab-home ${naHome ? 'PRESENTE' : 'ausente'}, ` +
                `accept-button ${aceiteJaVisivel ? 'JÁ visível' : 'fora da viewport'}, diálogo do sistema ${dialogo ? 'PRESENTE' : 'ausente'}.`
            );
        }
        console.log(`📜 ${nome} na tela (leitura longa, aceite ainda fora da viewport)`);
    }

    async validarPolitica() {
        await this.validarTelaDeLeitura('Política de Privacidade');
    }

    async aceitarPolitica() {
        await this.aceitarTelaLonga('Política de Privacidade');
    }

    async validarTermos() {
        await this.validarTelaDeLeitura('Termos e condições');
    }

    async aceitarTermos() {
        await this.aceitarTelaLonga('Termos e condições');
    }

    // Rola até o `accept-button`, toca e espera ele SAIR da viewport (as três telas de aceite usam o
    // mesmo id, então o botão sumir é a única prova de que a tela trocou). Orçamento de 45
    // swipes — a Política exige ~21 no iOS e ~30 no Android; a parada é o isDisplayed().
    private async aceitarTelaLonga(tela: string) {
        const maxSwipes = 45;
        const aceite = seletorTestId('accept-button');

        const alcancou = process.env.PLATFORM === 'ios'
            ? await this.rolaAteVisivelIOS(aceite, maxSwipes)
            : await scrollUntilVisible(await $(aceite), maxSwipes);
        if (!alcancou) {
            throw new Error(`aceite da ${tela} não apareceu após ${maxSwipes} swipes (accept-button não ficou visível)`);
        }

        if (process.env.PLATFORM === 'ios') await this.fechaBanner();
        await (await $(aceite)).click();

        const saiu = await driver
            .waitUntil(async () => !(await $(aceite).isDisplayed().catch(() => false)), { timeout: 15000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!saiu) {
            throw new Error(
                `Onboarding travado em "${tela}": o accept-button continuou visível 15s depois do clique, ` +
                'ou seja, a tela não trocou.'
            );
        }
        console.log(`✅ Aceite (${tela})`);
        await driver.pause(timewhait);
    }

    // Home de chegada: aba Home + `editorial-home-root` (HomePage.validarHome, com erro nomeado se o
    // app caiu), as QUATRO abas da barra inferior e o bloco editorial de topo (`editorial-group-0`,
    // o "banner promocional" do PDF — existência, porque no iOS ele vem visible=false). Os ids são os
    // das capturas m6e1/13 e iOS 10; texto das abas não entra.
    async validarHomeComAbas() {
        await new HomePage().validarHome();

        for (const aba of ['tab-home', 'tab-categories', 'tab-bag', 'tab-menu']) {
            const visivel = await $(seletorTestId(aba)).waitForDisplayed({ timeout: 10000 }).then(() => true).catch(() => false);
            if (!visivel) {
                throw new Error(`Home sem a barra de abas completa: ${aba} não ficou visível em 10s.`);
            }
        }

        const banner = await $(seletorTestId('editorial-group-0')).waitForExist({ timeout: 10000 }).then(() => true).catch(() => false);
        if (!banner) {
            throw new Error('Home sem o bloco editorial de topo (editorial-group-0 não existe na árvore em 10s).');
        }
        console.log('🏠 Home com as 4 abas e o bloco editorial de topo');
    }

    // ONB-07: da Home não há caminho de volta ao onboarding. Duas evidências:
    //  (1) nenhuma tela do onboarding na árvore (Boas-vindas no Android, `permission-topic`,
    //      `accept-button`) e, no iOS, nenhum `Back` (o iOS não tem Voltar de hardware);
    //  (2) Android: o Voltar do sistema não leva ao onboarding — se o app sair, é reativado e a
    //      Home volta (o onboarding está concluído). Comportamento do Voltar na Home NÃO VERIFICADO.
    async validarSemNavegacaoCircular() {
        await this.onboardingForaDaArvore('na Home, antes do Voltar');

        if (process.env.PLATFORM === 'ios') {
            if (await $('accessibility id:Back').isDisplayed().catch(() => false)) {
                throw new Error('Navegação circular: a Home mostra um botão Back, que levaria de volta ao onboarding.');
            }
            return;
        }

        await driver.back();
        await driver.pause(2000);
        const estado = await driver.execute('mobile: queryAppState', { appId: APP_ID }).catch(() => null);
        if (estado !== 4) {
            console.log(`↩ O Voltar da Home tirou o app do primeiro plano (queryAppState=${estado}) — reativando`);
            await driver.execute('mobile: activateApp', { appId: APP_ID });
        }
        await new HomePage().validarHome();
        await this.onboardingForaDaArvore('depois do Voltar da Home');
    }

    private async onboardingForaDaArvore(quando: string) {
        const resquicios: string[] = [];
        if (process.env.PLATFORM !== 'ios' && (await $(this.boasVindasAndroid).isDisplayed().catch(() => false))) {
            resquicios.push('Boas-vindas');
        }
        if (await $(seletorTestId('permission-topic')).isDisplayed().catch(() => false)) resquicios.push('permission-topic');
        if (await $(seletorTestId('accept-button')).isDisplayed().catch(() => false)) resquicios.push('accept-button');

        if (resquicios.length > 0) {
            throw new Error(`Navegação circular: ${quando}, a árvore ainda tem elementos do onboarding (${resquicios.join(', ')}).`);
        }
    }
}
