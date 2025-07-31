/**
 * Main Application - Calculadora Trabalhista
 * 
 * Ponto de entrada da aplicação. Orquestra a interação entre
 * a UI e os módulos de cálculo.
 */

import UIManager from './ui/uiManager.js';
import PDFGenerator from './ui/pdfGenerator.js';
import { calcularSalarioLiquido } from './core/calculoSalario.js';
import { calcularFerias } from './core/calculoFerias.js';
import { calcular13Salario } from './core/calculo13.js';
import { calcularRescisao } from './core/calculoRescisao.js';

/**
 * Classe principal da aplicação
 */
class CalculadoraTrabalhista {
    constructor() {
        this.uiManager = new UIManager();
        this.pdfGenerator = new PDFGenerator();
        this.initializeApplication();
    }

    /**
     * Inicializa a aplicação
     */
    initializeApplication() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.renderInitialUI();
        });
    }

    /**
     * Configura os event listeners da aplicação
     */
    setupEventListeners() {
        // Event listeners para formulários
        this.setupFormSubmissions();
        
        // Event listeners para ações
        this.setupActionButtons();
        
        // Event listeners para navegação
        this.setupNavigationEvents();
    }

    /**
     * Configura submissão de formulários
     */
    setupFormSubmissions() {
        document.addEventListener('submit', (e) => {
            e.preventDefault();
            switch (e.target.id) {
                case 'salario-form':
                    this.handleSalarioCalculation();
                    break;
                case 'ferias-form':
                    this.handleFeriasCalculation();
                    break;
                case 'decimo-form':
                    this.handle13SalarioCalculation();
                    break;
                case 'rescisao-form':
                    this.handleRescisaoCalculation();
                    break;
            }
        });
    }

    /**
     * Configura botões de ação
     */
    setupActionButtons() {
        document.addEventListener('click', (e) => {
            // Botões de limpar formulário
            if (e.target.id === 'limpar-salario') {
                this.clearForm('salario-form');
                this.uiManager.clearContainer('salario-result');
            }

            // Botões de gerar PDF
            if (e.target.id === 'gerar-pdf-salario') {
                this.generateSalarioPDF();
            }

        });
    }

    /**
     * Configura eventos de navegação
     */
    setupNavigationEvents() {
        // Os eventos de navegação já são tratados pelo UIManager
        // Aqui podemos adicionar lógica adicional se necessário
    }

    /**
     * Renderiza a interface inicial
     */
    renderInitialUI() {
        // Renderiza o formulário de salário por padrão
        const salarioContainer = document.getElementById('salario-form-container');
        if (salarioContainer) {
            salarioContainer.innerHTML = this.uiManager.renderSalarioForm();
        }
    }

    /**
     * Manipula um cálculo genérico
     * @param {object} config - Configuração para o cálculo
     * @param {string} config.formId - ID do formulário
     * @param {string} config.resultContainerId - ID do container de resultado
     * @param {function} config.calculationFn - Função de cálculo
     * @param {function} config.renderFn - Função de renderização do resultado
     * @param {string} config.lastCalcProp - Nome da propriedade para salvar o último cálculo
     * @param {string} config.notificationSuccess - Mensagem de sucesso
     */
    async handleCalculation({ formId, resultContainerId, calculationFn, renderFn, lastCalcProp, notificationSuccess }) {
        const dados = this.uiManager.collectFormData(formId);
        
        if (!dados) {
            this.uiManager.showNotification('Erro ao coletar dados do formulário', 'error');
            return;
        }

        try {
            this.uiManager.showLoading(resultContainerId);
            const resultado = calculationFn(dados);
            const resultContainer = document.getElementById(resultContainerId);

            if (resultContainer) {
                if (resultado.erro) {
                    resultContainer.innerHTML = `
                        <div class="result-container error">
                            <h3>Erro no Cálculo</h3>
                            <p class="error-message">${resultado.mensagem}</p>
                        </div>
                    `;
                } else {
                    resultContainer.innerHTML = renderFn(resultado);
                }
            }

            this[lastCalcProp] = { resultado, dados };

            if (!resultado.erro) {
                this.uiManager.showNotification(notificationSuccess, 'success');
            }

        } catch (error) {
            console.error(`Erro no cálculo (${formId}):`, error);
            this.uiManager.showNotification('Erro no cálculo. Tente novamente.', 'error');
            
            const resultContainer = document.getElementById(resultContainerId);
            if (resultContainer) {
                resultContainer.innerHTML = `
                    <div class="result-container error">
                        <h3>Erro no Cálculo</h3>
                        <p class="error-message">Ocorreu um erro inesperado. Verifique os dados e tente novamente.</p>
                    </div>
                `;
            }
        }
    }

    /**
     * Manipula o cálculo de salário
     */
    handleSalarioCalculation() {
        this.handleCalculation({
            formId: 'salario-form',
            resultContainerId: 'salario-result',
            calculationFn: calcularSalarioLiquido,
            renderFn: this.uiManager.renderSalarioResult.bind(this.uiManager),
            lastCalcProp: 'lastSalarioCalculation',
            notificationSuccess: 'Cálculo de salário realizado com sucesso!'
        });
    }

    /**
     * Manipula o cálculo de férias
     */
    handleFeriasCalculation() {
        this.handleCalculation({
            formId: 'ferias-form',
            resultContainerId: 'ferias-result',
            calculationFn: calcularFerias,
            renderFn: this.renderFeriasResult.bind(this),
            lastCalcProp: 'lastFeriasCalculation',
            notificationSuccess: 'Cálculo de férias realizado com sucesso!'
        });
    }

    /**
     * Manipula o cálculo de 13º salário
     */
    handle13SalarioCalculation() {
        this.handleCalculation({
            formId: 'decimo-form',
            resultContainerId: 'decimo-result',
            calculationFn: calcular13Salario,
            renderFn: this.render13SalarioResult.bind(this),
            lastCalcProp: 'last13SalarioCalculation',
            notificationSuccess: 'Cálculo de 13º salário realizado com sucesso!'
        });
    }

    /**
     * Manipula o cálculo de rescisão
     */
    handleRescisaoCalculation() {
        this.handleCalculation({
            formId: 'rescisao-form',
            resultContainerId: 'rescisao-result',
            calculationFn: calcularRescisao,
            renderFn: this.renderRescisaoResult.bind(this),
            lastCalcProp: 'lastRescisaoCalculation',
            notificationSuccess: 'Cálculo de rescisão realizado com sucesso!'
        });
    }

    /**
     * Renderiza resultado de férias (simplificado)
     * @param {Object} resultado - Resultado do cálculo
     * @returns {string} HTML do resultado
     */
    renderFeriasResult(resultado) {
        const calc = resultado.resultado;
        
        return `
            <div class="result-container">
                <h3>Demonstrativo de Férias</h3>
                
                <div class="result-section">
                    <h4>Direitos</h4>
                    <div class="result-grid">
                        <div class="result-item">
                            <span class="label">Dias de Direito:</span>
                            <span class="value">${calc.direito.diasDireito} dias</span>
                        </div>
                        <div class="result-item">
                            <span class="label">Dias para Gozo:</span>
                            <span class="value">${calc.direito.diasParaGozo} dias</span>
                        </div>
                        ${calc.direito.diasVendidos > 0 ? `
                        <div class="result-item">
                            <span class="label">Dias Vendidos:</span>
                            <span class="value">${calc.direito.diasVendidos} dias</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="result-section">
                    <div class="result-final">
                        <span class="label">Valor Líquido:</span>
                        <span class="value highlight">R$ ${calc.resumo.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div class="result-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.generateFeriasPDF()">Gerar PDF</button>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza resultado de 13º salário (simplificado)
     * @param {Object} resultado - Resultado do cálculo
     * @returns {string} HTML do resultado
     */
    render13SalarioResult(resultado) {
        const calc = resultado.resultado;
        
        if (calc.tipo === 'integral') {
            return `
                <div class="result-container">
                    <h3>13º Salário - Valor Integral</h3>
                    
                    <div class="result-section">
                        <div class="result-final">
                            <span class="label">Valor Líquido:</span>
                            <span class="value highlight">R$ ${calc.valores.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div class="result-actions">
                        <button type="button" class="btn btn-secondary" onclick="app.generate13SalarioPDF()">Gerar PDF</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="result-container">
                    <h3>13º Salário - Parcelas</h3>
                    
                    <div class="result-section">
                        <h4>1ª Parcela (Adiantamento)</h4>
                        <div class="result-item">
                            <span class="label">Valor:</span>
                            <span class="value">R$ ${calc.primeiraParcela.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div class="result-section">
                        <h4>2ª Parcela (Complemento)</h4>
                        <div class="result-item">
                            <span class="label">Valor:</span>
                            <span class="value">R$ ${calc.segundaParcela.liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div class="result-actions">
                        <button type="button" class="btn btn-secondary" onclick="app.generate13SalarioPDF()">Gerar PDF</button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Renderiza resultado de rescisão (simplificado)
     * @param {Object} resultado - Resultado do cálculo
     * @returns {string} HTML do resultado
     */
    renderRescisaoResult(resultado) {
        const calc = resultado.resultado;
        
        return `
            <div class="result-container">
                <h3>Demonstrativo de Rescisão</h3>
                <p class="result-subtitle">Motivo: ${this.getMotiveDescription(calc.motivoRescisao)}</p>
                
                <div class="result-section">
                    <div class="result-final">
                        <span class="label">Valor Líquido:</span>
                        <span class="value highlight">R$ ${calc.resumo.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div class="result-actions">
                    <button type="button" class="btn btn-secondary" onclick="app.generateRescisaoPDF()">Gerar PDF</button>
                </div>
            </div>
        `;
    }

    /**
     * Retorna descrição do motivo de rescisão
     * @param {string} motivo - Código do motivo
     * @returns {string} Descrição
     */
    getMotiveDescription(motivo) {
        const motivos = {
            'sem_justa_causa': 'Dispensa sem Justa Causa',
            'pedido_demissao': 'Pedido de Demissão',
            'acordo_mutual': 'Acordo Mútuo',
            'justa_causa': 'Dispensa por Justa Causa',
            'termino_contrato': 'Término de Contrato'
        };
        
        return motivos[motivo] || 'Não especificado';
    }

    /**
     * Gera PDF do demonstrativo de salário
     */
    async generateSalarioPDF() {
        if (!this.lastSalarioCalculation) {
            this.uiManager.showNotification('Nenhum cálculo disponível para PDF', 'warning');
            return;
        }

        try {
            await this.pdfGenerator.gerarPDFSalario(
                this.lastSalarioCalculation.resultado,
                this.lastSalarioCalculation.dados
            );
            this.uiManager.showNotification('PDF gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.uiManager.showNotification('Erro ao gerar PDF', 'error');
        }
    }

    /**
     * Gera PDF do demonstrativo de férias
     */
    async generateFeriasPDF() {
        if (!this.lastFeriasCalculation) {
            this.uiManager.showNotification('Nenhum cálculo disponível para PDF', 'warning');
            return;
        }

        try {
            await this.pdfGenerator.gerarPDFFerias(
                this.lastFeriasCalculation.resultado,
                this.lastFeriasCalculation.dados
            );
            this.uiManager.showNotification('PDF gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.uiManager.showNotification('Erro ao gerar PDF', 'error');
        }
    }

    /**
     * Limpa um formulário
     * @param {string} formId - ID do formulário
     */
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Remove classes de validação
            form.querySelectorAll('.error, .valid').forEach(field => {
                field.classList.remove('error', 'valid');
            });
            
            // Remove mensagens de erro
            form.querySelectorAll('.field-error').forEach(error => {
                error.remove();
            });
        }
    }

}

// Inicializa a aplicação quando o script é carregado
const app = new CalculadoraTrabalhista();

// Expõe a aplicação globalmente para facilitar debugging e chamadas de ações
window.app = app;

// Exportação default
export default CalculadoraTrabalhista;