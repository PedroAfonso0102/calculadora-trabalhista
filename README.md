
Recriando o Framework: Calculadora Trabalhista

Nosso objetivo agora é construir um novo sistema, com uma fundação sólida baseada na legislação. A análise a seguir, extraída dos seus documentos, servirá como a "especificação funcional" para os módulos de cálculo e a base de conhecimento do sistema.
Vou organizar o novo plano de ação em pilares que refletem uma construção "do alicerce para o telhado".

Pilar 1: Base de Conhecimento e Parâmetros Legais (O Cérebro do Sistema)

Esta é a nossa prioridade máxima. Antes de escrever qualquer linha de código de cálculo, precisamos estruturar os dados e as regras. O erro do config.js no projeto anterior não se repetirá.
Análise dos Documentos e Definição das Regras:
Fonte Principal de Direitos: Constituição Federal (CF/88) 1, Consolidação das Leis do Trabalho (CLT) 2e a Lei da Reforma Trabalhista (Lei 13.467/2017)3.


Fonte Principal de Valores e Alíquotas (para 2025): Portaria Interministerial MPS/MF Nº 6/2025 4e as Tabelas de Salário Mínimo, INSS, Salário-Família e IRF5555555555555555.


Fonte Específica de Regras (13º Salário): Documento "DÉCIMO TERCEIRO (13º) SALÁRIO"6.


Backlog de Tarefas - Fundação:
[TAREFA-01 | Prioridade Crítica] Estruturar Módulo de Configuração Centralizado (config/parametros_legais.json):
O que fazer: Criar um arquivo JSON (ou similar) que conterá todas as constantes e tabelas, tornando a atualização anual um processo simples de edição de dados, não de código. Com base nos documentos, este arquivo deve conter:
salario_minimo_nacional_2025: R$ 1.518,00777.


teto_inss_2025: R$ 8.157,418.


salario_familia_2025: { "limite_remuneracao": 1906.04, "valor_cota": 65.00 }999.


tabela_inss_2025: Um array de objetos, cada um com limite e aliquota. Ex:
[{ "limite": 1518.00, "aliquota": 0.075 }, ...]10101010.


tabela_irrf_2025: Um array de objetos, cada um com limite, aliquota e parcela_deduzir. Ex:
[{ "limite": 2428.80, "aliquota": 0.00, "deducao": 0.00 }, ...]11.


deducao_dependente_irrf_2025: 189,591212.


desconto_simplificado_irrf_2025: 607,2013.


[TAREFA-02 | Prioridade Altíssima] Criar Módulo de Regras de Cálculo (/regras):
O que fazer: Desenvolver funções puras e testáveis que consomem os dados da TAREFA-01.
calcularINSS(baseDeCalculo): Implementa a lógica de cálculo progressivo sobre as faixas da tabela INSS14.


calcularIRRF(baseDeCalculo, numDependentes): Implementa o cálculo do IRRF, aplicando as deduções por dependente e oferecendo a opção de desconto simplificado15151515.


[TAREFA-03 | Prioridade Alta] Estruturar a Base de Referências Legais (/config/base_legal.json):
O que fazer: Criar um mapa (objeto JSON) que associa cada verba à sua fonte legal. Isso alimentará os tooltips da interface de forma dinâmica e confiável.
"decimo_terceiro": "Art. 7º, VIII, CF/88"16.


"ferias_terco": "Art. 7º, XVII, CF/88"17.


"adicional_noturno": "Art. 7º, IX, CF/88 e Art. 73, CLT"18181818.


E assim por diante, para todas as verbas.

Pilar 2: Arquitetura dos Módulos de Cálculo (O Motor do Sistema)

Com a base de regras estabelecida e testada, podemos construir os módulos de cálculo que a utilizam. Cada módulo deve ser uma unidade independente que recebe os dados do usuário e retorna um resultado estruturado.
Módulo de Cálculo
Entradas de Dados (Inputs)
Lógica e Dependências Legais (Processamento)
Saídas Estruturadas (Outputs)
Remuneração Mensal
Salário Bruto, Dependentes, Outros Descontos
Chama calcularINSS() e calcularIRRF() da TAREFA-02. Calcula o Salário-Família com base nos parâmetros da TAREFA-0119.


Salário Líquido, Detalhamento de Proventos e Descontos.
Férias
Salário Bruto, Datas, Nº de faltas, Abono Pecuniário (S/N)
Calcula dias de direito com base nas faltas (CLT, Art. 130)20. Calcula adicional de 1/3 (CF/88, Art. 7º, XVII)21. Calcula abono (CLT, Art. 143)22. Chama


calcularINSS() e calcularIRRF() sobre o total.
Valor Bruto, 1/3, Abono, Descontos, Líquido.
13º Salário
Salário Bruto, Meses Trabalhados, Data Admissão/Demissão
Calcula proporcionalidade (1/12 por mês ou fração >= 15 dias)23. A base de cálculo deve incluir verbas variáveis como horas extras, adicional noturno, insalubridade, etc24242424. A 1ª parcela não tem INSS/IRRF25252525. A 2ª parcela tem desconto sobre o valor total.


Valor Bruto, 1ª e 2ª Parcelas, Descontos, Líquido.
Rescisão Contratual
Datas, Salário, Motivo, Aviso Prévio, Férias Vencidas, etc.
Orquestrador: Chama os módulos de Férias e 13º. Calcula Saldo Salarial. Calcula Aviso Prévio (CLT, Art. 487)26. Calcula Multa FGTS (40% ou 20%). Aplica descontos legais.


Verbas Rescisórias detalhadas, Total Bruto, Descontos, Total Líquido.


Pilar 3 e 4: Interface, Serviços, Infraestrutura e Testes

Esses pilares são a materialização dos cálculos para o usuário e a garantia de qualidade do sistema.
Interface (UI/UX): Focada em formulários dinâmicos que coletam as "Entradas de Dados" de cada módulo e uma área de resultados que exibe as "Saídas Estruturadas" em tabelas claras. Os tooltips devem ser preenchidos dinamicamente a partir da TAREFA-03.
Serviços: Geração de PDF, salvamento e comparação de cenários continuam sendo objetivos, mas serão construídos sobre a nova base de cálculos, garantindo que os relatórios sejam precisos.
Infraestrutura e Testes:
Controle de Versão (Git): Essencial desde o primeiro dia.
Testes Automatizados (Prioridade Crítica): Esta é a maior mudança de paradigma em relação ao projeto anterior.
Testes Unitários: Para cada regra da TAREFA-02 (ex: calcularINSS), criar testes com valores de borda (salário mínimo, teto, virada de faixa) para garantir a precisão matemática com base nas tabelas legais.
Testes de Integração: Para cada módulo do Pilar 2, criar testes que simulam o preenchimento de um formulário e validam se o resultado final (líquido) está correto após a aplicação de todas as regras.

Próximos Passos e Plano de Ação Sugerido (Revisado)

Proponho um plano de ação focado em construir a base de forma sólida antes de pensar na interface. Usaremos um modelo de fases sequenciais para garantir a qualidade em cada etapa.
Fase 1: A Fundação - Base de Conhecimento e Regras (1-2 semanas)
Meta: Criar um "motor" de cálculo legal, sem interface, mas 100% testado e preciso.
Tarefas:
Estruturar o projeto (pastas, Git, framework de testes como Jest/Vitest).
Implementar a TAREFA-01 (Módulo de Configuração Centralizado com os dados de 2025).
Implementar a TAREFA-02 (Módulo de Regras de Cálculo para INSS e IRRF).
Escrever testes unitários exaustivos para cada função da TAREFA-02.
Fase 2: Os Pilares - Módulos de Cálculo Essenciais (2-3 semanas)
Meta: Ter os principais cálculos individuais funcionando de forma independente.
Tarefas:
Desenvolver o módulo de 13º Salário, consumindo as regras da Fase 1.
Desenvolver o módulo de Férias, consumindo as regras da Fase 1.
Escrever testes de integração para ambos, validando o cálculo completo (bruto, descontos e líquido).
Fase 3: A Estrutura Principal - Módulo de Rescisão e Lógica Complexa (2 semanas)
Meta: Ter a lógica de negócio mais complexa finalizada e testada.
Tarefas:
Desenvolver o módulo de Rescisão Contratual, que irá orquestrar e chamar os módulos da Fase 2.
Implementar as diferentes lógicas para cada tipo de rescisão (sem justa causa, pedido de demissão, acordo, etc.).
Escrever testes de integração para cenários de rescisão complexos.
Fase 4: A Fachada - Interface e Serviços ao Usuário (3 semanas)
Meta: Construir a interface que consumirá o motor de cálculo e entregar as funcionalidades ao usuário.
Tarefas:
Desenvolver os componentes de formulário e tabelas de resultado.
Integrar a interface com os módulos de cálculo desenvolvidos nas fases anteriores.
Implementar a geração de PDF, salvamento e comparação de cenários.
Implementar a TAREFA-03 (Base de Referências Legais) para alimentar os tooltips.
Este plano garante que a lógica de negócio, a parte mais crítica e sensível a erros, seja construída e validada de forma isolada, antes de nos preocuparmos com a apresentação visual.
Por qual fase gostaria de começar a detalhar? Sugiro iniciarmos pela Fase 1, definindo a estrutura de pastas e o esquema exato do arquivo parametros_legais.json.

Calculadora de Direitos Trabalhistas
Este projeto é uma calculadora web para estimar verbas trabalhistas brasileiras, como rescisão, remuneração mensal e férias, com base na CLT e legislação aplicável.
Estrutura do Projeto
O projeto foi refatorado para uma estrutura modular em JavaScript e CSS:

index.html: Página principal da calculadora.
recursos.html: Página com recursos adicionais (documentos, checklists, etc.).
atualizacoes.html: Histórico de atualizações legislativas (conteúdo a verificar).
certificacao.html: Detalhes sobre a validação dos cálculos (conteúdo a verificar).
css/: Contém os arquivos de estilo:
core.css: Estilos base, layout, header, footer, variáveis, utilitários comuns.
calculator.css: Estilos específicos da interface da calculadora (abas, formulários, resultados, gráficos, comparação).
js/: Contém os arquivos JavaScript modulares:
main.js: Ponto de entrada principal, inicialização da UI, carregamento dinâmico de módulos.
config.js: IMPORTANTE: Contém constantes legais como SALARIO_MINIMO e a lógica/tabelas para cálculo de INSS e IRRF. Deve ser atualizado manualmente conforme a legislação muda.
calculatorUtils.js: Funções auxiliares genéricas para cálculos (datas, moeda, etc.).
uiUtils.js: Funções auxiliares para manipulação da interface (tabelas, formulários, abas, notificações).
calculoRescisao.js, calculoMensal.js, calculoFerias.js: Módulos com a lógica específica de cada cálculo.
cenarios.js: Gerenciamento de salvar, carregar, comparar e excluir cenários (usa localStorage).
pdfGenerator.js: Lógica para gerar relatórios PDF (usa jsPDF).
chartGenerator.js: Lógica para gerar gráficos (usa Chart.js).
recursos.js: Lógica específica para a página recursos.html.
Plano_Implementacao.md: Documenta o processo de refatoração realizado.
previews/: (Assumido) Pasta contendo arquivos PDF para visualização na página de Recursos.
calculo-trabalhista/: Pasta com conteúdo desconhecido (contém README.md e script.js).
Como Usar
Abra o arquivo index.html em um navegador web moderno que suporte Módulos ES6 (Chrome, Firefox, Edge, Safari recentes).
Navegue pelas abas para acessar as diferentes calculadoras.
Preencha os formulários com os dados solicitados.
Clique nos botões "Calcular" para ver os resultados.
Use as opções para salvar cenários, comparar, gerar PDF ou visualizar o impacto no orçamento.
Dependências Externas
Este projeto utiliza as seguintes bibliotecas carregadas via CDN:

Font Awesome (Ícones)
Chart.js (Gráficos)
jsPDF & jsPDF-AutoTable (Geração de PDF)

Certifique-se de ter uma conexão com a internet para que essas bibliotecas sejam carregadas corretamente.
Próximos Passos (Sugestões)
Implementar validação de entrada mais robusta com feedback visual na UI.
Refatorar legislacaoRefs para config.js.
Considerar um build step (Vite, Parcel) para otimizar o carregamento de módulos e dependências em produção.


