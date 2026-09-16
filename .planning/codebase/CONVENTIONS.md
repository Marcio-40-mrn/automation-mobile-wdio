# CONVENTIONS

Levantado em 2026-09-16 lendo os page objects, a spec e o `wdio.conf.ts`. São as convenções
**observadas no código**; as regras de processo (o que nunca fazer) estão em
`REQUIREMENTS.md` → "Regras invioláveis".

## Uma suíte, duas plataformas

- Um único `test/specs/test.spec.ts`; **nenhum** arquivo, classe ou método com sufixo de SO
  exposto para a spec.
- A ramificação fica **dentro do método público**, na primeira linha:

  ```ts
  async logar(email: string, senha: string) {
      if (process.env.PLATFORM === 'ios') return this.logarIOS(email, senha);
      // ...Android
  }
  ```

  O ramo iOS é um método `private ...IOS()` no mesmo arquivo (`logarIOS`, `voltarIOS`,
  `favoritarPrimeiroProdutoIOS`, `tirarSelecaoItemIOS`, `validaElementoIOS`,
  `abrirCategoriasIOS`, `fechaBannerIOS`). Padrão inaugurado por `HomePage.ativarApp()`.
- Nomes de método em português, no infinitivo ou imperativo (`abrirPerfil`, `logar`,
  `tirarSelecaoItem`). O typo `validaElememnto` está em dois page objects e na spec — é o
  nome atual; renomear é mudança de escopo, não correção de passagem.

## Seletores

| Plataforma | Forma preferida | Exemplo no código |
|---|---|---|
| Android | `accessibility id:<texto visível>` | `accessibility id:Categorias` |
| Android | `id:<resource-id>` para diálogos do sistema | `id:com.android.permissioncontroller:id/permission_allow_button` |
| Android | `-android uiautomator:` só quando não há id | `new UiSelector().className("android.view.View").instance(0)` |
| iOS | `accessibility id:<id interno>` | `accessibility id:tab-menu`, `accept-button` |
| iOS | `-ios predicate string` combinando `name` e `label` quando o id se repete | ver `CategoriasPage.favoritarPrimeiroProdutoIOS` |
| iOS | `-ios class chain` com índice só onde medido em draft | `voltarIOS` (chevron `[2]`, draft 34) |

Quando o mesmo elemento tem ids diferentes entre versões do app, os dois ficam num array e
`clickFirstPresent()` escolhe (`SELETORES_PERFIL` = `Menu` | `Perfil`).

**Coordenada só como fração da janela** (`tapProporcional(fx, fy, descricao)`), e só nos dois
pontos do onboarding iOS listados como exceção em `REQUIREMENTS.md`. Nunca pixel absoluto.

## Esperas e validação

- `BasePage.defaultTimeout = 20000`; `timewhait` (sic) é a pausa curta pós-clique.
- `clickIfPresent(selector, 8000)` para passos **opcionais** (permissões, onboarding que
  varia por device) — loga `⏭️` e segue.
- Toda navegação é validada **pelo destino**, não pelo retorno do comando: `voltar()` espera
  a tab bar; `logarIOS` espera o estado seguinte e detecta o modal de erro; desfavoritar faz
  poll de 30s até o item sumir. Motivo: no iOS `acceptAlert()`, `hideKeyboard` e
  `clearValue()` reportam sucesso sem agir (`STATE.md`).
- `aguardarTelaEstavel()` (duas leituras iguais de `getPageSource` com 1s) antes de cliques
  em telas que recarregam.
- Tentativas em laço com limite explícito (banner 3x, tap 2x) e **erro nomeado** ao esgotar
  — nunca seguir em silêncio.
- Erros de estado conhecido têm nome próprio na mensagem: `"conta suja"`, `"Favorito órfão
  na conta"`, `"o app recusou as credenciais"`.

## Banner do Insider

`step()` na spec chama `homePage.fechaBanner()` antes de **todo** passo; no ramo iOS os
métodos chamam `fechaBanner()` de novo imediatamente antes de cada clique. Marcador de
presença: `insiderLayout` (Android) / WebView `Insider WebView Content` (iOS); ação:
`accessibility id:Close`; confirmação: marcador sumiu. Detalhes e histórico: `ROADMAP.md`
("Sobre o banner do Insider no iOS") e `plans/`.

## Logs

Prefixo por emoji, com significado fixo — o `STATE.md` os usa como checklist de run:
`✅` validado · `⚠` tentativa repetida · `🟡` aguardando · `👆` clique com rect ·
`↩` voltar (qual caminho) · `🛍` produto escolhido · `💔`/`🤍` desfavoritar/coração vazio ·
`🔎` diagnóstico · `🧹` limpeza de favorito órfão · `⌨` digitação · `🔑` conta do run ·
`🎥` vídeo anexado · `⏭️` passo opcional pulado.

## Comentários

Comentário longo, em português, **explicando o incidente** que motivou a linha (ex.:
"foi o que derrubou os 5 devices do CI iOS Run #5"). Ao editar, manter a densidade: quem lê
o código sem o `.planning/` precisa achar o porquê ali.

## Allure

- Um `step()` por chamada de page object, nome = `objeto.metodo()`.
- `addHistoryId`/`addTestCaseId` com `adiciona-favoritos::<device>`; `addParentSuite` com
  `<device> — <conta>`; `addLabel('host', device)`.
- Anexos só para evidência de falha (screenshot do banner, aviso de favorito órfão) e o vídeo.

## TypeScript

`strict`, `noUnusedLocals`, `noUnusedParameters`. Verificação: `npx tsc --noEmit`. Casts
`as any` são aceitos nas capabilities e no `startRecordingScreen` do iOS (tipos do WDIO não
cobrem as opções do XCUITest).
