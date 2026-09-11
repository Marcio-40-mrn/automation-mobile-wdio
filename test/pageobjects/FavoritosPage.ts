import { BasePage } from "./BasePage";
import { driver, $ } from '@wdio/globals'


export class FavoritosPage extends BasePage {

    // O parâmetro é opcional para o test.spec.ts continuar chamando sem argumento, como hoje.
    // Passando o nome do produto, o iOS escopa o toque no card certo em vez de confiar na
    // ordem da lista — vale a pena quando o cenário favorita algo que pode não ser o primeiro.
    //
    // Android: até o CI Run #13 este método era clique + pause(3000), sem conferir nada. Um
    // toque que caísse na sacola ou num banner passava verde e o favorito ficava na conta —
    // e o run seguinte daquele device herdava (o coração é toggle; ver a guarda em
    // CategoriasPage.favoritarPrimeiroProdutoIOS). Agora vale o mesmo critério do iOS: o
    // produto tem que SUMIR da lista, com poll de 30s porque desfavoritar é chamada de backend.
    // Com o nome do produto o critério é exato; sem ele, sobra a ausência do card (PathView do
    // coração) — mais fraco, e por isso o spec passa o nome.
    async tirarSelecaoItem(produto?: string) {
        if (process.env.PLATFORM === 'ios') return this.tirarSelecaoItemIOS(produto);

        const coracao = "-android uiautomator:new UiSelector().className(\"com.horcrux.svg.PathView\").instance(2)";
        const item = produto
            ? `-android uiautomator:new UiSelector().text("${produto}")`
            : coracao;

        await this.waitForElement(await $(coracao));
        if (produto) await this.waitForElement(await $(item));

        await this.fechaBanner();
        await $(coracao).click();

        const sumiu = await driver
            .waitUntil(async () => !(await $(item).isDisplayed().catch(() => false)), {
                timeout: 30000,
                interval: 500,
            })
            .then(() => true)
            .catch(() => false);

        if (!sumiu) {
            throw new Error(
                `Desfavoritar no Android: ${produto ? `"${produto}"` : 'o card'} continua na lista de ` +
                'Favoritos 30s depois do toque no coração (PathView instance 2). O toque não removeu ' +
                'nada — conferir no vídeo se caiu na sacola, num banner do Insider, ou se a ordem dos ' +
                'PathView mudou. O favorito FICOU na conta deste device.'
            );
        }
        console.log(`💔 ${produto ? `"${produto}"` : 'Item'} removido de Favoritos`);

        // A lista recarrega depois da remoção (skeleton -> vazia, ~6s medidos no Run #13). Sair
        // daqui com a tela ainda animando é o que fazia o voltar() seguinte perder o toque.
        await this.aguardarTelaEstavel();
    }

    // Desfavoritar no iOS tem duas armadilhas:
    //
    // 1. Cada card tem DOIS action-button (o coração à direita e a sacola à esquerda), nenhum
    //    com label — quatro matches para dois cards. E a ordem de enumeração do $$ não é a
    //    ordem do xpath posicional, então um índice tirado de uma não serve para a outra:
    //    dá para acabar tocando na sacola achando que é o coração. Na ordem do documento, o
    //    coração vem primeiro dentro do card, e é isso que o [1] pega.
    // 2. O item some da lista na hora, sem toast, sem diálogo e sem estado intermediário. Não
    //    há atributo mudando num card que continua lá — o critério de sucesso é a AUSÊNCIA.
    private async tirarSelecaoItemIOS(produto?: string) {
        const lista = "accessibility id:flatlist-favorites";
        await (await $(lista)).waitForDisplayed({ timeout: 30000 });
        const antes = (await $(lista).getAttribute('label').catch(() => '')) ?? '';

        const coracao = await this.coracaoDoCardIOS(produto);
        await this.fechaBanner();
        await coracao.click();

        // Antes havia `pause(timewhait)` e UMA leitura. Desfavoritar é chamada de backend (os
        // favoritos persistem por conta, draft 22): se a remoção passar de 3s, a leitura única
        // acusa "não mudou" com o toque tendo funcionado. Poll resolve.
        //
        // A lista some inteira quando era o último favorito — o catch cobre esse caso, e o
        // conteúdo diferente do de antes já prova que o item saiu.
        let depois = antes;
        const mudou = await driver
            .waitUntil(
                async () => {
                    depois = (await $(lista).getAttribute('label').catch(() => '')) ?? '';
                    return depois !== antes;
                },
                { timeout: 30000, interval: 500 }
            )
            .then(() => true)
            .catch(() => false);

        if (!mudou) {
            throw new Error(
                'Desfavoritar no iOS: o conteúdo de flatlist-favorites não mudou em 30s depois do ' +
                `toque no coração.\nAntes:  ${antes}\nDepois: ${depois}\n` +
                'Se o conteúdo é idêntico, o toque não removeu nada — conferir no log qual ' +
                'action-button foi escolhido (o coração é o de MAIOR x dentro do card).'
            );
        }
        console.log(`💔 ${produto ? `"${produto}"` : 'Item'} removido de Favoritos`);

        // O label muda ainda no skeleton; a lista vazia só termina de renderizar ~3-4s depois
        // (Run #13, dois iPhones). Voltar com a tela animando perdia o tap no Back.
        await this.aguardarTelaEstavel();
    }

    // Devolve o coração do card, escolhido por POSIÇÃO.
    //
    // O seletor anterior era `class chain **/XCUIElementTypeOther[name == "action-button"][1]`,
    // e ele estava clicando na SACOLA. Medido na tela de Favoritos, numa sessão de Remote
    // Access em 2026-09-10:
    //
    //   card do produto ......... [16,131 181x457]
    //   action-button (coração) . x=155  <- direita
    //   action-button (sacola) .. x=21   <- esquerda
    //   class chain [1] ......... x=21   <- resolvia para a SACOLA
    //
    // Ou seja: o toque mandava o item para a sacola, a lista de favoritos não mudava, e o
    // método acusava "o conteúdo não mudou depois do toque no coração" — mensagem certa sobre o
    // sintoma e enganosa sobre a causa. O comentário original já avisava do risco ("dá para
    // acabar tocando na sacola achando que é o coração"); faltava medir.
    //
    // A ordem de enumeração não é confiável para desambiguar (nem a do `$$`, nem a da class
    // chain), mas a geometria é: os dois ícones ficam lado a lado no topo do card, coração à
    // direita. Daí escolher pelo maior x DENTRO do rect do card.
    private async coracaoDoCardIOS(produto?: string) {
        const { width: larguraJanela } = await driver.getWindowRect();
        const larguraMaxima = larguraJanela * 0.6;

        // Sem o nome do produto sobra o primeiro card da lista. Com ele, o toque fica escopado
        // no card certo mesmo que a ordem mude.
        const seletorCard = produto
            ? `-ios predicate string:name BEGINSWITH "${produto}"`
            : '-ios predicate string:name CONTAINS "R$"';

        // Mesmo filtro de largura da listagem: o container da lista (370pt) e o wrapper da tela
        // também casam com o predicate, e só o card é estreito (181pt numa janela de 402pt).
        let card: WebdriverIO.Element | undefined;
        const medidos: number[] = [];
        for (const candidato of await $$(seletorCard)) {
            const { width } = await candidato.getSize().catch(() => ({ width: Number.MAX_SAFE_INTEGER }));
            medidos.push(width);
            if (width > 0 && width < larguraMaxima) { card = candidato; break; }
        }

        if (!card) {
            throw new Error(
                `Desfavoritar no iOS: nenhum card encontrado em Favoritos${produto ? ` para "${produto}"` : ''}. ` +
                `Larguras medidas: ${medidos.join(', ') || '(nenhum nó casou)'} ` +
                `(limite ${Math.round(larguraMaxima)}pt numa janela de ${larguraJanela}pt).`
            );
        }

        const posicaoCard = await card.getLocation();
        const tamanhoCard = await card.getSize();

        const dentro: { el: WebdriverIO.Element; x: number; y: number }[] = [];
        for (const botao of await $$('accessibility id:action-button')) {
            const p = await botao.getLocation().catch(() => null);
            if (!p) continue;
            const cabe =
                p.x >= posicaoCard.x && p.x <= posicaoCard.x + tamanhoCard.width &&
                p.y >= posicaoCard.y && p.y <= posicaoCard.y + tamanhoCard.height;
            if (cabe) dentro.push({ el: botao, x: p.x, y: p.y });
        }

        if (!dentro.length) {
            throw new Error(
                `Desfavoritar no iOS: nenhum action-button dentro do card ` +
                `[${Math.round(posicaoCard.x)},${Math.round(posicaoCard.y)} ${tamanhoCard.width}x${tamanhoCard.height}]. ` +
                'A estrutura do card mudou — recapturar a tela antes de mexer no seletor.'
            );
        }

        dentro.sort((a, b) => b.x - a.x);
        console.log(
            `💔 Desfavoritar: ${dentro.length} action-button no card ` +
            `(x = ${dentro.map((d) => Math.round(d.x)).join(', ')}); escolhido o de maior x = ${Math.round(dentro[0].x)}`
        );
        return dentro[0].el;
    }

    // Texto do estado vazio de Favoritos, igual nas duas plataformas (medido no CI Run #13:
    // S23/S24 Ultra, iPhone 13 e 15 Pro Max — o app roda em inglês nos devices do Device Farm).
    // É o discriminador entre "o produto não está na lista" e "a lista está VAZIA": o segundo
    // caso, logo depois de favoritar, significa que o toque na listagem DESfavoritou um item
    // que já estava lá (conta suja de um run anterior). No Android a árvore não expõe o estado
    // do coração, então esta é a primeira chance de nomear o problema.
    private static readonly TEXTO_LISTA_VAZIA = "You don't have any favorite products yet!";

    private mensagemListaVazia(produto: string): string {
        return (
            `Favoritos está VAZIO logo depois de favoritar "${produto}" ("${FavoritosPage.TEXTO_LISTA_VAZIA}"). ` +
            'O coração é um toggle: se a conta deste device já tinha o item favoritado por um run ' +
            'anterior que morreu antes de desfavoritar, o toque na listagem o REMOVEU. Conferir no ' +
            'vídeo se o coração já estava preenchido ao abrir a listagem e desfavoritar manualmente ' +
            'nesta conta antes de rodar de novo.'
        );
    }

    async validaElememnto(texto: string) {
        if (process.env.PLATFORM === 'ios') return this.validaElementoIOS(texto);

        const element = await $(`-android uiautomator:new UiSelector().text("${texto}")`);
        const achou = await element
            .waitForDisplayed({ timeout: 30000 })
            .then(() => true)
            .catch(() => false);
        if (achou) {
            console.log(`✅ "${texto}" encontrado nos Favoritos`);
            return;
        }

        const vazia = await $(`-android uiautomator:new UiSelector().text("${FavoritosPage.TEXTO_LISTA_VAZIA}")`)
            .isDisplayed()
            .catch(() => false);
        if (vazia) throw new Error(this.mensagemListaVazia(texto));

        throw new Error(
            `Favoritos: "${texto}" não apareceu na lista em 30s e a tela não está no estado vazio. ` +
            'Ou a tela de Favoritos não abriu (suspeitar do abrirFavoritos), ou o nome capturado na ' +
            'listagem não bate com o exibido aqui.'
        );
    }

    // A versao anterior fazia expect($('-ios predicate string:name BEGINSWITH <produto>'))
    // .toBeDisplayed(). Dois problemas somados, os dois medidos no CI iOS Run #7:
    //
    // 1. SEM ESPERA REAL. O wdio.conf.ts nao define `waitforTimeout`, entao o expect cai no
    //    default de 3s — e os favoritos vem do BACKEND (persistem por conta, draft 22), com a
    //    lista hidratando depois da tela abrir. Assertar em 3s e assertar sobre tela vazia.
    // 2. MENSAGEM INUTIL. Falhando, o erro so repetia o seletor gigante e nao dizia o que a
    //    lista realmente continha — foi preciso vasculhar log e video para descobrir que o
    //    defeito era o NOME do produto, capturado sujo la na listagem.
    //
    // Agora a ancora e o `flatlist-favorites`, que o draft 22 registra como marcador de
    // presenca da tela E cujo `label` e a concatenacao dos nomes+precos de TODOS os itens. Uma
    // consulta so, sem indexar card por posicao (que o proprio draft marca como fragil).
    private async validaElementoIOS(produto: string) {
        const lista = "accessibility id:flatlist-favorites";

        // Primeiro a tela: sem isto, um timeout aqui nao distingue "lista vazia" de "tela que
        // nem chegou a abrir".
        const abriu = await (await $(lista))
            .waitForDisplayed({ timeout: 30000 })
            .then(() => true)
            .catch(() => false);

        if (!abriu) {
            // A lista vazia NÃO tem flatlist-favorites (CI iOS Run #13, iPhone 13): sem esta
            // checagem o erro culpava o abrirFavoritos por uma tela que abriu, só que vazia.
            // O nó é um StaticText com name igual ao texto (page source do Run #13); label cobre
            // o caso de o name vir agregado.
            const t = FavoritosPage.TEXTO_LISTA_VAZIA;
            const vazia = await $(`-ios predicate string:name == "${t}" OR label == "${t}"`)
                .isDisplayed()
                .catch(() => false);
            if (vazia) throw new Error(this.mensagemListaVazia(produto));

            throw new Error(
                'Favoritos: a lista "flatlist-favorites" nao apareceu em 30s e a tela nao esta no ' +
                'estado vazio — a tela de Favoritos nao chegou a abrir. Suspeitar do passo anterior ' +
                '(abrirFavoritos), nao da assercao.'
            );
        }

        // O label so se estabiliza depois da hidratacao; por isso poll, e nao leitura unica.
        let conteudo = '';
        const achou = await driver
            .waitUntil(
                async () => {
                    conteudo = (await $(lista).getAttribute('label').catch(() => '')) ?? '';
                    return conteudo.includes(produto);
                },
                { timeout: 30000, interval: 500 }
            )
            .then(() => true)
            .catch(() => false);

        if (!achou) {
            throw new Error(
                `Favoritos: "${produto}" nao apareceu na lista em 30s.\n` +
                `A lista contem: ${conteudo || '(vazia)'}\n` +
                'Se o texto procurado trouxer algo como "Filter and sort" ou o titulo da tela, ' +
                'o defeito esta na CAPTURA do nome em ' +
                'CategoriasPage.favoritarPrimeiroProdutoIOS, nao aqui.'
            );
        }

        console.log(`✅ "${produto}" encontrado nos Favoritos`);
    }


}


