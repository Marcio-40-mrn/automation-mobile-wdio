import { deviceIndex, resolveIOSDevice } from "./device-index";

export interface Credentials {
    user: string;
    password: string;
}

// Seleciona a conta deste device em runtime.
//
// No Device Farm, as variáveis de ambiente são globais ao run (todos os devices
// recebem as mesmas), então a escolha da conta tem que acontecer aqui, a partir
// da identidade do device. CLIENT_USERS_EMAILS é uma lista (CSV) dos emails das
// contas da plataforma; a senha é comum a todas (CLIENT_PASSWORD).
//
// A identidade sai de dois caminhos diferentes, um por plataforma — ver o cabeçalho do
// device-index.ts para o porquê: Android pelo MODELO (`deviceModel` das capabilities),
// iOS pelo par (versão de OS, resolução em pontos) contra o mapa que o CI gera.
//
// Por que CSV de emails (e não base64 de JSON): o Device Farm limita cada variável
// de ambiente a 256 caracteres, e o base64 das contas estourava esse limite.
//
// COMO O VALOR CHEGA ATÉ AQUI — e por que as duas plataformas não são iguais:
// o workflow grava CLIENT_USERS_EMAILS no run (schedule-run --configuration
// environmentVariables). No host ANDROID o script do testspec herda o ambiente do agente e a
// variável está lá. No host iOS NÃO: o script que a AWS gera monta o próprio ambiente e exporta
// só as DEVICEFARM_* (conferido no artefato "Test spec shell script" do run). Por isso o
// testspec-ios.yml escreveria `CLIENT_USERS_EMAILS=` vazio, e por isso o .env do iOS é gerado
// no workflow e viaja dentro do ZIP do test package.
//
// Fallback (local / single device): CLIENT_USER + CLIENT_PASSWORD do .env.
export async function getCredentials(): Promise<Credentials> {
    const isIOS = process.env.PLATFORM === 'ios';
    const isDeviceFarm = !!process.env.DEVICEFARM_DEVICE_UDID;
    const emailsCsv = process.env.CLIENT_USERS_EMAILS;
    const password = process.env.CLIENT_PASSWORD!;

    // No Device Farm o fallback local não é resposta: CLIENT_USER só existe no .env da máquina
    // do Marcio. Sem esta guarda, a ausência da lista vira `user: undefined` e a falha só
    // aparece três telas adiante, como "setValue/addValue only take string or number values"
    // em LoginPage.logarIOS — foi o que derrubou os 5 devices do CI iOS Run #5.
    if (isDeviceFarm && !emailsCsv) {
        throw new Error(
            'CLIENT_USERS_EMAILS ausente ou vazia no host do Device Farm ' +
            `(plataforma ${isIOS ? 'ios' : 'android'}). ` +
            'No iOS a AWS não repassa as environmentVariables do run para o script do testspec, ' +
            'então o .env é gerado no workflow (step "Gerar .env do test package (iOS)") e vai ' +
            'dentro do ZIP; confira se o testspec-ios.yml não sobrescreveu esse arquivo com ' +
            'valor vazio. No Android, confira o secret CLIENT_USERS_ANDROID_EMAILS.'
        );
    }

    if (emailsCsv && isDeviceFarm) {
        const emails = emailsCsv
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean);

        const { index, comoAchei } = await indiceDoDevice(isIOS);

        if (index === undefined || index < 0 || index >= emails.length) {
            // ANDROID: comportamento original, inalterado — avisa e usa conta[0].
            // iOS: falha. A diferença não é preferência de estilo, é o que cada plataforma
            // aguenta hoje. No Android o `deviceModel` identifica o aparelho e os 6 prefixos
            // estão conferidos, então cair aqui é caso de borda. No iOS, cair aqui é o caso
            // NORMAL enquanto não houver mapa — e significa os 5 iPhones na mesma conta,
            // favoritando e desfavoritando o mesmo produto ao mesmo tempo. Isso não é um run
            // degradado, é um run mentindo.
            if (isIOS) {
                throw new Error(
                    `Não foi possível atribuir uma conta única a este iPhone ` +
                    `(${comoAchei}, índice=${index}, contas disponíveis=${emails.length}). ` +
                    'Os 5 aparelhos cairiam na mesma conta e brigariam pelos favoritos, então o ' +
                    'teste para aqui em vez de dar um falso negativo três telas adiante. ' +
                    'O mapa é gerado pelo CI a partir do pool — ver device-index.ts.'
                );
            }

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

// Índice deste device na lista de contas, mais uma descrição de COMO ele foi achado (vai
// para o log e para a mensagem de erro — sem isso, depurar isso no Device Farm é adivinhação).
async function indiceDoDevice(isIOS: boolean): Promise<{ index?: number; comoAchei: string }> {
    if (isIOS) {
        const entry = await resolveIOSDevice();
        return {
            index: entry?.index,
            comoAchei: entry
                ? `Device iOS "${entry.name}" (chave ${entry.key})`
                : 'Device iOS sem IOS_DEVICE_MAP no ambiente',
        };
    }

    // Modelo do device via capabilities da sessão (ex.: "SM-S918U1").
    const model = String((browser?.capabilities as any)?.deviceModel ?? '');
    // Casa por prefixo: a chave do mapa é o prefixo do modelo (sem sufixo de região).
    const index = Object.entries(deviceIndex.android)
        .find(([prefix]) => model.startsWith(prefix))?.[1];

    return { index, comoAchei: `Device model "${model}"` };
}
