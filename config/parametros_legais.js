// Parâmetros legais para 2025
export const parametrosLegais = {
  "ano": 2025,
  "salario_minimo_nacional": 1518.00,
  "teto_inss": 8157.41,
  "salario_familia": {
    "limite_remuneracao": 1906.04,
    "valor_cota": 65.00
  },
  "tabela_inss": [
    {
      "limite": 1518.00,
      "aliquota": 0.075,
      "descricao": "Até 1 salário mínimo"
    },
    {
      "limite": 2531.34,
      "aliquota": 0.09,
      "descricao": "De R$ 1.518,01 até R$ 2.531,34"
    },
    {
      "limite": 3825.01,
      "aliquota": 0.12,
      "descricao": "De R$ 2.531,35 até R$ 3.825,01"
    },
    {
      "limite": 8157.41,
      "aliquota": 0.14,
      "descricao": "De R$ 3.825,02 até R$ 8.157,41"
    }
  ],
  "tabela_irrf": [
    {
      "limite": 2428.80,
      "aliquota": 0.00,
      "deducao": 0.00,
      "descricao": "Até R$ 2.428,80"
    },
    {
      "limite": 3040.92,
      "aliquota": 0.075,
      "deducao": 182.16,
      "descricao": "De R$ 2.428,81 até R$ 3.040,92"
    },
    {
      "limite": 4050.56,
      "aliquota": 0.15,
      "deducao": 410.23,
      "descricao": "De R$ 3.040,93 até R$ 4.050,56"
    },
    {
      "limite": 4787.29,
      "aliquota": 0.225,
      "deducao": 713.98,
      "descricao": "De R$ 4.050,57 até R$ 4.787,29"
    },
    {
      "limite": 999999999,
      "aliquota": 0.275,
      "deducao": 953.36,
      "descricao": "Acima de R$ 4.787,29"
    }
  ],
  "deducao_dependente_irrf": 189.59,
  "desconto_simplificado_irrf": 607.20,
  "fgts": {
    "aliquota": 0.08,
    "multa_sem_justa_causa": 0.40,
    "multa_acordo": 0.20
  },
  "ferias": {
    "adicional_constitucional": 0.3333333333,
    "dias_por_periodo": 30
  },
  "aviso_previo": {
    "dias_base": 30,
    "dias_adicionais_por_ano": 3,
    "limite_anos": 20
  }
};