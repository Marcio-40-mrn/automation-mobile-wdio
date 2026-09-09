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
        await this.waitForElement(await $(lista));
        const antes = (await $(lista).getAttribute('label').catch(() => '')) ?? '';

        const seletor = produto
            ? `-ios class chain:**/XCUIElementTypeOther[\`name BEGINSWITH "${produto}"\`][1]/**/XCUIElementTypeOther[\`name == "action-button"\`][1]`
            : '-ios class chain:**/XCUIElementTypeOther[`name == "action-button"`][1]';

        const coracao = await $(seletor);
        await this.waitForElement(coracao);
        await coracao.click();
        await driver.pause(timewhait);

        // A lista some inteira quando era o último favorito — o catch cobre esse caso, e o
        // conteúdo diferente do de antes já prova que o item saiu.
        const depois = (await $(lista).getAttribute('label').catch(() => '')) ?? '';
        if (depois === antes) {
            throw new Error('Desfavoritar no iOS: o conteúdo de flatlist-favorites não mudou depois do toque no coração');
        }
    }

    // No iOS o name do card concatena nome e preço ("<nome> R$\xa0<preço>"), então a
    // comparação tem que ser por prefixo — um match exato pelo nome limpo nunca casaria.
    async validaElememnto(texto: string) {
        const element = await $(
            process.env.PLATFORM === 'ios'
                ? `-ios predicate string:name BEGINSWITH "${texto}"`
                : `-android uiautomator:new UiSelector().text(\"${texto}\")`
        );
        await this.elementVisible(element);
    }


}


