// The single source of truth for the entire application.

function getInitialVisibleCalculators() {
    try {
        const stored = localStorage.getItem('visibleCalculators');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Basic validation
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Failed to parse visibleCalculators from localStorage", e);
    }
    // Default if nothing is stored or if parsing fails
    return [
        'ferias', 'rescisao', 'decimoTerceiro', 'salarioLiquido', 'fgts',
        'pisPasep', 'seguroDesemprego', 'horasExtras', 'inss', 'valeTransporte', 'irpf'
    ];
}

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
    },
    fgts: {
        salarioBruto: 0,
        saldoTotal: 0,
        opcaoSaque: 'rescisao',
        errors: {}
    },
    pisPasep: {
        salarioMedio: 0,
        mesesTrabalhados: 0,
        dataInscricao: '',
        errors: {}
    },
    seguroDesemprego: {
        salario1: 0,
        salario2: 0,
        salario3: 0,
        mesesTrabalhados: 0,
        numSolicitacoes: 0,
        errors: {}
    },
    horasExtras: {
        salarioBase: 0,
        horasContratuais: 220,
        horasExtras50: 0,
        horasExtras100: 0,
        horasNoturnas: 0,
        errors: {}
    },
    inss: {
        salarioBruto: 0,
        errors: {}
    },
    valeTransporte: {
        salarioBruto: 0,
        custoDiario: 0,
        diasTrabalho: 22,
        errors: {}
    },
    irpf: {
        rendaAnual: 0,
        dependentes: 0,
        outrasDeducoes: 0,
        impostoRetido: 0,
        errors: {}
    }
};

const state = {
    activeTab: 'ferias',
    visibleCalculators: getInitialVisibleCalculators(),
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
