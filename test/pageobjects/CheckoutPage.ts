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

// Linha do desconto do Pix no Pagamento ("<percentual>% off · R$ <valor>").
export type LinhaPix = { percentual: number; valor: number };

// Dados do cartão no formulário "Novo cartão". `mes` e `ano` com 2 dígitos (cap. 52: 12 e 30).
export type DadosCartao = { numero: string; titular: string; mes: string; ano: string; cvv: string; cpf: string };

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

    // Linha do desconto do Pix na tela de Pagamento: "<N>% off · R$ <valor>[ estimated]". O percentual
    // vem do cálculo da Wake e MUDA ao escolher o Pix (Marcio, 2026-10-20). Android 1.22.1/511 e
    // 1.22.2/512 (captures-2026-10-20-build511/47–48, captures-2026-10-20-android16/45 e 49b):
    //  - antes de escolher: `payment-wake-pix-discount-preview`, "10% off · R$ 809,91 estimated";
    //  - Pix escolhido:     `payment-wake-pix-discount`, "15% off · R$ 764,92" (= Resumo e botão).
    // iOS: os mesmos dois ids (draft ios/18, build 352); não conferido no 354.
    // Só os números são lidos (o teste não valida texto).
    private async lerLinhaDescontoPix(id: string): Promise<LinhaPix> {
        const linha = await $(seletorTestId(id));
        await linha.waitForDisplayed({ timeout: 15000 }).catch(() => {
            throw new Error(`Pagamento: a linha do desconto do Pix (${id}) não apareceu em 15 s.`);
        });
        const rotulo = IOS ? await linha.getAttribute('label') : await linha.getText();
        const pct = /(\d+(?:[.,]\d+)?)\s*%/.exec(rotulo ?? '');
        const valor = valorEmReais(rotulo ?? '');
        if (!pct || valor === null) {
            throw new Error(`Pagamento: percentual e valor do Pix não puderam ser lidos em ${id} ("${rotulo}").`);
        }
        return { percentual: Number(pct[1].replace(',', '.')), valor };
    }

    // ANTES de escolher o Pix: prévia do desconto (estimativa). Chamar antes do selecionarPix().
    async lerPreviaPix(): Promise<LinhaPix> {
        const previa = await this.lerLinhaDescontoPix('payment-wake-pix-discount-preview');
        console.log(`💠 Prévia do Pix (antes de escolher): ${previa.percentual}% · R$ ${previa.valor}`);
        await anexarPrint(`Pagamento — prévia do Pix (${previa.percentual}% · R$ ${previa.valor})`);
        return previa;
    }

    // DEPOIS de escolher o Pix: percentual e valor com desconto calculados pela Wake.
    async lerDescontoPix(): Promise<LinhaPix> {
        const pix = await this.lerLinhaDescontoPix('payment-wake-pix-discount');
        console.log(`💠 Pix escolhido: ${pix.percentual}% · R$ ${pix.valor}`);
        return pix;
    }

    async prosseguirParaResumo() {
        await (await $(seletorTestId('payment-submit-button'))).click();
        let resumo: boolean;
        if (IOS) {
            // iOS, build 1.21.7/352: no run de 2026-10-18 11:05 o Resumo não abriu em 30 s; na captura do
            // mesmo dia (captures-2026-10-18-pix-ate-pedido/, caps. 15-17) um toque abriu em ~1 s. Causa não
            // provada. Este botão NÃO cria pedido, então, se o Resumo não vier em 15 s e o botão continuar
            // na tela, há um 2º toque (ordem do Marcio, 2026-10-18).
            resumo = await $(seletorTestId('summary-finalize-purchase')).waitForDisplayed({ timeout: 15000 }).then(() => true).catch(() => false);
            if (!resumo && (await $(seletorTestId('payment-submit-button')).isDisplayed().catch(() => false))) {
                console.log('⚠ Resumo não abriu em 15 s com o 1º toque em payment-submit-button — tocando de novo');
                await (await $(seletorTestId('payment-submit-button'))).click();
            }
            if (!resumo) {
                resumo = await $(seletorTestId('summary-finalize-purchase')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
            }
            if (!resumo) await anexarPrint('Pagamento — Resumo não abriu');
        } else {
            resumo = await $(seletorTestId('summary-finalize-purchase')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        }
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

        const pix = await this.esperarDestinoDoFinalizar(['wake-pix-aguardando']);
        if (!pix) {
            throw new Error(
                'Finalizar: a tela do pedido com Pix (wake-pix-aguardando) não abriu em 60s. O toque NÃO é repetido ' +
                '(cada toque cria pedido) — conferir no vídeo e em Meus pedidos se o pedido foi criado.'
            );
        }
        console.log('✅ Pedido criado: tela do Pix aberta');
    }

    // Depois do toque em finalizar (Pix ou cartão), espera até 60 s por uma das telas de `destinos`.
    // No caminho:
    //  - modal antifraude ("Entendi" = `button-confirm`): é ACEITO sempre que aparecer (Marcio,
    //    2026-10-20). No CI Run #29 (iOS 1.22.2, iPhone 15) o modal veio no cartão, no lugar da tela de
    //    recusa que o Android 509+ mostra; no Android 1.21.6/506 ele vinha antes do Pedido Cancelado.
    //  - tela de erro do app ("Oops, we have a problem!", `error-id`/`error-name`, Android 508/512): falha
    //    na hora com o texto do erro. CI Run #29, S24+: "WakeOrderProcessing: Exception in HostFunction:
    //    __next_prime overflow". É bug do app, não do teste.
    // `modalBasta` (cartão): o modal antifraude aceito JÁ é o resultado esperado com o cartão fake, igual à
    // tela de recusa (Marcio, 2026-10-20) — devolve 'modal-antifraude' assim que o modal fecha, sem exigir
    // a tela seguinte. No Pix o modal é aceito e a espera continua até a tela do Pix.
    // Devolve o id do destino que apareceu, ou null no timeout.
    private async esperarDestinoDoFinalizar(destinos: string[], modalBasta = false): Promise<string | null> {
        let destino: string | null = null;
        let modaisAceitos = 0;
        const fim = Date.now() + 60000;
        while (Date.now() < fim) {
            for (const id of destinos) {
                if (await $(seletorTestId(id)).isDisplayed().catch(() => false)) { destino = id; break; }
            }
            if (destino) break;

            const entendi = await $(seletorTestId('button-confirm'));
            if (await entendi.isDisplayed().catch(() => false)) {
                await anexarPrint('Modal antifraude');
                await entendi.click();
                modaisAceitos++;
                console.log(`⚠ Modal antifraude aceito ("Entendi", button-confirm) — ${modaisAceitos}ª vez`);
                await driver
                    .waitUntil(async () => !(await $(seletorTestId('button-confirm')).isDisplayed().catch(() => false)), { timeout: 10000, interval: 500 })
                    .catch(() => undefined);
                await driver.pause(timewhait);
                if (modalBasta && !(await $(seletorTestId('button-confirm')).isDisplayed().catch(() => false))) {
                    return 'modal-antifraude';
                }
                continue;
            }

            if (await $(seletorTestId('error-id')).isDisplayed().catch(() => false)) {
                const nome = await $(seletorTestId('error-name')).getText().catch(() => '');
                const idErro = await $(seletorTestId('error-id')).getText().catch(() => '');
                await anexarPrint('Erro do app depois de finalizar');
                throw new Error(
                    `Finalizar: o app mostrou a tela de erro ("${nome}"; ${idErro}) em vez de ${destinos.join(' / ')}. ` +
                    'É erro do app (BUGS-APP-ANDROID.md). O toque NÃO é repetido — conferir em Meus pedidos se o pedido foi criado.'
                );
            }
            await driver.pause(1000);
        }
        return destino;
    }

    // ---- Pagamento com CARTÃO (spec 03-compra-cartao) ------------------------------------------
    // Android, build 1.21.6/506: captures-2026-10-15-compra-cartao/32 a 59 (NOTAS.md) e drafts
    // android/18, 19, 30, 31, 32 e 33.
    // iOS, build 1.21.7/352: captures-2026-10-16-build352-compra/ (caps. 56–75, até o Resumo) e drafts
    // ios/18 e 19; finalizar, modal antifraude e Pedido Cancelado só foram capturados no 1.21.6/349
    // (captures-2026-10-15-compra-cartao/, caps. 45–46, drafts ios/39 e 40). Os ids são os mesmos do
    // Android, exceto no formulário (ver preencherCartaoIOS).

    // No Android NENHUM método vem marcado (cap. 32: payment-submit-button enabled=false). Toca no
    // cartão, confere a marca `selection-filled` DENTRO da opção (cap. 33: [962,453] dentro de
    // [42,393][1038,533]) e o botão habilitado. Devolve o total do rótulo do botão (só o número).
    async selecionarCartao(): Promise<number | null> {
        const cartao = await $(seletorTestId('select-wake-method-cartao-de-credito'));
        await this.waitForElement(cartao);
        await this.fechaBanner();
        await cartao.click();

        const marcado = await driver
            .waitUntil(async () => {
                const marca = await $(seletorTestId('selection-filled'));
                if (!(await marca.isDisplayed().catch(() => false))) return false;
                const { y: yMarca } = await marca.getLocation();
                const { y: yCartao } = await cartao.getLocation();
                const { height } = await cartao.getSize();
                return yMarca >= yCartao && yMarca <= yCartao + height;
            }, { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!marcado) {
            throw new Error('Pagamento: a marca de seleção (selection-filled) não apareceu na opção cartão de crédito.');
        }

        const botao = await $(seletorTestId('payment-submit-button'));
        const habilitou = await driver
            .waitUntil(async () => botao.isEnabled().catch(() => false), { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!habilitou) {
            throw new Error('Pagamento: com o cartão marcado, o payment-submit-button não habilitou em 10s.');
        }
        // iOS: o total vem no label (cap. 58: "Prosseguir com a compra · R$ 716,80"), igual ao Pix.
        const total = valorEmReais(`${await botao.getAttribute(IOS ? 'label' : 'content-desc')} ${await botao.getText().catch(() => '')}`);
        console.log(`💳 Cartão selecionado; total no botão de pagamento: ${total ?? 'não lido'}`);
        await anexarPrint(`Pagamento — cartão selecionado (botão: R$ ${total ?? 'não lido'})`);
        return total;
    }

    // Pagamento -> formulário "Novo cartão" (cap. 34): `card-number-input` na tela e o Prosseguir
    // (`pressable`) DESABILITADO com o formulário vazio.
    // iOS: o único id do formulário é o `card-installments-input`, que existe com visible=false (abaixo
    // da dobra, cap. 59): a chegada é ele existir; `pressable` enabled=false igual.
    async prosseguirParaFormularioDoCartao() {
        await (await $(seletorTestId('payment-submit-button'))).click();
        const abriu = IOS
            ? await $(seletorTestId('card-installments-input')).waitForExist({ timeout: 30000 }).then(() => true).catch(() => false)
            : await $(seletorTestId('card-number-input')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!abriu) {
            throw new Error(`Pagamento: o formulário do cartão (${IOS ? 'card-installments-input' : 'card-number-input'}) não abriu em 30s.`);
        }
        if (await $(seletorTestId('pressable')).isEnabled().catch(() => false)) {
            throw new Error('Formulário do cartão abriu com o Prosseguir (pressable) HABILITADO: o formulário não está vazio.');
        }
        console.log('💳 Formulário do cartão aberto, vazio');
        await driver.pause(timewhait);
    }

    // Preenche os 6 campos por id (cap. 51–55). Número e CPF vão SÓ com dígitos: a máscara é do app
    // (`4693 5775 7175 8219`, `598.998.115-56`). Cada campo é conferido depois de digitado: dígitos
    // iguais nos campos numéricos, valor igual (sem caixa) no titular — é o dado digitado, não texto
    // do app. O teclado é fechado com ENTER (keycode 66), que na captura fechou o teclado numérico
    // sem sair da tela (cap. 37); BACK não é usado (poderia voltar de tela).
    async preencherCartao(cartao: DadosCartao) {
        if (IOS) return this.preencherCartaoIOS(cartao);
        const campos: Array<[string, string, string, boolean]> = [
            ['número', 'card-number-input', cartao.numero, true],
            ['titular', 'card-holder-input', cartao.titular, false],
            ['mês', 'card-expiry-month-input', cartao.mes, true],
            ['ano', 'card-expiry-year-input', cartao.ano, true],
            ['CVV', 'card-cvv-input', cartao.cvv, true],
            ['CPF', 'card-cpf-input', cartao.cpf, true],
        ];
        const soDigitos = (v: string) => v.replace(/\D/g, '');

        for (const [nome, id, valor, numerico] of campos) {
            const campo = await $(seletorTestId(id));
            await this.waitForElement(campo);
            await campo.click();
            await campo.clearValue();
            await campo.addValue(numerico ? soDigitos(valor) : valor);
            await driver.pause(500);
            if (await driver.isKeyboardShown().catch(() => false)) {
                await driver.pressKeyCode(66);
                await driver.pause(500);
            }

            const lido = ((await $(seletorTestId(id)).getText().catch(() => '')) ?? '').trim();
            const confere = numerico
                ? soDigitos(lido) === soDigitos(valor)
                : lido.toUpperCase() === valor.toUpperCase();
            if (!confere) {
                throw new Error(`Formulário do cartão: o campo ${nome} (${id}) ficou "${lido}" depois de digitar "${valor}".`);
            }
            console.log(`⌨ Cartão — ${nome}: ok`);
        }
        await anexarPrint('Formulário do cartão preenchido');
    }

    // Parcelamento à vista: `card-installments-input` abre o sheet (cap. 47); as 7 opções NÃO têm id
    // e a 1ª é o 1x. Seletor estrutural, sem texto: 1º clicável dentro do ScrollView irmão do
    // `bottom-sheet-close` (conferido com lxml no dump 47: 7 clicáveis, o 1º é o 1x [84,722][996,867];
    // 0 nos dumps sem o sheet). O campo fica ABAIXO do Prosseguir fixo (cap. 34: [42,2231][1038,2135]),
    // então a página é rolada até ele ficar acima do botão. Escolha confirmada pelo sheet fechando e
    // pelo Prosseguir HABILITADO (cap. 48). Devolve o valor da parcela (número do content-desc do campo).
    async escolherParcelaAVista(): Promise<number | null> {
        if (IOS) return this.escolherParcelaAVistaIOS();
        const parcelas = seletorTestId('card-installments-input');
        await this.rolarAteAcimaDoProsseguir(parcelas);
        await (await $(parcelas)).click();

        const opcao1x = '(//*[@resource-id="bottom-sheet-close"]/following-sibling::android.widget.ScrollView[1]//*[@clickable="true"])[1]';
        const abriu = await $(opcao1x).waitForDisplayed({ timeout: 15000 }).then(() => true).catch(() => false);
        if (!abriu) {
            throw new Error('Parcelamento: o sheet de parcelas não abriu (nenhuma opção visível em 15s depois de tocar em card-installments-input).');
        }
        await (await $(opcao1x)).click();

        const fechou = await driver
            .waitUntil(async () => !(await $(seletorTestId('bottom-sheet-close')).isDisplayed().catch(() => false)), { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!fechou) {
            throw new Error('Parcelamento: o sheet de parcelas não fechou 10s depois de tocar na 1ª opção.');
        }
        const habilitou = await driver
            .waitUntil(async () => $(seletorTestId('pressable')).isEnabled().catch(() => false), { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!habilitou) {
            throw new Error('Formulário do cartão: com os campos preenchidos e a parcela escolhida, o Prosseguir (pressable) não habilitou em 10s.');
        }
        const parcela = valorEmReais((await $(parcelas).getAttribute('content-desc').catch(() => '')) ?? '');
        console.log(`💳 Parcela à vista escolhida: R$ ${parcela ?? 'não lido'}`);
        await anexarPrint(`Formulário do cartão — 1x de R$ ${parcela ?? 'não lido'}`);
        return parcela;
    }

    // Prosseguir do formulário (`pressable`, único na tela) -> Resumo (`summary-finalize-purchase`, cap. 56).
    async prosseguirDoCartaoParaResumo() {
        const prosseguir = await $(seletorTestId('pressable'));
        await this.waitForElement(prosseguir);
        if (!(await prosseguir.isEnabled().catch(() => false))) {
            throw new Error('Formulário do cartão: o Prosseguir (pressable) está desabilitado.');
        }
        await prosseguir.click();
        const resumo = await $(seletorTestId('summary-finalize-purchase')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!resumo) {
            throw new Error('Formulário do cartão: o resumo do pedido (summary-finalize-purchase) não abriu em 30s.');
        }
        console.log('🧾 Resumo do pedido aberto');
        await driver.pause(timewhait);
    }

    // Finalizar com cartão: UM toque em `summary-finalize-purchase` e espera a tela de pagamento
    // recusado (`wake-order-processing-recusado`, "Não conseguimos aprovar o pagamento"). Build
    // 1.22.0/509 (Android, captures-2026-10-19-build509-run25/, caps. 44-01..18): a tela vem em ~11 s
    // e fica, sem modal antifraude. iOS 1.22.2 (CI Run #29, iPhone 15): veio o modal antifraude
    // ("Entendi", `button-confirm`): aceito, e o modal sozinho já é o resultado esperado (não se exige a
    // tela seguinte, que no iOS 1.22.2 NÃO foi capturada).
    // NUNCA repete o toque (cada toque cria pedido). Antes, o mesmo ajuste do finalizarPedido() do
    // Pix: o UiAutomator2 para de esperar a tela "parar", válido até o fim da sessão.
    // iOS: o ajuste é do UiAutomator2 e não é feito (igual ao finalizarPedido do Pix).
    async finalizarPedidoComCartao() {
        if (!IOS) await driver.updateSettings({ waitForIdleTimeout: 0 });
        await this.fechaBanner();

        const finalizar = await $(seletorTestId('summary-finalize-purchase'));
        await this.waitForElement(finalizar);
        await finalizar.click();
        console.log('🛒 Finalizar tocado (1 vez)');

        // Com o cartão fake, as DUAS condições são o resultado esperado, nas duas plataformas (Marcio,
        // 2026-10-20): a tela de recusa (Android 509+) OU o modal antifraude, aceito no "Entendi" (iOS
        // 1.22.2, CI Run #29). Também conta a tela do pedido cancelado/em processamento, se vier sem modal
        // (Android 506, iOS 349). Em todos os casos o pedido é validado em seguida em Meus pedidos.
        const destino = await this.esperarDestinoDoFinalizar([
            'wake-order-processing-recusado',
            'wake-order-processing-aguardando',
            'wake-order-processing-cancelado',
            'wake-order-processing-erro',
        ], true);
        if (!destino) {
            await anexarPrint('Finalizar (cartão) — sem recusa e sem modal antifraude');
            throw new Error(
                'Finalizar (cartão): nem a tela de pagamento recusado nem o modal antifraude (nem wake-order-processing-*) apareceram em 60s. ' +
                'O toque NÃO é repetido (cada toque cria pedido) — conferir no vídeo e em Meus pedidos se o pedido foi criado.'
            );
        }
        await anexarPrint(`Pedido com cartão — ${destino}`);
        console.log(`❌ Pagamento com cartão não aprovado (cartão fake, esperado): ${destino}`);
    }

    // ---- iOS do formulário do cartão (build 1.21.7/352, captures-2026-10-16-build352-compra/, caps. 59–75,
    // draft ios/19) ----
    // Campos SEM id e sem TextField: `Other` com name = placeholder, que some ao preencher (o mesmo tipo de
    // seletor do login iOS). O valor digitado não vai para o campo; a prova é a prévia do cartão, um `Other`
    // cujo name junta titular, número, CVV e validade ("TESTE AUTOMACAO 4693 5775 7175 8219 123 12/30";
    // vazia: "Nome impresso no cartão 0000 0000 0000 0000 0000 ??? 00/00"). Conferido com lxml nas caps.
    // 59–74: é o único Other cujo name termina em "dd/dd". O CPF não aparece na prévia: a prova dele é o
    // placeholder sumir (e, depois, o Prosseguir habilitar).
    // O teclado cobre os campos de baixo e o toque num campo atrás dele não foca (cap. 62: o "12" do Mês
    // foi parar no titular); por isso cada campo é rolado para cima do teclado antes do toque.
    // Digitação: o número perdeu dígitos com 120–170 ms por tecla (cap. 60) e saiu certo com 260 ms (65).
    // Aqui vai pelo digitarIOS (o mesmo do login) com maxTypingFrequency 3, que na busca deu o texto certo
    // 9 de 9 (captures-2026-10-18-busca-oculos/); no formulário do cartão o 3 NÃO foi medido, por isso cada
    // campo é conferido pela prévia e a falha diz o que ficou.
    private async preencherCartaoIOS(cartao: DadosCartao) {
        const soDigitos = (v: string) => v.replace(/\D/g, '');
        const campos: Array<[string, string, string, (previa: string) => boolean]> = [
            ['número', 'Digite o número do seu cartão', soDigitos(cartao.numero), (p) => soDigitos(p).includes(soDigitos(cartao.numero))],
            ['titular', 'Digite o nome do titular', cartao.titular, (p) => p.toUpperCase().startsWith(`${cartao.titular.toUpperCase()} `)],
            ['mês', 'Mês', cartao.mes, () => true],
            ['ano', 'Ano', cartao.ano, (p) => p.endsWith(` ${cartao.mes}/${cartao.ano}`)],
            ['CVV', 'Digite o cvv', cartao.cvv, (p) => p.endsWith(` ${cartao.cvv} ${cartao.mes}/${cartao.ano}`)],
            ['CPF', 'Digite o CPF do titular', soDigitos(cartao.cpf), () => true],
        ];

        for (const [nome, placeholder, valor, confere] of campos) {
            const seletor = `-ios predicate string:type == "XCUIElementTypeOther" AND name == "${placeholder}"`;
            await this.deixarAcimaDoTecladoIOS(seletor, `o campo ${nome}`);
            await this.digitarIOS(seletor, valor, `Cartão — ${nome}`, 3);

            const vazio = await $(seletor).isExisting().catch(() => false);
            const previa = await this.previaDoCartaoIOS();
            if (vazio || !confere(previa)) {
                await anexarPrint(`Formulário do cartão — ${nome} não conferiu`);
                throw new Error(
                    `Formulário do cartão (iOS): depois de digitar o ${nome}, ` +
                    (vazio ? `o campo continua vazio (placeholder "${placeholder}" na tela)` : `a prévia do cartão ficou "${previa}"`) + '.'
                );
            }
            console.log(`⌨ Cartão — ${nome}: ok`);
        }
        await anexarPrint('Formulário do cartão preenchido');
    }

    // Prévia do cartão no alto do formulário: o Other de name mais curto terminado em "dd/dd" (os
    // contêineres acima dele juntam o texto da tela inteira).
    private async previaDoCartaoIOS(): Promise<string> {
        const nomes: string[] = [];
        for (const el of await $$('-ios predicate string:type == "XCUIElementTypeOther" AND name MATCHES ".*[0-9]{2}/[0-9]{2}"')) {
            const nome = (await el.getAttribute('name').catch(() => '')) ?? '';
            if (nome) nomes.push(nome.trim());
        }
        if (!nomes.length) {
            throw new Error('Formulário do cartão (iOS): a prévia do cartão (Other terminado em "dd/dd") não está na árvore.');
        }
        return nomes.reduce((a, b) => (b.length < a.length ? b : a));
    }

    // Rola o formulário até o alvo ficar inteiro entre o cabeçalho e o teclado (sem teclado, o Prosseguir
    // fixo na base). O formulário começa em y=107 de 932 (cap. 59), daí o topo em 12% da janela. Até 4
    // rolagens com `mobile: swipe` (o mesmo gesto do PerfilPage); erro nomeado e print se não conseguir.
    private async deixarAcimaDoTecladoIOS(seletor: string, rotulo: string) {
        const { height } = await driver.getWindowRect();
        for (let i = 0; i <= 4; i++) {
            const alvo = await $(seletor);
            if (!(await alvo.waitForExist({ timeout: 10000 }).then(() => true).catch(() => false))) {
                throw new Error(`Formulário do cartão (iOS): ${rotulo} não está na árvore (${seletor}).`);
            }
            const { y } = await alvo.getLocation();
            const { height: h } = await alvo.getSize();
            const teclado = await $('-ios class chain:**/XCUIElementTypeKeyboard');
            const base = (await teclado.isExisting().catch(() => false))
                ? (await teclado.getLocation()).y
                : (await $(seletorTestId('pressable')).getLocation().catch(() => ({ y: height }))).y;
            const abaixo = y + h > base - 8;
            if (!abaixo && y >= height * 0.12) return;
            if (i === 4) break;
            await driver.execute('mobile: swipe', { direction: abaixo ? 'up' : 'down', velocity: 400 });
            await driver.pause(800);
        }
        await anexarPrint(`Formulário do cartão — ${rotulo} fora da área visível`);
        throw new Error(`Formulário do cartão (iOS): ${rotulo} não ficou entre o cabeçalho e o teclado depois de 4 rolagens.`);
    }

    // Parcelas no iOS, build 1.21.7/352: `card-installments-input` abre o sheet com o `bottom-sheet-close`.
    // As opções NÃO têm id e nem sempre estão na árvore:
    //   - captures-2026-10-16-build352-compra/ (430x932, caps. 71–74): Other de 55 pt com o label
    //     "Nx de R$ … sem juros", 1x em [32,285 366x55]; o predicate por "1x de" pegava o contêiner das 7
    //     (398x587), cujo centro cai na 4ª — por isso a opção é a de menor y abaixo do X e com < 100 pt;
    //   - captures-2026-10-18-parcelas/ (402x874, caps. 09–12): FORA da árvore (só backdrop, `Bottom Sheet`
    //     sem filhos e o X em y=236). O filtro antigo ("R$") pegava o `pressable` escondido atrás do sheet e
    //     o sheet não fechava (run 18/10 19:52). `mobile: tap` no centro da 1x (x=201, y=297) fechou o sheet
    //     com "1x de R$ 716,80 sem juros" (cap. 12).
    // Sem nó, a 1x é tocada por posição relativa ao X (o sheet fica preso ao topo: nas duas janelas o
    // centro da 1x está ~61 pt abaixo do y do X), no centro da largura. Exceção de coordenada do iOS
    // (REQUIREMENTS.md), dívida com o app: `card-installments-option-<n>` (ELEMENTOS-SEM-TESTID-IOS.md).
    // Prova da escolha: o sheet fecha, o Prosseguir habilita e o valor da parcela no
    // `card-installments-input` é igual ao total do Prosseguir (1x).
    // O campo fica atrás do teclado depois do CPF; com o teclado aberto, botão pede 2 toques (o 1º só
    // fecha o teclado: login e cadastro, draft ios/00 item 7), por isso há um 2º toque se o sheet não abrir.
    private async escolherParcelaAVistaIOS(): Promise<number | null> {
        const parcelas = seletorTestId('card-installments-input');
        const fechar = seletorTestId('bottom-sheet-close');
        for (let toque = 1; toque <= 2; toque++) {
            await this.deixarAcimaDoTecladoIOS(parcelas, 'o campo de parcelas');
            await (await $(parcelas)).click();
            const abriu = await $(fechar).waitForDisplayed({ timeout: toque === 1 ? 5000 : 15000 }).then(() => true).catch(() => false);
            if (abriu) break;
            if (toque === 2) {
                await anexarPrint('Parcelamento — sheet não abriu');
                throw new Error('Parcelamento (iOS): o sheet de parcelas (bottom-sheet-close) não abriu depois de 2 toques em card-installments-input.');
            }
            console.log('⚠ O 1º toque em card-installments-input não abriu o sheet — tocando de novo');
        }

        const { y: yFechar } = await (await $(fechar)).getLocation();
        let opcao: WebdriverIO.Element | null = null;
        let menorY = Infinity;
        for (const el of await $$('-ios predicate string:type == "XCUIElementTypeOther" AND label CONTAINS "x de R$" AND label CONTAINS "sem juros" AND name != "card-installments-input"')) {
            const { y } = await el.getLocation();
            const { height: h } = await el.getSize();
            if (y > yFechar && h < 100 && y < menorY) {
                menorY = y;
                opcao = el;
            }
        }
        if (opcao) {
            console.log(`💳 Opção 1x na árvore (y=${menorY}) — element click`);
            await opcao.click();
        } else {
            const { width } = await driver.getWindowRect();
            const ponto = { x: Math.round(width / 2), y: Math.round(yFechar + 61) };
            console.log(`💳 Opções de parcela fora da árvore — toque (W3C) na 1ª opção (${ponto.x}, ${ponto.y}), 61 pt abaixo do X`);
            await this.tocarPonto(ponto.x, ponto.y);
        }

        const fechou = await driver
            .waitUntil(async () => !(await $(fechar).isDisplayed().catch(() => false)), { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!fechou) {
            throw new Error('Parcelamento (iOS): o sheet de parcelas não fechou 10s depois de tocar na 1ª opção.');
        }
        const prosseguir = await $(seletorTestId('pressable'));
        const habilitou = await driver
            .waitUntil(async () => prosseguir.isEnabled().catch(() => false), { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!habilitou) {
            await anexarPrint('Formulário do cartão — Prosseguir desabilitado');
            throw new Error('Formulário do cartão (iOS): com os campos preenchidos e a parcela escolhida, o Prosseguir (pressable) não habilitou em 10s.');
        }
        const parcela = valorEmReais((await $(parcelas).getAttribute('label').catch(() => '')) ?? '');
        const total = valorEmReais((await prosseguir.getAttribute('label').catch(() => '')) ?? '');
        if (parcela === null || total === null || Math.abs(parcela - total) > 0.009) {
            throw new Error(`Parcelamento (iOS): a parcela escolhida (R$ ${parcela ?? 'não lida'}) não é à vista: o total do Prosseguir é R$ ${total ?? 'não lido'}.`);
        }
        console.log(`💳 Parcela à vista escolhida: R$ ${parcela}`);
        await anexarPrint(`Formulário do cartão — 1x de R$ ${parcela}`);
        return parcela;
    }

    // Rola o formulário (gesto na metade de cima, longe do botão fixo) até o alvo ficar inteiro ACIMA
    // do Prosseguir fixo na base. Até 4 rolagens; erro nomeado se não conseguir.
    private async rolarAteAcimaDoProsseguir(seletor: string) {
        const { width, height } = await driver.getWindowRect();
        for (let i = 0; i <= 4; i++) {
            const alvo = await $(seletor);
            const botao = await $(seletorTestId('pressable'));
            const visivel = await alvo.isDisplayed().catch(() => false);
            if (visivel) {
                const { y } = await alvo.getLocation();
                const { height: h } = await alvo.getSize();
                const { y: yBotao } = await botao.getLocation().catch(() => ({ y: height }));
                if (h > 0 && y + h <= yBotao) return;
            }
            if (i === 4) break;
            await driver.execute('mobile: scrollGesture', {
                left: Math.round(width * 0.1),
                top: Math.round(height * 0.2),
                width: Math.round(width * 0.8),
                height: Math.round(height * 0.5),
                direction: 'down',
                percent: 0.6,
            });
            await driver.pause(800);
        }
        throw new Error(`Formulário do cartão: ${seletor} não ficou acima do Prosseguir depois de 4 rolagens.`);
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
