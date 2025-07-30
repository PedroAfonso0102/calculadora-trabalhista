/**
 * UI Manager - Calculadora Trabalhista
 * 
 * Gerencia toda a manipulação do DOM e renderização da interface.
 * Responsável pela criação de formulários, exibição de resultados e tooltips.
 */

import baseLegal from '../../config/baseLegal.js';

/**
 * Classe principal para gerenciamento da UI
 */
export class UIManager {
    constructor() {
        this.activeTab = 'salario';
        this.tooltips = new Map();
        this.initializeEventListeners();
    }

    /**
     * Inicializa os event listeners da aplicação
     */
    initializeEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupTabNavigation();
            this.setupTooltips();
            this.setupFormValidation();
        });
    }

    /**
     * Configura a navegação por abas
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = button.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }

    /**
     * Alterna entre as abas
     * @param {string} tabName - Nome da aba a ser ativada
     */
    switchTab(tabName) {
        // Remove classe ativa de todas as abas
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Ativa a aba selecionada
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        const activeContent = document.getElementById(`${tabName}-tab`);

        if (activeButton && activeContent) {
            activeButton.classList.add('active');
            activeContent.classList.add('active');
            this.activeTab = tabName;
        }
    }

    /**
     * Configura os tooltips educativos
     */
    setupTooltips() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tooltip-trigger')) {
                e.preventDefault();
                const verba = e.target.dataset.verba;
                this.showTooltip(verba, e.target);
            }
        });

        // Fecha tooltips ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tooltip-container')) {
                this.hideAllTooltips();
            }
        });
    }

    /**
     * Exibe tooltip para uma verba específica
     * @param {string} verba - Nome da verba
     * @param {Element} trigger - Elemento que disparou o tooltip
     */
    showTooltip(verba, trigger) {
        const explicacao = baseLegal.getExplicacaoVerba(verba);
        
        if (!explicacao) return;

        // Remove tooltips existentes
        this.hideAllTooltips();

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip active';
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4>${explicacao.titulo}</h4>
                <button class="tooltip-close" type="button">&times;</button>
            </div>
            <div class="tooltip-content">
                <p><strong>Explicação:</strong> ${explicacao.explicacao}</p>
                ${explicacao.baseLegal ? `<p><strong>Base Legal:</strong> ${explicacao.baseLegal}</p>` : ''}
                ${explicacao.formula ? `<p><strong>Fórmula:</strong> ${explicacao.formula}</p>` : ''}
                ${explicacao.isento ? `<p class="text-info"><strong>Observação:</strong> ${explicacao.isento}</p>` : ''}
            </div>
        `;

        // Posiciona o tooltip
        const container = trigger.closest('.tooltip-container');
        if (container) {
            container.appendChild(tooltip);
            
            // Event listener para fechar
            tooltip.querySelector('.tooltip-close').addEventListener('click', () => {
                this.hideTooltip(tooltip);
            });
        }
    }

    /**
     * Esconde tooltip específico
     * @param {Element} tooltip - Elemento do tooltip
     */
    hideTooltip(tooltip) {
        if (tooltip && tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip);
        }
    }

    /**
     * Esconde todos os tooltips
     */
    hideAllTooltips() {
        document.querySelectorAll('.tooltip').forEach(tooltip => {
            this.hideTooltip(tooltip);
        });
    }

    /**
     * Configura validação de formulários
     */
    setupFormValidation() {
        // Validação em tempo real para campos numéricos
        document.addEventListener('input', (e) => {
            if (e.target.type === 'number' || e.target.classList.contains('currency-input')) {
                this.validateNumericField(e.target);
            }
        });

        // Formatação de campos monetários
        document.addEventListener('blur', (e) => {
            if (e.target.classList.contains('currency-input')) {
                this.formatCurrencyField(e.target);
            }
        });
    }

    /**
     * Valida campo numérico
     * @param {Element} field - Campo a ser validado
     */
    validateNumericField(field) {
        const value = parseFloat(field.value);
        const min = parseFloat(field.min) || 0;
        const max = parseFloat(field.max) || Infinity;

        field.classList.remove('error', 'valid');

        if (isNaN(value) || value < min || value > max) {
            field.classList.add('error');
            this.showFieldError(field, this.getValidationMessage(field, value, min, max));
        } else {
            field.classList.add('valid');
            this.hideFieldError(field);
        }
    }

    /**
     * Gera mensagem de validação
     * @param {Element} field - Campo
     * @param {number} value - Valor
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {string} Mensagem de erro
     */
    getValidationMessage(field, value, min, max) {
        if (isNaN(value)) {
            return 'Valor deve ser numérico';
        }
        if (value < min) {
            return `Valor mínimo: ${min}`;
        }
        if (value > max) {
            return `Valor máximo: ${max}`;
        }
        return 'Valor inválido';
    }

    /**
     * Exibe erro do campo
     * @param {Element} field - Campo
     * @param {string} message - Mensagem de erro
     */
    showFieldError(field, message) {
        let errorDiv = field.parentNode.querySelector('.field-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            field.parentNode.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
    }

    /**
     * Esconde erro do campo
     * @param {Element} field - Campo
     */
    hideFieldError(field) {
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    /**
     * Formata campo monetário
     * @param {Element} field - Campo a ser formatado
     */
    formatCurrencyField(field) {
        const value = parseFloat(field.value.replace(/[^\d,.-]/g, '').replace(',', '.'));
        
        if (!isNaN(value)) {
            field.value = value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    }

    /**
     * Renderiza formulário de salário
     * @returns {string} HTML do formulário
     */
    renderSalarioForm() {
        return `
            <form id="salario-form" class="calculation-form">
                <h3>Cálculo de Salário Líquido</h3>
                
                <div class="form-group">
                    <label for="salario-bruto">
                        Salário Bruto (R$)
                        <div class="tooltip-container">
                            <button type="button" class="tooltip-trigger" data-verba="salario_bruto">?</button>
                        </div>
                    </label>
                    <input type="text" id="salario-bruto" name="salarioBruto" 
                           class="currency-input" required min="0" 
                           placeholder="0,00">
                </div>

                <div class="form-group">
                    <label for="num-dependentes">
                        Número de Dependentes (IRRF)
                        <div class="tooltip-container">
                            <button type="button" class="tooltip-trigger" data-verba="desconto_irrf">?</button>
                        </div>
                    </label>
                    <input type="number" id="num-dependentes" name="numDependentes" 
                           min="0" max="10" value="0">
                </div>

                <div class="form-group">
                    <label for="num-filhos">
                        Número de Filhos (até 14 anos)
                        <div class="tooltip-container">
                            <button type="button" class="tooltip-trigger" data-verba="salario_familia">?</button>
                        </div>
                    </label>
                    <input type="number" id="num-filhos" name="numFilhos" 
                           min="0" max="10" value="0">
                </div>

                <div class="form-group">
                    <label for="outros-descontos">
                        Outros Descontos (R$)
                    </label>
                    <input type="text" id="outros-descontos" name="outrosDescontos" 
                           class="currency-input" min="0" value="0,00">
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Calcular Salário</button>
                    <button type="button" class="btn btn-secondary" id="limpar-salario">Limpar</button>
                </div>
            </form>
        `;
    }

    /**
     * Renderiza resultado do cálculo de salário
     * @param {Object} resultado - Resultado do cálculo
     * @returns {string} HTML do resultado
     */
    renderSalarioResult(resultado) {
        if (resultado.erro) {
            return `
                <div class="result-container error">
                    <h3>Erro no Cálculo</h3>
                    <p class="error-message">${resultado.mensagem}</p>
                </div>
            `;
        }

        const { proventos, descontos, liquido } = resultado.resultado;

        return `
            <div class="result-container">
                <h3>Demonstrativo de Pagamento</h3>
                
                <div class="result-section">
                    <h4>Proventos</h4>
                    <div class="result-grid">
                        <div class="result-item">
                            <span class="label">Salário Bruto:</span>
                            <span class="value">R$ ${proventos.salarioBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        ${proventos.salarioFamilia > 0 ? `
                        <div class="result-item">
                            <span class="label">Salário Família:</span>
                            <span class="value">R$ ${proventos.salarioFamilia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        ` : ''}
                        <div class="result-item total">
                            <span class="label">Total Proventos:</span>
                            <span class="value">R$ ${proventos.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                <div class="result-section">
                    <h4>Descontos</h4>
                    <div class="result-grid">
                        <div class="result-item">
                            <span class="label">INSS:</span>
                            <span class="value negative">R$ ${descontos.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="result-item">
                            <span class="label">IRRF:</span>
                            <span class="value negative">R$ ${descontos.irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        ${descontos.outros > 0 ? `
                        <div class="result-item">
                            <span class="label">Outros Descontos:</span>
                            <span class="value negative">R$ ${descontos.outros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        ` : ''}
                        <div class="result-item total">
                            <span class="label">Total Descontos:</span>
                            <span class="value negative">R$ ${descontos.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                <div class="result-section">
                    <div class="result-final">
                        <span class="label">Salário Líquido:</span>
                        <span class="value highlight">R$ ${liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div class="result-actions">
                    <button type="button" class="btn btn-secondary" id="gerar-pdf-salario">Gerar PDF</button>
                    <button type="button" class="btn btn-tertiary" id="salvar-cenario-salario">Salvar Cenário</button>
                </div>
            </div>
        `;
    }

    /**
     * Exibe mensagem de loading
     * @param {string} container - ID do container
     */
    showLoading(container) {
        const element = document.getElementById(container);
        if (element) {
            element.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Calculando...</p>
                </div>
            `;
        }
    }

    /**
     * Limpa container
     * @param {string} container - ID do container
     */
    clearContainer(container) {
        const element = document.getElementById(container);
        if (element) {
            element.innerHTML = '';
        }
    }

    /**
     * Coleta dados do formulário
     * @param {string} formId - ID do formulário
     * @returns {Object} Dados do formulário
     */
    collectFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return null;

        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            // Converte valores monetários
            if (form.querySelector(`[name="${key}"]`).classList.contains('currency-input')) {
                data[key] = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
            } 
            // Converte números
            else if (form.querySelector(`[name="${key}"]`).type === 'number') {
                data[key] = parseInt(value) || 0;
            }
            // Mantém strings
            else {
                data[key] = value;
            }
        }

        return data;
    }

    /**
     * Exibe notificação
     * @param {string} message - Mensagem
     * @param {string} type - Tipo da notificação (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        document.body.appendChild(notification);

        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Event listener para fechar manualmente
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
}

// Exportação default
export default UIManager;