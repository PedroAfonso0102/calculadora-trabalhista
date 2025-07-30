/**
 * PDF Generator - Calculadora Trabalhista
 * 
 * Gera relatórios em PDF para os cálculos realizados.
 * Utiliza jsPDF para criação de documentos profissionais.
 */

/**
 * Classe para geração de PDFs
 */
export class PDFGenerator {
    constructor() {
        this.logoUrl = null; // Pode ser adicionado depois
        this.companyInfo = {
            name: 'Calculadora Trabalhista',
            version: 'v1.0',
            website: 'https://calculadora-trabalhista.com.br'
        };
    }

    /**
     * Gera PDF para demonstrativo de salário
     * @param {Object} resultado - Resultado do cálculo de salário
     * @param {Object} dados - Dados de entrada
     */
    async gerarPDFSalario(resultado, dados) {
        try {
            // Simulação da geração de PDF (implementação simplificada)
            const content = this.gerarConteudoSalario(resultado, dados);
            this.downloadPDF(content, 'demonstrativo-salario');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            throw new Error('Falha na geração do PDF');
        }
    }

    /**
     * Gera PDF para demonstrativo de férias
     * @param {Object} resultado - Resultado do cálculo de férias
     * @param {Object} dados - Dados de entrada
     */
    async gerarPDFFerias(resultado, dados) {
        try {
            const content = this.gerarConteudoFerias(resultado, dados);
            this.downloadPDF(content, 'demonstrativo-ferias');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            throw new Error('Falha na geração do PDF');
        }
    }

    /**
     * Gera PDF para demonstrativo de 13º salário
     * @param {Object} resultado - Resultado do cálculo do 13º
     * @param {Object} dados - Dados de entrada
     */
    async gerarPDF13Salario(resultado, dados) {
        try {
            const content = this.gerarConteudo13Salario(resultado, dados);
            this.downloadPDF(content, 'demonstrativo-13-salario');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            throw new Error('Falha na geração do PDF');
        }
    }

    /**
     * Gera PDF para demonstrativo de rescisão
     * @param {Object} resultado - Resultado do cálculo de rescisão
     * @param {Object} dados - Dados de entrada
     */
    async gerarPDFRescisao(resultado, dados) {
        try {
            const content = this.gerarConteudoRescisao(resultado, dados);
            this.downloadPDF(content, 'demonstrativo-rescisao');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            throw new Error('Falha na geração do PDF');
        }
    }

    /**
     * Gera conteúdo HTML para o demonstrativo de salário
     * @param {Object} resultado - Resultado do cálculo
     * @param {Object} dados - Dados de entrada
     * @returns {string} HTML formatado
     */
    gerarConteudoSalario(resultado, dados) {
        const { proventos, descontos, liquido } = resultado.resultado;
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Demonstrativo de Pagamento</title>
                <style>
                    ${this.getDefaultStyles()}
                </style>
            </head>
            <body>
                <div class="documento">
                    <header class="header">
                        <h1>DEMONSTRATIVO DE PAGAMENTO</h1>
                        <p class="periodo">Competência: ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                    </header>

                    <section class="dados-entrada">
                        <h2>Dados Informados</h2>
                        <table class="dados-table">
                            <tr>
                                <td><strong>Salário Bruto:</strong></td>
                                <td>R$ ${dados.salarioBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td><strong>Dependentes IRRF:</strong></td>
                                <td>${dados.numDependentes}</td>
                            </tr>
                            <tr>
                                <td><strong>Filhos (Sal. Família):</strong></td>
                                <td>${dados.numFilhos}</td>
                            </tr>
                            <tr>
                                <td><strong>Outros Descontos:</strong></td>
                                <td>R$ ${dados.outrosDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </table>
                    </section>

                    <section class="calculos">
                        <h2>Discriminação</h2>
                        
                        <div class="subsection">
                            <h3>PROVENTOS</h3>
                            <table class="calculos-table">
                                <tr>
                                    <td>Salário Bruto</td>
                                    <td class="valor">R$ ${proventos.salarioBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                ${proventos.salarioFamilia > 0 ? `
                                <tr>
                                    <td>Salário Família</td>
                                    <td class="valor">R$ ${proventos.salarioFamilia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                ` : ''}
                                <tr class="total-row">
                                    <td><strong>TOTAL PROVENTOS</strong></td>
                                    <td class="valor"><strong>R$ ${proventos.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                                </tr>
                            </table>
                        </div>

                        <div class="subsection">
                            <h3>DESCONTOS</h3>
                            <table class="calculos-table">
                                <tr>
                                    <td>INSS</td>
                                    <td class="valor desconto">R$ ${descontos.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td>IRRF</td>
                                    <td class="valor desconto">R$ ${descontos.irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                ${descontos.outros > 0 ? `
                                <tr>
                                    <td>Outros Descontos</td>
                                    <td class="valor desconto">R$ ${descontos.outros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                ` : ''}
                                <tr class="total-row">
                                    <td><strong>TOTAL DESCONTOS</strong></td>
                                    <td class="valor desconto"><strong>R$ ${descontos.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                                </tr>
                            </table>
                        </div>

                        <div class="valor-liquido">
                            <h2>VALOR LÍQUIDO A RECEBER</h2>
                            <div class="valor-final">R$ ${liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </section>

                    <footer class="footer">
                        <p>Documento gerado em ${dataAtual} pela ${this.companyInfo.name} ${this.companyInfo.version}</p>
                        <p class="observacao">Este demonstrativo tem caráter meramente informativo e não substitui o cálculo oficial da empresa.</p>
                    </footer>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Gera conteúdo HTML para o demonstrativo de férias
     * @param {Object} resultado - Resultado do cálculo
     * @param {Object} dados - Dados de entrada
     * @returns {string} HTML formatado
     */
    gerarConteudoFerias(resultado, dados) {
        const calc = resultado.resultado;
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Demonstrativo de Férias</title>
                <style>
                    ${this.getDefaultStyles()}
                </style>
            </head>
            <body>
                <div class="documento">
                    <header class="header">
                        <h1>DEMONSTRATIVO DE FÉRIAS</h1>
                        <p class="periodo">Período Aquisitivo</p>
                    </header>

                    <section class="dados-entrada">
                        <h2>Informações das Férias</h2>
                        <table class="dados-table">
                            <tr>
                                <td><strong>Salário Base:</strong></td>
                                <td>R$ ${dados.salarioBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td><strong>Faltas Injustificadas:</strong></td>
                                <td>${dados.faltasInjustificadas}</td>
                            </tr>
                            <tr>
                                <td><strong>Dias de Direito:</strong></td>
                                <td>${calc.direito.diasDireito} dias</td>
                            </tr>
                            <tr>
                                <td><strong>Dias Solicitados:</strong></td>
                                <td>${dados.diasSolicitados} dias</td>
                            </tr>
                            ${dados.venderFerias ? `
                            <tr>
                                <td><strong>Dias Vendidos:</strong></td>
                                <td>${calc.direito.diasVendidos} dias</td>
                            </tr>
                            ` : ''}
                        </table>
                    </section>

                    <section class="calculos">
                        <h2>Discriminação dos Valores</h2>
                        
                        <div class="subsection">
                            <h3>PROVENTOS</h3>
                            <table class="calculos-table">
                                <tr>
                                    <td>Férias (${calc.direito.diasParaGozo} dias)</td>
                                    <td class="valor">R$ ${calc.valores.valorFerias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td>1/3 Constitucional</td>
                                    <td class="valor">R$ ${calc.valores.tercoConstitucional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                ${calc.valores.valorAbono > 0 ? `
                                <tr>
                                    <td>Abono Pecuniário (${calc.direito.diasVendidos} dias)</td>
                                    <td class="valor">R$ ${calc.valores.valorAbono.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td>1/3 sobre Abono</td>
                                    <td class="valor">R$ ${calc.valores.tercoAbono.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                ` : ''}
                                <tr class="total-row">
                                    <td><strong>TOTAL PROVENTOS</strong></td>
                                    <td class="valor"><strong>R$ ${calc.resumo.totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                                </tr>
                            </table>
                        </div>

                        <div class="subsection">
                            <h3>DESCONTOS</h3>
                            <table class="calculos-table">
                                <tr>
                                    <td>INSS</td>
                                    <td class="valor desconto">R$ ${calc.tributos.descontoINSS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td>IRRF</td>
                                    <td class="valor desconto">R$ ${calc.tributos.descontoIRRF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr class="total-row">
                                    <td><strong>TOTAL DESCONTOS</strong></td>
                                    <td class="valor desconto"><strong>R$ ${calc.resumo.totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></td>
                                </tr>
                            </table>
                        </div>

                        <div class="valor-liquido">
                            <h2>VALOR LÍQUIDO A RECEBER</h2>
                            <div class="valor-final">R$ ${calc.resumo.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </section>

                    <section class="observacoes">
                        <h3>Observações Importantes:</h3>
                        <ul>
                            <li>Abono pecuniário e seu 1/3 não sofrem incidência de INSS nem IRRF</li>
                            <li>Base de cálculo para tributos: Férias + 1/3 Constitucional</li>
                            <li>Direito a férias baseado na tabela do Art. 130 da CLT</li>
                        </ul>
                    </section>

                    <footer class="footer">
                        <p>Documento gerado em ${dataAtual} pela ${this.companyInfo.name} ${this.companyInfo.version}</p>
                        <p class="observacao">Este demonstrativo tem caráter meramente informativo.</p>
                    </footer>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Retorna estilos CSS padrão para os PDFs
     * @returns {string} CSS
     */
    getDefaultStyles() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
            }

            .documento {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
            }

            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #2c5aa0;
                padding-bottom: 15px;
            }

            .header h1 {
                font-size: 20px;
                color: #2c5aa0;
                margin-bottom: 5px;
            }

            .periodo {
                font-size: 14px;
                color: #666;
            }

            .dados-entrada {
                margin-bottom: 25px;
            }

            .dados-entrada h2,
            .calculos h2 {
                font-size: 16px;
                color: #2c5aa0;
                margin-bottom: 10px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }

            .dados-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }

            .dados-table td {
                padding: 8px;
                border: 1px solid #ddd;
            }

            .dados-table td:first-child {
                background-color: #f8f9fa;
                width: 200px;
            }

            .subsection {
                margin-bottom: 20px;
            }

            .subsection h3 {
                font-size: 14px;
                color: #495057;
                margin-bottom: 8px;
                background-color: #e9ecef;
                padding: 5px 10px;
            }

            .calculos-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }

            .calculos-table td {
                padding: 6px 10px;
                border: 1px solid #ddd;
            }

            .calculos-table td:first-child {
                width: 70%;
            }

            .calculos-table .valor {
                text-align: right;
                font-weight: 500;
            }

            .calculos-table .desconto {
                color: #dc3545;
            }

            .total-row {
                background-color: #f8f9fa;
                font-weight: bold;
            }

            .valor-liquido {
                margin: 25px 0;
                text-align: center;
                padding: 20px;
                border: 2px solid #2c5aa0;
                background-color: #f8f9fc;
            }

            .valor-liquido h2 {
                color: #2c5aa0;
                font-size: 16px;
                margin-bottom: 10px;
            }

            .valor-final {
                font-size: 24px;
                font-weight: bold;
                color: #28a745;
            }

            .observacoes {
                margin: 20px 0;
            }

            .observacoes h3 {
                font-size: 14px;
                color: #495057;
                margin-bottom: 10px;
            }

            .observacoes ul {
                margin-left: 20px;
            }

            .observacoes li {
                margin-bottom: 5px;
                font-size: 11px;
            }

            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 15px;
            }

            .observacao {
                font-style: italic;
                margin-top: 5px;
            }

            @media print {
                body {
                    font-size: 11px;
                }
                
                .documento {
                    margin: 0;
                    padding: 15px;
                }
                
                .header h1 {
                    font-size: 18px;
                }
                
                .valor-final {
                    font-size: 20px;
                }
            }
        `;
    }

    /**
     * Gera conteúdo simplificado para outros tipos de demonstrativo
     * @param {string} tipo - Tipo do demonstrativo
     * @param {Object} resultado - Resultado do cálculo
     * @param {Object} dados - Dados de entrada
     * @returns {string} HTML formatado
     */
    gerarConteudoGenerico(tipo, resultado, dados) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Demonstrativo - ${tipo}</title>
                <style>${this.getDefaultStyles()}</style>
            </head>
            <body>
                <div class="documento">
                    <header class="header">
                        <h1>DEMONSTRATIVO - ${tipo.toUpperCase()}</h1>
                    </header>
                    <section class="calculos">
                        <pre>${JSON.stringify(resultado, null, 2)}</pre>
                    </section>
                    <footer class="footer">
                        <p>Documento gerado pela ${this.companyInfo.name}</p>
                    </footer>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Simula download do PDF (implementação simplificada)
     * @param {string} content - Conteúdo HTML
     * @param {string} filename - Nome do arquivo
     */
    downloadPDF(content, filename) {
        // Simulação: cria um blob com o HTML e oferece download
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
}

// Exportação default
export default PDFGenerator;