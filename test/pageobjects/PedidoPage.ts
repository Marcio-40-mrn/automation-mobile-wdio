import { BasePage, timewhait, seletorTestId } from "./BasePage";
import { driver, $, $$ } from '@wdio/globals'
import allure from '@wdio/allure-reporter';
import { anexarPrint } from "../utils/allure-helpers";
import { valorEmReais } from "./CheckoutPage";

// Tela do pedido com Pix (QR code), Meus pedidos e a volta para a Home. iOS (build 349): árvores de
// .planning/drafts/app-migrado/ios/captures-2026-10-15-compra-pix/ 45 a 49 (drafts 26, 36 e 37),
// conferidas com lxml; o QR NÃO carregou em nenhuma captura iOS (0/3), então `wake-pix-qrcode`,
// `wake-pix-copiar` e o código copia-e-cola nunca foram vistos no iOS.
// Android: árvore lida pelo Appium na rodada 2
// (.planning/drafts/app-migrado/android/captures-2026-10-14-compra-pix-rodada2/13-t2.xml e 15a):
// a tela do Pix tem um cronômetro, e o CheckoutPage.finalizarPedido() já desligou a espera de
// tela parada (waitForIdleTimeout 0) antes de chegar aqui.

const IOS = process.env.PLATFORM === 'ios';

const COPIAR = seletorTestId('wake-pix-copiar');
// Sem id (pedidos no ELEMENTOS-SEM-TESTID.md, seção 00), ancorados no `wake-pix-copiar`, que fica
// no mesmo ViewGroup: o número do pedido é o 1º TextView dele; o código copia-e-cola é o
// TextView logo antes do botão Copiar.
// iOS: StaticText sem id dentro do `wake-pix-aguardando`, o único com "#" ("Order #139889";
// 1 nó na captura 45). Não depende do QR ter carregado.
const NUMERO_PEDIDO_PIX = IOS
    ? '//*[@name="wake-pix-aguardando"]//XCUIElementTypeStaticText[contains(@label,"#")]'
    : '//*[@resource-id="wake-pix-copiar"]/../android.widget.TextView[1]';
const CODIGO_PIX = '//*[@resource-id="wake-pix-copiar"]/preceding-sibling::android.widget.TextView[1]';
// "Valor a pagar": TextView sem id no mesmo bloco, o único com "R$" (o código copia-e-cola não tem).
// Conferido: 1 nó na árvore da rodada 2 (13-t2.xml), "R$ 629,91 à vista".
// iOS: StaticText sem id dentro do `wake-pix-aguardando`, o único com "R$" ("R$ 629,91 à vista";
// 1 nó nas capturas 45 e 49).
const VALOR_A_PAGAR_PIX = IOS
    ? '//*[@name="wake-pix-aguardando"]//XCUIElementTypeStaticText[contains(@label,"R$")]'
    : '//*[@resource-id="wake-pix-copiar"]/../android.widget.TextView[contains(@text,"R$")]';
// "Ver meus pedidos": `pressable` genérico, mas único dentro da tela do Pix.
// iOS: o mesmo `pressable` dentro do `wake-pix-aguardando` (1 nó nas capturas 45 e 49; tocado na 47).
const VER_MEUS_PEDIDOS = IOS
    ? '//*[@name="wake-pix-aguardando"]//*[@name="pressable"]'
    : '//*[@resource-id="wake-pix-aguardando"]//*[@resource-id="pressable"]';

function primeiroNumeroLongo(texto: string): string | null {
    const m = /(\d{5,})/.exec(texto);
    return m ? m[1] : null;
}

export class PedidoPage extends BasePage {

    // Espera o QR code até 60s (rodada 2: ~5s). Na rodada 1 o QR não carregou e a tela mostrou o
    // "tentar de novo" (`wake-pix-qr-tentar-de-novo`), que só refaz o QR do MESMO pedido — por
    // isso ele é tocado (até 2x) enquanto se espera. Erro nomeado se o QR não vier.
    async validarQrCode() {
        const qr = seletorTestId('wake-pix-qrcode');
        const tentarDeNovo = seletorTestId('wake-pix-qr-tentar-de-novo');
        let toquesTentarDeNovo = 0;

        const carregou = await driver
            .waitUntil(async () => {
                if (await $(qr).isDisplayed().catch(() => false)) return true;
                if (toquesTentarDeNovo < 2 && (await $(tentarDeNovo).isDisplayed().catch(() => false))) {
                    toquesTentarDeNovo++;
                    console.log(`⚠ QR do Pix não carregou — tocando em "tentar de novo" (${toquesTentarDeNovo}/2)`);
                    await (await $(tentarDeNovo)).click();
                }
                return false;
            }, { timeout: 60000, interval: 1000 })
            .then(() => true)
            .catch(() => false);
        if (!carregou) {
            throw new Error(
                `QR code do Pix não carregou em 60s (wake-pix-qrcode ausente; "tentar de novo" tocado ${toquesTentarDeNovo}x).`
            );
        }

        for (const [seletor, nome] of [[COPIAR, 'botão Copiar (wake-pix-copiar)'], [VER_MEUS_PEDIDOS, 'botão Ver meus pedidos']]) {
            if (!(await $(seletor).isDisplayed().catch(() => false))) {
                throw new Error(`Tela do Pix: o QR carregou, mas o ${nome} não está na tela.`);
            }
        }
        console.log('✅ QR code do Pix, botão Copiar e Ver meus pedidos na tela');
        await anexarPrint('Pix — QR code e código copia-e-cola');
    }

    // Número do pedido mostrado na tela do Pix ("Order #127635" -> "127635").
    async numeroDoPedido(): Promise<string> {
        const el = await $(NUMERO_PEDIDO_PIX);
        await this.waitForElement(el);
        const numero = primeiroNumeroLongo(await el.getText());
        if (!numero) {
            throw new Error('Tela do Pix: o número do pedido não foi encontrado no topo da tela.');
        }
        console.log(`🧾 Pedido nº ${numero}`);
        return numero;
    }

    // Lê o "Valor a pagar" da tela do Pix e devolve o número. O spec compara com o total do resumo.
    async valorAPagar(): Promise<number> {
        const el = await $(VALOR_A_PAGAR_PIX);
        await this.waitForElement(el);
        const texto = await el.getText();
        const valor = valorEmReais(texto);
        if (valor === null) {
            throw new Error(`Tela do Pix: o valor a pagar não pôde ser lido como valor em reais ("${texto}").`);
        }
        console.log(`💰 Valor a pagar na tela do Pix: R$ ${valor}`);
        return valor;
    }

    // Toca em Copiar e confere a área de transferência: tem que ficar IGUAL ao código exibido e
    // ser um código Pix (começa com "000201", o cabeçalho do padrão do Banco Central). Rodada 2:
    // 218 caracteres. A cópia não é validada pelo "Copiado" do botão (texto).
    async copiarCodigo() {
        // iOS: o QR nunca carregou nas capturas (draft 36), então o código copia-e-cola e o botão
        // Copiar não foram vistos na árvore. Seletor não escrito: erro nomeado em vez de palpite.
        if (IOS) {
            throw new Error('Copiar código Pix (iOS): a tela com o QR carregado não foi capturada no iOS; seletor do código não está escrito.');
        }
        const codigo = (await (await $(CODIGO_PIX)).getText()).trim();
        await (await $(COPIAR)).click();

        let copiado = '';
        const ok = await driver
            .waitUntil(async () => {
                copiado = Buffer.from(await driver.getClipboard('plaintext'), 'base64').toString('utf8').trim();
                return copiado === codigo;
            }, { timeout: 10000, interval: 1000 })
            .then(() => true)
            .catch(() => false);
        if (!ok) {
            throw new Error(
                `Copiar código Pix: a área de transferência (${copiado.length} caracteres) não ficou igual ao código ` +
                `exibido (${codigo.length} caracteres) em 10s.`
            );
        }
        if (!codigo.startsWith('000201')) {
            throw new Error(`Copiar código Pix: o código copiado não é um código Pix (não começa com 000201; ${codigo.length} caracteres).`);
        }
        console.log(`📋 Código Pix copiado (${codigo.length} caracteres)`);
        allure.addAttachment('Código Pix copiado', codigo, 'text/plain');
    }

    // Abre Meus pedidos, confere que o pedido criado está na lista e anota o número que aparece no
    // alto da tela (anexo no Allure, com o print). Devolve esse número.
    async verMeusPedidos(numero: string): Promise<string> {
        await (await $(VER_MEUS_PEDIDOS)).click();

        const abriu = await $(seletorTestId('order-status-container')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!abriu) {
            throw new Error('Ver meus pedidos: a lista de pedidos (order-status-container) não abriu em 30s.');
        }
        await driver.pause(timewhait);

        // iOS: "Pedido Nº <n>" é StaticText sem id (captura 47); a busca é pelo número.
        const naLista = await $(
            IOS ? `//XCUIElementTypeStaticText[contains(@label,"${numero}")]` : `//android.widget.TextView[contains(@text,"${numero}")]`
        ).isDisplayed().catch(() => false);
        if (!naLista) {
            throw new Error(`Meus pedidos: o pedido ${numero} (da tela do Pix) não está na lista.`);
        }

        let topo: string | null = null;
        if (IOS) {
            // Uma leitura da árvore só: percorrer os StaticText um a um custa ~300 ms cada na sessão
            // remota. O 1º StaticText com número longo, na ordem do documento, é o do alto da tela.
            for (const m of (await driver.getPageSource()).matchAll(/<XCUIElementTypeStaticText[^>]*?\slabel="([^"]*)"/g)) {
                topo = primeiroNumeroLongo(m[1]);
                if (topo) break;
            }
        } else {
            for (const el of await $$('//android.widget.TextView')) {
                topo = primeiroNumeroLongo(await el.getText().catch(() => ''));
                if (topo) break;
            }
        }
        if (!topo) {
            throw new Error('Meus pedidos: nenhum número de pedido no alto da tela.');
        }

        const print = await driver.takeScreenshot();
        allure.addAttachment('Meus pedidos', Buffer.from(print, 'base64'), 'image/png');
        allure.addAttachment('Número do pedido', `Tela do Pix: ${numero}\nAlto de Meus pedidos: ${topo}`, 'text/plain');
        console.log(`🧾 Meus pedidos: pedido ${numero} na lista; no alto da tela: ${topo}`);
        return topo;
    }

    // Sai de Meus pedidos pelo voltar do cabeçalho; na rodada 2 um toque levou direto à Home.
    async sairParaHome() {
        await this.fechaBanner();
        await (await $(seletorTestId('header-back-button'))).click();
        const home = await $(seletorTestId('tab-home')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!home) {
            throw new Error('Meus pedidos: o voltar do cabeçalho não levou à Home (tab-home) em 30s.');
        }
        console.log('🏠 De volta à Home');
    }
}
