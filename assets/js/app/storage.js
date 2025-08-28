/**
 * Storage Module - Centralized localStorage Operations
 * 
 * This module centralizes all localStorage operations to improve code cohesion
 * and make storage management easier to maintain and debug.
 */

/**
 * Storage keys used throughout the application
 */
export const STORAGE_KEYS = {
    APP_STATE: 'appState',
    SAVE_PREFERENCE: 'savePreference',
    VISIBLE_CALCULATORS: 'visibleCalculators',
    SIDEBAR_STATE: 'sidebar-state'
};

/**
 * Safely gets an item from localStorage with JSON parsing support
 * @param {string} key - The localStorage key
 * @param {*} defaultValue - Default value to return if key doesn't exist or parsing fails
 * @param {boolean} parseJson - Whether to parse as JSON (default: true)
 * @returns {*} The parsed value or default value
 */
export function getStorageItem(key, defaultValue = null, parseJson = true) {
    try {
        const item = localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        
        // If parseJson is false, return raw string
        if (!parseJson) {
            return item;
        }
        
        // Try to parse as JSON, but handle simple strings gracefully
        try {
            return JSON.parse(item);
        } catch (parseError) {
            // If JSON parsing fails but we have a non-null value, return it as string
            // This handles cases where localStorage contains simple strings like "expanded"
            return item;
        }
    } catch (error) {
        console.error(`Failed to get localStorage item "${key}":`, error);
        return defaultValue;
    }
}

/**
 * Safely sets an item in localStorage with JSON stringification
 * @param {string} key - The localStorage key
 * @param {*} value - The value to store
 * @param {boolean} stringifyJson - Whether to stringify as JSON (default: true)
 * @returns {boolean} True if successful, false otherwise
 */
export function setStorageItem(key, value, stringifyJson = true) {
    try {
        if (stringifyJson) {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.setItem(key, value);
        }
        return true;
    } catch (error) {
        console.error(`Failed to set localStorage item "${key}":`, error);
        return false;
    }
}

/**
 * Safely removes an item from localStorage
 * @param {string} key - The localStorage key to remove
 * @returns {boolean} True if successful, false otherwise
 */
export function removeStorageItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Failed to remove localStorage item "${key}":`, error);
        return false;
    }
}

/**
 * Removes multiple items from localStorage
 * @param {string[]} keys - Array of localStorage keys to remove
 * @returns {boolean} True if all operations successful, false otherwise
 */
export function removeStorageItems(keys) {
    try {
        keys.forEach(key => localStorage.removeItem(key));
        return true;
    } catch (error) {
        console.error('Failed to remove multiple localStorage items:', error);
        return false;
    }
}

/**
 * Gets the saved state from localStorage
 * @returns {Object|null} The saved state object or null if not found/invalid
 */
export function getSavedState() {
    return getStorageItem(STORAGE_KEYS.APP_STATE, null);
}

/**
 * Saves the application state to localStorage
 * @param {Object} stateToSave - The state object to save
 * @returns {boolean} True if successful, false otherwise
 */
export function saveState(stateToSave) {
    return setStorageItem(STORAGE_KEYS.APP_STATE, stateToSave);
}

/**
 * Gets the save preference setting
 * @returns {boolean} True if user wants to save data, false otherwise
 */
export function getSavePreference() {
    const preference = getStorageItem(STORAGE_KEYS.SAVE_PREFERENCE, false, false);
    return preference === 'true' || preference === true;
}

/**
 * Sets the save preference setting
 * @param {boolean} enabled - Whether to enable save preference
 * @returns {boolean} True if successful, false otherwise
 */
export function setSavePreference(enabled) {
    return setStorageItem(STORAGE_KEYS.SAVE_PREFERENCE, enabled.toString(), false);
}

/**
 * Gets the visible calculators list
 * @returns {string[]} Array of visible calculator names
 */
export function getVisibleCalculators() {
    const defaultCalculators = [
        'ferias', 'rescisao', 'decimoTerceiro', 'salarioLiquido', 'fgts',
        'pisPasep', 'seguroDesemprego', 'horasExtras', 'inss', 'valeTransporte', 'irpf'
    ];
    
    const stored = getStorageItem(STORAGE_KEYS.VISIBLE_CALCULATORS, null);
    
    // Basic validation
    if (Array.isArray(stored) && stored.length > 0) {
        return stored;
    }
    
    return defaultCalculators;
}

/**
 * Sets the visible calculators list
 * @param {string[]} calculators - Array of calculator names to make visible
 * @returns {boolean} True if successful, false otherwise
 */
export function setVisibleCalculators(calculators) {
    return setStorageItem(STORAGE_KEYS.VISIBLE_CALCULATORS, calculators);
}

/**
 * Gets the sidebar state
 * @returns {string} The sidebar state ('expanded', 'collapsed', 'hidden')
 */
export function getSidebarState() {
    return getStorageItem(STORAGE_KEYS.SIDEBAR_STATE, 'expanded', false);
}

/**
 * Sets the sidebar state
 * @param {string} state - The sidebar state to save
 * @returns {boolean} True if successful, false otherwise
 */
export function setSidebarState(state) {
    return setStorageItem(STORAGE_KEYS.SIDEBAR_STATE, state, false);
}

/**
 * Clears only form data from localStorage, preserving user preferences
 * @returns {boolean} True if successful, false otherwise
 */
export function clearFormData() {
    return removeStorageItem(STORAGE_KEYS.APP_STATE);
}

/**
 * Clears all application data from localStorage
 * @returns {boolean} True if successful, false otherwise
 */
export function clearAllData() {
    const keys = Object.values(STORAGE_KEYS);
    return removeStorageItems(keys);
}
