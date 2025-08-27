/**
 * Event Listeners Module
 *
 * This module is responsible for attaching all event listeners to the DOM
 * and orchestrating the application's response to user input.
 */

import { state, updateState, initialState } from './state.js';
import { render, createTooltip, showTooltip, hideTooltip, renderCalculationMemory, showCalculationMemoryModal, hideCalculationMemoryModal, generateReportHTML, updateAndShowModal, updateSalaryResult, toggleEducationalPanel, loadEducationalContent, showEducationalWelcome, showCustomizeModal, hideCustomizeModal } from './ui.js';
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

    // Validações específicas por tipo de campo
    switch (field) {
        case 'salarioBruto':
            if (!value || value <= 0) {
                errorMessage = 'Salário deve ser maior que zero.';
            }
            break;
        case 'diasFerias':
            if (!value || value < 1 || value > 30) {
                errorMessage = 'Deve estar entre 1 e 30 dias.';
            }
            break;
        case 'dataAdmissao':
        case 'dataDemissao':
            if (!value) {
                errorMessage = 'Data é obrigatória.';
            } else {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    errorMessage = 'Data inválida.';
                }
            }
            break;
        case 'dependentes':
            if (value < 0) {
                errorMessage = 'Número de dependentes não pode ser negativo.';
            }
            break;
        case 'mesesTrabalhados':
            if (value < 1 || value > 12) {
                errorMessage = 'Deve estar entre 1 e 12 meses.';
            }
            break;
        case 'custodiario':
        case 'custoDiario':
            if (value <= 0) {
                errorMessage = 'Custo deve ser maior que zero.';
            }
            break;
        case 'diasTrabalho':
            if (value < 1 || value > 31) {
                errorMessage = 'Dias de trabalho deve estar entre 1 e 31.';
            }
            break;
    }

    return {
        isValid: !errorMessage,
        message: errorMessage
    };
}

/**
 * Validação híbrida de campos - mostra erro apenas após primeiro blur, 
 * depois valida em tempo real (FASE 3)
 */
function validateFieldWithFeedback(element, path) {
    const value = getFieldValue(element);
    
    clearFieldValidation(element);
    
    const validation = validateField(path, value);
    if (validation.isValid && value) {
        showFieldSuccess(element);
    } else if (!validation.isValid) {
        showFieldError(element, validation.message);
    }
}

/**
 * Obtém o valor do campo baseado no seu tipo
 */
function getFieldValue(element) {
    switch (element.type) {
        case 'checkbox':
            return element.checked;
        case 'radio':
            return element.checked ? element.value : null;
        case 'number':
            return parseFloat(element.value) || 0;
        case 'text':
            if (element.classList.contains('money-mask')) {
                return unmaskCurrency(element.value);
            }
            return element.value;
        default:
            return element.value;
    }
}

/**
 * Remove validação anterior do campo
 */
function clearFieldValidation(element) {
    element.classList.remove('input-success', 'input-error', 'border-green-500', 'bg-green-50', 'border-red-500', 'bg-red-50');
    
    // Remove mensagens de validação existentes
    const existingValidation = element.parentNode.querySelector('.field-validation');
    if (existingValidation) {
        existingValidation.remove();
    }
}

/**
 * Mostra erro de validação no campo
 */
function showFieldError(element, message) {
    element.classList.add('input-error', 'border-red-500', 'bg-red-50');
    element.classList.remove('input-success', 'border-green-500', 'bg-green-50');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-validation text-red-600';
    errorDiv.innerHTML = `
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        ${message}
    `;
    element.parentNode.appendChild(errorDiv);
}

/**
 * Mostra sucesso de validação no campo
 */
function showFieldSuccess(element) {
    element.classList.add('input-success', 'border-green-500', 'bg-green-50');
    element.classList.remove('input-error', 'border-red-500', 'bg-red-50');
    
    const successDiv = document.createElement('div');
    successDiv.className = 'field-validation text-green-600';
    successDiv.innerHTML = `
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Válido
    `;
    element.parentNode.appendChild(successDiv);
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

    // FASE 3: Validação híbrida em tempo real
    const fieldContainer = element.closest('.space-y-2') || element.parentNode;
    const isFirstBlur = !fieldContainer.dataset.hasBlurred;
    
    if (event.type === 'blur' && isFirstBlur) {
        fieldContainer.dataset.hasBlurred = 'true';
        validateFieldWithFeedback(element, path);
    } else if (fieldContainer.dataset.hasBlurred === 'true') {
        // Validação em tempo real após primeiro blur
        validateFieldWithFeedback(element, path);
    }

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
 * Handles sidebar navigation clicks (FASE 3).
 * Substitui o handleTabClick para usar a nova navegação por sidebar.
 * Suporta cliques em links (expandido) e dots/círculos (colapsado).
 * @param {Event} event - The click event object.
 */
function handleSidebarClick(event) {
    // Check for both sidebar links and sidebar dots
    const button = event.target.closest('.sidebar-link');
    const dot = event.target.closest('.sidebar-dot');
    
    const clickedElement = button || dot;
    if (!clickedElement) return;
    
    const newTab = clickedElement.dataset.calculator;
    if (newTab && newTab !== state.activeTab) {
        updateState('activeTab', newTab);
        render();
        
        // Fechar sidebar no mobile após seleção
        if (window.innerWidth < 1024) {
            const sidebar = document.getElementById('main-sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        }
    }
}

/**
 * Toggle da sidebar móvel (FASE 3)
 * @param {boolean} isOpen - Se deve abrir ou fechar a sidebar
 */
function toggleMobileSidebar(isOpen) {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (!sidebar || !overlay) return;
    
    if (isOpen) {
        sidebar.classList.add('open');
        overlay.classList.remove('hidden');
        // Prevenir scroll do body quando sidebar está aberta
        document.body.style.overflow = 'hidden';
    } else {
        sidebar.classList.remove('open');
        overlay.classList.add('hidden');
        // Restaurar scroll do body
        document.body.style.overflow = '';
    }
}

/**
 * Toggles the sidebar visibility and state (Brave-like functionality)
 * Three states: hidden, expanded, collapsed
 * - Mobile: toggle between hidden/expanded
 * - Desktop: toggle between expanded/collapsed (never fully hidden)
 */
function toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('mobile-menu-btn');
    
    if (!sidebar || !overlay) return;
    
    const isCurrentlyOpen = sidebar.classList.contains('open');
    const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
    const isMobile = window.innerWidth < 1024;
    
    if (isMobile) {
        // Mobile behavior: toggle between hidden/expanded
        if (isCurrentlyOpen) {
            // Hide sidebar
            sidebar.classList.remove('open', 'collapsed');
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
            localStorage.setItem('sidebar-state', 'hidden');
            updateSidebarToggleIcon(toggleBtn, 'hidden');
        } else {
            // Show sidebar (expanded)
            sidebar.classList.add('open');
            sidebar.classList.remove('collapsed');
            overlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            localStorage.setItem('sidebar-state', 'expanded');
            updateSidebarToggleIcon(toggleBtn, 'expanded');
        }
    } else {
        // Desktop behavior: toggle between expanded/collapsed
        if (isCurrentlyOpen && !isCurrentlyCollapsed) {
            // Collapse sidebar
            sidebar.classList.add('collapsed');
            localStorage.setItem('sidebar-state', 'collapsed');
            updateSidebarToggleIcon(toggleBtn, 'collapsed');
        } else if (isCurrentlyOpen && isCurrentlyCollapsed) {
            // Expand sidebar
            sidebar.classList.remove('collapsed');
            localStorage.setItem('sidebar-state', 'expanded');
            updateSidebarToggleIcon(toggleBtn, 'expanded');
        } else {
            // Show and expand sidebar (from hidden state)
            sidebar.classList.add('open');
            sidebar.classList.remove('collapsed');
            overlay.classList.add('hidden'); // Desktop doesn't need overlay
            localStorage.setItem('sidebar-state', 'expanded');
            updateSidebarToggleIcon(toggleBtn, 'expanded');
        }
    }
    
    // Re-render sidebar content for the new state
    import('./ui.js').then(module => {
        if (module.renderSidebar) {
            module.renderSidebar();
        }
    });
}

/**
 * Updates the sidebar toggle button icon based on current state
 * @param {HTMLElement} button - The toggle button element
 * @param {string} state - Current state: 'hidden', 'expanded', 'collapsed'
 */
function updateSidebarToggleIcon(button, state) {
    if (!button) return;
    
    const iconElement = button.querySelector('.material-icons');
    if (!iconElement) return;
    
    switch (state) {
        case 'expanded':
            iconElement.textContent = 'menu_open';
            button.setAttribute('title', 'Recolher calculadoras');
            button.setAttribute('aria-label', 'Recolher painel de calculadoras');
            break;
        case 'collapsed':
            iconElement.textContent = 'apps';
            button.setAttribute('title', 'Expandir calculadoras');
            button.setAttribute('aria-label', 'Expandir painel de calculadoras');
            break;
        case 'hidden':
        default:
            iconElement.textContent = 'menu';
            button.setAttribute('title', 'Abrir calculadoras');
            button.setAttribute('aria-label', 'Abrir painel de calculadoras');
            break;
    }
}

/**
 * Initializes sidebar state from localStorage (Brave-like behavior)
 * This restores the previous sidebar state: hidden, expanded, or collapsed
 */
function initializeSidebarState() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('mobile-menu-btn');
    
    if (!sidebar || !overlay) return;
    
    // Get saved state from localStorage (default to hidden for mobile, expanded for desktop)
    const savedState = localStorage.getItem('sidebar-state');
    const isMobile = window.innerWidth < 1024;
    const defaultState = isMobile ? 'hidden' : 'expanded';
    const currentState = savedState || defaultState;
    
    // Apply the appropriate state
    switch (currentState) {
        case 'expanded':
            sidebar.classList.add('open');
            sidebar.classList.remove('collapsed');
            if (isMobile) {
                overlay.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            } else {
                overlay.classList.add('hidden');
            }
            updateSidebarToggleIcon(toggleBtn, 'expanded');
            break;
        case 'collapsed':
            if (!isMobile) { // Only allow collapsed state on desktop
                sidebar.classList.add('open', 'collapsed');
                overlay.classList.add('hidden');
                updateSidebarToggleIcon(toggleBtn, 'collapsed');
            } else {
                // On mobile, default to hidden instead of collapsed
                sidebar.classList.remove('open', 'collapsed');
                overlay.classList.add('hidden');
                updateSidebarToggleIcon(toggleBtn, 'hidden');
            }
            break;
        case 'hidden':
        default:
            sidebar.classList.remove('open', 'collapsed');
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
            updateSidebarToggleIcon(toggleBtn, 'hidden');
            break;
    }
}

/**
 * Handles tab switching.
 * @param {Event} event - The click event object.
 * @deprecated Substituída por handleSidebarClick na Fase 3
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
 * Retrieves calculation results for a given calculator.
 * This centralized function prevents code duplication in event handlers.
 * @param {string} calculatorName - The name of the calculator (e.g., 'ferias').
 * @param {object} calculatorState - The state object for that calculator.
 * @param {object} legalTexts - The legal texts object from the main state.
 * @returns {object|null} The results object from the calculation function, or null if not found.
 */
function getCalculationResults(calculatorName, calculatorState, legalTexts) {
    switch (calculatorName) {
        case 'ferias':
            return calculations.calculateFerias(calculatorState);
        case 'decimoTerceiro':
            return calculations.calculateDecimoTerceiro(calculatorState);
        case 'salarioLiquido':
            return calculations.calculateSalarioLiquido(calculatorState);
        case 'rescisao':
            return calculations.calculateRescisao(calculatorState);
        case 'fgts':
            return calculations.calculateFGTS(calculatorState);
        case 'pisPasep':
            return calculations.calculatePISPASEP(calculatorState, legalTexts);
        case 'seguroDesemprego':
            return calculations.calculateSeguroDesemprego(calculatorState, legalTexts);
        case 'horasExtras':
            return calculations.calculateHorasExtras(calculatorState, legalTexts);
        case 'inss':
            return calculations.calculateINSSCalculator(calculatorState, legalTexts);
        case 'valeTransporte':
            return calculations.calculateValeTransporte(calculatorState, legalTexts);
        case 'irpf':
            return calculations.calculateIRPF(calculatorState, legalTexts);
        default:
            console.error('Unknown calculator type:', calculatorName);
            return null;
    }
}


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
    appContainer.addEventListener('blur', handleInputChange, true); // FASE 3: Captura evento blur para validação
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
            const results = getCalculationResults(calculatorName, calculatorState, state.legalTexts);

            if (results) {
                const modalData = {
                    type: calculatorName,
                    results: results,
                    state: calculatorState
                };
                updateAndShowModal(modalData);
            }
        }

        // Print logic
        if (target.classList.contains('js-print-result')) {
            const calculatorName = state.activeTab;
            const calculatorState = state[calculatorName];
            const results = getCalculationResults(calculatorName, calculatorState, state.legalTexts);

            if (results) {
                const reportData = {
                    type: calculatorName,
                    results: results,
                    state: calculatorState
                };
                const reportHTML = generateReportHTML(reportData);
                createAndPrintReport(reportHTML);
            }
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
    // FASE 3: Removido - document.querySelectorAll('[role="tab"]').forEach(button => button.addEventListener('click', handleTabClick));
    
    // FASE 3: Novos listeners para sidebar navigation
    initializeSidebarEvents();

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
                const results = getCalculationResults(calculatorName, calculatorState, state.legalTexts);

                if (results) {
                    const reportData = {
                        type: calculatorName,
                        results: results,
                        state: calculatorState
                    };
                    const reportHTML = generateReportHTML(reportData);
                    createAndPrintReport(reportHTML);
                }
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

    // Customization Modal Event Listeners
    initializeCustomizeModalEvents();
}

/**
 * Initializes event listeners for the calculator customization modal.
 */
function initializeCustomizeModalEvents() {
    const openBtn = document.getElementById('customize-calculators-btn');
    const cancelBtn = document.getElementById('customize-modal-cancel-btn');
    const saveBtn = document.getElementById('customize-modal-save-btn');
    const overlay = document.getElementById('customize-modal-overlay');

    if (openBtn) {
        openBtn.addEventListener('click', showCustomizeModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideCustomizeModal);
    }
    if (overlay) {
        overlay.addEventListener('click', hideCustomizeModal);
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const checklist = document.getElementById('customize-checklist');
            if (!checklist) return;

            const selectedCalculators = [];
            checklist.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                selectedCalculators.push(checkbox.value);
            });

            // Update state
            updateState('visibleCalculators', selectedCalculators);

            // Save to localStorage
            localStorage.setItem('visibleCalculators', JSON.stringify(selectedCalculators));

            // If the currently active tab is now hidden, switch to the first visible one
            if (!selectedCalculators.includes(state.activeTab)) {
                updateState('activeTab', selectedCalculators[0] || 'ferias');
            }

            hideCustomizeModal();
            render();
        });
    }
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

    // Topic selector (dropdown) change to load content
    const topicSelector = document.getElementById('topic-selector');
    if (topicSelector) {
        topicSelector.addEventListener('change', (event) => {
            const topic = event.target.value;
            if (topic) {
                loadEducationalContent(topic);
            }
        });
    }

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
        // FASE 3: Incluindo todas as calculadoras restantes
        fgts: state.fgts,
        pisPasep: state.pisPasep,
        seguroDesemprego: state.seguroDesemprego,
        horasExtras: state.horasExtras,
        inss: state.inss,
        valeTransporte: state.valeTransporte,
        irpf: state.irpf,
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

/**
 * Inicializa eventos da sidebar (FASE 3)
 */
function initializeSidebarEvents() {
    // Event delegation para os links da sidebar (que são gerados dinamicamente)
    const sidebar = document.getElementById('main-sidebar');
    if (sidebar) {
        sidebar.addEventListener('click', handleSidebarClick);
        
        // Add keyboard support for sidebar dots
        sidebar.addEventListener('keydown', (event) => {
            const dot = event.target.closest('.sidebar-dot');
            if (dot && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                handleSidebarClick(event);
            }
        });
    }
    
    // Botão de toggle da sidebar (ícone de abas/pastas)
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => toggleSidebar());
    }
    
    // Overlay da sidebar mobile
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            // Close sidebar when clicking overlay
            const sidebar = document.getElementById('main-sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        });
    }
    
    // Botão de limpar dados
    const clearDataBtn = document.getElementById('clear-data-btn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', handleClearData);
    }
    
    // Fechar sidebar com ESC em mobile
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('main-sidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                toggleSidebar();
            }
        }
    });
    
    // Fechar sidebar automaticamente quando redimensionar para desktop
    window.addEventListener('resize', () => {
        const sidebar = document.getElementById('main-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (window.innerWidth >= 1024) {
            // Em desktop, restaurar o scroll do body se estava bloqueado
            document.body.style.overflow = '';
        } else if (sidebar && sidebar.classList.contains('open')) {
            // Em mobile, manter o comportamento de bloqueio do scroll se sidebar estiver aberta
            document.body.style.overflow = 'hidden';
        }
    });
}

/**
 * Limpa todos os dados salvos do localStorage (FASE 3)
 */
function handleClearData() {
    if (confirm('Tem certeza que deseja limpar todos os dados salvos? Esta ação não pode ser desfeita.')) {
        // Limpar apenas dados de formulários, manter preferências
        const keysToRemove = ['appState'];
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Resetar estado para inicial
        Object.keys(state).forEach(key => {
            if (key !== 'activeTab' && key !== 'legalTexts' && key !== 'visibleCalculators') {
                const initialValue = JSON.parse(JSON.stringify(initialState[key]));
                if (initialValue) {
                    state[key] = initialValue;
                }
            }
        });
        
        render();
        showNotification('Dados limpos com sucesso!', 'success');
    }
}

/**
 * Mostra notificação temporária (FASE 3)
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da notificação: 'success', 'error', 'info'
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Export the sidebar initialization function
export { initializeSidebarState };
