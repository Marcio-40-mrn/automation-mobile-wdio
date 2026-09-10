// Identidade do device -> índice da conta (NÃO secreto).
//
// Cada device do pool recebe um índice único na lista de contas da sua plataforma,
// garantindo que cada conta seja usada por exatamente um device por run. As duas
// plataformas resolvem isso por caminhos DIFERENTES, porque os sinais disponíveis
// são diferentes:
//
// ANDROID — mapa fixo, por MODELO (`ro.product.model`), que o UiAutomator2 expõe como
// `deviceModel` nas capabilities da sessão. A chave é o PREFIXO do modelo (sem o sufixo
// de região "U1"/"U"/"B"), casado com `startsWith` — resiliente a variações de região.
// Os prefixos S9xx são todos distintos (nenhum é prefixo do outro).
//
// iOS — mapa GERADO PELO CI, lido de `IOS_DEVICE_MAP` (ver abaixo). Não existe mapa fixo
// aqui, e não é por falta de tentativa:
//
//   - O XCUITest NÃO devolve `deviceModel` nas capabilities. A resposta do createSession
//     traz platformName, deviceName, udid, app, automationName, noReset, bundleId,
//     autoAcceptAlerts, usePrebuiltWDA, derivedDataPath, showXcodeLog e platformVersion —
//     e nada mais. Um mapa por modelId ("A2482") não casa com nada.
//   - `DEVICEFARM_DEVICE_NAME` no iOS é o UDID, e o UDID MUDA A CADA RUN (frota pública):
//     comparados os 5 aparelhos entre dois runs, os 10 valores são diferentes.
//   - Sozinha, a versão de OS não basta: iPhone 13 e iPhone 15 rodam 18.5 no pool atual.
//   - Sozinha, a resolução não basta: 13 e 14 são 390x844; 14 Pro Max e 15 Pro Max são
//     430x932.
//
// O que funciona é o PAR (versão de OS, resolução em pontos) — único nos 5 aparelhos do
// pool. E funciona porque cada ARN de device do Device Farm fixa modelo + versão de OS,
// então o CI consegue montar o mapa antes do run, pela API, e mandar pronto no `.env` do
// test package. Assim o mapa não apodrece: se o pool mudar ou a AWS trocar a versão de um
// aparelho, o CI regera; e se duas chaves colidirem, o CI falha ANTES de gastar minuto de
// device.
//
// Como descobrir os modelId do Android: aws devicefarm list-jobs --arn <run> \
//   --query "jobs[].{name:device.name, modelId:device.modelId}"
//
// Android: 6 modelos -> índices 0..5    iOS: gerado pelo CI (5 aparelhos -> 0..4)
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

// Uma entrada do mapa gerado pelo CI. `key` é "<os>|<largura>x<altura>" em PONTOS —
// a mesma unidade que o driver.getWindowRect() devolve.
export interface IOSDeviceEntry {
    key: string;
    index: number;
    name: string;
}

// Memo POR CHAVE, não por processo: o resolve é chamado duas vezes por teste (conta e nome do
// device) e não faz sentido pagar dois getWindowRect nem repetir o log. Guardar um único
// resultado global daria errado se dois aparelhos rodassem no mesmo processo — no Device Farm
// cada device é um host separado, mas a suposição não precisa estar no código.
const iosPorChave = new Map<string, IOSDeviceEntry>();

// Resolve o device iOS do Device Farm contra o mapa que o CI gerou.
//
// Devolve null quando não há mapa (execução local, ou Android). LANÇA quando há mapa e a
// chave deste aparelho não está nele: silenciar isso é o que faria os 5 iPhones caírem na
// mesma conta e brigarem pelos favoritos — a falha tem que aparecer aqui, com o motivo.
export async function resolveIOSDevice(): Promise<IOSDeviceEntry | null> {
    const bruto = process.env.IOS_DEVICE_MAP;
    if (!bruto) return null;

    let mapa: IOSDeviceEntry[];
    try {
        mapa = JSON.parse(bruto);
    } catch (e) {
        throw new Error(
            `IOS_DEVICE_MAP não é JSON válido (${(e as Error).message}). ` +
            'Ele é gerado pelo step "Gerar .env do test package (iOS)" do workflow.'
        );
    }

    const os = process.env.DEVICEFARM_DEVICE_OS_VERSION ?? '?';
    const { width, height } = await driver.getWindowRect();
    const key = `${os}|${width}x${height}`;

    const jaResolvido = iosPorChave.get(key);
    if (jaResolvido) return jaResolvido;

    const hit = mapa.find((e) => e.key === key);
    if (!hit) {
        throw new Error(
            `Device iOS não encontrado no IOS_DEVICE_MAP: chave "${key}" ` +
            `(udid=${process.env.DEVICEFARM_DEVICE_UDID}). ` +
            `Chaves no mapa: ${mapa.map((e) => `${e.key} -> ${e.name}`).join(', ')}. ` +
            'O mapa é gerado pelo CI a partir dos ARNs do pool iOS; se o pool mudou, o run ' +
            'novo já regera. Se a chave continuar de fora, a resolução ou a versão de OS ' +
            'reportada pelo aparelho não é a que a API do Device Farm informa para esse ARN.'
        );
    }

    console.log(`📱 Device iOS "${hit.name}" (chave ${key}) -> índice ${hit.index}`);
    iosPorChave.set(key, hit);
    return hit;
}
