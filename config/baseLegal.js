/**
 * Base Legal - Referências e Explicações
 * 
 * Este arquivo contém as explicações e bases legais de cada verba trabalhista.
 * Alimenta o sistema de tooltips educativos da interface.
 */

const BASE_LEGAL = {
  salario_bruto: {
    titulo: "Salário Bruto",
    explicacao: "Valor total da remuneração antes dos descontos legais. Inclui salário base, horas extras, adicionais e demais verbas salariais.",
    baseLegal: "CLT, Art. 457 e 458"
  },
  
  data_admissao: {
    titulo: "Data de Admissão",
    explicacao: "Data de início do contrato de trabalho. Fundamental para calcular tempo de serviço e proporcionalidades.",
    baseLegal: "CLT, Art. 29"
  },
  
  data_saida: {
    titulo: "Data de Saída",
    explicacao: "Data de término do contrato de trabalho. Utilizada para calcular verbas rescisórias e projeções.",
    baseLegal: "CLT, Art. 477"
  },
  
  motivo_rescisao: {
    titulo: "Motivo da Rescisão",
    explicacao: "Causa do término do contrato que determina quais verbas serão devidas ao trabalhador.",
    baseLegal: "CLT, Art. 477 a 486"
  },
  
  aviso_previo: {
    titulo: "Aviso Prévio",
    explicacao: "Comunicação antecipada sobre o término do contrato. Pode ser trabalhado ou indenizado, com duração mínima de 30 dias.",
    baseLegal: "CF/88, Art. 7º, XXI e CLT, Art. 487"
  },
  
  ferias_vencidas: {
    titulo: "Férias Vencidas",
    explicacao: "Férias já adquiridas (período aquisitivo completo) mas ainda não gozadas pelo trabalhador.",
    baseLegal: "CLT, Art. 129 e 130"
  },
  
  dependentes: {
    titulo: "Dependentes",
    explicacao: "Filhos menores de 14 anos ou inválidos de qualquer idade. Geram dedução no IRRF e podem dar direito ao salário-família.",
    baseLegal: "Lei 8.213/91, Art. 65 e Lei 11.482/07"
  },
  
  dias_ferias: {
    titulo: "Dias de Férias",
    explicacao: "Quantidade de dias de férias a serem gozados. O trabalhador tem direito a 30 dias após 12 meses de trabalho.",
    baseLegal: "CF/88, Art. 7º, XVII e CLT, Art. 130"
  },
  
  faltas_injustificadas: {
    titulo: "Faltas Injustificadas",
    explicacao: "Faltas ao trabalho sem justificativa legal. Reduzem o período de férias conforme tabela da CLT.",
    baseLegal: "CLT, Art. 130"
  },
  
  abono_pecuniario: {
    titulo: "Abono Pecuniário",
    explicacao: "Conversão de até 1/3 das férias em dinheiro. É um direito do empregado, não sofre descontos de INSS e IRRF.",
    baseLegal: "CLT, Art. 143"
  },
  
  outros_descontos: {
    titulo: "Outros Descontos",
    explicacao: "Descontos adicionais como vale-transporte, vale-refeição, plano de saúde, empréstimos consignados, etc.",
    baseLegal: "CLT, Art. 462"
  },
  
  meses_trabalhados: {
    titulo: "Meses Trabalhados",
    explicacao: "Quantidade de meses trabalhados no ano para cálculo proporcional do 13º salário. Fração igual ou superior a 15 dias conta como mês completo.",
    baseLegal: "Lei 4.090/62, Art. 1º"
  },
  
  // Verbas rescisórias
  saldo_salario: {
    titulo: "Saldo de Salário",
    explicacao: "Valor proporcional aos dias trabalhados no mês da rescisão.",
    baseLegal: "CLT, Art. 462"
  },
  
  aviso_previo_indenizado: {
    titulo: "Aviso Prévio Indenizado",
    explicacao: "Indenização equivalente ao período de aviso prévio quando não trabalhado. Não sofre descontos de INSS e IRRF.",
    baseLegal: "CLT, Art. 487, §1º"
  },
  
  decimo_terceiro: {
    titulo: "13º Salário",
    explicacao: "Gratificação natalina paga em duas parcelas. A primeira até novembro, a segunda até 20 de dezembro.",
    baseLegal: "CF/88, Art. 7º, VIII e Lei 4.090/62"
  },
  
  ferias_proporcionais: {
    titulo: "Férias Proporcionais",
    explicacao: "Valor proporcional das férias referente ao período aquisitivo incompleto.",
    baseLegal: "CLT, Art. 146"
  },
  
  terco_ferias: {
    titulo: "1/3 de Férias",
    explicacao: "Adicional constitucional de um terço sobre o valor das férias.",
    baseLegal: "CF/88, Art. 7º, XVII"
  },
  
  multa_fgts: {
    titulo: "Multa FGTS",
    explicacao: "Multa de 40% sobre os depósitos do FGTS em caso de dispensa sem justa causa, ou 20% no acordo.",
    baseLegal: "Lei 8.036/90, Art. 18"
  },
  
  // Descontos
  inss: {
    titulo: "INSS",
    explicacao: "Contribuição previdenciária calculada de forma progressiva sobre a remuneração, limitada ao teto.",
    baseLegal: "Lei 8.212/91, Art. 28"
  },
  
  irrf: {
    titulo: "IRRF",
    explicacao: "Imposto de Renda Retido na Fonte, calculado de forma progressiva com dedução por dependente.",
    baseLegal: "Lei 7.713/88"
  },
  
  salario_familia: {
    titulo: "Salário-Família",
    explicacao: "Benefício pago aos segurados com remuneração até o limite estabelecido, por filho menor de 14 anos.",
    baseLegal: "Lei 8.213/91, Art. 65"
  }
};

// Congelar o objeto para evitar modificações acidentais
Object.freeze(BASE_LEGAL);

export default BASE_LEGAL;