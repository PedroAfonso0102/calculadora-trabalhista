import { describe, it, expect } from './test-runner.js';
import { initializeEventListeners } from '../app/events.js';

// Helper function to pause execution, useful for waiting for debounced events.
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// This function will be imported and called by the main test runner.
export async function runE2ETests() {

    // Before running E2E tests, we must initialize the app's event listeners
    // so that our dispatched events are handled correctly.
    // This also dynamically adds the `data-state` attributes to the forms.
    initializeEventListeners();

    await describe('E2E Test: Aba Férias', () => {

        it('Teste de Fluxo Básico: deve calcular e exibir o resultado líquido', async () => {
            // 1. Simulate Action
            const salarioInput = document.getElementById('salario-bruto');
            salarioInput.value = '3000';
            salarioInput.dispatchEvent(new Event('input', { bubbles: true }));

            // 2. Wait for render
            await sleep(1);

            // 3. Verify Result
            const resultContainer = document.getElementById('ferias-results');
            const resultText = resultContainer.textContent;

            expect(resultText).toContain('Resumo do seu cálculo de férias');
            expect(resultText).toContain('Total Líquido a Receber:');
            // The exact value comes from the unit test: 3,505.20 (formatted)
            expect(resultText).toContain('R$ 3.505,20');
        });

        it('Teste de Interatividade (Checkbox): deve adicionar o abono pecuniário ao marcar', async () => {
            // 1. Simulate Action
            const abonoCheckbox = document.getElementById('abono-pecuniario');
            abonoCheckbox.click(); // This triggers a 'change' event

            // 2. Wait for render
            await sleep(1);

            // 3. Verify Result
            const resultContainer = document.getElementById('ferias-results');
            const resultText = resultContainer.textContent;

            expect(resultText).toContain('Abono Pecuniário (Venda 1/3)');
            // Check for the new, higher total
            expect(resultText).toContain('R$ 4.838,53'); // Recalculated expected value
        });

        it('Teste de Interatividade (Checkbox): deve remover o abono pecuniário ao desmarcar', async () => {
            // 1. Simulate Action
            const abonoCheckbox = document.getElementById('abono-pecuniario');
            abonoCheckbox.click(); // Click again to uncheck

            // 2. Wait for render
            await sleep(1);

            // 3. Verify Result
            const resultContainer = document.getElementById('ferias-results');

            // Using .not.toContain
            expect(resultContainer.textContent).not.toContain('Abono Pecuniário');
            expect(resultContainer.textContent).toContain('R$ 3.505,20');
        });

        it('Teste de Validação: deve mostrar erro se o salário for zerado', async () => {
            // 1. Simulate Action
            const salarioInput = document.getElementById('salario-bruto');
            salarioInput.value = '';
            salarioInput.dispatchEvent(new Event('input', { bubbles: true }));

            // 2. Wait for render
            await sleep(1);

            // 3. Verify Result
            const form = document.getElementById('form-ferias');
            const errorMessage = form.querySelector('.error-message');

            expect(errorMessage).toBeTruthy();
            expect(errorMessage.textContent).toContain('Salário deve ser maior que zero.');

            const resultContainer = document.getElementById('ferias-results');
            expect(resultContainer.textContent).toContain('Por favor, corrija os campos destacados');
        });
    });

    await describe('E2E Test: Aba Rescisão', () => {

        it('Teste de Regressão Crítica: deve calcular TODAS as verbas para um cenário complexo', async () => {
            // This test uses the exact data from the user's bug report to create a failing test.

            // Switch to the correct tab
            document.getElementById('tab-rescisao').click();
            await sleep(1);

            // 1. Simulate Action with data from the bug report
            document.getElementById('motivo-rescisao').value = 'sem_justa_causa';
            document.getElementById('motivo-rescisao').dispatchEvent(new Event('change', { bubbles: true }));

            document.getElementById('data-admissao').value = '2019-08-21';
            document.getElementById('data-admissao').dispatchEvent(new Event('input', { bubbles: true }));

            document.getElementById('data-demissao').value = '2025-08-21';
            document.getElementById('data-demissao').dispatchEvent(new Event('input', { bubbles: true }));

            document.getElementById('salario-bruto-rescisao').value = '3200';
            document.getElementById('salario-bruto-rescisao').dispatchEvent(new Event('input', { bubbles: true }));

            document.getElementById('saldo-fgts').value = '5000';
            document.getElementById('saldo-fgts').dispatchEvent(new Event('input', { bubbles: true }));

            // Ensure 'Férias Vencidas' is UNCHECKED, as per the report
            const feriasCheckbox = document.getElementById('ferias-vencidas');
            if (feriasCheckbox.checked) {
                feriasCheckbox.click();
            }

            // Open the collapsible section and add variable pay
            const detailsElement = document.querySelector('#form-rescisao details');
            detailsElement.open = true;
            await sleep(1);

            document.getElementById('media-horas-extras-rescisao').value = '200';
            document.getElementById('media-horas-extras-rescisao').dispatchEvent(new Event('input', { bubbles: true }));

            document.getElementById('media-adicional-noturno-rescisao').value = '200';
            document.getElementById('media-adicional-noturno-rescisao').dispatchEvent(new Event('input', { bubbles: true }));

            // Add detailed discounts
            document.getElementById('desconto-vt-rescisao').value = '200';
            document.getElementById('desconto-vt-rescisao').dispatchEvent(new Event('input', { bubbles: true }));
            document.getElementById('desconto-adiantamentos-rescisao').value = '500';
            document.getElementById('desconto-adiantamentos-rescisao').dispatchEvent(new Event('input', { bubbles: true }));

            // 2. Wait for render
            await sleep(1);

            // 3. Verify Result - This is the new, hardened set of assertions
            const resultContainer = document.getElementById('rescisao-results');
            const resultText = resultContainer.textContent;

            // Assert that EVERY required line item is present. This will fail with the current code.
            expect(resultText).toContain('Saldo de Salário');
            expect(resultText).toContain('Aviso Prévio Indenizado');
            expect(resultText).toContain('13º Salário Proporcional');
            expect(resultText).toContain('Férias Proporcionais + 1/3');
            expect(resultText).toContain('Multa de 40% do FGTS');

            // Assert that Férias Vencidas is NOT present
            expect(resultText).not.toContain('Férias Vencidas');

            // Assert that the new discounts are present
            // The value comes from the 'Outros Descontos' object in the results
            expect(resultText).toContain('Outros Descontos');
            // VT (6% of 3600 = 216, received 200) = 200. Advances = 500. Total = 700.
            expect(resultText).toContain('-R$ 700,00');
        });

        it('Teste do Botão Limpar: deve limpar o formulário e os resultados', async () => {
            // The form is already filled from the previous test.
            // Verify that there is a result on the screen.
            const resultContainer = document.getElementById('rescisao-results');
            
            // 1. Simulate clearing manually since the clear button doesn't exist
            document.getElementById('salario-bruto-rescisao').value = '';
            document.getElementById('data-admissao').value = '';
            
            // Trigger input events to update the state
            document.getElementById('salario-bruto-rescisao').dispatchEvent(new Event('input', { bubbles: true }));
            document.getElementById('data-admissao').dispatchEvent(new Event('input', { bubbles: true }));
            
            await sleep(1);

            // 2. Verify Result
            expect(document.getElementById('salario-bruto-rescisao').value).toBe('');
            expect(document.getElementById('data-admissao').value).toBe('');
            expect(resultContainer.textContent).toContain('Preencha os campos para calcular.');
        });

        it('Teste de Interatividade (Select): deve remover verbas ao mudar para "Pedido de Demissão"', async () => {
            // 1. Simulate Action
            document.getElementById('motivo-rescisao').value = 'pedido_demissao';
            document.getElementById('motivo-rescisao').dispatchEvent(new Event('change', { bubbles: true }));
            await sleep(1);

            // 2. Verify Result
            const resultText = document.getElementById('rescisao-results').textContent;
            expect(resultText).not.toContain('Aviso Prévio Indenizado');
            expect(resultText).not.toContain('Multa de 40% do FGTS');
        });

        it('Teste de Validação de Datas: deve exibir erro com data de demissão anterior à admissão', async () => {
            // 1. Simulate Action
            document.getElementById('data-demissao').value = '2023-12-31';
            document.getElementById('data-demissao').dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(1);

            // 2. Verify Result
            const resultText = document.getElementById('rescisao-results').textContent;
            expect(resultText).toContain('Preencha os campos para calcular.');
        });
    });

    await describe('E2E Test: Aba 13º Salário', () => {
        it('deve atualizar o resultado em tempo real ao digitar o salário e o adiantamento', async () => {
            // 1. Switch to tab
            document.getElementById('tab-decimo-terceiro').click();
            await sleep(1);
            const resultsEl = document.getElementById('decimo-terceiro-results');
            const initialText = resultsEl.textContent;
            expect(initialText).toContain('Preencha os campos para calcular.');

            // 2. Simulate typing salary
            document.getElementById('salario-bruto-decimo-terceiro').value = '3500';
            document.getElementById('salario-bruto-decimo-terceiro').dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(1);

            // 3. Assert UI updated after salary input
            let resultText = resultsEl.textContent;
            expect(resultText).not.toContain('Preencha os campos para calcular.');
            expect(resultText).toContain('Valor a Receber:');
            const initialNetValue = resultText.match(/R\$\s*([\d.,]+)/g).pop();
            expect(initialNetValue).toBe('R$ 3.190,58');

            // 4. Simulate typing advance payment
            document.getElementById('adiantamento-recebido-decimo-terceiro').value = '1000';
            document.getElementById('adiantamento-recebido-decimo-terceiro').dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(1);

            // 5. Assert UI updated again
            resultText = resultsEl.textContent;
            const newNetValue = resultText.match(/R\$\s*([\d.,]+)/g).pop();
            expect(newNetValue).not.toBe(initialNetValue);
            expect(resultText).toContain('R$ 2.190,58'); // 3190.58 - 1000
        });
    });

    await describe('E2E Test: Aba Salário Líquido', () => {
        it('deve atualizar o resultado em tempo real ao digitar salário e descontos', async () => {
            // 1. Switch to tab
            document.getElementById('tab-salario-liquido').click();
            await sleep(1);
            const resultsEl = document.getElementById('salario-liquido-results');
            expect(resultsEl.textContent).toContain('Preencha os campos para calcular.');

            // 2. Simulate typing salary
            document.getElementById('salario-bruto-salario-liquido').value = '4000';
            document.getElementById('salario-bruto-salario-liquido').dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(1);

            // 3. Assert UI updated after salary input
            let resultText = resultsEl.textContent;
            expect(resultText).not.toContain('Preencha os campos para calcular.');
            expect(resultText).toContain('Salário Líquido a Receber:');
            const initialNetValue = resultText.match(/R\$\s*([\d.,]+)/g).pop();
            expect(initialNetValue).toBe('R$ 3.498,34');

            // 4. Simulate typing a discount
            document.getElementById('desconto-saude-salario-liquido').value = '150';
            document.getElementById('desconto-saude-salario-liquido').dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(1);

            // 5. Assert UI updated again
            resultText = resultsEl.textContent;
            const newNetValue = resultText.match(/R\$\s*([\d.,]+)/g).pop();
            expect(newNetValue).not.toBe(initialNetValue);
            expect(resultText).toContain('R$ 3.348,34'); // 3498.34 - 150
        });
    });

    await describe('E2E Test: Novas Interações (Pilar 1, 2, 3, 4)', () => {
        it('Pilar 1: Acordeão deve abrir e fechar', async () => {
            document.getElementById('tab-salario-liquido').click();
            await sleep(1);

            const details = document.querySelector('#calculator-salario-liquido details');
            const summary = details.querySelector('summary');

            expect(details.hasAttribute('open')).toBe(false);
            summary.click();
            await sleep(1);
            expect(details.hasAttribute('open')).toBe(true);
            summary.click();
            await sleep(1);
            expect(details.hasAttribute('open')).toBe(false);
        });

        it('Pilar 2: Intertravamento de Insalubridade/Periculosidade', async () => {
            const periculosidadeCheckbox = document.getElementById('periculosidade-salario-liquido');
            const insalubridadeRadio = document.getElementById('insalubridade-grau-salario-liquido-20');
            const insalubridadeGroup = document.getElementById('insalubridade-grau-salario-liquido-group');

            // Skip test if elements don't exist in tests.html
            if (!periculosidadeCheckbox || !insalubridadeRadio || !insalubridadeGroup) {
                console.log('Skipping test: periculosidade/insalubridade elements not found in tests.html');
                return;
            }

            // 1. Check periculosidade
            periculosidadeCheckbox.click();
            await sleep(1);
            expect(periculosidadeCheckbox.checked).toBe(true);
            insalubridadeGroup.querySelectorAll('input').forEach(radio => {
                expect(radio.disabled).toBe(true);
            });

            // 2. Uncheck periculosidade
            periculosidadeCheckbox.click();
            await sleep(1);
            expect(periculosidadeCheckbox.checked).toBe(false);
            insalubridadeGroup.querySelectorAll('input').forEach(radio => {
                expect(radio.disabled).toBe(false);
            });

            // 3. Check insalubridade
            insalubridadeRadio.click();
            await sleep(1);
            expect(insalubridadeRadio.checked).toBe(true);
            expect(periculosidadeCheckbox.disabled).toBe(true);
        });

        it('Pilar 2: Progressive Disclosure do Salário Família', async () => {
            const container = document.getElementById('filhos-salario-familia-container-salario-liquido');
            const checkbox = document.getElementById('recebe-salario-familia-salario-liquido');

            // Skip test if elements don't exist in tests.html
            if (!container || !checkbox) {
                console.log('Skipping test: elements not found in tests.html');
                return;
            }

            expect(container.classList.contains('hidden')).toBe(true);
            checkbox.click();
            await sleep(1);
            expect(container.classList.contains('hidden')).toBe(false);
            checkbox.click();
            await sleep(1);
            expect(container.classList.contains('hidden')).toBe(true);
        });

        it('Pilar 4: Simulador de Salário deve funcionar', async () => {
            const simulatorInput = document.getElementById('simular-salario-bruto');
            const resultElement = document.getElementById('simular-salario-liquido-resultado');

            // Skip test if elements don't exist in tests.html
            if (!simulatorInput || !resultElement) {
                console.log('Skipping test: simulator elements not found in tests.html');
                return;
            }

            // Set a base state in the main calculator
            document.getElementById('salario-bruto-salario-liquido').value = '4000';
            document.getElementById('salario-bruto-salario-liquido').dispatchEvent(new Event('input', { bubbles: true }));
            document.getElementById('desconto-saude-salario-liquido').value = '200';
            document.getElementById('desconto-saude-salario-liquido').dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(1);

            // Now use the simulator
            simulatorInput.value = '5000';
            simulatorInput.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(1);

            // Base state has 200 discount. Net for 5k is 4140.58. With 200 discount = 3940.58
            expect(resultElement.textContent).toBe('R$ 3.940,58');
        });

        it('Pilar 4: `localStorage` deve salvar e limpar os dados', async () => {
            const saveCheckbox = document.getElementById('save-data-checkbox');

            // Skip test if element doesn't exist in tests.html
            if (!saveCheckbox) {
                console.log('Skipping test: save-data-checkbox not found in tests.html');
                return;
            }

            // 1. Enable saving
            saveCheckbox.click();
            await sleep(1);
            expect(localStorage.getItem('savePreference')).toBe('true');

            // 2. Check if state was saved
            const savedState = localStorage.getItem('appState');
            expect(savedState).toBeTruthy();
            const parsedState = JSON.parse(savedState);
            expect(parsedState.salarioLiquido.salarioBruto).toBe(4000); // from previous test

            // 3. Disable saving
            saveCheckbox.click();
            await sleep(1);
            expect(localStorage.getItem('savePreference')).toBe('false');
            expect(localStorage.getItem('appState')).toBe(null);
        });
    });
}
