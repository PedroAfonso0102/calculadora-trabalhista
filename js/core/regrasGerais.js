/**
 * Regras Gerais - Calculadora Trabalhista
 * 
 * Funções puras para cálculos de INSS, IRRF e outras regras gerais.
 * Estas funções não dependem do DOM e podem ser testadas unitariamente.
 */

import { getParametrosLegais } from '../config/parametrosLegais.js';

const parametros = getParametrosLegais();

/**
 * Calcula o desconto de INSS usando tabela progressiva
 * @param {number} salarioBase - Valor base para cálculo
 * @returns {number} Valor do desconto de INSS
 */
export function calcularINSS(salarioBase) {
    if (!salarioBase || salarioBase <= 0) {
        return 0;
    }

    const tabela = parametros.tabelaINSS;
    let totalDesconto = 0;
    let salarioRestante = Math.min(salarioBase, parametros.valoresBase.TETO_INSS);
    
    for (const faixa of tabela) {
        if (salarioRestante <= 0) break;
        
        const valorFaixa = Math.min(salarioRestante, faixa.faixaAte - (totalDesconto / faixa.aliquota));
        const descontoFaixa = valorFaixa * faixa.aliquota;
        
        totalDesconto += descontoFaixa;
        salarioRestante -= valorFaixa;
    }
    
    return Math.round(totalDesconto * 100) / 100; // Arredonda para 2 casas decimais
}

/**
 * Calcula o desconto de IRRF usando tabela progressiva
 * @param {number} baseCalculo - Base de cálculo (salário - INSS - dependentes)
 * @returns {number} Valor do desconto de IRRF
 */
export function calcularIRRF(baseCalculo) {
    if (!baseCalculo || baseCalculo <= 0) {
        return 0;
    }

    const tabela = parametros.tabelaIRRF;
    
    for (const faixa of tabela) {
        if (baseCalculo <= faixa.faixaAte) {
            const valor = (baseCalculo * faixa.aliquota) - faixa.deducao;
            return Math.max(0, Math.round(valor * 100) / 100);
        }
    }
    
    return 0;
}

/**
 * Calcula a base de cálculo do IRRF
 * @param {number} salarioBruto - Salário bruto
 * @param {number} descontoINSS - Valor do desconto de INSS
 * @param {number} numDependentes - Número de dependentes
 * @returns {number} Base de cálculo para IRRF
 */
export function calcularBaseIRRF(salarioBruto, descontoINSS, numDependentes = 0) {
    const deducaoDependentes = numDependentes * parametros.valoresBase.DEDUCAO_POR_DEPENDENTE_IRRF;
    return Math.max(0, salarioBruto - descontoINSS - deducaoDependentes);
}

/**
 * Calcula o salário família
 * @param {number} salarioBruto - Salário bruto do trabalhador
 * @param {number} numFilhos - Número de filhos até 14 anos ou inválidos
 * @returns {number} Valor do salário família
 */
export function calcularSalarioFamilia(salarioBruto, numFilhos = 0) {
    if (!salarioBruto || salarioBruto > parametros.valoresBase.LIMITE_SALARIO_FAMILIA || numFilhos <= 0) {
        return 0;
    }
    
    return numFilhos * parametros.valoresBase.VALOR_COTA_SALARIO_FAMILIA;
}

/**
 * Calcula proporcionalidade baseada em meses e dias
 * Regra: 15 dias ou mais = 1 mês completo
 * @param {Date} dataInicio - Data de início do período
 * @param {Date} dataFim - Data de fim do período
 * @returns {number} Número de meses proporcionais
 */
export function calcularMesesProporcionais(dataInicio, dataFim) {
    if (!dataInicio || !dataFim || dataInicio > dataFim) {
        return 0;
    }
    
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    let meses = 0;
    let dataAtual = new Date(inicio);
    
    while (dataAtual <= fim) {
        const proximoMes = new Date(dataAtual);
        proximoMes.setMonth(proximoMes.getMonth() + 1);
        
        if (proximoMes <= fim) {
            meses++;
            dataAtual = proximoMes;
        } else {
            // Verifica se os dias restantes dão direito a mais um mês
            const diasRestantes = Math.ceil((fim - dataAtual) / (1000 * 60 * 60 * 24));
            if (diasRestantes >= 15) {
                meses++;
            }
            break;
        }
    }
    
    return meses;
}

/**
 * Calcula o número de dias trabalhados em um período
 * @param {Date} dataInicio - Data de início
 * @param {Date} dataFim - Data de fim (inclusive)
 * @returns {number} Número de dias trabalhados
 */
export function calcularDiasTrabalhados(dataInicio, dataFim) {
    if (!dataInicio || !dataFim || dataInicio > dataFim) {
        return 0;
    }
    
    const umDia = 24 * 60 * 60 * 1000; // milissegundos em um dia
    const diferenca = dataFim - dataInicio;
    return Math.ceil(diferenca / umDia) + 1; // +1 para incluir o último dia
}

/**
 * Calcula saldo de salário proporcional
 * @param {number} salario - Salário mensal
 * @param {number} diasTrabalhados - Dias trabalhados no mês
 * @param {number} diasMes - Total de dias do mês (padrão 30)
 * @returns {number} Saldo proporcional
 */
export function calcularSaldoSalario(salario, diasTrabalhados, diasMes = 30) {
    if (!salario || diasTrabalhados <= 0) {
        return 0;
    }
    
    return (salario / diasMes) * diasTrabalhados;
}

/**
 * Calcula o direito a férias baseado no número de faltas injustificadas
 * @param {number} faltasInjustificadas - Número de faltas injustificadas no período aquisitivo
 * @returns {number} Número de dias de férias a que tem direito
 */
export function calcularDireitoFerias(faltasInjustificadas = 0) {
    const tabela = parametros.tabelaFerias;
    
    for (const faixa of tabela) {
        if (faltasInjustificadas <= faixa.faltasAte) {
            return faixa.diasDireito;
        }
    }
    
    return 0; // Sem direito a férias
}

/**
 * Calcula dias de aviso prévio baseado no tempo de serviço
 * @param {number} anosServico - Anos completos de serviço
 * @returns {number} Total de dias de aviso prévio
 */
export function calcularDiasAvisoPrevio(anosServico) {
    return parametros.funcoes.calcularDiasAdicionaisAviso(anosServico);
}

/**
 * Projeta data considerando aviso prévio indenizado
 * @param {Date} dataRescisao - Data da rescisão
 * @param {number} diasAvisoPrevio - Dias de aviso prévio
 * @returns {Date} Data projetada
 */
export function projetarDataComAviso(dataRescisao, diasAvisoPrevio) {
    const dataProjetada = new Date(dataRescisao);
    dataProjetada.setDate(dataProjetada.getDate() + diasAvisoPrevio);
    return dataProjetada;
}

/**
 * Valida se uma data está em formato válido
 * @param {Date|string} data - Data a ser validada
 * @returns {boolean} True se válida, false caso contrário
 */
export function validarData(data) {
    const dataObj = data instanceof Date ? data : new Date(data);
    return dataObj instanceof Date && !isNaN(dataObj.getTime());
}

/**
 * Valida se um valor numérico é positivo
 * @param {number} valor - Valor a ser validado
 * @returns {boolean} True se válido e positivo
 */
export function validarValorPositivo(valor) {
    return typeof valor === 'number' && valor >= 0 && !isNaN(valor);
}

/**
 * Formata valor monetário para exibição
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado em reais
 */
export function formatarMoeda(valor) {
    if (!valor && valor !== 0) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

/**
 * Arredonda valor para 2 casas decimais
 * @param {number} valor - Valor a ser arredondado
 * @returns {number} Valor arredondado
 */
export function arredondar(valor) {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
}

// Exportação de objeto com todas as funções para facilitar importação
export default {
    calcularINSS,
    calcularIRRF,
    calcularBaseIRRF,
    calcularSalarioFamilia,
    calcularMesesProporcionais,
    calcularDiasTrabalhados,
    calcularSaldoSalario,
    calcularDireitoFerias,
    calcularDiasAvisoPrevio,
    projetarDataComAviso,
    validarData,
    validarValorPositivo,
    formatarMoeda,
    arredondar
};