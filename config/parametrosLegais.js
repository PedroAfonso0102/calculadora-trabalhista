/**
 * Parâmetros Legais Centralizados - 2025
 * 
 * Este arquivo contém TODAS as constantes legais utilizadas nos cálculos trabalhistas.
 * NENHUM valor legal deve ser hardcoded em outras partes do código.
 * 
 * Atualização anual: Modificar apenas este arquivo com os novos valores.
 * 
 * Fontes:
 * - Portaria Interministerial MPS/MF Nº 6/2025
 * - Tabelas de Salário Mínimo, INSS, Salário-Família e IRRF 2025
 * - Constituição Federal e CLT
 */

const PARAMETROS_LEGAIS_2025 = {
  // Valores básicos
  salarioMinimo: 1518.00,
  tetoINSS: 8157.41,
  
  // Salário Família
  salarioFamilia: {
    limiteRemuneracao: 1906.04,
    valorCota: 65.00
  },
  
  // Tabela INSS 2025 - Progressiva
  tabelaINSS: [
    { limite: 1518.00, aliquota: 0.075 },      // 7,5% até R$ 1.518,00
    { limite: 2531.00, aliquota: 0.09 },       // 9% de R$ 1.518,01 até R$ 2.531,00
    { limite: 3813.00, aliquota: 0.12 },       // 12% de R$ 2.531,01 até R$ 3.813,00
    { limite: 8157.41, aliquota: 0.14 }        // 14% de R$ 3.813,01 até R$ 8.157,41
  ],
  
  // Tabela IRRF 2025 - Progressiva
  tabelaIRRF: [
    { limite: 2428.80, aliquota: 0.00, deducao: 0.00 },        // Isento até R$ 2.428,80
    { limite: 3652.00, aliquota: 0.075, deducao: 182.16 },     // 7,5% de R$ 2.428,81 até R$ 3.652,00
    { limite: 4865.00, aliquota: 0.15, deducao: 456.66 },      // 15% de R$ 3.652,01 até R$ 4.865,00
    { limite: 6000.00, aliquota: 0.225, deducao: 821.41 },     // 22,5% de R$ 4.865,01 até R$ 6.000,00
    { limite: Infinity, aliquota: 0.275, deducao: 1121.41 }    // 27,5% acima de R$ 6.000,00
  ],
  
  // Dedução por dependente IRRF
  deducaoDependenteIRRF: 189.59,
  
  // Desconto simplificado IRRF (alternativo)
  descontoSimplificadoIRRF: 607.20,
  
  // Aviso Prévio
  avisoPrevio: {
    diasBase: 30,                               // Dias base do aviso prévio
    diasAdicionaisPorAno: 3,                    // Dias adicionais por ano trabalhado
    limiteMaximo: 90                            // Limite máximo de dias
  },
  
  // Férias - Tabela de faltas (CLT Art. 130)
  tabelaFerias: [
    { faltasAte: 5, diasDireito: 30 },         // Até 5 faltas: 30 dias
    { faltasAte: 14, diasDireito: 24 },        // De 6 a 14 faltas: 24 dias
    { faltasAte: 23, diasDireito: 18 },        // De 15 a 23 faltas: 18 dias
    { faltasAte: 32, diasDireito: 12 },        // De 24 a 32 faltas: 12 dias
    { faltasAte: Infinity, diasDireito: 0 }    // Mais de 32 faltas: perde o direito
  ],
  
  // FGTS
  fgts: {
    aliquota: 0.08,                            // 8% sobre o salário
    multaSemJustaCausa: 0.40,                  // 40% de multa
    multaAcordo: 0.20                          // 20% de multa no acordo
  },
  
  // Adicional de 1/3 de férias (Constitucional)
  tercoConstitucional: 1/3,
  
  // Proporcionalidade - Regra dos "avos"
  proporcionalidade: {
    diasMinimosFracao: 15,                     // 15 dias ou mais = 1 mês
    mesesPorAno: 12
  }
};

// Congelar o objeto para evitar modificações acidentais
Object.freeze(PARAMETROS_LEGAIS_2025);

export default PARAMETROS_LEGAIS_2025;