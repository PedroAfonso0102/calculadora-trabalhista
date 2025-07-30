/**
 * Módulo de Cálculo de Salário Mensal
 * 
 * Calcula o salário líquido mensal com base no salário bruto,
 * dependentes e outros descontos.
 */

import { 
  calcularINSS, 
  calcularIRRF, 
  calcularSalarioFamilia,
  formatarMoeda 
} from './regrasGerais.js';

/**
 * Calcula o salário líquido mensal
 * @param {Object} dados - Dados para o cálculo
 * @param {number} dados.salarioBruto - Salário bruto
 * @param {number} dados.dependentes - Número de dependentes
 * @param {number} dados.outrosDescontos - Outros descontos
 * @returns {Object} Resultado do cálculo
 */
export function calcularSalarioLiquido(dados) {
  const { salarioBruto, dependentes = 0, outrosDescontos = 0 } = dados;
  
  if (!salarioBruto || salarioBruto <= 0) {
    throw new Error('Salário bruto deve ser maior que zero');
  }
  
  // Cálculos
  const descontoINSS = calcularINSS(salarioBruto);
  const baseCalculoIRRF = salarioBruto - descontoINSS;
  const descontoIRRF = calcularIRRF(baseCalculoIRRF, dependentes);
  const salarioFamilia = calcularSalarioFamilia(salarioBruto, dependentes);
  
  // Totais
  const totalProventos = salarioBruto + salarioFamilia;
  const totalDescontos = descontoINSS + descontoIRRF + outrosDescontos;
  const salarioLiquido = totalProventos - totalDescontos;
  
  return {
    tipo: 'salario_mensal',
    dados: {
      salarioBruto,
      dependentes,
      outrosDescontos
    },
    proventos: {
      salarioBruto: {
        descricao: 'Salário Bruto',
        valor: salarioBruto,
        valorFormatado: formatarMoeda(salarioBruto)
      },
      salarioFamilia: {
        descricao: 'Salário-Família',
        valor: salarioFamilia,
        valorFormatado: formatarMoeda(salarioFamilia)
      }
    },
    descontos: {
      inss: {
        descricao: 'INSS',
        valor: descontoINSS,
        valorFormatado: formatarMoeda(descontoINSS)
      },
      irrf: {
        descricao: 'IRRF',
        valor: descontoIRRF,
        valorFormatado: formatarMoeda(descontoIRRF)
      },
      outrosDescontos: {
        descricao: 'Outros Descontos',
        valor: outrosDescontos,
        valorFormatado: formatarMoeda(outrosDescontos)
      }
    },
    resumo: {
      totalProventos: {
        descricao: 'Total de Proventos',
        valor: totalProventos,
        valorFormatado: formatarMoeda(totalProventos)
      },
      totalDescontos: {
        descricao: 'Total de Descontos',
        valor: totalDescontos,
        valorFormatado: formatarMoeda(totalDescontos)
      },
      salarioLiquido: {
        descricao: 'Salário Líquido',
        valor: salarioLiquido,
        valorFormatado: formatarMoeda(salarioLiquido)
      }
    },
    observacoes: [
      'Cálculo baseado na legislação vigente de 2025',
      'Valores de INSS e IRRF calculados pelas tabelas progressivas',
      dependentes > 0 ? `Dedução de ${dependentes} dependente(s) aplicada no IRRF` : null,
      salarioFamilia > 0 ? 'Salário-família incluído nos proventos' : null
    ].filter(Boolean)
  };
}