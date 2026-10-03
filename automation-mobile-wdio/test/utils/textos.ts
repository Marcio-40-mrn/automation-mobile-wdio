// Rótulos de fallback para seletores do app migrado que NÃO têm testID.
//
// REGRA (Marcio, 2026-10-01, 06-CONTEXT.md D-04 corrigida): o idioma é irrelevante e nenhum
// teste valida texto. Este arquivo NÃO serve a asserção: nunca importar `texto()` num
// expect/comparação de string exibida. Ele só centraliza os rótulos usados para LOCALIZAR um
// elemento onde o app não oferece testID — cada um é um seletor por texto, frágil por natureza.
// Se um deles quebrar (idioma, copy), conserta-se aqui quando der erro (decisão do Marcio);
// não se tenta cobrir todo idioma antes.
//
// Todo valor cita a captura de onde veio (`fonte`). Valor não capturado não entra: `texto()`
// lança erro nomeado em vez de devolver um palpite (CLAUDE.md: "não está escrito").
export type EntradaTexto = {
    android?: string;
    ios?: string;
    fonte: string;
};

const CAP_ANDROID = '.planning/drafts/app-migrado/android/captures-2026-09-29';
const CAP_IOS = '.planning/drafts/app-migrado/ios/captures-m6-sessao-a/ACOES.md';

export const TEXTOS = {
    // Item do Menu deslogado que abre o Login. Android: ViewGroup clicável sem id (content-desc).
    // iOS: Other com name "Register or login".
    'menu.acessoLogin': {
        android: 'Cadastre-se ou, Faça o login',
        ios: 'Register or login',
        fonte: `Android: ${CAP_ANDROID}/10-menu-deslogado.xml (draft android/07); iOS: ${CAP_IOS} capturas 11 e 12`,
    },
    // Botão de login no rodapé do Menu deslogado (aparece com o Menu rolado). Serve para validar
    // "deslogou" quando o cabeçalho do convite saiu da árvore.
    'menu.acessoLoginRodape': {
        android: 'Faça o login',
        ios: 'login',
        fonte: `Android: ${CAP_ANDROID}/51-pos-logout.xml (draft android/28); iOS: ${CAP_IOS} capturas 11 e 32`,
    },
    // Rótulo do botão de entrar no iOS (pressable com label). No Android o botão é achado só pelo
    // testID `pressable`, único na tela de Login (capturas m6e1 15/17/20), sem texto.
    'login.botaoEntrar': {
        ios: 'Sign in',
        fonte: `${CAP_IOS} capturas 12, 16, 17 (draft ios/08)`,
    },
    // Placeholders dos campos do Login no iOS. Os campos não têm testID e perdem o name ao
    // receber valor — o seletor só serve para achar o campo VAZIO.
    'login.campoEmail': {
        ios: 'Email',
        fonte: `${CAP_IOS} captura 12 (draft ios/08)`,
    },
    'login.campoSenha': {
        ios: 'Password',
        fonte: `${CAP_IOS} captura 12 (draft ios/08)`,
    },
    // Trecho do label do modal de credenciais recusadas no iOS (nó único sem filho, sem testID).
    // Serve só para DETECTAR que o modal abriu; o texto nunca é comparado.
    'login.modalCredenciais': {
        ios: 'Incorrect username',
        fonte: `${CAP_IOS} captura 18 (draft ios/29)`,
    },
    // Link de recuperação de senha na tela de Login do iOS (nó com name = texto). No Android o
    // link é achado por estrutura (TextView irmão que precede o `pressable`), sem texto.
    // Só LOCALIZA; nenhuma asserção compara o que a tela mostra (REGRA FIXA 2026-10-01).
    'login.linkEsqueci': {
        ios: 'Forgot my password',
        fonte: `${CAP_IOS} captura 20 (draft ios/30)`,
    },
    // Tela "Esqueceu sua senha" no iOS: campo de e-mail (Other com name = placeholder; o Login usa
    // "Email", aqui é "E-mail") e botão `pressable` com rótulo. Só localizam; no Android o campo
    // é o único EditText da tela e o botão é o único `pressable`.
    'esqueci.campoEmail': {
        ios: 'E-mail',
        fonte: `${CAP_IOS} capturas 20 e 21 (draft ios/30)`,
    },
    'esqueci.botaoEnviar': {
        ios: 'Send link',
        fonte: `${CAP_IOS} capturas 20 e 21 (draft ios/30)`,
    },
    // Item "Sair" da lista do Menu logado. `menu-list-button` repete em ≥7 itens, então só o
    // content-desc/label distingue.
    'menu.sair': {
        android: 'Sair',
        ios: 'Logout',
        fonte: `Android: ${CAP_ANDROID}/48-menu-rolado.xml (draft android/24); iOS: ${CAP_IOS} capturas 29 e 30`,
    },
    // Início do content-desc/label do card Favoritos (`menu-card` repete em 4 cards).
    'menu.favoritos': {
        android: 'Favoritos',
        ios: 'Favorites',
        fonte: `Android: ${CAP_ANDROID}/45-menu-logado.xml (draft android/24); iOS: ${CAP_IOS} captura 41`,
    },
    // Categoria "Roupas" da lista de Categorias. `category-button` repete em 7 linhas (testID
    // igual nas duas plataformas), então só o content-desc (Android) / label (iOS) distingue.
    // Seletor por texto — frágil (sem testID único); usado só para LOCALIZAR, nunca comparado.
    'categorias.roupas': {
        android: 'Roupas',
        ios: 'Roupas',
        fonte: `Android: ${CAP_ANDROID}/15-categorias.xml (draft android/09); iOS: ${CAP_IOS} captura 36 (draft ios/09)`,
    },
    // Subcategoria "Camisas" (`sub-categories-button` repete em 7 itens) e, ao mesmo tempo, o
    // título do cabeçalho da listagem — que no Android é o botão de voltar (content-desc = título,
    // sem id) e no iOS o `name` do chevron. Seletor por texto — frágil (sem testID).
    'categorias.camisas': {
        android: 'Camisas',
        ios: 'Camisas',
        fonte: `Android: ${CAP_ANDROID}/16-roupas.xml e 17-listagem-camisas.xml (drafts android/10 e 11); iOS: ${CAP_IOS} capturas 37 e 39 (drafts ios/10 e 11)`,
    },
    // Botão de confirmar dentro do alerta nativo de logout do iOS (XCUIElementTypeAlert, sem
    // testID). No Android o botão é o `android:id/button1` do sistema, sem texto.
    'logout.confirmar': {
        ios: 'Logout',
        fonte: `${CAP_IOS} capturas 30 a 32 (draft ios/28)`,
    },
} satisfies Record<string, EntradaTexto>;

export type ChaveTexto = keyof typeof TEXTOS;

export function texto(chave: ChaveTexto): string {
    const plataforma = process.env.PLATFORM === 'ios' ? 'ios' : 'android';
    const entrada: EntradaTexto = TEXTOS[chave];
    const valor = entrada[plataforma];

    if (!valor) {
        throw new Error(
            `texto do app não capturado: ${chave} (${plataforma}) — capturar antes de usar (CLAUDE.md)`
        );
    }
    return valor;
}
