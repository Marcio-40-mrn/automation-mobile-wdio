// Nome amigável do device em runtime, para rotular a execução no relatório Allure.
//
// Android: a identidade vem do MODELO (ro.product.model), lido das capabilities da sessão
// (`browser.capabilities.deviceModel`, ex.: "SM-S918U1"). O mapa é por PREFIXO de modelo
// (sem o sufixo de região), casado com `startsWith` — mesma ideia do device-index.ts.
//
// iOS: o `deviceModel` não existe nas capabilities do XCUITest e o DEVICEFARM_DEVICE_NAME é o
// UDID — era por isso que o relatório rotulava os aparelhos com "00008110-...". Como agora o
// CI agenda um run POR aparelho, ele já sabe de qual se trata (o ARN do device fixa o modelo) e
// injeta o nome em DEVICE_LABEL, junto com a conta. Nada a resolver em runtime.
//
// Fallback: modelo cru -> DEVICEFARM_DEVICE_NAME -> 'AVD-S24' (execução local).
const deviceNames: Record<string, string> = {
    "SM-S918": "Samsung Galaxy S23 Ultra",
    "SM-S916": "Samsung Galaxy S23+",
    "SM-S928": "Samsung Galaxy S24 Ultra",
    "SM-S926": "Samsung Galaxy S24+",
    "SM-S938": "Samsung Galaxy S25 Ultra",
    "SM-S948": "Samsung Galaxy S26 Ultra",
};

export async function friendlyDeviceName(): Promise<string> {
    const isIOS = process.env.PLATFORM === 'ios';
    const isDeviceFarm = !!process.env.DEVICEFARM_DEVICE_UDID;

    if (!isDeviceFarm) return isIOS ? 'iOS Remote' : 'AVD-S24';

    if (isIOS) {
        return process.env.DEVICE_LABEL || process.env.DEVICEFARM_DEVICE_NAME || 'Device Farm iOS';
    }

    const model = String((browser?.capabilities as any)?.deviceModel ?? '');
    const hit = Object.entries(deviceNames).find(([prefix]) => model.startsWith(prefix))?.[1];

    return hit || model || process.env.DEVICEFARM_DEVICE_NAME || 'Device Farm';
}
