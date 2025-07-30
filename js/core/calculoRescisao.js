/**
 * Cálculo de Rescisão - Calculadora Trabalhista
 * 
 * Módulo principal (orquestrador) responsável pelo cálculo de rescisão trabalhista.
 * Implementa os diferentes fluxos baseados no motivo da rescisão.
 */

import { 
    calcularINSS, 
    calcularIRRF, 
    calcularBaseIRRF,
    calcularMesesProporcionais,
    calcularDiasTrabalhados,
    calcularSaldoSalario,
    calcularDireitoFerias,
    calcularDiasAvisoPrevio,
    projetarDataComAviso,
    validarData,
    validarValorPositivo,
    arredondar
} from './regrasGerais.js';

import { getParametrosLegais } from '../../config/parametrosLegais.js';

const parametros = getParametrosLegais();

/**
 * Calcula a rescisão trabalhista completa
 * @param {Object} dados - Dados para cálculo da rescisão
 * @returns {Object} Resultado detalhado do cálculo
 */
export function calcularRescisao(dados) {
    // Validação dos dados de entrada
    const dadosValidados = validarDadosRescisao(dados);
    if (!dadosValidados.valido) {
        return {
            erro: true,
            mensagem: dadosValidados.erro,
            resultado: null
        };
    }

    const dadosRescisao = dadosValidados.dados;

    try {
        // Determina o fluxo de cálculo baseado no motivo da rescisão
        switch (dadosRescisao.motivoRescisao) {
            case 'sem_justa_causa':
                return calcularDispensaSemJustaCausa(dadosRescisao);
            
            case 'pedido_demissao':
                return calcularPedidoDemissao(dadosRescisao);
            
            case 'acordo_mutual':
                return calcularAcordoMutuo(dadosRescisao);
            
            case 'justa_causa':
                return calcularDispensaJustaCausa(dadosRescisao);
            
            case 'termino_contrato':
                return calcularTerminoContrato(dadosRescisao);
            
            default:
                return {
                    erro: true,
                    mensagem: 'Motivo de rescisão não reconhecido',
                    resultado: null
                };
        }

    } catch (error) {
        return {
            erro: true,
            mensagem: `Erro no cálculo: ${error.message}`,
            resultado: null
        };
    }
}

/**
 * Calcula rescisão por dispensa sem justa causa
 */
function calcularDispensaSemJustaCausa(dados) {
    const {
        salarioBruto,
        dataAdmissao,
        dataRescisao,
        faltasInjustificadas,
        numDependentes,
        saldoFGTS,
        temFeriasVencidas,
        diasFeriasVencidas
    } = dados;

    // Cálculo de anos de serviço para aviso prévio
    const anosServico = calcularAnosServico(dataAdmissao, dataRescisao);
    const diasAvisoPrevio = calcularDiasAvisoPrevio(anosServico);
    
    // Projeção da data com aviso prévio
    const dataSaidaProjetada = projetarDataComAviso(dataRescisao, diasAvisoPrevio);

    // Cálculo do saldo de salário
    const diasMesRescisao = new Date(dataRescisao.getFullYear(), dataRescisao.getMonth() + 1, 0).getDate();
    const diasTrabalhados = dataRescisao.getDate();
    const saldoSalario = calcularSaldoSalario(salarioBruto, diasTrabalhados, diasMesRescisao);

    // Cálculo do aviso prévio indenizado
    const avisoPrevia = (salarioBruto / 30) * diasAvisoPrevio;

    // Cálculo do 13º proporcional (incluindo projeção do aviso)
    const meses13 = calcularMesesProporcionais(
        new Date(dataSaidaProjetada.getFullYear(), 0, 1),
        dataSaidaProjetada
    );
    const decimoTerceiro = (salarioBruto / 12) * meses13;

    // Cálculo de férias vencidas
    const feriasVencidas = temFeriasVencidas ? 
        (salarioBruto / 30) * diasFeriasVencidas : 0;
    const tercoFeriasVencidas = feriasVencidas / 3;

    // Cálculo de férias proporcionais (incluindo projeção do aviso)
    const direitoFeriasProporcionais = calcularDireitoFerias(faltasInjustificadas);
    const mesesFerias = calcularMesesProporcionais(
        calcularInicioFeriasProporcionais(dataAdmissao, dataSaidaProjetada),
        dataSaidaProjetada
    );
    const feriasProporcionais = (salarioBruto / 12) * mesesFerias;
    const tercoFeriasProporcionais = feriasProporcionais / 3;

    // Multa FGTS 40%
    const multaFGTS = saldoFGTS * parametros.parametrosFGTS.MULTA_DEMISSAO_SEM_JUSTA_CAUSA;

    // Cálculo dos tributos
    const tributos = calcularTributosRescisao({
        saldoSalario,
        decimoTerceiro,
        feriasVencidas,
        tercoFeriasVencidas,
        feriasProporcionais,
        tercoFeriasProporcionais,
        numDependentes
    });

    // Montagem do resultado
    const proventos = {
        saldoSalario: arredondar(saldoSalario),
        avisoPrevia: arredondar(avisoPrevia),
        decimoTerceiro: arredondar(decimoTerceiro),
        feriasVencidas: arredondar(feriasVencidas),
        tercoFeriasVencidas: arredondar(tercoFeriasVencidas),
        feriasProporcionais: arredondar(feriasProporcionais),
        tercoFeriasProporcionais: arredondar(tercoFeriasProporcionais),
        multaFGTS: arredondar(multaFGTS)
    };

    const descontos = {
        inss: arredondar(tributos.totalINSS),
        irrf: arredondar(tributos.totalIRRF)
    };

    const totalProventos = Object.values(proventos).reduce((sum, val) => sum + val, 0);
    const totalDescontos = Object.values(descontos).reduce((sum, val) => sum + val, 0);

    return {
        erro: false,
        dados,
        resultado: {
            motivoRescisao: 'sem_justa_causa',
            proventos,
            descontos,
            resumo: {
                totalProventos: arredondar(totalProventos),
                totalDescontos: arredondar(totalDescontos),
                valorLiquido: arredondar(totalProventos - totalDescontos)
            },
            informacoes: {
                diasAvisoPrevio,
                dataSaidaProjetada,
                anosServico,
                meses13,
                direitoFGTS: 'Saque total permitido',
                seguroDesemprego: 'Tem direito'
            },
            detalhamentoTributos: tributos.detalhamento
        }
    };
}

/**
 * Calcula rescisão por pedido de demissão
 */
function calcularPedidoDemissao(dados) {
    const {
        salarioBruto,
        dataAdmissao,
        dataRescisao,
        numDependentes,
        temFeriasVencidas,
        diasFeriasVencidas,
        cumpriuAvisoPrevio,
        faltasInjustificadas
    } = dados;

    // Cálculo do saldo de salário
    const diasMesRescisao = new Date(dataRescisao.getFullYear(), dataRescisao.getMonth() + 1, 0).getDate();
    const diasTrabalhados = dataRescisao.getDate();
    const saldoSalario = calcularSaldoSalario(salarioBruto, diasTrabalhados, diasMesRescisao);

    // Cálculo do 13º proporcional
    const meses13 = calcularMesesProporcionais(
        new Date(dataRescisao.getFullYear(), 0, 1),
        dataRescisao
    );
    const decimoTerceiro = (salarioBruto / 12) * meses13;

    // Cálculo de férias vencidas
    const feriasVencidas = temFeriasVencidas ? 
        (salarioBruto / 30) * diasFeriasVencidas : 0;
    const tercoFeriasVencidas = feriasVencidas / 3;

    // Cálculo de férias proporcionais
    const mesesFerias = calcularMesesProporcionais(
        calcularInicioFeriasProporcionais(dataAdmissao, dataRescisao),
        dataRescisao
    );
    const feriasProporcionais = (salarioBruto / 12) * mesesFerias;
    const tercoFeriasProporcionais = feriasProporcionais / 3;

    // Desconto do aviso prévio se não cumprido
    const anosServico = calcularAnosServico(dataAdmissao, dataRescisao);
    const diasAvisoPrevio = calcularDiasAvisoPrevio(anosServico);
    const descontoAvisoPrevio = !cumpriuAvisoPrevio ? 
        (salarioBruto / 30) * diasAvisoPrevio : 0;

    // Cálculo dos tributos
    const tributos = calcularTributosRescisao({
        saldoSalario,
        decimoTerceiro,
        feriasVencidas,
        tercoFeriasVencidas,
        feriasProporcionais,
        tercoFeriasProporcionais,
        numDependentes
    });

    // Montagem do resultado
    const proventos = {
        saldoSalario: arredondar(saldoSalario),
        decimoTerceiro: arredondar(decimoTerceiro),
        feriasVencidas: arredondar(feriasVencidas),
        tercoFeriasVencidas: arredondar(tercoFeriasVencidas),
        feriasProporcionais: arredondar(feriasProporcionais),
        tercoFeriasProporcionais: arredondar(tercoFeriasProporcionais)
    };

    const descontos = {
        inss: arredondar(tributos.totalINSS),
        irrf: arredondar(tributos.totalIRRF),
        descontoAvisoPrevio: arredondar(descontoAvisoPrevio)
    };

    const totalProventos = Object.values(proventos).reduce((sum, val) => sum + val, 0);
    const totalDescontos = Object.values(descontos).reduce((sum, val) => sum + val, 0);

    return {
        erro: false,
        dados,
        resultado: {
            motivoRescisao: 'pedido_demissao',
            proventos,
            descontos,
            resumo: {
                totalProventos: arredondar(totalProventos),
                totalDescontos: arredondar(totalDescontos),
                valorLiquido: arredondar(totalProventos - totalDescontos)
            },
            informacoes: {
                diasAvisoPrevio,
                cumpriuAvisoPrevio,
                direitoFGTS: 'Sem saque (mantém conta)',
                seguroDesemprego: 'Não tem direito',
                multaFGTS: 'Não aplicável'
            },
            detalhamentoTributos: tributos.detalhamento
        }
    };
}

/**
 * Calcula rescisão por acordo mútuo
 */
function calcularAcordoMutuo(dados) {
    const {
        salarioBruto,
        dataAdmissao,
        dataRescisao,
        faltasInjustificadas,
        numDependentes,
        saldoFGTS,
        temFeriasVencidas,
        diasFeriasVencidas
    } = dados;

    // Similar à dispensa sem justa causa, mas com algumas diferenças
    const anosServico = calcularAnosServico(dataAdmissao, dataRescisao);
    const diasAvisoPrevio = calcularDiasAvisoPrevio(anosServico);
    
    // No acordo, o aviso prévio é pela metade
    const avisoPrevia = (salarioBruto / 30) * diasAvisoPrevio * 0.5;

    // Demais cálculos similares à dispensa sem justa causa
    const diasMesRescisao = new Date(dataRescisao.getFullYear(), dataRescisao.getMonth() + 1, 0).getDate();
    const diasTrabalhados = dataRescisao.getDate();
    const saldoSalario = calcularSaldoSalario(salarioBruto, diasTrabalhados, diasMesRescisao);

    const meses13 = calcularMesesProporcionais(
        new Date(dataRescisao.getFullYear(), 0, 1),
        dataRescisao
    );
    const decimoTerceiro = (salarioBruto / 12) * meses13;

    const feriasVencidas = temFeriasVencidas ? 
        (salarioBruto / 30) * diasFeriasVencidas : 0;
    const tercoFeriasVencidas = feriasVencidas / 3;

    const mesesFerias = calcularMesesProporcionais(
        calcularInicioFeriasProporcionais(dataAdmissao, dataRescisao),
        dataRescisao
    );
    const feriasProporcionais = (salarioBruto / 12) * mesesFerias;
    const tercoFeriasProporcionais = feriasProporcionais / 3;

    // Multa FGTS 20% (metade da normal)
    const multaFGTS = saldoFGTS * parametros.parametrosFGTS.MULTA_ACORDO_MUTUAL;

    // Cálculo dos tributos
    const tributos = calcularTributosRescisao({
        saldoSalario,
        decimoTerceiro,
        feriasVencidas,
        tercoFeriasVencidas,
        feriasProporcionais,
        tercoFeriasProporcionais,
        numDependentes
    });

    const proventos = {
        saldoSalario: arredondar(saldoSalario),
        avisoPrevia: arredondar(avisoPrevia),
        decimoTerceiro: arredondar(decimoTerceiro),
        feriasVencidas: arredondar(feriasVencidas),
        tercoFeriasVencidas: arredondar(tercoFeriasVencidas),
        feriasProporcionais: arredondar(feriasProporcionais),
        tercoFeriasProporcionais: arredondar(tercoFeriasProporcionais),
        multaFGTS: arredondar(multaFGTS)
    };

    const descontos = {
        inss: arredondar(tributos.totalINSS),
        irrf: arredondar(tributos.totalIRRF)
    };

    const totalProventos = Object.values(proventos).reduce((sum, val) => sum + val, 0);
    const totalDescontos = Object.values(descontos).reduce((sum, val) => sum + val, 0);

    return {
        erro: false,
        dados,
        resultado: {
            motivoRescisao: 'acordo_mutual',
            proventos,
            descontos,
            resumo: {
                totalProventos: arredondar(totalProventos),
                totalDescontos: arredondar(totalDescontos),
                valorLiquido: arredondar(totalProventos - totalDescontos)
            },
            informacoes: {
                diasAvisoPrevio: diasAvisoPrevio / 2,
                direitoFGTS: 'Saque de 80% permitido',
                seguroDesemprego: 'Não tem direito',
                multaFGTS: '20% (metade da normal)'
            },
            detalhamentoTributos: tributos.detalhamento
        }
    };
}

/**
 * Calcula rescisão por justa causa
 */
function calcularDispensaJustaCausa(dados) {
    const {
        salarioBruto,
        dataRescisao,
        numDependentes,
        temFeriasVencidas,
        diasFeriasVencidas
    } = dados;

    // Apenas saldo de salário e férias vencidas (se houver)
    const diasMesRescisao = new Date(dataRescisao.getFullYear(), dataRescisao.getMonth() + 1, 0).getDate();
    const diasTrabalhados = dataRescisao.getDate();
    const saldoSalario = calcularSaldoSalario(salarioBruto, diasTrabalhados, diasMesRescisao);

    const feriasVencidas = temFeriasVencidas ? 
        (salarioBruto / 30) * diasFeriasVencidas : 0;
    const tercoFeriasVencidas = feriasVencidas / 3;

    // Cálculo dos tributos apenas sobre o que é devido
    const tributos = calcularTributosRescisao({
        saldoSalario,
        feriasVencidas,
        tercoFeriasVencidas,
        numDependentes,
        decimoTerceiro: 0,
        feriasProporcionais: 0,
        tercoFeriasProporcionais: 0
    });

    const proventos = {
        saldoSalario: arredondar(saldoSalario),
        feriasVencidas: arredondar(feriasVencidas),
        tercoFeriasVencidas: arredondar(tercoFeriasVencidas)
    };

    const descontos = {
        inss: arredondar(tributos.totalINSS),
        irrf: arredondar(tributos.totalIRRF)
    };

    const totalProventos = Object.values(proventos).reduce((sum, val) => sum + val, 0);
    const totalDescontos = Object.values(descontos).reduce((sum, val) => sum + val, 0);

    return {
        erro: false,
        dados,
        resultado: {
            motivoRescisao: 'justa_causa',
            proventos,
            descontos,
            resumo: {
                totalProventos: arredondar(totalProventos),
                totalDescontos: arredondar(totalDescontos),
                valorLiquido: arredondar(totalProventos - totalDescontos)
            },
            informacoes: {
                direitoFGTS: 'Sem saque nem multa',
                seguroDesemprego: 'Não tem direito',
                observacao: 'Direitos reduzidos devido à falta grave'
            },
            detalhamentoTributos: tributos.detalhamento
        }
    };
}

/**
 * Calcula rescisão por término de contrato
 */
function calcularTerminoContrato(dados) {
    // Similar à dispensa sem justa causa, mas sem aviso prévio e sem multa FGTS
    const resultado = calcularDispensaSemJustaCausa(dados);
    
    if (!resultado.erro) {
        // Remove aviso prévio
        delete resultado.resultado.proventos.avisoPrevia;
        
        // Remove multa FGTS
        delete resultado.resultado.proventos.multaFGTS;
        
        // Atualiza informações
        resultado.resultado.motivoRescisao = 'termino_contrato';
        resultado.resultado.informacoes = {
            direitoFGTS: 'Saque total permitido',
            seguroDesemprego: 'Tem direito',
            avisoPrevia: 'Não aplicável (término natural)',
            multaFGTS: 'Não aplicável'
        };

        // Recalcula totais
        const totalProventos = Object.values(resultado.resultado.proventos)
            .reduce((sum, val) => sum + val, 0);
        
        resultado.resultado.resumo.totalProventos = arredondar(totalProventos);
        resultado.resultado.resumo.valorLiquido = arredondar(
            totalProventos - resultado.resultado.resumo.totalDescontos
        );
    }

    return resultado;
}

/**
 * Calcula os tributos (INSS e IRRF) sobre as verbas da rescisão
 */
function calcularTributosRescisao(verbas) {
    const { numDependentes, ...valoresVerbas } = verbas;

    // INSS é calculado sobre cada verba separadamente
    const inssValues = {};
    let totalINSS = 0;

    // IRRF é calculado sobre a base total
    let baseTotalIRRF = 0;

    for (const [verba, valor] of Object.entries(valoresVerbas)) {
        if (valor > 0) {
            const inssVerba = calcularINSS(valor);
            inssValues[verba] = inssVerba;
            totalINSS += inssVerba;
            baseTotalIRRF += valor;
        }
    }

    const baseIRRF = calcularBaseIRRF(baseTotalIRRF, totalINSS, numDependentes);
    const totalIRRF = calcularIRRF(baseIRRF);

    return {
        totalINSS,
        totalIRRF,
        detalhamento: {
            inssDetalhado: inssValues,
            baseTotalIRRF,
            baseCalculoIRRF: baseIRRF,
            deducaoDependentes: numDependentes * 189.59
        }
    };
}

/**
 * Calcula anos de serviço entre duas datas
 */
function calcularAnosServico(dataAdmissao, dataRescisao) {
    const diffTime = dataRescisao - dataAdmissao;
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears);
}

/**
 * Calcula o início do período aquisitivo de férias proporcionais
 */
function calcularInicioFeriasProporcionais(dataAdmissao, dataRescisao) {
    const inicioUltimoPeriodo = new Date(dataAdmissao);
    
    // Adiciona anos completos
    const anosCompletos = calcularAnosServico(dataAdmissao, dataRescisao);
    inicioUltimoPeriodo.setFullYear(inicioUltimoPeriodo.getFullYear() + anosCompletos);
    
    return inicioUltimoPeriodo;
}

/**
 * Valida os dados de entrada para o cálculo de rescisão
 */
function validarDadosRescisao(dados) {
    if (!dados || typeof dados !== 'object') {
        return {
            valido: false,
            erro: 'Dados inválidos ou não informados'
        };
    }

    const camposObrigatorios = [
        'salarioBruto',
        'dataAdmissao', 
        'dataRescisao',
        'motivoRescisao'
    ];

    for (const campo of camposObrigatorios) {
        if (!dados[campo]) {
            return {
                valido: false,
                erro: `Campo obrigatório não informado: ${campo}`
            };
        }
    }

    // Validação do salário
    if (!validarValorPositivo(dados.salarioBruto) || dados.salarioBruto <= 0) {
        return {
            valido: false,
            erro: 'Salário bruto deve ser um valor positivo'
        };
    }

    // Validação das datas
    if (!validarData(dados.dataAdmissao) || !validarData(dados.dataRescisao)) {
        return {
            valido: false,
            erro: 'Datas de admissão e rescisão devem ser válidas'
        };
    }

    if (dados.dataAdmissao >= dados.dataRescisao) {
        return {
            valido: false,
            erro: 'Data de admissão deve ser anterior à data de rescisão'
        };
    }

    // Aplicar valores padrão
    const dadosCompletos = {
        ...dados,
        faltasInjustificadas: dados.faltasInjustificadas || 0,
        numDependentes: dados.numDependentes || 0,
        saldoFGTS: dados.saldoFGTS || 0,
        temFeriasVencidas: dados.temFeriasVencidas || false,
        diasFeriasVencidas: dados.diasFeriasVencidas || 0,
        cumpriuAvisoPrevio: dados.cumpriuAvisoPrevio !== false
    };

    return {
        valido: true,
        dados: dadosCompletos
    };
}

// Exportação default
export default {
    calcularRescisao
};