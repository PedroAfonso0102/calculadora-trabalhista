/**
 * Gerador de PDF
 * 
 * Gera relatórios em PDF dos cálculos realizados
 * utilizando a biblioteca jsPDF.
 */

/**
 * Gera PDF do resultado do cálculo
 * @param {Object} resultado - Resultado do cálculo
 * @param {string} nomeArquivo - Nome do arquivo PDF
 */
export function gerarPDF(resultado, nomeArquivo = 'relatorio-trabalhista.pdf') {
  if (!window.jsPDF) {
    console.error('Biblioteca jsPDF não encontrada');
    return;
  }
  
  const { jsPDF } = window.jsPDF;
  const doc = new jsPDF();
  
  // Configurações básicas
  let yPosition = 20;
  const marginLeft = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Função para adicionar nova página se necessário
  function checkPageBreak(neededSpace = 20) {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  }
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('CALCULADORA TRABALHISTA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Relatório de Cálculo Trabalhista', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;
  
  // Data de geração
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  doc.text(`Gerado em: ${dataAtual}`, marginLeft, yPosition);
  yPosition += 15;
  
  // Título específico do cálculo
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  
  switch (resultado.tipo) {
    case 'salario_mensal':
      doc.text('CÁLCULO DE SALÁRIO LÍQUIDO MENSAL', marginLeft, yPosition);
      break;
    case 'ferias':
      doc.text('CÁLCULO DE FÉRIAS', marginLeft, yPosition);
      break;
    case 'decimo_terceiro':
      doc.text('CÁLCULO DE 13º SALÁRIO', marginLeft, yPosition);
      break;
    case 'rescisao':
      doc.text('CÁLCULO DE RESCISÃO CONTRATUAL', marginLeft, yPosition);
      break;
  }
  yPosition += 15;
  
  // Dados de entrada
  adicionarSecaoDados(doc, resultado, marginLeft, yPosition);
  yPosition = doc.lastAutoTable.finalY + 10;
  
  // Conteúdo específico por tipo
  switch (resultado.tipo) {
    case 'salario_mensal':
      yPosition = adicionarSalarioMensalPDF(doc, resultado, marginLeft, yPosition);
      break;
    case 'ferias':
      yPosition = adicionarFeriasPDF(doc, resultado, marginLeft, yPosition);
      break;
    case 'decimo_terceiro':
      yPosition = adicionarDecimoTerceiroPDF(doc, resultado, marginLeft, yPosition);
      break;
    case 'rescisao':
      yPosition = adicionarRescisaoPDF(doc, resultado, marginLeft, yPosition);
      break;
  }
  
  // Observações
  if (resultado.observacoes && resultado.observacoes.length > 0) {
    checkPageBreak(40);
    yPosition += 10;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('OBSERVAÇÕES IMPORTANTES', marginLeft, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    resultado.observacoes.forEach(obs => {
      checkPageBreak(15);
      doc.text(`• ${obs}`, marginLeft + 5, yPosition);
      yPosition += 6;
    });
  }
  
  // Rodapé
  const rodapeY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont(undefined, 'italic');
  doc.text('Este relatório é baseado na legislação trabalhista brasileira vigente.', pageWidth / 2, rodapeY, { align: 'center' });
  doc.text('Consulte sempre um profissional especializado para orientações específicas.', pageWidth / 2, rodapeY + 5, { align: 'center' });
  
  // Salvar o PDF
  doc.save(nomeArquivo);
}

/**
 * Adiciona seção de dados de entrada
 */
function adicionarSecaoDados(doc, resultado, marginLeft, yPosition) {
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('DADOS DE ENTRADA', marginLeft, yPosition);
  yPosition += 5;
  
  const dadosTabela = [];
  
  Object.entries(resultado.dados).forEach(([key, value]) => {
    let label = key;
    let valorFormatado = value;
    
    // Formatar labels e valores
    switch (key) {
      case 'salarioBruto':
        label = 'Salário Bruto';
        valorFormatado = formatarMoeda(value);
        break;
      case 'dependentes':
        label = 'Dependentes';
        break;
      case 'outrosDescontos':
        label = 'Outros Descontos';
        valorFormatado = formatarMoeda(value);
        break;
      case 'dataAdmissao':
        label = 'Data de Admissão';
        valorFormatado = new Date(value).toLocaleDateString('pt-BR');
        break;
      case 'dataSaida':
        label = 'Data de Saída';
        valorFormatado = new Date(value).toLocaleDateString('pt-BR');
        break;
      case 'motivoRescisao':
        label = 'Motivo da Rescisão';
        valorFormatado = formatarMotivoRescisao(value);
        break;
      case 'avisoPrevio':
        label = 'Aviso Prévio';
        valorFormatado = formatarAvisoPrevio(value);
        break;
      case 'feriasVencidas':
        label = 'Férias Vencidas';
        valorFormatado = `${value} dias`;
        break;
      case 'diasFerias':
        label = 'Dias de Férias';
        valorFormatado = `${value} dias`;
        break;
      case 'faltasInjustificadas':
        label = 'Faltas Injustificadas';
        break;
      case 'abonoPecuniario':
        label = 'Abono Pecuniário';
        valorFormatado = value ? 'Sim' : 'Não';
        break;
      case 'mesesTrabalhados':
        label = 'Meses Trabalhados';
        valorFormatado = `${value} meses`;
        break;
    }
    
    dadosTabela.push([label, valorFormatado]);
  });
  
  doc.autoTable({
    startY: yPosition,
    head: [['Campo', 'Valor']],
    body: dadosTabela,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 }
  });
}

/**
 * Adiciona conteúdo de salário mensal ao PDF
 */
function adicionarSalarioMensalPDF(doc, resultado, marginLeft, yPosition) {
  // Proventos
  adicionarTabelaSecao(doc, 'PROVENTOS', resultado.proventos, marginLeft, yPosition, [46, 204, 113]);
  yPosition = doc.lastAutoTable.finalY + 10;
  
  // Descontos
  adicionarTabelaSecao(doc, 'DESCONTOS', resultado.descontos, marginLeft, yPosition, [231, 76, 60]);
  yPosition = doc.lastAutoTable.finalY + 10;
  
  // Resumo
  adicionarTabelaSecao(doc, 'RESUMO', resultado.resumo, marginLeft, yPosition, [52, 73, 94]);
  
  return doc.lastAutoTable.finalY;
}

/**
 * Adiciona conteúdo de férias ao PDF
 */
function adicionarFeriasPDF(doc, resultado, marginLeft, yPosition) {
  // Direitos
  if (resultado.direitos) {
    adicionarTabelaSecao(doc, 'DIREITOS', resultado.direitos, marginLeft, yPosition, [155, 89, 182]);
    yPosition = doc.lastAutoTable.finalY + 10;
  }
  
  // Proventos
  adicionarTabelaSecao(doc, 'PROVENTOS', resultado.proventos, marginLeft, yPosition, [46, 204, 113]);
  yPosition = doc.lastAutoTable.finalY + 10;
  
  // Descontos
  adicionarTabelaSecao(doc, 'DESCONTOS', resultado.descontos, marginLeft, yPosition, [231, 76, 60]);
  yPosition = doc.lastAutoTable.finalY + 10;
  
  // Resumo
  adicionarTabelaSecao(doc, 'RESUMO', resultado.resumo, marginLeft, yPosition, [52, 73, 94]);
  
  return doc.lastAutoTable.finalY;
}

/**
 * Adiciona conteúdo de 13º salário ao PDF
 */
function adicionarDecimoTerceiroPDF(doc, resultado, marginLeft, yPosition) {
  // Cálculo base
  if (resultado.calculo) {
    adicionarTabelaSecao(doc, 'BASE DO CÁLCULO', resultado.calculo, marginLeft, yPosition, [155, 89, 182]);
    yPosition = doc.lastAutoTable.finalY + 10;
  }
  
  // Parcelas
  if (resultado.parcelas) {
    adicionarTabelaSecao(doc, 'PARCELAS', resultado.parcelas, marginLeft, yPosition, [46, 204, 113]);
    yPosition = doc.lastAutoTable.finalY + 10;
  }
  
  // Descontos
  adicionarTabelaSecao(doc, 'DESCONTOS', resultado.descontos, marginLeft, yPosition, [231, 76, 60]);
  yPosition = doc.lastAutoTable.finalY + 10;
  
  // Resumo
  adicionarTabelaSecao(doc, 'RESUMO', resultado.resumo, marginLeft, yPosition, [52, 73, 94]);
  yPosition = doc.lastAutoTable.finalY + 10;
  
  // Cronograma
  if (resultado.cronograma) {
    adicionarTabelaSecao(doc, 'CRONOGRAMA DE PAGAMENTO', resultado.cronograma, marginLeft, yPosition, [243, 156, 18]);
  }
  
  return doc.lastAutoTable.finalY;
}

/**
 * Adiciona conteúdo de rescisão ao PDF
 */
function adicionarRescisaoPDF(doc, resultado, marginLeft, yPosition) {
  // Informações
  if (resultado.informacoes) {
    adicionarTabelaSecao(doc, 'INFORMAÇÕES DO CONTRATO', resultado.informacoes, marginLeft, yPosition, [155, 89, 182]);
    yPosition = doc.lastAutoTable.finalY + 10;
  }
  
  // Verbas rescisórias
  adicionarTabelaSecao(doc, 'VERBAS RESCISÓRIAS', resultado.verbas, marginLeft, yPosition, [46, 204, 113]);
  yPosition = doc.lastAutoTable.finalY + 10;
  
  // Descontos (se houver)
  if (Object.keys(resultado.descontos).length > 0) {
    adicionarTabelaSecao(doc, 'DESCONTOS', resultado.descontos, marginLeft, yPosition, [231, 76, 60]);
    yPosition = doc.lastAutoTable.finalY + 10;
  }
  
  // Resumo
  adicionarTabelaSecao(doc, 'RESUMO', resultado.resumo, marginLeft, yPosition, [52, 73, 94]);
  
  return doc.lastAutoTable.finalY;
}

/**
 * Adiciona uma tabela de seção ao PDF
 */
function adicionarTabelaSecao(doc, titulo, dados, marginLeft, yPosition, cor) {
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(titulo, marginLeft, yPosition);
  yPosition += 5;
  
  const dadosTabela = [];
  
  Object.entries(dados).forEach(([key, item]) => {
    const linha = [item.descricao, item.valorFormatado];
    if (item.detalhes) {
      linha.push(item.detalhes);
    }
    dadosTabela.push(linha);
  });
  
  const colunas = ['Descrição', 'Valor'];
  if (dadosTabela.some(linha => linha.length > 2)) {
    colunas.push('Detalhes');
  }
  
  doc.autoTable({
    startY: yPosition,
    head: [colunas],
    body: dadosTabela,
    theme: 'grid',
    headStyles: { fillColor: cor },
    styles: { fontSize: 9 }
  });
}

/**
 * Funções auxiliares de formatação
 */
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

function formatarMotivoRescisao(motivo) {
  const motivos = {
    'sem_justa_causa': 'Dispensa sem Justa Causa',
    'pedido_demissao': 'Pedido de Demissão',
    'acordo': 'Acordo (Demissão Consensual)',
    'justa_causa': 'Dispensa por Justa Causa',
    'termino_contrato': 'Término de Contrato'
  };
  return motivos[motivo] || motivo;
}

function formatarAvisoPrevio(tipo) {
  const tipos = {
    'trabalhado': 'Trabalhado',
    'indenizado': 'Indenizado',
    'nao_aplicavel': 'Não Aplicável'
  };
  return tipos[tipo] || tipo;
}