import allure, { addHistoryId, addTestCaseId } from '@wdio/allure-reporter';
import { Status } from 'allure-js-commons';
import { getCredentials } from './credentials';
import { friendlyDeviceName } from './device-name';
import { driver } from '@wdio/globals';

// Helpers de Allure compartilhados pelos specs. Antes moravam dentro do test.spec.ts; saíram
// para cá no 06-02 (M6, Etapa 0) para que cada spec novo não copie o mesmo bloco.

// Fechador de banner usado pelo step() para tentar dispensar o banner do Insider ANTES de cada
// passo. O banner pode surgir a qualquer momento após o login, então em vez de espalhar chamadas
// manuais, todo passo tenta fechá-lo primeiro. É no-op quando o banner não está visível
// (fechaBanner checa isDisplayed). Cada spec roda em worker próprio, então a variável de módulo
// não vaza entre arquivos; o spec injeta o fechador no início de cada it().
let fechadorDeBanner: (() => Promise<void>) | null = null;

export function configurarFechadorDeBanner(fn: (() => Promise<void>) | null): void {
    fechadorDeBanner = fn;
}

// Abre um step Allure, tenta fechar o banner, roda o passo e fecha o step como PASSED/FAILED.
// A exceção do passo é sempre relançada — o step nunca engole erro.
// Na falha, anexa o print da tela no próprio step (2026-10-18: o 03-compra-cartao iOS falhou na
// parcela sem print, porque o print dependia de cada método lembrar de chamar anexarPrint). Se o
// print falhar (sessão caída), só loga: nunca troca o erro do teste.
export async function step(nome: string, fn: () => Promise<void>): Promise<void> {
    allure.startStep(nome);
    try {
        if (fechadorDeBanner) {
            await fechadorDeBanner();
        }
        await fn();
        allure.endStep(Status.PASSED);
    } catch (e) {
        try {
            await anexarPrint(`Falha — ${nome}`);
        } catch (erroDoPrint) {
            console.log(`ℹ Print da falha não anexado (${erroDoPrint instanceof Error ? erroDoPrint.message : erroDoPrint})`);
        }
        allure.endStep(Status.FAILED);
        throw e;
    }
}

// Rotula a execução por aparelho para o relatório Allure juntar TODOS os devices num só e
// permitir navegar por aparelho (aba Suites) mostrando a conta usada.
//
// historyId/testCaseId DISTINTO por aparelho: o Allure agrupa resultados pelo historyId; sem isso
// os N devices (mesmo título de teste) colapsam num só, aparecendo como "retries" e mostrando
// apenas um device. Chave estável por modelo (`codigo::device`) -> cada aparelho mantém seu
// histórico (aba Trend) entre runs. (addArgument NÃO altera o historyId nesta versão.)
//
// Devolve device e conta para o spec usar. A senha NUNCA sai daqui: só o e-mail vai para o
// relatório (convenção vigente, CONVENTIONS.md "Allure").
export async function rotularTeste(codigo: string): Promise<{ device: string; conta: string }> {
    const device = await friendlyDeviceName();
    const { user: conta } = await getCredentials();

    const caseKey = `${codigo}::${device}`;
    await addTestCaseId(caseKey);
    await addHistoryId(caseKey);

    await allure.addParentSuite(`${device} — ${conta}`); // nó do aparelho na aba Suites (com a conta)
    await allure.addArgument('Device', device);           // device visível nos parâmetros do teste
    await allure.addArgument('Conta', conta);             // qual conta rodou neste device
    await allure.addLabel('host', device);                // aba Timeline agrupa por aparelho

    return { device, conta };
}

// Aviso que precisa sobreviver ao teste: vai para o console e para um anexo text/plain do
// Allure (publicado no relatório). Usado, por exemplo, quando a limpeza de um favorito órfão
// falha e alguém precisa desfavoritar à mão. Não coloque senha aqui.
export function registrarAvisoNoRelatorio(titulo: string, texto: string): void {
    console.warn(`🧹 ${texto}`);
    allure.addAttachment(titulo, texto, 'text/plain');
}

// Evidência visual: print da tela atual anexado ao relatório (no step em andamento, se houver).
export async function anexarPrint(nome: string): Promise<void> {
    const print = await driver.takeScreenshot();
    allure.addAttachment(nome, Buffer.from(print, 'base64'), 'image/png');
}

// ---- Crash do app (Android) -------------------------------------------------------------------
// O app trava de forma intermitente com `RetryableMountingLayerException: Unable to find viewState`
// (react-native-reanimated), e o teste só vê o efeito: o app fechado (queryAppState=1). Para o
// relatório já trazer a prova para o dev, o spec limpa o buffer de crash do Android no início e,
// se o teste falhar com o app fechado, anexa o log de crash DAQUELA execução + o print da tela.
// Usa `mobile: shell` (o Appium local sobe com relaxedSecurity). Onde não houver permissão
// (ex.: Device Farm), só registra no console — nunca troca o erro do teste.
const APP_ID_ANDROID = 'com.aramis.ecomm';

export async function limparLogDeCrash(): Promise<void> {
    if (process.env.PLATFORM === 'ios') return;
    try {
        await driver.execute('mobile: shell', { command: 'logcat', args: ['-b', 'crash', '-c'] });
    } catch (e) {
        console.log(`ℹ Buffer de crash do Android não foi limpo (${e instanceof Error ? e.message : e})`);
    }
}

export async function anexarCrashDoAppSeFechou(): Promise<void> {
    if (process.env.PLATFORM === 'ios') return;
    try {
        const estado = await driver.execute('mobile: queryAppState', { appId: APP_ID_ANDROID });
        if (estado === 4) return; // em primeiro plano: a falha não foi crash

        let log = '';
        try {
            log = String(await driver.execute('mobile: shell', { command: 'logcat', args: ['-d', '-b', 'crash'] }));
        } catch (e) {
            log = `Log de crash não lido: ${e instanceof Error ? e.message : e}`;
        }
        const linhas = log.split('\n');
        const trecho = linhas.length > 400 ? linhas.slice(-400).join('\n') : log;
        allure.addAttachment(
            `Crash do app — logcat (queryAppState=${estado}; 1 = fechado, 3 = em segundo plano)`,
            trecho.trim() || 'Buffer de crash vazio: o app fechou sem registrar exceção no logcat.',
            'text/plain'
        );
        await anexarPrint('Tela depois que o app fechou');
        console.log(`💥 App fora do primeiro plano (queryAppState=${estado}); log de crash anexado ao relatório`);
    } catch (e) {
        console.log(`ℹ Não foi possível anexar o log de crash (${e instanceof Error ? e.message : e})`);
    }
}
