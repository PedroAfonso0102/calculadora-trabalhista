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
 * Parses a currency string (e.g., "R$ 1.234,56" or "1,234.56") and returns a number.
 * Uses a defensive approach that works with different currency formats by considering
 * only digits and treating the last two digits as cents. This is more resilient to 
 * different input formats and prevents errors from corrupted or unexpected data.
 * Returns 0 for empty or invalid strings (for calculations).
 * @param {string} value - The currency string to unmask.
 * @returns {number} - The parsed number (e.g., 1234.56) or 0 for empty fields.
 */
export function unmaskCurrency(value) {
    if (typeof value !== 'string' || !value || value.trim() === '') return 0;

    // 1. Keep only digits - this is resilient to any format (BR, US, etc.)
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly === '') return 0;

    // 2. Convert to number, considering the last two digits as cents
    const number = parseFloat(digitsOnly) / 100;

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
 * A pure function that takes a string and formats it as BRL currency for input masking.
 * This function is specifically designed for real-time input masking and leaves empty fields blank.
 * It's easily testable and provides a smooth user experience for currency input fields.
 * @param {string} value - The raw string value from an input.
 * @returns {string} - The formatted currency string or empty string.
 */
export function formatCurrencyFromInput(value) {
    if (typeof value !== 'string' || !value || value.trim() === '') return '';
    
    // Keep only digits
    let numStr = value.replace(/\D/g, '');
    if (numStr === '' || numStr === '0') return '';

    // Remove leading zeros
    numStr = numStr.replace(/^0+/, '');
    if (numStr === '') return '';

    // Pad with zeros if necessary to ensure at least 3 digits for cents
    while (numStr.length < 3) {
        numStr = '0' + numStr;
    }

    // Insert decimal point
    let formatted = numStr.slice(0, -2) + '.' + numStr.slice(-2);

    const number = parseFloat(formatted);

    return isNaN(number) || number === 0 ? '' : number.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}


/**
 * Initializes a real-time currency mask for an input field by attaching event listeners.
 * This function sets up the necessary event handlers for currency input formatting,
 * including input, focus, and paste events to provide a smooth user experience.
 * Also improves UX by selecting all text on focus for easy replacement.
 * @param {HTMLInputElement} inputElement - The input element to apply the mask to.
 */
export function initializeCurrencyMask(inputElement) {
    // Apply mask on input
    inputElement.addEventListener('input', (e) => {
        e.target.value = formatCurrencyFromInput(e.target.value);
    });
    
    // Select all text on focus for easy replacement
    inputElement.addEventListener('focus', (e) => {
        // Use setTimeout to ensure selection happens after focus
        setTimeout(() => {
            e.target.select();
        }, 0);
    });
    
    // Handle paste events
    inputElement.addEventListener('paste', (e) => {
        setTimeout(() => {
            e.target.value = formatCurrencyFromInput(e.target.value);
        }, 0);
    });
}
