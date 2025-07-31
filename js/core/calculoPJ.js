/**
 * Cálculo de Faturamento PJ - Calculadora Trabalhista
 *
 * Módulo responsável pelo cálculo do rendimento líquido de uma Pessoa Jurídica (PJ)
 * optante pelo Simples Nacional, considerando o Fator R.
 */

import { arredondar } from './regrasGerais.js';

// Tabelas do Simples Nacional 2024 (fornecidas pelo usuário)
const ANEXO_III = [
    { faixa: 1, receitaAte: 180000, aliquota: 0.06, deduzir: 0 },
    { faixa: 2, receitaAte: 360000, aliquota: 0.112, deduzir: 9360 },
    { faixa: 3, receitaAte: 720000, aliquota: 0.135, deduzir: 17640 },
    { faixa: 4, receitaAte: 1800000, aliquota: 0.16, deduzir: 35640 },
    { faixa: 5, receitaAte: 3600000, aliquota: 0.21, deduzir: 125640 },
    { faixa: 6, receitaAte: 4800000, aliquota: 0.33, deduzir: 648000 },
];

const ANEXO_V = [
    { faixa: 1, receitaAte: 180000, aliquota: 0.155, deduzir: 0 },
    { faixa: 2, receitaAte: 360000, aliquota: 0.18, deduzir: 4500 },
    { faixa: 3, receitaAte: 720000, aliquota: 0.195, deduzir: 9900 },
    { faixa: 4, receitaAte: 1800000, aliquota: 0.205, deduzir: 17100 },
    { faixa: 5, receitaAte: 3600000, aliquota: 0.23, deduzir: 62100 },
    { faixa: 6, receitaAte: 4800000, aliquota: 0.305, deduzir: 540000 },
];

const INSS_PRO_LABORE_ALIQUOTA = 0.11;

/**
 * Calcula o imposto do Simples Nacional para um determinado faturamento.
 * @param {number} receitaBrutaAnual - A receita bruta acumulada nos últimos 12 meses.
 * @param {number} faturamentoMensal - O faturamento do mês atual.
 * @param {Array} tabelaAnexo - A tabela do anexo a ser utilizada (Anexo III ou Anexo V).
 * @returns {object} - Contém o valor do imposto e a alíquota efetiva.
 */
function calcularImpostoSimples(receitaBrutaAnual, faturamentoMensal, tabelaAnexo) {
    const faixa = tabelaAnexo.find(f => receitaBrutaAnual <= f.receitaAte);

    if (!faixa) {
        // Para faturamentos acima do limite do Simples Nacional.
        // A lógica de desenquadramento pode ser complexa. Por simplicidade, usamos a última faixa.
        const ultimaFaixa = tabelaAnexo[tabelaAnexo.length - 1];
        const aliquotaEfetivaMaxima = ((ultimaFaixa.receitaAte * ultimaFaixa.aliquota) - ultimaFaixa.deduzir) / ultimaFaixa.receitaAte;
        return {
            imposto: faturamentoMensal * aliquotaEfetivaMaxima,
            aliquotaEfetiva: aliquotaEfetivaMaxima,
        };
    }

    const aliquotaEfetiva = ((receitaBrutaAnual * faixa.aliquota) - faixa.deduzir) / receitaBrutaAnual;
    const impostoDevido = faturamentoMensal * aliquotaEfetiva;

    return {
        imposto: arredondar(impostoDevido),
        aliquotaEfetiva: arredondar(aliquotaEfetiva),
    };
}

/**
 * Calcula o rendimento líquido de um PJ.
 * @param {object} dados - Os dados para o cálculo.
 * @param {number} dados.faturamentoMensal - O faturamento bruto mensal.
 * @param {number} dados.proLabore - O valor do pró-labore mensal.
 * @param {number} dados.custoContador - O custo mensal com contabilidade.
 * @param {number} dados.outrosCustos - Outros custos mensais.
 * @returns {object} - Um objeto com o resultado detalhado do cálculo.
 */
export function calcularPJ(dados) {
    const { faturamentoMensal, proLabore, custoContador = 0, outrosCustos = 0 } = dados;

    if (!faturamentoMensal || faturamentoMensal <= 0) {
        return { erro: true, mensagem: "O faturamento mensal deve ser um valor positivo." };
    }
    if (proLabore === undefined || proLabore < 0) {
        return { erro: true, mensagem: "O pró-labore deve ser um valor não negativo." };
    }
    if (proLabore > faturamentoMensal) {
        return { erro: true, mensagem: "O pró-labore não pode ser maior que o faturamento." };
    }

    // Projeção anual para cálculo da alíquota efetiva
    const receitaBrutaAnual = faturamentoMensal * 12;

    // Cálculo do Fator R (simplificado para a calculadora)
    // Considera-se que a folha de pagamento é apenas o pró-labore.
    const fatorR = proLabore > 0 ? (proLabore / faturamentoMensal) : 0;
    const anexo = fatorR >= 0.28 ? ANEXO_III : ANEXO_V;
    const nomeAnexo = fatorR >= 0.28 ? "Anexo III" : "Anexo V";

    // 1. Cálculo do Imposto Simples Nacional
    const calculoSimples = calcularImpostoSimples(receitaBrutaAnual, faturamentoMensal, anexo);

    // 2. Cálculo do INSS sobre o Pró-Labore
    const inssProLabore = proLabore * INSS_PRO_LABORE_ALIQUOTA;

    // 3. Totalização de custos e rendimento líquido
    const totalCustos = calculoSimples.imposto + inssProLabore + custoContador + outrosCustos;
    const rendimentoLiquido = faturamentoMensal - totalCustos;

    return {
        erro: false,
        dados,
        resultado: {
            rendimentoLiquido: arredondar(rendimentoLiquido),
            faturamentoBruto: arredondar(faturamentoMensal),
            totalCustos: arredondar(totalCustos),
            detalhamento: {
                fatorR: arredondar(fatorR * 100),
                anexoUtilizado: nomeAnexo,
                impostoSimples: {
                    valor: calculoSimples.imposto,
                    aliquotaEfetiva: arredondar(calculoSimples.aliquotaEfetiva * 100),
                },
                inssProLabore: arredondar(inssProLabore),
                custoContador: arredondar(custoContador),
                outrosCustos: arredondar(outrosCustos),
            },
        },
    };
}
