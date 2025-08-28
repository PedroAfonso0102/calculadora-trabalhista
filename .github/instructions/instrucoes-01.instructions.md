applyTo: '**'
Diretrizes de Desenvolvimento: Um Guia para Colaboração
Este documento é o nosso mapa. Ele define a nossa filosofia, a arquitetura da aplicação e a melhor forma de trabalharmos juntos para construir um software de alta qualidade.

1. A Nossa Filosofia: Simples, Robusto e Focado no Utilizador
Construímos software para pessoas. A nossa abordagem assenta em três pilares:

Simplicidade e Clareza: Escrevemos código que é fácil de ler e manter. Se uma solução é complexa, provavelmente não é a solução certa.

Robustez e Precisão: A nossa lógica de cálculo é o núcleo da aplicação. Tem de ser exata, testável e completamente fiável. Não há margem para erros.

Foco no Utilizador: A interface deve ser intuitiva e responsiva. O utilizador deve sentir-se no controlo, recebendo feedback claro a cada passo.

2. Como a Aplicação "Pensa": O Fluxo de Dados
Para entender a nossa arquitetura, pense no ciclo de vida de uma interação do utilizador. É um fluxo lógico e unidirecional.

O Utilizador Interage (events.js): Tudo começa aqui. Um clique, uma tecla pressionada. events.js é o nosso "controlador", capturando estas ações. A sua única missão é traduzir a intenção do utilizador numa atualização de estado.

O Estado é Atualizado (state.js): events.js chama uma função para atualizar o nosso "cérebro": o objeto state em state.js. Este ficheiro é a fonte única da verdade. Todos os dados que definem o estado atual da aplicação vivem aqui e em mais lado nenhum.

A Interface Reage e é Desenhada (ui.js): A atualização do estado aciona uma nova renderização. ui.js lê o estado atual e os resultados dos cálculos para desenhar a interface no ecrã. É o nosso "artista visual" — não toma decisões, apenas representa visualmente o estado atual.

A Lógica é Executada (calculations.js): Quando a UI precisa de exibir um resultado, ela invoca as funções de calculations.js. Este é o nosso "motor de cálculo". As funções aqui são puras: recebem dados, fazem contas e devolvem um resultado, sem nunca tocar no DOM ou modificar o estado global.

Módulos de Suporte:

config.js: O nosso "livro de regras". Contém todas as constantes legais (tabelas de impostos, alíquotas). É a fonte da verdade para a lógica de negócio.

storage.js: O guardião da memória. A única parte do código autorizada a falar com o localStorage.

utils.js: A nossa caixa de ferramentas, com funções genéricas que podem ser usadas em qualquer lado.

3. Os Nossos Princípios de Código
Escreva código que você, ou outra pessoa, gostaria de receber e manter no futuro.

DRY (Don't Repeat Yourself): Se está a escrever o mesmo código mais do que uma vez, pare. Extraia-o para uma função reutilizável. Isto aplica-se a templates de HTML, lógica de cálculo e estruturas de dados.

Cada Módulo no seu Quadrado: Mantenha as responsabilidades separadas. ui.js não deve fazer cálculos. calculations.js não deve tocar no DOM. events.js não deve gerar HTML. Esta disciplina torna o código mais fácil de depurar e testar.

Antecipe os Problemas: O código deve ser robusto. Uma falha no carregamento de dados não deve quebrar a aplicação inteira; deve mostrar uma mensagem de erro amigável. Dados inválidos do localStorage devem ser tratados graciosamente.

4. Trabalhando Comigo: O Modelo de Colaboração
Pense em mim como um parceiro de programação extremamente rápido e lógico. Para obtermos os melhores resultados, a comunicação tem de ser clara e estruturada.

4.1. Decomponha o Problema (Pensamento Sequencial)
Não me peça para "resolver um problema complexo". Em vez disso, guie-me através dos passos lógicos para chegar à solução.

❌ Exemplo Ruim: "Refatora a UI para ser mais eficiente."

✅ Exemplo Bom:

"Analisa ui.js e identifica o padrão de HTML que se repete nos cards de resultado."

"Cria uma nova função criarCardDeResultado que aceite titulo e conteudoHTML como argumentos e devolva essa estrutura HTML."

"Reescreve a função criarResultadoDeFériasHTML para usar a nova função criarCardDeResultado."

4.2. Seja Específico e Dê Contexto
Quanto mais preciso for o seu pedido, melhor será o meu resultado. Diga-me o quê, o onde e o como.

Ficheiro e Função: "No ficheiro calculations.js, na função calcularINSS..."

Seletores e Valores: "Usa o seletor de ID #salario-bruto-liquido e preenche-o com o valor 5000.00."

Resultado Esperado: "Verifica se o elemento com a classe .total-liquido contém o texto R$ 4.257,55."

Ao seguir estes princípios, transformamos tarefas complexas, como criar testes de automação com Playwright, num processo simples e iterativo. Você fornece a estratégia passo a passo, e eu encarrego-me da implementação.