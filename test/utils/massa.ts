// Massa de dados gerada em runtime, sem estado e SEM imports (módulo puro: pode ser carregado
// por `node -e` para conferência, sem WebdriverIO).

// Normaliza o rótulo do device para caber na parte local de um e-mail: minúsculas, só
// [a-z0-9-], sem hífens repetidos nem nas pontas, no máximo `max` caracteres.
function normalizarDevice(device: string, max = 20): string {
    const limpo = device
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, max)
        .replace(/-+$/g, '');
    return limpo || 'device';
}

// E-mail que NUNCA é de uma conta real, para os cenários de credencial inválida (LOG-05).
//
// Formato decidido pelo Marcio (DEC-C item g, 2026-10-02): `informatica.mrn+{texto}@gmail.com`.
// É um endereço "plus" do Gmail — a caixa real `informatica.mrn@gmail.com` recebe tudo que
// chega em `informatica.mrn+qualquercoisa@gmail.com`, o que será aproveitado depois para ler o
// e-mail de redefinição de senha. Como o `{texto}` é gerado a cada chamada e nunca é cadastrado
// no app, nenhuma conta real recebe senha errada (risco de bloqueio por tentativas).
//
// `{texto}` = `log05-` + device normalizado + timestamp (base 36) + sufixo aleatório:
//  - único POR DEVICE: aparelhos rodando em paralelo no Device Farm nunca geram o mesmo
//    endereço (race condition), porque o device entra no texto e o sufixo aleatório desempata;
//  - nunca casa com o padrão das contas reais do CI (`qa` seguido de números, como
//    `informatica.mrn+qa100@gmail.com`): o prefixo fixo `log05-` garante isso.
// A parte local inteira fica abaixo dos 64 caracteres que o Gmail aceita.
export function gerarEmailFicticio(device: string): string {
    const instante = Date.now().toString(36);
    const sufixo = Math.random().toString(36).slice(2, 6).padEnd(4, '0');
    return `informatica.mrn+log05-${normalizarDevice(device)}-${instante}-${sufixo}@gmail.com`;
}

// Senha qualquer para o par "e-mail fictício + senha" do LOG-05. Não corresponde a conta
// nenhuma, então não é segredo; fica aqui (e não no .env) justamente para nunca ser confundida
// com a senha real. Valor fixo de propósito: o cenário só precisa de "algo preenchido".
export function gerarSenhaFicticia(): string {
    return 'Senha-Invalida-0000';
}
