/**
 * Unit Tests for Utils Functions
 * 
 * This file contains comprehensive tests for all utility functions in utils.js.
 * It validates behavior with valid inputs, invalid inputs, edge cases, and different formats.
 */

import { 
    formatCurrency, 
    unmaskCurrency, 
    formatCurrencyFromInput, 
    debounce 
} from '../app/utils.js';

/**
 * Test suite for formatCurrency function
 */
export const formatCurrencyTests = async () => {
    console.log('Running formatCurrency tests...');
    
    // Test valid number formatting
    const result1 = formatCurrency(1234.56);
    console.assert(result1 === 'R$ 1.234,56', `Expected 'R$ 1.234,56', got '${result1}'`);
    
    // Test zero
    const result2 = formatCurrency(0);
    console.assert(result2 === 'R$ 0,00', `Expected 'R$ 0,00', got '${result2}'`);
    
    // Test negative number
    const result3 = formatCurrency(-500.75);
    console.assert(result3.includes('-') && result3.includes('500,75'), `Expected negative formatted value, got '${result3}'`);
    
    // Test large number
    const result4 = formatCurrency(1000000.99);
    console.assert(result4 === 'R$ 1.000.000,99', `Expected 'R$ 1.000.000,99', got '${result4}'`);
    
    // Test invalid input (non-number)
    const result5 = formatCurrency('invalid');
    console.assert(result5 === 'R$ 0,00', `Expected 'R$ 0,00' for invalid input, got '${result5}'`);
    
    // Test null/undefined
    const result6 = formatCurrency(null);
    console.assert(result6 === 'R$ 0,00', `Expected 'R$ 0,00' for null, got '${result6}'`);
    
    console.log('✓ formatCurrency tests passed');
};

/**
 * Test suite for unmaskCurrency function (improved version)
 */
export const unmaskCurrencyTests = async () => {
    console.log('Running unmaskCurrency tests...');
    
    // Test standard BR format
    const result1 = unmaskCurrency('R$ 1.234,56');
    console.assert(result1 === 1234.56, `Expected 1234.56, got ${result1}`);
    
    // Test US format (should work with new implementation)
    const result2 = unmaskCurrency('1,234.56');
    console.assert(result2 === 1234.56, `Expected 1234.56 from US format, got ${result2}`);
    
    // Test only numbers
    const result3 = unmaskCurrency('123456');
    console.assert(result3 === 1234.56, `Expected 1234.56 from digits only, got ${result3}`);
    
    // Test mixed format
    const result4 = unmaskCurrency('R$ 1.000.000,99');
    console.assert(result4 === 1000000.99, `Expected 1000000.99, got ${result4}`);
    
    // Test edge cases
    const result5 = unmaskCurrency('');
    console.assert(result5 === 0, `Expected 0 for empty string, got ${result5}`);
    
    const result6 = unmaskCurrency('abc');
    console.assert(result6 === 0, `Expected 0 for non-numeric string, got ${result6}`);
    
    const result7 = unmaskCurrency(null);
    console.assert(result7 === 0, `Expected 0 for null, got ${result7}`);
    
    // Test small values
    const result8 = unmaskCurrency('R$ 0,01');
    console.assert(result8 === 0.01, `Expected 0.01, got ${result8}`);
    
    // Test corrupted data formats
    const result9 = unmaskCurrency('R$1.000,00extra');
    console.assert(result9 === 1000.00, `Expected 1000.00 from corrupted format, got ${result9}`);
    
    console.log('✓ unmaskCurrency tests passed');
};

/**
 * Test suite for formatCurrencyFromInput function
 */
export const formatCurrencyFromInputTests = async () => {
    console.log('Running formatCurrencyFromInput tests...');
    
    // Test basic formatting
    const result1 = formatCurrencyFromInput('123456');
    console.assert(result1 === 'R$ 1.234,56', `Expected 'R$ 1.234,56', got '${result1}'`);
    
    // Test with non-numeric characters
    const result2 = formatCurrencyFromInput('R$ 500a,25b');
    console.assert(result2 === 'R$ 500,25', `Expected 'R$ 500,25', got '${result2}'`);
    
    // Test values with less than 3 digits
    const result3 = formatCurrencyFromInput('12');
    console.assert(result3 === 'R$ 0,12', `Expected 'R$ 0,12', got '${result3}'`);
    
    const result4 = formatCurrencyFromInput('5');
    console.assert(result4 === 'R$ 0,05', `Expected 'R$ 0,05', got '${result4}'`);
    
    // Test empty input
    const result5 = formatCurrencyFromInput('');
    console.assert(result5 === '', `Expected empty string, got '${result5}'`);
    
    // Test zero
    const result6 = formatCurrencyFromInput('0');
    console.assert(result6 === '', `Expected empty string for zero, got '${result6}'`);
    
    // Test leading zeros
    const result7 = formatCurrencyFromInput('00123');
    console.assert(result7 === 'R$ 1,23', `Expected 'R$ 1,23', got '${result7}'`);
    
    // Test invalid types
    const result8 = formatCurrencyFromInput(null);
    console.assert(result8 === '', `Expected empty string for null, got '${result8}'`);
    
    console.log('✓ formatCurrencyFromInput tests passed');
};

/**
 * Test suite for debounce function
 */
export const debounceTests = async () => {
    console.log('Running debounce tests...');
    
    let callCount = 0;
    const testFunction = () => {
        callCount++;
    };
    
    const debouncedFunction = debounce(testFunction, 100);
    
    // Call multiple times quickly
    debouncedFunction();
    debouncedFunction();
    debouncedFunction();
    
    // Should not have executed yet
    console.assert(callCount === 0, `Expected 0 calls immediately, got ${callCount}`);
    
    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should have executed once
    console.assert(callCount === 1, `Expected 1 call after delay, got ${callCount}`);
    
    console.log('✓ debounce tests passed');
};

/**
 * Integration tests for edge cases and real-world scenarios
 */
export const integrationTests = async () => {
    console.log('Running integration tests...');
    
    // Test round-trip: format -> unmask -> format
    const originalValue = 1234.56;
    const formatted = formatCurrency(originalValue);
    const unmasked = unmaskCurrency(formatted);
    console.assert(unmasked === originalValue, `Round-trip failed: ${originalValue} -> ${formatted} -> ${unmasked}`);
    
    // Test input formatting with immediate unmasking
    const inputValue = '123456';
    const inputFormatted = formatCurrencyFromInput(inputValue);
    const inputUnmasked = unmaskCurrency(inputFormatted);
    console.assert(inputUnmasked === 1234.56, `Input round-trip failed: ${inputValue} -> ${inputFormatted} -> ${inputUnmasked}`);
    
    // Test different currency formats resilience
    const formats = [
        'R$ 1.234,56',
        '1,234.56',
        '1234.56',
        '123456',
        'R$1234,56',
        '$1,234.56'
    ];
    
    formats.forEach(format => {
        const result = unmaskCurrency(format);
        console.assert(result === 1234.56, `Format '${format}' failed, got ${result}`);
    });
    
    console.log('✓ Integration tests passed');
};

/**
 * Run all tests
 */
export const runAllUtilsTests = async () => {
    console.log('🧪 Starting Utils Test Suite...');
    
    try {
        await formatCurrencyTests();
        await unmaskCurrencyTests();
        await formatCurrencyFromInputTests();
        await debounceTests();
        await integrationTests();
        
        console.log('✅ All utils tests passed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Utils tests failed:', error);
        return false;
    }
};

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', () => {
        runAllUtilsTests();
    });
} else if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    runAllUtilsTests();
}
