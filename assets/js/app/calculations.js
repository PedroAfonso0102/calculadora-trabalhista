/**
 * Funções Puras de Cálculo
 *
 * Este arquivo contém toda a lógica de negócio para as calculadoras.
 * Estas funções são puras: elas recebem dados como entrada e retornam um
 * resultado, sem qualquer interação com o DOM.
 */

import {
    INSS_TABLE,
    IRRF_TABLE,
    IRRF_DEPENDENT_DEDUCTION,
    INSS_CEILING,
    SALARIO_FAMILIA_LIMIT,
    SALARIO_FAMILIA_VALUE,
    SALARIO_MINIMO_2025,
    BASES_DE_CALCULO,
    PARAMETROS_2025
} from './config.js';
import { formatCurrency, formatCurrencyFromInput } from './utils.js';

// Re-exporta para estar disponível a partir deste módulo
export { formatCurrencyFromInput };

/**
 * Calcula o salário líquido de forma simplificada para o simulador.
 * @param {number} salarioBruto - O valor do salário bruto.
 * @param {number} dependentes - Número de dependentes.
 * @param {number} outrosDescontos - Valor de outros descontos.
 * @returns {object} - Objeto com o resultado do salário líquido.
 */
export function calcularSalarioLiquidoSimples(salarioBruto, dependentes = 0, outrosDescontos = 0) {
    if (!salarioBruto || salarioBruto <= 0) {
        return { salarioLiquido: 0 };
    }
    const inssResult = calcularContribuicaoINSS(salarioBruto);
    const descontoINSS = inssResult.value;
    const baseIRRF = salarioBruto - descontoINSS;
    const irrfResult = calcularContribuicaoIRRF(baseIRRF, dependentes);
    const descontoIRRF = irrfResult.value;
    const totalDescontos = descontoINSS + descontoIRRF + outrosDescontos;
    const salarioLiquido = salarioBruto - totalDescontos;
    return {
        salarioLiquido: arredondar(Math.max(0, salarioLiquido))
    };
}

/**
 * Arredonda um valor monetário para 4 casas decimais para precisão.
 * @param {number} value - O número a ser arredondado.
 * @returns {number} - O número arredondado.
 */
function arredondar(value) {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.round(value * 10000) / 10000;
}

/**
 * Calcula a remuneração base para cálculos (DRY principle).
 * Centraliza a lógica para calcular o total da remuneração base
 * usada em múltiplas calculadoras (férias, 13º, rescisão, etc.).
 * @param {object} state - O estado da calculadora contendo salário e valores adicionais.
 * @returns {number} - A remuneração base calculada.
 */
export function calcularRemuneracaoBase(state) {
    const { 
        salarioBruto = 0,
        mediaHorasExtras = 0, 
        mediaAdicionalNoturno = 0, 
        periculosidade = false,
        insalubridadeGrau = '0',
        insalubridadeBase = BASES_DE_CALCULO.SALARIO_MINIMO
    } = state;

    const adicionalRisco = calcularAdicionaisRisco(
        salarioBruto, 
        periculosidade, 
        insalubridadeGrau, 
        insalubridadeBase
    ).total;
    
    return arredondar(salarioBruto + mediaHorasExtras + mediaAdicionalNoturno + adicionalRisco);
}

/**
 * Calcula a contribuição do INSS (Previdência Social) com base em um salário.
 * O cálculo é progressivo, baseado em diferentes faixas.
 * @param {number} base - O salário base para o cálculo.
 * @returns {{value: number, details: Array<object>}} - Objeto com o valor total do INSS e os detalhes do cálculo.
 */
export function calcularContribuicaoINSS(base) {
    let inss = 0;
    let baseRestante = base;
    let limiteAnterior = 0;
    const detalhes = [];

    for (const faixa of INSS_TABLE) {
        if (base > limiteAnterior) {
            const valorTributavelNaFase = Math.min(baseRestante, faixa.limit - limiteAnterior);
            if (valorTributavelNaFase <= 0) break;

            const inssDaFaixa = valorTributavelNaFase * faixa.rate;
            inss += inssDaFaixa;

            detalhes.push({
                range: `Até ${formatCurrency(faixa.limit)}`,
                base: formatCurrency(valorTributavelNaFase),
                rate: `${(faixa.rate * 100).toFixed(1)}%`,
                value: formatCurrency(inssDaFaixa)
            });

            baseRestante -= valorTributavelNaFase;
            if (baseRestante <= 0) break;
        }
        limiteAnterior = faixa.limit;
    }
    // A contribuição do INSS é limitada a um teto.
    return { value: arredondar(Math.min(inss, INSS_CEILING)), details: detalhes, baseOriginal: base };
}

/**
 * Calcula o IRRF (Imposto de Renda Retido na Fonte) com base em um salário.
 * @param {number} base - O salário base para o cálculo (já deduzido do INSS).
 * @param {number} numDependentes - O número de dependentes para dedução.
 * @returns {{value: number, details: object}} - Objeto com o valor total do IRRF e os detalhes do cálculo.
 */
export function calcularContribuicaoIRRF(base, numDependentes = 0) {
    const deducaoDependentes = numDependentes * IRRF_DEPENDENT_DEDUCTION;
    const baseIRRF = base - deducaoDependentes;
    let irrf = 0;
    let detalhes = {};

    for (const faixa of IRRF_TABLE) {
        if (baseIRRF <= faixa.limit) {
            irrf = Math.max(0, (baseIRRF * faixa.rate) - faixa.deduction);
            detalhes = {
                base: formatCurrency(base),
                dependentsDeduction: `-${formatCurrency(deducaoDependentes)}`,
                irrfBase: formatCurrency(baseIRRF),
                rate: `${(faixa.rate * 100).toFixed(2)}%`,
                deduction: `-${formatCurrency(faixa.deduction)}`,
                value: formatCurrency(irrf)
            };
            break;
        }
    }
    return { value: arredondar(irrf), details: detalhes, baseOriginal: base };
}

/**
 * Calcula o benefício do Salário Família.
 * @param {number} salarioBruto - O salário bruto.
 * @param {number} numFilhos - O número de filhos elegíveis.
 * @returns {number} - O valor total do benefício.
 */
export function calcularSalarioFamilia(salarioBruto, numFilhos) {
    if (salarioBruto <= SALARIO_FAMILIA_LIMIT && numFilhos > 0) {
        return arredondar(numFilhos * SALARIO_FAMILIA_VALUE);
    }
    return 0;
}

/**
 * Calcula um valor proporcional com base nos meses.
 * @param {number} valorBase - O valor base para um período completo de 12 meses.
 * @param {number} meses - O número de meses para o qual calcular a proporção.
 * @returns {number} - O valor proporcional.
 */
export function calcularProporcional(valorBase, meses) {
  if (!valorBase || valorBase <= 0 || !meses || meses <= 0) return 0;
  return arredondar((valorBase / 12) * meses);
}

/**
 * Calcula os adicionais de periculosidade e insalubridade.
 * Retorna os valores individuais e o bônus efetivo total (o maior dos dois).
 * @param {number} salarioBruto - O salário bruto.
 * @param {boolean} periculosidade - Se o adicional de periculosidade é aplicável.
 * @param {string|number} insalubridadeGrau - O nível de insalubridade (0, 10, 20, 40).
 * @param {string} insalubridadeBase - A base para o cálculo da insalubridade ('salario_minimo' ou 'salario_bruto').
 * @returns {{periculosidade: number, insalubridade: number, total: number}}
 */
export function calcularAdicionaisRisco(salarioBruto, periculosidade, insalubridadeGrau, insalubridadeBase) {
    const valorPericulosidade = periculosidade ? salarioBruto * PARAMETROS_2025.ADICIONAL_PERICULOSIDADE : 0;

    let valorInsalubridade = 0;
    if (insalubridadeGrau > 0) {
        const baseCalculo = insalubridadeBase === BASES_DE_CALCULO.SALARIO_MINIMO ? SALARIO_MINIMO_2025 : salarioBruto;
        valorInsalubridade = baseCalculo * (parseFloat(insalubridadeGrau) / 100);
    }

    return {
        periculosidade: arredondar(valorPericulosidade),
        insalubridade: arredondar(valorInsalubridade),
        total: arredondar(Math.max(valorPericulosidade, valorInsalubridade))
    };
}

/**
 * Calcula descontos detalhados com base no estado da calculadora.
 * @param {object} state - A fatia do estado da aplicação para a calculadora específica.
 * @param {number} salarioBruto - O salário bruto a ser usado como base para cálculos percentuais.
 * @returns {object} - Um objeto contendo todos os descontos calculados e seu total.
 */
export function calcularDescontosDetalhados(state, salarioBruto) {
    const {
        descontoVt = 0,
        descontoVr = 0,
        descontoSaude = 0,
        descontoAdiantamentos = 0
    } = state;

    // O desconto do VT é limitado a 6% do salário bruto.
    const valorDescontoVT = Math.min(salarioBruto * 0.06, descontoVt);

    const discounts = {
        valeTransporte: valorDescontoVT,
        valeRefeicao: descontoVr,
        planoSaude: descontoSaude,
        adiantamentos: descontoAdiantamentos,
    };

    const total = Object.values(discounts).reduce((sum, val) => sum + val, 0);

    return { ...discounts, total: arredondar(total) };
}

/**
 * Calcula o pagamento de férias com base no estado de férias.
 * @param {object} estadoFerias - A fatia específica de férias do estado da aplicação.
 * @returns {object} - Um objeto contendo todos os detalhes calculados do pagamento de férias.
 */
export function calcularFerias(estadoFerias) {
    const {
        salarioBruto,
        diasFerias,
        dependentes,
        abonoPecuniario,
        adiantarDecimo
    } = estadoFerias;

    const baseDeCalculo = calcularRemuneracaoBase(estadoFerias);
    const valorFerias = (baseDeCalculo / 30) * diasFerias;
    const tercoConstitucional = valorFerias / 3;

    let valorAbono = 0;
    let tercoAbono = 0;
    if (abonoPecuniario) {
        const diasVendidos = diasFerias / 3;
        valorAbono = (baseDeCalculo / 30) * diasVendidos;
        tercoAbono = valorAbono / 3;
    }

    const adiantamento13 = adiantarDecimo ? calcularProporcional(salarioBruto, 6) : 0;
    const totalProventos = valorFerias + tercoConstitucional + valorAbono + tercoAbono + adiantamento13;

    const baseINSS = valorFerias + tercoConstitucional;
    const inssResult = calcularContribuicaoINSS(baseINSS);
    const descontoINSS = inssResult.value;

    const baseIRRF = baseINSS - descontoINSS;
    const irrfResult = calcularContribuicaoIRRF(baseIRRF, dependentes);
    const descontoIRRF = irrfResult.value;

    const totalDescontos = descontoINSS + descontoIRRF;
    const valorLiquido = totalProventos - totalDescontos;

    return {
        salarioBruto: arredondar(salarioBruto),
        baseDeCalculo: arredondar(baseDeCalculo),
        valorFerias: arredondar(valorFerias),
        tercoConstitucional: arredondar(tercoConstitucional),
        valorAbono: arredondar(valorAbono),
        tercoAbono: arredondar(tercoAbono),
        adiantamento13: arredondar(adiantamento13),
        totalProventos: arredondar(totalProventos),
        descontoINSS: inssResult,
        descontoIRRF: irrfResult,
        totalDescontos: arredondar(totalDescontos),
        valorLiquido: arredondar(valorLiquido),
        venderFerias: abonoPecuniario,
        adiantarDecimo,
        diasFerias
    };
}

/**
 * Calcula o 13º salário com base no estado do 13º salário.
 * @param {object} estadoDecimo - A fatia específica do 13º salário do estado da aplicação.
 * @returns {object} - Um objeto contendo todos os detalhes calculados do 13º salário.
 */
export function calcularDecimoTerceiro(estadoDecimo) {
    const {
        salarioBruto,
        mesesTrabalhados,
        dependentes,
        adiantamentoRecebido
    } = estadoDecimo;

    const baseDeCalculo = calcularRemuneracaoBase(estadoDecimo);
    const valorBrutoDecimo = calcularProporcional(baseDeCalculo, mesesTrabalhados);

    const inssResult = calcularContribuicaoINSS(valorBrutoDecimo);
    const descontoINSS = inssResult.value;

    const baseIRRF = valorBrutoDecimo - descontoINSS;
    const irrfResult = calcularContribuicaoIRRF(baseIRRF, dependentes);
    const descontoIRRF = irrfResult.value;

    const totalDescontos = descontoINSS + descontoIRRF;
    const valorLiquidoDecimo = valorBrutoDecimo - totalDescontos;
    const valorAReceber = valorLiquidoDecimo - adiantamentoRecebido;

    return {
        salarioBruto,
        baseDeCalculo,
        mesesTrabalhados,
        valorBrutoDecimo,
        descontoINSS: inssResult,
        descontoIRRF: irrfResult,
        totalDescontos,
        valorLiquidoDecimo,
        adiantamentoRecebido,
        valorAReceber: Math.max(0, valorAReceber)
    };
}

/**
 * Calcula o salário líquido mensal com base no estado do salário líquido.
 * @param {object} estadoLiquido - A fatia específica do salário líquido do estado da aplicação.
 * @returns {object} - Um objeto contendo todos os detalhes calculados do salário líquido.
 */
export function calcularSalarioLiquido(estadoLiquido) {
    const {
        salarioBruto,
        horasExtras,
        dependentes,
        periculosidade,
        insalubridadeGrau,
        insalubridadeBase,
        horasNoturnas,
        cargaHorariaMensal,
        filhosSalarioFamilia
    } = estadoLiquido;

    const adicionaisRisco = calcularAdicionaisRisco(salarioBruto, periculosidade, insalubridadeGrau, insalubridadeBase);
    const adicionalRisco = adicionaisRisco.total;

    const salarioBaseParaVariaveis = salarioBruto + adicionalRisco;
    let adicionalNoturno = 0;
    if (horasNoturnas > 0 && cargaHorariaMensal > 0) {
        const valorHoraNormal = salarioBaseParaVariaveis / cargaHorariaMensal;
        adicionalNoturno = (valorHoraNormal * 0.20) * horasNoturnas;
    }

    const salarioBrutoTotal = salarioBruto + horasExtras + adicionalRisco + adicionalNoturno;
    const salarioFamilia = calcularSalarioFamilia(salarioBrutoTotal, filhosSalarioFamilia);

    const inssResult = calcularContribuicaoINSS(salarioBrutoTotal);
    const descontoINSS = inssResult.value;

    const baseIRRF = salarioBrutoTotal - descontoINSS;
    const irrfResult = calcularContribuicaoIRRF(baseIRRF, dependentes);
    const descontoIRRF = irrfResult.value;

    const detailedDiscounts = calcularDescontosDetalhados(estadoLiquido, salarioBruto);

    const totalProventos = salarioBrutoTotal + salarioFamilia;
    const totalDescontos = descontoINSS + descontoIRRF + detailedDiscounts.total;
    const salarioLiquido = totalProventos - totalDescontos;

    return {
        salarioBruto: arredondar(salarioBruto),
        horasExtras: arredondar(horasExtras),
        adicionalPericulosidade: arredondar(adicionaisRisco.periculosidade),
        adicionalInsalubridade: arredondar(adicionaisRisco.insalubridade),
        adicionalNoturno: arredondar(adicionalNoturno),
        salarioBrutoTotal: arredondar(salarioBrutoTotal),
        salarioFamilia: arredondar(salarioFamilia),
        descontoINSS: inssResult,
        descontoIRRF: irrfResult,
        descontoVT: arredondar(detailedDiscounts.valeTransporte),
        descontoVR: arredondar(detailedDiscounts.valeRefeicao),
        descontoSaude: arredondar(detailedDiscounts.planoSaude),
        descontoAdiantamentos: arredondar(detailedDiscounts.adiantamentos),
        totalProventos: arredondar(totalProventos),
        totalDescontos: arredondar(totalDescontos),
        salarioLiquido: arredondar(salarioLiquido)
    };
}

/**
 * Calcula simulações de depósito e saque do FGTS.
 * @param {object} estadoFgts - A fatia específica do FGTS do estado da aplicação.
 * @returns {object} - Um objeto contendo todos os detalhes calculados do FGTS.
 */
export function calcularFGTS(estadoFgts) {
    const { salarioBruto, saldoTotal, opcaoSaque } = estadoFgts;
    const memoriaCalculo = {};

    const depositoMensal = salarioBruto * 0.08;
    memoriaCalculo['Depósito Mensal'] = `Salário Bruto (${formatCurrency(salarioBruto)}) * 8% = ${formatCurrency(depositoMensal)}`;

    let valorSaque = 0;
    memoriaCalculo['Simulação de Saque'] = `Opção selecionada: ${opcaoSaque === 'rescisao' ? 'Saque-Rescisão' : 'Saque-Aniversário'}`;
    if (saldoTotal > 0 && opcaoSaque) {
        if (opcaoSaque === 'rescisao') {
            valorSaque = saldoTotal;
            memoriaCalculo['Valor do Saque'] = `Saque integral do saldo de ${formatCurrency(saldoTotal)}`;
        } else if (opcaoSaque === 'aniversario') {
            let faixaDetalhe = '';
            if (saldoTotal <= 500) {
                valorSaque = saldoTotal * 0.50;
                faixaDetalhe = `${formatCurrency(saldoTotal)} * 50% = ${formatCurrency(valorSaque)}`;
            } else if (saldoTotal <= 1000) {
                valorSaque = saldoTotal * 0.40 + 50;
                faixaDetalhe = `(${formatCurrency(saldoTotal)} * 40%) + R$ 50,00 = ${formatCurrency(valorSaque)}`;
            } else if (saldoTotal <= 5000) {
                valorSaque = saldoTotal * 0.30 + 150;
                faixaDetalhe = `(${formatCurrency(saldoTotal)} * 30%) + R$ 150,00 = ${formatCurrency(valorSaque)}`;
            } else if (saldoTotal <= 10000) {
                valorSaque = saldoTotal * 0.20 + 650;
                faixaDetalhe = `(${formatCurrency(saldoTotal)} * 20%) + R$ 650,00 = ${formatCurrency(valorSaque)}`;
            } else if (saldoTotal <= 15000) {
                valorSaque = saldoTotal * 0.15 + 1150;
                faixaDetalhe = `(${formatCurrency(saldoTotal)} * 15%) + R$ 1.150,00 = ${formatCurrency(valorSaque)}`;
            } else if (saldoTotal <= 20000) {
                valorSaque = saldoTotal * 0.10 + 1900;
                faixaDetalhe = `(${formatCurrency(saldoTotal)} * 10%) + R$ 1.900,00 = ${formatCurrency(valorSaque)}`;
            } else {
                valorSaque = saldoTotal * 0.05 + 2900;
                faixaDetalhe = `(${formatCurrency(saldoTotal)} * 5%) + R$ 2.900,00 = ${formatCurrency(valorSaque)}`;
            }
            memoriaCalculo['Cálculo Saque-Aniversário'] = faixaDetalhe;
        }
    }

    return {
        salarioBruto,
        depositoMensal: arredondar(depositoMensal),
        saldoTotal,
        opcaoSaque,
        valorSaque: arredondar(valorSaque),
        memoriaCalculo
    };
}

export function calcularPISPASEP(estadoPisPasep, legalTexts) {
    const { salarioMedio, mesesTrabalhados, dataInscricao } = estadoPisPasep;

    const pisConstants = legalTexts.pisPasep.constants;
    const SALARIO_MINIMO_VIGENTE = pisConstants.SALARIO_MINIMO_VIGENTE;
    const MAX_SALARIO_PIS = SALARIO_MINIMO_VIGENTE * pisConstants.MAX_MULTIPLIER_SALARIO;
    const MIN_ANOS_PIS = pisConstants.MIN_ANOS_INSCRICAO;

    const anoAtual = new Date().getFullYear();
    const anoInscricao = new Date(dataInscricao).getFullYear();
    const anosDeInscricao = anoAtual - anoInscricao;

    let elegivel = true;
    let mensagem = 'Elegível ao PIS/PASEP';
    let valorAbono = 0;
    const memoriaCalculo = {};

    memoriaCalculo['Critério 1: Anos de Inscrição'] = `Ano atual (${anoAtual}) - Ano de inscrição (${anoInscricao || 'Inválido'}) = ${!isNaN(anosDeInscricao) ? anosDeInscricao : 'N/A'} anos. (Mínimo: ${MIN_ANOS_PIS} anos)`;
    if (!dataInscricao || isNaN(anoInscricao)) {
        elegivel = false;
        mensagem = 'Data de inscrição inválida.';
        memoriaCalculo['Resultado'] = `Não elegível. ${mensagem}`;
    } else if (anosDeInscricao < MIN_ANOS_PIS) {
        elegivel = false;
        mensagem = `Não elegível: Menos de ${MIN_ANOS_PIS} anos de inscrição no PIS/PASEP.`;
        memoriaCalculo['Resultado'] = mensagem;
    }

    memoriaCalculo['Critério 2: Média Salarial'] = `Salário médio informado (${formatCurrency(salarioMedio)}) deve ser menor que ${formatCurrency(MAX_SALARIO_PIS)}.`;
    if (elegivel && salarioMedio > MAX_SALARIO_PIS) {
        elegivel = false;
        mensagem = `Não elegível: Salário médio acima do limite de ${formatCurrency(MAX_SALARIO_PIS)}.`;
        memoriaCalculo['Resultado'] = mensagem;
    }

    memoriaCalculo['Critério 3: Meses Trabalhados'] = `Meses trabalhados no ano-base: ${mesesTrabalhados}. (Mínimo: 1 mês)`;
    if (elegivel && mesesTrabalhados < 1) {
        elegivel = false;
        mensagem = 'Não elegível: Mínimo de 1 mês trabalhado no ano-base.';
        memoriaCalculo['Resultado'] = mensagem;
    }

    if (elegivel) {
        const valorPorMes = SALARIO_MINIMO_VIGENTE / 12;
        valorAbono = valorPorMes * mesesTrabalhados;
        mensagem = 'Cálculo realizado com sucesso.';
        memoriaCalculo['Cálculo do Abono'] = `(${formatCurrency(SALARIO_MINIMO_VIGENTE)} / 12 meses) * ${mesesTrabalhados} meses trabalhados = ${formatCurrency(valorAbono)}`;
        memoriaCalculo['Resultado'] = `Elegível para receber ${formatCurrency(valorAbono)}.`;
    }

    return {
        valorAbono: arredondar(valorAbono),
        elegivel,
        mensagem,
        memoriaCalculo
    };
}

export function calcularSeguroDesemprego(estadoSeguroDesemprego, legalTexts) {
    const { salario1, salario2, salario3, mesesTrabalhados, numSolicitacoes } = estadoSeguroDesemprego;

    const sdData = legalTexts.seguroDesemprego;
    const SALARIO_MINIMO_VIGENTE = sdData.constants.SALARIO_MINIMO_VIGENTE;
    const TETO_SEGURO_DESEMPREGO = sdData.constants.TETO_SEGURO_DESEMPREGO;
    const TABELA_VALORES = sdData.tables.valores_parcelas;
    const TABELA_PARCELAS = sdData.tables.numero_parcelas;

    let numeroParcelas = 0;
    let valorPorParcela = 0;
    let elegivel = true;
    let mensagem = 'Elegível ao Seguro-Desemprego.';
    const memoriaCalculo = {};

    const mediaSalarial = (salario1 + salario2 + salario3) / 3;
    memoriaCalculo['Média Salarial'] = `(${formatCurrency(salario1)} + ${formatCurrency(salario2)} + ${formatCurrency(salario3)}) / 3 = ${formatCurrency(mediaSalarial)}`;

    const solicitacaoAtual = (numSolicitacoes || 0) + 1;
    const regraParcelas = TABELA_PARCELAS.find(regra =>
        regra.solicitacao === solicitacaoAtual &&
        mesesTrabalhados >= regra.meses_trabalhados.min &&
        mesesTrabalhados <= regra.meses_trabalhados.max
    );

    memoriaCalculo['Análise de Elegibilidade'] = `Solicitação nº: ${solicitacaoAtual}. Meses trabalhados: ${mesesTrabalhados}.`;
    if (regraParcelas) {
        numeroParcelas = regraParcelas.parcelas;
        memoriaCalculo['Número de Parcelas'] = `Com base nas regras, você tem direito a ${numeroParcelas} parcelas.`;
    } else {
        elegivel = false;
        mensagem = `Não elegível: Tempo de trabalho (${mesesTrabalhados} meses) ou número de solicitações (${solicitacaoAtual}ª) não atende aos critérios para o Seguro-Desemprego.`;
        memoriaCalculo['Resultado'] = mensagem;
        return { numeroParcelas: 0, valorPorParcela: 0, elegivel, mensagem, memoriaCalculo };
    }

    memoriaCalculo['Cálculo do Valor da Parcela'] = `Analisando a média salarial de ${formatCurrency(mediaSalarial)}...`;
    if (mediaSalarial <= TABELA_VALORES[0].faixa.max) {
        valorPorParcela = mediaSalarial * TABELA_VALORES[0].percentual;
        memoriaCalculo['Detalhe do Cálculo'] = `Faixa 1: ${formatCurrency(mediaSalarial)} * ${TABELA_VALORES[0].percentual * 100}% = ${formatCurrency(valorPorParcela)}`;
    } else if (mediaSalarial <= TABELA_VALORES[1].faixa.max) {
        const valorFaixa1 = TABELA_VALORES[0].faixa.max * TABELA_VALORES[0].percentual;
        const valorExcedente = (mediaSalarial - TABELA_VALORES[0].faixa.max) * TABELA_VALORES[1].percentual;
        valorPorParcela = valorFaixa1 + valorExcedente;
        memoriaCalculo['Detalhe do Cálculo'] = `Faixa 2: (${formatCurrency(valorFaixa1)}) + ((${formatCurrency(mediaSalarial)} - ${formatCurrency(TABELA_VALORES[0].faixa.max)}) * ${TABELA_VALORES[1].percentual * 100}%) = ${formatCurrency(valorPorParcela)}`;
    } else {
        valorPorParcela = TETO_SEGURO_DESEMPREGO;
        memoriaCalculo['Detalhe do Cálculo'] = `Média salarial (${formatCurrency(mediaSalarial)}) acima da Faixa 2, aplicando o teto de ${formatCurrency(TETO_SEGURO_DESEMPREGO)}.`;
    }

    valorPorParcela = Math.max(SALARIO_MINIMO_VIGENTE, Math.min(valorPorParcela, TETO_SEGURO_DESEMPREGO));
    memoriaCalculo['Ajuste Final'] = `Valor da parcela ajustado para estar entre o salário mínimo (${formatCurrency(SALARIO_MINIMO_VIGENTE)}) e o teto (${formatCurrency(TETO_SEGURO_DESEMPREGO)}). Valor final: ${formatCurrency(valorPorParcela)}.`;
    mensagem = `Elegível. Você tem direito a ${numeroParcelas} parcelas de ${formatCurrency(valorPorParcela)}.`;

    return {
        numeroParcelas,
        valorPorParcela: arredondar(valorPorParcela),
        mediaSalarial,
        elegivel,
        mensagem,
        memoriaCalculo
    };
}

export function calcularHorasExtras(estadoHorasExtras, legalTexts) {
    const { salarioBase, horasContratuais, horasExtras50, horasExtras100, horasNoturnas } = estadoHorasExtras;

    const heData = legalTexts.horasExtras;
    const PERCENTUAL_HE_50 = heData.constants.PERCENTUAL_HE_50;
    const PERCENTUAL_HE_100 = heData.constants.PERCENTUAL_HE_100;
    const PERCENTUAL_ADICIONAL_NOTURNO = heData.constants.PERCENTUAL_ADICIONAL_NOTURNO;
    const memoriaCalculo = {};

    if (horasContratuais <= 0) {
        const mensagem = "Horas contratuais devem ser maior que zero.";
        memoriaCalculo['Erro'] = mensagem;
        return {
            totalValorHE50: 0,
            totalValorHE100: 0,
            totalValorAdicionalNoturno: 0,
            totalGeralAdicionais: 0,
            mensagem,
            memoriaCalculo
        };
    }

    const valorHoraNormal = salarioBase / horasContratuais;
    memoriaCalculo['Valor da Hora Normal'] = `${formatCurrency(salarioBase)} / ${horasContratuais}h = ${formatCurrency(valorHoraNormal)}/h`;

    const valorHE50 = valorHoraNormal * (1 + PERCENTUAL_HE_50);
    const totalValorHE50 = horasExtras50 * valorHE50;
    memoriaCalculo['Cálculo Horas Extras 50%'] = `${horasExtras50}h * (${formatCurrency(valorHoraNormal)} * ${1 + PERCENTUAL_HE_50}) = ${formatCurrency(totalValorHE50)}`;

    const valorHE100 = valorHoraNormal * (1 + PERCENTUAL_HE_100);
    const totalValorHE100 = horasExtras100 * valorHE100;
    memoriaCalculo['Cálculo Horas Extras 100%'] = `${horasExtras100}h * (${formatCurrency(valorHoraNormal)} * ${1 + PERCENTUAL_HE_100}) = ${formatCurrency(totalValorHE100)}`;

    const valorAdicionalNoturnoHora = valorHoraNormal * PERCENTUAL_ADICIONAL_NOTURNO;
    const totalValorAdicionalNoturno = horasNoturnas * valorAdicionalNoturnoHora;
    memoriaCalculo['Cálculo Adicional Noturno'] = `${horasNoturnas}h * (${formatCurrency(valorHoraNormal)} * ${PERCENTUAL_ADICIONAL_NOTURNO * 100}%) = ${formatCurrency(totalValorAdicionalNoturno)}`;

    const totalGeralAdicionais = totalValorHE50 + totalValorHE100 + totalValorAdicionalNoturno;
    memoriaCalculo['Total Geral'] = `${formatCurrency(totalValorHE50)} (HE 50%) + ${formatCurrency(totalValorHE100)} (HE 100%) + ${formatCurrency(totalValorAdicionalNoturno)} (Ad. Noturno) = ${formatCurrency(totalGeralAdicionais)}`;

    return {
        salarioBase,
        horasContratuais,
        horasExtras50,
        horasExtras100,
        horasNoturnas,
        valorHoraNormal: arredondar(valorHoraNormal),
        totalValorHE50: arredondar(totalValorHE50),
        totalValorHE100: arredondar(totalValorHE100),
        totalValorAdicionalNoturno: arredondar(totalValorAdicionalNoturno),
        totalGeralAdicionais: arredondar(totalGeralAdicionais),
        mensagem: `Cálculo de Horas Extras e Adicionais.`,
        memoriaCalculo
    };
}

export function calcularAliquotaINSS(estadoInss, legalTexts) {
    const { salarioBruto } = estadoInss;
    const inssData = legalTexts.inss;
    const TABELA_INSS = inssData.tables.aliquotas_progressivas;
    const TETO_CONTRIBUICAO_INSS_VALOR_REAL = inssData.constants.TETO_CONTRIBUICAO_INSS_VALOR_REAL;
    const memoriaCalculo = {};

    let contribuicaoINSS = 0;
    let aliquotaEfetiva = 0;

    memoriaCalculo['Salário Bruto Informado'] = formatCurrency(salarioBruto);

    if (salarioBruto <= 0) {
        const mensagem = "Salário bruto deve ser maior que zero.";
        memoriaCalculo['Erro'] = mensagem;
        return { contribuicaoINSS: 0, aliquotaEfetiva: 0, mensagem, memoriaCalculo };
    }

    if (salarioBruto > TABELA_INSS[TABELA_INSS.length - 1].faixa.max) {
        contribuicaoINSS = TETO_CONTRIBUICAO_INSS_VALOR_REAL;
        memoriaCalculo['Cálculo'] = `Salário bruto ultrapassa o teto. Contribuição fixada no valor máximo de ${formatCurrency(contribuicaoINSS)}.`;
    } else {
        let faixaEncontrada = null;
        for (const faixa of TABELA_INSS) {
            if (salarioBruto >= faixa.faixa.min && salarioBruto <= faixa.faixa.max) {
                faixaEncontrada = faixa;
                break;
            }
        }

        if (faixaEncontrada) {
            contribuicaoINSS = (salarioBruto * faixaEncontrada.aliquota) - faixaEncontrada.parcela_deduzir;
            memoriaCalculo['Faixa de Contribuição'] = `De ${formatCurrency(faixaEncontrada.faixa.min)} a ${formatCurrency(faixaEncontrada.faixa.max)}.`;
            memoriaCalculo['Cálculo'] = `(${formatCurrency(salarioBruto)} * ${faixaEncontrada.aliquota * 100}%) - ${formatCurrency(faixaEncontrada.parcela_deduzir)} = ${formatCurrency(contribuicaoINSS)}`;
        }
    }

    if (salarioBruto > 0) {
        aliquotaEfetiva = (contribuicaoINSS / salarioBruto) * 100;
        memoriaCalculo['Alíquota Efetiva'] = `(${formatCurrency(contribuicaoINSS)} / ${formatCurrency(salarioBruto)}) = ${aliquotaEfetiva.toFixed(2)}%`;
    }

    return {
        salarioBruto,
        contribuicaoINSS: arredondar(contribuicaoINSS),
        aliquotaEfetiva: aliquotaEfetiva,
        mensagem: `Contribuição INSS calculada com base no salário de ${formatCurrency(salarioBruto)}.`,
        memoriaCalculo
    };
}

export function calcularValeTransporte(estadoValeTransporte, legalTexts) {
    const { salarioBruto, custoDiario, diasTrabalho } = estadoValeTransporte;
    const vtConstants = legalTexts.valeTransporte.constants;
    const memoriaCalculo = {};

    const dias = diasTrabalho || vtConstants.DIAS_UTEIS_PADRAO;

    if (salarioBruto <= 0 || custoDiario <= 0 || dias <= 0) {
        const mensagem = "Por favor, preencha todos os campos com valores positivos.";
        memoriaCalculo['Erro'] = mensagem;
        return {
            custoMensalTotal: 0,
            descontoMaximoSalario: 0,
            descontoRealEmpregado: 0,
            valorBeneficioEmpregador: 0,
            mensagem,
            memoriaCalculo
        };
    }

    const custoMensalTotal = custoDiario * dias;
    memoriaCalculo['Custo Total do Transporte'] = `${formatCurrency(custoDiario)}/dia * ${dias} dias = ${formatCurrency(custoMensalTotal)}`;

    const descontoMaximoSalario = salarioBruto * vtConstants.PERCENTUAL_DESCONTO_SALARIO;
    memoriaCalculo['Limite de Desconto (6% do Salário)'] = `${formatCurrency(salarioBruto)} * 6% = ${formatCurrency(descontoMaximoSalario)}`;

    const descontoRealEmpregado = Math.min(custoMensalTotal, descontoMaximoSalario);
    memoriaCalculo['Desconto do Empregado'] = `O menor valor entre o Custo Total (${formatCurrency(custoMensalTotal)}) e o Limite de 6% (${formatCurrency(descontoMaximoSalario)}) = ${formatCurrency(descontoRealEmpregado)}`;

    const valorBeneficioEmpregador = Math.max(0, custoMensalTotal - descontoRealEmpregado);
    memoriaCalculo['Benefício (Custeado pelo Empregador)'] = `Custo Total (${formatCurrency(custoMensalTotal)}) - Desconto do Empregado (${formatCurrency(descontoRealEmpregado)}) = ${formatCurrency(valorBeneficioEmpregador)}`;

    return {
        salarioBruto,
        custoDiario,
        diasTrabalho: dias,
        custoMensalTotal: arredondar(custoMensalTotal),
        descontoMaximoSalario: arredondar(descontoMaximoSalario),
        descontoRealEmpregado: arredondar(descontoRealEmpregado),
        valorBeneficioEmpregador: arredondar(valorBeneficioEmpregado),
        mensagem: "Cálculo do Vale-Transporte realizado com sucesso.",
        memoriaCalculo
    };
}

export function calcularIRPF(estadoIrpf, legalTexts) {
    const { rendaAnual, dependentes, outrasDeducoes, impostoRetido } = estadoIrpf;
    const irpfData = legalTexts.irpf;
    const TABELA_IRPF = irpfData.tables.tabela_anual_2025;
    const DEDUCAO_DEPENDENTE = irpfData.constants.DEDUCAO_POR_DEPENDENTE_ANUAL;
    const memoriaCalculo = {};

    memoriaCalculo['Rendimentos Tributáveis (Anual)'] = formatCurrency(rendaAnual);

    if (rendaAnual <= 0) {
        const mensagem = "Informe a renda anual para calcular.";
        memoriaCalculo['Erro'] = mensagem;
        return {
            impostoDevido: 0,
            ajusteFinal: 0,
            tipoAjuste: 'neutro',
            mensagem,
            memoriaCalculo
        };
    }

    const deducaoTotalDependentes = dependentes * DEDUCAO_DEPENDENTE;
    memoriaCalculo['Dedução por Dependentes'] = `${dependentes} x ${formatCurrency(DEDUCAO_DEPENDENTE)} = ${formatCurrency(deducaoTotalDependentes)}`;
    memoriaCalculo['Outras Deduções'] = formatCurrency(outrasDeducoes);

    const totalDeducoes = deducaoTotalDependentes + outrasDeducoes;
    memoriaCalculo['Total de Deduções'] = `${formatCurrency(deducaoTotalDependentes)} + ${formatCurrency(outrasDeducoes)} = ${formatCurrency(totalDeducoes)}`;

    const baseDeCalculo = Math.max(0, rendaAnual - totalDeducoes);
    memoriaCalculo['Base de Cálculo do Imposto'] = `${formatCurrency(rendaAnual)} - ${formatCurrency(totalDeducoes)} = ${formatCurrency(baseDeCalculo)}`;

    let impostoDevido = 0;
    let faixaEncontrada = null;
    for (const faixa of TABELA_IRPF) {
        if (baseDeCalculo >= faixa.faixa.min && baseDeCalculo <= faixa.faixa.max) {
            faixaEncontrada = faixa;
            break;
        }
    }
    if (!faixaEncontrada && baseDeCalculo > TABELA_IRPF[TABELA_IRPF.length - 1].faixa.max) {
        faixaEncontrada = TABELA_IRPF[TABELA_IRPF.length - 1];
    }


    if (faixaEncontrada) {
        impostoDevido = (baseDeCalculo * faixaEncontrada.aliquota) - faixaEncontrada.parcela_deduzir;
        memoriaCalculo['Cálculo do Imposto Devido'] = `(${formatCurrency(baseDeCalculo)} * ${faixaEncontrada.aliquota * 100}%) - ${formatCurrency(faixaEncontrada.parcela_deduzir)} = ${formatCurrency(impostoDevido)}`;
    } else {
        memoriaCalculo['Cálculo do Imposto Devido'] = 'Isento de imposto.';
    }

    impostoDevido = Math.max(0, impostoDevido);
    memoriaCalculo['Imposto Retido na Fonte (informado)'] = `-${formatCurrency(impostoRetido)}`;

    const ajusteFinal = impostoDevido - impostoRetido;

    let tipoAjuste = 'neutro';
    let mensagem = '';
    if (ajusteFinal > 0) {
        tipoAjuste = 'pagar';
        mensagem = `Você tem um saldo de ${formatCurrency(ajusteFinal)} a pagar.`;
        memoriaCalculo['Resultado Final'] = `Imposto a Pagar: ${formatCurrency(impostoDevido)} - ${formatCurrency(impostoRetido)} = ${formatCurrency(ajusteFinal)}`;
    } else if (ajusteFinal < 0) {
        tipoAjuste = 'restituir';
        mensagem = `Você tem uma restituição de ${formatCurrency(Math.abs(ajusteFinal))} a receber.`;
        memoriaCalculo['Resultado Final'] = `Imposto a Restituir: ${formatCurrency(impostoRetido)} - ${formatCurrency(impostoDevido)} = ${formatCurrency(Math.abs(ajusteFinal))}`;
    } else {
        mensagem = 'Sua declaração resultou em um ajuste zero. Não há imposto a pagar nem a restituir.';
        memoriaCalculo['Resultado Final'] = 'Ajuste nulo. Nenhum valor a pagar ou restituir.';
    }

    return {
        rendaAnual: arredondar(rendaAnual),
        dependentes,
        outrasDeducoes,
        totalDeducoes: arredondar(totalDeducoes),
        baseDeCalculo: arredondar(baseDeCalculo),
        impostoDevido: arredondar(impostoDevido),
        impostoRetido: arredondar(impostoRetido),
        ajusteFinal: arredondar(ajusteFinal),
        tipoAjuste,
        mensagem,
        memoriaCalculo
    };
}

/**
 * Calcula as verbas rescisórias com base no motivo da rescisão.
 * @param {object} dados - Objeto contendo todos os dados necessários para o cálculo.
 * @returns {{proventos: object, memoriaDeCalculo: object}} - Um objeto com proventos e a memória de cálculo.
 */
function _calcularVerbasRescisorias(dados) {
    const { remuneracao, dtAdmissao, dtDemissao, dtFinalProjetada, hasFeriasVencidas, saldoFgts, motivo, avisoPrevio } = dados;
    const memoriaDeCalculo = {};
    const proventos = {};

    // Verbas comuns a quase todos os casos
    const diasNoMesDemissao = new Date(dtDemissao.getFullYear(), dtDemissao.getMonth() + 1, 0).getDate();
    proventos['Saldo de Salário'] = (remuneracao / diasNoMesDemissao) * dtDemissao.getDate();
    memoriaDeCalculo['Saldo de Salário'] = `(${formatCurrency(remuneracao)} / ${diasNoMesDemissao} dias) * ${dtDemissao.getDate()} dias trabalhados`;

    const mesesTrabalhadosNoAno = dtFinalProjetada.getMonth() + 1;
    proventos['13º Salário Proporcional'] = calcularProporcional(remuneracao, mesesTrabalhadosNoAno);
    memoriaDeCalculo['13º Salário Proporcional'] = `(${formatCurrency(remuneracao)} / 12) * ${mesesTrabalhadosNoAno} meses`;

    let mesesPeriodoAquisitivo = (dtFinalProjetada.getMonth() - dtAdmissao.getMonth());
    if (dtFinalProjetada.getDate() >= dtAdmissao.getDate()) {
        mesesPeriodoAquisitivo += 1;
    }
    mesesPeriodoAquisitivo = mesesPeriodoAquisitivo <= 0 ? mesesPeriodoAquisitivo + 12 : mesesPeriodoAquisitivo;
    const feriasProporcionais = calcularProporcional(remuneracao, mesesPeriodoAquisitivo);
    proventos['Férias Proporcionais + 1/3'] = feriasProporcionais + (feriasProporcionais / 3);
    memoriaDeCalculo['Férias Proporcionais + 1/3'] = `((${formatCurrency(remuneracao)} / 12) * ${mesesPeriodoAquisitivo} meses) + 1/3`;

    if (hasFeriasVencidas) {
        proventos['Férias Vencidas + 1/3'] = remuneracao + (remuneracao / 3);
        memoriaDeCalculo['Férias Vencidas + 1/3'] = `Remuneração integral (${formatCurrency(remuneracao)}) + 1/3`;
    }

    // Lógica específica por motivo de rescisão
    switch (motivo) {
        case 'sem_justa_causa':
            if (avisoPrevio === 'indenizado') {
                const diasAvisoPrevio = 30 + (Math.min(dados.yearsWorked, 20) * 3);
                proventos['Aviso Prévio Indenizado'] = (remuneracao / 30) * diasAvisoPrevio;
                memoriaDeCalculo['Aviso Prévio Indenizado'] = `(${formatCurrency(remuneracao)} / 30) * ${diasAvisoPrevio} dias`;
            }
            proventos['Multa de 40% do FGTS'] = saldoFgts * 0.40;
            memoriaDeCalculo['Multa de 40% do FGTS'] = `40% de ${formatCurrency(saldoFgts)}`;
            break;

        case 'pedido_demissao':
            // Não tem direito a aviso prévio indenizado nem multa de 40%
            if (avisoPrevio !== 'trabalhado') {
                // Desconto do aviso prévio se não for cumprido
                proventos['Desconto Aviso Prévio'] = -remuneracao;
                memoriaDeCalculo['Desconto Aviso Prévio'] = 'Desconto do valor de um salário pela ausência de cumprimento do aviso prévio.';
            }
            break;

        case 'com_justa_causa':
            // Perde a maioria dos direitos
            return {
                proventos: { 'Saldo de Salário': proventos['Saldo de Salário'] },
                memoriaDeCalculo: { 'Saldo de Salário': memoriaDeCalculo['Saldo de Salário'], 'Direitos': 'Em demissão por justa causa, o trabalhador tem direito apenas ao saldo de salário e férias vencidas, se houver.' }
            };

        case 'acordo_mutuo':
            if (avisoPrevio === 'indenizado') {
                const diasAvisoPrevio = 30 + (Math.min(dados.yearsWorked, 20) * 3);
                proventos['Aviso Prévio Indenizado (50%)'] = ((remuneracao / 30) * diasAvisoPrevio) / 2;
                 memoriaDeCalculo['Aviso Prévio Indenizado (50%)'] = `Metade de (${formatCurrency(remuneracao)} / 30) * ${diasAvisoPrevio} dias`;
            }
            proventos['Multa de 20% do FGTS'] = saldoFgts * 0.20;
            memoriaDeCalculo['Multa de 20% do FGTS'] = `20% de ${formatCurrency(saldoFgts)}`;
            break;

        case 'termino_contrato_experiencia':
            // Sem aviso prévio e sem multa
            break;
    }

    return { proventos, memoriaDeCalculo };
}

/**
 * Calcula os descontos sobre as verbas rescisórias.
 * @param {object} proventos - Objeto com os proventos calculados.
 * @param {object} dados - Objeto contendo todos os dados necessários para o cálculo.
 * @returns {{descontos: object}} - Objeto com os descontos aplicáveis.
 */
function _calcularDescontosRescisao(proventos, dados) {
    const descontos = {};
    const { dependentes, remuneracao } = dados;

    const inssSobre13 = calcularContribuicaoINSS(proventos['13º Salário Proporcional'] || 0);
    if (inssSobre13.value > 0) descontos['INSS sobre 13º Salário'] = inssSobre13;

    const inssSobreSaldo = calcularContribuicaoINSS(proventos['Saldo de Salário'] || 0);
    if (inssSobreSaldo.value > 0) descontos['INSS sobre Saldo de Salário'] = inssSobreSaldo;

    // IRRF incide sobre Saldo de Salário e Aviso Prévio, deduzindo o INSS correspondente.
    const baseIRRF = (proventos['Saldo de Salário'] || 0) + (proventos['Aviso Prévio Indenizado'] || 0) - inssSobreSaldo.value;
    const irrf = calcularContribuicaoIRRF(baseIRRF, dependentes);
    if (irrf.value > 0) descontos['IRRF sobre Verbas'] = irrf;

    const outrosDescontos = calcularDescontosDetalhados(dados, remuneracao);
    if (outrosDescontos.total > 0) {
        descontos['Outros Descontos'] = { value: outrosDescontos.total, details: outrosDescontos };
    }

    // Adiciona o desconto do aviso prévio (valor negativo nos proventos) aos descontos.
    if (proventos['Desconto Aviso Prévio']) {
        descontos['Aviso Prévio Não Cumprido'] = { value: -proventos['Desconto Aviso Prévio'], details: 'Desconto referente ao não cumprimento do aviso prévio no pedido de demissão.' };
        delete proventos['Desconto Aviso Prévio']; // Remove dos proventos para não duplicar.
    }

    return { descontos };
}

/**
 * Calcula o pagamento de rescisão com base no estado da rescisão.
 * @param {object} estadoRescisao - A fatia específica da rescisão do estado da aplicação.
 * @returns {object} - Um objeto contendo todos os detalhes calculados do pagamento de rescisão.
 */
export function calcularRescisao(estadoRescisao) {
    const { motivo, dataAdmissao, dataDemissao, avisoPrevio, feriasVencidas, saldoFgts, dependentes } = estadoRescisao;

    if (!dataAdmissao || !dataDemissao || new Date(dataAdmissao) >= new Date(dataDemissao)) {
        return { proventos: {}, descontos: {}, totalProventos: 0, totalDescontos: 0, valorLiquido: 0, memoriaDeCalculo: {} };
    }

    const dtAdmissao = new Date(dataAdmissao + 'T00:00:00');
    const dtDemissao = new Date(dataDemissao + 'T00:00:00');
    const yearsWorked = Math.floor((dtDemissao - dtAdmissao) / (1000 * 60 * 60 * 24 * 365.25));

    const remuneracao = calcularRemuneracaoBase(estadoRescisao);

    // A data final projetada considera o aviso prévio indenizado para cálculo de 13º e férias.
    const diasAvisoPrevio = (avisoPrevio === 'indenizado') ? 30 + (Math.min(yearsWorked, 20) * 3) : 0;
    const dtFinalProjetada = new Date(dtDemissao);
    if (avisoPrevio === 'indenizado') {
        dtFinalProjetada.setDate(dtFinalProjetada.getDate() + diasAvisoPrevio);
    }

    const dadosBase = {
        ...estadoRescisao,
        remuneracao,
        dtAdmissao,
        dtDemissao,
        dtFinalProjetada,
        yearsWorked,
        hasFeriasVencidas: feriasVencidas
    };

    const { proventos, memoriaDeCalculo } = _calcularVerbasRescisorias(dadosBase);
    const { descontos } = _calcularDescontosRescisao(proventos, dadosBase);

    const totalProventos = Object.values(proventos).reduce((sum, val) => sum + val, 0);
    const totalDescontos = Object.values(descontos).reduce((sum, val) => sum + (val.value || 0), 0);
    const valorLiquido = totalProventos - totalDescontos;

    const proventosDetalhados = Object.keys(proventos).reduce((acc, key) => {
        if (proventos[key] > 0) {
            acc[key] = {
                valor: arredondar(proventos[key]),
                explicacao: memoriaDeCalculo[key] || 'Cálculo direto.'
            };
        }
        return acc;
    }, {});

    return {
        proventos: proventosDetalhados,
        descontos,
        totalProventos: arredondar(totalProventos),
        totalDescontos: arredondar(totalDescontos),
        valorLiquido: arredondar(valorLiquido)
    };
}

/**
 * Mapeamento de funções da calculadora para busca dinâmica.
 * Este objeto mapeia nomes de calculadoras para suas respectivas funções de cálculo,
 * permitindo uma abordagem mais escalável e de fácil manutenção em events.js.
 */
export const calculatorFunctions = {
    ferias: calcularFerias,
    rescisao: calcularRescisao,
    decimoTerceiro: calcularDecimoTerceiro,
    salarioLiquido: calcularSalarioLiquido,
    fgts: calcularFGTS,
    pisPasep: calcularPISPASEP,
    seguroDesemprego: calcularSeguroDesemprego,
    horasExtras: calcularHorasExtras,
    inss: calcularAliquotaINSS,
    valeTransporte: calcularValeTransporte,
    irpf: calcularIRPF
};
