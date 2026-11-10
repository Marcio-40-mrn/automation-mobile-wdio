import { BasePage, timewhait, seletorTestId, scrollFinger, scrollUntilVisible } from "./BasePage";
import { BuscaPage } from "./BuscaPage";
import { CARD_MOCHILA } from "./CheckoutPage";
import { HomePage } from "./HomePage";
import { ProdutoPage } from "./ProdutoPage";
import { driver, $, $$ } from '@wdio/globals'
import allure from '@wdio/allure-reporter';
import { anexarPrint } from "../utils/allure-helpers";
import { texto } from "../utils/textos";

// Compartilhar carrinho (M9, Marcio, 2026-11-06). Executado por Appium antes de escrever:
// Android 1.22.9/534, drafts/app-migrado/android/captures-2026-11-06-compartilhar-carrinho-3/;
// iOS 1.22.9/377, drafts/app-migrado/ios/captures-2026-11-06-compartilhar-carrinho/. O teste segue
// o que o app faz hoje; nenhuma asserção por texto exibido.

const IOS = process.env.PLATFORM === 'ios';
const APP = 'com.aramis.ecomm';

// A URL copiada abre "Page not found" quando entregue direto ao app; o `aramisnova://` com o mesmo
// uuid abre o carrinho, logado e deslogado, nas duas plataformas.
const ESQUEMA_DO_LINK = 'aramisnova://share-bag/';
const FORMATO_DO_LINK = /^https:\/\/applink\.aramis\.com\.br\/share-bag\/([0-9a-f-]{36})$/;
const LINK_INEXISTENTE = `${ESQUEMA_DO_LINK}00000000-0000-0000-0000-000000000000`;
// A área de transferência do emulador é compartilhada com o host: sem a sentinela, um texto antigo
// seria lido como se fosse o link.
const SENTINELA = 'sentinela-compartilhar-carrinho';

// Área de transferência no Android. O `driver.setClipboard`/`getClipboard` do WDIO 9 tenta o
// `mobile: setClipboard`/`getClipboard` e só cai no endpoint antigo do Appium quando o erro diz
// "unknown command". O UiAutomator2 do host do Device Farm responde "Unknown mobile command" e o WDIO
// não cai (CI Run #52, 2026-11-09, Android 1.22.9/534, S23U, S23+, S24U, S24+ e S25U). Aqui o endpoint
// antigo entra só nesse erro; no AVD (Appium local) segue o `mobile:`.
const semComandoMobile = (erro: unknown) =>
    /unknown mobile command/i.test(erro instanceof Error ? erro.message : String(erro));

async function gravarAreaDeTransferencia(conteudo: string) {
    const base64 = Buffer.from(conteudo).toString('base64');
    try {
        await driver.setClipboard(base64, 'plaintext');
    } catch (erro) {
        if (!semComandoMobile(erro)) throw erro;
        await driver.appiumSetClipboard(base64, 'plaintext');
    }
}

async function lerAreaDeTransferencia(): Promise<string> {
    let base64: string;
    try {
        base64 = await driver.getClipboard('plaintext');
    } catch (erro) {
        if (!semComandoMobile(erro)) throw erro;
        base64 = await driver.appiumGetClipboard('plaintext');
    }
    return Buffer.from(base64 ?? '', 'base64').toString('utf8').trim();
}

const BOTAO_COMPARTILHAR = seletorTestId('share-bag-cta');
const ITEM_RECEBIDO = IOS
    ? '-ios predicate string:name BEGINSWITH "shared-bag-item-"'
    : '-android uiautomator:new UiSelector().resourceIdMatches("shared-bag-item-.*")';

// Menu nativo. Android: ids do `intentresolver` do AVD; o nome do pacote muda por aparelho e versão,
// por isso a regra só no id (Samsung do Device Farm não conferido). iOS: sheet na árvore do app.
const MENU_NATIVO = IOS
    ? '-ios predicate string:name == "ActivityListView"'
    : '-android uiautomator:new UiSelector().resourceIdMatches(".*:id/(resolver_list|copy|chooser_copy_button|content_preview_text)")';
const PREVIA_DO_LINK = '-android uiautomator:new UiSelector().resourceIdMatches(".*:id/content_preview_text")';
const copiarDoMenu = () => IOS
    ? `-ios predicate string:name == "actionGroupCell" AND label == "${texto('compartilhar.copiar')}"`
    : '-android uiautomator:new UiSelector().resourceIdMatches(".*:id/(copy|chooser_copy_button)")';

// Campos de cada produto: no Android e no iOS os botões e textos são IRMÃOS do card, não filhos.
// Android: todos sob um único pai, por isso `following::` (conferido com lxml na captura 19: 1 nó por
// campo em cada card). iOS: `following-sibling::` (captura 24, 2 nós, um por card).
const campoDoCard = (id: string, campo: string) => IOS
    ? `//*[@name="${id}"]/following-sibling::*[@name="${campo}"][1]`
    : `//*[@resource-id="${id}"]/following::*[@resource-id="${campo}"][1]`;
const quantidadeDoCard = (id: string) => IOS
    ? `${campoDoCard(id, 'remove-button')}/following-sibling::XCUIElementTypeStaticText[1]`
    : `${campoDoCard(id, 'remove-button')}/following-sibling::android.widget.TextView[1]`;

export type ItemMochila = { id: string; tamanho: string; quantidade: number };

const descrever = (itens: ItemMochila[]) => itens.map((i) => `${i.id} ${i.tamanho} x${i.quantidade}`).join(' ; ') || 'vazia';
const ordenar = (itens: ItemMochila[]) => [...itens].sort((a, b) => a.id.localeCompare(b.id));
const sufixo = (id: string) => id.replace(/^.*-/, '');

export class CompartilharPage extends BasePage {
    private readonly produtoPage = new ProdutoPage();
    private readonly buscaPage = new BuscaPage();
    private readonly homePage = new HomePage();

    private async idDoElemento(el: WebdriverIO.Element): Promise<string | null> {
        return el.getAttribute(IOS ? 'name' : 'resource-id').catch(() => null);
    }

    async validarBotaoAusente() {
        const presente = await $(BOTAO_COMPARTILHAR).isDisplayed().catch(() => false);
        if (presente) {
            await anexarPrint('Compartilhar — botão com a Mochila vazia');
            throw new Error('Compartilhar: o share-bag-cta apareceu com a Mochila vazia.');
        }
        console.log('✅ Mochila vazia sem o botão de compartilhar');
    }

    async validarBotaoPresente(itens: number) {
        if (!(await scrollUntilVisible($(BOTAO_COMPARTILHAR), 6))) {
            await anexarPrint('Compartilhar — botão ausente');
            throw new Error(`Compartilhar: o share-bag-cta não apareceu com ${itens} produto(s) na Mochila.`);
        }
        console.log(`✅ Botão de compartilhar presente com ${itens} produto(s)`);
    }

    private async irAoTopoDaMochila() {
        const { width, height } = await driver.getWindowRect();
        for (let i = 0; i < 3; i++) {
            await this.arrastar(width * 0.92, height * 0.3, width * 0.92, height * 0.8);
            await driver.pause(500);
        }
    }

    private async textoDe(seletor: string): Promise<string | null> {
        const el = await $(seletor);
        if (!(await el.isExisting().catch(() => false))) return null;
        const valor = await el.getAttribute(IOS ? 'label' : 'text').catch(() => null);
        return valor ?? null;
    }

    // Lê id, tamanho e quantidade de cada produto, rolando porque os cards de baixo só entram na árvore
    // do Android quando aparecem. Termina com todos os cards lidos e o botão de compartilhar na tela
    // (ele fica depois do último card).
    async lerMochila(): Promise<ItemMochila[]> {
        await this.fechaBanner();
        await this.irAoTopoDaMochila();
        const itens = new Map<string, ItemMochila>();
        for (let rolagem = 0; rolagem <= 8; rolagem++) {
            for (const card of await $$(CARD_MOCHILA)) {
                const id = await this.idDoElemento(card);
                if (!id || itens.has(sufixo(id))) continue;
                const tamanho = await this.textoDe(campoDoCard(id, 'wake-item-size'));
                const quantidade = await this.textoDe(quantidadeDoCard(id));
                if (!tamanho || !quantidade) continue;
                itens.set(sufixo(id), { id: sufixo(id), tamanho, quantidade: Number(quantidade) });
            }
            if (await $(BOTAO_COMPARTILHAR).isDisplayed().catch(() => false)) break;
            await scrollFinger();
            await driver.pause(1000);
        }
        const lidos = [...itens.values()];
        console.log(`🎒 Mochila: ${descrever(lidos)}`);
        return lidos;
    }

    // Resultado final: mesmos produtos, tamanhos e quantidades. O id do card é por variação (na polo,
    // P 444325, M 444327, G 444329).
    async validarMochila(esperado: ItemMochila[], contexto: string) {
        const atual = await this.lerMochila();
        if (JSON.stringify(ordenar(atual)) !== JSON.stringify(ordenar(esperado))) {
            await anexarPrint(`Mochila diferente — ${contexto}`);
            throw new Error(`Mochila ${contexto}: esperado ${descrever(ordenar(esperado))}, lido ${descrever(ordenar(atual))}.`);
        }
        console.log(`✅ Mochila ${contexto} confere`);
    }

    private async botaoDoCard(id: string, campo: string): Promise<WebdriverIO.Element> {
        const card = `wake-product-card-bag-${id}`;
        await this.irAoTopoDaMochila();
        for (let rolagem = 0; rolagem <= 6; rolagem++) {
            const botao = await $(campoDoCard(card, campo));
            if (await botao.isDisplayed().catch(() => false)) return botao.getElement();
            await scrollFinger();
            await driver.pause(1000);
        }
        await anexarPrint(`Mochila — ${campo} do produto ${id} não alcançado`);
        throw new Error(`Mochila: ${campo} do produto ${id} não apareceu em 6 rolagens.`);
    }

    private async quantidade(id: string): Promise<number | null> {
        const valor = await this.textoDe(quantidadeDoCard(`wake-product-card-bag-${id}`));
        return valor ? Number(valor) : null;
    }

    private async mudarQuantidade(id: string, campo: 'add-button' | 'remove-button', esperada: number): Promise<boolean> {
        await this.fechaBanner();
        await (await this.botaoDoCard(id, campo)).click();
        const modal = seletorTestId('alert-modal');
        let recusou = false;
        const mudou = await driver
            .waitUntil(async () => {
                recusou = await $(modal).isDisplayed().catch(() => false);
                return recusou || (await this.quantidade(id)) === esperada;
            }, { timeout: 10000, interval: 500 })
            .then(() => !recusou)
            .catch(() => false);
        if (recusou) await this.produtoPage.fecharModalDeEstoque();
        return mudou;
    }

    // Estoque varia por produto (no iOS, o G da camisa só tinha 1): tenta cada item da Mochila e
    // devolve os itens com a nova quantidade.
    async aumentarQuantidadeDeUmItem(itens: ItemMochila[]): Promise<ItemMochila[]> {
        for (const item of itens) {
            if (await this.mudarQuantidade(item.id, 'add-button', item.quantidade + 1)) {
                console.log(`➕ Produto ${item.id}: quantidade ${item.quantidade + 1}`);
                return itens.map((i) => (i.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i));
            }
            console.log(`⚠ Produto ${item.id} sem estoque para mais 1 — tentando o próximo`);
        }
        await anexarPrint('Mochila — nenhum item aceitou mais 1');
        throw new Error(`Mochila: nenhum produto aceitou mais 1 unidade (${descrever(itens)}).`);
    }

    // Um a menos e um a mais: a quantidade já existia no remetente, então não depende de estoque novo.
    async validarAlteracaoDeQuantidade(item: ItemMochila) {
        if (item.quantidade < 2) throw new Error(`Quantidade: o produto ${item.id} precisa ter pelo menos 2 unidades.`);
        if (!(await this.mudarQuantidade(item.id, 'remove-button', item.quantidade - 1))) {
            throw new Error(`Quantidade: o remove-button não levou o produto ${item.id} a ${item.quantidade - 1}.`);
        }
        if (!(await this.mudarQuantidade(item.id, 'add-button', item.quantidade))) {
            throw new Error(`Quantidade: o add-button não levou o produto ${item.id} de volta a ${item.quantidade}.`);
        }
        console.log(`✅ Quantidade do produto ${item.id}: ${item.quantidade} → ${item.quantidade - 1} → ${item.quantidade}`);
    }

    async removerItem(id: string) {
        await this.fechaBanner();
        await (await this.botaoDoCard(id, 'wake-remove-item')).click();
        const saiu = await driver
            .waitUntil(async () => !(await $(seletorTestId(`wake-product-card-bag-${id}`)).isExisting().catch(() => false)), {
                timeout: 15000,
                interval: 500,
            })
            .then(() => true)
            .catch(() => false);
        if (!saiu) throw new Error(`Mochila: o wake-remove-item não tirou o produto ${id} em 15s.`);
        console.log(`🗑 Produto ${id} removido`);
    }

    // Toca em compartilhar e no Copy, que fecha o menu nativo nas duas plataformas (Android captura 21,
    // iOS 27). Sem o Copy no menu, o Android lê o link da prévia e fecha com o voltar.
    async compartilharECopiar(): Promise<string | null> {
        await this.fechaBanner();
        if (!IOS) await gravarAreaDeTransferencia(SENTINELA);
        await $(BOTAO_COMPARTILHAR).click();
        const abriu = await $(MENU_NATIVO).waitForDisplayed({ timeout: 15000 }).then(() => true).catch(() => false);
        if (!abriu) {
            allure.addAttachment('Compartilhar — árvore da tela', await driver.getPageSource(), 'text/plain');
            await anexarPrint('Compartilhar — menu nativo não abriu');
            throw new Error('Compartilhar: o menu nativo não abriu em 15s depois do share-bag-cta.');
        }
        await anexarPrint('Compartilhar — menu nativo');

        const previa = IOS ? null : await $(PREVIA_DO_LINK).getText().catch(() => null);
        const copiar = await $(copiarDoMenu());
        if (await copiar.isDisplayed().catch(() => false)) {
            await copiar.click();
            await driver.pause(timewhait);
            return previa;
        }
        if (IOS) throw new Error('Compartilhar: o Copy não apareceu no menu nativo.');
        console.log('ℹ Menu nativo sem o Copy: o link vem da prévia');
        await driver.back();
        await driver.pause(timewhait);
        return previa;
    }

    // Android: área de transferência. iOS: `getClipboard` volta vazio no aparelho real, então o link é
    // colado no campo de Busca e lido, e o teste volta a Categorias (diferença no REQUIREMENTS.md).
    async lerLinkCopiado(previa: string | null): Promise<string> {
        let lido: string;
        if (IOS) {
            await this.homePage.abrirCategorias();
            await this.buscaPage.abrirPelaLupaDeCategorias();
            // O sheet leva a URL e o texto: o campo recebe a URL duas vezes, separada por espaço.
            lido = (await this.buscaPage.colarNoCampoIOS()).trim().split(/\s+/)[0];
            await this.produtoPage.voltarAteCategorias();
        } else {
            const area = await lerAreaDeTransferencia();
            lido = area && area !== SENTINELA ? area : (previa ?? '').trim();
        }
        allure.addAttachment('Link compartilhado', lido || 'não lido', 'text/plain');
        return lido;
    }

    // Link só com o código: sem query, sem produto, CDV ou dado pessoal na URL.
    validarFormatoDoLink(link: string): string {
        const formato = link.match(FORMATO_DO_LINK);
        if (!formato) throw new Error(`Link compartilhado fora do formato /share-bag/<uuid>: "${link}".`);
        console.log('✅ Link só com o código, sem query');
        return `${ESQUEMA_DO_LINK}${formato[1]}`;
    }

    private async abrirNoApp(url: string) {
        await this.fechaBanner();
        await driver.execute('mobile: deepLink', IOS ? { url, bundleId: APP } : { url, package: APP });
    }

    // Abre o link e confere os produtos na "Shared Backpack". Tamanho e quantidade valem pela Mochila,
    // depois do "Add all": a tela de revisão não mostra a quantidade.
    async abrirCarrinhoRecebido(link: string, esperado: ItemMochila[]) {
        await this.abrirNoApp(link);
        const abriu = await $(ITEM_RECEBIDO).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!abriu) {
            await anexarPrint('Carrinho recebido — não abriu');
            throw new Error('Carrinho recebido: nenhum shared-bag-item-* em 30s depois de abrir o link.');
        }
        const ids: string[] = [];
        for (const item of await $$(ITEM_RECEBIDO)) {
            const id = await this.idDoElemento(item);
            if (id) ids.push(sufixo(id));
        }
        const faltando = esperado.filter((i) => !ids.includes(i.id));
        if (faltando.length > 0) {
            throw new Error(`Carrinho recebido: faltam os produtos ${faltando.map((i) => i.id).join(', ')} (lidos: ${ids.join(', ')}).`);
        }
        if (!(await $(seletorTestId('shared-bag-add-all')).isDisplayed().catch(() => false))) {
            throw new Error('Carrinho recebido: o shared-bag-add-all não está na tela.');
        }
        await anexarPrint('Carrinho recebido');
        console.log(`✅ Carrinho recebido com ${ids.length} produto(s)`);
    }

    // "Add all" mantém a tela; os itens entram na Mochila e o voltar sai da "Shared Backpack".
    async adicionarTudoEAbrirMochila() {
        await this.fechaBanner();
        await $(seletorTestId('shared-bag-add-all')).click();
        await driver.pause(timewhait);
        await this.fechaBanner();
        await $(seletorTestId('header-back-button')).click();
        const aba = await $(seletorTestId('tab-bag'));
        await this.waitForElement(aba);
        await aba.click();
        await driver.pause(timewhait);
    }

    async validarLinkInvalido() {
        await this.abrirNoApp(LINK_INEXISTENTE);
        const abriu = await $(seletorTestId('shared-bag-unavailable')).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!abriu) {
            await anexarPrint('Link inválido — tela não apareceu');
            throw new Error('Link inválido: o shared-bag-unavailable não apareceu em 30s.');
        }
        if ((await $$(ITEM_RECEBIDO).length) > 0) throw new Error('Link inválido: a tela trouxe produtos.');
        await $(seletorTestId('pressable')).click();
        await this.homePage.validarHome();
        console.log('✅ Link inválido: tela de indisponível e Home');
    }
}
