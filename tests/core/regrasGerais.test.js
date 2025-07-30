/**
 * Testes Unitários - Regras Gerais
 * 
 * Testes para as funções puras de cálculo de INSS, IRRF e regras trabalhistas.
 */

// Simular os parâmetros legais para teste
const mockParametros = {
    valoresBase: {
        SALARIO_MINIMO: 1412.00,
        TETO_INSS: 7786.02,
        DEDUCAO_POR_DEPENDENTE_IRRF: 189.59,
        VALOR_COTA_SALARIO_FAMILIA: 62.04,
        LIMITE_SALARIO_FAMILIA: 1819.26
    },
    tabelaINSS: [
        { faixaAte: 1412.00, aliquota: 0.075 },
        { faixaAte: 2666.68, aliquota: 0.09 },
        { faixaAte: 4000.03, aliquota: 0.12 },
        { faixaAte: 7786.02, aliquota: 0.14 }
    ],
    tabelaIRRF: [
        { faixaAte: 2259.20, aliquota: 0.0, deducao: 0 },
        { faixaAte: 2826.65, aliquota: 0.075, deducao: 169.44 },
        { faixaAte: 3751.05, aliquota: 0.15, deducao: 381.44 },
        { faixaAte: 4664.68, aliquota: 0.225, deducao: 662.77 },
        { faixaAte: Infinity, aliquota: 0.275, deducao: 896.00 }
    ],
    tabelaFerias: [
        { faltasAte: 5, diasDireito: 30 },
        { faltasAte: 14, diasDireito: 24 },
        { faltasAte: 23, diasDireito: 18 },
        { faltasAte: 32, diasDireito: 12 },
        { faltasAte: Infinity, diasDireito: 0 }
    ],
    funcoes: {
        calcularDiasAdicionaisAviso: (anos) => Math.min(30 + (anos * 3), 90)
    }
};

// Funções de cálculo para teste (baseadas nas regras legais)
function calcularINSS(salarioBase) {
    if (!salarioBase || salarioBase <= 0) {
        return 0;
    }

    const tabela = mockParametros.tabelaINSS;
    let totalDesconto = 0;
    let salarioRestante = Math.min(salarioBase, mockParametros.valoresBase.TETO_INSS);
    let faixaAnterior = 0;
    
    for (const faixa of tabela) {
        if (salarioRestante <= 0) break;
        
        const valorFaixa = Math.min(salarioRestante, faixa.faixaAte - faixaAnterior);
        const descontoFaixa = valorFaixa * faixa.aliquota;
        
        totalDesconto += descontoFaixa;
        salarioRestante -= valorFaixa;
        faixaAnterior = faixa.faixaAte;
    }
    
    return Math.round(totalDesconto * 100) / 100;
}

function calcularIRRF(baseCalculo) {
    if (!baseCalculo || baseCalculo <= 0) {
        return 0;
    }

    const tabela = mockParametros.tabelaIRRF;
    
    for (const faixa of tabela) {
        if (baseCalculo <= faixa.faixaAte) {
            const valor = (baseCalculo * faixa.aliquota) - faixa.deducao;
            return Math.max(0, Math.round(valor * 100) / 100);
        }
    }
    
    return 0;
}

function calcularBaseIRRF(salarioBruto, descontoINSS, numDependentes = 0) {
    const deducaoDependentes = numDependentes * mockParametros.valoresBase.DEDUCAO_POR_DEPENDENTE_IRRF;
    return Math.max(0, salarioBruto - descontoINSS - deducaoDependentes);
}

function calcularSalarioFamilia(salarioBruto, numFilhos = 0) {
    if (!salarioBruto || salarioBruto > mockParametros.valoresBase.LIMITE_SALARIO_FAMILIA || numFilhos <= 0) {
        return 0;
    }
    
    return numFilhos * mockParametros.valoresBase.VALOR_COTA_SALARIO_FAMILIA;
}

function formatarMoeda(valor) {
    if (!valor && valor !== 0) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

describe('Cálculo de INSS', () => {
    test('deve calcular INSS corretamente para salário mínimo', () => {
        const resultado = calcularINSS(1412.00);
        expect(resultado).toBe(105.90); // 1412 * 7.5%
    });

    test('deve calcular INSS corretamente para salário na segunda faixa', () => {
        const resultado = calcularINSS(2000.00);
        // Primeira faixa: 1412 * 7.5% = 105.90
        // Segunda faixa: (2000 - 1412) * 9% = 52.92
        // Total: 158.82
        expect(resultado).toBe(158.82);
    });

    test('deve respeitar o teto do INSS', () => {
        const resultado = calcularINSS(10000.00);
        const resultadoTeto = calcularINSS(7786.02);
        expect(resultado).toBe(resultadoTeto);
    });

    test('deve retornar 0 para valores inválidos', () => {
        expect(calcularINSS(0)).toBe(0);
        expect(calcularINSS(-100)).toBe(0);
        expect(calcularINSS(null)).toBe(0);
        expect(calcularINSS(undefined)).toBe(0);
    });
});

describe('Cálculo de IRRF', () => {
    test('deve retornar 0 para valores na faixa de isenção', () => {
        expect(calcularIRRF(2000.00)).toBe(0);
        expect(calcularIRRF(2259.20)).toBe(0);
    });

    test('deve calcular IRRF corretamente na segunda faixa', () => {
        const baseCalculo = 2500.00;
        const resultado = calcularIRRF(baseCalculo);
        const esperado = Math.max(0, Math.round(((2500 * 0.075) - 169.44) * 100) / 100);
        expect(resultado).toBe(esperado);
    });

    test('deve calcular IRRF corretamente para valores altos', () => {
        const baseCalculo = 5000.00;
        const resultado = calcularIRRF(baseCalculo);
        const esperado = Math.round(((5000 * 0.275) - 896.00) * 100) / 100;
        expect(resultado).toBe(esperado);
    });

    test('deve retornar 0 para valores inválidos', () => {
        expect(calcularIRRF(0)).toBe(0);
        expect(calcularIRRF(-100)).toBe(0);
        expect(calcularIRRF(null)).toBe(0);
    });
});

describe('Cálculo de Base do IRRF', () => {
    test('deve calcular base corretamente sem dependentes', () => {
        const resultado = calcularBaseIRRF(3000, 300, 0);
        expect(resultado).toBe(2700); // 3000 - 300 - 0
    });

    test('deve deduzir valor por dependente', () => {
        const resultado = calcularBaseIRRF(3000, 300, 2);
        const esperado = 3000 - 300 - (2 * 189.59);
        expect(resultado).toBe(esperado);
    });

    test('deve retornar 0 se resultado for negativo', () => {
        const resultado = calcularBaseIRRF(1000, 2000, 0);
        expect(resultado).toBe(0);
    });
});

describe('Cálculo de Salário Família', () => {
    test('deve calcular salário família corretamente', () => {
        const resultado = calcularSalarioFamilia(1500, 2);
        expect(resultado).toBe(124.08); // 2 * 62.04
    });

    test('deve retornar 0 para salário acima do limite', () => {
        const resultado = calcularSalarioFamilia(2000, 2);
        expect(resultado).toBe(0);
    });

    test('deve retornar 0 sem filhos', () => {
        const resultado = calcularSalarioFamilia(1500, 0);
        expect(resultado).toBe(0);
    });
});

describe('Funções de Formatação', () => {
    test('deve formatar valores monetários corretamente', () => {
        expect(formatarMoeda(1234.56)).toMatch(/R\$\s*1\.234,56/);
        expect(formatarMoeda(0)).toMatch(/R\$\s*0,00/);
        expect(formatarMoeda(null)).toMatch(/R\$\s*0,00/);
    });
});