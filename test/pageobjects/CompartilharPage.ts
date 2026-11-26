import { BasePage, timewhait, seletorTestId } from "./BasePage";
import { BuscaPage } from "./BuscaPage";
import { CARD_MOCHILA } from "./CheckoutPage";
import { HomePage } from "./HomePage";
import { ProdutoPage } from "./ProdutoPage";
import { driver, $, $$ } from '@wdio/globals'
import allure from '@wdio/allure-reporter';
import { anexarPrint } from "../utils/allure-helpers";
import { texto } from "../utils/textos";
import { lerArvoreAndroid, seguinte, irmaoSeguinte } from "../utils/arvore-android";

// Compartilhar carrinho (M9, Marcio, 2026-11-06). Executado por Appium antes de escrever:
// Android 1.22.9/534, drafts/app-migrado/android/captures-2026-11-06-compartilhar-carrinho-3/;
// iOS 1.22.9/377, drafts/app-migrado/ios/captures-2026-11-06-compartilhar-carrinho/. O teste segue
// o que o app faz hoje; nenhuma asserção por texto exibido.

const IOS = process.env.PLATFORM === 'ios';
const APP = 'com.aramis.ecomm';

// A URL copiada abre "Page not found" quando entregue direto ao app; o `aramisnova://` com o mesmo
// uuid abre o carrinho, logado e deslogado, nas duas plataformas.
// Domínio: `applink.aramis.com.br` até o Android 1.23.0/542; `www.aramis.com.br` no Android 1.23.0/547
// (run local e captura de 2026-11-16, `captures-2026-11-16-build547-entrega-link/` 27–30, 2 de 2).
// Os dois são aceitos, nas duas plataformas (domínio do iOS 1.23.0 não conferido). No 547 o
// `aramisnova://` com o uuid continua abrindo a "Shared Backpack" (captura 31).
// Android 1.23.1/553 (mudança esperada, Marcio, 2026-11-18): o link virou
// `https://www.aramis.com.br/checkout?checkoutId=<uuid>`, com a única query sendo o código. O
// `aramisnova://share-bag/<uuid>` com esse mesmo uuid abre a "Shared Backpack", logado e deslogado, e o
// uuid inválido dá `shared-bag-unavailable` (`captures-2026-11-18-build553-link-checkout/` 14, 35).
// iOS 1.23.1/403 (Remote Access, 2026-11-18, `drafts/app-migrado/ios/captures-2026-11-18-compartilhar-1.23.1/`):
// `https://applink.aramis.com.br/checkout?checkoutId=<uuid>`; o `aramisnova://share-bag/<uuid>` abre a
// "Shared Backpack" logado e deslogado. Os dois formatos são aceitos, nas duas plataformas.
// O texto copiado pode ser só a URL ou uma frase com a URL no meio. A frase não é fixa
// (AVD, 2026-11-24: "I picked out a few pieces…" + `https://www.aramis.com.br/share-bag/<uuid>`).
const ESQUEMA_DO_LINK = 'aramisnova://share-bag/';
const FORMATO_DO_LINK = /https:\/\/(?:applink|www)\.aramis\.com\.br\/(?:share-bag\/|checkout\?checkoutId=)([0-9a-f-]{36})(?![0-9a-f/?#&-])/;
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
// por isso a regra só no id. iOS: sheet na árvore do app.
// Samsung (One UI) tem chooser próprio: `android:id/sem_chooser_frame_root`, Copy = `sem_chooser_chip_button`
// ("Copy URL") e a prévia `text1` traz o título da página, não a URL (árvore anexada no CI Run #56,
// 2026-11-17, S23 Ultra, Android 1.23.0/550; mesmo menu no Run #55). O link vem da área de transferência.
// Samsung Android 14/15 (S24 Ultra, S24+, S25 Ultra; link vazio no CI Run #58): outro menu, com a URL inteira no
// `sem_chooser_main_title` e o Copy = `sem_copy_button` (ícone, content-desc "Copy"). Conferido no S24 Ultra por
// Remote Access em 2026-11-19 (Android 1.23.1/557, `captures-2026-11-19-s24u-menu-compartilhar/` 03–04): o toque
// grava o link na área de transferência e fecha o menu. O `sem_chooser_main_title` entra como prévia (reserva).
const MENU_NATIVO = IOS
    ? '-ios predicate string:name == "ActivityListView"'
    : '-android uiautomator:new UiSelector().resourceIdMatches(".*:id/(resolver_list|copy|chooser_copy_button|content_preview_text|sem_chooser_frame_root|sem_chooser_chip_button)")';
const PREVIA_DO_LINK = '-android uiautomator:new UiSelector().resourceIdMatches(".*:id/(content_preview_text|sem_chooser_main_title)")';
// iOS 18: Copy = `actionGroupCell`. iOS 17 (iPhone 15 Pro Max do Device Farm, 17.3.1): o Copy é uma linha da
// lista do sheet (print do CI Run #56, 2026-11-17), e não casou com o `actionGroupCell`; a regra aceita célula ou
// botão com o mesmo label. Árvore do iOS 17 não capturada: o próximo run anexa a árvore se não achar.
const copiarDoMenu = () => IOS
    ? `-ios predicate string:label == "${texto('compartilhar.copiar')}" AND (name == "actionGroupCell" OR type == "XCUIElementTypeCell" OR type == "XCUIElementTypeButton")`
    : '-android uiautomator:new UiSelector().resourceIdMatches(".*:id/(copy|chooser_copy_button|sem_chooser_chip_button|sem_copy_button)")';

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
        await this.fechaBanner();
        let achou = false;
        for (let rolagem = 0; rolagem <= 6 && !achou; rolagem++) {
            achou = await $(BOTAO_COMPARTILHAR).isDisplayed().catch(() => false);
            if (!achou) await this.rolarMochila();
        }
        if (!achou) {
            await anexarPrint('Compartilhar — botão ausente');
            throw new Error(`Compartilhar: o share-bag-cta não apareceu com ${itens} produto(s) na Mochila.`);
        }
        console.log(`✅ Botão de compartilhar presente com ${itens} produto(s)`);
    }

    // Rola a lista da Mochila para baixo. O `scrollFinger` começa o arrasto em 81,7% da altura, em cima do
    // "Finish purchase" fixo (S23+ e S26 Ultra: 77–83%), e a lista não se move (CI Run #52 e #56: o
    // share-bag-cta e o wake-remove-item abaixo dos cards nunca chegaram à tela; print do S23+ no Run #56).
    // Aqui o arrasto fica entre 60% e 25%, acima do botão fixo, na borda direita (fora dos botões do card).
    private async rolarMochila() {
        const { width, height } = await driver.getWindowRect();
        await this.arrastar(width * 0.92, height * 0.6, width * 0.92, height * 0.25, 600);
        await driver.pause(1000);
    }

    private async irAoTopoDaMochila() {
        const { width, height } = await driver.getWindowRect();
        for (let i = 0; i < 3; i++) {
            await this.arrastar(width * 0.92, height * 0.3, width * 0.92, height * 0.8);
            await driver.pause(500);
        }
    }

    // Uma busca só (`$$`), não `$()` + `isExisting()`: na Mochila com frete grátis cada busca leva 3–7 s
    // (Android 1.23.1/557, 2026-11-19, NOTAS.md achado 5). Nas duas plataformas.
    private async textoDe(seletor: string): Promise<string | null> {
        const els = await $$(seletor).getElements();
        if (els.length === 0) return null;
        const valor = await els[0].getAttribute(IOS ? 'label' : 'text').catch(() => null);
        return valor ?? null;
    }

    // Android: tamanho e quantidade de cada card lidos de UMA árvore (`getPageSource`), com a mesma regra
    // dos XPaths `campoDoCard`/`quantidadeDoCard` (tamanho = `wake-item-size` seguinte; quantidade = TextView
    // irmão seguinte do `remove-button`), procurados só até o próximo card. Antes: 4 buscas por card, 105 s
    // para 3 cards com frete grátis (Android 1.23.1/557, 2026-11-19, NOTAS.md achados 1b e 5). Só a leitura
    // muda; o que é validado é o mesmo do iOS.
    private async lerTelaDaMochilaAndroid(itens: Map<string, ItemMochila>): Promise<boolean> {
        const nos = lerArvoreAndroid(await driver.getPageSource());
        const cards = nos.map((n, i) => (/^wake-product-card-bag-/.test(n.id) ? i : -1)).filter((i) => i >= 0);
        cards.forEach((c, k) => {
            const id = sufixo(nos[c].id);
            if (itens.has(id)) return;
            const ate = cards[k + 1] ?? nos.length;
            const tam = seguinte(nos, c, (n) => n.id === 'wake-item-size', ate);
            const menos = seguinte(nos, c, (n) => n.id === 'remove-button', ate);
            const qtd = menos >= 0 ? irmaoSeguinte(nos, menos, (n) => n.classe === 'android.widget.TextView') : -1;
            if (tam < 0 || qtd < 0 || qtd >= ate || !nos[tam].texto || !nos[qtd].texto) return;
            itens.set(id, { id, tamanho: nos[tam].texto, quantidade: Number(nos[qtd].texto) });
        });
        return nos.some((n) => n.id === 'share-bag-cta' && n.exibido);
    }

    // Lê id, tamanho e quantidade de cada produto, rolando porque os cards de baixo só entram na árvore
    // do Android quando aparecem. Termina com todos os cards lidos e o botão de compartilhar na tela
    // (ele fica depois do último card).
    async lerMochila(): Promise<ItemMochila[]> {
        await this.fechaBanner();
        await this.irAoTopoDaMochila();
        const itens = new Map<string, ItemMochila>();
        for (let rolagem = 0; rolagem <= 8; rolagem++) {
            if (!IOS) {
                if (await this.lerTelaDaMochilaAndroid(itens)) break;
                await this.rolarMochila();
                continue;
            }
            for (const card of await $$(CARD_MOCHILA)) {
                const id = await this.idDoElemento(card);
                if (!id || itens.has(sufixo(id))) continue;
                const tamanho = await this.textoDe(campoDoCard(id, 'wake-item-size'));
                const quantidade = await this.textoDe(quantidadeDoCard(id));
                if (!tamanho || !quantidade) continue;
                itens.set(sufixo(id), { id: sufixo(id), tamanho, quantidade: Number(quantidade) });
            }
            if (await $(BOTAO_COMPARTILHAR).isDisplayed().catch(() => false)) break;
            await this.rolarMochila();
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
            await this.rolarMochila();
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
            // O Copy do AVD e do iOS fecha o menu; se algum chooser ficar aberto, sai pelo voltar.
            if (!IOS && (await $(MENU_NATIVO).isDisplayed().catch(() => false))) {
                await driver.back();
                await driver.pause(timewhait);
            }
            return previa;
        }
        if (IOS) {
            allure.addAttachment('Compartilhar — árvore do menu sem Copy', await driver.getPageSource(), 'text/plain');
            await anexarPrint('Compartilhar — menu sem Copy');
            throw new Error('Compartilhar: o Copy não apareceu no menu nativo.');
        }
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
            // O campo pode receber só a URL, a URL duas vezes, ou uma frase com a URL no meio.
            lido = (await this.buscaPage.colarNoCampoIOS()).trim();
            await this.produtoPage.voltarAteCategorias();
        } else {
            const area = await lerAreaDeTransferencia();
            lido = area && area !== SENTINELA ? area : (previa ?? '').trim();
        }
        allure.addAttachment('Link compartilhado', lido || 'não lido', 'text/plain');
        return lido;
    }

    // Acha a URL dentro do texto copiado. A URL só tem o código (no path ou no `checkoutId`):
    // sem produto, CDV ou dado pessoal. A frase em volta não entra.
    validarFormatoDoLink(texto: string): string {
        const formato = texto.match(FORMATO_DO_LINK);
        if (!formato) throw new Error(`Link compartilhado fora do formato /share-bag/<uuid> ou /checkout?checkoutId=<uuid>: "${texto}".`);
        console.log('✅ Link só com o código, sem outro dado');
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
        // Android 1.23.1/553 (captura 2026-11-18, `captures-2026-11-18-build553-cenarios-40-42/`): com a
        // "Shared Backpack" aberta sobre a Mochila, o voltar já devolve a Mochila com os itens somados, e o
        // `tab-bag` só volta à árvore ~3 s depois. Um `$()` resolvido na transição estourou os 20 s em 3 de
        // 4 vezes com a aba já na tela. Agora reconsulta a cada volta e só toca na aba se a Mochila não
        // estiver aberta. Nas duas plataformas.
        let naMochila = false;
        const pronto = await driver
            .waitUntil(async () => {
                naMochila = (await $(CARD_MOCHILA).isDisplayed().catch(() => false))
                    || (await $(seletorTestId('status-alert-icon')).isDisplayed().catch(() => false));
                return naMochila || (await $(seletorTestId('tab-bag')).isDisplayed().catch(() => false));
            }, { timeout: 30000, interval: 1000 })
            .then(() => true)
            .catch(() => false);
        if (!pronto) {
            await anexarPrint('Add all — nem Mochila nem tab-bag depois do voltar');
            throw new Error('Add all: depois do voltar, nem a Mochila nem o tab-bag apareceram em 30s.');
        }
        if (!naMochila) {
            await this.fechaBanner();
            await $(seletorTestId('tab-bag')).click();
        }
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
