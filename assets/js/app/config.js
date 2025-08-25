/**
 * Application Configuration
 *
 * This file stores constants and configuration values for the application.
 * By centralizing them here, we make it easy to update them in the future.
 */

// Tax and social security contribution tables for 2025
export const INSS_TABLE = [
    { limit: 1518.00, rate: 0.075 },
    { limit: 2793.88, rate: 0.09 },
    { limit: 4190.83, rate: 0.12 },
    { limit: 8157.41, rate: 0.14 }
];

// The maximum contribution value for INSS.
export const INSS_CEILING = 908.85;

export const IRRF_TABLE = [
    { limit: 2428.80, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 182.16 },
    { limit: 3751.05, rate: 0.15, deduction: 394.16 },
    { limit: 4664.68, rate: 0.225, deduction: 675.49 },
    { limit: Infinity, rate: 0.275, deduction: 908.73 }
];

// Value of the deduction for each dependent for IRRF calculation
export const IRRF_DEPENDENT_DEDUCTION = 189.59;

// Value and income limit for the "Salário Família" benefit
export const SALARIO_FAMILIA_VALUE = 65.00;
export const SALARIO_FAMILIA_LIMIT = 1906.04;

// National minimum wage for the year 2025
export const SALARIO_MINIMO_2025 = 1518.00;
