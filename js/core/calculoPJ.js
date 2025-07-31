/**
 * Cálculo de Salário PJ - Calculadora Trabalhista
 *
 * Módulo responsável pelo cálculo de salário líquido para Pessoa Jurídica (PJ)
 * considerando o regime do Simples Nacional, Fator R, e impostos sobre o pró-labore.
 */

import {
    calcularINSS,
    calcularIRRF,
    calcularBaseIRRF,
    arredondar,
    validarValorPositivo
} from './regrasGerais.js';

import parametros from '../../config/parametrosLegais.js';

/**
 * Calcula a alíquota efetiva do Simples Nacional.
 * ((Receita Bruta Total 12 meses * Alíquota) - Parcela a Deduzir) / Receita Bruta Total 12 meses
 * @param {number} faturamentoAnual - O faturamento bruto dos últimos 12 meses.
 * @param {Array} anexo - A tabela do anexo do Simples Nacional a ser utilizada.
 * @returns {number} A alíquota efetiva.
 */
function calcularAliquotaEfetivaSimples(faturamentoAnual, anexo) {
    if (faturamentoAnual <= 0) return 0;

    const faixa = anexo.find(f => faturamentoAnual <= f.faixaAte);

    if (!faixa) {
        // Se não encontrar a faixa, pode ser que o valor exceda o limite do Simples.
        // Para esta calculadora, vamos usar a última faixa.
        const ultimaFaixa = anexo[anexo.length - 1];
        return ((faturamentoAnual * ultimaFaixa.aliquota) - ultimaFaixa.deducao) / faturamentoAnual;
    }

    const aliquotaEfetiva = ((faturamentoAnual * faixa.aliquota) - faixa.deducao) / faturamentoAnual;
    return Math.max(0, aliquotaEfetiva);
}


/**
 * Valida os dados de entrada para o cálculo PJ.
 * @param {Object} dados - Dados a serem validados.
 * @returns {Object} Objeto com status de validação e dados validados.
 */
function validarDadosPJ(dados) {
    if (!dados || typeof dados !== 'object') {
        return { valido: false, erro: 'Dados inválidos ou não informados' };
    }

    const { faturamentoMensal, proLabore = 0, despesasMensais = 0, numDependentes = 0 } = dados;

    if (!validarValorPositivo(faturamentoMensal) || faturamentoMensal <= 0) {
        return { valido: false, erro: 'Faturamento mensal deve ser um valor positivo.' };
    }
    if (!validarValorPositivo(proLabore)) {
        return { valido: false, erro: 'Pró-labore deve ser um valor não negativo.' };
    }
    if (!validarValorPositivo(despesasMensais)) {
        return { valido: false, erro: 'Despesas mensais devem ser um valor não negativo.' };
    }
    if (!Number.isInteger(numDependentes) || numDependentes < 0) {
        return { valido: false, erro: 'Número de dependentes deve ser um inteiro não negativo.' };
    }

    return {
        valido: true,
        dados: {
            faturamentoMensal: parseFloat(faturamentoMensal),
            proLabore: parseFloat(proLabore),
            despesasMensais: parseFloat(despesasMensais),
            numDependentes: parseInt(numDependentes)
        }
    };
}


/**
 * Calcula o salário líquido no modelo PJ
 * @param {Object} dados - Dados para cálculo do salário PJ
 * @param {number} dados.faturamentoMensal - Valor mensal do contrato PJ
 * @param {number} dados.proLabore - Valor do pró-labore mensal
 * @param {number} dados.despesasMensais - Outras despesas mensais da empresa (aluguel, software, etc.)
 * @param {number} dados.numDependentes - Número de dependentes para IRRF sobre o pró-labore.
 * @returns {Object} Resultado detalhado do cálculo
 */
export function calcularSalarioLiquidoPJ(dados) {
    const dadosValidados = validarDadosPJ(dados);
    if (!dadosValidados.valido) {
        return { erro: true, mensagem: dadosValidados.erro, resultado: null };
    }

    const { faturamentoMensal, proLabore, despesasMensais, numDependentes } = dadosValidados.dados;

    try {
        // 1. Calcular Fator R e determinar o anexo
        const faturamentoAnual = faturamentoMensal * 12;
        const fatorR = proLabore > 0 ? proLabore / faturamentoMensal : 0;
        const anexoUtilizado = fatorR >= parametros.parametrosPJ.FATOR_R_LIMITE
            ? parametros.tabelaSimplesNacionalAnexoIII
            : parametros.tabelaSimplesNacionalAnexoV;
        const nomeAnexo = fatorR >= parametros.parametrosPJ.FATOR_R_LIMITE ? 'Anexo III' : 'Anexo V';

        // 2. Calcular imposto do Simples Nacional
        const aliquotaEfetiva = calcularAliquotaEfetivaSimples(faturamentoAnual, anexoUtilizado);
        const impostoSimples = faturamentoMensal * aliquotaEfetiva;

        // 3. Calcular impostos sobre o Pró-labore
        // Nota: A regra de INSS para pró-labore é 11% sobre o valor, respeitando o teto.
        // A função `calcularINSS` é para CLT (progressiva), mas oferece uma boa aproximação.
        // Para simplificar e reutilizar, usaremos a função existente.
        const inssProLabore = proLabore > 0 ? calcularINSS(proLabore) : 0;
        const baseIRRFProLabore = proLabore > 0 ? calcularBaseIRRF(proLabore, inssProLabore, numDependentes) : 0;
        const irrfProLabore = proLabore > 0 ? calcularIRRF(baseIRRFProLabore) : 0;
        const proLaboreLiquido = proLabore - inssProLabore - irrfProLabore;

        // 4. Calcular o resultado final
        const totalDespesasEmpresa = impostoSimples + proLabore + despesasMensais;
        const lucroLiquidoEmpresa = faturamentoMensal - totalDespesasEmpresa;
        const rendimentoTotalLiquido = proLaboreLiquido + lucroLiquidoEmpresa;

        return {
            erro: false,
            dados: dadosValidados.dados,
            resultado: {
                rendimentoTotalLiquido: arredondar(rendimentoTotalLiquido),
                detalhamento: {
                    faturamentoBruto: arredondar(faturamentoMensal),
                    impostoSimples: arredondar(impostoSimples),
                    proLaboreBruto: arredondar(proLabore),
                    outrasDespesas: arredondar(despesasMensais),
                    lucroLiquidoEmpresa: arredondar(lucroLiquidoEmpresa),
                    proLaboreLiquido: arredondar(proLaboreLiquido),
                },
                impostos: {
                    total: arredondar(impostoSimples + inssProLabore + irrfProLabore),
                    impostoSimples: arredondar(impostoSimples),
                    inssProLabore: arredondar(inssProLabore),
                    irrfProLabore: arredondar(irrfProLabore),
                },
                contexto: {
                    fatorR: arredondar(fatorR * 100),
                    anexo: nomeAnexo,
                    aliquotaEfetiva: arredondar(aliquotaEfetiva * 100)
                }
            }
        };

    } catch (error) {
        return {
            erro: true,
            mensagem: `Erro no cálculo PJ: ${error.message}`,
            resultado: null
        };
    }
}

export default {
    calcularSalarioLiquidoPJ
};
