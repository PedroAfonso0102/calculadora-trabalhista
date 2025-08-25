// The single source of truth for the entire application.
const initialState = {
    ferias: {
        salarioBruto: 0,
        diasFerias: 30,
        dependentes: 0,
        mediaHorasExtras: 0,
        mediaAdicionalNoturno: 0,
        periculosidade: false,
        insalubridadeGrau: '0',
        insalubridadeBase: 'salario_minimo',
        abonoPecuniario: false,
        adiantarDecimo: false,
        errors: {}
    },
    rescisao: {
        motivo: 'sem_justa_causa',
        dataAdmissao: '',
        dataDemissao: '',
        salarioBruto: 0,
        saldoFgts: 0,
        avisoPrevio: 'indenizado',
        dependentes: 0,
        mediaHorasExtras: 0,
        mediaAdicionalNoturno: 0,
        periculosidade: false,
        insalubridadeGrau: '0',
        insalubridadeBase: 'salario_minimo',
        feriasVencidas: false,
        descontoVt: 0,
        descontoVr: 0,
        descontoSaude: 0,
        descontoAdiantamentos: 0,
        errors: {}
    },
    decimoTerceiro: {
        salarioBruto: 0,
        mesesTrabalhados: 12,
        dependentes: 0,
        adiantamentoRecebido: 0,
        mediaHorasExtras: 0,
        mediaAdicionalNoturno: 0,
        periculosidade: false,
        insalubridadeGrau: '0',
        insalubridadeBase: 'salario_minimo',
        errors: {}
    },
    salarioLiquido: {
        salarioBruto: 0,
        horasExtras: 0,
        dependentes: 0,
        periculosidade: false,
        insalubridadeGrau: '0',
        insalubridadeBase: 'salario_minimo',
        horasNoturnas: 0,
        cargaHorariaMensal: 220,
        descontoVt: 0,
        descontoVr: 0,
        descontoSaude: 0,
        descontoAdiantamentos: 0,
        recebeSalarioFamilia: false,
        filhosSalarioFamilia: 0,
        errors: {}
    }
};

const state = {
    activeTab: 'ferias',
    ...JSON.parse(JSON.stringify(initialState)), // Deep copy to prevent mutation
    results: {}
};

/**
 * Updates a value in the application state.
 * @param {string} path - The path to the value to update, e.g., "ferias.salarioBruto"
 * @param {*} value - The new value.
 */
function updateState(path, value) {
    const keys = path.split('.');
    let current = state;
    while (keys.length > 1) {
        current = current[keys.shift()];
    }
    current[keys[0]] = value;
}

// Export the state, the update function, and the initial state so other modules can use them.
export { state, updateState, initialState };
