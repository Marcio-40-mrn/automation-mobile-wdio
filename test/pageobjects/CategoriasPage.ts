import { BasePage, timewhait, seletorTestId } from "./BasePage";
import { driver, $, $$ } from '@wdio/globals'
import { texto } from "../utils/textos";
import { ProdutoPage } from "./ProdutoPage";
import { SELETOR_CARD_PRODUTO } from "./BuscaPage";

// Estado do coração na listagem do Android migrado (1.20.10): o `action-button-icon` mede 84x84
// com o coração vazio e 52x53 com ele preenchido, dentro de um `action-button` que fica em 84x84
// nos dois estados (fonte: drafts/app-migrado/android/11-listagem-camisas.md, capturas 17 e 18).
// Em pixels os números mudam de device para device (1080 x 1440 de largura), então o que se
// compara é a RAZÃO largura do ícone / largura do botão: ~1,00 vazio, ~0,62 preenchido. O limite
// fica no meio, longe dos dois.
const RAZAO_ICONE_PREENCHIDO_ANDROID = 0.8;

export class CategoriasPage extends BasePage {

    // Título da subcategoria aberta, guardado por quem abriu a tela. O voltarIOS() precisa dele
    // para chegar no chevron do cabeçalho: na listagem de produtos o chevron não tem nó próprio
    // na árvore — ele vive dentro do nó do título, e o seletor é uma class chain indexada pelo
    // name desse título. Ver o comentário do voltarIOS() no BasePage.
    private tituloListagem?: string;

    async selecionarMangaCurta() {
        const element = await $('-android uiautomator:new UiSelector().text("Manga curta ")');
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
    }

    // No iOS as linhas de categoria compartilham o mesmo name genérico (category-button, sete
    // vezes na tela); o texto fica no label. Por isso o predicate combinando os dois — um
    // "accessibility id:Roupas" copiado do Android não casa com nada lá.
    //
    // App migrado: o testID `category-button` é o mesmo nas duas plataformas; o rótulo vai em
    // `desc` no Android e em `label` no iOS (seletor por texto — frágil (sem testID único),
    // valor em textos.ts). fonte: Android drafts/app-migrado/android/09-categorias.md;
    // iOS drafts/app-migrado/ios/09-categorias.md.
    async clickRoupas() {
        if (process.env.PLATFORM === 'ios') {
            const element = await $(`-ios predicate string:name == "category-button" AND label == "${texto('categorias.roupas')}"`);
            await this.waitForElement(element);
            await this.fechaBanner();
            await element.click();
            await driver.pause(timewhait);
            return;
        }

        const element = await $(
            `-android uiautomator:new UiSelector().resourceId("category-button").description("${texto('categorias.roupas')}")`
        );
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
    }

    // Mesmo padrão do clickRoupas, um nível abaixo: as subcategorias do acordeão aberto usam
    // sub-categories-button repetido, desambiguado pelo label.
    // fonte: Android drafts/app-migrado/android/10-subcategorias-roupas.md;
    //        iOS drafts/app-migrado/ios/10-subcategorias-roupas.md (seletor por texto — frágil
    //        (sem testID único); o rótulo vem de textos.ts).
    async abrirCamisas() {
        const titulo = texto('categorias.camisas');

        if (process.env.PLATFORM === 'ios') {
            const element = await $(`-ios predicate string:name == "sub-categories-button" AND label == "${titulo}"`);
            await this.waitForElement(element);
            await this.fechaBanner();
            await element.click();
            await driver.pause(timewhait);
            this.tituloListagem = titulo;
            return;
        }

        const element = await $(
            `-android uiautomator:new UiSelector().resourceId("sub-categories-button").description("${titulo}")`
        );
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
        this.tituloListagem = titulo;
    }

    async selecionarProduto(texto: string) {
        const element = await $(`-android uiautomator:new UiSelector().text(\"${texto}\")`);
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
    }

    // Favorita a camisa da POSIÇÃO `posicao` da listagem, direto no card, e devolve o nome para a
    // validação nos favoritos usar depois. Produto diferente por teste e por device (Marcio,
    // 2026-10-26; `posicoesDoProduto` em device-index.ts): o 01 usa o bloco 1 da listagem de
    // Camisas, o 02 compra nos blocos 0, 2 e 3. Nenhum nome fixo: o catálogo muda entre versões.
    //
    // Favoritar aqui, e não na página do produto, deixa o teste uma tela antes na navegação:
    // um único voltar() já chega em categorias, que é a tela onde a aba Perfil existe (a
    // listagem não tem tab-* nenhum). Com a lista rolada até o card, o cabeçalho sai da árvore;
    // por isso, depois do toque, a lista volta ao topo ("Back to top") antes do voltar().
    //
    // CORAÇÃO DO CARD: um `action-button` por card, DENTRO do retângulo do `product-card-<id>` —
    // Android draft android/11 (card [42,544][534,1778], coração [429,555][513,639]); iOS
    // captures-2026-10-17-listagem-camisas/04 (card 16,245 202x472, coração 178,249 32x33). O
    // coração é o `action-button` cujo centro cai dentro do card; o ícone, o
    // `action-button-icon` dentro do coração.
    //
    // ESTADO DO CORAÇÃO: no Android o `action-button-icon` encolhe de 84x84 para 52x53 quando
    // preenchido; no iOS, de 32x33 para 20x21. Daí a guarda de conta suja ANTES do toque e, no
    // Android, a confirmação DEPOIS. A prova final continua sendo a tela de Favoritos.
    //
    // NOME: Android, o content-desc "Nome, R$ preço" está no card ou num filho dele (draft
    // android/11; pode começar com espaço); iOS, o `label` do card, "Nome R$\xa0preço" (sem
    // vírgula, espaço non-breaking). O preço é cortado e o resultado aparado.
    async favoritarProdutoNaPosicao(posicao: number): Promise<string> {
        const ios = process.env.PLATFORM === 'ios';
        const produtoPage = new ProdutoPage();

        // Timeout folgado: a lista demora a montar depois do clique na categoria.
        await $(SELETOR_CARD_PRODUTO).waitForDisplayed({ timeout: 40000 });
        // A lista segue hidratando depois do primeiro card aparecer; sem esta pausa o clique
        // sai cedo demais e o coração não reage.
        await driver.pause(timewhait);

        const card = await produtoPage.cardNaPosicao(posicao);
        const rectCard = await driver.getElementRect(card.el.elementId);

        let descricao = (await card.el.getAttribute(ios ? 'label' : 'content-desc').catch(() => null)) ?? '';
        if (!ios && !descricao.includes(', R$')) {
            descricao = (await card.el.$('.//*[contains(@content-desc, ", R$")]').getAttribute('content-desc').catch(() => null)) ?? '';
        }
        const nome = descricao.replace(ios ? /\s*R\$[\s\S]*$/ : /,\s*R\$[\s\S]*$/, '').trim();
        if (!nome) {
            throw new Error(`Favoritar: o nome do produto não foi lido no card ${card.id} (posição ${posicao}).`);
        }
        console.log(`🛍 Produto escolhido: ${nome} (${card.id}, posição ${posicao} da listagem)`);

        const coracao = await this.dentroDe(seletorTestId('action-button'), rectCard);
        if (!coracao) {
            throw new Error(`Favoritar: nenhum action-button (coração) dentro do card ${card.id} (posição ${posicao}).`);
        }
        const medirIcone = async (): Promise<{ w: number; h: number; razao: number } | null> => {
            const rectCoracao = await driver.getElementRect(coracao.elementId).catch(() => null);
            if (!rectCoracao || !rectCoracao.width) return null;
            const icone = await this.dentroDe(seletorTestId('action-button-icon'), rectCoracao);
            if (!icone) return null;
            const { width, height } = await driver.getElementRect(icone.elementId);
            return { w: width, h: height, razao: width / rectCoracao.width };
        };

        // Guarda de conta suja: o coração é um TOGGLE. Se o item já estiver favoritado (resto de um
        // run que morreu entre favoritar e desfavoritar), o toque DESfavorita e o erro aparece dois
        // passos adiante. O erro traz a medida, para que uma mudança de ícone no app seja reconhecida
        // como tal e não como conta suja.
        const preenchido = (m: { w: number; razao: number }) => (ios ? m.w < 26 : m.razao < RAZAO_ICONE_PREENCHIDO_ANDROID);
        const antes = await medirIcone();
        if (antes && preenchido(antes)) {
            throw new Error(
                `Conta suja: o coração de "${nome}" já está preenchido antes do toque ` +
                `(action-button-icon ${antes.w}x${antes.h}; ` +
                (ios
                    ? 'contorno mede 32x33, preenchido 20x21 — draft ios/15). '
                    : `razão ${antes.razao.toFixed(2)} do botão; vazio ≈ 1,00, preenchido ≈ 0,62 — draft android/11). `) +
                'Um run anterior deixou o favorito na conta; tocar agora DESfavoritaria. Desfavoritar manualmente nesta conta antes de rodar de novo.'
            );
        }
        console.log(`🤍 Coração de "${nome}" sem preenchimento (icone ${antes ? `${antes.w}x${antes.h}` : 'não medido'})`);

        await this.fechaBanner();
        await coracao.click();

        // Android: o ícone tem que encolher em até 10s (favoritar é chamada de backend). iOS: o
        // tamanho do ícone não é asserção (efeito do SVG, não muda na tela de Favoritos); a
        // validação é em Favoritos.
        if (!ios) {
            let depois = antes;
            const preencheu = await driver
                .waitUntil(async () => { depois = await medirIcone(); return !!depois && preenchido(depois); }, { timeout: 10000, interval: 500 })
                .then(() => true)
                .catch(() => false);
            if (!preencheu) {
                throw new Error(
                    `Favoritar no Android: o ícone do coração de "${nome}" não passou a preenchido em 10s depois do ` +
                    `toque (action-button-icon ${depois ? `${depois.w}x${depois.h}, razão ${depois.razao.toFixed(2)}` : 'não medido'}; ` +
                    'preenchido ≈ 0,62). O toque não favoritou — conferir no vídeo se caiu num banner do Insider ' +
                    'ou num modal de erro do app.'
                );
            }
            console.log(`❤ Coração de "${nome}" preenchido (icone ${depois!.w}x${depois!.h})`);
        }
        await driver.pause(timewhait);

        await produtoPage.irParaOTopoDaListagem();
        return nome;
    }

    // O 1º elemento visível do seletor cujo centro cai dentro do retângulo dado.
    private async dentroDe(seletor: string, r: { x: number; y: number; width: number; height: number }) {
        for (const el of await $$(seletor)) {
            if (!(await el.isDisplayed().catch(() => false))) continue;
            const e = await driver.getElementRect(el.elementId).catch(() => null);
            if (!e) continue;
            const cx = e.x + e.width / 2;
            const cy = e.y + e.height / 2;
            if (cx >= r.x && cx <= r.x + r.width && cy >= r.y && cy <= r.y + r.height) return el;
        }
        return null;
    }

    async validaElememnto(texto: string) {
        const element = await $(`-android uiautomator:new UiSelector().text(\"${texto}\")`);
        await this.elementVisible(element);
    }

    async selecionarTipo() {
        const element = await $("-android uiautomator:new UiSelector().text(\"Casual\")");
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
    }

    async adicionarItemFavoritos() {
        const element = await $("-android uiautomator:new UiSelector().className(\"com.horcrux.svg.PathView\").instance(2)");
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
    }

    // Os dois caminhos são frágeis, por motivos diferentes: o Android depende do content-desc do
    // cabeçalho (texto, sem testID — "Voltar" em Favoritos, o título na listagem) e o iOS, da
    // posição na TELA, porque a listagem de produtos é a única tela do fluxo sem botão de voltar
    // identificável. Ver voltarIOS() no BasePage.
    //
    // O tituloListagem é obrigatório no iOS: sem ele o voltarIOS() pula o caminho do chevron —
    // o ÚNICO que funciona nesta tela — e cai em Back/driver.back()/swipe, que não mexem um byte
    // na árvore aqui. Era assim que o passo morria com `titulo="—"` depois de favoritar.
    // Saindo de Favoritos (a outra chamada do spec) o título é ignorado na prática: aquela tela
    // tem `accessibility id:Back`, que é o primeiro caminho da cascata e retorna antes.
    //
    // Android — CI Run #13 (S23 Ultra e S24 Ultra), medido em log + vídeo: depois de
    // desfavoritar, a lista de Favoritos recarrega (skeleton -> vazia) e o banner do Insider
    // "Só no APP: 20% OFF" nasce ~2,5s depois, dura ~1,5s e some. O fechaBanner() do step rodou
    // 0,1s ANTES de ele renderizar, e o clique na seta caiu em cima do banner: fechou o banner
    // em vez de voltar, o app ficou em Favoritos (sem tab bar) e o abrirPerfil seguinte estourou
    // com "Nenhum dos seletores apareceu". No S23+ o mesmo banner apareceu e o clique ganhou a
    // corrida por 1s. Daí: esperar a tela parar, checar o banner imediatamente antes do clique
    // e confirmar que a tab bar apareceu — as duas telas de destino (Categorias e Account Menu)
    // têm tab bar, as duas de origem (listagem e Favoritos) não. Dois taps antes de desistir.
    async voltar() {
        if (process.env.PLATFORM === 'ios') return this.voltarIOS(this.tituloListagem);

        await this.aguardarTelaEstavel();

        // No app migrado o voltar do cabeçalho é um ViewGroup clicável SEM id. Não vai por texto:
        // o desc "Voltar" virou "Back" com o AVD em inglês (run local de 2026-10-01) e o teste não
        // pode depender de idioma. Nas duas telas de origem ele é o PRIMEIRO clicável da árvore,
        // no canto superior esquerdo:
        //   - Favoritos: [42,95][244,158] (captures-2026-09-29/38-favoritos.xml e 39, draft android/20);
        //   - listagem de Camisas: [42,95][291,158] (18-apos-favoritar.xml, draft android/11).
        // O PathView instance(0) do app antigo não existe mais.
        const candidatos = ['(//*[@clickable="true"])[1]'];

        const seta = await this.algumVisivel(candidatos, 20000);
        if (!seta) {
            throw new Error(
                `voltar() no Android: nenhum botão de voltar do cabeçalho apareceu em 20s (${candidatos.join(' | ')}). ` +
                'A tela de origem precisa de captura nova pelo mobile-ui-inspector — não insistir por tentativa e erro.'
            );
        }

        for (let tentativa = 1; tentativa <= 2; tentativa++) {
            await this.fechaBanner();
            await $(seta).click();
            if (await this.chegouNaTabBar()) {
                console.log(`↩ voltar: cabeçalho (1º clicável da tela)${tentativa > 1 ? ` (tap ${tentativa}/2)` : ''}`);
                await driver.pause(timewhait);
                return;
            }
            console.log(`⚠ voltar: tap ${tentativa}/2 no cabeçalho não levou à tab bar`);
        }

        throw new Error(
            `voltar() no Android: dois toques no botão de voltar do cabeçalho (${seta}) e a tab bar ` +
            '(tab-categories/tab-menu) não apareceu em 15s — o app não saiu da tela. Conferir no ' +
            'vídeo se um banner do Insider engoliu o toque ou se o botão mudou de posição na árvore.'
        );
    }

    // Roupas expandido -> Calças (spec 03-compra-cartao). SEM texto: Calças é o 4º
    // `sub-categories-button` (índice 3) na ordem da árvore. Os 7 botões são irmãos planos no mesmo
    // ViewGroup (o `sub-categories-container` não é pai deles). Conferido com lxml no dump
    // captures-2026-10-15-compra-cartao/22-roupas-expandido.xml: 7 nós, o 4º com desc "Calças"
    // [42,1754][1038,1804]; tocado na captura 23 com efeito (listagem com product-list e product-card-*).
    // Destino: listagem com o 1º product-card-* visível (a lista leva tempo para montar: 40 s).
    // iOS, build 1.21.7/352 (captures-2026-10-16-calcas-cadastro/, caps. 12–13, draft ios/41): mesma
    // regra, `name` no lugar de `resource-id`: o 4º `sub-categories-button` é Calças (1 nó, conferido
    // com lxml na cap. 12; tocado pelo inspetor com efeito: listagem com product-list e product-card-*).
    async abrirCalcas() {
        const ios = process.env.PLATFORM === 'ios';
        const botoes = ios ? '//*[@name="sub-categories-button"]' : '//*[@resource-id="sub-categories-button"]';
        const calcas = await $(`(${botoes})[4]`);
        const existe = await calcas.waitForExist({ timeout: 20000 }).then(() => true).catch(() => false);
        if (!existe) {
            throw new Error(
                `Calças: o 4º sub-categories-button não existe em 20s (há ${await $$(botoes).length}). ` +
                'Roupas está expandido? (clickRoupas)'
            );
        }
        if (!(await calcas.isDisplayed().catch(() => false))) {
            await calcas.scrollIntoView();
        }
        await this.fechaBanner();
        await calcas.click();

        const card = ios
            ? '-ios predicate string:name BEGINSWITH "product-card-"'
            : '-android uiautomator:new UiSelector().resourceIdMatches("product-card-.*")';
        const listagem = await $(card).waitForDisplayed({ timeout: 40000 }).then(() => true).catch(() => false);
        const lista = await $(seletorTestId('product-list')).isDisplayed().catch(() => false);
        if (!listagem || !lista) {
            throw new Error(
                `Calças: a listagem não abriu depois do toque no 4º sub-categories-button ` +
                `(product-list ${lista ? 'na tela' : 'ausente'}, product-card-* ${listagem ? 'na tela' : 'ausente em 40s'}).`
            );
        }
        console.log('👖 Listagem de Calças aberta');
        await driver.pause(timewhait);
    }

    // Tab bar do Android no app migrado: os testIDs `tab-categories` e `tab-menu` (ids estáveis,
    // sem texto) — as duas telas de destino do voltar() têm tab bar, as de origem não.
    // fonte: drafts/app-migrado/android/09-categorias.md (tab-*), captures-2026-09-29/15-categorias.xml
    // e 45-menu-logado.xml (com tab-*); 17-listagem-camisas.xml e 38-favoritos.xml (sem tab-*).
    private async chegouNaTabBar(): Promise<boolean> {
        const abas = [seletorTestId('tab-categories'), seletorTestId('tab-menu')];
        return (await this.algumVisivel(abas, 15000)) !== null;
    }

}

