import { BasePage, timewhait } from "./BasePage";
import { driver, $, $$ } from '@wdio/globals'

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
    async clickRoupas() {
        if (process.env.PLATFORM === 'ios') {
            const element = await $('-ios predicate string:name == "category-button" AND label == "Roupas"');
            await this.waitForElement(element);
            await this.fechaBanner();
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
            await this.fechaBanner();
            await element.click();
            await driver.pause(timewhait);
            this.tituloListagem = 'Camisas';
            return;
        }

        const element = await $("accessibility id:Camisas");
        // const element = await $('//*[@text="Camisas" or @content-desc="Camisas"]');
        await this.waitForElement(element);
        await element.scrollIntoView();
        await element.click();
        await driver.pause(timewhait);
        this.tituloListagem = 'Camisas';
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
        const seletorCard = '-ios predicate string:name BEGINSWITH "Camisa" AND name CONTAINS "R$"';

        // Espera a grade montar antes de medir qualquer coisa (a lista tem 150 itens).
        await (await $(seletorCard)).waitForDisplayed({ timeout: 40000 });

        // O card NAO pode ser pego pelo indice [1] da class chain. O primeiro match na ordem do
        // documento e o WRAPPER DA TELA, cujo `name` agrega os labels dos filhos e por isso
        // satisfaz os dois criterios: comeca com "Camisa" (do titulo "Camisas") e contem "R$"
        // (dos cards la dentro). Foi o que produziu, no CI iOS Run #7,
        //   "Camisas Filter and sort 152 products Camisa Manga Longa Slim..."
        // como nome do produto, quebrando a validacao em Favoritos.
        //
        // O discriminador e a LARGURA (draft 14): o card mede 185pt numa janela de 402pt,
        // enquanto o wrapper ocupa a largura inteira. Predicate do XCUITest nao aceita
        // geometria (registrado no draft e no voltarIOS), entao a filtragem e feita aqui.
        const { width: larguraJanela } = await driver.getWindowRect();
        const larguraMaxima = larguraJanela * 0.6;

        const candidatos = await $$(seletorCard);
        const medidos: { largura: number; nome: string }[] = [];
        let card: WebdriverIO.Element | undefined;

        for (const candidato of candidatos) {
            const { width } = await candidato.getSize().catch(() => ({ width: Number.MAX_SAFE_INTEGER }));
            const nomeBruto = (await candidato.getAttribute('name').catch(() => '')) ?? '';
            medidos.push({ largura: width, nome: nomeBruto.slice(0, 60) });
            if (width < larguraMaxima) { card = candidato; break; }
        }

        if (!card) {
            throw new Error(
                `Nenhum card de produto encontrado na listagem: os ${medidos.length} nós que casaram ` +
                `com o seletor são todos largos demais para serem um card (limite ${Math.round(larguraMaxima)}pt ` +
                `numa janela de ${larguraJanela}pt). Medidos: ` +
                medidos.map((m) => `${m.largura}pt "${m.nome}"`).join(' | ') +
                '. Se o layout da grade mudou, recapturar a tela com o mobile-ui-inspector.'
            );
        }

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
        // A guarda compara as DUAS coordenadas. Comparar só o x era um furo: os cards da grade
        // ficam em duas colunas, então todo card de uma mesma coluna divide o mesmo intervalo
        // de x — o coração da linha DE BAIXO passava na checagem sem problema. O resultado
        // seria ler o nome de uma camisa e favoritar outra, com a validação em Favoritos
        // falhando depois sem dizer o porquê.
        const dentroDoCard =
            posicaoCoracao.x >= posicaoCard.x &&
            posicaoCoracao.x <= posicaoCard.x + tamanhoCard.width &&
            posicaoCoracao.y >= posicaoCard.y &&
            posicaoCoracao.y <= posicaoCard.y + tamanhoCard.height;

        if (!dentroDoCard) {
            throw new Error(
                `O action-button escolhido (x=${Math.round(posicaoCoracao.x)}, y=${Math.round(posicaoCoracao.y)}) ` +
                `está fora do card lido ` +
                `[${Math.round(posicaoCard.x)},${Math.round(posicaoCard.y)} ${tamanhoCard.width}x${tamanhoCard.height}]: ` +
                `a ordem da grade mudou e o índice não aponta mais para o produto lido ("${nome}"). ` +
                'Favoritar assim marcaria uma camisa diferente da que o teste vai validar.'
            );
        }

        // Guarda de conta suja. O coração é um TOGGLE: se o item já estiver favoritado (resto de
        // um run anterior que morreu entre favoritar e desfavoritar — CI iOS Run #12 -> #13,
        // iPhone 13), o toque DESfavorita, Favoritos abre vazio e o erro aparece dois passos
        // adiante como "flatlist-favorites não apareceu". O único sinal na árvore iOS é o
        // action-button-icon: 32x33 com contorno, 20x21 preenchido (draft 15, diff byte a byte).
        // Não é atributo de estado, é efeito da renderização — por isso o erro traz a medida,
        // para que uma mudança de ícone no app seja reconhecida como tal e não como conta suja.
        const icone = await coracao.$('-ios predicate string:name == "action-button-icon"');
        const tamanhoIcone = await icone.getSize().catch(() => null);
        if (tamanhoIcone && tamanhoIcone.width < 26) {
            throw new Error(
                `Conta suja: o coração de "${nome}" já está preenchido antes do toque ` +
                `(action-button-icon ${tamanhoIcone.width}x${tamanhoIcone.height}; contorno mede 32x33, ` +
                'preenchido 20x21 — draft 15). Um run anterior deixou o favorito na conta; tocar agora ' +
                'DESfavoritaria. Desfavoritar manualmente nesta conta antes de rodar de novo.'
            );
        }
        console.log(`🤍 Coração de "${nome}" sem preenchimento (icone ${tamanhoIcone ? `${tamanhoIcone.width}x${tamanhoIcone.height}` : 'não medido'})`);

        await this.fechaBanner();
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

        const seta = "-android uiautomator:new UiSelector().className(\"com.horcrux.svg.PathView\").instance(0)";
        const element = await $(seta);
        await this.waitForElement(element);
        await element.scrollIntoView();

        for (let tentativa = 1; tentativa <= 2; tentativa++) {
            await this.fechaBanner();
            await $(seta).click();
            if (await this.chegouNaTabBar()) {
                console.log(`↩ voltar: seta (PathView 0)${tentativa > 1 ? ` (tap ${tentativa}/2)` : ''}`);
                await driver.pause(timewhait);
                return;
            }
            console.log(`⚠ voltar: tap ${tentativa}/2 na seta não levou à tab bar`);
        }

        throw new Error(
            'voltar() no Android: dois toques na seta (PathView instance 0) e a tab bar ' +
            '(Categorias/Menu/Perfil) não apareceu em 15s — o app não saiu da tela. Conferir no ' +
            'vídeo se um banner do Insider engoliu o toque ou se a seta mudou de posição na árvore.'
        );
    }

    // Tab bar do Android: "Categorias" existe em todas as versões; "Menu"/"Perfil" variam
    // (ver SELETORES_PERFIL em HomePage). Basta um deles aparecer.
    private async chegouNaTabBar(): Promise<boolean> {
        const abas = ["accessibility id:Categorias", "accessibility id:Menu", "accessibility id:Perfil"];
        const limite = Date.now() + 15000;
        do {
            for (const aba of abas) {
                if (await $(aba).isDisplayed().catch(() => false)) return true;
            }
            await driver.pause(500);
        } while (Date.now() < limite);
        return false;
    }

}

