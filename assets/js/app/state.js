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
    errors: {},
    touched: {}
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
        errors: {},
        touched: {}
    },
    pisPasep: {
        salarioMedio: 0,
        mesesTrabalhados: 0,
        dataInscricao: '',
        errors: {},
        touched: {}
    },
    seguroDesemprego: {
        salario1: 0,
        salario2: 0,
        salario3: 0,
        mesesTrabalhados: 0,
        numSolicitacoes: 0,
        errors: {},
        touched: {}
    },
    horasExtras: {
        salarioBase: 0,
        horasContratuais: 220,
        horasExtras50: 0,
        horasExtras100: 0,
        horasNoturnas: 0,
        errors: {},
        touched: {}
    },
    inss: {
        salarioBruto: 0,
        errors: {},
        touched: {}
    },
    valeTransporte: {
        salarioBruto: 0,
        custoDiario: 0,
        diasTrabalho: 22,
        errors: {},
        touched: {}
    },
    irpf: {
        rendaAnual: 0,
        dependentes: 0,
        outrasDeducoes: 0,
        impostoRetido: 0,
        errors: {},
        touched: {}
    }
};

const state = {
    activeTab: 'ferias',
    visibleCalculators: getVisibleCalculators(),
    ...JSON.parse(JSON.stringify(initialState)), // Deep copy to prevent mutation
    results: {}
};

/**
 * Updates a value in the application state and optionally its validation error.
 * Also handles business logic related to state changes (e.g., insalubridade/periculosidade interlock).
 * @param {string} path - The path to the value to update, e.g., "ferias.salarioBruto"
 * @param {*} value - The new value.
 * @param {string | null} [errorMessage=null] - The error message for the field, or null to clear it.
 */
function updateState(path, value, errorMessage = null) {
    const keys = path.split('.');
    const [calculatorName, fieldName] = path.split('.');

    let current = state;
    while (keys.length > 1) {
        current = current[keys.shift()];
    }
    current[keys[0]] = value;

    // Handle interlock between insalubridade and periculosidade
    const calculatorState = state[calculatorName];
    if (calculatorState) {
        if (fieldName === 'periculosidade' && value === true) {
            if (calculatorState.insalubridadeGrau && calculatorState.insalubridadeGrau !== '0') {
                calculatorState.insalubridadeGrau = '0';
            }
        }
        if (fieldName === 'insalubridadeGrau' && value !== '0') {
            if (calculatorState.periculosidade === true) {
                calculatorState.periculosidade = false;
            }
        }

        // Reset filhosSalarioFamilia if recebeSalarioFamilia is set to false
        if (path === 'salarioLiquido.recebeSalarioFamilia' && value === false) {
            if (calculatorState.filhosSalarioFamilia !== 0) {
                calculatorState.filhosSalarioFamilia = 0;
            }
        }

        // Mark the field as touched for validation feedback
        if (typeof calculatorState.touched === 'object') {
            calculatorState.touched[fieldName] = true;
        }
    }

    // Update the error state for the field
    if (calculatorState && typeof calculatorState.errors === 'object') {
        if (errorMessage) {
            calculatorState.errors[fieldName] = errorMessage;
        } else {
            // Clear the error if the new value is valid
            delete calculatorState.errors[fieldName];
        }
    }
}

// Export the state, the update function, and the initial state so other modules can use them.
export { state, updateState, initialState };
