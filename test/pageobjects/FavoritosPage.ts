import { BasePage, seletorTestId } from "./BasePage";
import { driver, $, $$ } from '@wdio/globals'

// Escapa o nome do produto para ir dentro de aspas de um UiSelector / predicate.
function esc(valor: string): string {
    return valor.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Seletores de Favoritos do app migrado, iguais nas duas plataformas (testID):
//   - `flatlist-favorites`: a lista; SÓ EXISTE com itens (some quando a lista esvazia);
//   - `status-alert-icon`: o ícone do estado vazio. Estado vazio = este ícone visível e
//     `flatlist-favorites` ausente. NÃO se valida o texto da mensagem (regra de 2026-10-01).
// fonte: Android drafts/app-migrado/android/20-favoritos.md (capturas 38 e 39);
//        iOS drafts/app-migrado/ios/20-favoritos.md e 33-favoritos-vazio.md (capturas 41 e 42).
const LISTA = () => seletorTestId('flatlist-favorites');
const ESTADO_VAZIO = () => seletorTestId('status-alert-icon');

export class FavoritosPage extends BasePage {

    // O parâmetro é opcional para o spec continuar chamando sem argumento, como hoje.
    // Passando o nome do produto, o toque fica escopado no card certo em vez de confiar na
    // ordem da lista — vale a pena quando o cenário favorita algo que pode não ser o primeiro.
    //
    // Android: até o CI Run #13 este método era clique + pause(3000), sem conferir nada. Um
    // toque que caísse na sacola ou num banner passava verde e o favorito ficava na conta —
    // e o run seguinte daquele device herdava (o coração é toggle; ver a guarda em
    // CategoriasPage). Agora vale o mesmo critério do iOS: o produto tem que SUMIR da lista,
    // com poll de 30s porque desfavoritar é chamada de backend.
    async tirarSelecaoItem(produto?: string) {
        if (process.env.PLATFORM === 'ios') return this.tirarSelecaoItemIOS(produto);

        await this.waitForElement(await $(LISTA()), 30000);

        // O card é o ViewGroup clicável cujo content-desc é "Nome, R$ preço" (pode começar com
        // espaço; o nome capturado é aparado, então o match é por contains). Sem o nome do
        // produto sobra o primeiro card da lista. fonte: android/20-favoritos.md captura 38.
        const seletorCard = produto
            ? `-android uiautomator:new UiSelector().descriptionContains("${esc(produto)}")`
            : '-android uiautomator:new UiSelector().descriptionContains(", R$").instance(0)';

        await this.waitForElement(await $(seletorCard), 30000);
        const card = (await $(seletorCard)) as unknown as WebdriverIO.Element;

        const coracao = await this.coracaoDoCardAndroid(card, produto);

        await this.fechaBanner();
        await coracao.click();

        const sumiu = await driver
            .waitUntil(async () => !(await $(seletorCard).isDisplayed().catch(() => false)), {
                timeout: 30000,
                interval: 500,
            })
            .then(() => true)
            .catch(() => false);

        if (!sumiu) {
            throw new Error(
                `Desfavoritar no Android: ${produto ? `"${produto}"` : 'o card'} continua na lista de ` +
                'Favoritos 30s depois do toque no coração (action-button de maior x do card). O toque não ' +
                'removeu nada — conferir no vídeo se caiu na sacola, num banner do Insider, ou se a ' +
                'estrutura do card mudou. O favorito FICOU na conta deste device.'
            );
        }
        console.log(`💔 ${produto ? `"${produto}"` : 'Item'} removido de Favoritos`);

        // A lista recarrega depois da remoção (skeleton -> vazia, ~6s medidos no Run #13). Sair
        // daqui com a tela ainda animando é o que fazia o voltar() seguinte perder o toque.
        await this.aguardarTelaEstavel();
    }

    // Cada card de Favoritos tem DOIS action-button com o mesmo resource-id e sem desc: o
    // coração à direita (x=432 na captura 38) e a sacola à esquerda (x=55). A ordem no
    // documento NÃO é confiável (na captura o coração veio primeiro; no iOS, o contrário), então
    // a escolha é pela geometria: o de MAIOR x dentro do rect do card. Mesma regra do iOS.
    // fonte: android/20-favoritos.md ("Coração = maior x").
    private async coracaoDoCardAndroid(card: WebdriverIO.Element, produto?: string) {
        const posicaoCard = await card.getLocation();
        const tamanhoCard = await card.getSize();

        const dentro: { el: WebdriverIO.Element; x: number; y: number }[] = [];
        for (const botao of await $$(seletorTestId('action-button'))) {
            const p = await botao.getLocation().catch(() => null);
            if (!p) continue;
            const cabe =
                p.x >= posicaoCard.x && p.x <= posicaoCard.x + tamanhoCard.width &&
                p.y >= posicaoCard.y && p.y <= posicaoCard.y + tamanhoCard.height;
            if (cabe) dentro.push({ el: botao, x: p.x, y: p.y });
        }

        // Com menos de dois não dá para saber se o único é o coração ou a sacola: tocar errado
        // mandaria o item para a sacola.
        if (dentro.length < 2) {
            throw new Error(
                `Desfavoritar no Android: esperava 2 action-button (coração e sacola) no card` +
                `${produto ? ` de "${produto}"` : ''} ` +
                `[${Math.round(posicaoCard.x)},${Math.round(posicaoCard.y)} ${tamanhoCard.width}x${tamanhoCard.height}], ` +
                `achei ${dentro.length}. A estrutura do card mudou — recapturar a tela antes de mexer no seletor.`
            );
        }

        dentro.sort((a, b) => b.x - a.x);
        console.log(
            `💔 Desfavoritar: ${dentro.length} action-button no card ` +
            `(x = ${dentro.map((d) => Math.round(d.x)).join(', ')}); escolhido o de maior x = ${Math.round(dentro[0].x)}`
        );
        return dentro[0].el;
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
        const lista = LISTA();
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
    // direita. Daí escolher pelo maior x DENTRO do rect do card. No app migrado a medida é a
    // mesma (x=160 coração, x=21 sacola — draft ios/20, captura 41).
    private async coracaoDoCardIOS(produto?: string) {
        const { width: larguraJanela } = await driver.getWindowRect();
        const larguraMaxima = larguraJanela * 0.6;
        // Piso: descarta o StaticText do preço ("R$ 799,90", 52pt), filho do card, que também
        // casa com o predicate sem produto.
        const larguraMinima = larguraJanela * 0.3;

        // Sem o nome do produto sobra o primeiro card da lista. Com ele, o toque fica escopado
        // no card certo mesmo que a ordem mude. CONTAINS e não BEGINSWITH: no app migrado o
        // `name` do card começa com ESPAÇO (" Camisa Manga Longa...") e o nome capturado é
        // aparado. fonte: draft ios/20-favoritos.md, captura 41.
        const seletorCard = produto
            ? `-ios predicate string:name CONTAINS "${esc(produto)}"`
            : '-ios predicate string:name CONTAINS "R$"';

        // Mesmo filtro de largura da listagem: o container da lista (370pt) e o wrapper da tela
        // também casam com o predicate, e só o card é estreito (185pt numa janela de 402pt).
        let card: WebdriverIO.Element | undefined;
        const medidos: number[] = [];
        for (const candidato of await $$(seletorCard)) {
            const { width } = await candidato.getSize().catch(() => ({ width: Number.MAX_SAFE_INTEGER }));
            medidos.push(width);
            if (width > larguraMinima && width < larguraMaxima) { card = candidato; break; }
        }

        if (!card) {
            throw new Error(
                `Desfavoritar no iOS: nenhum card encontrado em Favoritos${produto ? ` para "${produto}"` : ''}. ` +
                `Larguras medidas: ${medidos.join(', ') || '(nenhum nó casou)'} ` +
                `(faixa ${Math.round(larguraMinima)}-${Math.round(larguraMaxima)}pt numa janela de ${larguraJanela}pt).`
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

    // Estado vazio de Favoritos, sem texto: `status-alert-icon` visível e `flatlist-favorites`
    // ausente. É o discriminador entre "o produto não está na lista" e "a lista está VAZIA": o
    // segundo caso, logo depois de favoritar, significa que o toque na listagem DESfavoritou um
    // item que já estava lá (conta suja de um run anterior).
    private mensagemListaVazia(produto: string): string {
        return (
            `Favoritos está VAZIO logo depois de favoritar "${produto}" (status-alert-icon visível e ` +
            'flatlist-favorites ausente). O coração é um toggle: se a conta deste device já tinha o ' +
            'item favoritado por um run anterior que morreu antes de desfavoritar, o toque na listagem ' +
            'o REMOVEU. Conferir no vídeo se o coração já estava preenchido ao abrir a listagem e ' +
            'desfavoritar manualmente nesta conta antes de rodar de novo.'
        );
    }

    // Presença do produto capturado na listagem (não valida texto do app: procura o nome que o
    // próprio teste leu em runtime). Espera até 30s por UM de dois destinos — o item ou o estado
    // vazio —, porque os favoritos vêm do BACKEND e a lista hidrata depois da tela abrir.
    async validaElememnto(texto: string) {
        if (process.env.PLATFORM === 'ios') return this.validaElementoIOS(texto);

        // Contains porque o desc do card é "Nome, R$ preço" e pode começar com espaço
        // (fonte: android/20-favoritos.md, captura 38).
        const item = `-android uiautomator:new UiSelector().descriptionContains("${esc(texto)}")`;
        const achado = await this.algumVisivel([item, ESTADO_VAZIO()], 30000);

        if (achado === item) {
            console.log(`✅ "${texto}" encontrado nos Favoritos`);
            return;
        }

        const listaPresente = await $(LISTA()).isDisplayed().catch(() => false);
        if (achado === ESTADO_VAZIO() && !listaPresente) throw new Error(this.mensagemListaVazia(texto));

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
        const lista = LISTA();

        // Primeiro a tela: sem isto, um timeout aqui nao distingue "lista vazia" de "tela que
        // nem chegou a abrir". A lista vazia NÃO tem flatlist-favorites (CI iOS Run #13, iPhone
        // 13), e no app migrado o estado vazio é o `status-alert-icon` (draft ios/33), então
        // espera-se por UM dos dois — sem ler texto.
        const achado = await this.algumVisivel([lista, ESTADO_VAZIO()], 30000);

        if (achado !== lista) {
            if (achado === ESTADO_VAZIO()) throw new Error(this.mensagemListaVazia(produto));

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
