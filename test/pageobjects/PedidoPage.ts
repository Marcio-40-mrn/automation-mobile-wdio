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
// A partir do build 1.21.7/507 (Android) a tela do Pix não mostra mais valor em R$ (captura 39 de
// captures-2026-10-17-pix-desconto/): o valor a pagar saiu daqui e o spec valida o desconto do Pix
// no Pagamento e no Resumo (CheckoutPage.lerDescontoPix e lerValoresDoResumo).
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
        // iOS, build 1.21.7/352: o id é `wake-pix-tentar-de-novo` (sem o "qr"); o `wake-pix-qr-tentar-de-novo`
        // não existe. fonte: captures-2026-10-18-pix-ate-pedido/19-finalizar-t5s.xml (visible=false com o QR
        // carregado). Android segue com o id das capturas 2026-10-14.
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

    // Toca em Copiar e confere a área de transferência: tem que ficar IGUAL ao código exibido e
    // ser um código Pix (começa com "000201", o cabeçalho do padrão do Banco Central). Rodada 2:
    // 218 caracteres. A cópia não é validada pelo "Copiado" do botão (texto).
    async copiarCodigo() {
        // iOS, build 1.21.7/352 (captures-2026-10-18-pix-ate-pedido/, pedido #178710): o código é um
        // StaticText SEM id dentro do `wake-pix-aguardando` [29,616 302x17], label começando com 000201
        // (217 caracteres); `wake-pix-copiar` [339,611 72x28]. No Remote Access o getClipboard voltou
        // vazio antes e depois do Copiar (2x): com a área de transferência vazia só se registra aviso
        // (decisão do Marcio, 2026-10-18); com conteúdo, ela tem que ser igual ao código.
        if (IOS) {
            const elCodigo = await $('//*[@name="wake-pix-aguardando"]//XCUIElementTypeStaticText[starts-with(@label,"000201")]');
            await this.waitForElement(elCodigo);
            const codigoIOS = ((await elCodigo.getAttribute('label')) ?? '').trim();
            await (await $(COPIAR)).click();

            let copiadoIOS = '';
            await driver
                .waitUntil(async () => {
                    copiadoIOS = Buffer.from(await driver.getClipboard('plaintext'), 'base64').toString('utf8').trim();
                    return copiadoIOS === codigoIOS;
                }, { timeout: 10000, interval: 1000 })
                .catch(() => false);
            if (!copiadoIOS) {
                console.warn(`⚠ Copiar código Pix (iOS): área de transferência vazia; a cópia não foi conferida (código na tela: ${codigoIOS.length} caracteres).`);
            } else if (copiadoIOS !== codigoIOS) {
                throw new Error(
                    `Copiar código Pix: a área de transferência (${copiadoIOS.length} caracteres) não ficou igual ao código ` +
                    `exibido (${codigoIOS.length} caracteres) em 10s.`
                );
            }
            console.log(`📋 Código Pix na tela (${codigoIOS.length} caracteres)${copiadoIOS ? ', copiado e conferido' : ''}`);
            allure.addAttachment('Código Pix copiado', codigoIOS, 'text/plain');
            return;
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

        // 60s (era 30s) a partir do build 1.21.7/507: no run de 2026-10-17 12:34 a tela ficou só no
        // esqueleto de carregamento por mais de 30s; na captura de 13:40 carregou em ~3s
        // (`order-status-container` existe, um por pedido). Intermitente.
        const abriu = await $(seletorTestId('order-status-container')).waitForDisplayed({ timeout: 60000 }).then(() => true).catch(() => false);
        if (!abriu) {
            await anexarPrint('Meus pedidos — lista não carregou');
            throw new Error('Ver meus pedidos: a lista de pedidos (order-status-container) não abriu em 60s.');
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

    // ---- Pedido com CARTÃO recusado (spec 03-compra-cartao) ------------------------------------
    // Build 1.22.0/509 (Android, captures-2026-10-19-build509-run25/, caps. 44–51): depois do
    // Finalizar o app fica na tela `wake-order-processing-recusado` (sem número nem valores) e não
    // existe mais a tela de Pedido Cancelado. A tela recusado é a raiz da pilha: o "Escolher outra
    // forma de pagamento" leva ao Pagamento (com `retry-payment-methods`), o voltar dele traz de
    // volta e o BACK de hardware sai do app. O pedido só aparece em Meus pedidos (cap. 51):
    // "#201280, Cancelado, Valor total R$ 716,80", o 1º da lista.
    // Por isso: fecha e reabre o app (o login continua, cap. 50), Menu → `menu-card-orders`, e lê o
    // 1º pedido. Estrutura de Meus pedidos (dump 51, conferido): por pedido, TextViews IRMÃOS planos
    // na ordem "Pedido Nº <n>", `order-status-container`, status, imagem, "Valor total: R$ …".
    // Só números são lidos (regra: o teste não valida texto); o "Cancelado" não é comparado.
    // iOS (354): nenhuma destas telas foi capturada; `menu-card-orders` e `order-status-container`
    // são os ids das capturas iOS do 352 (Meus pedidos no Pix, caps. 47–49); não verificado no 354.
    // Risco conhecido: os pedidos anteriores da conta têm o mesmo valor (mesma calça + frete); o
    // número é anexado ao Allure para conferência.

    // Sai da tela de recusa (fecha e reabre o app) e abre Meus pedidos com a lista carregada.
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

    // Número do 1º pedido de Meus pedidos ("Pedido Nº 201280" -> "201280"): o texto com número
    // longo imediatamente antes do 1º `order-status-container`.
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

    // Valor total do 1º pedido de Meus pedidos: o 1º texto com "R$" depois do 1º `order-status-container`.
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
