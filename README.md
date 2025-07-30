# Calculadora de Direitos Trabalhistas

Este projeto é uma calculadora web para estimar verbas trabalhistas brasileiras, como rescisão, remuneração mensal e férias, com base na CLT e legislação aplicável.

## Estrutura do Projeto

O projeto foi refatorado para uma estrutura modular em JavaScript e CSS:

-   **`index.html`**: Página principal da calculadora.
-   **`recursos.html`**: Página com recursos adicionais (documentos, checklists, etc.).
-   **`atualizacoes.html`**: Histórico de atualizações legislativas (conteúdo a verificar).
-   **`certificacao.html`**: Detalhes sobre a validação dos cálculos (conteúdo a verificar).
-   **`css/`**: Contém os arquivos de estilo:
    -   `core.css`: Estilos base, layout, header, footer, variáveis, utilitários comuns.
    -   `calculator.css`: Estilos específicos da interface da calculadora (abas, formulários, resultados, gráficos, comparação).
    -   `recursos.css`: Estilos específicos para a página `recursos.html`.
    -   `style.css`: (Vazio - estilos movidos para os arquivos acima).
-   **`js/`**: Contém os arquivos JavaScript modulares:
    -   `main.js`: Ponto de entrada principal, inicialização da UI, carregamento dinâmico de módulos.
    -   `config.js`: **IMPORTANTE:** Contém constantes legais como `SALARIO_MINIMO` e a lógica/tabelas para cálculo de `INSS` e `IRRF`. **Deve ser atualizado manualmente conforme a legislação muda.**
    -   `calculatorUtils.js`: Funções auxiliares genéricas para cálculos (datas, moeda, etc.).
    -   `uiUtils.js`: Funções auxiliares para manipulação da interface (tabelas, formulários, abas, notificações).
    -   `calculoRescisao.js`, `calculoMensal.js`, `calculoFerias.js`: Módulos com a lógica específica de cada cálculo.
    -   `cenarios.js`: Gerenciamento de salvar, carregar, comparar e excluir cenários (usa `localStorage`).
    -   `pdfGenerator.js`: Lógica para gerar relatórios PDF (usa jsPDF).
    -   `chartGenerator.js`: Lógica para gerar gráficos (usa Chart.js).
    -   `recursos.js`: Lógica específica para a página `recursos.html`.
-   **`Plano_Implementacao.md`**: Documenta o processo de refatoração realizado.
-   **`previews/`**: (Assumido) Pasta contendo arquivos PDF para visualização na página de Recursos.
-   **`calculo-trabalhista/`**: Pasta com conteúdo desconhecido (contém `README.md` e `script.js`).

## Como Usar

1.  Abra o arquivo `index.html` em um navegador web moderno que suporte Módulos ES6 (Chrome, Firefox, Edge, Safari recentes).
2.  Navegue pelas abas para acessar as diferentes calculadoras.
3.  Preencha os formulários com os dados solicitados.
4.  Clique nos botões "Calcular" para ver os resultados.
5.  Use as opções para salvar cenários, comparar, gerar PDF ou visualizar o impacto no orçamento.

## Manutenção Importante: Atualização de Valores Legais

**É crucial manter os valores legais atualizados no arquivo `js/config.js` para garantir a precisão dos cálculos.**

-   **Salário Mínimo:** Atualize a constante `SALARIO_MINIMO`.
-   **Tabelas INSS e IRRF:** Revise e atualize as faixas, alíquotas e deduções dentro das funções `calcularINSS` e `calcularIR` anualmente ou sempre que houver alterações na legislação. Comentários (`!! ATENÇÃO !!`) indicam os locais que necessitam de revisão periódica.

## Dependências Externas

Este projeto utiliza as seguintes bibliotecas carregadas via CDN:

-   Font Awesome (Ícones)
-   Chart.js (Gráficos)
-   jsPDF & jsPDF-AutoTable (Geração de PDF)

Certifique-se de ter uma conexão com a internet para que essas bibliotecas sejam carregadas corretamente.

## Próximos Passos (Sugestões)

-   Implementar validação de entrada mais robusta com feedback visual na UI.
-   Refatorar `legislacaoRefs` para `config.js`.
-   Considerar um build step (Vite, Parcel) para otimizar o carregamento de módulos e dependências em produção.
-   Verificar e integrar o conteúdo das páginas `atualizacoes.html`, `certificacao.html`.
-   Analisar e integrar/remover o conteúdo da pasta `calculo-trabalhista/`.
-   Criar a pasta `previews/` e adicionar os documentos referenciados em `recursos.html`.
