// Identidade do device Android -> índice da conta (NÃO secreto).
//
// Vale SÓ para o Android, e só porque lá o run é um só com N aparelhos: as
// environmentVariables do Device Farm são do RUN, não do JOB, então os 6 devices recebem a
// mesma lista de contas (CLIENT_USERS_EMAILS) e cada um precisa escolher seu índice sozinho.
// O sinal usado é o MODELO (`ro.product.model`), que o UiAutomator2 expõe como `deviceModel`
// nas capabilities da sessão. A chave é o PREFIXO do modelo (sem o sufixo de região
// "U1"/"U"/"B"), casado com `startsWith` — resiliente a variações de região. Os prefixos S9xx
// são todos distintos (nenhum é prefixo do outro).
//
// O iOS NÃO passa por aqui. Existia neste arquivo um mapa por (versão de OS, resolução),
// gerado pelo CI, porque o XCUITest não devolve `deviceModel` e o UDID muda a cada run. Ele
// foi removido: a chave não casava em 2 dos 5 aparelhos (a API do Device Farm informa a versão
// completa — "17.3.1" — e o host exporta truncada — "17.3") e, quando não casava, o teste
// ABORTAVA. No CI iOS Run #6 isso apagou o iPhone 14 e o iPhone 15 Pro Max da execução.
// Hoje o iOS roda um run POR device, com a conta injetada pelo CI em CLIENT_USER — ver o
// cabeçalho do credentials.ts.
//
// Como descobrir os modelId do Android: aws devicefarm list-jobs --arn <run> \
//   --query "jobs[].{name:device.name, modelId:device.modelId}"
export const deviceIndex: Record<'android', Record<string, number>> = {
    android: {
        "SM-S918": 0,  // Galaxy S23 Ultra
        "SM-S916": 1,  // Galaxy S23+
        "SM-S928": 2,  // Galaxy S24 Ultra
        "SM-S926": 3,  // Galaxy S24+
        "SM-S938": 4,  // Galaxy S25 Ultra
        "SM-S948": 5,  // Galaxy S26 Ultra
    },
};
