// Gate de cobertura do M6 (fase 06): o inventário dos 101 cenários da seção 3 de
// `cenarios-gherkin-2026-09-28.pdf` e a conferência contra os `it`/`it.skip` de test/specs/*.spec.ts.
//
// Sem dependência: só `node:test`, `node:assert`, `node:fs` e `node:path`. Não toca device nem
// Appium. Roda de qualquer lugar do repositório:
//
//   COBERTURA_ETAPA_ATE=1 COBERTURA_PREFIXOS=ONB,LOG node --test test/utils/cobertura.check.mjs
//
// Variáveis:
//   COBERTURA_ETAPA_ATE   última etapa EXIGIDA (padrão 6). Todos os cenários A/P de etapas ANTERIORES
//                         a ela são exigidos; os da etapa corrente só se o prefixo estiver listado.
//   COBERTURA_PREFIXOS    lista separada por vírgula de prefixos de ID (ex.: ONB,LOG). Vazio = todos.
//
// Situação de cada cenário no inventário:
//   A  implementar agora      — exigido como `it('[ID] título')`
//   P  pendente de massa      — exigido como `it.skip('[PENDENTE — motivo] [ID] título')`
//   E  excluído               — NÃO pode aparecer em nenhum `it`/`it.skip`
//
// Títulos = os do PDF §3 (06-RESEARCH.md, "Inventário dos 101 cenários"). A etapa do LOG-06 é a 3
// (implementado junto com o MOC-06, 06-09). ONB-06 é E por decisão do Marcio em 2026-10-01
// (REQUIREMENTS.md: "Onboarding não tem retorno"), confirmada na DEC-C do 06-04.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DIR_TEST = path.resolve(AQUI, '..');
const DIR_SPECS = path.join(DIR_TEST, 'specs');

const MOTIVO_ONB06 = 'fora do escopo — Onboarding não tem retorno (decisão do Marcio, 2026-10-01, REQUIREMENTS.md)';
const MOTIVO_ESTOQUE = 'estoque (D-10; 06-PENDENCIAS §2)';
const MOTIVO_FRETE = 'frete grátis (D-10; 06-PENDENCIAS §3)';
const MOTIVO_CUPOM = 'cupom (D-09; 06-PENDENCIAS §1)';

/** @type {{id:string,titulo:string,etapa:number,situacao:'A'|'P'|'E',motivo?:string}[]} */
export const INVENTARIO = [
    // ---- Etapa 1 — Acesso ----
    { id: 'ONB-01', etapa: 1, situacao: 'A', titulo: 'Avançar pelo onboarding concedendo permissões de notificação e localização' },
    { id: 'ONB-02', etapa: 1, situacao: 'A', titulo: 'Avançar pelo onboarding negando permissão de notificações' },
    { id: 'ONB-03', etapa: 1, situacao: 'A', titulo: 'Avançar pelo onboarding negando permissão de localização' },
    { id: 'ONB-04', etapa: 1, situacao: 'A', titulo: 'Avançar pelo onboarding negando ambas as permissões de notificações e localização' },
    { id: 'ONB-05', etapa: 1, situacao: 'A', titulo: 'Concluir o onboarding e acessar a Home ao tocar em Continue na Política de Privacidade' },
    { id: 'ONB-06', etapa: 1, situacao: 'E', motivo: MOTIVO_ONB06, titulo: 'Retornar à tela final do onboarding ao pressionar Voltar na Política de Privacidade' },
    { id: 'ONB-07', etapa: 1, situacao: 'A', titulo: 'Ausência de navegação circular entre a tela final do onboarding e a Política de Privacidade' },
    { id: 'LOG-01', etapa: 1, situacao: 'A', titulo: 'Botão de entrar desabilitado com e-mail e senha em branco' },
    { id: 'LOG-02', etapa: 1, situacao: 'A', titulo: 'Botão de entrar desabilitado com e-mail válido mas senha em branco' },
    { id: 'LOG-03', etapa: 1, situacao: 'A', titulo: 'Botão de entrar desabilitado com senha preenchida mas e-mail em formato inválido' },
    { id: 'LOG-04', etapa: 1, situacao: 'A', titulo: 'Botão de entrar habilitado com e-mail válido e senha preenchida' },
    { id: 'LOG-05', etapa: 1, situacao: 'A', titulo: 'Credenciais incorretas exibem mensagem genérica sem indicar qual campo está errado' },
    { id: 'LOG-07', etapa: 1, situacao: 'A', titulo: 'Acessar a tela de recuperação de senha a partir do link Esqueci minha senha' },
    { id: 'OUT-01', etapa: 1, situacao: 'A', titulo: 'Sistema solicita confirmação antes de efetuar o logout' },
    { id: 'OUT-02', etapa: 1, situacao: 'A', titulo: 'Cancelar logout mantém o usuário autenticado' },
    { id: 'OUT-03', etapa: 1, situacao: 'A', titulo: 'Confirmar logout encerra a sessão do usuário' },

    // ---- Etapa 2 — Catálogo ----
    { id: 'BUS-01', etapa: 2, situacao: 'A', titulo: 'Busca por palavra-chave retorna lista de resultados com informações completas' },
    { id: 'BUS-02', etapa: 2, situacao: 'A', titulo: 'Ordenação padrão dos resultados de busca é Relevância antes de qualquer filtro' },
    { id: 'BUS-03', etapa: 2, situacao: 'A', titulo: 'Busca sem resultados exibe mensagem de estado vazio' },
    { id: 'FIL-01', etapa: 2, situacao: 'A', titulo: 'Filtros de tipos diferentes combinam por interseção' },
    { id: 'FIL-02', etapa: 2, situacao: 'A', titulo: 'Valores do mesmo tipo de filtro combinam por união' },
    { id: 'FIL-03', etapa: 2, situacao: 'A', titulo: 'Filtros de tipos diferentes com múltiplos valores no mesmo tipo combinam interseção entre tipos e união dentro do tipo' },
    { id: 'FIL-04', etapa: 2, situacao: 'A', titulo: 'Contador do botão de aplicar atualiza a cada seleção de filtro' },
    { id: 'FIL-05', etapa: 2, situacao: 'A', titulo: 'Botão Limpar filtros restaura o estado padrão sem filtros ativos' },
    { id: 'FIL-06', etapa: 2, situacao: 'A', titulo: 'Filtros aplicados são mantidos ao retornar de uma PDP para a listagem' },
    { id: 'FIL-07', etapa: 2, situacao: 'A', titulo: 'Combinação de filtros sem resultados exibe mensagem com opção de limpar filtros' },
    { id: 'PDP-01', etapa: 2, situacao: 'A', titulo: 'Visualizar a PDP com todos os elementos obrigatórios' },
    { id: 'PDP-02', etapa: 2, situacao: 'A', titulo: 'Botão de adicionar à mochila desabilitado antes da seleção de tamanho' },
    { id: 'PDP-03', etapa: 2, situacao: 'A', titulo: 'Botão de adicionar à mochila habilitado após seleção de tamanho' },
    { id: 'PDP-04', etapa: 2, situacao: 'A', titulo: 'Adicionar produto à mochila e verificar a tela de confirmação' },
    { id: 'PDP-05', etapa: 2, situacao: 'A', titulo: 'Seção de venda cruzada exibe apenas produtos com estoque, excluindo o item adicionado' },
    { id: 'PDP-06', etapa: 2, situacao: 'A', titulo: 'Acessar a PDP de um produto da venda cruzada' },
    { id: 'PDP-07', etapa: 2, situacao: 'A', titulo: 'Navegar entre abas após adicionar produto à mochila sem travamentos' },

    // ---- Etapa 3 — Mochila (LOG-06 entra aqui: depende de PDP/Mochila, 06-09) ----
    { id: 'LOG-06', etapa: 3, situacao: 'A', titulo: 'Login bem-sucedido retorna o usuário à tela de origem com os itens da Mochila preservados' },
    { id: 'MOC-01', etapa: 3, situacao: 'A', titulo: 'Botão de diminuir quantidade desabilitado quando quantidade do item é 1' },
    { id: 'MOC-02', etapa: 3, situacao: 'P', motivo: MOTIVO_ESTOQUE, titulo: 'Aumentar a quantidade de um item até o limite de estoque disponível' },
    { id: 'MOC-03', etapa: 3, situacao: 'P', motivo: MOTIVO_ESTOQUE, titulo: 'Tentar adicionar quantidade acima do estoque disponível exibe mensagem de limite' },
    { id: 'MOC-04', etapa: 3, situacao: 'A', titulo: 'Remover um item da mochila e verificar o recálculo do total' },
    { id: 'MOC-05', etapa: 3, situacao: 'A', titulo: 'Mochila vazia exibe estado vazio e botão para continuar comprando com botão finalizar desabilitado' },
    { id: 'MOC-06', etapa: 3, situacao: 'A', titulo: 'Visitante não logado é redirecionado ao Login ao finalizar compra e retorna com itens preservados' },
    { id: 'MOC-07', etapa: 3, situacao: 'A', titulo: 'Itens da mochila são preservados após o logout' },
    { id: 'MOC-08', etapa: 3, situacao: 'P', motivo: MOTIVO_FRETE, titulo: 'Barra de frete grátis indica valor faltante quando subtotal está abaixo do mínimo' },
    { id: 'MOC-09', etapa: 3, situacao: 'P', motivo: MOTIVO_FRETE, titulo: 'Barra de frete grátis exibe mensagem de frete grátis ao atingir o valor mínimo' },
    { id: 'MOC-10', etapa: 3, situacao: 'P', motivo: MOTIVO_FRETE, titulo: 'Barra de frete grátis volta ao estado incompleto ao reduzir itens abaixo do mínimo' },
    { id: 'MOC-11', etapa: 3, situacao: 'P', motivo: MOTIVO_CUPOM, titulo: 'Aplicar cupom válido aplica desconto e recalcula o total' },
    { id: 'MOC-12', etapa: 3, situacao: 'P', motivo: MOTIVO_CUPOM, titulo: 'Aplicar cupom com código inexistente exibe mensagem de erro e mantém total inalterado' },
    { id: 'MOC-13', etapa: 3, situacao: 'P', motivo: MOTIVO_CUPOM, titulo: 'Aplicar cupom expirado exibe mensagem de erro e mantém total inalterado' },
    { id: 'MOC-14', etapa: 3, situacao: 'P', motivo: MOTIVO_CUPOM, titulo: 'Aplicar cupom que não atende às condições da compra exibe mensagem de erro' },
    { id: 'MOC-15', etapa: 3, situacao: 'P', motivo: MOTIVO_CUPOM, titulo: 'Novo cupom válido substitui o cupom anteriormente aplicado' },
    { id: 'MOC-16', etapa: 3, situacao: 'P', motivo: MOTIVO_CUPOM, titulo: 'Remover cupom aplicado restaura o total sem desconto' },

    // ---- Etapa 4 — Checkout ----
    { id: 'CHK-01', etapa: 4, situacao: 'A', titulo: 'Preencher CEP válido com autopreenchimento dos campos de endereço' },
    { id: 'CHK-02', etapa: 4, situacao: 'A', titulo: 'Interagir com o campo Número imediatamente após o autopreenchimento do CEP sem interrupções' },
    { id: 'CHK-03', etapa: 4, situacao: 'A', titulo: 'Inserir CEP incompleto exibe mensagem de CEP inválido' },
    { id: 'CHK-04', etapa: 4, situacao: 'A', titulo: 'Inserir CEP com 8 dígitos inexistente exibe mensagem de CEP não encontrado' },
    { id: 'CHK-05', etapa: 4, situacao: 'A', titulo: 'Botão de salvar endereço desabilitado sem o campo Número preenchido' },
    { id: 'CHK-06', etapa: 4, situacao: 'A', titulo: 'Campo Complemento é opcional e não impede o salvamento do endereço' },
    { id: 'CHK-07', etapa: 4, situacao: 'A', titulo: 'Botão de salvar endereço habilitado com todos os campos obrigatórios preenchidos' },

    // ---- Etapa 5 — Criar Conta ----
    { id: 'CC1-01', etapa: 5, situacao: 'A', titulo: 'Avançar para a etapa 2 do cadastro após preenchimento válido de todos os campos da etapa 1' },
    { id: 'CC1-02', etapa: 5, situacao: 'A', titulo: 'Tentar avançar na etapa 1 com todos os campos vazios exibe mensagens de campo obrigatório' },
    { id: 'CC1-03', etapa: 5, situacao: 'A', titulo: 'Validação em tempo real de e-mail com formato inválido ao sair do campo' },
    { id: 'CC1-04', etapa: 5, situacao: 'A', titulo: 'E-mail com formato válido não exibe mensagem de erro ao sair do campo' },
    { id: 'CC1-05', etapa: 5, situacao: 'A', titulo: 'CPF com dígitos verificadores inválidos exibe mensagem de CPF inválido' },
    { id: 'CC1-06', etapa: 5, situacao: 'A', titulo: 'CPF com sequência de dígitos repetidos exibe mensagem de CPF inválido' },
    { id: 'CC1-07', etapa: 5, situacao: 'A', titulo: 'CPF já cadastrado exibe diálogo com opções de OK e Fazer login ao concluir o cadastro' },
    { id: 'CC1-08', etapa: 5, situacao: 'A', titulo: 'Data de nascimento futura exibe mensagem de data inválida' },
    { id: 'CC1-09', etapa: 5, situacao: 'A', titulo: 'Data de nascimento inexistente exibe mensagem de data inválida' },
    { id: 'CC1-10', etapa: 5, situacao: 'A', titulo: 'Data de nascimento de usuário com menos de 18 anos exibe mensagem de restrição de idade' },
    { id: 'CC1-11', etapa: 5, situacao: 'A', titulo: 'Data de nascimento de usuário com exatamente 18 anos completos é aceita' },
    { id: 'CC1-12', etapa: 5, situacao: 'A', titulo: 'Telefone com 9 dígitos exibe mensagem de formato inválido' },
    { id: 'CC1-13', etapa: 5, situacao: 'A', titulo: 'Telefone com 10 dígitos é aceito' },
    { id: 'CC1-14', etapa: 5, situacao: 'A', titulo: 'Telefone com 11 dígitos é aceito' },
    { id: 'CC1-15', etapa: 5, situacao: 'A', titulo: 'Telefone com 12 dígitos exibe mensagem de formato inválido' },
    { id: 'CC2-01', etapa: 5, situacao: 'A', titulo: 'Senha com 7 caracteres mantém botão Concluir cadastro desabilitado e exibe mensagem de senha curta' },
    { id: 'CC2-02', etapa: 5, situacao: 'A', titulo: 'Senha com 8 caracteres e confirmação idêntica habilita botão Concluir cadastro' },
    { id: 'CC2-03', etapa: 5, situacao: 'A', titulo: 'Confirmação de senha diferente da senha exibe mensagem e mantém botão desabilitado' },
    { id: 'CC2-04', etapa: 5, situacao: 'A', titulo: 'Senha curta e confirmação diferente exibem ambas as mensagens de erro e mantêm botão desabilitado' },
    { id: 'CC2-05', etapa: 5, situacao: 'A', titulo: 'Concluir cadastro com e-mail já cadastrado exibe diálogo com opções de OK e Fazer login' },
    { id: 'CC2-06', etapa: 5, situacao: 'A', titulo: 'Validação de unicidade do e-mail não ocorre ao sair do campo na etapa 1' },
    { id: 'CC2-07', etapa: 5, situacao: 'A', titulo: 'Cadastro concluído com sucesso autentica o usuário e exibe o nome no Menu' },

    // ---- Etapa 6 — Menu ----
    { id: 'MD-01', etapa: 6, situacao: 'A', titulo: 'Campos E-mail e CPF são exibidos como somente leitura em Meus Dados' },
    { id: 'MD-02', etapa: 6, situacao: 'A', titulo: 'Dados do cadastro são exibidos corretamente na tela de Meus Dados' },
    { id: 'MD-03', etapa: 6, situacao: 'A', titulo: 'Botão Salvar alterações permanece desabilitado sem modificação em nenhum campo' },
    { id: 'MD-04', etapa: 6, situacao: 'A', titulo: 'Botão Salvar alterações é habilitado ao modificar qualquer campo editável' },
    { id: 'MD-05', etapa: 6, situacao: 'A', titulo: 'Salvar dados válidos com sucesso mantém o usuário na tela de Meus Dados sem mensagem de confirmação' },
    { id: 'MD-06', etapa: 6, situacao: 'A', titulo: 'Tentar salvar data de nascimento inválida exibe mensagem de erro e impede a gravação' },
    { id: 'MD-07', etapa: 6, situacao: 'A', titulo: 'Tentar salvar telefone com 9 dígitos em Meus Dados exibe mensagem de erro e impede a gravação' },
    { id: 'MD-08', etapa: 6, situacao: 'E', motivo: 'conectividade (D-14)', titulo: 'Falha de conectividade ao salvar exibe mensagem de erro e mantém os valores digitados' },
    { id: 'MD-09', etapa: 6, situacao: 'A', titulo: 'Selecionar gênero pelo modal de seleção única fecha o modal e exibe o valor escolhido' },
    { id: 'CFG-01', etapa: 6, situacao: 'A', titulo: 'Todos os canais de comunicação estão habilitados por padrão na tela de Configurações' },
    { id: 'CFG-02', etapa: 6, situacao: 'A', titulo: 'Desabilitar individualmente o canal WhatsApp' },
    { id: 'CFG-03', etapa: 6, situacao: 'A', titulo: 'Reabilitar canal de comunicação previamente desabilitado' },
    { id: 'CFG-04', etapa: 6, situacao: 'A', titulo: 'Opção Excluir conta informa que os dados serão apagados em até 14 dias' },
    { id: 'DEV-01', etapa: 6, situacao: 'E', motivo: 'Seção DEV (D-13)', titulo: 'Seção DEV com Painel de controle não é exibida em builds de produção' },
    { id: 'DEV-02', etapa: 6, situacao: 'E', motivo: 'Seção DEV (D-13)', titulo: 'Seção DEV com Painel de controle é exibida em builds internas de desenvolvimento' },
    { id: 'VZ-01', etapa: 6, situacao: 'A', titulo: 'Tela Meus Pedidos exibe estado vazio com vitrine de recomendados quando não há pedidos' },
    { id: 'VZ-02', etapa: 6, situacao: 'A', titulo: 'Tela de Favoritos exibe estado vazio quando não há produtos favoritados' },

    // ---- Etapa 7 — pt-BR (fora do planejamento, D-12) ----
    { id: 'PTBR-01', etapa: 7, situacao: 'E', motivo: 'pt-BR (D-12)', titulo: 'Conteúdo textual do app é exibido em português do Brasil independentemente do idioma do dispositivo' },
    { id: 'PTBR-02', etapa: 7, situacao: 'E', motivo: 'pt-BR (D-12)', titulo: 'Tela de Filtros exibe todos os elementos em português do Brasil' },
    { id: 'PTBR-03', etapa: 7, situacao: 'E', motivo: 'pt-BR (D-12)', titulo: 'Tela de Criar Conta exibe todos os rótulos em português do Brasil' },
    { id: 'PTBR-04', etapa: 7, situacao: 'E', motivo: 'pt-BR (D-12)', titulo: 'Tela da Mochila exibe todos os elementos em português do Brasil' },
    { id: 'PTBR-05', etapa: 7, situacao: 'E', motivo: 'pt-BR (D-12)', titulo: 'Confirmação de adição à mochila exibe botões e título da venda cruzada em português do Brasil' },
];

// ---- Contagens esperadas (conferidas contra o 06-RESEARCH.md, com os ajustes registrados) ----
// A+P por etapa 1..6. Etapa 1 = 15 (17 do PDF − LOG-06, que mudou para a etapa 3, − ONB-06, que é E).
// Etapa 3 = 17 (16 + LOG-06). Excluídos = 9 (PTBR×5, DEV×2, MD-08, ONB-06).
const AP_POR_ETAPA = { 1: 15, 2: 17, 3: 17, 4: 7, 5: 22, 6: 14 };
const TOTAL_EXCLUIDOS = 9;

const ETAPA_ATE = Number(process.env.COBERTURA_ETAPA_ATE ?? 6);
const PREFIXOS = (process.env.COBERTURA_PREFIXOS ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

const prefixoDe = (id) => id.replace(/-\d+$/, '');

// Exigido = A/P de etapa anterior à corrente (sempre) ou da corrente com o prefixo listado.
function exigido(item) {
    if (item.situacao === 'E') return false;
    if (item.etapa < ETAPA_ATE) return true;
    if (item.etapa > ETAPA_ATE) return false;
    return PREFIXOS.length === 0 || PREFIXOS.includes(prefixoDe(item.id));
}

// ---- Leitura dos specs ----
function arquivosSpec() {
    if (!fs.existsSync(DIR_SPECS)) return [];
    return fs.readdirSync(DIR_SPECS).filter((f) => f.endsWith('.spec.ts')).sort();
}

// it( e it.skip( no início da linha, com título entre aspas simples, duplas ou crase. Só o
// primeiro argumento (o título) interessa.
const RE_IT = /^[ \t]*(it(?:\.skip)?)\(\s*(['"`])((?:\\.|(?!\2)[^\\])*)\2/gm;

function lerCasos() {
    const casos = [];
    for (const arquivo of arquivosSpec()) {
        const fonte = fs.readFileSync(path.join(DIR_SPECS, arquivo), 'utf8');
        for (const m of fonte.matchAll(RE_IT)) {
            casos.push({ arquivo, tipo: m[1], titulo: m[3].replace(/\\(['"`])/g, '$1') });
        }
    }
    return casos;
}

// IDs entre colchetes no início do título, ou depois do aviso "[PENDENTE — ...]".
const RE_ID = /\[([A-Z0-9]+-\d+)\]/;
const idDoCaso = (c) => (c.titulo.match(RE_ID) ?? [])[1] ?? null;

function varrer(dir, acc = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) varrer(p, acc);
        else acc.push(p);
    }
    return acc;
}

test('inventário: 101 IDs únicos e títulos preenchidos', () => {
    assert.equal(INVENTARIO.length, 101);
    const ids = INVENTARIO.map((i) => i.id);
    assert.equal(new Set(ids).size, 101, 'há ID repetido no inventário');
    for (const i of INVENTARIO) {
        assert.ok(i.titulo && i.titulo.length > 10, `título vazio em ${i.id}`);
        assert.ok(['A', 'P', 'E'].includes(i.situacao), `situação inválida em ${i.id}`);
        if (i.situacao !== 'A') assert.ok(i.motivo, `${i.id} é ${i.situacao} e precisa de motivo`);
    }
});

test('inventário: A+P por etapa e total de excluídos', () => {
    for (const [etapa, esperado] of Object.entries(AP_POR_ETAPA)) {
        const n = INVENTARIO.filter((i) => i.etapa === Number(etapa) && i.situacao !== 'E').length;
        assert.equal(n, esperado, `etapa ${etapa}: A+P = ${n}, esperado ${esperado}`);
    }
    assert.equal(INVENTARIO.filter((i) => i.situacao === 'E').length, TOTAL_EXCLUIDOS);
    assert.equal(INVENTARIO.filter((i) => i.situacao === 'P').length, 11);
});

test('inventário: ONB-06 e LOG-06 conforme as decisões', () => {
    const onb06 = INVENTARIO.find((i) => i.id === 'ONB-06');
    assert.equal(onb06.situacao, 'E');
    assert.match(onb06.motivo, /fora do escopo — Onboarding não tem retorno/);
    assert.equal(INVENTARIO.find((i) => i.id === 'LOG-06').etapa, 3);
});

test('cada A exigido aparece em exatamente um it( com "[ID] título"', () => {
    const casos = lerCasos();
    for (const item of INVENTARIO.filter((i) => i.situacao === 'A' && exigido(i))) {
        const achados = casos.filter((c) => c.tipo === 'it' && c.titulo === `[${item.id}] ${item.titulo}`);
        assert.equal(achados.length, 1, `${item.id}: esperado 1 it( com o título exato, achados ${achados.length}`);
    }
});

test('cada P exigido aparece em exatamente um it.skip( "[PENDENTE — ...] [ID] título"', () => {
    const casos = lerCasos();
    for (const item of INVENTARIO.filter((i) => i.situacao === 'P' && exigido(i))) {
        const achados = casos.filter(
            (c) => c.tipo === 'it.skip' && c.titulo.startsWith('[PENDENTE — ') && c.titulo.includes(`[${item.id}] ${item.titulo}`)
        );
        assert.equal(achados.length, 1, `${item.id}: esperado 1 it.skip( pendente, achados ${achados.length}`);
    }
});

test('nenhum excluído (E) aparece em it/it.skip', () => {
    const casos = lerCasos();
    const excluidos = new Set(INVENTARIO.filter((i) => i.situacao === 'E').map((i) => i.id));
    for (const c of casos) {
        const id = idDoCaso(c);
        assert.ok(!id || !excluidos.has(id), `${id} é excluído e não pode ter ${c.tipo}( (${c.arquivo})`);
    }
});

test('nenhum ID repetido nem fora do inventário', () => {
    const casos = lerCasos();
    const conhecidos = new Set(INVENTARIO.map((i) => i.id));
    const vistos = new Map();
    for (const c of casos) {
        const id = idDoCaso(c);
        if (!id) continue;
        assert.ok(conhecidos.has(id), `${id} (${c.arquivo}) não está no inventário`);
        assert.ok(!vistos.has(id), `${id} aparece duas vezes (${vistos.get(id)} e ${c.arquivo})`);
        vistos.set(id, c.arquivo);
    }
});

test('uma suíte só: nenhum arquivo de test/ com ios ou android no nome', () => {
    // "ios"/"android" como palavra do nome (separada por . - _ ou limite) ou como sufixo em
    // camelCase (LoginIOS.ts, PerfilAndroid.ts). "Categorias"/"Favoritos" não casam.
    const RE_PALAVRA = /(^|[^a-zA-Z])(ios|android)([^a-zA-Z]|$)/i;
    const RE_CAMEL = /[a-z](IOS|Android)(?=[A-Z._-]|$)/;
    const RE_PREFIXO = /^(ios|android)[A-Z]/;
    for (const arquivo of varrer(DIR_TEST)) {
        const nome = path.basename(arquivo);
        assert.ok(
            !RE_PALAVRA.test(nome) && !RE_CAMEL.test(nome) && !RE_PREFIXO.test(nome),
            `${path.relative(DIR_TEST, arquivo)}: arquivo por sistema operacional viola "uma suíte só"`
        );
    }
});
