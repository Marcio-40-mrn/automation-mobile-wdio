import {
    BasePage, timewhait, seletorTestId, scrollUntilVisible, scrollUntilVisibleParaCima,
    scrollFinger, scrollFingerParaCima,
} from "./BasePage";
import { driver, $, $$ } from '@wdio/globals'
import { anexarPrint } from "../utils/allure-helpers";

// Cadastro e edição de endereço, a partir do checkout de uma conta nova.
// Android 1.23.1/559: drafts 16 e 39 (`captures-2026-11-23-build559-endereco/`).
// iOS 1.23.2/408: drafts 16 e 51 (`captures-2026-11-24-endereco/`). No iOS não existem
// os testIDs de campo do Android (só `address-state-input` e `address-save-button`),
// e não há TextField. O campo vazio é um Other com o placeholder no `name`; preenchido,
// `name` e `value` ficam vazios — o CEP não se lê do campo. A prova do CEP no iOS é o
// StaticText da Entrega que contém os dígitos (`21-depois.xml`: "ZIP code - 01310100")
// e o `name` do cartão na lista (`22-lista.xml`).

const IOS = process.env.PLATFORM === 'ios';

const ID_SALVAR = 'address-save-button';
const PAUSA_TECLA_IOS = 260;
const SEGURAR_APAGAR_IOS = 2600;
// Abaixo do cabeçalho "New delivery address" (pt). Campo com y menor que isso está escondido em cima.
const TOPO_VISIVEL_IOS = 110;

// Erro do CEP, sem ler o texto no Android: o SvgView logo depois do contêiner do campo.
// Conferido no draft 39 (1 nó com erro, 0 sem).
const ERRO_CEP_ANDROID =
    '//*[@resource-id="address-zip-input"]/../following-sibling::*[1][self::com.horcrux.svg.SvgView]';
// iOS: StaticText sem id. O predicate `accessible` não foi testado na captura; a presença do name basta.
const ERRO_CEP_IOS = '-ios predicate string:type == "XCUIElementTypeStaticText" AND name == "CEP inválido"';

// "Alterar" sem id. XPath por irmãos — NÃO usar `following::` (quebra no UiAutomator2, draft 16).
// Casa também com uma opção de frete: só usar com Meus endereços na tela.
const ALTERAR_ANDROID =
    '//*[@clickable="true" and following-sibling::*[1][@clickable="true" and count(android.widget.TextView)>=3]]';
// O card wrapper também traz "Alterar" no name. O nó do botão é o Other cujo name é exatamente "Alterar"
// (`22-lista.xml`). Clicar o card seleciona o endereço e volta à Entrega.
const ALTERAR_IOS = '-ios predicate string:type == "XCUIElementTypeOther" AND name == "Alterar"';

const CARTAO_IOS = '-ios predicate string:type == "XCUIElementTypeOther" AND name BEGINSWITH "Receba em"';

// Sem testID. Android: TextView `text` (draft 17, não clicável na árvore; o toque no centro abre a lista).
// iOS: StaticText com esse name (`21-depois.xml`; o interno é accessible=true).
const TROCAR_ENDERECO_ANDROID = '//android.widget.TextView[@text="+ Add or choose another address"]';
const TROCAR_ENDERECO_IOS =
    '//XCUIElementTypeStaticText[@name="+ Add or choose another address" and @accessible="true"]';

const PLACEHOLDER_CEP_IOS =
    '-ios predicate string:type == "XCUIElementTypeOther" AND name == "Digite o seu CEP"';

export type EnderecoLido = { rua: string; bairro: string; textoNaArvore: boolean };

function soDigitos(valor: string): string {
    return valor.replace(/\D/g, '');
}

export class EnderecoPage extends BasePage {

    // Campo iOS, vazio ou preenchido. O Other acessível é o irmão que segue o rótulo
    // (`13-checkout.xml` vazio e `19`/`25` preenchidos: a ordem não muda).
    // Município: o [1] é o `address-state-input`. Bairro: o [1] é o número.
    private campoIOS(rotulo: string, indice = 1): string {
        return `//XCUIElementTypeStaticText[@name="${rotulo}" and @accessible="false"]` +
            `/following-sibling::XCUIElementTypeOther[@accessible="true"][${indice}]`;
    }

    private async naEntrega(): Promise<boolean> {
        return $(seletorTestId('delivery-option-slas')).isExisting().catch(() => false);
    }

    // "Saiu do formulário" NÃO é `!address-save-button.isDisplayed()`: o teclado cobre o botão
    // e isso dá falso positivo. Saiu = a Entrega entrou na árvore, ou o botão saiu dela.
    private async noFormulario(): Promise<boolean> {
        if (await this.naEntrega()) return false;
        return $(seletorTestId(ID_SALVAR)).isExisting().catch(() => false);
    }

    private async naLista(): Promise<boolean> {
        const volta = await $(seletorTestId('header-back-button')).isExisting().catch(() => false);
        const novo = await $(seletorTestId('pressable')).isExisting().catch(() => false);
        const form = await $(seletorTestId(ID_SALVAR)).isExisting().catch(() => false);
        return volta && novo && !form;
    }

    private async erroNoCep(): Promise<boolean> {
        const seletor = IOS ? ERRO_CEP_IOS : ERRO_CEP_ANDROID;
        return $(seletor).isExisting().catch(() => false);
    }

    // ---------- teclado e digitação ----------

    // iOS: a captura fechou o teclado tocando o StaticText "Estado" com o y na tela.
    // Não tocar um título que já rolou para fora.
    private async fecharTeclado() {
        if (!IOS) {
            if (await driver.isKeyboardShown().catch(() => false)) {
                await driver.hideKeyboard().catch(() => undefined);
                await driver.pause(500);
            }
            return;
        }
        const teclado = '-ios class chain:**/XCUIElementTypeKeyboard';
        if (!(await $(teclado).isExisting().catch(() => false))) return;
        const { height } = await driver.getWindowRect();
        for (const el of await $$(`//XCUIElementTypeStaticText[@name="Estado" and @accessible="true"]`)) {
            if (!(await el.isDisplayed().catch(() => false))) continue;
            const { y } = await el.getLocation();
            const { height: h } = await el.getSize();
            if (y >= 0 && y + h > 0 && y + h <= height) {
                await el.click().catch(() => undefined);
                await driver.pause(500);
                return;
            }
        }
        console.log('⚠ Teclado iOS aberto e "Estado" está fora da tela — não toco no título');
    }

    private async rectEstavel(seletor: string) {
        let anterior = await driver.getElementRect(await $(seletor).elementId);
        for (let i = 0; i < 15; i++) {
            await driver.pause(300);
            const atual = await driver.getElementRect(await $(seletor).elementId);
            if (atual.x === anterior.x && atual.y === anterior.y && atual.height === anterior.height) return atual;
            anterior = atual;
        }
        return anterior;
    }

    // Toque no centro do Other. Se o campo está atrás do teclado, arrasta o formulário antes
    // (o mesmo problema do cadastro: o rect no meio da rolagem manda o toque para o teclado).
    private async focarIOS(seletor: string) {
        const teclado = '-ios class chain:**/XCUIElementTypeKeyboard';
        for (let tentativa = 1; tentativa <= 3; tentativa++) {
            const existe = await $(seletor).waitForExist({ timeout: 10000 }).then(() => true).catch(() => false);
            if (!existe) throw new Error(`Endereço (iOS): o campo não está na árvore (${seletor}).`);
            let rect = await this.rectEstavel(seletor);
            // Sem teclado, o campo pode estar fora da tela: o CEP fica ACIMA depois do Destinatário
            // (mesmo caso do Android no AVD 1.23.3/562, 2026-11-25). Decide pelo rect — o
            // isDisplayed do iOS não é confiável neste app. Acima → rola para cima; abaixo → para baixo.
            if (!(await $(teclado).isExisting().catch(() => false))) {
                const { height } = await driver.getWindowRect();
                // O Save é fixo no rodapé ([16,792 370x49] no draft 51) e cobre o campo que fica atrás
                // dele: no iOS 2026-11-25 o Destinatário em y 800 recebeu 3 toques que caíram no Save.
                // O limite de baixo é o topo do Save; sem ele, a altura da janela.
                let limiteInferior = height - 40;
                const save = await $(seletorTestId(ID_SALVAR));
                if (await save.isExisting().catch(() => false)) {
                    const s = await driver.getElementRect(await save.elementId);
                    if (s.y > height * 0.5) limiteInferior = s.y - 8;
                }
                for (let i = 0; i < 4; i++) {
                    const acima = rect.y < TOPO_VISIVEL_IOS;
                    const abaixo = rect.y + rect.height > limiteInferior;
                    if (!acima && !abaixo) break;
                    console.log(`↕ Campo fora da tela (${acima ? 'acima' : 'abaixo'}, y=${Math.round(rect.y)}) — rolando`);
                    if (acima) await scrollFingerParaCima();
                    else await scrollFinger();
                    await driver.pause(500);
                    rect = await this.rectEstavel(seletor);
                }
            }
            if (await $(teclado).isExisting().catch(() => false)) {
                const tec = await driver.getElementRect(await $(teclado).elementId);
                const xMeio = Math.round(tec.x + tec.width / 2);
                if (rect.y < 80) {
                    await this.arrastar(xMeio, Math.round(tec.y * 0.35), xMeio, Math.round(tec.y - 20), 500);
                    rect = await this.rectEstavel(seletor);
                } else {
                    const sobra = rect.y + rect.height + 16 - tec.y;
                    if (sobra > 0) {
                        const yIni = Math.round(tec.y - 20);
                        const yFim = Math.max(Math.round(yIni - sobra - 40), 80);
                        await this.arrastar(xMeio, yIni, xMeio, yFim, 500);
                        rect = await this.rectEstavel(seletor);
                    }
                }
            }
            await this.tocarPonto(rect.x + rect.width / 2, rect.y + rect.height / 2);
            if (await $(teclado).waitForExist({ timeout: 5000 }).then(() => true).catch(() => false)) return;
            console.log(`⚠ Toque ${tentativa}/3 no campo não abriu o teclado`);
        }
        throw new Error('Endereço (iOS): o toque no campo não abriu o teclado em 3 tentativas.');
    }

    private async limparCampoIOS() {
        const seletor = '-ios predicate string:type == "XCUIElementTypeKey" AND (name == "delete" OR name == "Delete")';
        if (!(await $(seletor).waitForExist({ timeout: 5000 }).then(() => true).catch(() => false))) {
            throw new Error('Endereço (iOS): a tecla de apagar (delete/Delete) não está no teclado.');
        }
        await this.segurarElemento(seletor, SEGURAR_APAGAR_IOS);
        await driver.pause(300);
    }

    // Nome próprio: o `digitarIOS` da BasePage é protected e usa addValue + maxTypingFrequency.
    // Aqui o campo não é TextField — toque no Other, delete segurado e tecla W3C.
    private async digitarCampoIOS(seletor: string, valor: string) {
        await this.focarIOS(seletor);
        await this.limparCampoIOS();
        for (const caractere of valor) {
            await this.teclaW3C(caractere);
            await driver.pause(PAUSA_TECLA_IOS);
        }
        await driver.pause(500);
    }

    private async digitarAndroid(id: string, valor: string) {
        const campo = await $(seletorTestId(id));
        // O campo pode estar acima (CEP depois do Destinatário) ou abaixo (Destinatário) da tela:
        // tenta para cima e, se não aparecer, para baixo.
        if (!(await campo.isDisplayed().catch(() => false))) {
            if (!(await scrollUntilVisibleParaCima(campo, 4))) {
                await scrollUntilVisible(campo, 4);
            }
        }
        await this.waitForElement(campo);
        await campo.click();
        // Teclado por cima do campo: o toque retorna OK e o campo sai da árvore (teclado numérico da Samsung,
        // mais alto que o Gboard; S23+ e S26 Ultra nos CI Runs #60, #51 e #61, Android 1.23.3/562 e 1.23.1/557).
        // Fecha o teclado, espera o campo voltar e digita sem tocar de novo (o addValue grava o texto no campo
        // sem depender do teclado); nesse caminho o valor é conferido. Só Android (Marcio, 2026-11-26).
        if (!(await $(seletorTestId(id)).isExisting().catch(() => false))) {
            console.log(`⚠ ${id}: o campo saiu da árvore depois do toque (teclado por cima) — fechando o teclado e digitando`);
            await this.fecharTeclado();
            const voltou = await $(seletorTestId(id)).waitForDisplayed({ timeout: 5000 }).then(() => true).catch(() => false);
            if (!voltou) {
                await anexarPrint(`Endereço — ${id} fora da árvore`);
                throw new Error(`Endereço: o campo ${id} saiu da árvore depois do toque e não voltou em 5s com o teclado fechado.`);
            }
            const deNovo = await $(seletorTestId(id));
            await deNovo.clearValue();
            await deNovo.addValue(valor);
            await driver.pause(500);
            const lido = await this.textoDoCampo(id);
            const confere = /^\d+$/.test(valor) ? soDigitos(lido) === valor : lido === valor.trim();
            if (!confere) {
                await anexarPrint(`Endereço — ${id} com valor diferente`);
                throw new Error(`Endereço: o campo ${id} ficou "${lido}", digitado "${valor}".`);
            }
            return;
        }
        await campo.clearValue();
        await campo.addValue(valor);
        await driver.pause(500);
    }

    // Hint não é valor. No Android o EditText vazio traz o placeholder em `text` com showing-hint.
    private async textoDoCampo(id: string): Promise<string> {
        const campo = await $(seletorTestId(id));
        if ((await campo.getAttribute('showing-hint').catch(() => 'false')) === 'true') return '';
        const texto = ((await campo.getText().catch(() => '')) ?? '').trim();
        const hint = ((await campo.getAttribute('hint').catch(() => '')) ?? '').trim();
        if (!texto || texto === hint) return '';
        return texto;
    }

    private async botaoHabilitado(): Promise<boolean> {
        await this.fecharTeclado();
        const botao = await $(seletorTestId(ID_SALVAR));
        if (!(await botao.waitForExist({ timeout: 10000 }).then(() => true).catch(() => false))) {
            throw new Error('Endereço: address-save-button não está na árvore.');
        }
        await driver.pause(1000);
        if (IOS) return (await botao.getAttribute('enabled')) === 'true';
        return botao.isEnabled();
    }

    // ---------- tela ----------

    // Conta nova: o formulário abre direto. Android: `address-zip-input`. iOS: esse id não existe;
    // o formulário é o `address-save-button` mais o CEP pelo placeholder, e não a lista.
    async validarFormularioAberto() {
        if (IOS) {
            const save = await $(seletorTestId(ID_SALVAR)).waitForExist({ timeout: 20000 }).then(() => true).catch(() => false);
            const cep = await $(PLACEHOLDER_CEP_IOS).isExisting().catch(() => false);
            const lista = await this.naLista();
            if (!save || !cep || lista) {
                throw new Error(
                    'Formulário de endereço não abriu (iOS: address-save-button e o placeholder "Digite o seu CEP", sem a lista).'
                );
            }
        } else {
            const cep = await $(seletorTestId('address-zip-input'))
                .waitForDisplayed({ timeout: 20000 })
                .then(() => true)
                .catch(() => false);
            if (!cep) throw new Error('Formulário de endereço não abriu: address-zip-input não apareceu em 20s.');
        }
        console.log('📝 Formulário de endereço aberto');
        await driver.pause(timewhait);
    }

    async validarFormularioDeEdicao() {
        const save = await $(seletorTestId(ID_SALVAR)).waitForExist({ timeout: 20000 }).then(() => true).catch(() => false);
        if (!save || (await this.naLista())) {
            throw new Error('Formulário de edição não abriu (address-save-button ausente, ou a lista ainda na tela).');
        }
        if (!IOS) {
            const cep = await $(seletorTestId('address-zip-input')).isExisting().catch(() => false);
            if (!cep) throw new Error('Formulário de edição: address-zip-input não está na árvore.');
        } else if (await $(PLACEHOLDER_CEP_IOS).isExisting().catch(() => false)) {
            throw new Error('Formulário de edição (iOS): o CEP ainda está vazio (placeholder na tela).');
        }
        console.log('📝 Formulário de edição aberto');
        await driver.pause(timewhait);
    }

    async preencherCep(cep: string) {
        if (IOS) await this.digitarCampoIOS(this.campoIOS('Zip code'), cep);
        else await this.digitarAndroid('address-zip-input', cep);
        console.log(`⌨ CEP: ${cep}`);
        await driver.pause(timewhait);
    }

    async validarErroNoCep(esperado: boolean) {
        const ok = await driver
            .waitUntil(async () => (await this.erroNoCep()) === esperado, { timeout: 20000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!ok) {
            throw new Error(
                `CEP: esperado ${esperado ? 'COM' : 'SEM'} erro no campo, e a tela mostrou o contrário em 20s.`
            );
        }
        console.log(`✅ CEP ${esperado ? 'com' : 'sem'} erro no campo`);
        await anexarPrint(esperado ? 'Endereço — CEP inválido' : 'Endereço — CEP sem erro');
    }

    async preencherNumeroEDestinatario(numero: string, destinatario: string) {
        await this.fecharTeclado();
        await this.digitarNumero(numero);
        // O teclado do Número cobre Complemento e Destinatário; com ele aberto o Destinatário
        // não entra na árvore e a rolagem cai em cima do teclado (draft 39; AVD 1.23.3/562, 2026-11-25).
        await this.fecharTeclado();
        await this.digitarDestinatario(destinatario);
        await this.fecharTeclado();
    }

    // Troca só o número (a edição já traz o destinatário). No Android o valor digitado é conferido.
    // No iOS o número preenchido não fica no name/value (draft 51) — não há o que ler.
    async preencherNumero(numero: string) {
        await this.fecharTeclado();
        await this.digitarNumero(numero);
        if (!IOS) {
            const lido = soDigitos(await this.textoDoCampo('address-number-input'));
            if (lido !== numero) throw new Error(`Número: o campo ficou "${lido}", digitado "${numero}".`);
        }
        await this.fecharTeclado();
        console.log(`⌨ Número: ${numero}`);
    }

    private async digitarNumero(numero: string) {
        if (IOS) await this.digitarCampoIOS(this.campoIOS('Número'), numero);
        else await this.digitarAndroid('address-number-input', numero);
    }

    private async digitarDestinatario(destinatario: string) {
        if (IOS) await this.digitarCampoIOS(this.campoIOS('Destinatário'), destinatario);
        else await this.digitarAndroid('address-recipient-input', destinatario);
        console.log(`⌨ Destinatário: ${destinatario}`);
    }

    // Inválido: `enabled=false` nas duas plataformas, e isso é falha se vier habilitado.
    // Válido no Android (cadastro): o Save fica enabled=true. Não chamar com `true` na edição —
    // no 559 o Update abriu true sem mudança e uma vez false com CEP válido, e mesmo assim gravou.
    // No iOS o enabled do válido não prova que gravou: esta chamada com `true` não lê o botão.
    async validarSalvar(habilitado: boolean) {
        if (habilitado && IOS) {
            console.log('ℹ Save válido no iOS: enabled não é prova de que gravou');
            return;
        }
        const real = await this.botaoHabilitado();
        if (real === habilitado) {
            console.log(`✅ address-save-button ${habilitado ? 'habilitado' : 'desabilitado'}`);
            return;
        }
        throw new Error(
            `address-save-button: esperado ${habilitado ? 'habilitado' : 'desabilitado'}, está ${real ? 'habilitado' : 'desabilitado'}.`
        );
    }

    async tocarSalvarSemSair() {
        await this.fecharTeclado();
        await $(seletorTestId(ID_SALVAR)).click().catch(() => undefined);
        await driver.pause(timewhait);
        if (!(await this.noFormulario())) {
            throw new Error('Endereço: o toque no Save/Update com CEP inválido saiu do formulário.');
        }
        console.log('✅ Toque com CEP inválido continuou no formulário');
    }

    // Até 2 toques (o 1º pode só fechar o teclado) e a Entrega em 30s. O carregando deixa o
    // formulário na árvore por vários segundos; o 2º toque só acontece se o botão seguir visível.
    //
    // iOS 1.23.2/408: a captura NÃO provou que o Update grava. `element.click`, `mobile: tap` e
    // toques em três alturas não saíram do formulário e não mostraram carregando (`NOTAS.md`).
    // O teste mesmo assim espera `delivery-option-slas`, com os seletores do iOS. Não é bug
    // confirmado — não entra no BUGS-APP. No Android 559 o Update grava e vai à Entrega.
    async salvarEIrParaEntrega() {
        await this.fecharTeclado();
        const prazo = Date.now() + 30000;
        let toques = 0;
        let liberarToqueEm = 0;
        while (Date.now() < prazo) {
            if (await this.naEntrega()) break;
            if (toques < 2 && Date.now() >= liberarToqueEm) {
                const botao = await $(seletorTestId(ID_SALVAR));
                const existe = await botao.isExisting().catch(() => false);
                const visivel = await botao.isDisplayed().catch(() => false);
                // O 1º toque vale mesmo com o botão coberto pelo teclado. O 2º só se ele
                // seguir visível: no carregando o botão continua na árvore sem estar na tela.
                if (existe && (toques === 0 || visivel)) {
                    await this.fechaBanner();
                    const clicou = await botao.click().then(() => true).catch(() => false);
                    if (clicou) {
                        toques += 1;
                        liberarToqueEm = Date.now() + 8000;
                        console.log(`👆 ${ID_SALVAR} (toque ${toques}/2)`);
                    }
                }
            }
            await driver.pause(500);
        }
        if (!(await this.naEntrega())) {
            throw new Error('Endereço: a Entrega (delivery-option-slas) não abriu em 30s depois do Save/Update.');
        }
        console.log('🏠 Entrega aberta');
        await driver.pause(timewhait);
        await anexarPrint('Endereço — Entrega');
    }

    // Rua, município e bairro preenchidos pelo CEP, e a UF saiu do vazio "UF".
    // No Android o texto está no EditText. No iOS o texto NÃO está na árvore (draft 51,
    // `19` e `25`): "preenchido" é o placeholder que sumiu e o label de `address-state-input` "SP".
    async validarEnderecoDoCep(): Promise<EnderecoLido> {
        await this.fecharTeclado();
        const ok = await driver
            .waitUntil(() => this.enderecoPreenchido(), { timeout: 20000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!ok) {
            throw new Error('CEP válido: rua, município, bairro ou UF não preencheram em 20s.');
        }
        if (IOS) {
            console.log('✅ CEP preencheu os campos (iOS: placeholder sumiu, UF = SP; o texto não está na árvore)');
            return { rua: '', bairro: '', textoNaArvore: false };
        }
        const rua = await this.textoDoCampo('address-street-input');
        const bairro = await this.textoDoCampo('address-neighborhood-input');
        console.log(`✅ CEP preencheu rua "${rua}" e bairro "${bairro}"`);
        return { rua, bairro, textoNaArvore: true };
    }

    // A troca de rua/bairro só é lida no Android. No iOS os dois CEPs deixam o campo sem name:
    // não há seletor do texto (não está no draft nem no XML).
    async validarRuaEBairroMudaram(antes: EnderecoLido) {
        await this.fecharTeclado();
        if (!antes.textoNaArvore) {
            const preenchido = await this.enderecoPreenchido();
            if (!preenchido) throw new Error('CEP novo (iOS): rua, bairro ou UF não continuaram preenchidos.');
            console.log('ℹ iOS: a troca do texto de rua/bairro não está na árvore; não comparo o que o campo não expõe');
            return;
        }
        const rua = await this.textoDoCampo('address-street-input');
        const bairro = await this.textoDoCampo('address-neighborhood-input');
        if (!rua || !bairro) throw new Error('CEP novo: rua ou bairro ficou vazio.');
        if (rua === antes.rua || bairro === antes.bairro) {
            throw new Error(
                `CEP novo não trocou rua e bairro (antes "${antes.rua}" / "${antes.bairro}", agora "${rua}" / "${bairro}").`
            );
        }
        console.log(`✅ Rua e bairro trocaram: "${antes.rua}" / "${antes.bairro}" → "${rua}" / "${bairro}"`);
        await anexarPrint('Endereço — CEP editado no formulário');
    }

    private async enderecoPreenchido(): Promise<boolean> {
        if (await this.erroNoCep()) return false;
        if (IOS) {
            const uf = await $(seletorTestId('address-state-input')).getAttribute('label').catch(() => '');
            if (uf !== 'SP') return false;
            const rua = await this.campoSemPlaceholder(this.campoIOS('Rua'));
            const bairro = await this.campoSemPlaceholder(this.campoIOS('Bairro', 2));
            const cidade = await this.campoSemPlaceholder(this.campoIOS('Município', 2));
            return rua && bairro && cidade;
        }
        const rua = await this.textoDoCampo('address-street-input');
        const cidade = await this.textoDoCampo('address-city-input');
        const bairro = await this.textoDoCampo('address-neighborhood-input');
        const uf = ((await $(seletorTestId('address-state-input')).getAttribute('content-desc').catch(() => '')) ?? '').trim();
        return rua !== '' && cidade !== '' && bairro !== '' && uf !== '' && uf !== 'UF';
    }

    private async campoSemPlaceholder(seletor: string): Promise<boolean> {
        const el = await $(seletor);
        if (!(await el.isExisting().catch(() => false))) return false;
        const name = await el.getAttribute('name').catch(() => null);
        return name === null || name === '';
    }

    async conferirCepNaEntrega(cep: string) {
        const seletor = IOS
            ? `-ios predicate string:type == "XCUIElementTypeStaticText" AND name CONTAINS "${cep}"`
            : `//android.widget.TextView[contains(@text, "${cep}")]`;
        const achou = await $(seletor).waitForExist({ timeout: 10000 }).then(() => true).catch(() => false);
        if (!achou) throw new Error(`Entrega: nenhum nó contém o CEP ${cep}.`);
        console.log(`✅ Entrega mostra o CEP ${cep}`);
    }

    async abrirMeusEnderecos() {
        await this.fechaBanner();
        const link = await $(IOS ? TROCAR_ENDERECO_IOS : TROCAR_ENDERECO_ANDROID);
        await this.waitForElement(link);
        await link.click();
        const abriu = await driver
            .waitUntil(() => this.naLista(), { timeout: 20000, interval: 500 })
            .then(() => true)
            .catch(() => false);
        if (!abriu) throw new Error('Meus endereços não abriu (header-back-button + pressable, sem o formulário) em 20s.');
        console.log('📋 Meus endereços');
        await driver.pause(timewhait);
    }

    // Um cartão. `cep`, no iOS, tem de estar no name do cartão — é o texto que a árvore guarda
    // (`22-lista.xml`). No Android o CEP é conferido no campo, ao reabrir o Alterar.
    async validarUmCartao(cep?: string) {
        const n = await $$(IOS ? CARTAO_IOS : ALTERAR_ANDROID).length;
        if (n !== 1) throw new Error(`Meus endereços: esperado 1 cartão, encontrados ${n}.`);
        if (IOS && cep) {
            const nome = (await $(CARTAO_IOS).getAttribute('name').catch(() => '')) ?? '';
            // A máscara, se houver, perde o hífen ao juntar os dígitos (`22-lista.xml` traz o CEP sem hífen).
            if (!soDigitos(nome).includes(cep)) throw new Error(`Cartão (iOS): o name não contém o CEP ${cep}.`);
            console.log(`✅ 1 cartão, com o CEP ${cep}`);
            return;
        }
        console.log('✅ 1 cartão');
    }

    async abrirAlterarPrimeiro() {
        await this.fechaBanner();
        const seletorAlterar = IOS ? ALTERAR_IOS : ALTERAR_ANDROID;
        const alvos = await $$(seletorAlterar).getElements();
        if (alvos.length === 0) throw new Error('Meus endereços: nenhum "Alterar" na lista.');
        await alvos[0].click();
        const abriu = await driver
            .waitUntil(async () => (await $(seletorTestId(ID_SALVAR)).isExisting().catch(() => false)) && !(await this.naLista()), {
                timeout: 20000,
                interval: 500,
            })
            .then(() => true)
            .catch(() => false);
        if (!abriu) throw new Error('Alterar: o formulário (address-save-button) não abriu em 20s.');
        console.log('✏️ Alterar o 1º endereço');
        await driver.pause(timewhait);
    }

    // Android: o valor está no campo; a máscara `01226-030` vale. iOS: não ler o CEP do campo.
    async conferirCepNoFormulario(cep: string) {
        if (IOS) {
            console.log('ℹ iOS: o CEP preenchido não está no campo (name e value vazios). A prova ficou na Entrega e no cartão.');
            return;
        }
        const texto = await this.textoDoCampo('address-zip-input');
        if (soDigitos(texto) !== cep) {
            throw new Error(`CEP no formulário: "${texto}", esperado ${cep} (com ou sem máscara).`);
        }
        console.log(`✅ Formulário reaberto com o CEP ${texto}`);
        await anexarPrint('Endereço — CEP gravado no formulário');
    }
}
