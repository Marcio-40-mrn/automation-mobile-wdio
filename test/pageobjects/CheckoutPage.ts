import { BasePage, timewhait, seletorTestId, scrollUntilVisible } from "./BasePage";
import { driver, $, $$ } from '@wdio/globals'
import { anexarPrint } from "../utils/allure-helpers";

// Mochila -> endereço -> entrega -> pagamento (Pix) -> resumo -> finalizar. Seletores medidos em
// Android: .planning/drafts/app-migrado/android/captures-2026-10-14-compra-pix(-rodada2)/;
// iOS (build 349): .planning/drafts/app-migrado/ios/captures-2026-10-15-compra-pix/ (drafts 15 a 18 e 35).

const IOS = process.env.PLATFORM === 'ios';

// Produto na Mochila: `wake-product-card-bag-<id>` nas duas plataformas (iOS: captura 37; o sufixo
// muda entre rodadas, draft 15).
const CARD_MOCHILA = IOS
    ? '-ios predicate string:name BEGINSWITH "wake-product-card-bag-"'
    : '-android uiautomator:new UiSelector().resourceIdMatches("wake-product-card-bag-.*")';

// Card do endereço em "Meus endereços": ViewGroup clicável SEM id (pedido de id no
// ELEMENTOS-SEM-TESTID.md, seção 00), o 2º clicável do ScrollView (o 1º é o "Alterar"). Só é
// tocado depois de confirmar que a tela é a de endereços. O toque já avança para a Entrega.
//
// iOS: Other SEM id cujo name é o texto do card e começa por "Receba em" (o wrapper começa por
// "Alterar Receba em…"). Seletor por texto, o único possível; usado nas capturas 38 (Pix) e 27
// (cartão), 1 nó nas duas. Com mais de um endereço salvo casaria vários (o 1º é tocado).
const CARD_ENDERECO = IOS
    ? '-ios predicate string:type == "XCUIElementTypeOther" AND name BEGINSWITH "Receba em"'
    : '(//android.widget.ScrollView//android.view.ViewGroup[@clickable="true"][preceding-sibling::*[@clickable="true"]])[1]';

// Valor em reais como o app exibe ("R$ 1.234,56", com espaço comum ou não separável). Só o
// número é usado — nenhuma frase da tela é comparada (regra: o teste não valida texto).
const VALOR_EM_REAIS = /R\$\s*(-?\s*[\d.]+,\d{2})/;

export type ValoresResumo = { produtos: number; entrega: number; descontos: number; total: number };

export function paraNumero(valor: string): number {
    return Number(valor.replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
}

export function valorEmReais(texto: string): number | null {
    const m = VALOR_EM_REAIS.exec(texto);
    return m ? paraNumero(m[1]) : null;
}

export class CheckoutPage extends BasePage {

    // Abre a Mochila pela aba e confere que tem pelo menos `minimoDeItens` produtos
    // (`wake-product-card-bag-<id>`). Devolve quantos itens há.
    async abrirMochila(minimoDeItens: number): Promise<number> {
        await this.fechaBanner();
        const aba = await $(seletorTestId('tab-bag'));
        await this.waitForElement(aba);
        await aba.click();

        const finalizar = await $(seletorTestId('bag-checkout-button'));
        if (!(await scrollUntilVisible(finalizar, 6))) {
            throw new Error('Mochila: o botão de finalizar compra (bag-checkout-button) não apareceu.');
        }

        const itens = await $$(CARD_MOCHILA).length;
        if (itens < minimoDeItens) {
            throw new Error(`Mochila: esperados pelo menos ${minimoDeItens} produtos (wake-product-card-bag-*), encontrados ${itens}.`);
        }
        console.log(`🎒 Mochila com ${itens} produto(s)`);
        return itens;
    }

    // Finalizar compra -> Meus endereços (~10s na rodada 1) -> toque no card do endereço, que já
    // leva à Entrega (não há botão continuar nos endereços).
    async finalizarCompraESelecionarEndereco() {
        await this.fechaBanner();
        await (await $(seletorTestId('bag-checkout-button'))).click();

        // Primeiro a Mochila precisa SAIR (a rodada 1 mediu ~10s): o XPath do card do endereço é
        // estrutural e casaria com um clicável da Mochila se fosse procurado cedo demais.
        const saiuDaMochila = await driver
            .waitUntil(async () => !(await $(seletorTestId('bag-checkout-button')).isDisplayed().catch(() => false)), {
                timeout: 30000,
                interval: 500,
            })
            .then(() => true)
            .catch(() => false);
        if (!saiuDaMochila) {
            throw new Error('Finalizar compra: a Mochila não saiu da tela 30s depois de tocar em bag-checkout-button.');
        }

        // Meus endereços: tem o `pressable` "Cadastrar novo endereço" e não tem tab bar.
        const naTela = await $(seletorTestId('pressable')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!naTela) {
            throw new Error('Finalizar compra: a tela de endereços não abriu em 30s (pressable "cadastrar novo endereço" ausente).');
        }

        const card = await $(CARD_ENDERECO);
        const temEndereco = await card.waitForDisplayed({ timeout: 10000 }).then(() => true).catch(() => false);
        if (!temEndereco) {
            throw new Error('Endereços: nenhum endereço cadastrado na conta para selecionar.');
        }
        await card.click();

        const entrega = await $(seletorTestId('delivery-option-slas')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!entrega) {
            throw new Error('Endereços: o toque no card do endereço não levou à tela de Entrega (delivery-option-slas) em 30s.');
        }
        console.log('🏠 Endereço selecionado');
        await driver.pause(timewhait);
    }

    // Seleciona a entrega exibida e continua. A opção pode vir já marcada (rodada 1) ou não (rodada
    // 2): o que manda é o `delivery-continue-button` habilitado, que só acontece com uma opção
    // marcada (`selection-filled`).
    async selecionarEntregaEContinuar() {
        const continuar = seletorTestId('delivery-continue-button');
        if (!(await $(continuar).isEnabled().catch(() => false))) {
            await (await $(seletorTestId('delivery-option-slas'))).click();
        }
        const habilitou = await driver
            .waitUntil(async () => (await $(continuar).isEnabled().catch(() => false)), { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!habilitou) {
            throw new Error('Entrega: o botão continuar (delivery-continue-button) não habilitou depois de escolher a entrega.');
        }
        await (await $(continuar)).click();

        const pagamento = await $(seletorTestId('select-wake-method-pix')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!pagamento) {
            throw new Error('Entrega: a tela de pagamento (select-wake-method-pix) não abriu em 30s.');
        }
        console.log('🚚 Entrega selecionada');
        await driver.pause(timewhait);
    }

    // Escolhe Pix e confere a marca de seleção (`selection-filled`) DENTRO da opção Pix. Devolve o
    // total que o botão de pagamento mostra (o valor só existe no rótulo dele).
    async selecionarPix(): Promise<number | null> {
        const pix = await $(seletorTestId('select-wake-method-pix'));
        await pix.click();

        const marcado = await driver
            .waitUntil(async () => {
                const marca = await $(seletorTestId('selection-filled'));
                if (!(await marca.isDisplayed().catch(() => false))) return false;
                const { y: yMarca } = await marca.getLocation();
                const { y: yPix } = await pix.getLocation();
                const { height } = await pix.getSize();
                return yMarca >= yPix && yMarca <= yPix + height;
            }, { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!marcado) {
            throw new Error('Pagamento: a marca de seleção (selection-filled) não apareceu na opção Pix.');
        }

        const botao = await $(seletorTestId('payment-submit-button'));
        // O valor vem no rótulo do botão: content-desc no Android, label no iOS (captura 42:
        // "Prosseguir com a compra • R$ 1.349,82").
        const rotulo = `${await botao.getAttribute(IOS ? 'label' : 'content-desc')} ${await botao.getText().catch(() => '')}`;
        const total = valorEmReais(rotulo);
        console.log(`💠 Pix selecionado; total no botão de pagamento: ${total ?? 'não lido'}`);
        await anexarPrint(`Pagamento — Pix selecionado (botão: R$ ${total ?? 'não lido'})`);
        return total;
    }

    async prosseguirParaResumo() {
        await (await $(seletorTestId('payment-submit-button'))).click();
        const resumo = await $(seletorTestId('summary-finalize-purchase')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!resumo) {
            throw new Error('Pagamento: o resumo do pedido (summary-finalize-purchase) não abriu em 30s.');
        }
        console.log('🧾 Resumo do pedido aberto');
        await driver.pause(timewhait);
    }

    // Os 4 valores do resumo (Produtos, Entrega, Descontos, Valor total) são TextViews SEM id
    // (pedido de id no ELEMENTOS-SEM-TESTID.md, seção 00), na ordem da tela. São os TextViews cujo
    // conteúdo é SÓ um valor em reais — o "1x de R$ ... no Pix" do card de pagamento e o rótulo do
    // botão finalizar têm outras palavras e ficam de fora. Rodada 2 (12b): exatamente 4.
    //
    // O "Valor total" fica por trás do botão fixo de finalizar e, sem rolar, o Appium não o devolve
    // (3º run do Marcio, 2026-10-14 19:50: só 3 valores; árvore 12c da rodada 2 sem o total). Por
    // isso o resumo é rolado até o fim (até 3 vezes) e os valores são lidos de novo a cada rolagem.
    //
    // iOS: os 4 valores são StaticText SEM id e já estão na árvore sem rolar (o "Valor total" vem
    // com visible=false atrás do botão, mas o label é lido igual). Cada valor aparece em 2 nós
    // aninhados com o mesmo y (accessible false/true), por isso a leitura agrupa pelo y. Conferido
    // com lxml nas capturas 43 e 44 (Pix) e 44 (cartão): 4 valores, na ordem da tela. Verificado
    // só nas árvores, não numa sessão.
    async lerValoresDoResumo(): Promise<ValoresResumo> {
        if (IOS) return this.lerValoresDoResumoIOS();
        const { width, height } = await driver.getWindowRect();
        let valores: number[] = [];
        for (let rolagem = 0; rolagem <= 3; rolagem++) {
            valores = await this.valoresEmReaisNaTela();
            if (valores.length >= 4 || rolagem === 3) break;
            await driver.execute('mobile: scrollGesture', {
                left: Math.round(width * 0.1),
                top: Math.round(height * 0.15),
                width: Math.round(width * 0.8),
                height: Math.round(height * 0.6),
                direction: 'down',
                percent: 0.9,
            });
            await driver.pause(1000);
        }
        if (valores.length !== 4) {
            throw new Error(
                `Resumo: esperados 4 valores (produtos, entrega, descontos, total), encontrados ${valores.length}: ${valores.join(' | ')}.`
            );
        }
        await anexarPrint('Resumo do pedido');
        const [produtos, entrega, descontos, total] = valores.map(Math.abs);
        console.log(`🧾 Resumo: produtos ${produtos} | entrega ${entrega} | descontos ${descontos} | total ${total}`);
        return { produtos, entrega, descontos, total };
    }

    private async lerValoresDoResumoIOS(): Promise<ValoresResumo> {
        const porY = new Map<number, number>();
        for (const el of await $$('-ios predicate string:type == "XCUIElementTypeStaticText" AND label BEGINSWITH "R$"')) {
            const texto = ((await el.getAttribute('label').catch(() => '')) ?? '').trim();
            if (!/^-?\s*R\$\s*-?\s*[\d.]+,\d{2}$/.test(texto)) continue;
            const { y } = await el.getLocation();
            porY.set(Math.round(y), valorEmReais(texto)!);
        }
        const valores = [...porY.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
        if (valores.length !== 4) {
            throw new Error(
                `Resumo (iOS): esperados 4 valores (produtos, entrega, descontos, total), encontrados ${valores.length}: ${valores.join(' | ')}.`
            );
        }
        await anexarPrint('Resumo do pedido');
        const [produtos, entrega, descontos, total] = valores.map(Math.abs);
        console.log(`🧾 Resumo: produtos ${produtos} | entrega ${entrega} | descontos ${descontos} | total ${total}`);
        return { produtos, entrega, descontos, total };
    }

    private async valoresEmReaisNaTela(): Promise<number[]> {
        const valores: number[] = [];
        for (const el of await $$('//android.widget.TextView[contains(@text,"R$")]')) {
            const texto = (await el.getText().catch(() => '')).trim();
            if (/^-?\s*R\$\s*-?\s*[\d.]+,\d{2}$/.test(texto)) valores.push(valorEmReais(texto)!);
        }
        return valores;
    }

    // Toca em finalizar UMA vez e espera a tela do Pix. NUNCA repete o toque: cada toque que passa
    // cria pedido real. Antes do toque, o UiAutomator2 deixa de esperar a tela "parar": a tela do
    // Pix tem um cronômetro que muda a cada segundo, e com a espera padrão nenhum comando
    // responde ali (rodada 2: "could not get idle state"). Vale até o fim da sessão — a Home com
    // o alerta do pedido também tem cronômetro (`wake-order-banner-countdown`).
    // iOS: o ajuste é do UiAutomator2 e não é feito (no iOS a tela do Pix respondeu às capturas
    // 45–50 sem ajuste nenhum).
    async finalizarPedido() {
        if (!IOS) await driver.updateSettings({ waitForIdleTimeout: 0 });
        await this.fechaBanner();

        const finalizar = await $(seletorTestId('summary-finalize-purchase'));
        await this.waitForElement(finalizar);
        await finalizar.click();
        console.log('🛒 Finalizar tocado (1 vez)');

        const pix = await $(seletorTestId('wake-pix-aguardando')).waitForDisplayed({ timeout: 60000 }).then(() => true).catch(() => false);
        if (!pix) {
            throw new Error(
                'Finalizar: a tela do pedido com Pix (wake-pix-aguardando) não abriu em 60s. O toque NÃO é repetido ' +
                '(cada toque cria pedido) — conferir no vídeo e em Meus pedidos se o pedido foi criado.'
            );
        }
        console.log('✅ Pedido criado: tela do Pix aberta');
    }

    // Esvazia a Mochila: abre pela aba e toca no remover (`wake-remove-item`) de cada produto até
    // não sobrar nenhum `wake-product-card-bag-*`. O remover tirou o item no build 500
    // (captures-2026-10-09-build500, 61-62); a Mochila vazia mostra o `status-alert-icon` (62).
    // Chamado no fim do teste e na limpeza depois de uma falha, para a conta não acumular produtos
    // entre execuções. Erro nomeado se sobrar produto.
    async esvaziarMochila() {
        const card = '-android uiautomator:new UiSelector().resourceIdMatches("wake-product-card-bag-.*")';
        const remover = seletorTestId('wake-remove-item');
        const vazia = seletorTestId('status-alert-icon');

        await this.fechaBanner();
        const aba = await $(seletorTestId('tab-bag'));
        await this.waitForElement(aba);
        await aba.click();

        const abriu = await this.algumVisivel([card, vazia], 30000);
        if (!abriu) {
            throw new Error('Esvaziar Mochila: a Mochila não abriu em 30s (nem produto nem o estado vazio na tela).');
        }

        for (let i = 0; i < 10; i++) {
            const antes = await $$(card).length;
            if (antes === 0) break;

            await this.fechaBanner();
            await (await $(remover)).click();
            const removeu = await driver
                .waitUntil(async () => (await $$(card).length) < antes, { timeout: 15000, interval: 500 })
                .then(() => true)
                .catch(() => false);
            if (!removeu) {
                throw new Error(`Esvaziar Mochila: o toque em remover (wake-remove-item) não tirou o produto em 15s (${antes} na Mochila).`);
            }
            console.log(`🗑 Produto removido da Mochila (restam ${antes - 1})`);
        }

        const sobrou = await $$(card).length;
        if (sobrou > 0) {
            throw new Error(`Esvaziar Mochila: ainda há ${sobrou} produto(s) depois de 10 remoções.`);
        }
        console.log('✅ Mochila vazia');
    }
}
