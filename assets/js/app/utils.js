/**
 * Utility Functions
 *
 * This file contains shared helper functions that can be used across the application.
 */

/**
 * Formats a number as a Brazilian Real currency string.
 * @param {number} value - The number to format.
 * @returns {string} - The formatted currency string (e.g., "R$ 1.234,56").
 */
export function formatCurrency(value) {
    if (typeof value !== 'number') {
        value = 0;
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Parses a currency string (e.g., "R$ 1.234,56") and returns a number.
 * @param {string} value - The currency string to unmask.
 * @returns {number} - The parsed number (e.g., 1234.56).
 */
export function unmaskCurrency(value) {
    if (typeof value !== 'string' || !value) return 0;
    // Remove 'R$', thousands separators '.', and replace decimal ',' with '.'
    const numericString = value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const number = parseFloat(numericString);
    return isNaN(number) ? 0 : number;
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after `wait` milliseconds have elapsed since the last time the
 * debounced function was invoked.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {Function} - The new debounced function.
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * A pure function that takes a string and formats it as BRL currency.
 * This function is easily testable.
 * @param {string} value - The raw string value from an input.
 * @returns {string} - The formatted currency string.
 */
export function formatAsCurrency(value) {
    if (typeof value !== 'string' || !value) return '';
    // Keep only digits
    let numStr = value.replace(/\D/g, '');
    if (numStr === '') return '';

    // Remove leading zeros
    numStr = numStr.replace(/^0+/, '');

    // Pad with zeros if necessary to ensure at least 3 digits for cents
    while (numStr.length < 3) {
        numStr = '0' + numStr;
    }

    // Insert decimal point
    let formatted = numStr.slice(0, -2) + '.' + numStr.slice(-2);

    const number = parseFloat(formatted);

    return isNaN(number) ? '' : number.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}


/**
 * Applies a real-time currency mask to an input field by attaching an event listener.
 * @param {HTMLInputElement} inputElement - The input element to apply the mask to.
 */
export function applyCurrencyMask(inputElement) {
    inputElement.addEventListener('input', (e) => {
        e.target.value = formatAsCurrency(e.target.value);
    });
}
