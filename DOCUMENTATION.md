# 📊 Calculadora Trabalhista v1.0

Uma ferramenta completa e confiável para cálculos trabalhistas brasileiros, desenvolvida com foco na precisão, educação e empoderamento dos trabalhadores.

## 🎯 Visão Geral

A Calculadora Trabalhista é uma Single-Page Application (SPA) que traduz a complexidade da legislação trabalhista brasileira em uma interface clara e intuitiva. Oferece cálculos precisos baseados na CLT e legislação vigente, com tooltips educativos que explicam cada direito trabalhista.

## ⚡ Funcionalidades Principais

### 📱 Módulos de Cálculo
- **💰 Salário Líquido**: Cálculo mensal com INSS, IRRF e salário família
- **🏖️ Férias**: Cálculo completo incluindo terço constitucional e abono pecuniário  
- **🎄 13º Salário**: Primeira e segunda parcelas com descontos corretos
- **📋 Rescisão Trabalhista**: Todos os tipos de rescisão conforme CLT

### 🎓 Recursos Educativos
- **Tooltips Explicativos**: Base legal e explicação de cada verba
- **Relatórios Detalhados**: Demonstrativos profissionais em PDF
- **Validação Inteligente**: Alertas e orientações em tempo real

### 🔧 Recursos Técnicos
- **Arquitetura Modular**: Separação clara entre cálculo, UI e configuração
- **Base Legal Centralizada**: Parâmetros atualizados para 2024
- **Testes Automatizados**: Cobertura completa das funções de cálculo
- **Design Responsivo**: Interface adaptável para todos os dispositivos

## 🏗️ Arquitetura do Projeto

```
/
├── index.html                 # Interface principal
├── css/
│   └── style.css             # Estilos da aplicação
├── js/
│   ├── main.js               # Orquestrador principal
│   ├── ui/
│   │   ├── uiManager.js      # Gerenciamento da interface
│   │   └── pdfGenerator.js   # Geração de relatórios
│   └── core/                 # Engine de cálculo
│       ├── regrasGerais.js   # Funções base (INSS, IRRF)
│       ├── calculoSalario.js # Cálculo de salário
│       ├── calculoFerias.js  # Cálculo de férias
│       ├── calculo13.js      # Cálculo de 13º salário
│       └── calculoRescisao.js # Cálculo de rescisão
├── config/
│   ├── parametrosLegais.js   # Constantes legais (CRÍTICO)
│   └── baseLegal.js          # Explicações e tooltips
└── tests/
    └── core/
        └── regrasGerais.test.js # Testes unitários
```

## 🚀 Como Executar

### Desenvolvimento Local

1. **Clone o repositório**
```bash
git clone https://github.com/PedroAfonso0102/calculadora-trabalhista.git
cd calculadora-trabalhista
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute os testes**
```bash
npm test
```

4. **Inicie o servidor local**
```bash
npm run serve
# Ou simplesmente abra index.html em um navegador moderno
```

### Produção

A aplicação é uma SPA que pode ser servida por qualquer servidor web estático:

```bash
# Exemplo com Python
python3 -m http.server 8000

# Exemplo com Node.js
npx serve .

# Ou deploy direto em GitHub Pages, Netlify, Vercel, etc.
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar testes com watch mode
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

## 📊 Base Legal e Parâmetros

### Valores 2024 (atualizados)
- **Salário Mínimo**: R$ 1.412,00
- **Teto INSS**: R$ 7.786,02
- **Dedução por Dependente IRRF**: R$ 189,59
- **Salário Família**: R$ 62,04 (até R$ 1.819,26)

### Legislação Base
- **CLT** - Consolidação das Leis do Trabalho
- **CF/88** - Constituição Federal de 1988
- **Lei 8.212/1991** - Contribuições previdenciárias
- **Lei 7.713/1988** - Imposto de Renda
- **Lei 13.467/2017** - Reforma Trabalhista

## 🔄 Atualização Anual

A calculadora foi projetada para facilitar atualizações anuais:

1. **Edite apenas** `config/parametrosLegais.js`
2. **Atualize** as tabelas de INSS e IRRF
3. **Modifique** valores como salário mínimo e teto INSS
4. **Execute** os testes para validar

```javascript
// Exemplo de atualização para 2025
export const VALORES_BASE_2025 = {
    SALARIO_MINIMO: 1500.00,  // Novo valor
    TETO_INSS: 8000.00,       // Novo teto
    // ... outros valores
};
```

## 🎨 Personalização

### Temas e Cores
Edite as variáveis CSS em `css/style.css`:

```css
:root {
    --primary-color: #2c5aa0;    /* Cor principal */
    --secondary-color: #28a745;  /* Cor secundária */
    --success-color: #28a745;    /* Cor de sucesso */
    /* ... outras variáveis */
}
```

### Adicionar Novos Módulos

1. **Crie** o arquivo de cálculo em `js/core/`
2. **Implemente** as funções seguindo o padrão existente
3. **Adicione** testes em `tests/core/`
4. **Crie** formulário e resultado no `index.html`
5. **Integre** no `js/main.js`

## 🐛 Troubleshooting

### Problemas Comuns

**Erro: "Cannot find module"**
```bash
# Verifique se está usando um servidor web
# Módulos ES6 requerem protocolo HTTP/HTTPS
npm run serve
```

**Testes falhando**
```bash
# Verifique a versão do Node.js
node --version  # Requer Node.js 14+

# Reinstale dependências
rm -rf node_modules package-lock.json
npm install
```

**Cálculos incorretos**
- Verifique os parâmetros em `config/parametrosLegais.js`
- Compare com a legislação vigente
- Execute os testes específicos

## 🤝 Contribuição

### Como Contribuir

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. **Implemente** seguindo os padrões existentes
4. **Adicione** testes para novas funcionalidades
5. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
6. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
7. **Abra** um Pull Request

### Padrões de Código

- **ESLint** configurado para consistência
- **Comentários JSDoc** obrigatórios em funções públicas
- **Separação de responsabilidades** rigorosa
- **Testes unitários** para lógica de negócio

## 📝 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

## ⚠️ Aviso Legal

Esta ferramenta tem caráter **meramente informativo** e não substitui:
- Cálculos oficiais da empresa
- Orientação de profissionais especializados
- Consulta à legislação atualizada

Os desenvolvedores não se responsabilizam por decisões baseadas nos cálculos desta ferramenta.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/PedroAfonso0102/calculadora-trabalhista/issues)
- **Documentação**: Este README e comentários no código
- **Atualizações**: Acompanhe as releases para novidades

---

**Desenvolvido com ❤️ para empoderar trabalhadores brasileiros através do conhecimento.**