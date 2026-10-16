import { BasePage, timewhait, seletorTestId } from "./BasePage";
import { driver, $ } from '@wdio/globals'

// Busca de produtos a partir da tela de Categorias. Seletores medidos em
// Android: .planning/drafts/app-migrado/android/captures-2026-10-14-compra-pix(-rodada2)/;
// iOS (build 349): .planning/drafts/app-migrado/ios/captures-2026-10-15-compra-pix/ (drafts 09, 21, 34).

const IOS = process.env.PLATFORM === 'ios';

// Card de produto (listagem, resultado da busca, carrossel): `product-card-<id do produto>`, nas
// duas plataformas. iOS: o 1º do documento é o 1º card da grade (capturas 20 e 31).
export const SELETOR_CARD_PRODUTO = IOS
    ? '-ios predicate string:name BEGINSWITH "product-card-"'
    : '-android uiautomator:new UiSelector().resourceIdMatches("product-card-.*")';

export class BuscaPage extends BasePage {

    // Lupa do canto superior direito de Categorias, SEM id nas duas plataformas (pedido de id no
    // ELEMENTOS-SEM-TESTID.md, seção 00, e no ELEMENTOS-SEM-TESTID-IOS.md).
    // Android: o SVG logo depois do título da tela. Conferido: 1 nó em todas as capturas de
    // Categorias (04a, 04b, 06d, 07a, 07i). O clique do WebDriver toca o centro do nó — o mesmo
    // ponto que abriu a busca na captura.
    // iOS: o Other logo depois do título (StaticText), precedido de dois Other sem name (fundo e
    // barra do cabeçalho). Conferido com lxml: 1 nó nas 7 capturas de Categorias do build 349
    // (Pix 17, 29, 30, 36; cartão 04, 16, 25) e 0 na Home, Menu, listagem, busca, PDP e Mochila.
    // Substitui o XPath por x/y da captura, que dependia do tamanho da tela.
    private readonly lupaCategorias = IOS
        ? '//XCUIElementTypeOther[not(@name)][preceding-sibling::*[1][self::XCUIElementTypeStaticText]]' +
          '[preceding-sibling::*[2][self::XCUIElementTypeOther][not(@name)]]' +
          '[preceding-sibling::*[3][self::XCUIElementTypeOther][not(@name)]]'
        : '//com.horcrux.svg.SvgView[preceding-sibling::*[1][@class="android.widget.TextView"]][following-sibling::*]';

    // Campo de busca: SEM id, único na tela de busca, que já abre focado (Android 04c; iOS: o
    // único TextField, captura 18).
    private readonly campoBusca = IOS ? '-ios class chain:**/XCUIElementTypeTextField' : '//android.widget.EditText';

    async abrirPelaLupaDeCategorias() {
        const categorias = await $(seletorTestId('category-button'))
            .waitForDisplayed({ timeout: 20000 })
            .then(() => true)
            .catch(() => false);
        if (!categorias) {
            throw new Error('Busca: a tela de Categorias não está aberta (nenhum category-button em 20s).');
        }

        await this.fechaBanner();
        const lupa = await $(this.lupaCategorias);
        await this.waitForElement(lupa);
        await lupa.click();

        const abriu = await $(this.campoBusca).waitForDisplayed({ timeout: 15000 }).then(() => true).catch(() => false);
        if (!abriu) {
            throw new Error('Busca: o toque na lupa de Categorias não abriu o campo de busca em 15s.');
        }
        console.log('🔍 Tela de busca aberta pela lupa de Categorias');
    }

    // Digita o termo e confirma pelo Enter do teclado (o que abriu os resultados nas capturas).
    // Sucesso = pelo menos um card de produto na tela de resultados.
    // iOS: `addValue` mantém o acento ("óculos"; o `mobile: keys` o perde — draft 21, rodada do
    // cartão) e a busca é enviada pela tecla "search" do teclado do sistema (captura 20). A tecla
    // não tem id: o rótulo é do teclado do iOS, só localiza.
    async buscar(termo: string) {
        const campo = await $(this.campoBusca);
        await this.waitForElement(campo);
        await campo.addValue(termo);
        if (IOS) {
            const tecla = await $('-ios predicate string:type == "XCUIElementTypeButton" AND label == "search"');
            await this.waitForElement(tecla);
            await tecla.click();
        } else {
            await driver.pressKeyCode(66); // KEYCODE_ENTER
        }

        const achou = await $(SELETOR_CARD_PRODUTO).waitForDisplayed({ timeout: 30000 }).then(() => true).catch(() => false);
        if (!achou) {
            throw new Error(`Busca por "${termo}": nenhum produto (product-card-*) apareceu nos resultados em 30s.`);
        }
        console.log(`✅ Busca por "${termo}" trouxe produtos`);
        await driver.pause(timewhait);
    }
}
