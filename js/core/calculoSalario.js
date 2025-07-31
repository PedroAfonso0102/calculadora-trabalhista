/**
 * Cálculo de Salário - Calculadora Trabalhista
 * 
 * Módulo responsável pelo cálculo de salário líquido mensal
 * incluindo INSS, IRRF e salário família.
 */

import { 
    calcularINSS, 
    calcularIRRF, 
    calcularBaseIRRF, 
    calcularSalarioFamilia,
    validarValorPositivo,
    arredondar
} from './regrasGerais.js';
import parametros from '../../config/parametrosLegais.js';

/**
 * Calcula o salário líquido mensal
 * @param {Object} dados - Dados para cálculo do salário
 * @param {number} dados.salarioBruto - Salário bruto mensal
 * @param {number} dados.numDependentes - Número de dependentes para IRRF
 * @param {number} dados.numFilhos - Número de filhos para salário família
 * @param {number} dados.outrosDescontos - Outros descontos (opcional)
 * @returns {Object} Resultado detalhado do cálculo
 */
export function calcularSalarioLiquido(dados) {
    // Validação dos dados de entrada
    const dadosValidados = validarDadosSalario(dados);
    if (!dadosValidados.valido) {
        return {
            erro: true,
            mensagem: dadosValidados.erro,
            resultado: null
        };
    }

    const { salarioBruto, numDependentes, numFilhos, outrosDescontos } = dadosValidados.dados;

    try {
        // Cálculo do INSS
        const descontoINSS = calcularINSS(salarioBruto);

        // Cálculo da base de IRRF
        const baseIRRF = calcularBaseIRRF(salarioBruto, descontoINSS, numDependentes);

        // Cálculo do IRRF
        const descontoIRRF = calcularIRRF(baseIRRF);

        // Cálculo do salário família
        const salarioFamilia = calcularSalarioFamilia(salarioBruto, numFilhos);

        // Cálculo do salário líquido
        const totalProventos = salarioBruto + salarioFamilia;
        const totalDescontos = descontoINSS + descontoIRRF + outrosDescontos;
        const salarioLiquido = totalProventos - totalDescontos;

        return {
            erro: false,
            dados: {
                salarioBruto,
                numDependentes,
                numFilhos,
                outrosDescontos
            },
            resultado: {
                proventos: {
                    salarioBruto: arredondar(salarioBruto),
                    salarioFamilia: arredondar(salarioFamilia),
                    total: arredondar(totalProventos)
                },
                descontos: {
                    inss: arredondar(descontoINSS),
                    irrf: arredondar(descontoIRRF),
                    outros: arredondar(outrosDescontos),
                    total: arredondar(totalDescontos)
                },
                liquido: arredondar(salarioLiquido),
                detalhamento: {
                    baseCalculoIRRF: arredondar(baseIRRF),
                    deducaoDependentes: arredondar(numDependentes * parametros.valoresBase.DEDUCAO_POR_DEPENDENTE_IRRF),
                    limiteParaSalarioFamilia: parametros.valoresBase.LIMITE_SALARIO_FAMILIA
                }
            }
        };

    } catch (error) {
        return {
            erro: true,
            mensagem: `Erro no cálculo: ${error.message}`,
            resultado: null
        };
    }
}

/**
 * Valida os dados de entrada para o cálculo de salário
 * @param {Object} dados - Dados a serem validados
 * @returns {Object} Resultado da validação
 */
function validarDadosSalario(dados) {
    if (!dados || typeof dados !== 'object') {
        return {
            valido: false,
            erro: 'Dados inválidos ou não informados'
        };
    }

    const { salarioBruto, numDependentes = 0, numFilhos = 0, outrosDescontos = 0 } = dados;

    // Validação do salário bruto
    if (!validarValorPositivo(salarioBruto) || salarioBruto <= 0) {
        return {
            valido: false,
            erro: 'Salário bruto deve ser um valor positivo'
        };
    }

    // Validação do número de dependentes
    if (!Number.isInteger(numDependentes) || numDependentes < 0) {
        return {
            valido: false,
            erro: 'Número de dependentes deve ser um número inteiro não negativo'
        };
    }

    // Validação do número de filhos
    if (!Number.isInteger(numFilhos) || numFilhos < 0) {
        return {
            valido: false,
            erro: 'Número de filhos deve ser um número inteiro não negativo'
        };
    }

    // Validação de outros descontos
    if (!validarValorPositivo(outrosDescontos)) {
        return {
            valido: false,
            erro: 'Outros descontos deve ser um valor não negativo'
        };
    }

    return {
        valido: true,
        dados: {
            salarioBruto: parseFloat(salarioBruto),
            numDependentes: parseInt(numDependentes),
            numFilhos: parseInt(numFilhos),
            outrosDescontos: parseFloat(outrosDescontos)
        }
    };
}

/**
 * Simula diferentes cenários de salário
 * @param {number} salarioBase - Salário base para simulação
 * @param {Array} cenarios - Array de cenários com diferentes configurações
 * @returns {Array} Array com resultados dos cenários
 */
/**
 * Calcula a alíquota efetiva de INSS e IRRF
 * @param {number} salarioBruto - Salário bruto
 * @param {number} numDependentes - Número de dependentes
 * @returns {Object} Alíquotas efetivas
 */
export function calcularAliquotasEfetivas(salarioBruto, numDependentes = 0) {
    if (!validarValorPositivo(salarioBruto)) {
        return null;
    }

    const descontoINSS = calcularINSS(salarioBruto);
    const baseIRRF = calcularBaseIRRF(salarioBruto, descontoINSS, numDependentes);
    const descontoIRRF = calcularIRRF(baseIRRF);

    return {
        aliquotaINSS: arredondar((descontoINSS / salarioBruto) * 100),
        aliquotaIRRF: arredondar((descontoIRRF / salarioBruto) * 100),
        aliquotaTotal: arredondar(((descontoINSS + descontoIRRF) / salarioBruto) * 100)
    };
}

// Exportação default
export default {
    calcularSalarioLiquido,
    calcularAliquotasEfetivas,
};