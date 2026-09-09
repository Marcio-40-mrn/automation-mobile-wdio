# CLAUDE.md

Repositório de automação de testes mobile (WebdriverIO + Appium) do app Aramis,
executado localmente contra o AVD-S24 e no CI via AWS Device Farm.

## Memória do projeto: `.planning/`

Antes de planejar qualquer coisa, leia `.planning/`. É a memória persistente do projeto, no
padrão GSD:

| Arquivo | O que tem |
|---|---|
| `PROJECT.md` | o que é o projeto, stack, os ambientes de execução e como cada um é detectado |
| `REQUIREMENTS.md` | o fluxo coberto, critérios de aceite e as regras invioláveis |
| `ROADMAP.md` | os marcos, o que está feito e o que vem a seguir |
| `STATE.md` | onde o projeto está agora, o que está no working tree e as pendências abertas |
| `plans/` | um arquivo por iniciativa, mantido como registro depois de concluída |

Ao terminar uma iniciativa, atualize o `STATE.md` e marque o marco no `ROADMAP.md`. Não
duplique conteúdo entre `.planning/`, este arquivo e o `README.md` — referencie.

## Consultar o AWS Device Farm

**As credenciais existem e estão no `.env` da raiz** (`AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`), e o AWS CLI está instalado na máquina justamente para isso. Elas não
entram no ambiente sozinhas, então **carregue o `.env` antes de qualquer chamada**:

```bash
set -a; . ./.env; set +a; export AWS_DEFAULT_REGION=us-west-2
aws sts get-caller-identity
```

Sem esse `set -a`, o `aws` responde `InvalidClientTokenId`. Isso quer dizer "faltou carregar o
`.env`", **não** "não há credencial" — dizer que não há acesso à AWS sem ter tentado desse jeito
é erro, e já custou tempo mais de uma vez.

Dois detalhes do ambiente local:

- **Não existe `jq` no Git Bash daqui.** Use `--query` (JMESPath) com `--output text|json` do
  próprio AWS CLI.
- **O CLI do GitHub está bloqueado** pelo hook `.claude/hooks/block-github.mjs`, inclusive para
  leitura — e o bloqueio pega até comandos que só *mencionam* o nome dele, como este arquivo.
  Log de Actions só chega pelo Marcio; peça que ele rode com o prefixo `!`.

O que dá para levantar direto pelo CLI, sem depender do console web — dimensionar anexo, achar
o device que falhou, medir vídeo:

```bash
# runs recentes do projeto
aws devicefarm list-runs --arn "$DEVICE_FARM_PROJECT_ARN" \
  --query 'runs[0:10].[name,arn,result,counters.total]' --output text

# tamanho do "Customer Artifacts" (allure-results + vídeo) de cada device de um run
for JOB in $(aws devicefarm list-jobs --arn "$RUN_ARN" --query 'jobs[].arn' --output text); do
  NAME=$(aws devicefarm get-job --arn "$JOB" --query 'job.device.name' --output text)
  SUITE=$(aws devicefarm list-suites --arn "$JOB" --query "suites[?name=='Tests Suite'].arn" --output text)
  TEST=$(aws devicefarm list-tests --arn "$SUITE" --query 'tests[0].arn' --output text)
  URL=$(aws devicefarm list-artifacts --arn "$TEST" --type FILE \
    --query "artifacts[?name=='Customer Artifacts'].url" --output text)
  # HEAD não funciona na URL pré-assinada; um range de 1 byte devolve o total
  echo "$NAME :: $(curl -sL -r 0-0 -D - -o /dev/null "$URL" | grep -i '^content-range' | sed 's#.*/##')"
done
```

## Registro de dependências e rollback

Atualização realizada em **2026-09-01** (PR #14). Tag do ponto de retorno:
`deps-baseline-2026-09-01`.

Ambiente validado: Node `v22.18.0`, npm `11.7.0`. O CI usa `node-version: lts/*`.
O host do Device Farm roda **Node v18.20.8 / npm 10.8.2**.

### Versões

| Pacote | Baseline (funcionava) | Instalado agora |
|---|---|---|
| `@wdio/allure-reporter` | 9.21.0 | 9.31.4 |
| `@wdio/appium-service` | 9.20.1 | 9.31.5 |
| `@wdio/cli` | 9.20.1 | 9.31.5 |
| `@wdio/local-runner` | 9.20.1 | 9.31.5 |
| `@wdio/mocha-framework` | 9.20.1 | 9.31.5 |
| `@wdio/spec-reporter` | 9.20.0 | 9.31.2 |
| `allure-commandline` | 2.34.1 | 2.43.0 |
| `appium` | não declarado (3.1.1 aninhado) | **não declarado** (3.7.0 aninhado) |
| `appium-uiautomator2-driver` | 6.3.0 | 6.9.3 (range `^6.3.0`) |
| `cross-env` | 7.0.3 | 10.1.0 |
| `dotenv` | 17.2.3 | 17.4.2 |
| `wdio-ctrf-json-reporter` | 0.0.16 | 0.0.17 |

Vulnerabilidades no baseline: **51 (3 low, 11 moderate, 33 high, 4 critical)**.
Vulnerabilidades depois: **40 (4 low, 7 moderate, 27 high, 2 critical)**.

### Incidente run-22 (2026-09-01) — o que essa atualização quebrou

A primeira versão deste PR declarava `appium: ^3.7.0` como devDependency direta e
subia `appium-uiautomator2-driver` para `^8.5.0`. Resultado nas duas plataformas:

- Device Farm: `Setup Suite` PASSED (o `npm install` concluiu — `added 995 packages`;
  os avisos `EBADENGINE` do Node 18 são inofensivos), `Tests Suite` FAILED em 6/6
  devices Android e 5/5 iOS, com `Failed to create a session`.
- `appium.log` do host:

  ```
  Welcome to Appium v2.11.5
  The autodetected Appium home path: /tmp/devicefarm-workspace/.../test-package-xxxx
  No drivers have been installed in /tmp/devicefarm-workspace/.../test-package-xxxx
  Could not find a driver for automationName 'UiAutomator2' and platformName 'Android'
  ```

**Causa:** o Appium autodetecta o `APPIUM_HOME` a partir do diretório atual — se o
`package.json` ali declarar `appium` como dependência, ele adota esse diretório como
`APPIUM_HOME`. O `testspec.yml` roda dentro de `$DEVICEFARM_TEST_PACKAGE_PATH`, então
declarar `appium` fez o Appium 2.11.5 do host abandonar o `APPIUM_HOME` padrão (onde
UiAutomator2 e XCUITest estão pré-instalados) e passar a olhar para o pacote de teste,
que não tem driver nenhum.

**Efeito em cascata:** zero teste executado → nenhum `*-result.json` em
`allure-results/` (só `environment.properties`, `categories.json` e `executor.json`,
escritos pelo `onPrepare`) → o job `publish-report` caiu na guarda "Device Farm não
retornou allure-results", saiu com sucesso sem publicar → sem push na branch `reports`
→ o workflow "pages build and deployment" nunca disparou → o GitHub Pages ficou parado
no relatório de 28/08.

**Correção:** remover `appium` do `package.json` e voltar o driver para `^6.3.0`.
Só a **declaração** importa: o `appium` içado para `node_modules` como dependência
transitiva do driver não dispara a autodetecção.

### Rollback

```bash
git restore --source deps-baseline-2026-09-01 package.json package-lock.json
rm -rf node_modules
npm install
```

## Regras de manutenção de dependências

**Nunca declare `appium` no `package.json`.** Ver o incidente run-22 acima: quebra a
resolução de driver no Device Farm nas duas plataformas e derruba o relatório do
GitHub Pages sem deixar o workflow vermelho de forma óbvia.

**Toda devDependency é instalada no host do Device Farm.** O `testspec.yml` e o
`testspec-ios.yml` rodam `npm install` dentro de `$DEVICEFARM_TEST_PACKAGE_PATH`, em
Node 18. Qualquer alteração no `package.json` precisa ser validada com um run real do
Device Farm antes do merge — teste local contra o AVD-S24 não cobre esse caminho,
porque local o Appium é subido pelo próprio WDIO e no Device Farm é o do host.

**Nunca rode `npm audit fix --force` neste repositório.** Ele rebaixa o núcleo do
projeto para versões incompatíveis com `wdio.conf.ts`:

```
Updating @wdio/cli to 7.40.0, which is a SemVer major change.
Updating @wdio/appium-service to 7.40.0, which is a SemVer major change.
Updating @wdio/local-runner to 7.40.0, which is a SemVer major change.
Updating @wdio/mocha-framework to 8.14.0, which is a SemVer major change.
Updating wdio-ctrf-json-reporter to 0.0.12, which is a SemVer major change.
```

As vulnerabilidades restantes vêm em boa parte da subárvore do
`appium-uiautomator2-driver`. Subir o driver para a linha 8.x é possível **desde que
`appium` continue fora do `package.json`** — o driver em si não teve participação na
quebra do run-22. Ainda assim, qualquer mexida ali exige validação em run real.

O `appium-uiautomator2-driver` do `package.json` vale apenas para a execução
**local** (serviço `appium` em `wdio.conf.ts`, que retorna `[]` quando `isDeviceFarm`).
No Device Farm, o `testspec.yml` roda `devicefarm-cli use appium 2` e usa o Appium e o
driver pré-instalados no host.

## Como levantar os elementos de uma tela

**O Appium Inspector não expõe tudo.** Boa parte da árvore fica invisível na navegação por
ele — em especial o conteúdo de WebView (banners do Insider) e nós sem `resource-id`.
Vários ciclos de "trocar o seletor e torcer" já foram perdidos por causa disso.

**O jeito que funciona é este, e é o padrão daqui para frente:**

1. O Marcio abre o app e navega até a tela em questão, no AVD.
2. Ele avisa que a tela está pronta.
3. O Claude captura, **e só isso — nada de tocar na tela**:

   ```bash
   adb exec-out screencap -p > <tela>.png
   adb shell uiautomator dump /sdcard/window_dump.xml
   adb pull /sdcard/window_dump.xml <tela>.xml
   ```

4. O Claude lê o PNG (para ver o que o dump não mostra, como o "X" dentro da WebView) e
   parseia o XML (para os `resource-id`, `content-desc`, `text`, `bounds` e `clickable`
   reais), e **para imediatamente de controlar o AVD**.

**Esperar antes de capturar.** A tela precisa estar carregada. WebView é o caso extremo: o
`htmlView` aparece com `NAF="true"` e zero filhos nos primeiros segundos, e só depois publica
a árvore inteira. Capturar cedo demais faz um elemento existente parecer inexistente.

**Não subir execução no AVD sem pedido explícito.** O emulador é ambiente de trabalho do
Marcio; dois runs simultâneos invalidam os dois. Quem roda `npm run wdio:android` é ele.

### Sub-agents de inspeção

Os agentes são divididos por **papel**, não por sistema operacional:

- `.claude/agents/mobile-ui-inspector.md` — é a ferramenta padrão para o procedimento acima,
  nas duas plataformas. Use-o em vez de repetir os comandos na mão.
- `.claude/agents/mobile-draft-writer.md` — lê as capturas brutas e escreve o draft da tela.
  Não toca no aparelho, para que a inspeção e a redação corram em paralelo sem uma travar a
  outra.

**No iOS não existe `adb`, então os comandos acima não se aplicam** — o mesmo agente cobre o
iOS por outro mecanismo: uma sessão Appium contra o endpoint de Remote Access do Device Farm,
com `driver.getPageSource()` (árvore XCUITest) e `driver.takeScreenshot()`. A sessão dura
20–30min e a URL pré-assinada não renova; a regra que vale ali é **capturar primeiro,
documentar depois** — a captura sobrevive à sessão, a redação não precisa esperar.

O levantamento do iOS **já está feito**: 33 drafts em `.planning/drafts/ios/` (índice em
`00-INDICE.md`) e o consolidado `.planning/RELATORIO-ANOMALIAS-IOS.md`. Antes de pedir nova
captura de uma tela, conferir se ela já não está documentada ali.
