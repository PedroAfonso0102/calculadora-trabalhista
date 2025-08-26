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

    const adicionalPericulosidade = periculosidade ? salarioBruto * 0.30 : 0;
    let adicionalInsalubridade = 0;
    if (insalubridadeGrau > 0) {
        const baseCalculoInsalubridade = insalubridadeBase === 'salario_minimo' ? SALARIO_MINIMO_2025 : salarioBruto;
        adicionalInsalubridade = baseCalculoInsalubridade * (insalubridadeGrau / 100);
    }

    const adicionalRisco = Math.max(adicionalPericulosidade, adicionalInsalubridade);

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

    const adiantamento13 = adiantarDecimo ? salarioBruto / 2 : 0;
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

    const adicionalPericulosidade = periculosidade ? salarioBruto * 0.30 : 0;
    let adicionalInsalubridade = 0;
    if (insalubridadeGrau > 0) {
        const baseCalculoInsalubridade = insalubridadeBase === 'salario_minimo' ? SALARIO_MINIMO_2025 : salarioBruto;
        adicionalInsalubridade = baseCalculoInsalubridade * (insalubridadeGrau / 100);
    }
    const adicionalRisco = Math.max(adicionalPericulosidade, adicionalInsalubridade);

    const baseDeCalculo = salarioBruto + mediaHorasExtras + mediaAdicionalNoturno + adicionalRisco;
    const valorBrutoDecimo = (baseDeCalculo / 12) * mesesTrabalhados;

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

    const valorAdicionalPericulosidade = periculosidade ? salarioBruto * 0.30 : 0;
    let valorAdicionalInsalubridade = 0;
    if (insalubridadeGrau > 0) {
        const baseCalculoInsalubridade = insalubridadeBase === 'salario_minimo' ? SALARIO_MINIMO_2025 : salarioBruto;
        valorAdicionalInsalubridade = baseCalculoInsalubridade * (insalubridadeGrau / 100);
    }
    const adicionalRisco = Math.max(valorAdicionalPericulosidade, valorAdicionalInsalubridade);

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
        adicionalPericulosidade: roundMonetary(valorAdicionalPericulosidade),
        adicionalInsalubridade: roundMonetary(valorAdicionalInsalubridade),
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

export function calculatePISPASEP(pisPasepState) {
    const { salarioMedio, mesesTrabalhados, dataInscricao } = pisPasepState;
    // Note: This assumes legalTexts has been loaded into the main state object.
    // In a real app, you might pass state.legalTexts as an argument or ensure it's loaded.
    const pisConstants = state.legalTexts.pisPasep.constants;
    const SALARIO_MINIMO_VIGENTE = pisConstants.SALARIO_MINIMO_VIGENTE;
    const MAX_SALARIO_PIS = SALARIO_MINIMO_VIGENTE * pisConstants.MAX_MULTIPLIER_SALARIO;
    const MIN_ANOS_PIS = pisConstants.MIN_ANOS_INSCRICAO;

    const anoAtual = new Date().getFullYear();
    const anoInscricao = new Date(dataInscricao).getFullYear();
    const anosDeInscricao = anoAtual - anoInscricao;

    let elegivel = true;
    let mensagem = 'Elegível ao PIS/PASEP';
    let valorAbono = 0;

    if (!dataInscricao || isNaN(anoInscricao)) {
        elegivel = false;
        mensagem = 'Data de inscrição inválida.';
    } else if (anosDeInscricao < MIN_ANOS_PIS) {
        elegivel = false;
        mensagem = `Não elegível: Menos de ${MIN_ANOS_PIS} anos de inscrição no PIS/PASEP.`;
    } else if (salarioMedio > MAX_SALARIO_PIS) {
        elegivel = false;
        mensagem = `Não elegível: Salário médio acima do limite de ${formatCurrency(MAX_SALARIO_PIS)}.`;
    } else if (mesesTrabalhados < 1) {
        elegivel = false;
        mensagem = 'Não elegível: Mínimo de 1 mês trabalhado no ano-base.';
    }

    if (elegivel) {
        const valorPorMes = SALARIO_MINIMO_VIGENTE / 12;
        valorAbono = valorPorMes * mesesTrabalhados;
        mensagem = 'Cálculo realizado com sucesso.';
    }

    return {
        valorAbono: roundMonetary(valorAbono),
        elegivel,
        mensagem
    };
}

export function calculateSeguroDesemprego(seguroDesempregoState) {
    const { salario1, salario2, salario3, mesesTrabalhados, numSolicitacoes } = seguroDesempregoState;

    const sdData = state.legalTexts.seguro_desemprego;
    const SALARIO_MINIMO_VIGENTE = sdData.constants.SALARIO_MINIMO_VIGENTE;
    const TETO_SEGURO_DESEMPREGO = sdData.constants.TETO_SEGURO_DESEMPREGO;
    const TABELA_VALORES = sdData.tables.valores_parcelas;
    const TABELA_PARCELAS = sdData.tables.numero_parcelas;

    let numeroParcelas = 0;
    let valorPorParcela = 0;
    let elegivel = true;
    let mensagem = 'Elegível ao Seguro-Desemprego.';

    const mediaSalarial = (salario1 + salario2 + salario3) / 3;

    // 1. Determinar Número de Parcelas
    const solicitacaoAtual = (numSolicitacoes || 0) + 1;
    const regraParcelas = TABELA_PARCELAS.find(regra =>
        regra.solicitacao === solicitacaoAtual &&
        mesesTrabalhados >= regra.meses_trabalhados.min &&
        mesesTrabalhados <= regra.meses_trabalhados.max
    );

    if (regraParcelas) {
        numeroParcelas = regraParcelas.parcelas;
    } else {
        elegivel = false;
        mensagem = `Não elegível: Tempo de trabalho (${mesesTrabalhados} meses) ou número de solicitações (${solicitacaoAtual}ª) não atende aos critérios para o Seguro-Desemprego.`;
        return { numeroParcelas: 0, valorPorParcela: 0, elegivel, mensagem };
    }

    // 2. Calcular Valor da Parcela
    if (mediaSalarial <= TABELA_VALORES[0].faixa.max) {
        valorPorParcela = mediaSalarial * TABELA_VALORES[0].percentual;
    } else if (mediaSalarial <= TABELA_VALORES[1].faixa.max) {
        valorPorParcela = (TABELA_VALORES[0].faixa.max * TABELA_VALORES[0].percentual) +
                         ((mediaSalarial - TABELA_VALORES[0].faixa.max) * TABELA_VALORES[1].percentual);
    } else {
         valorPorParcela = TETO_SEGURO_DESEMPREGO;
    }

    // Ensure value is within min/max limits
    valorPorParcela = Math.max(SALARIO_MINIMO_VIGENTE, Math.min(valorPorParcela, TETO_SEGURO_DESEMPREGO));

    mensagem = `Elegível. Você tem direito a ${numeroParcelas} parcelas de ${formatCurrency(valorPorParcela)}.`;

    return {
        numeroParcelas,
        valorPorParcela: roundMonetary(valorPorParcela),
        elegivel,
        mensagem
    };
}

export function calculateHorasExtras(horasExtrasState) {
    const { salarioBase, horasContratuais, horasExtras50, horasExtras100, horasNoturnas } = horasExtrasState;

    const heData = state.legalTexts.horasExtras;
    const PERCENTUAL_HE_50 = heData.constants.PERCENTUAL_HE_50;
    const PERCENTUAL_HE_100 = heData.constants.PERCENTUAL_HE_100;
    const PERCENTUAL_ADICIONAL_NOTURNO = heData.constants.PERCENTUAL_ADICIONAL_NOTURNO;

    if (horasContratuais <= 0) {
        return {
            totalValorHE50: 0,
            totalValorHE100: 0,
            totalValorAdicionalNoturno: 0,
            totalGeralAdicionais: 0,
            mensagem: "Horas contratuais devem ser maior que zero."
        };
    }

    const valorHoraNormal = salarioBase / horasContratuais;
    const valorHE50 = valorHoraNormal * (1 + PERCENTUAL_HE_50);
    const valorHE100 = valorHoraNormal * (1 + PERCENTUAL_HE_100);
    const valorAdicionalNoturnoHora = valorHoraNormal * PERCENTUAL_ADICIONAL_NOTURNO;

    const totalValorHE50 = horasExtras50 * valorHE50;
    const totalValorHE100 = horasExtras100 * valorHE100;
    const totalValorAdicionalNoturno = horasNoturnas * valorAdicionalNoturnoHora;

    const totalGeralAdicionais = totalValorHE50 + totalValorHE100 + totalValorAdicionalNoturno;

    return {
        totalValorHE50: roundMonetary(totalValorHE50),
        totalValorHE100: roundMonetary(totalValorHE100),
        totalValorAdicionalNoturno: roundMonetary(totalValorAdicionalNoturno),
        totalGeralAdicionais: roundMonetary(totalGeralAdicionais),
        mensagem: `Cálculo de Horas Extras e Adicionais.`
    };
}

export function calculateINSSCalculator(state) {
    // This is a placeholder for the dedicated INSS calculator tab.
    // The main calculateINSS function is the helper used by other calculators.
    return calculateINSS(state.salarioBruto);
}

export function calculateValeTransporte(state) {
    return {};
}

export function calculateIRPF(state) {
    return {};
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
        return { proventos: {}, descontos: {}, totalProventos: 0, totalDescontos: 0, valorLiquido: 0 };
    }

    // 1. Correct Base Calculation (Remuneração)
    const adicionalPericulosidade = periculosidade ? salarioBruto * 0.30 : 0;
    let adicionalInsalubridade = 0;
    if (insalubridadeGrau > 0) {
        const baseInsalubridade = insalubridadeBase === 'salario_minimo' ? SALARIO_MINIMO_2025 : salarioBruto;
        adicionalInsalubridade = baseInsalubridade * (insalubridadeGrau / 100);
    }
    const adicionalRisco = Math.max(adicionalPericulosidade, adicionalInsalubridade);
    const remuneracao = salarioBruto + (mediaHorasExtras || 0) + (mediaAdicionalNoturno || 0) + adicionalRisco;

    // 2. Calculate Notice Period
    const dtAdmissao = new Date(dataAdmissao + 'T00:00:00');
    const dtDemissao = new Date(dataDemissao + 'T00:00:00');
    const yearsWorked = Math.floor((dtDemissao - dtAdmissao) / (1000 * 60 * 60 * 24 * 365.25));
    const diasAvisoPrevio = (avisoPrevio === 'indenizado') ? 30 + (Math.min(yearsWorked, 20) * 3) : 0;

    // 3. Project contract end date
    const dtFinalProjetada = new Date(dtDemissao);
    dtFinalProjetada.setDate(dtFinalProjetada.getDate() + diasAvisoPrevio);

    // 4. Calculate Severance Payments based on new logic
    // Saldo de Salário
    const diasNoMesDemissao = new Date(dtDemissao.getFullYear(), dtDemissao.getMonth() + 1, 0).getDate();
    const saldoDeSalario = (remuneracao / diasNoMesDemissao) * dtDemissao.getDate();

    // Aviso Prévio Indenizado
    const avisoPrevioIndenizado = (remuneracao / 30) * diasAvisoPrevio;

    // 13º Salário Proporcional (based on projected end date)
    const mesesTrabalhadosNoAno = dtFinalProjetada.getMonth() + 1;
    const decimoTerceiroProporcional = (remuneracao / 12) * mesesTrabalhadosNoAno;

    // Férias Proporcionais + 1/3 (based on projected end date)
    let mesesPeriodoAquisitivo = (dtFinalProjetada.getMonth() - dtAdmissao.getMonth()) % 12;
    if (dtFinalProjetada.getDate() > dtAdmissao.getDate()) {
        mesesPeriodoAquisitivo += 1;
    }
    mesesPeriodoAquisitivo = mesesPeriodoAquisitivo <= 0 ? mesesPeriodoAquisitivo + 12 : mesesPeriodoAquisitivo;
    const feriasProporcionais = (remuneracao / 12) * mesesPeriodoAquisitivo;
    const tercoFeriasProporcionais = feriasProporcionais / 3;

    // Férias Vencidas
    const valorFeriasVencidas = hasFeriasVencidas ? remuneracao : 0;
    const tercoFeriasVencidas = hasFeriasVencidas ? remuneracao / 3 : 0;

    // Multa FGTS
    const multaFgts = saldoFgts * 0.40;

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
        // Other cases can be updated later, focus on the main one.
        default:
             proventos = {
                'Saldo de Salário': saldoDeSalario,
                'Multa de 40% do FGTS': multaFgts
             };
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

    return { proventos, descontos, totalProventos, totalDescontos, valorLiquido };
}
