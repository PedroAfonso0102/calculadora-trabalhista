/**
 * UI Module
 *
 * This module is responsible for all DOM manipulation. It reads from the
 * state and updates the UI accordingly. It does not contain any business logic.
 */

import { state } from './state.js';
import * as calculations from './calculations.js';
import { formatCurrency } from './utils.js';

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

export function createTooltip(topicKey) {
    const topic = state.legalTexts[topicKey];
    if (!topic) return null;

    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'tooltip';
    tooltipElement.setAttribute('role', 'tooltip');
    tooltipElement.id = `tooltip-for-${topicKey}`;

    let contentHTML = `<h4 class="font-bold text-lg mb-2">${topic.title}</h4>`;
    contentHTML += `<div class="text-sm space-y-2">${topic.content}</div>`;
    if (topic.legal) {
        contentHTML += `<p class="text-xs text-muted-foreground mt-4 pt-2 border-t">${topic.legal}</p>`;
    }
    tooltipElement.innerHTML = contentHTML;

    document.body.appendChild(tooltipElement);
    return tooltipElement;
}

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
 * Updates the active state of topic navigation buttons
 * @param {string} activeTopic - The currently active topic
 */
function updateActiveTopicButton(activeTopic) {
    const topicButtons = document.querySelectorAll('.educational-topic-btn');

    topicButtons.forEach(button => {
        const buttonTopic = button.dataset.topic;
        if (buttonTopic === activeTopic) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
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
    html += `
        <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">Valor do Abono:</span>
                <span class="font-bold ${elegivel ? 'text-green-600' : 'text-red-600'}">${formatCurrency(valorAbono)}</span>
            </div>
        </div>`;
    return html;
}

function generateSeguroDesempregoModalContent(results, inputState) {
    const { numeroParcelas, valorPorParcela, memoriaCalculo } = results;
    let html = generateMemoryStepsHTML(memoriaCalculo);
    html += `
        <div class="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">Nº de Parcelas:</span>
                <span class="font-bold text-blue-600">${numeroParcelas}</span>
            </div>
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">Valor por Parcela:</span>
                <span class="font-bold text-green-600">${formatCurrency(valorPorParcela)}</span>
            </div>
        </div>`;
    return html;
}

function generateHorasExtrasModalContent(results, inputState) {
    const { totalGeralAdicionais, memoriaCalculo } = results;
    let html = generateMemoryStepsHTML(memoriaCalculo);
    html += `
        <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">Total de Adicionais:</span>
                <span class="font-bold text-green-600">${formatCurrency(totalGeralAdicionais)}</span>
            </div>
        </div>`;
    return html;
}

function generateInssModalContent(results, inputState) {
    const { contribuicaoINSS, aliquotaEfetiva, memoriaCalculo } = results;
    let html = generateMemoryStepsHTML(memoriaCalculo);
    html += `
        <div class="mt-4 pt-4 border-t border-gray-200">
             <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">Contribuição Devida:</span>
                <span class="font-bold text-red-600">${formatCurrency(contribuicaoINSS)}</span>
            </div>
        </div>`;
    return html;
}

function generateValeTransporteModalContent(results, inputState) {
    const { descontoRealEmpregado, valorBeneficioEmpregador, memoriaCalculo } = results;
    let html = generateMemoryStepsHTML(memoriaCalculo);
    html += `
        <div class="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">Desconto do Empregado:</span>
                <span class="font-bold text-red-600">${formatCurrency(descontoRealEmpregado)}</span>
            </div>
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">Custeado pelo Empregador:</span>
                <span class="font-bold text-green-600">${formatCurrency(valorBeneficioEmpregador)}</span>
            </div>
        </div>`;
    return html;
}

function generateIrpfModalContent(results, inputState) {
    const { ajusteFinal, tipoAjuste, memoriaCalculo } = results;
    const isPagar = tipoAjuste === 'pagar';
    const isRestituir = tipoAjuste === 'restituir';
    const colorClass = isPagar ? 'text-red-600' : (isRestituir ? 'text-green-600' : 'text-gray-800');
    const label = isPagar ? 'Imposto a Pagar:' : 'Imposto a Restituir:';

    let html = generateMemoryStepsHTML(memoriaCalculo);
    html += `
        <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">${label}</span>
                <span class="font-bold ${colorClass}">${formatCurrency(Math.abs(ajusteFinal))}</span>
            </div>
        </div>`;
    return html;
}


/**
 * Generates modal content for Ferias calculation
 */
function generateFeriasModalContent(results, inputState) {
    const { baseDeCalculo, valorFerias, tercoConstitucional, valorAbono, tercoAbono, adiantamento13, descontoINSS, descontoIRRF, valorLiquido, venderFerias, adiantarDecimo, diasFerias } = results;

    let html = `
        <div class="mt-4">
            <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                    <span>Base de Cálculo:</span>
                    <span class="font-medium">${formatCurrency(baseDeCalculo)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Dias de Férias:</span>
                    <span class="font-medium">${diasFerias} dias</span>
                </div>
            </div>
        </div>

        <div class="mt-4">
            <h4 class="font-semibold text-gray-800">Proventos (Ganhos)</h4>
            <div class="mt-2 space-y-1 text-sm">
                <div class="flex justify-between">
                    <span>Valor das Férias (${venderFerias ? (diasFerias - (diasFerias/3)) : diasFerias} dias):</span>
                    <span class="font-medium text-green-600">${formatCurrency(valorFerias)}</span>
                </div>
                <div class="flex justify-between">
                    <span>1/3 Constitucional sobre Férias:</span>
                    <span class="font-medium text-green-600">${formatCurrency(tercoConstitucional)}</span>
                </div>`;

    if (venderFerias && valorAbono > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Abono Pecuniário (Venda 1/3):</span>
                    <span class="font-medium text-green-600">${formatCurrency(valorAbono)}</span>
                </div>
                <div class="flex justify-between">
                    <span>1/3 sobre Abono Pecuniário:</span>
                    <span class="font-medium text-green-600">${formatCurrency(tercoAbono)}</span>
                </div>`;
    }

    if (adiantarDecimo && adiantamento13 > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Adiantamento 13º Salário:</span>
                    <span class="font-medium text-green-600">${formatCurrency(adiantamento13)}</span>
                </div>`;
    }

    html += `
            </div>
        </div>

        <div class="mt-4">
            <h4 class="font-semibold text-gray-800">Descontos</h4>
            <div class="mt-2 space-y-1 text-sm">
                <div class="flex justify-between">
                    <span>INSS:</span>
                    <span class="font-medium text-red-600">-${formatCurrency(descontoINSS.value)}</span>
                </div>
                <div class="flex justify-between">
                    <span>IRRF:</span>
                    <span class="font-medium text-red-600">-${formatCurrency(descontoIRRF.value)}</span>
                </div>
            </div>
        </div>

        <div class="mt-4">
            <h4 class="font-semibold text-gray-800">Valores Finais</h4>
            <div class="mt-2 space-y-1 text-sm">
                <div class="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total Líquido a Receber:</span>
                    <span class="font-bold text-blue-600">${formatCurrency(valorLiquido)}</span>
                </div>
            </div>
        </div>`;

    return html;
}

/**
 * Generates modal content for Decimo Terceiro calculation
 */
function generateDecimoTerceiroModalContent(results, inputState) {
    const { baseDeCalculo, mesesTrabalhados, valorBrutoDecimo, descontoINSS, descontoIRRF, valorLiquidoDecimo, adiantamentoRecebido, valorAReceber } = results;

    let html = `
        <div class="mt-4">
            <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                    <span>Base de Cálculo:</span>
                    <span class="font-medium">${formatCurrency(baseDeCalculo)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Meses trabalhados:</span>
                    <span class="font-medium">${mesesTrabalhados} meses</span>
                </div>
                <div class="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>13º Salário Bruto:</span>
                    <span class="font-medium">${formatCurrency(valorBrutoDecimo)}</span>
                </div>
            </div>
        </div>

        <div class="mt-4">
            <h4 class="font-semibold text-gray-800">Descontos</h4>
            <div class="mt-2 space-y-1 text-sm">
                <div class="flex justify-between">
                    <span>INSS:</span>
                    <span class="font-medium text-red-600">-${formatCurrency(descontoINSS.value)}</span>
                </div>
                <div class="flex justify-between">
                    <span>IRRF:</span>
                    <span class="font-medium text-red-600">-${formatCurrency(descontoIRRF.value)}</span>
                </div>
            </div>
        </div>

        <div class="mt-4">
            <h4 class="font-semibold text-gray-800">Valores Finais</h4>
            <div class="mt-2 space-y-1 text-sm">
                <div class="flex justify-between">
                    <span>13º Salário Líquido:</span>
                    <span class="font-medium text-green-600">${formatCurrency(valorLiquidoDecimo)}</span>
                </div>`;

    if (adiantamentoRecebido > 0) {
        html += `
                <div class="flex justify-between">
                    <span>(-) Adiantamento já recebido:</span>
                    <span class="font-medium text-red-600">-${formatCurrency(adiantamentoRecebido)}</span>
                </div>`;
    }

    html += `
            </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">Valor a Receber:</span>
                <span class="font-bold text-blue-600">${formatCurrency(valorAReceber)}</span>
            </div>
        </div>`;

    return html;
}

/**
 * Generates modal content for Salario Liquido calculation
 */
function generateSalarioLiquidoModalContent(results, inputState) {
    const { salarioBruto, horasExtras, adicionalPericulosidade, adicionalInsalubridade, adicionalNoturno, salarioFamilia, descontoINSS, descontoIRRF, descontoVT, descontoVR, descontoSaude, descontoAdiantamentos, totalProventos, totalDescontos, salarioLiquido } = results;

    let html = `
        <div class="mt-4">
            <h4 class="font-semibold text-gray-800">Proventos (Ganhos)</h4>
            <div class="mt-2 space-y-1 text-sm">
                <div class="flex justify-between">
                    <span>Salário Base:</span>
                    <span class="font-medium text-green-600">${formatCurrency(salarioBruto)}</span>
                </div>`;

    if (horasExtras > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Horas Extras:</span>
                    <span class="font-medium text-green-600">${formatCurrency(horasExtras)}</span>
                </div>`;
    }

    if (adicionalPericulosidade > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Adicional de Periculosidade:</span>
                    <span class="font-medium text-green-600">${formatCurrency(adicionalPericulosidade)}</span>
                </div>`;
    }

    if (adicionalInsalubridade > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Adicional de Insalubridade:</span>
                    <span class="font-medium text-green-600">${formatCurrency(adicionalInsalubridade)}</span>
                </div>`;
    }

    if (adicionalNoturno > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Adicional Noturno:</span>
                    <span class="font-medium text-green-600">${formatCurrency(adicionalNoturno)}</span>
                </div>`;
    }

    if (salarioFamilia > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Salário Família:</span>
                    <span class="font-medium text-green-600">${formatCurrency(salarioFamilia)}</span>
                </div>`;
    }

    html += `
                <div class="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total Bruto:</span>
                    <span class="font-medium text-green-600">${formatCurrency(totalProventos)}</span>
                </div>
            </div>
        </div>

        <div class="mt-4">
            <h4 class="font-semibold text-gray-800">Descontos</h4>
            <div class="mt-2 space-y-1 text-sm">
                <div class="flex justify-between">
                    <span>INSS:</span>
                    <span class="font-medium text-red-600">-${formatCurrency(descontoINSS.value)}</span>
                </div>
                <div class="flex justify-between">
                    <span>IRRF:</span>
                    <span class="font-medium text-red-600">-${formatCurrency(descontoIRRF.value)}</span>
                </div>`;

    if (descontoVT > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Vale-Transporte (6%):</span>
                    <span class="font-medium text-red-600">-${formatCurrency(descontoVT)}</span>
                </div>`;
    }

    if (descontoVR > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Vale-Refeição/Alimentação:</span>
                    <span class="font-medium text-red-600">-${formatCurrency(descontoVR)}</span>
                </div>`;
    }

    if (descontoSaude > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Plano de Saúde / Odontológico:</span>
                    <span class="font-medium text-red-600">-${formatCurrency(descontoSaude)}</span>
                </div>`;
    }

    if (descontoAdiantamentos > 0) {
        html += `
                <div class="flex justify-between">
                    <span>Adiantamentos (Vale):</span>
                    <span class="font-medium text-red-600">-${formatCurrency(descontoAdiantamentos)}</span>
                </div>`;
    }

    html += `
                <div class="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total de Descontos:</span>
                    <span class="font-mono text-red-600">-${formatCurrency(totalDescontos)}</span>
                </div>
            </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">Salário Líquido a Receber:</span>
                <span class="font-bold text-blue-600">${formatCurrency(salarioLiquido)}</span>
            </div>
        </div>`;

    return html;
}

/**
 * Generates modal content for Rescisao calculation
 */
function generateRescisaoModalContent(results, inputState) {
    const { proventos, descontos, totalProventos, totalDescontos, valorLiquido } = results;

    let html = `
        <div class="mt-4">
            <h4 class="font-semibold text-gray-800">Verbas Rescisórias (Ganhos)</h4>
            <div class="mt-2 space-y-2 text-sm">`;

    // Add provento items
    Object.entries(proventos).forEach(([key, data]) => {
        if (data.valor > 0) {
            html += `
                <details class="calculation-details-item border-b border-gray-200 pb-2">
                    <summary class="flex justify-between items-center cursor-pointer py-1">
                        <span>${key}</span>
                        <strong class="text-green-600 font-medium">${formatCurrency(data.valor)}</strong>
                    </summary>
                    <div class="calculation-details-content mt-2 p-2 bg-gray-50 rounded-md border-l-4 border-blue-500">
                        <p class="text-xs text-gray-600">${data.explicacao}</p>
                    </div>
                </details>`;
        }
    });

    html += `
                <div class="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total de Proventos:</span>
                    <span class="font-medium text-green-600">${formatCurrency(totalProventos)}</span>
                </div>
            </div>
        </div>

        <div class="mt-4">
            <h4 class="font-semibold text-gray-800">Descontos</h4>
            <div class="mt-2 space-y-1 text-sm">`;

    // Add desconto items
    Object.entries(descontos).forEach(([key, result]) => {
        const value = result.value || 0;
        if (value > 0) {
            html += `
                <div class="flex justify-between py-1">
                    <span>${key}:</span>
                    <span class="font-medium text-red-600">-${formatCurrency(value)}</span>
                </div>`;
        }
    });

    html += `
                <div class="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total de Descontos:</span>
                    <span class="font-mono text-red-600">-${formatCurrency(totalDescontos)}</span>
                </div>
            </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
            <div class="flex justify-between items-center text-lg">
                <span class="font-bold text-gray-900">Total Líquido a Receber:</span>
                <span class="font-bold text-blue-600">${formatCurrency(valorLiquido)}</span>
            </div>
        </div>`;

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

function createFgtsResultHTML(results) {
    if (Object.keys(state.fgts.errors).some(k => state.fgts.errors[k])) {
        return '<p class="text-center text-red-500 font-semibold">Por favor, corrija os campos destacados acima para ver o seu cálculo.</p>';
    }
    if (!results || !results.salarioBruto) return '<p class="text-center text-muted-foreground">Preencha os campos para calcular.</p>';

    const { depositoMensal, valorSaque, opcaoSaque } = results;
    const saqueLabel = opcaoSaque === 'rescisao' ? 'Saque-Rescisão' : 'Saque-Aniversário';

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in">
        <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado da Simulação FGTS</h3>
            <p class="text-sm text-muted-foreground">Resumo das suas simulações de FGTS.</p>
        </div>
        <div class="p-6 pt-0">
            <div class="space-y-4">
                <div>
                    <h4 class="text-lg font-semibold text-primary">Depósito Mensal</h4>
                    <div class="flex justify-between result-row py-2">
                        <span>Valor Estimado do Depósito:</span>
                        <span class="font-mono text-green-600">${formatCurrency(depositoMensal)}</span>
                    </div>
                </div>
                <div>
                    <h4 class="text-lg font-semibold text-primary mt-4">Simulação de Saque</h4>
                    <div class="flex justify-between result-row py-2">
                        <span>Valor Estimado do ${saqueLabel}:</span>
                        <span class="font-mono text-green-600">${formatCurrency(valorSaque)}</span>
                    </div>
                </div>
            </div>
            <div class="flex gap-2 w-full mt-6">
                <button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button>
                <button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button>
            </div>
        </div>
    </div>`;
}

function createPisPasepResultHTML(results) {
    if (!results) return '';
    const { valorAbono, elegivel, mensagem } = results;

    let messageColorClass = elegivel ? 'text-gray-600' : 'text-red-500';

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in">
        <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado do Abono Salarial (PIS/PASEP)</h3>
        </div>
        <div class="p-6 pt-0">
            <div class="space-y-2">
                <div class="flex justify-between result-row py-2">
                    <span>Valor Estimado do Abono:</span>
                    <span class="font-mono text-green-600">${formatCurrency(valorAbono)}</span>
                </div>
                <p class="text-sm ${messageColorClass} pt-2">${mensagem}</p>
            </div>
            <div class="flex gap-2 w-full mt-6">
                <button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button>
                <button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button>
            </div>
        </div>
    </div>`;
}

function createSeguroDesempregoResultHTML(results) {
    if (!results) return '';
    const { numeroParcelas, valorPorParcela, elegivel, mensagem } = results;

    let messageColorClass = elegivel ? 'text-gray-600' : 'text-red-500';

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in">
        <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado do Seguro-Desemprego</h3>
        </div>
        <div class="p-6 pt-0">
            <div class="space-y-2">
                <div class="flex justify-between result-row py-2">
                    <span>Número de Parcelas:</span>
                    <span class="font-mono text-blue-600">${numeroParcelas}</span>
                </div>
                <div class="flex justify-between result-row py-2">
                    <span>Valor por Parcela:</span>
                    <span class="font-mono text-green-600">${formatCurrency(valorPorParcela)}</span>
                </div>
                <p class="text-sm ${messageColorClass} pt-2">${mensagem}</p>
            </div>
            <div class="flex gap-2 w-full mt-6">
                <button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button>
                <button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button>
            </div>
        </div>
    </div>`;
}

function createINSSResultHTML(results) {
    if (!results) return '';
    const { contribuicaoINSS, mensagem } = results;

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in">
        <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado da Contribuição INSS</h3>
        </div>
        <div class="p-6 pt-0">
            <div class="space-y-2">
                <div class="flex justify-between result-row py-2">
                    <span>Valor da Contribuição:</span>
                    <span class="font-mono text-red-600">${formatCurrency(contribuicaoINSS)}</span>
                </div>
                <p class="text-sm text-gray-600 pt-2">${mensagem}</p>
            </div>
            <div class="flex gap-2 w-full mt-6">
                <button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button>
                <button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button>
            </div>
        </div>
    </div>`;
}

function createHorasExtrasResultHTML(results) {
    if (!results) return '';
    const { totalValorHE50, totalValorHE100, totalValorAdicionalNoturno, totalGeralAdicionais, mensagem } = results;

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in">
        <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado do Cálculo de Horas Extras</h3>
        </div>
        <div class="p-6 pt-0">
            <div class="space-y-2">
                <div class="flex justify-between result-row py-2">
                    <span>Total de Horas Extras 50%:</span>
                    <span class="font-mono text-green-600">${formatCurrency(totalValorHE50)}</span>
                </div>
                <div class="flex justify-between result-row py-2">
                    <span>Total de Horas Extras 100%:</span>
                    <span class="font-mono text-green-600">${formatCurrency(totalValorHE100)}</span>
                </div>
                <div class="flex justify-between result-row py-2">
                    <span>Total de Adicional Noturno:</span>
                    <span class="font-mono text-green-600">${formatCurrency(totalValorAdicionalNoturno)}</span>
                </div>
                <div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2">
                    <span>Total Geral de Adicionais:</span>
                    <span class="font-mono text-blue-600">${formatCurrency(totalGeralAdicionais)}</span>
                </div>
                <p class="text-sm text-gray-600 pt-2">${mensagem}</p>
            </div>
            <div class="flex gap-2 w-full mt-6">
                <button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button>
                <button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button>
            </div>
        </div>
    </div>`;
}

function createValeTransporteResultHTML(results) {
    if (!results) return '';
    const { custoMensalTotal, descontoMaximoSalario, descontoRealEmpregado, valorBeneficioEmpregador, mensagem } = results;

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in">
        <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado do Cálculo de Vale-Transporte</h3>
        </div>
        <div class="p-6 pt-0">
            <div class="space-y-2">
                <div class="flex justify-between result-row py-2">
                    <span>Custo Mensal Total do Transporte:</span>
                    <span class="font-mono">${formatCurrency(custoMensalTotal)}</span>
                </div>
                <div class="flex justify-between result-row py-2">
                    <span>Desconto Máximo (6% do Salário):</span>
                    <span class="font-mono">${formatCurrency(descontoMaximoSalario)}</span>
                </div>
                <div class="flex justify-between result-row py-2">
                    <span>Desconto Real do Empregado:</span>
                    <span class="font-mono text-red-600">${formatCurrency(descontoRealEmpregado)}</span>
                </div>
                <div class="flex justify-between result-row py-2">
                    <span>Valor Fornecido pelo Empregador:</span>
                    <span class="font-mono text-green-600">${formatCurrency(valorBeneficioEmpregador)}</span>
                </div>
                <p class="text-sm text-gray-600 pt-2">${mensagem}</p>
            </div>
            <div class="flex gap-2 w-full mt-6">
                <button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button>
                <button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button>
            </div>
        </div>
    </div>`;
}

function createIRPFResultHTML(results) {
    if (!results) return '';
    const { impostoDevido, ajusteFinal, tipoAjuste, mensagem } = results;

    const ajusteLabel = tipoAjuste === 'pagar' ? 'Imposto a Pagar' : 'Imposto a Restituir';
    const ajusteColorClass = tipoAjuste === 'pagar' ? 'text-red-600' : 'text-green-600';

    return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm mt-6 animate-fade-in">
        <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-2xl font-semibold leading-none tracking-tight">Resultado da Simulação de IRPF Anual</h3>
        </div>
        <div class="p-6 pt-0">
            <div class="space-y-2">
                <div class="flex justify-between result-row py-2">
                    <span>Total de Imposto Devido no Ano:</span>
                    <span class="font-mono">${formatCurrency(impostoDevido)}</span>
                </div>
                <div class="flex justify-between font-semibold border-t pt-2 mt-2 result-row py-2">
                    <span>${ajusteLabel}:</span>
                    <span class="font-mono ${ajusteColorClass}">${formatCurrency(Math.abs(ajusteFinal))}</span>
                </div>
                <p class="text-sm text-gray-600 pt-2">${mensagem}</p>
            </div>
            <div class="flex gap-2 w-full mt-6">
                <button class="js-show-memory-modal inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1">Ver Memória de Cálculo</button>
                <button class="js-print-result inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2 flex-1">Imprimir</button>
            </div>
        </div>
    </div>`;
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
    const currentDate = new Date().toLocaleString('pt-BR');

    // Generate the main content based on calculation type
    let contentHTML = '';
    let calculatorTitle = '';

    switch (type) {
        case 'ferias':
            calculatorTitle = 'Cálculo de Férias';
            contentHTML = generateFeriasReportContent(results, inputState);
            break;
        case 'decimoTerceiro':
            calculatorTitle = 'Cálculo do 13º Salário';
            contentHTML = generateDecimoTerceiroReportContent(results, inputState);
            break;
        case 'salarioLiquido':
            calculatorTitle = 'Cálculo do Salário Líquido';
            contentHTML = generateSalarioLiquidoReportContent(results, inputState);
            break;
        case 'rescisao':
            calculatorTitle = 'Cálculo de Rescisão';
            contentHTML = generateRescisaoReportContent(results, inputState);
            break;
        default:
            return '<p>Erro: Tipo de cálculo não reconhecido.</p>';
    }

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

export function render() {
    const activeCalculator = state.activeTab;
    let results;
    let html;

    // 1. Update form inputs to reflect the current state
    if (state[activeCalculator]) {
      renderFormInputs(activeCalculator);
    }

    // 2. Run calculation based on active tab and generate HTML
    switch (activeCalculator) {
        case 'ferias':
            results = calculations.calculateFerias(state.ferias);
            html = createFeriasResultHTML(results);
            break;
        case 'decimoTerceiro':
            results = calculations.calculateDecimoTerceiro(state.decimoTerceiro);
            html = createDecimoTerceiroResultHTML(results);
            break;
        case 'salarioLiquido':
            results = calculations.calculateSalarioLiquido(state.salarioLiquido);
            html = createSalarioLiquidoResultHTML(results);
            break;
        case 'rescisao':
            results = calculations.calculateRescisao(state.rescisao);
            html = createRescisaoResultHTML(results);
            break;
        case 'fgts':
            results = calculations.calculateFGTS(state.fgts);
            html = createFgtsResultHTML(results);
            break;
        case 'pisPasep':
            results = calculations.calculatePISPASEP(state.pisPasep, state.legalTexts);
            html = createPisPasepResultHTML(results);
            break;
        case 'seguroDesemprego':
            results = calculations.calculateSeguroDesemprego(state.seguroDesemprego, state.legalTexts);
            html = createSeguroDesempregoResultHTML(results);
            break;
        case 'horasExtras':
            results = calculations.calculateHorasExtras(state.horasExtras, state.legalTexts);
            html = createHorasExtrasResultHTML(results);
            break;
        case 'inss':
            results = calculations.calculateINSSCalculator(state.inss, state.legalTexts);
            html = createINSSResultHTML(results);
            break;
        case 'valeTransporte':
            results = calculations.calculateValeTransporte(state.valeTransporte, state.legalTexts);
            html = createValeTransporteResultHTML(results);
            break;
        case 'irpf':
            results = calculations.calculateIRPF(state.irpf, state.legalTexts);
            html = createIRPFResultHTML(results);
            break;
    }

    // 3. Update the result container
    if (resultContainers[activeCalculator]) {
        resultContainers[activeCalculator].innerHTML = html;
    }

    // 4. Update active tab UI
    renderTabs();

    // 5. Update conditional UI elements
    renderSalarioFamiliaUI();

    // 6. Update field states (e.g., disabled)
    if (state[activeCalculator]) {
      renderFieldStates(activeCalculator);
    }

    // 7. Display validation errors
    if (state[activeCalculator]) {
      renderValidationErrors(activeCalculator);
    }
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
