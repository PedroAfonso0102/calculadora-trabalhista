/**
 * Event Listeners Module
 *
 * This module is responsible for attaching all event listeners to the DOM
 * and orchestrating the application's response to user input.
 */

import { state, updateState, initialState } from './state.js';
import { render, createTooltip, showTooltip, hideTooltip, renderCalculationMemory, showCalculationMemoryModal, hideCalculationMemoryModal, generateReportHTML, updateAndShowModal, updateSalaryResult, toggleEducationalPanel, loadEducationalContent, showEducationalWelcome } from './ui.js';
import * as calculations from './calculations.js';
import { debounce, unmaskCurrency, formatCurrency } from './utils.js';

/**
 * Updates the visual state of a segmented control based on the selected radio button.
 * @param {HTMLElement} groupElement - The radiogroup container element.
 */
function updateSegmentedControl(groupElement) {
    if (!groupElement) return;
    const radios = groupElement.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        const label = groupElement.querySelector(`label[for="${radio.id}"]`);
        if (label) {
            label.dataset.state = radio.checked ? 'active' : 'inactive';
        }
    });
}

/**
 * Enforces the business rule that a user cannot receive both periculosidade and insalubridade.
 * This function ONLY updates the state. The UI (disabling fields) is handled in the render function.
 * @param {string} calculatorName - The name of the current calculator (e.g., 'ferias').
 * @param {string} changedFieldName - The name of the field that triggered the change.
 */
function handleInsalubridadePericulosidadeInterlock(calculatorName, changedFieldName) {
    // If periculosidade was just checked, reset insalubridade if it was active.
    if (changedFieldName === 'periculosidade' && state[calculatorName].periculosidade && state[calculatorName].insalubridadeGrau !== '0') {
        updateState(`${calculatorName}.insalubridadeGrau`, '0');
    }

    // If insalubridade was just changed to be active, uncheck periculosidade.
    if (changedFieldName === 'insalubridadeGrau' && state[calculatorName].insalubridadeGrau !== '0' && state[calculatorName].periculosidade) {
        updateState(`${calculatorName}.periculosidade`, false);
    }
}


function handleClearForm(calculatorName) {
    // Deep copy the initial state for the specific calculator to avoid reference issues
    const initialCalculatorState = JSON.parse(JSON.stringify(initialState[calculatorName]));

    // Replace the current state for that calculator with the initial state
    state[calculatorName] = initialCalculatorState;

    // Re-render the UI to reflect the cleared state
    render();
}

/**
 * Handles input changes on form fields.
 * It updates the state with the new value and triggers a re-render.
 * @param {Event} event - The input event object.
 */
function validateField(path, value) {
    const [calculator, field] = path.split('.');
    let errorMessage = null;

    if (field === 'salarioBruto' && value <= 0) {
        errorMessage = 'Salário deve ser maior que zero.';
    }
    if (field === 'diasFerias' && (value < 1 || value > 30)) {
        errorMessage = 'O valor deve ser entre 1 e 30.';
    }
    if ((field === 'dataAdmissao' || field === 'dataDemissao') && !value) {
        errorMessage = 'Data é obrigatória.';
    }

    // Clear previous error
    updateState(`${calculator}.errors.${field}`, null);
    if (errorMessage) {
        // Set new error
        updateState(`${calculator}.errors.${field}`, errorMessage);
    }
}


function handleInputChange(event) {
    const element = event.target;
    const path = element.dataset.state;
    if (!path) return;

    let value;
    switch (element.type) {
        case 'checkbox':
            value = element.checked;
            break;
        case 'radio':
            if (element.checked) {
                value = element.value;
            } else {
                return;
            }
            break;
        case 'number':
            value = parseFloat(element.value) || 0;
            break;
        case 'text':
            if (element.classList.contains('money-mask')) {
                const unmaskedValue = unmaskCurrency(element.value);
                value = unmaskedValue;
            } else {
                value = element.value;
            }
            break;
        default:
            value = element.value;
    }

    validateField(path, value);
    updateState(path, value);

    if (path === 'salarioLiquido.recebeSalarioFamilia' && !value) {
        updateState('salarioLiquido.filhosSalarioFamilia', 0);
    }

    render();

    if (localStorage.getItem('savePreference') === 'true') {
        saveStateToLocalStorage();
    }
}

/**
 * Handles tab switching.
 * @param {Event} event - The click event object.
 */
function handleTabClick(event) {
    let newTab = event.currentTarget.value; // e.g., "decimo-terceiro"

    // Convert kebab-case from the HTML 'value' attribute to camelCase to match JS state keys
    newTab = newTab.replace(/-(\w)/g, (_, c) => c.toUpperCase()); // "decimo-terceiro" -> "decimoTerceiro"

    if (newTab && newTab !== state.activeTab) {
        updateState('activeTab', newTab);
        render();
    }
}

/**
 * Initializes the IMask library on all relevant fields.
 */
/**
 * Initializes all event listeners for the application.
 */
export function initializeEventListeners() {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
        console.error("Fatal Error: Application container '#app' not found.");
        return;
    }

    // Use event delegation for performance and simplicity
    appContainer.addEventListener('input', handleInputChange);
    appContainer.addEventListener('change', (event) => {
        const target = event.target;
        if (target.type === 'checkbox' || target.type === 'radio' || target.tagName.toLowerCase() === 'select') {
            handleInputChange(event); // Update state first

            const path = target.dataset.state;
            if (!path) return;

            const [calculatorName, fieldName] = path.split('.');

            if (target.type === 'radio' && target.closest('[role="radiogroup"]')) {
                updateSegmentedControl(target.closest('[role="radiogroup"]'));
            }

            if (fieldName === 'periculosidade' || fieldName === 'insalubridadeGrau') {
                handleInsalubridadePericulosidadeInterlock(calculatorName, fieldName);
            }
        }
    });

    // Tooltip and Modal click handling
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    appContainer.addEventListener('click', (event) => {
        const target = event.target;

        // Tooltip logic for touch devices
        const helpIcon = target.closest('.help-icon');
        if (isTouchDevice && helpIcon) {
            event.preventDefault();
            const topic = helpIcon.dataset.topic;
            const existingTooltip = document.getElementById(`tooltip-for-${topic}`);
            hideTooltip();
            if (!existingTooltip) {
                const tooltipElement = createTooltip(topic);
                if (tooltipElement) showTooltip(helpIcon, tooltipElement);
            }
        }

        // Close tooltip when clicking outside (for both touch and desktop)
        if (!target.closest('.help-icon') && !target.closest('.tooltip')) {
            hideTooltip();
        }

        // Modal logic
        if (target.classList.contains('js-show-memory-modal')) {
            const calculatorName = state.activeTab;
            const calculatorState = state[calculatorName];
            
            // Get calculation results
            let results;
            switch (calculatorName) {
                case 'ferias': 
                    results = calculations.calculateFerias(calculatorState); 
                    break;
                case 'decimoTerceiro': 
                    results = calculations.calculateDecimoTerceiro(calculatorState); 
                    break;
                case 'salarioLiquido': 
                    results = calculations.calculateSalarioLiquido(calculatorState); 
                    break;
                case 'rescisao': 
                    results = calculations.calculateRescisao(calculatorState); 
                    break;
                case 'fgts':
                    results = calculations.calculateFGTS(calculatorState);
                    break;
                case 'pisPasep':
                    results = calculations.calculatePISPASEP(calculatorState);
                    break;
                case 'seguroDesemprego':
                    results = calculations.calculateSeguroDesemprego(calculatorState);
                    break;
                case 'horasExtras':
                    results = calculations.calculateHorasExtras(calculatorState);
                    break;
                case 'inss':
                case 'valeTransporte':
                case 'irpf':
                    results = {}; // No results for placeholders
                    break;
                default: 
                    console.error('Unknown calculator type:', calculatorName);
                    return;
            }
            
            // Use the centralized updateAndShowModal function
            const modalData = {
                type: calculatorName,
                results: results,
                state: calculatorState
            };
            
            updateAndShowModal(modalData);
        }

        // Print logic
        if (target.classList.contains('js-print-result')) {
            const calculatorName = state.activeTab;
            const calculatorState = state[calculatorName];
            
            // Get calculation results
            let results;
            switch (calculatorName) {
                case 'ferias': 
                    results = calculations.calculateFerias(calculatorState); 
                    break;
                case 'decimoTerceiro': 
                    results = calculations.calculateDecimoTerceiro(calculatorState); 
                    break;
                case 'salarioLiquido': 
                    results = calculations.calculateSalarioLiquido(calculatorState); 
                    break;
                case 'rescisao': 
                    results = calculations.calculateRescisao(calculatorState); 
                    break;
                case 'fgts':
                    results = calculations.calculateFGTS(calculatorState);
                    break;
                case 'pisPasep':
                    results = calculations.calculatePISPASEP(calculatorState);
                    break;
                case 'seguroDesemprego':
                    results = calculations.calculateSeguroDesemprego(calculatorState);
                    break;
                case 'horasExtras':
                    results = calculations.calculateHorasExtras(calculatorState);
                    break;
                case 'inss':
                case 'valeTransporte':
                case 'irpf':
                    results = {}; // No results for placeholders
                    break;
                default: 
                    console.error('Unknown calculator type:', calculatorName);
                    return;
            }
            
            // Generate report HTML using the centralized function
            const reportData = {
                type: calculatorName,
                results: results,
                state: calculatorState
            };
            
            const reportHTML = generateReportHTML(reportData);
            
            // Create a temporary iframe for printing
            createAndPrintReport(reportHTML);
        }
    });

    // Desktop-only tooltip logic
    if (!isTouchDevice) {
        appContainer.addEventListener('mouseover', (event) => {
            const target = event.target.closest('.help-icon');
            if (target) {
                const topic = target.dataset.topic;
                const tooltipElement = createTooltip(topic);
                if (tooltipElement) showTooltip(target, tooltipElement);
            }
        });
        appContainer.addEventListener('mouseout', (event) => {
            if (event.target.closest('.help-icon')) hideTooltip();
        });
    }

    // Universal listeners
    document.querySelectorAll('[role="tab"]').forEach(button => button.addEventListener('click', handleTabClick));

    // Salary simulator listener
    const salarySimulatorInput = document.getElementById('simular-salario-bruto');
    if (salarySimulatorInput) {
        salarySimulatorInput.addEventListener('input', debounce(handleSalarySimulation, 300));
    }

    const modal = document.getElementById('calculation-memory-modal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target.id === 'calculation-memory-modal-close-btn' || event.target.id === 'calculation-memory-modal-overlay') {
                hideCalculationMemoryModal();
            }
            if (event.target.id === 'calculation-memory-modal-print-btn') {
                const calculatorName = state.activeTab;
                const calculatorState = state[calculatorName];
                
                // Get calculation results
                let results;
                switch (calculatorName) {
                    case 'ferias': 
                        results = calculations.calculateFerias(calculatorState); 
                        break;
                    case 'decimoTerceiro': 
                        results = calculations.calculateDecimoTerceiro(calculatorState); 
                        break;
                    case 'salarioLiquido': 
                        results = calculations.calculateSalarioLiquido(calculatorState); 
                        break;
                    case 'rescisao': 
                        results = calculations.calculateRescisao(calculatorState); 
                        break;
                case 'fgts':
                    results = calculations.calculateFGTS(calculatorState);
                    break;
                case 'pisPasep':
                    results = calculations.calculatePISPASEP(calculatorState);
                    break;
                case 'seguroDesemprego':
                    results = calculations.calculateSeguroDesemprego(calculatorState);
                    break;
                case 'horasExtras':
                    results = calculations.calculateHorasExtras(calculatorState);
                    break;
                case 'inss':
                case 'valeTransporte':
                case 'irpf':
                    results = {}; // No results for placeholders
                    break;
                    default: 
                        console.error('Unknown calculator type:', calculatorName);
                        return;
                }
                
                // Generate report HTML using the centralized function
                const reportData = {
                    type: calculatorName,
                    results: results,
                    state: calculatorState
                };
                
                const reportHTML = generateReportHTML(reportData);
                
                // Create and print the report
                createAndPrintReport(reportHTML);
            }
        });
    }

    const saveDataCheckbox = document.getElementById('save-data-checkbox');
    if (saveDataCheckbox) {
        saveDataCheckbox.addEventListener('change', handleSaveDataToggle);
    }

    // Initial UI setup
    document.querySelectorAll('[role="radiogroup"]').forEach(updateSegmentedControl);

    // Global click handler to close tooltips when clicking outside
    document.addEventListener('click', (event) => {
        const target = event.target;
        // Close tooltip if clicking outside of help icons and tooltips
        if (!target.closest('.help-icon') && !target.closest('.tooltip')) {
            hideTooltip();
        }
    });

    // Educational Panel Event Listeners
    initializeEducationalPanelEvents();
}

/**
 * Initializes event listeners for the educational panel functionality
 */
function initializeEducationalPanelEvents() {
    // Menu button click to open panel
    const menuBtn = document.getElementById('educational-panel-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            toggleEducationalPanel(true);
        });
    }

    // Close button click to close panel
    const closeBtn = document.getElementById('educational-panel-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toggleEducationalPanel(false);
        });
    }

    // Overlay click to close panel
    const overlay = document.getElementById('educational-panel-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            toggleEducationalPanel(false);
        });
    }

    // Topic buttons click to load content
    const topicButtons = document.querySelectorAll('.educational-topic-btn');
    topicButtons.forEach(button => {
        button.addEventListener('click', () => {
            const topic = button.dataset.topic;
            if (topic) {
                loadEducationalContent(topic);
            }
        });
    });

    // Keyboard navigation for accessibility
    document.addEventListener('keydown', (event) => {
        const panel = document.getElementById('educational-panel');
        const isVisible = panel && panel.classList.contains('visible');

        if (isVisible && event.key === 'Escape') {
            toggleEducationalPanel(false);
        }
    });

    // Trap focus within panel when open for better accessibility
    const panel = document.getElementById('educational-panel');
    if (panel) {
        panel.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                const focusableElements = panel.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (event.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        event.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        event.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }
}

function handleSalarySimulation(event) {
    const simulatorInput = event.target;
    const newGrossSalary = unmaskCurrency(simulatorInput.value);

    if (newGrossSalary <= 0) {
        // If salary is zero or negative, show zero result
        updateSalaryResult({ salarioLiquido: 0 });
        return;
    }

    // Get current dependents from the active salary liquid state
    const dependents = state.salarioLiquido.dependentes || 0;
    
    // Calculate other discounts from current salary liquid state
    const otherDiscounts = (state.salarioLiquido.descontoVt || 0) + 
                          (state.salarioLiquido.descontoVr || 0) + 
                          (state.salarioLiquido.descontoSaude || 0) + 
                          (state.salarioLiquido.descontoAdiantamentos || 0);

    // Use the new calculateNetSalary function
    const results = calculations.calculateNetSalary(newGrossSalary, dependents, otherDiscounts);

    // Update the UI using the new updateSalaryResult function
    updateSalaryResult(results);
}

/**
 * Saves the relevant parts of the application state to localStorage.
 */
function saveStateToLocalStorage() {
    const stateToSave = {
        ferias: state.ferias,
        rescisao: state.rescisao,
        decimoTerceiro: state.decimoTerceiro,
        salarioLiquido: state.salarioLiquido,
        // We don't save activeTab or legalTexts
    };
    localStorage.setItem('appState', JSON.stringify(stateToSave));
}

/**
 * Handles the logic for the "Save Data" checkbox.
 * @param {Event} event - The change event object.
 */
function handleSaveDataToggle(event) {
    const isChecked = event.target.checked;
    localStorage.setItem('savePreference', isChecked);
    if (isChecked) {
        saveStateToLocalStorage();
    } else {
        localStorage.removeItem('appState');
    }
}

/**
 * Creates and prints a report using an iframe.
 * This function is the centralized print manager that handles iframe creation and printing.
 * @param {string} reportHTML - The complete HTML string ready for printing
 */
function createAndPrintReport(reportHTML) {
    // Create a complete HTML document structure for printing
    const completeHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório de Cálculo Trabalhista</title>
            <link rel="stylesheet" href="assets/css/print.css">
            <style>
                body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
                @media print {
                    body { margin: 0; padding: 0; }
                    .print-header { display: block !important; }
                }
            </style>
        </head>
        <body>
            ${reportHTML}
        </body>
        </html>
    `;

    // Create temporary iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    document.body.appendChild(printFrame);

    // Write HTML to iframe and trigger print
    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(completeHTML);
    frameDoc.close();

    // Wait for content to load, then print
    printFrame.onload = function() {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        // Remove iframe after printing
        setTimeout(() => {
            if (document.body.contains(printFrame)) {
                document.body.removeChild(printFrame);
            }
        }, 1000);
    };
}


