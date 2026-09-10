import '@wdio/allure-reporter';
import { execSync } from 'child_process';
import * as dotenv from "dotenv";
import * as fs from "fs";
import allure from '@wdio/allure-reporter';
import { Status } from 'allure-js-commons';
dotenv.config();

const isDeviceFarm = !!process.env.DEVICEFARM_DEVICE_UDID;
const isCI        = !!process.env.CI;
const isIOS       = process.env.PLATFORM === 'ios';
const isRemote    = isIOS && !!process.env.REMOTE_HOST;

// App version: env vars (Device Farm/CI) or .build-info.json (local install-apk.mjs)
let appVersion      = process.env.APP_VERSION       ?? '?';
let appBuildVersion = process.env.APP_BUILD_VERSION ?? '?';
if (appVersion === '?' && fs.existsSync('./.build-info.json')) {
    try {
        const info = JSON.parse(fs.readFileSync('./.build-info.json', 'utf8'));
        if (info.appVersion)      appVersion      = info.appVersion;
        if (info.appBuildVersion) appBuildVersion = info.appBuildVersion;
    } catch {}
}

function buildCapabilities(): object[] {
    if (isDeviceFarm && isIOS) {
        return [{
            platformName: "iOS",
            "appium:deviceName": process.env.DEVICEFARM_DEVICE_NAME ?? "iPhone",
            "appium:udid": process.env.DEVICEFARM_DEVICE_UDID,
            "appium:app": process.env.DEVICEFARM_APP_PATH,
            "appium:automationName": "XCUITest",
            "appium:noReset": false,
            "appium:bundleId": "com.aramis.ecomm",
            "appium:autoAcceptAlerts": true,
            // Device Farm fornece um WDA pré-compilado e pré-assinado; reusar evita
            // o build via xcodebuild (que falha com "code 70" no host self-managed).
            "appium:usePrebuiltWDA": true,
            "appium:derivedDataPath":
                process.env.DEVICEFARM_WDA_DERIVED_DATA_PATH_V9 ??
                process.env.DEVICEFARM_WDA_DERIVED_DATA_PATH,
            "appium:showXcodeLog": true,
        } as any];
    }

    if (isDeviceFarm) {
        return [{
            platformName: "Android",
            "appium:deviceName": process.env.DEVICEFARM_DEVICE_NAME ?? "Android",
            "appium:udid": process.env.DEVICEFARM_DEVICE_UDID,
            "appium:app": process.env.DEVICEFARM_APP_PATH,
            "appium:automationName": "UiAutomator2",
            "appium:noReset": false,
            "appium:appPackage": "com.aramis.ecomm",
            "appium:appActivity": "com.aramis.ecomm.MainActivity",
            "appium:uiautomator2ServerInstallTimeout": 60000,
            "appium:uiautomator2ServerLaunchTimeout": 60000,
            // Sem autoGrantPermissions: deixamos os diálogos de permissão (GPS/notificação)
            // aparecerem para a sequência ativarApp() tratá-los, como no fluxo local.
            "appium:noIncrementalInstall": true,
        } as any];
    }

    if (isIOS) {
        return [{
            platformName: "iOS",
            "appium:automationName": "XCUITest",
            "appium:noReset": true,
            "appium:bundleId": "com.aramis.ecomm",
            "appium:autoAcceptAlerts": true,
        } as any];
    }

    return [{
        platformName: "Android",
        "appium:deviceName": "AVD-S24",
        "appium:automationName": "UiAutomator2",
        "appium:noReset": true,
        "appium:appPackage": "com.aramis.ecomm",
        "appium:appActivity": "com.aramis.ecomm.MainActivity",
        "appium:uiautomator2ServerInstallTimeout": 60000,
        "appium:uiautomator2ServerLaunchTimeout": 60000,
        "appium:autoGrantPermissions": true,
        "appium:noIncrementalInstall": true,
    } as any];
}

function buildConnectionSettings(): object {
    if (isDeviceFarm) {
        return {
            hostname: '127.0.0.1',
            port: 4723,
            path: '/wd/hub',
        };
    }
    if (isRemote) {
        return {
            protocol: 'https',
            hostname: process.env.REMOTE_HOST,
            port: parseInt(process.env.REMOTE_PORT!),
            path: process.env.REMOTE_PATH_IOS,
        };
    }
    return {};
}

// O serviço 'appium' abaixo só sobe na execução LOCAL contra o AVD-S24. No Device Farm e no
// modo remoto ele é desligado: o Appium é o do host, iniciado pelo testspec.yml.
// Por isso os pacotes `appium` / `appium-uiautomator2-driver` do package.json não têm efeito
// nenhum no CI — e um deles é ativamente perigoso: declarar "appium" no package.json faz o
// Appium do host autodetectar o diretório do projeto como APPIUM_HOME e perder os drivers
// pré-instalados. Foi o que quebrou o run-22 (2026-09-01). Detalhes no testspec.yml.
function buildServices(): object[] {
    if (isDeviceFarm || isRemote) return [];
    return [
        ['appium', {
            command: 'appium',
            args: {
                address: '127.0.0.1',
                port: 4723,
                relaxedSecurity: true,
                allowCors: true
            }
        }]
    ];
}

function deviceLabel(): string {
    // DEVICE_LABEL primeiro: no iOS o DEVICEFARM_DEVICE_NAME e o UDID, e era ele que aparecia
    // como "Device=00008110-..." no environment.properties. Como o iOS roda um run por
    // aparelho, o CI ja sabe o modelo e manda o nome pronto no .env do testspec. No Android a
    // variavel nao existe e o comportamento segue identico (DEVICEFARM_DEVICE_NAME ja e o nome).
    if (isDeviceFarm) return process.env.DEVICE_LABEL || process.env.DEVICEFARM_DEVICE_NAME || 'Device Farm';
    if (isRemote)     return 'iOS Remote (Device Farm)';
    if (isIOS)        return 'iOS Remote';
    return 'AVD-S24';
}

function environmentLabel(): string {
    if (isDeviceFarm) return 'AWS Device Farm';
    if (isRemote)     return 'AWS Device Farm (Remote)';
    return 'Local';
}

export const config: WebdriverIO.Config = {
    runner: 'local',

    specs: ['./test/specs/**/*.ts'],

    maxInstances: 1,

    ...buildConnectionSettings(),

    capabilities: buildCapabilities(),

    logLevel: 'info',

    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 900000
    },

    services: buildServices() as any,

    reporters: ['spec',
        ['allure', {
        outputDir: 'allure-results',
        // true de propósito. Com o reporting por comando ligado, o onAfterCommand do
        // @wdio/allure-reporter anexa o RESULTADO de todo comando WebDriver como JSON -- e
        // o comando que para a gravação devolve o vídeo em base64. Com isso o mesmo vídeo
        // entrava DUAS vezes no allure-results: o .mp4 do addAttachment do afterTest mais
        // um -attachment.json exatamente 4/3 maior. No run #26 isso era ~57% do payload
        // (iPhone 13: 230MB de .mp4 + 307MB de base64; 1,16GB de anexos no iOS inteiro), o
        // que estourou o heap do 'allure generate --single-file' e encheu o disco do runner
        // no publish-report. A estrutura legível do relatório vem do step() de
        // test/specs/test.spec.ts, nao dos comandos WebDriver.
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,}],
        ['ctrf-json', {
        outputDir: './ctrf',
        outputFileFormat: () => 'ctrf-report.json',
        minimal: false,
        testType: 'e2e',
        appName: 'Aramis eComm',
        appVersion: appVersion}],
    ],

    onPrepare: function () {
        if (!fs.existsSync('./allure-results')) fs.mkdirSync('./allure-results');

        fs.writeFileSync('./allure-results/environment.properties', [
            `Platform=${isIOS ? 'iOS' : 'Android'}`,
            `Device=${deviceLabel()}`,
            'App=com.aramis.ecomm',
            `AppVersion=${appVersion}`,
            `AppBuildVersion=${appBuildVersion}`,
            `Automation=${isIOS ? 'XCUITest' : 'UiAutomator2'}`,
            'Framework=WebdriverIO + Appium',
            `Environment=${environmentLabel()}`,
        ].join('\n'));

        fs.writeFileSync('./allure-results/categories.json', JSON.stringify([
            {
                name: 'Elemento não encontrado',
                matchedStatuses: ['failed'],
                messageRegex: '.*displayed.*'
            },
            {
                name: 'Timeout',
                matchedStatuses: ['broken'],
                messageRegex: '.*Timeout.*'
            },
            {
                name: 'Outras falhas',
                matchedStatuses: ['failed']
            }
        ], null, 2));

        fs.writeFileSync('./allure-results/executor.json', JSON.stringify({
            name: environmentLabel(),
            type: isDeviceFarm ? 'ci' : 'local',
            buildName: isDeviceFarm
                ? `Device Farm Run ${new Date().toISOString()}`
                : `Run ${new Date().toLocaleString('pt-BR')}`,
        }, null, 2));
    },

    before: async function () {
        console.log("\n⏳ Aguardando 10 segundos para o aplicativo carregar...\n");
        await driver.pause(10000);
    },

    beforeTest: async function () {
        if (isRemote) return;
        if (isDeviceFarm && !isIOS) {
            // SÓ Android no Device Farm: o screenrecord nativo (startRecordingScreen)
            // trunca o vídeo em ~37s na troca de surface do app lá. MediaProjection
            // sobrevive a isso e grava a sessão inteira.
            // Local e iOS continuam no startRecordingScreen (já gravam completo).
            //
            // resolution: '1280x720' (720p) — em resolução nativa o .mp4 passava de
            // 100MB (limite por arquivo do GitHub), era apagado no publish e o vídeo
            // sumia do relatório (404). 720p reduz drásticamente o tamanho sem perder
            // a legibilidade do fluxo. priority é prioridade da thread de captura
            // (não mexe na qualidade/tamanho) — mantido em 'high' para não perder frames.
            await driver.execute('mobile: startMediaProjectionRecording', {
                resolution: '1280x720',
                maxDurationSec: 600,
                priority: 'high',
            });
        } else if (isIOS) {
            // O startRecordingScreen do XCUITest grava em mjpeg por default: JPEG quadro a
            // quadro, sem compressão temporal, em resolução nativa. Era isso — e não a
            // resolução sozinha — que produzia .mp4 de 230MB por device no run #26, contra
            // ~50MB do Android em H.264 720p. libx264 + escala + fps menor põem o iOS na
            // mesma ordem de grandeza e abaixo do corte de 95MB que o publish do workflow
            // aplica. Se faltar libx264 no ffmpeg do host, o catch do afterTest absorve: o
            // teste não quebra, só fica sem vídeo.
            await driver.startRecordingScreen({
                videoType: 'libx264',
                videoQuality: 'low',
                videoFps: 8,
                videoScale: '720:-2',
                timeLimit: 180,
            } as any);
        } else {
            await driver.startRecordingScreen({ timeLimit: 180 });
        }
    },

    afterTest: async function (_test: any, _context: any, _result: any) {

        if (!isRemote) {
            try {
                const video = (isDeviceFarm && !isIOS)
                    ? (await driver.execute('mobile: stopMediaProjectionRecording')) as string
                    : await driver.stopRecordingScreen();
                const videoBuffer = Buffer.from(video, 'base64');
                allure.startStep('Video da execução');
                allure.addAttachment('Video', videoBuffer, 'video/mp4');
                allure.endStep(Status.PASSED);
                console.log('🎥 Vídeo anexado ao Allure.');
            } catch (err) {
                console.warn("Erro ao capturar vídeo:", err);
            }
        }

        if (isRemote) {
            try {
                await driver.terminateApp('com.aramis.ecomm');
                console.log('\n✅ App iOS encerrado (Remote Access).');
            } catch (error) {
                console.warn('Aviso: terminateApp não suportado:', error);
            }
        } else if (isIOS) {
            try {
                console.log('\n🔄 Limpando dados da aplicação iOS (mobile: clearApp)...');
                await driver.execute('mobile: clearApp', { bundleId: 'com.aramis.ecomm' });
            } catch (error) {
                console.error('Erro ao limpar app iOS:', error);
            }
        } else if (isDeviceFarm) {
            try {
                console.log('\n🔄 Limpando dados da aplicação via Appium (mobile: clearApp)...');
                await driver.execute('mobile: clearApp', { appId: 'com.aramis.ecomm' });
            } catch (error) {
                console.error('Erro ao limpar app via Appium:', error);
            }
        } else {
            try {
                console.log('\n🔄 Limpando dados da aplicação (adb shell pm clear com.aramis.ecomm)...');
                execSync('adb shell pm clear com.aramis.ecomm', { stdio: 'inherit' });
            } catch (error) {
                console.error('Erro ao executar limpeza via ADB:', error);
            }
        }
    },

    onComplete: async function () {
        const { execSync } = await import("child_process");

        if (isDeviceFarm) {
            console.log('\n⏭️ Device Farm: allure-results copiado pelo testspec.yml. Pulando geração local.\n');
            return;
        }

        if (fs.existsSync('./allure-report/history')) {
            fs.cpSync('./allure-report/history', './allure-results/history', { recursive: true });
        }

        console.log("\n📊 Gerando relatório Allure...\n");
        execSync("allure generate ./allure-results --clean", { stdio: "inherit" });

        if (!isCI) {
            execSync("allure open ./allure-report", { stdio: "inherit" });
        }

        console.log("\n📁 Relatório gerado em: ./allure-report\n");
    },
};
