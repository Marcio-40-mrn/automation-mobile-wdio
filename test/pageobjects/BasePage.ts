import type { ChainablePromiseElement } from 'webdriverio';


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
    const botaoFechar = "accessibility id:Close";

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      // Sem banner na tela o método custa uma consulta e retorna: roda antes de todo step.
      if (!(await this.bannerNaTela(overlay))) return;

      const close = await $(botaoFechar);
      const apareceu = await close
        .waitForDisplayed({ timeout: 10000 })
        .then(() => true)
        .catch(() => false);

      if (!apareceu) {
        console.log(`⏳ Banner na tela mas o "Close" não apareceu (tentativa ${tentativa}/3)`);
        continue;
      }

      await close.click();

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

    if (await this.bannerNaTela(overlay)) {
      throw new Error('Banner do Insider não fechou após 3 tentativas de clicar em "Close"');
    }
  }

  // No iOS não existe equivalente confiável ao insiderLayout. O candidato observado (a Window
  // "InsiderTemplateWindow") apareceu uma única vez em 8 sessões de inspeção, na tela de
  // boas-vindas, e nunca mais — amostra pequena demais para virar marcador de presença. Por
  // isso aqui o gatilho é o próprio "Close", idêntico nas duas plataformas (o criativo é a
  // mesma WebView do Insider). Custo: uma consulta por step, igual ao Android.
  //
  // Atenção: no iOS o banner pode aparecer JÁ na tela de boas-vindas, antes de qualquer login
  // — diferente do Android, onde só foi visto depois dele.
  private async fechaBannerIOS() {
    const botaoFechar = "accessibility id:Close";

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      const close = await $(botaoFechar);
      if (!(await close.isDisplayed().catch(() => false))) return;

      console.log(`🚫 Banner do Insider na tela (tentativa ${tentativa}/3)`);
      await close.click();
      await driver.pause(timewhait);
      // Não retorna: pode haver um segundo criativo enfileirado atrás do primeiro.
    }

    const aindaNaTela = await $(botaoFechar).isDisplayed().catch(() => false);
    if (aindaNaTela) {
      throw new Error('Banner do Insider não fechou após 3 tentativas de clicar em "Close"');
    }
  }

  // Presença do banner pelo insiderLayout: o htmlView some do dump em alguns momentos mesmo
  // com o banner visível na tela, então ele não serve de marcador.
  private async bannerNaTela(overlay: string): Promise<boolean> {
    const el = await $(overlay);
    return el.isDisplayed().catch(() => false);
  }


  async iniciaApp() {
    await this.clickIfPresent("-android uiautomator:new UiSelector().className(\"android.view.View\").instance(0)");
  }

  async ativaGps() {
    await this.clickIfPresent("id:com.android.permissioncontroller:id/permission_allow_one_time_button");
  }

  async permiteNotificacao() {
    await this.clickIfPresent("id:com.android.permissioncontroller:id/permission_allow_button");
  }

  async negaNotificacao() {
    await this.clickIfPresent("id:com.android.permissioncontroller:id/permission_deny_button");
  }

  async continua() {
    await this.clickIfPresent("accessibility id:Continue");
  }

  async termo1() {
    const element = await $("accessibility id:I have read and agree");
    await forceScrollBeforeSearching(6);
    const found = await scrollUntilVisible(element);
    if (found) {
      await element.click();
      await driver.pause(timewhait);
    } else {
      console.log("⏭️ termo1 pulado (não encontrado após scrolls)");
    }
  }

  async termos2() {
    const element = await $("accessibility id:I have read and agree");
    await forceScrollBeforeSearching(5);
    const found = await scrollUntilVisible(element);
    if (found) {
      await element.click();
      await driver.pause(timewhait);
    } else {
      console.log("⏭️ termos2 pulado (não encontrado após scrolls)");
    }
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
  async rolaAteVisivelIOS(seletor: string): Promise<boolean> {
    const el = await $(seletor);
    if (await el.isDisplayed().catch(() => false)) return true;

    await forceScrollBeforeSearching(6);
    return scrollUntilVisible(await $(seletor));
  }

  // O CTA "Toque para começar" da tela de boas-vindas NÃO gera nó algum na árvore XCUITest —
  // nem visível, nem oculto. Confirmado por busca no XML bruto: zero ocorrências de "Toque" e
  // um único Button na árvore inteira (o "Close" do banner). Só coordenada resolve.
  async iniciaAppIOS() {
    await this.tapProporcional(205 / 402, 780 / 874, 'CTA "Toque para começar"');
    await driver.pause(timewhait);
  }

  // O alerta de permissão de localização é do SpringBoard: não aparece no getPageSource() do
  // app (zero ocorrências de "Allow"/"Alert" na árvore), então não há seletor possível. Quem
  // o enxerga é o XCUITest, por `mobile: alert` — foi assim que os rótulos foram levantados
  // numa sessão de Remote Access:
  //   ["Precise: On","Precise: On","Allow Once","Allow While Using App","Don't Allow"]
  //
  // NÃO voltar a fechá-lo por coordenada. A versão anterior tocava em (200/402, 663/874) —
  // fração da janela, medida num iPhone 402x874. Alerta do SpringBoard é diálogo de altura
  // fixa centralizado: não escala com a tela. Em 390-393x844-852 a fração cai dentro do botão;
  // em 430x932 (14 Pro Max, 15 Pro Max) não cai, o alerta fica de pé e, sendo modal, engole
  // todo clique seguinte. Era isso que travava o onboarding nesses dois aparelhos no run #27.
  //
  // acceptAlert() também não serve: retorna sucesso com o alerta ainda na tela (3 ocorrências
  // nos drafts), e a capability autoAcceptAlerts:true não o dispensa.
  async permissaoLocalizacaoIOS() {
    // Os rótulos vêm do idioma do iOS, não do app: nos aparelhos do pool o alerta está em
    // inglês, mesmo com a mensagem do app em português. O undefined final é o accept sem
    // rótulo, último recurso.
    const rotulos: (string | undefined)[] = ['Allow While Using App', 'Permitir Ao Usar o App', undefined];

    const texto = await this.esperaAlertaIOS();
    if (texto === null) {
      console.log('🔔 Nenhum alerta de localização apareceu — seguindo.');
      return;
    }
    console.log(`🔔 Alerta de localização na tela: ${texto}`);

    for (const buttonLabel of rotulos) {
      const descricao = buttonLabel ?? 'accept sem rótulo';
      try {
        await driver.execute('mobile: alert', buttonLabel ? { action: 'accept', buttonLabel } : { action: 'accept' });
        console.log(`✅ Alerta de localização aceito por "${descricao}"`);
        break;
      } catch (erro) {
        console.log(`⚠ "${descricao}" não serviu: ${erro}`);
      }
    }

    await driver.pause(timewhait);

    // Confirmação obrigatória: o acceptAlert() antigo já reportava sucesso com o alerta na
    // tela, então "o comando não deu erro" não vale como prova de que fechou.
    if ((await this.esperaAlertaIOS(5000)) !== null) {
      throw new Error(
        'Alerta de localização do iOS não fechou. Ele é modal: enquanto estiver de pé, todo ' +
        'clique no app é engolido e o onboarding não avança. Levantar os rótulos com ' +
        '`mobile: alert` action "getButtons" numa sessão de Remote Access antes de mexer aqui.'
      );
    }
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
  // As TRÊS telas usam o mesmo name (accept-button), variando só o label ("Continue" na
  // primeira, "I have read and agree" nas outras duas). Elas aparecem uma de cada vez, então o
  // seletor não é ambíguo — mas um laço ingênuo tocaria duas vezes na mesma tela.
  //
  // O sinal de transição é o botão SAIR da viewport: a tela seguinte entra rolada no topo, com
  // o accept-button lá embaixo em visible="false". Uma pausa fixa não distingue "ainda na
  // mesma tela" de "já na próxima"; esperar o botão sumir, sim.
  async aceitaOnboardingIOS() {
    const aceite = "accessibility id:accept-button";
    const telas = ['carrossel de permissões', 'política de privacidade', 'termos e condições'];

    for (const tela of telas) {
      const existe = await $(aceite).waitForExist({ timeout: 8000 }).then(() => true).catch(() => false);
      if (!existe) {
        console.log(`⏭️ Aceite pulado (${tela}): "${aceite}" não existe na árvore`);
        continue;
      }

      const alcancou = await this.rolaAteVisivelIOS(aceite);
      if (!alcancou) {
        console.log(`⏭️ Aceite pulado (${tela}): "${aceite}" não ficou alcançável`);
        continue;
      }

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
          `Onboarding iOS travado em "${tela}": "${aceite}" continuou visível 15s depois do ` +
          'clique, ou seja, a tela não trocou. Suspeitar de modal do sistema por cima do app — ' +
          'o alerta de localização é o caso conhecido.'
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
  async voltarIOS(titulo?: string) {
    const antes = await driver.getPageSource();

    const back = await $("accessibility id:Back");
    if (await back.isDisplayed().catch(() => false)) {
      await back.click();
      await driver.pause(timewhait);
      if (await this.telaMudou(antes)) {
        console.log('↩ voltar: accessibility id:Back');
        return;
      }
    }

    if (titulo) {
      const cabecalho = `-ios class chain:**/XCUIElementTypeOther[\`name == "${titulo}"\`][2]`;
      const grupo = await $(cabecalho);
      if (await grupo.isDisplayed().catch(() => false)) {
        await grupo.click();
        await driver.pause(timewhait);
        if (await this.telaMudou(antes)) {
          console.log(`↩ voltar: chevron do cabeçalho ("${titulo}")`);
          return;
        }
      }
    }

    try {
      await driver.back();
      await driver.pause(timewhait);
      if (await this.telaMudou(antes)) {
        console.log('↩ voltar: driver.back()');
        return;
      }
    } catch {
      // segue para o gesto
    }

    await swipeBordaEsquerda();
    await driver.pause(timewhait);
    if (await this.telaMudou(antes)) {
      console.log('↩ voltar: swipe da borda esquerda');
      return;
    }

    throw new Error(
      `voltar() no iOS: nenhum caminho mudou a tela (titulo="${titulo ?? '—'}"). ` +
      'Esta tela precisa de captura nova pelo mobile-ui-inspector — não insistir por tentativa e erro.'
    );
  }

  private async telaMudou(antes: string): Promise<boolean> {
    const depois = await driver.getPageSource();
    return depois !== antes;
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

