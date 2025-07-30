/**
 * Base Legal - Calculadora Trabalhista
 * 
 * Este arquivo contém as explicações e bases legais para todas as verbas trabalhistas.
 * Alimenta os tooltips educativos da interface.
 */

export const EXPLICACOES_VERBAS = {
    // Verbas de Rescisão
    saldo_salario: {
        titulo: "Saldo de Salário",
        explicacao: "Valor correspondente aos dias trabalhados no mês da rescisão, calculado proporcionalmente.",
        baseLegal: "CLT, Art. 462",
        formula: "(Salário ÷ 30) × dias trabalhados"
    },

    aviso_previo_indenizado: {
        titulo: "Aviso Prévio Indenizado",
        explicacao: "Valor pago quando o empregador dispensa o cumprimento do aviso prévio. Base: 30 dias + 3 dias por ano de serviço (máximo 90 dias).",
        baseLegal: "CLT, Art. 487 e Lei 12.506/2011",
        formula: "Salário × (dias de aviso ÷ 30)",
        isento: "Não sofre desconto de INSS nem IRRF"
    },

    decimo_terceiro_proporcional: {
        titulo: "13º Salário Proporcional",
        explicacao: "Gratificação natalina proporcional aos meses trabalhados no ano, incluindo projeção do aviso prévio.",
        baseLegal: "Lei 4.090/1962 e Lei 4.749/1965",
        formula: "(Salário ÷ 12) × meses trabalhados"
    },

    ferias_vencidas: {
        titulo: "Férias Vencidas",
        explicacao: "Período de férias já adquirido (12 meses de trabalho) e não gozado pelo empregado.",
        baseLegal: "CLT, Art. 129 e 130",
        formula: "Salário × (dias de férias ÷ 30)"
    },

    ferias_proporcionais: {
        titulo: "Férias Proporcionais",
        explicacao: "Período de férias proporcional ao tempo trabalhado no período aquisitivo em curso, incluindo projeção do aviso prévio.",
        baseLegal: "CLT, Art. 146, § 1º",
        formula: "(Salário ÷ 12) × meses do período aquisitivo"
    },

    terco_constitucional_vencidas: {
        titulo: "1/3 Constitucional - Férias Vencidas",
        explicacao: "Adicional de um terço sobre o valor das férias vencidas, garantido pela Constituição Federal.",
        baseLegal: "CF/88, Art. 7º, XVII",
        formula: "Valor das férias vencidas ÷ 3"
    },

    terco_constitucional_proporcionais: {
        titulo: "1/3 Constitucional - Férias Proporcionais",
        explicacao: "Adicional de um terço sobre o valor das férias proporcionais, garantido pela Constituição Federal.",
        baseLegal: "CF/88, Art. 7º, XVII",
        formula: "Valor das férias proporcionais ÷ 3"
    },

    multa_fgts_40: {
        titulo: "Multa FGTS 40%",
        explicacao: "Multa de 40% sobre os depósitos do FGTS, devida na dispensa sem justa causa.",
        baseLegal: "Lei 8.036/1990, Art. 18, § 1º",
        formula: "Saldo FGTS × 40%",
        isento: "Não sofre desconto de INSS nem IRRF"
    },

    multa_fgts_20: {
        titulo: "Multa FGTS 20%",
        explicacao: "Multa reduzida de 20% sobre os depósitos do FGTS, aplicável no acordo de rescisão.",
        baseLegal: "Lei 13.467/2017, Art. 484-A",
        formula: "Saldo FGTS × 20%",
        isento: "Não sofre desconto de INSS nem IRRF"
    },

    // Descontos
    desconto_inss: {
        titulo: "INSS - Instituto Nacional do Seguro Social",
        explicacao: "Contribuição previdenciária calculada sobre a remuneração, com alíquotas progressivas de 7,5% a 14%.",
        baseLegal: "Lei 8.212/1991",
        observacao: "Calculado separadamente sobre salário, 13º e férias"
    },

    desconto_irrf: {
        titulo: "IRRF - Imposto de Renda Retido na Fonte",
        explicacao: "Imposto sobre a renda calculado sobre a base tributável, com alíquotas de 7,5% a 27,5%.",
        baseLegal: "Lei 7.713/1988",
        observacao: "Base = remuneração - INSS - dependentes"
    },

    desconto_aviso_previo: {
        titulo: "Desconto Aviso Prévio",
        explicacao: "Desconto aplicado quando o empregado não cumpre o aviso prévio em caso de pedido de demissão.",
        baseLegal: "CLT, Art. 487, § 2º",
        formula: "Valor correspondente ao período não cumprido"
    },

    // Verbas de Férias
    valor_ferias: {
        titulo: "Valor das Férias",
        explicacao: "Valor correspondente ao período de férias a ser gozado, calculado com base no salário atual.",
        baseLegal: "CLT, Art. 142",
        formula: "(Salário ÷ 30) × dias de férias"
    },

    abono_pecuniario: {
        titulo: "Abono Pecuniário",
        explicacao: "Conversão em dinheiro de até 1/3 das férias, mediante requerimento do empregado.",
        baseLegal: "CLT, Art. 143",
        formula: "(Salário ÷ 30) × (dias vendidos)",
        isento: "Não sofre desconto de INSS nem IRRF"
    },

    terco_abono: {
        titulo: "1/3 sobre Abono Pecuniário",
        explicacao: "Adicional de um terço sobre o valor do abono pecuniário.",
        baseLegal: "CLT, Art. 143, § 1º",
        formula: "Valor do abono ÷ 3",
        isento: "Não sofre desconto de INSS nem IRRF"
    },

    // Verbas de 13º Salário
    primeira_parcela_13: {
        titulo: "1ª Parcela do 13º Salário",
        explicacao: "Adiantamento de 50% do 13º salário, pago entre fevereiro e novembro. Não sofre descontos.",
        baseLegal: "Lei 4.749/1965",
        formula: "(Salário ÷ 12 × meses) ÷ 2",
        isento: "Não sofre desconto de INSS nem IRRF"
    },

    segunda_parcela_13: {
        titulo: "2ª Parcela do 13º Salário",
        explicacao: "Saldo do 13º salário após dedução da 1ª parcela e dos descontos legais.",
        baseLegal: "Lei 4.749/1965",
        formula: "Valor total - 1ª parcela - INSS - IRRF"
    },

    // Salário Mensal
    salario_bruto: {
        titulo: "Salário Bruto",
        explicacao: "Valor total da remuneração antes dos descontos legais obrigatórios.",
        baseLegal: "CLT, Art. 457"
    },

    salario_familia: {
        titulo: "Salário Família",
        explicacao: "Benefício pago para trabalhadores de baixa renda por filho de até 14 anos ou inválido.",
        baseLegal: "Lei 8.213/1991, Art. 65",
        condicao: "Devido para salários até R$ 1.819,26"
    },

    salario_liquido: {
        titulo: "Salário Líquido",
        explicacao: "Valor que o trabalhador efetivamente recebe após todos os descontos legais.",
        baseLegal: "CLT, Art. 462",
        formula: "Salário bruto + salário família - INSS - IRRF - outros descontos"
    }
};

// Explicações sobre modalidades de rescisão
export const MODALIDADES_RESCISAO = {
    sem_justa_causa: {
        titulo: "Dispensa sem Justa Causa",
        explicacao: "Rescisão por iniciativa do empregador sem motivo disciplinar. Garante todas as verbas rescisórias.",
        direitos: [
            "Saldo de salário",
            "Aviso prévio indenizado",
            "13º proporcional",
            "Férias vencidas + 1/3",
            "Férias proporcionais + 1/3",
            "Multa FGTS 40%",
            "Saque FGTS",
            "Seguro-desemprego"
        ],
        baseLegal: "CLT, Art. 477"
    },

    pedido_demissao: {
        titulo: "Pedido de Demissão",
        explicacao: "Rescisão por iniciativa do empregado. Não há multa FGTS nem saque do fundo.",
        direitos: [
            "Saldo de salário",
            "13º proporcional",
            "Férias vencidas + 1/3",
            "Férias proporcionais + 1/3"
        ],
        observacao: "Se não cumprir aviso prévio, sofre desconto",
        baseLegal: "CLT, Art. 487"
    },

    acordo_mutual: {
        titulo: "Acordo Mútuo",
        explicacao: "Rescisão por acordo entre empregado e empregador, com direitos reduzidos.",
        direitos: [
            "Saldo de salário",
            "50% do aviso prévio",
            "13º proporcional",
            "Férias vencidas + 1/3",
            "Férias proporcionais + 1/3",
            "Multa FGTS 20%",
            "Saque 80% FGTS"
        ],
        restricao: "Não tem direito ao seguro-desemprego",
        baseLegal: "CLT, Art. 484-A (Lei 13.467/2017)"
    },

    justa_causa: {
        titulo: "Dispensa por Justa Causa",
        explicacao: "Rescisão motivada por falta grave do empregado. Direitos reduzidos.",
        direitos: [
            "Saldo de salário",
            "Férias vencidas + 1/3 (se houver)"
        ],
        restricao: "Não há aviso prévio, 13º, férias proporcionais, multa FGTS, saque FGTS ou seguro-desemprego",
        baseLegal: "CLT, Art. 482"
    },

    termino_contrato: {
        titulo: "Término de Contrato por Prazo Determinado",
        explicacao: "Final natural do contrato a termo. Permite saque do FGTS.",
        direitos: [
            "Saldo de salário",
            "13º proporcional",
            "Férias vencidas + 1/3",
            "Férias proporcionais + 1/3",
            "Saque FGTS"
        ],
        observacao: "Não há aviso prévio nem multa FGTS",
        baseLegal: "CLT, Art. 479"
    }
};

/**
 * Busca explicação para uma verba específica
 * @param {string} verba - Nome da verba
 * @returns {object|null} Objeto com explicação ou null se não encontrada
 */
export function getExplicacaoVerba(verba) {
    return EXPLICACOES_VERBAS[verba] || null;
}

/**
 * Busca informações sobre modalidade de rescisão
 * @param {string} modalidade - Tipo de rescisão
 * @returns {object|null} Objeto com informações ou null se não encontrada
 */
export function getInfoModalidadeRescisao(modalidade) {
    return MODALIDADES_RESCISAO[modalidade] || null;
}

/**
 * Lista todas as verbas disponíveis
 * @returns {string[]} Array com nomes das verbas
 */
export function listarVerbas() {
    return Object.keys(EXPLICACOES_VERBAS);
}

/**
 * Lista todas as modalidades de rescisão
 * @returns {string[]} Array com tipos de rescisão
 */
export function listarModalidadesRescisao() {
    return Object.keys(MODALIDADES_RESCISAO);
}

// Exportação default
export default {
    verbas: EXPLICACOES_VERBAS,
    modalidades: MODALIDADES_RESCISAO,
    getExplicacaoVerba,
    getInfoModalidadeRescisao,
    listarVerbas,
    listarModalidadesRescisao
};