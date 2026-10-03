import type { ChainablePromiseElement } from 'webdriverio';
import allure from '@wdio/allure-reporter';
import { texto } from '../utils/textos';

// testID do app migrado -> seletor da plataforma.
//
// Android: o testID do React Native vira `resource-id` SEM prefixo de pacote ("tab-menu", não
// "com.aramis.ecomm:id/tab-menu"). Por isso o seletor é o UiSelector.resourceId(), que casa o
// valor exato — o mesmo que o CategoriasPage já usa com `action-button` e provou verde no app
// antigo. NÃO trocar por `id:<testID>`: o locator `id` do UiAutomator2 pode prefixar o pacote e
// não casar (não verificado neste repo; ver 06-02-SUMMARY, deviation Rule 3).
// iOS: o testID vira o `name`, localizado por `accessibility id`.
export function seletorTestId(id: string): string {
  return process.env.PLATFORM === 'ios'
    ? `accessibility id:${id}`
    : `-android uiautomator:new UiSelector().resourceId("${id}")`;
}


export class BasePage {
  private defaultTimeout = 20000;

  async waitForElement(element: unknown, timeout = this.defaultTimeout) {
    const resolvedElement = (await (element as any)) as WebdriverIO.Element;
    if (!resolvedElement || typeof resolvedElement.waitForDisplayed !== 'function') {
      throw new Error('Elemento inválido passado para waitForElement');
    }

    await resolvedElement.waitForDisplayed({ timeout });
  }

  // Clica no elemento apenas se ele aparecer dentro do timeout; caso contrário pula o passo
  // sem derrubar o teste. Usado nos passos de abertura/permissão que podem não surgir em
  // todos os devices (ex.: permissão já concedida, telas de onboarding variando por SO).
  async clickIfPresent(selector: string, timeout = 8000): Promise<boolean> {
    const el = await $(selector);
    const shown = await el.waitForDisplayed({ timeout }).then(() => true).catch(() => false);
    if (!shown) {
      console.log(`⏭️ Passo opcional pulado (não exibido): ${selector}`);
      return false;
    }
    await el.click();
    await driver.pause(timewhait);
    return true;
  }

  // Clica no primeiro seletor que estiver na tela. Existe porque um mesmo elemento pode ter
  // accessibility id diferente entre versões do app (ex.: a aba de perfil da barra inferior,
  // "Menu" na versão com ícone de mochila e "Perfil" na versão com ícone de sacola). Assim os
  // dois ids ficam registrados e o teste usa o que a versão instalada expõe.
  async clickFirstPresent(selectors: string[], timeout = this.defaultTimeout): Promise<string> {
    const deadline = Date.now() + timeout;

    do {
      for (const selector of selectors) {
        const el = await $(selector);
        if (await el.isDisplayed().catch(() => false)) {
          console.log(`✅ Seletor encontrado: ${selector}`);
          await el.click();
          await driver.pause(timewhait);
          return selector;
        }
      }
      await driver.pause(500);
    } while (Date.now() < deadline);

    throw new Error(`Nenhum dos seletores apareceu em ${timeout}ms: ${selectors.join(' | ')}`);
  }

  // Banner do Insider: o botão nativo closeBt é decorativo (clicar nele não fecha nada) e o
  // back() do Android também não fecha. Quem fecha é o botão do próprio criativo, dentro da
  // WebView, exposto como accessibility id "Close". A WebView leva alguns segundos para
  // publicar a árvore de acessibilidade: antes disso o htmlView vem com NAF="true" e sem
  // filhos, e o "Close" simplesmente não existe — por isso esperamos por ele em vez de
  // consultar uma única vez. Nada de tocar em coordenada: o card tem "Open App" cobrindo a
  // imagem e o CTA "Ver coleção", então um toque que erre o alvo navega para o promo.
  async fechaBanner() {
    if (process.env.PLATFORM === 'ios') return this.fechaBannerIOS();

    const overlay = "id:com.aramis.ecomm:id/insiderLayout";
    // App migrado (raspadinha "Só no APP: 20% OFF", captures-2026-10-01-banner/24-camisas-logado-t60.xml):
    // o "X" é um android.widget.Button com text="Close", content-desc VAZIO e resource-id
    // `wrap-close-button-<número do criativo>`. O `accessibility id:Close` do app antigo procura
    // pelo content-desc e por isso não acertava esse botão (run local de 2026-10-01: 3 tentativas
    // e o banner continuou). 1º o id (independe de texto; o sufixo numérico muda por criativo),
    // depois o text e por último o desc do app antigo. Toque no centro desse rect fechou o banner
    // (captures 26 e 27: insiderLayout sumiu, listagem intacta) — 1 ocorrência medida.
    const botoesFechar = [
      '-android uiautomator:new UiSelector().resourceIdMatches(".*wrap-close-button.*")',
      '-android uiautomator:new UiSelector().className("android.widget.Button").text("Close")',
      'accessibility id:Close',
    ];

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      // Sem banner na tela o método custa uma consulta e retorna: roda antes de todo step.
      if (!(await this.bannerNaTela(overlay))) return;

      // A WebView do criativo publica os filhos com atraso (aos 10s ainda sem o Close; aos 20s já
      // presente — mesma captura), daí a espera de até 20s por qualquer um dos candidatos.
      const seletorClose = await this.algumVisivel(botoesFechar, 20000);

      if (!seletorClose) {
        // insiderLayout SEM criativo: no run local de 2026-10-01 (20:41) o insiderLayout respondeu
        // presente com a tela limpa (vídeo: listagem de Camisas, nenhum banner) e o método lançava
        // "não fechou" sem haver o que fechar. O contêiner sobra na árvore depois que um criativo
        // é exibido. Sem nenhum botão de fechar em 20s não há banner a fechar: registra e segue —
        // o passo seguinte valida o próprio destino (ex.: voltar() espera a tab bar).
        console.log(`ℹ insiderLayout presente mas sem criativo (nenhum "Close" em 20s) — seguindo sem fechar`);
        return;
      }

      // 1ª tentativa: element click. Da 2ª em diante: gesto de toque no centro do MESMO elemento
      // (`mobile: clickGesture`), que é o que o inspector fez e fechou (adb tap no centro do rect) —
      // cobre o caso de o click do WebDriver não chegar ao botão dentro da WebView.
      const close = await $(seletorClose);
      const modo = tentativa === 1 ? 'click' : 'clickGesture';
      console.log(`👆 Fechando o banner (${modo}) por ${seletorClose} em ${await this.rectDe(seletorClose)}`);
      if (modo === 'click') await close.click();
      else await driver.execute('mobile: clickGesture', { elementId: close.elementId });

      const fechou = await driver
        .waitUntil(async () => !(await this.bannerNaTela(overlay)), { timeout: 5000, interval: 500 })
        .then(() => true)
        .catch(() => false);

      if (fechou) {
        console.log(`✅ Banner fechado (tentativa ${tentativa}/3)`);
        await driver.pause(timewhait);
        // Não retorna: pode haver um segundo criativo enfileirado atrás do primeiro.
        continue;
      }

      console.log(`⚠ Clique no "Close" não fechou o banner (tentativa ${tentativa}/3)`);
    }

    // Só é falha se o criativo continua lá: contêiner E botão de fechar visíveis (o contêiner
    // sozinho sobra na árvore com a tela limpa — ver acima).
    if ((await this.bannerNaTela(overlay)) && (await this.algumVisivel(botoesFechar, 2000))) {
      throw new Error('Banner do Insider não fechou após 3 tentativas de clicar em "Close"');
    }
  }

  // Mesmo desenho do Android, com o marcador de presença certo para o iOS.
  //
  // O que NÃO serve como marcador: o próprio "Close" e o "Open App". Os dois respondem
  // displayed=true com a tela limpa — o nó sobrevive na árvore depois que o banner some e o
  // isElementDisplayed do WDA mente sobre ele. Foi isso que, no CI iOS Run #7, fez o teste
  // clicar num "Close" inexistente (centro (330,298), dentro do card "My Orders") e derrubar
  // 3 de 5 aparelhos com "Banner do Insider não fechou" numa tela sem banner.
  //
  // O que serve, medido no CI iOS Run #9 (iPhone 14 Pro Max, mesma sessão, os dois estados):
  //
  //   tela limpa (4 amostras):   Close=true  WebView=false  Window=false  OpenApp=true
  //   banner na tela (1 amostra): Close=true  WebView=TRUE   Window=TRUE   OpenApp=true
  //
  // A WebView "Insider WebView Content" e a Window "Inapp Window" só reportam displayed=true
  // com o criativo visível — são o insiderLayout do iOS. O ciclo abaixo é o do Android:
  // presença -> esperar o "Close" (a WebView publica a árvore com atraso) -> clicar -> confirmar
  // que a WebView sumiu -> repetir (pode haver um segundo criativo enfileirado) -> lançar se
  // ainda estiver lá depois de 3 ciclos.
  //
  // Medido em 2026-09-11 (Remote Access, iPhone iOS 18.0, 2 ocorrências em telas diferentes):
  // o `Close` estava em [313,273 25x25] e o centro desse rect é o "X" do print; o element
  // click nele fechou o banner as duas vezes, e em <=1s TODOS os nós Insider sumiram da árvore
  // (find -> "no such element"). Ou seja, o elemento e a validação pela WebView estão certos.
  // O que também se mediu: com o banner na tela, um elemento POR BAIXO dele (tab-categories)
  // responde displayed=true e hittable=true — o WDA não enxerga o banner como obstrução, o
  // toque vai para a janela do Insider e é engolido em silêncio. Por isso este método é chamado
  // imediatamente antes de cada clique do ramo iOS, e não só no início do step: um banner que
  // nasce durante os 40s de espera da grade de produtos passaria batido pela checagem do step.
  //
  // Tempos (definidos pelo Marcio): 3s entre detectar o banner e clicar — o "Close" pode entrar
  // na árvore antes de a WebView terminar de desenhar (o caso do htmlView vazio no Android) —
  // e 3s depois do clique antes de validar que a WebView sumiu.
  //
  // Evidência no log a cada ciclo (rect do "Close" antes do clique, estado da WebView depois) e
  // screenshot anexado ao Allure quando não fechar: se falhar de novo, o relatório diz sozinho
  // se o clique saiu cedo, se saiu no lugar errado ou se o banner nem foi visto.
  //
  // Atenção: no iOS o banner pode aparecer JÁ na tela de boas-vindas, antes de qualquer login
  // — diferente do Android, onde só foi visto depois dele.
  private async fechaBannerIOS() {
    const webview = '-ios predicate string:label == "Insider WebView Content"';
    const botaoFechar = "accessibility id:Close";

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      // Sem banner na tela o método custa uma consulta e retorna: roda antes de todo clique.
      if (!(await this.bannerNaTela(webview))) return;

      // 3s com o banner detectado antes de tocar: garante que ele está na tela de verdade, não
      // ainda carregando.
      console.log(`🟡 Banner do Insider na tela — aguardando 3s antes de fechar (tentativa ${tentativa}/3)`);
      await driver.pause(3000);

      const close = await $(botaoFechar);
      const apareceu = await close
        .waitForDisplayed({ timeout: 10000 })
        .then(() => true)
        .catch(() => false);

      if (!apareceu) {
        console.log(`⏳ Banner na tela mas o "Close" não apareceu (tentativa ${tentativa}/3)`);
        continue;
      }

      console.log(`👆 Clicando no "Close" em ${await this.rectDe(botaoFechar)} (tentativa ${tentativa}/3)`);
      await close.click();

      // 3s depois do clique para o banner sumir; só então a validação.
      await driver.pause(3000);

      if (!(await this.bannerNaTela(webview))) {
        console.log(`✅ Banner fechado e confirmado fora da tela (tentativa ${tentativa}/3)`);
        // Não retorna: pode haver um segundo criativo enfileirado atrás do primeiro.
        continue;
      }

      console.log(
        `⚠ Clique no "Close" não fechou o banner (tentativa ${tentativa}/3): ` +
        `WebView continua displayed=true; Close agora em ${await this.rectDe(botaoFechar)}`
      );
    }

    if (await this.bannerNaTela(webview)) {
      const rect = await this.rectDe(botaoFechar);
      try {
        allure.addAttachment(
          'Banner do Insider não fechou',
          Buffer.from(await driver.takeScreenshot(), 'base64'),
          'image/png'
        );
      } catch (err) {
        console.warn('Não foi possível anexar o screenshot do banner:', err);
      }
      throw new Error(
        'Banner do Insider não fechou após 3 tentativas de clicar em "Close" ' +
        `(WebView "Insider WebView Content" continua displayed=true; Close em ${rect}). ` +
        'Screenshot anexado ao relatório.'
      );
    }
  }

  // Rect "[x,y wxh]" de um seletor, para o log — ou "?" se o nó não existir/mudar no meio.
  private async rectDe(seletor: string): Promise<string> {
    const loc = await $(seletor).getLocation().catch(() => null);
    const size = await $(seletor).getSize().catch(() => null);
    return loc && size
      ? `[${Math.round(loc.x)},${Math.round(loc.y)} ${size.width}x${size.height}]`
      : '?';
  }

  // Presença do banner pelo marcador de cada plataforma: insiderLayout no Android (o htmlView
  // some do dump em alguns momentos mesmo com o banner visível, então não serve) e a WebView
  // "Insider WebView Content" no iOS (o "Close" mente, ver fechaBannerIOS).
  private async bannerNaTela(overlay: string): Promise<boolean> {
    const el = await $(overlay);
    return el.isDisplayed().catch(() => false);
  }


  // Seletor do acesso ao Login no Menu deslogado. Compartilhado entre LoginPage (abrir o Login) e
  // PerfilPage (validar que deslogou).
  //
  // Android: SEM texto. O content-desc ("Cadastre-se ou, Faça o login") quebrou no run local de
  // 2026-10-01 (`still not displayed after 20000ms` em loginPage.logar) — o texto depende do idioma
  // e o teste não pode depender dele. Os dois itens não têm testID, então vão pela posição na árvore:
  //   - topo: o clicável imediatamente antes do 1º `menu-card`. ATENÇÃO: logado, a mesma posição é
  //     o card com o nome da conta (captures-2026-09-29/45-menu-logado.xml) — serve para ABRIR o
  //     Login com a conta deslogada, NUNCA para provar que deslogou.
  //     fonte: captures-2026-09-29/10-menu-deslogado.xml e m6e1/14-menu-deslogado-pt.xml
  //   - rodapé: o clicável imediatamente antes de `tab-home`, e SEM resource-id. Logado, essa
  //     posição é o `menu-list-button` "Painel de controle" (com id) — por isso o filtro de id vazio
  //     distingue os dois estados. fonte: captures-2026-09-29/51-pos-logout.xml × 48-menu-rolado.xml
  // iOS: accessibility id (seletor por texto — frágil, sem testID; ver test/utils/textos.ts).
  protected seletorAcessoLogin(chave: 'menu.acessoLogin' | 'menu.acessoLoginRodape'): string {
    if (process.env.PLATFORM === 'ios') return `accessibility id:${texto(chave)}`;
    return chave === 'menu.acessoLogin'
      ? '(//*[@resource-id="menu-card"])[1]/preceding::*[@clickable="true"][1]'
      : '(//*[@resource-id="tab-home"])[1]/preceding::*[@clickable="true"][1][@resource-id=""]';
  }

  // Espera até `timeout` por qualquer um dos seletores ficar displayed. Devolve o primeiro que
  // apareceu, ou null. Serve para validar "cheguei no destino" quando há mais de um destino válido.
  protected async algumVisivel(seletores: string[], timeout: number): Promise<string | null> {
    let achado: string | null = null;
    await driver
      .waitUntil(
        async () => {
          for (const seletor of seletores) {
            if (await $(seletor).isDisplayed().catch(() => false)) {
              achado = seletor;
              return true;
            }
          }
          return false;
        },
        { timeout, interval: 500 }
      )
      .catch(() => false);
    return achado;
  }

  // O app já passou do onboarding (a aba Home existe na tela)? Existe porque o app pode chegar
  // aqui já instalado e aceito (noReset local) — nesse caso as telas de Boas-vindas a Termos não
  // aparecem e esperá-las seria falha falsa. A aba Home só existe depois do onboarding, nas duas
  // plataformas (fonte: android/06-home, ios/06-home). Nunca decide por texto.
  async onboardingJaConcluido(timeout = 4000): Promise<boolean> {
    return $(seletorTestId('tab-home'))
      .waitForDisplayed({ timeout })
      .then(() => true)
      .catch(() => false);
  }

  // ---- Onboarding Android do app migrado -------------------------------------------------
  // Seletores NÃO VERIFICADOS em run: vêm das capturas do M5 e ficam "não verificados" até o
  // run da fumaça (06-03 Tarefa 3).

  // Boas-vindas: o CTA "Toque para começar" não tem nó, mas o container inteiro é clicável
  // (clickable=true) e é o ANCESTRAL do `first-access-item-animation`. O toque no centro do
  // container equivale ao CTA? Assumption A5 do 06-RESEARCH: inferido, NÃO verificado — por isso
  // o destino é validado e até 2 toques são dados antes de falhar com erro nomeado.
  async iniciaApp() {
    // fonte: .planning/drafts/app-migrado/android/captures-2026-09-29/01-boasvindas.xml
    const container = '//*[@resource-id="first-access-item-animation"]/ancestor::*[@clickable="true"][1]';
    // Destinos válidos depois do toque: diálogo de permissão do sistema (Device Farm) ou a tela
    // de Tópicos (AVD local, onde autoGrantPermissions pula os diálogos).
    const destinos = [
      // fonte: captures-2026-09-29/02-permissao-local.xml
      'id:com.android.permissioncontroller:id/permission_message',
      // fonte: captures-2026-09-29/04-topicos.xml
      seletorTestId('permission-topic'),
    ];

    const apareceu = await $(container)
      .waitForDisplayed({ timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    if (!apareceu) {
      throw new Error(
        'Boas-vindas não apareceu: o container clicável (ancestral de first-access-item-animation) ' +
        'não ficou visível em 20s. O app está limpo (adb shell pm clear com.aramis.ecomm)?'
      );
    }

    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      await (await $(container)).click();
      if (await this.algumVisivel(destinos, 20000)) {
        console.log(`✅ Boas-vindas avançou (toque ${tentativa}/2)`);
        return;
      }
      console.log(`⚠ Toque ${tentativa}/2 no container das Boas-vindas não avançou`);
    }

    throw new Error(
      'Boas-vindas não avançou: depois de 2 toques no container, nem o diálogo de permissão nem ' +
      'a tela de Tópicos (permission-topic) apareceram em 20s. Se o toque no centro do container ' +
      'não equivale ao CTA (Assumption A5), capturar de novo com o inspector.'
    );
  }

  // Localização: "Durante o uso do app". Opcional de propósito: no AVD local o
  // autoGrantPermissions já concede e o diálogo não aparece (DEC-A, 06-01-SUMMARY).
  async ativaGps() {
    // fonte: captures-2026-09-29/02-permissao-local.xml (draft android/02)
    await this.clickIfPresent("id:com.android.permissioncontroller:id/permission_allow_foreground_only_button");
  }

  // Notificação: opcional pelo mesmo motivo da localização.
  async permiteNotificacao() {
    // fonte: captures-2026-09-29/03-permissao-notif.xml (draft android/02)
    await this.clickIfPresent("id:com.android.permissioncontroller:id/permission_allow_button");
  }

  async negaNotificacao() {
    await this.clickIfPresent("id:com.android.permissioncontroller:id/permission_deny_button");
  }

  // Tópicos de permissão ("Como criamos sua experiência?"): 4 `permission-topic` e o
  // `accept-button` fixo no rodapé, sem scroll. Obrigatória: se os tópicos não aparecerem o
  // onboarding não segue e a falha tem que apontar este passo.
  async continua() {
    // fonte: captures-2026-09-29/04-topicos.xml (draft android/03)
    const topico = seletorTestId('permission-topic');
    const aceite = seletorTestId('accept-button');

    const apareceu = await $(topico)
      .waitForDisplayed({ timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    if (!apareceu) {
      throw new Error('Tópicos de permissão não apareceram: nenhum permission-topic visível em 20s.');
    }

    await this.aceitarEEsperarSair('Tópicos de permissão', aceite, topico);
  }

  // Política de Privacidade: texto longo num TextView só; o `accept-button` só entra na árvore
  // depois de rolar até o fim (NOTAS 09-29: ~30 swipes — medição não confirmada, por isso o
  // orçamento é 45 e a parada é o isDisplayed(), nunca uma contagem fixa).
  async termo1() {
    // fonte: captures-2026-09-29/05-politica.xml e 06-politica-fim.xml (draft android/04)
    await this.aceitarTelaLongaAndroid('Política de Privacidade');
  }

  // Termos e condições de compra e uso: mesmo desenho; o nº de swipes não foi capturado.
  async termos2() {
    // fonte: captures-2026-09-29/07-termos.xml e 08-termos-fim.xml (draft android/05)
    await this.aceitarTelaLongaAndroid('Termos e condições');
  }

  // As três telas de aceite usam o MESMO resource-id (`accept-button`), então depois de cada
  // clique a única prova de que a tela trocou é o botão sair da tela. Falha nomeada se não sair.
  private async aceitarTelaLongaAndroid(tela: string) {
    const maxSwipes = 45;
    const aceite = seletorTestId('accept-button');
    const element = await $(aceite);

    const achou = await scrollUntilVisible(element, maxSwipes);
    if (!achou) {
      throw new Error(`aceite da ${tela} não apareceu após ${maxSwipes} swipes (accept-button não ficou visível)`);
    }

    await this.aceitarEEsperarSair(tela, aceite, aceite);
  }

  // Clica o aceite e espera `sinalDeSaida` sair da tela (15s). Sem isso o laço seguinte poderia
  // enxergar o botão da tela anterior (mesmo id) e clicar duas vezes na mesma tela.
  private async aceitarEEsperarSair(tela: string, aceite: string, sinalDeSaida: string) {
    await (await $(aceite)).click();

    const saiu = await driver
      .waitUntil(async () => !(await $(sinalDeSaida).isDisplayed().catch(() => false)), {
        timeout: 15000,
        interval: 500,
      })
      .then(() => true)
      .catch(() => false);

    if (!saiu) {
      throw new Error(
        `Onboarding Android travado em "${tela}": o aceite continuou visível 15s depois do clique, ` +
        'ou seja, a tela não trocou.'
      );
    }

    console.log(`✅ Aceite (${tela})`);
    await driver.pause(timewhait);
  }

  // ---------------------------------------------------------------------------
  // iOS
  // ---------------------------------------------------------------------------

  // Toque por coordenada, para os pontos em que o app NÃO expõe elemento algum na árvore de
  // acessibilidade. É a exceção registrada em .planning/REQUIREMENTS.md — em todo o resto do
  // fluxo o toque é por seletor.
  //
  // As coordenadas dos drafts foram medidas numa janela de 402x874pt, então entram aqui como
  // FRAÇÃO da tela e são multiplicadas pelo getWindowRect() do device real. Pixel absoluto
  // quebraria em qualquer iPhone de tamanho diferente.
  async tapProporcional(fx: number, fy: number, descricao: string) {
    const { width, height } = await driver.getWindowRect();
    const x = Math.round(width * fx);
    const y = Math.round(height * fy);

    console.log(`👆 Toque por coordenada (${descricao}): ${x},${y} numa tela de ${width}x${height}`);

    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x, y },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 100 },
          { type: 'pointerUp', button: 0 }
        ]
      }
    ]);

    // Mesmo motivo do scrollFinger: releaseActions não existe em alguns hosts do Device Farm.
    try {
      await driver.releaseActions();
    } catch {
      // no-op: endpoint ausente nesse host
    }
  }

  // Rolagem no iOS. É o MESMO mecanismo do Android (ver termo1/termos2 acima): um lote de
  // swipes obrigatórios e depois um laço de swipe com checagem de isDisplayed() a cada volta.
  //
  // NÃO voltar a usar `mobile: scroll` com toVisible aqui. Ele foi tentado e derrubou o
  // CI iOS Run #61 (2026-09-09): o accept-button é um XCUIElementTypeOther (confirmado no log,
  // getElementTagName -> XCUIElementTypeOther) e o scrollToVisible do WDA não converge nesse
  // tipo de nó — ao chegar no fim do scroll view a rubber band impede novo movimento, o
  // critério interno de "visible cell" nunca é satisfeito e o comando queima o maxScrollCount
  // inteiro (~85s) antes de lançar "Failed to perform scroll with visible cell due to max
  // scroll count reached". Como o wdio.conf.ts não define connectionRetryCount, o WDIO reenvia
  // 3x (os "Retrying n/3" do log): UMA chamada custou 4 x 85s ≈ 5m45s, por tela. Duas telas de
  // aceite = ~11m30s dos 12m30s do teste, a 2m30s de estourar o mochaOpts.timeout de 15min.
  //
  // O vídeo do device é a prova de que o scroll não era necessário: em t=200s e t=300s a tela
  // já estava no fim do documento com o "I have read and agree" inteiro visível, e o WDA
  // continuou rolando. Quem não converge é o scrollToVisible; o isDisplayed() do nó é condição
  // de parada válida — foi ele que devolveu true no instante em que o comando desistiu.
  //
  // Este caminho também cobre o nó que ainda não está montado na árvore (lista virtualizada,
  // caso do "Logout" no Account Menu — PerfilPage.ts): isDisplayed() num elemento inexistente
  // cai no .catch(() => false) do scrollUntilVisible e o laço simplesmente rola de novo.
  //
  // `maxScrolls` existe porque a Política de Privacidade do app migrado exige ~21 swipes e os
  // Termos ~9 (06-01 sessão A, ACOES.md capturas 07 e 09): o padrão de 14 não chega.
  async rolaAteVisivelIOS(seletor: string, maxScrolls = 14): Promise<boolean> {
    const el = await $(seletor);
    if (await el.isDisplayed().catch(() => false)) return true;

    await forceScrollBeforeSearching(6);
    return scrollUntilVisible(await $(seletor), maxScrolls);
  }

  // Boas-vindas do app migrado. Ordem real medida na sessão A (06-01, ACOES.md capturas 00-05):
  // alerta de NOTIFICAÇÃO -> toque no CTA -> alerta de ATT -> alerta de LOCALIZAÇÃO -> carrossel.
  // Os três alertas são do SpringBoard e nenhum foi aceito sozinho (a sessão não usou
  // autoAcceptAlerts); só `mobile: alert` com buttonLabel resolve.
  //
  // O CTA "Toque para começar" NÃO gera nó algum na árvore XCUITest — só coordenada, guardada
  // como FRAÇÃO da janela (REQUIREMENTS.md: exceção obrigatória no iOS) e multiplicada pelo
  // getWindowRect() do device real. fonte: ACOES.md captura 02 — (205,780)pt numa janela de
  // 402x874 = fração (0.510, 0.892); 1 tap bastou, não é slider. Dívida a cobrar do time do app:
  // um accessibilityIdentifier no CTA.
  //
  // O destino do toque é validado (alerta de ATT OU `permission-topic`): sem isso, um toque
  // perdido só afloraria três telas adiante. Não verificado em run: confirmar no 06-03 Tarefa 3.
  async iniciaAppIOS() {
    // Alerta de notificação: aparece antes das boas-vindas. Opcional — pode não vir (já
    // respondido, ou aceito por autoAcceptAlerts no Device Farm).
    await this.aceitarAlertasSistemaIOS('notificação', 1, 10000);
    await this.fechaBanner();

    const topico = seletorTestId('permission-topic'); // fonte: ACOES.md captura 02 (4x permission-topic)

    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      await this.tapProporcional(0.510, 0.892, 'CTA "Toque para começar"');

      const avancou = await driver
        .waitUntil(
          async () => (await this.existeAlertaIOS()) || (await $(topico).isDisplayed().catch(() => false)),
          { timeout: 20000, interval: 500 }
        )
        .then(() => true)
        .catch(() => false);

      if (avancou) {
        console.log(`✅ Boas-vindas avançou (toque ${tentativa}/2)`);
        await driver.pause(timewhait);
        return;
      }
      console.log(`⚠ Toque ${tentativa}/2 no CTA das Boas-vindas não avançou`);
    }

    throw new Error(
      'Boas-vindas não avançou: depois de 2 toques no CTA (fração 0.510, 0.892 da janela) nem o ' +
      'alerta de ATT nem a tela de Tópicos (permission-topic) apareceram em 20s. Conferir se um ' +
      'alerta do sistema ficou de pé por cima do app ou se a janela do device difere muito de 402x874.'
    );
  }

  // Alertas de ATT (App Tracking Transparency) e de localização, do SpringBoard: não aparecem no
  // getPageSource() do app, então não há seletor — quem os enxerga é o XCUITest, por
  // `mobile: alert`. O ATT é NOVO no app migrado (ACOES.md captura 03/04).
  //
  // NÃO voltar a fechá-los por coordenada: alerta do SpringBoard é diálogo de altura fixa
  // centralizado e não escala com a tela (travou o 14 Pro Max e o 15 Pro Max no run #27).
  // acceptAlert() também não serve: retorna sucesso com o alerta ainda na tela.
  //
  // Não se presume a ordem: cada alerta tem os botões lidos por getButtons e o rótulo certo é
  // escolhido entre os capturados (aceitarAlertasSistemaIOS).
  async permissaoLocalizacaoIOS() {
    const aceitos = await this.aceitarAlertasSistemaIOS('ATT e localização', 3, 15000);
    if (aceitos === 0) {
      console.log('🔔 Nenhum alerta de ATT/localização apareceu — seguindo.');
      return;
    }

    // Confirmação obrigatória: o acceptAlert() antigo já reportava sucesso com o alerta na
    // tela, então "o comando não deu erro" não vale como prova de que fechou.
    if ((await this.esperaAlertaIOS(5000)) !== null) {
      throw new Error(
        'Alerta do sistema do iOS (ATT/localização) não fechou. Ele é modal: enquanto estiver de ' +
        'pé, todo clique no app é engolido e o onboarding não avança. Levantar os rótulos com ' +
        '`mobile: alert` action "getButtons" numa sessão de Remote Access antes de mexer aqui.'
      );
    }
  }

  // Aceita até `maximo` alertas do sistema em sequência. Devolve quantos aceitou (0 se nenhum
  // apareceu em `primeiroTimeout`). Entre um alerta e o próximo espera só 6s: depois de aceitar
  // o ATT a localização já está a caminho (ACOES.md captura 04 -> 05).
  //
  // Rótulos de aceitar, na ordem de preferência — seletor por texto do SO, frágil (sem id):
  //   "Allow While Using App"  localização (botões: Precise: On, Allow Once, Allow While Using
  //                            App, Don’t Allow — ACOES.md captura 04)
  //   "Allow"                  notificação (Don’t Allow, Allow — captura 00) e ATT (Ask App Not
  //                            to Track, Allow — captura 03)
  // A ordem importa: na localização existe "Allow Once", e "Allow" sozinho não casa com ele
  // porque a comparação é por igualdade. Sem nenhum dos dois, cai no accept sem rótulo (último
  // recurso, já existente no código anterior).
  private async aceitarAlertasSistemaIOS(contexto: string, maximo: number, primeiroTimeout: number): Promise<number> {
    const rotulosAceitar = ['Allow While Using App', 'Allow'];
    let aceitos = 0;

    for (let i = 0; i < maximo; i++) {
      const mensagem = await this.esperaAlertaIOS(i === 0 ? primeiroTimeout : 6000);
      if (mensagem === null) break;
      console.log(`🔔 Alerta do sistema (${contexto}): ${mensagem}`);

      let botoes: string[] = [];
      try {
        botoes = (await driver.execute('mobile: alert', { action: 'getButtons' })) as string[];
      } catch (erro) {
        console.log(`⚠ getButtons falhou: ${erro}`);
      }

      const buttonLabel = rotulosAceitar.find((rotulo) => botoes.includes(rotulo));
      try {
        await driver.execute('mobile: alert', buttonLabel ? { action: 'accept', buttonLabel } : { action: 'accept' });
        console.log(`✅ Alerta aceito por "${buttonLabel ?? 'accept sem rótulo'}" (botões: ${botoes.join(' | ') || '?'})`);
      } catch (erro) {
        console.log(`⚠ "${buttonLabel ?? 'accept sem rótulo'}" não serviu: ${erro}`);
      }

      aceitos++;
      await driver.pause(timewhait);
    }

    return aceitos;
  }

  // Pergunta rápida "tem alerta do sistema agora?" — getAlertText() lança quando não há.
  private async existeAlertaIOS(): Promise<boolean> {
    return driver.getAlertText().then(() => true).catch(() => false);
  }

  // getAlertText() lança quando não há alerta — é o jeito de perguntar "tem alerta?" ao WDA.
  // Devolve o texto, ou null se nenhum alerta apareceu dentro do timeout.
  private async esperaAlertaIOS(timeout = 15000): Promise<string | null> {
    const capturado: string[] = [];
    const apareceu = await driver
      .waitUntil(
        async () => {
          try {
            capturado[0] = await driver.getAlertText();
            return true;
          } catch {
            return false;
          }
        },
        { timeout, interval: 500 }
      )
      .then(() => true)
      .catch(() => false);

    return apareceu ? capturado[0] : null;
  }

  // Carrossel de permissões -> Política de Privacidade -> Termos e Condições de Compra e Uso.
  //
  // As TRÊS telas usam o mesmo name (accept-button), variando só o label. Elas aparecem uma de
  // cada vez, então o seletor não é ambíguo — mas um laço ingênuo tocaria duas vezes na mesma
  // tela. Medido na sessão A (06-01, ACOES.md capturas 06-10): o carrossel tem o botão visível
  // de imediato; a Política exige ~21 swipes (~48s) e os Termos ~9 (~21s) — o orçamento abaixo
  // é 45 swipes por tela, e a parada é o isDisplayed(), nunca uma contagem fixa.
  //
  // O sinal de transição é o botão SAIR da viewport: a tela seguinte entra rolada no topo, com
  // o accept-button lá embaixo em visible="false". Uma pausa fixa não distingue "ainda na
  // mesma tela" de "já na próxima"; esperar o botão sumir, sim.
  //
  // Falha nomeada, nunca pulo em silêncio: o aceite que não aparece trava o onboarding e a
  // falha tem que apontar a tela certa (antes havia um "Aceite pulado" que escondia isso).
  async aceitaOnboardingIOS() {
    const aceite = seletorTestId('accept-button'); // fonte: ACOES.md capturas 02, 06, 08
    const telas = ['carrossel de permissões', 'política de privacidade', 'termos e condições'];
    const maxSwipes = 45;

    for (const tela of telas) {
      const existe = await $(aceite).waitForExist({ timeout: 20000 }).then(() => true).catch(() => false);
      if (!existe) {
        throw new Error(`Onboarding iOS: "accept-button" não existe na árvore da tela "${tela}" (20s).`);
      }

      const alcancou = await this.rolaAteVisivelIOS(aceite, maxSwipes);
      if (!alcancou) {
        throw new Error(`aceite da ${tela} não apareceu após ${maxSwipes} swipes (accept-button não ficou visível)`);
      }

      await this.fechaBanner();
      await $(aceite).click();

      // O botão sair da viewport é o único sinal de que a tela trocou. Aqui havia um .catch()
      // que só logava "continuou visível — seguindo": com o alerta de localização de pé nos
      // Pro Max, o mesmo botão era clicado três vezes, o log imprimia três "✅ Aceite" falsos
      // e a falha só aflorava três passos adiante, em abrirPerfil(), como "tab-menu still not
      // displayed". Falhar aqui aponta o lugar certo.
      const avancou = await driver
        .waitUntil(async () => !(await $(aceite).isDisplayed().catch(() => false)), {
          timeout: 15000,
          interval: 500,
        })
        .then(() => true)
        .catch(() => false);

      if (!avancou) {
        throw new Error(
          `Onboarding iOS travado em "${tela}": "accept-button" continuou visível 15s depois do ` +
          'clique, ou seja, a tela não trocou. Suspeitar de modal do sistema por cima do app — ' +
          'os alertas de ATT e de localização são o caso conhecido.'
        );
      }

      console.log(`✅ Aceite (${tela})`);
      await driver.pause(timewhait);
    }
  }

  // Voltar no iOS. Duas telas diferentes chamam isto, e elas voltam de formas diferentes:
  //
  // - Favoritos/Perfil/Login têm um `accessibility id:Back` normal.
  // - A LISTAGEM DE PRODUTOS não tem. Ela tem um chevron "‹" à esquerda do título, mas ele
  //   NÃO tem nó próprio na árvore: está dentro do nó do título. E o cabeçalho tem DOIS nós
  //   com o mesmo name (o da categoria aberta) — a barra inteira ([0,62 402x48],
  //   accessible="false", cujo centro cai em espaço vazio) e o grupo chevron+título
  //   ([16,74 85x24], accessible="true"), que é o botão de verdade. Um `accessibility id:
  //   <titulo>` resolve o primeiro, pela ordem do documento, e o toque não faz nada — daí a
  //   necessidade da class chain indexada.
  //
  // O header é custom (React Native), então nem driver.back() nem o gesto de borda disparam
  // pop nessa tela: os dois foram testados com a árvore comparada antes/depois e não mexeram
  // um byte. Ficam na cascata só como rede para outras telas.
  //
  // NÃO trocar a class chain por um predicate de geometria: o WDA 2.11.5 não aceita `x`, `y`
  // nem `accessible` em `-ios predicate string` — quatro variações testadas com o nó presente
  // na árvore, todas devolveram "no such element".
  //
  // O critério de sucesso é a TAB BAR aparecer, não "a árvore mudou". No CI iOS Run #13
  // (iPhone 15 Pro Max) o tap no Back saiu durante o re-render de Favoritos depois de
  // desfavoritar (skeleton -> lista vazia), não navegou, e o diff de getPageSource devolveu
  // "mudou" porque o estado vazio acabou de renderizar — o método declarou sucesso numa tela
  // que não tinha saído do lugar, e o abrirPerfil seguinte morreu com "tab-menu still not
  // displayed". As duas telas de onde o spec volta (listagem e Favoritos) não têm tab bar, e as
  // duas para onde ele volta (Categorias e Account Menu) têm: `tab-menu` presente = saiu.
  //
  // Antes de tocar, a tela precisa estar parada (aguardarTelaEstavel): no mesmo run o WDA levou
  // 6,7s para entregar o tap porque a lista ainda animava. E como o primeiro tap pode se perder
  // (mesmo padrão do "Sign in", draft 09), cada caminho tenta duas vezes antes de passar ao
  // próximo.
  async voltarIOS(titulo?: string) {
    await this.aguardarTelaEstavel();

    const back = "accessibility id:Back";
    if (await $(back).isDisplayed().catch(() => false)) {
      if (await this.tentarVoltarIOS(back, 'accessibility id:Back')) return;
    }

    if (titulo) {
      const cabecalho = `-ios class chain:**/XCUIElementTypeOther[\`name == "${titulo}"\`][2]`;
      if (await $(cabecalho).isDisplayed().catch(() => false)) {
        if (await this.tentarVoltarIOS(cabecalho, `chevron do cabeçalho ("${titulo}")`)) return;
      }
    }

    try {
      await driver.back();
      if (await this.chegouNaTabBarIOS()) {
        console.log('↩ voltar: driver.back()');
        return;
      }
    } catch {
      // segue para o gesto
    }

    await swipeBordaEsquerda();
    if (await this.chegouNaTabBarIOS()) {
      console.log('↩ voltar: swipe da borda esquerda');
      return;
    }

    throw new Error(
      `voltar() no iOS: nenhum caminho levou a uma tela com tab bar (titulo="${titulo ?? '—'}"). ` +
      'Esta tela precisa de captura nova pelo mobile-ui-inspector — não insistir por tentativa e erro.'
    );
  }

  // Dois taps no mesmo alvo, cada um precedido da checagem do banner e seguido da espera pela
  // tab bar. Devolve false se nenhum dos dois levou à tab bar.
  private async tentarVoltarIOS(seletor: string, rotulo: string): Promise<boolean> {
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      const alvo = await $(seletor);
      if (!(await alvo.isDisplayed().catch(() => false))) return false;
      await this.fechaBanner();
      await alvo.click();
      if (await this.chegouNaTabBarIOS()) {
        console.log(`↩ voltar: ${rotulo}${tentativa > 1 ? ` (tap ${tentativa}/2)` : ''}`);
        return true;
      }
      console.log(`⚠ voltar: tap ${tentativa}/2 em ${rotulo} não levou à tab bar`);
    }
    return false;
  }

  private async chegouNaTabBarIOS(): Promise<boolean> {
    const chegou = await $("accessibility id:tab-menu")
      .waitForDisplayed({ timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (chegou) await driver.pause(timewhait);
    return chegou;
  }

  // Espera a árvore parar de mudar: duas leituras iguais de getPageSource com 1s de intervalo.
  // Serve para não tocar numa tela que ainda está recarregando (skeleton -> conteúdo), que é
  // onde o tap se perde. Independe de plataforma e de texto. Se não estabilizar em `timeout`,
  // só registra e segue — quem decide se a ação funcionou é a validação do passo.
  async aguardarTelaEstavel(timeout = 15000) {
    const inicio = Date.now();
    let anterior = await driver.getPageSource();
    while (Date.now() - inicio < timeout) {
      await driver.pause(1000);
      const atual = await driver.getPageSource();
      if (atual === anterior) return;
      anterior = atual;
    }
    console.log(`⚠ Tela ainda mudando após ${timeout}ms de espera — seguindo mesmo assim`);
  }

  // Digita num campo do formulário sem deixar o WDA fazer "tap + digita" de uma vez só.
  //
  // O que o appium.log do Run #8 mostrou, igual nos cinco aparelhos: o addValue chega com o
  // campo sem foco ("Neither the XCUIElementTypeOther (Email) ... have the keyboard input
  // focus"), o WDA dá o tap ele mesmo ("Trying to tap the element to have it focused"), espera
  // ~0,5s de "idle" e despeja a string inteira em menos de 1s (maxTypingFrequency 60, o
  // default). Nesse meio segundo o teclado ainda está subindo e o formulário refluindo — o
  // draft 09 mediu o container encolhendo de 923 para 615 — e a letra perdida cai sempre no
  // 3º/4º caractere, dentro dessa janela. É a assinatura de TextInput controlado do React
  // Native engolindo tecla quando a thread JS não acompanha a digitação.
  //
  // Contramedida em duas partes: (a) focar o campo NÓS MESMOS e só digitar depois que o
  // teclado estiver de pé e o layout assentado; (b) digitar mais devagar, trocando o
  // maxTypingFrequency do WDA só durante o preenchimento — é setting de sessão
  // (/appium/settings), não capability, então não encosta no wdio.conf.ts nem no Android.
  // O valor 20 é ponto de partida; a unidade do WDA não é documentada de forma confiável e o
  // critério é empírico: os cinco emails íntegros no frame do vídeo. No app migrado a sessão
  // A usou 20 com sucesso (login real, 23 e 9 caracteres).
  //
  // Não há como conferir o texto digitado pela árvore (nota 1 do logarIOS); a checagem real
  // é o modal de erro, tratado no laço do botão de entrar. A senha nunca é logada — só o
  // comprimento.
  protected async digitarIOS(seletor: string, valor: string, rotulo: string) {
    const campo = await $(seletor);
    await this.waitForElement(campo);
    await this.fechaBanner();
    await campo.click();

    const tecladoAbriu = await driver
      .waitUntil(() => driver.isKeyboardShown(), { timeout: 5000, interval: 250 })
      .then(() => true)
      .catch(() => false);
    if (!tecladoAbriu) {
      console.log(`⚠ ${rotulo}: isKeyboardShown() não confirmou o teclado em 5s — digitando mesmo assim`);
    }
    // Espera o reflow do formulário (923 -> 615) terminar antes da primeira tecla.
    await driver.pause(1000);

    await driver.updateSettings({ maxTypingFrequency: 20 });
    try {
      await campo.addValue(valor);
    } finally {
      await driver.updateSettings({ maxTypingFrequency: 60 });
    }
    console.log(`⌨ ${rotulo}: ${valor.length} caracteres digitados com o teclado ${tecladoAbriu ? 'aberto' : 'não confirmado'}`);
    await driver.pause(500);
  }

  async debugContextAndSource() {
    console.log('=== CONTEXTOS ===');
    console.log(await driver.getContext());
    console.log(await driver.getContexts());

    console.log('\n=== PAGE SOURCE (primeiros 3000 chars) ===');
    const source = await driver.getPageSource();
    console.log(source.slice(0, 3000));
  }


  async elementVisible(element: ChainablePromiseElement): Promise<void> {
    await expect(element).toBeDisplayed();
  }

}

export const scrollFinger = async () => {
  const { width, height } = await driver.getWindowRect();

  const startX = width * 0.448;   // 44.8%
  const startY = height * 0.817;  // 81.7%
  const endX   = width * 0.508;   // 50.8%
  const endY   = height * 0.146;  // 14.6%

  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: startX, y: startY },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerMove', duration: 800, x: endX, y: endY },
        { type: 'pointerUp', button: 0 }
      ]
    }
  ]);

  // releaseActions (DELETE /actions) não é suportado em alguns Appium (ex.: AWS Device Farm) e
  // lança "unknown command". O gesto já foi aplicado pelo performActions; ignorar a falha aqui.
  try {
    await driver.releaseActions();
  } catch {
    // no-op: endpoint ausente nesse host
  }
};


// Gesto de "pop" do stack navigator do iOS: arrastar da borda esquerda para a direita. Usado
// como último recurso do voltarIOS(), na tela que não tem botão de voltar na árvore.
export const swipeBordaEsquerda = async () => {
  const { width, height } = await driver.getWindowRect();
  const meio = Math.round(height * 0.5);

  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: 2, y: meio },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerMove', duration: 400, x: Math.round(width * 0.9), y: meio },
        { type: 'pointerUp', button: 0 }
      ]
    }
  ]);

  try {
    await driver.releaseActions();
  } catch {
    // no-op: endpoint ausente nesse host
  }
};


export const scrollUntilVisible = async (
    element: ChainablePromiseElement,
    maxScrolls: number = 14
  ) => {
    let scrollCount = 0;
  
    while (scrollCount < maxScrolls) {
      const isVisible = await element.isDisplayed().catch(() => false);
  
      console.log(`🔎 Tentativa ${scrollCount + 1}/${maxScrolls} — visível?`, isVisible);
  
      if (isVisible) {
        console.log("✨ Elemento encontrado!");
        return true;
      }
  
      await scrollFinger();
      await driver.pause(500);
  
      scrollCount++;
    }
  
    console.warn("⚠ Elemento NÃO encontrado após todos os scrolls.");
    return false;
};

export const forceScrollBeforeSearching = async (scrolls: number = 6) => {
  for (let i = 0; i < scrolls; i++) {
    console.log(`🔄 Scroll obrigatório ${i + 1}/${scrolls}`);
    await scrollFinger();
    await driver.pause(300);
  }
};

export const timewhait = 3000;

