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
        this.scenarioManager = new ScenarioManager();
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
        // Formulário de salário
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'salario-form') {
                e.preventDefault();
                this.handleSalarioCalculation();
            }
        });

        // Formulário de férias
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'ferias-form') {
                e.preventDefault();
                this.handleFeriasCalculation();
            }
        });

        // Formulário de 13º salário
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'decimo-form') {
                e.preventDefault();
                this.handle13SalarioCalculation();
            }
        });

        // Formulário de rescisão
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'rescisao-form') {
                e.preventDefault();
                this.handleRescisaoCalculation();
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

            // Botões de salvar cenário
            if (e.target.id === 'salvar-cenario-salario') {
                this.saveScenario('salario');
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
     * Manipula o cálculo de salário
     */
    async handleSalarioCalculation() {
        const dados = this.uiManager.collectFormData('salario-form');
        
        if (!dados) {
            this.uiManager.showNotification('Erro ao coletar dados do formulário', 'error');
            return;
        }

        try {
            // Exibe loading
            this.uiManager.showLoading('salario-result');

            // Simula delay para melhor UX
            await this.delay(500);

            // Executa o cálculo
            const resultado = calcularSalarioLiquido(dados);

            // Exibe o resultado
            const resultContainer = document.getElementById('salario-result');
            if (resultContainer) {
                resultContainer.innerHTML = this.uiManager.renderSalarioResult(resultado);
            }

            // Salva para possível geração de PDF
            this.lastSalarioCalculation = { resultado, dados };

            if (!resultado.erro) {
                this.uiManager.showNotification('Cálculo realizado com sucesso!', 'success');
            }

        } catch (error) {
            console.error('Erro no cálculo de salário:', error);
            this.uiManager.showNotification('Erro no cálculo. Tente novamente.', 'error');
            
            const resultContainer = document.getElementById('salario-result');
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
     * Manipula o cálculo de férias
     */
    async handleFeriasCalculation() {
        const dados = this.uiManager.collectFormData('ferias-form');
        
        if (!dados) {
            this.uiManager.showNotification('Erro ao coletar dados do formulário', 'error');
            return;
        }

        try {
            this.uiManager.showLoading('ferias-result');
            await this.delay(500);

            const resultado = calcularFerias(dados);

            // Renderiza resultado (implementação simplificada)
            const resultContainer = document.getElementById('ferias-result');
            if (resultContainer) {
                if (resultado.erro) {
                    resultContainer.innerHTML = `
                        <div class="result-container error">
                            <h3>Erro no Cálculo</h3>
                            <p class="error-message">${resultado.mensagem}</p>
                        </div>
                    `;
                } else {
                    resultContainer.innerHTML = this.renderFeriasResult(resultado);
                }
            }

            this.lastFeriasCalculation = { resultado, dados };

            if (!resultado.erro) {
                this.uiManager.showNotification('Cálculo de férias realizado com sucesso!', 'success');
            }

        } catch (error) {
            console.error('Erro no cálculo de férias:', error);
            this.uiManager.showNotification('Erro no cálculo. Tente novamente.', 'error');
        }
    }

    /**
     * Manipula o cálculo de 13º salário
     */
    async handle13SalarioCalculation() {
        const dados = this.uiManager.collectFormData('decimo-form');
        
        if (!dados) {
            this.uiManager.showNotification('Erro ao coletar dados do formulário', 'error');
            return;
        }

        try {
            this.uiManager.showLoading('decimo-result');
            await this.delay(500);

            const resultado = calcular13Salario(dados);

            const resultContainer = document.getElementById('decimo-result');
            if (resultContainer) {
                if (resultado.erro) {
                    resultContainer.innerHTML = `
                        <div class="result-container error">
                            <h3>Erro no Cálculo</h3>
                            <p class="error-message">${resultado.mensagem}</p>
                        </div>
                    `;
                } else {
                    resultContainer.innerHTML = this.render13SalarioResult(resultado);
                }
            }

            this.last13SalarioCalculation = { resultado, dados };

            if (!resultado.erro) {
                this.uiManager.showNotification('Cálculo de 13º salário realizado com sucesso!', 'success');
            }

        } catch (error) {
            console.error('Erro no cálculo de 13º salário:', error);
            this.uiManager.showNotification('Erro no cálculo. Tente novamente.', 'error');
        }
    }

    /**
     * Manipula o cálculo de rescisão
     */
    async handleRescisaoCalculation() {
        const dados = this.uiManager.collectFormData('rescisao-form');
        
        if (!dados) {
            this.uiManager.showNotification('Erro ao coletar dados do formulário', 'error');
            return;
        }

        try {
            this.uiManager.showLoading('rescisao-result');
            await this.delay(1000); // Rescisão é mais complexa, delay maior

            const resultado = calcularRescisao(dados);

            const resultContainer = document.getElementById('rescisao-result');
            if (resultContainer) {
                if (resultado.erro) {
                    resultContainer.innerHTML = `
                        <div class="result-container error">
                            <h3>Erro no Cálculo</h3>
                            <p class="error-message">${resultado.mensagem}</p>
                        </div>
                    `;
                } else {
                    resultContainer.innerHTML = this.renderRescisaoResult(resultado);
                }
            }

            this.lastRescisaoCalculation = { resultado, dados };

            if (!resultado.erro) {
                this.uiManager.showNotification('Cálculo de rescisão realizado com sucesso!', 'success');
            }

        } catch (error) {
            console.error('Erro no cálculo de rescisão:', error);
            this.uiManager.showNotification('Erro no cálculo. Tente novamente.', 'error');
        }
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

    /**
     * Salva um cenário no localStorage
     * @param {string} tipo - Tipo do cálculo
     */
    saveScenario(tipo) {
        // Implementação simplificada
        this.uiManager.showNotification('Funcionalidade em desenvolvimento', 'info');
    }

    /**
     * Utilitário para delay
     * @param {number} ms - Milissegundos
     * @returns {Promise} Promise que resolve após o delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Gerenciador de cenários (localStorage)
 */
class ScenarioManager {
    constructor() {
        this.storageKey = 'calculadora-trabalhista-scenarios';
    }

    /**
     * Salva um cenário
     * @param {string} name - Nome do cenário
     * @param {string} type - Tipo do cálculo
     * @param {Object} data - Dados do cenário
     */
    saveScenario(name, type, data) {
        const scenarios = this.getScenarios();
        const id = Date.now().toString();
        
        scenarios[id] = {
            name,
            type,
            data,
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(scenarios));
        return id;
    }

    /**
     * Recupera todos os cenários
     * @returns {Object} Cenários salvos
     */
    getScenarios() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {};
    }

    /**
     * Remove um cenário
     * @param {string} id - ID do cenário
     */
    removeScenario(id) {
        const scenarios = this.getScenarios();
        delete scenarios[id];
        localStorage.setItem(this.storageKey, JSON.stringify(scenarios));
    }
}

// Inicializa a aplicação quando o script é carregado
const app = new CalculadoraTrabalhista();

// Expõe a aplicação globalmente para facilitar debugging e chamadas de ações
window.app = app;

// Exportação default
export default CalculadoraTrabalhista;