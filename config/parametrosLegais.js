/**
 * Parâmetros Legais - Calculadora Trabalhista
 * 
 * Este arquivo contém TODAS as constantes legais necessárias para os cálculos trabalhistas.
 * Valores atualizados para 2024 conforme legislação vigente.
 * 
 * IMPORTANTE: A atualização anual da calculadora deve se resumir a modificar este arquivo.
 */

const parametrosLegais = {
    ano: 2024,

    valoresBase: {
        SALARIO_MINIMO: 1412.00,
        TETO_INSS: 7786.02,
        DEDUCAO_POR_DEPENDENTE_IRRF: 189.59,
        VALOR_COTA_SALARIO_FAMILIA: 62.04,
        LIMITE_SALARIO_FAMILIA: 1819.26
    },

    tabelaINSS: [
        { faixaAte: 1412.00, aliquota: 0.075 },      // 7,5%
        { faixaAte: 2666.68, aliquota: 0.09 },       // 9%
        { faixaAte: 4000.03, aliquota: 0.12 },       // 12%
        { faixaAte: 7786.02, aliquota: 0.14 }        // 14%
    ],
    
    tabelaIRRF: [
        { faixaAte: 2259.20, aliquota: 0.0, deducao: 0 },           // Isento
        { faixaAte: 2826.65, aliquota: 0.075, deducao: 169.44 },    // 7,5%
        { faixaAte: 3751.05, aliquota: 0.15, deducao: 381.44 },     // 15%
        { faixaAte: 4664.68, aliquota: 0.225, deducao: 662.77 },    // 22,5%
        { faixaAte: Infinity, aliquota: 0.275, deducao: 896.00 }    // 27,5%
    ],

    tabelaFerias: [
        { faltasAte: 5, diasDireito: 30 },
        { faltasAte: 14, diasDireito: 24 },
        { faltasAte: 23, diasDireito: 18 },
        { faltasAte: 32, diasDireito: 12 },
        { faltasAte: Infinity, diasDireito: 0 }
    ],

    parametrosFGTS: {
        ALIQUOTA_DEPOSITO: 0.08,           // 8%
        MULTA_DEMISSAO_SEM_JUSTA_CAUSA: 0.40,  // 40%
        MULTA_ACORDO_MUTUAL: 0.20,         // 20%
        SAQUE_ACORDO_MUTUAL: 0.80          // 80%
    },

    parametrosProporcionalidade: {
        TERCO_CONSTITUCIONAL: 1/3,         // 1/3 das férias
        ABONO_PECUNIARIO_MAXIMO: 1/3,      // Máximo 1/3 das férias pode ser vendido
        DIAS_MES: 30,                      // Base de cálculo mensal
        DIAS_ANO: 365,                     // Base de cálculo anual
        MESES_ANO: 12,                     // Meses para cálculo de 13º
        DIAS_AVISO_PREVIO: 30              // Dias base do aviso prévio
    },

    adicionalAvisoPrevio: {
        DIAS_BASE: 30,                     // 30 dias base
        DIAS_ADICIONAL_POR_ANO: 3,         // +3 dias por ano
        MAXIMO_DIAS_ADICIONAL: 60,         // Máximo 60 dias adicionais
        MAXIMO_TOTAL: 90                   // Máximo total 90 dias
    },
};

// Exportação default para facilitar importação
export default parametrosLegais;