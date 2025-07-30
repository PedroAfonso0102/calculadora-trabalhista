/**
 * Cálculo de 13º Salário - Calculadora Trabalhista
 * 
 * Módulo responsável pelo cálculo do 13º salário (gratificação natalina),
 * incluindo primeira e segunda parcelas, com respectivos descontos.
 */

import { 
    calcularINSS, 
    calcularIRRF, 
    calcularBaseIRRF,
    validarValorPositivo,
    arredondar
} from './regrasGerais.js';

/**
 * Calcula o 13º salário completo
 * @param {Object} dados - Dados para cálculo do 13º
 * @param {number} dados.salarioBruto - Salário bruto atual
 * @param {number} dados.mesesTrabalhados - Meses trabalhados no ano (1-12)
 * @param {number} dados.primeiraParcela - Valor já pago da 1ª parcela (opcional)
 * @param {number} dados.numDependentes - Dependentes para IRRF
 * @param {boolean} dados.calcularSeparado - Se deve calcular 1ª e 2ª parcelas separadamente
 * @returns {Object} Resultado detalhado do cálculo
 */
export function calcular13Salario(dados) {
    // Validação dos dados de entrada
    const dadosValidados = validarDados13Salario(dados);
    if (!dadosValidados.valido) {
        return {
            erro: true,
            mensagem: dadosValidados.erro,
            resultado: null
        };
    }

    const { 
        salarioBruto, 
        mesesTrabalhados, 
        primeiraParcela,
        numDependentes,
        calcularSeparado
    } = dadosValidados.dados;

    try {
        // Cálculo do valor bruto do 13º proporcional
        const valor13Bruto = (salarioBruto / 12) * mesesTrabalhados;
        
        // Cálculo da primeira parcela (50% do bruto, sem descontos)
        const valorPrimeiraParcela = valor13Bruto / 2;
        
        if (calcularSeparado) {
            return calcular13Separadamente(valor13Bruto, valorPrimeiraParcela, primeiraParcela, numDependentes, dados);
        } else {
            return calcular13Integral(valor13Bruto, numDependentes, dados);
        }

    } catch (error) {
        return {
            erro: true,
            mensagem: `Erro no cálculo: ${error.message}`,
            resultado: null
        };
    }
}

/**
 * Calcula o 13º salário de forma integral (como se fosse pago de uma vez)
 * @param {number} valor13Bruto - Valor bruto do 13º
 * @param {number} numDependentes - Número de dependentes
 * @param {Object} dadosOriginais - Dados originais da entrada
 * @returns {Object} Resultado do cálculo integral
 */
function calcular13Integral(valor13Bruto, numDependentes, dadosOriginais) {
    // Cálculo dos descontos sobre o valor total
    const descontoINSS = calcularINSS(valor13Bruto);
    const baseIRRF = calcularBaseIRRF(valor13Bruto, descontoINSS, numDependentes);
    const descontoIRRF = calcularIRRF(baseIRRF);
    
    const totalDescontos = descontoINSS + descontoIRRF;
    const valor13Liquido = valor13Bruto - totalDescontos;

    return {
        erro: false,
        dados: dadosOriginais,
        resultado: {
            tipo: 'integral',
            valores: {
                bruto: arredondar(valor13Bruto),
                descontoINSS: arredondar(descontoINSS),
                descontoIRRF: arredondar(descontoIRRF),
                totalDescontos: arredondar(totalDescontos),
                liquido: arredondar(valor13Liquido)
            },
            detalhamento: {
                baseCalculoIRRF: arredondar(baseIRRF),
                deducaoDependentes: arredondar(numDependentes * 189.59),
                valorMensal: arredondar(valor13Bruto / 12),
                proporcionalidade: `${dadosOriginais.mesesTrabalhados}/12 avos`
            }
        }
    };
}

/**
 * Calcula o 13º salário separadamente (1ª e 2ª parcelas)
 * @param {number} valor13Bruto - Valor bruto total do 13º
 * @param {number} valorPrimeiraParcela - Valor da primeira parcela
 * @param {number} primeiraParcelaPaga - Valor já pago da primeira parcela
 * @param {number} numDependentes - Número de dependentes
 * @param {Object} dadosOriginais - Dados originais
 * @returns {Object} Resultado do cálculo separado
 */
function calcular13Separadamente(valor13Bruto, valorPrimeiraParcela, primeiraParcelaPaga, numDependentes, dadosOriginais) {
    // Primeira parcela (sem descontos)
    const primeiraParcela = {
        bruto: arredondar(valorPrimeiraParcela),
        descontos: 0,
        liquido: arredondar(valorPrimeiraParcela),
        observacao: 'Paga entre fevereiro e novembro, sem descontos'
    };

    // Cálculo dos descontos sobre o valor total do 13º
    const descontoINSSTotal = calcularINSS(valor13Bruto);
    const baseIRRFTotal = calcularBaseIRRF(valor13Bruto, descontoINSSTotal, numDependentes);
    const descontoIRRFTotal = calcularIRRF(baseIRRFTotal);
    
    // Segunda parcela = valor total - primeira parcela - descontos totais
    const valorBrutoSegundaParcela = valor13Bruto - primeiraParcelaPaga;
    const totalDescontos = descontoINSSTotal + descontoIRRFTotal;
    const valorLiquidoSegundaParcela = valorBrutoSegundaParcela - totalDescontos;

    const segundaParcela = {
        bruto: arredondar(valorBrutoSegundaParcela),
        descontoINSS: arredondar(descontoINSSTotal),
        descontoIRRF: arredondar(descontoIRRFTotal),
        totalDescontos: arredondar(totalDescontos),
        liquido: arredondar(valorLiquidoSegundaParcela),
        observacao: 'Paga até 20 de dezembro, com todos os descontos'
    };

    return {
        erro: false,
        dados: dadosOriginais,
        resultado: {
            tipo: 'separado',
            valorTotal: {
                bruto: arredondar(valor13Bruto),
                liquido: arredondar(primeiraParcela.liquido + segundaParcela.liquido)
            },
            primeiraParcela,
            segundaParcela,
            resumo: {
                totalBruto: arredondar(valor13Bruto),
                totalDescontos: arredondar(totalDescontos),
                totalLiquido: arredondar(primeiraParcela.liquido + segundaParcela.liquido),
                primeiraParcelaPaga: arredondar(primeiraParcelaPaga)
            },
            detalhamento: {
                baseCalculoIRRF: arredondar(baseIRRFTotal),
                deducaoDependentes: arredondar(numDependentes * 189.59),
                proporcionalidade: `${dadosOriginais.mesesTrabalhados}/12 avos`
            }
        }
    };
}

/**
 * Valida os dados de entrada para o cálculo do 13º salário
 * @param {Object} dados - Dados a serem validados
 * @returns {Object} Resultado da validação
 */
function validarDados13Salario(dados) {
    if (!dados || typeof dados !== 'object') {
        return {
            valido: false,
            erro: 'Dados inválidos ou não informados'
        };
    }

    const { 
        salarioBruto, 
        mesesTrabalhados, 
        primeiraParcela = 0,
        numDependentes = 0,
        calcularSeparado = false
    } = dados;

    // Validação do salário bruto
    if (!validarValorPositivo(salarioBruto) || salarioBruto <= 0) {
        return {
            valido: false,
            erro: 'Salário bruto deve ser um valor positivo'
        };
    }

    // Validação dos meses trabalhados
    if (!Number.isInteger(mesesTrabalhados) || mesesTrabalhados < 1 || mesesTrabalhados > 12) {
        return {
            valido: false,
            erro: 'Meses trabalhados deve ser um número inteiro entre 1 e 12'
        };
    }

    // Validação da primeira parcela
    if (!validarValorPositivo(primeiraParcela)) {
        return {
            valido: false,
            erro: 'Primeira parcela deve ser um valor não negativo'
        };
    }

    // Validação do número de dependentes
    if (!Number.isInteger(numDependentes) || numDependentes < 0) {
        return {
            valido: false,
            erro: 'Número de dependentes deve ser um número inteiro não negativo'
        };
    }

    // Validação da primeira parcela máxima
    const valor13Bruto = (salarioBruto / 12) * mesesTrabalhados;
    const maxPrimeiraParcela = valor13Bruto / 2;
    
    if (primeiraParcela > maxPrimeiraParcela) {
        return {
            valido: false,
            erro: `Primeira parcela não pode exceder 50% do 13º (máx. R$ ${maxPrimeiraParcela.toFixed(2)})`
        };
    }

    return {
        valido: true,
        dados: {
            salarioBruto: parseFloat(salarioBruto),
            mesesTrabalhados: parseInt(mesesTrabalhados),
            primeiraParcela: parseFloat(primeiraParcela),
            numDependentes: parseInt(numDependentes),
            calcularSeparado: Boolean(calcularSeparado)
        }
    };
}

/**
 * Calcula apenas a primeira parcela do 13º salário
 * @param {number} salarioBruto - Salário bruto
 * @param {number} mesesTrabalhados - Meses trabalhados
 * @returns {Object} Resultado da primeira parcela
 */
export function calcularPrimeiraParcela13(salarioBruto, mesesTrabalhados) {
    if (!validarValorPositivo(salarioBruto) || !Number.isInteger(mesesTrabalhados)) {
        return null;
    }

    const valor13Bruto = (salarioBruto / 12) * mesesTrabalhados;
    const primeiraParcela = valor13Bruto / 2;

    return {
        valor13BrutoTotal: arredondar(valor13Bruto),
        primeiraParcela: arredondar(primeiraParcela),
        observacao: 'Primeira parcela não sofre descontos',
        prazoMaximo: 'Até 30 de novembro'
    };
}

/**
 * Simula diferentes cenários de 13º salário
 * @param {number} salarioBase - Salário base para simulação
 * @param {Array} cenarios - Array de cenários
 * @returns {Array} Array com resultados dos cenários
 */
export function simularCenarios13Salario(salarioBase, cenarios) {
    if (!validarValorPositivo(salarioBase) || !Array.isArray(cenarios)) {
        return [];
    }

    return cenarios.map((cenario, index) => {
        const dadosCalculo = {
            salarioBruto: salarioBase,
            mesesTrabalhados: cenario.meses || 12,
            primeiraParcela: cenario.primeiraParcela || 0,
            numDependentes: cenario.dependentes || 0,
            calcularSeparado: cenario.separado || false
        };

        const resultado = calcular13Salario(dadosCalculo);

        return {
            cenario: index + 1,
            descricao: cenario.descricao || `Cenário ${index + 1}`,
            parametros: cenario,
            calculo: resultado
        };
    });
}

/**
 * Gera relatório detalhado do cálculo do 13º salário
 * @param {Object} resultado - Resultado do cálculo do 13º
 * @returns {Object} Relatório formatado
 */
export function gerarRelatorio13Salario(resultado) {
    if (!resultado || resultado.erro) {
        return null;
    }

    const { dados, resultado: calc } = resultado;

    const relatorio = {
        titulo: '13º Salário - Gratificação Natalina',
        ano: new Date().getFullYear(),
        dadosEntrada: {
            'Salário Base': `R$ ${dados.salarioBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            'Meses Trabalhados': `${dados.mesesTrabalhados}/12`,
            'Dependentes IRRF': dados.numDependentes.toString(),
            'Tipo de Cálculo': calc.tipo === 'separado' ? 'Parcelas Separadas' : 'Valor Integral'
        }
    };

    if (calc.tipo === 'integral') {
        relatorio.discriminacao = {
            proventos: [
                {
                    item: '13º Salário Bruto',
                    valor: calc.valores.bruto,
                    observacao: calc.detalhamento.proporcionalidade
                }
            ],
            descontos: [
                {
                    item: 'INSS',
                    valor: calc.valores.descontoINSS,
                    observacao: 'Contribuição previdenciária'
                },
                {
                    item: 'IRRF',
                    valor: calc.valores.descontoIRRF,
                    observacao: `Base: R$ ${calc.detalhamento.baseCalculoIRRF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
            ]
        };

        relatorio.resumo = {
            totalBruto: calc.valores.bruto,
            totalDescontos: calc.valores.totalDescontos,
            valorLiquido: calc.valores.liquido
        };
    } else {
        relatorio.parcelas = {
            primeira: {
                titulo: '1ª Parcela (Adiantamento)',
                bruto: calc.primeiraParcela.bruto,
                descontos: calc.primeiraParcela.descontos,
                liquido: calc.primeiraParcela.liquido,
                observacao: calc.primeiraParcela.observacao
            },
            segunda: {
                titulo: '2ª Parcela (Complemento)',
                bruto: calc.segundaParcela.bruto,
                inss: calc.segundaParcela.descontoINSS,
                irrf: calc.segundaParcela.descontoIRRF,
                totalDescontos: calc.segundaParcela.totalDescontos,
                liquido: calc.segundaParcela.liquido,
                observacao: calc.segundaParcela.observacao
            }
        };

        relatorio.resumo = {
            totalBruto: calc.resumo.totalBruto,
            totalDescontos: calc.resumo.totalDescontos,
            totalLiquido: calc.resumo.totalLiquido
        };
    }

    relatorio.observacoes = [
        'Primeira parcela não sofre desconto de INSS nem IRRF',
        'Descontos incidem sobre o valor total do 13º salário',
        'Base de cálculo: (Salário ÷ 12) × meses trabalhados',
        'Prazo: 1ª parcela até novembro, 2ª parcela até 20 de dezembro'
    ];

    return relatorio;
}

// Exportação default
export default {
    calcular13Salario,
    calcularPrimeiraParcela13,
    simularCenarios13Salario,
    gerarRelatorio13Salario
};