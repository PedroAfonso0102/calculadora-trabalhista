# Calculadora Trabalhista

Uma ferramenta online, gratuita e de código aberto para simular e calcular verbas trabalhistas brasileiras (férias, salário líquido, rescisão, etc.). O objetivo é transformar cálculos complexos em uma experiência clara, intuitiva e educativa.

> Nota 1: este repositório contém os arquivos estáticos da aplicação. Abra `index.html` no seu navegador para ver a calculadora.

> Nota 2: page preview no link _https://pedroafonso0102.github.io/calculadora-trabalhista/_

## Funcionalidades principais

- Cálculos de férias, 13º salário, rescisão e salário líquido
- Simulador de salário líquido a partir do bruto
- Cálculos detalhados de impostos (INSS, IRRF) com memória de cálculo
- Visualização da composição do salário (gráficos)
- Exportação de relatórios em PDF
- Salvamento local de dados (localStorage)

## Interface e usabilidade

- Campos agrupados por seções (ex.: "Remuneração Base", "Informações da Rescisão")
- Seções avançadas recolhíveis para manter a interface limpa
- Tooltips e explicações legais junto aos termos técnicos
- Regras de negócio aplicadas na interface (ex.: não acumular periculosidade e insalubridade)

## Tecnologias

- HTML5
- CSS3 (estilos do projeto; TailwindCSS mencionado no projeto)
- JavaScript (Vanilla JS)

Os arquivos principais de código-fonte estão em `assets/js/app/`.

## Como executar

Opções rápidas:

1. Abrir localmente

	 - Basta abrir o arquivo `index.html` no seu navegador.

2. Servir localmente (Node.js)

	 - Se você quiser servir via um servidor local e o projeto tiver scripts, execute:

		 npm install; npm run start

	 - Se não houver um script `start`, você pode usar um servidor estático simples, por exemplo `npx serve`.

## Estrutura do repositório

- `index.html` — página principal
- `assets/` — CSS e JS
- `assets/js/app/` — lógica da aplicação (ex.: `calculations.js`, `ui.js`, `main.js`)
- `data/` — textos legais e dados JSON

## Contribuições

Contribuições são bem-vindas. Para melhorias pequenas: abra uma issue descrevendo a sugestão ou submeta um pull request com testes/descrição das alterações.

## Licença

Consulte a licença do repositório (arquivo `LICENSE`) ou adicione uma licença apropriada se necessário.

---


README formatado e organizado para facilitar leitura e uso da calculadora.

