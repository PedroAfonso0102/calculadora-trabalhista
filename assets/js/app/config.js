/**
 * Application Configuration
 *
 * This file stores constants and configuration values for the application.
 * By centralizing them here, we make it easy to update them in the future.
 * 
 * The configuration is organized by year to facilitate future updates and
 * maintain historical data for different calculation periods.
 */

/**
 * Constants for calculation bases
 * These strings are used throughout the application to identify calculation types
 */
export const BASES_DE_CALCULO = {
    SALARIO_MINIMO: 'salario_minimo',
    SALARIO_BRUTO: 'salario_bruto'
};

/**
 * Parameters for the year 2025
 * All tax tables, contribution limits, and benefit values for 2025
 */
export const PARAMETROS_2025 = {
    // Fonte: Portaria Interministerial MPS/MF - Tabela INSS 2025
    INSS_TABLE: [
        { limit: 1518.00, rate: 0.075 },
        { limit: 2793.88, rate: 0.09 },
        { limit: 4190.83, rate: 0.12 },
        { limit: 8157.41, rate: 0.14 }
    ],
    
    // Fonte: Portaria Interministerial MPS/MF - Teto máximo de contribuição INSS 2025
    INSS_CEILING: 908.85,
    
    // Fonte: Instrução Normativa RFB - Tabela IRRF 2025
    IRRF_TABLE: [
        { limit: 2428.80, rate: 0, deduction: 0 },
        { limit: 2826.65, rate: 0.075, deduction: 182.16 },
        { limit: 3751.05, rate: 0.15, deduction: 394.16 },
        { limit: 4664.68, rate: 0.225, deduction: 675.49 },
        { limit: Infinity, rate: 0.275, deduction: 908.73 }
    ],
    
    // Fonte: Instrução Normativa RFB - Dedução por dependente IRRF 2025
    IRRF_DEPENDENT_DEDUCTION: 189.59,
    
    // Fonte: Lei 8.213/91 e Decreto regulamentador - Salário Família 2025
    SALARIO_FAMILIA_VALUE: 65.00,
    SALARIO_FAMILIA_LIMIT: 1906.04,
    
    // Fonte: Decreto Federal - Salário Mínimo Nacional 2025
    SALARIO_MINIMO: 1518.00,
    
    // Fonte: NR-16 - Adicional de Periculosidade
    ADICIONAL_PERICULOSIDADE: 0.30,
    
    // Fonte: NR-15 - Adicional de Insalubridade
    ADICIONAL_INSALUBRIDADE: {
        GRAU_MINIMO: 0.10,    // 10%
        GRAU_MEDIO: 0.20,     // 20%
        GRAU_MAXIMO: 0.40     // 40%
    }
};

/**
 * Legacy exports for backward compatibility
 * These maintain the existing API while we transition to the new structure
 */
export const INSS_TABLE = PARAMETROS_2025.INSS_TABLE;
export const INSS_CEILING = PARAMETROS_2025.INSS_CEILING;
export const IRRF_TABLE = PARAMETROS_2025.IRRF_TABLE;
export const IRRF_DEPENDENT_DEDUCTION = PARAMETROS_2025.IRRF_DEPENDENT_DEDUCTION;
export const SALARIO_FAMILIA_VALUE = PARAMETROS_2025.SALARIO_FAMILIA_VALUE;
export const SALARIO_FAMILIA_LIMIT = PARAMETROS_2025.SALARIO_FAMILIA_LIMIT;
export const SALARIO_MINIMO_2025 = PARAMETROS_2025.SALARIO_MINIMO;

/**
 * Current year parameters
 * This allows easy switching between years in the future
 */
export const PARAMETROS_VIGENTES = PARAMETROS_2025;

/**
 * Future years can be easily added like this:
 * 
 * export const PARAMETROS_2026 = {
 *     // Fonte: Portaria Interministerial MPS/MF - Tabela INSS 2026
 *     INSS_TABLE: [
 *         { limit: 1600.00, rate: 0.075 },
 *         // ... updated values for 2026
 *     ],
 *     INSS_CEILING: 950.00,
 *     // ... other updated parameters
 *     SALARIO_MINIMO: 1600.00
 * };
 * 
 * // Then simply change: export const PARAMETROS_VIGENTES = PARAMETROS_2026;
 */
