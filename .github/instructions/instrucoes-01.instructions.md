---
applyTo: '**'
---
# Contexto do Projeto e Diretrizes de Codificação para a IA

Este documento consolida o contexto do projeto "Calculadora Trabalhista" e estabelece as diretrizes que a IA deve seguir ao gerar código, responder a perguntas ou revisar alterações.

## 1. Contexto Geral do Projeto

*   **Nome do Projeto:** Calculadora Trabalhista
*   **Objetivo:** Expandir as funcionalidades para se tornar uma suíte de cálculos mais completa e robusta, agregando valor ao usuário final, mantendo a simplicidade da UI/UX e a integridade da estrutura de código existente.
*   **Tecnologias:** JavaScript Vanilla, HTML, TailwindCSS.
*   **Estrutura de Arquivos:** O projeto utiliza uma estrutura modular com `main.js`, `calculations.js`, `ui.js`, `state.js`, `events.js`, e `data/legal_texts.json`.

## 2. Estado Atual do Projeto (Após Fase 2 Concluída)

*   **Calculadoras Implementadas e Funcionais:** Férias, Rescisão, 13º Salário, Salário Líquido, FGTS, PIS/PASEP, Seguro-Desemprego, Horas Extras, INSS, Vale-Transporte e IRPF.
*   **Funcionalidade "Resultado do Cálculo" e "Memória de Cálculo":** Implementadas para *todas* as calculadoras, seguindo o padrão das calculadoras originais, incluindo a funcionalidade de impressão (PDF).
*   **Navegação:** Atualmente, a navegação é baseada em abas, mas será substituída por uma barra lateral na Fase 3.
*   **Bugs Corrigidos:**
    *   `SyntaxError: Identifier has already been declared` devido a funções duplicadas em `ui.js`.
    *   `ReferenceError` devido a funções de renderização de resultados ausentes (`createHorasExtrasResultHTML`, `createValeTransporteResultHTML`, `createIRPFResultHTML`).
    *   Problemas na "Memória de Cálculo" e "Imprimir" ("Erro: Tipo de cálculo não reconhecido.") para as novas calculadoras (FGTS, PIS/PASEP, Seguro-Desemprego, Horas Extras, INSS, Vale-Transporte, IRPF) foram 90% resolvidos, com ajustes finais a serem feitos manualmente.

## 3. Fases do Projeto

*   **Fase 1 (Concluída):** Diagnóstico e correção do funcionamento básico das calculadoras de Horas Extras, Vale-Transporte e IRPF.
*   **Fase 2 (Concluída):** Implementação da seção "Resultado do Cálculo" e "Memória de Cálculo" (com impressão) para todas as novas calculadoras.
*   **Fase 3 (Atual/Próxima):** Implementação de melhorias de UX e uma nova navegação com barra lateral.

## 4. Diretrizes de Codificação e Comportamento da IA

A IA deve aderir estritamente às seguintes diretrizes:

*   **Tecnologia:** Estritamente JavaScript Vanilla, HTML e TailwindCSS.
*   **Modificações de Código:**
    *   **Construir sobre o existente:** Não realizar refatoração do código existente, a menos que explicitamente solicitado. As novas funcionalidades devem ser construídas sobre a estrutura atual.
    *   **Reutilização de Arquivos:** Utilizar os arquivos existentes (`index.html`, `calculations.js`, `ui.js`, `state.js`, `events.js`, `data/legal_texts.json`). Criar novos arquivos apenas quando estritamente necessário e justificado.
    *   **Evitar Duplicação:** Identificar e consolidar proativamente qualquer código JavaScript duplicado em qualquer arquivo (`.js`).
    *   **`console.log()`:** Remover todos os `console.log()` do código final antes da submissão.
*   **UI/UX:**
    *   **Simplicidade:** Seguir a estrutura de UI/UX simples e funcional já presente no repositório.
    *   **Consistência:** Manter a consistência visual e funcional com o design existente.
*   **Lógica de Negócio:**
    *   **Prioridade:** A prioridade é a funcionalidade robusta e precisa dos cálculos.
    *   **Fundamentação Legal:** Garantir que a fundamentação legal detalhada para todos os cálculos esteja presente e clara em `data/legal_texts.json`.
*   **Funcionalidades Específicas:**
    *   **"Resultado do Cálculo" e "Memória de Cálculo":**
        *   Devem estar presentes para todas as calculadoras.
        *   Seguir estilo visual e lógica operacional idênticos aos das calculadoras originais.
        *   A memória de cálculo deve ser o mais granular possível, mostrando detalhes passo a passo.
        *   Em casos de inelegibilidade, o modal da "Memória de Cálculo" deve abrir com uma mensagem clara explicando o motivo, em vez de desabilitar o botão.
        *   É autorizada e encorajada a criação de uma função única e reutilizável para gerenciar a lógica comum de exibição da memória.
    *   **Validação de Inputs (Fase 3):** Implementar um método híbrido: o erro só é mostrado após o usuário sair do campo pela primeira vez (`onblur`), mas a partir daí, o campo é revalidado a cada tecla digitada (`oninput`) para que o usuário veja o erro ser corrigido em tempo real.
    *   **Limpeza de Dados (Fase 3):** O botão "Limpar Dados Salvos" deve apagar *apenas* os dados dos formulários inseridos pelo usuário do `localStorage`, preservando outras configurações futuras.
    *   **Calculadora de IRPF (Melhorias de UX - Fase 3):** Necessita de mais contexto educacional (ícones de ajuda `(?)` com tooltips/painel educacional), e um resumo mais detalhado dos cálculos intermediários diretamente na seção de resultados.

## 5. Detalhes da Fase 3 (Próxima Tarefa)

**Objetivo:** Implementar melhorias de UX e uma nova navegação com barra lateral.

**Melhorias Chave:**

1.  **Barra Lateral (Sidebar) para Navegação Principal:**
    *   **Substitui a navegação por abas existente.**
    *   **Posicionamento:** Fixa à esquerda, largura 240-280px.
    *   **Estilo:** Fundo cinza muito claro/branco, borda vertical sutil.
    *   **Seções:** Topo (Logo "Calculadora Trabalhista"), Meio (Links de Navegação), Base (Placeholder de Perfil do Usuário).
    *   **Links:** Apenas texto (sem ícones), usando a fonte `Inter`.
    *   **Estados Interativos:** Padrão, `hover`, e `ativo/selecionado` (fundo azul de destaque, texto branco, cantos arredondados).
    *   **Responsividade Móvel:** Transforma-se em um ícone de "hambúrguer" que, ao ser tocado, abre a barra lateral por cima do conteúdo principal.

2.  **Feedback Visual de Entrada de Dados:**
    *   Validação em tempo real nos campos de input.
    *   Método híbrido: erro visível após `blur` inicial, depois revalidação `oninput`.

3.  **Indicação de Persistência de Dados:**
    *   Mensagem no rodapé sobre salvamento local.
    *   Botão "Limpar Dados Salvos" que apaga apenas dados de formulário do `localStorage`.

4.  **Refinamento da Responsividade Móvel:**
    *   Ajustes gerais de layout, espaçamento, fontes e elementos para telas pequenas, incluindo o comportamento da sidebar.

---