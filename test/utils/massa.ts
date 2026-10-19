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

// ── Criar Conta (pedido do Marcio, 2026-10-16): cadastro REAL, até o fim, a cada execução ──

// Dados de um cadastro. CPF, nascimento e telefone vão SÓ com dígitos: os três campos têm
// máscara automática no app (captura 2026-10-16, cap. 22) e os formatados servem só para o
// relatório e para o MASSA-DE-DADOS.md.
export interface DadosCadastro {
    email: string;
    nome: string;
    sobrenome: string;
    cpf: string;            // 11 dígitos
    cpfFormatado: string;   // 000.000.000-00
    nascimento: string;     // DDMMAAAA
    nascimentoFormatado: string; // DD/MM/AAAA
    telefone: string;       // DDD + 9 dígitos
    telefoneFormatado: string;   // (DD) 90000-0000
    senha: string;
}

// CPF válido pelos 2 dígitos verificadores (o app rejeita 111.111.111-11 e 123.456.789-00;
// captura 2026-10-16, caps. 17 e 18). Nunca 11 dígitos iguais.
export function gerarCpf(): string {
    const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
    if (new Set(n).size === 1) n[0] = (n[0] + 1) % 10;
    const dv = (a: number[]) => {
        const resto = a.reduce((t, d, i) => t + d * (a.length + 1 - i), 0) % 11;
        return resto < 2 ? 0 : 11 - resto;
    };
    n.push(dv(n));
    n.push(dv(n));
    return n.join('');
}

// Cadastro novo. E-mail no padrão do Marcio, `informatica.mrn+{texto}@gmail.com`, com
// `{texto}` = `cadastro-` + device normalizado + timestamp (base 36) + sufixo aleatório: único por
// execução e por device, e nunca casa com as contas do CI (`qa`/`test` + número).
// Senha cumpre as regras do app (cap. 24–28): 8+ caracteres, maiúscula, número e especial.
// Nascimento entre 1970 e 1999 (maior de idade; dia até 28 para nunca cair em data inexistente).
export function gerarDadosCadastro(device: string): DadosCadastro {
    const instante = Date.now().toString(36);
    const sufixo = Math.random().toString(36).slice(2, 6).padEnd(4, '0');
    const email = `informatica.mrn+cadastro-${normalizarDevice(device)}-${instante}-${sufixo}@gmail.com`;

    const cpf = gerarCpf();
    const dois = (v: number) => String(v).padStart(2, '0');
    const dia = dois(1 + Math.floor(Math.random() * 28));
    const mes = dois(1 + Math.floor(Math.random() * 12));
    const ano = String(1970 + Math.floor(Math.random() * 30));
    const ddd = '11';
    const numero = '9' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0');
    const letras = Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('');

    return {
        email,
        nome: 'Teste',
        sobrenome: 'Automacao',
        cpf,
        cpfFormatado: `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`,
        nascimento: `${dia}${mes}${ano}`,
        nascimentoFormatado: `${dia}/${mes}/${ano}`,
        telefone: `${ddd}${numero}`,
        telefoneFormatado: `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`,
        senha: `Aramis@${letras}${Math.floor(Math.random() * 10)}a`,
    };
}
