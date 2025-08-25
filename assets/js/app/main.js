/**
 * Main application entry point.
 * This file is responsible for initializing the application modules.
 */

import { initializeEventListeners } from './events.js';
import { render } from './ui.js';
import { updateState } from './state.js';

async function initializeApp() {
    console.log("Application initializing...");
    try {
        // Load saved data from localStorage first
        const savedStateJSON = localStorage.getItem('appState');
        const savePreference = localStorage.getItem('savePreference') === 'true';

        if (savePreference && savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            // Iterate over calculators and update their state
            Object.keys(savedState).forEach(calculatorKey => {
                if (savedState[calculatorKey]) {
                    updateState(calculatorKey, savedState[calculatorKey], false);
                }
            });
            console.log("Loaded saved state from localStorage.");
        }
        if (savePreference) {
            const checkbox = document.getElementById('save-data-checkbox');
            if(checkbox) checkbox.checked = true;
        }

        // Fetch external data required by the application
        const response = await fetch('data/legal_texts.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const legalTexts = await response.json();

        // Store the fetched data in the application state
        updateState('legalTexts', legalTexts, false); // No re-render yet

        // Attach all event listeners to the DOM
        initializeEventListeners();

        // Perform the initial render to display the default UI state
        render();

        console.log("Application ready.");
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        // Optionally, display a user-friendly error message in the UI
    }
}


// Wait for the DOM to be fully loaded before initializing the app
document.addEventListener('DOMContentLoaded', initializeApp);
