import { deviceIndex } from "./device-index";

export interface Credentials {
    user: string;
    password: string;
}

// Seleciona a conta deste device em runtime.
//
// As duas plataformas resolvem isso por caminhos DIFERENTES, e a diferença não é estilo: é o
// que cada uma consegue fazer no Device Farm.
//
// ANDROID — um run com N devices. As environmentVariables do Device Farm são do RUN, não do
// JOB, então os 6 aparelhos recebem a MESMA lista (CLIENT_USERS_EMAILS, CSV) e cada um escolhe
// seu índice pelo MODELO (`deviceModel` das capabilities do UiAutomator2). Funciona porque o
// UiAutomator2 devolve o modelo e os 6 prefixos estão conferidos. Não mexer: esse é o caminho
// que está verde (CI Run #6, 18/18).
//
// iOS — um run POR DEVICE. O XCUITest não devolve `deviceModel` e o host não expõe índice de
// job, então não existe auto-identificação confiável: o mapa por (versão de OS, resolução) que
// existia aqui não casava em 2 dos 5 aparelhos (a API do Device Farm informa a versão completa,
// "17.3.1", e o host exporta truncada, "17.3") e, pior, ABORTAVA o teste quando não casava —
// 2 iPhones do CI iOS Run #6 não executaram nada por causa disso.
//   Agora quem decide é o CI: ele agenda 5 runs de 1 device (schedule-run com
//   --device-selection-configuration mirando o ARN do aparelho) e injeta CLIENT_USER já
//   resolvida no testspec daquele run. O aparelho não precisa saber quem é, e nenhum aparelho
//   pode ficar de fora por não ser reconhecido.
//
// Por que CSV de emails no Android (e não base64 de JSON): o Device Farm limita cada variável
// de ambiente a 256 caracteres, e o base64 das contas estourava esse limite.
//
// Fallback (execução local, nas duas plataformas): CLIENT_USER + CLIENT_PASSWORD do .env.
export async function getCredentials(): Promise<Credentials> {
    const isIOS = process.env.PLATFORM === 'ios';
    const isDeviceFarm = !!process.env.DEVICEFARM_DEVICE_UDID;
    const password = process.env.CLIENT_PASSWORD!;

    // --- iOS: a conta vem pronta, uma por run ---
    if (isIOS) {
        const user = process.env.CLIENT_USER;

        // Sem esta guarda a ausência vira `user: undefined` e a falha só aflora três telas
        // adiante, como "addValue only take string or number values" em LoginPage.logarIOS —
        // foi o que derrubou os 5 devices do CI iOS Run #5.
        if (isDeviceFarm && !user) {
            throw new Error(
                'CLIENT_USER ausente no host do Device Farm (iOS). Ela é injetada pelo CI no ' +
                'testspec de cada run — um run por aparelho, um email por run. Conferir o step ' +
                '"Agendar runs iOS (um por device)" do workflow e a guarda de CLIENT_USER no ' +
                'testspec-ios.yml.'
            );
        }

        console.log(`🔑 Conta deste run: ${user}`);
        return { user: user!, password };
    }

    // --- Android: inalterado ---
    const emailsCsv = process.env.CLIENT_USERS_EMAILS;

    if (isDeviceFarm && !emailsCsv) {
        throw new Error(
            'CLIENT_USERS_EMAILS ausente ou vazia no host do Device Farm (plataforma android). ' +
            'Confira o secret CLIENT_USERS_ANDROID_EMAILS.'
        );
    }

    if (emailsCsv && isDeviceFarm) {
        const emails = emailsCsv
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean);

        const { index, comoAchei } = indiceDoDevice();

        if (index === undefined || index < 0 || index >= emails.length) {
            // Avisa e usa conta[0]. O `deviceModel` identifica o aparelho e os 6 prefixos estão
            // conferidos, então cair aqui é caso de borda, não o caminho normal.
            console.warn(
                `⚠️ Modelo não mapeado em device-index.ts: ${comoAchei} ` +
                `(plataforma android, índice=${index}). ` +
                `Usando conta[0] como fallback — ajuste o mapa para garantir unicidade.`
            );
            return { user: emails[0], password };
        }

        const user = emails[index];
        console.log(`🔑 ${comoAchei} -> conta[${index}] = ${user}`);
        return { user, password };
    }

    return {
        user: process.env.CLIENT_USER!,
        password,
    };
}

// Índice deste device Android na lista de contas, mais uma descrição de COMO ele foi achado
// (vai para o log e para o aviso — sem isso, depurar isso no Device Farm é adivinhação).
function indiceDoDevice(): { index?: number; comoAchei: string } {
    // Modelo do device via capabilities da sessão (ex.: "SM-S918U1").
    const model = String((browser?.capabilities as any)?.deviceModel ?? '');
    // Casa por prefixo: a chave do mapa é o prefixo do modelo (sem sufixo de região).
    const index = Object.entries(deviceIndex.android)
        .find(([prefix]) => model.startsWith(prefix))?.[1];

    return { index, comoAchei: `Device model "${model}"` };
}
