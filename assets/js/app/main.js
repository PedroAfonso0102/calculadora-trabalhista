/**
 * Main application entry point.
 * This file is responsible for initializing the application modules.
 */

import themeManager from './themeManager.js';
import { initializeEventListeners, initializeSidebarState } from './events.js';
import { render, openFaqModal } from './ui.js';
import { updateState } from './state.js';
import { getSavedState, getSavePreference, clearFormData, setSavePreference } from './storage.js';
import { loadKnowledgeBase } from './knowledge.js';

/**
 * Loads external configuration data required by the application.
 * @throws {Error} If the configuration data cannot be loaded.
 */
async function loadConfiguration() {
    const response = await fetch('data/legal_texts.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const legalTexts = await response.json();
    updateState('legalTexts', legalTexts, false);
}

/**
 * Loads previously saved state from localStorage if user has enabled save preference.
 * @throws {Error} If localStorage data is corrupted or invalid.
 */
function loadSavedState() {
    try {
        const savedState = getSavedState();
        const savePreference = getSavePreference();

        if (savePreference && savedState) {
            Object.keys(savedState).forEach(calculatorKey => {
                if (savedState[calculatorKey]) {
                    updateState(calculatorKey, savedState[calculatorKey], false);
                }
            });
        }
        
        if (savePreference) {
            const checkbox = document.getElementById('save-data-checkbox');
            if(checkbox) checkbox.checked = true;
        }
    } catch (error) {
        console.error("Failed to load saved state from localStorage:", error);
        // Clear corrupted data using centralized storage functions
        clearFormData();
        setSavePreference(false);
        throw new Error(`Dados salvos corrompidos foram removidos. ${error.message}`);
    }
}

/**
 * Displays a user-friendly error message when the application fails to initialize.
 * @param {Error} error - The error that occurred during initialization.
 */
function displayErrorMessage(error) {
    // Try to find the main container, fall back to document.body
    const appContainer = document.getElementById('app');
    const mainContainer = document.querySelector('main');
    const targetContainer = mainContainer || document.body;
    
    if (!targetContainer) {
        console.error("Cannot display error message: no suitable container found");
        return;
    }

    const errorHTML = `
        <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div class="text-center p-8 bg-white rounded-lg shadow-xl max-w-md mx-4">
                <div class="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 class="text-xl font-bold text-red-600 mb-2">Erro ao Carregar a Aplicação</h2>
                <p class="text-gray-700 mb-4">
                    Não foi possível carregar os dados necessários para o funcionamento da calculadora.
                </p>
                <p class="text-gray-600 text-sm mb-6">
                    Por favor, verifique sua conexão com a internet e tente novamente.
                </p>
                <button 
                    onclick="window.location.reload()" 
                    class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                >
                    Recarregar Página
                </button>
                <details class="mt-4 text-left">
                    <summary class="text-gray-500 text-xs cursor-pointer">Detalhes técnicos</summary>
                    <pre class="text-xs text-gray-400 mt-2 bg-gray-100 p-2 rounded overflow-auto">${error.message}</pre>
                </details>
            </div>
        </div>
    `;

    // If app container exists and has content, create overlay
    if (appContainer && appContainer.innerHTML.trim()) {
        targetContainer.insertAdjacentHTML('beforeend', errorHTML);
    } else if (appContainer) {
        // If app container is empty, replace its content
        appContainer.innerHTML = errorHTML.replace('fixed inset-0 bg-gray-900 bg-opacity-50', 'min-h-screen flex items-center justify-center');
    } else {
        // Last resort: append to body
        document.body.innerHTML = errorHTML.replace('fixed inset-0 bg-gray-900 bg-opacity-50', 'min-h-screen flex items-center justify-center');
    }
}

/**
 * Main application initialization function.
 * Orchestrates the loading of saved state, configuration data, and UI setup.
 */
async function initializeApp() {
    try {
        themeManager.init();
        loadSavedState();
        await loadConfiguration();
        
        // Carregar base de conhecimento em paralelo (não bloqueia a inicialização)
        loadKnowledgeBase().catch(error => {
            console.warn('Base de conhecimento não pôde ser carregada:', error);
        });
        
        initializeEventListeners();
        
        // SOLUÇÃO DIRETA: Forçar layout correto ANTES de qualquer coisa
        forceCorrectLayout();
        
        await initializeSidebarState();
        await render();
        
        // Com o CSS pré-compilado e layout forçado, não há mais race condition
        // Do not open FAQ modal if 'notest' URL parameter is present
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('notest')) {
            openFaqModal();
        }
        
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        displayErrorMessage(error);
    }
}

/**
 * Força o layout correto baseado no tamanho da tela
 * Esta função é chamada ANTES de qualquer inicialização para garantir estado correto
 */
function forceCorrectLayout() {
    const sidebar = document.getElementById('main-sidebar');
    const mainLayout = document.querySelector('.main-layout');
    
    if (!sidebar || !mainLayout) {
        console.warn('forceCorrectLayout: Elementos necessários não encontrados');
        return;
    }
    
    const isDesktop = window.innerWidth >= 1024;
    
    console.log('forceCorrectLayout:', {
        windowWidth: window.innerWidth,
        isDesktop,
        beforeClasses: {
            sidebar: sidebar.className,
            mainLayout: mainLayout.className
        }
    });
    
    // Limpar todas as classes de estado
    sidebar.classList.remove('hidden', 'collapsed', 'expanded', 'open');
    mainLayout.classList.remove('sidebar-hidden', 'sidebar-collapsed', 'sidebar-expanded');
    
    if (isDesktop) {
        // Desktop: usar layout EXPANDED por padrão (como no print)
        sidebar.classList.add('open', 'expanded');
        mainLayout.classList.add('sidebar-expanded');
        
        // Garantir que sidebar está visível no desktop
        sidebar.classList.remove('hidden');
        sidebar.classList.add('lg:block');
    } else {
        // Mobile: esconder sidebar
        sidebar.classList.add('hidden');
        mainLayout.classList.add('sidebar-hidden');
    }
    
    console.log('forceCorrectLayout: Layout aplicado', {
        afterClasses: {
            sidebar: sidebar.className,
            mainLayout: mainLayout.className
        }
    });
}

// Wait for the DOM to be fully loaded before initializing the app
document.addEventListener('DOMContentLoaded', initializeApp);
