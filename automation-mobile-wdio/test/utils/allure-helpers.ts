import allure, { addHistoryId, addTestCaseId } from '@wdio/allure-reporter';
import { Status } from 'allure-js-commons';
import { getCredentials } from './credentials';
import { friendlyDeviceName } from './device-name';

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
export async function step(nome: string, fn: () => Promise<void>): Promise<void> {
    allure.startStep(nome);
    try {
        if (fechadorDeBanner) {
            await fechadorDeBanner();
        }
        await fn();
        allure.endStep(Status.PASSED);
    } catch (e) {
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

// Skip por plataforma COM motivo visível no relatório (D-03: nunca um spec por sistema
// operacional; quando o cenário não se aplica ou não é observável numa plataforma, ele é pulado
// aqui, e o motivo vai para a descrição do teste e para a tag `pulado-plataforma`).
//
// Uso: o `it` precisa ser declarado com `function` (não arrow) para ter `this`:
//   it('[ONB-02] ...', async function (this: Mocha.Context) {
//       pularNestaPlataforma(this, 'DEC-C (e): ...');
//   });
// `ctx.skip()` interrompe o teste lançando a exceção de "pendente" do Mocha — nada depois da
// chamada roda, então chame ANTES de mexer no app quando o estado dele importar.
export function pularNestaPlataforma(ctx: Mocha.Context, motivo: string): never {
    allure.addDescription(`Pulado nesta plataforma: ${motivo}`, 'text');
    allure.addTag('pulado-plataforma');
    console.log(`⏭️ Teste pulado nesta plataforma: ${motivo}`);
    return ctx.skip();
}

// Aviso que precisa sobreviver ao teste: vai para o console e para um anexo text/plain do
// Allure (publicado no relatório). Usado, por exemplo, quando a limpeza de um favorito órfão
// falha e alguém precisa desfavoritar à mão. Não coloque senha aqui.
export function registrarAvisoNoRelatorio(titulo: string, texto: string): void {
    console.warn(`🧹 ${texto}`);
    allure.addAttachment(titulo, texto, 'text/plain');
}
