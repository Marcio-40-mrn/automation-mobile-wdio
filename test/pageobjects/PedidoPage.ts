import { BasePage, timewhait, seletorTestId } from "./BasePage";
import { driver, $, $$ } from '@wdio/globals'
import allure from '@wdio/allure-reporter';
import { anexarPrint } from "../utils/allure-helpers";
import { valorEmReais } from "./CheckoutPage";

const IOS = process.env.PLATFORM === 'ios';

const COPIAR = seletorTestId('wake-pix-copiar');
const NUMERO_PEDIDO_PIX = IOS
    ? '//*[@name="wake-pix-aguardando"]//XCUIElementTypeStaticText[contains(@label,"#")]'
    : '//*[@resource-id="wake-pix-copiar"]/../android.widget.TextView[1]';
const CODIGO_PIX = '//*[@resource-id="wake-pix-copiar"]/preceding-sibling::android.widget.TextView[1]';
const VER_MEUS_PEDIDOS = IOS
    ? '//*[@name="wake-pix-aguardando"]//*[@name="pressable"]'
    : '//*[@resource-id="wake-pix-aguardando"]//*[@resource-id="pressable"]';

function primeiroNumeroLongo(texto: string): string | null {
    const m = /(\d{5,})/.exec(texto);
    return m ? m[1] : null;
}

export class PedidoPage extends BasePage {
    async validarQrCode() {
        const qr = seletorTestId('wake-pix-qrcode');
        const tentarDeNovo = seletorTestId(IOS ? 'wake-pix-tentar-de-novo' : 'wake-pix-qr-tentar-de-novo');
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

    async copiarCodigo() {
        let codigo: string;
        if (IOS) {
            const elCodigo = await $('//*[@name="wake-pix-aguardando"]//XCUIElementTypeStaticText[starts-with(@label,"000201")]');
            await this.waitForElement(elCodigo);
            codigo = ((await elCodigo.getAttribute('label')) ?? '').trim();
        } else {
            codigo = (await (await $(CODIGO_PIX)).getText()).trim();
        }
        if (!codigo.startsWith('000201')) {
            throw new Error(`Copiar código Pix: o código na tela não é um código Pix (não começa com 000201; ${codigo.length} caracteres).`);
        }
        await (await $(COPIAR)).click();

        let copiado = '';
        await driver
            .waitUntil(async () => {
                copiado = Buffer.from(await driver.getClipboard('plaintext'), 'base64').toString('utf8').trim();
                return copiado === codigo;
            }, { timeout: 10000, interval: 1000 })
            .catch(() => false);
        if (!copiado) {
            console.warn(`⚠ Copiar código Pix: área de transferência vazia; a cópia não foi conferida (código na tela: ${codigo.length} caracteres).`);
        } else if (copiado !== codigo) {
            throw new Error(
                `Copiar código Pix: a área de transferência (${copiado.length} caracteres) não ficou igual ao código ` +
                `exibido (${codigo.length} caracteres) em 10s.`
            );
        }
        console.log(`📋 Código Pix na tela (${codigo.length} caracteres)${copiado ? ', copiado e conferido' : ''}`);
        allure.addAttachment('Código Pix copiado', codigo, 'text/plain');
    }

    async verMeusPedidos(numero: string): Promise<string> {
        await (await $(VER_MEUS_PEDIDOS)).click();

        const abriu = await $(seletorTestId('order-status-container')).waitForDisplayed({ timeout: 60000 }).then(() => true).catch(() => false);
        if (!abriu) {
            await anexarPrint('Meus pedidos — lista não carregou');
            throw new Error('Ver meus pedidos: a lista de pedidos (order-status-container) não abriu em 60s.');
        }
        await driver.pause(timewhait);

        const naLista = await $(
            IOS ? `//XCUIElementTypeStaticText[contains(@label,"${numero}")]` : `//android.widget.TextView[contains(@text,"${numero}")]`
        ).isDisplayed().catch(() => false);
        if (!naLista) {
            throw new Error(`Meus pedidos: o pedido ${numero} (da tela do Pix) não está na lista.`);
        }

        let topo: string | null = null;
        if (IOS) {
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

    async abrirMeusPedidosDepoisDaRecusa() {
        const app = IOS ? { bundleId: 'com.aramis.ecomm' } : { appId: 'com.aramis.ecomm' };
        await driver.execute('mobile: terminateApp', app);
        await driver.execute('mobile: activateApp', app);
        const menu = await $(seletorTestId('tab-menu'));
        if (!(await menu.waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false))) {
            await anexarPrint('App reaberto — sem a tab bar');
            throw new Error('Depois da recusa: o app reaberto não mostrou a tab bar (tab-menu) em 30s.');
        }
        await this.fechaBanner();
        await menu.click();
        const pedidos = await $(seletorTestId('menu-card-orders'));
        if (!(await pedidos.waitForDisplayed({ timeout: 20000 }).then(() => true).catch(() => false))) {
            await anexarPrint('Menu — sem Meus pedidos');
            throw new Error('Depois da recusa: o card Meus pedidos (menu-card-orders) não apareceu no Menu em 20s.');
        }
        await pedidos.click();
        const abriu = await $(seletorTestId('order-status-container')).waitForDisplayed({ timeout: 60000 }).then(() => true).catch(() => false);
        if (!abriu) {
            await anexarPrint('Meus pedidos — lista não carregou');
            throw new Error('Meus pedidos: a lista de pedidos (order-status-container) não abriu em 60s.');
        }
        await driver.pause(timewhait);
        await anexarPrint('Meus pedidos depois da recusa');
        console.log('🧾 Meus pedidos aberto depois da recusa');
    }

    async numeroDoPedidoComCartao(): Promise<string> {
        const seletor = IOS
            ? '((//*[@name="order-status-container"])[1]/preceding::XCUIElementTypeStaticText[contains(@label,"Nº") or contains(@label,"#")])[last()]'
            : '(//*[@resource-id="order-status-container"])[1]/preceding-sibling::android.widget.TextView[1]';
        const el = await $(seletor);
        await this.waitForElement(el);
        const numero = primeiroNumeroLongo(IOS ? `${await el.getAttribute('label')}` : await el.getText());
        if (!numero) {
            throw new Error('Meus pedidos: o número do 1º pedido não foi encontrado (texto antes do 1º order-status-container).');
        }
        console.log(`🧾 Pedido nº ${numero} (1º de Meus pedidos)`);
        allure.addAttachment('Número do pedido', `1º de Meus pedidos: ${numero}`, 'text/plain');
        return numero;
    }

    async totalDoPedidoComCartao(): Promise<number> {
        const seletor = IOS
            ? '((//*[@name="order-status-container"])[1]/following::XCUIElementTypeStaticText[contains(@label,"R$")])[1]'
            : '(//*[@resource-id="order-status-container"])[1]/following-sibling::android.widget.TextView[contains(@text,"R$")][1]';
        const el = await $(seletor);
        await this.waitForElement(el);
        const total = valorEmReais(IOS ? `${await el.getAttribute('label')}` : await el.getText());
        if (total === null) {
            throw new Error('Meus pedidos: o valor total do 1º pedido não foi encontrado.');
        }
        console.log(`💰 1º pedido de Meus pedidos: total ${total}`);
        return total;
    }

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
