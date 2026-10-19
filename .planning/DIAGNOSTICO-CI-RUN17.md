# Diagnóstico — CI Run #17: Android sem relatório no GitHub Pages, só o iOS publicado

Feito em **2026-10-05** pelo AWS CLI, a partir dos artefatos do Device Farm. Nenhum código, workflow
ou configuração foi alterado. **Ponto de partida da próxima sessão para resolver o problema.**

## Sintoma (relatado pelo Marcio)

Depois do CI Run #17 (2026-10-03), o GitHub Pages recebeu só o relatório do iOS. O do Android não
foi gerado.

## Conclusão

| # | O que aconteceu | Evidência |
|---|---|---|
| 1 | **O CI testou o APP ANTIGO.** O APK enviado foi `app-run17.apk` = `com.aramis.ecomm` **1.14.3, versionCode 486**. A suíte atual é do app migrado (1.20.x). | `get-upload` do `appUpload` do run (metadata `version_name: 1.14.3`, `version_code: 486`) |
| 2 | **Por que o APK errado:** o workflow baixa o build pelo `scripts/install-apk.mjs --no-install` com os secrets `BUILD_PROFILE_ANDROID` e `BUILD_SELECTION`. No `.env` local eles estão como `production` e `latest`, e o `production` mais recente ainda é o app antigo. Os valores dos secrets no GitHub **não foram vistos**, só deduzidos pelo `.env` e pelo APK resultante. | `.github/workflows/mobile_test.yml` linhas 37–44; `.env` (`BUILD_*`) |
| 3 | **Todos os testes falham no mesmo passo**, nos 6 Samsungs (S23 Ultra, S23+, S24 Ultra, S24+, S25 Ultra, S26 Ultra): `HomePage.validarHome` → `Home não apareceu: tab-home visível=true, editorial-home-root presente=false`. O app antigo não tem `editorial-home-root`. Antes de falhar, cada teste refaz o onboarding completo (Boas-vindas, permissões, Tópicos, Política, Termos). | `Test spec output` de cada device (`grep 'Error in "'`, `grep 'editorial-home-root presente=false'`) |
| 4 | **O Device Farm cortou o teste aos 15 min.** O run tem `jobTimeoutMinutes = 15`. A `Tests Suite` ficou `STOPPED` ("Tests stopped") com 15,25 device-minutes nos 6 aparelhos, e o WDIO parou em `Spec Files: 0 passed, 3 failed, 4 total (75% completed) in 00:14:35`. O fim do log tem `[DEVICEFARM] ########### Stop received, exit testspec execution ###########`. | `get-run`, `list-jobs`, `list-suites` e o fim do `Test spec output` |
| 5 | **Sem `post_test`, sem relatório.** Quem copia `./allure-results` para `$DEVICEFARM_LOG_DIR` é a fase `post_test` do `testspec.yml` (linha 65). Com a fase `test` interrompida, ela não rodou: o zip `Customer Artifacts` do S23 Ultra (~200 KB) contém **só** `Host_Machine_Files/$DEVICEFARM_LOG_DIR/appium.log`. Sem nenhum `*-result.json`, o passo "Generate Allure HTML reports per platform" pula o Android, e o publish só leva o iOS. | `unzip -l` do `Customer Artifacts`; `testspec.yml` linhas 62–66; `mobile_test.yml` passo "Generate Allure HTML reports per platform" (~linha 728) |
| 6 | **Por que o iOS publicou:** os runs iOS (um por iPhone) terminaram antes dos 15 min (iPhone 13: `Tests Suite` FAILED em 12,14 min), porque parte dos testes de então pulava no iOS. O `post_test` rodou e o `allure-results` chegou. **O relatório iOS publicado não é verde:** tem as mesmas falhas de `editorial-home-root` em todos os testes executados. IPA conferido em 2026-10-06: **1.14.3 build 328**, o app antigo (ver atualização abaixo). | `Test spec output` do `CI iOS Run #17 - Apple iPhone 13` |
| 7 | **Não foi caso isolado:** o `CI Run #16` (2026-10-02 13:17) teve o mesmo padrão no Android: S23 Ultra FAILED e os outros 5 `STOPPED`. Pela causa da falha do #16 **não se olhou**. | `list-jobs` do Run #16 |

Também saiu no `get-run`, como aviso, a mensagem do Device Farm: *"This test spec file targets the
legacy Android test environment. Support for this test environment is being ended later this
year"*. Não é a causa deste problema, mas é uma pendência para o futuro.

## Atualização 2026-10-06 — CI Run #18 (depois da troca do secret)

Conferido pelo AWS CLI, no binário enviado, e não por dedução:

| Run | Plataforma | App enviado | Fonte |
|---|---|---|---|
| #17 | Android | `com.aramis.ecomm` **1.14.3 / versionCode 486** (antigo) | `get-upload` → `metadata.version_name/version_code` |
| #18 | Android | `com.aramis.ecomm` **1.20.11 / versionCode 494** (migrado, o mesmo do AVD) | idem |
| #17 | iOS | **1.14.3 / build 328** (antigo) | `Info.plist` extraído do IPA baixado (`CFBundleShortVersionString`/`CFBundleVersion`) |
| #18 | iOS | **1.14.3 / build 328** (antigo), **mesmo arquivo do #17** (md5 `b4a1d7ec…` idêntico) | idem |

O metadata do Device Farm **não traz versão para IPA**; a versão do iOS só sai do `Info.plist`.

- **Android #18:** com o app certo, a Home passa (`🏠 Home confirmada (tab-home + editorial-home-root)`).
  A POC falhou em `LoginPage.logar` (linha 75): *"a tela de Login saiu, mas a tab bar (tab-home) não
  apareceu em 20s"*, com a conta do device (S23 Ultra: `...+qa160`). A causa **não foi verificada**
  (sem frame do vídeo). Hipótese: conta do CI não cadastrada no app migrado (ver M5 no `STATE.md`).
  Os specs de onboarding rodaram e passaram nos diálogos.
- **De novo sem relatório Android:** os 6 Samsungs `STOPPED` com 15,25–15,31 min na `Tests Suite`;
  `Customer Artifacts` de **todos os 6** só com `appium.log`. Mesma causa do item 4/5 acima: timeout de
  15 min mata a fase `test` e o `post_test` não copia o `allure-results`. **Trocar o app não resolve
  isso.**
- **iOS:** o secret do iOS (`BUILD_PROFILE_IOS`) continua baixando o app antigo.
- **Achado lateral:** o `Test spec output` de cada Samsung passa de 170 MB. O WDIO em `logLevel: info`
  imprime o vídeo inteiro em base64 no `RESULT` do `mobile: stopMediaProjectionRecording`.

## Decisões em aberto (do Marcio) para resolver

1. **Qual perfil ou build do EAS é o app migrado** para o CI baixar (`BUILD_PROFILE_ANDROID` /
   `BUILD_PROFILE_IOS` / `BUILD_SELECTION`). Isso não está escrito no repositório. No AVD, o app
   migrado é o 1.20.11 build 494.
2. **Tempo do Android:** mesmo com o app certo, 16 testes com onboarding completo por aparelho
   dificilmente cabem em 15 min. No AVD, a Etapa 1 reduzida a 5 testes levou ~18 min. As opções
   são subir o `jobTimeoutMinutes` no `schedule-run`, dividir os specs em mais de um run, ou as duas
   coisas. A escolha é do Marcio, depois de um plano aprovado.
   **Decidido em 2026-10-13 (Marcio): subir o timeout para 60 min.** A mudança foi feita no padrão do
   projeto, e não no `schedule-run`: `aws devicefarm update-project --arn "$DEVICE_FARM_PROJECT_ARN"
   --default-job-timeout-minutes 60`, conferida por `get-project` (`ecomm 60`). O workflow e os
   testspecs não mudaram, e nada disso aparece no git. Vale para Android e iOS, porque nenhum
   `schedule-run` do `mobile_test.yml` passa timeout próprio. Para desfazer: o mesmo comando com `15`.
   Dados levantados na mesma data: o limite da conta é 150 min (`maxJobTimeoutMinutes`), a conta paga
   por minuto (`unmeteredDevices` 0 nas duas plataformas, trial zerado) e o polling do workflow espera
   até 120 min (120 × 60 s).
   **Ainda não validado em run.** Pela única medida de uma suíte que passou (5 testes em ~18 min no
   AVD), os 16 testes dariam ~58 min no Android, perto do limite. É estimativa, não medida. Se estourar,
   o relatório do device some de novo (decisão 3). A redução de testes, se houver, é decidida pelo
   Marcio teste a teste.
3. **Opcional:** fazer o relatório sair mesmo com timeout. Por exemplo, copiar o `allure-results`
   para `$DEVICEFARM_LOG_DIR` durante a fase `test`, e não só no `post_test`. Mexe no
   `testspec.yml`, então exige run real (regra do `REQUIREMENTS.md`).

## Como cheguei a isso — passo a passo e onde busquei

Tudo pelo AWS CLI, região `us-west-2`, com as credenciais do `.env` (procedimento do `CLAUDE.md`).
Os arquivos baixados ficaram em `/tmp/df17/` no Git Bash, que é temporário: refazer os downloads se
precisar.

```bash
set -a; . ./.env; set +a; export AWS_DEFAULT_REGION=us-west-2

# 1) Runs recentes do projeto -> "CI Run #17" com result STOPPED (não FAILED), 18 suites, 12 passed
aws devicefarm list-runs --arn "$DEVICE_FARM_PROJECT_ARN" \
  --query 'runs[0:12].[name,result,status,created,counters.total,counters.passed,counters.failed,arn]' --output text

# ARNs usados
R17_ANDROID=arn:aws:devicefarm:us-west-2:383976104411:run:dd0b325a-914f-49d4-9614-39d882042e05/d0c40404-73af-4116-be35-294657fc61c6
R17_IOS_IPHONE13=arn:aws:devicefarm:us-west-2:383976104411:run:dd0b325a-914f-49d4-9614-39d882042e05/e4c5f92c-9c2a-4f6f-b790-3fb4677e91e5
R16_ANDROID=arn:aws:devicefarm:us-west-2:383976104411:run:dd0b325a-914f-49d4-9614-39d882042e05/213641dc-268b-4fa2-8e38-fae93eb9367b

# 2) Detalhe do run -> jobTimeoutMinutes 15, started 17:32:48, stopped 18:15:53
aws devicefarm get-run --arn $R17_ANDROID \
  --query 'run.[status,result,started,stopped,deviceMinutes.total,jobTimeoutMinutes,message]' --output json

# 3) Jobs -> os 6 Samsungs COMPLETED / STOPPED / "Tests stopped"
aws devicefarm list-jobs --arn $R17_ANDROID \
  --query 'jobs[].[device.name,status,result,message]' --output text

# 4) Suites de um job -> Setup PASSED, Tests Suite STOPPED 15.25 min, Teardown PASSED
JOB=$(aws devicefarm list-jobs --arn $R17_ANDROID --query 'jobs[0].arn' --output text)
aws devicefarm list-suites --arn $JOB --query 'suites[].[name,result,deviceMinutes.total,message]' --output text
SUITE=$(aws devicefarm list-suites --arn "$JOB" --query "suites[?name=='Tests Suite'].arn" --output text)
TEST=$(aws devicefarm list-tests --arn "$SUITE" --query 'tests[0].arn' --output text)

# 5) Customer Artifacts -> só appium.log, nenhum allure-results
U=$(aws devicefarm list-artifacts --arn "$TEST" --type FILE --query "artifacts[?name=='Customer Artifacts'].url" --output text)
curl -sL "$U" -o ca.zip && unzip -l ca.zip

# 6) Test spec output -> progresso e erro de cada teste
U=$(aws devicefarm list-artifacts --arn "$TEST" --type FILE --query "artifacts[?name=='Test spec output'].url" --output text)
curl -sL "$U" -o out.txt
grep -nE 'RUNNING in|Error in "|Spec Files' out.txt      # specs, falhas e o "75% completed"
grep -A1 'Error in "' out.txt                             # a mensagem: editorial-home-root presente=false
tail -5 out.txt                                           # "Stop received, exit testspec execution"

# 7) Versão do APK usado no run -> 1.14.3 / 486 (app antigo)
APP=$(aws devicefarm get-run --arn $R17_ANDROID --query 'run.appUpload' --output text)
aws devicefarm get-upload --arn $APP --query 'upload.[name,created,metadata]' --output text

# 8) Mesmo erro nos 6 aparelhos: laço por job baixando o Test spec output e contando
#    'Error in "' e 'editorial-home-root presente=false' -> todos os erros são esse

# 9) iOS (iPhone 13): Tests Suite FAILED em 12.14 min, mesmas falhas
#    (mesmo caminho dos passos 4 e 6 com $R17_IOS_IPHONE13)
```

Arquivos do repositório lidos para fechar a explicação:
- `testspec.yml`: a fase `post_test` (linhas 62–66) é a única que copia o `allure-results`.
- `.github/workflows/mobile_test.yml`: download do build (37–44), `schedule-run` sem
  `jobTimeoutMinutes` próprio (~141–165), download do `Customer Artifacts` (~198–235) e geração e
  publicação por plataforma (~728–790), que pulam a plataforma sem `*-result.json`.
- `.env`: `BUILD_PROFILE_ANDROID=production`, `BUILD_SELECTION=latest`.
- `test/pageobjects/HomePage.ts`: `validarHome()`, linha 82, onde o erro é lançado.

## Para retomar

Abrir este arquivo, confirmar com o Marcio as decisões 1 e 2, e então fazer o plano de correção
("como funciona hoje × como vai funcionar") para aprovação. Validar com run real do Device Farm,
disparado pelo Marcio.
