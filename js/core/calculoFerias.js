/**
 * Cálculo de Férias - Calculadora Trabalhista
 * 
 * Módulo responsável pelo cálculo de férias, incluindo:
 * - Direito baseado em faltas injustificadas
 * - Terço constitucional
 * - Abono pecuniário (venda de férias)
 * - Descontos de INSS e IRRF
 */

import { 
    calcularINSS, 
    calcularIRRF, 
    calcularBaseIRRF, 
    calcularDireitoFerias,
    validarValorPositivo,
    arredondar
} from './regrasGerais.js';

import { getParametrosLegais } from '../../config/parametrosLegais.js';

const parametros = getParametrosLegais();

/**
 * Calcula as férias completas
 * @param {Object} dados - Dados para cálculo das férias
 * @param {number} dados.salarioBruto - Salário bruto atual
 * @param {number} dados.faltasInjustificadas - Faltas injustificadas no período aquisitivo
 * @param {number} dados.diasSolicitados - Dias de férias solicitados
 * @param {boolean} dados.venderFerias - Se deseja vender parte das férias (abono pecuniário)
 * @param {number} dados.diasVendidos - Dias a serem vendidos (máx. 1/3)
 * @param {number} dados.numDependentes - Dependentes para IRRF
 * @returns {Object} Resultado detalhado do cálculo
 */
export function calcularFerias(dados) {
    // Validação dos dados de entrada
    const dadosValidados = validarDadosFerias(dados);
    if (!dadosValidados.valido) {
        return {
            erro: true,
            mensagem: dadosValidados.erro,
            resultado: null
        };
    }

    const { 
        salarioBruto, 
        faltasInjustificadas, 
        diasSolicitados, 
        venderFerias,
        diasVendidos,
        numDependentes
    } = dadosValidados.dados;

    try {
        // Calcular direito a férias baseado nas faltas
        const diasDireito = calcularDireitoFerias(faltasInjustificadas);
        
        // Verificar se o número de dias solicitados é válido
        const diasEfetivos = Math.min(diasSolicitados, diasDireito);
        const diasParaGozo = venderFerias ? (diasEfetivos - diasVendidos) : diasEfetivos;
        
        // Validar abono pecuniário
        const maximoDiasVenda = Math.floor(diasDireito / 3);
        const diasVendaEfetivos = venderFerias ? Math.min(diasVendidos, maximoDiasVenda) : 0;

        // Cálculo dos valores das férias
        const valorDiario = salarioBruto / 30;
        const valorFerias = valorDiario * diasParaGozo;
        const tercoConstitucional = valorFerias / 3;
        
        // Cálculo do abono pecuniário (não tributável)
        const valorAbono = diasVendaEfetivos * valorDiario;
        const tercoAbono = valorAbono / 3;

        // Base de cálculo para INSS e IRRF (apenas férias + terço, não inclui abono)
        const baseTributavel = valorFerias + tercoConstitucional;
        
        // Cálculo dos descontos
        const descontoINSS = calcularINSS(baseTributavel);
        const baseIRRF = calcularBaseIRRF(baseTributavel, descontoINSS, numDependentes);
        const descontoIRRF = calcularIRRF(baseIRRF);

        // Cálculo dos totais
        const totalProventos = valorFerias + tercoConstitucional + valorAbono + tercoAbono;
        const totalDescontos = descontoINSS + descontoIRRF;
        const valorLiquido = totalProventos - totalDescontos;

        return {
            erro: false,
            dados: {
                salarioBruto,
                faltasInjustificadas,
                diasSolicitados,
                venderFerias,
                diasVendidos: diasVendaEfetivos,
                numDependentes
            },
            resultado: {
                direito: {
                    diasDireito,
                    diasEfetivos,
                    diasParaGozo,
                    diasVendidos: diasVendaEfetivos,
                    maximoDiasVenda
                },
                valores: {
                    valorDiario: arredondar(valorDiario),
                    valorFerias: arredondar(valorFerias),
                    tercoConstitucional: arredondar(tercoConstitucional),
                    valorAbono: arredondar(valorAbono),
                    tercoAbono: arredondar(tercoAbono)
                },
                tributos: {
                    baseTributavel: arredondar(baseTributavel),
                    descontoINSS: arredondar(descontoINSS),
                    descontoIRRF: arredondar(descontoIRRF),
                    baseIRRF: arredondar(baseIRRF)
                },
                resumo: {
                    totalProventos: arredondar(totalProventos),
                    totalDescontos: arredondar(totalDescontos),
                    valorLiquido: arredondar(valorLiquido)
                },
                alertas: gerarAlertasFerias(diasDireito, diasSolicitados, diasVendaEfetivos, maximoDiasVenda)
            }
        };

    } catch (error) {
        return {
            erro: true,
            mensagem: `Erro no cálculo: ${error.message}`,
            resultado: null
        };
    }
}

/**
 * Valida os dados de entrada para o cálculo de férias
 * @param {Object} dados - Dados a serem validados
 * @returns {Object} Resultado da validação
 */
function validarDadosFerias(dados) {
    if (!dados || typeof dados !== 'object') {
        return {
            valido: false,
            erro: 'Dados inválidos ou não informados'
        };
    }

    const { 
        salarioBruto, 
        faltasInjustificadas = 0, 
        diasSolicitados, 
        venderFerias = false,
        diasVendidos = 0,
        numDependentes = 0
    } = dados;

    // Validação do salário bruto
    if (!validarValorPositivo(salarioBruto) || salarioBruto <= 0) {
        return {
            valido: false,
            erro: 'Salário bruto deve ser um valor positivo'
        };
    }

    // Validação das faltas injustificadas
    if (!Number.isInteger(faltasInjustificadas) || faltasInjustificadas < 0) {
        return {
            valido: false,
            erro: 'Faltas injustificadas deve ser um número inteiro não negativo'
        };
    }

    // Validação dos dias solicitados
    if (!Number.isInteger(diasSolicitados) || diasSolicitados <= 0 || diasSolicitados > 30) {
        return {
            valido: false,
            erro: 'Dias solicitados deve ser um número inteiro entre 1 e 30'
        };
    }

    // Validação dos dias vendidos
    if (venderFerias) {
        if (!Number.isInteger(diasVendidos) || diasVendidos <= 0) {
            return {
                valido: false,
                erro: 'Dias vendidos deve ser um número inteiro positivo quando vender férias for selecionado'
            };
        }
        
        if (diasVendidos > 10) { // Máximo 1/3 de 30 dias
            return {
                valido: false,
                erro: 'Máximo de 10 dias podem ser vendidos (1/3 das férias)'
            };
        }
        
        if ((diasSolicitados - diasVendidos) < 10) {
            return {
                valido: false,
                erro: 'Deve gozar pelo menos 10 dias de férias'
            };
        }
    }

    // Validação do número de dependentes
    if (!Number.isInteger(numDependentes) || numDependentes < 0) {
        return {
            valido: false,
            erro: 'Número de dependentes deve ser um número inteiro não negativo'
        };
    }

    return {
        valido: true,
        dados: {
            salarioBruto: parseFloat(salarioBruto),
            faltasInjustificadas: parseInt(faltasInjustificadas),
            diasSolicitados: parseInt(diasSolicitados),
            venderFerias: Boolean(venderFerias),
            diasVendidos: parseInt(diasVendidos),
            numDependentes: parseInt(numDependentes)
        }
    };
}

/**
 * Gera alertas e validações para o cálculo de férias
 * @param {number} diasDireito - Dias de direito baseado nas faltas
 * @param {number} diasSolicitados - Dias solicitados
 * @param {number} diasVendidos - Dias vendidos
 * @param {number} maximoDiasVenda - Máximo de dias que pode vender
 * @returns {Array} Array de alertas
 */
function gerarAlertasFerias(diasDireito, diasSolicitados, diasVendidos, maximoDiasVenda) {
    const alertas = [];

    if (diasDireito < 30) {
        alertas.push({
            tipo: 'warning',
            mensagem: `Direito reduzido: ${diasDireito} dias devido a faltas injustificadas`
        });
    }

    if (diasSolicitados > diasDireito) {
        alertas.push({
            tipo: 'error',
            mensagem: `Dias solicitados (${diasSolicitados}) excedem o direito (${diasDireito})`
        });
    }

    if (diasVendidos > maximoDiasVenda) {
        alertas.push({
            tipo: 'error',
            mensagem: `Dias para venda (${diasVendidos}) excedem o máximo permitido (${maximoDiasVenda})`
        });
    }

    if (diasVendidos > 0) {
        alertas.push({
            tipo: 'info',
            mensagem: `Abono pecuniário não sofre desconto de INSS nem IRRF`
        });
    }

    return alertas;
}

/**
 * Simula diferentes cenários de férias
 * @param {number} salarioBase - Salário base para simulação
 * @param {Array} cenarios - Array de cenários
 * @returns {Array} Array com resultados dos cenários
 */
export function simularCenariosFerias(salarioBase, cenarios) {
    if (!validarValorPositivo(salarioBase) || !Array.isArray(cenarios)) {
        return [];
    }

    return cenarios.map((cenario, index) => {
        const dadosCalculo = {
            salarioBruto: salarioBase,
            faltasInjustificadas: cenario.faltas || 0,
            diasSolicitados: cenario.dias || 30,
            venderFerias: cenario.venderFerias || false,
            diasVendidos: cenario.diasVendidos || 0,
            numDependentes: cenario.dependentes || 0
        };

        const resultado = calcularFerias(dadosCalculo);

        return {
            cenario: index + 1,
            descricao: cenario.descricao || `Cenário ${index + 1}`,
            parametros: cenario,
            calculo: resultado
        };
    });
}

/**
 * Gera relatório detalhado do cálculo de férias
 * @param {Object} resultado - Resultado do cálculo de férias
 * @returns {Object} Relatório formatado
 */
export function gerarRelatorioFerias(resultado) {
    if (!resultado || resultado.erro) {
        return null;
    }

    const { dados, resultado: calc } = resultado;

    return {
        titulo: 'Demonstrativo de Férias',
        periodo: 'Período Aquisitivo',
        dadosEntrada: {
            'Salário Base': `R$ ${calc.valores.valorDiario * 30}`,
            'Faltas Injustificadas': dados.faltasInjustificadas.toString(),
            'Dias Solicitados': dados.diasSolicitados.toString(),
            'Vender Férias': dados.venderFerias ? 'Sim' : 'Não',
            'Dias Vendidos': dados.diasVendidos.toString()
        },
        direitos: {
            'Dias de Direito': calc.direito.diasDireito.toString() + ' dias',
            'Dias para Gozo': calc.direito.diasParaGozo.toString() + ' dias',
            'Dias Vendidos': calc.direito.diasVendidos.toString() + ' dias',
            'Valor Diário': `R$ ${calc.valores.valorDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        },
        discriminacao: {
            proventos: [
                {
                    item: 'Férias',
                    valor: calc.valores.valorFerias,
                    observacao: `${calc.direito.diasParaGozo} dias`
                },
                {
                    item: '1/3 Constitucional',
                    valor: calc.valores.tercoConstitucional,
                    observacao: 'CF/88, Art. 7º, XVII'
                },
                {
                    item: 'Abono Pecuniário',
                    valor: calc.valores.valorAbono,
                    observacao: `${calc.direito.diasVendidos} dias vendidos`
                },
                {
                    item: '1/3 sobre Abono',
                    valor: calc.valores.tercoAbono,
                    observacao: 'Não tributável'
                }
            ],
            descontos: [
                {
                    item: 'INSS',
                    valor: calc.tributos.descontoINSS,
                    observacao: `Base: R$ ${calc.tributos.baseTributavel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                },
                {
                    item: 'IRRF',
                    valor: calc.tributos.descontoIRRF,
                    observacao: `${dados.numDependentes} dependente(s)`
                }
            ]
        },
        resumo: {
            totalProventos: calc.resumo.totalProventos,
            totalDescontos: calc.resumo.totalDescontos,
            valorLiquido: calc.resumo.valorLiquido
        },
        observacoes: [
            'Abono pecuniário não sofre incidência de INSS nem IRRF',
            'Base de cálculo para tributos: Férias + 1/3 Constitucional',
            'Direito a férias baseado na tabela do Art. 130 da CLT'
        ]
    };
}

// Exportação default
export default {
    calcularFerias,
    simularCenariosFerias,
    gerarRelatorioFerias
};