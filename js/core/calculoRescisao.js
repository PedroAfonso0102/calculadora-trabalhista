/**
 * Módulo de Cálculo de Rescisão
 * 
 * Orquestra o cálculo completo de rescisão contratual,
 * chamando os demais módulos conforme o tipo de rescisão.
 */

import { 
  calcularINSS, 
  calcularIRRF,
  calcularProporcionalidadeMeses,
  calcularDiasProporcionalidade,
  calcularDiasAvisoPrevio,
  formatarMoeda 
} from './regrasGerais.js';
import { calcularFerias } from './calculoFerias.js';
import { calcularDecimoTerceiro } from './calculoDecimo.js';
import PARAMETROS_LEGAIS from '../../config/parametrosLegais.js';

/**
 * Calcula rescisão contratual
 * @param {Object} dados - Dados para o cálculo
 * @param {number} dados.salarioBruto - Salário bruto
 * @param {string} dados.dataAdmissao - Data de admissão (YYYY-MM-DD)
 * @param {string} dados.dataSaida - Data de saída (YYYY-MM-DD)
 * @param {string} dados.motivoRescisao - Motivo da rescisão
 * @param {string} dados.avisoPrevio - Tipo de aviso prévio
 * @param {number} dados.feriasVencidas - Dias de férias vencidas
 * @param {number} dados.dependentes - Número de dependentes
 * @returns {Object} Resultado do cálculo
 */
export function calcularRescisao(dados) {
  const {
    salarioBruto,
    dataAdmissao,
    dataSaida,
    motivoRescisao,
    avisoPrevio = 'indenizado',
    feriasVencidas = 0,
    dependentes = 0
  } = dados;
  
  // Validações
  if (!salarioBruto || salarioBruto <= 0) {
    throw new Error('Salário bruto deve ser maior que zero');
  }
  
  if (!dataAdmissao || !dataSaida) {
    throw new Error('Datas de admissão e saída são obrigatórias');
  }
  
  const dataAdmissaoObj = new Date(dataAdmissao);
  const dataSaidaObj = new Date(dataSaida);
  
  if (dataAdmissaoObj >= dataSaidaObj) {
    throw new Error('Data de saída deve ser posterior à data de admissão');
  }
  
  // Cálculos básicos
  const tempoServicoMeses = calcularProporcionalidadeMeses(dataAdmissaoObj, dataSaidaObj);
  const diasAvisoPrevio = calcularDiasAvisoPrevio(dataAdmissaoObj, dataSaidaObj);
  
  // Data de saída projetada (para cálculo de proporcionalidades)
  const dataSaidaProjetada = new Date(dataSaidaObj);
  if (avisoPrevio === 'indenizado') {
    dataSaidaProjetada.setDate(dataSaidaProjetada.getDate() + diasAvisoPrevio);
  }
  
  // Inicializar resultado
  const resultado = {
    tipo: 'rescisao',
    dados: {
      salarioBruto,
      dataAdmissao,
      dataSaida,
      motivoRescisao,
      avisoPrevio,
      feriasVencidas,
      dependentes
    },
    informacoes: {
      tempoServico: {
        descricao: 'Tempo de Serviço',
        valor: tempoServicoMeses,
        valorFormatado: formatarTempoServico(tempoServicoMeses)
      },
      diasAvisoPrevio: {
        descricao: 'Dias de Aviso Prévio',
        valor: diasAvisoPrevio,
        valorFormatado: `${diasAvisoPrevio} dias`
      }
    },
    verbas: {},
    descontos: {},
    resumo: {},
    observacoes: []
  };
  
  // Calcular verbas conforme o motivo da rescisão
  switch (motivoRescisao) {
    case 'sem_justa_causa':
      calcularSemJustaCausa(resultado, dados, dataSaidaProjetada);
      break;
    case 'pedido_demissao':
      calcularPedidoDemissao(resultado, dados, dataSaidaProjetada);
      break;
    case 'acordo':
      calcularAcordo(resultado, dados, dataSaidaProjetada);
      break;
    case 'justa_causa':
      calcularJustaCausa(resultado, dados);
      break;
    case 'termino_contrato':
      calcularTerminoContrato(resultado, dados, dataSaidaProjetada);
      break;
    default:
      throw new Error('Motivo de rescisão inválido');
  }
  
  // Calcular totais finais
  calcularTotais(resultado);
  
  return resultado;
}

/**
 * Dispensa sem justa causa
 */
function calcularSemJustaCausa(resultado, dados, dataSaidaProjetada) {
  const { salarioBruto, dataAdmissao, dataSaida, feriasVencidas, dependentes } = dados;
  
  // Saldo de salário
  adicionarSaldoSalario(resultado, salarioBruto, dataSaida);
  
  // Aviso prévio indenizado
  adicionarAvisoPrevio(resultado, salarioBruto, resultado.informacoes.diasAvisoPrevio.valor);
  
  // 13º salário proporcional
  adicionarDecimoTerceiroProporcional(resultado, salarioBruto, dataAdmissao, dataSaidaProjetada, dependentes);
  
  // Férias
  adicionarFerias(resultado, salarioBruto, dataAdmissao, dataSaidaProjetada, feriasVencidas, dependentes);
  
  // Multa FGTS 40%
  adicionarMultaFGTS(resultado, salarioBruto, 0.40);
  
  resultado.observacoes.push(
    'Direito ao saque do FGTS',
    'Direito ao Seguro-Desemprego',
    'Aviso prévio indenizado não sofre descontos',
    'Multa de 40% sobre o FGTS'
  );
}

/**
 * Pedido de demissão
 */
function calcularPedidoDemissao(resultado, dados, dataSaidaProjetada) {
  const { salarioBruto, dataAdmissao, dataSaida, feriasVencidas, dependentes, avisoPrevio } = dados;
  
  // Saldo de salário
  adicionarSaldoSalario(resultado, salarioBruto, dataSaida);
  
  // Desconto do aviso prévio se não cumprido
  if (avisoPrevio === 'indenizado') {
    adicionarDescontoAvisoPrevio(resultado, salarioBruto, resultado.informacoes.diasAvisoPrevio.valor);
  }
  
  // 13º salário proporcional
  adicionarDecimoTerceiroProporcional(resultado, salarioBruto, dataAdmissao, dataSaidaProjetada, dependentes);
  
  // Férias
  adicionarFerias(resultado, salarioBruto, dataAdmissao, dataSaidaProjetada, feriasVencidas, dependentes);
  
  resultado.observacoes.push(
    'Não há direito ao saque do FGTS',
    'Não há direito ao Seguro-Desemprego',
    avisoPrevio === 'indenizado' ? 'Desconto do aviso prévio não cumprido' : null
  ).filter(Boolean);
}

/**
 * Acordo (demissão consensual)
 */
function calcularAcordo(resultado, dados, dataSaidaProjetada) {
  const { salarioBruto, dataAdmissao, dataSaida, feriasVencidas, dependentes } = dados;
  
  // Saldo de salário
  adicionarSaldoSalario(resultado, salarioBruto, dataSaida);
  
  // Aviso prévio pela metade
  const diasAvisoPrevio = resultado.informacoes.diasAvisoPrevio.valor;
  adicionarAvisoPrevio(resultado, salarioBruto, diasAvisoPrevio, 0.5);
  
  // 13º salário proporcional
  adicionarDecimoTerceiroProporcional(resultado, salarioBruto, dataAdmissao, dataSaidaProjetada, dependentes);
  
  // Férias
  adicionarFerias(resultado, salarioBruto, dataAdmissao, dataSaidaProjetada, feriasVencidas, dependentes);
  
  // Multa FGTS 20%
  adicionarMultaFGTS(resultado, salarioBruto, 0.20);
  
  resultado.observacoes.push(
    'Saque de 80% do FGTS',
    'Não há direito ao Seguro-Desemprego',
    'Aviso prévio reduzido pela metade',
    'Multa de 20% sobre o FGTS'
  );
}

/**
 * Dispensa por justa causa
 */
function calcularJustaCausa(resultado, dados) {
  const { salarioBruto, dataSaida, feriasVencidas, dependentes } = dados;
  
  // Apenas saldo de salário
  adicionarSaldoSalario(resultado, salarioBruto, dataSaida);
  
  // Férias vencidas (se houver)
  if (feriasVencidas > 0) {
    const valorFeriasVencidas = (salarioBruto / 30) * feriasVencidas;
    const tercoFeriasVencidas = valorFeriasVencidas * PARAMETROS_LEGAIS.tercoConstitucional;
    
    resultado.verbas.feriasVencidas = {
      descricao: 'Férias Vencidas',
      valor: valorFeriasVencidas,
      valorFormatado: formatarMoeda(valorFeriasVencidas)
    };
    
    resultado.verbas.tercoFeriasVencidas = {
      descricao: '1/3 de Férias Vencidas',
      valor: tercoFeriasVencidas,
      valorFormatado: formatarMoeda(tercoFeriasVencidas)
    };
    
    // Aplicar descontos sobre férias vencidas
    const baseFeriasVencidas = valorFeriasVencidas + tercoFeriasVencidas;
    const inssFeriasVencidas = calcularINSS(baseFeriasVencidas);
    const baseIrrfFerias = baseFeriasVencidas - inssFeriasVencidas;
    const irrfFeriasVencidas = calcularIRRF(baseIrrfFerias, dependentes);
    
    if (!resultado.descontos.inss) resultado.descontos.inss = { valor: 0 };
    if (!resultado.descontos.irrf) resultado.descontos.irrf = { valor: 0 };
    
    resultado.descontos.inss.valor += inssFeriasVencidas;
    resultado.descontos.irrf.valor += irrfFeriasVencidas;
  }
  
  resultado.observacoes.push(
    'Não há direito ao saque do FGTS',
    'Não há direito ao Seguro-Desemprego',
    'Não há direito a aviso prévio',
    'Não há direito a 13º salário e férias proporcionais',
    feriasVencidas > 0 ? 'Apenas férias já vencidas são devidas' : null
  ).filter(Boolean);
}

/**
 * Término de contrato
 */
function calcularTerminoContrato(resultado, dados, dataSaidaProjetada) {
  const { salarioBruto, dataAdmissao, dataSaida, feriasVencidas, dependentes } = dados;
  
  // Saldo de salário
  adicionarSaldoSalario(resultado, salarioBruto, dataSaida);
  
  // 13º salário proporcional
  adicionarDecimoTerceiroProporcional(resultado, salarioBruto, dataAdmissao, dataSaidaProjetada, dependentes);
  
  // Férias
  adicionarFerias(resultado, salarioBruto, dataAdmissao, dataSaidaProjetada, feriasVencidas, dependentes);
  
  resultado.observacoes.push(
    'Direito ao saque do FGTS',
    'Não há multa sobre o FGTS',
    'Não há direito ao Seguro-Desemprego',
    'Não há aviso prévio (fim natural do contrato)'
  );
}

/**
 * Funções auxiliares para adicionar verbas
 */
function adicionarSaldoSalario(resultado, salarioBruto, dataSaida) {
  const dataSaidaObj = new Date(dataSaida);
  const diasMes = new Date(dataSaidaObj.getFullYear(), dataSaidaObj.getMonth() + 1, 0).getDate();
  const diasTrabalhados = dataSaidaObj.getDate();
  const saldoSalario = (salarioBruto / diasMes) * diasTrabalhados;
  
  resultado.verbas.saldoSalario = {
    descricao: 'Saldo de Salário',
    valor: saldoSalario,
    valorFormatado: formatarMoeda(saldoSalario),
    detalhes: `${diasTrabalhados} dias trabalhados`
  };
  
  // Aplicar descontos
  const descontoINSS = calcularINSS(saldoSalario);
  const baseIRRF = saldoSalario - descontoINSS;
  const descontoIRRF = calcularIRRF(baseIRRF, resultado.dados.dependentes);
  
  if (!resultado.descontos.inss) {
    resultado.descontos.inss = {
      descricao: 'INSS',
      valor: descontoINSS,
      valorFormatado: formatarMoeda(descontoINSS)
    };
  } else {
    resultado.descontos.inss.valor += descontoINSS;
  }
  
  if (!resultado.descontos.irrf) {
    resultado.descontos.irrf = {
      descricao: 'IRRF',
      valor: descontoIRRF,
      valorFormatado: formatarMoeda(descontoIRRF)
    };
  } else {
    resultado.descontos.irrf.valor += descontoIRRF;
  }
}

function adicionarAvisoPrevio(resultado, salarioBruto, diasAviso, multiplicador = 1) {
  const valorAvisoPrevio = (salarioBruto / 30) * diasAviso * multiplicador;
  
  resultado.verbas.avisoPrevio = {
    descricao: multiplicador === 0.5 ? 'Aviso Prévio (50%)' : 'Aviso Prévio Indenizado',
    valor: valorAvisoPrevio,
    valorFormatado: formatarMoeda(valorAvisoPrevio),
    detalhes: `${diasAviso} dias${multiplicador === 0.5 ? ' × 50%' : ''}`
  };
}

function adicionarDescontoAvisoPrevio(resultado, salarioBruto, diasAviso) {
  const valorDesconto = (salarioBruto / 30) * diasAviso;
  
  resultado.descontos.avisoPrevio = {
    descricao: 'Desconto Aviso Prévio',
    valor: valorDesconto,
    valorFormatado: formatarMoeda(valorDesconto),
    detalhes: `${diasAviso} dias não cumpridos`
  };
}

function adicionarDecimoTerceiroProporcional(resultado, salarioBruto, dataAdmissao, dataSaidaProjetada, dependentes) {
  const anoAtual = new Date(dataSaidaProjetada).getFullYear();
  const inicioAno = new Date(anoAtual, 0, 1);
  const dataInicioCalculo = new Date(dataAdmissao) > inicioAno ? new Date(dataAdmissao) : inicioAno;
  
  const mesesTrabalhados = calcularProporcionalidadeMeses(dataInicioCalculo, dataSaidaProjetada);
  const valorDecimo = (salarioBruto / 12) * mesesTrabalhados;
  
  resultado.verbas.decimoTerceiro = {
    descricao: '13º Salário Proporcional',
    valor: valorDecimo,
    valorFormatado: formatarMoeda(valorDecimo),
    detalhes: `${mesesTrabalhados}/12 avos`
  };
  
  // Aplicar descontos
  const descontoINSS = calcularINSS(valorDecimo);
  const baseIRRF = valorDecimo - descontoINSS;
  const descontoIRRF = calcularIRRF(baseIRRF, dependentes);
  
  resultado.descontos.inss.valor += descontoINSS;
  resultado.descontos.irrf.valor += descontoIRRF;
}

function adicionarFerias(resultado, salarioBruto, dataAdmissao, dataSaidaProjetada, feriasVencidas, dependentes) {
  // Férias vencidas
  if (feriasVencidas > 0) {
    const valorFeriasVencidas = (salarioBruto / 30) * feriasVencidas;
    const tercoFeriasVencidas = valorFeriasVencidas * PARAMETROS_LEGAIS.tercoConstitucional;
    
    resultado.verbas.feriasVencidas = {
      descricao: 'Férias Vencidas',
      valor: valorFeriasVencidas,
      valorFormatado: formatarMoeda(valorFeriasVencidas)
    };
    
    resultado.verbas.tercoFeriasVencidas = {
      descricao: '1/3 de Férias Vencidas',
      valor: tercoFeriasVencidas,
      valorFormatado: formatarMoeda(tercoFeriasVencidas)
    };
    
    // Aplicar descontos
    const baseFeriasVencidas = valorFeriasVencidas + tercoFeriasVencidas;
    const inssFeriasVencidas = calcularINSS(baseFeriasVencidas);
    const baseIrrfFerias = baseFeriasVencidas - inssFeriasVencidas;
    const irrfFeriasVencidas = calcularIRRF(baseIrrfFerias, dependentes);
    
    resultado.descontos.inss.valor += inssFeriasVencidas;
    resultado.descontos.irrf.valor += irrfFeriasVencidas;
  }
  
  // Férias proporcionais
  const anoAtual = new Date(dataSaidaProjetada).getFullYear();
  const mesAtual = new Date(dataSaidaProjetada).getMonth();
  const inicioAnoOuUltimasFerias = new Date(anoAtual, mesAtual - 11, 1); // Aproximação
  
  const mesesProporcionais = calcularProporcionalidadeMeses(inicioAnoOuUltimasFerias, dataSaidaProjetada);
  const diasFeriasProporcionais = Math.floor((30 * mesesProporcionais) / 12);
  
  if (diasFeriasProporcionais > 0) {
    const valorFeriasProporcionais = (salarioBruto / 30) * diasFeriasProporcionais;
    const tercoFeriasProporcionais = valorFeriasProporcionais * PARAMETROS_LEGAIS.tercoConstitucional;
    
    resultado.verbas.feriasProporcionais = {
      descricao: 'Férias Proporcionais',
      valor: valorFeriasProporcionais,
      valorFormatado: formatarMoeda(valorFeriasProporcionais),
      detalhes: `${diasFeriasProporcionais} dias`
    };
    
    resultado.verbas.tercoFeriasProporcionais = {
      descricao: '1/3 de Férias Proporcionais',
      valor: tercoFeriasProporcionais,
      valorFormatado: formatarMoeda(tercoFeriasProporcionais)
    };
    
    // Aplicar descontos
    const baseFeriasProporcionais = valorFeriasProporcionais + tercoFeriasProporcionais;
    const inssFeriasProporcionais = calcularINSS(baseFeriasProporcionais);
    const baseIrrfFeriasP = baseFeriasProporcionais - inssFeriasProporcionais;
    const irrfFeriasProporcionais = calcularIRRF(baseIrrfFeriasP, dependentes);
    
    resultado.descontos.inss.valor += inssFeriasProporcionais;
    resultado.descontos.irrf.valor += irrfFeriasProporcionais;
  }
}

function adicionarMultaFGTS(resultado, salarioBruto, percentual) {
  // Estimativa da multa FGTS (8% sobre todos os salários × percentual)
  const estimativaDepositosFGTS = salarioBruto * resultado.informacoes.tempoServico.valor * 0.08;
  const multaFGTS = estimativaDepositosFGTS * percentual;
  
  resultado.verbas.multaFGTS = {
    descricao: `Multa FGTS (${percentual * 100}%)`,
    valor: multaFGTS,
    valorFormatado: formatarMoeda(multaFGTS),
    detalhes: 'Valor estimado'
  };
}

function calcularTotais(resultado) {
  const totalProventos = Object.values(resultado.verbas).reduce((total, verba) => total + verba.valor, 0);
  const totalDescontos = Object.values(resultado.descontos).reduce((total, desconto) => total + desconto.valor, 0);
  const valorLiquido = totalProventos - totalDescontos;
  
  // Atualizar formatação dos descontos
  Object.values(resultado.descontos).forEach(desconto => {
    desconto.valorFormatado = formatarMoeda(desconto.valor);
  });
  
  resultado.resumo = {
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
  };
}

function formatarTempoServico(meses) {
  const anos = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  
  const partes = [];
  if (anos > 0) partes.push(`${anos} ano${anos > 1 ? 's' : ''}`);
  if (mesesRestantes > 0) partes.push(`${mesesRestantes} mês${mesesRestantes > 1 ? 'es' : ''}`);
  
  return partes.join(' e ') || '0 meses';
}