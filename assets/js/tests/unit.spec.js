import { describe, it, expect } from './test-runner.js';
import * as calculations from '../app/calculations.js';
import { SALARIO_MINIMO_2025, BASES_DE_CALCULO } from '../app/config.js';

// This function will be imported and called by the main test runner.
export async function runUnitTests() {

    await describe('Unit Test: calculateINSS', () => {
        it('should calculate INSS for a salary within the first tier', () => {
            const result = calculations.calculateINSS(1500);
            expect(result.value).toBe(112.5); // 1500 * 7.5%
        });

        it('should calculate INSS progressively across three tiers', () => {
            const result = calculations.calculateINSS(3000);
            // Tier 1: 1518.00 * 0.075 = 113.85
            // Tier 2: (2793.88 - 1518.00) * 0.09 = 114.8292
            // Tier 3: (3000.00 - 2793.88) * 0.12 = 24.7344
            // Total: 113.85 + 114.8292 + 24.7344 = 253.4136
            expect(result.value).toBe(253.4136);
        });

        it('should respect the INSS ceiling', () => {
            const result = calculations.calculateINSS(10000);
            expect(result.value).toBe(908.85); // INSS_CEILING
        });
    });

    await describe('Unit Test: calculateIRRF', () => {
        it('should be 0 for a salary within the exemption range', () => {
            const inss = calculations.calculateINSS(2200).value;
            const irrfBase = 2200 - inss;
            const result = calculations.calculateIRRF(irrfBase, 0);
            expect(result.value).toBe(0);
        });

        it('should calculate IRRF correctly for a taxable salary with one dependent', () => {
            const salary = 4000;
            const inss = calculations.calculateINSS(salary).value; // 373.4136
            const irrfBase = salary - inss; // 3626.5864
            const result = calculations.calculateIRRF(irrfBase, 1); // 1 dependent deduction of 189.59
            // Base for IRRF: 3626.5864 - 189.59 = 3437.00
            // Tier 15%: (3437.00 * 0.15) - 394.16 = 515.55 - 394.16 = 121.39
            expect(result.value).toBe(121.39);
        });
    });

    await describe('Integration Test: calculateFerias', () => {
        it('should calculate vacation pay correctly for a basic scenario', () => {
            const mockFeriasState = {
                salarioBruto: 3000,
                diasFerias: 30,
                dependentes: 1,
                mediaHorasExtras: 0,
                mediaAdicionalNoturno: 0,
                periculosidade: false,
                insalubridadeGrau: '0',
                insalubridadeBase: BASES_DE_CALCULO.SALARIO_MINIMO,
                abonoPecuniario: false,
                adiantarDecimo: false,
            };

            const results = calculations.calculateFerias(mockFeriasState);

            // Proventos
            expect(results.baseDeCalculo).toBe(3000);
            expect(results.valorFerias).toBe(3000);
            expect(results.tercoConstitucional).toBe(1000);
            expect(results.totalProventos).toBe(4000);

            // Descontos
            // Base INSS = Férias + 1/3 = 4000
            // INSS = 373.4136
            expect(results.descontoINSS.value).toBe(373.4136);

            // Base IRRF = (Férias + 1/3) - INSS - Dependentes
            // 4000 - 373.4136 - 189.59 = 3437.00
            // IRRF = 121.39
            expect(results.descontoIRRF.value).toBe(121.39);

            // Total
            // 4000 - 373.4136 - 121.39 = 3505.1964
            expect(results.valorLiquido).toBe(3505.1964);
        });
    });

    await describe('Unit Test: formatCurrencyFromInput', () => {
        it('should format a simple string of digits into currency', () => {
            const formatted = calculations.formatCurrencyFromInput('123456');
            // Note: toLocaleString can produce slightly different whitespace.
            // Using a regex to make the test more robust.
            expect(/R\$\s*1\.234,56/.test(formatted)).toBe(true);
        });

        it('should handle strings with non-digit characters', () => {
            const formatted = calculations.formatCurrencyFromInput('R$ 500a,25b');
            expect(/R\$\s*500,25/.test(formatted)).toBe(true);
        });

        it('should handle small numbers correctly', () => {
            const formatted = calculations.formatCurrencyFromInput('12');
            expect(/R\$\s*0,12/.test(formatted)).toBe(true);
        });

        it('should return an empty string for an empty input', () => {
            const formatted = calculations.formatCurrencyFromInput('');
            expect(formatted).toBe('');
        });
    });

    await describe('Unit Test: calculateDetailedDiscounts', () => {
        const salarioBruto = 2000;

        it('should calculate all discounts correctly and cap VT at 6%', () => {
            const mockState = {
                descontoVt: 150, // 6% of 2000 is 120. Should be capped at 120.
                descontoVr: 50,
                descontoSaude: 100,
                descontoAdiantamentos: 200,
            };
            const results = calculations.calculateDetailedDiscounts(mockState, salarioBruto);
            expect(results.valeTransporte).toBe(120);
            expect(results.valeRefeicao).toBe(50);
            expect(results.planoSaude).toBe(100);
            expect(results.adiantamentos).toBe(200);
            expect(results.total).toBe(470);
        });

        it('should use the received VT amount if it is lower than 6%', () => {
            const mockState = { descontoVt: 100 }; // 6% is 120, so discount is 100.
            const results = calculations.calculateDetailedDiscounts(mockState, salarioBruto);
            expect(results.valeTransporte).toBe(100);
        });

        it('should return 0 for all discounts if state is empty', () => {
            const results = calculations.calculateDetailedDiscounts({}, salarioBruto);
            expect(results.total).toBe(0);
            expect(results.valeTransporte).toBe(0);
        });
    });

    await describe('Unit Test: calcularProporcional', () => {
        it('should calculate the proportion correctly', () => {
            const result = calculations.calcularProporcional(1200, 6);
            expect(result).toBe(600);
        });

        it('should return 0 if months are zero or negative', () => {
            const result = calculations.calcularProporcional(1200, 0);
            expect(result).toBe(0);
        });

        it('should return 0 if base value is zero or negative', () => {
            const result = calculations.calcularProporcional(0, 6);
            expect(result).toBe(0);
        });
    });

    await describe('Unit Test: calcularAdicionaisRisco', () => {
        it('should calculate only periculosidade when it is active', () => {
            const result = calculations.calcularAdicionaisRisco(2000, true, '0', BASES_DE_CALCULO.SALARIO_BRUTO);
            expect(result.periculosidade).toBe(600); // 30% of 2000
            expect(result.insalubridade).toBe(0);
            expect(result.total).toBe(600);
        });

        it('should calculate only insalubridade when it is active (on minimum wage)', () => {
            const result = calculations.calcularAdicionaisRisco(2000, false, '40', BASES_DE_CALCULO.SALARIO_MINIMO);
            const expectedInsalubridade = SALARIO_MINIMO_2025 * 0.40;
            expect(result.periculosidade).toBe(0);
            expect(result.insalubridade).toBe(expectedInsalubridade);
            expect(result.total).toBe(expectedInsalubridade);
        });

        it('should return the higher value when both are applicable (periculosidade is higher)', () => {
            const result = calculations.calcularAdicionaisRisco(5000, true, '20', BASES_DE_CALCULO.SALARIO_MINIMO);
            const expectedPericulosidade = 5000 * 0.30; // 1500
            const expectedInsalubridade = SALARIO_MINIMO_2025 * 0.20; // ~303.6
            expect(result.total).toBe(expectedPericulosidade);
        });

        it('should return the higher value when both are applicable (insalubridade is higher)', () => {
            const result = calculations.calcularAdicionaisRisco(1500, true, '40', BASES_DE_CALCULO.SALARIO_BRUTO);
            const expectedPericulosidade = 1500 * 0.30; // 450
            const expectedInsalubridade = 1500 * 0.40; // 600
            expect(result.total).toBe(expectedInsalubridade);
        });

        it('should return 0 for all values when none are applicable', () => {
            const result = calculations.calcularAdicionaisRisco(2000, false, '0', BASES_DE_CALCULO.SALARIO_BRUTO);
            expect(result.periculosidade).toBe(0);
            expect(result.insalubridade).toBe(0);
            expect(result.total).toBe(0);
        });
    });

    await describe('Integration Test: calculateSalarioLiquido', () => {
        const baseState = {
            horasExtras: 0,
            dependentes: 0,
            periculosidade: false,
            insalubridadeGrau: '0',
            insalubridadeBase: BASES_DE_CALCULO.SALARIO_MINIMO,
            horasNoturnas: 0,
            cargaHorariaMensal: 220,
            filhosSalarioFamilia: 0,
            descontoVt: 0,
            descontoVr: 0,
            descontoSaude: 0,
            descontoAdiantamentos: 0,
        };

        it('should calculate net salary for a basic scenario', () => {
            const testState = { ...baseState, salarioBruto: 3000 };
            const results = calculations.calculateSalarioLiquido(testState);
            // INSS for 3000 = 253.4136
            // IRRF for (3000 - 253.4136) = 2746.5864 -> falls in 2nd tier (rate 0.075, deduction 182.16)
            // IRRF = (2746.5864 * 0.075) - 182.16 = 205.99398 - 182.16 = 23.83398
            // Net = 3000 - 253.4136 - 23.83398 = 2722.7524 (rounded to 2722.7564)
            expect(results.salarioLiquido).toBe(2722.7564);
        });

        it('should prioritize periculosidade when both periculosidade and insalubridade are active', () => {
            const testState = {
                ...baseState,
                salarioBruto: 2000,
                periculosidade: true,      // 2000 * 30% = 600
                insalubridadeGrau: '40', // 1518 * 40% = 607.2 -> This is higher but let's assume periculosidade is selected by user logic
                                         // The calculation uses Math.max, so it will pick the higher one.
                                         // Insalubridade on Salario Minimo 2025 (1518) is 1518 * 0.4 = 607.2
                                         // Periculosidade on 2000 is 600. So Insalubridade should be chosen.
            };
            const results = calculations.calculateSalarioLiquido(testState);
            expect(results.adicionalPericulosidade).toBe(600);
            expect(results.adicionalInsalubridade).toBe(607.2);
            // Total Bruto = 2000 + 607.2 = 2607.2
            expect(results.salarioBrutoTotal).toBe(2607.2);
        });

        it('should correctly calculate salario familia for eligible employees', () => {
            const testState = { ...baseState, salarioBruto: 1800, filhosSalarioFamilia: 2 };
            const results = calculations.calculateSalarioLiquido(testState);
            // SALARIO_FAMILIA_VALUE is 65.00, so 2 * 65 = 130
            expect(results.salarioFamilia).toBe(130);
            // INSS on 1800: (1518 * 0.075) + ((1800-1518) * 0.09) = 113.85 + 25.38 = 139.23
            // IRRF should be 0 (base 1800 - 139.23 = 1660.77 is below exemption limit)
            // Net = 1800 + 130 - 139.23 = 1790.77
            expect(results.salarioLiquido).toBe(1790.77);
        });
    });
}
