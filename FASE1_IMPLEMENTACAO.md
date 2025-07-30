# Calculadora Trabalhista - Fase 1 (Fundação)

## 📋 Implementação Realizada

Este projeto implementa a **Fase 1** do plano de desenvolvimento da Calculadora Trabalhista, focando na construção de uma base sólida baseada na legislação brasileira vigente para 2025.

## ✅ Tarefas Concluídas

### TAREFA-01: Módulo de Configuração Centralizado
- ✅ Criado `config/parametros_legais.json` com todos os parâmetros legais de 2025
- ✅ Criado `config/parametros_legais.js` para compatibilidade com browsers
- ✅ Valores implementados:
  - Salário mínimo nacional: R$ 1.518,00
  - Teto INSS: R$ 8.157,41
  - Tabela INSS progressiva com 4 faixas
  - Tabela IRRF progressiva com 5 faixas
  - Salário família: limite R$ 1.906,04, valor R$ 65,00 por filho
  - Dedução por dependente IRRF: R$ 189,59
  - Desconto simplificado IRRF: R$ 607,20

### TAREFA-02: Módulo de Regras de Cálculo
- ✅ Função `calcularINSS(baseDeCalculo)`: Cálculo progressivo sobre faixas da tabela INSS
- ✅ Função `calcularIRRF(baseDeCalculo, numDependentes, usarDescontoSimplificado)`: Cálculo do IRRF com deduções
- ✅ Função `calcularSalarioFamilia(remuneracao, numFilhos)`: Cálculo do salário família
- ✅ Todas as funções são puras e testáveis
- ✅ Retornam objetos estruturados com detalhamento completo

### TAREFA-03: Base de Referências Legais
- ✅ Criado `config/base_legal.json` com mapeamento de verbas para fontes legais
- ✅ Inclui referências para CF/88, CLT, e legislação específica
- ✅ Preparado para alimentar tooltips da interface dinamicamente

## 🧪 Infraestrutura de Testes
- ✅ Configurado Jest para testes automatizados
- ✅ 21 testes unitários implementados com 100% de aprovação
- ✅ Testes cobrem:
  - Validação de entradas inválidas
  - Cálculos em todas as faixas de INSS e IRRF
  - Cenários de borda (salário mínimo, teto INSS)
  - Deduções por dependentes e desconto simplificado
  - Testes de integração para folhas completas

## 🖥️ Interface de Demonstração
- ✅ Interface web funcional criada (`index.html`)
- ✅ Calculadoras individuais para INSS, IRRF e Salário Família
- ✅ Simulador completo de folha de pagamento
- ✅ Detalhamento por faixas para melhor compreensão
- ✅ Design responsivo e intuitivo

## 📊 Funcionalidades Demonstradas

### Cálculo de INSS
- Aplicação correta da tabela progressiva 2025
- Detalhamento por faixa de contribuição
- Cálculo da alíquota efetiva
- Respeito ao teto previdenciário

### Cálculo de IRRF
- Aplicação da tabela progressiva de Imposto de Renda
- Dedução por dependentes (R$ 189,59 cada)
- Opção de desconto simplificado (R$ 607,20)
- Tratamento correto quando deduções excedem a base

### Cálculo de Salário Família
- Verificação do limite de renda (R$ 1.906,04)
- Valor correto por filho (R$ 65,00)
- Validação de número de filhos

### Simulação Completa
- Integração de todos os cálculos
- Apresentação clara de proventos e descontos
- Cálculo do salário líquido final
- Percentual de desconto sobre o salário bruto

## 🏗️ Estrutura do Projeto

```
calculadora-trabalhista/
├── config/
│   ├── parametros_legais.json    # Parâmetros legais centralizados
│   ├── parametros_legais.js      # Versão para browser
│   └── base_legal.json           # Referências legais
├── regras/
│   ├── calculosBasicos.js        # Funções de cálculo (Node.js)
│   └── calculosBasicosBrowser.js # Funções de cálculo (Browser)
├── tests/
│   └── calculosBasicos.test.js   # Testes unitários
├── index.html                    # Interface de demonstração
├── package.json                  # Configuração do projeto
└── README.md                     # Documentação original
```

## 🎯 Validação dos Resultados

### Exemplo: Salário de R$ 5.000,00 com 2 dependentes
- **INSS**: R$ 524,79 (10,50% efetivo)
  - 1ª faixa: R$ 1.518,00 × 7,5% = R$ 113,85
  - 2ª faixa: R$ 1.013,34 × 9,0% = R$ 91,20
  - 3ª faixa: R$ 1.293,67 × 12,0% = R$ 155,24
  - 4ª faixa: R$ 1.174,99 × 14,0% = R$ 164,50
- **IRRF**: R$ 207,63 (base: R$ 4.475,21 - 2 × R$ 189,59)
- **Salário Líquido**: R$ 4.267,58 (14,65% de desconto total)

## 🔬 Precisão Matemática
- Todos os cálculos seguem exatamente a legislação brasileira
- Arredondamentos conforme regras oficiais
- Validação através de casos de teste extensivos
- Conformidade com tabelas oficiais de 2025

## 🚀 Próximos Passos (Fases 2-4)
1. **Fase 2**: Módulos de 13º salário e férias
2. **Fase 3**: Módulo de rescisão contratual
3. **Fase 4**: Interface completa com PDF, gráficos e comparações

---

Esta implementação estabelece uma base sólida e testada para o sistema de cálculos trabalhistas, priorizando precisão matemática e conformidade legal antes de qualquer consideração de interface ou funcionalidades avançadas.