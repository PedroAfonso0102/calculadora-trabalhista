import { calcularINSS, calcularIRRF, calcularSalarioFamilia } from '../regras/calculosBasicos.js';

describe('Cálculos Básicos - INSS, IRRF e Salário Família', () => {
  
  describe('calcularINSS', () => {
    test('deve retornar 0 para valores inválidos', () => {
      expect(calcularINSS(0).valor).toBe(0);
      expect(calcularINSS(-100).valor).toBe(0);
      expect(calcularINSS(null).valor).toBe(0);
      expect(calcularINSS(undefined).valor).toBe(0);
    });

    test('deve calcular corretamente para 1 salário mínimo (R$ 1.518,00)', () => {
      const resultado = calcularINSS(1518.00);
      expect(resultado.valor).toBe(113.85); // 1518 * 0.075
      expect(resultado.aliquotaEfetiva).toBe(7.5);
      expect(resultado.detalhamento).toHaveLength(1);
    });

    test('deve calcular corretamente para valor na segunda faixa (R$ 2.000,00)', () => {
      const resultado = calcularINSS(2000.00);
      // 1ª faixa: 1518 * 0.075 = 113.85
      // 2ª faixa: (2000 - 1518) * 0.09 = 482 * 0.09 = 43.38
      // Total: 113.85 + 43.38 = 157.23
      expect(resultado.valor).toBe(157.23);
      expect(resultado.detalhamento).toHaveLength(2);
    });

    test('deve calcular corretamente para valor na terceira faixa (R$ 3.000,00)', () => {
      const resultado = calcularINSS(3000.00);
      // 1ª faixa: 1518 * 0.075 = 113.85
      // 2ª faixa: (2531.34 - 1518) * 0.09 = 1013.34 * 0.09 = 91.20
      // 3ª faixa: (3000 - 2531.34) * 0.12 = 468.66 * 0.12 = 56.24
      // Total: 113.85 + 91.20 + 56.24 = 261.29
      expect(resultado.valor).toBe(261.29);
      expect(resultado.detalhamento).toHaveLength(3);
    });

    test('deve calcular corretamente para valor na quarta faixa (R$ 5.000,00)', () => {
      const resultado = calcularINSS(5000.00);
      // Deve incluir todas as 4 faixas
      expect(resultado.detalhamento).toHaveLength(4);
      expect(resultado.valor).toBeGreaterThan(0);
    });

    test('deve respeitar o teto do INSS (R$ 8.157,41)', () => {
      const resultadoTeto = calcularINSS(8157.41);
      const resultadoAcimaTeto = calcularINSS(10000.00);
      
      expect(resultadoTeto.valor).toBe(resultadoAcimaTeto.valor);
      expect(resultadoAcimaTeto.baseCalculo).toBe(8157.41);
    });

    test('deve calcular alíquota efetiva corretamente', () => {
      const resultado = calcularINSS(1518.00);
      expect(resultado.aliquotaEfetiva).toBe(7.5); // 7.5%
    });
  });

  describe('calcularIRRF', () => {
    test('deve retornar 0 para valores inválidos', () => {
      expect(calcularIRRF(0).valor).toBe(0);
      expect(calcularIRRF(-100).valor).toBe(0);
      expect(calcularIRRF(null).valor).toBe(0);
      expect(calcularIRRF(undefined).valor).toBe(0);
    });

    test('deve retornar 0 para valores abaixo da faixa de isenção (R$ 2.428,80)', () => {
      const resultado = calcularIRRF(2000.00);
      expect(resultado.valor).toBe(0);
      expect(resultado.aliquota).toBe(0);
    });

    test('deve calcular corretamente na segunda faixa (7,5%)', () => {
      const baseCalculo = 3000.00;
      const resultado = calcularIRRF(baseCalculo);
      
      // Base: 3000, Alíquota: 7,5%, Dedução: 182,16
      // Cálculo: (3000 * 0.075) - 182.16 = 225 - 182.16 = 42.84
      expect(resultado.valor).toBe(42.84);
      expect(resultado.aliquota).toBe(0.075);
    });

    test('deve aplicar dedução por dependentes corretamente', () => {
      const baseCalculo = 3000.00;
      const numDependentes = 2;
      const resultado = calcularIRRF(baseCalculo, numDependentes);
      
      const deducaoEsperada = 2 * 189.59; // 379.18
      expect(resultado.deducaoDependentes).toBe(379.18);
      
      // Base ajustada: 3000 - 379.18 = 2620.82
      // Como 2620.82 > 2428.80, aplica 7,5%
      // (2620.82 * 0.075) - 182.16 = 196.56 - 182.16 = 14.40
      expect(resultado.valor).toBe(14.40);
    });

    test('deve aplicar desconto simplificado corretamente', () => {
      const baseCalculo = 3000.00;
      const resultado = calcularIRRF(baseCalculo, 0, true);
      
      expect(resultado.descontoSimplificado).toBe(607.20);
      
      // Base ajustada: 3000 - 607.20 = 2392.80
      // Como 2392.80 < 2428.80, não há imposto
      expect(resultado.valor).toBe(0);
    });

    test('deve zerar imposto quando deduções excedem base de cálculo', () => {
      const baseCalculo = 2500.00;
      const numDependentes = 10; // 10 * 189.59 = 1895.90
      const resultado = calcularIRRF(baseCalculo, numDependentes, true);
      
      // Base ajustada: 2500 - 1895.90 - 607.20 = negativo
      expect(resultado.valor).toBe(0);
      expect(resultado.baseCalculoFinal).toBe(0);
    });

    test('deve calcular corretamente na faixa mais alta (27,5%)', () => {
      const baseCalculo = 10000.00;
      const resultado = calcularIRRF(baseCalculo);
      
      expect(resultado.aliquota).toBe(0.275);
      expect(resultado.valor).toBeGreaterThan(0);
      
      // (10000 * 0.275) - 953.36 = 2750 - 953.36 = 1796.64
      expect(resultado.valor).toBe(1796.64);
    });
  });

  describe('calcularSalarioFamilia', () => {
    test('deve retornar 0 para remuneração acima do limite', () => {
      const resultado = calcularSalarioFamilia(2000.00, 2);
      expect(resultado.valor).toBe(0);
      expect(resultado.temDireito).toBe(false);
    });

    test('deve retornar 0 para zero filhos', () => {
      const resultado = calcularSalarioFamilia(1500.00, 0);
      expect(resultado.valor).toBe(0);
      expect(resultado.temDireito).toBe(false);
    });

    test('deve calcular corretamente para remuneração dentro do limite', () => {
      const resultado = calcularSalarioFamilia(1500.00, 2);
      
      // 2 filhos * R$ 65,00 = R$ 130,00
      expect(resultado.valor).toBe(130.00);
      expect(resultado.temDireito).toBe(true);
      expect(resultado.numFilhos).toBe(2);
      expect(resultado.valorPorFilho).toBe(65.00);
    });

    test('deve calcular corretamente para múltiplos filhos', () => {
      const resultado = calcularSalarioFamilia(1800.00, 3);
      
      // 3 filhos * R$ 65,00 = R$ 195,00
      expect(resultado.valor).toBe(195.00);
      expect(resultado.numFilhos).toBe(3);
    });

    test('deve informar o limite de remuneração corretamente', () => {
      const resultado = calcularSalarioFamilia(1500.00, 1);
      expect(resultado.limiteRemuneracao).toBe(1906.04);
    });
  });

  describe('Testes de integração - cenários reais', () => {
    test('deve calcular folha completa para salário mínimo', () => {
      const salarioBruto = 1518.00;
      const inss = calcularINSS(salarioBruto);
      const baseIRRF = salarioBruto - inss.valor;
      const irrf = calcularIRRF(baseIRRF);
      const salarioFamilia = calcularSalarioFamilia(salarioBruto, 1);
      
      const salarioLiquido = salarioBruto - inss.valor - irrf.valor + salarioFamilia.valor;
      
      expect(inss.valor).toBe(113.85);
      expect(irrf.valor).toBe(0); // Base muito baixa para IRRF
      expect(salarioFamilia.valor).toBe(65.00);
      expect(salarioLiquido).toBe(1469.15); // 1518 - 113.85 + 65
    });

    test('deve calcular folha completa para salário médio', () => {
      const salarioBruto = 5000.00;
      const dependentes = 2;
      
      const inss = calcularINSS(salarioBruto);
      const baseIRRF = salarioBruto - inss.valor;
      const irrf = calcularIRRF(baseIRRF, dependentes);
      const salarioFamilia = calcularSalarioFamilia(salarioBruto, 0); // Sem direito
      
      const salarioLiquido = salarioBruto - inss.valor - irrf.valor + salarioFamilia.valor;
      
      expect(inss.valor).toBeGreaterThan(0);
      expect(irrf.valor).toBeGreaterThan(0);
      expect(salarioFamilia.valor).toBe(0);
      expect(salarioLiquido).toBeLessThan(salarioBruto);
    });
  });
});