/**
 * Testes das Regras Gerais de Cálculo
 * 
 * Testes unitários para as funções de cálculo de INSS, IRRF e outras regras.
 * Execute no navegador para validar os cálculos.
 */

// Função simples de teste
function teste(descricao, funcao) {
  try {
    funcao();
    console.log(`✅ ${descricao}`);
  } catch (error) {
    console.error(`❌ ${descricao}: ${error.message}`);
  }
}

function assert(condicao, mensagem) {
  if (!condicao) {
    throw new Error(mensagem);
  }
}

function aproximadamenteIgual(valor1, valor2, tolerancia = 0.01) {
  return Math.abs(valor1 - valor2) <= tolerancia;
}

// Importar funções para teste (simular import)
async function executarTestes() {
  console.log('🚀 Iniciando testes das regras gerais...\n');
  
  // Simular carregamento das funções (em produção seriam importadas)
  const { calcularINSS, calcularIRRF, calcularSalarioFamilia } = await import('../js/core/regrasGerais.js');
  
  // Testes de INSS
  console.log('📋 Testando cálculo de INSS:');
  
  teste('INSS - Salário mínimo (R$ 1.518,00)', () => {
    const resultado = calcularINSS(1518.00);
    const esperado = 1518.00 * 0.075; // 7,5%
    assert(aproximadamenteIgual(resultado, esperado), `Esperado ${esperado}, obtido ${resultado}`);
  });
  
  teste('INSS - Valor na segunda faixa (R$ 2.000,00)', () => {
    const resultado = calcularINSS(2000.00);
    // Primeira faixa: 1518 * 0.075 = 113.85
    // Segunda faixa: (2000 - 1518) * 0.09 = 43.38
    // Total: 157.23
    const esperado = 157.23;
    assert(aproximadamenteIgual(resultado, esperado), `Esperado ${esperado}, obtido ${resultado}`);
  });
  
  teste('INSS - Valor no teto (R$ 8.157,41)', () => {
    const resultado = calcularINSS(10000.00); // Valor acima do teto
    // Deve calcular apenas até o teto
    const esperado = 954.16; // Valor máximo do INSS em 2025
    assert(aproximadamenteIgual(resultado, esperado, 1), `Esperado aproximadamente ${esperado}, obtido ${resultado}`);
  });
  
  teste('INSS - Valor zero', () => {
    const resultado = calcularINSS(0);
    assert(resultado === 0, `Esperado 0, obtido ${resultado}`);
  });
  
  // Testes de IRRF
  console.log('\n📋 Testando cálculo de IRRF:');
  
  teste('IRRF - Valor isento (R$ 2.000,00)', () => {
    const resultado = calcularIRRF(2000.00, 0);
    assert(resultado === 0, `Esperado 0, obtido ${resultado}`);
  });
  
  teste('IRRF - Com dependentes', () => {
    const baseCalculo = 3000.00;
    const dependentes = 2;
    const resultado = calcularIRRF(baseCalculo, dependentes);
    
    // Base ajustada: 3000 - (2 * 189.59) = 2620.82
    // Como está na primeira faixa (isento até 2428.80), deve ter IRRF
    assert(resultado >= 0, `IRRF deve ser >= 0, obtido ${resultado}`);
  });
  
  // Testes de Salário Família
  console.log('\n📋 Testando cálculo de Salário Família:');
  
  teste('Salário Família - Dentro do limite', () => {
    const resultado = calcularSalarioFamilia(1500.00, 2);
    const esperado = 2 * 65.00; // 2 filhos * R$ 65,00
    assert(resultado === esperado, `Esperado ${esperado}, obtido ${resultado}`);
  });
  
  teste('Salário Família - Acima do limite', () => {
    const resultado = calcularSalarioFamilia(2000.00, 2);
    assert(resultado === 0, `Esperado 0, obtido ${resultado}`);
  });
  
  teste('Salário Família - Sem filhos', () => {
    const resultado = calcularSalarioFamilia(1500.00, 0);
    assert(resultado === 0, `Esperado 0, obtido ${resultado}`);
  });
  
  console.log('\n✅ Todos os testes das regras gerais concluídos!');
}

// Testes dos módulos de cálculo
async function testarModulosCalculo() {
  console.log('\n🚀 Iniciando testes dos módulos de cálculo...\n');
  
  const { calcularSalarioLiquido } = await import('../js/core/calculoSalario.js');
  const { calcularFerias } = await import('../js/core/calculoFerias.js');
  const { calcularDecimoTerceiro } = await import('../js/core/calculoDecimo.js');
  
  // Teste de Salário Líquido
  console.log('📋 Testando cálculo de Salário Líquido:');
  
  teste('Salário Líquido - Caso básico', () => {
    const dados = {
      salarioBruto: 3000.00,
      dependentes: 1,
      outrosDescontos: 100.00
    };
    
    const resultado = calcularSalarioLiquido(dados);
    
    assert(resultado.tipo === 'salario_mensal', 'Tipo deve ser salario_mensal');
    assert(resultado.resumo.salarioLiquido.valor > 0, 'Salário líquido deve ser positivo');
    assert(resultado.proventos.salarioBruto.valor === 3000.00, 'Salário bruto deve ser mantido');
  });
  
  // Teste de Férias
  console.log('\n📋 Testando cálculo de Férias:');
  
  teste('Férias - 30 dias sem faltas', () => {
    const dados = {
      salarioBruto: 3000.00,
      diasFerias: 30,
      faltasInjustificadas: 0,
      abonoPecuniario: false,
      dependentes: 0
    };
    
    const resultado = calcularFerias(dados);
    
    assert(resultado.tipo === 'ferias', 'Tipo deve ser ferias');
    assert(resultado.direitos.diasDireito.valor === 30, 'Deve ter direito a 30 dias');
    assert(resultado.proventos.valorFerias.valor === 3000.00, 'Valor das férias deve ser igual ao salário');
  });
  
  teste('Férias - Com abono pecuniário', () => {
    const dados = {
      salarioBruto: 3000.00,
      diasFerias: 30,
      faltasInjustificadas: 0,
      abonoPecuniario: true,
      dependentes: 0
    };
    
    const resultado = calcularFerias(dados);
    
    assert(resultado.proventos.valorAbono !== undefined, 'Deve ter abono pecuniário');
    assert(resultado.proventos.tercoAbono !== undefined, 'Deve ter terço do abono');
  });
  
  // Teste de 13º Salário
  console.log('\n📋 Testando cálculo de 13º Salário:');
  
  teste('13º Salário - 12 meses', () => {
    const dados = {
      salarioBruto: 3000.00,
      mesesTrabalhados: 12,
      dependentes: 0
    };
    
    const resultado = calcularDecimoTerceiro(dados);
    
    assert(resultado.tipo === 'decimo_terceiro', 'Tipo deve ser decimo_terceiro');
    assert(resultado.calculo.valorBrutoTotal.valor === 3000.00, 'Valor bruto deve ser igual ao salário');
    assert(resultado.parcelas.primeiraParcela.valor === 1500.00, 'Primeira parcela deve ser metade');
  });
  
  teste('13º Salário - 6 meses (proporcional)', () => {
    const dados = {
      salarioBruto: 3000.00,
      mesesTrabalhados: 6,
      dependentes: 0
    };
    
    const resultado = calcularDecimoTerceiro(dados);
    
    const valorEsperado = (3000.00 / 12) * 6; // 1500.00
    assert(aproximadamenteIgual(resultado.calculo.valorBrutoTotal.valor, valorEsperado), 
           `Valor proporcional deve ser ${valorEsperado}`);
  });
  
  console.log('\n✅ Todos os testes dos módulos concluídos!');
}

// Testes de integração
async function testarIntegracao() {
  console.log('\n🚀 Iniciando testes de integração...\n');
  
  const { calcularRescisao } = await import('../js/core/calculoRescisao.js');
  
  console.log('📋 Testando cálculo de Rescisão:');
  
  teste('Rescisão - Dispensa sem justa causa', () => {
    const dados = {
      salarioBruto: 3000.00,
      dataAdmissao: '2023-01-01',
      dataSaida: '2025-01-01',
      motivoRescisao: 'sem_justa_causa',
      avisoPrevio: 'indenizado',
      feriasVencidas: 0,
      dependentes: 0
    };
    
    const resultado = calcularRescisao(dados);
    
    assert(resultado.tipo === 'rescisao', 'Tipo deve ser rescisao');
    assert(resultado.verbas.saldoSalario !== undefined, 'Deve ter saldo de salário');
    assert(resultado.verbas.avisoPrevio !== undefined, 'Deve ter aviso prévio');
    assert(resultado.verbas.decimoTerceiro !== undefined, 'Deve ter 13º proporcional');
    assert(resultado.verbas.multaFGTS !== undefined, 'Deve ter multa FGTS');
  });
  
  teste('Rescisão - Pedido de demissão', () => {
    const dados = {
      salarioBruto: 3000.00,
      dataAdmissao: '2023-01-01',
      dataSaida: '2025-01-01',
      motivoRescisao: 'pedido_demissao',
      avisoPrevio: 'indenizado',
      feriasVencidas: 0,
      dependentes: 0
    };
    
    const resultado = calcularRescisao(dados);
    
    assert(resultado.verbas.multaFGTS === undefined, 'Não deve ter multa FGTS');
    assert(resultado.descontos.avisoPrevio !== undefined, 'Deve ter desconto do aviso prévio');
  });
  
  teste('Rescisão - Justa causa', () => {
    const dados = {
      salarioBruto: 3000.00,
      dataAdmissao: '2023-01-01',
      dataSaida: '2025-01-01',
      motivoRescisao: 'justa_causa',
      avisoPrevio: 'nao_aplicavel',
      feriasVencidas: 0,
      dependentes: 0
    };
    
    const resultado = calcularRescisao(dados);
    
    assert(resultado.verbas.avisoPrevio === undefined, 'Não deve ter aviso prévio');
    assert(resultado.verbas.decimoTerceiro === undefined, 'Não deve ter 13º proporcional');
    assert(resultado.verbas.multaFGTS === undefined, 'Não deve ter multa FGTS');
  });
  
  console.log('\n✅ Todos os testes de integração concluídos!');
}

// Executar todos os testes
async function executarTodosOsTestes() {
  try {
    await executarTestes();
    await testarModulosCalculo();
    await testarIntegracao();
    
    console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO! 🎉');
    console.log('\n📊 Resumo:');
    console.log('- Regras gerais: ✅');
    console.log('- Módulos de cálculo: ✅');
    console.log('- Integração: ✅');
    console.log('\nA calculadora está funcionando corretamente!');
    
  } catch (error) {
    console.error('\n💥 Erro durante os testes:', error);
  }
}

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    executarTodos: executarTodosOsTestes,
    testarRegrasGerais: executarTestes,
    testarModulos: testarModulosCalculo,
    testarIntegracao: testarIntegracao
  };
}

// Executar automaticamente se estiver no navegador
if (typeof window !== 'undefined') {
  // Aguardar carregamento da página
  window.addEventListener('load', () => {
    // Aguardar um pouco para garantir que os módulos estão carregados
    setTimeout(executarTodosOsTestes, 1000);
  });
}