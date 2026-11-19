// Leitura da árvore do Android (`driver.getPageSource()` do UiAutomator2) sem buscar elemento por elemento.
//
// Por quê (Android 1.23.1/557, AVD, 2026-11-19, `drafts/app-migrado/android/captures-2026-11-19-build557-06-passo-a-passo/`
// NOTAS.md, achados 1b e 5): com "You won Free Shipping!" na Mochila o app fica em 70–136% de CPU e CADA busca do Appium
// leva 2,7–6,8 s; ler 3 produtos fazia 25 buscas (105 s). Uma árvore inteira leva 4–12 s e traz todos os campos de uma vez.
// Só compensa onde substitui várias buscas (ler a Mochila); para UMA busca, a busca é mais barata.

export type NoAndroid = {
    classe: string;
    id: string;
    texto: string;
    exibido: boolean;
    profundidade: number;
    // índice do último nó da subárvore deste nó (ele mesmo, se não tiver filhos)
    fim: number;
};

const atributo = (attrs: string, nome: string) => {
    const m = attrs.match(new RegExp(`\\s${nome}="([^"]*)"`));
    return m ? m[1].replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : '';
};

// Nós na ordem do documento, com profundidade e fim da subárvore.
export function lerArvoreAndroid(xml: string): NoAndroid[] {
    const nos: NoAndroid[] = [];
    const pilha: number[] = [];
    const tag = /<(\/?)([A-Za-z_][\w.$-]*)([^>]*?)(\/?)>/g;
    let m: RegExpExecArray | null;
    while ((m = tag.exec(xml))) {
        const [, fecha, nome, attrs, autoFecha] = m;
        if (nome === 'hierarchy' || nome.startsWith('?')) continue;
        if (fecha) {
            const i = pilha.pop();
            if (i !== undefined) nos[i].fim = nos.length - 1;
            continue;
        }
        const i = nos.length;
        nos.push({
            classe: atributo(attrs, 'class') || nome,
            id: atributo(attrs, 'resource-id'),
            texto: atributo(attrs, 'text'),
            exibido: atributo(attrs, 'displayed') === 'true',
            profundidade: pilha.length,
            fim: i,
        });
        if (!autoFecha) pilha.push(i);
    }
    return nos;
}

// Equivale a `following::*[cond][1]` (depois da subárvore do nó), parando em `ate` (exclusivo).
export function seguinte(nos: NoAndroid[], i: number, cond: (n: NoAndroid) => boolean, ate = nos.length): number {
    for (let j = nos[i].fim + 1; j < ate; j++) if (cond(nos[j])) return j;
    return -1;
}

// Equivale a `following-sibling::*[cond][1]`.
export function irmaoSeguinte(nos: NoAndroid[], i: number, cond: (n: NoAndroid) => boolean): number {
    const p = nos[i].profundidade;
    for (let j = nos[i].fim + 1; j < nos.length; j = nos[j].fim + 1) {
        if (nos[j].profundidade < p) return -1;
        if (cond(nos[j])) return j;
    }
    return -1;
}
