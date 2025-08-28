/**
 * UI Module
 *
 * This module is responsible for all DOM manipulation. It reads from the
 * state and updates the UI accordingly. It does not contain any business logic.
 */

import { state } from './state.js';
import * as calculations from './calculations.js';
import { formatCurrency, formatDateBR, formatDateTimeBR } from './utils.js';
import { 
    loadKnowledgeBase, 
    getEnhancedTooltip, 
    searchKnowledgeBase, 
    getAllFaqCategories,
    getFaqCategory,
    getRelatedFaqs 
} from './knowledge.js';

// --- DOM Element Selectors ---
const resultContainers = {
    ferias: document.getElementById('ferias-results'),
    rescisao: document.getElementById('rescisao-results'),
    decimoTerceiro: document.getElementById('decimo-terceiro-results'),
    salarioLiquido: document.getElementById('salario-liquido-results'),
    fgts: document.getElementById('fgts-results'),
    pisPasep: document.getElementById('pis-pasep-results'),
    seguroDesemprego: document.getElementById('seguro-desemprego-results'),
    horasExtras: document.getElementById('horas-extras-results'),
    inss: document.getElementById('inss-results'),
    valeTransporte: document.getElementById('vale-transporte-results'),
    irpf: document.getElementById('irpf-results')
};

const tabTriggers = {
    ferias: document.getElementById('tab-ferias'),
    rescisao: document.getElementById('tab-rescisao'),
    decimoTerceiro: document.getElementById('tab-decimo-terceiro'),
    salarioLiquido: document.getElementById('tab-salario-liquido'),
    fgts: document.getElementById('tab-fgts'),
    pisPasep: document.getElementById('tab-pis-pasep'),
    seguroDesemprego: document.getElementById('tab-seguro-desemprego'),
    horasExtras: document.getElementById('tab-horas-extras'),
    inss: document.getElementById('tab-inss'),
    valeTransporte: document.getElementById('tab-vale-transporte'),
    irpf: document.getElementById('tab-irpf')
};

const calculatorPanels = {
    ferias: document.getElementById('calculator-ferias'),
    rescisao: document.getElementById('calculator-rescisao'),
    decimoTerceiro: document.getElementById('calculator-decimo-terceiro'),
    salarioLiquido: document.getElementById('calculator-salario-liquido'),
    fgts: document.getElementById('calculator-fgts'),
    pisPasep: document.getElementById('calculator-pis-pasep'),
    seguroDesemprego: document.getElementById('calculator-seguro-desemprego'),
    horasExtras: document.getElementById('calculator-horas-extras'),
    inss: document.getElementById('calculator-inss'),
    valeTransporte: document.getElementById('calculator-vale-transporte'),
    irpf: document.getElementById('calculator-irpf')
};


// --- Tooltip UI Functions ---
let currentTooltip = null;

/**
 * Cria um elemento tooltip com conteúdo expandido ou básico
 * @param {string} topicKey - Chave do tópico no knowledge base
 * @returns {HTMLElement|null} Elemento tooltip criado ou null se tópico não encontrado
 */
export function createTooltip(topicKey) {
    // Primeiro, tenta obter tooltip expandido
    let topic = getEnhancedTooltip(topicKey);
    
    // Fallback para dados básicos se não encontrar expandido
    if (!topic) {
        topic = state.legalTexts[topicKey];
    }
    
    if (!topic) return null;

    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'tooltip enhanced-tooltip';
    tooltipElement.setAttribute('role', 'tooltip');
    tooltipElement.id = `tooltip-for-${topicKey}`;

    let contentHTML = `<h4 class="font-bold text-lg mb-2">${topic.title}</h4>`;
    contentHTML += `<div class="text-sm space-y-2">${topic.content}</div>`;
    
    // Adicionar quick tips se disponível (tooltips expandidos)
    if (topic.quick_tips && topic.quick_tips.length > 0) {
        contentHTML += `<div class="mt-3 p-2 bg-blue-50 rounded">`;
        contentHTML += `<p class="font-semibold text-sm text-blue-900 mb-1">💡 Dicas Rápidas:</p>`;
        contentHTML += `<ul class="text-xs text-blue-800 space-y-1">`;
        topic.quick_tips.forEach(tip => {
            contentHTML += `<li>${tip}</li>`;
        });
        contentHTML += `</ul></div>`;
    }
    
    // Adicionar dúvidas comuns se disponível
    if (topic.common_doubts && topic.common_doubts.length > 0) {
        contentHTML += `<div class="mt-3">`;
        contentHTML += `<p class="font-semibold text-sm text-gray-900 mb-2">❓ Dúvidas Comuns:</p>`;
        topic.common_doubts.forEach((item, index) => {
            contentHTML += `<details class="text-xs mb-1">`;
            contentHTML += `<summary class="cursor-pointer text-gray-700 hover:text-gray-900">${item.doubt}</summary>`;
            contentHTML += `<p class="mt-1 pl-2 text-gray-600">${item.answer}</p>`;
            contentHTML += `</details>`;
        });
        contentHTML += `</div>`;
    }
    
    if (topic.legal) {
        contentHTML += `<p class="text-xs text-muted-foreground mt-4 pt-2 border-t">${topic.legal}</p>`;
    }
    
    // Adicionar botão para ver FAQ relacionado
    contentHTML += `<div class="mt-3 pt-2 border-t">`;
    contentHTML += `<button class="text-xs text-blue-600 hover:text-blue-800 underline" onclick="window.openFaqModal && window.openFaqModal('${topicKey}')">`;
    contentHTML += `📚 Ver mais no FAQ`;
    contentHTML += `</button>`;
    contentHTML += `</div>`;
    
    tooltipElement.innerHTML = contentHTML;
    document.body.appendChild(tooltipElement);
    return tooltipElement;
}

/**
 * Posiciona e exibe um tooltip próximo ao ícone de ajuda
 * @param {HTMLElement} iconElement - Elemento ícone que acionou o tooltip
 * @param {HTMLElement} tooltipElement - Elemento tooltip a ser exibido
 */
export function showTooltip(iconElement, tooltipElement) {
    if (currentTooltip) hideTooltip();

    currentTooltip = tooltipElement;

    const iconRect = iconElement.getBoundingClientRect();

    // Position tooltip above the icon
    tooltipElement.style.left = `${iconRect.left + window.scrollX + (iconRect.width / 2) - (tooltipElement.offsetWidth / 2)}px`;
    tooltipElement.style.top = `${iconRect.top + window.scrollY - tooltipElement.offsetHeight - 8}px`;

    // Adjust if it overflows the viewport
    const tooltipRect = tooltipElement.getBoundingClientRect();
    if (tooltipRect.left < 0) {
        tooltipElement.style.left = '8px';
    }
    if (tooltipRect.right > window.innerWidth) {
        tooltipElement.style.left = `${window.innerWidth - tooltipElement.offsetWidth - 8}px`;
    }

    // Check if tooltip would appear above viewport, if so, show it below the icon
    if (tooltipRect.top < 0) {
        tooltipElement.style.top = `${iconRect.bottom + window.scrollY + 8}px`;
    }

    setTimeout(() => {
        tooltipElement.classList.add('visible');
    }, 10); // Small delay to allow for CSS transition
}

/**
 * Remove o tooltip atualmente visível da tela
 */
export function hideTooltip() {
    if (currentTooltip) {
        currentTooltip.classList.remove('visible');
        setTimeout(() => {
            currentTooltip.remove();
            currentTooltip = null;
        }, 200); // Match transition duration
    }
}

// --- Educational Panel Functions ---

/**
 * Toggles the visibility of the educational panel
 * @param {boolean} visible - Whether to show or hide the panel
 */
export function toggleEducationalPanel(visible) {
    const panel = document.getElementById('educational-panel');
    const overlay = document.getElementById('educational-panel-overlay');

    if (!panel || !overlay) {
        console.error('Educational panel elements not found');
        return;
    }

    if (visible) {
        // Show panel
        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
        setTimeout(() => {
            overlay.classList.add('visible');
            panel.classList.add('visible');
            panel.setAttribute('aria-hidden', 'false');
        }, 10);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus management for accessibility
        panel.focus();
    } else {
        // Hide panel
        overlay.classList.remove('visible');
        panel.classList.remove('visible');
        panel.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');

        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 300); // Match transition duration

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to menu button
        const menuBtn = document.getElementById('educational-panel-menu-btn');
        if (menuBtn) menuBtn.focus();
    }
}

/**
 * Loads and displays educational content for a specific topic
 * @param {string} topic - The topic category to load (ferias, rescisao, etc.)
 */
export async function loadEducationalContent(topic) {
    const contentContainer = document.getElementById('educational-content');
    const welcomeDiv = document.getElementById('educational-welcome');

    if (!contentContainer) {
        console.error('Educational content container not found');
        return;
    }

    // Hide welcome message and show loading
    if (welcomeDiv) {
        welcomeDiv.style.display = 'none';
    }

    // Show loading state
    contentContainer.innerHTML = '<div class="educational-loading"></div>';

    try {
        // Load content from JSON file
        const response = await fetch('data/legal_texts.json');
        if (!response.ok) {
            throw new Error(`Failed to load content: ${response.status}`);
        }

        const data = await response.json();
        const categoryData = data[topic];

        if (!categoryData) {
            throw new Error(`Topic '${topic}' not found`);
        }

        // Generate content HTML
        const contentHTML = generateEducationalContentHTML(categoryData);
        contentContainer.innerHTML = contentHTML;

        // Update active topic button
        updateActiveTopicButton(topic);

    } catch (error) {
        console.error('Error loading educational content:', error);
        contentContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="text-red-500 mb-2">❌</div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar conteúdo</h3>
                <p class="text-gray-600 text-sm">Não foi possível carregar as informações educacionais. Tente novamente.</p>
                <button onclick="loadEducationalContent('${topic}')" class="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/80">
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

/**
 * Generates HTML content for a specific educational category
 * @param {Object} categoryData - The category data from JSON
 * @returns {string} HTML content
 */
function generateEducationalContentHTML(categoryData) {
    const { title, description, topics } = categoryData;

    let html = `
        <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">${title}</h3>
            <p class="text-gray-600 text-sm">${description}</p>
        </div>
    `;

    if (topics) {
        Object.entries(topics).forEach(([topicKey, topicData]) => {
            html += `
                <div class="educational-content-item">
                    <h4>${topicData.title}</h4>
                    <div class="text-sm text-gray-700">${topicData.content}</div>
                    ${topicData.example ? `<div class="example text-sm">${topicData.example}</div>` : ''}
                    ${topicData.legal ? `<div class="legal-reference">${topicData.legal}</div>` : ''}
                </div>
            `;
        });
    }

    return html;
}

/**
 * Updates the active state of topic navigation elements
 * @param {string} activeTopic - The currently active topic
 */
function updateActiveTopicButton(activeTopic) {
    // Update buttons (if they exist)
    const topicButtons = document.querySelectorAll('.educational-topic-btn');
    topicButtons.forEach(button => {
        const buttonTopic = button.dataset.topic;
        if (buttonTopic === activeTopic) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Update dropdown selector
    const topicSelector = document.getElementById('topic-selector');
    if (topicSelector) {
        topicSelector.value = activeTopic || '';
    }
}

/**
 * Shows the welcome message in the educational panel
 */
export function showEducationalWelcome() {
    const contentContainer = document.getElementById('educational-content');
    const welcomeDiv = document.getElementById('educational-welcome');

    if (contentContainer && welcomeDiv) {
        contentContainer.innerHTML = '';
        welcomeDiv.style.display = 'block';
        contentContainer.appendChild(welcomeDiv);
    }

    // Clear active topic button
    updateActiveTopicButton('');
}

/**
 * Updates the salary simulator result display
 * @param {object} result - The calculation result from calculateNetSalary
 */
export function updateSalaryResult(result) {
    const resultElement = document.getElementById('simular-salario-liquido-resultado');
    if (!resultElement) return;

    resultElement.textContent = formatCurrency(result.salarioLiquido);
}


// --- Calculation Memory Modal ---

/**
 * Centralized function to update modal content and show it.
 * This function is agnostic to calculation type and reuses the generateReportHTML logic.
 * @param {Object} data - The calculation data object with type, results, and state
 */
export function updateAndShowModal(data) {
    const modalBody = document.getElementById('calculation-memory-modal-body');
    if (!modalBody) {
        console.error('Modal body element not found');
        return;
    }

    // Clear previous content
    modalBody.innerHTML = '';

    // Validate data
    if (!data || !data.type || !data.results) {
        modalBody.innerHTML = '<p class="text-red-500">Erro: Dados inválidos para exibir no modal.</p>';
        showCalculationMemoryModal();
        return;
    }

    // Generate content using the same logic as generateReportHTML but adapted for modal
    const modalContent = generateModalContent(data);
    modalBody.innerHTML = modalContent;

    // Show the modal
    showCalculationMemoryModal();
}

// --- MODAL TEMPLATE FUNCTIONS (Private) ---

/**
 * Cria uma seção padronizada para o modal com título e conteúdo
 * @param {string} title - Título da seção (ex: "Proventos", "Descontos")
 * @param {string} contentHTML - Conteúdo HTML da seção
 * @param {string} additionalClasses - Classes CSS adicionais (opcional)
 * @returns {string} HTML da seção formatada
 */
function _createModalSection(title, contentHTML, additionalClasses = '') {
    return `
        <div class="mt-4 ${additionalClasses}">
            <h4 class="font-semibold text-gray-800 mb-2">${title}</h4>
            <div class="space-y-1 text-sm">
                ${contentHTML}
            </div>
        </div>`;
}

/**
 * Cria uma linha de resumo padronizada para o modal
 * @param {string} label - Rótulo da linha
 * @param {string} value - Valor a ser exibido
 * @param {string} type - Tipo para aplicar cor ('provento', 'desconto', 'neutral')
 * @returns {string} HTML da linha formatada
 */
function _createModalSummaryRow(label, value, type = 'neutral') {
    const colorClasses = {
        'provento': 'text-green-600',
        'desconto': 'text-red-600',
        'neutral': 'text-gray-800'
    };
    
    const colorClass = colorClasses[type] || colorClasses.neutral;
    const prefix = type === 'desconto' ? '-' : '';
    
    return `
        <div class="flex justify-between py-1">
            <span class="text-gray-600">${label}:</span>
            <span class="font-medium ${colorClass}">${prefix}${value}</span>
        </div>`;
}

/**
 * Cria o bloco de resultado final com destaque visual
 * @param {string} label - Rótulo do resultado final
 * @param {string} value - Valor final a ser exibido
 * @param {string} colorClass - Classe CSS para cor (opcional, padrão: text-blue-600)
 * @returns {string} HTML do resultado final
 */
function _createModalFinalResult(label, value, colorClass = 'text-blue-600') {
    return `
        <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">${label}:</span>
                <span class="font-bold ${colorClass}">${value}</span>
            </div>
        </div>`;
}

/**
 * Cria a seção de parâmetros de entrada do cálculo
 * @param {Object} paramsObject - Objeto com os parâmetros (chave: valor)
 * @returns {string} HTML da seção de parâmetros
 */
function _createModalInputParams(paramsObject) {
    if (!paramsObject || Object.keys(paramsObject).length === 0) return '';
    
    let paramsHTML = '';
    for (const [key, value] of Object.entries(paramsObject)) {
        if (value !== undefined && value !== null && value !== '') {
            paramsHTML += _createModalSummaryRow(key, value, 'neutral');
        }
    }
    
    return _createModalSection('Parâmetros de Entrada', paramsHTML);
}

/**
 * Generates a generic memory calculation block based on the `memoriaCalculo` object.
 * @param {object} memoriaCalculo - The memory object from the calculation result.
 * @returns {string} HTML content for the memory steps.
 */
function generateMemoryStepsHTML(memoriaCalculo) {
    if (!memoriaCalculo) return '';
    let html = '<div class="mt-4 space-y-2">';
    html += '<h4 class="font-semibold text-gray-800">Memória de Cálculo</h4>';
    html += '<div class="mt-2 space-y-1 text-sm p-3 bg-gray-50 rounded-md border">';
    for (const [key, value] of Object.entries(memoriaCalculo)) {
        html += `
            <div class="flex justify-between py-1 border-b border-gray-200 last:border-b-0">
                <span class="text-gray-600">${key}:</span>
                <span class="font-medium text-right">${value}</span>
            </div>
        `;
    }
    html += '</div></div>';
    return html;
}


/**
 * Generates modal-specific content HTML for any calculation type.
 * Reuses the logic from generateReportHTML but with modal-specific styling.
 * @param {Object} data - The calculation data object
 * @returns {string} HTML content specifically formatted for the modal
 */
function generateModalContent(data) {
    const { type, results, state: inputState } = data;

    let contentHTML = '<div class="space-y-4">';
    let calculatorTitle = '';

    switch (type) {
        case 'ferias':
            calculatorTitle = 'Cálculo de Férias';
            contentHTML += generateFeriasModalContent(results, inputState);
            break;
        case 'decimoTerceiro':
            calculatorTitle = 'Cálculo do 13º Salário';
            contentHTML += generateDecimoTerceiroModalContent(results, inputState);
            break;
        case 'salarioLiquido':
            calculatorTitle = 'Cálculo do Salário Líquido';
            contentHTML += generateSalarioLiquidoModalContent(results, inputState);
            break;
        case 'rescisao':
            calculatorTitle = 'Cálculo de Rescisão';
            contentHTML += generateRescisaoModalContent(results, inputState);
            break;
        case 'fgts':
            calculatorTitle = 'Memória de Cálculo - FGTS';
            contentHTML += generateFgtsModalContent(results, inputState);
            break;
        case 'pisPasep':
            calculatorTitle = 'Memória de Cálculo - PIS/PASEP';
            contentHTML += generatePisPasepModalContent(results, inputState);
            break;
        case 'seguroDesemprego':
            calculatorTitle = 'Memória de Cálculo - Seguro-Desemprego';
            contentHTML += generateSeguroDesempregoModalContent(results, inputState);
            break;
        case 'horasExtras':
            calculatorTitle = 'Memória de Cálculo - Horas Extras';
            contentHTML += generateHorasExtrasModalContent(results, inputState);
            break;
        case 'inss':
            calculatorTitle = 'Memória de Cálculo - INSS';
            contentHTML += generateInssModalContent(results, inputState);
            break;
        case 'valeTransporte':
            calculatorTitle = 'Memória de Cálculo - Vale-Transporte';
            contentHTML += generateValeTransporteModalContent(results, inputState);
            break;
        case 'irpf':
            calculatorTitle = 'Memória de Cálculo - IRPF';
            contentHTML += generateIrpfModalContent(results, inputState);
            break;
        default:
            return '<p class="text-red-500">Erro: Tipo de cálculo não reconhecido.</p>';
    }

    contentHTML += '</div>';

    // Add modal header
    const modalHTML = `
        <h3 class="text-lg font-semibold leading-none tracking-tight text-gray-800">${calculatorTitle}</h3>
        <p class="text-sm text-gray-600">Resumo detalhado do seu cálculo.</p>
        ${contentHTML}
    `;

    return modalHTML;
}

function generatePisPasepModalContent(results, inputState) {
    const { valorAbono, elegivel, memoriaCalculo } = results;
    
    let html = generateMemoryStepsHTML(memoriaCalculo);
    html += _createModalFinalResult('Valor do Abono', formatCurrency(valorAbono), elegivel ? 'text-green-600' : 'text-red-600');
    
    return html;
}

function generateSeguroDesempregoModalContent(results, inputState) {
    const { numeroParcelas, valorPorParcela, memoriaCalculo } = results;
    
    let html = generateMemoryStepsHTML(memoriaCalculo);
    
    let valoresHTML = '';
    valoresHTML += _createModalSummaryRow('Nº de Parcelas', numeroParcelas, 'neutral');
    valoresHTML += _createModalSummaryRow('Valor por Parcela', formatCurrency(valorPorParcela), 'provento');
    
    html += _createModalSection('Valores do Benefício', valoresHTML);
    
    return html;
}

function generateHorasExtrasModalContent(results, inputState) {
    const { totalGeralAdicionais, memoriaCalculo } = results;
    
    let html = generateMemoryStepsHTML(memoriaCalculo);
    html += _createModalFinalResult('Total de Adicionais', formatCurrency(totalGeralAdicionais), 'text-green-600');
    
    return html;
}

function generateInssModalContent(results, inputState) {
    const { contribuicaoINSS, aliquotaEfetiva, memoriaCalculo } = results;
    
    let html = generateMemoryStepsHTML(memoriaCalculo);
    html += _createModalFinalResult('Contribuição Devida', formatCurrency(contribuicaoINSS), 'text-red-600');
    
    return html;
}

function generateValeTransporteModalContent(results, inputState) {
    const { descontoRealEmpregado, valorBeneficioEmpregador, memoriaCalculo } = results;
    
    let html = generateMemoryStepsHTML(memoriaCalculo);
    
    let valoresHTML = '';
    valoresHTML += _createModalSummaryRow('Desconto do Empregado', formatCurrency(descontoRealEmpregado), 'desconto');
    valoresHTML += _createModalSummaryRow('Custeado pelo Empregador', formatCurrency(valorBeneficioEmpregador), 'provento');
    
    html += _createModalSection('Valores do Vale-Transporte', valoresHTML);
    
    return html;
}

function generateFgtsModalContent(results, inputState) {
    const { depositoMensal, valorSaque, memoriaCalculo } = results;
    
    let html = generateMemoryStepsHTML(memoriaCalculo);
    
    let valoresHTML = '';
    valoresHTML += _createModalSummaryRow('Depósito Mensal Estimado', formatCurrency(depositoMensal), 'neutral');
    valoresHTML += _createModalSummaryRow('Valor de Saque Estimado', formatCurrency(valorSaque), 'provento');
    
    html += _createModalSection('Valores do FGTS', valoresHTML);
    
    return html;
}

function generateIrpfModalContent(results, inputState) {
    const { ajusteFinal, tipoAjuste, memoriaCalculo } = results;
    const isPagar = tipoAjuste === 'pagar';
    const isRestituir = tipoAjuste === 'restituir';
    const colorClass = isPagar ? 'text-red-600' : (isRestituir ? 'text-green-600' : 'text-gray-800');
    const label = isPagar ? 'Imposto a Pagar' : 'Imposto a Restituir';

    let html = generateMemoryStepsHTML(memoriaCalculo);
    html += _createModalFinalResult(label, formatCurrency(Math.abs(ajusteFinal)), colorClass);
    
    return html;
}


/**
 * Generates modal content for Ferias calculation
 */
function generateFeriasModalContent(results, inputState) {
    const { baseDeCalculo, valorFerias, tercoConstitucional, valorAbono, tercoAbono, adiantamento13, descontoINSS, descontoIRRF, valorLiquido, venderFerias, adiantarDecimo, diasFerias } = results;

    // 1. Parâmetros de Entrada
    const inputParams = {
        'Base de Cálculo': formatCurrency(baseDeCalculo),
        'Dias de Férias': `${diasFerias} dias`
    };
    let html = _createModalInputParams(inputParams);

    // 2. Proventos (Ganhos)
    let proventosHTML = '';
    proventosHTML += _createModalSummaryRow(`Valor das Férias (${venderFerias ? (diasFerias - (diasFerias/3)) : diasFerias} dias)`, formatCurrency(valorFerias), 'provento');
    proventosHTML += _createModalSummaryRow('1/3 Constitucional sobre Férias', formatCurrency(tercoConstitucional), 'provento');
    
    if (venderFerias && valorAbono > 0) {
        proventosHTML += _createModalSummaryRow('Abono Pecuniário (Venda 1/3)', formatCurrency(valorAbono), 'provento');
        proventosHTML += _createModalSummaryRow('1/3 sobre Abono Pecuniário', formatCurrency(tercoAbono), 'provento');
    }
    
    if (adiantarDecimo && adiantamento13 > 0) {
        proventosHTML += _createModalSummaryRow('Adiantamento 13º Salário', formatCurrency(adiantamento13), 'provento');
    }
    
    html += _createModalSection('Proventos (Ganhos)', proventosHTML);

    // 3. Descontos
    let descontosHTML = '';
    descontosHTML += _createModalSummaryRow('INSS', formatCurrency(descontoINSS.value), 'desconto');
    descontosHTML += _createModalSummaryRow('IRRF', formatCurrency(descontoIRRF.value), 'desconto');
    
    html += _createModalSection('Descontos', descontosHTML);

    // 4. Resultado Final
    html += _createModalFinalResult('Total Líquido a Receber', formatCurrency(valorLiquido), 'text-blue-600');

    return html;
}

/**
 * Generates modal content for Decimo Terceiro calculation
 */
function generateDecimoTerceiroModalContent(results, inputState) {
    const { baseDeCalculo, mesesTrabalhados, valorBrutoDecimo, descontoINSS, descontoIRRF, valorLiquidoDecimo, adiantamentoRecebido, valorAReceber } = results;

    // 1. Parâmetros de Entrada
    const inputParams = {
        'Base de Cálculo': formatCurrency(baseDeCalculo),
        'Meses trabalhados': `${mesesTrabalhados} meses`,
        '13º Salário Bruto': formatCurrency(valorBrutoDecimo)
    };
    let html = _createModalInputParams(inputParams);

    // 2. Descontos
    let descontosHTML = '';
    descontosHTML += _createModalSummaryRow('INSS', formatCurrency(descontoINSS.value), 'desconto');
    descontosHTML += _createModalSummaryRow('IRRF', formatCurrency(descontoIRRF.value), 'desconto');
    
    html += _createModalSection('Descontos', descontosHTML);

    // 3. Valores Finais
    let valoresFinaisHTML = '';
    valoresFinaisHTML += _createModalSummaryRow('13º Salário Líquido', formatCurrency(valorLiquidoDecimo), 'provento');
    
    if (adiantamentoRecebido > 0) {
        valoresFinaisHTML += _createModalSummaryRow('(-) Adiantamento já recebido', formatCurrency(adiantamentoRecebido), 'desconto');
    }
    
    html += _createModalSection('Valores Finais', valoresFinaisHTML);

    // 4. Resultado Final
    html += _createModalFinalResult('Valor a Receber', formatCurrency(valorAReceber), 'text-blue-600');

    return html;
}

/**
 * Generates modal content for Salario Liquido calculation
 */
function generateSalarioLiquidoModalContent(results, inputState) {
    const { salarioBruto, horasExtras, adicionalPericulosidade, adicionalInsalubridade, adicionalNoturno, salarioFamilia, descontoINSS, descontoIRRF, descontoVT, descontoVR, descontoSaude, descontoAdiantamentos, totalProventos, totalDescontos, salarioLiquido } = results;

    let html = '';

    // 1. Proventos (Ganhos)
    let proventosHTML = '';
    proventosHTML += _createModalSummaryRow('Salário Base', formatCurrency(salarioBruto), 'provento');
    
    if (horasExtras > 0) {
        proventosHTML += _createModalSummaryRow('Horas Extras', formatCurrency(horasExtras), 'provento');
    }
    
    if (adicionalPericulosidade > 0) {
        proventosHTML += _createModalSummaryRow('Adicional de Periculosidade', formatCurrency(adicionalPericulosidade), 'provento');
    }
    
    if (adicionalInsalubridade > 0) {
        proventosHTML += _createModalSummaryRow('Adicional de Insalubridade', formatCurrency(adicionalInsalubridade), 'provento');
    }
    
    if (adicionalNoturno > 0) {
        proventosHTML += _createModalSummaryRow('Adicional Noturno', formatCurrency(adicionalNoturno), 'provento');
    }
    
    if (salarioFamilia > 0) {
        proventosHTML += _createModalSummaryRow('Salário Família', formatCurrency(salarioFamilia), 'provento');
    }
    
    proventosHTML += `
        <div class="flex justify-between font-semibold border-t pt-2 mt-2">
            <span class="text-gray-600">Total Bruto:</span>
            <span class="font-medium text-green-600">${formatCurrency(totalProventos)}</span>
        </div>`;
    
    html += _createModalSection('Proventos (Ganhos)', proventosHTML);

    // 2. Descontos
    let descontosHTML = '';
    descontosHTML += _createModalSummaryRow('INSS', formatCurrency(descontoINSS.value), 'desconto');
    descontosHTML += _createModalSummaryRow('IRRF', formatCurrency(descontoIRRF.value), 'desconto');
    
    if (descontoVT > 0) {
        descontosHTML += _createModalSummaryRow('Vale-Transporte (6%)', formatCurrency(descontoVT), 'desconto');
    }
    
    if (descontoVR > 0) {
        descontosHTML += _createModalSummaryRow('Vale-Refeição/Alimentação', formatCurrency(descontoVR), 'desconto');
    }
    
    if (descontoSaude > 0) {
        descontosHTML += _createModalSummaryRow('Plano de Saúde / Odontológico', formatCurrency(descontoSaude), 'desconto');
    }
    
    if (descontoAdiantamentos > 0) {
        descontosHTML += _createModalSummaryRow('Adiantamentos (Vale)', formatCurrency(descontoAdiantamentos), 'desconto');
    }
    
    descontosHTML += `
        <div class="flex justify-between font-semibold border-t pt-2 mt-2">
            <span class="text-gray-600">Total de Descontos:</span>
            <span class="font-medium text-red-600">-${formatCurrency(totalDescontos)}</span>
        </div>`;
    
    html += _createModalSection('Descontos', descontosHTML);

    // 3. Resultado Final
    html += _createModalFinalResult('Salário Líquido a Receber', formatCurrency(salarioLiquido), 'text-blue-600');

    return html;
}

/**
 * Generates modal content for Rescisao calculation
 */
function generateRescisaoModalContent(results, inputState) {
    const { proventos, descontos, totalProventos, totalDescontos, valorLiquido } = results;

    let html = '';

    // 1. Parâmetros de Entrada (Informações da Rescisão)
    const inputParams = {
        'Data de Admissão': formatDateBR(inputState.dataAdmissao),
        'Data de Demissão': formatDateBR(inputState.dataDemissao),
        'Último Salário Bruto': formatCurrency(inputState.salarioBruto)
    };
    html += _createModalInputParams(inputParams);

    // 2. Verbas Rescisórias (Ganhos)
    let proventosHTML = '';
    Object.entries(proventos).forEach(([key, data]) => {
        if (data.valor > 0) {
            proventosHTML += `
                <details class="calculation-details-item border-b border-gray-200 pb-2">
                    <summary class="flex justify-between items-center cursor-pointer py-1">
                        <span class="text-gray-600">${key}</span>
                        <strong class="text-green-600 font-medium">${formatCurrency(data.valor)}</strong>
                    </summary>
                    <div class="calculation-details-content mt-2 p-2 bg-gray-50 rounded-md border-l-4 border-blue-500">
                        <p class="text-xs text-gray-600">${data.explicacao}</p>
                    </div>
                </details>`;
        }
    });
    
    proventosHTML += `
        <div class="flex justify-between font-semibold border-t pt-2 mt-2">
            <span class="text-gray-600">Total de Proventos:</span>
            <span class="font-medium text-green-600">${formatCurrency(totalProventos)}</span>
        </div>`;
    
    html += _createModalSection('Verbas Rescisórias (Ganhos)', proventosHTML);

    // 3. Descontos
    let descontosHTML = '';
    Object.entries(descontos).forEach(([key, result]) => {
        const value = result.value || 0;
        if (value > 0) {
            descontosHTML += _createModalSummaryRow(key, formatCurrency(value), 'desconto');
        }
    });
    
    descontosHTML += `
        <div class="flex justify-between font-semibold border-t pt-2 mt-2">
            <span class="text-gray-600">Total de Descontos:</span>
            <span class="font-medium text-red-600">-${formatCurrency(totalDescontos)}</span>
        </div>`;
    
    html += _createModalSection('Descontos', descontosHTML);

    // 4. Resultado Final
    html += _createModalFinalResult('Total Líquido a Receber', formatCurrency(valorLiquido), 'text-blue-600');

    return html;
}

/**
 * Legacy function for backward compatibility - now delegates to updateAndShowModal
 * @deprecated Use updateAndShowModal instead
 */
export function renderCalculationMemory(results) {
    const calculatorName = state.activeTab;
    const data = {
        type: calculatorName,
        results: results,
        state: state[calculatorName]
    };
    updateAndShowModal(data);
}

export function showCalculationMemoryModal() {
    const modal = document.getElementById('calculation-memory-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.setAttribute('data-state', 'open');
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }
}

export function hideCalculationMemoryModal() {
    const modal = document.getElementById('calculation-memory-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.setAttribute('data-state', 'closed');
        // Restore body scroll when modal is closed
        document.body.style.overflow = '';
    }
}


// --- RESULT TEMPLATE FUNCTIONS ---

/**
 * Função template reutilizável para criar cards de resultado
 * Elimina duplicação de estrutura HTML entre todas as calculadoras
 * @param {string} title - Título do card
 * @param {string} description - Descrição do card 
 * @param {string} contentHTML - Conteúdo específico do card
 * @returns {string} HTML completo do card
 */
function createResultCard(title, description, contentHTML) {
    return `
        <div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in">
            <div class="flex flex-col space-y-1.5 p-6">
                <h3 class="text-2xl font-semibold leading-none tracking-tight">${title}</h3>
                <p class="text-sm text-muted-foreground">${description}</p>
            </div>
            <div class="p-6 pt-0">
                ${contentHTML}
            </div>
            <div class="flex items-center p-6 pt-0 flex-col gap-4">
                <div class="flex gap-2 w-full mt-6">
                    <button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button>
                    <button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button>
                </div>
            </div>
        </div>`;
}

/**
 * Função auxiliar para criar linhas de resultado padronizadas
 * Elimina repetição do padrão flex justify-between
 * @param {string} label - Label da linha
 * @param {string} value - Valor a ser exibido
 * @param {string} valueColorClass - Classe CSS para cor do valor (opcional)
 * @returns {string} HTML da linha de resultado
 */
function createResultRow(label, value, valueColorClass = 'text-gray-800') {
    return `
        <div class="flex justify-between result-row py-2">
            <span>${label}:</span>
            <span class="font-mono ${valueColorClass}">${value}</span>
        </div>`;
}

/**
 * Cria uma linha de exibição de valor com layout flexível e tamanho de texto personalizável
 * @param {string} label - Rótulo da linha
 * @param {string} value - Valor a ser exibido
 * @param {string} [textSize='text-lg'] - Classe de tamanho do texto
 * @param {string} [valueColorClass='text-gray-800'] - Classe CSS para cor do valor
 * @param {string} [additionalClasses=''] - Classes CSS adicionais
 * @returns {string} HTML da linha formatada
 */
function createFlexValueRow(label, value, textSize = 'text-lg', valueColorClass = 'text-gray-800', additionalClasses = '') {
    return `
        <div class="flex justify-between items-center ${textSize} ${additionalClasses}">
            <span class="font-bold text-gray-900">${label}:</span>
            <span class="font-bold ${valueColorClass}">${value}</span>
        </div>`;
}

/**
 * Cria um container com bordas e espaçamento padrão para seções
 * @param {string} content - Conteúdo HTML interno
 * @param {string} [additionalClasses=''] - Classes CSS adicionais
 * @returns {string} HTML do container formatado
 */
function createSectionContainer(content, additionalClasses = '') {
    return `
        <div class="mt-4 pt-4 border-t border-gray-200 ${additionalClasses}">
            ${content}
        </div>`;
}

function createFgtsResultHTML(results) {
    if (Object.keys(state.fgts.errors).some(k => state.fgts.errors[k])) {
        return '<p class="text-center text-red-500 font-semibold">Por favor, corrija os campos destacados acima para ver o seu cálculo.</p>';
    }
    if (!results || !results.salarioBruto) return '<p class="text-center text-muted-foreground">Preencha os campos para calcular.</p>';

    const { depositoMensal, valorSaque, opcaoSaque } = results;
    const saqueLabel = opcaoSaque === 'rescisao' ? 'Saque-Rescisão' : 'Saque-Aniversário';

    const content = `
        <div class="space-y-4">
            <div>
                <h4 class="text-lg font-semibold text-primary">Depósito Mensal</h4>
                ${createResultRow('Valor Estimado do Depósito', formatCurrency(depositoMensal), 'text-green-600')}
            </div>
            <div>
                <h4 class="text-lg font-semibold text-primary mt-4">Simulação de Saque</h4>
                ${createResultRow(`Valor Estimado do ${saqueLabel}`, formatCurrency(valorSaque), 'text-green-600')}
            </div>
        </div>`;

    return createResultCard('Resultado da Simulação FGTS', 'Resumo das suas simulações de FGTS.', content);
}

function createPisPasepResultHTML(results) {
    if (!results) return '';
    const { valorAbono, elegivel, mensagem } = results;
    let messageColorClass = elegivel ? 'text-gray-600' : 'text-red-500';

    const content = `
        <div class="space-y-2">
            ${createResultRow('Valor Estimado do Abono', formatCurrency(valorAbono), 'text-green-600')}
            <p class="text-sm ${messageColorClass} pt-2">${mensagem}</p>
        </div>`;

    return createResultCard('Resultado do Abono Salarial (PIS/PASEP)', '', content);
}

function createSeguroDesempregoResultHTML(results) {
    if (!results) return '';
    const { numeroParcelas, valorPorParcela, elegivel, mensagem } = results;
    let messageColorClass = elegivel ? 'text-gray-600' : 'text-red-500';

    const content = `
        <div class="space-y-2">
            ${createResultRow('Número de Parcelas', numeroParcelas, 'text-blue-600')}
            ${createResultRow('Valor por Parcela', formatCurrency(valorPorParcela), 'text-green-600')}
            <p class="text-sm ${messageColorClass} pt-2">${mensagem}</p>
        </div>`;

    return createResultCard('Resultado do Seguro-Desemprego', '', content);
}

function createINSSResultHTML(results) {
    if (!results) return '';
    const { contribuicaoINSS, mensagem } = results;

    const content = `
        <div class="space-y-2">
            ${createResultRow('Valor da Contribuição', formatCurrency(contribuicaoINSS), 'text-red-600')}
            <p class="text-sm text-gray-600 pt-2">${mensagem}</p>
        </div>`;

    return createResultCard('Resultado da Contribuição INSS', '', content);
}

function createHorasExtrasResultHTML(results) {
    if (!results) return '';
    const { totalValorHE50, totalValorHE100, totalValorAdicionalNoturno, totalGeralAdicionais, mensagem } = results;

    const content = `
        <div class="space-y-2">
            ${createResultRow('Total de Horas Extras 50%', formatCurrency(totalValorHE50), 'text-green-600')}
            ${createResultRow('Total de Horas Extras 100%', formatCurrency(totalValorHE100), 'text-green-600')}
            ${createResultRow('Total de Adicional Noturno', formatCurrency(totalValorAdicionalNoturno), 'text-green-600')}
            <div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2">
                <span>Total Geral de Adicionais:</span>
                <span class="font-mono text-blue-600">${formatCurrency(totalGeralAdicionais)}</span>
            </div>
            <p class="text-sm text-gray-600 pt-2">${mensagem}</p>
        </div>`;

    return createResultCard('Resultado do Cálculo de Horas Extras', '', content);
}

function createValeTransporteResultHTML(results) {
    if (!results) return '';
    const { custoMensalTotal, descontoMaximoSalario, descontoRealEmpregado, valorBeneficioEmpregador, mensagem } = results;

    const content = `
        <div class="space-y-2">
            ${createResultRow('Custo Mensal Total do Transporte', formatCurrency(custoMensalTotal))}
            ${createResultRow('Desconto Máximo (6% do Salário)', formatCurrency(descontoMaximoSalario))}
            ${createResultRow('Desconto Real do Empregado', formatCurrency(descontoRealEmpregado), 'text-red-600')}
            ${createResultRow('Valor Fornecido pelo Empregador', formatCurrency(valorBeneficioEmpregador), 'text-green-600')}
            <p class="text-sm text-gray-600 pt-2">${mensagem}</p>
        </div>`;

    return createResultCard('Resultado do Cálculo de Vale-Transporte', '', content);
}

function createIRPFResultHTML(results) {
    if (!results) return '';
    const { impostoDevido, ajusteFinal, tipoAjuste, mensagem } = results;

    const ajusteLabel = tipoAjuste === 'pagar' ? 'Imposto a Pagar' : 'Imposto a Restituir';
    const ajusteColorClass = tipoAjuste === 'pagar' ? 'text-red-600' : 'text-green-600';

    const content = `
        <div class="space-y-2">
            ${createResultRow('Total de Imposto Devido no Ano', formatCurrency(impostoDevido))}
            <div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2">
                <span>${ajusteLabel}:</span>
                <span class="font-mono ${ajusteColorClass}">${formatCurrency(Math.abs(ajusteFinal))}</span>
            </div>
            <p class="text-sm text-gray-600 pt-2">${mensagem}</p>
        </div>`;

    return createResultCard('Resultado da Simulação de IRPF Anual', '', content);
}

function createFeriasResultHTML(results) {
    if (Object.keys(state.ferias.errors).some(k => state.ferias.errors[k])) {
        return '<p class="text-center text-red-500 font-semibold">Por favor, corrija os campos destacados acima para ver o seu cálculo.</p>';
    }
    if (!results || !results.salarioBruto) return '<p class="text-center text-muted-foreground">Preencha os campos para calcular.</p>';

    const { baseDeCalculo, valorFerias, tercoConstitucional, valorAbono, tercoAbono, adiantamento13, descontoINSS, descontoIRRF, valorLiquido, venderFerias, adiantarDecimo, diasFerias } = results;
    const inssDetailsHTML = descontoINSS.details.map(d => `<p class="text-xs">${d.range}: ${d.base} x ${d.rate} = <strong>${d.value}</strong></p>`).join('');
    const irrfDetailsHTML = `<p class="text-xs">Base de Cálculo: ${descontoIRRF.details.base}</p><p class="text-xs">Dedução por Dependentes: ${descontoIRRF.details.dependentsDeduction}</p><p class="text-xs">Base p/ IRRF: ${descontoIRRF.details.irrfBase}</p><p class="text-xs">Alíquota: ${descontoIRRF.details.rate}</p><p class="text-xs">Parcela a Deduzir: ${descontoIRRF.details.deduction}</p>`;

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in"><div class="flex flex-col space-y-1.5 p-6"><h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado do Cálculo</h3><p class="text-sm text-muted-foreground">Resumo do seu cálculo de férias.</p></div><div class="p-6 pt-0"><div class="space-y-1"><div class="flex justify-between result-row py-2"><span>Base de Cálculo para Férias:</span> <span class="font-mono">${formatCurrency(baseDeCalculo)}</span></div><h4 class="text-lg font-semibold text-primary mt-4">Proventos (Ganhos)</h4><div class="flex justify-between result-row py-2"><span>Valor das Férias (${venderFerias ? (diasFerias - (diasFerias/3)) : diasFerias} dias):</span> <span class="font-mono text-green-600">${formatCurrency(valorFerias)}</span></div><div class="flex justify-between result-row py-2"><span>1/3 Constitucional sobre Férias:</span> <span class="font-mono text-green-600">${formatCurrency(tercoConstitucional)}</span></div>${venderFerias ? `<div class="flex justify-between result-row py-2"><span>Abono Pecuniário (Venda 1/3):</span> <span class="font-mono text-green-600">${formatCurrency(valorAbono)}</span></div><div class="flex justify-between result-row py-2"><span>1/3 sobre Abono Pecuniário:</span> <span class="font-mono text-green-600">${formatCurrency(tercoAbono)}</span></div>` : ''}${adiantarDecimo ? `<div class="flex justify-between result-row py-2"><span>Adiantamento 13º Salário:</span> <span class="font-mono text-green-600">${formatCurrency(adiantamento13)}</span></div>` : ''}<h4 class="text-lg font-semibold text-red-600 mt-4">Descontos</h4><div class="flex justify-between result-row py-2"><span>INSS sobre Férias: <button class="details-btn text-primary text-xs" data-details-for="inss-details-ferias">(Ver Detalhes)</button></span><span class="font-mono text-red-600">-${formatCurrency(descontoINSS.value)}</span></div><div id="inss-details-ferias" class="hidden text-xs space-y-1 pl-4 border-l-2 py-2 my-2 bg-gray-50">${inssDetailsHTML}</div><div class="flex justify-between result-row py-2"><span>IRRF sobre Férias: <button class="details-btn text-primary text-xs" data-details-for="irrf-details-ferias">(Ver Detalhes)</button></span><span class="font-mono text-red-600">-${formatCurrency(descontoIRRF.value)}</span></div><div id="irrf-details-ferias" class="hidden text-xs space-y-1 pl-4 border-l-2 py-2 my-2 bg-gray-50">${irrfDetailsHTML}</div></div></div><div class="flex items-center p-6 pt-0 flex-col gap-4"><div class="w-full border-t border-border pt-4 flex justify-between items-center"><span class="total-liquido-label">Total Líquido a Receber:</span><span class="font-mono text-green-600 total-liquido-valor">${formatCurrency(valorLiquido)}</span></div><div class="flex gap-2 w-full"><button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button><button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button></div></div></div>`;
}

function createDecimoTerceiroResultHTML(results) {
    if (Object.keys(state.decimoTerceiro.errors).some(k => state.decimoTerceiro.errors[k])) {
        return '<p class="text-center text-red-500 font-semibold">Por favor, corrija os campos destacados acima para ver o seu cálculo.</p>';
    }
    if (!results || !results.salarioBruto) return '<p class="text-center text-muted-foreground">Preencha os campos para calcular.</p>';

    const { baseDeCalculo, mesesTrabalhados, valorBrutoDecimo, descontoINSS, descontoIRRF, valorLiquidoDecimo, adiantamentoRecebido, valorAReceber } = results;
    const inssDetailsHTML = descontoINSS.details.map(d => `<p class="text-xs">${d.range}: ${d.base} x ${d.rate} = <strong>${d.value}</strong></p>`).join('');
    const irrfDetailsHTML = `<p class="text-xs">Base de Cálculo: ${descontoIRRF.details.base}</p><p class="text-xs">Dedução por Dependentes: ${descontoIRRF.details.dependentsDeduction}</p><p class="text-xs">Base p/ IRRF: ${descontoIRRF.details.irrfBase}</p><p class="text-xs">Alíquota: ${descontoIRRF.details.rate}</p><p class="text-xs">Parcela a Deduzir: ${descontoIRRF.details.deduction}</p>`;

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in"><div class="flex flex-col space-y-1.5 p-6"><h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado do Cálculo do 13º Salário</h3><p class="text-sm text-muted-foreground">Resumo do seu cálculo de 13º salário.</p></div><div class="p-6 pt-0"><div class="space-y-1"><div class="flex justify-between result-row py-2"><span>Base de Cálculo:</span> <span class="font-mono">${formatCurrency(baseDeCalculo)}</span></div><div class="flex justify-between result-row py-2"><span>Meses trabalhados:</span> <span class="font-mono">${mesesTrabalhados} meses</span></div><div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2"><span>13º Salário Bruto:</span> <span class="font-mono">${formatCurrency(valorBrutoDecimo)}</span></div><h4 class="text-lg font-semibold text-red-600 mt-4">Descontos</h4><div class="flex justify-between result-row py-2"><span>INSS: <button class="details-btn text-primary text-xs" data-details-for="inss-details-13">(Ver Detalhes)</button></span><span class="font-mono text-red-600">-${formatCurrency(descontoINSS.value)}</span></div><div id="inss-details-13" class="hidden text-xs space-y-1 pl-4 border-l-2 py-2 my-2 bg-gray-50">${inssDetailsHTML}</div><div class="flex justify-between result-row py-2"><span>IRRF: <button class="details-btn text-primary text-xs" data-details-for="irrf-details-13">(Ver Detalhes)</button></span><span class="font-mono text-red-600">-${formatCurrency(descontoIRRF.value)}</span></div><div id="irrf-details-13" class="hidden text-xs space-y-1 pl-4 border-l-2 py-2 my-2 bg-gray-50">${irrfDetailsHTML}</div><h4 class="text-lg font-semibold text-primary mt-4">Valores Finais</h4><div class="flex justify-between result-row py-2"><span>13º Salário Líquido:</span> <span class="font-mono text-green-600">${formatCurrency(valorLiquidoDecimo)}</span></div>${adiantamentoRecebido > 0 ? `<div class="flex justify-between result-row py-2"><span>(-) Adiantamento já recebido:</span> <span class="font-mono text-red-600">-${formatCurrency(adiantamentoRecebido)}</span></div>` : ''}</div></div><div class="flex items-center p-6 pt-0 flex-col gap-4"><div class="w-full border-t border-border pt-4 flex justify-between items-center"><span class="total-liquido-label">Valor a Receber:</span><span class="font-mono text-green-600 total-liquido-valor">${formatCurrency(valorAReceber)}</span></div><div class="flex gap-3 w-full"><button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button><button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button></div></div></div>`;
}

function renderSalarioLiquidoChart(results) {
    const chartContainer = document.getElementById('salario-liquido-chart-container');
    if (!chartContainer) return;

    const {
        salarioLiquido, descontoINSS, descontoIRRF,
        descontoVT, descontoVR, descontoSaude, descontoAdiantamentos
    } = results;

    const totalImpostos = (descontoINSS.value || 0) + (descontoIRRF.value || 0);
    const totalOutrosDescontos = (descontoVT || 0) + (descontoVR || 0) + (descontoSaude || 0) + (descontoAdiantamentos || 0);
    const total = salarioLiquido + totalImpostos + totalOutrosDescontos;

    // Calculate percentages and angles
    const segments = [
        {
            label: 'Salário Líquido',
            value: salarioLiquido,
            percentage: (salarioLiquido / total) * 100,
            color: '#16a34a',
            details: `Valor que você efetivamente recebe: ${formatCurrency(salarioLiquido)}`
        },
        {
            label: 'Impostos (INSS+IRRF)',
            value: totalImpostos,
            percentage: (totalImpostos / total) * 100,
            color: '#dc2626',
            details: `INSS: ${formatCurrency(descontoINSS.value || 0)}<br>IRRF: ${formatCurrency(descontoIRRF.value || 0)}`
        },
        {
            label: 'Outros Descontos',
            value: totalOutrosDescontos,
            percentage: (totalOutrosDescontos / total) * 100,
            color: '#f59e0b',
            details: getOtherDiscountsDetails(descontoVT, descontoVR, descontoSaude, descontoAdiantamentos)
        }
    ].filter(segment => segment.value > 0); // Only show segments with values > 0

    // Generate SVG chart
    const svgChart = generateSVGChart(segments);

    // Clear container and add new chart
    chartContainer.innerHTML = svgChart;

    // Add event listeners for tooltips
    addChartTooltipListeners(chartContainer, segments);
}

function getOtherDiscountsDetails(vt, vr, saude, adiantamentos) {
    const details = [];
    if (vt > 0) details.push(`Vale-Transporte: ${formatCurrency(vt)}`);
    if (vr > 0) details.push(`Vale-Refeição: ${formatCurrency(vr)}`);
    if (saude > 0) details.push(`Plano de Saúde: ${formatCurrency(saude)}`);
    if (adiantamentos > 0) details.push(`Adiantamentos: ${formatCurrency(adiantamentos)}`);
    return details.length > 0 ? details.join('<br>') : 'Nenhum desconto adicional';
}

function generateSVGChart(segments) {
    const size = 200;
    const center = size / 2;
    const radius = 70;
    const innerRadius = 30;

    let cumulativeAngle = 0;
    let pathElements = '';
    let legendElements = '';

    segments.forEach((segment, index) => {
        const angle = (segment.percentage / 100) * 360;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;

        // Create SVG path for donut segment
        const path = createDonutPath(center, center, innerRadius, radius, startAngle, endAngle);

        pathElements += `
            <path
                d="${path}"
                fill="${segment.color}"
                stroke="white"
                stroke-width="2"
                class="chart-segment"
                data-segment="${index}"
                style="cursor: pointer; transition: all 0.3s ease;"
            />`;

        // Create legend item
        legendElements += `
            <div class="flex items-center space-x-2 text-sm chart-legend-item" data-segment="${index}" style="cursor: pointer;">
                <div class="w-3 h-3 rounded-sm" style="background-color: ${segment.color};"></div>
                <span class="font-medium">${segment.label}</span>
                <span class="text-gray-600">(${segment.percentage.toFixed(1)}%)</span>
            </div>`;

        cumulativeAngle += angle;
    });

    return `
        <div class="flex flex-col items-center space-y-4">
            <div class="relative">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="chart-svg">
                    ${pathElements}
                </svg>
                <!-- Tooltip container -->
                <div id="chart-tooltip" class="chart-tooltip hidden"></div>
            </div>
            <div class="space-y-2 text-center">
                ${legendElements}
            </div>
        </div>`;
}

function createDonutPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
    const startAngleRad = (startAngle - 90) * Math.PI / 180;
    const endAngleRad = (endAngle - 90) * Math.PI / 180;

    const x1 = cx + outerRadius * Math.cos(startAngleRad);
    const y1 = cy + outerRadius * Math.sin(startAngleRad);
    const x2 = cx + outerRadius * Math.cos(endAngleRad);
    const y2 = cy + outerRadius * Math.sin(endAngleRad);

    const x3 = cx + innerRadius * Math.cos(endAngleRad);
    const y3 = cy + innerRadius * Math.sin(endAngleRad);
    const x4 = cx + innerRadius * Math.cos(startAngleRad);
    const y4 = cy + innerRadius * Math.sin(startAngleRad);

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z'
    ].join(' ');
}

function addChartTooltipListeners(container, segments) {
    const tooltip = container.querySelector('#chart-tooltip');
    const chartSegments = container.querySelectorAll('.chart-segment');
    const legendItems = container.querySelectorAll('.chart-legend-item');

    function showTooltip(segmentIndex, event) {
        const segment = segments[segmentIndex];
        tooltip.innerHTML = `
            <div class="font-semibold text-sm mb-1">${segment.label}</div>
            <div class="text-xs">${formatCurrency(segment.value)}</div>
            <div class="text-xs mt-1 opacity-80">${segment.details}</div>
        `;
        tooltip.classList.remove('hidden');

        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - containerRect.top - 10}px`;
    }

    function hideTooltip() {
        tooltip.classList.add('hidden');
    }

    function highlightSegment(segmentIndex, highlight = true) {
        const segment = chartSegments[segmentIndex];
        const legendItem = legendItems[segmentIndex];

        if (highlight) {
            segment.style.filter = 'brightness(1.1)';
            segment.style.transform = 'scale(1.05)';
            legendItem.style.backgroundColor = '#f3f4f6';
        } else {
            segment.style.filter = 'brightness(1)';
            segment.style.transform = 'scale(1)';
            legendItem.style.backgroundColor = 'transparent';
        }
    }

    // Add event listeners
    chartSegments.forEach((segment, index) => {
        segment.addEventListener('mouseenter', (e) => {
            showTooltip(index, e);
            highlightSegment(index, true);
        });

        segment.addEventListener('mouseleave', () => {
            hideTooltip();
            highlightSegment(index, false);
        });

        segment.addEventListener('mousemove', (e) => {
            const rect = e.target.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            tooltip.style.left = `${e.clientX - containerRect.left}px`;
            tooltip.style.top = `${e.clientY - containerRect.top - 10}px`;
        });
    });

    // Add legend hover effects
    legendItems.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            highlightSegment(index, true);
        });

        item.addEventListener('mouseleave', () => {
            highlightSegment(index, false);
        });
    });
}

function createSalarioLiquidoResultHTML(results) {
    if (Object.keys(state.salarioLiquido.errors).some(k => state.salarioLiquido.errors[k])) {
        return '<p class="text-center text-red-500 font-semibold">Por favor, corrija os campos destacados acima para ver o seu cálculo.</p>';
    }
    if (!results || !results.salarioBruto) return '<p class="text-center text-muted-foreground">Preencha os campos para calcular.</p>';

    const { salarioBruto, horasExtras, adicionalPericulosidade, adicionalInsalubridade, adicionalNoturno, salarioBrutoTotal, salarioFamilia, descontoINSS, descontoIRRF, descontoVT, descontoVR, descontoSaude, descontoAdiantamentos, totalProventos, totalDescontos, salarioLiquido } = results;
    const inssDetailsHTML = descontoINSS.details.map(d => `<p class="text-xs">${d.range}: ${d.base} x ${d.rate} = <strong>${d.value}</strong></p>`).join('');
    const irrfDetailsHTML = `<p class="text-xs">Base de Cálculo: ${descontoIRRF.details.base}</p><p class="text-xs">Dedução por Dependentes: ${descontoIRRF.details.dependentsDeduction}</p><p class="text-xs">Base p/ IRRF: ${descontoIRRF.details.irrfBase}</p><p class="text-xs">Alíquota: ${descontoIRRF.details.rate}</p><p class="text-xs">Parcela a Deduzir: ${descontoIRRF.details.deduction}</p>`;

    // setTimeout to ensure the canvas is in the DOM before rendering the chart
    setTimeout(() => renderSalarioLiquidoChart(results), 0);

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in"><div class="flex flex-col space-y-1.5 p-6"><h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado do Cálculo do Salário Líquido</h3><p class="text-sm text-muted-foreground">Resumo detalhado do seu salário líquido mensal.</p></div><div class="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 gap-8 items-center"><div class="space-y-1 md:col-span-1"><h4 class="text-lg font-semibold text-primary mt-4">Proventos (Ganhos)</h4><div class="flex justify-between result-row py-2"><span>Salário Base:</span> <span class="font-mono text-green-600">${formatCurrency(salarioBruto)}</span></div>${horasExtras > 0 ? `<div class="flex justify-between result-row py-2"><span>Horas Extras:</span> <span class="font-mono text-green-600">${formatCurrency(horasExtras)}</span></div>` : ''}${adicionalPericulosidade > 0 ? `<div class="flex justify-between result-row py-2"><span>Adicional de Periculosidade:</span> <span class="font-mono text-green-600">${formatCurrency(adicionalPericulosidade)}</span></div>` : ''}${adicionalInsalubridade > 0 ? `<div class="flex justify-between result-row py-2"><span>Adicional de Insalubridade:</span> <span class="font-mono text-green-600">${formatCurrency(adicionalInsalubridade)}</span></div>` : ''}${adicionalNoturno > 0 ? `<div class="flex justify-between result-row py-2"><span>Adicional Noturno:</span> <span class="font-mono text-green-600">${formatCurrency(adicionalNoturno)}</span></div>` : ''}${salarioFamilia > 0 ? `<div class="flex justify-between result-row py-2"><span>Salário Família:</span> <span class="font-mono text-green-600">${formatCurrency(salarioFamilia)}</span></div>` : ''}<div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2"><span>Total Bruto:</span> <span class="font-mono text-green-600">${formatCurrency(totalProventos)}</span></div><h4 class="text-lg font-semibold text-red-600 mt-4">Descontos</h4><div class="flex justify-between result-row py-2"><span>INSS: <button class="details-btn text-primary text-xs" data-details-for="inss-details-salario">(Ver Detalhes)</button></span><span class="font-mono text-red-600">-${formatCurrency(descontoINSS.value)}</span></div><div id="inss-details-salario" class="hidden text-xs space-y-1 pl-4 border-l-2 py-2 my-2 bg-gray-50">${inssDetailsHTML}</div><div class="flex justify-between result-row py-2"><span>IRRF: <button class="details-btn text-primary text-xs" data-details-for="irrf-details-salario">(Ver Detalhes)</button></span><span class="font-mono text-red-600">-${formatCurrency(descontoIRRF.value)}</span></div><div id="irrf-details-salario" class="hidden text-xs space-y-1 pl-4 border-l-2 py-2 my-2 bg-gray-50">${irrfDetailsHTML}</div>${descontoVT > 0 ? `<div class="flex justify-between result-row py-2"><span>Vale-Transporte (6%):</span> <span class="font-mono text-red-600">-${formatCurrency(descontoVT)}</span></div>` : ''}${descontoVR > 0 ? `<div class="flex justify-between result-row py-2"><span>Vale-Refeição/Alimentação:</span> <span class="font-mono text-red-600">-${formatCurrency(descontoVR)}</span></div>` : ''}${descontoSaude > 0 ? `<div class="flex justify-between result-row py-2"><span>Plano de Saúde / Odontológico:</span> <span class="font-mono text-red-600">-${formatCurrency(descontoSaude)}</span></div>` : ''}${descontoAdiantamentos > 0 ? `<div class="flex justify-between result-row py-2"><span>Adiantamentos (Vale):</span> <span class="font-mono text-red-600">-${formatCurrency(descontoAdiantamentos)}</span></div>` : ''}<div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2"><span>Total de Descontos:</span> <span class="font-mono text-red-600">-${formatCurrency(totalDescontos)}</span></div></div><div class="md:col-span-1 flex flex-col items-center justify-center p-4"><div class="w-full max-w-[300px] mx-auto"><div id="salario-liquido-chart-container"></div></div></div></div><div class="flex items-center p-6 pt-0 flex-col gap-4"><div class="w-full border-t border-border pt-4 flex justify-between items-center"><span class="total-liquido-label">Salário Líquido a Receber:</span><span class="font-mono text-green-600 total-liquido-valor">${formatCurrency(salarioLiquido)}</span></div><div class="flex gap-3 w-full"><button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button><button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button></div></div></div>`;
}

function createRescisaoResultHTML(results) {
    if (Object.keys(state.rescisao.errors).some(k => state.rescisao.errors[k])) {
        return '<p class="text-center text-red-500 font-semibold">Por favor, corrija os campos destacados acima para ver o seu cálculo.</p>';
    }
    if (!results || !results.totalProventos) return '<p class="text-center text-muted-foreground">Preencha os campos para calcular.</p>';

    const { proventos, descontos, totalProventos, totalDescontos, valorLiquido } = results;
    const proventosHTML = Object.entries(proventos).map(([key, value]) => value > 0 ? `<div class="flex justify-between result-row py-2"><span>${key}:</span> <span class="font-mono text-green-600">${formatCurrency(value)}</span></div>` : '').join('');
    const descontosHTML = Object.entries(descontos).map(([key, result]) => {
        if (!result || (result.hasOwnProperty('value') && result.value === 0)) return '';
        const value = result.value || result;
        return `<div class="flex justify-between result-row py-2"><span>${key}:</span> <span class="font-mono text-red-600">-${formatCurrency(value)}</span></div>`;
    }).join('');

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in"><div class="flex flex-col space-y-1.5 p-6"><h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado do Cálculo de Rescisão</h3><p class="text-sm text-muted-foreground">Resumo das suas verbas rescisórias.</p></div><div class="p-6 pt-0"><div class="space-y-1"><h4 class="text-lg font-semibold text-primary mt-4">Verbas Rescisórias (Ganhos)</h4>${proventosHTML}<div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2"><span>Total de Proventos:</span> <span class="font-mono text-green-600">${formatCurrency(totalProventos)}</span></div><h4 class="text-lg font-semibold text-red-600 mt-4">Descontos</h4>${descontosHTML}<div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2"><span>Total de Descontos:</span> <span class="font-mono text-red-600">-${formatCurrency(totalDescontos)}</span></div></div></div><div class="flex items-center p-6 pt-0 flex-col gap-4"><div class="w-full border-t border-border pt-4 flex justify-between items-center"><span class="total-liquido-label">Total Líquido a Receber:</span><span class="font-mono text-green-600 total-liquido-valor">${formatCurrency(valorLiquido)}</span></div><div class="flex gap-3 w-full"><button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button><button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button></div></div></div>`;
}


// --- CENTRALIZED REPORT GENERATION ---

/**
 * Mapeamento de tipos de calculadora para suas funções de geração de conteúdo
 * Centraliza a lógica de relatórios e elimina switch statement
 */
const reportContentMappings = {
    ferias: generateFeriasReportContent,
    decimoTerceiro: generateDecimoTerceiroReportContent,
    salarioLiquido: generateSalarioLiquidoReportContent,
    rescisao: generateRescisaoReportContent,
    fgts: generateFgtsReportContent,
    pisPasep: generatePisPasepReportContent,
    seguroDesemprego: generateSeguroDesempregoReportContent,
    horasExtras: generateHorasExtrasReportContent,
    inss: generateInssReportContent,
    valeTransporte: generateValeTransporteReportContent,
    irpf: generateIrpfReportContent
};

/**
 * Mapeamento de títulos para cada tipo de calculadora
 */
const calculatorTitles = {
    ferias: 'Cálculo de Férias',
    decimoTerceiro: 'Cálculo do 13º Salário',
    salarioLiquido: 'Cálculo do Salário Líquido',
    rescisao: 'Cálculo de Rescisão',
    fgts: 'Cálculo de FGTS',
    pisPasep: 'Cálculo de PIS/PASEP',
    seguroDesemprego: 'Cálculo de Seguro-Desemprego',
    horasExtras: 'Cálculo de Horas Extras',
    inss: 'Cálculo de INSS',
    valeTransporte: 'Cálculo de Vale-Transporte',
    irpf: 'Cálculo de IRPF'
};

/**
 * Centralized function to generate report HTML for any calculation type.
 * This function serves as the single source of truth for PDF/print report generation.
 * @param {Object} data - The calculation data object
 * @param {string} data.type - The type of calculation ('ferias', 'decimoTerceiro', 'salarioLiquido', 'rescisao')
 * @param {Object} data.results - The calculation results
 * @param {Object} data.state - The current state/input data for the calculation
 * @returns {string} Complete HTML string ready for printing
 */
export function generateReportHTML(data) {
    if (!data || !data.type || !data.results) {
        console.error('generateReportHTML: Invalid data provided');
        return '<p>Erro: Dados inválidos para gerar o relatório.</p>';
    }

    const { type, results, state: inputState } = data;
    const currentDate = formatDateTimeBR(new Date());

    // Get content generator and title using mappings
    const contentGenerator = reportContentMappings[type];
    const calculatorTitle = calculatorTitles[type];

    if (!contentGenerator || !calculatorTitle) {
        return '<p>Erro: Tipo de cálculo não reconhecido.</p>';
    }

    // Generate the main content
    const contentHTML = contentGenerator(results, inputState);

    // Return the complete HTML structure with print header
    return `
        <div class="print-header">
            <div class="print-company-info">
                <h1>Calculadora Trabalhista</h1>
                <p>Pedro Afonso MEI - Estúdio Criativo Labareda</p>
                <p>Relatório gerado em: <span id="print-date">${currentDate}</span></p>
            </div>
        </div>

        <div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in">
            <div class="flex flex-col space-y-1.5 p-6">
                <h3 class="text-xl font-semibold leading-none tracking-tight">${calculatorTitle}</h3>
                <p class="text-sm text-muted-foreground">Resumo detalhado do seu cálculo.</p>
            </div>
            <div class="p-6 pt-0">
                ${contentHTML}
            </div>
        </div>
    `;
}

/**
 * Generates the content HTML for Ferias calculation report
 */
function generateFeriasReportContent(results, inputState) {
    const { valorFerias, tercoConstitucional, valorAbono, tercoAbono, adiantamento13, descontoINSS, descontoIRRF, valorLiquido, venderFerias, adiantarDecimo, diasFerias } = results;

    let html = `
        <div class="space-y-1">
            <h4 class="text-lg font-semibold text-primary mt-4">Proventos (Ganhos)</h4>
            <div class="flex justify-between result-row py-2">
                <span>Valor das Férias (${venderFerias ? (diasFerias - (diasFerias/3)) : diasFerias} dias):</span>
                <span class="font-mono text-green-600">${formatCurrency(valorFerias)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>1/3 Constitucional sobre Férias:</span>
                <span class="font-mono text-green-600">${formatCurrency(tercoConstitucional)}</span>
            </div>`;

    if (venderFerias && valorAbono > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Abono Pecuniário (Venda 1/3):</span>
                <span class="font-mono text-green-600">${formatCurrency(valorAbono)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>1/3 sobre Abono Pecuniário:</span>
                <span class="font-mono text-green-600">${formatCurrency(tercoAbono)}</span>
            </div>`;
    }

    if (adiantarDecimo && adiantamento13 > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Adiantamento 13º Salário:</span>
                <span class="font-mono text-green-600">${formatCurrency(adiantamento13)}</span>
            </div>`;
    }

    html += `
            <h4 class="text-lg font-semibold text-red-600 mt-4">Descontos</h4>
            <div class="flex justify-between result-row py-2">
                <span>INSS sobre Férias:</span>
                <span class="font-mono text-red-600">-${formatCurrency(descontoINSS.value)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>IRRF sobre Férias:</span>
                <span class="font-mono text-red-600">-${formatCurrency(descontoIRRF.value)}</span>
            </div>
        </div>

        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span class="text-xl font-bold total-liquido-label">Total Líquido a Receber:</span>
            <span class="font-mono text-green-600 text-xl font-bold total-liquido-valor">${formatCurrency(valorLiquido)}</span>
        </div>`;

    return html;
}

/**
 * Generates the content HTML for Decimo Terceiro calculation report
 */
function generateDecimoTerceiroReportContent(results, inputState) {
    const { baseDeCalculo, mesesTrabalhados, valorBrutoDecimo, descontoINSS, descontoIRRF, valorLiquidoDecimo, adiantamentoRecebido, valorAReceber } = results;

    let html = `
        <div class="space-y-1">
            <div class="flex justify-between result-row py-2">
                <span>Base de Cálculo:</span>
                <span class="font-mono">${formatCurrency(baseDeCalculo)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Meses trabalhados:</span>
                <span class="font-mono">${mesesTrabalhados} meses</span>
            </div>
            <div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2">
                <span>13º Salário Bruto:</span>
                <span class="font-mono">${formatCurrency(valorBrutoDecimo)}</span>
            </div>

            <h4 class="text-lg font-semibold text-red-600 mt-4">Descontos</h4>
            <div class="flex justify-between result-row py-2">
                <span>INSS:</span>
                <span class="font-mono text-red-600">-${formatCurrency(descontoINSS.value)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>IRRF:</span>
                <span class="font-mono text-red-600">-${formatCurrency(descontoIRRF.value)}</span>
            </div>

            <h4 class="text-lg font-semibold text-primary mt-4">Valores Finais</h4>
            <div class="flex justify-between result-row py-2">
                <span>13º Salário Líquido:</span>
                <span class="font-mono text-green-600">${formatCurrency(valorLiquidoDecimo)}</span>
            </div>`;

    if (adiantamentoRecebido > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>(-) Adiantamento já recebido:</span>
                <span class="font-mono text-red-600">-${formatCurrency(adiantamentoRecebido)}</span>
            </div>`;
    }

    html += `
        </div>

        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span class="text-xl font-bold total-liquido-label">Valor a Receber:</span>
            <span class="font-mono text-green-600 text-xl font-bold total-liquido-valor">${formatCurrency(valorAReceber)}</span>
        </div>`;

    return html;
}

/**
 * Generates the content HTML for Salario Liquido calculation report
 */
function generateSalarioLiquidoReportContent(results, inputState) {
    const { salarioBruto, horasExtras, adicionalPericulosidade, adicionalInsalubridade, adicionalNoturno, salarioFamilia, descontoINSS, descontoIRRF, descontoVT, descontoVR, descontoSaude, descontoAdiantamentos, totalProventos, totalDescontos, salarioLiquido } = results;

    let html = `
        <div class="space-y-1">
            <h4 class="text-lg font-semibold text-primary mt-4">Proventos (Ganhos)</h4>
            <div class="flex justify-between result-row py-2">
                <span>Salário Base:</span>
                <span class="font-mono text-green-600">${formatCurrency(salarioBruto)}</span>
            </div>`;

    if (horasExtras > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Horas Extras:</span>
                <span class="font-mono text-green-600">${formatCurrency(horasExtras)}</span>
            </div>`;
    }

    if (adicionalPericulosidade > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Adicional de Periculosidade:</span>
                <span class="font-mono text-green-600">${formatCurrency(adicionalPericulosidade)}</span>
            </div>`;
    }

    if (adicionalInsalubridade > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Adicional de Insalubridade:</span>
                <span class="font-mono text-green-600">${formatCurrency(adicionalInsalubridade)}</span>
            </div>`;
    }

    if (adicionalNoturno > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Adicional Noturno:</span>
                <span class="font-mono text-green-600">${formatCurrency(adicionalNoturno)}</span>
            </div>`;
    }

    if (salarioFamilia > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Salário Família:</span>
                <span class="font-mono text-green-600">${formatCurrency(salarioFamilia)}</span>
            </div>`;
    }

    html += `
            <div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2">
                <span>Total Bruto:</span>
                <span class="font-mono text-green-600">${formatCurrency(totalProventos)}</span>
            </div>

            <h4 class="text-lg font-semibold text-red-600 mt-4">Descontos</h4>
            <div class="flex justify-between result-row py-2">
                <span>INSS:</span>
                <span class="font-mono text-red-600">-${formatCurrency(descontoINSS.value)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>IRRF:</span>
                <span class="font-mono text-red-600">-${formatCurrency(descontoIRRF.value)}</span>
            </div>`;

    if (descontoVT > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Vale-Transporte (6%):</span>
                <span class="font-mono text-red-600">-${formatCurrency(descontoVT)}</span>
            </div>`;
    }

    if (descontoVR > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Vale-Refeição/Alimentação:</span>
                <span class="font-mono text-red-600">-${formatCurrency(descontoVR)}</span>
            </div>`;
    }

    if (descontoSaude > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Plano de Saúde / Odontológico:</span>
                <span class="font-mono text-red-600">-${formatCurrency(descontoSaude)}</span>
            </div>`;
    }

    if (descontoAdiantamentos > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Adiantamentos (Vale):</span>
                <span class="font-mono text-red-600">-${formatCurrency(descontoAdiantamentos)}</span>
            </div>`;
    }

    html += `
            <div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2">
                <span>Total de Descontos:</span>
                <span class="font-mono text-red-600">-${formatCurrency(totalDescontos)}</span>
            </div>
        </div>

        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span class="text-xl font-bold total-liquido-label">Salário Líquido a Receber:</span>
            <span class="font-mono text-green-600 text-xl font-bold total-liquido-valor">${formatCurrency(salarioLiquido)}</span>
        </div>`;

    return html;
}

/**
 * Generates the content HTML for Rescisao calculation report
 */
function generateRescisaoReportContent(results, inputState) {
    const { proventos, descontos, totalProventos, totalDescontos, valorLiquido } = results;

    let html = `
        <div class="space-y-1">
            <h4 class="text-lg font-semibold text-primary mt-4">Informações da Rescisão</h4>
            <div class="flex justify-between result-row py-2">
                <span>Data de Admissão:</span>
                <span class="font-mono text-blue-600">${formatDateBR(inputState.dataAdmissao)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Data de Demissão:</span>
                <span class="font-mono text-blue-600">${formatDateBR(inputState.dataDemissao)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Último Salário Bruto:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.salarioBruto)}</span>
            </div>

            <h4 class="text-lg font-semibold text-primary mt-4">Verbas Rescisórias (Ganhos)</h4>`;

    // Add provento items
    Object.entries(proventos).forEach(([key, value]) => {
        if (value > 0) {
            html += `
                <div class="flex justify-between result-row py-2">
                    <span>${key}:</span>
                    <span class="font-mono text-green-600">${formatCurrency(value)}</span>
                </div>`;
        }
    });

    html += `
            <div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2">
                <span>Total de Proventos:</span>
                <span class="font-mono text-green-600">${formatCurrency(totalProventos)}</span>
            </div>

            <h4 class="text-lg font-semibold text-red-600 mt-4">Descontos</h4>`;

    // Add desconto items
    Object.entries(descontos).forEach(([key, result]) => {
        if (result && (result.hasOwnProperty('value') ? result.value > 0 : result > 0)) {
            const value = result.value || result;
            html += `
                <div class="flex justify-between result-row py-2">
                    <span>${key}:</span>
                    <span class="font-mono text-red-600">-${formatCurrency(value)}</span>
                </div>`;
        }
    });

    html += `
            <div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2">
                <span>Total de Descontos:</span>
                <span class="font-mono text-red-600">-${formatCurrency(totalDescontos)}</span>
            </div>
        </div>

        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span class="text-xl font-bold total-liquido-label">Total Líquido a Receber:</span>
            <span class="font-mono text-green-600 text-xl font-bold total-liquido-valor">${formatCurrency(valorLiquido)}</span>
        </div>`;

    return html;
}

// --- MAIN RENDER FUNCTION ---

export function renderCustomizationModal() {
    const checklistContainer = document.getElementById('customize-checklist');
    if (!checklistContainer) return;

    const allCalculators = Object.keys(tabTriggers);
    const visibleCalculators = state.visibleCalculators;

    let checklistHTML = '';
    allCalculators.forEach(key => {
        const isChecked = visibleCalculators.includes(key);
        const calculatorName = tabTriggers[key].textContent;
        checklistHTML += `
            <div class="flex items-center">
                <input type="checkbox" id="customize-${key}" value="${key}" ${isChecked ? 'checked' : ''} class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary">
                <label for="customize-${key}" class="ml-3 text-sm text-gray-700">${calculatorName}</label>
            </div>
        `;
    });
    checklistContainer.innerHTML = checklistHTML;
}

export function showCustomizeModal() {
    const modal = document.getElementById('customize-modal');
    if (modal) {
        renderCustomizationModal();
        modal.classList.remove('hidden');
    }
}

export function hideCustomizeModal() {
    const modal = document.getElementById('customize-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Renders the sidebar navigation (FASE 3)
 * Substitui a navegação por abas pela sidebar moderna
 * Suporta dois modos: expandido (com texto) e colapsado (círculos)
 */
export function renderSidebar() {
    const navList = document.getElementById('sidebar-nav-list');
    const dotsList = document.getElementById('sidebar-dots-list');
    const sidebar = document.getElementById('main-sidebar');
    
    if (!navList || !dotsList) return;
    
    const calculatorNames = {
        ferias: 'Cálculo de Férias',
        rescisao: 'Cálculo de Rescisão',
        decimoTerceiro: '13º Salário',
        salarioLiquido: 'Salário Líquido',
        fgts: 'FGTS',
        pisPasep: 'PIS/PASEP',
        seguroDesemprego: 'Seguro-Desemprego',
        horasExtras: 'Horas Extras',
        inss: 'INSS',
        valeTransporte: 'Vale-Transporte',
        irpf: 'IRPF'
    };

    const activeTab = state.activeTab;
    const visibleCalculators = state.visibleCalculators;
    const isCollapsed = sidebar && sidebar.classList.contains('collapsed');

    // Render expanded mode (normal links with text)
    navList.innerHTML = visibleCalculators.map(calc => `
        <li>
            <button class="sidebar-link w-full text-left ${activeTab === calc ? 'active' : ''}" 
                    data-calculator="${calc}"
                    aria-current="${activeTab === calc ? 'page' : 'false'}">
                ${calculatorNames[calc]}
            </button>
        </li>
    `).join('');

    // Render collapsed mode (dots/circles with Material Icons)
    const iconMap = {
        ferias: 'beach_access',
        rescisao: 'work_off',
        decimoTerceiro: 'card_giftcard',
        salarioLiquido: 'payments',
        fgts: 'account_balance',
        pisPasep: 'verified_user',
        seguroDesemprego: 'security',
        horasExtras: 'schedule',
        inss: 'local_hospital',
        valeTransporte: 'commute',
        irpf: 'receipt_long'
    };
    
    dotsList.innerHTML = visibleCalculators.map(calc => `
        <button class="sidebar-dot ${activeTab === calc ? 'active' : ''}" 
                data-calculator="${calc}"
                title="${calculatorNames[calc]}"
                aria-label="Abrir ${calculatorNames[calc]}">
            <span class="material-icons text-xs">${iconMap[calc] || 'calculate'}</span>
        </button>
    `).join('');

    // Também precisa renderizar os panels
    renderCalculatorPanels();
}

/**
 * Renderiza os painéis das calculadoras (mostra/esconde baseado na aba ativa)
 */
function renderCalculatorPanels() {
    const activeTab = state.activeTab;
    
    for (const tabName in calculatorPanels) {
        const panel = calculatorPanels[tabName];
        if (!panel) continue;

        const isActive = tabName === activeTab;
        panel.setAttribute('data-state', isActive ? 'active' : 'inactive');
        
        if (isActive) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }
}

function renderTabs() {
    const activeTab = state.activeTab;
    const visibleCalculators = state.visibleCalculators;

    for (const tabName in tabTriggers) {
        const trigger = tabTriggers[tabName];
        const panel = calculatorPanels[tabName];

        if (!trigger || !panel) continue;

        if (!visibleCalculators.includes(tabName)) {
            trigger.style.display = 'none';
        } else {
            trigger.style.display = ''; // Use default display
        }

        const isActive = tabName === activeTab;

        trigger.setAttribute('data-state', isActive ? 'active' : 'inactive');
        trigger.setAttribute('aria-selected', isActive.toString());

        panel.setAttribute('data-state', isActive ? 'active' : 'inactive');
        if (isActive) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }
}

/**
 * Renders the conditional UI for the "Salário Família" (Family Allowance) section.
 * Shows or hides the number of children input based on the state.
 */
function renderSalarioFamiliaUI() {
    const container = document.getElementById('filhos-salario-familia-container-salario-liquido');
    if (!container) return;

    if (state.salarioLiquido.recebeSalarioFamilia) {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

function renderFormInputs(calculatorName) {
    const formIdName = calculatorName.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`);
    const form = document.getElementById(`form-${formIdName}`);
    if (!form) {
        return;
    }

    const calculatorState = state[calculatorName];
    if (!calculatorState) return;

    form.querySelectorAll('[data-state]').forEach(element => {
        const path = element.dataset.state;
        const fieldName = path.split('.')[1];
        const value = calculatorState[fieldName];

        switch (element.type) {
            case 'checkbox':
                element.checked = value;
                break;
            case 'radio':
                element.checked = (element.value === String(value));
                break;
            case 'text':
                if (element.classList.contains('money-mask')) {
                    const formattedValue = formatCurrency(value);
                    if (document.activeElement !== element) {
                        element.value = formattedValue;
                    }
                } else {
                    element.value = value;
                }
                break;
            default:
                element.value = value;
                break;
        }
    });
}

// --- RENDER MAPPINGS ---

/**
 * Mapeamento de calculadoras para suas funções de cálculo e renderização
 * Substitui o switch statement grande por uma abordagem modular
 */
const calculatorMappings = {
    ferias: {
        calculate: calculations.calculateFerias,
        render: createFeriasResultHTML
    },
    decimoTerceiro: {
        calculate: calculations.calculateDecimoTerceiro,
        render: createDecimoTerceiroResultHTML
    },
    salarioLiquido: {
        calculate: calculations.calculateSalarioLiquido,
        render: createSalarioLiquidoResultHTML
    },
    rescisao: {
        calculate: calculations.calculateRescisao,
        render: createRescisaoResultHTML
    },
    fgts: {
        calculate: calculations.calculateFGTS,
        render: createFgtsResultHTML
    },
    pisPasep: {
        calculate: (pisPasepState) => calculations.calculatePISPASEP(pisPasepState, state.legalTexts),
        render: createPisPasepResultHTML
    },
    seguroDesemprego: {
        calculate: (seguroDesempregoState) => calculations.calculateSeguroDesemprego(seguroDesempregoState, state.legalTexts),
        render: createSeguroDesempregoResultHTML
    },
    horasExtras: {
        calculate: (horasExtrasState) => calculations.calculateHorasExtras(horasExtrasState, state.legalTexts),
        render: createHorasExtrasResultHTML
    },
    inss: {
        calculate: (inssState) => calculations.calculateINSSCalculator(inssState, state.legalTexts),
        render: createINSSResultHTML
    },
    valeTransporte: {
        calculate: (valeTransporteState) => calculations.calculateValeTransporte(valeTransporteState, state.legalTexts),
        render: createValeTransporteResultHTML
    },
    irpf: {
        calculate: (irpfState) => calculations.calculateIRPF(irpfState, state.legalTexts),
        render: createIRPFResultHTML
    }
};

export function render() {
    return new Promise((resolve) => {
        const activeCalculator = state.activeTab;
        
        // 1. Update form inputs to reflect the current state
        if (state[activeCalculator]) {
            renderFormInputs(activeCalculator);
        }

        // 2. Run calculation and render using mapping
        const mapping = calculatorMappings[activeCalculator];
        if (mapping && state[activeCalculator]) {
            const results = mapping.calculate(state[activeCalculator]);
            const html = mapping.render(results);
            
            // 3. Update the result container
            if (resultContainers[activeCalculator]) {
                resultContainers[activeCalculator].innerHTML = html;
            }
        }

        // 4. Update sidebar navigation (FASE 3)
        renderSidebar();

        // 5. Update calculator panel visibility
        renderCalculatorPanels();

        // 6. Update tab navigation state
        renderTabs();

        // 7. Update mobile dropdown navigation
        renderMobileCalculatorSelector();

        // 8. Update conditional UI elements
        renderSalarioFamiliaUI();

        // 9. Update field states (e.g., disabled)
        if (state[activeCalculator]) {
            renderFieldStates(activeCalculator);
        }

        // 10. Display validation errors
        if (state[activeCalculator]) {
            renderValidationErrors(activeCalculator);
        }
        
        // Wait for DOM updates to complete
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
    });
}

function renderFieldStates(calculatorName) {
    const formIdName = calculatorName.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`);
    const form = document.getElementById(`form-${formIdName}`);
    if (!form) {
        return;
    }

    const calculatorState = state[calculatorName];
    if (!calculatorState) return;

    const insalubridadeValue = calculatorState.insalubridadeGrau;
    const periculosidadeIsActive = calculatorState.periculosidade;

    const periculosidadeCheckbox = form.querySelector(`[data-state="${calculatorName}.periculosidade"]`);
    const insalubridadeRadios = form.querySelectorAll(`[data-state="${calculatorName}.insalubridadeGrau"]`);
    const baseInsalubridadeRadios = form.querySelectorAll(`[data-state="${calculatorName}.insalubridadeBase"]`);

    if (!periculosidadeCheckbox || insalubridadeRadios.length === 0) return;

    // Reset disabled states initially
    periculosidadeCheckbox.disabled = false;
    insalubridadeRadios.forEach(radio => radio.disabled = false);
    baseInsalubridadeRadios.forEach(radio => radio.disabled = false);

    // Apply new disabled states based on state
    if (periculosidadeIsActive) {
        insalubridadeRadios.forEach(radio => radio.disabled = true);
        baseInsalubridadeRadios.forEach(radio => radio.disabled = true);
    } else if (insalubridadeValue && insalubridadeValue !== "0") {
        periculosidadeCheckbox.disabled = true;
    }
}


function renderValidationErrors(calculatorName) {
    const errorState = state[calculatorName].errors;
    const formIdName = calculatorName.replace(/([A-Z])/g, g => `-${g[0].toLowerCase()}`);
    const form = document.getElementById(`form-${formIdName}`);

    // Clear all previous errors in the form
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('[data-state]').forEach(el => el.classList.remove('border-red-500'));

    // Display new errors
    for (const fieldName in errorState) {
        const message = errorState[fieldName];
        const element = form.querySelector(`[data-state="${calculatorName}.${fieldName}"]`);
        if (element && message) {
            element.classList.add('border-red-500');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message text-red-500 text-xs mt-1';
            errorDiv.textContent = message;
            element.parentNode.insertBefore(errorDiv, element.nextSibling);
        }
    }
}

/**
 * Generates the content HTML for FGTS calculation report
 */
function generateFgtsReportContent(results, inputState) {
    const { valorSaque, valorRendimentos, valorTotal, saldoRestante } = results;

    let html = `
        <div class="space-y-1">
            <h4 class="text-lg font-semibold text-primary mt-4">Informações do FGTS</h4>
            <div class="flex justify-between result-row py-2">
                <span>Saldo Total Atual:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.saldoTotal)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Salário Bruto:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.salarioBruto)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Modalidade de Saque:</span>
                <span class="font-mono text-blue-600">${inputState.opcaoSaque === 'aniversario' ? 'Aniversário' : 'Rescisão'}</span>
            </div>`;

    if (valorSaque > 0) {
        html += `
            <h4 class="text-lg font-semibold text-green-600 mt-4">Valores Disponíveis</h4>
            <div class="flex justify-between result-row py-2">
                <span>Valor do Saque:</span>
                <span class="font-mono text-green-600">${formatCurrency(valorSaque)}</span>
            </div>`;
    }

    if (valorRendimentos > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Rendimentos Estimados:</span>
                <span class="font-mono text-green-600">${formatCurrency(valorRendimentos)}</span>
            </div>`;
    }

    html += `
        </div>
        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span class="text-xl font-bold total-liquido-label">Valor Total Disponível:</span>
            <span class="font-mono text-green-600 text-xl font-bold total-liquido-valor">${formatCurrency(valorTotal)}</span>
        </div>`;

    return html;
}

/**
 * Generates the content HTML for PIS/PASEP calculation report
 */
function generatePisPasepReportContent(results, inputState) {
    const { valorAbono, elegivel, mesesTrabalhados } = results;

    let html = `
        <div class="space-y-1">
            <h4 class="text-lg font-semibold text-primary mt-4">Informações do Trabalhador</h4>
            <div class="flex justify-between result-row py-2">
                <span>Salário Médio:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.salarioMedio)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Meses Trabalhados:</span>
                <span class="font-mono text-blue-600">${inputState.mesesTrabalhados} meses</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Data de Inscrição:</span>
                <span class="font-mono text-blue-600">${formatDateBR(inputState.dataInscricao)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Elegível ao Abono:</span>
                <span class="font-mono ${elegivel ? 'text-green-600' : 'text-red-600'}">${elegivel ? 'Sim' : 'Não'}</span>
            </div>
        </div>

        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span class="text-xl font-bold total-liquido-label">Valor do Abono:</span>
            <span class="font-mono ${elegivel ? 'text-green-600' : 'text-red-600'} text-xl font-bold total-liquido-valor">${formatCurrency(valorAbono)}</span>
        </div>`;

    return html;
}

/**
 * Generates the content HTML for Seguro-Desemprego calculation report
 */
function generateSeguroDesempregoReportContent(results, inputState) {
    const { valorParcela, numeroParcelas, valorTotal, elegivel } = results;

    let html = `
        <div class="space-y-1">
            <h4 class="text-lg font-semibold text-primary mt-4">Informações do Trabalhador</h4>
            <div class="flex justify-between result-row py-2">
                <span>Últimos 3 Salários:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.salario1)} | ${formatCurrency(inputState.salario2)} | ${formatCurrency(inputState.salario3)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Meses Trabalhados:</span>
                <span class="font-mono text-blue-600">${inputState.mesesTrabalhados} meses</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Solicitações Anteriores:</span>
                <span class="font-mono text-blue-600">${inputState.numSolicitacoes}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Elegível ao Seguro:</span>
                <span class="font-mono ${elegivel ? 'text-green-600' : 'text-red-600'}">${elegivel ? 'Sim' : 'Não'}</span>
            </div>`;

    if (elegivel) {
        html += `
            <h4 class="text-lg font-semibold text-green-600 mt-4">Valores do Benefício</h4>
            <div class="flex justify-between result-row py-2">
                <span>Valor da Parcela:</span>
                <span class="font-mono text-green-600">${formatCurrency(valorParcela)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Número de Parcelas:</span>
                <span class="font-mono text-green-600">${numeroParcelas}</span>
            </div>`;
    }

    html += `
        </div>
        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span class="text-xl font-bold total-liquido-label">Valor Total do Benefício:</span>
            <span class="font-mono ${elegivel ? 'text-green-600' : 'text-red-600'} text-xl font-bold total-liquido-valor">${formatCurrency(valorTotal)}</span>
        </div>`;

    return html;
}

/**
 * Generates the content HTML for Horas Extras calculation report
 */
function generateHorasExtrasReportContent(results, inputState) {
    const { valorHorasExtras50, valorHorasExtras100, valorHorasNoturnas, valorTotal } = results;

    let html = `
        <div class="space-y-1">
            <h4 class="text-lg font-semibold text-primary mt-4">Informações Base</h4>
            <div class="flex justify-between result-row py-2">
                <span>Salário Base:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.salarioBase)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Horas Contratuais/Mês:</span>
                <span class="font-mono text-blue-600">${inputState.horasContratuais}h</span>
            </div>

            <h4 class="text-lg font-semibold text-green-600 mt-4">Cálculo das Horas</h4>`;

    if (inputState.horasExtras50 > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Horas Extras 50% (${inputState.horasExtras50}h):</span>
                <span class="font-mono text-green-600">${formatCurrency(valorHorasExtras50)}</span>
            </div>`;
    }

    if (inputState.horasExtras100 > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Horas Extras 100% (${inputState.horasExtras100}h):</span>
                <span class="font-mono text-green-600">${formatCurrency(valorHorasExtras100)}</span>
            </div>`;
    }

    if (inputState.horasNoturnas > 0) {
        html += `
            <div class="flex justify-between result-row py-2">
                <span>Horas Noturnas (${inputState.horasNoturnas}h):</span>
                <span class="font-mono text-green-600">${formatCurrency(valorHorasNoturnas)}</span>
            </div>`;
    }

    html += `
        </div>
        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span class="text-xl font-bold total-liquido-label">Total Horas Extras:</span>
            <span class="font-mono text-green-600 text-xl font-bold total-liquido-valor">${formatCurrency(valorTotal)}</span>
        </div>`;

    return html;
}

/**
 * Generates the content HTML for INSS calculation report
 */
function generateInssReportContent(results, inputState) {
    const { aliquota, valorContribuicao, faixaSalarial } = results;

    let html = `
        <div class="space-y-1">
            <h4 class="text-lg font-semibold text-primary mt-4">Informações da Contribuição</h4>
            <div class="flex justify-between result-row py-2">
                <span>Salário Bruto:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.salarioBruto)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Faixa Salarial:</span>
                <span class="font-mono text-blue-600">${faixaSalarial}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Alíquota Aplicada:</span>
                <span class="font-mono text-blue-600">${aliquota}%</span>
            </div>
        </div>

        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span class="text-xl font-bold total-liquido-label">Contribuição INSS:</span>
            <span class="font-mono text-red-600 text-xl font-bold total-liquido-valor">${formatCurrency(valorContribuicao)}</span>
        </div>`;

    return html;
}

/**
 * Generates the content HTML for Vale-Transporte calculation report
 */
function generateValeTransporteReportContent(results, inputState) {
    const { valorVT, descontoEmpregado, custoEmpregador, valorDiario } = results;

    let html = `
        <div class="space-y-1">
            <h4 class="text-lg font-semibold text-primary mt-4">Informações do Benefício</h4>
            <div class="flex justify-between result-row py-2">
                <span>Salário Bruto:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.salarioBruto)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Custo Diário Transporte:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.custoDiario)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Dias de Trabalho/Mês:</span>
                <span class="font-mono text-blue-600">${inputState.diasTrabalho} dias</span>
            </div>

            <h4 class="text-lg font-semibold text-orange-600 mt-4">Cálculo do Vale-Transporte</h4>
            <div class="flex justify-between result-row py-2">
                <span>Valor Total VT/Mês:</span>
                <span class="font-mono text-orange-600">${formatCurrency(valorVT)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Desconto do Empregado (6%):</span>
                <span class="font-mono text-red-600">${formatCurrency(descontoEmpregado)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Custo para o Empregador:</span>
                <span class="font-mono text-blue-600">${formatCurrency(custoEmpregador)}</span>
            </div>
        </div>

        <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
            <span class="text-xl font-bold total-liquido-label">Valor Líquido VT:</span>
            <span class="font-mono text-green-600 text-xl font-bold total-liquido-valor">${formatCurrency(valorVT - descontoEmpregado)}</span>
        </div>`;

    return html;
}

/**
 * Generates the content HTML for IRPF calculation report
 */
function generateIrpfReportContent(results, inputState) {
    const { impostoAnual, impostoMensal, aliquota, faixaIR, impostoAReceber, impostoAPagar } = results;

    let html = `
        <div class="space-y-1">
            <h4 class="text-lg font-semibold text-primary mt-4">Informações da Declaração</h4>
            <div class="flex justify-between result-row py-2">
                <span>Renda Anual:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.rendaAnual)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Número de Dependentes:</span>
                <span class="font-mono text-blue-600">${inputState.dependentes}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Outras Deduções:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.outrasDeducoes)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Imposto Retido na Fonte:</span>
                <span class="font-mono text-blue-600">${formatCurrency(inputState.impostoRetido)}</span>
            </div>

            <h4 class="text-lg font-semibold text-orange-600 mt-4">Cálculo do Imposto</h4>
            <div class="flex justify-between result-row py-2">
                <span>Faixa de Tributação:</span>
                <span class="font-mono text-orange-600">${faixaIR}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Alíquota Aplicada:</span>
                <span class="font-mono text-orange-600">${aliquota}%</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Imposto Anual Devido:</span>
                <span class="font-mono text-orange-600">${formatCurrency(impostoAnual)}</span>
            </div>
            <div class="flex justify-between result-row py-2">
                <span>Imposto Mensal:</span>
                <span class="font-mono text-orange-600">${formatCurrency(impostoMensal)}</span>
            </div>
        </div>`;

    if (impostoAReceber > 0) {
        html += `
            <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span class="text-xl font-bold total-liquido-label">Imposto a Receber:</span>
                <span class="font-mono text-green-600 text-xl font-bold total-liquido-valor">${formatCurrency(impostoAReceber)}</span>
            </div>`;
    } else if (impostoAPagar > 0) {
        html += `
            <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span class="text-xl font-bold total-liquido-label">Imposto a Pagar:</span>
                <span class="font-mono text-red-600 text-xl font-bold total-liquido-valor">${formatCurrency(impostoAPagar)}</span>
            </div>`;
    } else {
        html += `
            <div class="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span class="text-xl font-bold total-liquido-label">Situação:</span>
                <span class="font-mono text-blue-600 text-xl font-bold total-liquido-valor">Sem impostos a pagar/receber</span>
            </div>`;
    }

    return html;
}

// --- FAQ SYSTEM FUNCTIONS ---

/**
 * Abre o modal de FAQ
 * @param {string} initialTopic - Tópico inicial para mostrar (opcional)
 */
export function openFaqModal(initialTopic = null) {
    createFaqModal();
    showFaqModal();
    if (initialTopic) {
        loadFaqContent(initialTopic);
    } else {
        loadFaqCategories();
    }
}

/**
 * Cria o modal de FAQ se não existir
 */
function createFaqModal() {
    if (document.getElementById('faq-modal')) return;
    
    const modalHTML = `
        <div id="faq-modal" class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 hidden">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-lg max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-xl border border-gray-200">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                        <div class="flex items-center space-x-3">
                            <span class="material-icons text-primary text-2xl">library_books</span>
                            <h2 class="text-xl font-semibold text-gray-900">Base de Conhecimento</h2>
                        </div>
                        <button id="close-faq-modal" class="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    
                    <!-- Content Area -->
                    <div class="flex h-[70vh]">
                        <!-- Sidebar Navigation -->
                        <div class="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                            <!-- Search -->
                            <div class="p-4 border-b border-gray-200">
                                <div class="relative">
                                    <span class="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">search</span>
                                    <input 
                                        type="text" 
                                        id="faq-search" 
                                        placeholder="Buscar na base de conhecimento..." 
                                        class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                </div>
                            </div>
                            
                            <!-- Navigation Content -->
                            <div id="faq-navigation" class="p-4">
                                <!-- Navegação será carregada aqui -->
                            </div>
                        </div>
                        
                        <!-- Main Content -->
                        <div class="flex-1 overflow-y-auto bg-white">
                            <div id="faq-content" class="p-6">
                                <!-- Conteúdo será carregado aqui -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Adicionar event listeners
    document.getElementById('close-faq-modal').addEventListener('click', hideFaqModal);
    document.getElementById('faq-modal').addEventListener('click', (e) => {
        if (e.target.id === 'faq-modal') hideFaqModal();
    });
    
    // Busca
    document.getElementById('faq-search').addEventListener('input', handleFaqSearch);
}

/**
 * Mostra o modal de FAQ
 */
function showFaqModal() {
    const modal = document.getElementById('faq-modal');
    if (modal) {
        modal.classList.remove('hidden');
        // Carrega a base de conhecimento se ainda não foi carregada
        loadKnowledgeBase().then(() => {
            loadFaqCategories();
        });
    }
}

/**
 * Esconde o modal de FAQ
 */
function hideFaqModal() {
    const modal = document.getElementById('faq-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Carrega as categorias do FAQ na navegação
 */
async function loadFaqCategories() {
    await loadKnowledgeBase();
    const categories = getAllFaqCategories();
    const navigation = document.getElementById('faq-navigation');
    
    if (!navigation) return;
    
    let navHTML = `
        <div class="mb-4">
            <h3 class="font-semibold text-foreground mb-3 flex items-center">
                <span class="material-icons text-primary mr-2 text-lg">category</span>
                Categorias
            </h3>
        </div>
    `;
    
    navHTML += '<div class="space-y-1">';
    
    categories.forEach(category => {
        const iconName = category.materialIcon || category.icon || 'help';
        navHTML += `
            <button 
                class="w-full text-left px-3 py-2.5 rounded-md hover:bg-muted transition-colors faq-category-btn group"
                data-category="${category.id}"
            >
                <div class="flex items-center space-x-3">
                    <span class="material-icons text-muted-foreground group-hover:text-primary transition-colors text-lg">${iconName}</span>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-foreground text-sm">${category.title}</div>
                        <div class="text-xs text-muted-foreground">${category.questions?.length || 0} perguntas</div>
                    </div>
                </div>
            </button>
        `;
    });
    
    navHTML += '</div>';
    
    // Adicionar botão de voltar (oculto inicialmente)
    navHTML += `
        <button 
            id="faq-back-btn" 
            class="hidden w-full mt-6 px-3 py-2 text-sm text-primary hover:text-primary/80 hover:bg-primary/10 border border-primary/20 rounded-md transition-colors flex items-center justify-center space-x-2"
        >
            <span class="material-icons text-sm">arrow_back</span>
            <span>Voltar às categorias</span>
        </button>
    `;
    
    navigation.innerHTML = navHTML;
    
    // Carregar conteúdo inicial
    loadWelcomeContent();
    
    // Adicionar event listeners para categorias
    document.querySelectorAll('.faq-category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryId = e.currentTarget.dataset.category;
            loadCategoryContent(categoryId);
        });
    });
    
    // Event listener para botão voltar
    document.getElementById('faq-back-btn').addEventListener('click', () => {
        loadFaqCategories();
    });
}

/**
 * Carrega o conteúdo de boas-vindas
 */
function loadWelcomeContent() {
    const content = document.getElementById('faq-content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
            
            <!-- Título Principal com Emoji -->
            <div class="mb-2">
                <span class="text-6xl mb-4 block">📚</span>
                <h3 class="text-2xl sm:text-3xl font-bold text-gray-800">
                    Base de Conhecimento
                </h3>
            </div>
            <p class="max-w-xl text-sm sm:text-base text-gray-600 mb-8">
                Bem-vindo à nossa base de conhecimento! Encontre respostas detalhadas sobre direitos trabalhistas, cálculos e muito mais.
            </p>

            <!-- Cards de Ação -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-10">
                
                <!-- Card: Explorar por Categoria -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer" onclick="document.querySelector('.faq-category-btn')?.click()">
                    <div class="flex items-start space-x-4">
                        <span class="material-icons text-2xl text-primary">apps</span>
                        <div>
                            <h4 class="font-semibold text-gray-800">Explorar por Categoria</h4>
                            <p class="text-sm text-gray-600 mt-1">Navegue pelos tópicos organizados para aprender passo a passo.</p>
                        </div>
                    </div>
                </div>

                <!-- Card: Busca Inteligente -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer" onclick="document.getElementById('faq-search')?.focus()">
                    <div class="flex items-start space-x-4">
                        <span class="material-icons text-2xl text-primary">search</span>
                        <div>
                            <h4 class="font-semibold text-gray-800">Busca Inteligente</h4>
                            <p class="text-sm text-gray-600 mt-1">Encontre rapidamente o que procura digitando um termo.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Botão de Ação Principal -->
            <button id="close-kb-modal-btn" class="bg-primary text-primary-foreground font-semibold py-3 px-8 rounded-lg shadow-md hover:bg-primary/90 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                USAR AS FERRAMENTAS DE CÁLCULO
            </button>

        </div>
    `;
}

/**
 * Carrega o conteúdo de uma categoria específica
 */
async function loadCategoryContent(categoryId) {
    await loadKnowledgeBase();
    const category = getFaqCategory(categoryId);
    
    if (!category) return;
    
    const content = document.getElementById('faq-content');
    const navigation = document.getElementById('faq-navigation');
    
    // Mostrar botão voltar
    const backBtn = document.getElementById('faq-back-btn');
    if (backBtn) backBtn.classList.remove('hidden');
    
    // Atualizar navegação para mostrar perguntas
    const iconName = category.materialIcon || category.icon || 'help';
    let navHTML = `
        <div class="mb-4">
            <h3 class="font-semibold text-foreground mb-3 flex items-center">
                <span class="material-icons text-primary mr-2 text-lg">${iconName}</span>
                ${category.title}
            </h3>
        </div>
    `;
    
    navHTML += '<div class="space-y-1">';
    
    category.questions?.forEach((question, index) => {
        navHTML += `
            <button 
                class="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors faq-question-btn border-l-2 border-transparent hover:border-primary/30"
                data-question="${index}"
            >
                <div class="text-foreground font-medium text-xs mb-1">Pergunta ${index + 1}</div>
                <div class="text-muted-foreground text-xs leading-relaxed line-clamp-2">${question.question}</div>
            </button>
        `;
    });
    
    navHTML += '</div>';
    navigation.innerHTML = navHTML + document.getElementById('faq-back-btn').outerHTML;
    
    // Recarregar event listener do botão voltar
    document.getElementById('faq-back-btn').addEventListener('click', () => {
        loadFaqCategories();
    });
    
    // Carregar primeira pergunta
    if (category.questions?.length > 0) {
        loadQuestionContent(category, 0);
    }
    
    // Event listeners para perguntas
    document.querySelectorAll('.faq-question-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const questionIndex = parseInt(e.currentTarget.dataset.question);
            loadQuestionContent(category, questionIndex);
            
            // Destacar pergunta ativa
            document.querySelectorAll('.faq-question-btn').forEach(b => b.classList.remove('bg-muted', 'border-primary'));
            e.currentTarget.classList.add('bg-muted', 'border-primary');
        });
    });
    
    // Destacar primeira pergunta como ativa
    const firstQuestion = document.querySelector('.faq-question-btn');
    if (firstQuestion) {
        firstQuestion.classList.add('bg-muted', 'border-primary');
    }
}

/**
 * Carrega o conteúdo de uma pergunta específica
 */
function loadQuestionContent(category, questionIndex) {
    const question = category.questions[questionIndex];
    if (!question) return;
    
    const content = document.getElementById('faq-content');
    const iconName = category.materialIcon || category.icon || 'help';
    
    let html = `
        <div class="max-w-4xl">
            <!-- Header da pergunta -->
            <div class="mb-6">
                <div class="flex items-center space-x-2 mb-3">
                    <span class="material-icons text-primary text-sm">${iconName}</span>
                    <span class="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">
                        ${category.title}
                    </span>
                </div>
                <h1 class="text-2xl font-bold text-foreground leading-tight">${question.question}</h1>
            </div>
            
            <!-- Conteúdo da resposta -->
            <div class="prose prose-sm max-w-none text-muted-foreground">
                <div class="bg-muted/30 border border-border rounded-lg p-6">
                    ${question.answer}
                </div>
            </div>
        </div>
    `;
    
    // Adicionar tags se existirem
    if (question.tags && question.tags.length > 0) {
        html += `
            <div class="mt-6 pt-6 border-t border-border">
                <div class="flex items-center space-x-2 mb-3">
                    <span class="material-icons text-muted-foreground text-sm">local_offer</span>
                    <p class="text-sm font-medium text-foreground">Tags relacionadas</p>
                </div>
                <div class="flex flex-wrap gap-2">
        `;
        question.tags.forEach(tag => {
            html += `<span class="px-2 py-1 text-xs bg-muted border border-border text-muted-foreground rounded-md">${tag}</span>`;
        });
        html += `</div></div>`;
    }
    
    // Adicionar calculadoras relacionadas
    if (question.related_calculators && question.related_calculators.length > 0) {
        html += `
            <div class="mt-6 pt-6 border-t border-border">
                <div class="flex items-center space-x-2 mb-3">
                    <span class="material-icons text-muted-foreground text-sm">calculate</span>
                    <p class="text-sm font-medium text-foreground">Calculadoras relacionadas</p>
                </div>
                <div class="flex flex-wrap gap-2">
        `;
        question.related_calculators.forEach(calc => {
            if (calc !== 'todas') {
                html += `<button class="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-md border border-primary/20 hover:bg-primary/20 transition-colors font-medium" onclick="hideFaqModal(); window.switchToCalculator && window.switchToCalculator('${calc}')">${calc}</button>`;
            }
        });
        html += `</div></div>`;
    }
    
    content.innerHTML = html;
}

/**
 * Manipula a busca no FAQ
 */
async function handleFaqSearch(e) {
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        loadFaqCategories();
        return;
    }
    
    await loadKnowledgeBase();
    const results = searchKnowledgeBase(query);
    
    const navigation = document.getElementById('faq-navigation');
    const content = document.getElementById('faq-content');
    
    // Atualizar navegação com resultados
    let navHTML = `
        <div class="mb-4">
            <h3 class="font-semibold text-foreground mb-3 flex items-center">
                <span class="material-icons text-primary mr-2 text-lg">search</span>
                Resultados da Busca
            </h3>
            <div class="text-xs text-muted-foreground mb-3">${results.length} resultados encontrados</div>
        </div>
    `;
    
    if (results.length === 0) {
        navHTML += `
            <div class="text-center py-8">
                <span class="material-icons text-muted-foreground text-4xl mb-3 block">search_off</span>
                <p class="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
                <p class="text-xs text-muted-foreground mt-1">Tente termos diferentes ou explore as categorias.</p>
            </div>
        `;
    } else {
        navHTML += '<div class="space-y-1">';
        results.forEach((result, index) => {
            const title = result.type === 'faq' ? result.question : result.title;
            navHTML += `
                <button 
                    class="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors search-result-btn border-l-2 border-transparent hover:border-primary/30"
                    data-result="${index}"
                >
                    <div class="text-foreground font-medium text-xs mb-1">${result.type === 'faq' ? result.categoryTitle : 'Tooltip'}</div>
                    <div class="text-muted-foreground text-xs leading-relaxed line-clamp-2">${title}</div>
                </button>
            `;
        });
        navHTML += '</div>';
    }
    
    navigation.innerHTML = navHTML;
    
    // Mostrar primeiro resultado
    if (results.length > 0) {
        showSearchResult(results[0]);
        // Destacar primeiro resultado
        const firstResult = document.querySelector('.search-result-btn');
        if (firstResult) {
            firstResult.classList.add('bg-muted', 'border-primary');
        }
    } else {
        // Mostrar mensagem de nenhum resultado
        content.innerHTML = `
            <div class="max-w-2xl mx-auto text-center py-12">
                <span class="material-icons text-muted-foreground text-6xl mb-4 block">search_off</span>
                <h3 class="text-xl font-semibold text-foreground mb-2">Nenhum resultado encontrado</h3>
                <p class="text-muted-foreground mb-6">
                    Não encontramos resultados para "<strong>${query}</strong>". Tente usar termos diferentes ou explore as categorias disponíveis.
                </p>
                <button 
                    class="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    onclick="document.getElementById('faq-search').value = ''; loadFaqCategories();"
                >
                    <span class="material-icons text-sm">arrow_back</span>
                    <span>Voltar às categorias</span>
                </button>
            </div>
        `;
    }
    
    // Event listeners para resultados
    document.querySelectorAll('.search-result-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const resultIndex = parseInt(e.currentTarget.dataset.result);
            showSearchResult(results[resultIndex]);
            
            // Destacar resultado ativo
            document.querySelectorAll('.search-result-btn').forEach(b => b.classList.remove('bg-muted', 'border-primary'));
            e.currentTarget.classList.add('bg-muted', 'border-primary');
        });
    });
}

/**
 * Mostra um resultado de busca
 */
function showSearchResult(result) {
    const content = document.getElementById('faq-content');
    
    let html = `
        <div class="max-w-4xl">
            <!-- Header do resultado -->
            <div class="mb-6">
                <div class="flex items-center space-x-2 mb-3">
                    <span class="material-icons text-primary text-sm">${result.type === 'faq' ? 'help' : 'info'}</span>
                    <span class="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">
                        ${result.type === 'faq' ? result.categoryTitle : 'Tooltip'}
                    </span>
                </div>
                <h1 class="text-2xl font-bold text-foreground leading-tight">
                    ${result.type === 'faq' ? result.question : result.title}
                </h1>
            </div>
            
            <!-- Conteúdo da resposta -->
            <div class="prose prose-sm max-w-none text-muted-foreground">
                <div class="bg-muted/30 border border-border rounded-lg p-6">
                    ${result.type === 'faq' ? result.answer : result.content}
                </div>
            </div>
        </div>
    `;
    
    if (result.tags && result.tags.length > 0) {
        html += `
            <div class="mt-6 pt-6 border-t border-border">
                <div class="flex items-center space-x-2 mb-3">
                    <span class="material-icons text-muted-foreground text-sm">local_offer</span>
                    <p class="text-sm font-medium text-foreground">Tags relacionadas</p>
                </div>
                <div class="flex flex-wrap gap-2">
        `;
        result.tags.forEach(tag => {
            html += `<span class="px-2 py-1 text-xs bg-muted border border-border text-muted-foreground rounded-md">${tag}</span>`;
        });
        html += `</div></div>`;
    }
    
    content.innerHTML = html;
}

// Tornar a função openFaqModal global para uso nos tooltips
window.openFaqModal = openFaqModal;

// === MOBILE NAVIGATION DROPDOWN FUNCTIONS ===

/**
 * Lista de calculadoras disponíveis com seus nomes de exibição
 */
const calculatorList = [
    { id: 'ferias', name: 'Cálculo de Férias', icon: 'beach_access' },
    { id: 'rescisao', name: 'Rescisão de Contrato', icon: 'work_off' },
    { id: 'decimoTerceiro', name: '13º Salário', icon: 'card_giftcard' },
    { id: 'salarioLiquido', name: 'Salário Líquido', icon: 'account_balance_wallet' },
    { id: 'fgts', name: 'FGTS', icon: 'savings' },
    { id: 'pisPasep', name: 'PIS/PASEP', icon: 'account_balance' },
    { id: 'seguroDesemprego', name: 'Seguro-Desemprego', icon: 'security' },
    { id: 'horasExtras', name: 'Horas Extras', icon: 'schedule' },
    { id: 'inss', name: 'INSS', icon: 'local_hospital' },
    { id: 'valeTransporte', name: 'Vale-Transporte', icon: 'directions_bus' },
    { id: 'irpf', name: 'Imposto de Renda', icon: 'receipt_long' }
];

/**
 * Renderiza o dropdown de navegação mobile com as calculadoras disponíveis
 */
export function renderMobileCalculatorSelector() {
    const panel = document.getElementById('mobile-nav-panel');
    const currentSelection = document.getElementById('mobile-nav-current-selection');
    
    if (!panel || !currentSelection) {
        console.warn('Mobile nav elements not found');
        return;
    }
    
    // Atualizar o texto da seleção atual
    const activeCalculator = calculatorList.find(calc => calc.id === state.activeTab);
    if (activeCalculator) {
        currentSelection.textContent = activeCalculator.name;
    }
    
    // Limpar e popular o painel
    const panelContent = panel.querySelector('[role="menu"]');
    if (!panelContent) return;
    
    panelContent.innerHTML = '';
    
    calculatorList.forEach(calculator => {
        const button = document.createElement('button');
        button.className = `mobile-nav-option ${calculator.id === state.activeTab ? 'active' : ''}`;
        button.setAttribute('role', 'menuitem');
        button.setAttribute('data-calculator', calculator.id);
        button.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="material-icons text-sm">${calculator.icon}</span>
                <span>${calculator.name}</span>
            </div>
        `;
        
        panelContent.appendChild(button);
    });
}

/**
 * Mostra o dropdown de navegação mobile
 */
export function showMobileDropdown() {
    const trigger = document.getElementById('mobile-nav-trigger');
    const panel = document.getElementById('mobile-nav-panel');
    
    if (!trigger || !panel) return;
    
    trigger.setAttribute('aria-expanded', 'true');
    panel.classList.remove('hidden');
    
    // Pequeno delay para permitir a transição CSS
    setTimeout(() => {
        panel.classList.add('show');
    }, 10);
}

/**
 * Esconde o dropdown de navegação mobile
 */
export function hideMobileDropdown() {
    const trigger = document.getElementById('mobile-nav-trigger');
    const panel = document.getElementById('mobile-nav-panel');
    
    if (!trigger || !panel) return;
    
    trigger.setAttribute('aria-expanded', 'false');
    panel.classList.remove('show');
    
    // Aguardar transição antes de esconder
    setTimeout(() => {
        panel.classList.add('hidden');
    }, 200);
}

/**
 * Alterna a visibilidade do dropdown mobile
 */
export function toggleMobileDropdown() {
    const panel = document.getElementById('mobile-nav-panel');
    if (!panel) return;
    
    if (panel.classList.contains('hidden')) {
        showMobileDropdown();
    } else {
        hideMobileDropdown();
    }
}

// === KNOWLEDGE BASE MODAL SLIDE ANIMATIONS ===

/**
 * Estado atual do modal da base de conhecimento
 */
let knowledgeBaseViewState = {
    currentView: 'categories', // 'categories', 'questions', 'answer'
    viewHistory: [], // Stack para navegação
    currentCategory: null,
    currentQuestion: null
};

/**
 * Aplica animação de slide para transição entre views
 * @param {string} direction - 'forward' ou 'backward'
 * @param {function} updateContentCallback - Função para atualizar o conteúdo
 */
export function animateKnowledgeBaseTransition(direction, updateContentCallback) {
    const container = document.querySelector('#knowledge-base-modal .kb-views-container');
    if (!container) return;
    
    const currentView = container.querySelector('.kb-view.active');
    if (!currentView) return;
    
    // Criar nova view
    const newView = document.createElement('div');
    newView.className = 'kb-view transitioning';
    
    if (direction === 'forward') {
        newView.classList.add('slide-in-right');
    } else {
        newView.classList.add('slide-out-left');
        currentView.classList.add('slide-in-right');
    }
    
    container.appendChild(newView);
    
    // Atualizar conteúdo da nova view
    updateContentCallback(newView);
    
    // Animar transição
    setTimeout(() => {
        if (direction === 'forward') {
            currentView.classList.add('slide-out-left');
            newView.classList.remove('slide-in-right');
            newView.classList.add('active');
        } else {
            currentView.classList.remove('slide-out-left');
            currentView.classList.add('slide-in-right');
            newView.classList.remove('slide-in-right');
            newView.classList.add('active');
        }
        
        currentView.classList.remove('active');
        
        // Limpar view antiga após animação
        setTimeout(() => {
            if (currentView.parentNode) {
                currentView.remove();
            }
        }, 300);
    }, 10);
}

/**
 * Renderiza a view de categorias da base de conhecimento
 */
export function renderKnowledgeBaseCategories() {
    const categories = getAllFaqCategories();
    let html = `
        <div class="kb-view active">
            <h3 class="text-lg font-semibold mb-4">📚 Base de Conhecimento</h3>
            <p class="text-sm text-muted-foreground mb-6">Selecione uma categoria para explorar:</p>
            <div class="space-y-2">
    `;
    
    categories.forEach(category => {
        html += `
            <button class="kb-category-btn w-full text-left p-4 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors" 
                    data-category="${category.id}">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="font-medium">${category.name}</h4>
                        <p class="text-sm text-muted-foreground">${category.description}</p>
                    </div>
                    <span class="material-icons text-muted-foreground">chevron_right</span>
                </div>
            </button>
        `;
    });
    
    html += `</div></div>`;
    return html;
}

/**
 * Atualiza o estado do modal da base de conhecimento
 * @param {string} view - Nova view ('categories', 'questions', 'answer')
 * @param {object} data - Dados adicionais (categoria, questão, etc.)
 */
export function updateKnowledgeBaseView(view, data = {}) {
    knowledgeBaseViewState.currentView = view;
    
    if (data.category) {
        knowledgeBaseViewState.currentCategory = data.category;
    }
    
    if (data.question) {
        knowledgeBaseViewState.currentQuestion = data.question;
    }
    
    // Adicionar à história se for uma navegação para frente
    if (view !== 'categories' && !data.isBack) {
        knowledgeBaseViewState.viewHistory.push({
            view: knowledgeBaseViewState.currentView,
            category: knowledgeBaseViewState.currentCategory,
            question: knowledgeBaseViewState.currentQuestion
        });
    }
}
