import { summarize } from './test-runner.js';
import { runUnitTests } from './unit.spec.js';
import { runE2ETests } from './e2e.spec.js';

// This is the main entry point for running all tests.
async function runAllTests() {
    console.log('Running all test suites...');

    // Run all logic/unit tests
    await runUnitTests();

    // Run all UI/E2E tests
    await runE2ETests();

    // Finally, summarize all results and render them to the DOM.
    summarize();
}

// Execute the test runner.
runAllTests();
