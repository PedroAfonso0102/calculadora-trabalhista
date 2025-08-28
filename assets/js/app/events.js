/**
 * Event Listeners Module
 *
 * This module is responsible for attaching all event listeners to the DOM
 * and orchestrating the application's response to user input.
 */

import { state, updateState, initialState } from './state.js';
import { render, createTooltip, showTooltip, hideTooltip, renderCalculationMemory, showCalculationMemoryModal, hideCalculationMemoryModal, generateReportHTML, updateAndShowModal, updateSalaryResult, toggleEducationalPanel, loadEducationalContent, showEducationalWelcome, showCustomizeModal, hideCustomizeModal, renderSidebar, openFaqModal, renderMobileCalculatorSelector, toggleMobileDropdown, hideMobileDropdown } from './ui.js';
import { calculatorFunctions, calculateNetSalary } from './calculations.js';
import { debounce, unmaskCurrency, formatCurrency, initializeCurrencyMask, isValidDate, isValidDateRange } from './utils.js';
import { 
    saveState, 
    getSavePreference, 
    setSavePreference, 
    clearFormData, 
    setVisibleCalculators, 
    setSidebarState, 
    getSidebarState 
} from './storage.js';

/**
 * Validation rules schema for scalable field validation.
 * Each field can have multiple validation rules that return true for valid values
 * or an error message string for invalid values.
 */
const validationRules = {
    salarioBruto: [(v) => v > 0 || 'Salário deve ser maior que zero.'],
    diasFerias: [(v) => (v >= 1 && v <= 30) || 'Deve estar entre 1 e 30 dias.'],
    dataAdmissao: [
        (v) => v ? true : 'Data é obrigatória.',
        (v) => {
            // HTML date inputs return YYYY-MM-DD format, always valid if not empty
            if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
            // Also accept Brazilian format DD/MM/YYYY
            return isValidDate(v) || 'Data inválida. Use o formato correto.';
        },
        (v, allValues) => {
            if (!allValues || !allValues.dataDemissao) return true;
            return isValidDateRange(v, allValues.dataDemissao) || 'Data de admissão deve ser anterior à demissão.';
        }
    ],
    dataDemissao: [
        (v) => v ? true : 'Data é obrigatória.',
        (v) => {
            // HTML date inputs return YYYY-MM-DD format, always valid if not empty
            if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
            // Also accept Brazilian format DD/MM/YYYY
            return isValidDate(v) || 'Data inválida. Use o formato correto.';
        },
        (v, allValues) => {
            if (!allValues || !allValues.dataAdmissao) return true;
            return isValidDateRange(allValues.dataAdmissao, v) || 'Data de demissão deve ser posterior à admissão.';
        }
    ],
    dependentes: [(v) => v >= 0 || 'Número de dependentes não pode ser negativo.'],
    mesesTrabalhados: [(v) => (v >= 1 && v <= 12) || 'Deve estar entre 1 e 12 meses.'],
    custodiario: [(v) => v > 0 || 'Custo deve ser maior que zero.'],
    custoDiario: [(v) => v > 0 || 'Custo deve ser maior que zero.'],
    diasTrabalho: [(v) => (v >= 1 && v <= 31) || 'Dias de trabalho deve estar entre 1 e 31.'],
    // Adicionar regras para campos que estavam sem validação
    mediaHorasExtras: [(v) => v >= 0 || 'Média de horas extras não pode ser negativa.'],
    mediaAdicionalNoturno: [(v) => v >= 0 || 'Adicional noturno não pode ser negativo.'],
    insalubridadeBase: [(v) => v >= 0 || 'Base de insalubridade não pode ser negativa.'],
    valorHoraExtra: [(v) => v > 0 || 'Valor da hora extra deve ser maior que zero.'],
    horasExtrasRealizadas: [(v) => v >= 0 || 'Horas extras não podem ser negativas.'],
    filhosSalarioFamilia: [(v) => v >= 0 || 'Número de filhos não pode ser negativo.'],
    rendimentosTributaveis: [(v) => v >= 0 || 'Rendimentos não podem ser negativos.'],
    deducoesDependentes: [(v) => v >= 0 || 'Deduções não podem ser negativas.']
};

/**
 * Sidebar Manager - Encapsulates all sidebar state and logic.
 * This mini-module manages sidebar visibility, states, and interactions,
 * making the main event handlers cleaner and the sidebar logic easier to maintain.
 */
const SidebarManager = {
    // Element references
    get sidebar() { return document.getElementById('main-sidebar'); },
    get mainLayout() { return document.querySelector('.main-layout'); },
    get toggleBtn() { return document.getElementById('sidebar-toggle-btn'); },
    get overlay() { return document.getElementById('sidebar-overlay'); },
    get indicator() { return document.getElementById('active-calculator-indicator'); },
    
    // State queries
    get isMobile() { return window.innerWidth < 1024; },
    get isCurrentlyHidden() { return this.sidebar?.classList.contains('hidden'); },
    get isCurrentlyCollapsed() { return this.sidebar?.classList.contains('collapsed'); },
    get isCurrentlyOpen() { return this.sidebar?.classList.contains('open'); },
    
    /**
     * Initializes sidebar state from localStorage
     * @returns {Promise} Promise that resolves when layout is fully applied
     */
    initialize() {
        return new Promise((resolve) => {
            if (!this.sidebar || !this.overlay) {
                console.warn('SidebarManager: Required elements not found for initialization');
                resolve();
                return;
            }
            
            const savedState = getSidebarState();
            const defaultState = this.isMobile ? 'hidden' : 'collapsed';
            let currentState = savedState || defaultState;
            
            // Validate state for device type
            if (!this.isMobile && currentState === 'hidden') {
                currentState = 'expanded';
            } else if (this.isMobile && currentState === 'collapsed') {
                currentState = 'hidden';
            }
            
            this._applyState(currentState);
            
            // Wait for the next animation frame to ensure CSS classes are applied
            // Then wait one more frame to ensure layout calculations are complete
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resolve();
                });
            });
        });
    },
    
    /**
     * Toggles the sidebar between appropriate states based on device type
     */
    toggle() {
        if (!this.sidebar || !this.mainLayout) {
            console.warn('SidebarManager: Required elements not found');
            return;
        }
        
        // Check current state BEFORE clearing classes
        const currentlyHidden = this.isCurrentlyHidden;
        const currentlyCollapsed = this.isCurrentlyCollapsed;
        
        this._clearStateClasses();
        
        if (this.isMobile) {
            // Mobile: toggle between hidden/expanded
            const newState = currentlyHidden ? 'expanded' : 'hidden';
            this._applyState(newState);
        } else {
            // Desktop: toggle between expanded/collapsed
            const newState = currentlyCollapsed ? 'expanded' : 'collapsed';
            this._applyState(newState);
        }
        
        this._reRenderSidebar();
    },
    
    /**
     * Updates the active calculator indicator when sidebar is hidden
     */
    updateIndicator() {
        if (!this.indicator || !this.sidebar) return;
        
        const isHidden = this.sidebar.classList.contains('hidden');
        
        if (isHidden) {
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
            
            const iconElement = document.getElementById('active-calculator-icon');
            if (iconElement) {
                const icon = iconMap[state.activeTab] || 'calculate';
                iconElement.textContent = icon;
            }
            this.indicator.classList.remove('hidden');
        } else {
            this.indicator.classList.add('hidden');
        }
    },
    
    /**
     * Internal method to clear all state classes
     */
    _clearStateClasses() {
        if (!this.sidebar || !this.mainLayout) return;
        
        this.sidebar.classList.remove('hidden', 'collapsed', 'expanded', 'open');
        this.mainLayout.classList.remove('sidebar-hidden', 'sidebar-collapsed', 'sidebar-expanded');
    },
    
    /**
     * Internal method to apply a specific state
     */
    _applyState(state) {
        console.log('SidebarManager._applyState:', {
            state,
            isMobile: this.isMobile,
            windowWidth: window.innerWidth,
            sidebarElement: !!this.sidebar,
            mainLayoutElement: !!this.mainLayout
        });
        
        switch (state) {
            case 'expanded':
                this.sidebar.classList.add('expanded', 'open');
                this.mainLayout.classList.add('sidebar-expanded');
                if (this.isMobile) {
                    this.overlay.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                } else {
                    this.overlay.classList.add('hidden');
                }
                this._updateToggleIcon('expanded');
                break;
            case 'collapsed':
                if (!this.isMobile) {
                    this.sidebar.classList.add('open', 'collapsed');
                    this.mainLayout.classList.add('sidebar-collapsed');
                    this.overlay.classList.add('hidden');
                    this._updateToggleIcon('collapsed');
                }
                break;
            case 'hidden':
            default:
                this.sidebar.classList.remove('open', 'collapsed');
                this.mainLayout.classList.add('sidebar-hidden');
                this.overlay.classList.add('hidden');
                document.body.style.overflow = '';
                this._updateToggleIcon('hidden');
                if (!this.isMobile) {
                    this.updateIndicator();
                }
                break;
        }
        setSidebarState(state);
    },
    
    /**
     * Internal method to update toggle button icon
     */
    _updateToggleIcon(state) {
        if (!this.toggleBtn) return;
        
        const iconElement = this.toggleBtn.querySelector('.material-icons');
        if (!iconElement) return;
        
        // Desktop only - mobile menu button was removed
        switch (state) {
            case 'expanded':
                iconElement.textContent = 'menu_open';
                this.toggleBtn.setAttribute('title', 'Recolher calculadoras');
                break;
            case 'collapsed':
            default:
                iconElement.textContent = 'apps';
                this.toggleBtn.setAttribute('title', 'Expandir calculadoras');
                break;
        }
    },
    
    /**
     * Internal method to re-render sidebar content
     */
    _reRenderSidebar() {
        renderSidebar();
    }
};

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

/**
 * Limpa todos os campos do formulário de uma calculadora específica
 * @param {string} calculatorName - Nome da calculadora a ser limpa
 */
function handleClearForm(calculatorName) {
    // Deep copy the initial state for the specific calculator to avoid reference issues
    const initialCalculatorState = JSON.parse(JSON.stringify(initialState[calculatorName]));

    // Replace the current state for that calculator with the initial state
    state[calculatorName] = initialCalculatorState;

    // Re-render the UI to reflect the cleared state
    render();
}

/**
 * Validates a field using the scalable validation rules schema.
 * @param {string} path - The field path (e.g., 'ferias.salarioBruto')
 * @param {any} value - The value to validate
 * @param {object} allValues - All values from the current calculator state (for cross-field validation)
 * @returns {object} - Validation result with isValid boolean and message string
 */
function validateField(path, value, allValues = null) {
    const [calculatorName, field] = path.split('.');
    const rules = validationRules[field] || [];
    
    // Skip validation for empty optional fields (except required fields)
    const requiredFields = ['salarioBruto', 'dataAdmissao', 'dataDemissao'];
    if (!requiredFields.includes(field) && (value === '' || value === null || value === undefined)) {
        return { isValid: true };
    }
    
    // Get current calculator state for cross-field validation
    const currentState = allValues || (state[calculatorName] || {});
    
    for (const rule of rules) {
        const result = rule(value, currentState);
        if (typeof result === 'string') { // Validation failed
            return { isValid: false, message: result };
        }
    }
    
    return { isValid: true };
}

/**
 * Validação híbrida de campos - mostra erro apenas após primeiro blur, 
 * depois valida em tempo real (FASE 3)
 */
function validateFieldWithFeedback(element, path) {
    const value = getFieldValue(element);
    const [calculatorName] = path.split('.');
    const currentState = state[calculatorName] || {};
    
    clearFieldValidation(element);
    
    const validation = validateField(path, value, currentState);
    if (validation.isValid && value) {
        showFieldSuccess(element);
    } else if (!validation.isValid) {
        showFieldError(element, validation.message);
    }
}

/**
 * Obtém o valor do campo baseado no seu tipo
 * @param {HTMLElement} element - Elemento do formulário
 * @returns {string|number|boolean} Valor do campo conforme seu tipo
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
 * @param {HTMLElement} element - Elemento do formulário a ser limpo
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
 * @param {HTMLElement} element - Elemento do formulário
 * @param {string} message - Mensagem de erro a ser exibida
 */
function showFieldError(element, message) {
    element.classList.add('input-error', 'border-red-500', 'bg-red-50');
    element.classList.remove('input-success', 'border-green-500', 'bg-green-50');
    
    // Format the error message to show dates in Brazilian format if needed
    let formattedMessage = message;
    
    // If the element is a date input and the message contains the raw ISO date
    if (element.type === 'date' && element.value) {
        const isoDateRegex = /\d{4}-\d{2}-\d{2}/g;
        formattedMessage = message.replace(isoDateRegex, (match) => {
            // Convert ISO date to Brazilian format for display
            try {
                const date = new Date(match + 'T00:00:00');
                return date.toLocaleDateString('pt-BR');
            } catch (e) {
                return match;
            }
        });
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-validation text-red-600';
    errorDiv.innerHTML = `
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        ${formattedMessage}
    `;
    element.parentNode.appendChild(errorDiv);
}

/**
 * Mostra sucesso de validação no campo
 * @param {HTMLElement} element - Elemento do formulário validado com sucesso
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

    // Se for um campo de data, também validar o outro campo de data para validação cruzada
    const [calculatorName, fieldName] = path.split('.');
    if (fieldName === 'dataAdmissao' || fieldName === 'dataDemissao') {
        const otherFieldName = fieldName === 'dataAdmissao' ? 'dataDemissao' : 'dataAdmissao';
        const otherElement = document.querySelector(`[data-state="${calculatorName}.${otherFieldName}"]`);
        if (otherElement && otherElement.closest('.space-y-2').dataset.hasBlurred === 'true') {
            validateFieldWithFeedback(otherElement, `${calculatorName}.${otherFieldName}`);
        }
    }

    if (path === 'salarioLiquido.recebeSalarioFamilia' && !value) {
        updateState('salarioLiquido.filhosSalarioFamilia', 0);
    }

    render();

    if (getSavePreference()) {
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
                SidebarManager.toggle();
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
 * Updates the active calculator indicator when sidebar is hidden (delegates to SidebarManager)
 */
function updateActiveIndicator() {
    SidebarManager.updateIndicator();
}

/**
 * Toggles the sidebar visibility and state (delegates to SidebarManager)
 */
function toggleSidebar() {
    SidebarManager.toggle();
}

/**
 * Initializes sidebar state from localStorage (delegates to SidebarManager)
 * @returns {Promise} Promise that resolves when sidebar layout is fully initialized
 */
async function initializeSidebarState() {
    return await SidebarManager.initialize();
}

/**
 * Reavalia e aplica o estado correto da sidebar (mobile/desktop) baseado no tamanho da janela.
 * Esta função é chamada durante o redimensionamento da janela para garantir layout responsivo.
 */
async function handleResize() {
    console.log('handleResize: Iniciando reavaliação do layout', {
        windowWidth: window.innerWidth,
        isMobile: window.innerWidth < 1024
    });
    
    // Usar a mesma lógica direta do forceCorrectLayout
    const sidebar = document.getElementById('main-sidebar');
    const mainLayout = document.querySelector('.main-layout');
    
    if (!sidebar || !mainLayout) {
        console.warn('handleResize: Elementos necessários não encontrados');
        return;
    }
    
    const isDesktop = window.innerWidth >= 1024;
    
    // Limpar todas as classes de estado
    sidebar.classList.remove('hidden', 'collapsed', 'expanded', 'open');
    mainLayout.classList.remove('sidebar-hidden', 'sidebar-collapsed', 'sidebar-expanded');
    
    if (isDesktop) {
        // Desktop: usar layout EXPANDED por padrão (mantém consistência com inicialização)
        sidebar.classList.add('open', 'expanded');
        mainLayout.classList.add('sidebar-expanded');
        sidebar.classList.remove('hidden');
        sidebar.classList.add('lg:block');
    } else {
        // Mobile: esconder sidebar
        sidebar.classList.add('hidden');
        mainLayout.classList.add('sidebar-hidden');
    }
    
    // Reativar renderização para mobile dropdown
    const { render } = await import('./ui.js');
    await render();
    
    console.log('handleResize: Layout reavaliado com sucesso');
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
 * Retrieves calculation results for a given calculator using dynamic function mapping.
 * This approach eliminates the large switch statement and follows the Open/Closed Principle.
 * @param {string} calculatorName - The name of the calculator (e.g., 'ferias').
 * @param {object} calculatorState - The state object for that calculator.
 * @param {object} legalTexts - The legal texts object from the main state.
 * @returns {object|null} The results object from the calculation function, or null if not found.
 */
function getCalculationResults(calculatorName, calculatorState, legalTexts) {
    const calculationFunction = calculatorFunctions[calculatorName];
    
    if (calculationFunction) {
        // Some calculators need legalTexts, others don't
        const needsLegalTexts = ['pisPasep', 'seguroDesemprego', 'horasExtras', 'inss', 'valeTransporte', 'irpf'];
        
        if (needsLegalTexts.includes(calculatorName)) {
            return calculationFunction(calculatorState, legalTexts);
        } else {
            return calculationFunction(calculatorState);
        }
    }
    
    console.error('Unknown calculator type:', calculatorName);
    return null;
}

/**
 * Helper function to get results from the currently active calculator.
 * This eliminates code duplication across event handlers (DRY principle).
 * @returns {object|null} The calculation results or null if not available.
 */
function getActiveCalculatorResults() {
    const calculatorName = state.activeTab;
    const calculatorState = state[calculatorName];
    return getCalculationResults(calculatorName, calculatorState, state.legalTexts);
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

        // Custom component logic (checkbox, radio, switch)
        const customControl = target.closest('button[role="checkbox"], button[role="radio"], button[role="switch"]');
        if (customControl) {
            const currentState = customControl.getAttribute('data-state');
            const newState = (currentState === 'checked' || currentState === 'active') ? 'unchecked' : 'checked';
            customControl.setAttribute('data-state', newState);
            customControl.setAttribute('aria-checked', newState === 'checked');

            // Find the real input and update it
            const inputId = customControl.id.replace('-switch', ''); // for switches
            const realInput = document.getElementById(inputId) || customControl.previousElementSibling;

            if (realInput && realInput.type === 'checkbox') {
                realInput.checked = (newState === 'checked');
                // Dispatch a change event so the main handler picks it up
                realInput.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (realInput && realInput.type === 'radio') {
                // For radios, we need to uncheck others in the group
                const groupName = realInput.name;
                document.querySelectorAll(`input[name="${groupName}"]`).forEach(radio => {
                    const button = radio.nextElementSibling;
                    if (radio === realInput) {
                        radio.checked = true;
                        if (button && button.role === 'radio') {
                            button.setAttribute('data-state', 'checked');
                            button.setAttribute('aria-checked', 'true');
                        }
                    } else {
                        radio.checked = false;
                        if (button && button.role === 'radio') {
                            button.setAttribute('data-state', 'unchecked');
                            button.setAttribute('aria-checked', 'false');
                        }
                    }
                });
                // Dispatch a change event so the main handler picks it up
                realInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // Modal logic
        if (target.classList.contains('js-show-memory-modal')) {
            const results = getActiveCalculatorResults();
            if (results) {
                const modalData = {
                    type: state.activeTab,
                    results: results,
                    state: state[state.activeTab]
                };
                updateAndShowModal(modalData);
            }
        }

        // Print logic
        if (target.classList.contains('js-print-result')) {
            const results = getActiveCalculatorResults();
            if (results) {
                const reportData = {
                    type: state.activeTab,
                    results: results,
                    state: state[state.activeTab]
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
                const results = getActiveCalculatorResults();
                if (results) {
                    const reportData = {
                        type: state.activeTab,
                        results: results,
                        state: state[state.activeTab]
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
    
    // Apply improved currency masks to all money input fields
    initializeCurrencyMasks();
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
            setVisibleCalculators(selectedCalculators);

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

    // Topic selector (custom dropdown) functionality
    const topicSelectorTrigger = document.getElementById('topic-selector-trigger');
    const topicSelectorPanel = document.getElementById('topic-selector-panel');
    const topicSelectorCurrentSelection = document.getElementById('topic-selector-current-selection');
    const topicSelectorOptions = document.querySelectorAll('.topic-selector-option');

    if (topicSelectorTrigger && topicSelectorPanel) {
        // Toggle dropdown
        topicSelectorTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = topicSelectorTrigger.getAttribute('aria-expanded') === 'true';
            
            if (isOpen) {
                closeTopicSelector();
            } else {
                openTopicSelector();
            }
        });

        // Handle option selection
        topicSelectorOptions.forEach(option => {
            option.addEventListener('click', (event) => {
                event.stopPropagation();
                const value = option.getAttribute('data-value');
                const text = option.textContent.trim();
                
                // Update selection display
                if (topicSelectorCurrentSelection) {
                    topicSelectorCurrentSelection.textContent = text;
                }
                
                // Load educational content
                if (value) {
                    loadEducationalContent(value);
                }
                
                // Close dropdown
                closeTopicSelector();
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!topicSelectorTrigger.contains(event.target) && !topicSelectorPanel.contains(event.target)) {
                closeTopicSelector();
            }
        });

        // Keyboard navigation
        topicSelectorTrigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const isOpen = topicSelectorTrigger.getAttribute('aria-expanded') === 'true';
                if (isOpen) {
                    closeTopicSelector();
                } else {
                    openTopicSelector();
                }
            } else if (event.key === 'Escape') {
                closeTopicSelector();
            }
        });
    }

    function openTopicSelector() {
        topicSelectorTrigger.setAttribute('aria-expanded', 'true');
        topicSelectorPanel.classList.remove('hidden');
        // Trigger animation
        requestAnimationFrame(() => {
            topicSelectorPanel.classList.add('opacity-100', 'scale-100');
            topicSelectorPanel.classList.remove('opacity-0', 'scale-95');
        });
        // Rotate arrow
        const arrow = topicSelectorTrigger.querySelector('svg');
        if (arrow) {
            arrow.style.transform = 'rotate(180deg)';
        }
    }

    function closeTopicSelector() {
        topicSelectorTrigger.setAttribute('aria-expanded', 'false');
        topicSelectorPanel.classList.add('opacity-0', 'scale-95');
        topicSelectorPanel.classList.remove('opacity-100', 'scale-100');
        // Reset arrow
        const arrow = topicSelectorTrigger.querySelector('svg');
        if (arrow) {
            arrow.style.transform = 'rotate(0deg)';
        }
        // Hide after animation
        setTimeout(() => {
            topicSelectorPanel.classList.add('hidden');
        }, 200);
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
    const results = calculateNetSalary(newGrossSalary, dependents, otherDiscounts);

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
    saveState(stateToSave);
}

/**
 * Handles the logic for the "Save Data" checkbox.
 * @param {Event} event - The change event object.
 */
function handleSaveDataToggle(event) {
    const isChecked = event.target.checked;
    setSavePreference(isChecked);
    if (isChecked) {
        saveStateToLocalStorage();
    } else {
        clearFormData();
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
    
    // Desktop Sidebar Toggle Button
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            SidebarManager.toggle();
        });
    }
    
    // Mobile menu button removed
    
    // Overlay da sidebar mobile
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            // Close sidebar when clicking overlay
            if (SidebarManager.isCurrentlyOpen) {
                SidebarManager.toggle();
            }
        });
    }
    
    // Botão de limpar dados
    const clearDataBtn = document.getElementById('clear-data-btn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', handleClearData);
    }
    
    // Botão FAQ - Base de Conhecimento
    const faqBtn = document.getElementById('open-faq-btn');
    if (faqBtn) {
        faqBtn.addEventListener('click', openFaqModal);
    }
    
    // Event listener para o botão de fechar modal da Base de Conhecimento
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'close-kb-modal-btn') {
            const faqModal = document.getElementById('faq-modal');
            if (faqModal) {
                faqModal.classList.add('hidden');
            }
        }
    });
    
    // Fechar sidebar com ESC em mobile
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && SidebarManager.isCurrentlyOpen) {
            SidebarManager.toggle();
        }
    });
    
    // === RESIZE EVENT HANDLER ===
    // Reavalia o layout (mobile/desktop) quando a janela é redimensionada
    // Usa debounce para otimizar performance durante redimensionamento contínuo
    window.addEventListener('resize', debounce(handleResize, 200));
    
    // === MOBILE DROPDOWN EVENT LISTENERS ===

    // Mobile navigation dropdown toggle
    const mobileNavTrigger = document.getElementById('mobile-nav-trigger');
    if (mobileNavTrigger) {
        mobileNavTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMobileDropdown();
        });
    }

    // Mobile navigation option selection
    document.addEventListener('click', (e) => {
        if (e.target.closest('.mobile-nav-option')) {
            const option = e.target.closest('.mobile-nav-option');
            const calculatorId = option.getAttribute('data-calculator');

            if (calculatorId && calculatorId !== state.activeTab) {
                // Atualizar estado
                updateState('activeTab', calculatorId);

                // Renderizar nova calculadora
                render();

                // Fechar dropdown
                hideMobileDropdown();
            }
        }
    });

    // Fechar dropdown quando clicar fora
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('mobile-nav-dropdown');
        const panel = document.getElementById('mobile-nav-panel');

        if (dropdown && panel && !dropdown.contains(e.target) && !panel.classList.contains('hidden')) {
            hideMobileDropdown();
        }
    });

    // Fechar dropdown com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('mobile-nav-panel');
            if (panel && !panel.classList.contains('hidden')) {
                hideMobileDropdown();
            }
        }
    });
}

/**
 * Limpa todos os dados salvos do localStorage (FASE 3)
 */
function handleClearData() {
    if (confirm('Tem certeza que deseja limpar todos os dados salvos? Esta ação não pode ser desfeita.')) {
        // Limpar apenas dados de formulários, manter preferências
        clearFormData();
        
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

/**
 * Initializes improved currency masks for all money input fields.
 * Applies smart masking with better UX (select all on focus, no R$ 0,00 default).
 */
function initializeCurrencyMasks() {
    const moneyInputs = document.querySelectorAll('.money-mask');
    moneyInputs.forEach(input => {
        initializeCurrencyMask(input);
    });
}

// Export the sidebar initialization function
export { initializeSidebarState };
