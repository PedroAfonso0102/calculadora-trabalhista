/**
 * Parâmetros Legais - Calculadora Trabalhista
 * 
 * Este arquivo contém TODAS as constantes legais necessárias para os cálculos trabalhistas.
 * Valores atualizados para 2024 conforme legislação vigente.
 * 
 * IMPORTANTE: A atualização anual da calculadora deve se resumir a modificar este arquivo.
 */

// Valores base para 2024
export const VALORES_BASE_2024 = {
    SALARIO_MINIMO: 1412.00,
    TETO_INSS: 7786.02,
    DEDUCAO_POR_DEPENDENTE_IRRF: 189.59,
    VALOR_COTA_SALARIO_FAMILIA: 62.04,
    LIMITE_SALARIO_FAMILIA: 1819.26
};

// Tabela INSS 2024 - Alíquotas Progressivas
export const TABELA_INSS_2024 = [
    { faixaAte: 1412.00, aliquota: 0.075 },      // 7,5%
    { faixaAte: 2666.68, aliquota: 0.09 },       // 9%
    { faixaAte: 4000.03, aliquota: 0.12 },       // 12%
    { faixaAte: 7786.02, aliquota: 0.14 }        // 14%
];

// Tabela IRRF 2024 - Alíquotas Progressivas
export const TABELA_IRRF_2024 = [
    { faixaAte: 2259.20, aliquota: 0.0, deducao: 0 },           // Isento
    { faixaAte: 2826.65, aliquota: 0.075, deducao: 169.44 },    // 7,5%
    { faixaAte: 3751.05, aliquota: 0.15, deducao: 381.44 },     // 15%
    { faixaAte: 4664.68, aliquota: 0.225, deducao: 662.77 },    // 22,5%
    { faixaAte: Infinity, aliquota: 0.275, deducao: 896.00 }    // 27,5%
];

// Tabela Simples Nacional 2024 - Anexo III
// Aplicável quando o Fator R é igual ou superior a 28%
export const TABELA_SIMPLES_NACIONAL_ANEXO_III = [
    { faixaAte: 180000.00, aliquota: 0.06, deducao: 0 },
    { faixaAte: 360000.00, aliquota: 0.112, deducao: 9360.00 },
    { faixaAte: 720000.00, aliquota: 0.135, deducao: 17640.00 },
    { faixaAte: 1800000.00, aliquota: 0.16, deducao: 35640.00 },
    { faixaAte: 3600000.00, aliquota: 0.21, deducao: 125640.00 },
    { faixaAte: 4800000.00, aliquota: 0.33, deducao: 648000.00 }
];

// Tabela Simples Nacional 2024 - Anexo V
// Aplicável quando o Fator R é inferior a 28%
export const TABELA_SIMPLES_NACIONAL_ANEXO_V = [
    { faixaAte: 180000.00, aliquota: 0.155, deducao: 0 },
    { faixaAte: 360000.00, aliquota: 0.18, deducao: 4500.00 },
    { faixaAte: 720000.00, aliquota: 0.195, deducao: 9900.00 },
    { faixaAte: 1800000.00, aliquota: 0.205, deducao: 17100.00 },
    { faixaAte: 3600000.00, aliquota: 0.23, deducao: 62100.00 },
    { faixaAte: 4800000.00, aliquota: 0.305, deducao: 540000.00 }
];

// Parâmetros para cálculo PJ
export const PARAMETROS_PJ = {
    FATOR_R_LIMITE: 0.28
};

// Tabela de Férias baseada em faltas injustificadas (CLT Art. 130)
export const TABELA_DIREITO_FERIAS = [
    { faltasAte: 5, diasDireito: 30 },
    { faltasAte: 14, diasDireito: 24 },
    { faltasAte: 23, diasDireito: 18 },
    { faltasAte: 32, diasDireito: 12 },
    { faltasAte: Infinity, diasDireito: 0 }
];

// Alíquotas e parâmetros FGTS
export const PARAMETROS_FGTS = {
    ALIQUOTA_DEPOSITO: 0.08,           // 8%
    MULTA_DEMISSAO_SEM_JUSTA_CAUSA: 0.40,  // 40%
    MULTA_ACORDO_MUTUAL: 0.20,         // 20%
    SAQUE_ACORDO_MUTUAL: 0.80          // 80%
};

// Percentuais para cálculos de proporcionalidade
export const PARAMETROS_PROPORCIONALIDADE = {
    TERCO_CONSTITUCIONAL: 1/3,         // 1/3 das férias
    ABONO_PECUNIARIO_MAXIMO: 1/3,      // Máximo 1/3 das férias pode ser vendido
    DIAS_MES: 30,                      // Base de cálculo mensal
    DIAS_ANO: 365,                     // Base de cálculo anual
    MESES_ANO: 12,                     // Meses para cálculo de 13º
    DIAS_AVISO_PREVIO: 30              // Dias base do aviso prévio
};

// Adicional de aviso prévio por tempo de serviço
export const ADICIONAL_AVISO_PREVIO = {
    DIAS_BASE: 30,                     // 30 dias base
    DIAS_ADICIONAL_POR_ANO: 3,         // +3 dias por ano
    MAXIMO_DIAS_ADICIONAL: 60,         // Máximo 60 dias adicionais
    MAXIMO_TOTAL: 90                   // Máximo total 90 dias
};

/**
 * Calcula o adicional de aviso prévio baseado no tempo de serviço
 * @param {number} anosServico - Anos completos de serviço
 * @returns {number} Dias adicionais de aviso prévio
 */
export function calcularDiasAdicionaisAviso(anosServico) {
    const diasAdicionais = Math.min(
        anosServico * ADICIONAL_AVISO_PREVIO.DIAS_ADICIONAL_POR_ANO,
        ADICIONAL_AVISO_PREVIO.MAXIMO_DIAS_ADICIONAL
    );
    return ADICIONAL_AVISO_PREVIO.DIAS_BASE + diasAdicionais;
}

/**
 * Obtém os parâmetros legais para um ano específico
 * Atualmente suporta apenas 2024, mas pode ser expandido
 * @param {number} ano - Ano desejado
 * @returns {object} Objeto com todos os parâmetros do ano
 */
export function getParametrosLegais(ano = 2024) {
    if (ano !== 2024) {
        throw new Error(`Parâmetros legais não disponíveis para o ano ${ano}`);
    }
    
    return {
        ano,
        valoresBase: VALORES_BASE_2024,
        tabelaINSS: TABELA_INSS_2024,
        tabelaIRRF: TABELA_IRRF_2024,
        tabelaFerias: TABELA_DIREITO_FERIAS,
        parametrosFGTS: PARAMETROS_FGTS,
        parametrosProporcionalidade: PARAMETROS_PROPORCIONALIDADE,
        adicionalAvisoPrevio: ADICIONAL_AVISO_PREVIO,
        tabelaSimplesNacionalAnexoIII: TABELA_SIMPLES_NACIONAL_ANEXO_III,
        tabelaSimplesNacionalAnexoV: TABELA_SIMPLES_NACIONAL_ANEXO_V,
        parametrosPJ: PARAMETROS_PJ,
        funcoes: {
            calcularDiasAdicionaisAviso
        }
    };
}

// Exportação default para facilitar importação
export default getParametrosLegais();