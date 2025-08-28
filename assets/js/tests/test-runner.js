// A simple, dependency-free test runner for Vanilla JS projects to avoid external libraries.
// It supports describe/it syntax and provides console and basic DOM reporting.

const testSuites = [];
let currentSuite;

/**
 * Groups tests into a suite. Logs the suite name to the console.
 * @param {string} name - The name of the test suite.
 * @param {Function} callback - The function that contains the individual tests (`it` blocks).
 */
export async function describe(name, callback) {
    console.group(`%cSuite: ${name}`, 'font-weight: bold; font-size: 1.1em;');
    currentSuite = { name, passed: 0, failed: 0, tests: [] };
    testSuites.push(currentSuite);
    await callback();
    console.groupEnd();
}

/**
 * Defines an individual test case.
 * @param {string} name - The description of the test.
 * @param {Function} callback - The async function that contains the test logic and assertions.
 */
export async function it(name, callback) {
    const test = { name };
    try {
        await callback();
        test.passed = true;
        currentSuite.passed++;
        console.log(`%c  ✓ ${name}`, 'color: green;');
    } catch (e) {
        test.passed = false;
        test.error = e;
        currentSuite.failed++;
        console.error(`%c  ✗ ${name}`, 'color: red;');
        console.error(e);
    }
    currentSuite.tests.push(test);
}

/**
 * A simple assertion handler. Example: expect(2).toBe(2);
 * @param {*} actual - The actual value produced by the code under test.
 * @returns {object} - An object with assertion methods.
 */
export function expect(actual) {
    const inverted = {};
    const assertions = {
        toBe(expected) {
            if (Object.is(actual, expected)) return;
            throw new Error(`Assertion failed: expected ${actual} to be ${expected}`);
        },
        toContain(expectedSubstring) {
            if (typeof actual === 'string' && actual.includes(expectedSubstring)) return;
            throw new Error(`Assertion failed: expected "${actual}" to contain "${expectedSubstring}"`);
        },
        toBeTruthy() {
            if (!!actual) return;
            throw new Error(`Assertion failed: expected ${actual} to be truthy`);
        },
        toBeFalsy() {
            if (!actual) return;
            throw new Error(`Assertion failed: expected ${actual} to be falsy`);
        },
        toBeDefined() {
            if (typeof actual !== 'undefined') return;
            throw new Error(`Assertion failed: expected ${actual} to be defined`);
        }
    };

    // Create a 'not' property for inverted assertions
    inverted.not = {};
    for (const key in assertions) {
        inverted.not[key] = (...args) => {
            try {
                assertions[key](...args);
            } catch (e) {
                // Test failed as expected for a .not assertion, so we return successfully.
                return;
            }
            // If the assertion passed, the .not assertion should fail.
            throw new Error(`Negative assertion failed: ${key} passed when it should have failed.`);
        };
    }
    return { ...assertions, ...inverted };
}

/**
 * Summarizes all test results and renders them to the console and the DOM.
 * Should be called after all `describe` blocks have finished.
 */
export function summarize() {
    let totalPassed = 0;
    let totalFailed = 0;

    console.log('\\n%c--- Test Summary ---', 'font-weight: bold; font-size: 1.2em;');

    testSuites.forEach(suite => {
        totalPassed += suite.passed;
        totalFailed += suite.failed;
    });

    const totalTests = totalPassed + totalFailed;
    const color = totalFailed > 0 ? 'red' : 'green';

    console.log(`%c${totalPassed} passed, %c${totalFailed} failed`, `color: green`, `color: red`);
    console.log(`Total tests: ${totalTests}`);
    console.log('%c--------------------', 'font-weight: bold; font-size: 1.2em;');

    // Render results to the DOM if a container element exists
    const resultsEl = document.getElementById('test-results');
    if (resultsEl) {
        let html = `<h1>Test Results</h1>`;
        html += `<p style="font-weight:bold; color:${color};">${totalPassed} passed, ${totalFailed} failed</p><hr>`;

        testSuites.forEach(suite => {
            html += `<h2>${suite.name} (${suite.passed}/${suite.passed + suite.failed})</h2><ul>`;
            suite.tests.forEach(test => {
                html += `<li style="color: ${test.passed ? 'green' : 'red'};">
                    ${test.passed ? '✓' : '✗'} ${test.name}
                    ${test.error ? `<br><pre style="margin-left: 20px; color: #555; white-space: pre-wrap;">${test.error.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>` : ''}
                </li>`;
            });
            html += `</ul>`;
        });
        resultsEl.innerHTML = html;
    }

    // Send results to our test server
    fetch('http://localhost:4568/test-results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testSuites, (key, value) => {
            // A custom replacer to handle circular references and errors
            if (value instanceof Error) {
                return {
                    message: value.message,
                    stack: value.stack,
                };
            }
            return value;
        }),
    }).catch(err => console.error('Error sending test results to server:', err));
}
