/**
 * Módulo de Cálculo de Férias
 * 
 * Calcula férias, terço constitucional e abono pecuniário
 * com base na legislação trabalhista.
 */

import { 
  calcularINSS, 
  calcularIRRF, 
  calcularDireitoFerias,
  formatarMoeda 
} from './regrasGerais.js';
import PARAMETROS_LEGAIS from '../../config/parametrosLegais.js';

/**
 * Calcula férias
 * @param {Object} dados - Dados para o cálculo
 * @param {number} dados.salarioBruto - Salário bruto
 * @param {number} dados.diasFerias - Dias de férias solicitados
 * @param {number} dados.faltasInjustificadas - Faltas injustificadas no período
 * @param {boolean} dados.abonoPecuniario - Se vai vender 1/3 das férias
 * @param {number} dados.dependentes - Número de dependentes
 * @returns {Object} Resultado do cálculo
 */
export function calcularFerias(dados) {
  const { 
    salarioBruto, 
    diasFerias, 
    faltasInjustificadas = 0, 
    abonoPecuniario = false, 
    dependentes = 0 
  } = dados;
  
  if (!salarioBruto || salarioBruto <= 0) {
    throw new Error('Salário bruto deve ser maior que zero');
  }
  
  if (!diasFerias || diasFerias <= 0) {
    throw new Error('Dias de férias deve ser maior que zero');
  }
  
  // Verificar direito às férias com base nas faltas
  const diasDireito = calcularDireitoFerias(faltasInjustificadas);
  
  if (diasFerias > diasDireito) {
    throw new Error(`Com ${faltasInjustificadas} faltas, o trabalhador tem direito a apenas ${diasDireito} dias de férias`);
  }
  
  // Cálculos básicos
  const valorDiarioFerias = salarioBruto / 30;
  const valorFerias = valorDiarioFerias * diasFerias;
  const tercoConstitucional = valorFerias * PARAMETROS_LEGAIS.tercoConstitucional;
  
  // Abono pecuniário (1/3 das férias vendido)
  let valorAbono = 0;
  let tercoAbono = 0;
  let diasFeriasEfetivas = diasFerias;
  
  if (abonoPecuniario) {
    const diasVendidos = Math.floor(diasFerias / 3);
    diasFeriasEfetivas = diasFerias - diasVendidos;
    valorAbono = valorDiarioFerias * diasVendidos;
    tercoAbono = valorAbono * PARAMETROS_LEGAIS.tercoConstitucional;
  }
  
  // Base de cálculo para INSS e IRRF (não incide sobre abono)
  const baseCalculoDescontos = valorFerias + tercoConstitucional;
  const descontoINSS = calcularINSS(baseCalculoDescontos);
  const baseCalculoIRRF = baseCalculoDescontos - descontoINSS;
  const descontoIRRF = calcularIRRF(baseCalculoIRRF, dependentes);
  
  // Totais
  const totalProventos = baseCalculoDescontos + valorAbono + tercoAbono;
  const totalDescontos = descontoINSS + descontoIRRF;
  const valorLiquido = totalProventos - totalDescontos;
  
  return {
    tipo: 'ferias',
    dados: {
      salarioBruto,
      diasFerias,
      faltasInjustificadas,
      abonoPecuniario,
      dependentes
    },
    direitos: {
      diasDireito: {
        descricao: 'Dias de Direito',
        valor: diasDireito,
        valorFormatado: `${diasDireito} dias`
      },
      diasSolicitados: {
        descricao: 'Dias Solicitados',
        valor: diasFerias,
        valorFormatado: `${diasFerias} dias`
      },
      diasEfetivos: {
        descricao: 'Dias Efetivos de Descanso',
        valor: diasFeriasEfetivas,
        valorFormatado: `${diasFeriasEfetivas} dias`
      }
    },
    proventos: {
      valorFerias: {
        descricao: 'Valor das Férias',
        valor: valorFerias,
        valorFormatado: formatarMoeda(valorFerias)
      },
      tercoConstitucional: {
        descricao: '1/3 Constitucional',
        valor: tercoConstitucional,
        valorFormatado: formatarMoeda(tercoConstitucional)
      },
      ...(abonoPecuniario && {
        valorAbono: {
          descricao: 'Abono Pecuniário',
          valor: valorAbono,
          valorFormatado: formatarMoeda(valorAbono)
        },
        tercoAbono: {
          descricao: '1/3 do Abono',
          valor: tercoAbono,
          valorFormatado: formatarMoeda(tercoAbono)
        }
      })
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
      valorLiquido: {
        descricao: 'Valor Líquido a Receber',
        valor: valorLiquido,
        valorFormatado: formatarMoeda(valorLiquido)
      }
    },
    observacoes: [
      'Cálculo baseado na legislação vigente de 2025',
      `Direito a ${diasDireito} dias com base em ${faltasInjustificadas} faltas injustificadas`,
      abonoPecuniario ? 'Abono pecuniário (1/3 vendido) não sofre descontos de INSS e IRRF' : null,
      'INSS e IRRF calculados apenas sobre férias + 1/3 constitucional',
      dependentes > 0 ? `Dedução de ${dependentes} dependente(s) aplicada no IRRF` : null
    ].filter(Boolean)
  };
}