// The single source of truth for the entire application.

import { BASES_DE_CALCULO } from './config.js';
import { getVisibleCalculators } from './storage.js';

/**
 * Base objects for common calculator fields following DRY principle
 */

// Base fields shared by most calculators
const baseCalculatorState = {
    salarioBruto: 0,
    dependentes: 0,
    periculosidade: false,
    insalubridadeGrau: '0',
    insalubridadeBase: BASES_DE_CALCULO.SALARIO_MINIMO,
    errors: {}
};

// Extended base for calculators that include overtime and night shift
const extendedCalculatorState = {
    ...baseCalculatorState,
    mediaHorasExtras: 0,
    mediaAdicionalNoturno: 0
};

// Base for calculators with common discount fields
const discountCalculatorState = {
    descontoVt: 0,
    descontoVr: 0,
    descontoSaude: 0,
    descontoAdiantamentos: 0
};

const initialState = {
    ferias: {
        ...extendedCalculatorState,
        diasFerias: 30,
        abonoPecuniario: false,
        adiantarDecimo: false
    },
    rescisao: {
        ...extendedCalculatorState,
        ...discountCalculatorState,
        motivo: 'sem_justa_causa',
        dataAdmissao: '',
        dataDemissao: '',
        saldoFgts: 0,
        avisoPrevio: 'indenizado',
        feriasVencidas: false
    },
    decimoTerceiro: {
        ...extendedCalculatorState,
        mesesTrabalhados: 12,
        adiantamentoRecebido: 0
    },
    salarioLiquido: {
        ...baseCalculatorState,
        ...discountCalculatorState,
        horasExtras: 0,
        horasNoturnas: 0,
        cargaHorariaMensal: 220,
        recebeSalarioFamilia: false,
        filhosSalarioFamilia: 0
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
    visibleCalculators: getVisibleCalculators(),
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
