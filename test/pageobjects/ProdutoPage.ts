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

// "Back to top" da listagem rolada: SEM id. Android (app 1.22.2/513, captures-2026-10-22-build513/
// 13, 15, 17, 19): o único clicável do irmão anterior ao bloco que contém o `product-list`; com a
// lista no topo o mesmo caminho dá o `header-back-button`, por isso ele é excluído. Conferido com
// lxml: 1 nó nas 4 listagens roladas, 0 nas demais telas; tocado 3x, a lista foi ao topo e o
// `header-back-button` voltou nas 3 (16, 18, 20). iOS: aparece no print do CI Run #33 (iPhone 13),
// mas a árvore nunca foi capturada; o label é INFERIDO (accessibilityLabel do RN), NÃO VERIFICADO.
const BACK_TO_TOP = IOS
    ? '-ios predicate string:label == "Back to top"'
    : '//*[.//*[@resource-id="product-list"]]/preceding-sibling::*/*[@clickable="true"][not(@resource-id="header-back-button")]';

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

    // Abre o card da POSIÇÃO `posicao` da listagem (0 = 1º), na ordem da tela (linha, depois
    // coluna), rolando a lista até ele aparecer inteiro. Cada device do CI compra um produto
    // diferente (`posicaoDoProduto()` em device-index.ts; CI Run #30, app 1.22.2: os 11 aparelhos
    // na mesma camisa esgotavam o estoque). A rolagem é arrasto W3C (`arrastar`), que responde nas
    // duas plataformas, inclusive no host iOS do Device Farm; cada rolagem tem que trazer card
    // novo, senão erro explícito. Rolagem da listagem de Camisas NÃO medida no iOS do CI.
    async abrirProdutoNaPosicao(posicao: number) {
        if (posicao === 0) return this.abrirPrimeiroProduto();
        await this.fechaBanner();
        await this.waitForElement(await $(SELETOR_CARD_PRODUTO));
        const atributo = IOS ? 'name' : 'resource-id';
        const { width, height } = await driver.getWindowRect();
        const vistos: string[] = [];

        for (let rolagem = 0; rolagem <= 12; rolagem++) {
            const visiveis: { id: string; x: number; y: number; h: number; el: WebdriverIO.Element }[] = [];
            for (const el of await $$(SELETOR_CARD_PRODUTO)) {
                if (!(await el.isDisplayed().catch(() => false))) continue;
                const id = await el.getAttribute(atributo).catch(() => null);
                if (!id || visiveis.some((v) => v.id === id)) continue;
                const r = await driver.getElementRect(el.elementId);
                visiveis.push({ id, x: r.x, y: r.y, h: r.height, el });
            }
            visiveis.sort((a, b) => (Math.abs(a.y - b.y) > 10 ? a.y - b.y : a.x - b.x));
            const novos = visiveis.filter((v) => !vistos.includes(v.id));
            if (rolagem > 0 && novos.length === 0 && vistos.length <= posicao) {
                await anexarPrint('Listagem — rolagem sem card novo');
                throw new Error(
                    `Produto da posição ${posicao}: a listagem não trouxe card novo depois da rolagem ` +
                    `${rolagem} (${vistos.length} cards vistos: ${vistos.join(', ')}).`
                );
            }
            for (const v of novos) vistos.push(v.id);

            if (vistos.length > posicao) {
                const alvo = visiveis.find((v) => v.id === vistos[posicao]);
                // Card cortado (embaixo, ou em cima por baixo do cabeçalho): rola um pouco e relê,
                // para o toque no centro cair nele.
                if (alvo && alvo.y >= height * 0.12 && alvo.y + alvo.h <= height * 0.92) {
                    await alvo.el.click();
                    const abriu = await $(seletorTestId('pdp-buy-button')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
                    if (!abriu) {
                        throw new Error(`PDP não abriu: depois de tocar em ${alvo.id} (posição ${posicao}), o pdp-buy-button não apareceu em 30s.`);
                    }
                    console.log(`🛍 PDP aberta (${alvo.id}, posição ${posicao} da listagem)`);
                    await driver.pause(timewhait);
                    return;
                }
                if (!alvo) {
                    await anexarPrint('Listagem — card da posição saiu da tela');
                    throw new Error(`Produto da posição ${posicao}: o card ${vistos[posicao]} saiu da tela antes do toque.`);
                }
                // Cortado em cima: rola para baixo; cortado embaixo: rola para cima.
                if (alvo.y < height * 0.12) await this.arrastar(width / 2, height * 0.45, width / 2, height * 0.7);
                else await this.arrastar(width / 2, height * 0.7, width / 2, height * 0.45);
            } else {
                await this.arrastar(width / 2, height * 0.8, width / 2, height * 0.3);
            }
            await driver.pause(1500);
        }
        await anexarPrint('Listagem — card da posição não alcançado');
        throw new Error(`Produto da posição ${posicao}: não alcançado em 12 rolagens (${vistos.length} cards vistos).`);
    }

    // Comprar: abre o sheet de tamanho, escolhe o 1º tamanho disponível e adiciona à Mochila.
    // - O `size-button` (adicionar) fica enabled=false até escolher um tamanho, inclusive o UN do
    //   óculos (rodada 2, capturas 05b e 07e).
    // - Com o sheet aberto, cada `size-option-*` pode existir 2x (na PDP e no sheet); os do sheet
    //   são os da linha MAIS BAIXA da tela (y=2014 nas capturas), e é ali que o toque vale.
    // - Sucesso = sheet de "produto adicionado" (`bag-continue-shopping`). Na rodada 1 o 1º toque
    //   no adicionar não reagiu, por isso até 2 toques, só se o botão continuar na tela.
    // - Tamanho que acaba entre a escolha e o toque em adicionar (build 1.21.7/507): o app avisa com
    //   um modal de estoque em vez do sheet — comportamento correto do app. Run de 2026-10-17 12:38:
    //   "Size sold out" no G da camisa, cuja última unidade estava reservada pelo pedido Pix pendente
    //   do run anterior. "Insufficient stock" (2ª unidade) é `alert-modal` + `alert-modal-confirm`,
    //   e o OK fecha o modal E o sheet (capturas 29-30 de captures-2026-10-17-sold-out-meus-pedidos/).
    //   O id do "Size sold out" não foi capturado; presume-se o mesmo `alert-modal` — NÃO VERIFICADO.
    //   Com o modal, o teste toca OK, reabre o sheet e tenta o próximo tamanho disponível.
    async comprar() {
        if (IOS) return this.comprarIOS();
        const adicionar = seletorTestId('size-button');
        const modalEstoque = seletorTestId('alert-modal');
        const recusados: string[] = [];

        while (true) {
            await this.fechaBanner();
            const comprar = await $(seletorTestId('pdp-buy-button'));
            await this.waitForElement(comprar);
            await comprar.click();

            const sheet = await $(adicionar).waitForDisplayed({ timeout: 15000 }).then(() => true).catch(() => false);
            if (!sheet) {
                throw new Error('Comprar: o sheet de tamanho (size-button) não abriu em 15s depois de tocar no pdp-buy-button.');
            }

            const tamanho = await this.escolherTamanho(adicionar, recusados);
            let recusado = false;

            for (let tentativa = 1; tentativa <= 2; tentativa++) {
                await (await $(adicionar)).click();
                // 45s: no build 507 o sheet chega ~30s depois do toque, com a PDP "parada" no meio
                // (bug 22 do BUGS-APP-ANDROID.md, run de 2026-10-17 01:33). Era 20s.
                let resultado: 'adicionado' | 'modal' | null = null;
                await driver
                    .waitUntil(async () => {
                        if (await $(seletorTestId('bag-continue-shopping')).isDisplayed().catch(() => false)) resultado = 'adicionado';
                        else if (await $(modalEstoque).isDisplayed().catch(() => false)) resultado = 'modal';
                        return resultado !== null;
                    }, { timeout: 45000, interval: 1000 })
                    .catch(() => undefined);
                if (resultado === 'adicionado') {
                    console.log(`✅ Produto adicionado à Mochila (tamanho ${tamanho})`);
                    await driver.pause(timewhait);
                    return;
                }
                if (resultado === 'modal') {
                    await anexarPrint(`Comprar — modal de estoque no tamanho ${tamanho}`);
                    console.log(`⚠ O app recusou o tamanho ${tamanho} (modal de estoque) — tocando OK e tentando outro tamanho`);
                    await (await $(seletorTestId('alert-modal-confirm'))).click();
                    const fechou = await driver
                        .waitUntil(async () => !(await $(modalEstoque).isDisplayed().catch(() => false)), { timeout: 10000, interval: 500 })
                        .then(() => true)
                        .catch(() => false);
                    if (!fechou) {
                        throw new Error(`Comprar: o modal de estoque (alert-modal) não fechou depois do OK (alert-modal-confirm), tamanho ${tamanho}.`);
                    }
                    recusados.push(tamanho);
                    recusado = true;
                    break;
                }
                if (!(await $(adicionar).isDisplayed().catch(() => false))) break;
                console.log(`⚠ Toque ${tentativa}/2 em adicionar não abriu o sheet de produto adicionado`);
            }

            if (!recusado) {
                throw new Error('Comprar: o sheet de "produto adicionado" (bag-continue-shopping) não apareceu depois de tocar em adicionar.');
            }
            // O OK volta à PDP sem sheet (captura 30); se o sheet ficou aberto, fecha antes de reabrir.
            if (await $(adicionar).isDisplayed().catch(() => false)) {
                await (await $(seletorTestId('bottom-sheet-close'))).click().catch(() => undefined);
                await driver.pause(timewhait);
            }
        }
    }

    // Escolhe o 1º tamanho DISPONÍVEL: o 1º que HABILITA o botão de adicionar. Tamanho sem estoque
    // aparece cinza com "+" e o toque nele não habilita o adicionar (build 1.21.7/507, capturas 20 e
    // 26 de captures-2026-10-17-sold-out-meus-pedidos/), mas no dump ele vem enabled=true como os
    // outros — por isso o critério é o efeito no botão. Os tamanhos do sheet são tentados em ordem
    // (escolher tamanho não cria nada). Os do sheet são os da linha MAIS BAIXA da tela (cada
    // size-option-* pode existir também na PDP, por trás).
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

    // `ignorar`: tamanhos que o app já recusou com o modal de estoque neste comprar().
    // A partir do build 1.21.7/507 os tamanhos sem estoque vêm cinza com "+" no print, mas com
    // enabled=true no dump (capturas 20 e 26 de captures-2026-10-17-sold-out-meus-pedidos/): só o
    // efeito no adicionar os distingue, que é o critério daqui.
    private async escolherTamanho(adicionar: string, ignorar: string[] = []): Promise<string> {
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
            if (ignorar.includes(tamanho)) continue;
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
            `Comprar: nenhum tamanho habilitou o botão de adicionar (size-button). Tentados: ${tentados.join(', ')}` +
            (ignorar.length ? `; recusados pelo app (modal de estoque): ${ignorar.join(', ')}.` : '.')
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

        // O banner do Insider pode abrir POR CIMA do sheet no meio do passo, depois da tentativa do
        // step() (CI Run #31, S25 Ultra, app 1.22.2: banner "polos 3POR2" cobriu o carrossel e o gesto
        // caiu nele; antes e depois, os mesmos 3 cards). Por isso o banner é fechado imediatamente antes
        // de cada gesto, e o gesto é refeito 1 vez se não trouxer card novo.
        const rolar = async () => {
            await this.fechaBanner();
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
        };

        await rolar();
        let depois = await this.idsDosCardsVisiveis();
        let novos = depois.filter((id) => !antes.includes(id));
        if (novos.length === 0) {
            console.log('⚠ Scroll lateral sem card novo — fechando o banner (se houver) e repetindo o gesto 1 vez');
            await rolar();
            depois = await this.idsDosCardsVisiveis();
            novos = depois.filter((id) => !antes.includes(id));
        }
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
    // Modal de ESTOQUE (CI Run #30, app 1.22.2: "Size sold out" em 4 iPhones, com os 11 devices na
    // mesma camisa): igual ao Android, toca OK, reabre o sheet e tenta o PRÓXIMO tamanho. Captura
    // iOS do build 1.21.7/352 (captures-2026-10-21-modal-estoque/, 17 e 18, "Insufficient stock" da
    // 2ª unidade): `alert-modal` e `alert-modal-confirm` existem (found+displayed com o modal, não
    // achados com a tela limpa); o sheet de tamanho JÁ FECHOU quando o modal aparece e o OK por
    // element click fecha só o modal, de volta à PDP. O "Size sold out" não foi capturado: presume-se
    // o mesmo `alert-modal` — NÃO VERIFICADO (como no Android).
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

        const modalEstoque = seletorTestId('alert-modal');
        const recusados: string[] = [];
        for (let i = 0; i < FRACOES_TAMANHO_IOS.length; i++) {
            const tamanho = `${i + 1}º tamanho da esquerda`;
            await this.tapProporcional(FRACOES_TAMANHO_IOS[i], FRACAO_Y_TAMANHO_IOS, tamanho);
            await driver.pause(800);
            await this.tapProporcional(...FRACAO_ADICIONAR_IOS, '"Add to cart"');

            let resultado: 'adicionado' | 'modal' | null = null;
            await driver
                .waitUntil(async () => {
                    if (await $(modalEstoque).isDisplayed().catch(() => false)) resultado = 'modal';
                    else if ((await this.sheetAbertoIOS()) === 'adicionado') resultado = 'adicionado';
                    return resultado !== null;
                }, { timeout: 8000, interval: 500 })
                .catch(() => undefined);
            const adicionou = resultado === 'adicionado';

            if (resultado === 'modal') {
                await anexarPrint(`Comprar (iOS) — modal de estoque no ${tamanho}`);
                console.log(`⚠ O app recusou o ${tamanho} (modal de estoque) — tocando OK e tentando o próximo tamanho`);
                await (await $(seletorTestId('alert-modal-confirm'))).click();
                const fechou = await driver
                    .waitUntil(async () => !(await $(modalEstoque).isDisplayed().catch(() => false)), { timeout: 10000, interval: 500 })
                    .then(() => true)
                    .catch(() => false);
                if (!fechou) {
                    throw new Error(`Comprar (iOS): o modal de estoque (alert-modal) não fechou depois do OK (alert-modal-confirm), ${tamanho}.`);
                }
                recusados.push(tamanho);
                if (i === FRACOES_TAMANHO_IOS.length - 1) break;
                // O OK volta à PDP sem sheet (captura 18): reabre o sheet para o próximo tamanho.
                if ((await this.sheetAbertoIOS()) !== 'tamanho') {
                    await (await $(seletorTestId('pdp-buy-button'))).click();
                    const reabriu = await driver
                        .waitUntil(async () => (await this.sheetAbertoIOS()) === 'tamanho', { timeout: 15000, interval: 500 })
                        .then(() => true)
                        .catch(() => false);
                    if (!reabriu) {
                        await anexarPrint('Comprar (iOS) — sheet não reabriu depois do modal de estoque');
                        throw new Error('Comprar (iOS): depois do OK no modal de estoque, o sheet de tamanho não reabriu em 15s.');
                    }
                    await driver.pause(1500);
                }
                continue;
            }
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
            '(o sheet de produto adicionado não abriu). Print do sheet anexado.' +
            (recusados.length ? ` Recusados pelo app (modal de estoque): ${recusados.join(', ')}.` : '')
        );
    }

    // Build 1.21.7/352: o sheet fica preso ao topo e a distância até o "Continue shopping" muda com a
    // largura da janela (402 pt: 666; 430: 687,5; 440: 694), então a fração errava (run 2026-10-18 12:47,
    // tocou ~36 pt abaixo em 440x956). Agora fecha pelo X (`bottom-sheet-close`, na árvore): element
    // click fechou o sheet e devolveu a PDP, com o contador mantido, em 3 de 3 (camisa G, M, G).
    // fonte: captures-2026-10-18-sheet-fechar-x/ (NOTAS.md). Sucesso = sheet fechado e PDP de volta.
    private async continuarComprandoIOS() {
        if ((await this.sheetAbertoIOS()) !== 'adicionado') {
            throw new Error('Continuar comprando (iOS): o sheet de produto adicionado não está aberto.');
        }
        await (await $(seletorTestId('bottom-sheet-close'))).click();
        console.log('👆 Sheet de produto adicionado: toque no X (bottom-sheet-close)');

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
            if (!naPdp) await this.mostrarCabecalhoDaListagem();
            const botao = await $(seletor);
            if (!(await botao.isDisplayed().catch(() => false))) {
                await anexarPrint('Voltar até Categorias — sem seta de voltar');
                throw new Error('Voltar até Categorias: a tela atual não tem seta de voltar (nem a da PDP nem o header-back-button).');
            }
            await botao.click();
            console.log(`↩ voltar (${naPdp ? 'seta da PDP' : 'header-back-button'})`);
            await driver.pause(2500);
        }

        throw new Error('Voltar até Categorias: 6 toques em voltar e a tela de Categorias (category-button + tab-categories) não apareceu.');
    }

    // Listagem ROLADA: o cabeçalho com o `header-back-button` rola junto com a lista e sai da árvore, e
    // a volta da PDP mantém a lista rolada (AVD 512 e 513; CI Run #31 e #33). Primeiro o "Back to top"
    // (BACK_TO_TOP), que leva a lista ao topo; se ele não estiver na tela, arrastos curtos para baixo
    // (45% → 70% da altura), que no AVD trouxeram o botão sem chegar ao topo. Mesmo mecanismo nas duas
    // plataformas. A guarda antiga "sem card visível = sai" derrubou os 5 iPhones no Run #33 (o
    // `product-card-*` veio displayed=false e a função saiu sem arrastar); saiu.
    private async mostrarCabecalhoDaListagem() {
        const voltar = seletorTestId('header-back-button');
        if (await $(voltar).isDisplayed().catch(() => false)) return;

        const topo = await $(BACK_TO_TOP);
        if (await topo.isDisplayed().catch(() => false)) {
            await topo.click();
            const voltou = await $(voltar).waitForDisplayed({ timeout: 10000 }).then(() => true).catch(() => false);
            if (voltou) {
                console.log('⬆ "Back to top" tocado: lista no topo, header-back-button de volta');
                return;
            }
            console.log('⚠ "Back to top" tocado, mas o header-back-button não voltou em 10 s — tentando arrastar');
        }

        const { width, height } = await driver.getWindowRect();
        for (let i = 1; i <= 5; i++) {
            await this.arrastar(width / 2, height * 0.45, width / 2, height * 0.7);
            await driver.pause(1000);
            if (await $(voltar).isDisplayed().catch(() => false)) {
                console.log(`↕ Cabeçalho da listagem de volta depois de ${i} arrasto(s) para baixo`);
                return;
            }
        }
    }

    private async estaEmCategorias(): Promise<boolean> {
        const aba = await $(seletorTestId('tab-categories')).isDisplayed().catch(() => false);
        const categoria = await $(seletorTestId('category-button')).isDisplayed().catch(() => false);
        return aba && categoria;
    }
}
