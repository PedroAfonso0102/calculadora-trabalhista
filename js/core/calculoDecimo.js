/**
 * Módulo de Cálculo de 13º Salário
 * 
 * Calcula o 13º salário proporcional com primeira e segunda parcelas,
 * aplicando descontos apenas na segunda parcela.
 */

import { 
  calcularINSS, 
  calcularIRRF,
  formatarMoeda 
} from './regrasGerais.js';

/**
 * Calcula 13º salário
 * @param {Object} dados - Dados para o cálculo
 * @param {number} dados.salarioBruto - Salário bruto
 * @param {number} dados.mesesTrabalhados - Meses trabalhados no ano
 * @param {number} dados.dependentes - Número de dependentes
 * @returns {Object} Resultado do cálculo
 */
export function calcularDecimoTerceiro(dados) {
  const { salarioBruto, mesesTrabalhados, dependentes = 0 } = dados;
  
  if (!salarioBruto || salarioBruto <= 0) {
    throw new Error('Salário bruto deve ser maior que zero');
  }
  
  if (!mesesTrabalhados || mesesTrabalhados <= 0 || mesesTrabalhados > 12) {
    throw new Error('Meses trabalhados deve ser entre 1 e 12');
  }
  
  // Cálculo do valor bruto proporcional
  const valorBrutoTotal = (salarioBruto / 12) * mesesTrabalhados;
  
  // Primeira parcela (adiantamento) - sem descontos
  const primeiraParcela = valorBrutoTotal / 2;
  
  // Segunda parcela - com descontos sobre o valor total
  const descontoINSS = calcularINSS(valorBrutoTotal);
  const baseCalculoIRRF = valorBrutoTotal - descontoINSS;
  const descontoIRRF = calcularIRRF(baseCalculoIRRF, dependentes);
  
  const totalDescontos = descontoINSS + descontoIRRF;
  const segundaParcela = valorBrutoTotal - primeiraParcela - totalDescontos;
  const valorLiquidoTotal = valorBrutoTotal - totalDescontos;
  
  return {
    tipo: 'decimo_terceiro',
    dados: {
      salarioBruto,
      mesesTrabalhados,
      dependentes
    },
    calculo: {
      valorBrutoTotal: {
        descricao: '13º Salário Bruto Total',
        valor: valorBrutoTotal,
        valorFormatado: formatarMoeda(valorBrutoTotal),
        detalhes: `(R$ ${formatarMoeda(salarioBruto).replace('R$ ', '')} ÷ 12) × ${mesesTrabalhados} meses`
      },
      proporcionalidade: {
        descricao: 'Proporcionalidade',
        valor: mesesTrabalhados / 12,
        valorFormatado: `${mesesTrabalhados}/12 = ${((mesesTrabalhados / 12) * 100).toFixed(1)}%`
      }
    },
    parcelas: {
      primeiraParcela: {
        descricao: '1ª Parcela (Adiantamento)',
        valor: primeiraParcela,
        valorFormatado: formatarMoeda(primeiraParcela),
        observacao: 'Paga até 30 de novembro, sem descontos'
      },
      segundaParcela: {
        descricao: '2ª Parcela (Complemento)',
        valor: segundaParcela,
        valorFormatado: formatarMoeda(segundaParcela),
        observacao: 'Paga até 20 de dezembro, com descontos'
      }
    },
    descontos: {
      inss: {
        descricao: 'INSS (aplicado na 2ª parcela)',
        valor: descontoINSS,
        valorFormatado: formatarMoeda(descontoINSS),
        baseCalculo: valorBrutoTotal,
        baseCalculoFormatada: formatarMoeda(valorBrutoTotal)
      },
      irrf: {
        descricao: 'IRRF (aplicado na 2ª parcela)',
        valor: descontoIRRF,
        valorFormatado: formatarMoeda(descontoIRRF),
        baseCalculo: baseCalculoIRRF,
        baseCalculoFormatada: formatarMoeda(baseCalculoIRRF)
      }
    },
    resumo: {
      valorBrutoTotal: {
        descricao: 'Valor Bruto Total',
        valor: valorBrutoTotal,
        valorFormatado: formatarMoeda(valorBrutoTotal)
      },
      totalDescontos: {
        descricao: 'Total de Descontos',
        valor: totalDescontos,
        valorFormatado: formatarMoeda(totalDescontos)
      },
      valorLiquidoTotal: {
        descricao: 'Valor Líquido Total',
        valor: valorLiquidoTotal,
        valorFormatado: formatarMoeda(valorLiquidoTotal)
      }
    },
    cronograma: {
      adiantamento: {
        descricao: 'Adiantamento (1ª parcela)',
        prazo: 'Até 30 de novembro',
        valor: primeiraParcela,
        valorFormatado: formatarMoeda(primeiraParcela)
      },
      complemento: {
        descricao: 'Complemento (2ª parcela)',
        prazo: 'Até 20 de dezembro',
        valor: segundaParcela,
        valorFormatado: formatarMoeda(segundaParcela)
      }
    },
    observacoes: [
      'Cálculo baseado na legislação vigente de 2025',
      'A 1ª parcela deve ser paga entre fevereiro e novembro',
      'A 2ª parcela deve ser paga até 20 de dezembro',
      'Descontos de INSS e IRRF aplicados apenas na 2ª parcela',
      'Base de cálculo: valor total do 13º salário',
      dependentes > 0 ? `Dedução de ${dependentes} dependente(s) aplicada no IRRF` : null,
      mesesTrabalhados < 12 ? `Valor proporcional a ${mesesTrabalhados} meses trabalhados` : null
    ].filter(Boolean)
  };
}