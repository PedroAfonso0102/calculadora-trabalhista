/**
 * Main.js - Ponto de entrada principal da aplicação
 * 
 * Orquestra toda a aplicação, inicializa componentes e gerencia eventos.
 */

import { calcularSalarioLiquido } from './core/calculoSalario.js';
import { calcularFerias } from './core/calculoFerias.js';
import { calcularDecimoTerceiro } from './core/calculoDecimo.js';
import { calcularRescisao } from './core/calculoRescisao.js';

import { 
  renderizarResultado, 
  inicializarAbas, 
  inicializarTooltips,
  mostrarNotificacao,
  coletarDadosFormulario,
  validarDados
} from './ui/uiManager.js';

import { gerarPDF } from './ui/pdfGenerator.js';

// Estado global da aplicação
let ultimoResultado = null;
let cenariosSalvos = JSON.parse(localStorage.getItem('cenarios-trabalhistas') || '[]');

/**
 * Inicializa a aplicação
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Iniciando Calculadora Trabalhista...');
  
  // Inicializar componentes da UI
  inicializarAbas();
  inicializarTooltips();
  inicializarFormularios();
  inicializarGerenciamentoCenarios();
  
  console.log('Aplicação inicializada com sucesso!');
});

/**
 * Inicializa os formulários e seus eventos
 */
function inicializarFormularios() {
  // Formulário de salário líquido
  const formSalario = document.getElementById('salario-form');
  if (formSalario) {
    formSalario.addEventListener('submit', async (e) => {
      e.preventDefault();
      await processarCalculo('salario', calcularSalarioLiquido, 'salario-resultado');
    });
  }
  
  // Formulário de férias
  const formFerias = document.getElementById('ferias-form');
  if (formFerias) {
    formFerias.addEventListener('submit', async (e) => {
      e.preventDefault();
      await processarCalculo('ferias', calcularFerias, 'ferias-resultado');
    });
  }
  
  // Formulário de 13º salário
  const formDecimo = document.getElementById('decimo-form');
  if (formDecimo) {
    formDecimo.addEventListener('submit', async (e) => {
      e.preventDefault();
      await processarCalculo('decimo', calcularDecimoTerceiro, 'decimo-resultado');
    });
  }
  
  // Formulário de rescisão
  const formRescisao = document.getElementById('rescisao-form');
  if (formRescisao) {
    formRescisao.addEventListener('submit', async (e) => {
      e.preventDefault();
      await processarCalculo('rescisao', calcularRescisao, 'rescisao-resultado');
    });
  }
}

/**
 * Processa um cálculo
 */
async function processarCalculo(tipo, funcaoCalculo, containerResultado) {
  try {
    // Mostrar loading
    const container = document.getElementById(containerResultado);
    if (container) {
      container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Calculando...</div>';
    }
    
    // Coletar dados do formulário
    const dados = coletarDadosFormulario(`${tipo}-form`);
    
    if (!dados) {
      throw new Error('Erro ao coletar dados do formulário');
    }
    
    // Validar dados
    const erros = validarDados(dados, tipo);
    if (erros.length > 0) {
      throw new Error(erros.join('\n'));
    }
    
    // Simular pequeno delay para UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Executar cálculo
    const resultado = funcaoCalculo(dados);
    
    // Salvar resultado
    ultimoResultado = resultado;
    
    // Renderizar resultado
    renderizarResultado(containerResultado, resultado);
    
    // Mostrar notificação de sucesso
    mostrarNotificacao('Cálculo realizado com sucesso!', 'success');
    
  } catch (error) {
    console.error('Erro no cálculo:', error);
    
    // Mostrar erro na interface
    const container = document.getElementById(containerResultado);
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <h4>Erro no Cálculo</h4>
          <p>${error.message}</p>
        </div>
      `;
    }
    
    // Mostrar notificação de erro
    mostrarNotificacao(error.message, 'error');
  }
}

/**
 * Inicializa o gerenciamento de cenários
 */
function inicializarGerenciamentoCenarios() {
  // Botão salvar cenário
  const btnSalvar = document.getElementById('save-scenario');
  if (btnSalvar) {
    btnSalvar.addEventListener('click', salvarCenario);
  }
  
  // Botão carregar cenário
  const btnCarregar = document.getElementById('load-scenario');
  if (btnCarregar) {
    btnCarregar.addEventListener('click', mostrarModalCenarios);
  }
  
  // Botão exportar PDF
  const btnPDF = document.getElementById('export-pdf');
  if (btnPDF) {
    btnPDF.addEventListener('click', exportarPDF);
  }
}

/**
 * Salva o cenário atual
 */
function salvarCenario() {
  if (!ultimoResultado) {
    mostrarNotificacao('Nenhum cálculo foi realizado ainda', 'error');
    return;
  }
  
  const nome = prompt('Digite um nome para este cenário:');
  if (!nome) return;
  
  const cenario = {
    id: Date.now(),
    nome: nome,
    tipo: ultimoResultado.tipo,
    dados: ultimoResultado.dados,
    resultado: ultimoResultado,
    dataCalculo: new Date().toISOString()
  };
  
  cenariosSalvos.push(cenario);
  localStorage.setItem('cenarios-trabalhistas', JSON.stringify(cenariosSalvos));
  
  mostrarNotificacao(`Cenário "${nome}" salvo com sucesso!`, 'success');
}

/**
 * Mostra modal com cenários salvos
 */
function mostrarModalCenarios() {
  if (cenariosSalvos.length === 0) {
    mostrarNotificacao('Nenhum cenário salvo', 'info');
    return;
  }
  
  // Criar modal dinâmico
  const modal = document.createElement('div');
  modal.className = 'scenarios-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3><i class="fas fa-folder-open"></i> Cenários Salvos</h3>
        <span class="modal-close">&times;</span>
      </div>
      <div class="modal-body">
        <div class="scenarios-list">
          ${cenariosSalvos.map(cenario => `
            <div class="scenario-item" data-id="${cenario.id}">
              <div class="scenario-info">
                <h4>${cenario.nome}</h4>
                <p>Tipo: ${formatarTipoCenario(cenario.tipo)}</p>
                <small>Calculado em: ${new Date(cenario.dataCalculo).toLocaleString('pt-BR')}</small>
              </div>
              <div class="scenario-actions">
                <button class="btn-load" data-id="${cenario.id}">
                  <i class="fas fa-upload"></i> Carregar
                </button>
                <button class="btn-delete" data-id="${cenario.id}">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Eventos do modal
  modal.querySelector('.modal-close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // Carregar cenário
  modal.querySelectorAll('.btn-load').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id || e.target.parentElement.dataset.id);
      carregarCenario(id);
      document.body.removeChild(modal);
    });
  });
  
  // Deletar cenário
  modal.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id || e.target.parentElement.dataset.id);
      if (confirm('Tem certeza que deseja excluir este cenário?')) {
        excluirCenario(id);
        document.body.removeChild(modal);
        mostrarModalCenarios(); // Reabrir modal atualizado
      }
    });
  });
  
  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

/**
 * Carrega um cenário salvo
 */
function carregarCenario(id) {
  const cenario = cenariosSalvos.find(c => c.id === id);
  if (!cenario) {
    mostrarNotificacao('Cenário não encontrado', 'error');
    return;
  }
  
  // Navegar para a aba correspondente
  const tabButton = document.querySelector(`[data-tab="${getTabFromTipo(cenario.tipo)}"]`);
  if (tabButton) {
    tabButton.click();
  }
  
  // Preencher formulário
  preencherFormulario(cenario.tipo, cenario.dados);
  
  // Renderizar resultado
  const containerResultado = `${getTabFromTipo(cenario.tipo)}-resultado`;
  ultimoResultado = cenario.resultado;
  renderizarResultado(containerResultado, cenario.resultado);
  
  mostrarNotificacao(`Cenário "${cenario.nome}" carregado!`, 'success');
}

/**
 * Exclui um cenário
 */
function excluirCenario(id) {
  cenariosSalvos = cenariosSalvos.filter(c => c.id !== id);
  localStorage.setItem('cenarios-trabalhistas', JSON.stringify(cenariosSalvos));
  mostrarNotificacao('Cenário excluído', 'info');
}

/**
 * Exporta resultado para PDF
 */
function exportarPDF() {
  if (!ultimoResultado) {
    mostrarNotificacao('Nenhum cálculo foi realizado ainda', 'error');
    return;
  }
  
  const nomeArquivo = `relatorio-${ultimoResultado.tipo}-${new Date().toISOString().split('T')[0]}.pdf`;
  
  try {
    gerarPDF(ultimoResultado, nomeArquivo);
    mostrarNotificacao('PDF gerado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    mostrarNotificacao('Erro ao gerar PDF: ' + error.message, 'error');
  }
}

/**
 * Preenche formulário com dados do cenário
 */
function preencherFormulario(tipo, dados) {
  const formId = `${getTabFromTipo(tipo)}-form`;
  const form = document.getElementById(formId);
  if (!form) return;
  
  Object.entries(dados).forEach(([key, value]) => {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = value;
      } else {
        input.value = value;
      }
    }
  });
}

/**
 * Funções auxiliares
 */
function formatarTipoCenario(tipo) {
  const tipos = {
    'salario_mensal': 'Salário Líquido',
    'ferias': 'Férias',
    'decimo_terceiro': '13º Salário',
    'rescisao': 'Rescisão'
  };
  return tipos[tipo] || tipo;
}

function getTabFromTipo(tipo) {
  const mapeamento = {
    'salario_mensal': 'salario',
    'ferias': 'ferias',
    'decimo_terceiro': 'decimo',
    'rescisao': 'rescisao'
  };
  return mapeamento[tipo] || 'salario';
}

// Exportar funções para uso global se necessário
window.calculadoraTrabalhista = {
  calcularSalarioLiquido,
  calcularFerias,
  calcularDecimoTerceiro,
  calcularRescisao,
  gerarPDF,
  salvarCenario,
  carregarCenario
};