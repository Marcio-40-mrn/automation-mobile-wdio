// Identidade do device Android -> índice da conta (NÃO secreto).
//
// Vale SÓ para o Android, e só porque lá o run é um só com N aparelhos: as
// environmentVariables do Device Farm são do RUN, não do JOB, então os 6 devices recebem a
// mesma lista de contas (CLIENT_USERS_EMAILS) e cada um precisa escolher seu índice sozinho.
// O sinal usado é o MODELO (`ro.product.model`), que o UiAutomator2 expõe como `deviceModel`
// nas capabilities da sessão. A chave é o PREFIXO do modelo (sem o sufixo de região
// "U1"/"U"/"B"), casado com `startsWith` — resiliente a variações de região. Os prefixos S9xx
// são todos distintos (nenhum é prefixo do outro).
//
// O iOS NÃO passa por aqui. Existia neste arquivo um mapa por (versão de OS, resolução),
// gerado pelo CI, porque o XCUITest não devolve `deviceModel` e o UDID muda a cada run. Ele
// foi removido: a chave não casava em 2 dos 5 aparelhos (a API do Device Farm informa a versão
// completa — "17.3.1" — e o host exporta truncada — "17.3") e, quando não casava, o teste
// ABORTAVA. No CI iOS Run #6 isso apagou o iPhone 14 e o iPhone 15 Pro Max da execução.
// Hoje o iOS roda um run POR device, com a conta injetada pelo CI em CLIENT_USER — ver o
// cabeçalho do credentials.ts.
//
// Como descobrir os modelId do Android: aws devicefarm list-jobs --arn <run> \
//   --query "jobs[].{name:device.name, modelId:device.modelId}"
export const deviceIndex: Record<'android', Record<string, number>> = {
    android: {
        "SM-S918": 0,  // Galaxy S23 Ultra
        "SM-S916": 1,  // Galaxy S23+
        "SM-S928": 2,  // Galaxy S24 Ultra
        "SM-S926": 3,  // Galaxy S24+
        "SM-S938": 4,  // Galaxy S25 Ultra
        "SM-S948": 5,  // Galaxy S26 Ultra
    },
};

// Posição do produto na listagem que ESTE device usa (0 = 1º card), no 1º bloco (ver
// `posicoesDoProduto`). Os 11 aparelhos do CI
// (Android e iOS rodam ao mesmo tempo) compravam a mesma 1ª camisa e o estoque acabava no meio
// do run: CI Run #30 (2026-10-20, app 1.22.2, Android 512), "Size sold out" em 4 iPhones e a
// camisa tirada do pedido no checkout no S24+ e no iPhone 15. Cada device passa a ter a sua
// posição, sem nome de produto fixo (REQUIREMENTS.md).
//   Android: 0–5, o mesmo índice da conta (`deviceModel`, mapa acima).
//   iOS: 6–10, pelo DEVICE_LABEL que o workflow injeta no .env do run (nome do device no Device
//   Farm, o mesmo que aparece em "CI iOS Run #N - <nome>"). O host iOS não tem outro sinal.
//   Local (AVD / Remote Access) ou device fora dos mapas: 0, como era antes.
const posicaoIOS: Record<string, number> = {
    "Apple iPhone 13": 6,
    "Apple iPhone 14": 7,
    "Apple iPhone 14 Pro Max": 8,
    "Apple iPhone 15": 9,
    "Apple iPhone 15 Pro Max": 10,
};

// Quantos devices rodam ao mesmo tempo no CI (Android 0–5 + iOS 6–10). Cada listagem é dividida
// em blocos de 11 posições: o bloco N dá ao device a posição `posicao + 11 * N`, então dois devices
// nunca caem no mesmo card. Cada TESTE usa os seus blocos na listagem que compartilha com outro
// teste (Marcio, 2026-10-26: produto diferente por teste e por device), e os blocos seguintes são o
// próximo produto quando o primeiro não tem tamanho com estoque (CI Run #41, app 1.22.8/519).
export const DEVICES_NO_CI = 11;

export function posicoesDoProduto(blocos: number[]): { posicoes: number[]; comoAchei: string } {
    const { posicao, comoAchei } = posicaoDoProduto();
    return { posicoes: blocos.map((bloco) => posicao + DEVICES_NO_CI * bloco), comoAchei };
}

export function posicaoDoProduto(): { posicao: number; comoAchei: string } {
    if (!process.env.DEVICEFARM_DEVICE_UDID) return { posicao: 0, comoAchei: 'execução local' };

    if (process.env.PLATFORM === 'ios') {
        const label = process.env.DEVICE_LABEL ?? '';
        const posicao = posicaoIOS[label];
        return posicao === undefined
            ? { posicao: 0, comoAchei: `DEVICE_LABEL "${label}" fora do mapa (posição 0)` }
            : { posicao, comoAchei: `DEVICE_LABEL "${label}"` };
    }

    const model = String((browser?.capabilities as any)?.deviceModel ?? '');
    const posicao = Object.entries(deviceIndex.android).find(([prefix]) => model.startsWith(prefix))?.[1];
    return posicao === undefined
        ? { posicao: 0, comoAchei: `Device model "${model}" fora do mapa (posição 0)` }
        : { posicao, comoAchei: `Device model "${model}"` };
}
