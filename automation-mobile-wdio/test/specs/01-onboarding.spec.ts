import { HomePage } from "../pageobjects/HomePage";
import { OnboardingPage, MOTIVO_IOS_ALERTAS, type TipoDialogo } from "../pageobjects/OnboardingPage";
import {
    configurarFechadorDeBanner,
    pularNestaPlataforma,
    rotularTeste,
    step,
} from "../utils/allure-helpers";

// Etapa 1 do M6 — Onboarding (Funcionalidade "Onboarding — Permissões e Acesso Inicial", PDF §3).
//
// REGRAS DESTE SPEC (todas decididas pelo Marcio):
//  - Os testes NÃO validam texto e ignoram o idioma (REQUIREMENTS.md, 2026-10-01): a asserção é
//    pelo destino ou estado da tela, e nenhum seletor mora aqui (só chamadas de page object).
//  - O teste segue o APLICATIVO, nunca o PDF (REQUIREMENTS.md, 2026-10-01; DEC-C a e b,
//    2026-10-02). Onde o Gherkin diverge do app, o `it` valida o app e o comentário registra a
//    diferença:
//      * ONB-01 — o PDF diz notificação -> localização; o app mostra localização -> notificação
//        (Android) e notificação -> ATT -> localização (iOS). A ordem asserida é a do app.
//      * ONB-04 e ONB-05 — o PDF vai da Política direto à Home; o app passa pelos TERMOS
//        (Política -> Termos -> Home). O fluxo asserido inclui os Termos.
//  - ONB-06 ("Retornar à tela final do onboarding ao pressionar Voltar na Política") está FORA DO
//    ESCOPO: "Onboarding não tem retorno" (decisão do Marcio, 2026-10-01, REQUIREMENTS.md). Por
//    isso este arquivo tem 6 `it` (ONB-01..05 e ONB-07), sem `it` nem `it.skip` para o ONB-06.
//  - iOS (DEC-C e): o wdio.conf.ts liga autoAcceptAlerts e NÃO foi alterado. Os cenários que
//    precisam observar ou negar um alerta (ONB-01..04) são pulados no iOS com motivo visível no
//    relatório. ONB-05 e ONB-07 atravessam o onboarding aceitando e rodam no iOS se o app estiver
//    limpo; o iOS não limpa dados entre testes, então só o 1º teste de uma sessão limpa roda.
//
// App limpo por teste: cada `it` começa em onboardingPage.abrirApp() (Android: clearApp +
// activateApp). Este spec NÃO liga sessão mantida entre testes (DEC-A "como hoje").

const MOTIVO_APP_NAO_LIMPO =
    'DEC-C (e): o app já passou do onboarding e este ambiente não limpa os dados entre os testes ' +
    '(iOS: mobile: clearApp não é suportado em iPhone real e o Remote Access só faz terminateApp). ' +
    'O cenário só roda no primeiro teste de uma sessão com o app limpo.';

describe('Onboarding — Permissões e Acesso Inicial', () => {
    const homePage = new HomePage();
    const onboardingPage = new OnboardingPage();

    // Rótulos Allure por aparelho + fechador de banner antes de cada passo (ver allure-helpers.ts).
    async function iniciar(codigo: string) {
        configurarFechadorDeBanner(() => homePage.fechaBanner());
        await rotularTeste(codigo);
    }

    // Abre o app no estado limpo; se o ambiente não deixou o app limpo (iOS), pula com motivo.
    async function abrirAppLimpo(ctx: Mocha.Context) {
        let estado = 'limpo' as 'limpo' | 'ja-concluido';
        await step('onboardingPage.abrirApp()', async () => { estado = await onboardingPage.abrirApp(); });
        if (estado === 'ja-concluido') pularNestaPlataforma(ctx, MOTIVO_APP_NAO_LIMPO);
    }

    it('[ONB-01] Avançar pelo onboarding concedendo permissões de notificação e localização', async function (this: Mocha.Context) {
        await iniciar('ONB-01');
        if (!onboardingPage.alertasObservaveis()) pularNestaPlataforma(this, MOTIVO_IOS_ALERTAS);
        let ordem: TipoDialogo[] = [];

        // Dado que o app é aberto pela primeira vez e a tela de boas-vindas é exibida
        await abrirAppLimpo(this);

        // Quando o usuário avança, concede a permissão de notificações e escolhe "Enquanto o app
        // estiver em uso" na de localização. DEC-C (a): a ordem asserida é a do APP, não a do PDF.
        await step('onboardingPage.tocarCta()', () => onboardingPage.tocarCta());
        await step('onboardingPage.tratarPermissoes(permitir, permitir)', async () => {
            ordem = await onboardingPage.tratarPermissoes({ localizacao: 'permitir', notificacao: 'permitir' });
        });
        await step('ordem dos diálogos é a do app', async () => {
            expect(ordem).toEqual(onboardingPage.ordemEsperadaDosDialogos());
        });

        // E o usuário visualiza os três blocos informativos e a seção "Como criamos sua experiência?"
        await step('onboardingPage.validarTopicos()', () => onboardingPage.validarTopicos());

        // E o usuário toca em "Continue" -> Então o sistema exibe a tela de Política de Privacidade
        await step('onboardingPage.continuarTopicos()', async () => { await onboardingPage.continuarTopicos(); });
        await step('onboardingPage.validarPolitica()', () => onboardingPage.validarPolitica());
    });

    it('[ONB-02] Avançar pelo onboarding negando permissão de notificações', async function (this: Mocha.Context) {
        await iniciar('ONB-02');
        if (!onboardingPage.alertasObservaveis()) pularNestaPlataforma(this, MOTIVO_IOS_ALERTAS);
        const escolha = { localizacao: 'permitir', notificacao: 'negar' } as const;
        let ordem: TipoDialogo[] = [];

        // Dado que o app é aberto pela primeira vez e a permissão de notificações é solicitada
        await abrirAppLimpo(this);
        await step('onboardingPage.tocarCta()', () => onboardingPage.tocarCta());

        // Quando o usuário nega a permissão de notificações (o diálogo PRECISA ter aparecido)
        await step('onboardingPage.tratarPermissoes(permitir, negar)', async () => {
            ordem = await onboardingPage.tratarPermissoes(escolha);
        });
        await step('o diálogo de notificação apareceu', async () => { expect(ordem).toContain('notificacao'); });

        // Então o sistema avança para a próxima etapa do onboarding sem bloquear o fluxo: a tela
        // final aparece e o Continue leva à Política (o app volta a pedir a permissão negada).
        await step('onboardingPage.validarTopicos()', () => onboardingPage.validarTopicos());
        await step('onboardingPage.continuarTopicos(escolha)', async () => { await onboardingPage.continuarTopicos(escolha); });
        await step('onboardingPage.validarPolitica()', () => onboardingPage.validarPolitica());
    });

    it('[ONB-03] Avançar pelo onboarding negando permissão de localização', async function (this: Mocha.Context) {
        await iniciar('ONB-03');
        if (!onboardingPage.alertasObservaveis()) pularNestaPlataforma(this, MOTIVO_IOS_ALERTAS);
        const escolha = { localizacao: 'negar', notificacao: 'permitir' } as const;
        let ordem: TipoDialogo[] = [];

        // Dado que o app é aberto pela primeira vez e o diálogo de permissão de localização é exibido
        await abrirAppLimpo(this);
        await step('onboardingPage.tocarCta()', () => onboardingPage.tocarCta());

        // Quando o usuário toca em "Não permitir" (o diálogo PRECISA ter aparecido)
        await step('onboardingPage.tratarPermissoes(negar, permitir)', async () => {
            ordem = await onboardingPage.tratarPermissoes(escolha);
        });
        await step('o diálogo de localização apareceu', async () => { expect(ordem).toContain('localizacao'); });

        // Então o sistema avança para a próxima etapa do onboarding sem bloquear o fluxo
        await step('onboardingPage.validarTopicos()', () => onboardingPage.validarTopicos());
        await step('onboardingPage.continuarTopicos(escolha)', async () => { await onboardingPage.continuarTopicos(escolha); });
        await step('onboardingPage.validarPolitica()', () => onboardingPage.validarPolitica());
    });

    it('[ONB-04] Avançar pelo onboarding negando ambas as permissões de notificações e localização', async function (this: Mocha.Context) {
        await iniciar('ONB-04');
        if (!onboardingPage.alertasObservaveis()) pularNestaPlataforma(this, MOTIVO_IOS_ALERTAS);
        const escolha = { localizacao: 'negar', notificacao: 'negar' } as const;
        let ordem: TipoDialogo[] = [];

        // Dado que o app é aberto pela primeira vez e a permissão de notificações é solicitada
        await abrirAppLimpo(this);
        await step('onboardingPage.tocarCta()', () => onboardingPage.tocarCta());

        // Quando o usuário nega as duas permissões (os dois diálogos PRECISAM ter aparecido)
        await step('onboardingPage.tratarPermissoes(negar, negar)', async () => {
            ordem = await onboardingPage.tratarPermissoes(escolha);
        });
        await step('os dois diálogos apareceram', async () => {
            expect(ordem).toEqual(expect.arrayContaining(['localizacao', 'notificacao']));
        });

        // E o usuário visualiza a tela final do onboarding e toca em "Continue"
        await step('onboardingPage.validarTopicos()', () => onboardingPage.validarTopicos());
        await step('onboardingPage.continuarTopicos(escolha)', async () => { await onboardingPage.continuarTopicos(escolha); });

        // E o sistema exibe a Política de Privacidade e o usuário aceita.
        // DEC-C (b): o PDF vai da Política direto à Home; o app passa pelos TERMOS — o teste
        // valida o app (Política -> Termos -> Home).
        await step('onboardingPage.validarPolitica()', () => onboardingPage.validarPolitica());
        await step('onboardingPage.aceitarPolitica()', () => onboardingPage.aceitarPolitica());
        await step('onboardingPage.validarTermos()', () => onboardingPage.validarTermos());
        await step('onboardingPage.aceitarTermos()', () => onboardingPage.aceitarTermos());

        // Então o sistema exibe a Home sem bloqueios
        await step('onboardingPage.validarHomeComAbas()', () => onboardingPage.validarHomeComAbas());
    });

    it('[ONB-05] Concluir o onboarding e acessar a Home ao tocar em Continue na Política de Privacidade', async function (this: Mocha.Context) {
        await iniciar('ONB-05');

        // Dado que o usuário chegou à tela de Política de Privacidade a partir da tela final do
        // onboarding. Os diálogos de permissão são tolerantes aqui (o cenário não os asserta; no
        // iOS o autoAcceptAlerts os aceita sozinho — DEC-C e).
        await abrirAppLimpo(this);
        await step('onboardingPage.tocarCta()', () => onboardingPage.tocarCta());
        await step('onboardingPage.tratarPermissoes(permitir, permitir)', async () => {
            await onboardingPage.tratarPermissoes({ localizacao: 'permitir', notificacao: 'permitir' }, { exigir: false });
        });
        await step('onboardingPage.continuarTopicos()', async () => { await onboardingPage.continuarTopicos(); });
        await step('onboardingPage.validarPolitica()', () => onboardingPage.validarPolitica());

        // Quando o usuário toca em "Continue" na Política.
        // DEC-C (b): no app a Política leva aos TERMOS, e só o aceite dos Termos leva à Home (o
        // PDF vai direto à Home). O teste valida o app.
        await step('onboardingPage.aceitarPolitica()', () => onboardingPage.aceitarPolitica());
        await step('onboardingPage.validarTermos()', () => onboardingPage.validarTermos());
        await step('onboardingPage.aceitarTermos()', () => onboardingPage.aceitarTermos());

        // Então o sistema exibe a Home com o banner promocional e a barra de navegação inferior
        // com as abas Home, Categorias, Mochila e Menu
        await step('onboardingPage.validarHomeComAbas()', () => onboardingPage.validarHomeComAbas());
    });

    it('[ONB-07] Ausência de navegação circular entre a tela final do onboarding e a Política de Privacidade', async function (this: Mocha.Context) {
        await iniciar('ONB-07');

        // Dado que o usuário tocou em "Continue" na tela final e chegou à Política de Privacidade
        await abrirAppLimpo(this);
        await step('onboardingPage.tocarCta()', () => onboardingPage.tocarCta());
        await step('onboardingPage.tratarPermissoes(permitir, permitir)', async () => {
            await onboardingPage.tratarPermissoes({ localizacao: 'permitir', notificacao: 'permitir' }, { exigir: false });
        });
        await step('onboardingPage.continuarTopicos()', async () => { await onboardingPage.continuarTopicos(); });
        await step('onboardingPage.validarPolitica()', () => onboardingPage.validarPolitica());

        // Quando o usuário toca em "Continue" na Política e é redirecionado para a Home
        // (DEC-C b: com os Termos no caminho, como no app)
        await step('onboardingPage.aceitarPolitica()', () => onboardingPage.aceitarPolitica());
        await step('onboardingPage.aceitarTermos()', () => onboardingPage.aceitarTermos());
        await step('onboardingPage.validarHomeComAbas()', () => onboardingPage.validarHomeComAbas());

        // Então não há opção de retornar à tela de onboarding anterior a partir da Home
        await step('onboardingPage.validarSemNavegacaoCircular()', () => onboardingPage.validarSemNavegacaoCircular());
    });
});
