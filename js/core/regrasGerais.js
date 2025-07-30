/**
 * Regras Gerais de Cálculo
 * 
 * Funções puras para cálculos de INSS, IRRF e outras regras trabalhistas básicas.
 * Todas as funções consomem os parâmetros legais centralizados.
 */

import PARAMETROS_LEGAIS from '../../config/parametrosLegais.js';

/**
 * Calcula o INSS de forma progressiva
 * @param {number} baseCalculo - Base de cálculo para o INSS
 * @returns {number} Valor do desconto de INSS
 */
export function calcularINSS(baseCalculo) {
  if (!baseCalculo || baseCalculo <= 0) return 0;
  
  let valorINSS = 0;
  let baseRestante = Math.min(baseCalculo, PARAMETROS_LEGAIS.tetoINSS);
  
  for (const faixa of PARAMETROS_LEGAIS.tabelaINSS) {
    if (baseRestante <= 0) break;
    
    const limiteFaixa = faixa.limite;
    const aliquota = faixa.aliquota;
    
    // Valor aplicável nesta faixa
    const valorFaixa = Math.min(baseRestante, limiteFaixa);
    
    // Se não é a primeira faixa, subtrai o limite da faixa anterior
    const faixaAnterior = PARAMETROS_LEGAIS.tabelaINSS[PARAMETROS_LEGAIS.tabelaINSS.indexOf(faixa) - 1];
    const baseMinima = faixaAnterior ? faixaAnterior.limite : 0;
    
    const valorCalculavel = Math.max(0, valorFaixa - baseMinima);
    
    valorINSS += valorCalculavel * aliquota;
    baseRestante -= valorCalculavel;
  }
  
  return Math.round(valorINSS * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * Calcula o IRRF de forma progressiva
 * @param {number} baseCalculo - Base de cálculo para o IRRF
 * @param {number} numDependentes - Número de dependentes
 * @param {boolean} descontoSimplificado - Se deve usar desconto simplificado
 * @returns {number} Valor do desconto de IRRF
 */
export function calcularIRRF(baseCalculo, numDependentes = 0, descontoSimplificado = false) {
  if (!baseCalculo || baseCalculo <= 0) return 0;
  
  // Aplicar dedução por dependentes
  const deducaoDependentes = numDependentes * PARAMETROS_LEGAIS.deducaoDependenteIRRF;
  let baseCalculoAjustada = baseCalculo - deducaoDependentes;
  
  if (baseCalculoAjustada <= 0) return 0;
  
  // Encontrar a faixa correspondente
  let valorIRRF = 0;
  
  for (const faixa of PARAMETROS_LEGAIS.tabelaIRRF) {
    if (baseCalculoAjustada <= faixa.limite || faixa.limite === Infinity) {
      valorIRRF = (baseCalculoAjustada * faixa.aliquota) - faixa.deducao;
      break;
    }
  }
  
  // Aplicar desconto simplificado se solicitado
  if (descontoSimplificado) {
    const valorComDescontoSimplificado = baseCalculo * 0.20; // 20% para desconto simplificado
    const descontoMaximo = PARAMETROS_LEGAIS.descontoSimplificadoIRRF;
    valorIRRF = Math.min(valorComDescontoSimplificado, descontoMaximo);
  }
  
  return Math.max(0, Math.round(valorIRRF * 100) / 100);
}

/**
 * Calcula o salário-família
 * @param {number} salarioBruto - Salário bruto do trabalhador
 * @param {number} numFilhos - Número de filhos menores de 14 anos
 * @returns {number} Valor do salário-família
 */
export function calcularSalarioFamilia(salarioBruto, numFilhos = 0) {
  if (!salarioBruto || salarioBruto <= 0 || numFilhos <= 0) return 0;
  
  const { limiteRemuneracao, valorCota } = PARAMETROS_LEGAIS.salarioFamilia;
  
  if (salarioBruto <= limiteRemuneracao) {
    return numFilhos * valorCota;
  }
  
  return 0;
}

/**
 * Calcula a proporcionalidade em meses (regra dos "avos")
 * @param {Date} dataInicio - Data de início do período
 * @param {Date} dataFim - Data de fim do período
 * @returns {number} Número de meses proporcionais
 */
export function calcularProporcionalidadeMeses(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 0;
  
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  
  if (inicio >= fim) return 0;
  
  let meses = 0;
  let dataAtual = new Date(inicio);
  
  while (dataAtual < fim) {
    const proximoMes = new Date(dataAtual);
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    
    if (proximoMes <= fim) {
      meses += 1;
    } else {
      // Verificar se os dias restantes são >= 15
      const diasRestantes = Math.floor((fim - dataAtual) / (1000 * 60 * 60 * 24));
      if (diasRestantes >= PARAMETROS_LEGAIS.proporcionalidade.diasMinimosFracao) {
        meses += 1;
      }
    }
    
    dataAtual = proximoMes;
  }
  
  return meses;
}

/**
 * Calcula dias proporcionais entre duas datas
 * @param {Date} dataInicio - Data de início
 * @param {Date} dataFim - Data de fim
 * @returns {number} Número de dias
 */
export function calcularDiasProporcionalidade(dataInicio, dataFim) {
  if (!dataInicio || !dataFim) return 0;
  
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  
  if (inicio >= fim) return 0;
  
  const diffTime = Math.abs(fim - inicio);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Calcula dias de aviso prévio
 * @param {Date} dataAdmissao - Data de admissão
 * @param {Date} dataSaida - Data de saída
 * @returns {number} Número de dias de aviso prévio
 */
export function calcularDiasAvisoPrevio(dataAdmissao, dataSaida) {
  if (!dataAdmissao || !dataSaida) return PARAMETROS_LEGAIS.avisoPrevio.diasBase;
  
  const anosTrabalho = Math.floor(calcularProporcionalidadeMeses(dataAdmissao, dataSaida) / 12);
  const diasAdicionais = Math.min(
    anosTrabalho * PARAMETROS_LEGAIS.avisoPrevio.diasAdicionaisPorAno,
    PARAMETROS_LEGAIS.avisoPrevio.limiteMaximo - PARAMETROS_LEGAIS.avisoPrevio.diasBase
  );
  
  return PARAMETROS_LEGAIS.avisoPrevio.diasBase + diasAdicionais;
}

/**
 * Calcula dias de férias com base nas faltas
 * @param {number} faltasInjustificadas - Número de faltas injustificadas
 * @returns {number} Dias de férias a que tem direito
 */
export function calcularDireitoFerias(faltasInjustificadas = 0) {
  for (const faixa of PARAMETROS_LEGAIS.tabelaFerias) {
    if (faltasInjustificadas <= faixa.faltasAte) {
      return faixa.diasDireito;
    }
  }
  return 0;
}

/**
 * Formata valor monetário
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado em R$
 */
export function formatarMoeda(valor) {
  if (typeof valor !== 'number') return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

/**
 * Converte string para número
 * @param {string|number} valor - Valor a ser convertido
 * @returns {number} Valor numérico
 */
export function parseValor(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string') {
    return parseFloat(valor.replace(',', '.')) || 0;
  }
  return 0;
}