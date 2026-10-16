import { BasePage, timewhait, seletorTestId } from "./BasePage";
import { SELETOR_CARD_PRODUTO } from "./BuscaPage";
import { valorEmReais } from "./CheckoutPage";
import { driver, $, $$ } from '@wdio/globals'
import allure from '@wdio/allure-reporter';
import { anexarPrint } from "../utils/allure-helpers";

// PDP, sheet de tamanho e sheet de "produto adicionado". Seletores medidos em
// Android: .planning/drafts/app-migrado/android/captures-2026-10-14-compra-pix(-rodada2)/;
// iOS (build 349): .planning/drafts/app-migrado/ios/captures-2026-10-15-compra-pix/ e
// -compra-cartao/ (drafts 12, 13 e 14).

const IOS = process.env.PLATFORM === 'ios';

const SELETOR_TAMANHO = '-android uiautomator:new UiSelector().resourceIdMatches("size-option-.*")';

// Seta de voltar da PDP: SEM id, irmão logo depois do `image-header` (pedido de id no
// ELEMENTOS-SEM-TESTID.md, seção 00). Android: conferido em 1 nó em todas as PDPs capturadas e
// em nenhuma outra tela; tocado 2x na rodada 2, voltou nas duas. iOS: o mesmo irmão (Other 32x32
// em [16,78]); conferido com lxml: 1 nó nas PDPs 21, 26 e 32 e 0 nos resultados, listagem e
// Categorias; tocado nas capturas 27–29, voltou.
const SETA_VOLTAR_PDP = IOS
    ? '//*[@name="image-header"]/following-sibling::*[1]'
    : '//*[@resource-id="image-header"]/following-sibling::*[1][@clickable="true"]';

// ---- iOS: sheets da PDP FORA da árvore -----------------------------------------------------
// No iOS (build 349) o conteúdo dos dois bottom sheets da PDP não aparece no getPageSource():
// do sheet de tamanho só existe o casco (`bottom-sheet-close`, backdrop), sem os tamanhos nem o
// "Add to cart"; do sheet de "produto adicionado", sem o "Continue shopping" (drafts 13 e 14).
// Por isso, e SÓ aqui, o toque é por COORDENADA, guardada como FRAÇÃO da janela 402x874 pt e
// multiplicada pelo getWindowRect() do device — exceção autorizada pelo Marcio em 2026-10-15
// (REQUIREMENTS.md). Dívida com o time do app: testID nos tamanhos, no "Add to cart" e no
// "Continue shopping" (ELEMENTOS-SEM-TESTID-IOS.md).
//
// Tamanhos, da esquerda para a direita, na linha y=742 pt (draft 13): P 46, M 114, G 182,
// GG 250, XGG 318. Usados nas capturas: UN/1º (46), G (182) e XGG (318); M e GG são inferidos
// do print, não tocados. O XXG fica cortado à direita e não é tentado. O óculos tem só o UN, na
// posição do 1º.
const FRACOES_TAMANHO_IOS = [46, 114, 182, 250, 318].map((x) => x / 402);
const FRACAO_Y_TAMANHO_IOS = 742 / 874;
const FRACAO_ADICIONAR_IOS: [number, number] = [201 / 402, 816 / 874];
const FRACAO_CONTINUAR_COMPRANDO_IOS: [number, number] = [201 / 402, 753 / 874];
// O `bottom-sheet-close` existe nos dois sheets; a posição diz qual está aberto: y=498 pt no de
// tamanho (capturas 22, 24, 33) e y=87 pt no de "produto adicionado" (25, 35).
const LIMITE_Y_SHEET_ADICIONADO_IOS = 0.3;
// Contador de itens da Mochila no cabeçalho da PDP: `label` do `action-icon-button` (vazio sem
// item, "1", "2"; capturas 21, 25, 26, 35). Muda logo depois do "Add to cart" (25 e 35).
const CONTADOR_SACOLA_IOS = seletorTestId('action-icon-button');

export class ProdutoPage extends BasePage {

    // Abre o 1º produto da lista na tela (resultado da busca ou listagem de categoria) e espera a
    // PDP. Nenhum nome de produto fixo: o catálogo muda (REQUIREMENTS.md).
    async abrirPrimeiroProduto() {
        await this.fechaBanner();
        const card = await $(SELETOR_CARD_PRODUTO);
        await this.waitForElement(card);
        const id = await card.getAttribute(IOS ? 'name' : 'resource-id');
        await card.click();

        const abriu = await $(seletorTestId('pdp-buy-button')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!abriu) {
            throw new Error(`PDP não abriu: depois de tocar em ${id}, o pdp-buy-button não apareceu em 30s.`);
        }
        console.log(`🛍 PDP aberta (${id})`);
        await driver.pause(timewhait);
    }

    // Comprar: abre o sheet de tamanho, escolhe o 1º tamanho disponível e adiciona à Mochila.
    // - O `size-button` (adicionar) fica enabled=false até escolher um tamanho, inclusive o UN do
    //   óculos (rodada 2, capturas 05b e 07e).
    // - Com o sheet aberto, cada `size-option-*` pode existir 2x (na PDP e no sheet); os do sheet
    //   são os da linha MAIS BAIXA da tela (y=2014 nas capturas), e é ali que o toque vale.
    // - Sucesso = sheet de "produto adicionado" (`bag-continue-shopping`). Na rodada 1 o 1º toque
    //   no adicionar não reagiu, por isso até 2 toques, só se o botão continuar na tela.
    async comprar() {
        if (IOS) return this.comprarIOS();
        await this.fechaBanner();
        const comprar = await $(seletorTestId('pdp-buy-button'));
        await this.waitForElement(comprar);
        await comprar.click();

        const adicionar = seletorTestId('size-button');
        const sheet = await $(adicionar).waitForDisplayed({ timeout: 15000 }).then(() => true).catch(() => false);
        if (!sheet) {
            throw new Error('Comprar: o sheet de tamanho (size-button) não abriu em 15s depois de tocar no pdp-buy-button.');
        }

        const tamanho = await this.escolherTamanho(adicionar);

        for (let tentativa = 1; tentativa <= 2; tentativa++) {
            await (await $(adicionar)).click();
            const adicionado = await $(seletorTestId('bag-continue-shopping'))
                .waitForDisplayed({ timeout: 20000 })
                .then(() => true)
                .catch(() => false);
            if (adicionado) {
                console.log(`✅ Produto adicionado à Mochila (tamanho ${tamanho})`);
                await driver.pause(timewhait);
                return;
            }
            if (!(await $(adicionar).isDisplayed().catch(() => false))) break;
            console.log(`⚠ Toque ${tentativa}/2 em adicionar não abriu o sheet de produto adicionado`);
        }

        throw new Error('Comprar: o sheet de "produto adicionado" (bag-continue-shopping) não apareceu depois de tocar em adicionar.');
    }

    // Escolhe o 1º tamanho que HABILITA o botão de adicionar. No 2º run do Marcio (2026-10-14
    // 19:13) o toque no P da camisa deixou o size-button desabilitado por 10s; o vídeo não cobre o
    // momento. Hipótese (não provada): tamanho sem estoque não fica selecionável. Por isso os
    // tamanhos do sheet são tentados em ordem — escolher tamanho não cria nada. Os do sheet são os
    // da linha MAIS BAIXA da tela (cada size-option-* pode existir também na PDP, por trás).
    // Lê o PREÇO do produto na PDP, antes do clique em comprar, e devolve o número. O valor é lido
    // da tela a CADA execução (nunca fixo no código): o nó é o `price`, único na PDP (capturas de
    // 2026-10-14). O spec guarda o valor numa variável por produto e, no resumo do pedido, valida
    // a soma — a base para calcular cupom/desconto quando o teste aplicar um.
    async lerPrecoDoProduto(): Promise<number> {
        const el = await $(seletorTestId('price'));
        await this.waitForElement(el);
        const texto = await el.getText();
        const preco = valorEmReais(texto);
        if (preco === null) {
            throw new Error(`PDP: o preço (price) não pôde ser lido como valor em reais ("${texto}").`);
        }
        console.log(`💲 Preço na PDP: R$ ${preco}`);
        await anexarPrint(`PDP — preço R$ ${preco}`);
        return preco;
    }

    private async escolherTamanho(adicionar: string): Promise<string> {
        const opcoes = [];
        for (const el of await $$(SELETOR_TAMANHO)) {
            if (!(await el.isDisplayed().catch(() => false))) continue;
            const { y } = await el.getLocation();
            opcoes.push({ y, id: (await el.getAttribute('resource-id')) ?? '' });
        }
        if (opcoes.length === 0) {
            throw new Error('Comprar: nenhum tamanho (size-option-*) visível no sheet.');
        }
        const linhaDoSheet = Math.max(...opcoes.map((o) => o.y));
        const doSheet = opcoes.filter((o) => o.y === linhaDoSheet);

        const tentados: string[] = [];
        for (const opcao of doSheet) {
            const tamanho = opcao.id.replace('size-option-', '');
            tentados.push(tamanho);
            // Reencontra pelo id e pela linha: a referência antiga pode ficar obsoleta depois de um toque.
            for (const el of await $$(seletorTestId(opcao.id))) {
                if ((await el.getLocation()).y === linhaDoSheet) {
                    await el.click();
                    break;
                }
            }
            const habilitou = await driver
                .waitUntil(async () => (await $(adicionar).isEnabled().catch(() => false)), { timeout: 4000, interval: 500 })
                .then(() => true)
                .catch(() => false);
            if (habilitou) {
                console.log(`📏 Tamanho escolhido: ${tamanho}${tentados.length > 1 ? ` (antes, sem habilitar: ${tentados.slice(0, -1).join(', ')})` : ''}`);
                return tamanho;
            }
            console.log(`⚠ Tamanho ${tamanho} não habilitou o botão de adicionar — tentando o próximo`);
        }

        allure.addAttachment('Sheet de tamanho', Buffer.from(await driver.takeScreenshot(), 'base64'), 'image/png');
        throw new Error(
            `Comprar: nenhum tamanho habilitou o botão de adicionar (size-button). Tentados: ${tentados.join(', ')}.`
        );
    }

    // Carrossel de indicação no sheet de "produto adicionado": os cards são `product-card-<id>`
    // (o container não tem id). Valida que há produtos e que o scroll lateral traz OUTROS
    // (comparação pelos ids; rodada 2: 168159/168141/168136 -> 168136/169024/169026).
    async validarCarrosselDeIndicacao() {
        // iOS: SEM VALIDAÇÃO por ora (Marcio, 2026-10-15). O carrossel "Also take" do sheet de
        // "produto adicionado" fica FORA da árvore no iOS (draft 14: só o casco do sheet aparece no
        // getPageSource), então não há card nem id para comparar antes e depois do scroll lateral.
        // Opções levantadas e não adotadas: comparar prints da área do carrossel antes/depois
        // (prova o scroll, não os produtos) ou o dev expor os filhos do sheet (testID nos cards, ou
        // o container do bottom sheet não acessível). Até lá o passo só registra a falta.
        if (IOS) {
            console.log('ℹ Carrossel de indicação NÃO validado no iOS: o conteúdo do sheet não aparece na árvore');
            return;
        }

        const antes = await this.idsDosCardsVisiveis();
        if (antes.length === 0) {
            throw new Error('Carrossel de indicação: nenhum produto (product-card-*) no sheet de produto adicionado.');
        }
        console.log(`🎠 Carrossel antes do scroll: ${antes.join(', ')}`);

        const primeiro = await $(SELETOR_CARD_PRODUTO);
        const { y } = await primeiro.getLocation();
        const { height } = await primeiro.getSize();
        const { width } = await driver.getWindowRect();
        await driver.execute('mobile: swipeGesture', {
            left: Math.round(width * 0.1),
            top: Math.round(y + height * 0.25),
            width: Math.round(width * 0.8),
            height: Math.round(height * 0.5),
            direction: 'left',
            percent: 0.75,
        });
        await driver.pause(1500);

        const depois = await this.idsDosCardsVisiveis();
        const novos = depois.filter((id) => !antes.includes(id));
        console.log(`🎠 Carrossel depois do scroll: ${depois.join(', ')}`);
        if (novos.length === 0) {
            throw new Error(
                `Carrossel de indicação: o scroll lateral não trouxe outros produtos (antes: ${antes.join(', ')}; ` +
                `depois: ${depois.join(', ')}).`
            );
        }
        console.log(`✅ Scroll lateral trouxe outros produtos: ${novos.join(', ')}`);
    }

    private async idsDosCardsVisiveis(): Promise<string[]> {
        const ids: string[] = [];
        for (const el of await $$(SELETOR_CARD_PRODUTO)) {
            if (await el.isDisplayed().catch(() => false)) ids.push((await el.getAttribute('resource-id')) ?? '');
        }
        return ids;
    }

    async continuarComprando() {
        if (IOS) return this.continuarComprandoIOS();
        const botao = await $(seletorTestId('bag-continue-shopping'));
        await this.waitForElement(botao);
        await botao.click();
        const fechou = await driver
            .waitUntil(async () => !(await $(seletorTestId('bag-continue-shopping')).isDisplayed().catch(() => false)), {
                timeout: 10000,
                interval: 500,
            })
            .then(() => true)
            .catch(() => false);
        if (!fechou) {
            throw new Error('Continuar comprando: o sheet de produto adicionado não fechou em 10s.');
        }
        console.log('↩ Continuar comprando');
        await driver.pause(timewhait);
    }

    // ---- iOS: comprar e continuar comprando (sheets fora da árvore; ver o bloco no topo) -------

    // Contador da Mochila lido antes do "Buy": o "Add to cart" só vale se ele subir 1.
    private contadorAntesIOS = 0;

    // Buy -> sheet de tamanho -> tamanho e "Add to cart" por fração. O tamanho disponível varia
    // por produto e estoque (camisa: G no Pix, XGG no cartão; draft 13), e a árvore não diz qual
    // está ativo nem se um foi escolhido. Por isso os tamanhos são tentados da esquerda para a
    // direita, cada um seguido do "Add to cart", e quem decide é o efeito: o sheet de "produto
    // adicionado" abrir e o contador da Mochila subir 1. Com tamanho indisponível o "Add to cart"
    // fica cinza (print 23) e o toque não deveria fazer nada (não verificado: os tamanhos
    // indisponíveis não foram tocados nas capturas). Se o sheet de tamanho fechar sem abrir o de
    // "produto adicionado", o teste para com print, em vez de seguir tocando às cegas.
    private async comprarIOS() {
        await this.fechaBanner();
        this.contadorAntesIOS = await this.contadorSacolaIOS();
        const comprar = await $(seletorTestId('pdp-buy-button'));
        await this.waitForElement(comprar);
        await comprar.click();

        const abriu = await driver
            .waitUntil(async () => (await this.sheetAbertoIOS()) === 'tamanho', { timeout: 15000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!abriu) {
            throw new Error('Comprar (iOS): o sheet de tamanho não abriu em 15s depois de tocar no pdp-buy-button.');
        }
        await driver.pause(1500); // o sheet ainda está subindo

        for (let i = 0; i < FRACOES_TAMANHO_IOS.length; i++) {
            const tamanho = `${i + 1}º tamanho da esquerda`;
            await this.tapProporcional(FRACOES_TAMANHO_IOS[i], FRACAO_Y_TAMANHO_IOS, tamanho);
            await driver.pause(800);
            await this.tapProporcional(...FRACAO_ADICIONAR_IOS, '"Add to cart"');

            const adicionou = await driver
                .waitUntil(async () => (await this.sheetAbertoIOS()) === 'adicionado', { timeout: 8000, interval: 500 })
                .then(() => true)
                .catch(() => false);
            if (adicionou) {
                const depois = await this.contadorSacolaIOS();
                if (depois !== this.contadorAntesIOS + 1) {
                    throw new Error(
                        `Comprar (iOS): o sheet de produto adicionado abriu, mas o contador da Mochila foi de ` +
                        `${this.contadorAntesIOS} para ${depois} (esperado +1).`
                    );
                }
                console.log(`✅ Produto adicionado à Mochila (${tamanho}; Mochila com ${depois})`);
                await anexarPrint(`Produto adicionado à Mochila (${tamanho})`);
                await driver.pause(timewhait);
                return;
            }
            if ((await this.sheetAbertoIOS()) !== 'tamanho') {
                await anexarPrint('Comprar (iOS) — tela depois do toque no tamanho');
                throw new Error(
                    `Comprar (iOS): depois do toque no ${tamanho} e no "Add to cart", o sheet de tamanho fechou sem ` +
                    'abrir o de produto adicionado. Print anexado.'
                );
            }
            console.log(`⚠ ${tamanho} não adicionou (indisponível?) — tentando o próximo`);
        }

        await anexarPrint('Sheet de tamanho');
        throw new Error(
            `Comprar (iOS): nenhum dos ${FRACOES_TAMANHO_IOS.length} tamanhos tocados adicionou o produto ` +
            '(o sheet de produto adicionado não abriu). Print do sheet anexado.'
        );
    }

    // "Continue shopping" por fração; sucesso = os sheets fecham e a PDP volta (captura 26).
    private async continuarComprandoIOS() {
        if ((await this.sheetAbertoIOS()) !== 'adicionado') {
            throw new Error('Continuar comprando (iOS): o sheet de produto adicionado não está aberto.');
        }
        await this.tapProporcional(...FRACAO_CONTINUAR_COMPRANDO_IOS, '"Continue shopping"');

        const fechou = await driver
            .waitUntil(async () => (await this.sheetAbertoIOS()) === null, { timeout: 10000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!fechou) {
            throw new Error('Continuar comprando (iOS): o sheet de produto adicionado não fechou em 10s.');
        }
        if (!(await $(seletorTestId('pdp-buy-button')).isDisplayed().catch(() => false))) {
            throw new Error('Continuar comprando (iOS): o sheet fechou, mas a PDP (pdp-buy-button) não está na tela.');
        }
        console.log('↩ Continuar comprando');
        await driver.pause(timewhait);
    }

    // Qual sheet está aberto, pela posição do `bottom-sheet-close` (ver o topo do arquivo).
    private async sheetAbertoIOS(): Promise<'tamanho' | 'adicionado' | null> {
        const fechar = await $(seletorTestId('bottom-sheet-close'));
        if (!(await fechar.isExisting().catch(() => false))) return null;
        const { y } = await fechar.getLocation();
        const { height } = await driver.getWindowRect();
        return y < height * LIMITE_Y_SHEET_ADICIONADO_IOS ? 'adicionado' : 'tamanho';
    }

    private async contadorSacolaIOS(): Promise<number> {
        const label = await $(CONTADOR_SACOLA_IOS).getAttribute('label').catch(() => null);
        const n = parseInt(label ?? '', 10);
        return Number.isNaN(n) ? 0 : n;
    }

    // Volta tela a tela até Categorias: na PDP pela seta (sem id, XPath acima); nas outras telas
    // (resultado da busca, listagem) pelo `header-back-button`. Categorias = `category-button` +
    // `tab-categories` na tela. Rodada 2: PDP -> resultados -> busca -> Categorias (3 toques) e
    // PDP -> listagem -> Categorias (2 toques). Limite de 6 toques, com erro nomeado.
    async voltarAteCategorias() {
        for (let toque = 0; toque <= 6; toque++) {
            if (await this.estaEmCategorias()) {
                console.log(`↩ Categorias alcançada com ${toque} toque(s) em voltar`);
                await driver.pause(timewhait);
                return;
            }
            if (toque === 6) break;

            await this.fechaBanner();
            const naPdp = await $(SETA_VOLTAR_PDP).isDisplayed().catch(() => false);
            const seletor = naPdp ? SETA_VOLTAR_PDP : seletorTestId('header-back-button');
            const botao = await $(seletor);
            if (!(await botao.isDisplayed().catch(() => false))) {
                throw new Error('Voltar até Categorias: a tela atual não tem seta de voltar (nem a da PDP nem o header-back-button).');
            }
            await botao.click();
            console.log(`↩ voltar (${naPdp ? 'seta da PDP' : 'header-back-button'})`);
            await driver.pause(2500);
        }

        throw new Error('Voltar até Categorias: 6 toques em voltar e a tela de Categorias (category-button + tab-categories) não apareceu.');
    }

    private async estaEmCategorias(): Promise<boolean> {
        const aba = await $(seletorTestId('tab-categories')).isDisplayed().catch(() => false);
        const categoria = await $(seletorTestId('category-button')).isDisplayed().catch(() => false);
        return aba && categoria;
    }
}
