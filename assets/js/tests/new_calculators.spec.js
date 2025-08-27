import { describe, it, expect } from './test-runner.js';
import * as calculations from '../app/calculations.js';
import legalTexts from '../../../data/legal_texts.json';

export async function runNewCalculatorTests() {

    await describe('Unit Test: calculateFGTS', () => {
        it('should calculate the monthly deposit correctly', () => {
            const state = { salarioBruto: 2500, saldoTotal: 10000, opcaoSaque: 'rescisao' };
            const result = calculations.calculateFGTS(state);
            expect(result.depositoMensal).toBe(200); // 2500 * 0.08
        });

        it('should calculate Saque-Rescisão correctly', () => {
            const state = { salarioBruto: 2500, saldoTotal: 10000, opcaoSaque: 'rescisao' };
            const result = calculations.calculateFGTS(state);
            expect(result.valorSaque).toBe(10000);
        });

        it('should calculate Saque-Aniversário for a specific tier', () => {
            const state = { salarioBruto: 2500, saldoTotal: 6000, opcaoSaque: 'aniversario' };
            const result = calculations.calculateFGTS(state);
            // 6000 * 0.20 + 650 = 1200 + 650 = 1850
            expect(result.valorSaque).toBe(1850);
        });
    });

    await describe('Unit Test: calculatePISPASEP', () => {
        it('should calculate the abono correctly for 12 months worked', () => {
            const state = { salarioMedio: 1500, mesesTrabalhados: 12, dataInscricao: '2010-01-01' };
            const result = calculations.calculatePISPASEP(state, legalTexts);
            expect(result.valorAbono).toBe(1412); // Full salario minimo
            expect(result.elegivel).toBe(true);
        });

        it('should return not eligible if salary is too high', () => {
            const state = { salarioMedio: 3000, mesesTrabalhados: 12, dataInscricao: '2010-01-01' };
            const result = calculations.calculatePISPASEP(state, legalTexts);
            expect(result.valorAbono).toBe(0);
            expect(result.elegivel).toBe(false);
        });
    });

    await describe('Unit Test: calculateSeguroDesemprego', () => {
        it('should calculate the benefit for a first-time applicant', () => {
            const state = { salario1: 2000, salario2: 2000, salario3: 2000, mesesTrabalhados: 15, numSolicitacoes: 0 };
            const result = calculations.calculateSeguroDesemprego(state, legalTexts);
            expect(result.numeroParcelas).toBe(4);
            // Average salary 2000. 2000 * 0.8 = 1600
            expect(result.valorPorParcela).toBe(1600);
            expect(result.elegivel).toBe(true);
        });
    });

    await describe('Unit Test: calculateHorasExtras', () => {
        it('should calculate overtime pay correctly', () => {
            const state = { salarioBase: 2200, horasContratuais: 220, horasExtras50: 10, horasExtras100: 2, horasNoturnas: 5 };
            const result = calculations.calculateHorasExtras(state, legalTexts);
            // Valor Hora = 2200 / 220 = 10
            // HE50 = 10 * 1.5 * 10 = 150
            // HE100 = 10 * 2 * 2 = 40
            // Adicional Noturno = 10 * 0.2 * 5 = 10
            // Total = 150 + 40 + 10 = 200
            expect(result.totalValorHE50).toBe(150);
            expect(result.totalValorHE100).toBe(40);
            expect(result.totalValorAdicionalNoturno).toBe(10);
            expect(result.totalGeralAdicionais).toBe(200);
        });
    });

    await describe('Unit Test: calculateINSSCalculator', () => {
        it('should calculate INSS using the "parcela a deduzir" method', () => {
            const state = { salarioBruto: 3000 };
            const result = calculations.calculateINSSCalculator(state, legalTexts);
            // (3000 * 0.12) - 84.66 = 360 - 84.66 = 275.34
            expect(result.contribuicaoINSS).toBe(275.34);
        });
    });

    await describe('Unit Test: calculateValeTransporte', () => {
        it('should calculate VT discount capped at 6% of salary', () => {
            const state = { salarioBruto: 2000, custoDiario: 10, diasTrabalho: 22 };
            const result = calculations.calculateValeTransporte(state, legalTexts);
            // Custo total = 10 * 22 = 220
            // 6% do salario = 2000 * 0.06 = 120
            // Desconto real = min(220, 120) = 120
            // Beneficio empregador = 220 - 120 = 100
            expect(result.descontoRealEmpregado).toBe(120);
            expect(result.valorBeneficioEmpregador).toBe(100);
        });
    });

    await describe('Unit Test: calculateIRPF', () => {
        it('should calculate tax to be paid correctly', () => {
            const state = { rendaAnual: 50000, dependentes: 1, outrasDeducoes: 5000, impostoRetido: 2000 };
            const result = calculations.calculateIRPF(state, legalTexts);
            // Deduções = (1 * 2275.08) + 5000 = 7275.08
            // Base de Calculo = 50000 - 7275.08 = 42724.92
            // Imposto Devido = (42724.92 * 0.15) - 4577.27 = 6408.738 - 4577.27 = 1831.468
            // Ajuste = 1831.468 - 2000 = -168.532 (restituição)
            expect(result.impostoDevido).toBe(1831.468);
            expect(result.ajusteFinal).toBe(-168.532);
            expect(result.tipoAjuste).toBe('restituir');
        });
    });
}
