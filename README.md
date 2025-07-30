
# Calculadora Trabalhista v1.0

Uma ferramenta completa para cálculo de direitos trabalhistas brasileiros, desenvolvida com base na legislação vigente de 2025. Esta não é apenas uma calculadora, mas uma plataforma educativa que empodera trabalhadores com informações precisas e confiáveis sobre seus direitos.

## 🎯 Visão do Produto

**Missão**: Traduzir a complexidade da legislação trabalhista em uma interface clara, intuitiva e confiável, permitindo que qualquer trabalhador compreenda seus direitos e os valores que lhe são devidos.

**Valores**:
- **Confiável e Precisa**: Baseada 100% na legislação vigente
- **Educativa e Clara**: Linguagem simples com tooltips explicativos
- **Profissional e Moderna**: Design limpo e objetivo
- **Humana e Acessível**: Projetada para todos os níveis de instrução

## ✨ Funcionalidades

### Módulos de Cálculo
- **🤝 Rescisão Contratual**: Cálculo completo para todos os tipos de rescisão
- **🏖️ Férias**: Estimativa com terço constitucional e abono pecuniário
- **💰 Salário Líquido**: Cálculo mensal com descontos de INSS e IRRF
- **🎁 13º Salário**: Primeira e segunda parcelas com descontos corretos

### Recursos Avançados
- **📚 Tooltips Educativos**: Explicações legais para cada verba
- **📄 Geração de PDF**: Relatórios profissionais e detalhados
- **💾 Gerenciamento de Cenários**: Salvar, carregar e comparar simulações
- **🔍 Validação Inteligente**: Prevenção de erros e dados inconsistentes

## 🏗️ Arquitetura

O projeto segue os princípios de **Separação de Responsabilidades** e **Test-Driven Development**:

```
/
├── index.html                   # Interface principal SPA
├── css/
│   └── style.css               # Design responsivo e profissional
├── js/
│   ├── main.js                 # Orquestrador principal
│   ├── core/                   # Engine de cálculo (lógica pura)
│   │   ├── regrasGerais.js     # INSS, IRRF, proporcionalidades
│   │   ├── calculoSalario.js   # Salário líquido mensal
│   │   ├── calculoFerias.js    # Férias e abono pecuniário
│   │   ├── calculoDecimo.js    # 13º salário (1ª e 2ª parcelas)
│   │   └── calculoRescisao.js  # Rescisão (orquestrador)
│   └── ui/                     # Camada de interface
│       ├── uiManager.js        # Renderização e DOM
│       └── pdfGenerator.js     # Geração de relatórios
├── config/                     # Configuração centralizada
│   ├── parametrosLegais.js     # Valores e tabelas legais 2025
│   └── baseLegal.js           # Referências e explicações
└── tests/                     # Suíte de testes
    ├── index.html             # Interface de testes
    └── core/
        └── regrasGerais.test.js # Testes unitários e integração
```

## 🚀 Como Usar

### Instalação
1. Clone o repositório:
```bash
git clone https://github.com/PedroAfonso0102/calculadora-trabalhista.git
cd calculadora-trabalhista
```

2. Abra `index.html` em um navegador moderno (Chrome, Firefox, Edge, Safari)

### Operação
1. **Selecione o tipo de cálculo** nas abas superiores
2. **Preencha os dados** nos formulários (use os ícones ℹ️ para explicações)
3. **Clique em Calcular** para ver os resultados detalhados
4. **Salve cenários** para comparações futuras
5. **Exporte PDF** para relatórios profissionais

### Validação e Testes
Execute os testes abrindo `tests/index.html` no navegador para verificar a precisão dos cálculos.

## 🔧 Configuração Legal

### Atualização Anual
Para atualizar os valores legais (novo ano), edite apenas o arquivo `config/parametrosLegais.js`:

```javascript
const PARAMETROS_LEGAIS_2025 = {
  salarioMinimo: 1518.00,           // Novo valor do salário mínimo
  tetoINSS: 8157.41,               // Novo teto do INSS
  tabelaINSS: [...],               // Nova tabela progressiva
  tabelaIRRF: [...],               // Nova tabela de IR
  // ... outros parâmetros
};
```

### Valores Atuais (2025)
- **Salário Mínimo**: R$ 1.518,00
- **Teto INSS**: R$ 8.157,41
- **Salário-Família**: R$ 65,00 (limite R$ 1.906,04)
- **Dedução Dependente IRRF**: R$ 189,59

## 🧪 Testes

O projeto inclui uma suíte completa de testes que valida:

- ✅ Cálculos de INSS progressivo
- ✅ Cálculos de IRRF com dependentes
- ✅ Módulos individuais (salário, férias, 13º)
- ✅ Rescisão para todos os cenários
- ✅ Integração entre módulos

**Executar testes**: Abra `tests/index.html` no navegador

## 🎨 Design e UX

- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Acessível**: Cores contrastantes e navegação por teclado
- **Intuitivo**: Fluxo natural de preenchimento e validação
- **Profissional**: Visual limpo adequado ao contexto trabalhista

## 📋 Tipos de Rescisão Suportados

1. **Dispensa sem Justa Causa**: Todas as verbas + multa 40% FGTS + seguro-desemprego
2. **Pedido de Demissão**: Verbas básicas + desconto aviso prévio (se aplicável)
3. **Acordo (Consensual)**: Aviso prévio 50% + multa 20% FGTS + saque 80%
4. **Dispensa por Justa Causa**: Apenas saldo + férias vencidas (se houver)
5. **Término de Contrato**: Verbas básicas + saque FGTS (sem multa)

## 📖 Base Legal

Toda a aplicação é fundamentada em:
- **Constituição Federal/88** (Arts. 7º e relacionados)
- **CLT** (Consolidação das Leis do Trabalho)
- **Lei 13.467/2017** (Reforma Trabalhista)
- **Portarias MPS/MF 2025** (Valores atualizados)

## ⚠️ Disclaimer

Esta ferramenta é para fins **educativos e informativos**. Os cálculos são baseados na legislação vigente, mas cada situação pode ter particularidades. **Sempre consulte um profissional especializado** para orientações específicas sobre sua situação trabalhista.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:
1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Adicione testes para novas funcionalidades
4. Submeta um pull request

## 📞 Suporte

Para dúvidas, sugestões ou relato de bugs, abra uma [issue](https://github.com/PedroAfonso0102/calculadora-trabalhista/issues) no GitHub.

---

**Desenvolvido com 💙 para empoderar trabalhadores brasileiros**


