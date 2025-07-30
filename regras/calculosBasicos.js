import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega os parâmetros legais
const parametrosLegais = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/parametros_legais.json'), 'utf-8')
);

/**
 * Calcula o desconto do INSS com base na tabela progressiva
 * @param {number} baseDeCalculo - Valor base para cálculo do INSS
 * @returns {Object} - Objeto contendo valor do desconto e detalhamento por faixa
 */
export function calcularINSS(baseDeCalculo) {
  if (!baseDeCalculo || baseDeCalculo <= 0) {
    return {
      valor: 0,
      baseCalculo: 0,
      aliquotaEfetiva: 0,
      detalhamento: []
    };
  }

  const tabela = parametrosLegais.tabela_inss;
  let valorDesconto = 0;
  let valorRestante = Math.min(baseDeCalculo, parametrosLegais.teto_inss);
  const detalhamento = [];

  for (let i = 0; i < tabela.length; i++) {
    const faixa = tabela[i];
    const limiteAnterior = i === 0 ? 0 : tabela[i - 1].limite;
    const faixaMaxima = faixa.limite - limiteAnterior;
    const valorNaFaixa = Math.min(valorRestante, faixaMaxima);

    if (valorNaFaixa > 0) {
      const descontoFaixa = valorNaFaixa * faixa.aliquota;
      valorDesconto += descontoFaixa;

      detalhamento.push({
        faixa: i + 1,
        baseCalculo: valorNaFaixa,
        aliquota: faixa.aliquota,
        desconto: descontoFaixa,
        descricao: faixa.descricao
      });

      valorRestante -= valorNaFaixa;
    }

    if (valorRestante <= 0) break;
  }

  const aliquotaEfetiva = baseDeCalculo > 0 ? valorDesconto / Math.min(baseDeCalculo, parametrosLegais.teto_inss) : 0;

  return {
    valor: Number(valorDesconto.toFixed(2)),
    baseCalculo: Math.min(baseDeCalculo, parametrosLegais.teto_inss),
    aliquotaEfetiva: Number((aliquotaEfetiva * 100).toFixed(4)),
    detalhamento
  };
}

/**
 * Calcula o desconto do Imposto de Renda Retido na Fonte
 * @param {number} baseDeCalculo - Valor base para cálculo do IRRF
 * @param {number} numDependentes - Número de dependentes
 * @param {boolean} usarDescontoSimplificado - Se deve usar desconto simplificado
 * @returns {Object} - Objeto contendo valor do desconto e detalhamento
 */
export function calcularIRRF(baseDeCalculo, numDependentes = 0, usarDescontoSimplificado = false) {
  if (!baseDeCalculo || baseDeCalculo <= 0) {
    return {
      valor: 0,
      baseCalculo: 0,
      aliquota: 0,
      deducaoDependentes: 0,
      descontoSimplificado: 0,
      baseCalculoFinal: 0
    };
  }

  const tabela = parametrosLegais.tabela_irrf;
  const deducaoDependentes = numDependentes * parametrosLegais.deducao_dependente_irrf;
  
  // Aplica dedução por dependentes
  let baseCalculoAjustada = baseDeCalculo - deducaoDependentes;
  
  // Se usar desconto simplificado, aplica o desconto
  const descontoSimplificado = usarDescontoSimplificado ? parametrosLegais.desconto_simplificado_irrf : 0;
  baseCalculoAjustada -= descontoSimplificado;

  // Se a base ficou negativa ou zero, não há imposto
  if (baseCalculoAjustada <= 0) {
    return {
      valor: 0,
      baseCalculo: baseDeCalculo,
      aliquota: 0,
      deducaoDependentes,
      descontoSimplificado,
      baseCalculoFinal: Math.max(0, baseCalculoAjustada)
    };
  }

  // Encontra a faixa correspondente
  let faixaAplicavel = null;
  for (const faixa of tabela) {
    if (baseCalculoAjustada <= faixa.limite) {
      faixaAplicavel = faixa;
      break;
    }
  }

  if (!faixaAplicavel) {
    // Se não encontrou faixa, usa a última (maior alíquota)
    faixaAplicavel = tabela[tabela.length - 1];
  }

  const impostoCalculado = (baseCalculoAjustada * faixaAplicavel.aliquota) - faixaAplicavel.deducao;
  const valorImposto = Math.max(0, impostoCalculado);

  return {
    valor: Number(valorImposto.toFixed(2)),
    baseCalculo: baseDeCalculo,
    aliquota: faixaAplicavel.aliquota,
    deducaoDependentes: Number(deducaoDependentes.toFixed(2)),
    descontoSimplificado: Number(descontoSimplificado.toFixed(2)),
    baseCalculoFinal: Number(baseCalculoAjustada.toFixed(2)),
    faixaDescricao: faixaAplicavel.descricao
  };
}

/**
 * Calcula o salário família
 * @param {number} remuneracao - Valor da remuneração
 * @param {number} numFilhos - Número de filhos até 14 anos ou inválidos
 * @returns {Object} - Objeto contendo valor do salário família
 */
export function calcularSalarioFamilia(remuneracao, numFilhos = 0) {
  const { limite_remuneracao, valor_cota } = parametrosLegais.salario_familia;
  
  if (remuneracao > limite_remuneracao || numFilhos <= 0) {
    return {
      valor: 0,
      numFilhos: 0,
      temDireito: false,
      limiteRemuneracao: limite_remuneracao
    };
  }

  const valor = numFilhos * valor_cota;

  return {
    valor: Number(valor.toFixed(2)),
    numFilhos,
    temDireito: true,
    limiteRemuneracao: limite_remuneracao,
    valorPorFilho: valor_cota
  };
}