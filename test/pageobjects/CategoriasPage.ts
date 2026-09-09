import { BasePage, timewhait } from "./BasePage";
import { driver, $ } from '@wdio/globals'

export class CategoriasPage extends BasePage {

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
    async clickRoupas() {
        if (process.env.PLATFORM === 'ios') {
            const element = await $('-ios predicate string:name == "category-button" AND label == "Roupas"');
            await this.waitForElement(element);
            await element.click();
            await driver.pause(timewhait);
            return;
        }

        const element = await $("accessibility id:Roupas");
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
    }

    // Mesmo padrão do clickRoupas, um nível abaixo: as subcategorias do acordeão aberto usam
    // sub-categories-button repetido, desambiguado pelo label.
    async abrirCamisas() {
        if (process.env.PLATFORM === 'ios') {
            const element = await $('-ios predicate string:name == "sub-categories-button" AND label == "Camisas"');
            await this.waitForElement(element);
            await element.click();
            await driver.pause(timewhait);
            return;
        }

        const element = await $("accessibility id:Camisas");
        // const element = await $('//*[@text="Camisas" or @content-desc="Camisas"]');
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
    }

    async selecionarProduto(texto: string) {
        const element = await $(`-android uiautomator:new UiSelector().text(\"${texto}\")`);
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
    }

    // Favorita a primeira camisa que a lista mostrar, direto no card, e devolve o nome para a
    // validação nos favoritos usar depois. Amarrar o teste a um nome fixo não funciona: o
    // catálogo muda entre versões e o UiSelector().text() é match exato.
    //
    // Favoritar aqui, e não na página do produto, deixa o teste uma tela antes na navegação:
    // um único voltar() já chega em categorias, que é a tela onde a aba Perfil existe (a
    // listagem não tem tab-* nenhum).
    //
    // ATENÇÃO: o estado favoritado NÃO é exposto na árvore de acessibilidade. Depois do
    // clique o action-button continua com selected="false", checked="false" e content-desc
    // vazio — só o pixel do coração muda de contorno para vermelho. Não dá para assertar
    // "favoritou" nesta tela; a validação é na tela de Favoritos.
    //
    // O nome sai do content-desc do card, que vem como "Nome, R$ preço"; o preço é cortado
    // para sobrar o texto que a tela de favoritos exibe.
    //
    // descriptionMatches em vez de description() porque description() é match exato; o
    // "{10,}" descarta o título da tela ("Camisas", 7 caracteres), que também é clicável e
    // aparece antes dos produtos na árvore.
    async favoritarPrimeiroProduto(): Promise<string> {
        if (process.env.PLATFORM === 'ios') return this.favoritarPrimeiroProdutoIOS();

        // Timeout folgado: a lista tem 150 produtos e demora a montar depois do clique na
        // categoria — com os 20s do waitForElement ela terminava de aparecer junto com o estouro.
        const card = await $('-android uiautomator:new UiSelector().descriptionMatches("Camisa.{10,}").instance(0)');
        await card.waitForDisplayed({ timeout: 40000 });

        const descricao = (await card.getAttribute('content-desc')) ?? '';
        const nome = descricao.replace(/,\s*R\$[\s\S]*$/, '').trim();
        console.log(`🛍 Produto escolhido: ${nome}`);

        // A lista segue hidratando depois do primeiro card aparecer; sem esta pausa o clique
        // sai cedo demais e o coração não reage.
        await driver.pause(timewhait);

        const coracao = await $('-android uiautomator:new UiSelector().resourceId("action-button").instance(0)');
        await coracao.waitForDisplayed({ timeout: 20000 });
        await coracao.click();
        await driver.pause(timewhait);

        return nome;
    }

    // Mesma ideia da versão Android — pegar o primeiro card que a lista mostrar, ler o nome e
    // favoritar ali —, mas três detalhes da árvore iOS mudam o código:
    //
    // 1. O nome e o preço vêm concatenados no MESMO name do card: "<nome> R$\xa0<preço>".
    //    Não há a vírgula que o content-desc do Android usa, e o espaço depois do "R$" é
    //    non-breaking (U+00A0). O regex do Android (/,\s*R\$.../) não casaria aqui.
    // 2. O "CONTAINS R$" é obrigatório: sem ele, o BEGINSWITH "Camisa" casa antes com o
    //    título da tela ("Camisas", em y=74), que vem primeiro na ordem do documento. É o
    //    equivalente ao "{10,}" do descriptionMatches do Android, que existe pelo mesmo motivo.
    // 3. O action-button (o coração) não tem label NENHUM e se repete 8 vezes na grade — sem
    //    resourceId como no Android, a única saída é indexar por posição. Como isso é frágil
    //    (mudou a ordem da grade, mudou o alvo), conferimos que o coração escolhido cai dentro
    //    do card cujo nome acabamos de ler, e falhamos explícito se não cair.
    private async favoritarPrimeiroProdutoIOS(): Promise<string> {
        const card = await $('-ios class chain:**/XCUIElementTypeOther[`name BEGINSWITH "Camisa" AND name CONTAINS "R$"`][1]');
        await card.waitForDisplayed({ timeout: 40000 });

        const bruto = (await card.getAttribute('name')) ?? '';
        const nome = bruto.replace(/\s*R\$[\s\S]*$/, '').trim();
        console.log(`🛍 Produto escolhido: ${nome}`);

        // A grade segue hidratando depois do primeiro card aparecer, igual ao Android.
        await driver.pause(timewhait);

        const coracao = await $('-ios class chain:**/XCUIElementTypeOther[`name == "action-button"`][1]');
        await coracao.waitForDisplayed({ timeout: 20000 });

        const posicaoCoracao = await coracao.getLocation();
        const posicaoCard = await card.getLocation();
        const tamanhoCard = await card.getSize();
        const dentroDoCard =
            posicaoCoracao.x >= posicaoCard.x &&
            posicaoCoracao.x <= posicaoCard.x + tamanhoCard.width;

        if (!dentroDoCard) {
            throw new Error(
                `O primeiro action-button (x=${posicaoCoracao.x}) está fora do primeiro card ` +
                `(x=${posicaoCard.x}..${posicaoCard.x + tamanhoCard.width}): a ordem da grade mudou e o ` +
                `índice não aponta mais para o produto lido ("${nome}")`
            );
        }

        await coracao.click();
        await driver.pause(timewhait);

        // O estado favoritado não é assertável aqui em nenhuma das duas plataformas. No iOS o
        // action-button-icon muda de bounds (32x33 -> 20x21), mas isso é efeito colateral do
        // SVG preenchido, específico deste componente nesta tela — na tela de Favoritos o
        // mesmo ícone não muda de tamanho. Não usar como asserção; a validação é em Favoritos.
        return nome;
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

    // Os dois caminhos são frágeis, por motivos diferentes: o Android depende da posição na
    // ÁRVORE (instância 0 de uma classe de ícone SVG — quebra se a ordem dos ícones mudar) e o
    // iOS, da posição na TELA, porque a listagem de produtos é a única tela do fluxo sem
    // botão de voltar identificável. Ver voltarIOS() no BasePage.
    async voltar() {
        if (process.env.PLATFORM === 'ios') return this.voltarIOS();

        const element = await $("-android uiautomator:new UiSelector().className(\"com.horcrux.svg.PathView\").instance(0)");
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
    }

}

