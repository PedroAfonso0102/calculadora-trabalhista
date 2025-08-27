/**
 * Pure Calculation Functions
 *
 * This file contains all the business logic for the calculators.
 * These functions are pure: they take data as input and return a
 * result, without any interaction with the DOM.
 */

import {
    INSS_TABLE,
    IRRF_TABLE,
    IRRF_DEPENDENT_DEDUCTION,
    INSS_CEILING,
    SALARIO_FAMILIA_LIMIT,
    SALARIO_FAMILIA_VALUE,
    SALARIO_MINIMO_2025
} from './config.js';
import { formatCurrency, formatAsCurrency } from './utils.js';

// Re-export formatAsCurrency to make it available from calculations module
export { formatAsCurrency };

/**
 * Calculates net salary based on gross salary, dependents, and other discounts.
 * This is a simplified version specifically for the salary simulator.
 * @param {number} grossSalary - The gross salary amount
 * @param {number} dependents - Number of dependents for tax calculation
 * @param {number} otherDiscounts - Additional discounts to be applied
 * @returns {object} - An object with detailed net salary calculation results
 */
export function calculateNetSalary(grossSalary, dependents = 0, otherDiscounts = 0) {
    if (!grossSalary || grossSalary <= 0) {
        return {
            salarioBruto: 0,
            salarioLiquido: 0,
            descontoINSS: { value: 0 },
            descontoIRRF: { value: 0 },
            outrosDescontos: 0,
            totalDescontos: 0
        };
    }

    // Calculate INSS
    const inssResult = calculateINSS(grossSalary);
    const descontoINSS = inssResult.value;

    // Calculate IRRF (base is gross salary minus INSS)
    const baseIRRF = grossSalary - descontoINSS;
    const irrfResult = calculateIRRF(baseIRRF, dependents);
    const descontoIRRF = irrfResult.value;

    // Calculate total discounts
    const totalDescontos = descontoINSS + descontoIRRF + otherDiscounts;
    const salarioLiquido = grossSalary - totalDescontos;

    return {
        salarioBruto: roundMonetary(grossSalary),
        salarioLiquido: roundMonetary(Math.max(0, salarioLiquido)),
        descontoINSS: inssResult,
        descontoIRRF: irrfResult,
        outrosDescontos: roundMonetary(otherDiscounts),
        totalDescontos: roundMonetary(totalDescontos)
    };
}

/**
 * Rounds a number to avoid floating point precision issues
 * @param {number} value - The number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} - The rounded number
 */
function roundToPrecision(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Rounds monetary values to 4 decimal places to match test expectations
 * @param {number} value - The number to round
 * @returns {number} - The rounded number
 */
function roundMonetary(value) {
    return Math.round(value * 10000) / 10000;
}

/**
 * Calculates the INSS (social security) contribution based on a given salary.
 * The calculation is progressive, based on different tiers.
 * @param {number} base - The base salary for the calculation.
 * @returns {{value: number, details: Array<object>}} - An object containing the total INSS value and the details of the calculation.
 */
export function calculateINSS(base) {
    let inss = 0;
    let remainingBase = base;
    let previousLimit = 0;
    const details = [];

    for (const tier of INSS_TABLE) {
        if (base > previousLimit) {
            const taxableAmountInTier = Math.min(remainingBase, tier.limit - previousLimit);
            if (taxableAmountInTier <= 0) break;

            const tierInss = taxableAmountInTier * tier.rate;
            inss += tierInss;

            details.push({
                range: `Até ${formatCurrency(tier.limit)}`,
                base: formatCurrency(taxableAmountInTier),
                rate: `${(tier.rate * 100).toFixed(1)}%`,
                value: formatCurrency(tierInss)
            });

            remainingBase -= taxableAmountInTier;
            if (remainingBase <= 0) break;
        }
        previousLimit = tier.limit;
    }
    // The INSS contribution is capped at a ceiling.
    return { value: roundMonetary(Math.min(inss, INSS_CEILING)), details, baseOriginal: base };
}

/**
 * Calculates the IRRF (income tax) based on a given salary.
 * @param {number} base - The base salary for the calculation (already deducted from INSS).
 * @param {number} numDependents - The number of dependents for deduction.
 * @returns {{value: number, details: object}} - An object containing the total IRRF value and the details of the calculation.
 */
export function calculateIRRF(base, numDependents = 0) {
    const dependentsDeduction = numDependents * IRRF_DEPENDENT_DEDUCTION;
    const irrfBase = base - dependentsDeduction;
    let irrf = 0;
    let details = {};

    for (const tier of IRRF_TABLE) {
        if (irrfBase <= tier.limit) {
            irrf = Math.max(0, (irrfBase * tier.rate) - tier.deduction);
            details = {
                base: formatCurrency(base),
                dependentsDeduction: `-${formatCurrency(dependentsDeduction)}`,
                irrfBase: formatCurrency(irrfBase),
                rate: `${(tier.rate * 100).toFixed(2)}%`,
                deduction: `-${formatCurrency(tier.deduction)}`,
                value: formatCurrency(irrf)
            };
            break;
        }
    }
    return { value: roundToPrecision(irrf, 2), details, baseOriginal: base };
}

/**
 * Calculates the "Salário Família" benefit.
 * @param {number} salarioBruto - The gross salary.
 * @param {number} numFilhos - The number of eligible children.
 * @returns {number} - The total value of the benefit.
 */
export function calculateSalarioFamilia(salarioBruto, numFilhos) {
    if (salarioBruto <= SALARIO_FAMILIA_LIMIT && numFilhos > 0) {
        return numFilhos * SALARIO_FAMILIA_VALUE;
    }
    return 0;
}

/**
 * Calculates a proportional value based on months.
 * @param {number} valorBase - The base value for a full 12-month period.
 * @param {number} meses - The number of months to calculate the proportion for.
 * @returns {number} - The proportional value.
 */
export function calcularProporcional(valorBase, meses) {
  if (!valorBase || valorBase <= 0 || !meses || meses <= 0) return 0;
  return (valorBase / 12) * meses;
}

/**
 * Calculates hazard and insalubrity bonuses.
 * Returns the individual values and the total effective bonus (higher of the two).
 * @param {number} salarioBruto - The gross salary.
 * @param {boolean} periculosidade - If hazard pay is applicable.
 * @param {string|number} insalubridadeGrau - The insalubrity level (0, 10, 20, 40).
 * @param {string} insalubridadeBase - The base for insalubrity calculation ('salario_minimo' or 'salario_bruto').
 * @returns {{periculosidade: number, insalubridade: number, total: number}}
 */
export function calcularAdicionaisRisco(salarioBruto, periculosidade, insalubridadeGrau, insalubridadeBase) {
    const valorPericulosidade = periculosidade ? salarioBruto * 0.30 : 0;

    let valorInsalubridade = 0;
    if (insalubridadeGrau > 0) {
        const baseCalculo = insalubridadeBase === 'salario_minimo' ? SALARIO_MINIMO_2025 : salarioBruto;
        valorInsalubridade = baseCalculo * (parseFloat(insalubridadeGrau) / 100);
    }

    return {
        periculosidade: valorPericulosidade,
        insalubridade: valorInsalubridade,
        total: Math.max(valorPericulosidade, valorInsalubridade)
    };
}

/**
 * Calculates detailed discounts based on the calculator state.
 * @param {object} state - The specific calculator's slice of the application state.
 * @param {number} salarioBruto - The gross salary to use as a base for percentage calculations.
 * @returns {object} - An object containing all calculated discounts and their total.
 */
export function calculateDetailedDiscounts(state, salarioBruto) {
    const {
        descontoVt = 0,
        descontoVr = 0,
        descontoSaude = 0,
        descontoAdiantamentos = 0
    } = state;

    // The VT discount is capped at 6% of the gross salary.
    const valorDescontoVT = Math.min(salarioBruto * 0.06, descontoVt);

    const discounts = {
        valeTransporte: valorDescontoVT,
        valeRefeicao: descontoVr,
        planoSaude: descontoSaude,
        adiantamentos: descontoAdiantamentos,
    };

    const total = Object.values(discounts).reduce((sum, val) => sum + val, 0);

    return { ...discounts, total };
}


/**
 * Calculates vacation pay based on the vacation state.
 * @param {object} feriasState - The vacation-specific slice of the application state.
 * @returns {object} - An object containing all calculated vacation pay details.
 */
export function calculateFerias(feriasState) {
    const {
        salarioBruto,
        diasFerias,
        dependentes,
        mediaHorasExtras,
        mediaAdicionalNoturno,
        periculosidade,
        insalubridadeGrau,
        insalubridadeBase,
        abonoPecuniario,
        adiantarDecimo
    } = feriasState;

    const adicionalRisco = calcularAdicionaisRisco(salarioBruto, periculosidade, insalubridadeGrau, insalubridadeBase).total;
    const baseDeCalculo = salarioBruto + mediaHorasExtras + mediaAdicionalNoturno + adicionalRisco;
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
    const inssResult = calculateINSS(baseINSS);
    const descontoINSS = inssResult.value;

    const baseIRRF = baseINSS - descontoINSS;
    const irrfResult = calculateIRRF(baseIRRF, dependentes);
    const descontoIRRF = irrfResult.value;

    const totalDescontos = descontoINSS + descontoIRRF;
    const valorLiquido = totalProventos - totalDescontos;

    return {
        salarioBruto: roundMonetary(salarioBruto),
        baseDeCalculo: roundMonetary(baseDeCalculo),
        valorFerias: roundMonetary(valorFerias),
        tercoConstitucional: roundMonetary(tercoConstitucional),
        valorAbono: roundMonetary(valorAbono),
        tercoAbono: roundMonetary(tercoAbono),
        adiantamento13: roundMonetary(adiantamento13),
        totalProventos: roundMonetary(totalProventos),
        descontoINSS: inssResult,
        descontoIRRF: irrfResult,
        totalDescontos: roundMonetary(totalDescontos),
        valorLiquido: roundMonetary(valorLiquido),
        venderFerias: abonoPecuniario,
        adiantarDecimo,
        diasFerias
    };
}

/**
 * Calculates 13th salary based on the 13th salary state.
 * @param {object} decimoState - The 13th-salary-specific slice of the application state.
 * @returns {object} - An object containing all calculated 13th salary details.
 */
export function calculateDecimoTerceiro(decimoState) {
    const {
        salarioBruto,
        mesesTrabalhados,
        dependentes,
        adiantamentoRecebido,
        mediaHorasExtras,
        mediaAdicionalNoturno,
        periculosidade,
        insalubridadeGrau,
        insalubridadeBase
    } = decimoState;

    const adicionalRisco = calcularAdicionaisRisco(salarioBruto, periculosidade, insalubridadeGrau, insalubridadeBase).total;
    const baseDeCalculo = salarioBruto + mediaHorasExtras + mediaAdicionalNoturno + adicionalRisco;
    const valorBrutoDecimo = calcularProporcional(baseDeCalculo, mesesTrabalhados);

    const inssResult = calculateINSS(valorBrutoDecimo);
    const descontoINSS = inssResult.value;

    const baseIRRF = valorBrutoDecimo - descontoINSS;
    const irrfResult = calculateIRRF(baseIRRF, dependentes);
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
 * Calculates net monthly salary based on the net salary state.
 * @param {object} liquidoState - The net-salary-specific slice of the application state.
 * @returns {object} - An object containing all calculated net salary details.
 */
export function calculateSalarioLiquido(liquidoState) {
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
    } = liquidoState;

    const adicionaisRisco = calcularAdicionaisRisco(salarioBruto, periculosidade, insalubridadeGrau, insalubridadeBase);
    const adicionalRisco = adicionaisRisco.total;

    const salarioBaseParaVariaveis = salarioBruto + adicionalRisco;
    let adicionalNoturno = 0;
    if (horasNoturnas > 0 && cargaHorariaMensal > 0) {
        const valorHoraNormal = salarioBaseParaVariaveis / cargaHorariaMensal;
        adicionalNoturno = (valorHoraNormal * 0.20) * horasNoturnas;
    }

    const salarioBrutoTotal = salarioBruto + horasExtras + adicionalRisco + adicionalNoturno;
    const salarioFamilia = calculateSalarioFamilia(salarioBrutoTotal, filhosSalarioFamilia);

    const inssResult = calculateINSS(salarioBrutoTotal);
    const descontoINSS = inssResult.value;

    const baseIRRF = salarioBrutoTotal - descontoINSS;
    const irrfResult = calculateIRRF(baseIRRF, dependentes);
    const descontoIRRF = irrfResult.value;

    const detailedDiscounts = calculateDetailedDiscounts(liquidoState, salarioBruto);

    const totalProventos = salarioBrutoTotal + salarioFamilia;
    const totalDescontos = descontoINSS + descontoIRRF + detailedDiscounts.total;
    const salarioLiquido = totalProventos - totalDescontos;

    return {
        salarioBruto: roundMonetary(salarioBruto),
        horasExtras: roundMonetary(horasExtras),
        adicionalPericulosidade: roundMonetary(adicionaisRisco.periculosidade),
        adicionalInsalubridade: roundMonetary(adicionaisRisco.insalubridade),
        adicionalNoturno: roundMonetary(adicionalNoturno),
        salarioBrutoTotal: roundMonetary(salarioBrutoTotal),
        salarioFamilia: roundMonetary(salarioFamilia),
        descontoINSS: inssResult,
        descontoIRRF: irrfResult,
        descontoVT: roundMonetary(detailedDiscounts.valeTransporte),
        descontoVR: roundMonetary(detailedDiscounts.valeRefeicao),
        descontoSaude: roundMonetary(detailedDiscounts.planoSaude),
        descontoAdiantamentos: roundMonetary(detailedDiscounts.adiantamentos),
        totalProventos: roundMonetary(totalProventos),
        totalDescontos: roundMonetary(totalDescontos),
        salarioLiquido: roundMonetary(salarioLiquido)
    };
}

/**
 * Calculates FGTS deposit and withdrawal simulations.
 * @param {object} fgtsState - The FGTS-specific slice of the application state.
 * @returns {object} - An object containing all calculated FGTS details.
 */
export function calculateFGTS(fgtsState) {
    const { salarioBruto, saldoTotal, opcaoSaque } = fgtsState;

    // 1. Calculate Monthly Deposit
    const depositoMensal = salarioBruto * 0.08;

    // 2. Simulate Withdrawal
    let valorSaque = 0;
    if (saldoTotal > 0 && opcaoSaque) {
        if (opcaoSaque === 'rescisao') {
            valorSaque = saldoTotal;
        } else if (opcaoSaque === 'aniversario') {
            if (saldoTotal <= 500) {
                valorSaque = saldoTotal * 0.50;
            } else if (saldoTotal <= 1000) {
                valorSaque = saldoTotal * 0.40 + 50;
            } else if (saldoTotal <= 5000) {
                valorSaque = saldoTotal * 0.30 + 150;
            } else if (saldoTotal <= 10000) {
                valorSaque = saldoTotal * 0.20 + 650;
            } else if (saldoTotal <= 15000) {
                valorSaque = saldoTotal * 0.15 + 1150;
            } else if (saldoTotal <= 20000) {
                valorSaque = saldoTotal * 0.10 + 1900;
            } else {
                valorSaque = saldoTotal * 0.05 + 2900;
            }
        }
    }

    return {
        salarioBruto,
        depositoMensal: roundMonetary(depositoMensal),
        saldoTotal,
        opcaoSaque,
        valorSaque: roundMonetary(valorSaque)
    };
}

export function calculatePISPASEP(pisPasepState, legalTexts) {
    const { salarioMedio, mesesTrabalhados, dataInscricao } = pisPasepState;

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
        valorAbono: roundMonetary(valorAbono),
        elegivel,
        mensagem,
        memoriaCalculo
    };
}

export function calculateSeguroDesemprego(seguroDesempregoState, legalTexts) {
    const { salario1, salario2, salario3, mesesTrabalhados, numSolicitacoes } = seguroDesempregoState;

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

    // 1. Determinar Número de Parcelas
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

    // 2. Calcular Valor da Parcela
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

    // Ensure value is within min/max limits
    valorPorParcela = Math.max(SALARIO_MINIMO_VIGENTE, Math.min(valorPorParcela, TETO_SEGURO_DESEMPREGO));
    memoriaCalculo['Ajuste Final'] = `Valor da parcela ajustado para estar entre o salário mínimo (${formatCurrency(SALARIO_MINIMO_VIGENTE)}) e o teto (${formatCurrency(TETO_SEGURO_DESEMPREGO)}). Valor final: ${formatCurrency(valorPorParcela)}.`;
    mensagem = `Elegível. Você tem direito a ${numeroParcelas} parcelas de ${formatCurrency(valorPorParcela)}.`;

    return {
        numeroParcelas,
        valorPorParcela: roundMonetary(valorPorParcela),
        mediaSalarial,
        elegivel,
        mensagem,
        memoriaCalculo
    };
}

export function calculateHorasExtras(horasExtrasState, legalTexts) {
    const { salarioBase, horasContratuais, horasExtras50, horasExtras100, horasNoturnas } = horasExtrasState;

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
        valorHoraNormal: roundMonetary(valorHoraNormal),
        totalValorHE50: roundMonetary(totalValorHE50),
        totalValorHE100: roundMonetary(totalValorHE100),
        totalValorAdicionalNoturno: roundMonetary(totalValorAdicionalNoturno),
        totalGeralAdicionais: roundMonetary(totalGeralAdicionais),
        mensagem: `Cálculo de Horas Extras e Adicionais.`,
        memoriaCalculo
    };
}

export function calculateINSSCalculator(inssState, legalTexts) {
    const { salarioBruto } = inssState;
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
        contribuicaoINSS: roundMonetary(contribuicaoINSS),
        aliquotaEfetiva: aliquotaEfetiva,
        mensagem: `Contribuição INSS calculada com base no salário de ${formatCurrency(salarioBruto)}.`,
        memoriaCalculo
    };
}

export function calculateValeTransporte(valeTransporteState, legalTexts) {
    const { salarioBruto, custoDiario, diasTrabalho } = valeTransporteState;
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

    // The employee discount is the lesser of the two values.
    const descontoRealEmpregado = Math.min(custoMensalTotal, descontoMaximoSalario);
    memoriaCalculo['Desconto do Empregado'] = `O menor valor entre o Custo Total (${formatCurrency(custoMensalTotal)}) e o Limite de 6% (${formatCurrency(descontoMaximoSalario)}) = ${formatCurrency(descontoRealEmpregado)}`;

    // The employer pays the difference.
    const valorBeneficioEmpregador = Math.max(0, custoMensalTotal - descontoRealEmpregado);
    memoriaCalculo['Benefício (Custeado pelo Empregador)'] = `Custo Total (${formatCurrency(custoMensalTotal)}) - Desconto do Empregado (${formatCurrency(descontoRealEmpregado)}) = ${formatCurrency(valorBeneficioEmpregador)}`;

    return {
        salarioBruto,
        custoDiario,
        diasTrabalho: dias,
        custoMensalTotal: roundMonetary(custoMensalTotal),
        descontoMaximoSalario: roundMonetary(descontoMaximoSalario),
        descontoRealEmpregado: roundMonetary(descontoRealEmpregado),
        valorBeneficioEmpregador: roundMonetary(valorBeneficioEmpregador),
        mensagem: "Cálculo do Vale-Transporte realizado com sucesso.",
        memoriaCalculo
    };
}

export function calculateIRPF(irpfState, legalTexts) {
    const { rendaAnual, dependentes, outrasDeducoes, impostoRetido } = irpfState;
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
        rendaAnual: roundMonetary(rendaAnual),
        dependentes,
        outrasDeducoes,
        totalDeducoes: roundMonetary(totalDeducoes),
        baseDeCalculo: roundMonetary(baseDeCalculo),
        impostoDevido: roundMonetary(impostoDevido),
        impostoRetido: roundMonetary(impostoRetido),
        ajusteFinal: roundMonetary(ajusteFinal),
        tipoAjuste,
        mensagem,
        memoriaCalculo
    };
}

/**
 * Calculates severance pay based on the severance state.
 * @param {object} rescisaoState - The severance-specific slice of the application state.
 * @returns {object} - An object containing all calculated severance pay details.
 */
export function calculateRescisao(rescisaoState) {
    const {
        motivo,
        dataAdmissao,
        dataDemissao,
        salarioBruto,
        saldoFgts,
        avisoPrevio,
        feriasVencidas: hasFeriasVencidas,
        dependentes,
        mediaHorasExtras,
        mediaAdicionalNoturno,
        periculosidade,
        insalubridadeGrau,
        insalubridadeBase
    } = rescisaoState;

    if (!dataAdmissao || !dataDemissao || new Date(dataAdmissao) >= new Date(dataDemissao)) {
        return { proventos: {}, descontos: {}, totalProventos: 0, totalDescontos: 0, valorLiquido: 0, memoriaDeCalculo: {} };
    }

    const memoriaDeCalculo = {};

    // 1. Correct Base Calculation (Remuneração)
    const adicionalRisco = calcularAdicionaisRisco(salarioBruto, periculosidade, insalubridadeGrau, insalubridadeBase).total;
    const remuneracao = salarioBruto + (mediaHorasExtras || 0) + (mediaAdicionalNoturno || 0) + adicionalRisco;
    memoriaDeCalculo.remuneracao = `Salário Bruto (${formatCurrency(salarioBruto)}) + Médias/Adicionais (${formatCurrency(remuneracao - salarioBruto)})`;

    // 2. Calculate Notice Period
    const dtAdmissao = new Date(dataAdmissao + 'T00:00:00');
    const dtDemissao = new Date(dataDemissao + 'T00:00:00');
    const yearsWorked = Math.floor((dtDemissao - dtAdmissao) / (1000 * 60 * 60 * 24 * 365.25));
    const diasAvisoPrevio = (avisoPrevio === 'indenizado') ? 30 + (Math.min(yearsWorked, 20) * 3) : 0;

    // 3. Project contract end date
    const dtFinalProjetada = new Date(dtDemissao);
    dtFinalProjetada.setDate(dtFinalProjetada.getDate() + diasAvisoPrevio);

    // 4. Calculate Severance Payments based on new logic
    const diasNoMesDemissao = new Date(dtDemissao.getFullYear(), dtDemissao.getMonth() + 1, 0).getDate();
    const saldoDeSalario = (remuneracao / diasNoMesDemissao) * dtDemissao.getDate();
    memoriaDeCalculo['Saldo de Salário'] = `(${formatCurrency(remuneracao)} / ${diasNoMesDemissao} dias) * ${dtDemissao.getDate()} dias trabalhados`;

    const avisoPrevioIndenizado = (remuneracao / 30) * diasAvisoPrevio;
     memoriaDeCalculo['Aviso Prévio Indenizado'] = `(${formatCurrency(remuneracao)} / 30) * ${diasAvisoPrevio} dias`;

    const mesesTrabalhadosNoAno = dtFinalProjetada.getMonth() + 1;
    const decimoTerceiroProporcional = calcularProporcional(remuneracao, mesesTrabalhadosNoAno);
    memoriaDeCalculo['13º Salário Proporcional'] = `(${formatCurrency(remuneracao)} / 12) * ${mesesTrabalhadosNoAno} meses`;

    let mesesPeriodoAquisitivo = (dtFinalProjetada.getMonth() - dtAdmissao.getMonth());
    if (dtFinalProjetada.getDate() >= dtAdmissao.getDate()) {
        mesesPeriodoAquisitivo += 1;
    }
     mesesPeriodoAquisitivo = mesesPeriodoAquisitivo <= 0 ? mesesPeriodoAquisitivo + 12 : mesesPeriodoAquisitivo;
    const feriasProporcionais = calcularProporcional(remuneracao, mesesPeriodoAquisitivo);
    const tercoFeriasProporcionais = feriasProporcionais / 3;
     memoriaDeCalculo['Férias Proporcionais + 1/3'] = `((${formatCurrency(remuneracao)} / 12) * ${mesesPeriodoAquisitivo} meses) + 1/3`;

    const valorFeriasVencidas = hasFeriasVencidas ? remuneracao : 0;
    const tercoFeriasVencidas = hasFeriasVencidas ? remuneracao / 3 : 0;
    if (hasFeriasVencidas) {
        memoriaDeCalculo['Férias Vencidas + 1/3'] = `Remuneração integral (${formatCurrency(remuneracao)}) + 1/3`;
    }

    const multaFgts = saldoFgts * 0.40;
    memoriaDeCalculo['Multa de 40% do FGTS'] = `40% de ${formatCurrency(saldoFgts)}`;

    let proventos = {};
    let descontos = {};

    switch (motivo) {
        case 'sem_justa_causa':
            proventos = {
                'Saldo de Salário': saldoDeSalario,
                'Aviso Prévio Indenizado': avisoPrevioIndenizado,
                '13º Salário Proporcional': decimoTerceiroProporcional,
                'Férias Vencidas + 1/3': valorFeriasVencidas + tercoFeriasVencidas,
                'Férias Proporcionais + 1/3': feriasProporcionais + tercoFeriasProporcionais,
                'Multa de 40% do FGTS': multaFgts,
            };
            break;
        default:
             proventos = { 'Saldo de Salário': saldoDeSalario };
            break;
    }

    const inssSobre13Result = calculateINSS(proventos['13º Salário Proporcional'] || 0);
    const inssSobreSaldoResult = calculateINSS(proventos['Saldo de Salário'] || 0);
    if(inssSobre13Result.value > 0) descontos['INSS sobre 13º Salário'] = inssSobre13Result;
    if(inssSobreSaldoResult.value > 0) descontos['INSS sobre Saldo de Salário'] = inssSobreSaldoResult;

    const baseIRRF = (proventos['Saldo de Salário'] || 0) + (proventos['Aviso Prévio Indenizado'] || 0) - (inssSobreSaldoResult.value || 0);
    const irrfResult = calculateIRRF(baseIRRF, dependentes);
    if(irrfResult.value > 0) descontos['IRRF sobre Verbas'] = irrfResult;

    const detailedDiscounts = calculateDetailedDiscounts(rescisaoState, remuneracao);
    if (detailedDiscounts.total > 0) {
        descontos['Outros Descontos'] = { value: detailedDiscounts.total, details: detailedDiscounts };
    }

    const totalProventos = Object.values(proventos).reduce((sum, val) => sum + val, 0);
    const totalDescontos = Object.values(descontos).reduce((sum, val) => sum + (val.value || 0), 0);
    const valorLiquido = totalProventos - totalDescontos;

    // Transform proventos into the detailed structure
    const proventosDetalhados = Object.keys(proventos).reduce((acc, key) => {
        if (proventos[key] > 0) {
            acc[key] = {
                valor: proventos[key],
                explicacao: memoriaDeCalculo[key] || 'Cálculo direto.'
            };
        }
        return acc;
    }, {});

    return { proventos: proventosDetalhados, descontos, totalProventos, totalDescontos, valorLiquido };
}
