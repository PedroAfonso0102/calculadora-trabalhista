# Guia do Desenvolvedor: Testes da Calculadora Trabalhista

Este documento fornece uma visão geral da arquitetura de testes implementada neste projeto e como mantê-la. O objetivo é garantir que a aplicação permaneça robusta, confiável e fácil de manter.

## Arquitetura de Testes

A suíte de testes é construída com **100% JavaScript Vanilla (ES Modules)**, sem nenhuma dependência externa, para manter o projeto leve e alinhado com sua filosofia original.

A arquitetura é dividida em três componentes principais:

1.  **Test Runner (`/assets/js/tests/test-runner.js`)**:
    *   Um micro-framework de testes que fornece as funções `describe()`, `it()`, e `expect()` para uma sintaxe de teste familiar e legível.
    *   Ele é responsável por executar os testes, registrar os resultados e exibi-los tanto no console do navegador quanto no DOM.

2.  **Host de Teste (`/tests.html`)**:
    *   Este é o ponto de entrada para executar a suíte de testes completa.
    *   Ele carrega uma cópia do DOM da aplicação para que os testes de interface possam interagir com elementos reais.
    *   Ele carrega o script principal dos testes, `/assets/js/tests/main.spec.js`, que por sua vez importa e executa todas as suítes de teste.

3.  **Suítes de Teste (`/assets/js/tests/`)**:
    *   **`unit.spec.js`**: Contém os **Testes de Lógica (Unitários)**. Estes testes focam em validar a precisão matemática das funções puras encontradas em `calculations.js`. Eles não interagem com o DOM.
    *   **`e2e.spec.js`**: Contém os **Testes de Interface (End-to-End)**. Estes testes simulam a interação real do usuário, disparando eventos nos elementos do formulário e verificando se a UI (o DOM) é atualizada corretamente com os resultados esperados.

## Como Executar os Testes

Executar os testes é um processo simples:

1.  Certifique-se de que você está servindo os arquivos do projeto a partir de um servidor web local.
    *   **Nota**: Abrir `tests.html` diretamente do sistema de arquivos (`file://...`) **não funcionará** devido às restrições de segurança do navegador relacionadas aos Módulos ES6 (`import`/`export`).
    *   Se você tem o Node.js instalado, uma maneira fácil de fazer isso é instalar o `serve` globalmente (`npm i -g serve`) e executar o comando `serve` na raiz do projeto.
2.  Abra seu navegador e acesse `http://localhost:3000/tests.html` (ou a porta que seu servidor estiver usando).
3.  Os resultados dos testes serão exibidos na página e detalhados no Console de Ferramentas do Desenvolvedor (F12).

## Como Adicionar Novos Testes

Manter a cobertura de testes é crucial à medida que novas funcionalidades são adicionadas.

### Adicionando um Novo Teste de Lógica

Se você adicionar ou modificar uma função de cálculo em `calculations.js`:

1.  Abra o arquivo `/assets/js/tests/unit.spec.js`.
2.  Adicione um novo bloco `it('deve fazer algo específico', () => { ... });` dentro de uma suíte `describe()` existente ou crie uma nova.
3.  Dentro do teste, chame a função de cálculo com os dados de entrada necessários.
4.  Use `expect(resultado).toBe(valorEsperado)` para validar se a função retorna o resultado correto.

### Adicionando um Novo Teste de Interface

Se você adicionar um novo campo de formulário, uma nova opção, ou uma nova aba na calculadora:

1.  Abra o arquivo `/assets/js/tests/e2e.spec.js`.
2.  Encontre a suíte `describe()` correspondente à aba que você modificou ou crie uma nova.
3.  Adicione um novo teste `it('deve reagir à nova interação do usuário', async () => { ... });`.
4.  **Simule a Ação**: Obtenha o elemento do DOM (`document.getElementById(...)`), altere seu valor (`.value = ...`) ou estado (`.click()`), e dispare o evento apropriado (`.dispatchEvent(new Event('input', { bubbles: true }))`).
5.  **Aguarde a Renderização**: Use `await sleep(350);` para aguardar a conclusão de handlers com debounce.
6.  **Verifique o Resultado**: Obtenha o container de resultados (`document.getElementById(...)`) e use `expect(container.textContent).toContain('Resultado Esperado')` para validar a mudança na UI.

*Nota sobre `data-state`*: Os atributos `data-state` nos elementos do formulário, que ligam o DOM ao objeto de estado JavaScript, são adicionados dinamicamente no carregamento da página pela função `initializeEventListeners()` em `events.js`. Eles não estão presentes no arquivo `index.html` estático.

### Adicionando Novas Verbas Variáveis a uma Calculadora

Para adicionar um novo campo de input (como uma nova média ou um adicional) a uma calculadora, siga o padrão estabelecido:

1.  **State (`assets/js/app/state.js`):** Adicione a nova propriedade ao sub-objeto de estado da calculadora correspondente (ex: `rescisao`). Defina um valor padrão (ex: `0` ou `false`).
2.  **UI (`src/index.html`):** Adicione o novo campo de input (`<input>`, `<select>`, etc.) ao `<form>` apropriado. **Crucialmente**, atribua a ele um `name` que corresponda à chave do estado (em kebab-case). Por exemplo, para a chave de estado `mediaPericulosidade`, o nome deve ser `name="media-periculosidade"`. O script em `events.js` cuidará do resto.
3.  **Cálculo (`assets/js/app/calculations.js`):** Na função de cálculo principal (ex: `calculateRescisao`), desestruture a nova propriedade do objeto de estado e incorpore-a na lógica de cálculo.
4.  **Teste E2E (`assets/js/tests/e2e.spec.js`):** Atualize o teste E2E da calculadora para interagir com o novo campo e afirmar que o resultado final reflete o impacto do novo valor.

## Padrões de UI e UX

A aplicação segue alguns padrões para garantir uma experiência de usuário consistente e de alta qualidade.

### Máscara de Moeda

-   **O quê:** Campos de input monetário formatam o valor em tempo real como moeda (ex: "R$ 1.234,56").
-   **Como:** Adicione a classe `.money-mask` a um elemento `<input type="text">`. A lógica em `events.js` (`initializeEventListeners`) aplicará automaticamente a máscara usando a função `applyCurrencyMask` de `utils.js`.

### Botão "Limpar Formulário"

-   **O quê:** Um botão que restaura um formulário ao seu estado inicial.
-   **Como:** Crie um `<button type="button">` com um ID único (ex: `id="clear-ferias-btn"`). Em `events.js`, adicione um event listener para este botão que chama a função `handleClearForm('ferias')`, passando a chave do estado da calculadora correspondente.

### Detalhes de Cálculo "On-Demand"

-   **O quê:** Um link "(Ver Detalhes)" que exibe uma quebra detalhada de um cálculo de imposto.
-   **Como:**
    1.  Na função de template de resultado em `ui.js` (ex: `createFeriasResultHTML`), certifique-se de que a função de cálculo correspondente (ex: `calculateINSS`) retorna um objeto com uma propriedade `details`.
    2.  Crie um botão com a classe `.details-btn` e um atributo `data-details-for="id-do-div-de-detalhes"`.
    3.  Crie o `div` de detalhes com o `id` correspondente e a classe `hidden`.
    4.  O event listener delegado em `events.js` cuidará de alternar a visibilidade do `div`.
