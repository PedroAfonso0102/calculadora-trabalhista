/**
 * UI Manager - Gerenciamento da Interface do Usuário
 * 
 * Responsável pela renderização dos resultados dos cálculos
 * e manipulação dos elementos do DOM.
 */

import BASE_LEGAL from '../../config/baseLegal.js';

/**
 * Renderiza o resultado de um cálculo na interface
 * @param {string} containerId - ID do container onde renderizar
 * @param {Object} resultado - Resultado do cálculo
 */
export function renderizarResultado(containerId, resultado) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  switch (resultado.tipo) {
    case 'salario_mensal':
      renderizarSalarioMensal(container, resultado);
      break;
    case 'ferias':
      renderizarFerias(container, resultado);
      break;
    case 'decimo_terceiro':
      renderizarDecimoTerceiro(container, resultado);
      break;
    case 'rescisao':
      renderizarRescisao(container, resultado);
      break;
    default:
      container.innerHTML = '<p class="error">Tipo de cálculo não reconhecido</p>';
  }
}

/**
 * Renderiza resultado de salário mensal
 */
function renderizarSalarioMensal(container, resultado) {
  const html = `
    <div class="result-header">
      <h3><i class="fas fa-money-bill-wave"></i> Resultado do Cálculo de Salário Líquido</h3>
    </div>
    
    <div class="result-sections">
      <div class="result-section proventos">
        <h4><i class="fas fa-plus-circle"></i> Proventos</h4>
        <div class="result-table">
          ${Object.entries(resultado.proventos).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value positive">${item.valorFormatado}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="result-section descontos">
        <h4><i class="fas fa-minus-circle"></i> Descontos</h4>
        <div class="result-table">
          ${Object.entries(resultado.descontos).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value negative">-${item.valorFormatado}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="result-section resumo">
        <h4><i class="fas fa-calculator"></i> Resumo</h4>
        <div class="result-table">
          ${Object.entries(resultado.resumo).map(([key, item]) => `
            <div class="result-row ${key === 'salarioLiquido' ? 'highlight' : ''}">
              <span class="description">${item.descricao}</span>
              <span class="value ${key === 'totalDescontos' ? 'negative' : 'positive'}">
                ${key === 'totalDescontos' ? '-' : ''}${item.valorFormatado}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    
    ${renderizarObservacoes(resultado.observacoes)}
  `;
  
  container.innerHTML = html;
}

/**
 * Renderiza resultado de férias
 */
function renderizarFerias(container, resultado) {
  const html = `
    <div class="result-header">
      <h3><i class="fas fa-umbrella-beach"></i> Resultado do Cálculo de Férias</h3>
    </div>
    
    <div class="result-sections">
      <div class="result-section direitos">
        <h4><i class="fas fa-info-circle"></i> Direitos</h4>
        <div class="result-table">
          ${Object.entries(resultado.direitos).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value">${item.valorFormatado}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="result-section proventos">
        <h4><i class="fas fa-plus-circle"></i> Proventos</h4>
        <div class="result-table">
          ${Object.entries(resultado.proventos).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value positive">${item.valorFormatado}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="result-section descontos">
        <h4><i class="fas fa-minus-circle"></i> Descontos</h4>
        <div class="result-table">
          ${Object.entries(resultado.descontos).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value negative">-${item.valorFormatado}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="result-section resumo">
        <h4><i class="fas fa-calculator"></i> Resumo</h4>
        <div class="result-table">
          ${Object.entries(resultado.resumo).map(([key, item]) => `
            <div class="result-row ${key === 'valorLiquido' ? 'highlight' : ''}">
              <span class="description">${item.descricao}</span>
              <span class="value ${key === 'totalDescontos' ? 'negative' : 'positive'}">
                ${key === 'totalDescontos' ? '-' : ''}${item.valorFormatado}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    
    ${renderizarObservacoes(resultado.observacoes)}
  `;
  
  container.innerHTML = html;
}

/**
 * Renderiza resultado de 13º salário
 */
function renderizarDecimoTerceiro(container, resultado) {
  const html = `
    <div class="result-header">
      <h3><i class="fas fa-gift"></i> Resultado do Cálculo de 13º Salário</h3>
    </div>
    
    <div class="result-sections">
      <div class="result-section calculo">
        <h4><i class="fas fa-calculator"></i> Base do Cálculo</h4>
        <div class="result-table">
          ${Object.entries(resultado.calculo).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value">${item.valorFormatado}</span>
              ${item.detalhes ? `<small class="details">${item.detalhes}</small>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="result-section parcelas">
        <h4><i class="fas fa-list-ol"></i> Parcelas</h4>
        <div class="result-table">
          ${Object.entries(resultado.parcelas).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value positive">${item.valorFormatado}</span>
              ${item.observacao ? `<small class="details">${item.observacao}</small>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="result-section descontos">
        <h4><i class="fas fa-minus-circle"></i> Descontos (aplicados na 2ª parcela)</h4>
        <div class="result-table">
          ${Object.entries(resultado.descontos).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value negative">-${item.valorFormatado}</span>
              ${item.baseCalculoFormatada ? `<small class="details">Base: ${item.baseCalculoFormatada}</small>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="result-section resumo">
        <h4><i class="fas fa-chart-line"></i> Resumo Final</h4>
        <div class="result-table">
          ${Object.entries(resultado.resumo).map(([key, item]) => `
            <div class="result-row ${key === 'valorLiquidoTotal' ? 'highlight' : ''}">
              <span class="description">${item.descricao}</span>
              <span class="value ${key === 'totalDescontos' ? 'negative' : 'positive'}">
                ${key === 'totalDescontos' ? '-' : ''}${item.valorFormatado}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="result-section cronograma">
        <h4><i class="fas fa-calendar"></i> Cronograma de Pagamento</h4>
        <div class="result-table">
          ${Object.entries(resultado.cronograma).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value positive">${item.valorFormatado}</span>
              <small class="details">${item.prazo}</small>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    
    ${renderizarObservacoes(resultado.observacoes)}
  `;
  
  container.innerHTML = html;
}

/**
 * Renderiza resultado de rescisão
 */
function renderizarRescisao(container, resultado) {
  const html = `
    <div class="result-header">
      <h3><i class="fas fa-handshake"></i> Resultado do Cálculo de Rescisão</h3>
    </div>
    
    <div class="result-sections">
      <div class="result-section informacoes">
        <h4><i class="fas fa-info-circle"></i> Informações do Contrato</h4>
        <div class="result-table">
          ${Object.entries(resultado.informacoes).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value">${item.valorFormatado}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="result-section verbas">
        <h4><i class="fas fa-plus-circle"></i> Verbas Rescisórias</h4>
        <div class="result-table">
          ${Object.entries(resultado.verbas).map(([key, item]) => `
            <div class="result-row">
              <span class="description">${item.descricao}</span>
              <span class="value positive">${item.valorFormatado}</span>
              ${item.detalhes ? `<small class="details">${item.detalhes}</small>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      ${Object.keys(resultado.descontos).length > 0 ? `
        <div class="result-section descontos">
          <h4><i class="fas fa-minus-circle"></i> Descontos</h4>
          <div class="result-table">
            ${Object.entries(resultado.descontos).map(([key, item]) => `
              <div class="result-row">
                <span class="description">${item.descricao}</span>
                <span class="value negative">-${item.valorFormatado}</span>
                ${item.detalhes ? `<small class="details">${item.detalhes}</small>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="result-section resumo">
        <h4><i class="fas fa-chart-line"></i> Resumo Final</h4>
        <div class="result-table">
          ${Object.entries(resultado.resumo).map(([key, item]) => `
            <div class="result-row ${key === 'valorLiquido' ? 'highlight' : ''}">
              <span class="description">${item.descricao}</span>
              <span class="value ${key === 'totalDescontos' ? 'negative' : 'positive'}">
                ${key === 'totalDescontos' ? '-' : ''}${item.valorFormatado}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    
    ${renderizarObservacoes(resultado.observacoes)}
  `;
  
  container.innerHTML = html;
}

/**
 * Renderiza observações
 */
function renderizarObservacoes(observacoes) {
  if (!observacoes || observacoes.length === 0) return '';
  
  return `
    <div class="result-section observacoes">
      <h4><i class="fas fa-exclamation-triangle"></i> Observações Importantes</h4>
      <ul class="observacoes-list">
        ${observacoes.map(obs => `<li>${obs}</li>`).join('')}
      </ul>
    </div>
  `;
}

/**
 * Gerencia as abas da interface
 */
export function inicializarAbas() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      
      // Remover classe active de todas as abas
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Adicionar classe active na aba selecionada
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

/**
 * Inicializa o sistema de tooltips
 */
export function inicializarTooltips() {
  const tooltipTriggers = document.querySelectorAll('.tooltip-trigger');
  const tooltipModal = document.getElementById('tooltip-modal');
  const tooltipClose = document.querySelector('.tooltip-close');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipText = document.getElementById('tooltip-text');
  const tooltipLegal = document.getElementById('tooltip-legal');
  
  tooltipTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const tooltipKey = trigger.getAttribute('data-tooltip');
      const info = BASE_LEGAL[tooltipKey];
      
      if (info) {
        tooltipTitle.textContent = info.titulo;
        tooltipText.textContent = info.explicacao;
        tooltipLegal.textContent = `Base legal: ${info.baseLegal}`;
        tooltipModal.style.display = 'block';
      }
    });
  });
  
  // Fechar tooltip
  tooltipClose.addEventListener('click', () => {
    tooltipModal.style.display = 'none';
  });
  
  // Fechar ao clicar fora
  window.addEventListener('click', (e) => {
    if (e.target === tooltipModal) {
      tooltipModal.style.display = 'none';
    }
  });
}

/**
 * Exibe uma notificação para o usuário
 */
export function mostrarNotificacao(mensagem, tipo = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${tipo}`;
  notification.innerHTML = `
    <i class="fas fa-${tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    ${mensagem}
    <button class="notification-close">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remover após 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
  
  // Botão de fechar
  notification.querySelector('.notification-close').addEventListener('click', () => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });
}

/**
 * Coleta dados de um formulário
 */
export function coletarDadosFormulario(formId) {
  const form = document.getElementById(formId);
  if (!form) return null;
  
  const formData = new FormData(form);
  const dados = {};
  
  for (let [key, value] of formData.entries()) {
    // Converter checkboxes
    if (form.querySelector(`[name="${key}"]`).type === 'checkbox') {
      dados[key] = form.querySelector(`[name="${key}"]`).checked;
    }
    // Converter números
    else if (form.querySelector(`[name="${key}"]`).type === 'number') {
      dados[key] = parseFloat(value) || 0;
    }
    // Strings normais
    else {
      dados[key] = value;
    }
  }
  
  return dados;
}

/**
 * Valida dados de entrada
 */
export function validarDados(dados, tipo) {
  const erros = [];
  
  // Validações comuns
  if (!dados.salarioBruto || dados.salarioBruto <= 0) {
    erros.push('Salário bruto deve ser maior que zero');
  }
  
  if (dados.dependentes < 0) {
    erros.push('Número de dependentes não pode ser negativo');
  }
  
  // Validações específicas por tipo
  switch (tipo) {
    case 'rescisao':
      if (!dados.dataAdmissao) {
        erros.push('Data de admissão é obrigatória');
      }
      if (!dados.dataSaida) {
        erros.push('Data de saída é obrigatória');
      }
      if (dados.dataAdmissao && dados.dataSaida && new Date(dados.dataAdmissao) >= new Date(dados.dataSaida)) {
        erros.push('Data de saída deve ser posterior à data de admissão');
      }
      if (!dados.motivoRescisao) {
        erros.push('Motivo da rescisão é obrigatório');
      }
      break;
      
    case 'ferias':
      if (!dados.diasFerias || dados.diasFerias <= 0) {
        erros.push('Dias de férias deve ser maior que zero');
      }
      if (dados.diasFerias > 30) {
        erros.push('Dias de férias não pode ser maior que 30');
      }
      break;
      
    case 'decimo':
      if (!dados.mesesTrabalhados || dados.mesesTrabalhados <= 0 || dados.mesesTrabalhados > 12) {
        erros.push('Meses trabalhados deve ser entre 1 e 12');
      }
      break;
  }
  
  return erros;
}