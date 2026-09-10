import { BasePage, timewhait } from "./BasePage";
import { driver, $ } from '@wdio/globals'


export class FavoritosPage extends BasePage {

    // O parâmetro é opcional para o test.spec.ts continuar chamando sem argumento, como hoje.
    // Passando o nome do produto, o iOS escopa o toque no card certo em vez de confiar na
    // ordem da lista — vale a pena quando o cenário favorita algo que pode não ser o primeiro.
    async tirarSelecaoItem(produto?: string) {
        if (process.env.PLATFORM === 'ios') return this.tirarSelecaoItemIOS(produto);

        const element = await $("-android uiautomator:new UiSelector().className(\"com.horcrux.svg.PathView\").instance(2)");
        await this.waitForElement(element);
        await element.click();
        await driver.pause(timewhait);
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

    async validaElememnto(texto: string) {
        if (process.env.PLATFORM === 'ios') return this.validaElementoIOS(texto);

        const element = await $(`-android uiautomator:new UiSelector().text("${texto}")`);
        await this.elementVisible(element);
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
            throw new Error(
                'Favoritos: a lista "flatlist-favorites" nao apareceu em 30s — a tela de ' +
                'Favoritos nao chegou a abrir. Suspeitar do passo anterior (abrirFavoritos), ' +
                'nao da assercao.'
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


